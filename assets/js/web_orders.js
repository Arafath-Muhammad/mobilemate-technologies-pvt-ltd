// Web Orders and WooCommerce Sync Logic

function getWooAuth(key, secret) {
    return 'Basic ' + btoa(key + ':' + secret);
}

async function loadWebOrders() {

    const container = document.getElementById('web-orders-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-2xl shadow-sky-500/5 border border-gray-100 dark:border-darkBorder flex flex-col h-full overflow-hidden">
            <div class="p-8 lg:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-sky-50/20 dark:bg-sky-900/10 relative">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
                        <i class="fa-solid fa-cloud-arrow-down text-sky-500"></i> Cloud Portal
                    </h2>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] opacity-70">Synchronized WooCommerce orders and web leads</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-sky-500/20">
                        <i class="fa-solid fa-calendar-alt text-sky-500 text-sm ml-2"></i>
                        <input type="date" id="web-orders-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="web-orders-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative group">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors text-sm"></i>
                        <input type="text" id="web-orders-search" class="pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-transparent focus:border-sky-500/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-sky-500/5 text-gray-900 dark:text-white w-full md:w-64 transition-all shadow-sm" placeholder="Web ID or Customer...">
                    </div>
                    <button onclick="syncWebOrders()" class="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-3">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Sync Now</span>
                    </button>
                </div>
            </div>
            <div id="web-orders-sync-progress" class="hidden px-8 py-4 bg-sky-500/10 border-b border-sky-100 dark:border-sky-900/30 text-sky-600 dark:text-sky-400 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <i class="fa-solid fa-circle-notch fa-spin"></i> 
                <span id="sync-status-text">Handshaking with WooCommerce Gateway...</span>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Tracking ID</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Synchronized</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Web Client</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Gateway Status</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-right">Web Valuation</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody id="web-orders-list" class="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;
    
    const refreshWebOrders = () => {
        const query = document.getElementById('web-orders-search').value;
        renderWebOrdersList(query);
    };

    document.getElementById('web-orders-search').addEventListener('input', refreshWebOrders);
    document.getElementById('web-orders-start-date').addEventListener('change', refreshWebOrders);
    document.getElementById('web-orders-end-date').addEventListener('change', refreshWebOrders);
    
    renderWebOrdersList();
}

