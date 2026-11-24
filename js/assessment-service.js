/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Assessment, Attendance & Marking Service (assessment-service.js)
 * Implements Course Attendance, Assignments, Quizzes, Automated & Manual Grading,
 * 70% Attendance Eligibility Check, and Comprehensive Course Results Calculation.
 */

window.SMS = window.SMS || {};

SMS.AssessmentService = (() => {
  const S_KEYS = SMS.Storage.KEYS;

  // ================= COURSE ATTENDANCE MANAGEMENT =================

  /**
   * Get all course attendance records
   */
  const getAllAttendance = () => {
    return SMS.Storage.getCollection(S_KEYS.COURSE_ATTENDANCE);
  };

  /**
   * Record attendance for a student in a course on a date
   * Rule: Prevent duplicate attendance record for the same student, course, and date
   * Status: 'Present', 'Absent', 'Late'
   */
  const markAttendance = ({ courseId, studentId, date, status = 'Present', notes = '' }) => {
    if (!courseId || !studentId || !date) {
      throw new Error('Course, Student, and Date are mandatory.');
    }

    const allRecords = getAllAttendance();
    const existing = allRecords.find(r => r.courseId === courseId && r.studentId === studentId && r.date === date);

    if (existing) {
      // Update existing record
      return SMS.Storage.updateInCollection(S_KEYS.COURSE_ATTENDANCE, existing.id, {
        status,
        notes: notes || existing.notes || ''
      });
    }

    // Insert new record
    const newRecord = {
      id: `CATT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5)}`,
      courseId,
      studentId,
      date,
      status, // 'Present', 'Absent', 'Late'
      notes
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.COURSE_ATTENDANCE, newRecord);
  };

  /**
   * Bulk mark attendance for an entire roster on a specific date
   */
  const markBatchAttendance = (courseId, date, studentStatusList) => {
    studentStatusList.forEach(item => {
      markAttendance({
        courseId,
        studentId: item.studentId,
        date,
        status: item.status,
        notes: item.notes || ''
      });
    });
  };

  /**
   * Calculate Attendance Percentage for a student in a specific course
   * Formula: (Total Present Classes / Total Classes) * 100
   * Rule: Students with attendance below 70% cannot participate in final assessment
   */
  const getCourseAttendanceStats = (courseId, studentId) => {
    const records = SMS.Storage.filterInCollection(
      S_KEYS.COURSE_ATTENDANCE,
      r => r.courseId === courseId && r.studentId === studentId
    );

    const totalClasses = records.length;
    if (totalClasses === 0) {
      return {
        totalClasses: 0,
        presentClasses: 0,
        absentClasses: 0,
        lateClasses: 0,
        percentage: 100, // No classes held yet; allow initial participation
        isRestricted: false,
        restrictionReason: ''
      };
    }

    const presentClasses = records.filter(r => r.status === 'Present').length;
    const lateClasses = records.filter(r => r.status === 'Late').length;
    const absentClasses = records.filter(r => r.status === 'Absent').length;

    // Formula strictly specified: (Total Present Classes / Total Classes) * 100
    // Note: Late can optionally count as attended or separate; here presentClasses / totalClasses
    const percentage = Math.round((presentClasses / totalClasses) * 100);
    const isRestricted = percentage < 70;

    return {
      totalClasses,
      presentClasses,
      lateClasses,
      absentClasses,
      percentage,
      isRestricted,
      restrictionReason: isRestricted
        ? `Attendance (${percentage}%) is below the mandatory 70% threshold. You are restricted from participating in assessment submissions and quizzes for this course.`
        : ''
    };
  };

  /**
   * Get attendance logs for a specific course
   */
  const getAttendanceByCourse = (courseId) => {
    return SMS.Storage.filterInCollection(S_KEYS.COURSE_ATTENDANCE, r => r.courseId === courseId);
  };

  // ================= ASSIGNMENTS =================

  /**
   * Get all assignments
   */
  const getAllAssignments = () => {
    return SMS.Storage.getCollection(S_KEYS.ASSIGNMENTS);
  };

  /**
   * Get assignments by Course ID
   */
  const getAssignmentsByCourse = (courseId) => {
    return SMS.Storage.filterInCollection(S_KEYS.ASSIGNMENTS, a => a.courseId === courseId)
      .sort((a, b) => a.phaseNumber - b.phaseNumber);
  };

  /**
   * Get assignment by ID
   */
  const getAssignmentById = (id) => {
    return SMS.Storage.findInCollection(S_KEYS.ASSIGNMENTS, a => a.id === id);
  };

  /**
   * Create Assignment
   * Phases: Phase 01 (W1-3), Phase 02 (W4-6), Phase 03 (W7-9), Phase 04 (W10-12)
   */
  const createAssignment = ({ courseId, phaseNumber, title, description, totalMarks = 25, deadline }) => {
    if (!courseId || !title || !phaseNumber) {
      throw new Error('Course, Title, and Phase Number are required.');
    }

    const newAssignment = {
      id: 'ASN-' + Date.now().toString().slice(-6),
      courseId,
      phase: `Phase 0${phaseNumber}`,
      phaseNumber: parseInt(phaseNumber, 10),
      title: title.trim(),
      description: description ? description.trim() : '',
      totalMarks: parseFloat(totalMarks) || 25,
      deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString()
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.ASSIGNMENTS, newAssignment);
  };

  /**
   * Update Assignment
   */
  const updateAssignment = (id, updates) => {
    return SMS.Storage.updateInCollection(S_KEYS.ASSIGNMENTS, id, updates);
  };

  /**
   * Delete Assignment
   */
  const deleteAssignment = (id) => {
    return SMS.Storage.deleteFromCollection(S_KEYS.ASSIGNMENTS, id);
  };

  // ================= QUIZZES =================

  /**
   * Get all quizzes
   */
  const getAllQuizzes = () => {
    return SMS.Storage.getCollection(S_KEYS.QUIZZES);
  };

  /**
   * Get quizzes by Course ID
   */
  const getQuizzesByCourse = (courseId) => {
    return SMS.Storage.filterInCollection(S_KEYS.QUIZZES, q => q.courseId === courseId)
      .sort((a, b) => a.phaseNumber - b.phaseNumber);
  };

  /**
   * Get quiz by ID
   */
  const getQuizById = (id) => {
    return SMS.Storage.findInCollection(S_KEYS.QUIZZES, q => q.id === id);
  };

  /**
   * Create Quiz
   * Supports: MCQ, True/False, and Short-Answer questions
   */
  const createQuiz = ({
    courseId,
    phaseNumber,
    title,
    description = '',
    durationMinutes = 20,
    totalMarks = 25,
    deadline,
    questions = []
  }) => {
    if (!courseId || !title || !phaseNumber) {
      throw new Error('Course, Title, and Phase Number are required.');
    }

    const newQuiz = {
      id: 'QZ-' + Date.now().toString().slice(-6),
      courseId,
      phase: `Phase 0${phaseNumber}`,
      phaseNumber: parseInt(phaseNumber, 10),
      title: title.trim(),
      description: description.trim(),
      durationMinutes: parseInt(durationMinutes, 10) || 20,
      totalMarks: parseFloat(totalMarks) || 25,
      deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
      questions: Array.isArray(questions) ? questions : []
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.QUIZZES, newQuiz);
  };

  /**
   * Update Quiz
   */
  const updateQuiz = (id, updates) => {
    return SMS.Storage.updateInCollection(S_KEYS.QUIZZES, id, updates);
  };

  /**
   * Delete Quiz
   */
  const deleteQuiz = (id) => {
    return SMS.Storage.deleteFromCollection(S_KEYS.QUIZZES, id);
  };

  // ================= STUDENT SUBMISSIONS & QUIZ ATTEMPTS =================

  /**
   * Submit Assignment by Student
   * Supports submissionText and single image upload (data URL / base64)
   * Rule: Checks 70% attendance first
   */
  const submitAssignment = ({ assignmentId, studentId, submissionText, submissionImage = '' }) => {
    const assignment = getAssignmentById(assignmentId);
    if (!assignment) throw new Error('Assignment not found.');

    const effectiveStudentId = studentId || 'STU-2024-001';

    // Check attendance threshold
    const attStats = getCourseAttendanceStats(assignment.courseId, effectiveStudentId);
    if (attStats.isRestricted) {
      throw new Error(attStats.restrictionReason);
    }

    const existingSubmissions = SMS.Storage.getCollection(S_KEYS.SUBMISSIONS);
    const existing = existingSubmissions.find(s => s.assignmentId === assignmentId && s.studentId === effectiveStudentId);

    if (existing) {
      return SMS.Storage.updateInCollection(S_KEYS.SUBMISSIONS, existing.id, {
        submissionText,
        submissionImage: submissionImage || existing.submissionImage || '',
        submittedAt: new Date().toISOString()
      });
    }

    const newSub = {
      id: 'SUB-' + Date.now().toString().slice(-6),
      assignmentId,
      studentId: effectiveStudentId,
      courseId: assignment.courseId,
      submissionText,
      submissionImage: submissionImage || '',
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      marksAwarded: null,
      feedback: ''
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.SUBMISSIONS, newSub);
  };

  /**
   * Evaluate Assignment by Teacher
   */
  const gradeAssignmentSubmission = (submissionId, marksAwarded, feedback = '') => {
    const sub = SMS.Storage.findInCollection(S_KEYS.SUBMISSIONS, s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found.');

    const updated = SMS.Storage.updateInCollection(S_KEYS.SUBMISSIONS, submissionId, {
      marksAwarded: parseFloat(marksAwarded),
      feedback: feedback.trim(),
      status: 'Graded',
      gradedAt: new Date().toISOString()
    });

    // Sync into marks table
    syncStudentResults(sub.courseId, sub.studentId);
    return updated;
  };

  /**
   * Submit Quiz Attempt by Student
   * Evaluates 4-choice questions directly in-platform
   */
  const submitQuizAttempt = ({ quizId, studentId, answers }) => {
    const quiz = getQuizById(quizId);
    if (!quiz) throw new Error('Quiz not found.');

    const effectiveStudentId = studentId || 'STU-2024-001';

    // Check attendance threshold
    const attStats = getCourseAttendanceStats(quiz.courseId, effectiveStudentId);
    if (attStats.isRestricted) {
      throw new Error(attStats.restrictionReason);
    }

    let autoScore = 0;

    // Check if student has already attempted this quiz (Single attempt restriction)
    const existingAttempts = SMS.Storage.getCollection(S_KEYS.QUIZ_ATTEMPTS);
    const existing = existingAttempts.find(a => a.quizId === quizId && a.studentId === effectiveStudentId);
    if (existing) {
      throw new Error('You have already completed this quiz. Only 1 attempt is allowed per student.');
    }

    // Automatic evaluation of 4-choice questions
    (quiz.questions || []).forEach(q => {
      const studentAns = (answers[q.id] || '').trim();
      const correctAns = (q.correctAnswer || '').trim();
      const qMarks = parseFloat(q.marks) || 0;

      if (studentAns.toLowerCase() === correctAns.toLowerCase()) {
        autoScore += qMarks;
      }
    });

    const attemptData = {
      id: 'QA-' + Date.now().toString().slice(-6),
      quizId,
      studentId: effectiveStudentId,
      courseId: quiz.courseId,
      answers,
      autoScore,
      manualScore: 0,
      totalScore: autoScore,
      maxMarks: quiz.totalMarks,
      evaluated: true,
      teacherFeedback: '',
      attemptedAt: new Date().toISOString()
    };

    const resultAttempt = SMS.Storage.insertIntoCollection(S_KEYS.QUIZ_ATTEMPTS, attemptData);

    // Sync into marks and results
    syncStudentResults(quiz.courseId, studentId);
    return resultAttempt;
  };

  /**
   * Evaluate Manual Quiz Questions by Teacher
   */
  const gradeQuizAttempt = (attemptId, manualScore, teacherFeedback = '') => {
    const attempt = SMS.Storage.findInCollection(S_KEYS.QUIZ_ATTEMPTS, a => a.id === attemptId);
    if (!attempt) throw new Error('Quiz attempt not found.');

    const mScore = parseFloat(manualScore) || 0;
    const totalScore = (attempt.autoScore || 0) + mScore;

    const updated = SMS.Storage.updateInCollection(S_KEYS.QUIZ_ATTEMPTS, attemptId, {
      manualScore: mScore,
      totalScore: totalScore,
      teacherFeedback: teacherFeedback.trim(),
      evaluated: true,
      gradedAt: new Date().toISOString()
    });

    // Sync into marks and results
    syncStudentResults(attempt.courseId, attempt.studentId);
    return updated;
  };

  // ================= RESULT & MARKING AGGREGATION =================

  /**
   * Calculate Grade from Percentage
   */
  const calculateGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 85) return 'A';
    if (pct >= 80) return 'A-';
    if (pct >= 75) return 'B+';
    if (pct >= 70) return 'B';
    if (pct >= 65) return 'C+';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  /**
   * Calculate and synchronize Course Results for a student
   * Categories:
   * - Assignment 01, Quiz 01 (Phase 1)
   * - Assignment 02, Quiz 02 (Phase 2)
   * - Assignment 03, Quiz 03 (Phase 3)
   * - Assignment 04, Quiz 04 (Phase 4)
   * Total Obtained, Total Marks, Percentage, Grade
   */
  const syncStudentResults = (courseId, studentId) => {
    const course = SMS.CourseService.getCourseById(courseId);
    const assignments = getAssignmentsByCourse(courseId);
    const quizzes = getQuizzesByCourse(courseId);
    const submissions = SMS.Storage.filterInCollection(S_KEYS.SUBMISSIONS, s => s.courseId === courseId && s.studentId === studentId);
    const attempts = SMS.Storage.filterInCollection(S_KEYS.QUIZ_ATTEMPTS, a => a.courseId === courseId && a.studentId === studentId);

    // Get marks by phase (1 to 4)
    const getAssignMark = (phaseNum) => {
      const asn = assignments.find(a => a.phaseNumber === phaseNum);
      if (!asn) return 0;
      const sub = submissions.find(s => s.assignmentId === asn.id);
      return sub && sub.marksAwarded !== null && sub.marksAwarded !== undefined ? sub.marksAwarded : 0;
    };

    const getQuizMark = (phaseNum) => {
      const qz = quizzes.find(q => q.phaseNumber === phaseNum);
      if (!qz) return 0;
      const att = attempts.find(a => a.quizId === qz.id);
      return att && att.totalScore !== null && att.totalScore !== undefined ? att.totalScore : 0;
    };

    const a1 = getAssignMark(1);
    const q1 = getQuizMark(1);
    const a2 = getAssignMark(2);
    const q2 = getQuizMark(2);
    const a3 = getAssignMark(3);
    const q3 = getQuizMark(3);
    const a4 = getAssignMark(4);
    const q4 = getQuizMark(4);

    const totalObtained = a1 + q1 + a2 + q2 + a3 + q3 + a4 + q4;
    // Standard 8 assessments of 25 marks each = 200 total marks
    const totalMarks = 200;
    const percentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
    const grade = calculateGrade(percentage);

    const attStats = getCourseAttendanceStats(courseId, studentId);

    // Save or update in RESULTS collection
    const allResults = SMS.Storage.getCollection(S_KEYS.RESULTS);
    const existing = allResults.find(r => r.courseId === courseId && r.studentId === studentId);

    const resultRecord = {
      id: existing ? existing.id : `RES-${courseId}-${studentId}`,
      courseId,
      studentId,
      semesterId: course ? course.semesterId : null,
      assignment1: a1,
      quiz1: q1,
      assignment2: a2,
      quiz2: q2,
      assignment3: a3,
      quiz3: q3,
      assignment4: a4,
      quiz4: q4,
      totalObtained,
      totalMarks,
      percentage,
      grade,
      attendancePercentage: attStats.percentage,
      examEligible: !attStats.isRestricted,
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      SMS.Storage.updateInCollection(S_KEYS.RESULTS, existing.id, resultRecord);
    } else {
      SMS.Storage.insertIntoCollection(S_KEYS.RESULTS, resultRecord);
    }

    return resultRecord;
  };

  /**
   * Get calculated course results for a student
   */
  const getStudentCourseResult = (courseId, studentId) => {
    let res = SMS.Storage.findInCollection(S_KEYS.RESULTS, r => r.courseId === courseId && r.studentId === studentId);
    if (!res) {
      res = syncStudentResults(courseId, studentId);
    }
    return res;
  };

  /**
   * Get all results for a course
   */
  const getResultsByCourse = (courseId) => {
    const studentsInCourse = SMS.CourseService.getStudentsInCourse(courseId);
    return studentsInCourse.map(item => {
      const res = getStudentCourseResult(courseId, item.student.id);
      return {
        student: item.student,
        result: res
      };
    });
  };

  /**
   * Get all results across all enrolled courses for a student
   */
  const getAllResultsForStudent = (studentId) => {
    const enrolledCourses = SMS.CourseService.getStudentEnrolledCourses(studentId);
    return enrolledCourses.map(item => {
      const result = getStudentCourseResult(item.course.id, studentId);
      const attStats = getCourseAttendanceStats(item.course.id, studentId);
      return {
        course: item.course,
        result,
        attendanceStats: attStats
      };
    });
  };

  return {
    getAllAttendance,
    markAttendance,
    markBatchAttendance,
    getCourseAttendanceStats,
    getAttendanceByCourse,
    getAllAssignments,
    getAssignmentsByCourse,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAllQuizzes,
    getQuizzesByCourse,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitAssignment,
    gradeAssignmentSubmission,
    submitQuizAttempt,
    gradeQuizAttempt,
    calculateGrade,
    syncStudentResults,
    getStudentCourseResult,
    getResultsByCourse,
    getAllResultsForStudent
  };
})();
