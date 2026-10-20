// Authentication & Role Management Logic
const HARDCODED_USERS = [
    { id: 9991, username: 'admin', password: 'Arafath97Aysha01Afran25', role: 'admin', permissions: ['all'] },
    { id: 9994, username: 'cashier', password: '123', role: 'cashier', permissions: ['pos-view', 'sales-view', 'quotes-view', 'returns-view', 'rma-view', 'customers-view', 'vendors-view', 'settings-view', 'warranty-view', 'web-orders-view', 'service-view', 'statements-view'] }
];

let currentUser = null;

async function initAuth() {
    try {
        // Ensure hardcoded users exist and are up to date in the DB
        await ensureUsersExist();
    } catch (err) {
        console.warn("[Auth] Database unavailable during ensureUsersExist (normal in file:// preview):", err);
    }

    try {
        const session = sessionStorage.getItem('mm_user');
        if (session) {
            currentUser = JSON.parse(session);
            hideLogin();
            await applyPermissions();
        } else {
            showLogin();
        }
    } catch (err) {
        console.warn("[Auth] Session check failed, showing login:", err);
        showLogin();
    }
}

async function ensureUsersExist() {
    try {
        if (!db || typeof db.isOpen !== 'function') return;
        // Remove defunct ‘manager’, ‘manager2’, and ‘staff1’ accounts if they exist in the DB
        await db.users.where({ id: 9992 }).delete().catch(() => {});
        await db.users.where({ id: 9993 }).delete().catch(() => {});
        await db.users.where({ id: 9995 }).delete().catch(() => {});

        for (const hUser of HARDCODED_USERS) {
            const existing = await db.users.where({ username: hUser.username }).first().catch(() => null);
            if (!existing) {
                await db.users.add(hUser).catch(() => {});
            } else {
                // Ensure permissions are synchronized from code to DB for hardcoded users
                await db.users.update(existing.id, { permissions: hUser.permissions }).catch(() => {});
            }
        }
    } catch (err) {
        console.warn("[Auth] ensureUsersExist caught error:", err);
    }
}

function showLogin() {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.remove('hidden');
        loginOverlay.classList.add('flex');
    }
}

function hideLogin() {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.classList.add('hidden');
        loginOverlay.classList.remove('flex');
    }
}

async function handleLogin(e) {
    if (e) e.preventDefault();
    const user = (document.getElementById('login-username').value || '').trim();
    const pass = (document.getElementById('login-password').value || '').trim();

    try {
        // 1. Check Hardcoded Users first
        let found = HARDCODED_USERS.find(u => u.username === user && u.password === pass);
        
        // 2. Fallback to Database
        if (!found) {
            try {
                found = await db.users.where('[username+password]').equals([user, pass]).first();
            } catch (dbErr) {
                console.warn("[Auth] DB user lookup failed:", dbErr);
            }
        }

        if (found) {
            currentUser = found;
            try {
                sessionStorage.setItem('mm_user', JSON.stringify(found));
            } catch (sErr) {}
            hideLogin();
            await applyPermissions();
            if (typeof showAlert === 'function') {
                showAlert('Welcome', `Logged in as ${found.username} (${found.role})`);
            }
            
            // Navigate based on role
            if (found.role === 'cashier') {
                const posBtn = document.querySelector('[data-target="pos-view"]');
                if (posBtn) posBtn.click();
            } else {
                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
            }
        } else {
            if (typeof showAlert === 'function') {
                showAlert('Login Failed', 'Invalid username or password', 'error');
            } else {
                alert('Login Failed: Invalid username or password');
            }
        }
    } catch (err) {
        console.error("Login error:", err);
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('mm_user');
    location.reload(); // Simplest way to reset app state
}

async function applyPermissions() {
    if (!currentUser) return;

    const role = currentUser.role;
    const permissions = currentUser.permissions || [];
    const isAdmin = role === 'admin' || permissions.includes('all');
    const isManager = role === 'manager';

    // Fetch Global Module Visibility
    let moduleVisibility = {};
    let enabledCommission = true;
    try {
        const mvSet = await db.settings.get('module_visibility');
        if (mvSet) moduleVisibility = mvSet.value;
        // New: fetch global commission management toggle
        try {
            const ecSet = await db.settings.get('enabled_commission_management');
            if (ecSet) enabledCommission = ecSet.value;
        } catch (err) {
            console.error('Error fetching commission toggle:', err);
        }
    } catch (err) {
        console.error("Error fetching module visibility:", err);
    }

    // Sidebar items granular control
    const navItems = document.querySelectorAll('.nav-btn');
    navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        
        // Priority 1: Global Module Visibility (Disable feature entirely)
        if (moduleVisibility[target] === false) {
            item.classList.add('hidden');
            return;
        }

        // New: Global Commission Management toggle
        if (target === 'commissions-view' && !enabledCommission) {
            item.classList.add('hidden');
            return;
        }

        // Priority 2: User Role/Permissions
        if (isAdmin || isManager) {
            item.classList.remove('hidden');
        } else if (permissions.includes(target)) {
            item.classList.remove('hidden');
        } else {
            // Check if it's admin-only class for legacy support
            if (item.classList.contains('admin-only')) {
                item.classList.add('hidden');
            } else {
                // If not in permissions and not admin, hide it
                item.classList.add('hidden');
            }
        }
    });

    // Update section labels (labels like "Administration", "Business Insights")
    // Hide a label if ALL subsequent .nav-btn elements until the next label are hidden
    const navContainer = document.querySelector('nav');
    if (navContainer) {
        const children = Array.from(navContainer.children);
        let currentLabel = null;
        let hasVisibleChild = false;

        children.forEach(child => {
            if (child.tagName === 'DIV' && child.classList.contains('px-3')) {
                // New Section Header
                if (currentLabel && !hasVisibleChild) {
                    currentLabel.classList.add('hidden');
                }
                currentLabel = child;
                hasVisibleChild = false;
            } else if (child.tagName === 'A' && child.classList.contains('nav-btn')) {
                if (!child.classList.contains('hidden')) {
                    hasVisibleChild = true;
                }
            }
        });
        // Last group
        if (currentLabel && !hasVisibleChild) {
            currentLabel.classList.add('hidden');
        } else if (currentLabel) {
            currentLabel.classList.remove('hidden');
        }
    }

    // Update UI with user info
    const userDisplay = document.getElementById('current-user-display');
    if (userDisplay) {
        userDisplay.textContent = `${currentUser.username} (${currentUser.role})`;
    }
}