async function renderWebOrdersList(query = '') {
    const tbody = document.getElementById('web-orders-list');
    if (!tbody) return;

    let sales = await db.sales.where('document_type').equals('web_order').reverse().toArray();

    // Filter by date
    const startDate = document.getElementById('web-orders-start-date')?.value;
    const endDate = document.getElementById('web-orders-end-date')?.value;
    
    if (startDate && endDate) {
        sales = sales.filter(s => {
            if (!s.date) return false;
            const sDate = new Date(s.date);
            if (isNaN(sDate.getTime())) return false;
            const dStr = sDate.getFullYear() + '-' + String(sDate.getMonth() + 1).padStart(2, '0') + '-' + String(sDate.getDate()).padStart(2, '0');
            return dStr >= startDate && dStr <= endDate;
        });
    }

    if (query) {
        const q = query.toLowerCase();
        sales = sales.filter(s =>
            String(s.id).toLowerCase().includes(q) ||
            (s.woo_order_id && String(s.woo_order_id).toLowerCase().includes(q)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(q))
        );
    }

    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500"><i class="fa-solid fa-cloud-arrow-down text-4xl mb-3 block opacity-20"></i> No web orders found.</td></tr>`;
        return;
    }

    let html = '';
    sales.forEach(s => {
        const time = new Date(s.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const docBadge = `<span class="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-xs px-2 py-0.5 rounded-full font-medium uppercase mr-1">WEB ORDER</span>`;
        
        // Woo Status Mapping
        let wooStatus = s.woo_status || 'processing';
        let statusColor = 'amber';
        if (wooStatus === 'completed') statusColor = 'emerald';
        else if (wooStatus === 'cancelled' || wooStatus === 'failed') statusColor = 'red';
        else if (wooStatus === 'on-hold') statusColor = 'orange';

        const statusBadge = `<span class="bg-${statusColor}-100 text-${statusColor}-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">${wooStatus}</span>`;

        // Actions
        let actionBtns = `
            <button onclick="convertToInvoice(${s.id})" class="p-2 text-gray-400 hover:text-emerald-500 transition-colors" title="Convert to POS Invoice">
                <i class="fa-solid fa-file-invoice-dollar"></i>
            </button>
            <button onclick="printInvoice(${s.id}, null, true, true)" class="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="Preview Web Order">
                <i class="fa-solid fa-eye"></i>
            </button>
            <button onclick="editSale(${s.id})" class="p-2 text-gray-400 hover:text-amber-500 transition-colors" title="Edit Web Order">
                <i class="fa-solid fa-file-pen"></i>
            </button>
            <button onclick="printInvoice(${s.id}, null, false, true)" class="p-2 text-gray-400 hover:text-primary transition-colors" title="Print Web Order">
                <i class="fa-solid fa-print"></i>
            </button>
            <button onclick="deleteSale(${s.id})" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete record">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td class="p-4 font-mono text-sm text-gray-900 dark:text-white font-bold">
                    W-${String(s.woo_order_id || s.id).padStart(5, '0')}
                    <br/><span class="text-[9px] text-gray-400 font-normal">Local ID: ${s.id}</span>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${time}</td>
                <td class="p-4 text-sm text-gray-900 dark:text-white font-medium">${s.customer_name || 'Web Customer'}</td>
                <td class="p-4">${docBadge} <br/> <div class="mt-1">${statusBadge}</div></td>
                <td class="p-4 text-sm font-bold text-sky-600 dark:text-sky-400 text-right">Rs. ${parseFloat(s.total || 0).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        ${actionBtns}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Ensure convertToInvoice properly redirects to sales-view for UI update
const originalConvertToInvoice = window.convertToInvoice;
if (originalConvertToInvoice && !window.overridenConvertToInvoice) {
    window.convertToInvoice = async function(id) {
        const sale = await db.sales.get(id);
        if (sale && sale.document_type === 'web_order') {
            if (!confirm("Convert this Web Order to a POS Invoice? This will deduct the items from stock and mark it as a finalized Invoice.")) return;

            try {
                await db.transaction('rw', db.sales, db.products, async () => {
                    // Deduct stock
                    for (let item of sale.items) {
                        const p = await db.products.get(item.product_id);
                        if (p) {
                            await db.products.update(item.product_id, {
                                stock_qty: p.stock_qty - item.qty
                            });
                        }
                    }

                    // Update record
                    await db.sales.update(id, {
                        document_type: 'invoice',
                        payment_type: sale.payment_type || 'bank',
                        woo_status: 'completed'
                    });
                });

                showAlert('Converted', 'Web Order has been converted to an Invoice.', 'success');
                renderWebOrdersList();
                
                // Optionally push status update back to woo
                updateWooOrderStatus(sale.woo_order_id, 'completed');
            } catch (err) {
                showAlert('Error', 'Failed to convert to invoice: ' + err.message, 'error');
            }
        } else {
            // Fallback for regular quotes/sales orders
            originalConvertToInvoice(id);
        }
    };
    window.overridenConvertToInvoice = true;
}


async function syncWebOrders(silent = false) {
    const wooUrl = await db.settings.get('woo_url');
    const wooKey = await db.settings.get('woo_key');
    const wooSecret = await db.settings.get('woo_secret');

    if (!wooUrl || !wooUrl.value || !wooKey || !wooKey.value || !wooSecret || !wooSecret.value) {
        if (!silent) showAlert('Setup Required', 'Please configure your WooCommerce API credentials in Settings or System & Marketing > WooCommerce first.', 'warning');
        return 0;
    }

    const progressEl = document.getElementById('web-orders-sync-progress');
    const statusText = document.getElementById('sync-status-text');
    
    if (!silent) {
        if (progressEl) progressEl.classList.remove('hidden');
        if (statusText) statusText.innerText = 'Connecting to WooCommerce API...';
    }

    console.log("Starting Woo Orders sync...");

    try {
        let baseUrl = wooUrl.value;
        if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
        if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

        // Fetch up to 50 latest orders
        const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=50`, {
            headers: {
                'Authorization': getWooAuth(wooKey.value, wooSecret.value)
            }
        });

        if (!response.ok) {
            const msg = `WooCommerce API Error: ${response.status}`;
            console.error(msg);
            if (typeof showAlert === 'function') showAlert('Sync Failed', msg, 'error');
            throw new Error(msg);
        }

        const orders = await response.json();
        let newOrdersCount = 0;

        if (statusText && !silent) statusText.innerText = 'Processing orders...';

        for (let i = 0; i < orders.length; i++) {
            const wooOrder = orders[i];
            
            // Check if order already exists
            const existing = await db.sales.filter(s => s.woo_order_id === wooOrder.id).first();
            
            if (!existing) {
                // Prepare items list and map to local products
                let localItems = [];
                for (let item of wooOrder.line_items) {
                    // Try to map to local product by Woo ID first (Primary), then SKU or name
                    let localProd = null;
                    if (item.product_id) {
                        localProd = await db.products.where('woo_id').equals(item.product_id).first();
                    }
                    if (!localProd && item.sku) {
                        localProd = await db.products.where('sku').equals(item.sku).first();
                    }
                    if (!localProd) {
                        localProd = await db.products.filter(p => p.name.includes(item.name)).first();
                    }
                    
                    localItems.push({
                        product_id: localProd ? localProd.id : null,
                        name: item.name,
                        qty: item.quantity,
                        price: item.price,
                        total: item.total,
                        warranty: localProd ? localProd.warranty : 'N/A'
                    });
                }
                
                // Construct Web Order object
                const webOrder = {
                    date: new Date(wooOrder.date_created).toISOString(),
                    customer_name: wooOrder.billing.first_name + ' ' + wooOrder.billing.last_name,
                    customer_id: null, // Keep null or try to map
                    type: 'retail', // default
                    document_type: 'web_order',
                    woo_order_id: wooOrder.id,
                    woo_status: wooOrder.status,
                    payment_type: wooOrder.payment_method_title || 'web',
                    items: localItems,
                    subtotal: parseFloat(wooOrder.total) - parseFloat(wooOrder.total_tax),
                    discount: parseFloat(wooOrder.discount_total),
                    vat_amount: parseFloat(wooOrder.total_tax),
                    total: parseFloat(wooOrder.total),
                    created_by: 'system',
                    notes: wooOrder.customer_note
                };

                await db.sales.add(webOrder);
                newOrdersCount++;
            } else {
                // Optionally update status if changed
                if (existing.woo_status !== wooOrder.status && existing.document_type === 'web_order') {
                    await db.sales.update(existing.id, { woo_status: wooOrder.status });
                }
            }
        }

        if (progressEl) progressEl.classList.add('hidden');
        if (!silent) {
            showAlert('Sync Complete', `Synchronized successfully. Retrieved ${newOrdersCount} new orders.`, 'success');
        }
        
        if (newOrdersCount > 0) {
            // Play sound for new orders
            const audio = document.getElementById('web-order-sound');
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.warn('Audio play failed:', e));
            }
            
            if (silent) {
                showAlert('New Web Order!', `You have received ${newOrdersCount} new order(s) from WooCommerce.`, 'info');
            }
        }
        
        renderWebOrdersList();
        return newOrdersCount;

    } catch (err) {
        if (progressEl) progressEl.classList.add('hidden');
        console.error(err);
        if (!silent) {
            showAlert('Sync Failed', 'Failed to fetch orders from WooCommerce.', 'error');
        }
        return 0;
    }
}

function initWebOrderPolling() {
    console.log("Initializing Web Order Background Polling...");
    // Check every 2 minutes for new orders
    setInterval(() => {
        syncWebOrders(true);
    }, 120000); 
    
    // Initial silent sync after a short delay
    setTimeout(() => syncWebOrders(true), 15000);
}

async function updateWooOrderStatus(wooOrderId, status) {
    if (!wooOrderId) return;
    const wooUrl = await db.settings.get('woo_url');
    const wooKey = await db.settings.get('woo_key');
    const wooSecret = await db.settings.get('woo_secret');
    if (!wooUrl || !wooUrl.value || !wooKey || !wooKey.value || !wooSecret || !wooSecret.value) return;
    
    let baseUrl = wooUrl.value;
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    try {
        await fetch(`${baseUrl}/wp-json/wc/v3/orders/${wooOrderId}`, {
            method: 'PUT',
            headers: {
                'Authorization': getWooAuth(wooKey.value, wooSecret.value),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
    } catch(e) {
        console.error("Could not update status back to WooCommerce", e);
    }
}


