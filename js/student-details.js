/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Student Details Controller (student-details.js)
 * Reads student ID from URL parameter, fetches profile, renders academic and contact info,
 * and handles delete and edit operations.
 */

window.SMS = window.SMS || {};

SMS.StudentDetails = (() => {
  let currentStudent = null;

  /**
   * Render Student Information into DOM
   */
  const renderDetails = (student) => {
    currentStudent = student;

    // Header Profile Card
    const nameEl = SMS.Utils.$('#detailFullName');
    const idEl = SMS.Utils.$('#detailStudentId');
    const deptPill = SMS.Utils.$('#detailDeptPill');
    const statusPill = SMS.Utils.$('#detailStatusPill');
    const avatarContainer = SMS.Utils.$('#detailAvatarContainer');

    if (nameEl) nameEl.textContent = student.fullName;
    if (idEl) idEl.textContent = student.id;
    if (deptPill) deptPill.textContent = `${student.departmentCode} • ${student.semester} Semester`;

    if (statusPill) {
      if (student.status === 'Active') {
        statusPill.className = 'badge badge-active';
        statusPill.innerHTML = '<span class="badge-dot"></span> Active Student';
      } else {
        statusPill.className = 'badge badge-inactive';
        statusPill.innerHTML = '<span class="badge-dot"></span> Inactive Student';
      }
    }

    if (avatarContainer) {
      if (student.photo) {
        avatarContainer.innerHTML = `<img src="${SMS.Utils.escapeHTML(student.photo)}" alt="${SMS.Utils.escapeHTML(student.fullName)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-full);" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'detail-avatar-fallback\\'>${SMS.Utils.getInitials(student.fullName)}</div>'">`;
      } else {
        avatarContainer.innerHTML = `<div class="detail-avatar-fallback">${SMS.Utils.getInitials(student.fullName)}</div>`;
      }
    }

    // Personal Information
    const dobEl = SMS.Utils.$('#infoDob');
    const ageEl = SMS.Utils.$('#infoAge');
    const genderEl = SMS.Utils.$('#infoGender');

    if (dobEl) dobEl.textContent = SMS.Utils.formatDate(student.dob);
    if (ageEl) ageEl.textContent = SMS.Utils.calculateAge(student.dob);
    if (genderEl) genderEl.textContent = student.gender || 'Not specified';

    // Contact Information
    const emailEl = SMS.Utils.$('#infoEmail');
    const phoneEl = SMS.Utils.$('#infoPhone');
    const addressEl = SMS.Utils.$('#infoAddress');

    if (emailEl) {
      emailEl.textContent = student.email;
      emailEl.href = `mailto:${student.email}`;
    }
    if (phoneEl) {
      phoneEl.textContent = student.phone;
      phoneEl.href = `tel:${student.phone}`;
    }
    if (addressEl) addressEl.textContent = student.address || 'No address provided.';

    // Academic Information
    const acadDeptName = SMS.Utils.$('#infoDeptName');
    const acadDeptCode = SMS.Utils.$('#infoDeptCode');
    const acadSemester = SMS.Utils.$('#infoSemester');
    const acadEnrollDate = SMS.Utils.$('#infoEnrollDate');
    const acadCreatedAt = SMS.Utils.$('#infoCreatedAt');
    const acadUpdatedAt = SMS.Utils.$('#infoUpdatedAt');

    if (acadDeptName) acadDeptName.textContent = student.departmentName;
    if (acadDeptCode) acadDeptCode.textContent = student.departmentCode;
    if (acadSemester) acadSemester.textContent = `${student.semester} Semester`;
    if (acadEnrollDate) acadEnrollDate.textContent = SMS.Utils.formatDate(student.enrollmentDate);
    if (acadCreatedAt) acadCreatedAt.textContent = SMS.Utils.formatDate(student.createdAt);
    if (acadUpdatedAt) acadUpdatedAt.textContent = SMS.Utils.formatDate(student.updatedAt);

    // Render Classroom Attendance & Exam Eligibility
    if (window.SMS.Attendance) {
      const stats = SMS.Attendance.calculateStudentStats(student.id);

      const rateEl = SMS.Utils.$('#detailAttendanceRate');
      const barEl = SMS.Utils.$('#detailAttendanceBar');
      const eligEl = SMS.Utils.$('#detailAttendanceEligibility');
      const totalEl = SMS.Utils.$('#detailTotalClasses');
      const presentEl = SMS.Utils.$('#detailPresentCount');
      const lateEl = SMS.Utils.$('#detailLateCount');
      const absentEl = SMS.Utils.$('#detailAbsentCount');
      const tableBody = SMS.Utils.$('#detailAttendanceTableBody');

      if (rateEl) {
        rateEl.textContent = `${stats.percentage}%`;
        rateEl.className = stats.statusInfo.textClass;
      }

      if (barEl) {
        barEl.style.width = `${Math.min(stats.percentage, 100)}%`;
        let barColor = '#16a34a';
        if (stats.percentage < 60) barColor = '#dc2626';
        else if (stats.percentage < 75) barColor = '#d97706';
        barEl.style.backgroundColor = barColor;
      }

      if (eligEl) {
        eligEl.innerHTML = `<span class="badge ${stats.statusInfo.badgeClass}" style="font-size:0.85rem;padding:0.35rem 0.75rem;">${stats.statusInfo.label}</span>`;
      }

      if (totalEl) totalEl.textContent = stats.totalSessions;
      if (presentEl) presentEl.textContent = stats.presentCount;
      if (lateEl) lateEl.textContent = stats.lateCount;
      if (absentEl) absentEl.textContent = stats.absentCount;

      if (tableBody) {
        if (stats.history.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:1.5rem;">No classroom attendance recorded for this student yet.</td></tr>';
        } else {
          // Show recent 5 sessions
          const recentSessions = stats.history.slice(0, 5);
          tableBody.innerHTML = recentSessions.map(sess => {
            let badgeClass = 'badge-active';
            if (sess.status === 'Absent') badgeClass = 'badge-critical-att';
            else if (sess.status === 'Late') badgeClass = 'badge-warning-att';
            else if (sess.status === 'Excused') badgeClass = 'badge-dept';

            return `
              <tr>
                <td style="font-weight:600;">${SMS.Utils.formatDate(sess.date)}</td>
                <td>${SMS.Utils.escapeHTML(sess.subject)}</td>
                <td>${SMS.Utils.escapeHTML(sess.teacherName)}</td>
                <td><span class="badge ${badgeClass}">${sess.status}</span></td>
                <td style="color:var(--text-secondary);font-size:0.82rem;">${SMS.Utils.escapeHTML(sess.notes || '-')}</td>
              </tr>
            `;
          }).join('');
        }
      }
      // Add Course Academic Results link if student or admin
      const actionRow = SMS.Utils.$('.student-profile-actions');
      if (actionRow && !actionRow.querySelector('#viewResultsDossierBtn')) {
        const resultsBtn = document.createElement('a');
        resultsBtn.id = 'viewResultsDossierBtn';
        resultsBtn.className = 'btn btn-secondary';
        resultsBtn.href = `results.html`;
        resultsBtn.innerHTML = '<i class="fa-solid fa-square-poll-vertical"></i> View Results';
        actionRow.prepend(resultsBtn);
      }
    }

    // Dynamic Edit Link
    const editBtn = SMS.Utils.$('#editStudentBtn');
    if (editBtn) {
      editBtn.href = `add-student.html?id=${encodeURIComponent(student.id)}`;
    }

    // Adjust visibility based on user role
    const isAdmin = SMS.Auth.isAdmin();
    const currentUser = SMS.Auth.getCurrentUser();
    const isSelf = currentUser && currentUser.studentId === student.id;

    const deleteBtn = SMS.Utils.$('#deleteStudentBtn');
    if (deleteBtn && !isAdmin) {
      deleteBtn.style.display = 'none';
    }

    if (editBtn && !isAdmin && !isSelf) {
      editBtn.style.display = 'none';
    }

    // Render Security & Password Status
    renderSecurityCard(student, isAdmin, isSelf);
  };

  /**
   * Render Account Security and Password Details
   */
  const renderSecurityCard = (student, isAdmin, isSelf) => {
    const secCard = SMS.Utils.$('#securityCard');
    const btnChangePassModal = SMS.Utils.$('#btnOpenChangePasswordModal');
    if (!secCard) return;

    if (!isAdmin && !isSelf) {
      secCard.style.display = 'none';
      if (btnChangePassModal) btnChangePassModal.style.display = 'none';
      return;
    }

    secCard.style.display = 'block';
    if (btnChangePassModal) btnChangePassModal.style.display = 'inline-flex';

    const secId = SMS.Utils.$('#securityStudentId');
    const secEmail = SMS.Utils.$('#securityStudentEmail');
    const secState = SMS.Utils.$('#securityPasswordState');
    const passBadge = SMS.Utils.$('#passwordStatusBadge');

    if (secId) secId.textContent = student.id;
    if (secEmail) secEmail.textContent = student.email;

    // Check user account in storage
    const users = SMS.Storage.getItem(SMS.Storage.KEYS.USERS, []);
    const cleanEmail = (student.email || '').trim().toLowerCase();
    const user = users.find(u => (u.studentId && u.studentId === student.id) || (u.email && u.email.toLowerCase() === cleanEmail));

    const defaultHash = 'fcbc8da2717f3c27afb9c77535c0f54daddd0395a736b1e17b9c8c51e64c576c';
    const isDefault = !user || user.isDefaultPassword || user.passwordHash === defaultHash;

    if (isDefault) {
      if (secState) secState.innerHTML = '<span style="color: #d97706;"><i class="fa-solid fa-triangle-exclamation"></i> 12345 (Default)</span>';
      if (passBadge) {
        passBadge.className = 'badge badge-warning';
        passBadge.style.background = '#fef3c7';
        passBadge.style.color = '#92400e';
        passBadge.innerHTML = '<i class="fa-solid fa-key"></i> Default Password: 12345';
      }
    } else {
      if (secState) secState.innerHTML = '<span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> Custom Password Active</span>';
      if (passBadge) {
        passBadge.className = 'badge badge-success';
        passBadge.style.background = '#dcfce7';
        passBadge.style.color = '#166534';
        passBadge.innerHTML = '<i class="fa-solid fa-check-double"></i> Custom Password Set';
      }
    }
  };

  /**
   * Modal Open/Close Helpers
   */
  const openModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.style.display = 'flex';
    requestAnimationFrame(() => modalEl.classList.add('show'));
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove('show');
    setTimeout(() => {
      modalEl.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  };

  /**
   * Handle Password Change Execution
   */
  const executePasswordChange = async (currentPass, newPass, confirmPass, modalToClose = null) => {
    if (!newPass || newPass.length < 5) {
      SMS.Utils.showToast('error', 'Password Too Short', 'New password must be at least 5 characters long.');
      return false;
    }
    if (newPass !== confirmPass) {
      SMS.Utils.showToast('error', 'Password Mismatch', 'New password and confirm password do not match.');
      return false;
    }

    const isAdmin = SMS.Auth.isAdmin();
    const currentUser = SMS.Auth.getCurrentUser();
    const isSelf = currentUser && currentUser.studentId === currentStudent.id;

    // Call Auth changePassword
    const result = await SMS.Auth.changePassword(currentStudent.id, newPass, currentPass);
    if (!result.success) {
      SMS.Utils.showToast('error', 'Update Failed', result.message);
      return false;
    }

    SMS.Utils.showToast('success', 'Password Updated', 'Password has been successfully updated and saved in LocalStorage!');
    renderSecurityCard(currentStudent, isAdmin, isSelf);

    if (modalToClose) {
      closeModal(modalToClose);
    }
    return true;
  };
  };

  /**
   * Delete Student Handler
   */
  const handleDelete = () => {
    if (!currentStudent) return;

    SMS.Utils.showConfirmModal({
      title: 'Delete Student Record',
      message: `Are you sure you want to permanently delete the student profile for ${currentStudent.fullName} (${currentStudent.id})? This action cannot be undone.`,
      confirmText: 'Yes, Delete Record',
      cancelText: 'Cancel',
      confirmType: 'danger',
      onConfirm: () => {
        try {
          SMS.StudentService.remove(currentStudent.id);
          SMS.Utils.showToast('success', 'Student Deleted', `Record ${currentStudent.id} was deleted.`);
          setTimeout(() => {
            window.location.href = 'students.html';
          }, 1200);
        } catch (err) {
          SMS.Utils.showToast('error', 'Delete Failed', err.message);
        }
      }
    });
  };

  /**
   * Main Initialization
   */
  const init = () => {
    const studentId = SMS.Utils.getUrlParam('id');
    const contentArea = SMS.Utils.$('#studentDetailsContent');
    const errorArea = SMS.Utils.$('#studentDetailsError');

    if (!studentId) {
      if (contentArea) contentArea.style.display = 'none';
      if (errorArea) {
        errorArea.style.display = 'flex';
        errorArea.querySelector('.empty-state-title').textContent = 'No Student ID Provided';
        errorArea.querySelector('.empty-state-desc').textContent = 'Please select a student from the directory to view details.';
      }
      return;
    }

    const student = SMS.StudentService.getById(studentId);

    if (!student) {
      if (contentArea) contentArea.style.display = 'none';
      if (errorArea) {
        errorArea.style.display = 'flex';
        errorArea.querySelector('.empty-state-title').textContent = 'Student Not Found';
        errorArea.querySelector('.empty-state-desc').textContent = `No student with ID "${studentId}" was found in LocalStorage.`;
      }
      return;
    }

    if (errorArea) errorArea.style.display = 'none';
    if (contentArea) contentArea.style.display = 'block';

    renderDetails(student);

    // Bind Delete Button
    const deleteBtn = SMS.Utils.$('#deleteStudentBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', handleDelete);
    }

    // Bind Print Button
    const printBtn = SMS.Utils.$('#printStudentBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Bind Password Modal
    const changePassModal = SMS.Utils.$('#changePasswordModal');
    const btnOpenChangePass = SMS.Utils.$('#btnOpenChangePasswordModal');
    const btnCloseChangePass = SMS.Utils.$('#closeChangePassModalBtn');
    const btnCancelChangePass = SMS.Utils.$('#cancelChangePassModalBtn');

    if (btnOpenChangePass && changePassModal) {
      btnOpenChangePass.addEventListener('click', () => {
        const form = SMS.Utils.$('#modalChangePasswordForm');
        if (form) form.reset();
        openModal(changePassModal);
      });
    }

    if (btnCloseChangePass && changePassModal) {
      btnCloseChangePass.addEventListener('click', () => closeModal(changePassModal));
    }
    if (btnCancelChangePass && changePassModal) {
      btnCancelChangePass.addEventListener('click', () => closeModal(changePassModal));
    }
    if (changePassModal) {
      changePassModal.addEventListener('click', (e) => {
        if (e.target === changePassModal) closeModal(changePassModal);
      });
    }

    // Modal Form Submission
    const modalForm = SMS.Utils.$('#modalChangePasswordForm');
    if (modalForm) {
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPass = SMS.Utils.$('#modalCurrentPass').value;
        const newPass = SMS.Utils.$('#modalNewPass').value;
        const confirmPass = SMS.Utils.$('#modalConfirmPass').value;
        await executePasswordChange(currentPass, newPass, confirmPass, changePassModal);
      });
    }

    // Inline Form Submission in Security Card
    const inlineForm = SMS.Utils.$('#inlineChangePasswordForm');
    if (inlineForm) {
      inlineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPass = SMS.Utils.$('#inputCurrentPass').value;
        const newPass = SMS.Utils.$('#inputNewPass').value;
        const confirmPass = SMS.Utils.$('#inputConfirmPass').value;
        const success = await executePasswordChange(currentPass, newPass, confirmPass);
        if (success) {
          inlineForm.reset();
        }
      });
    }
  };

  return {
    init
  };
})();
