document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // You can change this password for each customer's repository
    const CORRECT_PASSWORD = '12345'; 
    // --- End of Configuration ---

    const loginOverlay = document.getElementById('login-overlay');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const appLayout = document.querySelector('.app-layout');

    // Function to unlock the application
    function unlockApp() {
        loginOverlay.style.display = 'none';
        appLayout.style.display = 'flex';
        // Initialize the main application
        if (typeof initializeApp === 'function') {
            initializeApp();
        } else {
            console.error('Initialization function not found!');
            appLayout.innerHTML = '<h2>خطای بارگذاری برنامه</h2>';
        }
    }

    // Check if user is already authenticated in this session
    if (sessionStorage.getItem('isAuthenticated') === 'true') {
        unlockApp();
    }

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;

        if (enteredPassword === CORRECT_PASSWORD) {
            // Set a session flag to remember the user
            sessionStorage.setItem('isAuthenticated', 'true');
            // Unlock the app
            unlockApp();
        } else {
            loginError.textContent = 'رمز عبور اشتباه است.';
            passwordInput.value = ''; // Clear the input
            passwordInput.focus();
        }
    });
});
