/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Storage Module (storage.js)
 * Manages LocalStorage keys: sms_users, sms_students, sms_departments, sms_settings
 */

window.SMS = window.SMS || {};

SMS.Storage = (() => {
  // LocalStorage Keys
  const KEYS = {
    USERS: 'sms_users',
    STUDENTS: 'sms_students',
    DEPARTMENTS: 'sms_departments',
    SETTINGS: 'sms_settings',
    SESSION: 'sms_session'
  };

  /**
   * Pre-calculated PBKDF2 parameters for Default Demo Accounts (100,000 iterations, SHA-256)
   * Admin: admin@example.com | Admin@123
   * Student: student@example.com | Student@123
   */
  const DEMO_USERS = [
    {
      id: 'USR-001',
      name: 'System Administrator',
      email: 'admin@example.com',
      role: 'Admin',
      salt: '31323334353637383930616263646566',
      passwordHash: 'fb5c4ed67d45bce75dbe754b33a4e614f7636c407edd376fdd85439bd5803ac4',
      studentId: null,
      createdAt: '2024-01-01T08:00:00.000Z'
    },
    {
      id: 'USR-002',
      name: 'Sarah Jenkins',
      email: 'student@example.com',
      role: 'Student',
      salt: '66656463626130393837363534333231',
      passwordHash: '73cdb97880fa64b56ef5887c7173fce65697e416a3ef64d2a7bc52122138c9f4',
      studentId: 'STU-2024-001',
      createdAt: '2024-01-05T09:30:00.000Z'
    }
  ];

  /**
   * Demo Departments
   */
  const DEMO_DEPARTMENTS = [
    {
      id: 'DEP-001',
      code: 'CSE',
      name: 'Computer Science & Engineering',
      head: 'Dr. Alan Turing',
      description: 'Software engineering, algorithms, artificial intelligence, and network systems.',
      createdAt: '2023-01-15'
    },
    {
      id: 'DEP-002',
      code: 'EEE',
      name: 'Electrical & Electronic Engineering',
      head: 'Dr. Nikola Tesla',
      description: 'Micro-electronics, telecommunications, robotics, and power systems.',
      createdAt: '2023-01-15'
    },
    {
      id: 'DEP-003',
      code: 'BBA',
      name: 'Business Administration',
      head: 'Dr. Peter Drucker',
      description: 'Strategic management, financial markets, marketing, and leadership.',
      createdAt: '2023-01-15'
    },
    {
      id: 'DEP-004',
      code: 'ME',
      name: 'Mechanical Engineering',
      head: 'Dr. James Watt',
      description: 'Thermodynamics, automotive systems, advanced materials, and manufacturing.',
      createdAt: '2023-01-15'
    },
    {
      id: 'DEP-005',
      code: 'CE',
      name: 'Civil & Environmental Engineering',
      head: 'Dr. John Smeaton',
      description: 'Structural engineering, transportation design, hydrology, and urban planning.',
      createdAt: '2023-01-15'
    }
  ];

  /**
   * Demo Students
   */
  const DEMO_STUDENTS = [
    {
      id: 'STU-2024-001',
      fullName: 'Sarah Jenkins',
      email: 'student@example.com',
      phone: '+1 (555) 234-5678',
      dob: '2003-04-15',
      gender: 'Female',
      departmentId: 'DEP-001',
      semester: '4th',
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2023-09-01',
      status: 'Active',
      createdAt: '2023-09-01T10:00:00.000Z',
      updatedAt: '2024-01-10T14:30:00.000Z'
    },
    {
      id: 'STU-2024-002',
      fullName: 'Alexander Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 (555) 345-6789',
      dob: '2002-08-22',
      gender: 'Male',
      departmentId: 'DEP-001',
      semester: '6th',
      address: '1204 Pine Hollow Road, Austin, TX 78701',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2022-09-15',
      status: 'Active',
      createdAt: '2022-09-15T11:20:00.000Z',
      updatedAt: '2023-11-05T09:15:00.000Z'
    },
    {
      id: 'STU-2024-003',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+1 (555) 456-7890',
      dob: '2004-11-03',
      gender: 'Female',
      departmentId: 'DEP-002',
      semester: '2nd',
      address: '88 Tech Boulevard, Cambridge, MA 02138',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2024-01-10',
      status: 'Active',
      createdAt: '2024-01-10T09:00:00.000Z',
      updatedAt: '2024-01-10T09:00:00.000Z'
    },
    {
      id: 'STU-2024-004',
      fullName: 'David Kim',
      email: 'david.kim@example.com',
      phone: '+1 (555) 567-8901',
      dob: '2001-05-30',
      gender: 'Male',
      departmentId: 'DEP-003',
      semester: '5th',
      address: '450 University Avenue, Palo Alto, CA 94301',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2022-09-15',
      status: 'Active',
      createdAt: '2022-09-15T14:45:00.000Z',
      updatedAt: '2023-12-02T16:20:00.000Z'
    },
    {
      id: 'STU-2024-005',
      fullName: 'Amina Yusuf',
      email: 'amina.yusuf@example.com',
      phone: '+1 (555) 678-9012',
      dob: '2003-09-18',
      gender: 'Female',
      departmentId: 'DEP-004',
      semester: '3rd',
      address: '312 Oakwood Drive, Columbus, OH 43210',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2023-09-01',
      status: 'Active',
      createdAt: '2023-09-01T13:10:00.000Z',
      updatedAt: '2023-09-01T13:10:00.000Z'
    },
    {
      id: 'STU-2024-006',
      fullName: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      phone: '+1 (555) 789-0123',
      dob: '2001-02-14',
      gender: 'Male',
      departmentId: 'DEP-005',
      semester: '7th',
      address: '670 Highland Court, Seattle, WA 98105',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2021-09-01',
      status: 'Active',
      createdAt: '2021-09-01T08:30:00.000Z',
      updatedAt: '2024-02-11T11:00:00.000Z'
    },
    {
      id: 'STU-2024-007',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 890-1234',
      dob: '2005-01-25',
      gender: 'Female',
      departmentId: 'DEP-001',
      semester: '1st',
      address: '215 College Park Way, Chicago, IL 60611',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2024-09-01',
      status: 'Active',
      createdAt: '2024-09-01T10:15:00.000Z',
      updatedAt: '2024-09-01T10:15:00.000Z'
    },
    {
      id: 'STU-2024-008',
      fullName: 'Tariq Mansoor',
      email: 'tariq.mansoor@example.com',
      phone: '+1 (555) 901-2345',
      dob: '2000-10-12',
      gender: 'Male',
      departmentId: 'DEP-002',
      semester: '8th',
      address: '502 Beacon Street, Boston, MA 02215',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2021-01-15',
      status: 'Inactive',
      createdAt: '2021-01-15T15:00:00.000Z',
      updatedAt: '2024-01-20T17:40:00.000Z'
    },
    {
      id: 'STU-2024-009',
      fullName: 'Jessica Taylor',
      email: 'jessica.taylor@example.com',
      phone: '+1 (555) 012-3456',
      dob: '2003-07-08',
      gender: 'Female',
      departmentId: 'DEP-003',
      semester: '4th',
      address: '1840 Madison Avenue, New York, NY 10035',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2023-01-10',
      status: 'Active',
      createdAt: '2023-01-10T12:00:00.000Z',
      updatedAt: '2023-01-10T12:00:00.000Z'
    },
    {
      id: 'STU-2024-010',
      fullName: 'Liam O\'Connor',
      email: 'liam.oconnor@example.com',
      phone: '+1 (555) 123-7890',
      dob: '2002-03-19',
      gender: 'Male',
      departmentId: 'DEP-004',
      semester: '6th',
      address: '934 Sunset Ridge, Denver, CO 80202',
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2022-01-15',
      status: 'Inactive',
      createdAt: '2022-01-15T11:00:00.000Z',
      updatedAt: '2023-10-18T14:10:00.000Z'
    }
  ];

  /**
   * Demo System Settings
   */
  const DEMO_SETTINGS = {
    appName: 'EduMetrics SMS',
    institutionName: 'Metropolitan University of Technology',
    academicYear: '2026-2027',
    currency: 'USD',
    recordsPerPage: 10,
    theme: 'light'
  };

  /**
   * Safe getter from LocalStorage
   */
  const getItem = (key, fallback = null) => {
    try {
      const data = localStorage.getItem(key);
      if (data === null || data === undefined) return fallback;
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading key ${key} from localStorage:`, err);
      return fallback;
    }
  };

  /**
   * Safe setter to LocalStorage
   */
  const setItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Error saving key ${key} to localStorage:`, err);
      if (err.name === 'QuotaExceededError') {
        SMS.Utils.showToast('error', 'Storage Limit Exceeded', 'LocalStorage is full. Please remove some records or images.');
      }
      return false;
    }
  };

  /**
   * Remove item from LocalStorage
   */
  const removeItem = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error(`Error removing key ${key}:`, err);
      return false;
    }
  };

  /**
   * Initialize Storage with Demo Data if empty or if forced
   */
  const initStorage = (forceReset = false) => {
    if (forceReset || !localStorage.getItem(KEYS.USERS)) {
      setItem(KEYS.USERS, DEMO_USERS);
    }
    if (forceReset || !localStorage.getItem(KEYS.DEPARTMENTS)) {
      setItem(KEYS.DEPARTMENTS, DEMO_DEPARTMENTS);
    }
    if (forceReset || !localStorage.getItem(KEYS.STUDENTS)) {
      setItem(KEYS.STUDENTS, DEMO_STUDENTS);
    }
    if (forceReset || !localStorage.getItem(KEYS.SETTINGS)) {
      setItem(KEYS.SETTINGS, DEMO_SETTINGS);
    }
  };

  /**
   * Reset application to clean demo data
   */
  const resetDemoData = () => {
    initStorage(true);
  };

  /**
   * Clear all application data
   */
  const clearAllData = () => {
    Object.values(KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
    sessionStorage.clear();
  };

  /**
   * Export all student and department records as JSON
   */
  const exportAllData = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      institution: getItem(KEYS.SETTINGS)?.institutionName || 'University',
      students: getItem(KEYS.STUDENTS, []),
      departments: getItem(KEYS.DEPARTMENTS, []),
      settings: getItem(KEYS.SETTINGS, {})
    };
    return data;
  };

  /**
   * Import student records from JSON with schema validation
   */
  const importData = (importedJson) => {
    if (!importedJson || typeof importedJson !== 'object') {
      throw new Error('Invalid JSON format.');
    }

    // Determine students array
    let studentsToImport = [];
    if (Array.isArray(importedJson)) {
      studentsToImport = importedJson;
    } else if (Array.isArray(importedJson.students)) {
      studentsToImport = importedJson.students;
    } else {
      throw new Error('No students array found in imported file.');
    }

    if (studentsToImport.length === 0) {
      throw new Error('The imported file contains no student records.');
    }

    // Validate each student structure
    const validStudents = [];
    const existingDepartments = getItem(KEYS.DEPARTMENTS, []);
    const validDeptIds = new Set(existingDepartments.map(d => d.id));

    studentsToImport.forEach((s, idx) => {
      if (!s.fullName || !s.email) {
        throw new Error(`Record #${idx + 1} is missing required fields (fullName or email).`);
      }

      // Ensure unique student ID or generate one
      const studentId = s.id || `STU-${new Date().getFullYear()}-${String(100 + idx).padStart(3, '0')}`;
      
      // Ensure department exists or default to first valid department
      let deptId = s.departmentId;
      if (!validDeptIds.has(deptId)) {
        deptId = existingDepartments[0] ? existingDepartments[0].id : 'DEP-001';
      }

      validStudents.push({
        id: studentId,
        fullName: String(s.fullName).trim(),
        email: String(s.email).trim().toLowerCase(),
        phone: s.phone || '',
        dob: s.dob || '2000-01-01',
        gender: ['Male', 'Female', 'Other'].includes(s.gender) ? s.gender : 'Other',
        departmentId: deptId,
        semester: s.semester || '1st',
        address: s.address || '',
        photo: s.photo || '',
        enrollmentDate: s.enrollmentDate || new Date().toISOString().split('T')[0],
        status: s.status === 'Inactive' ? 'Inactive' : 'Active',
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Optionally import departments if present
    if (importedJson.departments && Array.isArray(importedJson.departments)) {
      const currentDepts = getItem(KEYS.DEPARTMENTS, []);
      const mergedDepts = [...currentDepts];
      importedJson.departments.forEach(dept => {
        if (dept.id && !mergedDepts.some(d => d.id === dept.id)) {
          mergedDepts.push(dept);
        }
      });
      setItem(KEYS.DEPARTMENTS, mergedDepts);
    }

    // Save imported students
    setItem(KEYS.STUDENTS, validStudents);
    return validStudents.length;
  };

  return {
    KEYS,
    getItem,
    setItem,
    removeItem,
    initStorage,
    resetDemoData,
    clearAllData,
    exportAllData,
    importData,
    DEMO_USERS,
    DEMO_DEPARTMENTS,
    DEMO_STUDENTS,
    DEMO_SETTINGS
  };
})();
