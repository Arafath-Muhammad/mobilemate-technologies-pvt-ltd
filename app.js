// App wide UI initialization and navigation

document.addEventListener('DOMContentLoaded', async () => {
    // Sync data from local backend server first
    if (typeof window.initializeSystemData === 'function') {
        await window.initializeSystemData();
    }

    // Wait for auth to complete before initializing UI that depends on currentUser
    if (window.authInitialized) {
        try {
            await window.authInitialized;
        } catch (authErr) {
            console.warn("[App] Auth initialization warning:", authErr);
        }
    }

    initClock();
    initTheme();
    initNavigation();
    initSidebar();
    initGlobalSpellCheck();
    initScrollToTop();
    initDefaultDates();

    const navigatedByHash = handleInitialHashNavigation();

    // Check for URL parameters (e.g., ?mode=quote)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'quote' || mode === 'sales_order') {
        preselectedDocType = mode;
        const posBtn = document.querySelector('[data-target="pos-view"]');
        if (posBtn) posBtn.click();
    } else if (!navigatedByHash) {
        // Auto-load appropriately based on role - no delay needed now as we await auth
        if (currentUser) {
            if (currentUser.role === 'cashier') {
                const posBtn = document.querySelector('[data-target="pos-view"]');
                if (posBtn) posBtn.click();
            } else {
                loadDashboard();
            }
        }
    }
    initGlobalSearch();
    updateAppLogo();
    updateAppFavicon();
    updateBranding();
    
    // Initialize Web Order Polling
    if (typeof initWebOrderPolling === 'function') {
        initWebOrderPolling();
    }

    // One-time migration: fix incorrectly numbered invoices
    migrateInvoiceNumbers();

    // Check for expiring credit invoices
    setTimeout(() => {
        if (typeof checkCreditExpiryReminders === 'function') {
            checkCreditExpiryReminders();
        }
    }, 2000); // Wait for DB and UI to stabilize
});

async function checkCreditExpiryReminders() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const lastChecked = localStorage.getItem('last_credit_expiry_check');
        
        // Only run once per calendar day to avoid annoying users on refresh
        if (lastChecked === today) return;

        const invoices = await db.sales.where('document_type').equals('invoice').toArray();
        const expiringToday = [];

        for (const inv of invoices) {
            // Check for unpaid credit invoices with a specified credit period
            if (inv.status === 'unpaid' && inv.payment_type === 'credit' && inv.credit_days) {
                const invDate = new Date(inv.date);
                const expiryDate = new Date(invDate);
                // Expiry calculation: Issued on May 1st, 14 days credit -> expires on May 14th
                expiryDate.setDate(invDate.getDate() + parseInt(inv.credit_days) - 1);
                
                const expiryStr = expiryDate.toISOString().split('T')[0];
                if (expiryStr === today) {
                    expiringToday.push(inv);
                }
            }
        }

        if (expiringToday.length > 0) {
            localStorage.setItem('last_credit_expiry_check', today);

            let listHtml = expiringToday.map(inv => `
                <div class="p-4 mb-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl text-left shadow-sm">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Invoice ID</p>
                            <p class="text-sm font-black text-gray-900 dark:text-white">${getInvoiceDisplayNumber(inv)}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Amount</p>
                            <p class="text-sm font-black text-primary">Rs. ${parseFloat(inv.total).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="mt-3 pt-3 border-t border-red-100 dark:border-red-800/50">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                        <p class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">${inv.customer_name}</p>
                    </div>
                </div>
            `).join('');

            Swal.fire({
                title: '<span class="text-red-600">Credit Period Expired!</span>',
                html: `<div class="mt-4">
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">The following invoices have reached their credit limit today. Please follow up for collection.</p>
                        <div class="max-h-[400px] overflow-y-auto custom-scrollbar px-1">${listHtml}</div>
                       </div>`,
                icon: 'warning',
                confirmButtonText: 'View All Outstanding',
                confirmButtonColor: '#4F46E5',
                showCancelButton: true,
                cancelButtonText: 'Dismiss',
                reverseButtons: true,
                width: '500px',
                customClass: {
                    container: 'credit-expiry-popup',
                    popup: 'rounded-[2rem] border-none shadow-2xl dark:bg-darkCard',
                    title: 'font-black tracking-tight',
                    confirmButton: 'rounded-xl px-6 py-3 text-sm font-bold',
                    cancelButton: 'rounded-xl px-6 py-3 text-sm font-bold'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const navBtn = document.querySelector('[data-target="outstanding-view"]');
                    if (navBtn) navBtn.click();
                }
            });
        }
    } catch (err) {
        console.error("Credit Expiry Check Error:", err);
    }
}


