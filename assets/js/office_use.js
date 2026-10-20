// Office Use Module - Internal Consumption Tracking

let officeUseCart = [];

async function loadOfficeUse() {
    console.log("Loading Office Use view...");
    const container = document.getElementById('office-use-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-gray-100 dark:border-darkBorder flex flex-col h-full overflow-hidden">
            <div class="p-8 lg:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/20 dark:bg-darkBg/20 relative">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Office Use</h2>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] opacity-70">Track internal inventory consumption and company assets</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="relative group">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-sm"></i>
                        <input type="text" id="office-use-search" class="pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-transparent focus:border-indigo-500/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-white w-full md:w-72 transition-all shadow-sm" placeholder="Search records...">
                    </div>
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                        <i class="fa-solid fa-calendar-alt text-indigo-500 text-sm ml-2"></i>
                        <input type="date" id="office-use-start-date" value="${today}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="office-use-end-date" value="${today}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <button onclick="openOfficeUseModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-3">
                        <i class="fa-solid fa-plus-circle text-lg"></i>
                        <span>New Entry</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Ref ID</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Timeline</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Department/Purpose</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Items Count</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-right">Cost Valuation</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody id="office-use-list" class="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

    const searchInput = document.getElementById('office-use-search');
    const startDateInput = document.getElementById('office-use-start-date');
    const endDateInput = document.getElementById('office-use-end-date');

    const updateList = () => renderOfficeUseList(searchInput.value, startDateInput.value, endDateInput.value);
    searchInput.addEventListener('input', updateList);
    startDateInput.addEventListener('change', updateList);
    endDateInput.addEventListener('change', updateList);

    renderOfficeUseList(searchInput.value, startDateInput.value, endDateInput.value);
}

