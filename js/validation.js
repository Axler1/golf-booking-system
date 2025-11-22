// Email validation
export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Phone validation
export function validatePhone(phone) {
    const regex = /^[\d\s\-\(\)]+$/;
    const digits = phone.replace(/\D/g, '');
    return regex.test(phone) && digits.length >= 10;
}

// Name validation
export function validateName(name) {
    return name.trim().length >= 2;
}

// Add real-time validation to input field
export function addValidation(inputId, validationFn, errorMessage) {
    const input = document.getElementById(inputId);
    const formGroup = input.closest('.form-group');

    // Create error message element if doesn't exist
    let errorElement = formGroup.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        formGroup.appendChild(errorElement);
    }

    // Validate on blur (when user leaves field)
    input.addEventListener('blur', () => {
        const value = input.value.trim();

        if (value === '') {
            input.classList.remove('valid', 'invalid');
            errorElement.classList.remove('show');
            return;
        }

        if (validationFn(value)) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            errorElement.classList.remove('show');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            errorElement.classList.add('show');
        }
    });

    // Clear validation on input
    input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) {
            input.classList.remove('invalid');
            errorElement.classList.remove('show');
        }
    });
}

// Validate all required fields in a form
export function validateForm(formId) {
    const form = document.getElementById(formId);
    const requiredInputs = form.querySelectorAll('[required]');
    let isValid = true;

    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('invalid');
            isValid = false;
        }
    });

    return isValid;
}
