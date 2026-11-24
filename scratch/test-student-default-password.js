/**
 * Test: Student Auto Default Password (12345) & Profile Password Change
 */

// Mock browser environment
const crypto = require('crypto');
global.window = global;
global.crypto = crypto.webcrypto;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockStorage = {};
global.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.sessionStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage['sess_' + key] : null),
  setItem: (key, val) => { mockStorage['sess_' + key] = String(val); },
  removeItem: (key) => { delete mockStorage['sess_' + key]; },
  clear: () => { Object.keys(mockStorage).filter(k => k.startsWith('sess_')).forEach(k => delete mockStorage[k]); }
};

// Load dependencies
require('../js/utils.js');
require('../js/storage.js');
require('../js/auth.js');
require('../js/student.js');

async function runTests() {
  console.log('=== RUNNING STUDENT DEFAULT PASSWORD & PROFILE CHANGE TESTS ===');

  // Initialize storage
  SMS.Storage.initStorage(true);

  // 1. Verify demo student default password '12345'
  console.log('\n--- Test 1: Existing Demo Student Login with Default 12345 ---');
  const demoLoginByEmail = await SMS.Auth.login('student@example.com', '12345');
  console.log('Login by Email (12345):', demoLoginByEmail.success ? 'PASS' : 'FAIL - ' + demoLoginByEmail.message);
  if (!demoLoginByEmail.success) throw new Error('Demo student email login failed');

  const demoLoginById = await SMS.Auth.login('STU-2024-001', '12345');
  console.log('Login by Student ID (12345):', demoLoginById.success ? 'PASS' : 'FAIL - ' + demoLoginById.message);
  if (!demoLoginById.success) throw new Error('Demo student ID login failed');

  // 2. Admin adds a new student
  console.log('\n--- Test 2: Admin Adds New Student & Verifies Auto Password 12345 ---');
  const newStudentData = {
    id: 'STU-2026-999',
    fullName: 'Tanvir Ahmed',
    email: 'tanvir@university.edu',
    phone: '+880 1711 000000',
    dob: '2004-05-20',
    gender: 'Male',
    departmentId: 'DEP-001',
    semester: 'Fall 2026',
    address: 'Dhaka, Bangladesh',
    enrollmentDate: '2026-01-10',
    status: 'Active'
  };

  const createdStudent = SMS.StudentService.create(newStudentData);
  console.log('Created Student:', createdStudent.id, createdStudent.fullName);

  // Check user account auto-created
  const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
  const autoUser = users.find(u => u.studentId === 'STU-2026-999');
  console.log('Auto user created in USERS:', autoUser ? 'PASS' : 'FAIL');
  if (!autoUser) throw new Error('User was not auto-created in USERS');
  console.log('User has isDefaultPassword flag:', autoUser.isDefaultPassword === true ? 'PASS' : 'FAIL');

  // 3. New student logs in with email and default password '12345'
  console.log('\n--- Test 3: New Student Login with Default 12345 ---');
  const loginNewEmail = await SMS.Auth.login('tanvir@university.edu', '12345');
  console.log('New student login by email (12345):', loginNewEmail.success ? 'PASS' : 'FAIL - ' + loginNewEmail.message);
  if (!loginNewEmail.success) throw new Error('New student login by email failed');

  // 4. New student logs in with Student ID and default password '12345'
  const loginNewId = await SMS.Auth.login('STU-2026-999', '12345');
  console.log('New student login by ID (12345):', loginNewId.success ? 'PASS' : 'FAIL - ' + loginNewId.message);
  if (!loginNewId.success) throw new Error('New student login by ID failed');

  // 5. Student changes password in profile
  console.log('\n--- Test 4: Student Changes Password in Profile ---');
  // Attempt with wrong current password
  const failChange = await SMS.Auth.changePassword('STU-2026-999', 'MySecret@2026', 'wrongpass');
  console.log('Change with wrong current pass rejected:', !failChange.success ? 'PASS' : 'FAIL');
  if (failChange.success) throw new Error('Should reject wrong current password');

  // Attempt with correct current password (12345)
  const successChange = await SMS.Auth.changePassword('STU-2026-999', 'MySecret@2026', '12345');
  console.log('Change with correct current pass (12345):', successChange.success ? 'PASS' : 'FAIL');
  if (!successChange.success) throw new Error('Password change failed: ' + successChange.message);

  // 6. Verify old password 12345 no longer works
  console.log('\n--- Test 5: Verify Old Password Rejected & New Password Works ---');
  const oldLogin = await SMS.Auth.login('STU-2026-999', '12345');
  console.log('Old password 12345 rejected:', !oldLogin.success ? 'PASS' : 'FAIL (Old password still accepted)');
  if (oldLogin.success) throw new Error('Old password should not work after change');

  // 7. Verify new password works
  const newLogin = await SMS.Auth.login('STU-2026-999', 'MySecret@2026');
  console.log('New password login succeeded:', newLogin.success ? 'PASS' : 'FAIL');
  if (!newLogin.success) throw new Error('New password login failed');

  console.log('\n======================================================');
  console.log('ALL STUDENT DEFAULT PASSWORD & PROFILE TESTS PASSED! ✅');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