// Global Quick Search
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) return;

            // 1. Check if it's an Invoice ID
            if (query.startsWith('inv-m') || query.startsWith('inv-') || (!isNaN(query) && query.length < 5)) {
                const idStr = query.replace('inv-m', '').replace('inv-', '');
                const sale = await db.sales.get(parseInt(idStr));
                if (sale) {
                    const navBtn = document.querySelector('[data-target="sales-view"]');
                    if (navBtn) navBtn.click();
                    setTimeout(() => {
                        const sInput = document.getElementById('sales-search');
                        if (sInput) {
                            sInput.value = idStr;
                            renderSalesList(idStr);
                        }
                    }, 500);
                    return;
                }
            }

            // 2. Check for Products
            const product = await db.products.filter(p => p.name.toLowerCase().includes(query)).first();
            if (product) {
                const navBtn = document.querySelector('[data-target="products-view"]');
                if (navBtn) navBtn.click();
                setTimeout(() => {
                    const sInput = document.getElementById('inv-search') || document.getElementById('inventory-search');
                    if (sInput) {
                        sInput.value = query;
                        if (typeof renderInventoryList === 'function') {
                            renderInventoryList(query);
                        }
                    }
                }, 500);
                return;
            }

            // 3. Check for Customers
            const customer = await db.customers.filter(c => c.name.toLowerCase().includes(query)).first();
            if (customer) {
                const navBtn = document.querySelector('[data-target="customers-view"]');
                if (navBtn) navBtn.click();
                setTimeout(() => {
                    const sInput = document.getElementById('customers-search');
                    if (sInput) {
                        sInput.value = query;
                        renderCustomersList(query);
                    }
                }, 500);
                return;
            }

            showAlert('Search', 'No exact matches found for: ' + query, 'info');
        }
    });
}

// Global Spellcheck Enforcer
function initGlobalSpellCheck() {
    // Initial scan
    const enforceSpellCheck = (el) => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const type = el.getAttribute('type');
            // Enable for text-related inputs, skip passwords and emails if preferred, 
            // but user asked for "every typing place".
            if (!type || ['text', 'search', 'url', 'tel', 'textarea'].includes(type.toLowerCase())) {
                el.spellcheck = true;
            }
        }
    };

    document.querySelectorAll('input, textarea').forEach(enforceSpellCheck);

    // Observe for new elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
                        enforceSpellCheck(node);
                    }
                    node.querySelectorAll('input, textarea').forEach(enforceSpellCheck);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Global Date Picker Default Initializer
function initDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    
    const enforceToday = (el) => {
        if (el.tagName === 'INPUT' && el.getAttribute('type') === 'date') {
            // Set today's date as default if value is missing or if it's a new element
            if (!el.value) {
                el.value = today;
            }
        }
    };

    // Initial scan
    document.querySelectorAll('input[type="date"]').forEach(enforceToday);

    // Observe for new elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'INPUT' && node.getAttribute('type') === 'date') {
                        enforceToday(node);
                    }
                    node.querySelectorAll('input[type="date"]').forEach(enforceToday);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Sidebar Toggle Functionality (Mobile Drawer)
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('sidebar-close-btn');

    if (!sidebar || !toggle || !overlay) return;

    const openSidebar = () => {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.classList.add('sidebar-open');
    };

    const closeSidebar = () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.classList.remove('sidebar-open');
    };

    toggle.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    // Close on navigation (mobile)
    const navLinks = sidebar.querySelectorAll('.nav-btn');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });

    // Expose toggle helpers
    window.openSidebarDrawer = openSidebar;
    window.closeSidebarDrawer = closeSidebar;
}


