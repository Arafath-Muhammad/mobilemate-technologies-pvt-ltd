const CACHE_NAME = 'mobilemate-pos-v3';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/styles.css',
    './assets/js/db.js',
    './assets/js/auth.js',
    './assets/js/app.js',
    './assets/js/pos.js',
    './assets/js/dashboard.js',
    './assets/js/products.js',
    './assets/js/purchases.js',
    './assets/js/grn.js',
    './assets/js/sales.js',
    './assets/js/quotes.js',
    './assets/js/returns.js',
    './assets/js/rma.js',
    './assets/js/finance.js',
    './assets/js/woo.js',
    './assets/js/settings.js',
    './assets/js/backup_alarms.js',
    './assets/js/customers.js',
    './assets/js/vendors.js',
    './assets/js/outstanding.js',
    './assets/js/reports.js',
    './assets/js/email.js',
    './assets/js/payments.js',
    './assets/js/accounting.js',
    './assets/js/hr.js',
    './assets/js/users.js',
    './assets/js/warranty.js',
    './assets/js/tax.js',
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
