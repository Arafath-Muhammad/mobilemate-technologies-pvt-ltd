/**
 * MobileMate POS - Mobile Runtime & Storage Resilience Layer
 * Ensures seamless operation on Android / Mobile Chrome, offline storage,
 * and graceful fallback for file:// protocol restrictions.
 */

// 1. SAFE STORAGE POLYFILL (Ensures localStorage / sessionStorage never throw on file:// or restricted origins)
(function () {
    function createSafeStorage(type) {
        var store = {};
        return {
            getItem: function (key) {
                return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
            },
            setItem: function (key, value) {
                store[key] = String(value);
            },
            removeItem: function (key) {
                delete store[key];
            },
            clear: function () {
                store = {};
            },
            key: function (index) {
                var keys = Object.keys(store);
                return keys[index] || null;
            },
            get length() {
                return Object.keys(store).length;
            }
        };
    }

    try {
        var testKey = '__mm_storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
    } catch (e) {
        console.warn('[MobileMate] localStorage is restricted (file:// or private mode). Applying memory storage fallback.', e);
        try {
            var memStorage = createSafeStorage('localStorage');
            Object.defineProperty(window, 'localStorage', {
                value: memStorage,
                configurable: true,
                writable: true
            });
        } catch (err) {
            console.error('[MobileMate] Could not polyfill localStorage:', err);
        }
    }

    try {
        var testSessionKey = '__mm_session_test__';
        window.sessionStorage.setItem(testSessionKey, testSessionKey);
        window.sessionStorage.removeItem(testSessionKey);
    } catch (e) {
        console.warn('[MobileMate] sessionStorage is restricted. Applying memory storage fallback.', e);
        try {
            var memSession = createSafeStorage('sessionStorage');
            Object.defineProperty(window, 'sessionStorage', {
                value: memSession,
                configurable: true,
                writable: true
            });
        } catch (err) {
            console.error('[MobileMate] Could not polyfill sessionStorage:', err);
        }
    }
})();

// 2. RUNTIME DETECTION (Storage Resilience)
(function () {
    const isFileProtocol = window.location.protocol === 'file:';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge|OPR/i.test(navigator.userAgent);

    window.MobileMateRuntime = {
        isFileProtocol: isFileProtocol,
        isMobile: isMobile,
        isChrome: isChrome,
        isStorageBlocked: false
    };

    // Stubs for backward compatibility
    window.dismissMobileGuidance = function () {};
    window.showMobileGuidance = function () {};
})();