// Clock functionality
function initClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;

    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    updateTime();
    setInterval(updateTime, 1000);
}

// Theme toggling (Dark/Light mode)
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        updateThemeIcon(true);
    } else {
        html.classList.remove('dark');
        updateThemeIcon(false);
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = html.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
            updateThemeIcon(isDark);

            // Re-render charts if dashboard is active to update chart colors
            if (document.getElementById('dashboard-view').classList.contains('active')) {
                if (typeof renderDashboardCharts === 'function') {
                    // Small delay to let transition finish
                    setTimeout(renderDashboardCharts, 100);
                }
            }
        });
    }

    function updateThemeIcon(isDark) {
        if (!themeBtn) return;
        if (isDark) {
            themeBtn.innerHTML = '<i class="fa-solid fa-sun text-yellow-400"></i>';
        } else {
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }
}

// Sidebar Navigation
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');

            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', '#' + targetId.replace('-view', ''));
            }

            // Role Access Check
            if (typeof canAccess === 'function' && !canAccess(targetId)) {
                showAlert('Access Denied', 'You do not have permission to access this section.', 'warning');
                return;
            }

            // Remove active from all
            navBtns.forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-white');
                b.classList.add('text-gray-600', 'dark:text-gray-400');
            });

            // Add active to clicked
            btn.classList.add('active');
            btn.classList.remove('text-gray-600', 'dark:text-gray-400');

            // Change Page Title
            if (pageTitle) {
                pageTitle.textContent = btn.textContent.trim();
            }

            // Hide all views
            views.forEach(v => {
                v.classList.remove('active', 'block');
                v.classList.add('hidden');
            });

            // Show target view
            const targetView = document.getElementById(targetId);

            if (targetView) {
                targetView.classList.remove('hidden');
                targetView.classList.add('active', 'block');

                // ── Sync Mobile Bottom Nav ──────────────────────────────
                if (typeof updateMobileNavActive === 'function') {
                    updateMobileNavActive(targetId);
                }

                // Trigger specific init functions based on view
                if (targetId === 'dashboard-view') {
                    loadDashboard();
                } else if (targetId === 'products-view') {
                    loadProducts();
                } else if (targetId === 'pos-view') {
                    loadPOS();
                } else if (targetId === 'purchases-view') {
                    if (typeof loadPurchases === 'function') loadPurchases();
                } else if (targetId === 'grn-view') {
                    if (typeof loadGRN === 'function') loadGRN();
                } else if (targetId === 'sales-view') {
                    if (typeof loadSales === 'function') loadSales();
                } else if (targetId === 'quotes-view') {
                    if (typeof loadQuotes === 'function') loadQuotes();
                } else if (targetId === 'returns-view') {
                    if (typeof loadReturns === 'function') loadReturns();
                } else if (targetId === 'rma-view') {
                    if (typeof loadRMA === 'function') loadRMA();
                } else if (targetId === 'finance-view') {
                    if (typeof loadFinance === 'function') loadFinance();
                } else if (targetId === 'woo-view') {
                    if (typeof loadWoo === 'function') loadWoo();
                } else if (targetId === 'warranty-view') {
                    if (typeof loadWarrantyTracker === 'function') loadWarrantyTracker();
                } else if (targetId === 'settings-view') {
                    if (typeof loadSettings === 'function') loadSettings();
                } else if (targetId === 'customers-view') {
                    if (typeof loadCustomers === 'function') loadCustomers();
                } else if (targetId === 'vendors-view') {
                    if (typeof loadVendors === 'function') loadVendors();
                } else if (targetId === 'reports-view') {
                    if (typeof loadReports === 'function') loadReports();
                } else if (targetId === 'email-view') {
                    if (typeof loadEmail === 'function') loadEmail();
                } else if (targetId === 'accounting-view') {
                    if (typeof loadAccounting === 'function') loadAccounting();
                } else if (targetId === 'financial-summary-view') {
                    if (typeof loadFinancialSummary === 'function') loadFinancialSummary();
                } else if (targetId === 'hr-view') {
                    if (typeof loadHR === 'function') loadHR();
                } else if (targetId === 'users-view') {
                    if (typeof loadUsers === 'function') loadUsers();
                } else if (targetId === 'activity-logs-view') {
                    if (typeof loadActivityLogs === 'function') loadActivityLogs();
                } else if (targetId === 'sales-orders-view') {
                    if (typeof loadSalesOrders === 'function') loadSalesOrders();
                } else if (targetId === 'payments-view') {
                    if (typeof loadPayments === 'function') loadPayments();
                } else if (targetId === 'outstanding-view') {
                    if (typeof loadOutstanding === 'function') loadOutstanding();
                } else if (targetId === 'tax-view') {
                    if (typeof loadTax === 'function') loadTax();
                } else if (targetId === 'web-orders-view') {
                    if (typeof loadWebOrders === 'function') loadWebOrders();
                } else if (targetId === 'service-view') {
                    if (typeof loadService === 'function') loadService();
                } else if (targetId === 'statements-view') {
                    if (typeof loadStatements === 'function') loadStatements();
                } else if (targetId === 'stores-view') {
                    if (typeof renderStoresUI === 'function') renderStoresUI();
                } else if (targetId === 'calculator-view') {
                    if (typeof initCalculator === 'function') initCalculator();

                } else if (targetId === 'analytics-view') {
                    if (typeof loadAnalytics === 'function') loadAnalytics();
                } else if (targetId === 'documents-view') {
                    if (typeof loadDocuments === 'function') loadDocuments();
                } else if (targetId === 'commissions-view') {
                    if (typeof loadCommissions === 'function') loadCommissions();
                } else if (targetId === 'office-use-view') {
                    if (typeof loadOfficeUse === 'function') loadOfficeUse();
                } else if (targetId === 'banking-view') {
                    if (typeof loadBanking === 'function') loadBanking();
                } else if (targetId === 'company-loans-view') {
                    if (typeof loadCompanyLoans === 'function') loadCompanyLoans();
                } else if (targetId === 'ai-view') {
                    // AI View typically is static or has its own logic in ai_agent.js
                }
            }
        });
    });
}

