// Sales Document Creation Modal (Quotes & Sales Orders)

let sdCart = [];
let sdType = 'quote';
let sdEditingId = null;
let sdDiscount = 0;
let sdCustomerCategory = 'Retail';
let sdCustomer = null;

function injectSalesDocModal() {
    if (document.getElementById('sd-modal')) return;
    const html = `
    <div id="sd-modal" class="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-md hidden animate-fade-in transition-opacity duration-300">
        <div class="bg-white dark:bg-darkCard w-full h-full flex flex-col overflow-hidden transform scale-95 transition-transform duration-300" id="sd-modal-content">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-darkBorder flex items-center justify-between bg-white dark:bg-darkCard z-20 sticky top-0 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30" id="sd-header-icon">
                        <i class="fa-solid fa-file-invoice text-xl" id="sd-icon-i"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase" id="sd-modal-title">Sales Document</h3>
                        <div class="flex items-center gap-3 mt-0.5">
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded tracking-widest uppercase" id="sd-header-badge">NEW</span>
                            <div class="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>
                            <div class="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                                <i class="fa-solid fa-calendar-day"></i>
                                <span id="sd-header-date-display">Today</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button onclick="closeSalesDocModal()" class="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-widest">Discard</button>
                    <button onclick="saveSalesDoc()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2">
                        <i class="fa-solid fa-check-circle"></i>
                        <span>Save Document</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-hidden flex flex-col lg:flex-row">
                <!-- Details & Cart -->
                <div class="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col space-y-6">
                    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Entity</label>
                            <div class="flex gap-2">
                                <button onclick="promptCustomer(setSdCustomer)" class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-indigo-500/30 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none text-left flex items-center justify-between group">
                                    <span id="sd-customer-name-display">Walk-in Customer / Empty</span>
                                    <i class="fa-solid fa-user-tag text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></i>
                                </button>
                                <button onclick="promptCustomer(setSdCustomer); setTimeout(() => toggleCustomerForm(), 100)" class="w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm" title="Quick Add Customer">
                                    <i class="fa-solid fa-user-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Type</label>
                            <select id="sd-type-select" disabled class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border-2 border-transparent rounded-xl text-gray-600 dark:text-gray-400 font-bold transition-all outline-none cursor-not-allowed">
                                <option value="quote">Sales Quotation</option>
                                <option value="sales_order">Sales Order (Backorder)</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1" id="sd-validity-label">Validity / Due Terms</label>
                            <select id="sd-validity" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none">
                                <option value="1">1 Day</option>
                                <option value="2">2 Days</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="60">60 Days</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment</label>
                            <select id="sd-payment-terms" onchange="document.getElementById('sd-credit-period-wrap').style.display = this.value === 'credit' ? 'block' : 'none'" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none">
                                <option value="cash">Cash Payment</option>
                                <option value="card">Card Payment</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="cheque">Cheque Payment</option>
                                <option value="koko">Koko Pay</option>
                                <option value="mintpay">Mintpay</option>
                                <option value="payzy">Payzy</option>
                                <option value="cod">Cash on Delivery</option>
                                <option value="credit">Credit Payment</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Lead Time</label>
                            <select id="sd-delivery-lead-time" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none">
                                <option value="">Not Specified</option>
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="5">5 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div class="space-y-1 animate-fade-in" id="sd-credit-period-wrap" style="display:none;">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-indigo-600">Credit Days</label>
                            <select id="sd-credit-period" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-indigo-500/30 focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none">
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="21">21 Days</option>
                                <option value="30">30 Days</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                            <input type="date" id="sd-date" onchange="document.getElementById('sd-header-date-display').innerText = this.value" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tracking Number</label>
                            <input type="text" id="sd-tracking-number" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white font-bold transition-all outline-none" placeholder="Tracking #">
                        </div>
                    </div>

                    <div class="flex-1 min-h-[300px] flex flex-col">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">Line Items</h4>
                            <button onclick="sdCart = []; renderSdCart();" class="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"><i class="fa-solid fa-trash-can mr-1"></i> Clear</button>
                        </div>
                        <div class="flex-1 bg-white dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col">
                            <div class="bg-gray-50/80 dark:bg-gray-800 px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center shadow-sm">
                                <span class="w-8">#</span>
                                <span class="flex-1">Product Description</span>
                                <span class="w-32 text-center">Warranty</span>
                                <span class="w-28 text-center">Unit Price</span>
                                <span class="w-24 text-center">Quantity</span>
                                <span class="w-28 text-right">Subtotal</span>
                                <span class="w-10"></span>
                            </div>
                            <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800" id="sd-items-list">
                            </div>
                            <div class="p-6 bg-indigo-600 dark:bg-indigo-900/40 flex justify-between items-center text-white shrink-0 mt-auto">
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest opacity-80" id="sd-total-lbl">Total Valuation</p>
                                    <div class="flex items-center gap-3">
                                        <p class="text-2xl font-black italic tracking-tighter" id="sd-total-val">Rs. 0</p>
                                        <div id="sd-discount-display-wrap" class="hidden flex flex-col">
                                            <span class="text-[8px] font-black uppercase tracking-widest text-indigo-200">Before Disc: <span id="sd-sub-val">Rs. 0</span></span>
                                            <span class="text-[8px] font-black uppercase tracking-widest text-red-300">Discount: <span id="sd-discount-val">Rs. 0</span></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-4 items-center">
                                    <button onclick="promptSalesDocDiscount()" class="text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                                        <i class="fa-solid fa-tag"></i> Apply Discount
                                    </button>
                                    <button onclick="saveSalesDoc()" class="bg-white text-indigo-600 hover:bg-gray-100 px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl transition-all transform hover:scale-105">
                                        Save Document
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Product Search Sidebar -->
                <div class="w-full lg:w-96 bg-gray-50 dark:bg-gray-800/40 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Search</span>
                    </div>
                    <div class="p-4 flex-1 flex flex-col overflow-hidden">
                        <div class="relative mb-4 shrink-0 flex gap-2">
                            <div class="relative flex-1">
                                <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400"></i>
                                <input type="text" id="sd-prod-search" class="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/30 rounded-xl text-sm transition-all outline-none" placeholder="Product name or SKU...">
                            </div>
                            <button onclick="promptCustomSdItem()" class="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 shrink-0" title="Add Manual Item">
                                <i class="fa-solid fa-plus-circle text-lg"></i>
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2" id="sd-prod-results">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('sd-prod-search').addEventListener('input', async (e) => {
        const q = e.target.value.trim().toLowerCase();
        const resEl = document.getElementById('sd-prod-results');
        if (q.length < 2) { resEl.innerHTML = ''; return; }

        const prods = await db.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.serial_list && p.serial_list.some(s => s.toLowerCase().includes(q)))).limit(15).toArray();
        let htmlStr = '';
        prods.forEach(p => {
            htmlStr += `
            <div class="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-500 cursor-pointer group transition-all" onclick="addToSalesDoc(${p.id})">
                <p class="text-xs font-black dark:text-white uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">${p.name}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-[9px] font-mono text-gray-500">${p.sku} | Stock: ${p.stock_qty}</span>
                    <span class="text-xs font-bold text-indigo-600">Rs. ${parseFloat(p.retail_price).toLocaleString()}</span>
                </div>
            </div>`;
        });
        if (prods.length === 0) htmlStr = '<div class="text-center text-xs text-gray-400 p-4">No specific product found</div>';
        resEl.innerHTML = htmlStr;
    });
}

async function setSdCustomer(cust) {
    sdCustomer = cust;
    const display = document.getElementById('sd-customer-name-display');
    if (display) {
        display.innerText = cust ? `${cust.name} ${cust.company ? '(' + cust.company + ')' : ''}` : 'Walk-in Customer / Empty';
    }

    // Also update the static display in index.html if it exists
    const staticDisplay = document.getElementById('sales-doc-customer-name');
    if (staticDisplay) {
        staticDisplay.innerText = cust ? `${cust.name}` : 'Walk-in Customer';
    }

    if (cust) {
        sdCustomerCategory = cust.category || 'Retail';
        if (sdCustomerCategory === 'Wholesale') {
            for (let item of sdCart) {
                if (typeof item.id !== 'string' || !item.id.startsWith('custom-')) {
                    const p = await db.products.get(item.id);
                    if (p) item.cart_price = p.wholesale_price;
                }
            }
            showAlert('Wholesale Mode', 'Customer is in Wholesale category. Wholesale prices applied.', 'info');
        } else {
            // Reset to Retail if switched back
            for (let item of sdCart) {
                if (typeof item.id !== 'string' || !item.id.startsWith('custom-')) {
                    const p = await db.products.get(item.id);
                    if (p) item.cart_price = p.retail_price;
                }
            }
        }
    } else {
        sdCustomerCategory = 'Retail';
        // Reset to Retail for walk-in
        for (let item of sdCart) {
            if (typeof item.id !== 'string' || !item.id.startsWith('custom-')) {
                const p = await db.products.get(item.id);
                if (p) item.cart_price = p.retail_price;
            }
        }
    }
    await refreshSdCartHistory();
    renderSdCart();
}

/**
 * Bridge function for static buttons in index.html
 */
function promptSalesDocCustomer() {
    if (typeof promptCustomer === 'function') {
        promptCustomer(setSdCustomer);
    } else {
        console.error("promptCustomer function not found in pos.js");
    }
}

async function openSalesDocModal(type, editId = null) {
    injectSalesDocModal();
    sdCustomer = null;
    if (document.getElementById('sd-customer-name-display')) {
        document.getElementById('sd-customer-name-display').innerText = 'Walk-in Customer / Empty';
    }

    sdType = type;
    sdEditingId = editId;
    sdCart = [];
    sdDiscount = 0;
    document.getElementById('sd-prod-search').value = '';
    document.getElementById('sd-prod-results').innerHTML = '';

    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    document.getElementById('sd-date').value = today;
    document.getElementById('sd-header-date-display').innerText = today;

    document.getElementById('sd-type-select').value = type;

    // Set headers
    const title = type === 'quote' ? 'Sales Quotation' : 'Sales Order (Backorder)';
    const icon = type === 'quote' ? 'fa-file-lines' : 'fa-file-signature';
    const clr = type === 'quote' ? 'indigo-600' : 'purple-600';

    document.getElementById('sd-modal-title').innerText = title;
    document.getElementById('sd-icon-i').className = `fa-solid ${icon} text-xl`;

    // Adjust colors
    const hdIcon = document.getElementById('sd-header-icon');
    hdIcon.className = `w-12 h-12 rounded-2xl bg-${clr} text-white flex items-center justify-center shadow-lg shadow-${clr}/30`;

    const hdBadge = document.getElementById('sd-header-badge');
    hdBadge.className = `text-[10px] font-bold text-${clr} bg-${clr} dark:bg-${clr}/40 px-2 py-0.5 rounded tracking-widest uppercase bg-opacity-10`;

    if (editId) {
        hdBadge.innerText = 'EDIT ' + String(editId).padStart(5, '0');
        const doc = await db.sales.get(editId);
        if (doc) {
            sdCart = doc.items.map((item, index) => ({
                id: item.product_id || ('custom-' + Date.now() + '-' + index),
                name: item.name,
                cart_qty: item.qty,
                cart_price: item.price,
                retail_price: item.price,
                warranty: item.warranty || 'No Warranty',
                serial: item.serial || '',
                description: item.description || '',
                is_custom: !item.product_id
            }));
            sdDiscount = doc.discount || 0;
            if (doc.customer_id) {
                const customer = await db.customers.get(parseInt(doc.customer_id));
                if (customer) await setSdCustomer(customer);
            }
            if (doc.validity) document.getElementById('sd-validity').value = doc.validity;
            if (document.getElementById('sd-payment-terms')) {
                document.getElementById('sd-payment-terms').value = doc.payment_terms || doc.payment_type || 'cash';
                if (document.getElementById('sd-credit-period-wrap')) document.getElementById('sd-credit-period-wrap').style.display = (document.getElementById('sd-payment-terms').value === 'credit') ? 'block' : 'none';
            }
            if (doc.credit_period && document.getElementById('sd-credit-period')) document.getElementById('sd-credit-period').value = doc.credit_period;
            if (doc.delivery_lead_time && document.getElementById('sd-delivery-lead-time')) document.getElementById('sd-delivery-lead-time').value = doc.delivery_lead_time;
            if (doc.date) {
                try {
                    const dObj = new Date(doc.date);
                    if (!isNaN(dObj.getTime())) {
                        const dStr = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
                        document.getElementById('sd-date').value = dStr;
                        document.getElementById('sd-header-date-display').innerText = dStr;
                    }
                } catch (e) {
                    console.error("Date parsing error", e);
                }
            }
            if (document.getElementById('sd-tracking-number')) document.getElementById('sd-tracking-number').value = doc.tracking_number || '';
        }
    } else {
        hdBadge.innerText = 'NEW';
        sdCustomer = null;
        if (document.getElementById('sd-customer-name-display')) {
            document.getElementById('sd-customer-name-display').innerText = 'Walk-in Customer / Empty';
        }
        document.getElementById('sd-validity').value = '7';
        if (document.getElementById('sd-payment-terms')) {
            document.getElementById('sd-payment-terms').value = 'cash';
            if (document.getElementById('sd-credit-period-wrap')) document.getElementById('sd-credit-period-wrap').style.display = 'none';
        }
        if (document.getElementById('sd-credit-period')) document.getElementById('sd-credit-period').value = '7';
        if (document.getElementById('sd-tracking-number')) document.getElementById('sd-tracking-number').value = '';
    }

    await refreshSdCartHistory();
    renderSdCart();

    const modal = document.getElementById('sd-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        document.getElementById('sd-modal-content').classList.remove('scale-95');
        document.getElementById('sd-modal-content').classList.add('scale-100');
    }, 10);
}

function closeSalesDocModal() {
    const modal = document.getElementById('sd-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    document.getElementById('sd-modal-content').classList.remove('scale-100');
    document.getElementById('sd-modal-content').classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

async function addToSalesDoc(pid) {
    const product = await db.products.get(pid);
    if (!product) return;

    if (sdType === 'sales_order' && product.stock_qty > 0) {
        // Warning but let them add it, some people pre-order items that have little stock.
    }

    const existing = sdCart.find(c => c.id === pid);
    if (existing) {
        existing.cart_qty += 1;
    } else {
        let selectedPrice = product.retail_price;
        if (sdCustomerCategory === 'Wholesale') {
            selectedPrice = product.wholesale_price;
        }

        sdCart.push({
            id: product.id,
            name: product.name,
            cart_qty: 1,
            cart_price: selectedPrice,
            retail_price: product.retail_price,
            wholesale_price: product.wholesale_price,
            warranty: product.warranty || 'No Warranty',
            description: '',
            serial: ''
        });
    }
    await refreshSdCartHistory();
    renderSdCart();
}

/**
 * Preview serial numbers for a cart item in a beautiful UI
 */
async function previewSdSerials(id) {
    const item = sdCart.find(c => String(c.id) === String(id));
    if (!item) return;

    const serials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    let serialsHtml = '';
    if (serials.length === 0) {
        serialsHtml = `
            <div class="py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                <i class="fa-solid fa-barcode text-gray-200 dark:text-gray-700 text-4xl mb-3"></i>
                <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">No serials assigned</p>
            </div>
        `;
    } else {
        serialsHtml = `
            <div class="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto px-1 custom-scrollbar">
                ${serials.map(sn => `
                    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-700 rounded-2xl hover:border-primary/30 transition-all group">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <i class="fa-solid fa-microchip text-lg"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Assigned Serial</p>
                                <p class="text-sm font-black text-gray-900 dark:text-white font-mono break-all">${sn}</p>
                            </div>
                        </div>
                        <button onclick="Swal.close(); showWarrantyDetail('${sn.replace(/'/g, "\\'")}')" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center border border-gray-100 dark:border-gray-600" title="Serial Intelligence">
                            <i class="fa-solid fa-fingerprint text-lg"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    Swal.fire({
        title: 'Document Serial Preview',
        html: `
            <div class="text-left space-y-6">
                <div class="flex items-center gap-3 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border-2 border-primary/10">
                    <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <i class="fa-solid fa-box-open"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Line Item Entity</p>
                        <h4 class="text-sm font-black text-gray-900 dark:text-white truncate uppercase italic tracking-tighter">${item.name}</h4>
                    </div>
                </div>
                
                <div>
                    <div class="flex items-center justify-between mb-3 px-1">
                        <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrolled Serials (${serials.length})</h5>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requires: ${item.cart_qty}</p>
                    </div>
                    ${serialsHtml}
                </div>
            </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'CLOSE',
        showConfirmButton: true,
        confirmButtonText: '<i class="fa-solid fa-pen-to-square mr-2"></i> MANAGE SERIALS',
        confirmButtonColor: '#4F46E5',
        customClass: {
            container: 'premium-swal-container',
            popup: 'premium-swal-popup rounded-[2.5rem]',
            title: 'premium-swal-title text-xl font-black italic tracking-tighter uppercase',
            htmlContainer: 'premium-swal-html text-left',
            confirmButton: 'premium-swal-confirm px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95',
            cancelButton: 'premium-swal-cancel px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            promptSdSerials(id);
        }
    });
}

