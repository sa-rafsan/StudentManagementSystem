/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Dashboard Controller Module (dashboard.js)
 * Calculates dynamic metrics, renders department statistics, recent students,
 * and initializes Chart.js visualizations with fallback support.
 */

window.SMS = window.SMS || {};

SMS.Dashboard = (() => {
  let enrollmentChartInstance = null;
  let genderChartInstance = null;

  /**
   * Compute all aggregate statistics from LocalStorage
   */
  const computeStats = () => {
    const students = SMS.StudentService.getAll();
    const departments = SMS.Storage.getItem(SMS.Storage.KEYS.DEPARTMENTS, []);

    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status.toLowerCase() === 'active').length;
    const inactiveStudents = totalStudents - activeStudents;
    const totalDepartments = departments.length;

    // Gender breakdown
    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    students.forEach(s => {
      const g = (s.gender || '').toLowerCase();
      if (g === 'male') maleCount++;
      else if (g === 'female') femaleCount++;
      else otherCount++;
    });

    // Department breakdown
    const deptStats = departments.map(dept => {
      const count = students.filter(s => s.departmentId === dept.id).length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        count,
        percentage
      };
    }).sort((a, b) => b.count - a.count);

    // Enrollment by Semester breakdown
    const semesterOrder = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
    const semesterMap = {};
    semesterOrder.forEach(sem => { semesterMap[sem] = 0; });
    students.forEach(s => {
      if (semesterMap[s.semester] !== undefined) {
        semesterMap[s.semester]++;
      } else {
        semesterMap[s.semester] = (semesterMap[s.semester] || 0) + 1;
      }
    });

    // Recent 5 students
    const recentStudents = [...students].sort((a, b) => {
      return new Date(b.createdAt || b.enrollmentDate) - new Date(a.createdAt || a.enrollmentDate);
    }).slice(0, 5);

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalDepartments,
      gender: {
        male: maleCount,
        female: femaleCount,
        other: otherCount,
        malePct: totalStudents > 0 ? Math.round((maleCount / totalStudents) * 100) : 0,
        femalePct: totalStudents > 0 ? Math.round((femaleCount / totalStudents) * 100) : 0
      },
      deptStats,
      semesterMap,
      recentStudents
    };
  };

  /**
   * Render Top Counter Cards
   */
  const renderCounterCards = (stats) => {
    const totalEl = SMS.Utils.$('#statTotalStudents');
    const activeEl = SMS.Utils.$('#statActiveStudents');
    const inactiveEl = SMS.Utils.$('#statInactiveStudents');
    const deptEl = SMS.Utils.$('#statTotalDepartments');

    if (totalEl) totalEl.textContent = stats.totalStudents;
    if (activeEl) activeEl.textContent = stats.activeStudents;
    if (inactiveEl) inactiveEl.textContent = stats.inactiveStudents;
    if (deptEl) deptEl.textContent = stats.totalDepartments;

    const attEl = SMS.Utils.$('#statAttendanceRate');
    if (attEl && window.SMS.Attendance) {
      const overall = SMS.Attendance.getOverallStats();
      attEl.textContent = `${overall.averageRate}%`;
    }
  };

  /**
   * Render Department Statistics Progress Bars
   */
  const renderDepartmentList = (stats) => {
    const container = SMS.Utils.$('#deptStatsContainer');
    if (!container) return;

    if (stats.deptStats.length === 0) {
      container.innerHTML = `<p class="text-muted">No departments created yet.</p>`;
      return;
    }

    container.innerHTML = stats.deptStats.map(dept => `
      <div class="dept-stat-item">
        <div class="dept-stat-header">
          <span class="dept-stat-name">
            <span class="dept-stat-code">${SMS.Utils.escapeHTML(dept.code)}</span>
            ${SMS.Utils.escapeHTML(dept.name)}
          </span>
          <span class="dept-stat-count">${dept.count} students (${dept.percentage}%)</span>
        </div>
        <div class="dept-stat-bar-bg">
          <div class="dept-stat-bar-fill" style="width: ${dept.percentage}%"></div>
        </div>
      </div>
    `).join('');
  };

  /**
   * Render Recent Students Table
   */
  const renderRecentStudents = (stats) => {
    const tbody = SMS.Utils.$('#recentStudentsTbody');
    const emptyState = SMS.Utils.$('#recentStudentsEmpty');
    if (!tbody) return;

    if (stats.recentStudents.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = stats.recentStudents.map(student => {
      const avatarHtml = student.photo
        ? `<img src="${SMS.Utils.escapeHTML(student.photo)}" alt="${SMS.Utils.escapeHTML(student.fullName)}" class="student-table-avatar" onerror="this.onerror=null;this.parentElement.textContent='${SMS.Utils.getInitials(student.fullName)}'">`
        : `<div class="student-table-avatar">${SMS.Utils.getInitials(student.fullName)}</div>`;

      const statusBadge = student.status === 'Active'
        ? `<span class="badge badge-active"><span class="badge-dot"></span> Active</span>`
        : `<span class="badge badge-inactive"><span class="badge-dot"></span> Inactive</span>`;

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
          <td><span class="badge badge-primary">${SMS.Utils.escapeHTML(student.departmentCode)}</span></td>
          <td>${SMS.Utils.escapeHTML(student.semester)}</td>
          <td>${statusBadge}</td>
          <td>${SMS.Utils.formatDate(student.enrollmentDate)}</td>
          <td>
            <a href="student-details.html?id=${encodeURIComponent(student.id)}" class="btn btn-secondary btn-icon btn-sm" title="View Details">
              <i class="fa-regular fa-eye"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');
  };

  /**
   * Initialize or Update Charts (Chart.js or Canvas Fallback)
   */
  const initCharts = (stats) => {
    const enrollmentCtx = SMS.Utils.$('#enrollmentChart');
    const genderCtx = SMS.Utils.$('#genderChart');

    if (!enrollmentCtx || !genderCtx) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      renderCanvasFallback(enrollmentCtx, genderCtx, stats);
      return;
    }

    // Destroy existing instances if refreshing
    if (enrollmentChartInstance) enrollmentChartInstance.destroy();
    if (genderChartInstance) genderChartInstance.destroy();

    // 1. Enrollment Overview Chart (Bar Chart)
    const semesterLabels = Object.keys(stats.semesterMap).map(k => `${k} Sem`);
    const semesterData = Object.values(stats.semesterMap);

    enrollmentChartInstance = new Chart(enrollmentCtx, {
      type: 'bar',
      data: {
        labels: semesterLabels,
        datasets: [{
          label: 'Enrolled Students',
          data: semesterData,
          backgroundColor: 'rgba(37, 99, 235, 0.85)',
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    // 2. Gender Distribution Chart (Doughnut Chart)
    genderChartInstance = new Chart(genderCtx, {
      type: 'doughnut',
      data: {
        labels: ['Female', 'Male', 'Other'],
        datasets: [{
          data: [stats.gender.female, stats.gender.male, stats.gender.other],
          backgroundColor: ['#ec4899', '#2563eb', '#10b981'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              font: { family: 'Inter', size: 12 }
            }
          }
        },
        cutout: '68%'
      }
    });
  };

  /**
   * Graceful fallback when Chart.js CDN is unavailable
   */
  const renderCanvasFallback = (enrollmentEl, genderEl, stats) => {
    if (enrollmentEl && enrollmentEl.parentElement) {
      enrollmentEl.parentElement.innerHTML = `
        <div style="display:flex;align-items:flex-end;gap:1rem;height:240px;width:100%;padding:1rem 0;border-bottom:2px solid #cbd5e1;">
          ${Object.entries(stats.semesterMap).map(([sem, cnt]) => {
            const h = stats.totalStudents > 0 ? Math.max(15, (cnt / stats.totalStudents) * 200) : 10;
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.4rem;height:100%;justify-content:flex-end;">
                <span style="font-size:0.75rem;font-weight:700;color:var(--primary);">${cnt}</span>
                <div style="width:100%;height:${h}px;background:var(--primary);border-radius:4px 4px 0 0;"></div>
                <span style="font-size:0.75rem;color:var(--text-muted);">${sem}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (genderEl && genderEl.parentElement) {
      genderEl.parentElement.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:1.5rem;justify-content:center;height:240px;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#fdf2f8;border-radius:8px;">
            <span style="font-weight:600;color:#9d174d;"><i class="fa-solid fa-venus"></i> Female</span>
            <span style="font-weight:700;color:#9d174d;">${stats.gender.female} (${stats.gender.femalePct}%)</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#eff6ff;border-radius:8px;">
            <span style="font-weight:600;color:#1e40af;"><i class="fa-solid fa-mars"></i> Male</span>
            <span style="font-weight:700;color:#1e40af;">${stats.gender.male} (${stats.gender.malePct}%)</span>
          </div>
        </div>
      `;
    }
  };

  /**
   * Main Dashboard Initialization
   */
  const init = () => {
    const stats = computeStats();
    renderCounterCards(stats);
    renderDepartmentList(stats);
    renderRecentStudents(stats);
    initCharts(stats);

    // Display personalized role banner & quick stats
    const currentUser = SMS.Auth.getCurrentUser();
    const rolePanel = SMS.Utils.$('#rolePersonalizedPanel');

    if (currentUser && rolePanel) {
      if (currentUser.role === 'Student' && currentUser.studentId) {
        const studentResults = window.SMS.AssessmentService ? SMS.AssessmentService.getAllResultsForStudent(currentUser.studentId) : [];
        const enrolledCourses = window.SMS.CourseService ? SMS.CourseService.getStudentEnrolledCourses(currentUser.studentId) : [];

        let totalObt = 0;
        let totalMax = 0;
        studentResults.forEach(r => {
          totalObt += r.result.totalObtained;
          totalMax += r.result.totalMarks;
        });
        const avgPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;

        rolePanel.innerHTML = `
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-primary" style="margin-bottom: 0.35rem;">Student Academic Portal</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e3a8a; margin: 0;">Welcome, ${SMS.Utils.escapeHTML(currentUser.name)} (${currentUser.studentId})</h3>
              <p style="font-size: 0.88rem; color: #3b82f6; margin-top: 0.25rem;">Enrolled in ${enrolledCourses.length} courses this semester &bull; Cumulative Score: ${totalObt}/${totalMax} (${avgPct}%)</p>
            </div>
            <div style="display: flex; gap: 0.6rem;">
              <a href="results.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-square-poll-vertical"></i> View My Results</a>
              <a href="courses.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-book-open"></i> My Courses</a>
              <a href="assessments.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-pen-ruler"></i> My Assessments</a>
            </div>
          </div>
        `;
      } else if (currentUser.role === 'Teacher' && currentUser.teacherId) {
        const myCourses = window.SMS.CourseService ? SMS.CourseService.getCoursesByTeacher(currentUser.teacherId) : [];
        rolePanel.innerHTML = `
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-success" style="margin-bottom: 0.35rem;">Faculty Instructor Portal</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #14532d; margin: 0;">Welcome back, ${SMS.Utils.escapeHTML(currentUser.name)}</h3>
              <p style="font-size: 0.88rem; color: #16a34a; margin-top: 0.25rem;">You are currently assigned to instruct <strong>${myCourses.length} courses</strong> with active 12-week curricula.</p>
            </div>
            <div style="display: flex; gap: 0.6rem;">
              <a href="courses.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-book-open"></i> Manage My Courses</a>
              <a href="assessments.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-pen-ruler"></i> Grade Assessments</a>
              <a href="results.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-square-poll-vertical"></i> Enter Marks</a>
            </div>
          </div>
        `;
      } else {
        // Admin
        const allSemesters = window.SMS.CourseService ? SMS.CourseService.getAllSemesters() : [];
        const allCourses = window.SMS.CourseService ? SMS.CourseService.getAllCourses() : [];
        rolePanel.innerHTML = `
          <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 1px solid #e9d5ff; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.35rem;">Academic Administrator Master View</span>
              <h3 style="font-size: 1.2rem; font-weight: 800; color: #581c87; margin: 0;">University Administration Console</h3>
              <p style="font-size: 0.88rem; color: #7e22ce; margin-top: 0.25rem;">Total Semesters: <strong>${allSemesters.length}</strong> &bull; Total Courses: <strong>${allCourses.length}</strong> (12 Weeks each)</p>
            </div>
            <div style="display: flex; gap: 0.6rem;">
              <a href="semesters.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-calendar-week"></i> Manage Semesters</a>
              <a href="courses.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-book-open"></i> Manage Courses</a>
              <a href="results.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-square-poll-vertical"></i> Results Console</a>
            </div>
          </div>
        `;
      }
    }

    // Display student notice if user is logged in as Student
    if (currentUser && currentUser.role === 'Student') {
      const banner = SMS.Utils.$('#studentWelcomeNotice');
      if (banner) {
        banner.style.display = 'flex';
        const nameSpan = SMS.Utils.$('#studentWelcomeName');
        if (nameSpan) nameSpan.textContent = currentUser.name;
        const profileBtn = SMS.Utils.$('#studentViewMyProfileBtn');
        if (profileBtn && currentUser.studentId) {
          profileBtn.href = `student-details.html?id=${encodeURIComponent(currentUser.studentId)}`;
        }
      }
    }
  };

  return {
    init,
    computeStats
  };
})();
