function renderInvoicesPage(view = 'list', invoiceId = null) {
    const appContainer = document.getElementById('app-container');

    if (view === 'list') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>لیست فاکتورها</h2>
                <div>
                    <button id="export-invoices-excel" class="btn btn-accent">خروجی اکسل</button>
                    <button id="add-invoice-view-btn" class="btn btn-primary">صدور فاکتور جدید</button>
                </div>
            </div>
            <div class="card filter-card">
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" id="invoice-search" placeholder="جستجو بر اساس نام مشتری، شماره فاکتور یا تاریخ...">
                    </div>
                    <div class="form-group">
                        <select id="invoice-type-filter">
                            <option value="">همه انواع</option>
                            <option value="invoice">فاکتور فروش</option>
                            <option value="proforma">پیش‌فاکتور</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="invoice-list-container" class="invoice-list"></div>
        `;
        document.getElementById('add-invoice-view-btn').addEventListener('click', () => renderInvoicesPage('form'));
        document.getElementById('export-invoices-excel').addEventListener('click', exportInvoicesToExcel);
        document.getElementById('invoice-search').addEventListener('input', displayInvoices);
        document.getElementById('invoice-type-filter').addEventListener('change', displayInvoices);
        
        displayInvoices();

        const container = document.getElementById('invoice-list-container');
        if(container) {
            container.addEventListener('click', handleInvoiceListActions);
        }

    } else if (view === 'form') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>صدور/ویرایش فاکتور</h2>
                <button id="list-invoices-view-btn" class="btn btn-secondary">بازگشت به لیست</button>
            </div>
            <form id="invoice-form">
                <div class="invoice-form-grid">
                    <div class="card">
                        <h4>اطلاعات اصلی</h4>
                        <input type="hidden" id="invoice-id">
                        <div class="form-group">
                            <label for="customer-search-input">مشتری</label>
                            <input type="text" id="customer-search-input" list="customer-datalist" placeholder="جستجو یا انتخاب مشتری...">
                            <datalist id="customer-datalist"></datalist>
                            <input type="hidden" id="invoice-customer" required>
                        </div>
                        <div class="form-group">
                            <label for="invoice-type">نوع سند</label>
                            <select id="invoice-type" required>
                                <option value="proforma">پیش‌فاکتور</option>
                                <option value="invoice">فاکتور فروش</option>
                            </select>
                        </div>
                    </div>
                    <div class="card">
                        <h4>افزودن کالا</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="invoice-product-search">کالا</label>
                                <input type="text" id="invoice-product-search" list="product-datalist" placeholder="جستجو یا انتخاب کالا...">
                                <datalist id="product-datalist"></datalist>
                            </div>
                            <div class="form-group" style="max-width: 100px;">
                                <label for="invoice-product-quantity">تعداد</label>
                                <input type="number" id="invoice-product-quantity" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <button type="button" id="add-item-btn" class="btn btn-primary">افزودن</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card invoice-items-card">
                    <h4>اقلام فاکتور</h4>
                    <div class="table-responsive">
                        <table id="invoice-items-table">
                            <thead>
                                <tr>
                                    <th>نام کالا</th>
                                    <th>تعداد</th>
                                    <th>قیمت واحد</th>
                                    <th>مجموع</th>
                                    <th>حذف</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>

                <div class="invoice-form-grid">
                    <div class="card">
                        <h4>توضیحات</h4>
                        <div class="form-group">
                            <textarea id="invoice-description" placeholder="توضیحات مربوط به فاکتور (اختیاری)"></textarea>
                        </div>
                    </div>
                    <div class="card">
                        <h4>خلاصه مالی</h4>
                        <div class="invoice-summary">
                            <div class="summary-item">
                                <span>جمع کل:</span>
                                <span id="summary-subtotal">0</span>
                            </div>
                            <div class="summary-item">
                                <label for="invoice-discount">تخفیف:</label>
                                <input type="number" id="invoice-discount" value="0">
                            </div>
                            <div class="summary-item total">
                                <span>مبلغ نهایی:</span>
                                <span id="summary-total">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">ذخیره فاکتور</button>
                </div>
            </form>
        `;
        document.getElementById('list-invoices-view-btn').addEventListener('click', () => renderInvoicesPage('list'));
        setupInvoiceForm(invoiceId);
    }
}

