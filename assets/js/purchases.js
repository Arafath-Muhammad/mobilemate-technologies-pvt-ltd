// Purchase orders management
let poCart = [];
let editingPOId = null;

async function loadPurchases() {
    console.log("Loading Purchases view...");
    const container = document.getElementById('purchases-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder mb-6 flex flex-col">
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50 sticky top-16 z-30 backdrop-blur-md">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage stock procurement from vendors.</p>
                </div>
                
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus-within:border-primary/30 rounded-lg px-3 py-1.5 shadow-sm transition-all h-[38px] box-border">
                        <i class="fa-solid fa-calendar-alt text-gray-400 text-xs"></i>
                        <input type="date" id="po-start-date" value="${firstDay}" class="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 p-0 m-0 w-[110px] h-full outline-none">
                        <span class="text-gray-400 text-xs font-bold px-1">to</span>
                        <input type="date" id="po-end-date" value="${lastDay}" class="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 p-0 m-0 w-[110px] h-full outline-none">
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="po-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-64 transition-colors" placeholder="Search POs...">
                    </div>
                    <button onclick="openPOModal()" class="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 h-[38px]">
                        <i class="fa-solid fa-plus"></i> New Purchase Order
                    </button>
                </div>
            </div>

            <!-- Table section -->
            <div class="flex-1 p-0">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-[132px] z-20 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">PO ID</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Vendor</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Date</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Status</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Total</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="po-list-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard text-sm">
                        <tr><td colspan="6" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Set defaults
    document.getElementById('po-date-input') ? document.getElementById('po-date-input').valueAsDate = new Date() : null;
    document.getElementById('po-search').addEventListener('input', (e) => renderPOList(e.target.value));
    document.getElementById('po-start-date').addEventListener('change', () => renderPOList(document.getElementById('po-search').value));
    document.getElementById('po-end-date').addEventListener('change', () => renderPOList(document.getElementById('po-search').value));

    // Only bind if po-prod-search is available right now
    const prodSearch = document.getElementById('po-prod-search');
    if (prodSearch) prodSearch.addEventListener('input', (e) => searchPOProducts(e.target.value));

    renderPOList();
}

function switchPOTab(tab) {
    const sTab = document.getElementById('tab-po-search');
    const lTab = document.getElementById('tab-po-low');
    const sPane = document.getElementById('pane-po-search');
    const lPane = document.getElementById('pane-po-low');

    if (tab === 'search') {
        sTab.className = "flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-primary text-primary transition-all";
        lTab.className = "flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent text-gray-400 hover:text-amber-500 transition-all";
        sPane.classList.remove('hidden');
        lPane.classList.add('hidden');
    } else {
        lTab.className = "flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-amber-500 text-amber-500 transition-all";
        sTab.className = "flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent text-gray-400 hover:text-primary transition-all";
        lPane.classList.remove('hidden');
        sPane.classList.add('hidden');
        loadLowStockSuggestions();
    }
}

async function renderPOList(query = '') {
    const tbody = document.getElementById('po-list-body');
    if (!tbody) return;

    let pos = await db.purchases.reverse().toArray();

    const startDate = document.getElementById('po-start-date')?.value;
    const endDate = document.getElementById('po-end-date')?.value;

    if (startDate && endDate) {
        pos = pos.filter(p => {
            const d = p.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    if (query) {
        const q = query.toLowerCase();
        pos = pos.filter(p => String(p.id).includes(q) || (p.vendor_name && p.vendor_name.toLowerCase().includes(q)));
    }

    if (pos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-gray-400 italic">No purchase orders found. Start by clicking "New Purchase Order".</td></tr>';
        return;
    }

    tbody.innerHTML = pos.map(p => {
        const date = new Date(p.date).toLocaleDateString();
        const statusClass = p.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-4 font-mono font-bold text-gray-900 dark:text-white">PO-${String(p.id).padStart(5, '0')}</td>
                <td class="p-4">${p.vendor_name || 'N/A'}</td>
                <td class="p-4 text-gray-500">${date}</td>
                <td class="p-4"><span class="${statusClass} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${p.status}</span></td>
                <td class="p-4 text-right font-bold text-gray-900 dark:text-white">Rs. ${parseFloat(p.total).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="printPO(${p.id}, null, true, true)" class="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="Preview Details"><i class="fa-solid fa-eye"></i></button>
                        <button onclick="printPO(${p.id}, null, false, true)" class="p-2 text-gray-400 hover:text-emerald-500 transition-colors" title="Print A4 Standard"><i class="fa-solid fa-print"></i></button>
                        <button onclick="printPO(${p.id}, 'dotmatrix', false, true)" class="p-2 text-gray-400 hover:text-orange-500 transition-colors" title="Print Dot Matrix"><i class="fa-solid fa-file-invoice"></i></button>
                        <button onclick="openPOModal(${p.id})" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deletePO(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function openPOModal(id = null) {
    editingPOId = id;
    poCart = [];

    const vendors = await db.vendors.toArray();
    const vendorSelect = document.getElementById('po-vendor-select');
    vendorSelect.innerHTML = '<option value="">-- Choose Vendor Partner --</option>' +
        vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

    if (id) {
        const po = await db.purchases.get(id);
        if (po) {
            document.getElementById('po-modal-title').textContent = 'Edit Purchase Order';
            const tid = 'PO-' + String(po.id).padStart(5, '0');
            const hRef = document.querySelector('#po-modal-content .tracking-widest.bg-gray-100');
            if (hRef) hRef.innerText = tid;

            document.getElementById('po-vendor-select').value = po.vendor_id || '';
            document.getElementById('po-status-select').value = po.status;
            document.getElementById('po-payment-type').value = po.payment_type || 'cash';
            document.getElementById('po-date-input').value = po.date.split('T')[0];
            document.getElementById('po-header-date-display').innerText = po.date.split('T')[0];
            poCart = po.items || [];
        }
    } else {
        document.getElementById('po-modal-title').textContent = 'Purchase Order';
        const hRef = document.querySelector('#po-modal-content .tracking-widest.bg-gray-100');
        if (hRef) hRef.innerText = 'NEW PO';
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        document.getElementById('po-date-input').value = today;
        document.getElementById('po-header-date-display').innerText = today;
        poCart = [];
        document.getElementById('po-status-select').value = 'pending';
        document.getElementById('po-payment-type').value = 'cash';
        document.getElementById('po-ship-to').value = 'main';
        document.getElementById('po-notes').value = '';
    }

    renderPOCart();
    switchPOTab('search');

    const modal = document.getElementById('po-modal');
    const content = document.getElementById('po-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
    searchPOProducts('');
}

function closePOModal() {
    const modal = document.getElementById('po-modal');
    const content = document.getElementById('po-modal-content');
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function searchPOProducts(query) {
    const resultsContainer = document.getElementById('po-prod-results');
    let products = await db.products.toArray();
    if (query) {
        const q = query.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    resultsContainer.innerHTML = products.slice(0, 15).map(p => `
        <div onclick="addToPOCart(${p.id})" class="p-3 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-primary/30 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-400">
                    ${p.name.charAt(0)}
                </div>
                <div>
                    <p class="font-bold text-sm dark:text-white">${p.name}</p>
                    <p class="text-[10px] text-gray-400 font-mono tracking-tighter">${p.sku} | Stock: ${p.stock_qty}</p>
                </div>
            </div>
            <i class="fa-solid fa-circle-plus text-primary opacity-30 group-hover:opacity-100 transition-opacity"></i>
        </div>
    `).join('') || '<p class="text-center py-10 text-xs text-gray-500 italic">No products matched your search.</p>';
}

async function loadLowStockSuggestions() {
    const resultsContainer = document.getElementById('po-lowstock-results');
    const products = await db.products.toArray();
    const lowStock = products.filter(p => p.stock_qty <= (p.min_stock || 10));

    resultsContainer.innerHTML = lowStock.map(p => `
        <div onclick="addToPOCart(${p.id})" class="p-3 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-amber-500/30 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm border-l-4 border-l-amber-500">
            <div>
                <p class="font-bold text-sm dark:text-white">${p.name}</p>
                <p class="text-[10px] text-amber-500 font-black tracking-tighter uppercase">LOW: ${p.stock_qty} / MIN: ${p.min_stock || 10}</p>
            </div>
            <i class="fa-solid fa-circle-plus text-amber-500 opacity-30 group-hover:opacity-100 transition-opacity"></i>
        </div>
    `).join('') || '<p class="text-center py-10 text-xs text-gray-500 italic">Success! No low stock items discovered.</p>';
}

async function addAllLowStock() {
    const products = await db.products.toArray();
    const lowStock = products.filter(p => p.stock_qty <= (p.min_stock || 10));
    for (const p of lowStock) {
        const existing = poCart.find(i => i.product_id === p.id);
        if (!existing) {
            poCart.push({ product_id: p.id, name: p.name, sku: p.sku, qty: (p.min_stock || 10) * 2, cost: p.cost || 0 });
        }
    }
    renderPOCart();
}

async function addToPOCart(prodId) {
    const product = await db.products.get(prodId);
    if (!product) return;
    const existing = poCart.find(i => i.product_id === prodId);
    if (existing) {
        existing.qty++;
    } else {
        poCart.push({ product_id: prodId, name: product.name, sku: product.sku, qty: 1, cost: product.cost || 0 });
    }
    renderPOCart();
}

function renderPOCart() {
    const list = document.getElementById('po-items-list');
    if (poCart.length === 0) {
        list.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 italic font-medium"><i class="fa-solid fa-truck-ramp-box text-5xl mb-4"></i><p class="text-sm">Empty Procurement List</p></div>`;
        document.getElementById('po-total-val').textContent = 'Rs. 0';
        return;
    }

    let total = 0;
    list.innerHTML = poCart.map((item, index) => {
        const itemTotal = item.qty * item.cost;
        total += itemTotal;
        return `
            <div class="px-6 py-4 flex items-center justify-between group bg-white dark:bg-transparent">
                <div class="w-1/2">
                    <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">${item.name}</p>
                    <p class="text-[10px] text-gray-400 font-mono italic">${item.sku}</p>
                </div>
                <div class="flex-1 flex justify-around items-center">
                    <div class="w-32 flex items-center gap-1 border-2 border-gray-100 dark:border-gray-800 rounded-lg px-2 bg-gray-50 dark:bg-gray-800">
                        <span class="text-[10px] font-black text-gray-400">Rs.</span>
                        <input type="number" onchange="updatePOCost(${index}, this.value)" value="${item.cost}" class="w-full bg-transparent border-none p-2 text-xs font-black text-primary outline-none focus:ring-0">
                    </div>
                    <input type="number" onchange="updatePOQty(${index}, this.value)" value="${item.qty}" class="w-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 p-2 text-center rounded-lg text-xs font-black text-gray-900 dark:text-white outline-none focus:ring-0">
                    <div class="w-24 text-right">
                        <p class="text-sm font-black text-gray-900 dark:text-white tracking-widest leading-none">Rs. ${itemTotal.toLocaleString()}</p>
                        <button onclick="removeFromPOCart(${index})" class="text-[9px] font-black text-red-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest mt-1">Remove Item</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('po-total-val').textContent = 'Rs. ' + total.toLocaleString();
}

function updatePOQty(index, val) { poCart[index].qty = parseInt(val) || 0; renderPOCart(); }
function updatePOCost(index, val) { poCart[index].cost = parseFloat(val) || 0; renderPOCart(); }
function removeFromPOCart(index) { poCart.splice(index, 1); renderPOCart(); }

async function savePO() {
    const vendorId = document.getElementById('po-vendor-select').value;
    if (!vendorId) return showAlert('Vendor Required', 'Please identify which vendor is supplying these items.', 'warning');
    if (poCart.length === 0) return showAlert('Procurement Empty', 'Please add products to your purchase list.', 'warning');

    const status = document.getElementById('po-status-select').value;
    const notes = document.getElementById('po-notes').value;
    const date = document.getElementById('po-date-input').value;
    const vendor = await db.vendors.get(parseInt(vendorId));
    let total = poCart.reduce((sum, item) => sum + (item.qty * item.cost), 0);

    const paymentType = document.getElementById('po-payment-type').value;
    let chequeDetails = null;

    if (paymentType === 'cheque') {
        const { value: formValues } = await Swal.fire({
            title: 'Cheque Payment Details',
            html:
                '<div class="space-y-4 pt-4">' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Cheque Number</label>' +
                '<input id="swal-cheque-num-po" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary" placeholder="Enter cheque number"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Bank Name</label>' +
                '<input id="swal-bank-name-po" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary" placeholder="Enter bank name"></div>' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirm Cheque',
            confirmButtonColor: '#4F46E5',
            preConfirm: () => {
                const num = document.getElementById('swal-cheque-num-po').value;
                const bank = document.getElementById('swal-bank-name-po').value;
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

    const poData = {
        vendor_id: parseInt(vendorId),
        vendor_name: vendor ? vendor.name : 'Unknown Vendor',
        date: (() => {
            const now = new Date();
            if (!date) return now.toISOString();
            const d = new Date(date);
            d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            return d.toISOString();
        })(),
        items: poCart,
        status: status,
        payment_type: paymentType,
        cheque_number: chequeDetails ? chequeDetails.cheque_number : null,
        bank_name: chequeDetails ? chequeDetails.bank_name : null,
        ship_to: document.getElementById('po-ship-to').value,
        notes: notes,
        total: total,
    };

    try {
        const poId = await db.transaction('rw', db.purchases, db.products, db.ledger, db.accounts, db.vendors, async () => {
            let id;
            if (editingPOId) {
                await db.purchases.update(editingPOId, poData);
                id = editingPOId;
            } else {
                id = await db.purchases.add(poData);
            }


            return id;
        });

        showAlert('Order Saved', 'Purchase order successfully saved.', 'success');
        closePOModal();
        loadPurchases();
    } catch (err) {
        showAlert('System Error', 'Failed to commit procurement data: ' + err.message, 'error');
    }
}

async function deletePO(id) {
    const confirm = await Swal.fire({
        title: 'Purge PO?',
        text: "This procurement record will be permanently deleted and all impacts will be reversed. Proceed?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Confirm Deletion'
    });

    if (confirm.isConfirmed) {
        try {
            window.isManualAction = true;
            const po = await db.purchases.get(id);
            if (!po) return;

            await db.purchases.delete(id);

            if (typeof logActivity === 'function') await logActivity(`Deleted PO-${String(id).padStart(5, '0')}`);
            loadPurchases();
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to delete PO: ' + err.message, 'error');
        } finally {
            window.isManualAction = false;
        }
    }
}

async function printPO(id, layout = null, isPreview = false, isReprint = false) {
    const po = await db.purchases.get(id);
    if (!po) return;

    // Role-based Security: Authorize reprinting POs
    if (isReprint && !isPreview) {
        requestElevatedAuth(() => {
            // Re-call with isReprint = false once authorized
            printPO(id, layout, isPreview, false);
        }, `reprint PURCHASE ORDER PO-${String(id).padStart(5, '0')}`);
        return;
    }
    const vendor = await db.vendors.get(po.vendor_id);
    const settingsArr = await db.settings.toArray();
    const settings = {};
    settingsArr.forEach(s => settings[s.key] = s.value);

    const invoiceColor = settings['invoice_color'] || '#0ea5a4';
    const invoiceFooter = settings['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = settings['receipt_footer_info'] || '';
    const bankDetails = settings['bank_details'] || '';
    const storeSubheading = settings['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const storeLogo = settings['store_logo'] || '';
    const storeEmail = settings['store_email'] || '';
    const storeWebsite = settings['store_website'] || '';
    const storeBR = settings['store_br'] || '';
    const storeName = settings['store_name'] || 'MobileMate';
    const storeAddress = settings['store_address'] || '';
    const storePhone = String(settings['store_phone'] || '');
    const enabledStoreAddress = settings['enabled_store_address'] !== false;
    const enabledStoreSubheading = settings['enabled_store_subheading'] !== false;

    // Items preparation
    let itemsHtml = (po.items || []).map(i => `
        <tr style="border-bottom: 2px solid #f3f4f6;">
            <td align="left" style="padding: 15px 10px;">
                <b style="font-size: 14px; text-transform: uppercase;">${i.name}</b><br>
                <small style="color: #6b7280; font-family: monospace;">${i.sku}</small>
            </td>
            <td align="center" style="padding: 15px 10px; font-weight: bold;">${i.qty}</td>
            <td align="right" style="padding: 15px 10px; color: #4b5563;">Rs. ${i.cost.toLocaleString()}</td>
            <td align="right" style="padding: 15px 10px; font-weight: black; color: #111827;">Rs. ${(i.qty * i.cost).toLocaleString()}</td>
        </tr>
    `).join('');

    const effectiveLayout = layout || po.printer_layout || 'standard';

    if (effectiveLayout === 'dotmatrix') {
        const dotItems = (po.items || []).map(item => `
            <tr style="border-bottom: 1px dotted #000;">
                <td style="padding: 5px; font-size: 14px;">
                    ${item.name}
                    ${item.sku ? `<div style="font-size: 12px;">SKU: ${item.sku}</div>` : ''}
                </td>
                <td align="center" style="padding: 5px; font-size: 14px;">${item.qty}</td>
                <td align="right" style="padding: 5px; font-size: 14px;">${parseFloat(item.cost).toLocaleString()}</td>
                <td align="right" style="padding: 5px; font-size: 14px;">${parseFloat(item.qty * item.cost).toLocaleString()}</td>
            </tr>
        `).join('');

        const dotHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>DOT MATRIX - PURCHASE ORDER</title>
                    <style>
                        @media print { @page { size: A4; margin: 10mm; } }
                        body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; padding: 0; margin: 0; }
                        .container {width: 100%; border: 1px solid #000; padding: 10px; box-sizing: border-box; }
                        table {width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th {border: 1px solid #000; padding: 5px; text-align: left; background: #eee; -webkit-print-color-adjust: exact; }
                        td {border: 1px solid #000; padding: 5px; }
                        .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div>
                                <h2 style="margin:0;">${settings.store_name || 'MobileMate'}</h2>
                                ${enabledStoreAddress ? `<p style="margin:5px 0; font-size: 12px;">${settings.store_address || ''}</p>` : ''}
                                <div style="font-size:11px; color:#444;">
                                    ${settings.store_phone || ''} ${storeEmail ? ` | ${storeEmail}` : ''}
                                    ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                    ${storeBR ? ` | BR: ${storeBR}` : ''}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <h2 style="margin:0;">PURCHASE ORDER</h2>
                                <p style="margin:5px 0;">ID: PO-${String(id).padStart(5, '0')}</p>
                                <p style="margin:5px 0;">DATE: ${new Date(po.date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div style="margin-bottom:10px;">
                            <strong>VENDOR:</strong> ${po.vendor_name}<br>
                                ${vendor && vendor.address ? `Address: ${vendor.address}` : ''}
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>DESCRIPTION</th>
                                    <th align="center">QTY</th>
                                    <th align="right">COST</th>
                                    <th align="right">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>${dotItems}</tbody>
                        </table>

                        <div style="margin-top:20px; text-align:right; border-top: 1px solid #000; padding-top: 10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase; color: #666;">
                                    Powered by Infinity Creative Works (+94 76 5 449 005)
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    ${po.payment_type === 'cheque' && po.cheque_number ? `
                                <div style="font-size: 11px; padding: 10px; border: 1px solid #000; text-align: left; min-width: 250px;">
                                    <strong>Cheque Details:</strong><br>
                                    No: ${po.cheque_number}<br>
                                    Bank: ${po.bank_name || 'N/A'}
                                </div>` : ''}
                                    <div style="display:inline-block; border: 2px solid #000; padding: 10px; min-width: 250px;">
                                        <h2 style="margin:0;">VALUATION: Rs. ${parseFloat(po.total).toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <script>window.onload = function() {window.print(); window.close(); }</script>
                </body>
            </html>
    `;

        const win = window.open('', '_blank');
        if (win) { win.document.write(dotHtml); win.document.close(); }
        return;
    }

    const themeColor = '#00A9AB';
    const headerFontSize = storeName.length > 30 ? '16px' : storeName.length > 20 ? '19px' : '24px';
    const items = po.items || [];

    const MAX_ITEMS_PER_PAGE = 6;
    const pagesData = [];
    for (let i = 0; i < (items).length; i += MAX_ITEMS_PER_PAGE) {
        pagesData.push((items).slice(i, i + MAX_ITEMS_PER_PAGE));
    }
    if (pagesData.length === 0) pagesData.push([]);
    const totalPages = pagesData.length;

    const pagesHtml = pagesData.map((pageItems, pageIndex) => {
        const chunkRows = pageItems.map((item, relIdx) => {
            const idx = (pageIndex * MAX_ITEMS_PER_PAGE) + relIdx;
            return `
                    <tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid;">
                        <td align="center" style="padding: 10px 8px; font-size:12px; color: #6b7280;">${idx + 1}</td>
                        <td align="left" style="padding: 10px 8px; font-size:13px;">
                            <div style="font-weight: 900; color: #111827; text-transform: uppercase;">${item.name}</div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 2px; font-family: monospace;">${item.sku}</div>
                        </td>
                        <td align="center" style="padding: 10px 8px; font-size:12px; font-weight: bold;">${item.qty}</td>
                        <td align="right" style="padding: 10px 8px; font-size: 12px; color: #6b7280;">Rs. ${(parseFloat(item.cost) || 0).toLocaleString()}</td>
                        <td align="right" style="padding: 10px 8px; font-size: 13px; font-weight: 900; color: #111827;">Rs. ${(parseFloat(item.qty * item.cost) || 0).toLocaleString()}</td>
                    </tr>
                `;
        }).join('');

        return `
                <div class="page" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
                    <table>
                        <thead>
                            <tr>
                                <th colspan="5" style="font-weight:normal; text-align:left; border:none; padding:0; margin:0;">
                                    <!-- HEADER -->
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom: 15px; margin-bottom: 8px;">
                                        <div style="display:flex; align-items:center; gap: 18px;">
                                            ${storeLogo ? `<img src="${storeLogo}" style="max-height: 70px; max-width: 110px; object-fit: contain;">` : ''}
                                            <div>
                                                <h1 style="margin:0; font-size:${headerFontSize}; font-weight:900; color:${themeColor}; text-transform:uppercase;">${storeName}</h1>
                                                ${enabledStoreSubheading && storeSubheading ? `<p style="margin:2px 0; font-size:11px; color:#111827; font-weight: bold; text-transform:uppercase;">${storeSubheading}</p>` : ''}
                                                ${enabledStoreAddress && storeAddress ? `<p style="margin:2px 0; font-size:10px; color:#4b5563; font-weight: 500;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                                                <div style="font-size:10px; color:#4b5563; margin-top: 4px; white-space: nowrap;">
                                                    ${storePhone ? `+${storePhone.replace('+', '')}` : ''} | ${storeEmail} | ${storeWebsite} | BR: ${storeBR}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="text-align:right;">
                                            <h2 style="margin:0; font-size:26px; font-weight:900; color:#111827; letter-spacing:1px;">PURCHASE ORDER</h2>
                                            <div style="margin-top: 8px; font-size: 13px; color: #111827;">
                                                <p style="margin:2px 0;"><b>Doc No:</b> PO-${String(id).padStart(5, '0')}</p>
                                                <p style="margin:2px 0;"><b>Date:</b> ${new Date(po.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style="border-top: 1px solid #eee; margin-top: 4px; margin-bottom: 8px;"></div>

                                    <!-- INFO SECTION -->
                                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                                        <div style="width: 55%; background:#f9fafb; padding:15px; border-radius:4px;">
                                            <h3 style="margin-top:0; font-size:10px; color:${themeColor}; text-transform:uppercase; letter-spacing:1px; font-weight:900; margin-bottom: 6px;">VENDOR / SUPPLIER:</h3>
                                            <p style="margin:0; font-size:16px; font-weight:900; color:#111827; text-transform: uppercase;">${po.vendor_name}</p>
                                            ${vendor ? `
                                            <div style="margin-top:6px; font-size:11px; color:#4b5563; line-height: 1.4;">
                                                ${vendor.contact_person ? `<b>Contact Person:</b> ${vendor.contact_person}<br>` : ''}
                                                ${vendor.phone ? `<b>Tel:</b> ${vendor.phone}<br>` : ''}
                                                ${vendor.email ? `<b>Email:</b> ${vendor.email}` : ''}
                                            </div>` : ''}
                                        </div>
                                        <div style="width: 40%; text-align: right; padding-top: 4px;">
                                            <p style="font-size: 10px; color: ${themeColor}; font-weight: 900; text-transform: uppercase; margin-bottom: 6px;">ORDER DETAILS:</p>
                                            <p style="margin:3px 0; font-size:12px; color:#111827;"><b>Payment Terms:</b> ${po.payment_type ? po.payment_type.toUpperCase() : 'N/A'}</p>
                                            <p style="margin:3px 0; font-size:12px; color:#111827;"><b>Status:</b> ${po.status.toUpperCase()}</p>
                                            ${po.ship_to ? `<p style="margin:3px 0; font-size:12px; color:#111827;"><b>Ship to:</b> ${po.ship_to.toUpperCase()}</p>` : ''}
                                            <p class="page-number" style="margin:4px 0; font-size:12px; font-weight: bold; color: #111827;">Page ${pageIndex + 1} of ${totalPages}</p>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr style="background: ${themeColor}; color: #fff; -webkit-print-color-adjust: exact;">
                                <th align="center" width="5%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">#</th>
                                <th align="left" width="50%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Item Description</th>
                                <th align="center" width="10%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Qty</th>
                                <th align="right" width="15%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Unit Cost</th>
                                <th align="right" width="20%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chunkRows}
                            ${po.notes && pageIndex === totalPages - 1 ? `
                            <tr>
                                <td colspan="5" style="border:none;">
                                    <div style="margin:10px 0; background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fef3c7;">
                                        <h3 style="margin-top:0; color:#d97706; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight: 900;">Notes:</h3>
                                        <p style="margin:0; font-size:12px; color:#92400e;">${po.notes}</p>
                                    </div>
                                </td>
                            </tr>` : ''}
                        </tbody>
                    </table>

                    <!-- FOOTER MUST BE ON EVERY PAGE -->
                    <div class="print-footer">
                        ${pageIndex === totalPages - 1 ? `
                        <div style="display:flex; justify-content:flex-end; margin-bottom: 12px;">
                            <div style="width: 45%;">
                                <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:15px; font-weight: 900; color:#4b5563; text-transform: uppercase;">
                                    <span>Grand Valuation</span>
                                    <span style="color: ${themeColor};">Rs. ${(parseFloat(po.total) || 0).toLocaleString()}</span>
                                </div>
                                <div style="border-top: 3px solid ${themeColor}; margin-top: 4px;"></div>
                            </div>
                        </div>` : ''}

                        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 10px;">
                            ${['PREPARED BY', 'AUTHORIZED BY', 'SUPPLIER APPROVAL', 'STORE KEEPER', 'NIC NUMBER'].map(label => `
                                <div style="text-align: center;">
                                    <div style="border-bottom: 1px solid #d1d5db; height: 30px; margin-bottom: 6px;"></div>
                                    <p style="margin: 0; font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                                </div>
                            `).join('')}
                        </div>

                        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin-top: 4px;">
                            <h3 style="margin:0; font-size:11px; font-weight:900; color:#111827; text-transform:uppercase; letter-spacing:1px;">${invoiceFooter.toUpperCase()}</h3>
                            ${receiptFooterInfo ? `<p style="margin:4px 0; font-size:8px; color:#6b7280; line-height: 1.3; max-width: 90%; margin-left: auto; margin-right: auto;">${receiptFooterInfo}</p>` : ''}
                            <div style="margin-top: 4px; font-size:8px; color:#9ca3af;">
                                Contact: +94 77 51 65 589 | info@mobilemate.lk | www.mobilemate.lk
                            </div>
                            <div style="margin-top: 3px; font-size:8px; color:#111827; font-weight:bold;">
                                Powered by INFINITY CREATIVE WORKS
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }).join('');

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PO-${String(id).padStart(5, '0')}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    @media print { 
                        @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; } 
                        html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: #fff !important; width: 100% !important; }
                        .page { 
                            width: 100% !important;
                            max-width: 100% !important;
                            min-height: 277mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            display: flex !important; 
                            flex-direction: column !important; 
                            page-break-after: always !important; 
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: visible !important; 
                            box-sizing: border-box !important;
                        }
                        .page:last-child { page-break-after: auto !important; break-after: auto !important; }
                        .print-footer { margin-top: auto !important; width: 100% !important; box-sizing: border-box !important; background: white !important; }
                        .page-number { display: block !important; }
                    }
                    html, body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f0f0f0; }
                    .page { 
                        background: #fff; 
                        width: 210mm; 
                        min-height: 297mm; 
                        margin: 15px auto; 
                        padding: 12mm; 
                        box-sizing: border-box; 
                        display: flex; 
                        flex-direction: column; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        page-break-after: always;
                        break-after: page;
                    }
                    .page:last-child { page-break-after: auto; break-after: auto; }
                    .page-number { display: block !important; }
                    table { width: 100%; border-collapse: collapse; }
                    .text-teal { color: ${themeColor}; }
                    .bg-teal { background-color: ${themeColor}; }
                    .border-teal { border-color: ${themeColor}; }
                    @media screen {
                        .print-footer { margin-top: auto; padding-top: 15px; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
            <script>window.onload=function(){setTimeout(function(){window.print();window.close();},700);}<\/script>
        </body>
        </html>
    `;

    if (isPreview) {
        openPreviewModal(
            html,
            () => printPO(id, layout, false),
            () => openPOModal(id),
            null,
            (html) => {
                const docNo = `PO - ${String(id).padStart(5, '0')} `;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Purchase Order', docNo, po.vendor_name, po.total, po.items, html);
                }
            },
            (html) => generatePDFAndShare(html, `PO - ${String(id).padStart(5, '0')}.pdf`, { forceDownload: true })
        );
        return;
    }

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
}