async function updateAppLogo() {
    const wrap = document.getElementById('side-logo-wrap');
    const img = document.getElementById('side-logo-img');
    const icon = document.getElementById('side-logo-icon');

    if (!wrap || !img || !icon) return;

    try {
        const logoSet = await db.settings.get('store_logo');
        if (logoSet && logoSet.value) {
            img.src = logoSet.value;
            wrap.classList.remove('hidden');
            icon.classList.add('hidden');
        } else {
            wrap.classList.add('hidden');
            icon.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Logo load error:", err);
    }
}

function handleInitialHashNavigation() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) return false;

    const viewMap = {
        dashboard: 'dashboard-view',
        accounting: 'accounting-view',
        banking: 'banking-view',
        hr: 'hr-view',
        users: 'users-view',
        stores: 'stores-view',
        pos: 'pos-view',
        office: 'office-use-view',
        products: 'products-view',
        purchases: 'purchases-view',
        grn: 'grn-view',
        sales: 'sales-view',
        quotes: 'quotes-view',
        'sales-orders': 'sales-orders-view',
        'web-orders': 'web-orders-view',
        returns: 'returns-view',
        rma: 'rma-view',
        warranty: 'warranty-view',
        finance: 'finance-view',
        payments: 'payments-view',
        vendors: 'vendors-view',
        customers: 'customers-view',
        outstanding: 'outstanding-view',
        statements: 'statements-view',
        reports: 'reports-view',
        email: 'email-view',
        accounting: 'accounting-view',
        tax: 'tax-view',
        analytics: 'analytics-view',
        documents: 'documents-view',
        commissions: 'commissions-view',
        'office-use': 'office-use-view',
        service: 'service-view',
        banking: 'banking-view',
        'company-loans': 'company-loans-view'
    };

    const targetView = viewMap[hash] || (hash.endsWith('-view') ? hash : null);
    if (!targetView) return false;

    const btn = document.querySelector(`.nav-btn[data-target="${targetView}"]`);
    if (!btn) return false;

    btn.click();
    return true;
}