async function displayInvoices() {
    const invoiceListContainer = document.getElementById('invoice-list-container');
    if (!invoiceListContainer) return;

    const allInvoices = await window.db.getAllInvoices();
    const allCustomers = await window.db.getAllCustomers();

    const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
    const typeFilter = document.getElementById('invoice-type-filter').value;

    const filteredInvoices = allInvoices.filter(invoice => {
        const customer = allCustomers.find(c => c.id === invoice.customerId);
        const customerName = customer ? `${customer.firstname} ${customer.lastname}`.toLowerCase() : '';
        const invoiceIdString = (invoice.id + 1000).toString();
        
        // Format the invoice date to a searchable Persian date string (e.g., "1403/5/4")
        const persianDate = new Date(invoice.createdAt).toLocaleDateString('fa-IR-u-nu-latn');

        const searchMatch = searchTerm 
            ? (customerName.includes(searchTerm) || 
               invoiceIdString.includes(searchTerm) ||
               persianDate.includes(searchTerm))
            : true;
            
        const typeMatch = typeFilter ? invoice.type === typeFilter : true;

        return searchMatch && typeMatch;
    });

    invoiceListContainer.innerHTML = '';
    filteredInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filteredInvoices.length === 0) {
        invoiceListContainer.innerHTML = '<p class="empty-state">فاکتوری یافت نشد.</p>';
        return;
    }

    filteredInvoices.forEach(invoice => {
        const customer = allCustomers.find(c => c.id === invoice.customerId);
        const customerName = customer ? `${customer.firstname} ${customer.lastname}` : 'حذف شده';
        const card = document.createElement('div');
        card.className = `invoice-card ${invoice.type}`;
        card.innerHTML = `
            <div class="invoice-card-header">
                <span class="invoice-id">#${toPersianDigits(invoice.id + 1000)}</span>
                <span class="invoice-type-badge">${invoice.type === 'invoice' ? 'فاکتور فروش' : 'پیش‌فاکتور'}</span>
            </div>
            <div class="invoice-card-body">
                <div class="invoice-customer">${customerName}</div>
                <div class="invoice-total">${toPersianDigits(invoice.total.toLocaleString())} تومان</div>
                <div class="invoice-date">${new Date(invoice.createdAt).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="invoice-card-actions">
                <button class="btn btn-secondary btn-sm view-btn" data-id="${invoice.id}">ویرایش</button>
                <button class="btn btn-accent btn-sm print-btn" data-id="${invoice.id}">چاپ</button>
                ${invoice.type === 'proforma' ? `<button class="btn btn-primary btn-sm convert-btn" data-id="${invoice.id}">تبدیل به فاکتور</button>` : ''}
            </div>
        `;
        invoiceListContainer.appendChild(card);
    });
}

