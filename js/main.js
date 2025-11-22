// Mobile navigation toggle
function mobileNavigationToggle() {
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

    // Close if user clicks outside the nav on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
            if (!clickedInside) setExpanded(false);
        }
    });
};

document.addEventListener('DOMContentLoaded', mobileNavigationToggle);
