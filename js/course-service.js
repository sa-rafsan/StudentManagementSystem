/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Course & Semester Service (course-service.js)
 * Manages Semesters, Courses (12 weeks structure), Weekly content, and Enrollments
 */

window.SMS = window.SMS || {};

SMS.CourseService = (() => {
  const S_KEYS = SMS.Storage.KEYS;

  // ================= SEMESTER MANAGEMENT =================

  /**
   * Get all semesters
   */
  const getAllSemesters = () => {
    return SMS.Storage.getCollection(S_KEYS.SEMESTERS);
  };

  /**
   * Get semester by ID
   */
  const getSemesterById = (id) => {
    return SMS.Storage.findInCollection(S_KEYS.SEMESTERS, s => s.id === id);
  };

  /**
   * Create semester
   * Rule: Validates semester info. Admin can assign or create 4 courses.
   */
  const createSemester = ({ name, academicYear, startDate, endDate, status = 'Active', courseIds = [] }) => {
    if (!name || !name.trim()) throw new Error('Semester name is required.');
    if (!academicYear || !academicYear.trim()) throw new Error('Academic year is required.');

    const newSemester = {
      id: 'SEM-' + Date.now().toString().slice(-6),
      name: name.trim(),
      academicYear: academicYear.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || '',
      status: status,
      courseIds: Array.isArray(courseIds) ? courseIds : []
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.SEMESTERS, newSemester);
  };

  /**
   * Update semester
   */
  const updateSemester = (id, updates) => {
    const existing = getSemesterById(id);
    if (!existing) throw new Error('Semester not found.');
    return SMS.Storage.updateInCollection(S_KEYS.SEMESTERS, id, updates);
  };

  /**
   * Delete semester
   */
  const deleteSemester = (id) => {
    const sem = getSemesterById(id);
    if (!sem) return false;

    // Remove or unlink courses
    const allCourses = getAllCourses();
    allCourses.forEach(c => {
      if (c.semesterId === id) {
        SMS.Storage.updateInCollection(S_KEYS.COURSES, c.id, { semesterId: null });
      }
    });

    return SMS.Storage.deleteFromCollection(S_KEYS.SEMESTERS, id);
  };

  // ================= COURSE MANAGEMENT =================

  /**
   * Get all courses
   */
  const getAllCourses = () => {
    return SMS.Storage.getCollection(S_KEYS.COURSES);
  };

  /**
   * Get course by ID
   */
  const getCourseById = (id) => {
    return SMS.Storage.findInCollection(S_KEYS.COURSES, c => c.id === id);
  };

  /**
   * Get courses by Semester ID
   */
  const getCoursesBySemester = (semesterId) => {
    return SMS.Storage.filterInCollection(S_KEYS.COURSES, c => c.semesterId === semesterId);
  };

  /**
   * Get courses assigned to a teacher
   */
  const getCoursesByTeacher = (teacherId) => {
    return SMS.Storage.filterInCollection(S_KEYS.COURSES, c => c.teacherId === teacherId);
  };

  /**
   * Create Course
   * Requirements:
   * - Course Name, Code, Description, Assigned Teacher, Semester, Total Weeks (12), Start Date, End Date
   * - Automatically populates exactly 12 weekly structures (Week 01 to Week 12)
   */
  const createCourse = ({
    code,
    name,
    description = '',
    teacherId = null,
    semesterId = null,
    startDate = '',
    endDate = ''
  }) => {
    if (!code || !code.trim()) throw new Error('Course code is required.');
    if (!name || !name.trim()) throw new Error('Course name is required.');
    if (!semesterId) throw new Error('A semester must be selected.');

    // Check semester course count limit rule: Each semester contains exactly 4 courses max
    const existingInSem = getCoursesBySemester(semesterId);
    if (existingInSem.length >= 4) {
      throw new Error('This semester already has 4 courses. Exactly 4 courses are allowed per semester.');
    }

    const courseId = 'CRS-' + Date.now().toString().slice(-6);
    const newCourse = {
      id: courseId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      teacherId: teacherId || null,
      semesterId: semesterId,
      totalWeeks: 12,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || ''
    };

    SMS.Storage.insertIntoCollection(S_KEYS.COURSES, newCourse);

    // Automatically generate 12 weeks
    const generatedWeeks = SMS.Storage.generateWeeksForCourse(courseId);
    const currentWeeks = SMS.Storage.getCollection(S_KEYS.COURSE_WEEKS);
    SMS.Storage.saveCollection(S_KEYS.COURSE_WEEKS, [...currentWeeks, ...generatedWeeks]);

    // Link into semester courseIds
    const sem = getSemesterById(semesterId);
    if (sem) {
      const updatedCourseIds = Array.from(new Set([...(sem.courseIds || []), courseId]));
      SMS.Storage.updateInCollection(S_KEYS.SEMESTERS, semesterId, { courseIds: updatedCourseIds });
    }

    return newCourse;
  };

  /**
   * Update Course
   */
  const updateCourse = (id, updates) => {
    const existing = getCourseById(id);
    if (!existing) throw new Error('Course not found.');

    // If changing semester, verify target semester doesn't exceed 4
    if (updates.semesterId && updates.semesterId !== existing.semesterId) {
      const targetCourses = getCoursesBySemester(updates.semesterId);
      if (targetCourses.length >= 4) {
        throw new Error('Target semester already has 4 courses. Exactly 4 courses are permitted.');
      }
      // Unlink from old
      if (existing.semesterId) {
        const oldSem = getSemesterById(existing.semesterId);
        if (oldSem) {
          const ids = (oldSem.courseIds || []).filter(cId => cId !== id);
          SMS.Storage.updateInCollection(S_KEYS.SEMESTERS, existing.semesterId, { courseIds: ids });
        }
      }
      // Link to new
      const newSem = getSemesterById(updates.semesterId);
      if (newSem) {
        const ids = Array.from(new Set([...(newSem.courseIds || []), id]));
        SMS.Storage.updateInCollection(S_KEYS.SEMESTERS, updates.semesterId, { courseIds: ids });
      }
    }

    return SMS.Storage.updateInCollection(S_KEYS.COURSES, id, updates);
  };

  /**
   * Delete Course
   */
  const deleteCourse = (id) => {
    const existing = getCourseById(id);
    if (!existing) return false;

    // Unlink from semester
    if (existing.semesterId) {
      const sem = getSemesterById(existing.semesterId);
      if (sem) {
        const ids = (sem.courseIds || []).filter(cId => cId !== id);
        SMS.Storage.updateInCollection(S_KEYS.SEMESTERS, existing.semesterId, { courseIds: ids });
      }
    }

    // Delete associated weeks
    const allWeeks = SMS.Storage.getCollection(S_KEYS.COURSE_WEEKS).filter(w => w.courseId !== id);
    SMS.Storage.saveCollection(S_KEYS.COURSE_WEEKS, allWeeks);

    // Delete course
    return SMS.Storage.deleteFromCollection(S_KEYS.COURSES, id);
  };

  // ================= COURSE WEEKS MANAGEMENT =================

  /**
   * Get 12 weeks for a course
   */
  const getWeeksByCourse = (courseId) => {
    let weeks = SMS.Storage.filterInCollection(S_KEYS.COURSE_WEEKS, w => w.courseId === courseId);
    if (!weeks || weeks.length === 0) {
      // Lazy auto-provision 12 weeks if missing
      weeks = SMS.Storage.generateWeeksForCourse(courseId);
      const allWeeks = SMS.Storage.getCollection(S_KEYS.COURSE_WEEKS);
      SMS.Storage.saveCollection(S_KEYS.COURSE_WEEKS, [...allWeeks, ...weeks]);
    }
    return weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  };

  /**
   * Update week learning material, topic description, resources
   */
  const updateWeekContent = (weekId, { title, description, learningMaterials, resources }) => {
    const weeks = SMS.Storage.getCollection(S_KEYS.COURSE_WEEKS);
    const idx = weeks.findIndex(w => w.id === weekId);
    if (idx === -1) throw new Error('Course week not found.');

    weeks[idx] = {
      ...weeks[idx],
      title: title !== undefined ? title : weeks[idx].title,
      description: description !== undefined ? description : weeks[idx].description,
      learningMaterials: learningMaterials !== undefined ? learningMaterials : weeks[idx].learningMaterials,
      resources: resources !== undefined ? resources : weeks[idx].resources,
      updatedAt: new Date().toISOString()
    };

    SMS.Storage.saveCollection(S_KEYS.COURSE_WEEKS, weeks);
    return weeks[idx];
  };

  // ================= ENROLLMENTS =================

  /**
   * Get all enrollments
   */
  const getAllEnrollments = () => {
    return SMS.Storage.getCollection(S_KEYS.ENROLLMENTS);
  };

  /**
   * Enroll a student in a course
   * Rule: Prevent duplicate enrollment
   */
  const enrollStudent = (studentId, courseId) => {
    if (!studentId || !courseId) throw new Error('Student and Course are required.');
    const enrollments = getAllEnrollments();
    const duplicate = enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    if (duplicate) {
      throw new Error('Student is already enrolled in this course.');
    }

    const course = getCourseById(courseId);
    const newEnrollment = {
      id: 'ENR-' + Date.now().toString().slice(-6),
      studentId,
      courseId,
      semesterId: course ? course.semesterId : null,
      enrolledAt: new Date().toISOString().split('T')[0]
    };

    return SMS.Storage.insertIntoCollection(S_KEYS.ENROLLMENTS, newEnrollment);
  };

  /**
   * Unenroll student
   */
  const unenrollStudent = (enrollmentId) => {
    return SMS.Storage.deleteFromCollection(S_KEYS.ENROLLMENTS, enrollmentId);
  };

  /**
   * Get enrolled courses for a student
   */
  const getStudentEnrolledCourses = (studentId) => {
    const enrollments = SMS.Storage.filterInCollection(S_KEYS.ENROLLMENTS, e => e.studentId === studentId);
    const allCourses = getAllCourses();
    return enrollments.map(enr => {
      const course = allCourses.find(c => c.id === enr.courseId);
      return {
        enrollmentId: enr.id,
        enrolledAt: enr.enrolledAt,
        course: course || null
      };
    }).filter(item => item.course !== null);
  };

  /**
   * Get students enrolled in a course
   */
  const getStudentsInCourse = (courseId) => {
    const enrollments = SMS.Storage.filterInCollection(S_KEYS.ENROLLMENTS, e => e.courseId === courseId);
    const allStudents = SMS.StudentService ? SMS.StudentService.getAll() : SMS.Storage.getCollection(S_KEYS.STUDENTS);
    return enrollments.map(enr => {
      const student = allStudents.find(s => s.id === enr.studentId);
      return {
        enrollmentId: enr.id,
        enrolledAt: enr.enrolledAt,
        student: student || null
      };
    }).filter(item => item.student !== null);
  };

  // ================= TEACHERS =================

  /**
   * Get all teachers
   */
  const getAllTeachers = () => {
    return SMS.Storage.getCollection(S_KEYS.TEACHERS);
  };

  /**
   * Get teacher by ID
   */
  const getTeacherById = (id) => {
    return SMS.Storage.findInCollection(S_KEYS.TEACHERS, t => t.id === id);
  };

  return {
    getAllSemesters,
    getSemesterById,
    createSemester,
    updateSemester,
    deleteSemester,
    getAllCourses,
    getCourseById,
    getCoursesBySemester,
    getCoursesByTeacher,
    createCourse,
    updateCourse,
    deleteCourse,
    getWeeksByCourse,
    updateWeekContent,
    getAllEnrollments,
    enrollStudent,
    unenrollStudent,
    getStudentEnrolledCourses,
    getStudentsInCourse,
    getAllTeachers,
    getTeacherById
  };
})();
