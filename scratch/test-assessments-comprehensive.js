// Comprehensive test for assessments creation and update
const fs = require('fs');

const storageCode = fs.readFileSync('js/storage.js', 'utf8');
const authCode = fs.readFileSync('js/auth.js', 'utf8');
const courseServiceCode = fs.readFileSync('js/course-service.js', 'utf8');
const assessmentServiceCode = fs.readFileSync('js/assessment-service.js', 'utf8');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8');

const store = {};
const mockLocalStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
const mockSessionStorage = {
  getItem: (k) => store['__sess_' + k] || null,
  setItem: (k, v) => { store['__sess_' + k] = String(v); },
  removeItem: (k) => { delete store['__sess_' + k]; },
  clear: () => { Object.keys(store).filter(k => k.startsWith('__sess_')).forEach(k => delete store[k]); }
};

global.SMS = {};
global.window = {
  location: { pathname: '/assessments.html', search: '' },
  SMS: global.SMS
};
global.localStorage = mockLocalStorage;
global.sessionStorage = mockSessionStorage;

eval(utilsCode);
eval(storageCode);
eval(authCode);
eval(courseServiceCode);
eval(assessmentServiceCode);

SMS.Storage.initStorage(true);

console.log('--- TEST 1: CREATE ASSIGNMENT ---');
const createdAsn = SMS.AssessmentService.createAssignment({
  courseId: 'CRS-001',
  phaseNumber: 2,
  title: 'Database Schema Normalization Project',
  description: 'Design 3NF and BCNF relational schema models.',
  totalMarks: 30,
  deadline: '2026-10-30T23:59:00.000Z'
});
console.log('Created Asn ID:', createdAsn.id, 'Title:', createdAsn.title, 'Course:', createdAsn.courseId);

if (!createdAsn.id || createdAsn.title !== 'Database Schema Normalization Project') {
  throw new Error('Test 1 Failed: Created assignment not matching.');
}

console.log('--- TEST 2: UPDATE ASSIGNMENT ---');
const updatedAsn = SMS.AssessmentService.updateAssignment(createdAsn.id, {
  courseId: 'CRS-001',
  phaseNumber: 2,
  phase: 'Phase 02',
  title: 'Database Schema Normalization & Indexing Project',
  description: 'Updated with indexing requirements.',
  totalMarks: 35,
  deadline: '2026-11-05T23:59:00.000Z'
});
console.log('Updated Asn ID:', updatedAsn.id, 'New Title:', updatedAsn.title, 'Marks:', updatedAsn.totalMarks);

if (updatedAsn.title !== 'Database Schema Normalization & Indexing Project' || updatedAsn.totalMarks !== 35) {
  throw new Error('Test 2 Failed: Update assignment failed.');
}

console.log('--- TEST 3: CREATE CUSTOM 4-OPTION QUIZ ---');
const customQuestions = [
  {
    id: 'Q-001',
    type: 'mcq',
    text: 'What is the primary key in a relational database?',
    marks: 10,
    options: [
      'A unique identifier for each record',
      'An optional secondary index',
      'A duplicate column in the table',
      'A foreign reference to another database'
    ],
    correctAnswer: 'A unique identifier for each record'
  },
  {
    id: 'Q-002',
    type: 'mcq',
    text: 'Which normal form eliminates partial dependency?',
    marks: 15,
    options: [
      '1NF',
      '2NF',
      '3NF',
      'BCNF'
    ],
    correctAnswer: '2NF'
  }
];

const createdQuiz = SMS.AssessmentService.createQuiz({
  courseId: 'CRS-001',
  phaseNumber: 2,
  title: 'Relational Database Integrity & Normalization Quiz',
  durationMinutes: 25,
  totalMarks: 25,
  deadline: '2026-10-31T23:59:00.000Z',
  questions: customQuestions
});
console.log('Created Quiz ID:', createdQuiz.id, 'Title:', createdQuiz.title, 'Qs count:', createdQuiz.questions.length);

if (!createdQuiz.id || createdQuiz.questions.length !== 2) {
  throw new Error('Test 3 Failed: Create quiz with 4-options failed.');
}

console.log('--- TEST 4: UPDATE QUIZ & QUESTIONS ---');
customQuestions[0].text = 'What is the exact definition of a Primary Key in RDBMS?';
customQuestions.push({
  id: 'Q-003',
  type: 'mcq',
  text: 'What does SQL stand for?',
  marks: 5,
  options: [
    'Structured Query Language',
    'Simple Question Language',
    'Sequential Query List',
    'Standard Quantitative Logic'
  ],
  correctAnswer: 'Structured Query Language'
});

const updatedQuiz = SMS.AssessmentService.updateQuiz(createdQuiz.id, {
  courseId: 'CRS-001',
  phaseNumber: 2,
  phase: 'Phase 02',
  title: 'Advanced Relational Database Integrity Quiz',
  durationMinutes: 30,
  totalMarks: 30,
  deadline: '2026-11-06T23:59:00.000Z',
  questions: customQuestions
});
console.log('Updated Quiz ID:', updatedQuiz.id, 'New Title:', updatedQuiz.title, 'Qs count:', updatedQuiz.questions.length);

if (updatedQuiz.questions.length !== 3 || updatedQuiz.totalMarks !== 30) {
  throw new Error('Test 4 Failed: Update quiz failed.');
}

console.log('--- TEST 5: STUDENT ATTEMPTS CUSTOM QUIZ ---');
const studentAttempt = SMS.AssessmentService.submitQuizAttempt({
  quizId: updatedQuiz.id,
  studentId: 'STU-2024-001',
  answers: {
    'Q-001': 'A unique identifier for each record', // Correct (+10)
    'Q-002': '2NF', // Correct (+15)
    'Q-003': 'Structured Query Language' // Correct (+5)
  }
});
console.log('Student Attempt Score:', studentAttempt.autoScore, '/', studentAttempt.maxMarks, 'Evaluated:', studentAttempt.evaluated);

if (studentAttempt.autoScore !== 30) {
  throw new Error(`Test 5 Failed: Expected 30 marks, got ${studentAttempt.autoScore}`);
}

console.log('--- TEST 6: VERIFY MULTIPLE ATTEMPTS REJECTED (SINGLE ATTEMPT RULE) ---');
let secondAttemptBlocked = false;
try {
  SMS.AssessmentService.submitQuizAttempt({
    quizId: updatedQuiz.id,
    studentId: 'STU-2024-001',
    answers: {
      'Q-001': 'A unique identifier for each record',
      'Q-002': '2NF',
      'Q-003': 'Structured Query Language'
    }
  });
} catch (err) {
  secondAttemptBlocked = true;
  console.log('Second attempt blocked with error:', err.message);
}

if (!secondAttemptBlocked) {
  throw new Error('Test 6 Failed: Student was able to attempt the same quiz more than once!');
}
console.log('PASS: Single attempt per student strictly enforced!');

console.log('ALL COMPREHENSIVE ASSESSMENT TESTS PASSED SUCCESSFULLY! ✅');