async function updateBranding() {
    try {
        const nameSet = await db.settings.get('store_name');
        if (nameSet && nameSet.value) {
            const storeName = nameSet.value;
            // Update Tab Title
            document.title = storeName + ' - POS & Inventory';
            
            // Update Sidebar Title (Dual line support)
            const mainEl = document.getElementById('brand-main');
            const subEl = document.getElementById('brand-sub');

            if (mainEl) {
                if (storeName.toLowerCase().includes('mobilemate') && storeName.toLowerCase().includes('technologies')) {
                    mainEl.textContent = 'MobileMate';
                    if (subEl) {
                        subEl.textContent = 'Technologies (PVT) LTD';
                        subEl.classList.remove('hidden');
                        autoScaleBrandText();
                    }
                } else if (storeName.split(' ').length > 1) {
                    const parts = storeName.split(' ');
                    mainEl.textContent = parts[0];
                    if (subEl) {
                        subEl.textContent = parts.slice(1).join(' ');
                        subEl.classList.remove('hidden');
                        autoScaleBrandText();
                    }
                } else {
                    mainEl.textContent = storeName;
                    if (subEl) subEl.classList.add('hidden');
                }
            }
        }
    } catch(err) {
        console.error("Branding load error:", err);
    }
}

/**
 * Shrinks the #brand-sub font size until it fits on a single line.
 * Starts at 9px and steps down to a minimum of 6px.
 */
function autoScaleBrandText() {
    const subEl = document.getElementById('brand-sub');
    if (!subEl) return;

    // Reset to the default size first so we don't compound reductions
    subEl.style.fontSize = '';
    subEl.style.letterSpacing = '';

    const parent = subEl.parentElement;
    if (!parent) return;

    // Allow layout to settle before measuring
    requestAnimationFrame(() => {
        let fontSize = 9; // px — matches the Tailwind text-[9px] default
        subEl.style.fontSize = fontSize + 'px';

        // Step down 0.5px at a time until text fits or we hit the floor
        while (subEl.scrollWidth > parent.clientWidth && fontSize > 6) {
            fontSize -= 0.5;
            subEl.style.fontSize = fontSize + 'px';
            // Slightly tighten letter-spacing at small sizes to recover extra space
            if (fontSize <= 7.5) {
                subEl.style.letterSpacing = '-0.03em';
            }
        }
    });
}

async function updateAppFavicon() {
    try {
        const favSet = await db.settings.get('store_favicon');
        const faviconUrl = (favSet && favSet.value) ? favSet.value : 'assets/icons/favicon.png';
        
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = faviconUrl;

        // Also update apple-touch-icon
        let appleLink = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleLink) {
            appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = faviconUrl;
        
    } catch (err) {
        console.error("Favicon update error:", err);
    }
}

