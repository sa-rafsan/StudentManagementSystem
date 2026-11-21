/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Student Service Module (student.js)
 * Implements CRUD, relational department lookups, multi-attribute filtering,
 * column sorting, and pagination for students.
 */

window.SMS = window.SMS || {};

SMS.StudentService = (() => {
  const STORAGE_KEY = () => SMS.Storage.KEYS.STUDENTS;

  /**
   * Get all students with department metadata attached
   */
  const getAll = () => {
    const students = SMS.Storage.getItem(STORAGE_KEY(), []);
    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
    const deptMap = new Map(departments.map(d => [d.id, d]));

    return students.map(s => {
      const dept = deptMap.get(s.departmentId);
      return {
        ...s,
        departmentName: dept ? dept.name : 'Unknown Department',
        departmentCode: dept ? dept.code : 'N/A'
      };
    });
  };

  /**
   * Get single student by ID with department info
   */
  const getById = (id) => {
    if (!id) return null;
    const all = getAll();
    return all.find(s => s.id === id) || null;
  };

  /**
   * Get student by Email
   */
  const getByEmail = (email) => {
    if (!email) return null;
    const all = getAll();
    const cleanEmail = email.trim().toLowerCase();
    return all.find(s => s.email.toLowerCase() === cleanEmail) || null;
  };

  /**
   * Create new student record
   */
  const create = (studentData) => {
    const students = SMS.Storage.getItem(STORAGE_KEY(), []);

    // Check ID and Email uniqueness
    if (students.some(s => s.id === studentData.id)) {
      throw new Error(`Student ID "${studentData.id}" already exists.`);
    }
    if (students.some(s => s.email.toLowerCase() === studentData.email.trim().toLowerCase())) {
      throw new Error(`Email "${studentData.email}" is already registered.`);
    }

    const now = new Date().toISOString();
    const newStudent = {
      id: studentData.id.trim(),
      fullName: studentData.fullName.trim(),
      email: studentData.email.trim().toLowerCase(),
      phone: studentData.phone.trim(),
      dob: studentData.dob,
      gender: studentData.gender,
      departmentId: studentData.departmentId,
      semester: studentData.semester,
      address: (studentData.address || '').trim(),
      photo: studentData.photo || '',
      enrollmentDate: studentData.enrollmentDate,
      status: studentData.status || 'Active',
      createdAt: now,
      updatedAt: now
    };

    students.unshift(newStudent); // add to top
    SMS.Storage.setItem(STORAGE_KEY(), students);
    return newStudent;
  };

  /**
   * Update existing student record
   */
  const update = (id, studentData) => {
    const students = SMS.Storage.getItem(STORAGE_KEY(), []);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error(`Student with ID "${id}" was not found.`);
    }

    // Verify email uniqueness excluding current student
    const cleanEmail = studentData.email.trim().toLowerCase();
    if (students.some(s => s.email.toLowerCase() === cleanEmail && s.id !== id)) {
      throw new Error(`Email "${studentData.email}" is already registered to another student.`);
    }

    const updatedStudent = {
      ...students[index],
      fullName: studentData.fullName.trim(),
      email: cleanEmail,
      phone: studentData.phone.trim(),
      dob: studentData.dob,
      gender: studentData.gender,
      departmentId: studentData.departmentId,
      semester: studentData.semester,
      address: (studentData.address || '').trim(),
      photo: studentData.photo !== undefined ? studentData.photo : students[index].photo,
      enrollmentDate: studentData.enrollmentDate,
      status: studentData.status || 'Active',
      updatedAt: new Date().toISOString()
    };

    students[index] = updatedStudent;
    SMS.Storage.setItem(STORAGE_KEY(), students);
    return updatedStudent;
  };

  /**
   * Delete student record
   */
  const remove = (id) => {
    let students = SMS.Storage.getItem(STORAGE_KEY(), []);
    const initialCount = students.length;
    students = students.filter(s => s.id !== id);

    if (students.length === initialCount) {
      throw new Error(`Student with ID "${id}" was not found.`);
    }

    SMS.Storage.setItem(STORAGE_KEY(), students);

    // Also dissociate from any user in sms_users
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    let usersModified = false;
    users.forEach(u => {
      if (u.studentId === id) {
        u.studentId = null;
        usersModified = true;
      }
    });
    if (usersModified) {
      SMS.Storage.setItem(SMS.Storage.KEYS.USERS, users);
    }

    return true;
  };

  /**
   * Query, Filter, Sort, and Paginate Students
   */
  const query = ({
    search = '',
    departmentId = 'ALL',
    semester = 'ALL',
    status = 'ALL',
    sortField = 'id',
    sortOrder = 'asc',
    page = 1,
    limit = 10
  } = {}) => {
    let list = getAll();

    // 1. Text Search across Name, ID, Email, Phone
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    }

    // 2. Department Filter
    if (departmentId && departmentId !== 'ALL') {
      list = list.filter(s => s.departmentId === departmentId);
    }

    // 3. Semester Filter
    if (semester && semester !== 'ALL') {
      list = list.filter(s => s.semester === semester);
    }

    // 4. Status Filter
    if (status && status !== 'ALL') {
      list = list.filter(s => s.status.toLowerCase() === status.toLowerCase());
    }

    // 5. Column Sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Numeric comparison if possible
      if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      // Date comparison if valid dates
      if (sortField.includes('Date') || sortField === 'dob' || sortField === 'createdAt') {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);

    const startIndex = (currentPage - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    const paginatedStudents = list.slice(startIndex, endIndex);

    return {
      students: paginatedStudents,
      total,
      page: currentPage,
      totalPages,
      limit,
      startIndex: total > 0 ? startIndex + 1 : 0,
      endIndex
    };
  };

  return {
    getAll,
    getById,
    getByEmail,
    create,
    update,
    remove,
    query
  };
})();
