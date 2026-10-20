const CACHE_NAME = 'mobilemate-pos-v6';
const ASSETS = [
    './',
    './index.html',
    './HOW_TO_RUN_ON_MOBILE.html',
    './manifest.json',
    './assets/css/styles.css',
    './assets/css/mobile.css',
    './assets/vendor/tailwindcss.js',
    './assets/vendor/dexie.min.js',
    './assets/vendor/sweetalert2.all.min.js',
    './assets/vendor/chart.umd.min.js',
    './assets/vendor/JsBarcode.all.min.js',
    './assets/vendor/xlsx.full.min.js',
    './assets/vendor/html2pdf.bundle.min.js',
    './assets/vendor/fontawesome/all.min.css',
    './assets/vendor/fontawesome/webfonts/fa-solid-900.woff2',
    './assets/vendor/fontawesome/webfonts/fa-solid-900.ttf',
    './assets/vendor/fontawesome/webfonts/fa-brands-400.woff2',
    './assets/vendor/fontawesome/webfonts/fa-brands-400.ttf',
    './assets/vendor/fontawesome/webfonts/fa-regular-400.woff2',
    './assets/vendor/fontawesome/webfonts/fa-regular-400.ttf',
    './assets/js/mobile_runtime.js',
    './assets/js/db.js',
    './assets/js/auth.js',
    './assets/js/app.js',
    './assets/js/pos.js',
    './assets/js/dashboard.js',
    './assets/js/products.js',
    './assets/js/purchases.js',
    './assets/js/grn.js',
    './assets/js/sales.js',
    './assets/js/sales_doc_modal.js',
    './assets/js/quotes.js',
    './assets/js/returns.js',
    './assets/js/rma.js',
    './assets/js/finance.js',
    './assets/js/woo.js',
    './assets/js/web_orders.js',
    './assets/js/settings.js',
    './assets/js/backup_alarms.js',
    './assets/js/customers.js',
    './assets/js/vendors.js',
    './assets/js/outstanding.js',
    './assets/js/reports.js',
    './assets/js/analytics.js',
    './assets/js/email.js',
    './assets/js/payments.js',
    './assets/js/accounting.js',
    './assets/js/hr.js',
    './assets/js/hr_advanced_payroll.js',
    './assets/js/users.js',
    './assets/js/store_management.js',
    './assets/js/warranty.js',
    './assets/js/tax.js',
    './assets/js/calculator.js',
    './assets/js/service.js',
    './assets/js/company_loans.js',
    './assets/js/statements.js',
    './assets/js/mobile_nav.js',
    './assets/js/config.js',
    './assets/js/number_to_words.js',
    './assets/js/number_to_words_ui.js',
    './assets/js/google_drive_backup.js',
    './assets/js/documents.js',
    './assets/js/commissions.js',
    './assets/js/office_use.js',
    './assets/js/banking.js',
    './assets/js/financial_summary.js',
    './assets/icons/favicon.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
];

// Install event - caching assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - serving from cache or network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => {
            // Optional: return a fallback page if network fails and not in cache
        })
    );
});
