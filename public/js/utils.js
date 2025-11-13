// Show loading skeleton for time slots
export function showSlotsSkeleton() {
    const slotsGrid = document.getElementById('slots-grid');
    slotsGrid.innerHTML = '';

    // Create 12 skeleton slots
    for (let i = 0; i < 12; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'slot-button skeleton';
        skeleton.style.height = '60px';
        slotsGrid.appendChild(skeleton);
    }
}

// Show loading skeleton for admin table
export function showTableSkeleton() {
    const tbody = document.getElementById('bookings-tbody');
    tbody.innerHTML = '';

    // Create 5 skeleton rows
    for (let i = 0; i < 5; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
      <td><div class="skeleton skeleton-text"></div></td>
    `;
        tbody.appendChild(row);
    }
}

// Smooth scroll to element
export function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Show toast notification
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
  `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(20px); }
  }
`;
document.head.appendChild(style);

// Fetch with timeout
export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection.');
        }
        throw error;
    }
}

// Retry fetch on failure
export async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchWithTimeout(url, options);
        } catch (error) {
            if (i === retries - 1) throw error;
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