// Global guard for view switching
function canAccess(viewId) {
    if (!currentUser) return false;
    
    const role = currentUser.role;
    const permissions = currentUser.permissions || [];
    if (role === 'admin' || role === 'manager' || permissions.includes('all')) return true;
    
    // Cashier/Staff allowed views based on database permissions
    return permissions.includes(viewId);
}

// Helper to check if user is restricted in settings
function isManagerRestricted() {
    return currentUser && currentUser.role === 'manager';
}

/**
 * Prompt for an Admin or Manager password to authorize a sensitive action.
 * @param {Function} callback - Function to execute if authorized.
 * @param {String} actionDescription - Text to show in the prompt.
 */
async function requestElevatedAuth(callback, actionDescription = 'perform this action') {
    // 1. Check if current user is already an admin or manager
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || (currentUser.permissions && currentUser.permissions.includes('all')))) {
        callback();
        return;
    }

    if (typeof Swal === 'undefined') {
        const pass = prompt(`Elevation Required: Enter Admin/Manager password to ${actionDescription}:`);
        if (!pass) return;

        // Check hardcoded first
        let user = HARDCODED_USERS.find(u => u.password === pass && (u.role === 'admin' || u.role === 'manager'));
        
        if (!user) {
            user = await db.users.where({ password: pass }).first();
        }

        if (user && (user.role === 'admin' || user.role === 'manager')) {
            callback();
        } else {
            alert('Access Denied: Invalid or unauthorized password.');
        }
        return;
    }

    const { value: password } = await Swal.fire({
        title: 'Authorization Required',
        html: `
            <div class="text-left">
                <p class="text-sm text-gray-500 mb-4 font-medium leading-relaxed">Please enter an <b class="text-indigo-600">Administrator</b> or <b class="text-indigo-600">Manager</b> password to <b>${actionDescription}</b>.</p>
                <div class="relative">
                    <i class="fa-solid fa-shield-keyhole absolute left-3 top-3.5 text-gray-400"></i>
                    <input type="password" id="elevated-pass" class="swal2-input w-full m-0 pl-10 text-sm" placeholder="Enter security password" style="height: 48px; border-radius: 12px; border: 2px solid #eee;">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Authorize',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#6B7280',
        preConfirm: () => {
            const val = document.getElementById('elevated-pass').value;
            if (!val) {
                Swal.showValidationMessage('Password is required');
                return false;
            }
            return val;
        }
    });

    if (password) {
        // Check hardcoded first
        let user = HARDCODED_USERS.find(u => u.password === password && (u.role === 'admin' || u.role === 'manager'));
        
        if (!user) {
            user = await db.users.where({ password: password }).first();
        }

        if (user && (user.role === 'admin' || user.role === 'manager')) {
            callback();
        } else {
            Swal.fire({
                title: 'Access Denied',
                text: 'The password entered is either incorrect or does not have the required management privileges.',
                icon: 'error',
                confirmButtonColor: '#4F46E5'
            });
        }
    }
}

// Expose the initialization promise globally to prevent race conditions in app.js
window.authInitialized = initAuth();

// Session Control: Auto-logout after inactivity (15 minutes default)
let inactivityTimeout;
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

function resetInactivityTimer() {
    if (!currentUser) return; // Only track if logged in
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        if (currentUser) {
            Swal.fire({
                title: 'Session Expired',
                text: 'You have been logged out due to inactivity.',
                icon: 'warning',
                confirmButtonColor: '#4F46E5'
            }).then(() => {
                logout();
            });
        }
    }, INACTIVITY_LIMIT_MS);
}

// Attach activity listeners
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
});