// Utility: Format Currency
function formatCurrency(amount) {
    return 'Rs. ' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Utility: Show Alert (using SweetAlert2 if available)
function showAlert(title, text, icon = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonColor: '#4F46E5',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
    } else {
        alert(`${title}: ${text}`);
    }
}
// Preview Modal Logic
function openPreviewModal(html, onPrint, onEdit = null, onDN = null, onShare = null, onDownload = null) {
    const modal = document.getElementById('preview-modal');
    const iframe = document.getElementById('preview-iframe');
    const printBtn = document.getElementById('preview-print-btn');
    const editBtn = document.getElementById('preview-edit-btn');
    const shareBtn = document.getElementById('preview-share-btn');
    const downloadBtn = document.getElementById('preview-download-btn');
    const dnBtn = document.getElementById('preview-dn-btn');
    
    if (!modal || !iframe) return;

    // Remove any window.print() or window.close() scripts from the preview HTML
    const cleanedHtml = html.replace(/window\.print\(\);/g, '').replace(/window\.close\(\);/g, '');

    // Inject content into iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(cleanedHtml);
    doc.close();

    const updateIframeHeight = () => {
        try {
            if (!iframe.contentWindow || !iframe.contentWindow.document) return;
            const doc = iframe.contentWindow.document;
            const body = doc.body;
            const htmlEl = doc.documentElement;
            if (!body) return;

            // Measure all .page elements
            const pages = doc.querySelectorAll('.page');
            let pagesTotalHeight = 0;
            if (pages && pages.length > 0) {
                pages.forEach(p => {
                    const h = Math.max(p.scrollHeight || 0, p.offsetHeight || 0, p.getBoundingClientRect().height || 0, 1122);
                    pagesTotalHeight += h;
                });
                pagesTotalHeight += ((pages.length - 1) * 35);
            }

            const finalHeight = Math.max(
                body.scrollHeight || 0,
                body.offsetHeight || 0,
                htmlEl.scrollHeight || 0,
                htmlEl.offsetHeight || 0,
                pagesTotalHeight
            );

            if (finalHeight > 100) {
                iframe.style.height = (finalHeight + 40) + 'px';
                fitPreviewToScreen();
            }
        } catch (e) {
            console.error("Could not adjust iframe height", e);
        }
    };

    // Trigger progressive measurements to catch async font and layout rendering
    iframe.onload = updateIframeHeight;
    setTimeout(updateIframeHeight, 100);
    setTimeout(updateIframeHeight, 350);
    setTimeout(updateIframeHeight, 800);
    setTimeout(updateIframeHeight, 1500);

    // Set up print button
    if (printBtn) {
        printBtn.onclick = () => {
            onPrint();
            closePreviewModal();
        };
    }

    // Set up edit button
    if (editBtn) {
        if (onEdit) {
            editBtn.classList.remove('hidden');
            editBtn.onclick = () => {
                onEdit();
                closePreviewModal();
            };
        } else {
            editBtn.classList.add('hidden');
        }
    }

    // Set up Share button
    if (shareBtn) {
        if (onShare) {
            shareBtn.classList.remove('hidden');
            shareBtn.onclick = () => {
                onShare(cleanedHtml);
            };
        } else {
            shareBtn.classList.add('hidden');
        }
    }

    // Set up Download button
    if (downloadBtn) {
        if (onDownload) {
            downloadBtn.classList.remove('hidden');
            downloadBtn.onclick = () => {
                onDownload(cleanedHtml);
            };
        } else {
            downloadBtn.classList.add('hidden');
        }
    }

    // Set up DN button
    if (dnBtn) {
        if (onDN) {
            dnBtn.classList.remove('hidden');
            dnBtn.onclick = () => {
                onDN();
                closePreviewModal();
            };
        } else {
            dnBtn.classList.add('hidden');
        }
    }

    // Show modal with animations
    modal.classList.remove('hidden', 'invisible');
    modal.classList.add('flex'); // Ensure flex is applied as it's the layout type
    
    document.body.style.overflow = 'hidden'; // Prevent scroll

    setTimeout(updateIframeHeight, 150);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.add('invisible');
    modal.classList.remove('flex');
    document.body.style.overflow = ''; // Restore scroll
}

function fitPreviewToScreen() {
    const container = document.getElementById('preview-frame-container');
    const modalBody = container?.parentElement;
    if (!container || !modalBody) return;

    const vWidth = modalBody.clientWidth - 40;
    const docWidth = 794; // ~210mm in px at 96dpi

    const scaleX = vWidth / docWidth;
    let scale = Math.min(scaleX, 1);

    container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
    if (!document.getElementById('preview-modal').classList.contains('hidden')) {
        fitPreviewToScreen();
    }
    // Unlock body scroll if sidebar overlay became irrelevant on resize
    if (window.innerWidth >= 1024) {
        const overlay = document.getElementById('sidebar-overlay');
        const sidebar = document.getElementById('sidebar');
        if (overlay && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
        if (sidebar) {
            sidebar.classList.remove('-translate-x-full');
        }
    }
});

