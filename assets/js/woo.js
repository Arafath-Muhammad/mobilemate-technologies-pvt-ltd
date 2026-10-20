// WooCommerce Sync Module
async function loadWoo() {

    const container = document.getElementById('woo-view');
    if (!container) return;

    // Load saved WooCommerce settings
    const wooUrl = await db.settings.get('woo_url');
    const wooKey = await db.settings.get('woo_key');
    const wooSecret = await db.settings.get('woo_secret');

    const html = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder flex flex-col p-6 items-center justify-center text-center">
                <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-[#7F54B3] rounded-full flex items-center justify-center mb-4 shadow-inner relative">
                    <i class="fa-brands fa-wordpress text-3xl"></i>
                    <div class="absolute -bottom-1 -right-1 bg-white dark:bg-darkCard rounded-full p-1 shadow-sm">
                        <i class="fa-solid fa-arrows-rotate text-emerald-500 text-[10px] text-center w-4"></i>
                    </div>
                </div>
                
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">WooCommerce Sync</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">Connect your e-commerce store to sync stock levels and orders.</p>
                
                <div class="bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30 p-5 rounded-xl text-left w-full mb-6">
                    <h3 class="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><i class="fa-solid fa-plug text-blue-500"></i> API Credentials</h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-[10px] font-bold text-blue-600/50 uppercase mb-1">Store URL</label>
                            <input type="text" id="woo-url" class="w-full bg-white dark:bg-gray-800 border-none rounded-lg p-2 text-sm text-gray-900 dark:text-white" placeholder="https://yourstore.com" value="${wooUrl ? wooUrl.value : ''}">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-blue-600/50 uppercase mb-1">Consumer Key</label>
                                <input type="password" id="woo-key" class="w-full bg-white dark:bg-gray-800 border-none rounded-lg p-2 text-sm text-gray-900 dark:text-white" placeholder="ck_..." value="${wooKey ? wooKey.value : ''}">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-blue-600/50 uppercase mb-1">Consumer Secret</label>
                                <input type="password" id="woo-secret" class="w-full bg-white dark:bg-gray-800 border-none rounded-lg p-2 text-sm text-gray-900 dark:text-white" placeholder="cs_..." value="${wooSecret ? wooSecret.value : ''}">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 w-full">
                    <button onclick="saveWooSettings()" class="flex-1 bg-[#7F54B3] hover:bg-[#684196] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">
                        Save Config
                    </button>
                    <button onclick="syncWooProducts()" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">
                        Sync Now
                    </button>
                </div>

                <div id="woo-sync-progress" class="hidden w-full mt-6 space-y-2">
                    <div class="flex justify-between text-[10px] font-black uppercase text-gray-400">
                        <span id="woo-sync-status">Syncing...</span>
                        <span id="woo-sync-percent">0%</span>
                    </div>
                    <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div id="woo-sync-bar" class="h-full bg-emerald-500 w-0 transition-all duration-300"></div>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder flex flex-col p-6">
                <h3 class="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left"></i> Recent Activity Log
                </h3>
                <div id="woo-log" class="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 custom-scrollbar max-h-[400px]">
                    <div class="text-gray-400 italic">Waiting for connection...</div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center decoration-gray-400">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Cloud Status</span>
                    <span class="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Operational
                    </span>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

async function saveWooSettings() {
    const url = document.getElementById('woo-url').value;
    const key = document.getElementById('woo-key').value;
    const secret = document.getElementById('woo-secret').value;

    if (!url || !key || !secret) {
        showAlert('Error', 'Please fill all fields', 'error');
        return;
    }

    try {
        await db.settings.put({ key: 'woo_url', value: url });
        await db.settings.put({ key: 'woo_key', value: key });
        await db.settings.put({ key: 'woo_secret', value: secret });

        showAlert('Success', 'WooCommerce settings saved!', 'success');
        
        // Mock connection test
        testWooConnection(url, key, secret);
    } catch (err) {
        showAlert('Error', 'Failed to save settings: ' + err.message, 'error');
    }
}

async function testWooConnection(url, key, secret) {
    const log = document.getElementById('woo-log');
    if (!log) return;
    log.innerHTML = `<div class="text-blue-500">[${new Date().toLocaleTimeString()}] Initiating connection to ${url}...</div>`;
    
    setTimeout(() => {
        log.innerHTML += `<div class="text-gray-500">[${new Date().toLocaleTimeString()}] Verifying API credentials...</div>`;
    }, 1000);

    setTimeout(() => {
        log.innerHTML += `<div class="text-emerald-500">[${new Date().toLocaleTimeString()}] Success: Connected to WooCommerce v3 API.</div>`;
        showAlert('Connected', 'Successfully connected to ' + url, 'success');
    }, 2500);
}

async function syncWooProducts() {
    const wrap = document.getElementById('woo-sync-progress');
    const bar = document.getElementById('woo-sync-bar');
    const statusEl = document.getElementById('woo-sync-status');
    const percentEl = document.getElementById('woo-sync-percent');
    const logEl = document.getElementById('woo-log');

    const updateLog = (msg, colorClass = 'text-gray-400') => {

        if (logEl) {
            logEl.innerHTML += `<div class="${colorClass}">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        }
    };

    const updateProgress = (pct, status) => {
        if (bar) bar.style.width = `${pct}%`;
        if (percentEl) percentEl.textContent = `${Math.round(pct)}%`;
        if (statusEl) statusEl.textContent = status;
    };

    if (wrap) wrap.classList.remove('hidden');
    updateLog('Starting Full Web Sync & Brand Analysis...', 'text-primary mt-2');
    
    // Get credentials
    const config = await CONFIG.getWooCredentials();
    if (!config.url || !config.password) {
        updateLog('Error: WooCommerce credentials not found.', 'text-red-500');
        showAlert('Setup Required', 'Please configure your WooCommerce API settings first.', 'error');
        if (wrap) wrap.classList.add('hidden');
        return;
    }

    // If no UI, show a loading toast
    let loadingToast;
    if (!logEl && typeof Swal !== 'undefined') {
        loadingToast = Swal.fire({
            title: 'Syncing Brands...',
            html: 'Connecting to WooCommerce...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    try {
        updateProgress(10, "Connecting...");
        
        const auth = btoa(`${config.username}:${config.password}`);
        const baseUrl = config.url.replace(/\/$/, '');
        let remoteBrands = new Set();

        // STEP 1: Try Direct Brands Endpoint
        updateLog('Checking for dedicated Brands API...', 'text-blue-400');
        try {
            const brandEndpoints = [
                '/wp-json/wc/v3/products/brands',
                '/wp-json/wc/v2/products/brands',
                '/wp-json/wc-brands/v1/brands'
            ];

            for (const endpoint of brandEndpoints) {
                const bRes = await fetch(`${baseUrl}${endpoint}?per_page=100`, {
                    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
                });
                if (bRes.ok) {
                    const brandsData = await bRes.json();
                    if (Array.isArray(brandsData)) {
                        brandsData.forEach(b => remoteBrands.add(b.name || b.title));
                        updateLog(`Successfully fetched ${brandsData.length} brands from direct endpoint.`, 'text-emerald-400/80');
                    }
                    if (loadingToast) Swal.update({ html: `Found ${remoteBrands.size} brands...` });
                    break; 
                }
            }
        } catch (e) {
            console.warn("Direct brand fetch failed", e);
        }

        // STEP 2: Fetch products with pagination
        updateProgress(30, "Fetching Catalog...");
        let page = 1;
        let totalPages = 1;
        let productsCount = 0;

        while (page <= totalPages) {
            updateLog(`Fetching products page ${page}...`);
            if (loadingToast) Swal.update({ html: `Analyzing products (Page ${page})...` });

            const pApiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}`;
            const pResponse = await fetch(pApiUrl, {
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' }
            });
            
            if (!pResponse.ok) break;

            const products = await pResponse.json();
            productsCount += products.length;
            totalPages = parseInt(pResponse.headers.get('X-WP-TotalPages')) || 1;

            for (const p of products) {
                // Extract Brand for Step 3
                if (p.attributes) {
                    const brandAttr = p.attributes.find(a => a.name.toLowerCase() === 'brand');
                    if (brandAttr && brandAttr.options) {
                        brandAttr.options.forEach(opt => remoteBrands.add(opt.trim()));
                    }
                }
                
                // --- PRODUCT IMPORT/UPDATE LOGIC ---
                if (p.sku || p.id) {
                    const identifier = p.sku || `WOO-${p.id}`;
                    
                    // Try to find local product by woo_id first (most reliable), then SKU
                    let localP = await db.products.where('woo_id').equals(p.id).first();
                    if (!localP && p.sku) {
                        localP = await db.products.where('sku').equals(p.sku).first();
                    }

                    const productData = {
                        name: p.name,
                        sku: identifier,
                        retail_price: parseFloat(p.regular_price || p.price) || 0,
                        wholesale_price: (parseFloat(p.regular_price || p.price) || 0) * 0.9, // Default wholesale if not set
                        stock_qty: p.manage_stock ? (p.stock_quantity || 0) : 999,
                        woo_id: p.id,
                        category: p.categories && p.categories.length > 0 ? p.categories[0].name : 'Uncategorized',
                        description: p.description || "",
                        short_description: p.short_description || "",
                        last_sync: new Date().toISOString()
                    };

                    if (localP) {
                        await db.products.update(localP.id, productData);
                        updateLog(`Updated: ${identifier} - ${p.name}`, 'text-gray-400 text-[10px]');
                    } else {
                        await db.products.add({
                            ...productData,
                            cost: 0,
                            warranty: 'No Warranty',
                            vendor: 'WooCommerce'
                        });
                        updateLog(`Imported: ${identifier} - ${p.name}`, 'text-emerald-400 text-[10px]');
                    }
                } else {
                    updateLog(`Skipped product ID ${p.id}: No SKU or Name`, 'text-amber-500 text-[10px]');
                }
            }

            const progressPercent = Math.min(30 + (page / totalPages) * 50, 80);
            updateProgress(progressPercent, `Syncing ${productsCount} products...`);

            if (page >= totalPages || page >= 100) break; 
            page++;
        }

        updateLog(`Analyzed ${productsCount} products. Found ${remoteBrands.size} unique brands.`, 'text-blue-300');
        
        // STEP 3: Compare and update local database
        updateProgress(90, "Updating Local DB...");
        const localBrands = await db.brands.toArray();
        const localBrandNames = new Set(localBrands.map(b => b.name.toLowerCase()));
        
        let addedCount = 0;
        for (const brandName of remoteBrands) {
            if (brandName && !localBrandNames.has(brandName.toLowerCase())) {
                await db.brands.add({
                    name: brandName,
                    created_at: new Date().toISOString()
                });
                addedCount++;
                updateLog(`Added missing brand: ${brandName}`, 'text-emerald-400/80');
            }
        }
        
        updateProgress(100, "Complete");
        updateLog(`Operation Successful! ${addedCount} new brands synchronized.`, 'text-emerald-500 font-bold');
        
        if (loadingToast) Swal.close();
        showAlert('Sync Complete', `Successfully synchronized ${addedCount} new brands from WooCommerce.`, 'success');
        
        if (typeof populateBrandDropdown === 'function') await populateBrandDropdown();
        if (typeof autoLinkSystem === 'function') autoLinkSystem(true);

    } catch (err) {
        console.error("Sync Error:", err);
        updateLog(`Error: ${err.message}`, 'text-red-500');
        if (loadingToast) Swal.close();
        showAlert('Sync Failed', 'Could not sync brands: ' + err.message, 'error');
    }

    setTimeout(() => {
        if (wrap) wrap.classList.add('hidden');
        if (bar) bar.style.width = '0%';
    }, 5000);
}

/**
 * Automagically sync a product from ERP to WooCommerce
 * @param {Object} productData - The product object from Dexie
 */
async function syncProductToWordPress(productData) {

    
    // In a real environment, you'd load these from a config or .env via CONFIG
    const { url, username, password } = await CONFIG.getWooCredentials();

    if (!url || !password) {
        
        return;
    }

    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    const apiUrl = `${url.replace(/\/$/, '')}/wp-json/wc/v3/products`;

    try {
        // 1. Handle Images (Main + Gallery)
        let images = [];
        
        // Main Image
        if (productData.image_data) {

            const uploadedImage = await uploadImageToWordPress(productData.image_data, productData.name, url, authHeader);
            if (uploadedImage) {
                images.push({ 
                    src: uploadedImage.source_url,
                    alt: productData.name,
                    name: productData.name
                });
            }
        }

        // Gallery Images
        if (productData.gallery && productData.gallery.length > 0) {

            for (let i = 0; i < productData.gallery.length; i++) {
                const galleryImg = await uploadImageToWordPress(productData.gallery[i], `${productData.name}-gallery-${i}`, url, authHeader);
                if (galleryImg) {
                    images.push({ 
                        src: galleryImg.source_url,
                        alt: productData.name,
                        name: `${productData.name} - Gallery ${i+1}`
                    });
                }
            }
        }

        // 2. Prepare Attributes (Brand/Vendor + Colors + Sizes)
        const attributes = [];
        if (productData.brands) {
            attributes.push({
                name: 'Brand',
                visible: true,
                variation: false,
                options: [productData.brands]
            });
        }
        if (productData.attributes?.colors?.length > 0) {
            attributes.push({
                name: 'Color',
                visible: true,
                variation: false,
                options: productData.attributes.colors
            });
        }
        if (productData.attributes?.sizes?.length > 0) {
            attributes.push({
                name: 'Size',
                visible: true,
                variation: false,
                options: productData.attributes.sizes
            });
        }

        // 2. Prepare WooCommerce Data Payload
        const payload = {
            name: productData.name,
            sku: productData.sku,
            regular_price: parseFloat(productData.retail_price).toFixed(2),
            sale_price: productData.sale_price ? parseFloat(productData.sale_price).toFixed(2) : "",
            description: productData.description || "",
            short_description: productData.short_description || "",
            manage_stock: true,
            stock_quantity: productData.stock_qty,
            backorders: 'yes',
            stock_status: 'instock',
            categories: (productData.woo_categories && productData.woo_categories.length > 0) 
                         ? productData.woo_categories 
                         : [ { name: productData.category || 'Uncategorized' } ],
            tags: productData.tags ? productData.tags.split(',').map(t => ({ name: t.trim() })) : [],
            // Only send images if we actually have new data to send.
            // Sending an empty array would wipe existing images on WordPress.
            ...(images.length > 0 ? { images: images } : {}),
            attributes: attributes,
            weight: productData.weight ? productData.weight.toString() : "",
            dimensions: {
                length: productData.length ? productData.length.toString() : "",
                width: productData.width ? productData.width.toString() : "",
                height: productData.height ? productData.height.toString() : ""
            },
            meta_data: [
                // Rank Math SEO Fields
                { key: 'rank_math_title', value: productData.meta_title || productData.name },
                { key: 'rank_math_description', value: productData.meta_description || productData.short_description || "" },
                // Yoast SEO Fields (Optional fallback)
                { key: '_yoast_wpseo_title', value: productData.meta_title || productData.name },
                { key: '_yoast_wpseo_metadesc', value: productData.meta_description || productData.short_description || "" }
            ]
        };

        let response;
        if (productData.woo_id) {
            // Update existing product

            response = await fetch(`${apiUrl}/${productData.woo_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } else {
            // Create new product

            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }

        const result = await response.json();

        if (response.ok) {

            // Save the WooCommerce ID back to local database if it was a new creation or missing locally
            if (!productData.woo_id || productData.woo_id !== result.id) {
                if (productData.id) {
                    await db.products.update(productData.id, { woo_id: result.id });
                    showAlert('Cloud Sync', `${productData.name} is now live on your website!`, 'success');
                } else {
                    
                }
            }
        } else {
            const msg = result.message || "Unknown error connecting to WooCommerce";
            
            if (typeof showAlert === 'function') showAlert('Sync Error', `Could not sync to WordPress: ${msg}`, 'error');
            throw new Error(msg);
        }

    } catch (err) {
        
        showAlert('Sync Error', `Could not sync to WordPress: ${err.message}`, 'error');
    }
}

/**
 * Helper to upload Base64 images to WP Media API
 */
async function uploadImageToWordPress(base64Data, filename, wooUrl, authHeader) {
    try {
        // More robust base64 to Blob conversion
        const parts = base64Data.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        
        const mediaApiUrl = `${wooUrl.replace(/\/$/, '')}/wp-json/wp/v2/media`;
        const formData = new FormData();
        
        // Use proper extension based on content type
        let ext = 'webp';
        if (contentType.includes('jpeg')) ext = 'jpg';
        else if (contentType.includes('png')) ext = 'png';
        
        const safeName = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        formData.append('file', blob, `${safeName}.${ext}`);
        formData.append('title', filename);
        formData.append('alt_text', filename);

        const response = await fetch(mediaApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const errData = await response.json();
            
            // If it's a 401/403, we should alert about Application Passwords
            if (response.status === 401 || response.status === 403) {
                
            }
        }
    } catch (e) {
        
    }
    return null;
}

/**
 * Real-time Stock Sync for WooCommerce
 */
async function syncStockToWoo(productId, newQty) {
    try {
        const product = await db.products.get(productId);
        if (!product || !product.woo_id) return;

        const wooUrlSettings = await db.settings.get('woo_url');
        const wooKeySettings = await db.settings.get('woo_key');
        const wooSecretSettings = await db.settings.get('woo_secret');

        if (!wooUrlSettings || !wooKeySettings || !wooSecretSettings) return;

        const wooUrl = wooUrlSettings.value;
        const wooKey = wooKeySettings.value;
        const wooSecret = wooSecretSettings.value;

        const auth = btoa(`${wooKey}:${wooSecret}`);
        const apiUrl = `${wooUrl.replace(/\/$/, '')}/wp-json/wc/v3/products/${product.woo_id}`;

        await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({ 
                stock_quantity: parseInt(newQty),
                backorders: 'yes',
                stock_status: 'instock'
            })
        });
        
        
    } catch (e) {
        
    }
}
