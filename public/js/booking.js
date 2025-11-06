// Mobile navigation toggle logic
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
