const storageMap = new Map();
global.localStorage = { getItem: k => storageMap.get(k)||null, setItem: (k,v) => storageMap.set(k,String(v)), removeItem: k => storageMap.delete(k) };
global.window = { location: { pathname: "/" } };
global.SMS = {};
require("../js/utils.js");
require("../js/storage.js");
require("../js/auth.js");
require("../js/course-service.js");
require("../js/assessment-service.js");
SMS.Storage.initStorage();

const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
console.log("All Users:", users.map(u => ({ email: u.email, role: u.role, studentId: u.studentId, teacherId: u.teacherId })));

const studentUser = users.find(u => u.role === "Student");
console.log("\nStudent user:", studentUser);

const enrolled = SMS.CourseService.getStudentEnrolledCourses(studentUser.studentId);
console.log("Enrolled courses:", enrolled.map(e => ({ id: e.course.id, code: e.course.code })));

const allCourses = SMS.CourseService.getAllCourses();
allCourses.forEach(c => {
  const stats = SMS.AssessmentService.getCourseAttendanceStats(c.id, studentUser.studentId);
  console.log(`Course ${c.id} (${c.code}): attendance = ${stats.percentage}%, isRestricted = ${stats.isRestricted}`);
  const asns = SMS.AssessmentService.getAssignmentsByCourse(c.id);
  const qzs = SMS.AssessmentService.getQuizzesByCourse(c.id);
  console.log(`  Assignments: ${asns.length}, Quizzes: ${qzs.length}`);
});

const allAsns = SMS.Storage.getCollection(SMS.Storage.KEYS.ASSIGNMENTS);
const allQzs = SMS.Storage.getCollection(SMS.Storage.KEYS.QUIZZES);
console.log(`\nTotal assignments in storage: ${allAsns.length}`);
console.log(`Total quizzes in storage: ${allQzs.length}`);
console.log("Course IDs of assignments:", [...new Set(allAsns.map(a => a.courseId))]);
console.log("Course IDs of quizzes:", [...new Set(allQzs.map(q => q.courseId))]);

const subs = SMS.Storage.getItem(SMS.Storage.KEYS.SUBMISSIONS, []);
console.log("\nSubmissions:", subs.map(s => ({ id: s.id, asnId: s.assignmentId, studentId: s.studentId, status: s.status })));

const attempts = SMS.Storage.getItem(SMS.Storage.KEYS.QUIZ_ATTEMPTS, []);
console.log("Quiz Attempts:", attempts.map(a => ({ id: a.id, quizId: a.quizId, studentId: a.studentId, score: a.totalScore })));

