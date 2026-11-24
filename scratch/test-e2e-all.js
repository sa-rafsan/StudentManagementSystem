// E2E Verification Script for Student Management System Extended Features
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock localStorage and window
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

global.sessionStorage = {
  getItem: (key) => storageMap.get(key) || null,
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear()
};

global.window = {
  location: { pathname: '/test', href: '', search: '' },
  crypto: {
    getRandomValues: (buf) => crypto.randomFillSync(buf),
    subtle: crypto.webcrypto.subtle
  }
};
global.SMS = {};

// Load modules in order
require(path.join(__dirname, '../js/utils.js'));
require(path.join(__dirname, '../js/storage.js'));
require(path.join(__dirname, '../js/auth.js'));
require(path.join(__dirname, '../js/course-service.js'));
require(path.join(__dirname, '../js/assessment-service.js'));

async function runTests() {
  console.log('--- Initializing Storage ---');
  SMS.Storage.initStorage();

  const errors = [];
  function assert(condition, message) {
    if (!condition) {
      errors.push('FAIL: ' + message);
      console.error('FAIL: ' + message);
    } else {
      console.log('PASS: ' + message);
    }
  }

  // 1. Structure Verification: 4 Courses per Semester & 12 Weeks per Course
  console.log('\n--- Test 1: Semesters and Courses Structure ---');
  const semesters = SMS.CourseService.getAllSemesters();
  assert(semesters.length >= 2, 'At least 2 semesters configured');
  semesters.forEach(s => {
    const courses = SMS.CourseService.getCoursesBySemester(s.id);
    assert(courses.length === 4, `Semester ${s.name} (${s.id}) contains exactly 4 courses (Found: ${courses.length})`);
  });

  const allCourses = SMS.CourseService.getAllCourses();
  assert(allCourses.length === 8, 'Total 8 courses across 2 semesters');
  allCourses.forEach(c => {
    const weeks = SMS.CourseService.getWeeksByCourse(c.id);
    assert(weeks.length === 12, `Course ${c.code} (${c.id}) has exactly 12 weeks (Found: ${weeks.length})`);
  });

  // 2. Student Addition Restricted to Admin Only & Pre-Admitted Requirement
  console.log('\n--- Test 2: Student Addition / Registration Security ---');
  const fakeReg = await SMS.Auth.register({
    name: 'Hacker Student',
    email: 'hacker@student.edu',
    password: 'password123',
    role: 'Student',
    studentId: 'STU-FAKE-999'
  });
  assert(fakeReg.success === false && fakeReg.message.includes('Only Administrator can add students'), 'Registration properly blocked for unadmitted student ID');

  // Valid pre-admitted student registration succeeds
  const admittedStudent = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, [])[0];
  const validReg = await SMS.Auth.register({
    name: admittedStudent.fullName,
    email: 'new_' + admittedStudent.email,
    password: 'Password123!',
    role: 'Student',
    studentId: admittedStudent.id
  });
  assert(validReg.success === true && validReg.user.role === 'Student' && validReg.user.studentId === admittedStudent.id, 'Registered student successfully links with official Admin-admitted student record');

  // 3. Admin Assigns Teacher to Course and Enrolls Students
  console.log('\n--- Test 3: Course Teacher Assignment and Student Enrollment ---');
  const testCourse = allCourses[0];
  const teachers = SMS.CourseService.getAllTeachers();
  assert(teachers.length > 0, 'Teachers available for assignment');

  // Update assigned teacher
  SMS.CourseService.updateCourse(testCourse.id, { teacherId: teachers[1].id });
  const updatedCourse = SMS.CourseService.getCourseById(testCourse.id);
  assert(updatedCourse.teacherId === teachers[1].id, `Admin successfully assigned teacher ${teachers[1].name} to ${testCourse.code}`);

  // Admin enrolls a student
  const studentToEnroll = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, [])[1];
  try {
    SMS.CourseService.enrollStudent(studentToEnroll.id, testCourse.id);
  } catch (e) {
    // already enrolled
  }
  const roster = SMS.CourseService.getStudentsInCourse(testCourse.id);
  assert(roster.some(r => r.student.id === studentToEnroll.id), `Student ${studentToEnroll.id} enrolled in course`);

  // 4. In-Platform 4-Option Quizzes
  console.log('\n--- Test 4: In-Platform 4-Choice Quizzes ---');
  const quizzes = SMS.AssessmentService.getQuizzesByCourse(testCourse.id);
  assert(quizzes.length === 4, `Course has 4 phase quizzes (Found: ${quizzes.length})`);

  const q1 = quizzes[0];
  assert(Array.isArray(q1.questions) && q1.questions.length > 0, 'Quiz contains questions');
  q1.questions.forEach((q, idx) => {
    assert(Array.isArray(q.options) && q.options.length === 4, `Question ${idx + 1} has exactly 4 in-platform options`);
    assert(q.options.includes(q.correctAnswer), `Question ${idx + 1} correct answer is one of the 4 options`);
  });

  // Take quiz with 4-choice options
  const answers = {};
  q1.questions.forEach(q => {
    answers[q.id] = q.correctAnswer; // pick correct option
  });

  const quizAttempt = SMS.AssessmentService.submitQuizAttempt({
    quizId: q1.id,
    studentId: studentToEnroll.id,
    answers
  });

  assert(quizAttempt.autoScore === q1.totalMarks, `All 4-choice questions automatically scored correctly (${quizAttempt.autoScore}/${q1.totalMarks})`);

  // 5. Assignment Single Image Upload & Teacher Grading
  console.log('\n--- Test 5: Single Image Assignment Upload & Teacher Marking ---');
  const assignments = SMS.AssessmentService.getAssignmentsByCourse(testCourse.id);
  assert(assignments.length === 4, `Course has 4 phase assignments (Found: ${assignments.length})`);

  const asn1 = assignments[0];
  const sampleBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  // Student submits with image
  const sub = SMS.AssessmentService.submitAssignment({
    assignmentId: asn1.id,
    studentId: studentToEnroll.id,
    submissionText: 'Completed graph analysis problem with complexity calculations.',
    submissionImage: sampleBase64Image
  });

  assert(sub.submissionImage === sampleBase64Image, 'Single assignment image stored as Base64 in LocalStorage');
  assert(sub.status === 'Submitted', 'Submission status is initially Submitted');

  // Teacher evaluates submission
  const gradedSub = SMS.AssessmentService.gradeAssignmentSubmission(sub.id, 24, 'Excellent proof and clear diagram uploaded.');
  assert(gradedSub.marksAwarded === 24, 'Teacher awarded marks (24/25)');
  assert(gradedSub.status === 'Graded', 'Submission status updated to Graded');
  assert(gradedSub.feedback === 'Excellent proof and clear diagram uploaded.', 'Teacher feedback saved');

  // 6. Attendance < 70% Restriction Rule
  console.log('\n--- Test 6: Attendance < 70% Restriction Rule ---');
  // Create a student with < 70% attendance
  const lowAttStudentId = 'STU-LOW-ATT';
  const allStudents = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
  allStudents.push({
    id: lowAttStudentId,
    fullName: 'Low Attendance Student',
    email: 'lowatt@student.edu',
    departmentId: 'DEP-CSE',
    semester: '3rd',
    status: 'Active'
  });
  SMS.Storage.setItem(SMS.Storage.KEYS.STUDENTS, allStudents);
  SMS.CourseService.enrollStudent(lowAttStudentId, testCourse.id);

  // Mark attendance: 5 total classes, 2 Present, 3 Absent -> 40%
  for (let i = 1; i <= 5; i++) {
    SMS.AssessmentService.markAttendance({
      courseId: testCourse.id,
      studentId: lowAttStudentId,
      date: `2026-10-0${i}`,
      status: i <= 2 ? 'Present' : 'Absent'
    });
  }

  const attStats = SMS.AssessmentService.getCourseAttendanceStats(testCourse.id, lowAttStudentId);
  assert(attStats.percentage === 40, `Calculated attendance is 40% (Found: ${attStats.percentage}%)`);
  assert(attStats.isRestricted === true, 'Student is flagged as restricted because attendance is below 70%');

  // Verify submission attempt throws restriction error
  try {
    SMS.AssessmentService.submitAssignment({
      assignmentId: asn1.id,
      studentId: lowAttStudentId,
      submissionText: 'Trying to submit despite low attendance'
    });
    assert(false, 'Should have blocked submission due to < 70% attendance');
  } catch (err) {
    assert(err.message.includes('restricted') && err.message.includes('70%'), 'Submission correctly blocked with clear restriction message');
  }

  // 7. Results Calculation Verification
  console.log('\n--- Test 7: Results Calculation ---');
  const courseResult = SMS.AssessmentService.syncStudentResults(testCourse.id, studentToEnroll.id);
  assert(courseResult.courseId === testCourse.id, 'Result calculated for course');
  assert(courseResult.assignment1 === 24, `Result contains Assignment 01 marks (${courseResult.assignment1})`);
  assert(courseResult.quiz1 === 25, `Result contains Quiz 01 marks (${courseResult.quiz1})`);
  assert(courseResult.totalObtained === 49, `Total marks calculated correctly (${courseResult.totalObtained})`);
  assert(typeof courseResult.grade === 'string', `Grade calculated (${courseResult.grade})`);

  console.log('\n=======================================');
  if (errors.length === 0) {
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (0 failures)');
  } else {
    console.error(`TOTAL ERRORS: ${errors.length}`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
