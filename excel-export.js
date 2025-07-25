/**
 * Exports a workbook with multiple sheets to an Excel file.
 * @param {Array<{data: Array<Object>, name: String}>} sheets - An array of sheet objects.
 * @param {String} filename - The name of the file to be saved.
 */
function exportWorkbookToExcel(sheets, filename) {
    const workbook = XLSX.utils.book_new();
    sheets.forEach(sheet => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

async function exportProductsToExcel() {
    const products = await window.db.getAllProducts();
    const dataToExport = products.map(p => ({
        'نام کالا': p.name,
        'تعداد موجودی': p.quantity,
        'قیمت خرید (تومان)': p.buyPrice,
        'قیمت فروش (تومان)': p.sellPrice,
        'توضیحات': p.description
    }));
    exportWorkbookToExcel([{ data: dataToExport, name: 'لیست کالاها' }], 'لیست-کالاها');
}

async function exportCustomersToExcel() {
    const customers = await window.db.getAllCustomers();
    const dataToExport = customers.map(c => ({
        'نام': c.firstname,
        'نام خانوادگی': c.lastname,
        'شماره تماس': c.phone,
        'آدرس': c.address,
        'کد ملی': c.nationalcode,
        'توضیحات': c.description
    }));
    exportWorkbookToExcel([{ data: dataToExport, name: 'لیست مشتریان' }], 'لیست-مشتریان');
}

async function exportInvoicesToExcel() {
    const invoices = await window.db.getAllInvoices();
    const customers = await window.db.getAllCustomers();
    const customerMap = new Map(customers.map(c => [c.id, `${c.firstname} ${c.lastname}`]));

    // Sheet 1: Invoices Summary
    const summaryData = invoices.map(i => ({
        'شماره فاکتور': i.id + 1000,
        'مشتری': customerMap.get(i.customerId) || 'حذف شده',
        'نوع': i.type === 'invoice' ? 'فاکتور' : 'پیش‌فاکتور',
        'مبلغ کل (تومان)': i.total,
        'تخفیف (تومان)': i.discount,
        'جمع کل (تومان)': i.subtotal,
        'تاریخ و زمان': new Date(i.createdAt).toLocaleString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'توضیحات': i.description || ''
    }));

    // Sheet 2: Invoice Items Details
    const detailsData = [];
    invoices.forEach(invoice => {
        if (invoice.items && invoice.items.length > 0) {
            invoice.items.forEach(item => {
                detailsData.push({
                    'شماره فاکتور': invoice.id + 1000,
                    'مشتری': customerMap.get(invoice.customerId) || 'حذف شده',
                    'نام کالا': item.productName,
                    'تعداد': item.quantity,
                    'قیمت واحد (تومان)': item.price,
                    'مبلغ ردیف (تومان)': item.quantity * item.price,
                    'تخفیف کل فاکتور (تومان)': invoice.discount,
                    'مبلغ نهایی فاکتور (تومان)': invoice.subtotal,
                    'تاریخ': new Date(invoice.createdAt).toLocaleDateString('fa-IR')
                });
            });
        }
    });

    const sheets = [
        { data: summaryData, name: 'لیست فاکتورها' },
        { data: detailsData, name: 'ریز سفارشات' }
    ];

    exportWorkbookToExcel(sheets, 'لیست-فاکتورها');
}
