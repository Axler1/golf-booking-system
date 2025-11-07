// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (!navToggle || !navMenu) return;

    function setExpanded(isExpanded) {
        navToggle.setAttribute('aria-expanded', String(isExpanded));
        if (isExpanded) {
            navMenu.classList.add('open');
            navMenu.setAttribute('aria-hidden', 'false');
        } else {
            navMenu.classList.remove('open');
            navMenu.setAttribute('aria-hidden', 'true');
        }
    }

    // initialize
    setExpanded(false);

    navToggle.addEventListener('click', function(e) {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        setExpanded(!expanded);
    });

    // Close menu when a link is clicked (mobile)
    navMenu.addEventListener('click', function(e) {
        if (e.target.tagName.toLowerCase() === 'a') {
            // small delay allows link highlight & improves UX
            setTimeout(() => setExpanded(false), 120);
        }
    });

    // Close menu on resize if we go back to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // ensure nav is visible in desktop and ARIA reset
            navMenu.classList.remove('open');
            navMenu.style.maxHeight = '';
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'false');
        } else {
            // mobile default
            navMenu.setAttribute('aria-hidden', 'true');
        }
    });

    // Optional: close if user clicks outside the nav on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
            if (!clickedInside) setExpanded(false);
        }
    });
});

// API base URL
const API_URL = 'http://localhost:3000/api';

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Get date 7 days from now
function getMaxDate() {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
}

// Initialize date picker
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('booking-date');
    dateInput.min = getTodayDate();
    dateInput.max = getMaxDate();
    dateInput.value = getTodayDate();
});

// Store selected slot data
let selectedSlot = null;

// Check availability button handler
document.getElementById('check-availability-btn').addEventListener('click', async () => {
    const date = document.getElementById('booking-date').value;

    if (!date) {
        alert('Please select a date');
        return;
    }

    await fetchAvailableSlots(date);
});

// Fetch available slots from API
async function fetchAvailableSlots(date) {
    const slotsSection = document.getElementById('slots-section');
    const loading = document.getElementById('loading');
    const noSlots = document.getElementById('no-slots');
    const slotsGrid = document.getElementById('slots-grid');

    // Show loading, hide previous content
    loading.style.display = 'block';
    noSlots.style.display = 'none';
    slotsGrid.innerHTML = '';
    slotsSection.style.display = 'block';

    try {
        const response = await fetch(`${API_URL}/bookings/available?date=${date}`);
        const result = await response.json();

        loading.style.display = 'none';

        if (!result.success || result.data.length === 0) {
            noSlots.style.display = 'block';
            return;
        }

        // Display available slots
        displaySlots(result.data, date);
    } catch (error) {
        loading.style.display = 'none';
        alert('Error fetching availability. Please try again.');
        console.error('Error:', error);
    }
}

// Display slots in grid
function displaySlots(slots, date) {
    const slotsGrid = document.getElementById('slots-grid');
    slotsGrid.innerHTML = '';

    slots.forEach(slot => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'slot-button';
        button.textContent = formatTime(slot.time);
        button.dataset.time = slot.time;
        button.dataset.date = date;

        if (slot.is_available === 1) {
            button.addEventListener('click', () => selectSlot(button, date, slot.time));
        } else {
            button.classList.add('unavailable');
            button.disabled = true;
        }

        slotsGrid.appendChild(button);
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

// Handle slot selection
function selectSlot(button, date, time) {
    // Remove previous selection
    document.querySelectorAll('.slot-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mark as selected
    button.classList.add('selected');
    selectedSlot = {
        date,
        time
    };

    // Show booking form
    document.getElementById('booking-form-section').style.display = 'block';

    // Update summary
    updateSummary();

    // Smooth scroll to form
    document.getElementById('booking-form-section').scrollIntoView({
        behavior: 'smooth'
    });
}

// Update booking summary
function updateSummary() {
    if (!selectedSlot) return;

    const duration = document.getElementById('duration').value || 1;
    const price = duration * 50;

    document.getElementById('summary-date').textContent = selectedSlot.date;
    document.getElementById('summary-time').textContent = formatTime(selectedSlot.time);
    document.getElementById('summary-duration').textContent = `${duration} hour(s)`;
    document.getElementById('summary-price').textContent = `$${price}`;
    document.getElementById('booking-summary').style.display = 'block';
}

// Update summary when duration changes
document.getElementById('duration').addEventListener('change', updateSummary);

// Handle form submission
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
        alert('Please select a time slot');
        return;
    }

    // Get form data
    const formData = {
        customer_name: document.getElementById('customer-name').value.trim(),
        customer_email: document.getElementById('customer-email').value.trim(),
        customer_phone: document.getElementById('customer-phone').value.trim(),
        booking_date: selectedSlot.date,
        booking_time: selectedSlot.time,
        duration: parseInt(document.getElementById('duration').value),
        number_of_players: parseInt(document.getElementById('number-of-players').value)
    };

    // Validate
    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.duration || !formData.number_of_players) {
        alert('Please fill in all required fields');
        return;
    }

    // Submit booking
    await submitBooking(formData);
});

// Submit booking to API
async function submitBooking(formData) {
    const submitButton = document.querySelector('#booking-form button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            document.getElementById('booking-form-section').style.display = 'none';
            document.getElementById('slots-section').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';

            // Scroll to success message
            document.getElementById('success-message').scrollIntoView({
                behavior: 'smooth'
            });
        } else {
            // Show error message
            document.getElementById('error-text').textContent = result.error || 'Booking failed. Please try again.';
            document.getElementById('error-message').style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'Confirm Booking';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('error-text').textContent = 'Network error. Please check your connection and try again.';
        document.getElementById('error-message').style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm Booking';
    }
}