async function promptSdSerials(id) {
    const item = sdCart.find(c => String(c.id) === String(id));
    if (!item) return;

    // Fetch product to get available serials
    let availableSerials = [];
    if (item.product_id) {
        const prod = await db.products.get(item.product_id);
        if (prod && prod.serial_list) {
            availableSerials = prod.serial_list;
        }
    }

    const currentSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    let serialSelectionHtml = '';
    if (availableSerials.length > 0) {
        serialSelectionHtml = `
            <div class="mb-4">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Available Serials (Click to Select)</label>
                <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    ${availableSerials.map(sn => {
            const isSelected = currentSerials.includes(sn);
            return `<button type="button" 
                            onclick="toggleSdSerialSelection(this, '${sn}')"
                            class="sd-serial-tag px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600 hover:border-primary/50'}"
                            data-sn="${sn}">
                            ${sn}
                        </button>`;
        }).join('')}
                </div>
            </div>
        `;
    }

    const { value: result } = await Swal.fire({
        title: 'Manage Serial Numbers',
        html: `
            <div class="text-left">
                ${serialSelectionHtml}
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Manual / Tracked Serials</label>
                    <textarea id="sd-serial-manual-input" class="swal2-textarea w-full m-0 p-4 text-xs font-mono" placeholder="Enter manual serials (SN1, SN2...)" style="height: 100px;">${item.serial || ''}</textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#4F46E5',
        footer: `<p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Qty Required: ${item.cart_qty}</p>`,
        preConfirm: () => {
            const manual = document.getElementById('sd-serial-manual-input').value;
            return manual;
        },
        didOpen: () => {
            // Global toggle function for the tags
            window.toggleSdSerialSelection = (btn, sn) => {
                const textarea = document.getElementById('sd-serial-manual-input');
                let current = textarea.value.split(/[\n,]+/).map(s => s.trim()).filter(s => s);

                if (current.includes(sn)) {
                    current = current.filter(s => s !== sn);
                    btn.className = "sd-serial-tag px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600 hover:border-primary/50";
                } else {
                    current.push(sn);
                    btn.className = "sd-serial-tag px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all bg-primary text-white border-primary";
                }
                textarea.value = current.join(', ');
            };
        }
    });

    if (result !== undefined) {
        item.serial = result.split(/[\n,]+/).map(s => s.trim()).filter(s => s).join(', ');
        renderSdCart();
    }
}


async function promptCustomSdItem() {
    if (typeof Swal !== 'undefined') {
        const { value: formValues } = await Swal.fire({
            title: 'Add Manual Item',
            html:
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Item Name / Description</label>' +
                '<input id="swal-input-name" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="e.g. Specialized Repair Service"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Manual Description (Optional)</label>' +
                '<textarea id="swal-input-description" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="Detailed notes..."></textarea></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Warranty Details</label>' +
                '<input id="swal-input-warranty" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="e.g. 6 Months / 1 Year / N/A" value="No Warranty"></div>' +
                '<div class="grid grid-cols-2 gap-4">' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Price (Rs.)</label>' +
                '<input id="swal-input-price" type="number" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="0.00"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Quantity</label>' +
                '<input id="swal-input-qty" type="number" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" value="1"></div>' +
                '</div>' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#4F46E5',
            didOpen: () => {
                const nameInput = document.getElementById('swal-input-name');
                if (nameInput) nameInput.focus();
            },
            preConfirm: () => {
                const name = document.getElementById('swal-input-name').value;
                const description = document.getElementById('swal-input-description').value || '';
                const price = parseFloat(document.getElementById('swal-input-price').value);
                const qty = parseFloat(document.getElementById('swal-input-qty').value);
                const warranty = document.getElementById('swal-input-warranty').value || 'No Warranty';
                if (!name) {
                    Swal.showValidationMessage('Item name is required');
                    return false;
                }
                if (isNaN(price) || price < 0) {
                    Swal.showValidationMessage('Please enter a valid price');
                    return false;
                }
                if (isNaN(qty) || qty <= 0) {
                    Swal.showValidationMessage('Please enter a valid quantity');
                    return false;
                }
                return { name, description, price, qty, warranty };
            }
        });

        if (formValues) {
            const customId = 'custom-' + Date.now();
            sdCart.push({
                id: customId,
                name: formValues.name,
                cart_qty: formValues.qty,
                cart_price: formValues.price,
                retail_price: formValues.price,
                warranty: formValues.warranty,
                description: formValues.description,
                is_custom: true,
                serial: ''
            });
            renderSdCart();
        }
    } else {
        const name = prompt("Item Name:");
        if (!name) return;
        const price = parseFloat(prompt("Price (Rs.):", "0")) || 0;
        const qty = parseFloat(prompt("Quantity:", "1")) || 1;
        const customId = 'custom-' + Date.now();
        sdCart.push({
            id: customId,
            name: name,
            cart_qty: qty,
            cart_price: price,
            retail_price: price,
            warranty: 'No Warranty',
            description: '',
            serial: '',
            is_custom: true
        });
        renderSdCart();
    }
}

function updateSdCartItem(id, field, value) {
    const item = sdCart.find(c => String(c.id) === String(id));
    if (item) {
        if (field === 'cart_qty' || field === 'cart_price') {
            item[field] = parseFloat(value) || 0;
            renderSdCart();
        } else {
            item[field] = value;
            // Note: For text fields (description, warranty), do NOT call renderSdCart()
            // on input because replacing innerHTML immediately kills the textarea focus while typing.
        }
    }
}

function removeSdCartItem(id) {
    sdCart = sdCart.filter(c => String(c.id) !== String(id));
    renderSdCart();
}

function renderSdCart() {
    const list = document.getElementById('sd-items-list');
    let total = 0;
    if (sdCart.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-gray-400 font-medium italic text-xs">No items added yet. Search products to begin.</div>';
    } else {
        let h = '';
        sdCart.forEach((c, idx) => {
            const rowTotal = c.cart_qty * c.cart_price;
            total += rowTotal;
            h += `
            <div class="px-6 py-4 flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all">
                <div class="w-8 text-[10px] font-bold text-gray-400">${idx + 1}</div>
                <div class="flex-1 pr-4 group/desc">
                    <p class="text-xs font-black dark:text-white uppercase tracking-tight group-hover/desc:text-indigo-600 transition-colors" onclick="previewSdSerials('${c.id}')">${c.name} ${c.is_custom ? '<span class="text-[8px] bg-amber-100 text-amber-600 px-1 rounded ml-1">Manual</span>' : ''}</p>
                    <textarea onclick="event.stopPropagation()" oninput="updateSdCartItem('${c.id}', 'description', this.value)" placeholder="Add manual description..." class="w-full mt-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-500/50 min-h-[45px]">${c.description || ''}</textarea>
                    <div class="flex flex-wrap gap-1 mt-1" onclick="previewSdSerials('${c.id}')">
                        ${c.serial ? c.serial.split(', ').map(sn => `<span class="text-[8px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">${sn}</span>`).join('') : '<span class="text-[8px] text-gray-400 italic">Click to view/add serials</span>'}
                        ${c.last_purchase_date ? `<span class="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800 ml-2"><i class="fa-solid fa-clock-rotate-left mr-1"></i>Last Bought: ${new Date(c.last_purchase_date).toLocaleDateString()} @ Rs. ${parseFloat(c.last_purchase_price).toLocaleString()}</span>` : ''}
                    </div>
                </div>
                <div class="w-32 px-2">
                    <input type="text" oninput="updateSdCartItem('${c.id}', 'warranty', this.value)" value="${c.warranty || 'No Warranty'}" class="w-full text-center py-2 bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-500">
                </div>
                <div class="w-28 px-2">
                    <input type="number" 
                        onchange="updateSdCartItem('${c.id}', 'cart_price', this.value)" 
                        value="${c.cart_price}" 
                        class="w-full text-center py-2 bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-xs font-bold outline-none hide-arrows focus:border-indigo-500">
                </div>
                <div class="w-24 px-2 flex justify-center">
                    <div class="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button onclick="updateSdCartItem('${c.id}', 'cart_qty', ${c.cart_qty - 1 <= 0 ? 0.01 : c.cart_qty - 1})" class="px-2 py-1.5 hover:text-indigo-600 transition-colors"><i class="fa-solid fa-minus text-[10px]"></i></button>
                        <input type="number" onchange="updateSdCartItem('${c.id}', 'cart_qty', this.value)" value="${c.cart_qty}" class="w-8 text-center bg-transparent text-xs font-bold outline-none hide-arrows">
                        <button onclick="updateSdCartItem('${c.id}', 'cart_qty', ${c.cart_qty + 1})" class="px-2 py-1.5 hover:text-indigo-600 transition-colors"><i class="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                </div>
                <div class="w-28 text-right font-black text-gray-900 dark:text-white text-sm">Rs. ${parseFloat(rowTotal).toLocaleString()}</div>
                <div class="w-10 flex justify-end">
                    <button onclick="removeSdCartItem('${c.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>`;
        });
        list.innerHTML = h;
    }
    const finalTotal = total - sdDiscount;
    document.getElementById('sd-total-val').innerText = 'Rs. ' + (finalTotal > 0 ? finalTotal : 0).toLocaleString();

    const discWrap = document.getElementById('sd-discount-display-wrap');
    if (sdDiscount > 0) {
        discWrap.classList.remove('hidden');
        document.getElementById('sd-sub-val').innerText = 'Rs. ' + total.toLocaleString();
        document.getElementById('sd-discount-val').innerText = '- Rs. ' + sdDiscount.toLocaleString();
    } else {
        discWrap.classList.add('hidden');
    }
}