async function handleInvoiceListActions(e) {
    const targetButton = e.target.closest('button');
    if (!targetButton || !targetButton.dataset.id) return;
    
    const id = parseInt(targetButton.dataset.id);

    if (targetButton.classList.contains('view-btn')) {
        renderInvoicesPage('form', id);
    } else if (targetButton.classList.contains('print-btn')) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            await showCustomAlert('مرورگر شما اجازه باز کردن پنجره جدید را نمی‌دهد. لطفا پاپ‌آپ‌ها را برای این سایت فعال کنید.', 'خطا');
            return;
        }
        
        printWindow.document.write('<html><head><title>در حال آماده‌سازی چاپ...</title></head><body><p>لطفا صبر کنید...</p></body></html>');

        const allInvoices = await window.db.getAllInvoices();
        const invoice = allInvoices.find(inv => inv.id === id);
        const allCustomers = await window.db.getAllCustomers();
        const customer = allCustomers.find(c => c.id === invoice.customerId);
        const settings = await window.db.getSettings() || {};

        const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>چاپ فاکتور ${toPersianDigits(invoice.id + 1000)}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Vazirmatn', sans-serif; direction: rtl; margin: 0; background-color: #f8f9fa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .invoice-box { max-width: 800px; margin: 20px auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; color: #555; background-color: white; }
                    .invoice-box table { width: 100%; line-height: inherit; text-align: right; border-collapse: collapse; }
                    .invoice-box table td { padding: 8px; vertical-align: top; }
                    .invoice-box table tr.top table td { padding-bottom: 20px; }
                    .invoice-box table tr.information table td { padding-bottom: 40px; }
                    .invoice-box table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; text-align: center; }
                    .invoice-box table tr.item td { border-bottom: 1px solid #eee; text-align: center; }
                    .invoice-box table tr.item td:first-child { text-align: right; }
                    .invoice-box table tr.total td { border-top: 1px solid #eee; }
                    .invoice-box table tr.total.final-total td { border-top: 2px solid #333; font-weight: bold; }
                    .company-logo { max-width: 150px; max-height: 80px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
                    .footer a { color: #555; text-decoration: none; }
                    @media print { body { margin: 0; background-color: white; } .invoice-box { box-shadow: none; border: none; margin: 0; max-width: 100%; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <table cellpadding="0" cellspacing="0">
                        <tr class="top"><td colspan="5"><table><tr>
                            <td class="title"><img src="${settings.companyLogo || ''}" class="company-logo" style="${!settings.companyLogo ? 'display:none;' : ''}"></td>
                            <td><h2>${settings.companyName || 'فروشگاه شما'}</h2><p style="white-space: pre-line;">${settings.companyAddress || ''}<br>${toPersianDigits(settings.companyPhone || '')}</p></td>
                            <td style="text-align: left;">شماره فاکتور: <strong>${toPersianDigits(invoice.id + 1000)}</strong><br>تاریخ: ${new Date(invoice.createdAt).toLocaleDateString('fa-IR')}<br>نوع: ${invoice.type === 'invoice' ? 'فاکتور فروش' : 'پیش فاکتور'}</td>
                        </tr></table></td></tr>
                        <tr class="information"><td colspan="5"><table><tr><td>
                            <h3>مشخصات خریدار</h3>
                            <p><strong>نام:</strong> ${customer.firstname} ${customer.lastname}<br><strong>تلفن:</strong> ${toPersianDigits(customer.phone)}<br><strong>آدرس:</strong> ${customer.address || ''}</p>
                        </td></tr></table></td></tr>
                        <tr class="heading"><td>کالا</td><td>ردیف</td><td>تعداد</td><td>قیمت واحد (تومان)</td><td>مبلغ کل (تومان)</td></tr>
                        ${invoice.items.map((item, index) => `<tr class="item">
                            <td style="text-align: right;">${item.productName || item.name}</td>
                            <td>${toPersianDigits(index + 1)}</td>
                            <td>${toPersianDigits(item.quantity)}</td>
                            <td>${toPersianDigits(item.price.toLocaleString())}</td>
                            <td>${toPersianDigits((item.quantity * item.price).toLocaleString())}</td>
                        </tr>`).join('')}
                    </table>
                    <table style="margin-top: 20px;">
                         <tr class="total"><td style="text-align: left;" colspan="4">جمع کل</td><td style="text-align: center;">${toPersianDigits(invoice.subtotal.toLocaleString())} تومان</td></tr>
                        <tr class="total"><td style="text-align: left;" colspan="4">تخفیف</td><td style="text-align: center;">${toPersianDigits(invoice.discount.toLocaleString())} تومان</td></tr>
                        <tr class="total final-total"><td style="text-align: left;" colspan="4">مبلغ نهایی قابل پرداخت</td><td style="text-align: center;">${toPersianDigits(invoice.total.toLocaleString())} تومان</td></tr>
                    </table>
                    ${invoice.description ? `<div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;"><strong>توضیحات:</strong><p style="white-space: pre-wrap; margin-top: 5px;">${invoice.description}</p></div>` : ''}
                    <div class="footer">
                        <p>سپاس از انتخاب شما</p>
                        <p class="no-print">حسابداری تپور | ساخت و توسعه: <a href="https://mykh.ir/" target="_blank">علی خداکرمی</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250); // A short delay to ensure all content and images are loaded

    } else if (targetButton.classList.contains('convert-btn')) {
        const userConfirmed = await showCustomConfirm('آیا از تبدیل این پیش‌فاکتور به فاکتور قطعی مطمئن هستید؟ موجودی انبار کسر خواهد شد.', 'تایید تبدیل');
        if (userConfirmed) {
            const allInvoices = await window.db.getAllInvoices();
            const invoice = allInvoices.find(inv => inv.id === id);
            if (invoice) {
                invoice.type = 'invoice';
                
                const products = await window.db.getAllProducts();
                for (const item of invoice.items) {
                    const product = products.find(p => p.id === item.productId);
                    if (product.quantity < item.quantity) {
                        await showCustomAlert(`موجودی کالای "${product.name}" برای تبدیل به فاکتور کافی نیست.`, 'خطا');
                        return;
                    }
                    product.quantity -= item.quantity;
                    await window.db.updateProduct(product);
                }

                await window.db.updateInvoice(invoice);
                await displayInvoices();
                await showCustomAlert('پیش‌فاکتور با موفقیت به فاکتور تبدیل شد.', 'موفقیت');
            }
        }
    }
}

async function setupInvoiceForm(invoiceId) {
    const customerSearchInput = document.getElementById('customer-search-input');
    const customerDatalist = document.getElementById('customer-datalist');
    const customerIdInput = document.getElementById('invoice-customer');
    const productSearchInput = document.getElementById('invoice-product-search');
    const productDatalist = document.getElementById('product-datalist');
    const quantityInput = document.getElementById('invoice-product-quantity');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsTableBody = document.querySelector('#invoice-items-table tbody');
    const subtotalSpan = document.getElementById('summary-subtotal');
    const discountInput = document.getElementById('invoice-discount');
    const totalSpan = document.getElementById('summary-total');
    const descriptionInput = document.getElementById('invoice-description');

    let currentInvoiceItems = [];
    const customers = await window.db.getAllCustomers();
    const allProducts = await window.db.getAllProducts();

    customerDatalist.innerHTML = '';
    customers.forEach(c => {
        customerDatalist.innerHTML += `<option value="${c.firstname} ${c.lastname}" data-id="${c.id}"></option>`;
    });

    customerSearchInput.addEventListener('input', () => {
        const selectedOption = Array.from(customerDatalist.options).find(opt => opt.value === customerSearchInput.value);
        customerIdInput.value = selectedOption ? selectedOption.dataset.id : '';
    });

    productDatalist.innerHTML = '';
    allProducts.forEach(p => {
        productDatalist.innerHTML += `<option value="${p.name}"></option>`;
    });

    if (invoiceId) {
        const invoiceToEdit = (await window.db.getAllInvoices()).find(inv => inv.id === invoiceId);
        if (invoiceToEdit) {
            const customer = customers.find(c => c.id === invoiceToEdit.customerId);
            document.getElementById('invoice-id').value = invoiceToEdit.id;
            customerIdInput.value = invoiceToEdit.customerId;
            if (customer) {
                customerSearchInput.value = `${customer.firstname} ${customer.lastname}`;
            }
            document.getElementById('invoice-type').value = invoiceToEdit.type;
            document.getElementById('invoice-discount').value = invoiceToEdit.discount;
            descriptionInput.value = invoiceToEdit.description || '';
            currentInvoiceItems = invoiceToEdit.items;
        }
    }

    renderInvoiceItems();
    updateSummary();

    addItemBtn.addEventListener('click', addItemToInvoice);
    itemsTableBody.addEventListener('click', handleItemActions);
    discountInput.addEventListener('input', updateSummary);
    document.getElementById('invoice-form').addEventListener('submit', saveInvoice);

    async function addItemToInvoice() {
        const productName = productSearchInput.value;
        const product = allProducts.find(p => p.name === productName);
        const quantity = parseInt(quantityInput.value);

        if (!product || isNaN(quantity) || quantity <= 0) {
            await showCustomAlert('لطفا کالا و تعداد معتبر وارد کنید.', 'خطا');
            return;
        }
        if (product.quantity < quantity) {
            await showCustomAlert(`موجودی کالا (${toPersianDigits(product.quantity)}) کافی نیست.`, 'خطا');
            return;
        }

        const existingItem = currentInvoiceItems.find(item => item.productId === product.id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            currentInvoiceItems.push({
                productId: product.id,
                productName: product.name, // Corrected property name
                quantity: quantity,
                price: product.sellPrice
            });
        }

        productSearchInput.value = '';
        quantityInput.value = '1';
        renderInvoiceItems();
        updateSummary();
    }

    function renderInvoiceItems() {
        itemsTableBody.innerHTML = '';
        currentInvoiceItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.productName || item.name}</td>
                <td>${toPersianDigits(item.quantity)}</td>
                <td>${toPersianDigits(item.price.toLocaleString())}</td>
                <td>${toPersianDigits((item.quantity * item.price).toLocaleString())}</td>
                <td><button type="button" class="btn btn-danger btn-sm" data-index="${index}">حذف</button></td>
            `;
            itemsTableBody.appendChild(row);
        });
    }

    function handleItemActions(e) {
        if (e.target.classList.contains('btn-danger')) {
            const index = parseInt(e.target.dataset.index);
            currentInvoiceItems.splice(index, 1);
            renderInvoiceItems();
            updateSummary();
        }
    }

    function updateSummary() {
        const subtotal = currentInvoiceItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        const discount = parseFloat(discountInput.value) || 0;
        const total = subtotal - discount;

        subtotalSpan.textContent = toPersianDigits(subtotal.toLocaleString()) + ' تومان';
        totalSpan.textContent = toPersianDigits(total.toLocaleString()) + ' تومان';
    }

    async function saveInvoice(e) {
        e.preventDefault();
        
        // Normalize items to ensure `productName` is used consistently
        const finalItems = currentInvoiceItems.map(item => ({
            productId: item.productId,
            productName: item.productName || item.name,
            quantity: item.quantity,
            price: item.price
        }));

        const invoiceData = {
            customerId: parseInt(customerIdInput.value),
            type: document.getElementById('invoice-type').value,
            items: finalItems,
            description: descriptionInput.value,
            discount: parseFloat(discountInput.value) || 0,
            subtotal: currentInvoiceItems.reduce((acc, item) => acc + (item.quantity * item.price), 0),
            total: 0,
        };
        invoiceData.total = invoiceData.subtotal - invoiceData.discount;

        if (!invoiceData.customerId || invoiceData.items.length === 0) {
            await showCustomAlert('لطفا مشتری و حداقل یک کالا را انتخاب کنید.', 'خطا');
            return;
        }

        const id = parseInt(document.getElementById('invoice-id').value);
        if (id) {
            // This is an UPDATE, preserve the original creation date
            const oldInvoice = (await window.db.getAllInvoices()).find(i => i.id === id);
            invoiceData.createdAt = oldInvoice.createdAt;
            invoiceData.id = id;

            if (invoiceData.type === 'invoice' && oldInvoice.type === 'proforma') {
                // Converting from proforma to invoice, deduct stock
                for (const item of invoiceData.items) {
                    const product = allProducts.find(p => p.id === item.productId);
                    if (product.quantity < item.quantity) {
                         await showCustomAlert(`موجودی کالای "${product.name}" کافی نیست.`, 'خطا');
                         return;
                    }
                    product.quantity -= item.quantity;
                    await window.db.updateProduct(product);
                }
            }
            await window.db.updateInvoice(invoiceData);
            await showCustomAlert('فاکتور با موفقیت ویرایش شد.', 'موفقیت');
        } else {
            // This is a NEW invoice, set creation date
            invoiceData.createdAt = new Date().toISOString();
            if (invoiceData.type === 'invoice') {
                // Deduct stock for new invoices
                for (const item of invoiceData.items) {
                    const product = allProducts.find(p => p.id === item.productId);
                     if (product.quantity < item.quantity) {
                         await showCustomAlert(`موجودی کالای "${product.name}" کافی نیست.`, 'خطا');
                         return;
                    }
                    product.quantity -= item.quantity;
                    await window.db.updateProduct(product);
                }
            }
            await window.db.addInvoice(invoiceData);
            await showCustomAlert('فاکتور با موفقیت ذخیره شد.', 'موفقیت');
        }
        
        renderInvoicesPage('list');
    }
}
