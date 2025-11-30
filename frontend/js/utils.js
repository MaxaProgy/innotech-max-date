// MaxDate Utility Functions

// Form validation
function validateEmail(email) {
  if (!email || email.length > 50) {
    return 'Email не должен превышать 50 символов';
  }
  if (!email.includes('@')) {
    return 'Email должен содержать @';
  }
  if (!email.toLowerCase().endsWith('.ru')) {
    return 'Email должен заканчиваться на .ru';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 8 || password.length > 20) {
    return 'Пароль должен содержать от 8 до 20 символов';
  }
  if (!/\d/.test(password)) {
    return 'Пароль должен содержать минимум одну цифру';
  }
  if (!/[а-яё]/.test(password)) {
    return 'Пароль должен содержать минимум одну строчную букву кириллицы';
  }
  if (!/[А-ЯЁ]/.test(password)) {
    return 'Пароль должен содержать минимум одну заглавную букву кириллицы';
  }
  if (/[a-zA-Z]/.test(password)) {
    return 'Пароль не должен содержать латинские буквы';
  }
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Пароль не должен содержать специальные символы';
  }
  return null;
}

// Show/hide loading
function showLoading(container) {
  const loader = document.createElement('div');
  loader.className = 'loading';
  loader.innerHTML = '<div class="spinner"></div>';
  loader.id = 'loading-indicator';
  container.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) {
    loader.remove();
  }
}

// Show alerts
function showAlert(container, message, type = 'error') {
  // Remove existing alerts
  const existingAlerts = container.querySelectorAll('.alert');
  existingAlerts.forEach(a => a.remove());
  
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.insertBefore(alert, container.firstChild);
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => alert.remove(), 5000);
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Calculate age
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Pluralize Russian words
function pluralize(number, one, few, many) {
  const mod10 = number % 10;
  const mod100 = number % 100;
  
  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

// Age with correct word
function formatAge(age) {
  return `${age} ${pluralize(age, 'год', 'года', 'лет')}`;
}

// Get photo URL
function getPhotoUrl(photo) {
  if (!photo) return '/img/no-photo.svg';
  return `/uploads/${photo.filename}`;
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

// Check auth and redirect if needed
function requireAuth() {
  if (!api.isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Redirect if already authenticated
function redirectIfAuth(destination = '/feed.html') {
  if (api.isAuthenticated()) {
    window.location.href = destination;
  }
}

// Modal functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

