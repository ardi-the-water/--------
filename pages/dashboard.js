async function renderDashboardPage() {
    const appContainer = document.getElementById('app-container');
    const settings = await window.db.getSettings() || {};
    const companyName = settings.companyName || 'کاربر';

    appContainer.innerHTML = `
        <div class="page-header">
            <h2>داشبورد</h2>
        </div>
        <div class="welcome-banner card">
            <h3>${companyName}، خوش آمدید 👋</h3>
            <p>اینجا خلاصه‌ای از وضعیت کسب‌وکار خود را مشاهده می‌کنید.</p>
        </div>
        <div class="dashboard-grid">
            <div class="card stat-card">
                <div class="stat-icon" id="icon-today"></div>
                <div class="stat-info">
                    <h4>فروش امروز</h4>
                    <p id="sales-today">0</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon" id="icon-yesterday"></div>
                <div class="stat-info">
                    <h4>فروش دیروز</h4>
                    <p id="sales-yesterday">0</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon" id="icon-month"></div>
                <div class="stat-info">
                    <h4>فروش این ماه</h4>
                    <p id="sales-month">0</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon" id="icon-invoices"></div>
                <div class="stat-info">
                    <h4>تعداد کل فاکتورها</h4>
                    <p id="total-invoices">0</p>
                </div>
            </div>
        </div>
        <div class="card">
            <h3>کالاهای با موجودی کم (کمتر از ۵)</h3>
            <ul id="low-stock-list"></ul>
        </div>
        <div class="card">
            <h3>پرفروش‌ترین کالاها</h3>
            <ul id="top-selling-list"></ul>
        </div>
    `;

    await calculateDashboardStats();
    // Icons will be set via CSS
}

async function calculateDashboardStats() {
    const allInvoices = await window.db.getAllInvoices();
    const allProducts = await window.db.getAllProducts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let salesToday = 0;
    let salesYesterday = 0;
    let salesMonth = 0;
    const productSales = {};

    allInvoices.forEach(invoice => {
        if (invoice.type !== 'invoice') return;

        const invoiceDate = new Date(invoice.createdAt);
        
        if (invoiceDate >= today) {
            salesToday += invoice.total;
        }
        if (invoiceDate >= yesterday && invoiceDate < today) {
            salesYesterday += invoice.total;
        }
        if (invoiceDate >= startOfMonth) {
            salesMonth += invoice.total;
        }

        invoice.items.forEach(item => {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        });
    });

    document.getElementById('sales-today').textContent = toPersianDigits(salesToday.toLocaleString()) + ' تومان';
    document.getElementById('sales-yesterday').textContent = toPersianDigits(salesYesterday.toLocaleString()) + ' تومان';
    document.getElementById('sales-month').textContent = toPersianDigits(salesMonth.toLocaleString()) + ' تومان';
    document.getElementById('total-invoices').textContent = toPersianDigits(allInvoices.filter(i => i.type === 'invoice').length);

    // Low stock items
    const lowStockList = document.getElementById('low-stock-list');
    lowStockList.innerHTML = '';
    allProducts.filter(p => p.quantity < 5).forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.name} (موجودی: ${toPersianDigits(p.quantity)})`;
        lowStockList.appendChild(li);
    });
    if (lowStockList.innerHTML === '') {
        lowStockList.innerHTML = '<li>موردی یافت نشد.</li>';
    }

    // Top selling items
    const topSellingList = document.getElementById('top-selling-list');
    topSellingList.innerHTML = '';
    const sortedProducts = Object.entries(productSales).sort(([,a],[,b]) => b-a).slice(0, 5);
    
    sortedProducts.forEach(([productId, quantity]) => {
        const product = allProducts.find(p => p.id == productId);
        if (product) {
            const li = document.createElement('li');
            li.textContent = `${product.name} (تعداد فروش: ${toPersianDigits(quantity)})`;
            topSellingList.appendChild(li);
        }
    });
    if (topSellingList.innerHTML === '') {
        topSellingList.innerHTML = '<li>موردی یافت نشد.</li>';
    }
}
