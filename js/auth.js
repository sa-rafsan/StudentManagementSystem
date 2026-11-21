/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Authentication Module (auth.js)
 * Implements Web Crypto API PBKDF2 password hashing, salt generation,
 * session management, role-based access control, and route guards.
 *
 * NOTE FOR ACADEMIC EVALUATION:
 * Browser-based authentication and role checks are for educational demonstration only.
 * They are not equivalent to server-side sessions, secure cookies, and backend authorization.
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
      return JSON.parse(sessStr);
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
   * Set user session
   */
  const setSession = (user) => {
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || null,
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
   * Authenticate User (Login)
   */
  const login = async (email, password) => {
    SMS.Storage.initStorage();
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanEmail = String(email).trim().toLowerCase();

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Invalid email address or password.' };
    }

    const isValid = await verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return { success: false, message: 'Invalid email address or password.' };
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
    if (role === 'Student' && studentId) {
      const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
      const stu = students.find(s => s.id === studentId || s.email.toLowerCase() === cleanEmail);
      if (!stu && studentId) {
        return { success: false, message: `No student record found with ID "${studentId}".` };
      }
    }

    // Hash password with unique salt
    const { hash, salt } = await hashPassword(password);

    const newUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: String(name).trim(),
      email: cleanEmail,
      role: role === 'Admin' ? 'Admin' : 'Student',
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
  const requireAuth = (allowedRoles = ['Admin', 'Student']) => {
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
    login,
    register,
    logout,
    requireAuth
  };
})();
