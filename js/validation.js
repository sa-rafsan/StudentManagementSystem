/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Validation Module (validation.js)
 * Form validation rules, regex checks, uniqueness validations, and UI feedback
 */

window.SMS = window.SMS || {};

SMS.Validation = (() => {
  // Common Regular Expressions
  const REGEX = {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/,
    STUDENT_ID: /^STU-\d{4}-\d{3,4}$/i
  };

  /**
   * Validate Email Format
   */
  const isValidEmail = (email) => {
    if (!email) return false;
    return REGEX.EMAIL.test(String(email).trim());
  };

  /**
   * Validate Phone Format
   */
  const isValidPhone = (phone) => {
    if (!phone) return false;
    return REGEX.PHONE.test(String(phone).trim());
  };

  /**
   * Check if Student Email is Unique
   * @param {string} email
   * @param {string|null} currentStudentId - ignored when updating the same student
   */
  const isEmailUnique = (email, currentStudentId = null) => {
    const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
    const cleanEmail = String(email).trim().toLowerCase();
    return !students.some(s => s.email.toLowerCase() === cleanEmail && s.id !== currentStudentId);
  };

  /**
   * Check if Student ID is Unique
   * @param {string} studentId
   * @param {string|null} currentStudentId - ignored when updating the same student
   */
  const isStudentIdUnique = (studentId, currentStudentId = null) => {
    const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
    const cleanId = String(studentId).trim();
    return !students.some(s => s.id === cleanId && s.id !== currentStudentId);
  };

  /**
   * Validate Date of Birth (must be in past, minimum 14 years old)
   */
  const isValidDOB = (dobStr) => {
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    if (isNaN(dob.getTime())) return false;
    if (dob >= today) return false;

    // Minimum age 14 check
    const minAgeDate = new Date();
    minAgeDate.setFullYear(today.getFullYear() - 14);
    return dob <= minAgeDate;
  };

  /**
   * Set Field UI Validation State
   */
  const setFieldState = (inputEl, isValid, errorMessage = '') => {
    if (!inputEl) return;
    
    // Find or create invalid-feedback element
    let feedback = inputEl.parentNode.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      inputEl.parentNode.appendChild(feedback);
    }

    if (isValid) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      feedback.style.display = 'none';
      feedback.textContent = '';
    } else {
      inputEl.classList.remove('is-valid');
      inputEl.classList.add('is-invalid');
      feedback.style.display = 'flex';
      feedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${SMS.Utils.escapeHTML(errorMessage)}`;
    }
  };

  /**
   * Clear Field UI Validation State
   */
  const clearFieldState = (inputEl) => {
    if (!inputEl) return;
    inputEl.classList.remove('is-valid', 'is-invalid');
    const feedback = inputEl.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
      feedback.textContent = '';
    }
  };

  /**
   * Validate Complete Student Registration Form
   */
  const validateStudentForm = (formData, currentStudentId = null) => {
    const errors = {};

    // 1. Student ID
    if (!formData.id || !formData.id.trim()) {
      errors.id = 'Student ID is required.';
    } else if (!isStudentIdUnique(formData.id, currentStudentId)) {
      errors.id = 'This Student ID is already assigned to another student.';
    }

    // 2. Full Name
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    // 3. Email
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email format (e.g. name@example.com).';
    } else if (!isEmailUnique(formData.email, currentStudentId)) {
      errors.email = 'A student with this email address is already registered.';
    }

    // 4. Phone
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (digits, +, hyphens allowed).';
    }

    // 5. Date of Birth
    if (!formData.dob) {
      errors.dob = 'Date of birth is required.';
    } else if (!isValidDOB(formData.dob)) {
      errors.dob = 'Student must be at least 14 years old.';
    }

    // 6. Gender
    if (!formData.gender) {
      errors.gender = 'Please select a gender.';
    }

    // 7. Department
    if (!formData.departmentId) {
      errors.departmentId = 'Department is required.';
    } else {
      const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
      if (!departments.some(d => d.id === formData.departmentId)) {
        errors.departmentId = 'Selected department does not exist.';
      }
    }

    // 8. Semester
    if (!formData.semester) {
      errors.semester = 'Semester is required.';
    }

    // 9. Enrollment Date
    if (!formData.enrollmentDate) {
      errors.enrollmentDate = 'Enrollment date is required.';
    }

    // 10. Status
    if (!formData.status) {
      errors.status = 'Status is required.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return {
    REGEX,
    isValidEmail,
    isValidPhone,
    isEmailUnique,
    isStudentIdUnique,
    isValidDOB,
    setFieldState,
    clearFieldState,
    validateStudentForm
  };
})();
