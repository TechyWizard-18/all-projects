// Utility Functions

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Get initials from name
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Toast Notification System
const toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    this.init();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    toastEl.innerHTML = `
      <i class="${icons[type] || icons.info}"></i>
      <span>${message}</span>
    `;

    this.container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  },

  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  warning(message) { this.show(message, 'warning'); },
  info(message) { this.show(message, 'info'); }
};

// Modal Helper
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on clicking overlay
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Mobile menu toggle
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

// Loading state
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
  }
}

// Empty state
function showEmptyState(containerId, message, icon = 'fas fa-inbox') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="${icon}"></i>
        <h3>No Data Found</h3>
        <p>${message}</p>
      </div>
    `;
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get badge class based on status
function getStatusBadge(status) {
  const badges = {
    active: 'badge-success',
    inactive: 'badge-secondary',
    paid: 'badge-success',
    pending: 'badge-warning',
    partial: 'badge-primary',
    overdue: 'badge-danger',
    present: 'badge-success',
    absent: 'badge-danger',
    late: 'badge-warning'
  };
  return badges[status] || 'badge-secondary';
}

// Calculate days until due
function daysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Export to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    toast.warning('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let cell = row[header] || '';
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Form validation
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      isValid = false;
    } else {
      field.classList.remove('is-invalid');
    }
  });

  if (!isValid) {
    toast.error('Please fill in all required fields');
  }

  return isValid;
}

// Get form data as object
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const formData = new FormData(form);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = value;
  });

  return data;
}

// Reset form
function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(field => {
      field.classList.remove('is-invalid');
    });
  }
}

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get current month and year
function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: monthNames[now.getMonth()],
    year: now.getFullYear()
  };
}

// Confirm dialog
function confirmAction(message) {
  return new Promise((resolve) => {
    if (confirm(message)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}
