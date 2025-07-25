function renderCustomersPage(view = 'list', customerId = null) {
    const appContainer = document.getElementById('app-container');

    if (view === 'list') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>لیست مشتریان</h2>
                <div>
                    <button id="export-customers-excel" class="btn btn-accent">خروجی اکسل</button>
                    <button id="add-customer-view-btn" class="btn btn-primary">افزودن مشتری جدید</button>
                </div>
            </div>
            <div class="card filter-card">
                <div class="form-group">
                    <input type="text" id="customer-search" placeholder="جستجو بر اساس نام یا شماره تماس...">
                </div>
            </div>
            <div id="customer-list-container" class="customer-list"></div>
        `;
        document.getElementById('add-customer-view-btn').addEventListener('click', () => renderCustomersPage('form'));
        document.getElementById('export-customers-excel').addEventListener('click', exportCustomersToExcel);
        document.getElementById('customer-search').addEventListener('input', (e) => displayCustomers(e.target.value));
        
        const customerListContainer = document.getElementById('customer-list-container');
        customerListContainer.addEventListener('click', async (e) => {
            const targetButton = e.target.closest('button');
            if (!targetButton || !targetButton.dataset.id) return;

            const id = parseInt(targetButton.dataset.id);
            if (targetButton.classList.contains('delete-btn')) {
                const userConfirmed = await showCustomConfirm('آیا از حذف این مشتری مطمئن هستید؟ این عمل قابل بازگشت نیست.', 'تایید حذف');
                if (userConfirmed) {
                    await window.db.deleteCustomer(id);
                    await displayCustomers();
                }
            } else if (targetButton.classList.contains('edit-btn')) {
                renderCustomersPage('form', id);
            }
        });

        displayCustomers();

    } else if (view === 'form') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>افزودن/ویرایش مشتری</h2>
                <button id="list-customers-view-btn" class="btn btn-secondary">بازگشت به لیست</button>
            </div>
            <form id="customer-form">
                <div class="form-grid-2-col">
                    <div class="card">
                        <h4>اطلاعات شخصی</h4>
                        <input type="hidden" id="customer-id">
                        <div class="form-group">
                            <label for="customer-firstname">نام</label>
                            <input type="text" id="customer-firstname" required>
                        </div>
                        <div class="form-group">
                            <label for="customer-lastname">نام خانوادگی</label>
                            <input type="text" id="customer-lastname" required>
                        </div>
                         <div class="form-group">
                            <label for="customer-nationalcode">کد ملی (اختیاری)</label>
                            <input type="text" id="customer-nationalcode">
                        </div>
                    </div>
                    <div class="card">
                        <h4>اطلاعات تماس</h4>
                        <div class="form-group">
                            <label for="customer-phone">شماره تماس</label>
                            <input type="tel" id="customer-phone" required>
                        </div>
                        <div class="form-group">
                            <label for="customer-address">آدرس (اختیاری)</label>
                            <textarea id="customer-address" rows="4"></textarea>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <h4>توضیحات (اختیاری)</h4>
                    <div class="form-group">
                        <textarea id="customer-description" placeholder="توضیحات بیشتر..."></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">ذخیره</button>
                    <button type="button" id="clear-customer-form-btn" class="btn btn-secondary">پاک کردن فرم</button>
                </div>
            </form>
        `;
        document.getElementById('list-customers-view-btn').addEventListener('click', () => renderCustomersPage('list'));
        setupCustomerForm(customerId);
    }
}

async function setupCustomerForm(customerId) {
    const customerForm = document.getElementById('customer-form');
    const clearBtn = document.getElementById('clear-customer-form-btn');

    if (customerId) {
        const customers = await window.db.getAllCustomers();
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('customer-firstname').value = customer.firstname;
            document.getElementById('customer-lastname').value = customer.lastname;
            document.getElementById('customer-phone').value = customer.phone;
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-nationalcode').value = customer.nationalcode || '';
            document.getElementById('customer-description').value = customer.description || '';
        }
    }

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('customer-id').value);
        const customer = {
            firstname: document.getElementById('customer-firstname').value.trim(),
            lastname: document.getElementById('customer-lastname').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            address: document.getElementById('customer-address').value.trim(),
            nationalcode: document.getElementById('customer-nationalcode').value.trim(),
            description: document.getElementById('customer-description').value.trim(),
        };

        if (!customer.firstname || !customer.lastname || !customer.phone) {
            await showCustomAlert('لطفا نام، نام خانوادگی و شماره تماس را وارد کنید.', 'خطا');
            return;
        }

        if (id) {
            customer.id = id;
            await window.db.updateCustomer(customer);
            await showCustomAlert('مشتری با موفقیت ویرایش شد.', 'موفقیت');
        } else {
            await window.db.addCustomer(customer);
            await showCustomAlert('مشتری با موفقیت افزوده شد.', 'موفقیت');
        }
        
        renderCustomersPage('list');
    });

    clearBtn.addEventListener('click', () => {
        customerForm.reset();
        document.getElementById('customer-id').value = '';
    });
}

async function displayCustomers(searchTerm = '') {
    const customerListContainer = document.getElementById('customer-list-container');
    if (!customerListContainer) return;
    const customers = await window.db.getAllCustomers();
    customerListContainer.innerHTML = '';
    
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const filteredCustomers = customers.filter(c => 
        `${c.firstname} ${c.lastname}`.toLowerCase().includes(lowercasedSearchTerm) || 
        c.phone.includes(searchTerm)
    );

    if (filteredCustomers.length === 0) {
        customerListContainer.innerHTML = '<p class="empty-state">مشتری یافت نشد.</p>';
        return;
    }

    filteredCustomers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <div class="customer-card-info">
                <div class="customer-name">${customer.firstname} ${customer.lastname}</div>
                <div class="customer-phone">${toPersianDigits(customer.phone)}</div>
            </div>
            <div class="customer-card-actions">
                <button class="btn btn-secondary btn-sm edit-btn" data-id="${customer.id}">ویرایش</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${customer.id}">حذف</button>
            </div>
        `;
        customerListContainer.appendChild(card);
    });
}
