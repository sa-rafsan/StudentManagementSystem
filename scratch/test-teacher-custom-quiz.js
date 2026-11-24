const path = require('path');
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

global.window = { location: { pathname: '/' } };
global.SMS = {};

require(path.join(__dirname, '../js/utils.js'));
require(path.join(__dirname, '../js/storage.js'));
require(path.join(__dirname, '../js/auth.js'));
require(path.join(__dirname, '../js/course-service.js'));
require(path.join(__dirname, '../js/assessment-service.js'));

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

// 1. Teacher creates custom quiz with 3 custom questions
console.log('\n--- Test: Teacher creates own custom quiz ---');
const customQuestions = [
  {
    id: 'CQ1',
    type: 'mcq',
    text: 'What is the speed of light in vacuum?',
    marks: 5,
    options: ['3 x 10^8 m/s', '1.5 x 10^8 m/s', '3 x 10^6 m/s', '300 km/h'],
    correctAnswer: '3 x 10^8 m/s'
  },
  {
    id: 'CQ2',
    type: 'mcq',
    text: 'Which programming language is predominantly used for browser scripting?',
    marks: 5,
    options: ['JavaScript', 'Fortran', 'Prolog', 'Cobol'],
    correctAnswer: 'JavaScript'
  },
  {
    id: 'CQ3',
    type: 'mcq',
    text: 'What does CSS stand for in web development?',
    marks: 5,
    options: ['Cascading Style Sheets', 'Creative Style Syntax', 'Computer Screen Styling', 'Control System Software'],
    correctAnswer: 'Cascading Style Sheets'
  }
];

const newQuiz = SMS.AssessmentService.createQuiz({
  courseId: 'CRS-001',
  phaseNumber: 2,
  title: 'Teacher Custom Assessment Quiz',
  description: 'Created by teacher with personalized 4-choice questions',
  durationMinutes: 15,
  totalMarks: 15,
  questions: customQuestions
});

assert(newQuiz && newQuiz.id.startsWith('QZ-'), 'Teacher custom quiz successfully created with unique ID');
assert(newQuiz.questions.length === 3, 'Quiz contains all 3 custom questions');

// 2. Student attends the teacher custom quiz
console.log('\n--- Test: Student attends the teacher custom quiz ---');
const studentId = 'STU-2024-001';
const studentAnswers = {
  'CQ1': '3 x 10^8 m/s', // Correct (+5)
  'CQ2': 'Fortran',       // Wrong (0)
  'CQ3': 'Cascading Style Sheets' // Correct (+5)
};

const attempt = SMS.AssessmentService.submitQuizAttempt({
  quizId: newQuiz.id,
  studentId,
  answers: studentAnswers
});

assert(attempt.autoScore === 10, `Student auto-score is 10/15 (Found: ${attempt.autoScore})`);
assert(attempt.studentId === studentId, 'Attempt recorded under student ID');

// 3. Teacher evaluates / adds feedback
console.log('\n--- Test: Teacher evaluates attempt ---');
const gradedAttempt = SMS.AssessmentService.gradeQuizAttempt(attempt.id, 0, 'Good effort, revise programming languages.');
assert(gradedAttempt.teacherFeedback === 'Good effort, revise programming languages.', 'Teacher feedback saved');

// 4. Student retakes / attends quiz again
console.log('\n--- Test: Student retakes quiz with all correct answers ---');
const retakeAnswers = {
  'CQ1': '3 x 10^8 m/s', // Correct (+5)
  'CQ2': 'JavaScript',   // Correct (+5)
  'CQ3': 'Cascading Style Sheets' // Correct (+5)
};

const retakeAttempt = SMS.AssessmentService.submitQuizAttempt({
  quizId: newQuiz.id,
  studentId,
  answers: retakeAnswers
});

assert(retakeAttempt.autoScore === 15, `Student retake auto-score is 15/15 (Found: ${retakeAttempt.autoScore})`);

console.log('\n=======================================');
if (errors.length === 0) {
  console.log('ALL TEACHER CUSTOM QUIZ & STUDENT ATTENDANCE TESTS PASSED! (0 failures)');
} else {
  console.error(`TOTAL ERRORS: ${errors.length}`);
  process.exit(1);
}
