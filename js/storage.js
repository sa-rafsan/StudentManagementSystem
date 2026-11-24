/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Storage Module (storage.js)
 * Manages LocalStorage keys for SMS core and Course Management System
 */

window.SMS = window.SMS || {};

SMS.Storage = (() => {
  // LocalStorage Keys
  const KEYS = {
    USERS: 'sms_users',
    STUDENTS: 'sms_students',
    TEACHERS: 'sms_teachers',
    DEPARTMENTS: 'sms_departments',
    SETTINGS: 'sms_settings',
    SESSION: 'sms_session',
    ATTENDANCE: 'sms_attendance',
    // Course Management System Keys
    SEMESTERS: 'semesters',
    COURSES: 'courses',
    COURSE_WEEKS: 'courseWeeks',
    ENROLLMENTS: 'enrollments',
    COURSE_ATTENDANCE: 'attendance',
    ASSIGNMENTS: 'assignments',
    QUIZZES: 'quizzes',
    SUBMISSIONS: 'submissions',
    QUIZ_ATTEMPTS: 'quizAttempts',
    MARKS: 'marks',
    RESULTS: 'results'
  };

  /**
   * Pre-calculated PBKDF2 parameters for Default Demo Accounts (100,000 iterations, SHA-256)
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
      teacherId: null,
      createdAt: '2024-01-01T08:00:00.000Z'
    },
    {
      id: 'USR-002',
      name: 'Sarah Jenkins',
      email: 'student@example.com',
      role: 'Student',
      salt: '1234567890abcdef1234567890abcdef',
      passwordHash: 'fcbc8da2717f3c27afb9c77535c0f54daddd0395a736b1e17b9c8c51e64c576c', // Default password: 12345
      studentId: 'STU-2024-001',
      isDefaultPassword: true,
      teacherId: null,
      createdAt: '2024-01-05T09:30:00.000Z'
    },
    {
      id: 'USR-003',
      name: 'Prof. Alan Turing',
      email: 'teacher@example.com',
      role: 'Teacher',
      salt: '746561636865725f73616c745f313233',
      passwordHash: '150e52b3689ce8cd5731294c68fcff03fb40bf43b0efb8e0d0514a0ad0e5cf0f',
      studentId: null,
      teacherId: 'TCH-001',
      createdAt: '2024-01-02T10:00:00.000Z'
    },
    {
      id: 'USR-004',
      name: 'Dr. Ada Lovelace',
      email: 'ada@example.com',
      role: 'Teacher',
      salt: '91466f68f41ed01477fb1fa9d4e8d964',
      passwordHash: 'b55d08246a7c37485a09eae02669a055adfa32b074d8e65d05e67b6dd86c31a4',
      studentId: null,
      teacherId: 'TCH-002',
      createdAt: '2024-01-03T10:00:00.000Z'
    }
  ];

  /**
   * Demo Teachers
   */
  const DEMO_TEACHERS = [
    {
      id: 'TCH-001',
      userId: 'USR-003',
      name: 'Prof. Alan Turing',
      email: 'teacher@example.com',
      department: 'Computer Science & Engineering',
      departmentId: 'DEP-001',
      designation: 'Senior Professor',
      specialization: 'Algorithms, Artificial Intelligence & Computation',
      phone: '+1 (555) 789-1001',
      createdAt: '2024-01-02T10:00:00.000Z'
    },
    {
      id: 'TCH-002',
      userId: 'USR-004',
      name: 'Dr. Ada Lovelace',
      email: 'ada@example.com',
      department: 'Computer Science & Engineering',
      departmentId: 'DEP-001',
      designation: 'Associate Professor',
      specialization: 'Software Architecture, Web Technologies & Database Systems',
      phone: '+1 (555) 789-1002',
      createdAt: '2024-01-03T10:00:00.000Z'
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
      semester: 'Fall 2026',
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
      semester: 'Fall 2026',
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
      departmentId: 'DEP-001',
      semester: 'Fall 2026',
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
      departmentId: 'DEP-001',
      semester: 'Fall 2026',
      address: '450 University Avenue, Palo Alto, CA 94301',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
      enrollmentDate: '2022-09-15',
      status: 'Active',
      createdAt: '2022-09-15T14:45:00.000Z',
      updatedAt: '2023-12-02T16:20:00.000Z'
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
   * Demo Semesters (Rule: Each semester contains exactly 4 courses)
   */
  const DEMO_SEMESTERS = [
    {
      id: 'SEM-001',
      name: 'Fall 2026',
      academicYear: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2026-12-20',
      status: 'Active',
      courseIds: ['CRS-001', 'CRS-002', 'CRS-003', 'CRS-004'],
      createdAt: '2026-08-01T08:00:00.000Z'
    },
    {
      id: 'SEM-002',
      name: 'Spring 2027',
      academicYear: '2026-2027',
      startDate: '2027-01-15',
      endDate: '2027-05-15',
      status: 'Upcoming',
      courseIds: ['CRS-005', 'CRS-006', 'CRS-007', 'CRS-008'],
      createdAt: '2026-08-01T08:30:00.000Z'
    }
  ];

  /**
   * Demo Courses (Each course belongs to a semester and has 12 weeks)
   */
  const DEMO_COURSES = [
    {
      id: 'CRS-001',
      code: 'CSE-301',
      name: 'Data Structures and Algorithms',
      description: 'Foundations of data structures, algorithm complexity analysis, graph algorithms, and dynamic programming.',
      teacherId: 'TCH-001',
      semesterId: 'SEM-001',
      totalWeeks: 12,
      startDate: '2026-09-01',
      endDate: '2026-11-24',
      createdAt: '2026-08-15T09:00:00.000Z'
    },
    {
      id: 'CRS-002',
      code: 'CSE-302',
      name: 'Database Management Systems',
      description: 'Relational algebra, SQL, indexing, transaction management, ACID properties, and database design principles.',
      teacherId: 'TCH-002',
      semesterId: 'SEM-001',
      totalWeeks: 12,
      startDate: '2026-09-01',
      endDate: '2026-11-24',
      createdAt: '2026-08-15T09:15:00.000Z'
    },
    {
      id: 'CRS-003',
      code: 'CSE-303',
      name: 'Web Engineering & Architecture',
      description: 'Modern full-stack web applications, REST APIs, client-side frameworks, security practices, and deployment.',
      teacherId: 'TCH-001',
      semesterId: 'SEM-001',
      totalWeeks: 12,
      startDate: '2026-09-01',
      endDate: '2026-11-24',
      createdAt: '2026-08-15T09:30:00.000Z'
    },
    {
      id: 'CRS-004',
      code: 'CSE-304',
      name: 'Software Engineering & Agile Practices',
      description: 'SDLC, Agile Scrum methodologies, UML modeling, software testing, quality assurance, and project management.',
      teacherId: 'TCH-002',
      semesterId: 'SEM-001',
      totalWeeks: 12,
      startDate: '2026-09-01',
      endDate: '2026-11-24',
      createdAt: '2026-08-15T09:45:00.000Z'
    },
    {
      id: 'CRS-005',
      code: 'CSE-401',
      name: 'Artificial Intelligence & Machine Learning',
      description: 'Search algorithms, supervised/unsupervised machine learning, neural networks, and computer vision.',
      teacherId: 'TCH-001',
      semesterId: 'SEM-002',
      totalWeeks: 12,
      startDate: '2027-01-15',
      endDate: '2027-04-15',
      createdAt: '2026-08-15T10:00:00.000Z'
    },
    {
      id: 'CRS-006',
      code: 'CSE-402',
      name: 'Operating Systems & Concurrency',
      description: 'Processes, threads, CPU scheduling, synchronization, deadlocks, and virtual memory management.',
      teacherId: 'TCH-002',
      semesterId: 'SEM-002',
      totalWeeks: 12,
      startDate: '2027-01-15',
      endDate: '2027-04-15',
      createdAt: '2026-08-15T10:15:00.000Z'
    },
    {
      id: 'CRS-007',
      code: 'CSE-403',
      name: 'Computer Networks & Security',
      description: 'OSI/TCP-IP models, routing protocols, transport layer flow control, cryptographic protocols, and cybersecurity.',
      teacherId: 'TCH-001',
      semesterId: 'SEM-002',
      totalWeeks: 12,
      startDate: '2027-01-15',
      endDate: '2027-04-15',
      createdAt: '2026-08-15T10:30:00.000Z'
    },
    {
      id: 'CRS-008',
      code: 'CSE-404',
      name: 'Cloud Computing & Distributed Systems',
      description: 'Microservices, distributed consensus algorithms, virtualization, containerization, and serverless architectures.',
      teacherId: 'TCH-002',
      semesterId: 'SEM-002',
      totalWeeks: 12,
      startDate: '2027-01-15',
      endDate: '2027-04-15',
      createdAt: '2026-08-15T10:45:00.000Z'
    }
  ];

  /**
   * Helper to generate 12 weeks for a course
   */
  const generateWeeksForCourse = (courseId) => {
    const weekTitles = [
      'Course Orientation, Syllabus & Environment Setup',
      'Fundamental Concepts & Theoretical Principles',
      'Core Methodologies & Architectural Patterns (Phase 1 Review)',
      'Advanced Techniques & Practical Implementations',
      'Component Design & Modularity Patterns',
      'Integration, Performance & Optimization (Phase 2 Review)',
      'Specialized Case Studies & Real-World Scenarios',
      'Data Handling, Resilience & Failure Recovery',
      'Scalability, Security & Enterprise Standards (Phase 3 Review)',
      'Emerging Trends & Advanced Frameworks',
      'Capstone Project Development & Peer Review',
      'Comprehensive Course Synthesis & Final Evaluation (Phase 4 Review)'
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const weekNumber = i + 1;
      const weekPadded = String(weekNumber).padStart(2, '0');
      const phaseNum = Math.ceil(weekNumber / 3);
      return {
        id: `CW-${courseId}-W${weekPadded}`,
        courseId: courseId,
        weekNumber: weekNumber,
        title: `Week ${weekPadded}: ${weekTitles[i]}`,
        description: `In-depth study and weekly hands-on laboratory exercises for Week ${weekPadded}.`,
        learningMaterials: [
          `Lecture Slides: Week ${weekPadded} Slides (PDF)`,
          `Supplementary Notes: Lecture Summary & Code Snippets`
        ],
        resources: [
          'https://en.wikipedia.org/wiki/Computer_science',
          'https://developer.mozilla.org'
        ],
        assessmentPhase: `Phase 0${phaseNum}`,
        updatedAt: '2026-09-01T08:00:00.000Z'
      };
    });
  };

  /**
   * Demo Course Weeks for all 8 courses (each with 12 weeks = 96 weeks)
   */
  const DEMO_COURSE_WEEKS = [];
  DEMO_COURSES.forEach(crs => {
    DEMO_COURSE_WEEKS.push(...generateWeeksForCourse(crs.id));
  });

  /**
   * Demo Course Enrollments
   */
  const DEMO_ENROLLMENTS = [
    // Sarah Jenkins enrolled in all 4 Fall 2026 courses
    { id: 'ENR-001', studentId: 'STU-2024-001', courseId: 'CRS-001', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    { id: 'ENR-002', studentId: 'STU-2024-001', courseId: 'CRS-002', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    { id: 'ENR-003', studentId: 'STU-2024-001', courseId: 'CRS-003', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    { id: 'ENR-004', studentId: 'STU-2024-001', courseId: 'CRS-004', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    // Alexander Rivera enrolled in CRS-001 & CRS-002
    { id: 'ENR-005', studentId: 'STU-2024-002', courseId: 'CRS-001', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    { id: 'ENR-006', studentId: 'STU-2024-002', courseId: 'CRS-002', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    // Priya Sharma enrolled in CRS-001 & CRS-003
    { id: 'ENR-007', studentId: 'STU-2024-003', courseId: 'CRS-001', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    { id: 'ENR-008', studentId: 'STU-2024-003', courseId: 'CRS-003', semesterId: 'SEM-001', enrolledAt: '2026-09-01' },
    // David Kim enrolled in CRS-001 (low attendance demo)
    { id: 'ENR-009', studentId: 'STU-2024-004', courseId: 'CRS-001', semesterId: 'SEM-001', enrolledAt: '2026-09-01' }
  ];

  /**
   * Demo Course-Wise Attendance Records
   * Rule: Attendance Percentage = (Total Present / Total Classes) * 100
   * Sarah Jenkins: CRS-001 has 10 classes, 9 present, 1 absent => 90%
   * David Kim: CRS-001 has 10 classes, 5 present, 5 absent => 50% (< 70% restricted)
   * Alexander Rivera: CRS-001 has 10 classes, 8 present, 2 absent => 80%
   * Priya Sharma: CRS-001 has 10 classes, 8 present, 2 absent => 80%
   */
  const DEMO_COURSE_ATTENDANCE = [];
  const attendanceDates = [
    '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29', '2026-10-06',
    '2026-10-13', '2026-10-20', '2026-10-27', '2026-11-03', '2026-11-10'
  ];

  attendanceDates.forEach((date, idx) => {
    // Sarah Jenkins (CRS-001: 9 present, 1 absent on idx 4)
    DEMO_COURSE_ATTENDANCE.push({
      id: `CATT-CRS001-STU001-${idx + 1}`,
      courseId: 'CRS-001',
      studentId: 'STU-2024-001',
      date: date,
      status: idx === 4 ? 'Absent' : 'Present',
      notes: idx === 4 ? 'Medical leave' : 'On time'
    });
    // Sarah Jenkins (CRS-002: 10 present => 100%)
    DEMO_COURSE_ATTENDANCE.push({
      id: `CATT-CRS002-STU001-${idx + 1}`,
      courseId: 'CRS-002',
      studentId: 'STU-2024-001',
      date: date,
      status: 'Present',
      notes: 'Active engagement'
    });
    // David Kim (CRS-001: 5 present, 5 absent => 50%, below 70% threshold!)
    DEMO_COURSE_ATTENDANCE.push({
      id: `CATT-CRS001-STU004-${idx + 1}`,
      courseId: 'CRS-001',
      studentId: 'STU-2024-004',
      date: date,
      status: idx % 2 === 0 ? 'Present' : 'Absent',
      notes: idx % 2 === 0 ? 'Present' : 'Unexcused'
    });
    // Alexander Rivera (CRS-001: 8 present, 2 absent => 80%)
    DEMO_COURSE_ATTENDANCE.push({
      id: `CATT-CRS001-STU002-${idx + 1}`,
      courseId: 'CRS-001',
      studentId: 'STU-2024-002',
      date: date,
      status: (idx === 3 || idx === 7) ? 'Absent' : 'Present',
      notes: ''
    });
    // Priya Sharma (CRS-001: 8 present, 2 absent => 80%)
    DEMO_COURSE_ATTENDANCE.push({
      id: `CATT-CRS001-STU003-${idx + 1}`,
      courseId: 'CRS-001',
      studentId: 'STU-2024-003',
      date: date,
      status: (idx === 2 || idx === 8) ? 'Absent' : 'Present',
      notes: ''
    });
  });

  /**
   * Helper to generate standardized assignments for courses
   */
  const generateAssignmentsForCourse = (course) => {
    const phases = [
      { num: 1, title: 'Phase 01 Assessment: Core Fundamentals & Principles', desc: `Practical implementation and analysis of foundational topics for ${course.name}.` },
      { num: 2, title: 'Phase 02 Assessment: Applied Methods & Architectural Design', desc: `Design, modular development, and benchmarking tasks for ${course.name}.` },
      { num: 3, title: 'Phase 03 Assessment: Advanced Optimization & Problem Solving', desc: `Complex problem solving, performance profiling, and case studies for ${course.name}.` },
      { num: 4, title: 'Phase 04 Capstone: Comprehensive System Project', desc: `End-to-end project implementation, documentation, and evaluation for ${course.name}.` }
    ];

    return phases.map(p => ({
      id: `ASN-${course.id}-P${p.num}`,
      courseId: course.id,
      phase: `Phase 0${p.num}`,
      phaseNumber: p.num,
      title: `${course.code} - ${p.title}`,
      description: p.desc,
      totalMarks: 25,
      deadline: new Date(Date.now() + (p.num * 21) * 86400000).toISOString(),
      createdAt: '2026-09-02T10:00:00.000Z'
    }));
  };

  /**
   * Helper to generate standardized in-platform 4-choice quizzes for courses
   */
  const generateQuizzesForCourse = (course) => {
    const phases = [
      {
        num: 1,
        title: `${course.code} - Quiz 01: Core Concepts & Principles`,
        desc: `Timed 4-choice assessment testing fundamental concepts of ${course.name}.`,
        questions: [
          {
            id: `${course.id}-Q1-1`,
            text: `What is the primary objective of ${course.name}?`,
            marks: 5,
            options: ['Optimizing system architecture and efficiency', 'Manual paperwork computation', 'Temporary hardware assembly', 'Deprecated legacy backup'],
            correctAnswer: 'Optimizing system architecture and efficiency'
          },
          {
            id: `${course.id}-Q1-2`,
            text: `Which core methodology is fundamental to ${course.code}?`,
            marks: 5,
            options: ['Structured systematic engineering and validation', 'Random trial without verification', 'Ignoring edge boundary scenarios', 'Unverified heuristic assumptions'],
            correctAnswer: 'Structured systematic engineering and validation'
          },
          {
            id: `${course.id}-Q1-3`,
            text: `In Phase 01 evaluation, what metric provides the best baseline evaluation?`,
            marks: 5,
            options: ['Asymptotic complexity and resource correctness', 'Code line length solely', 'Random execution frequency', 'Visual font size selection'],
            correctAnswer: 'Asymptotic complexity and resource correctness'
          },
          {
            id: `${course.id}-Q1-4`,
            text: `Which data abstraction standard ensures reliable operation?`,
            marks: 5,
            options: ['Encapsulation and strict interface contracts', 'Global mutable public state', 'Direct circular memory dependencies', 'Unchecked memory buffer writes'],
            correctAnswer: 'Encapsulation and strict interface contracts'
          },
          {
            id: `${course.id}-Q1-5`,
            text: `What is the recommended approach when validating initial outputs?`,
            marks: 5,
            options: ['Comprehensive unit testing with boundary cases', 'Immediate production deployment without tests', 'Manual console visual estimation', 'Suppressing all runtime exceptions'],
            correctAnswer: 'Comprehensive unit testing with boundary cases'
          }
        ]
      },
      {
        num: 2,
        title: `${course.code} - Quiz 02: Structural Design & Applied Methodologies`,
        desc: `Timed assessment on intermediate modules and implementation strategies.`,
        questions: [
          {
            id: `${course.id}-Q2-1`,
            text: `Which architectural pattern provides optimal modularity for ${course.name}?`,
            marks: 5,
            options: ['Layered decoupling with clear interfaces', 'Tightly coupled monolithic procedures', 'Single massive God-class pattern', 'Ignoring separation of concerns'],
            correctAnswer: 'Layered decoupling with clear interfaces'
          },
          {
            id: `${course.id}-Q2-2`,
            text: `When evaluating system bottlenecks in Phase 02, what should be profiled first?`,
            marks: 5,
            options: ['CPU and I/O latency hotspots', 'Variable naming conventions', 'Source code indentation style', 'README documentation length'],
            correctAnswer: 'CPU and I/O latency hotspots'
          },
          {
            id: `${course.id}-Q2-3`,
            text: `What ensures thread-safety or concurrency control in modern pipelines?`,
            marks: 5,
            options: ['Mutual exclusion locks and atomic operations', 'Ignoring race conditions', 'Unsynchronized shared memory writes', 'Disabling interrupts globally'],
            correctAnswer: 'Mutual exclusion locks and atomic operations'
          },
          {
            id: `${course.id}-Q2-4`,
            text: `Which caching strategy balances memory footprint with high hit-rate?`,
            marks: 5,
            options: ['Least Recently Used (LRU) policy', 'Random replacement without tracking', 'Never evicting any cache entries', 'Always evicting the most frequent items'],
            correctAnswer: 'Least Recently Used (LRU) policy'
          },
          {
            id: `${course.id}-Q2-5`,
            text: `What is the significance of idempotent operations in distributed routines?`,
            marks: 5,
            options: ['Repeated identical requests yield the same state', 'Requests cannot be retried safely', 'Every request changes state nondeterministically', 'Operations fail upon network delays'],
            correctAnswer: 'Repeated identical requests yield the same state'
          }
        ]
      },
      {
        num: 3,
        title: `${course.code} - Quiz 03: Advanced Optimization & Protocols`,
        desc: `Timed assessment on advanced techniques, algorithms, and protocols.`,
        questions: [
          {
            id: `${course.id}-Q3-1`,
            text: `Which technique effectively avoids exponential time blowup?`,
            marks: 5,
            options: ['Dynamic programming and memoization', 'Brute force exhaustive permutations', 'Recursive calls without base cases', 'Random search sampling'],
            correctAnswer: 'Dynamic programming and memoization'
          },
          {
            id: `${course.id}-Q3-2`,
            text: `What provides optimal fault-tolerance in modern network/distributed systems?`,
            marks: 5,
            options: ['Consensus protocols and redundant failover replicas', 'Single point of failure architectures', 'Unencrypted broadcast packets', 'Disabling timeout thresholds'],
            correctAnswer: 'Consensus protocols and redundant failover replicas'
          },
          {
            id: `${course.id}-Q3-3`,
            text: `In query and resource optimization, what structure accelerates lookup queries?`,
            marks: 5,
            options: ['B-Tree / Hash indexing structures', 'Unordered flat text files', 'Full sequential table scans only', 'Random memory paging'],
            correctAnswer: 'B-Tree / Hash indexing structures'
          },
          {
            id: `${course.id}-Q3-4`,
            text: `What is the role of cryptographic hashing in data integrity?`,
            marks: 5,
            options: ['Tamper-evident verification via one-way digest', 'Reversible encryption without keys', 'Compressing video files losslessly', 'Increasing transmission latency'],
            correctAnswer: 'Tamper-evident verification via one-way digest'
          },
          {
            id: `${course.id}-Q3-5`,
            text: `Which mechanism prevents deadlock among competing concurrent transactions?`,
            marks: 5,
            options: ['Strict resource ordering and cycle detection', 'Allowing hold-and-wait without limits', 'Infinite lock acquisition wait times', 'Random thread termination'],
            correctAnswer: 'Strict resource ordering and cycle detection'
          }
        ]
      },
      {
        num: 4,
        title: `${course.code} - Quiz 04: Capstone Evaluation & System Scalability`,
        desc: `Comprehensive phase 04 assessment testing end-to-end mastery.`,
        questions: [
          {
            id: `${course.id}-Q4-1`,
            text: `What is the cornerstone principle for high-availability scalability?`,
            marks: 5,
            options: ['Horizontal stateless scaling with load balancers', 'Monolithic vertical hardware upgrades only', 'Single server with no backup instances', 'Hardcoded IP dependencies'],
            correctAnswer: 'Horizontal stateless scaling with load balancers'
          },
          {
            id: `${course.id}-Q4-2`,
            text: `In final capstone deployment, which practice ensures zero-downtime releases?`,
            marks: 5,
            options: ['Blue-Green or Canary deployment strategies', 'Stopping the database during peak traffic', 'Direct unversioned hot-patching on production', 'Disabling health checks'],
            correctAnswer: 'Blue-Green or Canary deployment strategies'
          },
          {
            id: `${course.id}-Q4-3`,
            text: `Which metric is most vital for evaluating real-time service SLAs?`,
            marks: 5,
            options: ['P99 response latency and error budget rate', 'Total lines of commented code', 'Frequency of server reboots', 'Size of developer wallpaper'],
            correctAnswer: 'P99 response latency and error budget rate'
          },
          {
            id: `${course.id}-Q4-4`,
            text: `How should sensitive credentials and API tokens be managed securely?`,
            marks: 5,
            options: ['Environment secret stores and vault injection', 'Hardcoded in public client-side JavaScript', 'Stored in plain text files in repository', 'Passed via clear-text URL parameters'],
            correctAnswer: 'Environment secret stores and vault injection'
          },
          {
            id: `${course.id}-Q4-5`,
            text: `What guarantees eventual data consistency across partition-tolerant services?`,
            marks: 5,
            options: ['Event-driven messaging and reconciliation logs', 'Ignoring network splits completely', 'Blocking all nodes indefinitely', 'Discarding all incoming writes'],
            correctAnswer: 'Event-driven messaging and reconciliation logs'
          }
        ]
      }
    ];

    return phases.map(p => ({
      id: `QZ-${course.id}-P${p.num}`,
      courseId: course.id,
      phase: `Phase 0${p.num}`,
      phaseNumber: p.num,
      title: p.title,
      description: p.desc,
      durationMinutes: 20,
      totalMarks: 25,
      deadline: new Date(Date.now() + (p.num * 21) * 86400000).toISOString(),
      questions: p.questions,
      createdAt: '2026-09-02T10:00:00.000Z'
    }));
  };

  /**
   * Demo Assignments (4 assessment phases: Phase 1 (W1-3), Phase 2 (W4-6), Phase 3 (W7-9), Phase 4 (W10-12))
   */
  const DEMO_ASSIGNMENTS = [
    {
      id: 'ASN-001',
      courseId: 'CRS-001',
      phase: 'Phase 01',
      phaseNumber: 1,
      title: 'Assignment 01: Algorithm Complexity & Recursion Analysis',
      description: 'Implement asymptotic analysis (Big-O, Omega, Theta) and benchmark recursive vs iterative implementations.',
      totalMarks: 25,
      deadline: '2026-09-25T23:59:00.000Z',
      createdAt: '2026-09-02T10:00:00.000Z'
    },
    {
      id: 'ASN-002',
      courseId: 'CRS-001',
      phase: 'Phase 02',
      phaseNumber: 2,
      title: 'Assignment 02: Balanced Search Trees & Hash Maps',
      description: 'Design an AVL tree insertion and deletion routine with collision-resistant hash table implementation.',
      totalMarks: 25,
      deadline: '2026-10-16T23:59:00.000Z',
      createdAt: '2026-09-26T10:00:00.000Z'
    },
    {
      id: 'ASN-003',
      courseId: 'CRS-001',
      phase: 'Phase 03',
      phaseNumber: 3,
      title: 'Assignment 03: Graph Traversals & Shortest Paths',
      description: 'Implement Dijkstra and Bellman-Ford algorithms to find shortest routes in a directed acyclic graph.',
      totalMarks: 25,
      deadline: '2026-11-06T23:59:00.000Z',
      createdAt: '2026-10-17T10:00:00.000Z'
    },
    {
      id: 'ASN-004',
      courseId: 'CRS-001',
      phase: 'Phase 04',
      phaseNumber: 4,
      title: 'Assignment 04: Dynamic Programming & NP-Completeness',
      description: 'Solve the 0/1 Knapsack problem and Longest Common Subsequence with optimal space complexity.',
      totalMarks: 25,
      deadline: '2026-11-28T23:59:00.000Z',
      createdAt: '2026-11-07T10:00:00.000Z'
    },
    // CRS-002 Assignments
    {
      id: 'ASN-005',
      courseId: 'CRS-002',
      phase: 'Phase 01',
      phaseNumber: 1,
      title: 'Assignment 01: Relational Algebra & ER Modeling',
      description: 'Construct enhanced Entity-Relationship diagrams and formalize relational algebra queries.',
      totalMarks: 25,
      deadline: '2026-09-25T23:59:00.000Z',
      createdAt: '2026-09-02T10:00:00.000Z'
    },
    {
      id: 'ASN-006',
      courseId: 'CRS-002',
      phase: 'Phase 02',
      phaseNumber: 2,
      title: 'Assignment 02: Advanced SQL Joins & Subqueries',
      description: 'Formulate window functions, CTEs, and recursive SQL queries on an enterprise schema.',
      totalMarks: 25,
      deadline: '2026-10-16T23:59:00.000Z',
      createdAt: '2026-09-26T10:00:00.000Z'
    },
    {
      id: 'ASN-007',
      courseId: 'CRS-002',
      phase: 'Phase 03',
      phaseNumber: 3,
      title: 'Assignment 03: Normalization & BCNF Decomposition',
      description: 'Perform functional dependency analysis and normalize tables up to BCNF and 4NF.',
      totalMarks: 25,
      deadline: '2026-11-06T23:59:00.000Z',
      createdAt: '2026-10-17T10:00:00.000Z'
    },
    {
      id: 'ASN-008',
      courseId: 'CRS-002',
      phase: 'Phase 04',
      phaseNumber: 4,
      title: 'Assignment 04: Transaction Management & ACID Isolation',
      description: 'Simulate two-phase locking and write concurrency resolution scripts for multi-user workloads.',
      totalMarks: 25,
      deadline: '2026-11-28T23:59:00.000Z',
      createdAt: '2026-11-07T10:00:00.000Z'
    }
  ];

  /**
   * Demo Quizzes (4 assessment phases: Phase 1 (W1-3), Phase 2 (W4-6), Phase 3 (W7-9), Phase 4 (W10-12))
   * Each quiz consists of direct in-platform 4-choice questions.
   */
  const DEMO_QUIZZES = [
    {
      id: 'QZ-001',
      courseId: 'CRS-001',
      phase: 'Phase 01',
      phaseNumber: 1,
      title: 'Quiz 01: Computational Complexity & Elementary Data Structures',
      description: 'Timed assessment covering Big-O notation, linked lists, and stack/queue primitives.',
      durationMinutes: 20,
      totalMarks: 25,
      deadline: '2026-09-26T23:59:00.000Z',
      questions: [
        {
          id: 'Q1',
          text: 'What is the worst-case time complexity of accessing an element in an array by index?',
          marks: 5,
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
          correctAnswer: 'O(1)'
        },
        {
          id: 'Q2',
          text: 'Which data structure follows the Last-In First-Out (LIFO) operational order?',
          marks: 5,
          options: ['Queue', 'Stack', 'Priority Heap', 'Binary Search Tree'],
          correctAnswer: 'Stack'
        },
        {
          id: 'Q3',
          text: 'Which searching technique requires the input array to be strictly ordered or sorted?',
          marks: 5,
          options: ['Linear Search', 'Binary Search', 'Breadth-First Search', 'Depth-First Search'],
          correctAnswer: 'Binary Search'
        },
        {
          id: 'Q4',
          text: 'In a singly linked list, what is the time complexity of deleting the head node given a head pointer?',
          marks: 5,
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
          correctAnswer: 'O(1)'
        },
        {
          id: 'Q5',
          text: 'What does auxiliary space complexity strictly represent in algorithm analysis?',
          marks: 5,
          options: [
            'Extra temporary memory used excluding input size',
            'Total disk space occupied by source code',
            'Total network bandwidth consumed during execution',
            'The total CPU register cache capacity'
          ],
          correctAnswer: 'Extra temporary memory used excluding input size'
        }
      ],
      createdAt: '2026-09-03T10:00:00.000Z'
    },
    {
      id: 'QZ-002',
      courseId: 'CRS-001',
      phase: 'Phase 02',
      phaseNumber: 2,
      title: 'Quiz 02: Trees, Priority Queues & Sorting Algorithms',
      description: 'Assessment on binary trees, heap properties, quicksort, and mergesort operations.',
      durationMinutes: 20,
      totalMarks: 25,
      deadline: '2026-10-17T23:59:00.000Z',
      questions: [
        {
          id: 'Q2-1',
          text: 'What is the average-case runtime complexity of QuickSort?',
          marks: 5,
          options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
          correctAnswer: 'O(n log n)'
        },
        {
          id: 'Q2-2',
          text: 'In a min-heap structure, what is the relationship between a parent node and its child nodes?',
          marks: 5,
          options: [
            'Parent key is less than or equal to children keys',
            'Parent key is strictly greater than children keys',
            'Parent key equals the sum of children keys',
            'Parent key must always be an odd integer'
          ],
          correctAnswer: 'Parent key is less than or equal to children keys'
        },
        {
          id: 'Q2-3',
          text: 'Which self-balancing binary search tree maintains O(log n) height using balance factors and rotations?',
          marks: 5,
          options: ['Standard BST', 'AVL Tree', 'B-Tree of order 10', 'Segment Tree'],
          correctAnswer: 'AVL Tree'
        },
        {
          id: 'Q2-4',
          text: 'What is the auxiliary space requirement of standard recursive MergeSort on an array?',
          marks: 5,
          options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'],
          correctAnswer: 'O(n)'
        },
        {
          id: 'Q2-5',
          text: 'How does separate chaining resolve collision within a hash table?',
          marks: 5,
          options: [
            'Stores colliding records in a linked list at each bucket',
            'Probes the next contiguous array slot linearly',
            'Discards the conflicting keys completely',
            'Increases the system clock speed'
          ],
          correctAnswer: 'Stores colliding records in a linked list at each bucket'
        }
      ],
      createdAt: '2026-09-27T10:00:00.000Z'
    },
    {
      id: 'QZ-003',
      courseId: 'CRS-001',
      phase: 'Phase 03',
      phaseNumber: 3,
      title: 'Quiz 03: Graph Algorithms & Minimum Spanning Trees',
      description: 'Assessment on BFS, DFS, Kruskal, Prim, and shortest path algorithms.',
      durationMinutes: 20,
      totalMarks: 25,
      deadline: '2026-11-07T23:59:00.000Z',
      questions: [
        {
          id: 'Q3-1',
          text: 'Which algorithm finds single-source shortest paths in graphs with non-negative edge weights?',
          marks: 5,
          options: ['Dijkstra Algorithm', 'Prim Algorithm', 'Kruskal Algorithm', 'Floyd-Warshall'],
          correctAnswer: 'Dijkstra Algorithm'
        },
        {
          id: 'Q3-2',
          text: 'Which core data structure is used by Breadth-First Search (BFS) to manage node exploration?',
          marks: 5,
          options: ['Stack', 'Queue', 'Disjoint Set', 'Binary Heap'],
          correctAnswer: 'Queue'
        },
        {
          id: 'Q3-3',
          text: 'Kruskal Minimum Spanning Tree algorithm utilizes which data structure to detect cycles efficiently?',
          marks: 5,
          options: ['Disjoint Set (Union-Find)', 'Hash Map', 'Priority Queue', 'Suffix Automaton'],
          correctAnswer: 'Disjoint Set (Union-Find)'
        },
        {
          id: 'Q3-4',
          text: 'How many edges does a Minimum Spanning Tree contain for a connected graph with V vertices?',
          marks: 5,
          options: ['V - 1', 'V', 'V + 1', '2 * V'],
          correctAnswer: 'V - 1'
        },
        {
          id: 'Q3-5',
          text: 'Why does Dijkstra algorithm fail on graphs containing negative edge weights?',
          marks: 5,
          options: [
            'Greedy assumption fails when negative edges can decrease known paths',
            'The algorithm encounters a division by zero error',
            'It exceeds the 64-bit integer limit immediately',
            'Negative weights convert directed graphs into undirected trees'
          ],
          correctAnswer: 'Greedy assumption fails when negative edges can decrease known paths'
        }
      ],
      createdAt: '2026-10-18T10:00:00.000Z'
    },
    {
      id: 'QZ-004',
      courseId: 'CRS-001',
      phase: 'Phase 04',
      phaseNumber: 4,
      title: 'Quiz 04: Dynamic Programming, Greedy Algorithms & NP Problems',
      description: 'Final assessment covering optimal substructure, memoization, and polynomial time reductions.',
      durationMinutes: 20,
      totalMarks: 25,
      deadline: '2026-11-29T23:59:00.000Z',
      questions: [
        {
          id: 'Q4-1',
          text: 'Which fundamental property is mandatory for applying Dynamic Programming?',
          marks: 5,
          options: ['Overlapping subproblems', 'Strictly unsorted keys', 'Acyclic random graphs', 'Constant time sorting'],
          correctAnswer: 'Overlapping subproblems'
        },
        {
          id: 'Q4-2',
          text: 'What is the primary operational difference between Tabulation and Memoization?',
          marks: 5,
          options: [
            'Tabulation is iterative bottom-up; memoization is recursive top-down',
            'Tabulation only works for floating numbers; memoization for strings',
            'Memoization is strictly O(1) space while tabulation is O(n!)',
            'Tabulation requires GPU hardware acceleration'
          ],
          correctAnswer: 'Tabulation is iterative bottom-up; memoization is recursive top-down'
        },
        {
          id: 'Q4-3',
          text: 'The standard 0/1 Knapsack optimization problem belongs to which complexity classification?',
          marks: 5,
          options: ['NP-Complete', 'Linear Time P', 'Constant Time O(1)', 'Logarithmic Time'],
          correctAnswer: 'NP-Complete'
        },
        {
          id: 'Q4-4',
          text: 'What characterizes the greedy choice property in algorithmic design?',
          marks: 5,
          options: [
            'Locally optimal decisions lead to a globally optimal solution',
            'Exhaustive search of every permutation tree',
            'Random probabilistic guesswork without heuristics',
            'Converting problems into matrix inversion routines'
          ],
          correctAnswer: 'Locally optimal decisions lead to a globally optimal solution'
        },
        {
          id: 'Q4-5',
          text: 'What is the time complexity of the dynamic programming algorithm for Longest Common Subsequence of lengths m and n?',
          marks: 5,
          options: ['O(m * n)', 'O(m + n)', 'O(2^(m+n))', 'O(1)'],
          correctAnswer: 'O(m * n)'
        }
      ],
      createdAt: '2026-11-08T10:00:00.000Z'
    }
  ];

  /**
   * Demo Submissions for Assignments
   */
  const DEMO_SUBMISSIONS = [
    // Sarah Jenkins submission for Phase 1 of CRS-001 (ASN-002, ASN-003, ASN-004 left unsubmitted for active testing)
    {
      id: 'SUB-001',
      assignmentId: 'ASN-001',
      studentId: 'STU-2024-001',
      courseId: 'CRS-001',
      submissionText: 'Completed asymptotic analysis and benchmarked Fibonacci recursion vs matrix exponentiation. Work diagram attached.',
      submissionImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" style="background:%23eff6ff;"><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%232563eb" font-family="sans-serif" font-weight="bold">Homework Solution Diagram</text></svg>',
      submittedAt: '2026-09-23T14:20:00.000Z',
      status: 'Graded',
      marksAwarded: 24,
      feedback: 'Excellent mathematical rigor and clean diagram.'
    }
  ];

  /**
   * Demo Quiz Attempts
   */
  const DEMO_QUIZ_ATTEMPTS = [
    // Sarah Jenkins attempt for Quiz 01 (Quiz 02, 03, 04 left unattempted for active testing)
    {
      id: 'QA-001',
      quizId: 'QZ-001',
      studentId: 'STU-2024-001',
      courseId: 'CRS-001',
      answers: {
        'Q1': 'O(1)',
        'Q2': 'Stack',
        'Q3': 'Binary Search',
        'Q4': 'O(1)',
        'Q5': 'Extra temporary memory used excluding input size'
      },
      autoScore: 25,
      manualScore: 0,
      totalScore: 25,
      maxMarks: 25,
      evaluated: true,
      teacherFeedback: 'Flawless score on 4-choice questions!',
      attemptedAt: '2026-09-24T15:30:00.000Z'
    }
  ];

  /**
   * Demo Marks & Calculated Results for Sarah Jenkins on CRS-001
   * Total Possible = 200 (Assignment 1-4 = 25 each, Quiz 1-4 = 25 each)
   * Sarah Jenkins obtained:
   * A1 = 24, Q1 = 24
   * A2 = 23, Q2 = 25
   * A3 = 25, Q3 = 24
   * A4 = 24, Q4 = 25
   * Total = 194 / 200 = 97% => Grade A+
   */
  const DEMO_MARKS = [
    {
      id: 'MRK-CRS001-STU001',
      courseId: 'CRS-001',
      studentId: 'STU-2024-001',
      assignment1: 24,
      quiz1: 24,
      assignment2: 23,
      quiz2: 25,
      assignment3: 25,
      quiz3: 24,
      assignment4: 24,
      quiz4: 25,
      updatedAt: '2026-11-22T10:00:00.000Z'
    }
  ];

  const DEMO_RESULTS = [
    {
      id: 'RES-CRS001-STU001',
      courseId: 'CRS-001',
      studentId: 'STU-2024-001',
      semesterId: 'SEM-001',
      assignment1: 24,
      quiz1: 24,
      assignment2: 23,
      quiz2: 25,
      assignment3: 25,
      quiz3: 24,
      assignment4: 24,
      quiz4: 25,
      totalObtained: 194,
      totalMarks: 200,
      percentage: 97,
      grade: 'A+',
      attendancePercentage: 90,
      examEligible: true,
      updatedAt: '2026-11-22T10:00:00.000Z'
    }
  ];

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
        if (window.SMS && SMS.Utils && SMS.Utils.showToast) {
          SMS.Utils.showToast('error', 'Storage Limit Exceeded', 'LocalStorage is full. Please remove some records.');
        }
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
   * Generic CRUD Collection Helpers
   */
  const getCollection = (key) => {
    return getItem(key, []);
  };

  const saveCollection = (key, items) => {
    return setItem(key, items);
  };

  const findInCollection = (key, predicate) => {
    const items = getCollection(key);
    return items.find(predicate) || null;
  };

  const filterInCollection = (key, predicate) => {
    const items = getCollection(key);
    return items.filter(predicate);
  };

  const insertIntoCollection = (key, item) => {
    const items = getCollection(key);
    if (!item.id) {
      item.id = 'ID-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    items.unshift(item);
    saveCollection(key, items);
    return item;
  };

  const updateInCollection = (key, id, updates) => {
    const items = getCollection(key);
    const index = items.findIndex(it => it.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveCollection(key, items);
    return items[index];
  };

  const deleteFromCollection = (key, id) => {
    let items = getCollection(key);
    const initialLen = items.length;
    items = items.filter(it => it.id !== id);
    saveCollection(key, items);
    return items.length < initialLen;
  };

  /**
   * Initialize Storage with Demo Data if empty or if forced
   */
  const initStorage = (forceReset = false) => {
    if (forceReset || !localStorage.getItem(KEYS.USERS)) {
      setItem(KEYS.USERS, DEMO_USERS);
    }
    if (forceReset || !localStorage.getItem(KEYS.TEACHERS)) {
      setItem(KEYS.TEACHERS, DEMO_TEACHERS);
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
    if (forceReset || !localStorage.getItem(KEYS.SEMESTERS)) {
      setItem(KEYS.SEMESTERS, DEMO_SEMESTERS);
    }
    if (forceReset || !localStorage.getItem(KEYS.COURSES)) {
      setItem(KEYS.COURSES, DEMO_COURSES);
    }
    if (forceReset || !localStorage.getItem(KEYS.COURSE_WEEKS)) {
      setItem(KEYS.COURSE_WEEKS, DEMO_COURSE_WEEKS);
    }
    if (forceReset || !localStorage.getItem(KEYS.ENROLLMENTS)) {
      setItem(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    }
    if (forceReset || !localStorage.getItem(KEYS.COURSE_ATTENDANCE)) {
      setItem(KEYS.COURSE_ATTENDANCE, DEMO_COURSE_ATTENDANCE);
    }
    if (forceReset || !localStorage.getItem(KEYS.ASSIGNMENTS)) {
      setItem(KEYS.ASSIGNMENTS, DEMO_ASSIGNMENTS);
    }
    if (forceReset || !localStorage.getItem(KEYS.QUIZZES)) {
      setItem(KEYS.QUIZZES, DEMO_QUIZZES);
    }

    // Ensure all 8 courses have complete sets of assignments and quizzes
    let assignments = getItem(KEYS.ASSIGNMENTS, []);
    let quizzes = getItem(KEYS.QUIZZES, []);
    let hasNewAsns = false;
    let hasNewQzs = false;

    DEMO_COURSES.forEach(crs => {
      const crsAsns = assignments.filter(a => a.courseId === crs.id);
      if (crsAsns.length === 0) {
        assignments.push(...generateAssignmentsForCourse(crs));
        hasNewAsns = true;
      }
      const crsQzs = quizzes.filter(q => q.courseId === crs.id);
      if (crsQzs.length === 0) {
        quizzes.push(...generateQuizzesForCourse(crs));
        hasNewQzs = true;
      }
    });

    if (hasNewAsns) setItem(KEYS.ASSIGNMENTS, assignments);
    if (hasNewQzs) setItem(KEYS.QUIZZES, quizzes);
    if (forceReset || !localStorage.getItem(KEYS.SUBMISSIONS)) {
      setItem(KEYS.SUBMISSIONS, DEMO_SUBMISSIONS);
    }
    if (forceReset || !localStorage.getItem(KEYS.QUIZ_ATTEMPTS)) {
      setItem(KEYS.QUIZ_ATTEMPTS, DEMO_QUIZ_ATTEMPTS);
    }
    if (forceReset || !localStorage.getItem(KEYS.MARKS)) {
      setItem(KEYS.MARKS, DEMO_MARKS);
    }
    if (forceReset || !localStorage.getItem(KEYS.RESULTS)) {
      setItem(KEYS.RESULTS, DEMO_RESULTS);
    }

    // Ensure all admitted students have a corresponding login user with default password '12345'
    let users = getItem(KEYS.USERS, []);
    const students = getItem(KEYS.STUDENTS, []);
    let usersUpdated = false;

    students.forEach(stu => {
      const cleanEmail = (stu.email || '').trim().toLowerCase();
      const exists = users.some(u => 
        (u.studentId && u.studentId === stu.id) || 
        (u.email && u.email.toLowerCase() === cleanEmail)
      );
      if (!exists) {
        users.push({
          id: `USR-${stu.id.replace(/[^a-zA-Z0-9]/g, '')}`,
          name: stu.fullName,
          email: cleanEmail,
          role: 'Student',
          salt: '1234567890abcdef1234567890abcdef',
          passwordHash: 'fcbc8da2717f3c27afb9c77535c0f54daddd0395a736b1e17b9c8c51e64c576c', // Default: 12345
          studentId: stu.id,
          isDefaultPassword: true,
          teacherId: null,
          createdAt: stu.createdAt || new Date().toISOString()
        });
        usersUpdated = true;
      }
    });

    if (usersUpdated) {
      setItem(KEYS.USERS, users);
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
   * Export all records as complete JSON
   */
  const exportAllData = () => {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      institution: getItem(KEYS.SETTINGS)?.institutionName || 'University',
      users: getItem(KEYS.USERS, []),
      teachers: getItem(KEYS.TEACHERS, []),
      students: getItem(KEYS.STUDENTS, []),
      departments: getItem(KEYS.DEPARTMENTS, []),
      semesters: getItem(KEYS.SEMESTERS, []),
      courses: getItem(KEYS.COURSES, []),
      courseWeeks: getItem(KEYS.COURSE_WEEKS, []),
      enrollments: getItem(KEYS.ENROLLMENTS, []),
      attendance: getItem(KEYS.COURSE_ATTENDANCE, []),
      assignments: getItem(KEYS.ASSIGNMENTS, []),
      quizzes: getItem(KEYS.QUIZZES, []),
      submissions: getItem(KEYS.SUBMISSIONS, []),
      quizAttempts: getItem(KEYS.QUIZ_ATTEMPTS, []),
      marks: getItem(KEYS.MARKS, []),
      results: getItem(KEYS.RESULTS, []),
      settings: getItem(KEYS.SETTINGS, {})
    };
  };

  /**
   * Import all records from JSON
   */
  const importData = (importedJson) => {
    if (!importedJson || typeof importedJson !== 'object') {
      throw new Error('Invalid JSON format.');
    }
    let count = 0;
    if (importedJson.students && Array.isArray(importedJson.students)) {
      setItem(KEYS.STUDENTS, importedJson.students);
      count += importedJson.students.length;
    }
    if (importedJson.semesters && Array.isArray(importedJson.semesters)) {
      setItem(KEYS.SEMESTERS, importedJson.semesters);
    }
    if (importedJson.courses && Array.isArray(importedJson.courses)) {
      setItem(KEYS.COURSES, importedJson.courses);
    }
    if (importedJson.courseWeeks && Array.isArray(importedJson.courseWeeks)) {
      setItem(KEYS.COURSE_WEEKS, importedJson.courseWeeks);
    }
    if (importedJson.enrollments && Array.isArray(importedJson.enrollments)) {
      setItem(KEYS.ENROLLMENTS, importedJson.enrollments);
    }
    if (importedJson.attendance && Array.isArray(importedJson.attendance)) {
      setItem(KEYS.COURSE_ATTENDANCE, importedJson.attendance);
    }
    if (importedJson.assignments && Array.isArray(importedJson.assignments)) {
      setItem(KEYS.ASSIGNMENTS, importedJson.assignments);
    }
    if (importedJson.quizzes && Array.isArray(importedJson.quizzes)) {
      setItem(KEYS.QUIZZES, importedJson.quizzes);
    }
    if (importedJson.submissions && Array.isArray(importedJson.submissions)) {
      setItem(KEYS.SUBMISSIONS, importedJson.submissions);
    }
    if (importedJson.quizAttempts && Array.isArray(importedJson.quizAttempts)) {
      setItem(KEYS.QUIZ_ATTEMPTS, importedJson.quizAttempts);
    }
    if (importedJson.marks && Array.isArray(importedJson.marks)) {
      setItem(KEYS.MARKS, importedJson.marks);
    }
    if (importedJson.results && Array.isArray(importedJson.results)) {
      setItem(KEYS.RESULTS, importedJson.results);
    }
    return count;
  };

  return {
    KEYS,
    getItem,
    setItem,
    removeItem,
    getCollection,
    saveCollection,
    findInCollection,
    filterInCollection,
    insertIntoCollection,
    updateInCollection,
    deleteFromCollection,
    initStorage,
    resetDemoData,
    clearAllData,
    exportAllData,
    importData,
    generateWeeksForCourse,
    DEMO_USERS,
    DEMO_TEACHERS,
    DEMO_DEPARTMENTS,
    DEMO_STUDENTS,
    DEMO_SETTINGS,
    DEMO_SEMESTERS,
    DEMO_COURSES,
    DEMO_COURSE_WEEKS,
    DEMO_ENROLLMENTS,
    DEMO_COURSE_ATTENDANCE,
    DEMO_ASSIGNMENTS,
    DEMO_QUIZZES,
    DEMO_SUBMISSIONS,
    DEMO_QUIZ_ATTEMPTS,
    DEMO_MARKS,
    DEMO_RESULTS
  };
})();