function promptSalesDocDiscount() {
    if (sdCart.length === 0) return;
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Apply Discount',
            input: 'number',
            inputLabel: 'Discount amount on total (Rs)',
            inputValue: sdDiscount || 0,
            showCancelButton: true,
            confirmButtonColor: '#4F46E5',
            inputValidator: (value) => {
                if (value < 0) return 'Discount cannot be negative!';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                sdDiscount = parseFloat(result.value) || 0;
                renderSdCart();
            }
        });
    } else {
        const val = prompt("Enter discount amount (Rs):", sdDiscount);
        if (val !== null) {
            sdDiscount = parseFloat(val) || 0;
            renderSdCart();
        }
    }
}

async function saveSalesDoc() {
    if (sdCart.length === 0) {
        showAlert('Validation Failed', 'Please add at least one item.', 'warning');
        return;
    }

    const cid = sdCustomer ? sdCustomer.id : null;
    let customerName = 'Walk-in Customer';
    let customerCompany = '';

    if (sdCustomer) {
        customerName = sdCustomer.name;
        customerCompany = sdCustomer.company;
    }

    let subtotal = 0;
    const items = sdCart.map(c => {
        subtotal += (c.cart_qty * c.cart_price);
        return {
            product_id: typeof c.id === 'string' && c.id.startsWith('custom-') ? null : c.id,
            name: c.name,
            qty: c.cart_qty,
            price: c.cart_price,
            total: c.cart_qty * c.cart_price,
            cost: c.retail_price,
            is_custom: c.is_custom || false,
            warranty: c.warranty || 'No Warranty',
            description: c.description || '',
            serial: c.serial || ''
        };
    });

    const docTypeEl = document.getElementById('sd-type-select');
    const dateEl = document.getElementById('sd-date');
    if (!docTypeEl || !dateEl) {
        showAlert('System Error', 'Modal elements missing. Please reload.', 'error');
        return;
    }

    const docType = docTypeEl.value;
    const dateVal = dateEl.value;
    const paymentTerms = document.getElementById('sd-payment-terms') ? document.getElementById('sd-payment-terms').value : (cid ? 'credit' : 'cash');

    let chequeDetails = null;
    if (paymentTerms === 'cheque') {
        const { value: formValues } = await Swal.fire({
            title: 'Cheque Payment Details',
            html:
                '<div class="space-y-4 pt-4">' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Cheque Number</label>' +
                '<input id="swal-cheque-num-sd" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="Enter cheque number"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Bank Name</label>' +
                '<input id="swal-bank-name-sd" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-indigo-500" placeholder="Enter bank name"></div>' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirm Cheque',
            confirmButtonColor: '#4F46E5',
            preConfirm: () => {
                const num = document.getElementById('swal-cheque-num-sd').value;
                const bank = document.getElementById('swal-bank-name-sd').value;
                if (!num || !bank) {
                    Swal.showValidationMessage('Both Cheque Number and Bank Name are required');
                    return false;
                }
                return { cheque_number: num, bank_name: bank };
            }
        });

        if (!formValues) return;
        chequeDetails = formValues;
    }

    const now = new Date();
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) d = new Date(); // Fallback to now if invalid

    // Combine selected date with current time
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const dateStr = d.toISOString();
    const validity = document.getElementById('sd-validity').value;

    const docData = {
        date: dateStr,
        timestamp: now.getTime(),
        document_type: docType,
        customer_id: cid ? parseInt(cid) : null,
        customer_name: customerName,
        items: items,
        subtotal: subtotal,
        discount: sdDiscount,
        discount_obj: { type: 'fixed', value: sdDiscount },
        tax: 0,
        total: (subtotal - sdDiscount) > 0 ? (subtotal - sdDiscount) : 0,
        payment_method: docType === 'quote' ? 'quote' : 'unpaid',
        payment_terms: paymentTerms,
        payment_type: paymentTerms,
        cheque_number: chequeDetails ? chequeDetails.cheque_number : null,
        bank_name: chequeDetails ? chequeDetails.bank_name : null,
        credit_period: (document.getElementById('sd-payment-terms') && document.getElementById('sd-payment-terms').value === 'credit') ? parseInt(document.getElementById('sd-credit-period').value) : 0,
        amount_paid: 0,
        status: docType === 'quote' ? 'active' : 'pending',
        validity: validity,
        delivery_lead_time: document.getElementById('sd-delivery-lead-time') ? document.getElementById('sd-delivery-lead-time').value : '',
        tracking_number: document.getElementById('sd-tracking-number') ? document.getElementById('sd-tracking-number').value : null,
        rep_name: typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'Admin',
        rep_contact_number: typeof currentUser !== 'undefined' && currentUser ? (currentUser.contact_number || '') : ''
    };

    // Validation: Mandatory serials for tracked items
    for (const item of items) {
        if (!item.product_id) continue;
        const p = await db.products.get(item.product_id);
        if (!p) continue;

        const isWarrantyItem = item.warranty && !['no warranty', 'n/a', 'none', 'na', 'no', ''].includes(item.warranty.toLowerCase().trim());
        const isSerialTracked = !!p.serial_tracked;

        if (docType === 'sales_order' && (isWarrantyItem || isSerialTracked) && item.qty > 0) {
            const enteredSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);

            if (enteredSerials.length === 0) {
                showAlert('Serial Required', `Item "${item.name}" requires serial numbers. Please click the item to manage serials.`, 'error');
                return;
            }

            if (enteredSerials.length !== item.qty) {
                showAlert('Serial Count Mismatch', `Entered ${enteredSerials.length} serials for "${item.name}", but quantity is ${item.qty}.`, 'error');
                return;
            }

            for (const sn of enteredSerials) {
                if (!p.serial_list || !p.serial_list.includes(sn)) {
                    showAlert('Wrong Serial Number', `The serial number "${sn}" for product "${item.name}" is not recognized or not in stock.`, 'error');
                    return;
                }
            }
        }
    }

    try {
        let insertedId;

        await db.transaction('rw', db.sales, db.products, async () => {
            // If editing, reverse old stock first if it was a sales_order
            if (sdEditingId) {
                const oldDoc = await db.sales.get(sdEditingId);
                if (oldDoc && oldDoc.document_type === 'sales_order') {
                    for (const item of (oldDoc.items || [])) {
                        if (item.product_id) {
                            const p = await db.products.get(item.product_id);
                            if (p) {
                                let newSerialList = [...(p.serial_list || [])];
                                const oldSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
                                oldSerials.forEach(sn => {
                                    if (!newSerialList.includes(sn)) newSerialList.push(sn);
                                });

                                await db.products.update(item.product_id, {
                                    stock_qty: p.stock_qty + item.qty,
                                    serial_list: newSerialList
                                });
                            }
                        }
                    }
                }
                await db.sales.update(sdEditingId, docData);
                insertedId = sdEditingId;
            } else {
                insertedId = await db.sales.add(docData);
            }

            // Deduct stock if it's a sales_order
            if (docType === 'sales_order') {
                for (const item of docData.items) {
                    if (item.product_id) {
                        const p = await db.products.get(item.product_id);
                        if (p) {
                            let newSerialList = [...(p.serial_list || [])];
                            const usedSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
                            newSerialList = newSerialList.filter(sn => !usedSerials.includes(sn));

                            await db.products.update(item.product_id, {
                                stock_qty: p.stock_qty - item.qty,
                                serial_list: newSerialList
                            });
                        }
                    }
                }
            }
        });

        if (sdEditingId) {
            showAlert('Success', 'Document updated successfully', 'success');
        } else {
            showAlert('Success', 'Document created successfully', 'success');
        }

        closeSalesDocModal();
        if (docType === 'quote' && typeof renderSalesList === 'function') {
            document.querySelector('[data-target="quotes-view"]').click();
            renderSalesList('', 'quotes');
        } else if (docType === 'sales_order' && typeof renderSalesList === 'function') {
            document.querySelector('[data-target="sales-orders-view"]').click();
            renderSalesList('', 'sales_orders');
        }

        // Setup direct prompt to print Document
        Swal.fire({
            title: 'Document Saved',
            text: "Would you like to print/preview this document now?",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes, Preview',
            cancelButtonText: 'No, Later'
        }).then((res) => {
            if (res.isConfirmed && typeof printInvoice === 'function') {
                printInvoice(insertedId, 'professional', true, false);
            }
        });

    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to save document. Check console.', 'error');
    }
}

async function refreshSdCartHistory() {
    if (!sdCustomer || sdCart.length === 0) {
        sdCart.forEach(c => {
            c.last_purchase_price = null;
            c.last_purchase_date = null;
        });
        return;
    }

    const allSales = await db.sales.where('customer_id').equals(sdCustomer.id).reverse().sortBy('date');

    sdCart.forEach(c => {
        c.last_purchase_price = null;
        c.last_purchase_date = null;
        for (const sale of allSales) {
            const item = sale.items.find(i => i.product_id === c.id || i.id === c.id);
            if (item) {
                c.last_purchase_price = item.price || item.cart_price;
                c.last_purchase_date = sale.date;
                break;
            }
        }
    });
}
