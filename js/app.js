/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Main Application Bootstrap (app.js)
 * Global layout orchestration, mobile sidebar navigation, route guards,
 * active links, and user session synchronization.
 */

window.SMS = window.SMS || {};

SMS.App = (() => {
  /**
   * Determine current page filename
   */
  const getCurrentPageName = () => {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename || 'index.html';
  };

  /**
   * Setup Mobile Sidebar Drawer Controls
   */
  const setupSidebar = () => {
    const toggleBtn = SMS.Utils.$('#sidebarToggleBtn');
    const closeBtn = SMS.Utils.$('#sidebarCloseBtn');
    const overlay = SMS.Utils.$('#sidebarOverlay');

    const openSidebar = () => {
      document.body.classList.add('sidebar-open');
    };

    const closeSidebar = () => {
      document.body.classList.remove('sidebar-open');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
  };

  /**
   * Sync User Profile Info into Sidebar and Header
   */
  const syncUserInfo = () => {
    const user = SMS.Auth.getCurrentUser();
    if (!user) return;

    // Header Meta Pill / Badge
    const headerRoleEl = SMS.Utils.$('#headerUserRole');
    if (headerRoleEl) {
      headerRoleEl.textContent = user.role;
    }

    // Sidebar footer user card
    const nameEl = SMS.Utils.$('#sidebarUserName');
    const roleEl = SMS.Utils.$('#sidebarUserRole');
    const avatarEl = SMS.Utils.$('#sidebarUserAvatar');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = `${user.role} Account`;
    if (avatarEl) avatarEl.textContent = SMS.Utils.getInitials(user.name);

    // Logout buttons
    SMS.Utils.$$('.btn-logout').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        SMS.Utils.showConfirmModal({
          title: 'Sign Out',
          message: 'Are you sure you want to end your current session?',
          confirmText: 'Sign Out',
          confirmType: 'primary',
          onConfirm: () => {
            SMS.Auth.logout();
          }
        });
      });
    });

    // Hide or disable administrative nav items based on role
    if (user.role === 'Student') {
      const addStudentLink = SMS.Utils.$('#navLinkAddStudent');
      const settingsLink = SMS.Utils.$('#navLinkSettings');

      if (addStudentLink) {
        addStudentLink.parentElement.style.display = 'none';
      }
      if (settingsLink) {
        settingsLink.parentElement.style.display = 'none';
      }
    } else if (user.role === 'Teacher') {
      const addStudentLink = SMS.Utils.$('#navLinkAddStudent');
      const settingsLink = SMS.Utils.$('#navLinkSettings');
      if (addStudentLink) {
        addStudentLink.parentElement.style.display = 'none';
      }
      if (settingsLink) {
        settingsLink.parentElement.style.display = 'none';
      }
    }
  };

  /**
   * Highlight Active Navigation Link
   */
  const highlightActiveNav = () => {
    const currentPage = getCurrentPageName();
    SMS.Utils.$$('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  /**
   * Main DOMContentLoaded Entrypoint
   */
  const init = () => {
    // 1. Ensure storage is initialized with demo data
    SMS.Storage.initStorage();

    const currentPage = getCurrentPageName();
    const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';

    // 2. Route Protection for Protected Pages
    if (!isAuthPage) {
      // Pages restricted to Admin role only
      const adminOnlyPages = ['settings.html'];
      const allowedRoles = adminOnlyPages.includes(currentPage) ? ['Admin'] : ['Admin', 'Teacher', 'Student'];

      const isAuthorized = SMS.Auth.requireAuth(allowedRoles);
      if (!isAuthorized) return; // Stopped by guard redirect

      // If on add-student.html and not an administrator
      if (currentPage === 'add-student.html' && !SMS.Auth.isAdmin()) {
        const studentIdParam = SMS.Utils.getUrlParam('id');
        const currentUser = SMS.Auth.getCurrentUser();
        // Allow student to edit ONLY their own linked record, otherwise block
        if (SMS.Auth.isStudent() && studentIdParam && currentUser && studentIdParam === currentUser.studentId) {
          // Allow student to view/edit their own linked profile
        } else {
          SMS.Utils.showToast('error', 'Access Restricted', 'Only Administrators have permission to register students.');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);
          return;
        }
      }

      // Initialize Layout elements
      setupSidebar();
      syncUserInfo();
      highlightActiveNav();
    }

    // 3. Page Specific Initializations
    if (currentPage === 'index.html' || currentPage === '') {
      if (SMS.Dashboard) SMS.Dashboard.init();
    } else if (currentPage === 'students.html') {
      if (SMS.StudentsPage) SMS.StudentsPage.init();
    } else if (currentPage === 'student-details.html') {
      if (SMS.StudentDetails) SMS.StudentDetails.init();
    } else if (currentPage === 'settings.html') {
      if (SMS.Settings) SMS.Settings.init();
    }
  };

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    getCurrentPageName
  };
})();
