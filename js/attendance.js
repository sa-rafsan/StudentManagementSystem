/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Classroom Attendance Module (attendance.js)
 * Implements Teacher Attendance Marking, Student Attendance Reports,
 * Dynamic Percentage Calculations, Exam Eligibility Checks, and Session History.
 */

window.SMS = window.SMS || {};

SMS.Attendance = (() => {
  // Active state for marking session
  let currentRoster = [];
  let editingSessionId = null;

  /**
   * Safe getter for all attendance sessions
   */
  const getAllSessions = () => {
    return SMS.Storage.getItem(SMS.Storage.KEYS.ATTENDANCE, []);
  };

  /**
   * Save all attendance sessions
   */
  const saveAllSessions = (sessions) => {
    return SMS.Storage.setItem(SMS.Storage.KEYS.ATTENDANCE, sessions);
  };

  /**
   * Get single session by ID
   */
  const getSessionById = (sessionId) => {
    const sessions = getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  };

  /**
   * Save or Update an attendance session
   */
  const saveSession = (sessionData) => {
    const sessions = getAllSessions();
    const now = new Date().toISOString();

    if (sessionData.id) {
      const idx = sessions.findIndex(s => s.id === sessionData.id);
      if (idx !== -1) {
        sessions[idx] = {
          ...sessions[idx],
          ...sessionData,
          updatedAt: now
        };
        saveAllSessions(sessions);
        return sessions[idx];
      }
    }

    // New Session
    const newSession = {
      id: sessionData.id || `ATT-${new Date().toISOString().replace(/\D/g, '').substring(0, 14)}`,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      departmentId: sessionData.departmentId,
      semester: sessionData.semester,
      subject: sessionData.subject || 'General Class Session',
      teacherName: sessionData.teacherName || 'Faculty Instructor',
      records: sessionData.records || [],
      createdAt: now,
      updatedAt: now
    };

    sessions.unshift(newSession);
    saveAllSessions(sessions);
    return newSession;
  };

  /**
   * Delete attendance session by ID
   */
  const deleteSession = (sessionId) => {
    let sessions = getAllSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    return saveAllSessions(sessions);
  };

  /**
   * Calculate Attendance Statistics for a single student
   * @param {string} studentId
   * @returns {Object} statistics object
   */
  const calculateStudentStats = (studentId) => {
    const sessions = getAllSessions();
    let totalSessions = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    const history = [];

    // Sort chronologically descending
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSessions.forEach(session => {
      const rec = (session.records || []).find(r => r.studentId === studentId);
      if (rec) {
        totalSessions++;
        if (rec.status === 'Present') presentCount++;
        else if (rec.status === 'Late') lateCount++;
        else if (rec.status === 'Absent') absentCount++;
        else if (rec.status === 'Excused') excusedCount++;

        history.push({
          sessionId: session.id,
          date: session.date,
          subject: session.subject,
          departmentId: session.departmentId,
          semester: session.semester,
          teacherName: session.teacherName,
          status: rec.status,
          notes: rec.notes || ''
        });
      }
    });

    // Attended count includes Present and Late
    const attendedCount = presentCount + lateCount;
    const percentage = totalSessions > 0
      ? Math.round((attendedCount / totalSessions) * 1000) / 10
      : 0;

    // Determine status badge and threshold
    let statusInfo = {
      label: 'Eligible',
      badgeClass: 'badge-eligible',
      colorClass: 'pct-green',
      textClass: 'pct-text-green',
      status: 'good'
    };

    if (totalSessions > 0) {
      if (percentage < 60) {
        statusInfo = {
          label: 'Critical Shortage',
          badgeClass: 'badge-critical-att',
          colorClass: 'pct-red',
          textClass: 'pct-text-red',
          status: 'critical'
        };
      } else if (percentage < 75) {
        statusInfo = {
          label: 'Warning (<75%)',
          badgeClass: 'badge-warning-att',
          colorClass: 'pct-orange',
          textClass: 'pct-text-orange',
          status: 'warning'
        };
      }
    } else {
      statusInfo = {
        label: 'No Classes',
        badgeClass: 'badge-neutral',
        colorClass: 'pct-orange',
        textClass: 'pct-text-orange',
        status: 'none'
      };
    }

    return {
      studentId,
      totalSessions,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      attendedCount,
      percentage,
      statusInfo,
      history
    };
  };

  /**
   * Get Overall Institutional Attendance Statistics
   */
  const getOverallStats = () => {
    const sessions = getAllSessions();
    const students = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []).filter(s => s.status === 'Active');

    let totalAttendanceEntries = 0;
    let totalPresentOrLate = 0;
    let lowAttendanceCount = 0;

    const studentStatsList = students.map(student => {
      const stats = calculateStudentStats(student.id);
      if (stats.totalSessions > 0 && stats.percentage < 75) {
        lowAttendanceCount++;
      }
      return stats;
    });

    sessions.forEach(sess => {
      (sess.records || []).forEach(r => {
        totalAttendanceEntries++;
        if (r.status === 'Present' || r.status === 'Late') {
          totalPresentOrLate++;
        }
      });
    });

    const averageRate = totalAttendanceEntries > 0
      ? Math.round((totalPresentOrLate / totalAttendanceEntries) * 1000) / 10
      : 0;

    return {
      totalSessions: sessions.length,
      averageRate,
      lowAttendanceCount,
      totalStudentsEnrolled: students.length,
      studentStatsList
    };
  };

  // =========================================================================
  // UI CONTROLLER & EVENT ORCHESTRATION
  // =========================================================================

  /**
   * Initialize Attendance Page Controller
   */
  const init = () => {
    setupTabSwitching();
    populateDropdowns();
    setupDefaultSessionFields();
    bindMarkingControls();
    bindReportControls();
    bindHistoryControls();

    // Default load: load active tab or report
    const currentUser = SMS.Auth.getCurrentUser();
    if (currentUser && currentUser.role === 'Student') {
      const markTabBtn = SMS.Utils.$('.attendance-tab-btn[data-tab="mark"]');
      const historyTabBtn = SMS.Utils.$('.attendance-tab-btn[data-tab="history"]');
      if (markTabBtn) markTabBtn.style.display = 'none';
      if (historyTabBtn) historyTabBtn.style.display = 'none';
      switchTab('report');
      if (currentUser.studentId) {
        const searchInput = SMS.Utils.$('#reportSearch');
        if (searchInput) {
          searchInput.value = currentUser.studentId;
        }
      }
      renderReportsView();
      return;
    }

    const urlTab = SMS.Utils.getUrlParam('tab') || 'mark';
    switchTab(urlTab);
  };

  /**
   * Setup Tab Switching
   */
  const setupTabSwitching = () => {
    SMS.Utils.$$('.attendance-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  };

  const switchTab = (tabName) => {
    SMS.Utils.$$('.attendance-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isTarget);
    });

    SMS.Utils.$$('.tab-pane').forEach(pane => {
      const isTarget = pane.id === `${tabName}Pane`;
      pane.classList.toggle('active', isTarget);
    });

    if (tabName === 'report') {
      renderReportsView();
    } else if (tabName === 'history') {
      renderHistoryView();
    }
  };

  /**
   * Populate Department and Semester Filter Dropdowns
   */
  const populateDropdowns = () => {
    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);

    // Session setup department
    const sessionDept = SMS.Utils.$('#sessionDepartment');
    const reportDept = SMS.Utils.$('#reportDepartment');

    if (sessionDept) {
      sessionDept.innerHTML = '<option value="">Select Department...</option>' +
        departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');
    }

    if (reportDept) {
      reportDept.innerHTML = '<option value="ALL">All Departments</option>' +
        departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');
    }
  };

  /**
   * Set Default Date and Teacher in Setup Box
   */
  const setupDefaultSessionFields = () => {
    const dateInput = SMS.Utils.$('#sessionDate');
    const teacherInput = SMS.Utils.$('#sessionTeacher');
    const currentUser = SMS.Auth.getCurrentUser();

    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (teacherInput && currentUser) {
      teacherInput.value = currentUser.name || 'Prof. Alan Turing';
    }
  };

  /**
   * Bind Roster & Attendance Marking Controls
   */
  const bindMarkingControls = () => {
    const loadBtn = SMS.Utils.$('#loadRosterBtn');
    const saveBtn = SMS.Utils.$('#saveAttendanceBtn');
    const markAllPresentBtn = SMS.Utils.$('#markAllPresentBtn');
    const markAllAbsentBtn = SMS.Utils.$('#markAllAbsentBtn');

    if (loadBtn) {
      loadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadStudentRoster();
      });
    }

    if (markAllPresentBtn) {
      markAllPresentBtn.addEventListener('click', () => {
        setAllRosterStatus('Present');
      });
    }

    if (markAllAbsentBtn) {
      markAllAbsentBtn.addEventListener('click', () => {
        setAllRosterStatus('Absent');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveCurrentSession();
      });
    }
  };

  /**
   * Load Students into Interactive Roster
   */
  const loadStudentRoster = (existingSession = null) => {
    const deptId = existingSession ? existingSession.departmentId : SMS.Utils.$('#sessionDepartment').value;
    const semester = existingSession ? existingSession.semester : SMS.Utils.$('#sessionSemester').value;

    if (!deptId) {
      SMS.Utils.showToast('error', 'Department Required', 'Please select a department to load students.');
      return;
    }
    if (!semester) {
      SMS.Utils.showToast('error', 'Semester Required', 'Please select a semester to load students.');
      return;
    }

    const allStudents = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
    const matchingStudents = allStudents.filter(s =>
      s.departmentId === deptId &&
      s.semester === semester &&
      s.status === 'Active'
    );

    const rosterContainer = SMS.Utils.$('#rosterTableBody');
    const emptyState = SMS.Utils.$('#rosterEmptyState');
    const actionsToolbar = SMS.Utils.$('#rosterActionsToolbar');

    if (!rosterContainer) return;

    if (matchingStudents.length === 0) {
      rosterContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (actionsToolbar) actionsToolbar.style.display = 'none';
      currentRoster = [];
      updateLiveSummary();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (actionsToolbar) actionsToolbar.style.display = 'flex';

    // Build Current Roster State
    currentRoster = matchingStudents.map(student => {
      let defaultStatus = 'Present';
      let defaultNotes = '';

      if (existingSession && Array.isArray(existingSession.records)) {
        const found = existingSession.records.find(r => r.studentId === student.id);
        if (found) {
          defaultStatus = found.status || 'Present';
          defaultNotes = found.notes || '';
        }
      }

      return {
        studentId: student.id,
        fullName: student.fullName,
        email: student.email,
        photo: student.photo,
        status: defaultStatus,
        notes: defaultNotes
      };
    });

    renderRosterRows();
    updateLiveSummary();
  };

  /**
   * Render HTML Rows for Attendance Roster
   */
  const renderRosterRows = () => {
    const tbody = SMS.Utils.$('#rosterTableBody');
    if (!tbody) return;

    tbody.innerHTML = currentRoster.map((item, idx) => {
      const initials = SMS.Utils.getInitials(item.fullName);
      const avatarHTML = item.photo
        ? `<img src="${SMS.Utils.escapeHTML(item.photo)}" alt="${SMS.Utils.escapeHTML(item.fullName)}" class="roster-avatar" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'roster-avatar\\'>${initials}</div>'">`
        : `<div class="roster-avatar">${initials}</div>`;

      // Get overall historical attendance percentage for this student
      const stats = calculateStudentStats(item.studentId);
      const pctBadge = stats.totalSessions > 0
        ? `<span class="badge ${stats.statusInfo.badgeClass}" style="font-size:0.75rem;">${stats.percentage}% Avg</span>`
        : `<span class="badge badge-neutral" style="font-size:0.75rem;">New</span>`;

      return `
        <tr data-student-id="${item.studentId}">
          <td style="font-weight:600;color:var(--text-secondary);">${idx + 1}</td>
          <td>
            <div class="roster-student-info">
              ${avatarHTML}
              <div>
                <div style="font-weight:600;color:var(--text-primary);">${SMS.Utils.escapeHTML(item.fullName)}</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);font-family:var(--font-mono);">${SMS.Utils.escapeHTML(item.studentId)}</div>
              </div>
            </div>
          </td>
          <td>${pctBadge}</td>
          <td>
            <div class="status-pill-group" data-student-id="${item.studentId}">
              <button type="button" class="status-btn ${item.status === 'Present' ? 'active-present' : ''}" data-status="Present" title="Mark Present">
                <i class="fa-solid fa-check"></i> Present
              </button>
              <button type="button" class="status-btn ${item.status === 'Late' ? 'active-late' : ''}" data-status="Late" title="Mark Late">
                <i class="fa-solid fa-clock"></i> Late
              </button>
              <button type="button" class="status-btn ${item.status === 'Absent' ? 'active-absent' : ''}" data-status="Absent" title="Mark Absent">
                <i class="fa-solid fa-xmark"></i> Absent
              </button>
              <button type="button" class="status-btn ${item.status === 'Excused' ? 'active-excused' : ''}" data-status="Excused" title="Mark Excused">
                <i class="fa-solid fa-shield-heart"></i> Excused
              </button>
            </div>
          </td>
          <td>
            <input type="text" class="roster-note-input" data-student-id="${item.studentId}" placeholder="Remarks (optional)..." value="${SMS.Utils.escapeHTML(item.notes)}">
          </td>
        </tr>
      `;
    }).join('');

    // Attach individual button click events
    tbody.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const studentId = btn.closest('.status-pill-group').getAttribute('data-student-id');
        const targetStatus = btn.getAttribute('data-status');
        setSingleStudentStatus(studentId, targetStatus);
      });
    });

    // Attach note input changes
    tbody.querySelectorAll('.roster-note-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const studentId = input.getAttribute('data-student-id');
        const found = currentRoster.find(r => r.studentId === studentId);
        if (found) found.notes = input.value;
      });
    });
  };

  /**
   * Set Status for a Single Student
   */
  const setSingleStudentStatus = (studentId, status) => {
    const item = currentRoster.find(r => r.studentId === studentId);
    if (!item) return;

    item.status = status;

    // Update UI Pill buttons
    const group = SMS.Utils.$(`.status-pill-group[data-student-id="${studentId}"]`);
    if (group) {
      group.querySelectorAll('.status-btn').forEach(btn => {
        const btnStatus = btn.getAttribute('data-status');
        btn.className = `status-btn ${btnStatus === status ? `active-${status.toLowerCase()}` : ''}`;
      });
    }

    updateLiveSummary();
  };

  /**
   * Set Status for All Students on Roster
   */
  const setAllRosterStatus = (status) => {
    currentRoster.forEach(item => {
      item.status = status;
    });

    const tbody = SMS.Utils.$('#rosterTableBody');
    if (tbody) {
      tbody.querySelectorAll('.status-pill-group').forEach(group => {
        group.querySelectorAll('.status-btn').forEach(btn => {
          const btnStatus = btn.getAttribute('data-status');
          btn.className = `status-btn ${btnStatus === status ? `active-${status.toLowerCase()}` : ''}`;
        });
      });
    }

    updateLiveSummary();
  };

  /**
   * Update Live Counter Summary Bar
   */
  const updateLiveSummary = () => {
    const countTotal = currentRoster.length;
    const countPresent = currentRoster.filter(r => r.status === 'Present').length;
    const countLate = currentRoster.filter(r => r.status === 'Late').length;
    const countAbsent = currentRoster.filter(r => r.status === 'Absent').length;
    const countExcused = currentRoster.filter(r => r.status === 'Excused').length;

    const attended = countPresent + countLate;
    const rate = countTotal > 0 ? Math.round((attended / countTotal) * 1000) / 10 : 0;

    const elTotal = SMS.Utils.$('#liveCountTotal');
    const elPresent = SMS.Utils.$('#liveCountPresent');
    const elLate = SMS.Utils.$('#liveCountLate');
    const elAbsent = SMS.Utils.$('#liveCountAbsent');
    const elExcused = SMS.Utils.$('#liveCountExcused');
    const elRate = SMS.Utils.$('#liveCountRate');

    if (elTotal) elTotal.textContent = countTotal;
    if (elPresent) elPresent.textContent = countPresent;
    if (elLate) elLate.textContent = countLate;
    if (elAbsent) elAbsent.textContent = countAbsent;
    if (elExcused) elExcused.textContent = countExcused;
    if (elRate) elRate.textContent = `${rate}%`;
  };

  /**
   * Save Current Attendance Session to LocalStorage
   */
  const saveCurrentSession = () => {
    if (currentRoster.length === 0) {
      SMS.Utils.showToast('error', 'Empty Roster', 'Cannot save attendance: no students are on the roster.');
      return;
    }

    const deptSelect = SMS.Utils.$('#sessionDepartment');
    const semesterSelect = SMS.Utils.$('#sessionSemester');
    const dateInput = SMS.Utils.$('#sessionDate');
    const subjectInput = SMS.Utils.$('#sessionSubject');
    const teacherInput = SMS.Utils.$('#sessionTeacher');

    const departmentId = deptSelect.value;
    const semester = semesterSelect.value;
    const date = dateInput.value || new Date().toISOString().split('T')[0];
    const subject = (subjectInput.value || 'General Classroom Session').trim();
    const teacherName = (teacherInput.value || 'Faculty Instructor').trim();

    if (!departmentId || !semester) {
      SMS.Utils.showToast('error', 'Incomplete Form', 'Please choose Department and Semester.');
      return;
    }

    const records = currentRoster.map(r => ({
      studentId: r.studentId,
      status: r.status,
      notes: r.notes || ''
    }));

    const sessionPayload = {
      id: editingSessionId || undefined,
      date,
      departmentId,
      semester,
      subject,
      teacherName,
      records
    };

    const saved = saveSession(sessionPayload);
    editingSessionId = null;

    const saveBtn = SMS.Utils.$('#saveAttendanceBtn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Attendance Session';
    }

    SMS.Utils.showToast('success', 'Attendance Recorded', `Classroom attendance saved successfully for ${subject} (${date}).`);

    // Switch to report tab to immediately see the results
    setTimeout(() => {
      switchTab('report');
    }, 700);
  };

  // =========================================================================
  // STUDENT REPORTS VIEW
  // =========================================================================

  /**
   * Bind Report Filters and Actions
   */
  const bindReportControls = () => {
    const searchInput = SMS.Utils.$('#reportSearch');
    const deptSelect = SMS.Utils.$('#reportDepartment');
    const semSelect = SMS.Utils.$('#reportSemester');
    const riskSelect = SMS.Utils.$('#reportRiskFilter');
    const printBtn = SMS.Utils.$('#printReportBtn');

    const triggerFilter = () => renderReportsView();

    if (searchInput) searchInput.addEventListener('input', SMS.Utils.debounce(triggerFilter, 250));
    if (deptSelect) deptSelect.addEventListener('change', triggerFilter);
    if (semSelect) semSelect.addEventListener('change', triggerFilter);
    if (riskSelect) riskSelect.addEventListener('change', triggerFilter);

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  };

  /**
   * Render Attendance Reports & Analytics View
   */
  const renderReportsView = () => {
    // 1. Render Summary Metrics
    const overallStats = getOverallStats();
    const metricRate = SMS.Utils.$('#statAvgAttendanceRate');
    const metricSessions = SMS.Utils.$('#statTotalSessions');
    const metricLowCount = SMS.Utils.$('#statLowAttendanceCount');
    const metricEnrolled = SMS.Utils.$('#statTotalEnrolled');

    if (metricRate) metricRate.textContent = `${overallStats.averageRate}%`;
    if (metricSessions) metricSessions.textContent = overallStats.totalSessions;
    if (metricLowCount) metricLowCount.textContent = overallStats.lowAttendanceCount;
    if (metricEnrolled) metricEnrolled.textContent = overallStats.totalStudentsEnrolled;

    // 2. Filter Students
    const searchVal = (SMS.Utils.$('#reportSearch')?.value || '').toLowerCase().trim();
    const deptVal = SMS.Utils.$('#reportDepartment')?.value || 'ALL';
    const semVal = SMS.Utils.$('#reportSemester')?.value || 'ALL';
    const riskVal = SMS.Utils.$('#reportRiskFilter')?.value || 'ALL';

    const allStudents = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []);
    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
    const deptMap = new Map(departments.map(d => [d.id, d]));

    let filtered = allStudents.filter(student => {
      // Search
      const matchSearch = !searchVal ||
        student.fullName.toLowerCase().includes(searchVal) ||
        student.id.toLowerCase().includes(searchVal) ||
        student.email.toLowerCase().includes(searchVal);

      // Dept
      const matchDept = deptVal === 'ALL' || student.departmentId === deptVal;

      // Sem
      const matchSem = semVal === 'ALL' || student.semester === semVal;

      return matchSearch && matchDept && matchSem;
    });

    // Compute stats for each student and filter by risk if requested
    const studentReportList = filtered.map(student => {
      const stats = calculateStudentStats(student.id);
      const dept = deptMap.get(student.departmentId);
      return {
        ...student,
        departmentCode: dept ? dept.code : 'N/A',
        departmentName: dept ? dept.name : 'Unknown',
        stats
      };
    }).filter(item => {
      if (riskVal === 'ELIGIBLE') return item.stats.percentage >= 75;
      if (riskVal === 'WARNING') return item.stats.totalSessions > 0 && item.stats.percentage < 75;
      if (riskVal === 'CRITICAL') return item.stats.totalSessions > 0 && item.stats.percentage < 60;
      return true;
    });

    // Sort by attendance percentage ascending (shows lowest/at-risk first) or name
    studentReportList.sort((a, b) => a.stats.percentage - b.stats.percentage);

    renderReportTable(studentReportList);
  };

  /**
   * Render Report Table Rows
   */
  const renderReportTable = (list) => {
    const tbody = SMS.Utils.$('#reportTableBody');
    const emptyState = SMS.Utils.$('#reportEmptyState');
    const recordCountEl = SMS.Utils.$('#reportRecordCount');

    if (!tbody) return;

    if (recordCountEl) {
      recordCountEl.textContent = `Showing ${list.length} student record${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = list.map(item => {
      const stats = item.stats;
      const initials = SMS.Utils.getInitials(item.fullName);
      const avatarHTML = item.photo
        ? `<img src="${SMS.Utils.escapeHTML(item.photo)}" alt="${SMS.Utils.escapeHTML(item.fullName)}" class="roster-avatar" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'roster-avatar\\'>${initials}</div>'">`
        : `<div class="roster-avatar">${initials}</div>`;

      // Percentage bar fill color
      let barColor = 'pct-green';
      if (stats.percentage < 60) barColor = 'pct-red';
      else if (stats.percentage < 75) barColor = 'pct-orange';

      return `
        <tr>
          <td>
            <div class="roster-student-info">
              ${avatarHTML}
              <div>
                <a href="student-details.html?id=${encodeURIComponent(item.id)}" style="font-weight:600;color:var(--primary);text-decoration:none;">${SMS.Utils.escapeHTML(item.fullName)}</a>
                <div style="font-size:0.78rem;color:var(--text-secondary);font-family:var(--font-mono);">${SMS.Utils.escapeHTML(item.id)}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-dept" style="background:#f1f5f9;color:var(--text-primary);font-weight:600;">${SMS.Utils.escapeHTML(item.departmentCode)}</span>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${item.semester} Sem</div>
          </td>
          <td style="text-align:center;font-weight:600;">${stats.totalSessions}</td>
          <td style="text-align:center;color:#15803d;font-weight:600;">${stats.presentCount}</td>
          <td style="text-align:center;color:#b45309;font-weight:600;">${stats.lateCount}</td>
          <td style="text-align:center;color:#b91c1c;font-weight:600;">${stats.absentCount}</td>
          <td class="pct-cell">
            <div class="pct-bar-wrapper">
              <div class="pct-progress-track">
                <div class="pct-progress-fill ${barColor}" style="width: ${Math.min(stats.percentage, 100)}%;"></div>
              </div>
              <span class="pct-value ${stats.statusInfo.textClass}">${stats.percentage}%</span>
            </div>
          </td>
          <td>
            <span class="badge ${stats.statusInfo.badgeClass}">
              ${stats.statusInfo.label}
            </span>
          </td>
          <td style="text-align:right;">
            <button type="button" class="btn btn-outline btn-sm btn-view-history" data-student-id="${item.id}" title="View Attendance History">
              <i class="fa-solid fa-list-check"></i> History
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach student history modal click
    tbody.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = btn.getAttribute('data-student-id');
        openStudentHistoryModal(studentId);
      });
    });
  };

  /**
   * Open Detailed Student History Modal
   */
  const openStudentHistoryModal = (studentId) => {
    const student = SMS.Storage.getItem(SMS.Storage.KEYS.STUDENTS, []).find(s => s.id === studentId);
    if (!student) return;

    const stats = calculateStudentStats(studentId);
    const modal = SMS.Utils.$('#studentHistoryModal');
    const modalBackdrop = SMS.Utils.$('#studentHistoryModalBackdrop');

    if (!modalBackdrop) return;

    // Set modal title & summary
    const titleEl = SMS.Utils.$('#historyModalTitle');
    const summaryEl = SMS.Utils.$('#historyModalSummary');
    const listEl = SMS.Utils.$('#historyModalList');

    if (titleEl) {
      titleEl.innerHTML = `<i class="fa-solid fa-calendar-check" style="color:var(--primary);"></i> Attendance Log: ${SMS.Utils.escapeHTML(student.fullName)}`;
    }

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:1.5rem;padding:0.75rem 1rem;background:#f8fafc;border-radius:var(--radius-md);margin-bottom:1rem;border:1px solid var(--border-color);align-items:center;">
          <div><span style="font-size:0.78rem;color:var(--text-secondary);">Total Classes:</span> <strong>${stats.totalSessions}</strong></div>
          <div><span style="font-size:0.78rem;color:var(--text-secondary);">Present:</span> <strong style="color:#15803d;">${stats.presentCount}</strong></div>
          <div><span style="font-size:0.78rem;color:var(--text-secondary);">Late:</span> <strong style="color:#b45309;">${stats.lateCount}</strong></div>
          <div><span style="font-size:0.78rem;color:var(--text-secondary);">Absent:</span> <strong style="color:#b91c1c;">${stats.absentCount}</strong></div>
          <div><span style="font-size:0.78rem;color:var(--text-secondary);">Rate:</span> <strong class="${stats.statusInfo.textClass}" style="font-size:1.1rem;">${stats.percentage}%</strong></div>
          <div><span class="badge ${stats.statusInfo.badgeClass}">${stats.statusInfo.label}</span></div>
        </div>
      `;
    }

    if (listEl) {
      if (stats.history.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">No classroom attendance recorded for this student yet.</div>';
      } else {
        listEl.innerHTML = stats.history.map(entry => {
          let badgeClass = 'badge-active';
          if (entry.status === 'Absent') badgeClass = 'badge-critical-att';
          else if (entry.status === 'Late') badgeClass = 'badge-warning-att';
          else if (entry.status === 'Excused') badgeClass = 'badge-dept';

          return `
            <div class="att-history-item">
              <div class="att-history-main">
                <div class="att-history-date">${SMS.Utils.formatDate(entry.date)}</div>
                <div class="att-history-subject">${SMS.Utils.escapeHTML(entry.subject)} &bull; <span style="font-size:0.75rem;">${SMS.Utils.escapeHTML(entry.teacherName)}</span></div>
                ${entry.notes ? `<div class="att-history-note">Note: "${SMS.Utils.escapeHTML(entry.notes)}"</div>` : ''}
              </div>
              <div>
                <span class="badge ${badgeClass}" style="font-weight:600;padding:0.35rem 0.75rem;">
                  ${entry.status}
                </span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    modalBackdrop.classList.add('open');
  };

  // =========================================================================
  // SESSION HISTORY VIEW
  // =========================================================================

  /**
   * Bind History Controls
   */
  const bindHistoryControls = () => {
    // Modal Close
    const closeBtn = SMS.Utils.$('#closeHistoryModalBtn');
    const closeFooterBtn = SMS.Utils.$('#closeHistoryModalFooterBtn');
    const backdrop = SMS.Utils.$('#studentHistoryModalBackdrop');

    const closeModal = () => {
      if (backdrop) backdrop.classList.remove('open');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }
  };

  /**
   * Render History Log Table
   */
  const renderHistoryView = () => {
    const sessions = getAllSessions();
    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);
    const deptMap = new Map(departments.map(d => [d.id, d]));

    const tbody = SMS.Utils.$('#historyTableBody');
    const emptyState = SMS.Utils.$('#historyEmptyState');

    if (!tbody) return;

    if (sessions.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Sort descending by date
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(sess => {
      const dept = deptMap.get(sess.departmentId);
      const totalEnrolled = (sess.records || []).length;
      const presentCount = (sess.records || []).filter(r => r.status === 'Present' || r.status === 'Late').length;
      const rate = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 1000) / 10 : 0;

      let rateColor = 'pct-text-green';
      if (rate < 60) rateColor = 'pct-text-red';
      else if (rate < 75) rateColor = 'pct-text-orange';

      return `
        <tr>
          <td style="font-weight:600;color:var(--text-primary);">${SMS.Utils.formatDate(sess.date)}</td>
          <td>
            <div style="font-weight:600;color:var(--text-primary);">${SMS.Utils.escapeHTML(sess.subject)}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);font-family:var(--font-mono);">${sess.id}</div>
          </td>
          <td>
            <span class="badge badge-dept" style="background:#f1f5f9;color:var(--text-primary);font-weight:600;">${dept ? dept.code : 'N/A'}</span>
            <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:4px;">${sess.semester} Sem</span>
          </td>
          <td>${SMS.Utils.escapeHTML(sess.teacherName)}</td>
          <td style="text-align:center;">
            <strong>${presentCount}</strong> / ${totalEnrolled}
          </td>
          <td style="font-weight:700;" class="${rateColor}">
            ${rate}%
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:0.35rem;">
              <button type="button" class="btn btn-outline btn-sm btn-edit-session" data-session-id="${sess.id}" title="Edit this session">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-delete-session" data-session-id="${sess.id}" data-session-title="${SMS.Utils.escapeHTML(sess.subject)} (${sess.date})" title="Delete this session" style="color:var(--danger);border-color:#fecaca;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind edit session buttons
    tbody.querySelectorAll('.btn-edit-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.getAttribute('data-session-id');
        loadSessionForEditing(sessionId);
      });
    });

    // Bind delete session buttons
    tbody.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.getAttribute('data-session-id');
        const sessionTitle = btn.getAttribute('data-session-title');
        confirmDeleteSession(sessionId, sessionTitle);
      });
    });
  };

  /**
   * Load existing session for editing into Mark Tab
   */
  const loadSessionForEditing = (sessionId) => {
    const session = getSessionById(sessionId);
    if (!session) return;

    editingSessionId = session.id;

    // Populate Setup Fields
    const deptSelect = SMS.Utils.$('#sessionDepartment');
    const semSelect = SMS.Utils.$('#sessionSemester');
    const dateInput = SMS.Utils.$('#sessionDate');
    const subjectInput = SMS.Utils.$('#sessionSubject');
    const teacherInput = SMS.Utils.$('#sessionTeacher');
    const saveBtn = SMS.Utils.$('#saveAttendanceBtn');

    if (deptSelect) deptSelect.value = session.departmentId;
    if (semSelect) semSelect.value = session.semester;
    if (dateInput) dateInput.value = session.date;
    if (subjectInput) subjectInput.value = session.subject;
    if (teacherInput) teacherInput.value = session.teacherName;

    if (saveBtn) {
      saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Update Attendance Session';
    }

    // Switch to mark tab and load roster with existing records
    switchTab('mark');
    loadStudentRoster(session);
    SMS.Utils.showToast('info', 'Editing Session', `Loaded attendance session for ${session.subject} (${session.date}).`);
  };

  /**
   * Confirm Delete Session
   */
  const confirmDeleteSession = (sessionId, sessionTitle) => {
    SMS.Utils.showConfirmModal({
      title: 'Delete Attendance Session',
      message: `Are you sure you want to delete the attendance records for "${sessionTitle}"? This cannot be undone.`,
      confirmText: 'Yes, Delete Session',
      confirmType: 'danger',
      onConfirm: () => {
        deleteSession(sessionId);
        SMS.Utils.showToast('success', 'Session Deleted', 'Attendance session was removed.');
        renderHistoryView();
      }
    });
  };

  return {
    init,
    getAllSessions,
    getSessionById,
    saveSession,
    deleteSession,
    calculateStudentStats,
    getOverallStats
  };
})();