async function renderOfficeUseList(query = '', startDate = '', endDate = '') {
    const tbody = document.getElementById('office-use-list');
    if (!tbody) return;

    let records = await db.sales.where('document_type').equals('office_use').reverse().toArray();

    if (query) {
        const q = query.toLowerCase();
        records = records.filter(r =>
            String(r.id).includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q)) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(q))
        );
    }

    if (startDate || endDate) {
        records = records.filter(r => {
            const recordDate = new Date(r.date).toISOString().split('T')[0];
            if (startDate && endDate) {
                return recordDate >= startDate && recordDate <= endDate;
            }
            if (startDate) return recordDate >= startDate;
            if (endDate) return recordDate <= endDate;
            return true;
        });
    }

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500"><i class="fa-solid fa-building-circle-check text-4xl mb-3 block opacity-20"></i> No office use records found.</td></tr>`;
        return;
    }

    let html = '';
    records.forEach(r => {
        const dateObj = new Date(r.date);
        const time = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const fullTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const costVal = r.items.reduce((sum, item) => sum + (parseFloat(item.cost || 0) * (parseFloat(item.qty) || 0)), 0);

        html += `
            <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all group">
                <td class="p-6">
                    <div class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">OFF-${String(r.id).padStart(4, '0')}</div>
                </td>
                <td class="p-6">
                    <div class="text-[11px] font-black text-gray-900 dark:text-white uppercase">${time}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase opacity-50">${fullTime}</div>
                </td>
                <td class="p-6">
                    <div class="text-xs font-black text-gray-800 dark:text-white uppercase italic tracking-tight">${r.customer_name || 'General Office'}</div>
                    <div class="text-[9px] text-indigo-500 font-bold uppercase tracking-widest opacity-60">${r.notes || 'No Remarks'}</div>
                </td>
                <td class="p-6">
                    <span class="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] px-3 py-1 rounded-full font-black uppercase border border-indigo-100/50 dark:border-indigo-900/50 tracking-widest">${r.items.length} Items</span>
                </td>
                <td class="p-6 text-right">
                    <div class="text-sm font-black text-indigo-600 italic tracking-tight">Rs. ${costVal.toLocaleString()}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase opacity-50">Internal Cost</div>
                </td>
                <td class="p-6">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="viewOfficeUse(${r.id})" class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm" title="Quick View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="printOfficeUse(${r.id})" class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm" title="Print Protocol">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button onclick="deleteOfficeUse(${r.id})" class="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm" title="Reverse Entry">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function openOfficeUseModal() {
    officeUseCart = [];
    const modalHtml = `
        <div id="office-use-modal" class="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-md animate-fade-in">
            <div class="bg-white dark:bg-darkCard w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden m-4">
                <div class="px-8 py-6 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between bg-white dark:bg-darkCard">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <i class="fa-solid fa-building-user text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">New Office Use Entry</h3>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Deduct inventory for internal requirements</p>
                        </div>
                    </div>
                    <button onclick="closeOfficeUseModal()" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center border border-gray-100 dark:border-gray-700 active:scale-95">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <!-- Left: Search & Select -->
                    <div class="w-full lg:w-96 border-r border-gray-100 dark:border-darkBorder flex flex-col bg-gray-50/30 dark:bg-darkBg/20">
                        <div class="p-6 border-b border-gray-100 dark:border-darkBorder bg-white dark:bg-darkCard">
                            <div class="relative group">
                                <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors text-sm"></i>
                                <input type="text" id="ou-prod-search" class="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-indigo-500/5 text-gray-900 dark:text-white transition-all shadow-inner" placeholder="Scan or type item name...">
                            </div>
                        </div>
                        <div id="ou-search-results" class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            <!-- Search results will appear here -->
                            <div class="text-center py-10 opacity-30">
                                <i class="fa-solid fa-barcode text-5xl mb-3 block"></i>
                                <p class="text-[10px] font-black uppercase tracking-widest">Search products above</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Cart & Details -->
                    <div class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-darkCard">
                        <div class="p-6 border-b border-gray-100 dark:border-darkBorder grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Purpose / Department</label>
                                <input type="text" id="ou-purpose" class="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500/30 rounded-xl text-xs font-black text-gray-900 dark:text-white transition-all" placeholder="e.g. IT Department, Showroom Display...">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issued By</label>
                                <input type="text" id="ou-issued-by" class="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-500/30 rounded-xl text-xs font-black text-gray-900 dark:text-white transition-all" value="${currentUser ? currentUser.username : 'Admin'}" readonly>
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Consumable Items</h4>
                            <div id="ou-cart-list" class="space-y-3">
                                <!-- Cart items injected here -->
                                <div class="text-center py-20 opacity-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem]">
                                    <i class="fa-solid fa-cart-plus text-5xl mb-4 block"></i>
                                    <p class="text-sm font-black uppercase tracking-widest">Select items to consume</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-8 border-t border-gray-100 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div class="text-left">
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Internal Valuation</p>
                                <p id="ou-total-cost" class="text-3xl font-black text-indigo-600 tracking-tighter">Rs. 0</p>
                            </div>
                            <button onclick="processOfficeUse()" class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <i class="fa-solid fa-check-double text-lg"></i>
                                <span>Confirm Consumption</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Init Search
    const searchInput = document.getElementById('ou-prod-search');
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) return;

        const products = await db.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            (p.serial_list && p.serial_list.includes(query))
        ).limit(10).toArray();

        const resultsContainer = document.getElementById('ou-search-results');
        if (products.length === 0) {
            resultsContainer.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">No products found</div>';
            return;
        }

        resultsContainer.innerHTML = products.map(p => `
            <div onclick="addToOUCart(${p.id})" class="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-indigo-500/50 cursor-pointer transition-all flex items-center gap-4 group shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <i class="fa-solid fa-box text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">${p.name}</p>
                    <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">${p.sku} • Stock: ${p.stock_qty}</p>
                </div>
                <i class="fa-solid fa-plus text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
        `).join('');
    });
}

function closeOfficeUseModal() {
    const modal = document.getElementById('office-use-modal');
    if (modal) modal.remove();
}

async function addToOUCart(id) {
    const product = await db.products.get(id);
    if (!product) return;

    if (product.stock_qty <= 0) {
        showAlert('Out of Stock', 'Cannot use items that are not in inventory.', 'warning');
        return;
    }

    const existing = officeUseCart.find(item => item.id === id);
    if (existing) {
        if (existing.qty >= product.stock_qty) {
            showAlert('Stock Limit', 'Cannot consume more than available stock.', 'warning');
            return;
        }
        existing.qty++;
    } else {
        officeUseCart.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            cost: product.cost || 0,
            qty: 1,
            max_qty: product.stock_qty,
            serial_list: product.serial_list || [],
            selected_serials: []
        });
    }

    renderOUCart();
}

