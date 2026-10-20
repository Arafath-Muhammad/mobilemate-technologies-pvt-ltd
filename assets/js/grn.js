// GRN (Goods Received Note) Management
let grnCart = [];
let editingGRNId = null;

async function loadGRN() {
    const container = document.getElementById('grn-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    // Stats
    const allGRN = await db.grn.toArray();
    const totalGRN = allGRN.length;
    const completedGRN = allGRN.filter(g => g.status === 'completed').length;
    const pendingGRN = allGRN.filter(g => g.status === 'pending' || g.status === 'partial').length;
    const totalValue = allGRN.reduce((s, g) => s + (parseFloat(g.total) || 0), 0);

    container.innerHTML = `
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white dark:bg-darkCard rounded-2xl p-5 border border-gray-200 dark:border-darkBorder shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <i class="fa-solid fa-truck-ramp-box text-xl text-indigo-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total GRNs</p>
                        <p class="text-2xl font-black text-gray-900 dark:text-white">${totalGRN}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-darkCard rounded-2xl p-5 border border-gray-200 dark:border-darkBorder shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <i class="fa-solid fa-circle-check text-xl text-emerald-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                        <p class="text-2xl font-black text-emerald-600">${completedGRN}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-darkCard rounded-2xl p-5 border border-gray-200 dark:border-darkBorder shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <i class="fa-solid fa-clock text-xl text-amber-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                        <p class="text-2xl font-black text-amber-600">${pendingGRN}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-darkCard rounded-2xl p-5 border border-gray-200 dark:border-darkBorder shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <i class="fa-solid fa-coins text-xl text-cyan-600"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</p>
                        <p class="text-2xl font-black text-gray-900 dark:text-white">Rs. ${totalValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Table Card -->
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder mb-6 flex flex-col overflow-visible">
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50 sticky top-16 z-30 backdrop-blur-md">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-truck-ramp-box text-primary"></i> Goods Received Notes</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage goods received against purchase orders.</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus-within:border-primary/30 rounded-lg px-3 py-1.5 shadow-sm transition-all h-[38px] box-border">
                        <i class="fa-solid fa-calendar-alt text-gray-400 text-xs"></i>
                        <input type="date" id="grn-start-date" value="${firstDay}" class="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 p-0 m-0 w-[110px] h-full outline-none">
                        <span class="text-gray-400 text-xs font-bold px-1">to</span>
                        <input type="date" id="grn-end-date" value="${lastDay}" class="bg-transparent border-none text-sm text-gray-900 dark:text-white focus:ring-0 p-0 m-0 w-[110px] h-full outline-none">
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="grn-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-64 transition-colors" placeholder="Search GRNs...">
                    </div>
                    <select id="grn-filter-status" class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white h-[38px]">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="completed">Completed</option>
                    </select>
                    <button onclick="openGRNModal()" class="bg-primary hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary/20 h-[38px]">
                        <i class="fa-solid fa-plus"></i> New GRN
                    </button>
                </div>
            </div>
            <div class="flex-1 p-0">
                <table class="w-full text-left border-collapse min-w-[900px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-[132px] z-20 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">GRN ID</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">PO Ref</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Vendor</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Date Received</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Status</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Total</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="grn-list-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard text-sm">
                        <tr><td colspan="7" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('grn-date-input') ? document.getElementById('grn-date-input').valueAsDate = new Date() : null;
    document.getElementById('grn-search').addEventListener('input', () => renderGRNList());
    document.getElementById('grn-filter-status').addEventListener('change', () => renderGRNList());
    document.getElementById('grn-start-date').addEventListener('change', () => renderGRNList());
    document.getElementById('grn-end-date').addEventListener('change', () => renderGRNList());
    // Safe binding
    const prodSearch = document.getElementById('grn-prod-search');
    if (prodSearch) prodSearch.addEventListener('input', (e) => searchGRNProducts(e.target.value));

    renderGRNList();
}

async function renderGRNList() {
    const tbody = document.getElementById('grn-list-body');
    if (!tbody) return;
    const query = (document.getElementById('grn-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('grn-filter-status')?.value || '';
    const startDate = document.getElementById('grn-start-date')?.value;
    const endDate = document.getElementById('grn-end-date')?.value;

    let grns = await db.grn.reverse().toArray();

    if (startDate && endDate) {
        grns = grns.filter(g => {
            const d = g.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    if (query) grns = grns.filter(g => String(g.id).includes(query) || (g.vendor_name || '').toLowerCase().includes(query) || (g.invoice_ref || '').toLowerCase().includes(query));
    if (statusFilter) grns = grns.filter(g => g.status === statusFilter);

    if (grns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-gray-400 italic">No GRN records found. Click "New GRN" to receive goods.</td></tr>';
        return;
    }

    tbody.innerHTML = grns.map(g => {
        const date = new Date(g.date).toLocaleDateString();
        const sc = g.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : g.status === 'partial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td class="p-4 font-mono font-bold text-gray-900 dark:text-white">GRN-${String(g.id).padStart(5, '0')}</td>
                <td class="p-4 text-gray-500">${g.po_id ? 'PO-' + String(g.po_id).padStart(5, '0') : '<span class="text-xs italic text-gray-400">Direct</span>'}</td>
                <td class="p-4 font-medium">${g.vendor_name || 'N/A'}</td>
                <td class="p-4 text-gray-500">${date}</td>
                <td class="p-4"><span class="${sc} text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">${g.status}</span></td>
                <td class="p-4 text-right font-bold text-gray-900 dark:text-white">Rs. ${parseFloat(g.total || 0).toLocaleString()}</td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-1">
                        <button onclick="printGRN(${g.id}, null, true, true)" class="p-2 text-gray-400 hover:text-indigo-500 transition-colors" title="Preview"><i class="fa-solid fa-eye"></i></button>
                        <button onclick="printGRN(${g.id}, null, false, true)" class="p-2 text-gray-400 hover:text-emerald-500 transition-colors" title="Print"><i class="fa-solid fa-print"></i></button>
                        <button onclick="openGRNModal(${g.id})" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteGRN(${g.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

async function openGRNModal(id = null) {
    editingGRNId = id;
    grnCart = [];

    const vendors = await db.vendors.toArray();
    const vendorSel = document.getElementById('grn-vendor-select');
    vendorSel.innerHTML = '<option value="">-- Choose Vendor --</option>' + vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

    const pos = await db.purchases.toArray();
    const poSel = document.getElementById('grn-po-select');
    poSel.innerHTML = '<option value="">-- No PO (Direct Receipt) --</option>' + pos.map(p => `<option value="${p.id}">PO-${String(p.id).padStart(5, '0')} - ${p.vendor_name} (${p.status})</option>`).join('');

    if (id) {
        const grn = await db.grn.get(id);
        if (grn) {
            document.getElementById('grn-header-title').textContent = 'Edit GRN Receipt';
            document.getElementById('grn-header-ref').textContent = 'GRN-' + String(grn.id).padStart(5, '0');
            document.getElementById('grn-po-select').value = grn.po_id || '';
            vendorSel.value = grn.vendor_id || '';
            document.getElementById('grn-status-select').value = grn.status;
            document.getElementById('grn-invoice-ref').value = grn.invoice_ref || '';
            document.getElementById('grn-notes').value = grn.notes || '';
            const dt = (grn.date || new Date().toISOString()).split('T')[0];
            document.getElementById('grn-date-input').value = dt;
            document.getElementById('grn-header-date').innerText = dt;
            const items = [];
            for (const item of (grn.items || [])) {
                const p = await db.products.get(item.product_id);
                item.has_warranty = p && p.warranty && p.warranty !== 'No Warranty';
                item.serial_tracked = p && !!p.serial_tracked;
                items.push(item);
            }
            grnCart = items;
        }
    } else {
        grnCart = []; // Clear cart for new GRN
        document.getElementById('grn-header-title').textContent = 'Goods Receiving Dock';
        document.getElementById('grn-header-ref').textContent = 'NEW GRN';
        document.getElementById('grn-status-select').value = 'completed';
        document.getElementById('grn-invoice-ref').value = '';
        document.getElementById('grn-notes').value = '';
        const dt = new Date().toISOString().split('T')[0];
        document.getElementById('grn-date-input').value = dt;
        document.getElementById('grn-header-date').innerText = dt;
    }

    renderGRNCart();
    const modal = document.getElementById('grn-modal');
    const content = document.getElementById('grn-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); modal.classList.add('opacity-100'); content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);
    searchGRNProducts('');
}

function closeGRNModal() {
    const modal = document.getElementById('grn-modal');
    const content = document.getElementById('grn-modal-content');
    modal.classList.remove('opacity-100'); modal.classList.add('opacity-0');
    content.classList.remove('scale-100'); content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function loadPOItemsToGRN() {
    const poId = document.getElementById('grn-po-select').value;
    if (!poId) return;
    const po = await db.purchases.get(parseInt(poId));
    if (!po) return;

    document.getElementById('grn-vendor-select').value = po.vendor_id || '';

    // Fetch product details for each PO item to get warranty status
    const items = [];
    for (const item of (po.items || [])) {
        const p = await db.products.get(item.product_id);
        const hasWarranty = p && p.warranty && p.warranty !== 'No Warranty';
        items.push({
            product_id: item.product_id, name: item.name, sku: item.sku,
            ordered_qty: item.qty, received_qty: item.qty, cost: item.cost,
            has_warranty: hasWarranty, serial_tracked: p && p.serial_tracked,
            serials: item.serials || []
        });
    }
    grnCart = items;
    renderGRNCart();
}

async function searchGRNProducts(query) {
    const res = document.getElementById('grn-prod-results');
    let products = await db.products.toArray();
    if (query) { const q = query.toLowerCase(); products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)); }
    res.innerHTML = products.slice(0, 15).map(p => `
        <div onclick="addToGRNCart(${p.id})" class="p-3 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-emerald-500/30 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-400">${p.name.charAt(0)}</div>
                <div><p class="font-bold text-sm dark:text-white">${p.name}</p><p class="text-[10px] text-gray-400 font-mono">${p.sku} | Stock: ${p.stock_qty}</p></div>
            </div>
            <i class="fa-solid fa-circle-plus text-emerald-500 opacity-30 group-hover:opacity-100 transition-opacity"></i>
        </div>
    `).join('') || '<p class="text-center py-10 text-xs text-gray-500 italic">No products found.</p>';
}

async function addToGRNCart(prodId) {
    const p = await db.products.get(prodId);
    if (!p) return;
    const existing = grnCart.find(i => i.product_id === prodId);
    if (existing) {
        existing.received_qty++;
    }
    else {
        const hasWarranty = p.warranty && p.warranty !== 'No Warranty';
        grnCart.push({
            product_id: prodId, name: p.name, sku: p.sku,
            ordered_qty: 0, received_qty: 1, cost: p.cost || 0,
            has_warranty: hasWarranty, serial_tracked: p.serial_tracked,
            serials: []
        });
    }
    renderGRNCart();
}

function renderGRNCart() {
    const list = document.getElementById('grn-items-list');
    if (grnCart.length === 0) {
        list.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-center p-10 opacity-30 italic font-medium"><i class="fa-solid fa-boxes-stacked text-5xl mb-4"></i><p class="text-sm">No items received yet</p><p class="text-xs mt-1">Select a PO or manually add products</p></div>';
        document.getElementById('grn-total-val').textContent = 'Rs. 0';
        return;
    }
    let total = 0;
    list.innerHTML = grnCart.map((item, i) => {
        const sub = item.received_qty * item.cost; total += sub;
        const mismatch = item.ordered_qty > 0 && item.received_qty !== item.ordered_qty;

        let serialsArea = '';
        const needsSerials = item.has_warranty || item.serial_tracked;
        if (needsSerials) {
            serialsArea = `
                <div class="col-span-12 px-2 py-2 mb-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <div class="flex items-center gap-2 mb-1 pl-1">
                        <i class="fa-solid fa-barcode text-indigo-500 text-[10px]"></i>
                        <span class="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Serial Numbers (Scan one per line or comma separated)</span>
                        <div class="ml-auto flex items-center gap-3">
                             <button type="button" onclick="importSerialsFromExcel(${i})" class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline flex items-center gap-1">
                                <i class="fa-solid fa-file-excel"></i> Import Excel
                             </button>
                             <span class="text-[9px] font-bold text-gray-400">Expected: ${item.received_qty}</span>
                        </div>
                    </div>
                    <textarea onchange="updateGRNSerials(${i}, this.value)" id="serials-input-${i}" placeholder="Enter ${item.received_qty} serial numbers..." 
                        class="w-full bg-white dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/50 p-2 rounded-lg text-xs font-mono dark:text-white outline-none min-h-[60px] transition-all overflow-y-auto">${(item.serials || []).join(', ')}</textarea>
                </div>
            `;
        }

        return `
            <div class="contents group">
                <div class="px-6 py-4 grid grid-cols-12 gap-2 items-center group-hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors ${mismatch ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}">
                    <div class="col-span-4">
                        <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">${item.name}</p>
                        <p class="text-[10px] text-gray-400 font-mono italic">${item.sku}</p>
                        ${mismatch ? '<span class="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block"><i class="fa-solid fa-triangle-exclamation mr-0.5"></i> QTY MISMATCH</span>' : ''}
                    </div>
                    <div class="col-span-2 text-center"><span class="text-sm font-bold text-gray-400">${item.ordered_qty || '—'}</span></div>
                    <div class="col-span-2 text-center"><input type="number" min="0" onchange="updateGRNQty(${i}, this.value)" value="${item.received_qty}" class="w-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 p-2 text-center rounded-lg text-xs font-black text-emerald-600 outline-none"></div>
                    <div class="col-span-2 text-center">
                        <div class="inline-flex items-center gap-1 border-2 border-gray-100 dark:border-gray-800 rounded-lg px-2 bg-gray-50 dark:bg-gray-800">
                            <span class="text-[10px] font-black text-gray-400">Rs.</span>
                            <input type="number" onchange="updateGRNCost(${i}, this.value)" value="${item.cost}" class="w-20 bg-transparent border-none p-2 text-xs font-black text-primary outline-none">
                        </div>
                    </div>
                    <div class="col-span-2 text-right">
                        <p class="text-sm font-black text-gray-900 dark:text-white">Rs. ${sub.toLocaleString()}</p>
                        <button onclick="removeFromGRNCart(${i})" class="text-[9px] font-black text-red-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest mt-1">Remove</button>
                    </div>
                    ${serialsArea ? `<div class="col-span-12 px-6 pb-2">${serialsArea}</div>` : ''}
                </div>
            </div>`;
    }).join('');
    document.getElementById('grn-total-val').textContent = 'Rs. ' + total.toLocaleString();
}

function updateGRNSerials(i, v) {
    if (v.trim()) {
        grnCart[i].serials = v.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    } else {
        grnCart[i].serials = [];
    }
}

function updateGRNQty(i, v) { grnCart[i].received_qty = parseInt(v) || 0; renderGRNCart(); }
function updateGRNCost(i, v) { grnCart[i].cost = parseFloat(v) || 0; renderGRNCart(); }
function removeFromGRNCart(i) { grnCart.splice(i, 1); renderGRNCart(); }

async function importSerialsFromExcel(index) {
    const { value: file } = await Swal.fire({
        title: 'Import Serial Numbers',
        text: 'Select an Excel file (.xlsx, .xls) or CSV. The system will search for serial numbers/IMEIs in the first column.',
        input: 'file',
        inputAttributes: {
            'accept': '.xlsx, .xls, .csv',
            'aria-label': 'Upload your Excel file'
        },
        showCancelButton: true,
        confirmButtonText: 'Process File',
        confirmButtonColor: '#10B981'
    });

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Extract serials (assuming they are in any column, but let's take the first non-empty column or let user pick?)
                // Usually distributors provide a list in a single column.
                // We'll flatten all cells and filter for strings that look like serials.
                let serials = json.flat().map(s => String(s).trim()).filter(s => s && s.length > 4 && s.toLowerCase() !== 'serial' && s.toLowerCase() !== 'imei');

                if (serials.length === 0) {
                    showAlert('No Data Found', 'Could not find any serial numbers in the selected file.', 'warning');
                    return;
                }

                // Show preview and confirm
                Swal.fire({
                    title: 'Confirm Import',
                    text: `Found ${serials.length} potential serial numbers. Import them into "${grnCart[index].name}"?`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Import All',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        grnCart[index].serials = serials;
                        // Update the quantity to match imported serials if needed?
                        // Or just show warning if they don't match.
                        if (serials.length !== grnCart[index].received_qty) {
                            showAlert('Quantity Mismatch', `Imported ${serials.length} serials, but received quantity was set to ${grnCart[index].received_qty}. We've updated the quantity to match.`, 'info');
                            grnCart[index].received_qty = serials.length;
                        }
                        renderGRNCart();
                    }
                });
            } catch (err) {
                console.error(err);
                showAlert('Processing Error', 'Failed to parse the Excel file. Please ensure it is a valid format.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

async function saveGRN() {
    const vendorId = document.getElementById('grn-vendor-select').value;
    if (!vendorId) return showAlert('Vendor Required', 'Please select the vendor supplying these goods.', 'warning');
    if (grnCart.length === 0) return showAlert('Empty GRN', 'Please add items to the goods received list.', 'warning');

    // Check for serial numbers for items with warranty
    for (const item of grnCart) {
        if (item.has_warranty || item.serial_tracked) {
            if (!item.serials || item.serials.length === 0) {
                return showAlert('Serials Required', `Please enter serial numbers for "${item.name}" as it has a warranty.`, 'warning');
            }
            if (item.serials.length !== item.received_qty) {
                return showAlert('Serial Count Mismatch', `Entered ${item.serials.length} serials for "${item.name}", but received quantity is ${item.received_qty}.`, 'warning');
            }

            // Optional: Check for duplicates within this GRN
            const uniqueSerials = new Set(item.serials);
            if (uniqueSerials.size !== item.serials.length) {
                return showAlert('Duplicate Serials', `Found duplicate serial numbers for "${item.name}" within this receipt.`, 'warning');
            }

            // Cross-check with DB to ensure serials aren't already in stock
            const p = await db.products.get(item.product_id);
            if (p && p.serial_list) {
                for (const sn of item.serials) {
                    if (p.serial_list.includes(sn)) {
                        return showAlert('Serial Already In Stock', `Serial number "${sn}" for product "${item.name}" is already in the system's inventory.`, 'error');
                    }
                }
            }
        }
    }

    const status = document.getElementById('grn-status-select').value;
    const date = document.getElementById('grn-date-input').value;
    const vendor = await db.vendors.get(parseInt(vendorId));
    const total = grnCart.reduce((s, i) => s + (parseFloat(i.received_qty || 0) * parseFloat(i.cost || 0)), 0);
    const poId = document.getElementById('grn-po-select').value;

    const grnData = {
        po_id: poId ? parseInt(poId) : null,
        vendor_id: parseInt(vendorId),
        vendor_name: vendor ? vendor.name : 'Unknown',
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        items: grnCart,
        status: status,
        total: total,
        invoice_ref: document.getElementById('grn-invoice-ref') ? document.getElementById('grn-invoice-ref').value : '',
        notes: document.getElementById('grn-notes') ? document.getElementById('grn-notes').value : '',
        received_by: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.username : 'admin'
    };

    console.log("Saving GRN...", { vendorId, total, status, items: grnCart });

    try {
        const syncTasks = [];
        await db.transaction('rw', [db.grn, db.products, db.ledger, db.accounts, db.vendors, db.activity_log, db.settings], async () => {
            let id;
            if (editingGRNId) {
                const oldGRN = await db.grn.get(editingGRNId);
                if (oldGRN && oldGRN.status === 'completed') {
                    // Reverse old vendor balance impact
                    if (oldGRN.vendor_id) {
                        const oldVendor = await db.vendors.get(oldGRN.vendor_id);
                        if (oldVendor) {
                            await db.vendors.update(oldVendor.id, {
                                current_balance: (oldVendor.current_balance || 0) - (oldGRN.total || 0)
                            });
                        }
                    }

                    for (const item of oldGRN.items) {
                        const p = await db.products.get(item.product_id);
                        if (p) {
                            let updatedList = p.serial_list || [];
                            if (item.serials && item.serials.length > 0) {
                                updatedList = updatedList.filter(sn => !item.serials.includes(sn));
                            }
                            await db.products.update(item.product_id, {
                                stock_qty: Math.max(0, p.stock_qty - item.received_qty),
                                serial_list: updatedList
                            });
                        }
                    }
                    if (typeof db.ledger !== 'undefined') await db.ledger.where('reference_id').equals(editingGRNId).filter(l => l.reference_type === 'GRN').delete();
                }
                await db.grn.update(editingGRNId, grnData);
                id = editingGRNId;
            } else {
                id = await db.grn.add(grnData);
            }

            if (status === 'completed' || status === 'partial' || status === 'received') {
                for (const item of grnCart) {
                    const p = await db.products.get(item.product_id);
                    if (p) {
                        const currentStock = parseFloat(p.stock_qty || 0);
                        const receivedQty = parseFloat(item.received_qty || 0);
                        const newStockQty = currentStock + receivedQty;

                        const updatedList = [...(p.serial_list || []), ...(item.serials || [])];

                        await db.products.update(item.product_id, {
                            stock_qty: newStockQty,
                            cost: parseFloat(item.cost || 0),
                            serial_list: updatedList
                        });

                        // Queue WooCommerce sync for after transaction
                        if (p.woo_id && typeof syncStockToWoo === 'function') {
                            syncTasks.push({ productId: item.product_id, qty: newStockQty });
                        }
                    }
                }
                if (typeof recordTransaction === 'function') {
                    const accounts = await db.accounts.toArray();
                    const getAccId = (code) => accounts.find(a => a.code === code)?.id;
                    await recordTransaction(getAccId('1300'), total, 'debit', `GRN #${id} Stock In`, 'GRN', id);
                    await recordTransaction(getAccId('2000'), total, 'credit', `GRN #${id} Payable`, 'GRN', id);
                    if (vendor) {
                        await db.vendors.update(vendor.id, { current_balance: (vendor.current_balance || 0) + total });
                    }
                }
            }
            if (typeof logActivity === 'function') await logActivity(`GRN-${String(id).padStart(5, '0')} ${status === 'completed' ? 'completed - stock updated' : 'saved as ' + status}`);
        });

        // SUCCESS: The transaction has committed successfully.
        // Execute sync tasks outside transaction
        syncTasks.forEach(task => {
            syncStockToWoo(task.productId, task.qty).catch(e => console.error("Woo stock sync fail:", e));
        });

        showAlert('GRN Saved', status === 'completed' ? 'Goods received and stock updated successfully.' : 'GRN saved as ' + status + '.', 'success');
        editingGRNId = null; // Clear editing ID after success


        try {
            closeGRNModal();
            loadGRN();
        } catch (uiErr) {
            console.error("GRN UI Update Error:", uiErr);
        }

    } catch (err) {
        console.error("GRN Save Error:", err);
        showAlert('Error', 'Failed to save GRN: ' + err.message, 'error');
    }
}

async function deleteGRN(id) {
    const confirm = await Swal.fire({
        title: 'Unreceive / Delete GRN?',
        text: 'This record will be permanently deleted and all received stock and supplier balance impacts will be reversed. Proceed?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, Unreceive & Reverse'
    });

    if (confirm.isConfirmed) {
        try {
            window.isManualAction = true;
            const grn = await db.grn.get(id);
            if (!grn) return;

            await db.transaction('rw', db.grn, db.vendors, db.products, db.ledger, async () => {
                if (grn.status === 'completed') {
                    // Reverse Stock
                    for (const item of (grn.items || [])) {
                        const p = await db.products.get(item.product_id);
                        if (p) {
                            let updatedList = p.serial_list || [];
                            if (item.serials && item.serials.length > 0) {
                                updatedList = updatedList.filter(sn => !item.serials.includes(sn));
                            }
                            await db.products.update(item.product_id, {
                                stock_qty: Math.max(0, p.stock_qty - item.received_qty),
                                serial_list: updatedList
                            });
                        }
                    }

                    // Reverse Balance
                    if (grn.vendor_id) {
                        const vendor = await db.vendors.get(grn.vendor_id);
                        // Only reverse balance if the GRN was in a status that previously added to the balance
                        if (grn.status === 'completed' || grn.status === 'partial' || grn.status === 'received') {
                            await db.vendors.update(vendor.id, {
                                current_balance: (parseFloat(vendor.current_balance) || 0) - (parseFloat(grn.total) || 0)
                            });
                        }
                    }

                    // Delete Ledger
                    if (typeof db.ledger !== 'undefined') {
                        await db.ledger.where('reference_id').equals(id).filter(l => l.reference_type === 'GRN').delete();
                    }
                }
                await db.grn.delete(id);
            });

            if (typeof logActivity === 'function') await logActivity(`Deleted GRN-${String(id).padStart(5, '0')}`);
            showAlert('Deleted', 'GRN record and its impacts have been removed.', 'success');
            loadGRN();
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to delete GRN: ' + err.message, 'error');
        } finally {
            window.isManualAction = false;
        }
    }
}

async function printGRN(id, layout = null, isPreview = false, isReprint = false) {
    const grn = await db.grn.get(id);
    if (!grn) return;

    // Role-based Security: Authorize reprinting GRNs
    if (isReprint && !isPreview) {
        requestElevatedAuth(() => {
            // Re-call with isReprint = false once authorized
            printGRN(id, layout, isPreview, false);
        }, `reprint GOODS RECEIVED NOTE GRN-${String(id).padStart(5, '0')}`);
        return;
    }
    const vendor = grn.vendor_id ? await db.vendors.get(grn.vendor_id) : null;
    const sArr = await db.settings.toArray();
    const s = {}; sArr.forEach(x => s[x.key] = x.value);
    const clr = s['invoice_color'] || '#0ea5a4';
    const footer = s['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = s['receipt_footer_info'] || '';
    const logo = s['store_logo'] || '';
    const sub = s['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const storeName = s['store_name'] || '';
    const enabledStoreAddress = s['enabled_store_address'] !== false;
    const enabledStoreSubheading = s['enabled_store_subheading'] !== false;
    // Auto-scale header font based on company name length
    const themeColor = '#00A9AB';
    const headerFontSize = storeName.length > 30 ? '16px' : storeName.length > 20 ? '19px' : '24px';
    const items = grn.items || [];
    const statusLabel = grn.status === 'completed' ? 'FULLY RECEIVED' : grn.status === 'partial' ? 'PARTIALLY RECEIVED' : 'PENDING INSPECTION';
    const statusClr = grn.status === 'completed' ? '#059669' : grn.status === 'partial' ? '#2563eb' : '#d97706';

    const MAX_ITEMS_PER_PAGE = 6;
    const pagesData = [];
    for (let i = 0; i < items.length; i += MAX_ITEMS_PER_PAGE) {
        pagesData.push(items.slice(i, i + MAX_ITEMS_PER_PAGE));
    }
    if (pagesData.length === 0) pagesData.push([]);
    const totalPages = pagesData.length;

    const pagesHtml = pagesData.map((pageItems, pageIndex) => {
        const rows = pageItems.map((item, relIdx) => {
            const idx = (pageIndex * MAX_ITEMS_PER_PAGE) + relIdx;
            const mismatch = item.ordered_qty > 0 && item.received_qty !== item.ordered_qty;
            return `<tr style="border-bottom: 2px solid #f3f4f6; page-break-inside: avoid;">
                <td align="center" style="padding: 10px 8px; font-size:12px; color: #6b7280;">${idx + 1}</td>
                <td align="left" style="padding: 10px 8px; font-size:13px;">
                    <div style="font-weight: 900; color: #111827; text-transform: uppercase;">${item.name}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px; font-family: monospace;">${item.sku}</div>
                    ${item.serials && item.serials.length > 0 ? `
                        <div style="margin-top: 8px; font-size: 10px; color: #4b5563; border-left: 2px solid #e5e7eb; padding-left: 8px;">
                            <span style="font-weight: bold; color: #9ca3af; text-transform: uppercase; font-size: 8px; display: block; margin-bottom: 2px;">Serials Received:</span>
                            <div style="font-family: monospace; line-height: 1.4;">
                                ${item.serials.map(sn => `<div style="margin-bottom: 1px;">• ${sn}</div>`).join('')}
                            </div>
                        </div>` : ''}
                </td>
                <td align="center" style="padding: 10px 8px; font-size:12px; color: #9ca3af;">${item.ordered_qty || '—'}</td>
                <td align="center" style="padding: 10px 8px; font-size:12px; font-weight: bold; ${mismatch ? 'color:#d97706;' : 'color:#059669;'}">${item.received_qty}${mismatch ? ' ⚠' : ''}</td>
                <td align="right" style="padding: 10px 8px; font-size: 12px; color: #6b7280;">Rs. ${(item.cost || 0).toLocaleString()}</td>
                <td align="right" style="padding: 10px 8px; font-size: 13px; font-weight: 900; color: #111827;">Rs. ${(item.received_qty * item.cost).toLocaleString()}</td>
            </tr>`;
        }).join('');

        return `
            <div class="page" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
                <table>
                    <thead>
                        <tr>
                            <th colspan="6" style="font-weight:normal; text-align:left; border:none; padding:0; margin:0;">
                                <!-- HEADER -->
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom: 15px; margin-bottom: 10px;">
                                    <div style="display:flex; align-items:center; gap: 20px;">
                                        ${logo ? `<img src="${logo}" style="max-height: 75px; max-width: 120px; object-fit: contain;">` : ''}
                                        <div>
                                            <h1 style="margin:0; font-size:${headerFontSize}; font-weight:900; color:${themeColor}; text-transform:uppercase;">${storeName}</h1>
                                            ${enabledStoreSubheading && sub ? `<p style="margin:2px 0; font-size:11px; color:#111827; font-weight: bold; text-transform:uppercase;">${sub}</p>` : ''}
                                            ${enabledStoreAddress && s.store_address ? `<p style="margin:2px 0; font-size:10px; color:#4b5563; font-weight: 500;">${s.store_address.split('\n').join(' | ')}</p>` : ''}
                                            <div style="font-size:10px; color:#4b5563; margin-top: 5px; white-space: nowrap;">
                                                ${s.store_phone || ''} | ${s.store_email || ''} | ${s.store_website || ''} | BR: ${s.store_br || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div style="text-align:right;">
                                        <h2 style="margin:0; font-size:26px; font-weight:900; color:#111827; letter-spacing:1px;">GOODS RECEIVED</h2>
                                        <div style="margin-top: 8px; font-size: 13px; color: #111827;">
                                            <p style="margin:2px 0;"><b>Doc No:</b> GRN-${String(id).padStart(5, '0')}</p>
                                            <p style="margin:2px 0;"><b>Date:</b> ${new Date(grn.date).toLocaleDateString()}</p>
                                            <div style="display:inline-block; background:${statusClr}; color:#fff; padding:4px 12px; border-radius:20px; font-size:10px; font-weight:bold; margin-top:5px; letter-spacing:1px; text-transform: uppercase;">${statusLabel}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid #eee; margin-top: 5px; margin-bottom: 10px;"></div>

                                <!-- INFO SECTION -->
                                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                                    <div style="width: 55%; background:#f9fafb; padding:15px; border-radius:4px;">
                                        <h3 style="margin-top:0; font-size:10px; color:${themeColor}; text-transform:uppercase; letter-spacing:1px; font-weight:900; margin-bottom: 8px;">VENDOR / SUPPLIER:</h3>
                                        <p style="margin:0; font-size:16px; font-weight:900; color:#111827; text-transform: uppercase;">${grn.vendor_name}</p>
                                        ${vendor ? `<div style="margin-top:6px; font-size:12px; color:#4b5563; line-height: 1.4;">
                                            ${vendor.contact_person ? `<b>Contact:</b> ${vendor.contact_person}<br>` : ''}
                                            ${vendor.phone ? `<b>Tel:</b> ${vendor.phone}<br>` : ''}
                                            ${vendor.email ? `<b>Email:</b> ${vendor.email}` : ''}
                                        </div>` : ''}
                                    </div>
                                    <div style="width: 40%; text-align: right; padding-top: 5px;">
                                        <p style="font-size: 10px; color: ${themeColor}; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">RECEIPT DETAILS:</p>
                                        ${grn.po_id ? `<p style="margin:3px 0; font-size:12px; color:#111827;"><b>Purchase Order:</b> PO-${String(grn.po_id).padStart(5, '0')}</p>` : ''}
                                        ${grn.invoice_ref ? `<p style="margin:3px 0; font-size:12px; color:#111827;"><b>Invoice/Ref:</b> ${grn.invoice_ref}</p>` : ''}
                                        <p style="margin:3px 0; font-size:12px; color:#111827;"><b>Received By:</b> ${grn.received_by || 'Admin'}</p>
                                        <p class="page-number" style="margin:3px 0; font-size:12px; font-weight: bold; color: #111827;">Page ${pageIndex + 1} of ${totalPages}</p>
                                    </div>
                                </div>
                            </th>
                        </tr>
                        <tr style="background: ${themeColor}; color: #fff; -webkit-print-color-adjust: exact;">
                            <th align="center" width="5%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">#</th>
                            <th align="left" width="40%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Item Description</th>
                            <th align="center" width="10%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Ordered</th>
                            <th align="center" width="10%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Received</th>
                            <th align="right" width="15%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Unit Cost</th>
                            <th align="right" width="20%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        ${grn.notes && pageIndex === totalPages - 1 ? `
                        <tr>
                            <td colspan="6" style="border:none;">
                                <div style="margin:10px 0; background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fef3c7;">
                                    <h3 style="margin-top:0; color:#d97706; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight: 900;">Receiving Notes:</h3>
                                    <p style="margin:0; font-size:12px; color:#92400e;">${grn.notes}</p>
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
                                <span>Total Value</span>
                                <span style="color: ${themeColor};">Rs. ${parseFloat(grn.total || 0).toLocaleString()}</span>
                            </div>
                            <div style="border-top: 3px solid ${themeColor}; margin-top: 4px;"></div>
                        </div>
                    </div>` : ''}

                    <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 10px;">
                        ${['PREPARED BY', 'AUTHORIZED BY', 'RECEIVER NAME', 'STORE KEEPER', 'NIC NUMBER'].map(label => `
                            <div style="text-align: center;">
                                <div style="border-bottom: 1px solid #d1d5db; height: 30px; margin-bottom: 6px;"></div>
                                <p style="margin: 0; font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div style="text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin-top: 4px;">
                        <h3 style="margin:0; font-size:11px; font-weight:900; color:#111827; text-transform:uppercase; letter-spacing:1px;">${footer.toUpperCase()}</h3>
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
            <title>GRN - ${String(id).padStart(5, '0')}</title>
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
                .print-footer { margin-top: auto; padding-top: 15px; }
                .page-number { display: block !important; }
                table { width: 100%; border-collapse: collapse; }
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
            () => printGRN(id, layout, false),
            () => openGRNModal(id),
            null,
            (html) => {
                const docNo = `GRN-${String(id).padStart(5, '0')}`;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Goods Received Note', docNo, grn.vendor_name, grn.total, grn.items, html);
                }
            },
            (html) => generatePDFAndShare(html, `GRN-${String(id).padStart(5, '0')}.pdf`, { forceDownload: true })
        );
        return;
    }
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
}