// ── Scroll-to-top button visibility ─────────────────────────────────────────
function initScrollToTop() {
    const btn = document.getElementById('scroll-to-top');
    if (!btn) return;
    const onScroll = () => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        if (scrollY > 300) {
            btn.classList.remove('opacity-0', 'translate-y-10', 'invisible');
            btn.classList.add('opacity-100', 'translate-y-0', 'visible');
        } else {
            btn.classList.add('opacity-0', 'translate-y-10', 'invisible');
            btn.classList.remove('opacity-100', 'translate-y-0', 'visible');
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}

// Note: closePreviewModal is defined above (line 664). Duplicate removed.

// Utility to generate PDF and use Web Share API
async function generatePDFAndShare(htmlContent, filename, shareData = {}) {
    console.log("Generating PDF:", filename);
    
    // 1. Clean HTML: Remove scripts that trigger print/close
    const cleanedHtml = htmlContent
        .replace(/window\.print\(\);/g, '')
        .replace(/window\.close\(\);/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            letterRendering: true,
            allowTaint: false,
            scrollY: 0,
            windowY: 0
        },
        pagebreak: { 
            mode: ['css', 'legacy'], 
            before: '.page-break-before', 
            after: ['.page', '.page-break-after'] 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Create a temporary container for PDF generation
    const element = document.createElement('div');
    element.className = 'pdf-export-container';
    element.style.width = '210mm';
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.background = 'white';
    element.style.color = '#1a1a1a'; // Prevent dark mode inheritance
    element.style.textAlign = 'left';
    element.style.opacity = '1'; // Ensure it's not invisible
    element.style.visibility = 'visible';
    element.innerHTML = cleanedHtml;
    document.body.appendChild(element);

    try {
        // Wait for images to load inside the element
        const images = Array.from(element.getElementsByTagName('img'));
        if (images.length > 0) {
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));
        }

        // Small delay for CSS / Layout calculations
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use the worker approach for more control
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        
        // Safety check
        if (pdfBlob.size < 1000) {
            const msg = "Generated PDF is too small, likely empty.";
            console.error('PDF generation failed:', msg);
            if (typeof showAlert === 'function') showAlert('Error', 'Failed to generate PDF: ' + msg, 'error');
            throw new Error(msg);
        }

        document.body.removeChild(element);

        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (!shareData.forceDownload && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: shareData.title || 'Document',
                text: shareData.text || 'Please find the attached document.',
                files: [file]
            });
        } else {
            // Fallback for browsers that don't support file sharing
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            if (shareData.url) {
                setTimeout(() => {
                    window.open(shareData.url, '_blank');
                }, 1000);
            } else {
                showAlert('Downloaded', 'PDF downloaded successfully.', 'success');
            }
            
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
    } catch (error) {
        console.error('PDF Generation Error:', error);
        showAlert('Error', 'Failed to generate PDF. Please try the "Print" option instead.', 'error');
        if (element && element.parentNode) document.body.removeChild(element);
    }
}