function renderOUCart() {
    const container = document.getElementById('ou-cart-list');
    if (!container) return;

    if (officeUseCart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 opacity-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem]">
                <i class="fa-solid fa-cart-plus text-5xl mb-4 block"></i>
                <p class="text-sm font-black uppercase tracking-widest">Select items to consume</p>
            </div>`;
        document.getElementById('ou-total-cost').innerText = 'Rs. 0';
        return;
    }

    let total = 0;
    container.innerHTML = officeUseCart.map((item, index) => {
        total += (item.cost * item.qty);
        return `
            <div class="p-5 bg-gray-50/50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-6">
                <div class="flex-1">
                    <p class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">${item.name}</p>
                    <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">${item.sku} • Cost: Rs. ${parseFloat(item.cost).toLocaleString()}</p>
                    ${item.serial_list.length > 0 ? `
                        <div class="mt-2">
                            <label class="text-[8px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Enter Serial Numbers (Comma Separated)</label>
                            <input type="text" onchange="updateOUSerials(${index}, this.value)" class="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-500 transition-all" placeholder="Enter ${item.qty} serials...">
                        </div>
                    ` : ''}
                </div>
                <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <button onclick="updateOUQty(${index}, -1)" class="w-8 h-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 transition-colors flex items-center justify-center"><i class="fa-solid fa-minus text-xs"></i></button>
                    <span class="text-sm font-black text-gray-900 dark:text-white w-8 text-center">${item.qty}</span>
                    <button onclick="updateOUQty(${index}, 1)" class="w-8 h-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 transition-colors flex items-center justify-center"><i class="fa-solid fa-plus text-xs"></i></button>
                </div>
                <div class="text-right min-w-[100px]">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Line Cost</p>
                    <p class="text-sm font-black text-indigo-600 tracking-tight">Rs. ${(item.cost * item.qty).toLocaleString()}</p>
                </div>
                <button onclick="removeFromOUCart(${index})" class="text-red-400 hover:text-red-600 transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');

    document.getElementById('ou-total-cost').innerText = `Rs. ${total.toLocaleString()}`;
}

function updateOUQty(index, change) {
    const item = officeUseCart[index];
    if (!item) return;

    if (item.qty + change > item.max_qty) {
        showAlert('Stock Limit', 'Cannot exceed available stock.', 'warning');
        return;
    }

    item.qty += change;
    if (item.qty <= 0) {
        officeUseCart.splice(index, 1);
    }
    renderOUCart();
}

function removeFromOUCart(index) {
    officeUseCart.splice(index, 1);
    renderOUCart();
}

function updateOUSerials(index, value) {
    const item = officeUseCart[index];
    if (!item) return;
    item.selected_serials = value.split(',').map(s => s.trim()).filter(s => s);
}

