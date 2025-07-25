// Helper function to convert numbers to Persian digits
function toPersianDigits(n) {
    if (n === null || n === undefined) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/\d/g, d => persianDigits[d]);
}

const appContainer = document.getElementById('app-container');

function renderPage(page) {
    // Clear current content
    appContainer.innerHTML = '';

    // Update active link
    document.querySelectorAll('.sidebar ul li a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    switch (page) {
        case 'dashboard':
            renderDashboardPage();
            break;
        case 'products':
            renderProductsPage();
            break;
        case 'customers':
            renderCustomersPage();
            break;
        case 'invoices':
            renderInvoicesPage();
            break;
        case 'settings':
            renderSettingsPage();
            break;
        default:
            appContainer.innerHTML = '<h2>صفحه یافت نشد</h2>';
    }
}

async function initializeApp() {
    console.log('سیستم حسابداری تپور آماده است.');
    
    try {
        await window.db.init();
        
        document.querySelectorAll('.sidebar ul li a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Use currentTarget to ensure the element with the listener is selected
                const page = e.currentTarget.dataset.page;
                renderPage(page);
            });
        });

        // Render the initial page
        renderPage('dashboard');

    } catch (error) {
        console.error('Failed to initialize the application:', error);
        if (appContainer) {
            appContainer.innerHTML = '<h2>خطا</h2><p>متاسفانه در بارگذاری پایگاه داده مشکلی پیش آمده است. لطفا صفحه را مجددا بارگذاری کنید.</p>';
        }
    }

    // --- Scroll to Top Button Logic ---
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    const mainContent = document.querySelector('.main-content');

    if (scrollToTopBtn && mainContent) {
        const scrollContainer = window.innerWidth <= 768 ? window : mainContent;
        
        const scrollCheck = () => {
            // On mobile, the body/document scrolls. On desktop, .main-content scrolls.
            const scrollTop = window.innerWidth <= 768 ? (document.documentElement.scrollTop || document.body.scrollTop) : mainContent.scrollTop;
            if (scrollTop > 200) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        };

        // Listen on the correct container
        scrollContainer.addEventListener('scroll', scrollCheck);

        scrollToTopBtn.addEventListener('click', () => {
            // Scroll the correct container to top
            scrollContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            // Also scroll the other container in case of edge cases
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
