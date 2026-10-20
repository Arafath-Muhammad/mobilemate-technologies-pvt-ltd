/**
 * MobileMate POS — Mobile Navigation Module
 * Injects a bottom nav bar and a "More" slide-up drawer
 * for fast module access on phones / tablets.
 */

(function () {
    'use strict';

    // ── Primary bottom-nav items (always visible) ──────────────────────
    const PRIMARY_NAV = [
        { icon: 'fa-house', label: 'Home', target: 'dashboard-view' },
        { icon: 'fa-cash-register', label: 'POS', target: 'pos-view' },
        { icon: 'fa-file-invoice-dollar', label: 'Sales', target: 'sales-view' },
        { icon: 'fa-users', label: 'Customers', target: 'customers-view' },
        { icon: 'fa-ellipsis', label: 'More', target: '__more__', class: 'mnav-more' }
    ];

    // ── All modules for the More drawer (Removed duplicates from PRIMARY_NAV) ──────────
    const MORE_ITEMS = [
        { icon: 'fa-box-open', label: 'Products', target: 'products-view', color: '#10b981' },
        { icon: 'fa-cart-shopping', label: 'Purchases', target: 'purchases-view', color: '#f59e0b' },
        { icon: 'fa-truck-ramp-box', label: 'GRN', target: 'grn-view', color: '#8b5cf6' },
        { icon: 'fa-file-lines', label: 'Quotes', target: 'quotes-view', color: '#06b6d4' },
        { icon: 'fa-file-signature', label: 'Orders', target: 'sales-orders-view', color: '#a78bfa' },
        { icon: 'fa-cloud-arrow-down', label: 'Web Orders', target: 'web-orders-view', color: '#0ea5e9' },
        { icon: 'fa-arrow-rotate-left', label: 'Returns', target: 'returns-view', color: '#f97316' },
        { icon: 'fa-toolbox', label: 'RMA', target: 'rma-view', color: '#ef4444' },
        { icon: 'fa-screwdriver-wrench', label: 'Service', target: 'service-view', color: '#f59e0b' },
        { icon: 'fa-money-bill-wave', label: 'Payments', target: 'payments-view', color: '#22c55e' },
        { icon: 'fa-shop', label: 'Vendors', target: 'vendors-view', color: '#64748b' },
        { icon: 'fa-shield-halved', label: 'Warranty', target: 'warranty-view', color: '#7c3aed' },
        { icon: 'fa-scale-unbalanced-flip', label: 'Outstanding', target: 'outstanding-view', color: '#f59e0b' },
        { icon: 'fa-wallet', label: 'Finance', target: 'finance-view', color: '#0e3257' },
        { icon: 'fa-file-invoice-dollar', label: 'Tax/Profit', target: 'tax-view', color: '#10b981' },
        { icon: 'fa-chart-bar', label: 'Reports', target: 'reports-view', color: '#3b82f6' },
        { icon: 'fa-calculator', label: 'Accounting', target: 'accounting-view', color: '#64748b' },
        { icon: 'fa-building-columns', label: 'Banking', target: 'banking-view', color: '#14b8a6' },
        { icon: 'fa-user-tie', label: 'HR', target: 'hr-view', color: '#6366f1' },
        { icon: 'fa-user-gear', label: 'Users', target: 'users-view', color: '#01a5a5' },
        { icon: 'fa-store', label: 'Stores', target: 'stores-view', color: '#f97316' },
        { icon: 'fa-envelope', label: 'Email', target: 'email-view', color: '#3b82f6' },
        { icon: 'fa-wordpress fa-brands', label: 'WooCommerce', target: 'woo-view', color: '#2271b1' },
        { icon: 'fa-square-root-variable', label: 'VAT Calc', target: 'calculator-view', color: '#ef4444' },
        { icon: 'fa-chart-simple', label: 'Financial Summary', target: 'financial-summary-view', color: '#0ea5e9' },
        { icon: 'fa-hand-holding-dollar', label: 'Company Loans', target: 'company-loans-view', color: '#f59e0b' },
        { icon: 'fa-percent', label: 'Commissions', target: 'commissions-view', color: '#8b5cf6' },
        { icon: 'fa-chart-line', label: 'Analytics', target: 'analytics-view', color: '#6366f1' },
        { icon: 'fa-file-invoice', label: 'Statements', target: 'statements-view', color: '#0284c7' },
        { icon: 'fa-clock-rotate-left', label: 'Activity Logs', target: 'activity-logs-view', color: '#64748b' },
        { icon: 'fa-file-code', label: 'Documents', target: 'documents-view', color: '#ec4899' },
        { icon: 'fa-building-user', label: 'Office Use', target: 'office-use-view', color: '#6366f1' },
        { icon: 'fa-gear', label: 'Settings', target: 'settings-view', color: '#6b7280' },
    ];

    let currentActiveTarget = 'dashboard-view';
    let isDrawerOpen = false;

    // ── Build the bottom nav bar ────────────────────────────────────────
    function buildBottomNav() {
        const nav = document.createElement('div');
        nav.id = 'mobile-bottom-nav';

        const inner = document.createElement('div');
        inner.className = 'mnav-items';

        PRIMARY_NAV.forEach(item => {
            const btn = document.createElement('button');
            btn.className = `mnav-btn ${item.class || ''}`;
            btn.setAttribute('data-target', item.target);
            btn.setAttribute('aria-label', item.label);

            // Determine icon class(es)
            const iconCls = item.icon.includes('fa-brands')
                ? `fa-brands ${item.icon.replace('fa-brands', '').trim()}`
                : `fa-solid ${item.icon}`;

            btn.innerHTML = `<i class="${iconCls}"></i><span>${item.label}</span>`;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.target === '__more__') {
                    toggleMoreDrawer();
                } else {
                    navigateTo(item.target);
                }
            });

            inner.appendChild(btn);
        });

        nav.appendChild(inner);
        document.body.appendChild(nav);
    }

    // ── Build the slide-up More drawer ─────────────────────────────────
    function buildMoreDrawer() {
        const drawer = document.createElement('div');
        drawer.id = 'mobile-more-drawer';

        const backdrop = document.createElement('div');
        backdrop.id = 'mobile-more-backdrop';
        backdrop.addEventListener('click', closeMoreDrawer);

        const panel = document.createElement('div');
        panel.id = 'mobile-more-panel';

        const handle = document.createElement('div');
        handle.className = 'drawer-handle';

        const header = document.createElement('div');
        header.className = 'drawer-header';
        header.textContent = 'All Modules';

        const grid = document.createElement('div');
        grid.className = 'drawer-grid';

        MORE_ITEMS.forEach(item => {
            // Role filter – admin-only items are already hidden by auth.js
            const itemEl = document.createElement('button');
            itemEl.className = 'drawer-item';
            itemEl.setAttribute('data-target', item.target);
            itemEl.setAttribute('aria-label', item.label);

            // icon families
            let iconCls = `fa-solid ${item.icon}`;
            if (item.icon.includes('fa-brands') || item.icon.includes('fa-wordpress')) {
                iconCls = `fa-brands ${item.icon.replace('fa-brands', '').trim()}`;
            }

            itemEl.innerHTML = `<i class="${iconCls}" style="color:${item.color}"></i>${item.label}`;

            itemEl.addEventListener('click', () => {
                navigateTo(item.target);
                closeMoreDrawer();
            });

            grid.appendChild(itemEl);
        });

        panel.appendChild(handle);
        panel.appendChild(header);
        panel.appendChild(grid);

        drawer.appendChild(backdrop);
        drawer.appendChild(panel);
        document.body.appendChild(drawer);
    }

    // ── Navigate via existing sidebar nav buttons ────────────────────
    function navigateTo(target) {
        const sidebarBtn = document.querySelector(`.nav-btn[data-target="${target}"]`);
        if (sidebarBtn) {
            sidebarBtn.click();
        }
        updateMobileNavActive(target);
        currentActiveTarget = target;
    }

    // ── Update active state in bottom nav ────────────────────────────
    function updateMobileNavActive(target) {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav) return;

        nav.querySelectorAll('.mnav-btn').forEach(btn => {
            const t = btn.getAttribute('data-target');
            if (t === target) {
                btn.classList.add('active');
            } else if (t !== '__more__') {
                btn.classList.remove('active');
            }
        });

        // If the target is not in the primary nav, activate the More button
        const primaryTargets = PRIMARY_NAV
            .filter(i => i.target !== '__more__')
            .map(i => i.target);

        const moreBtn = nav.querySelector('.mnav-more');
        if (!primaryTargets.includes(target) && moreBtn) {
            moreBtn.classList.add('active');
        } else if (moreBtn) {
            moreBtn.classList.remove('active');
        }

        // Highlight active item in the more drawer grid
        const drawerGrid = document.querySelector('#mobile-more-panel .drawer-grid');
        if (drawerGrid) {
            drawerGrid.querySelectorAll('.drawer-item').forEach(el => {
                if (el.getAttribute('data-target') === target) {
                    el.classList.add('active-item');
                } else {
                    el.classList.remove('active-item');
                }
            });
        }
    }

    // ── Drawer open / close ─────────────────────────────────────────
    function openMoreDrawer() {
        const drawer = document.getElementById('mobile-more-drawer');
        if (!drawer) return;
        isDrawerOpen = true;
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMoreDrawer() {
        const drawer = document.getElementById('mobile-more-drawer');
        if (!drawer) return;
        isDrawerOpen = false;
        drawer.classList.remove('open');
        document.body.style.overflow = '';
    }

    function toggleMoreDrawer() {
        if (isDrawerOpen) {
            closeMoreDrawer();
        } else {
            openMoreDrawer();
        }
    }

    // ── Hook into existing sidebar navigation events ─────────────────
    function interceptSidebarNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn[data-target]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.getAttribute('data-target');
                if (t) {
                    currentActiveTarget = t;
                    updateMobileNavActive(t);
                }
            });
        });
    }

    // ── Handle swipe to close drawer ─────────────────────────────────
    function initSwipeToClose() {
        const panel = document.getElementById('mobile-more-panel');
        if (!panel) return;

        let startY = 0;
        panel.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
        panel.addEventListener('touchend', e => {
            const endY = e.changedTouches[0].clientY;
            if (endY - startY > 80) closeMoreDrawer();
        }, { passive: true });
    }

    // ── Keyboard escape key ──────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isDrawerOpen) closeMoreDrawer();
    });

    // ── Filter admin-only items based on current user's role ─────────
    function applyRoleFilter() {
        const adminOnlyTargets = [
            'dashboard-view', 'accounting-view', 'hr-view', 'users-view',
            'stores-view', 'products-view', 'purchases-view', 'grn-view',
            'finance-view', 'tax-view', 'reports-view', 'email-view',
            'woo-view', 'outstanding-view'
        ];

        // Check if user is cashier via existing auth mechanism
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'cashier') {
            const drawerItems = document.querySelectorAll('#mobile-more-panel .drawer-item');
            drawerItems.forEach(item => {
                const t = item.getAttribute('data-target');
                if (adminOnlyTargets.includes(t)) {
                    item.style.display = 'none';
                }
            });

            // Also hide admin bottom nav items if cashier
            const bottomNavBtns = document.querySelectorAll('#mobile-bottom-nav .mnav-btn');
            bottomNavBtns.forEach(btn => {
                const t = btn.getAttribute('data-target');
                if (t && adminOnlyTargets.includes(t)) {
                    btn.style.display = 'none';
                }
            });
        }
    }

    // ── Main init ────────────────────────────────────────────────────
    function init() {
        // Only on mobile / tablet
        if (!isMobileViewport()) {
            // Still observe viewport changes
            window.addEventListener('resize', handleResize);
            return;
        }
        initMobile();
    }

    function isMobileViewport() {
        return window.innerWidth < 1024;
    }

    function initMobile() {
        buildBottomNav();
        buildMoreDrawer();
        interceptSidebarNavigation();
        initSwipeToClose();
        updateMobileNavActive(currentActiveTarget);

        // Apply role filters after a short delay for auth to settle
        setTimeout(applyRoleFilter, 600);
    }

    let mobileInit = false;
    function handleResize() {
        if (isMobileViewport() && !mobileInit) {
            mobileInit = true;
            initMobile();
        }
    }

    // ── DOM Ready ────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
        mobileInit = isMobileViewport();
    }

    // Expose closeMoreDrawer globally for external use
    window.closeMobileMoreDrawer = closeMoreDrawer;
    window.mobileNavigateTo = navigateTo;
    window.updateMobileNavActive = updateMobileNavActive;

})();
