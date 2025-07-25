function renderProductsPage(view = 'list', productId = null) {
    const appContainer = document.getElementById('app-container');

    if (view === 'list') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>لیست کالاها</h2>
                <div>
                    <button id="export-products-excel" class="btn btn-accent">خروجی اکسل</button>
                    <button id="add-product-view-btn" class="btn btn-primary">افزودن کالای جدید</button>
                </div>
            </div>
            <div class="card filter-card">
                 <div class="form-group">
                    <input type="text" id="product-search" placeholder="جستجو در کالاها بر اساس نام...">
                </div>
            </div>
            <div id="product-list-container" class="product-list"></div>
        `;
        document.getElementById('add-product-view-btn').addEventListener('click', () => renderProductsPage('form'));
        document.getElementById('export-products-excel').addEventListener('click', exportProductsToExcel);
        document.getElementById('product-search').addEventListener('input', (e) => displayProducts(e.target.value));
        
        const productListContainer = document.getElementById('product-list-container');
        productListContainer.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button || !button.dataset.id) return;

            const id = parseInt(button.dataset.id);
            if (button.classList.contains('delete-btn')) {
                const userConfirmed = await showCustomConfirm('آیا از حذف این کالا مطمئن هستید؟', 'تایید حذف');
                if (userConfirmed) {
                    await window.db.deleteProduct(id);
                    await displayProducts();
                }
            } else if (button.classList.contains('edit-btn')) {
                renderProductsPage('form', id);
            }
        });

        displayProducts();

    } else if (view === 'form') {
        appContainer.innerHTML = `
            <div class="page-header">
                <h2>افزودن/ویرایش کالا</h2>
                <button id="list-products-view-btn" class="btn btn-secondary">بازگشت به لیست</button>
            </div>
            <form id="product-form">
                <div class="form-grid-2-col">
                    <div class="card">
                        <h4>اطلاعات اصلی کالا</h4>
                        <input type="hidden" id="product-id">
                        <div class="form-group">
                            <label for="product-name">نام کالا</label>
                            <input type="text" id="product-name" required>
                        </div>
                        <div class="form-group">
                            <label for="product-quantity">تعداد موجودی</label>
                            <input type="number" id="product-quantity" required min="0">
                        </div>
                    </div>
                    <div class="card">
                        <h4>اطلاعات مالی</h4>
                        <div class="form-group">
                            <label for="product-buy-price">قیمت خرید (تومان)</label>
                            <input type="number" id="product-buy-price" required min="0">
                        </div>
                        <div class="form-group">
                            <label for="product-sell-price">قیمت فروش (تومان)</label>
                            <input type="number" id="product-sell-price" required min="0">
                        </div>
                    </div>
                </div>
                <div class="card">
                    <h4>توضیحات (اختیاری)</h4>
                    <div class="form-group">
                        <textarea id="product-description" placeholder="توضیحات بیشتر در مورد کالا..."></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">ذخیره</button>
                    <button type="button" id="clear-form-btn" class="btn btn-secondary">پاک کردن فرم</button>
                </div>
            </form>
        `;
        document.getElementById('list-products-view-btn').addEventListener('click', () => renderProductsPage('list'));
        setupProductForm(productId);
    }
}

async function setupProductForm(productId) {
    const productForm = document.getElementById('product-form');
    const clearFormBtn = document.getElementById('clear-form-btn');
    
    if (productId && typeof productId === 'number') {
        const products = await window.db.getAllProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-quantity').value = product.quantity;
            document.getElementById('product-buy-price').value = product.buyPrice;
            document.getElementById('product-sell-price').value = product.sellPrice;
            document.getElementById('product-description').value = product.description || '';
        }
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('product-id').value);
        const product = {
            name: document.getElementById('product-name').value,
            quantity: parseInt(document.getElementById('product-quantity').value),
            buyPrice: parseFloat(document.getElementById('product-buy-price').value),
            sellPrice: parseFloat(document.getElementById('product-sell-price').value),
            description: document.getElementById('product-description').value,
        };

        if (!product.name || isNaN(product.quantity) || isNaN(product.buyPrice) || isNaN(product.sellPrice)) {
            await showCustomAlert('لطفا تمام فیلدهای ستاره‌دار را پر کنید.', 'خطا');
            return;
        }

        if (id) {
            product.id = id;
            await window.db.updateProduct(product);
            await showCustomAlert('کالا با موفقیت ویرایش شد.', 'موفقیت');
        } else {
            await window.db.addProduct(product);
            await showCustomAlert('کالا با موفقیت افزوده شد.', 'موفقیت');
        }
        
        renderProductsPage('list');
    });

    clearFormBtn.addEventListener('click', () => {
        productForm.reset();
        document.getElementById('product-id').value = '';
    });
}

async function displayProducts(searchTerm = '') {
    const productListContainer = document.getElementById('product-list-container');
    if (!productListContainer) return;

    const products = await window.db.getAllProducts();
    productListContainer.innerHTML = '';

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filteredProducts.length === 0) {
        productListContainer.innerHTML = '<p class="empty-state">کالایی یافت نشد.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        if (product.quantity < 5 && product.quantity > 0) {
            card.classList.add('low-stock');
        } else if (product.quantity === 0) {
            card.classList.add('no-stock');
        }

        card.innerHTML = `
            <div class="product-card-name">${product.name}</div>
            <div class="product-card-details">
                <span class="product-quantity">موجودی: ${toPersianDigits(product.quantity)}</span>
                <span class="product-price">قیمت فروش: ${toPersianDigits(product.sellPrice.toLocaleString())} تومان</span>
            </div>
            <div class="product-card-actions">
                <button class="btn btn-secondary btn-sm edit-btn" data-id="${product.id}">ویرایش</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}">حذف</button>
            </div>
        `;
        productListContainer.appendChild(card);
    });
}