async function processOfficeUse() {
    if (officeUseCart.length === 0) {
        showAlert('Empty Cart', 'Please add items for office use.', 'warning');
        return;
    }

    const purpose = document.getElementById('ou-purpose').value.trim();
    if (!purpose) {
        showAlert('Required', 'Please specify the purpose or department.', 'warning');
        return;
    }

    // Validate Serials
    for (const item of officeUseCart) {
        if (item.serial_list.length > 0) {
            if (item.selected_serials.length !== item.qty) {
                showAlert('Serial Error', `Please enter exactly ${item.qty} serials for ${item.name}.`, 'error');
                return;
            }
            // Check if serials exist in product list
            const product = await db.products.get(item.id);
            for (const sn of item.selected_serials) {
                if (!product.serial_list.includes(sn)) {
                    showAlert('Invalid Serial', `Serial "${sn}" not found for ${item.name}.`, 'error');
                    return;
                }
            }
        }
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Confirm Consumption?',
        text: "This will deduct items from stock and record an expense of Rs. " + document.getElementById('ou-total-cost').innerText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Yes, Confirm',
        cancelButtonText: 'Wait'
    });

    if (!isConfirmed) return;

    try {
        await db.transaction('rw', db.products, db.sales, db.ledger, db.accounts, db.expenses, async () => {
            const totalCost = officeUseCart.reduce((sum, item) => sum + (item.cost * item.qty), 0);

            // 1. Record Sale (Internal)
            const recordId = await db.sales.add({
                date: new Date().toISOString(),
                customer_name: purpose,
                items: officeUseCart.map(i => ({
                    product_id: i.id,
                    name: i.name,
                    qty: i.qty,
                    cost: i.cost,
                    price: 0, // No revenue
                    total: 0,
                    subtotal: 0,
                    discount: 0,
                    serial: i.selected_serials.join(', ')
                })),
                total: 0,
                subtotal: 0,
                discount: 0,
                document_type: 'office_use',
                status: 'completed',
                notes: 'Office Use Issued By: ' + document.getElementById('ou-issued-by').value,
                rep_name: currentUser ? currentUser.username : 'Admin'
            });

            // 2. Deduct Stock
            for (const item of officeUseCart) {
                const p = await db.products.get(item.id);
                const remainingSerials = (p.serial_list || []).filter(sn => !item.selected_serials.includes(sn));
                await db.products.update(item.id, {
                    stock_qty: p.stock_qty - item.qty,
                    serial_list: remainingSerials
                });
            }

            // 3. Accounting Entries
            if (typeof recordTransaction === 'function') {
                const accounts = await db.accounts.toArray();
                const getAccId = (code) => accounts.find(a => a.code === code)?.id;

                let expenseAcc = getAccId('5700'); // Office Use Expense
                let cashAcc = getAccId('1000'); // Cash on Hand

                if (!cashAcc) {
                    cashAcc = await db.accounts.add({
                        name: 'Cash on Hand',
                        type: 'Asset',
                        code: '1000'
                    });
                }

                if (!expenseAcc) {
                    expenseAcc = await db.accounts.add({
                        name: 'Office Use Expense',
                        type: 'Expense',
                        code: '5700'
                    });
                }

                if (expenseAcc && cashAcc && totalCost > 0) {
                    await db.expenses.add({
                        date: new Date().toISOString(),
                        category: 'Office Use',
                        account_id: expenseAcc,
                        amount: totalCost,
                        description: `Office Use: ${purpose}`,
                        payment_method: 'cash',
                        office_use_id: recordId
                    });

                    // Debit Office Use Expense
                    await recordTransaction(expenseAcc, totalCost, 'debit', `Office Use: ${purpose} (Ref #${recordId})`, 'OfficeUse', recordId);
                    // Credit Cash on Hand so office use reduces cash in hand
                    await recordTransaction(cashAcc, totalCost, 'credit', `Office Use Payment (Ref #${recordId})`, 'OfficeUse', recordId);
                }
            }
        });

        showAlert('Success', 'Inventory consumption recorded and expense posted.', 'success');
        closeOfficeUseModal();
        renderOfficeUseList();

    } catch (err) {
        console.error(err);
        showAlert('Process Error', 'Failed to complete transaction: ' + err.message, 'error');
    }
}

