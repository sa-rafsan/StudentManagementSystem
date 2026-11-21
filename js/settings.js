/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Settings Controller Module (settings.js)
 * Handles Department CRUD with foreign key constraints, JSON Import/Export,
 * Demo Data Reset, and Application Data Wipe.
 */

window.SMS = window.SMS || {};

SMS.Settings = (() => {
  let editingDeptId = null;

  /**
   * Render Department Management Table
   */
  const renderDepartmentTable = () => {
    const tbody = SMS.Utils.$('#departmentsTbody');
    if (!tbody) return;

    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
    const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);

    if (departments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No departments configured.</td></tr>`;
      return;
    }

    tbody.innerHTML = departments.map(dept => {
      // Calculate how many students belong to this department (Foreign Key check)
      const studentCount = students.filter(s => s.departmentId === dept.id).length;
      const canDelete = studentCount === 0;

      return `
        <tr>
          <td><span class="badge badge-primary">${SMS.Utils.escapeHTML(dept.code)}</span></td>
          <td>
            <strong>${SMS.Utils.escapeHTML(dept.name)}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${SMS.Utils.escapeHTML(dept.description || '')}</div>
          </td>
          <td>${SMS.Utils.escapeHTML(dept.head || 'Not assigned')}</td>
          <td>
            <span class="badge ${studentCount > 0 ? 'badge-active' : 'badge-inactive'}">
              ${studentCount} Enrolled
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn btn-icon btn-sm btn-action-edit btn-edit-dept" data-id="${SMS.Utils.escapeHTML(dept.id)}" title="Edit Department">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button type="button" class="btn btn-icon btn-sm btn-action-delete btn-delete-dept" 
                      data-id="${SMS.Utils.escapeHTML(dept.id)}" 
                      data-name="${SMS.Utils.escapeHTML(dept.name)}" 
                      data-count="${studentCount}" 
                      title="${canDelete ? 'Delete Department' : 'Cannot delete: Students are enrolled in this department'}">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Edit & Delete Listeners
    tbody.querySelectorAll('.btn-edit-dept').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDepartmentModal(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-dept').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const count = parseInt(btn.getAttribute('data-count'), 10);
        handleDeleteDepartment(id, name, count);
      });
    });
  };

  /**
   * Open Department Modal (Add or Edit)
   */
  const openDepartmentModal = (deptId = null) => {
    editingDeptId = deptId;
    const modalBackdrop = SMS.Utils.$('#deptModalBackdrop');
    const modalTitle = SMS.Utils.$('#deptModalTitle');
    const form = SMS.Utils.$('#deptForm');

    if (!modalBackdrop || !form) return;

    if (deptId) {
      const depts = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
      const dept = depts.find(d => d.id === deptId);
      if (dept) {
        modalTitle.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color:var(--primary)"></i> Edit Department';
        form.deptCode.value = dept.code;
        form.deptName.value = dept.name;
        form.deptHead.value = dept.head || '';
        form.deptDesc.value = dept.description || '';
      }
    } else {
      modalTitle.innerHTML = '<i class="fa-solid fa-building-columns" style="color:var(--primary)"></i> Add New Department';
      form.reset();
    }

    modalBackdrop.classList.add('show');
  };

  /**
   * Close Department Modal
   */
  const closeDepartmentModal = () => {
    const modalBackdrop = SMS.Utils.$('#deptModalBackdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('show');
    editingDeptId = null;
  };

  /**
   * Save Department (Add or Edit)
   */
  const handleSaveDepartment = (e) => {
    e.preventDefault();
    const form = e.target;
    const code = form.deptCode.value.trim().toUpperCase();
    const name = form.deptName.value.trim();
    const head = form.deptHead.value.trim();
    const desc = form.deptDesc.value.trim();

    if (!code || !name) {
      SMS.Utils.showToast('error', 'Validation Error', 'Department Code and Name are required.');
      return;
    }

    const depts = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);

    // Check code uniqueness
    const duplicate = depts.find(d => d.code.toUpperCase() === code && d.id !== editingDeptId);
    if (duplicate) {
      SMS.Utils.showToast('error', 'Duplicate Code', `A department with code "${code}" already exists.`);
      return;
    }

    if (editingDeptId) {
      // Edit existing
      const index = depts.findIndex(d => d.id === editingDeptId);
      if (index !== -1) {
        depts[index] = {
          ...depts[index],
          code,
          name,
          head,
          description: desc
        };
        SMS.Storage.setItem(SMS.Storage.KEYS.DEPARTMENTS, depts);
        SMS.Utils.showToast('success', 'Department Updated', `${name} (${code}) has been updated.`);
      }
    } else {
      // Create new
      const nextNum = depts.length + 1;
      const newId = `DEP-${String(nextNum).padStart(3, '0')}`;
      depts.push({
        id: newId,
        code,
        name,
        head,
        description: desc,
        createdAt: new Date().toISOString().split('T')[0]
      });
      SMS.Storage.setItem(SMS.Storage.KEYS.DEPARTMENTS, depts);
      SMS.Utils.showToast('success', 'Department Added', `${name} (${code}) has been created.`);
    }

    closeDepartmentModal();
    renderDepartmentTable();
  };

  /**
   * Delete Department with Referential Integrity Check
   */
  const handleDeleteDepartment = (deptId, deptName, studentCount) => {
    // ENFORCE FOREIGN KEY CONSTRAINT:
    if (studentCount > 0) {
      SMS.Utils.showToast(
        'error',
        'Cannot Delete Department',
        `Referential Integrity Error: ${studentCount} students are currently enrolled in ${deptName}. Reassign or remove these students before deleting the department.`
      );
      return;
    }

    SMS.Utils.showConfirmModal({
      title: 'Delete Department',
      message: `Are you sure you want to delete the department "${deptName}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete Department',
      cancelText: 'Cancel',
      confirmType: 'danger',
      onConfirm: () => {
        let depts = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
        depts = depts.filter(d => d.id !== deptId);
        SMS.Storage.setItem(SMS.Storage.KEYS.DEPARTMENTS, depts);
        SMS.Utils.showToast('success', 'Department Deleted', `Department "${deptName}" was successfully removed.`);
        renderDepartmentTable();
      }
    });
  };

  /**
   * Export All Data to JSON file
   */
  const handleExportJSON = () => {
    try {
      const data = SMS.Storage.exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `sms_backup_${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      SMS.Utils.showToast('success', 'Export Successful', `Exported ${data.students.length} students to ${filename}`);
    } catch (err) {
      SMS.Utils.showToast('error', 'Export Failed', err.message);
    }
  };

  /**
   * Import Data from JSON file
   */
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        
        SMS.Utils.showConfirmModal({
          title: 'Confirm Data Import',
          message: `Are you sure you want to import this JSON file? Valid student records in the file will replace current student records in LocalStorage.`,
          confirmText: 'Import Records',
          cancelText: 'Cancel',
          confirmType: 'primary',
          onConfirm: () => {
            try {
              const importedCount = SMS.Storage.importData(parsed);
              SMS.Utils.showToast('success', 'Import Successful', `Successfully imported ${importedCount} student records.`);
              renderDepartmentTable();
            } catch (importErr) {
              SMS.Utils.showToast('error', 'Import Failed', importErr.message);
            }
          }
        });
      } catch (parseErr) {
        SMS.Utils.showToast('error', 'Invalid File', 'Could not parse file as JSON. Please ensure the file is valid JSON format.');
      }
      e.target.value = ''; // reset file input
    };
    reader.readAsText(file);
  };

  /**
   * Reset Application to Demo Data
   */
  const handleResetDemoData = () => {
    SMS.Utils.showConfirmModal({
      title: 'Reset to Demo Data',
      message: 'This will restore the original demo departments, 10 sample students, and demo administrator/student login accounts. Any newly added records will be overwritten.',
      confirmText: 'Reset Demo Data',
      cancelText: 'Cancel',
      confirmType: 'warning',
      onConfirm: () => {
        SMS.Storage.resetDemoData();
        SMS.Utils.showToast('success', 'Demo Data Restored', 'The application has been reset to default demo dataset.');
        renderDepartmentTable();
      }
    });
  };

  /**
   * Wipe All Data
   */
  const handleClearAllData = () => {
    SMS.Utils.showConfirmModal({
      title: 'Clear All Application Data',
      message: 'WARNING: This will permanently delete all students, departments, user accounts, and session data from LocalStorage. You will be logged out immediately.',
      confirmText: 'Delete Everything',
      cancelText: 'Cancel',
      confirmType: 'danger',
      onConfirm: () => {
        SMS.Storage.clearAllData();
        SMS.Utils.showToast('info', 'Data Cleared', 'All LocalStorage data was purged.');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      }
    });
  };

  /**
   * Main Initialization
   */
  const init = () => {
    // Role check: Only Admin can access settings
    if (!SMS.Auth.isAdmin()) {
      SMS.Utils.showToast('error', 'Access Denied', 'Only administrators can access Settings.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
      return;
    }

    renderDepartmentTable();

    // Bind Add Department Button
    const addDeptBtn = SMS.Utils.$('#addDeptBtn');
    if (addDeptBtn) {
      addDeptBtn.addEventListener('click', () => openDepartmentModal(null));
    }

    // Bind Dept Modal Close Buttons
    const closeDeptX = SMS.Utils.$('#deptModalCloseX');
    const cancelDeptBtn = SMS.Utils.$('#deptModalCancelBtn');
    if (closeDeptX) closeDeptX.addEventListener('click', closeDepartmentModal);
    if (cancelDeptBtn) cancelDeptBtn.addEventListener('click', closeDepartmentModal);

    // Bind Dept Form Submit
    const deptForm = SMS.Utils.$('#deptForm');
    if (deptForm) {
      deptForm.addEventListener('submit', handleSaveDepartment);
    }

    // Bind Data Management Buttons
    const exportBtn = SMS.Utils.$('#exportJsonBtn');
    if (exportBtn) exportBtn.addEventListener('click', handleExportJSON);

    const importInput = SMS.Utils.$('#importJsonInput');
    if (importInput) importInput.addEventListener('change', handleImportJSON);

    const resetDemoBtn = SMS.Utils.$('#resetDemoBtn');
    if (resetDemoBtn) resetDemoBtn.addEventListener('click', handleResetDemoData);

    const clearAllBtn = SMS.Utils.$('#clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAllData);
  };

  return {
    init,
    renderDepartmentTable
  };
})();
