// Test assessments page form logic
const fs = require('fs');

const storageCode = fs.readFileSync('js/storage.js', 'utf8');
const authCode = fs.readFileSync('js/auth.js', 'utf8');
const courseServiceCode = fs.readFileSync('js/course-service.js', 'utf8');
const assessmentServiceCode = fs.readFileSync('js/assessment-service.js', 'utf8');
const utilsCode = fs.readFileSync('js/utils.js', 'utf8');

// Mock localStorage and window
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
global.document = {
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
};

// Evaluate scripts in order
eval(utilsCode);
eval(storageCode);
eval(authCode);
eval(courseServiceCode);
eval(assessmentServiceCode);

// Init storage
SMS.Storage.initStorage(true);

// Login as teacher
const loginRes = SMS.Auth.login('teacher@example.com', 'Teacher@123');
console.log('Login result:', loginRes.success, 'user:', loginRes.user ? loginRes.user.name : null, 'role:', loginRes.user ? loginRes.user.role : null, 'teacherId:', loginRes.user ? loginRes.user.teacherId : null);

const currentActiveCourseId = 'CRS-001';

// Test creating an assignment
try {
  const newAsn = SMS.AssessmentService.createAssignment({
    courseId: currentActiveCourseId,
    phaseNumber: '2',
    title: 'New Custom Assignment',
    description: 'Custom description',
    totalMarks: '30',
    deadline: '2026-10-15T23:59'
  });
  console.log('Created assignment successfully:', newAsn.id, newAsn.title, newAsn.phase);

  // Test updating the assignment
  const updatedAsn = SMS.AssessmentService.updateAssignment(newAsn.id, {
    phaseNumber: 3,
    phase: 'Phase 03',
    title: 'Updated Custom Assignment Title',
    description: 'Updated description',
    totalMarks: 35,
    deadline: '2026-10-20T23:59'
  });
  console.log('Updated assignment successfully:', updatedAsn.id, updatedAsn.title, updatedAsn.phase, updatedAsn.totalMarks);
} catch (err) {
  console.error('Error in assignment create/update:', err);
}

// Test creating a quiz
try {
  const newQuiz = SMS.AssessmentService.createQuiz({
    courseId: currentActiveCourseId,
    phaseNumber: '2',
    title: 'New Custom Quiz',
    durationMinutes: '15',
    totalMarks: '20',
    deadline: '2026-10-15T23:59',
    questions: [
      {
        id: 'Q-01',
        type: 'mcq',
        text: 'What is 2+2?',
        marks: 5,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4'
      }
    ]
  });
  console.log('Created quiz successfully:', newQuiz.id, newQuiz.title, newQuiz.questions.length);

  // Test updating the quiz
  const updatedQuiz = SMS.AssessmentService.updateQuiz(newQuiz.id, {
    phaseNumber: 2,
    phase: 'Phase 02',
    title: 'Updated Custom Quiz Title',
    durationMinutes: 25,
    totalMarks: 25,
    deadline: '2026-10-22T23:59',
    questions: [
      {
        id: 'Q-01',
        type: 'mcq',
        text: 'What is 2+2?',
        marks: 5,
        options: ['1', '2', '3', '4'],
        correctAnswer: '4'
      },
      {
        id: 'Q-02',
        type: 'mcq',
        text: 'What is 3*3?',
        marks: 20,
        options: ['6', '8', '9', '12'],
        correctAnswer: '9'
      }
    ]
  });
  console.log('Updated quiz successfully:', updatedQuiz.id, updatedQuiz.title, updatedQuiz.questions.length);
} catch (err) {
  console.error('Error in quiz create/update:', err);
}
