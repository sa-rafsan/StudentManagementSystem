/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Student List Controller (students.js)
 * Handles table rendering, search, filtering, sorting, pagination, and deletion modal.
 */

window.SMS = window.SMS || {};

SMS.StudentsPage = (() => {
  // Page State
  const state = {
    search: '',
    departmentId: 'ALL',
    semester: 'ALL',
    status: 'ALL',
    sortField: 'id',
    sortOrder: 'asc',
    page: 1,
    limit: 10
  };

  /**
   * Populate Department dropdown filter from LocalStorage
   */
  const populateDepartmentFilter = () => {
    const deptSelect = SMS.Utils.$('#filterDepartment');
    if (!deptSelect) return;

    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
    deptSelect.innerHTML = `<option value="ALL">All Departments</option>` +
      departments.map(d => `<option value="${d.id}">${SMS.Utils.escapeHTML(d.code)} - ${SMS.Utils.escapeHTML(d.name)}</option>`).join('');
  };

  /**
   * Render Filter Chips / Tags
   */
  const renderFilterTags = () => {
    const container = SMS.Utils.$('#activeFiltersBar');
    const tagsWrapper = SMS.Utils.$('#activeFilterTags');
    if (!container || !tagsWrapper) return;

    const activeTags = [];

    if (state.search.trim()) {
      activeTags.push({
        label: `Search: "${state.search}"`,
        clear: () => {
          state.search = '';
          const searchInput = SMS.Utils.$('#searchInput');
          if (searchInput) searchInput.value = '';
          const clearBtn = SMS.Utils.$('#searchClearBtn');
          if (clearBtn) clearBtn.classList.remove('active');
        }
      });
    }

    if (state.departmentId !== 'ALL') {
      const depts = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
      const d = depts.find(item => item.id === state.departmentId);
      activeTags.push({
        label: `Dept: ${d ? d.code : state.departmentId}`,
        clear: () => {
          state.departmentId = 'ALL';
          const deptSelect = SMS.Utils.$('#filterDepartment');
          if (deptSelect) deptSelect.value = 'ALL';
        }
      });
    }

    if (state.semester !== 'ALL') {
      activeTags.push({
        label: `Sem: ${state.semester}`,
        clear: () => {
          state.semester = 'ALL';
          const semSelect = SMS.Utils.$('#filterSemester');
          if (semSelect) semSelect.value = 'ALL';
        }
      });
    }

    if (state.status !== 'ALL') {
      activeTags.push({
        label: `Status: ${state.status}`,
        clear: () => {
          state.status = 'ALL';
          const statusSelect = SMS.Utils.$('#filterStatus');
          if (statusSelect) statusSelect.value = 'ALL';
        }
      });
    }

    if (activeTags.length === 0) {
      container.style.display = 'none';
      tagsWrapper.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    tagsWrapper.innerHTML = activeTags.map((tag, idx) => `
      <span class="filter-tag">
        ${SMS.Utils.escapeHTML(tag.label)}
        <button type="button" class="filter-tag-remove" data-tag-idx="${idx}" aria-label="Remove filter">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>
    `).join('');

    // Attach click listeners for tags
    tagsWrapper.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-tag-idx'), 10);
        if (activeTags[idx]) {
          activeTags[idx].clear();
          state.page = 1;
          render();
        }
      });
    });
  };

  /**
   * Render Student Table Rows
   */
  const renderTable = (result) => {
    const tbody = SMS.Utils.$('#studentsTbody');
    const emptyState = SMS.Utils.$('#studentsEmptyState');
    const tableContainer = SMS.Utils.$('#studentsTableContainer');
    const paginationWrapper = SMS.Utils.$('#paginationWrapper');
    const resultsCountEl = SMS.Utils.$('#tableResultsCount');

    if (!tbody) return;

    const isAdmin = SMS.Auth.isAdmin();

    if (resultsCountEl) {
      resultsCountEl.textContent = result.total;
    }

    if (result.total === 0) {
      tbody.innerHTML = '';
      if (tableContainer) tableContainer.style.display = 'none';
      if (paginationWrapper) paginationWrapper.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'flex';
        const hasFilters = state.search || state.departmentId !== 'ALL' || state.semester !== 'ALL' || state.status !== 'ALL';
        emptyState.querySelector('.empty-state-title').textContent = hasFilters
          ? 'No matching students found'
          : 'No student records yet';
        emptyState.querySelector('.empty-state-desc').textContent = hasFilters
          ? 'Try adjusting your search criteria or resetting filters.'
          : 'Get started by adding your first student to the system.';
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    if (paginationWrapper) paginationWrapper.style.display = 'flex';

    tbody.innerHTML = result.students.map(student => {
      const avatarHtml = student.photo
        ? `<img src="${SMS.Utils.escapeHTML(student.photo)}" alt="${SMS.Utils.escapeHTML(student.fullName)}" class="student-table-avatar" onerror="this.onerror=null;this.parentElement.textContent='${SMS.Utils.getInitials(student.fullName)}'">`
        : `<div class="student-table-avatar">${SMS.Utils.getInitials(student.fullName)}</div>`;

      const statusBadge = student.status === 'Active'
        ? `<span class="badge badge-active"><span class="badge-dot"></span> Active</span>`
        : `<span class="badge badge-inactive"><span class="badge-dot"></span> Inactive</span>`;

      // Admin buttons vs Student view buttons
      const editBtnHtml = isAdmin
        ? `<a href="add-student.html?id=${encodeURIComponent(student.id)}" class="btn btn-icon btn-sm btn-action-edit" title="Edit Student">
             <i class="fa-regular fa-pen-to-square"></i>
           </a>`
        : '';

      const deleteBtnHtml = isAdmin
        ? `<button type="button" class="btn btn-icon btn-sm btn-action-delete btn-delete-student" data-id="${SMS.Utils.escapeHTML(student.id)}" data-name="${SMS.Utils.escapeHTML(student.fullName)}" title="Delete Student">
             <i class="fa-regular fa-trash-can"></i>
           </button>`
        : '';

      return `
        <tr>
          <td>
            <div class="student-table-profile">
              ${avatarHtml}
              <div class="student-table-info">
                <a href="student-details.html?id=${encodeURIComponent(student.id)}" class="student-table-name">${SMS.Utils.escapeHTML(student.fullName)}</a>
                <span class="student-table-id">${SMS.Utils.escapeHTML(student.id)}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-primary">${SMS.Utils.escapeHTML(student.departmentCode)}</span>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${SMS.Utils.escapeHTML(student.departmentName)}</div>
          </td>
          <td>${SMS.Utils.escapeHTML(student.semester)}</td>
          <td>
            <div style="font-size: 0.88rem;">${SMS.Utils.escapeHTML(student.email)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${SMS.Utils.escapeHTML(student.phone)}</div>
          </td>
          <td>${statusBadge}</td>
          <td>${SMS.Utils.formatDate(student.enrollmentDate)}</td>
          <td>
            <div class="table-actions">
              <a href="student-details.html?id=${encodeURIComponent(student.id)}" class="btn btn-icon btn-sm btn-action-view" title="View Profile">
                <i class="fa-regular fa-eye"></i>
              </a>
              ${editBtnHtml}
              ${deleteBtnHtml}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Delete Event Listeners
    tbody.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.getAttribute('data-id');
        const studentName = btn.getAttribute('data-name');
        handleDeleteStudent(studentId, studentName);
      });
    });
  };

  /**
   * Delete student with Custom Modal Confirmation
   */
  const handleDeleteStudent = (studentId, studentName) => {
    SMS.Utils.showConfirmModal({
      title: 'Delete Student Record',
      message: `Are you sure you want to delete ${studentName} (${studentId})? This action will permanently remove the student profile from LocalStorage.`,
      confirmText: 'Yes, Delete Student',
      cancelText: 'Cancel',
      confirmType: 'danger',
      onConfirm: () => {
        try {
          SMS.StudentService.remove(studentId);
          SMS.Utils.showToast('success', 'Student Deleted', `Student record ${studentId} was successfully removed.`);
          render();
        } catch (err) {
          SMS.Utils.showToast('error', 'Delete Failed', err.message);
        }
      }
    });
  };

  /**
   * Render Pagination Controls
   */
  const renderPagination = (result) => {
    const infoEl = SMS.Utils.$('#paginationInfo');
    const controlsEl = SMS.Utils.$('#paginationControls');

    if (!infoEl || !controlsEl) return;

    infoEl.innerHTML = `Showing <strong>${result.startIndex}</strong> to <strong>${result.endIndex}</strong> of <strong>${result.total}</strong> students`;

    const totalPages = result.totalPages;
    const currentPage = result.page;

    let html = `
      <button type="button" class="pagination-btn" id="prevPageBtn" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous Page">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    // Generate page numbers
    for (let p = 1; p <= totalPages; p++) {
      if (totalPages > 7) {
        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
          html += `<button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        } else if (p === currentPage - 2 || p === currentPage + 2) {
          html += `<span class="pagination-ellipsis">&hellip;</span>`;
        }
      } else {
        html += `<button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    }

    html += `
      <button type="button" class="pagination-btn" id="nextPageBtn" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next Page">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    controlsEl.innerHTML = html;

    // Attach listeners
    controlsEl.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = parseInt(btn.getAttribute('data-page'), 10);
        render();
      });
    });

    const prevBtn = SMS.Utils.$('#prevPageBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.page > 1) {
          state.page--;
          render();
        }
      });
    }

    const nextBtn = SMS.Utils.$('#nextPageBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.page < totalPages) {
          state.page++;
          render();
        }
      });
    }
  };

  /**
   * Update Table Header Sort Indicators
   */
  const updateSortHeaders = () => {
    SMS.Utils.$$('.data-table th.sortable').forEach(th => {
      const field = th.getAttribute('data-sort');
      const icon = th.querySelector('.sort-icon');

      if (field === state.sortField) {
        th.classList.add('sorted');
        if (icon) {
          icon.className = `fa-solid fa-arrow-${state.sortOrder === 'asc' ? 'up-long' : 'down-long'} sort-icon`;
        }
      } else {
        th.classList.remove('sorted');
        if (icon) {
          icon.className = 'fa-solid fa-arrow-up-down sort-icon';
        }
      }
    });
  };

  /**
   * Main Render Pipeline
   */
  const render = () => {
    const result = SMS.StudentService.query({
      search: state.search,
      departmentId: state.departmentId,
      semester: state.semester,
      status: state.status,
      sortField: state.sortField,
      sortOrder: state.sortOrder,
      page: state.page,
      limit: state.limit
    });

    renderFilterTags();
    renderTable(result);
    renderPagination(result);
    updateSortHeaders();
  };

  /**
   * Setup Event Listeners
   */
  const bindEvents = () => {
    // Search input with debounce
    const searchInput = SMS.Utils.$('#searchInput');
    const searchClear = SMS.Utils.$('#searchClearBtn');

    if (searchInput) {
      searchInput.addEventListener('input', SMS.Utils.debounce((e) => {
        state.search = e.target.value;
        state.page = 1;
        if (searchClear) {
          searchClear.classList.toggle('active', !!state.search);
        }
        render();
      }, 250));
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.search = '';
        state.page = 1;
        searchClear.classList.remove('active');
        render();
      });
    }

    // Department Filter
    const filterDept = SMS.Utils.$('#filterDepartment');
    if (filterDept) {
      filterDept.addEventListener('change', (e) => {
        state.departmentId = e.target.value;
        state.page = 1;
        render();
      });
    }

    // Semester Filter
    const filterSem = SMS.Utils.$('#filterSemester');
    if (filterSem) {
      filterSem.addEventListener('change', (e) => {
        state.semester = e.target.value;
        state.page = 1;
        render();
      });
    }

    // Status Filter
    const filterStat = SMS.Utils.$('#filterStatus');
    if (filterStat) {
      filterStat.addEventListener('change', (e) => {
        state.status = e.target.value;
        state.page = 1;
        render();
      });
    }

    // Clear All Filters Button
    const clearAllBtn = SMS.Utils.$('#clearAllFiltersBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        state.search = '';
        state.departmentId = 'ALL';
        state.semester = 'ALL';
        state.status = 'ALL';
        state.page = 1;

        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.classList.remove('active');
        if (filterDept) filterDept.value = 'ALL';
        if (filterSem) filterSem.value = 'ALL';
        if (filterStat) filterStat.value = 'ALL';

        render();
      });
    }

    // Page Size Selector
    const pageSizeSelect = SMS.Utils.$('#pageSizeSelect');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        state.limit = parseInt(e.target.value, 10);
        state.page = 1;
        render();
      });
    }

    // Column Header Sorting
    SMS.Utils.$$('.data-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (state.sortField === field) {
          state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortField = field;
          state.sortOrder = 'asc';
        }
        render();
      });
    });
  };

  /**
   * Initialize Students Page
   */
  const init = () => {
    populateDepartmentFilter();
    bindEvents();
    render();

    // Hide Add Student button if logged in as Student
    if (!SMS.Auth.isAdmin()) {
      const addBtn = SMS.Utils.$('#addStudentTopBtn');
      if (addBtn) addBtn.style.display = 'none';
    }
  };

  return {
    init,
    render
  };
})();
