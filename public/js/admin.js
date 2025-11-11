// API base URL
const API_URL = 'http://localhost:3000/api';

// Admin password (in production, this should be server-side)
const ADMIN_PASSWORD = 'admin123';

// Check if user is logged in
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';

// DOM Elements
const loginSection = document.getElementById('admin-login');
const dashboardSection = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Login handler
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminAuth', 'true');
    isAuthenticated = true;
    showDashboard();
  } else {
    alert('Incorrect password. Try again.');
    document.getElementById('admin-password').value = '';
  }
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('adminAuth');
  isAuthenticated = false;
  showLogin();
});

// Show login screen
function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
}

// Show dashboard
function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  loadBookings();
}