async function shareDocumentViaOutlook(type, docNo, customer, total, items, htmlContent = null) {
    const subject = `${docNo} from MobileMate Technologies`;
    
    const body = "Hello,\r\nPlease find the attached document.\r\nIf you have any further details, feel free to contact us.\r\n\r\nThank you for choosing MobileMate Technologies Private Limited.";

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const filename = `${docNo.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    if (htmlContent && typeof generatePDFAndShare === 'function') {
        showAlert('Generating...', 'Preparing PDF for Outlook/Email...', 'info');
        await generatePDFAndShare(htmlContent, filename, {
            title: subject,
            text: body,
            url: mailtoUrl,
            forceDownload: true // Critical for Outlook Classic/Desktop to avoid "no_name" error
        });
    } else {
        window.location.href = mailtoUrl;
    }
}

// Global UI Utility: Toggle Password Visibility
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Global Utility: Generate a human-readable display number for any sales document.
 * Used across customers.js, sales.js, payments.js, statements.js, finance.js, dashboard.js, etc.
 * @param {Object} sale - The sale object from the database
 * @returns {string} - A formatted document reference string
 */
function getInvoiceDisplayNumber(sale) {
    if (!sale) return 'N/A';

    const docType = sale.document_type || 'invoice';
    const id = sale.id;

    // If a custom invoice_number was explicitly assigned (e.g. INV-2025-001), use it
    if (sale.invoice_number && String(sale.invoice_number).trim() !== '') {
        return String(sale.invoice_number).trim();
    }

    // Otherwise, generate a prefix-based number from the document type
    if (docType === 'quote') {
        return `QTE-${String(id).padStart(4, '0')}`;
    } else if (docType === 'sales_order') {
        return `SO-${String(id).padStart(4, '0')}`;
    } else if (docType === 'web_order') {
        return `W-${String(id).padStart(4, '0')}`;
    } else if (docType === 'delivery_note') {
        return `DN-${String(id).padStart(4, '0')}`;
    } else {
        // invoice / pos_invoice / sale / default — use INV-M prefix with 5-digit zero-padding
        return `INV-M${String(id).padStart(4, '0')}`;
    }
}

/**
 * Global Utility: Get the next sequential invoice number for a given document type.
 * Scans all existing sales records to find the highest INV-M number already in use,
 * then returns the next one in the sequence (e.g. INV-M00012 after INV-M00011).
 * Falls back to INV-M00001 if no prior invoices exist.
 * @param {string} docType - The document type ('invoice', 'pos_invoice', etc.)
 * @returns {Promise<string|null>} - A formatted invoice number string, or null for non-invoice types
 */
async function getNextInvoiceNumber(docType = 'invoice') {
    // Only auto-number true invoices; quotes, orders etc. use their own prefix
    if (docType !== 'invoice' && docType !== 'pos_invoice') return null;

    try {
        // Only count invoices and pos_invoices for strict sequence
        const allSales = await db.sales
            .filter(s => s.document_type === 'invoice' || s.document_type === 'pos_invoice')
            .toArray();
        const nextNum = allSales.length + 1;
        return `INV-M${String(nextNum).padStart(4, '0')}`;
    } catch (err) {
        console.error('getNextInvoiceNumber error:', err);
        return null;
    }
}

/**
 * One-time migration: corrects two invoice numbers that were generated
 * with the wrong sequence (INV-M00045 → INV-M00010, INV-M00047 → INV-M00011).
 * Runs silently on startup and updates records, commissions, and ledger entries.
 */
async function migrateInvoiceNumbers() {
    try {
        // 1. Get all invoices (and pos_invoices) sorted by creation (id ascending)
        const allSales = await db.sales
            .filter(s => s.document_type === 'invoice' || s.document_type === 'pos_invoice')
            .sortBy('id');

        // 2. Assign new invoice numbers in strict sequence
        let invoiceMap = {};
        for (let i = 0; i < allSales.length; i++) {
            const s = allSales[i];
            const newNum = `INV-M${String(i + 1).padStart(4, '0')}`;
            if (s.invoice_number !== newNum) {
                await db.sales.update(s.id, { invoice_number: newNum });
                invoiceMap[s.invoice_number] = newNum;
                console.log(`[Migration] Invoice ID ${s.id} renumbered to ${newNum}`);
            } else {
                invoiceMap[s.invoice_number] = newNum;
            }
        }

        // 3. Update commissions table invoice_number references
        const allCommissions = await db.commissions.toArray();
        for (const c of allCommissions) {
            if (c.invoice_number && invoiceMap[c.invoice_number]) {
                await db.commissions.update(c.id, { invoice_number: invoiceMap[c.invoice_number] });
                console.log(`[Migration] Commission ID ${c.id} invoice number updated to ${invoiceMap[c.invoice_number]}`);
            }
        }

        // 4. Update ledger descriptions referencing old invoice numbers
        const allLedgers = await db.ledger.toArray();
        for (const l of allLedgers) {
            if (l.description) {
                let newDesc = l.description;
                for (const oldNum in invoiceMap) {
                    if (oldNum && oldNum !== invoiceMap[oldNum] && newDesc.includes(oldNum)) {
                        newDesc = newDesc.split(oldNum).join(invoiceMap[oldNum]);
                    }
                }
                if (newDesc !== l.description) {
                    await db.ledger.update(l.id, { description: newDesc });
                    console.log(`[Migration] Ledger ID ${l.id} description updated to: ${newDesc}`);
                }
            }
        }
    } catch (err) {
        console.error('[Migration] migrateInvoiceNumbers error:', err);
    }
}