async function viewOfficeUse(id) {
    const record = await db.sales.get(id);
    if (!record) return;

    const itemsHtml = record.items.map(i => `
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex justify-between items-center mb-2">
            <div>
                <p class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">${i.name}</p>
                <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Qty: ${i.qty} • S/N: ${i.serial || 'N/A'}</p>
            </div>
            <div class="text-right">
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Est. Cost</p>
                <p class="text-xs font-black text-indigo-600">Rs. ${(parseFloat(i.cost || 0) * i.qty).toLocaleString()}</p>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: 'Office Use Record: OFF-' + String(id).padStart(4, '0'),
        html: `
            <div class="text-left mt-4">
                <div class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                    <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Purpose/Department</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white uppercase">${record.customer_name}</p>
                    <p class="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest italic opacity-70">${record.notes}</p>
                </div>
                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Issued Items</h4>
                <div class="max-h-[300px] overflow-y-auto custom-scrollbar">
                    ${itemsHtml}
                </div>
            </div>
        `,
        width: '500px',
        confirmButtonText: 'Close',
        confirmButtonColor: '#6366f1',
        customClass: {
            popup: 'rounded-[2.5rem] dark:bg-darkCard',
            title: 'font-black uppercase tracking-tight'
        }
    });
}

async function deleteOfficeUse(id) {
    const record = await db.sales.get(id);
    if (!record) return;

    const { isConfirmed } = await Swal.fire({
        title: 'Reverse this entry?',
        text: "This will delete the record and restore the items to inventory. Accounting entries will be reversed.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Reverse',
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
        await db.transaction('rw', db.sales, db.products, db.ledger, db.expenses, async () => {
            // Restore Stock
            for (const item of record.items) {
                if (!item.product_id) continue;
                const p = await db.products.get(item.product_id);
                if (p) {
                    let newSerialList = [...(p.serial_list || [])];
                    const recordSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
                    recordSerials.forEach(sn => {
                        if (!newSerialList.includes(sn)) newSerialList.push(sn);
                    });

                    await db.products.update(item.product_id, {
                        stock_qty: p.stock_qty + item.qty,
                        serial_list: newSerialList
                    });
                }
            }

            // Delete Record
            await db.sales.delete(id);
            // Delete Ledger
            await db.ledger.where({ reference_id: id, reference_type: 'OfficeUse' }).delete();
            // Delete linked Office Use expense record
            await db.expenses.where('office_use_id').equals(id).delete();
        });

        showAlert('Reversed', 'Stock restored and record deleted.', 'success');
        renderOfficeUseList();

    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to reverse entry: ' + err.message, 'error');
    }
}

async function printOfficeUse(id) {
    const record = await db.sales.get(id);
    if (!record) return;

    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const dateStr = new Date(record.date).toLocaleString();

    let itemsHtml = '';
    record.items.forEach((item, idx) => {
        itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-size: 12px;">${idx + 1}</td>
                <td style="padding: 10px; font-size: 12px;">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 10px; color: #666;">${item.sku}</div>
                    ${item.serial ? `<div style="font-size: 10px; color: #444; margin-top: 4px;">S/N: ${item.serial}</div>` : ''}
                </td>
                <td align="center" style="padding: 10px; font-size: 12px;">${item.qty}</td>
                <td align="right" style="padding: 10px; font-size: 12px;">Rs. ${parseFloat(item.cost || 0).toLocaleString()}</td>
                <td align="right" style="padding: 10px; font-size: 12px; font-weight: bold;">Rs. ${(parseFloat(item.cost || 0) * item.qty).toLocaleString()}</td>
            </tr>
        `;
    });

    const totalCost = record.items.reduce((sum, i) => sum + (parseFloat(i.cost || 0) * i.qty), 0);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Consumption Note - OFF-${String(record.id).padStart(4, '0')}</title>
            <style>
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; }
                    .page { box-shadow: none !important; margin: 0 !important; }
                }
                html, body { margin: 0; padding: 0; width: 100%; background: #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif; }
                .page { background: #fff; width: 210mm; min-height: 297mm; margin: 10mm auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 15mm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
            </style>
        </head>
        <body style="margin: 0;">
            <div class="page">
                <div style="flex: 1 0 auto; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
                        <div>
                            <h1 style="margin: 0; color: #4f46e5; font-size: 28px; font-weight: 900; text-transform: uppercase;">INTERNAL CONSUMPTION</h1>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #666; font-weight: bold; letter-spacing: 2px;">OFFICE USE PROTOCOL</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-size: 14px; font-weight: bold;">REF: OFF-${String(record.id).padStart(4, '0')}</p>
                            <p style="margin: 5px 0 0; font-size: 12px; color: #666;">${dateStr}</p>
                        </div>
                    </div>

                    <div style="background: #f8fafc; border-radius: 20px; padding: 25px; margin-bottom: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Purpose / Department</p>
                            <p style="margin: 0; font-size: 14px; font-weight: bold;">${record.customer_name}</p>
                        </div>
                        <div>
                            <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Issued By</p>
                            <p style="margin: 0; font-size: 14px; font-weight: bold;">${record.notes.replace('Office Use Issued By: ', '')}</p>
                        </div>
                    </div>

                    <table width="100%" style="border-collapse: collapse; margin-bottom: 40px;">
                        <thead>
                            <tr style="background: #4f46e5; color: white;">
                                <th align="left" style="padding: 12px; font-size: 10px; text-transform: uppercase; border-top-left-radius: 10px;">#</th>
                                <th align="left" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Description</th>
                                <th align="center" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Qty</th>
                                <th align="right" style="padding: 12px; font-size: 10px; text-transform: uppercase;">Unit Cost</th>
                                <th align="right" style="padding: 12px; font-size: 10px; text-transform: uppercase; border-top-right-radius: 10px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div style="margin-left: auto; width: 300px;">
                        <div style="display: flex; justify-content: space-between; padding: 15px; border-top: 2px solid #4f46e5;">
                            <span style="font-size: 12px; font-weight: 900; color: #666; text-transform: uppercase;">Total Valuation</span>
                            <span style="font-size: 16px; font-weight: 900; color: #4f46e5;">Rs. ${totalCost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="page-bottom" style="flex-shrink: 0; margin-top: auto;">
                    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center;">
                        <div>
                            <div style="border-bottom: 1px solid #333; margin-bottom: 10px; height: 40px;"></div>
                            <p style="margin: 0; font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase;">Issued Signature</p>
                        </div>
                        <div>
                            <div style="border-bottom: 1px solid #333; margin-bottom: 10px; height: 40px;"></div>
                            <p style="margin: 0; font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase;">Receiver Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    openPreviewModal(html, () => {
        const iframe = document.getElementById('preview-iframe');
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    });
}
