function renderSettingsPage() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = `
        <div class="page-header">
            <h2>تنظیمات</h2>
        </div>

        <div class="form-grid-2-col">
            <div class="card">
                <h3>اطلاعات فروشگاه</h3>
                <p>این اطلاعات در هدر فاکتورهای چاپی نمایش داده خواهد شد.</p>
                <form id="settings-form">
                    <div class="form-group">
                        <label for="setting-company-name">نام فروشگاه/شرکت</label>
                        <input type="text" id="setting-company-name">
                    </div>
                    <div class="form-group">
                        <label for="setting-company-logo">آدرس URL لوگو (اختیاری)</label>
                        <input type="text" id="setting-company-logo" placeholder="https://example.com/logo.png">
                    </div>
                    <div class="form-group">
                        <label for="setting-company-address">آدرس</label>
                        <input type="text" id="setting-company-address">
                    </div>
                    <div class="form-group">
                        <label for="setting-company-phone">شماره تماس</label>
                        <input type="text" id="setting-company-phone">
                    </div>
                    <button type="submit" class="btn btn-primary">ذخیره تنظیمات</button>
                </form>
            </div>

            <div class="card">
                <h3>پشتیبان‌گیری و بازیابی</h3>
                <p>از تمام اطلاعات خود (کالاها، مشتریان، فاکتورها) یک فایل پشتیبان تهیه کنید یا فایل پشتیبان قبلی را بازیابی کنید.</p>
                <div class="settings-backup-actions">
                    <button id="backup-btn" class="btn btn-accent">دریافت فایل پشتیبان</button>
                    <label for="restore-input" class="btn btn-secondary">بارگذاری و بازیابی فایل پشتیبان</label>
                    <input type="file" id="restore-input" accept=".json" style="display: none;">
                </div>
                <p style="font-size: 0.8rem; color: #6c757d; margin-top: 1rem;">
                    <strong>مهم:</strong> با بازیابی فایل، تمام اطلاعات فعلی شما حذف و با اطلاعات فایل پشتیبان جایگزین می‌شود.
                </p>
            </div>
        </div>

        <div class="card">
            <h3>درباره نرم‌افزار</h3>
            <p>نرم افزار حسابداری تپور | ساده و قدرتمند</p>
            <p>
                <strong>ساخت و توسعه:</strong> 
                <a href="https://mykh.ir/" target="_blank" rel="noopener noreferrer">علی خداکرمی</a>
            </p>
        </div>
    `;

    setupSettingsForm();
    setupBackupRestore();
}

async function setupSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) return;
    const settings = await window.db.getSettings();

    if (settings) {
        document.getElementById('setting-company-name').value = settings.companyName || '';
        document.getElementById('setting-company-logo').value = settings.companyLogo || '';
        document.getElementById('setting-company-address').value = settings.companyAddress || '';
        document.getElementById('setting-company-phone').value = settings.companyPhone || '';
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSettings = {
            id: 1, // Always use the same ID to overwrite
            companyName: document.getElementById('setting-company-name').value.trim(),
            companyLogo: document.getElementById('setting-company-logo').value.trim(),
            companyAddress: document.getElementById('setting-company-address').value.trim(),
            companyPhone: document.getElementById('setting-company-phone').value.trim(),
        };
        await window.db.saveSettings(newSettings);
        await showCustomAlert('تنظیمات با موفقیت ذخیره شد.', 'موفقیت');
    });
}

function setupBackupRestore() {
    const backupBtn = document.getElementById('backup-btn');
    const restoreInput = document.getElementById('restore-input');

    if (!backupBtn || !restoreInput) return;

    backupBtn.addEventListener('click', async () => {
        try {
            const backupData = {
                products: await window.db.getAllProducts(),
                customers: await window.db.getAllCustomers(),
                invoices: await window.db.getAllInvoices(),
                settings: await window.db.getSettings()
            };
            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tapur-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error creating backup:", error);
            await showCustomAlert("خطا در ایجاد فایل پشتیبان. لطفا کنسول را بررسی کنید.", 'خطا');
        }
    });

    restoreInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const userConfirmed = await showCustomConfirm('آیا مطمئن هستید؟ تمام اطلاعات فعلی شما با اطلاعات فایل پشتیبان جایگزین خواهد شد.', 'تایید بازیابی');
        if (!userConfirmed) {
            e.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                
                // Clear stores before restoring
                await window.db.clearStore('products');
                await window.db.clearStore('customers');
                await window.db.clearStore('invoices');

                // Restore data using putItem to avoid key conflicts
                if (backupData.products) {
                    for (const product of backupData.products) await window.db.putItem('products', product);
                }
                if (backupData.customers) {
                    for (const customer of backupData.customers) await window.db.putItem('customers', customer);
                }
                if (backupData.invoices) {
                    for (const invoice of backupData.invoices) await window.db.putItem('invoices', invoice);
                }
                if (backupData.settings) {
                    await window.db.saveSettings(backupData.settings);
                }

                await showCustomAlert('اطلاعات با موفقیت بازیابی شد. صفحه مجددا بارگذاری می‌شود.', 'موفقیت');
                location.reload();

            } catch (err) {
                await showCustomAlert('فایل پشتیبان نامعتبر است یا در هنگام پردازش آن خطایی رخ داده است.', 'خطا');
                console.error("Restore error:", err);
            } finally {
                e.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    });
}
