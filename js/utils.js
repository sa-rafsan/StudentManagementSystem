/**
 * STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
 * Utility Functions (utils.js)
 */

window.SMS = window.SMS || {};

SMS.Utils = {
  /**
   * Safe DOM Selector query
   */
  $: (selector, scope = document) => scope.querySelector(selector),
  $$: (selector, scope = document) => Array.from(scope.querySelectorAll(selector)),

  /**
   * Escape HTML entities to prevent XSS attacks when displaying user input
   */
  escapeHTML: (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Format ISO date string or Date object into human-readable format
   * e.g. "Oct 15, 2024"
   */
  formatDate: (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Calculate age from Date of Birth
   */
  calculateAge: (dobStr) => {
    if (!dobStr) return 'N/A';
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : 'N/A';
  },

  /**
   * Generate sequential or timestamped Student ID (e.g., STU-2024-001)
   */
  generateStudentID: (existingStudents = []) => {
    const currentYear = new Date().getFullYear();
    const prefix = `STU-${currentYear}-`;
    
    // Find highest existing counter for this year
    let maxNum = 0;
    existingStudents.forEach(stu => {
      if (stu.id && stu.id.startsWith(prefix)) {
        const numPart = parseInt(stu.id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    const nextNum = String(maxNum + 1).padStart(3, '0');
    return `${prefix}${nextNum}`;
  },

  /**
   * Generate UUID v4 for unique IDs
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Debounce helper for search input
   */
  debounce: (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Get URL Query Parameter by Name
   */
  getUrlParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Toast Notification System
   */
  showToast: (type = 'info', title = '', message = '', duration = 3500) => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon mapping
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${SMS.Utils.escapeHTML(title || type.toUpperCase())}</div>
        <div class="toast-message">${SMS.Utils.escapeHTML(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const closeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }
  },

  /**
   * Reusable Custom Confirmation Modal
   */
  showConfirmModal: ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmType = 'danger',
    onConfirm = () => {},
    onCancel = () => {}
  } = {}) => {
    // Remove any existing modal
    const existing = document.querySelector('.modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    let iconHtml = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger)"></i>';
    if (confirmType === 'primary') {
      iconHtml = '<i class="fa-solid fa-circle-question" style="color: var(--primary)"></i>';
    }

    backdrop.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${iconHtml} ${SMS.Utils.escapeHTML(title)}</h3>
          <button class="modal-close-btn" id="modalCloseX" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>${SMS.Utils.escapeHTML(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modalCancelBtn">${SMS.Utils.escapeHTML(cancelText)}</button>
          <button class="btn btn-${confirmType}" id="modalConfirmBtn">${SMS.Utils.escapeHTML(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Animate in
    requestAnimationFrame(() => {
      backdrop.classList.add('show');
    });

    const closeModal = () => {
      backdrop.classList.remove('show');
      setTimeout(() => {
        backdrop.remove();
      }, 200);
    };

    backdrop.querySelector('#modalCloseX').addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });

    backdrop.querySelector('#modalCancelBtn').addEventListener('click', () => {
      closeModal();
      if (onCancel) onCancel();
    });

    backdrop.querySelector('#modalConfirmBtn').addEventListener('click', () => {
      closeModal();
      if (onConfirm) onConfirm();
    });

    // Dismiss on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
        if (onCancel) onCancel();
      }
    });
  },

  /**
   * Fallback Avatar initials generator
   */
  getInitials: (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
};
