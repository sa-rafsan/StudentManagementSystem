/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Authentication Module (auth.js)
 * Implements Web Crypto API PBKDF2 password hashing, salt generation,
 * session management, role-based access control, and route guards.
 */

window.SMS = window.SMS || {};

SMS.Auth = (() => {
  const SESSION_KEY = 'sms_session';

  /**
   * Helper: Convert ArrayBuffer to Hex String
   */
  const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  /**
   * Helper: Convert Hex String to Uint8Array
   */
  const hexToUint8Array = (hexString) => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  };

  /**
   * Hash password using Web Crypto API PBKDF2 (100,000 iterations, SHA-256)
   * Generates a 16-byte random salt if not provided.
   */
  const hashPassword = async (password, saltHex = null) => {
    const enc = new TextEncoder();
    let saltBytes;

    if (saltHex) {
      saltBytes = hexToUint8Array(saltHex);
    } else {
      saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    }

    // Import base password key
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive PBKDF2 bits
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      256
    );

    return {
      hash: bufferToHex(derivedBits),
      salt: bufferToHex(saltBytes)
    };
  };

  /**
   * Verify password against stored hash and salt
   */
  const verifyPassword = async (password, storedHash, storedSalt) => {
    try {
      const { hash } = await hashPassword(password, storedSalt);
      return hash === storedHash;
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  };

  /**
   * Get Current Session User
   */
  const getCurrentUser = () => {
    try {
      const sessStr = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!sessStr) return null;
      const user = JSON.parse(sessStr);
      if (user && user.role === 'Teacher' && !user.teacherId) {
        // Resolve teacherId from storage or fallback
        const allUsers = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
        const dbUser = allUsers.find(u => u.id === user.id || u.email === user.email);
        user.teacherId = (dbUser && dbUser.teacherId) ? dbUser.teacherId : 'TCH-001';
      }
      return user;
    } catch (e) {
      return null;
    }
  };

  /**
   * Check if user is logged in
   */
  const isLoggedIn = () => {
    return getCurrentUser() !== null;
  };

  /**
   * Check if current user is Admin
   */
  const isAdmin = () => {
    const user = getCurrentUser();
    return user && user.role === 'Admin';
  };

  /**
   * Check if current user is Student
   */
  const isStudent = () => {
    const user = getCurrentUser();
    return user && user.role === 'Student';
  };

  /**
   * Check if current user is Teacher
   */
  const isTeacher = () => {
    const user = getCurrentUser();
    return user && user.role === 'Teacher';
  };

  /**
   * Check if current user can mark attendance (Admin or Teacher)
   */
  const canMarkAttendance = () => {
    const user = getCurrentUser();
    return user && (user.role === 'Admin' || user.role === 'Teacher');
  };

  /**
   * Set user session
   */
  const setSession = (user) => {
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || null,
      teacherId: user.teacherId || (user.role === 'Teacher' ? 'TCH-001' : null),
      loginTime: new Date().toISOString()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    return sessionData;
  };

  /**
   * Clear session
   */
  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  };

  /**
   * Pre-computed PBKDF2 hash & salt for default student password: '12345'
   */
  const DEFAULT_STUDENT_PASSWORD_CREDENTIALS = {
    salt: '1234567890abcdef1234567890abcdef',
    passwordHash: 'fcbc8da2717f3c27afb9c77535c0f54daddd0395a736b1e17b9c8c51e64c576c'
  };

  /**
   * Ensure student user account exists in LocalStorage with default password '12345'
   */
  const ensureStudentUser = (student) => {
    if (!student || !student.id) return null;
    SMS.Storage.initStorage();
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanEmail = (student.email || '').trim().toLowerCase();
    const cleanId = student.id.trim();

    let userIndex = users.findIndex(u => 
      (u.studentId && u.studentId === cleanId) || 
      (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (userIndex >= 0) {
      users[userIndex].studentId = cleanId;
      users[userIndex].name = student.fullName || users[userIndex].name;
      users[userIndex].email = cleanEmail;
      users[userIndex].role = 'Student';
      SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);
      return users[userIndex];
    } else {
      const newUser = {
        id: `USR-${cleanId.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: student.fullName,
        email: cleanEmail,
        role: 'Student',
        salt: DEFAULT_STUDENT_PASSWORD_CREDENTIALS.salt,
        passwordHash: DEFAULT_STUDENT_PASSWORD_CREDENTIALS.passwordHash,
        studentId: cleanId,
        isDefaultPassword: true,
        createdAt: student.createdAt || new Date().toISOString()
      };
      users.push(newUser);
      SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);
      return newUser;
    }
  };

  /**
   * Synchronize student details with user account
   */
  const syncStudentUser = (student) => {
    if (!student || !student.id) return;
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const user = users.find(u => u.studentId === student.id);
    if (user) {
      user.name = student.fullName;
      user.email = (student.email || '').trim().toLowerCase();
      user.updatedAt = new Date().toISOString();
      SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);
    }
  };

  /**
   * Change user/student password in LocalStorage
   */
  const changePassword = async (targetStudentOrUserId, newPassword, currentPassword = null) => {
    if (!newPassword || newPassword.length < 5) {
      return { success: false, message: 'New password must be at least 5 characters long.' };
    }

    SMS.Storage.initStorage();
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanTarget = String(targetStudentOrUserId).trim();

    const userIndex = users.findIndex(u => 
      u.id === cleanTarget || 
      (u.studentId && u.studentId.toLowerCase() === cleanTarget.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === cleanTarget.toLowerCase())
    );

    if (userIndex === -1) {
      return { success: false, message: 'User account not found.' };
    }

    const user = users[userIndex];
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'Admin';

    // Verify current password if not admin
    if (!isAdmin && currentPassword !== null) {
      let isValid = await verifyPassword(currentPassword, user.passwordHash, user.salt);
      if (!isValid) {
        // Fallback: check if current was default '12345'
        if (currentPassword === '12345' && (user.isDefaultPassword || user.passwordHash === DEFAULT_STUDENT_PASSWORD_CREDENTIALS.passwordHash)) {
          isValid = true;
        }
      }
      if (!isValid) {
        return { success: false, message: 'Current password does not match.' };
      }
    }

    // Hash new password using PBKDF2 Web Crypto API
    const { hash, salt } = await hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.isDefaultPassword = false;
    user.updatedAt = new Date().toISOString();

    users[userIndex] = user;
    SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);

    // Refresh active session if the logged in user changed their own password
    if (currentUser && (currentUser.id === user.id || currentUser.studentId === user.studentId)) {
      setSession(user);
    }

    return { success: true, message: 'Password updated successfully!' };
  };

  /**
   * Authenticate User (Login via Email OR Student ID)
   */
  const login = async (emailOrId, password) => {
    SMS.Storage.initStorage();
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanIdentifier = String(emailOrId).trim().toLowerCase();

    // Look for matching user by email or studentId
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.studentId && u.studentId.toLowerCase() === cleanIdentifier)
    );

    // If user not in USERS but student exists in STUDENTS, auto-provision user with default password '12345'
    if (!user) {
      const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
      const stu = students.find(s => 
        (s.id && s.id.toLowerCase() === cleanIdentifier) || 
        (s.email && s.email.toLowerCase() === cleanIdentifier)
      );
      if (stu) {
        user = ensureStudentUser(stu);
      }
    }

    if (!user) {
      return { success: false, message: 'Invalid email address, student ID, or password.' };
    }

    let isValid = await verifyPassword(password, user.passwordHash, user.salt);
    // Allow '12345' fallback if default password flag is set or hash is default
    if (!isValid && user.role === 'Student' && password === '12345') {
      if (user.isDefaultPassword || user.passwordHash === DEFAULT_STUDENT_PASSWORD_CREDENTIALS.passwordHash) {
        isValid = true;
      }
    }

    if (!isValid) {
      return { success: false, message: 'Invalid email address, student ID, or password.' };
    }

    const session = setSession(user);
    return { success: true, user: session };
  };

  /**
   * Register a new user
   */
  const register = async ({ name, email, password, role = 'Student', studentId = null }) => {
    SMS.Storage.initStorage();
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanEmail = String(email).trim().toLowerCase();

    // Check email uniqueness
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email address already exists.' };
    }

    // If student role, ensure valid studentId or check student existence
    if (role === 'Student') {
      const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
      if (!studentId) {
        return { success: false, message: 'Student accounts must be created by Admin first. Please provide your official Student ID.' };
      }
      const stu = students.find(s => s.id === studentId || s.email.toLowerCase() === cleanEmail);
      if (!stu) {
        return { success: false, message: `No student record found with ID "${studentId}". Only Administrator can add students.` };
      }
    }

    // Hash password with unique salt
    const { hash, salt } = await hashPassword(password);

    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: String(name).trim(),
      email: cleanEmail,
      role: ['Admin', 'Teacher', 'Student'].includes(role) ? role : 'Student',
      salt,
      passwordHash: hash,
      studentId: role === 'Student' ? studentId : null,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);

    // Auto login
    const session = setSession(newUser);
    return { success: true, user: session };
  };

  /**
   * Logout user and redirect to login
   */
  const logout = () => {
    clearSession();
    window.location.href = 'login.html';
  };

  /**
   * Route Guard: Protect pages by authentication and role
   */
  const requireAuth = (allowedRoles = ['Admin', 'Teacher', 'Student']) => {
    const user = getCurrentUser();

    if (!user) {
      const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${currentPath}`;
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      SMS.Utils.showToast('error', 'Access Denied', `Your role (${user.role}) does not have permission to access this page.`);
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      return false;
    }

    return true;
  };

  return {
    hashPassword,
    verifyPassword,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    isStudent,
    isTeacher,
    canMarkAttendance,
    login,
    register,
    logout,
    requireAuth,
    DEFAULT_STUDENT_PASSWORD_CREDENTIALS,
    ensureStudentUser,
    syncStudentUser,
    changePassword
  };
})();
