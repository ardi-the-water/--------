const DB_NAME = 'TapurAccountingDB';
const DB_VERSION = 3; // Incremented to handle new invoice description field

let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('customers')) {
                db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('invoices')) {
                db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully.');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Error opening database.');
        };
    });
}

function getStore(storeName, mode) {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
}

function addProduct(product) {
    return new Promise((resolve, reject) => {
        const store = getStore('products', 'readwrite');
        const request = store.add(product);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllProducts() {
    return new Promise((resolve, reject) => {
        const store = getStore('products', 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateProduct(product) {
    return new Promise((resolve, reject) => {
        const store = getStore('products', 'readwrite');
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('products', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}


function addCustomer(customer) {
    return new Promise((resolve, reject) => {
        const store = getStore('customers', 'readwrite');
        const request = store.add(customer);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllCustomers() {
    return new Promise((resolve, reject) => {
        const store = getStore('customers', 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateCustomer(customer) {
    return new Promise((resolve, reject) => {
        const store = getStore('customers', 'readwrite');
        const request = store.put(customer);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteCustomer(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('customers', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function addInvoice(invoice) {
    return new Promise((resolve, reject) => {
        const store = getStore('invoices', 'readwrite');
        const request = store.add(invoice);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getAllInvoices() {
    return new Promise((resolve, reject) => {
        const store = getStore('invoices', 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function updateInvoice(invoice) {
    return new Promise((resolve, reject) => {
        const store = getStore('invoices', 'readwrite');
        const request = store.put(invoice);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function deleteInvoice(id) {
    return new Promise((resolve, reject) => {
        const store = getStore('invoices', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function saveSettings(settings) {
    return new Promise((resolve, reject) => {
        const store = getStore('settings', 'readwrite');
        const request = store.put(settings);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function getSettings() {
    return new Promise((resolve, reject) => {
        const store = getStore('settings', 'readonly');
        const request = store.get(1); // Settings are always stored with id 1
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

function putItem(storeName, item) {
     return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Export the functions
window.db = {
    init: initDB,
    clearStore, // Added for restore functionality
    putItem, // Added for restore functionality
    addProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    addCustomer,
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
    addInvoice,
    getAllInvoices,
    updateInvoice,
    deleteInvoice,
    saveSettings,
    getSettings
};
