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

// Store all bookings
let allBookings = [];

// Load all bookings
async function loadBookings() {
    const loading = document.getElementById('loading-bookings');
    const noBookings = document.getElementById('no-bookings');
    const table = document.getElementById('bookings-table');

    loading.style.display = 'block';
    noBookings.style.display = 'none';
    table.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/bookings`);
        const result = await response.json();

        loading.style.display = 'none';

        if (!result.success || result.data.length === 0) {
            noBookings.style.display = 'block';
            allBookings = [];
            updateStats();
            return;
        }

        allBookings = result.data;
        displayBookings(allBookings);
        updateStats();
        table.style.display = 'table';

    } catch (error) {
        loading.style.display = 'none';
        alert('Error loading bookings. Please refresh the page.');
        console.error('Error:', error);
    }
}

// Display bookings in table
function displayBookings(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        document.getElementById('no-bookings').style.display = 'block';
        document.getElementById('bookings-table').style.display = 'none';
        return;
    }

    bookings.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${booking.id}</td>
      <td>${formatDate(booking.booking_date)}</td>
      <td>${formatTime(booking.booking_time)}</td>
      <td>${booking.customer_name}</td>
      <td>${booking.customer_email}</td>
      <td>${booking.customer_phone}</td>
      <td>${booking.duration} hr(s)</td>
      <td>${booking.number_of_players}</td>
      <td>$${booking.total_price}</td>
      <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
      <td>
        <div class="action-btns">
          ${booking.status === 'pending' ? `
            <button class="btn-small btn-complete" onclick="updateBookingStatus(${booking.id}, 'completed')">Complete</button>
            <button class="btn-small btn-cancel" onclick="confirmCancel(${booking.id})">Cancel</button>
          ` : `
            <span style="color: var(--text-light); font-size: 0.85rem;">No actions</span>
          `}
        </div>
      </td>
    `;
        tbody.appendChild(row);
    });

    document.getElementById('bookings-table').style.display = 'table';
    document.getElementById('no-bookings').style.display = 'none';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time from 24hr to 12hr
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Update statistics
function updateStats() {
    const totalBookings = allBookings.length;
    const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
    const totalRevenue = allBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + b.total_price, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(b => b.booking_date === today).length;

    document.getElementById('total-bookings').textContent = totalBookings;
    document.getElementById('pending-bookings').textContent = pendingBookings;
    document.getElementById('total-revenue').textContent = `$${totalRevenue}`;
    document.getElementById('today-bookings').textContent = todayBookings;
}

// Update booking status
async function updateBookingStatus(id, status) {
    try {
        // For this version, we'll use the cancel endpoint and update status manually
        // Otherwise, you'd have a PATCH /bookings/:id endpoint

        if (status === 'completed') {
            // Just update UI for now (in production, call an API endpoint)
            const booking = allBookings.find(b => b.id === id);
            if (booking) {
                booking.status = 'completed';
                displayBookings(allBookings);
                updateStats();
                alert('Booking marked as completed!');
            }
        }
    } catch (error) {
        alert('Error updating booking status');
        console.error('Error:', error);
    }
}

// Confirm cancellation modal
let bookingToCancel = null;

function confirmCancel(id) {
    bookingToCancel = id;
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-message').textContent =
        `Are you sure you want to cancel booking #${id}? This action cannot be undone.`;
    modal.style.display = 'flex';
}

// Modal handlers
document.getElementById('confirm-yes').addEventListener('click', async () => {
    if (bookingToCancel) {
        await cancelBooking(bookingToCancel);
        bookingToCancel = null;
    }
    document.getElementById('confirm-modal').style.display = 'none';
});

document.getElementById('confirm-no').addEventListener('click', () => {
    bookingToCancel = null;
    document.getElementById('confirm-modal').style.display = 'none';
});

// Cancel booking
async function cancelBooking(id) {
    try {
        const response = await fetch(`${API_URL}/bookings/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Booking cancelled successfully');
            loadBookings(); // Reload all bookings
        } else {
            alert('Error cancelling booking: ' + result.error);
        }
    } catch (error) {
        alert('Error cancelling booking. Please try again.');
        console.error('Error:', error);
    }
}

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
    loadBookings();
});
