// Returns and RMAs
async function loadReturns() {
    console.log("Loading Returns view...");
    const container = document.getElementById('returns-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-gray-100 dark:border-darkBorder flex flex-col h-full overflow-hidden">
            <div class="p-8 lg:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/20 dark:bg-darkBg/20 relative">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
                        <i class="fa-solid fa-rotate-left text-primary"></i> Returns Journal
                    </h2>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] opacity-70">Log and manage product reversals and credit notes</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="returns-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="returns-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative group">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-sm"></i>
                        <input type="text" id="returns-search" class="pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-transparent focus:border-primary/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/5 text-gray-900 dark:text-white w-full md:w-64 transition-all shadow-sm" placeholder="Ref ID, Invoice ID...">
                    </div>
                    <button onclick="openReturnModal('return')" class="bg-primary hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
                        <i class="fa-solid fa-plus-circle"></i>
                        <span>New Return</span>
                    </button>
                </div>
            </div>
            <div id="returns-summary-container" class="px-8 py-4 bg-gray-50/50 dark:bg-darkBg/20 border-b border-gray-100 dark:border-darkBorder">
                <!-- Summary Stats will be injected here -->
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Return Key</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Linked Invoice</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Stakeholder</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Process Status</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody id="returns-list" class="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

    const refreshReturns = () => {
        const query = document.getElementById('returns-search').value;
        const start = document.getElementById('returns-start-date').value;
        const end = document.getElementById('returns-end-date').value;
        renderReturnsList(query, 'return', start, end);
    };

    document.getElementById('returns-search').addEventListener('input', refreshReturns);
    document.getElementById('returns-start-date').addEventListener('change', refreshReturns);
    document.getElementById('returns-end-date').addEventListener('change', refreshReturns);

    renderReturnsList('', 'return', firstDay, lastDay);
}

async function renderReturnsList(query = '', type = 'return', startDate = null, endDate = null) {
    const listId = type === 'return' ? 'returns-list' : 'rma-list';
    const tbody = document.getElementById(listId);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="p-12 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-primary opacity-40"></i></td></tr>`;

    let records = [];
    try {
        let collection = db.returns.orderBy('id').reverse();
        records = await collection.toArray();

        // RBAC: Standard users only see returns they processed
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
        if (!isAdmin) {
            records = records.filter(r => r.rep_name === currentUser.username);
        }

        // Date Filter
        if (startDate && endDate) {
            const startISO = new Date(startDate + 'T00:00:00').toISOString();
            const endISO = new Date(endDate + 'T23:59:59').toISOString();
            records = records.filter(r => r.date >= startISO && r.date <= endISO);
        }

        // Filter by type
        if (type === 'return') {
            records = records.filter(r => r.return_type !== 'rma');
        } else {
            records = records.filter(r => r.return_type === 'rma');
        }

    } catch (err) {
        console.error("Returns Load Error:", err);
        records = [];
    }

    if (query) {
        const q = query.toLowerCase();
        records = records.filter(r =>
            String(r.id).toLowerCase().includes(q) ||
            String(r.invoice_id).toLowerCase().includes(q) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
            (r.serials && r.serials.toLowerCase().includes(q))
        );
    }

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-12 text-center text-gray-400 font-bold uppercase tracking-widest opacity-40">
            <i class="fa-solid fa-ghost text-4xl mb-4 block"></i> No records found
        </td></tr>`;
        return;
    }

    // Attach invoice display number
    const saleIds = [...new Set(records.map(r => r.invoice_id).filter(id => id))];
    const linkedSales = await db.sales.where('id').anyOf(saleIds).toArray();
    records.forEach(r => {
        const sale = linkedSales.find(s => s.id === r.invoice_id);
        if (sale) r.invoice_display = getInvoiceDisplayNumber(sale);
    });

    let html = '';
    records.forEach(r => {
        const dateObj = new Date(r.date);
        const time = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const fullTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const prefix = type === 'return' ? 'RET' : 'RMA';

        let statusColor = 'gray';
        if (r.status === 'Completed') statusColor = 'emerald';
        else if (r.status === 'Rejected') statusColor = 'red';
        else if (r.status === 'Item Received') statusColor = 'blue';

        const statusBadge = `<span class="bg-${statusColor}-50 text-${statusColor}-600 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400 text-[9px] px-3 py-1 rounded-full font-black uppercase border border-${statusColor}-100/50 dark:border-${statusColor}-900/50 tracking-widest">${r.status || 'Pending'}</span>`;

        html += `
            <tr class="group hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="p-8">
                    <div class="flex flex-col">
                        <span class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">${prefix}-${String(r.id).padStart(5, '0')}</span>
                        <span class="text-[9px] text-gray-400 font-bold uppercase opacity-50 tracking-tighter">${time} @ ${fullTime}</span>
                    </div>
                </td>
                <td class="p-8">
                    <div class="flex flex-col">
                        <span class="text-xs font-black text-primary uppercase italic tracking-tight">${r.invoice_display || ('INV-M' + String(r.invoice_id || 0).padStart(4, '0'))}</span>
                        <span class="text-[9px] text-gray-900 dark:text-white uppercase font-black truncate w-40">${r.item_name || 'Generic Product'}</span>
                        ${r.serials ? `<span class="text-[8px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 mt-1 truncate w-40 block">SN: ${r.serials}</span>` : ''}
                    </div>
                </td>
                <td class="p-8 font-black text-xs text-gray-800 dark:text-white uppercase italic tracking-tight">
                    ${r.customer_name || 'Walk-in Client'}
                </td>
                <td class="p-8">${statusBadge}</td>
                <td class="p-8">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="printReturn(${r.id}, true, true)" class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Inspect">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="editReturn(${r.id}, '${type}')" class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Process Status">
                            <i class="fa-solid fa-pen-nib"></i>
                        </button>
                        <button onclick="deleteReturn(${r.id}, '${type}')" class="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Purge Record">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Render Summary Section
    renderRealTimeReturnsSummary(records);
}

/**
 * Renders a real-time summary of the filtered returns records
 */
function renderRealTimeReturnsSummary(data) {
    const isRma = document.getElementById('rma-view') && document.getElementById('rma-view').classList.contains('active');
    const summaryId = isRma ? 'rma-summary-container' : 'returns-summary-container';
    const container = document.getElementById(summaryId);
    if (!container) return;

    const count = data.length;
    // Note: returns records don't directly have a 'total' field in the same way as sales, 
    // but they have qty and we can linked them to invoice items.
    // However, looking at the code, it seems they don't store the refund value directly in the returns store.
    // Wait, let's check processItemReturn in returns.js again.

    let estimatedRefundVal = 0;
    // Since we don't have the price in the return record directly (it's in the sales item),
    // and fetching all prices here would be async and complex, 
    // let's see if we can get it from the record if I add it or if it exists.

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex flex-col">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Returns</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                        <i class="fa-solid fa-rotate-left"></i>
                    </div>
                    <span class="text-lg font-black text-gray-900 dark:text-white tracking-tighter">${count}</span>
                </div>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 text-xs">
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                    <span class="text-lg font-black text-emerald-600 tracking-tighter">${data.filter(r => r.status === 'Completed').length}</span>
                </div>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">In Process</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 text-xs">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </div>
                    <span class="text-lg font-black text-amber-600 tracking-tighter">${data.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length}</span>
                </div>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Rejected</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 text-xs">
                        <i class="fa-solid fa-ban"></i>
                    </div>
                    <span class="text-lg font-black text-red-600 tracking-tighter">${data.filter(r => r.status === 'Rejected').length}</span>
                </div>
            </div>
        </div>
    `;
}

// Wizard Management
let currentReturnWizardType = 'return';
let currentReturnSale = null;

function openReturnModal(type = 'return') {
    currentReturnWizardType = type;
    const modal = document.getElementById('return-modal');
    const title = document.getElementById('return-modal-title');
    const finalizeBtn = document.getElementById('finalize-return-btn');
    const headerRef = document.getElementById('return-header-ref');

    if (!modal) return;

    title.textContent = type === 'return' ? 'Return Logistics' : 'RMA Logistics Master';
    headerRef.textContent = type === 'return' ? 'NEW RETURN' : 'NEW RMA';
    modal.classList.remove('hidden');

    // Header date
    const dateEl = document.getElementById('return-header-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    resetReturnWizard();

    // Auto trigger search logic with dropdown suggestions
    const searchInput = document.getElementById('return-invoice-search');
    if (searchInput) {
        searchInput.oninput = () => {
            const val = searchInput.value.trim();
            if (val.length >= 1) {
                if (window.returnSearchTimeout) clearTimeout(window.returnSearchTimeout);
                window.returnSearchTimeout = setTimeout(() => showReturnSearchDropdown(), 300);
            } else {
                hideReturnSearchDropdown();
            }
        };
        searchInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchInvoiceForReturn();
            } else if (e.key === 'Escape') {
                hideReturnSearchDropdown();
            }
        };
        searchInput.onfocus = () => {
            if (searchInput.value.trim().length >= 1) {
                showReturnSearchDropdown();
            }
        };

        // Close dropdown when clicking outside
        if (!window.returnSearchOutsideHandlerAdded) {
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('return-search-dropdown');
                if (dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                    hideReturnSearchDropdown();
                }
            });
            window.returnSearchOutsideHandlerAdded = true;
        }
    }
}

function closeReturnModal() {
    const modal = document.getElementById('return-modal');
    if (modal) modal.classList.add('hidden');
    hideReturnSearchDropdown();
    currentReturnSale = null;
}

function resetReturnWizard() {
    document.getElementById('return-step-1').classList.remove('hidden');
    document.getElementById('return-step-2').classList.add('hidden');
    document.getElementById('return-invoice-search').value = '';
    document.getElementById('return-search-error').classList.add('hidden');
    document.getElementById('finalize-return-btn').style.display = 'none';
    document.getElementById('return-header-ref').textContent = currentReturnWizardType === 'return' ? 'NEW RETURN' : 'NEW RMA';
    document.getElementById('return-settlement-section')?.classList.add('hidden');
    document.getElementById('return-settlement-cash-options')?.classList.add('hidden');
    document.getElementById('return-settlement-credit-note')?.classList.add('hidden');
    document.getElementById('return-bank-account-row')?.classList.add('hidden');
    hideReturnSearchDropdown();
}

async function searchInvoiceForReturn() {
    let invId = document.getElementById('return-invoice-search').value.trim();
    const errorEl = document.getElementById('return-search-error');

    if (!invId) {
        errorEl.textContent = "Please enter an ID";
        errorEl.classList.remove('hidden');
        return;
    }

    let sale = null;
    let isWebOrder = false;

    if (invId.toUpperCase().startsWith('W-')) {
        const wooId = parseInt(invId.toUpperCase().replace('W-', ''));
        if (!isNaN(wooId)) {
            sale = await db.sales.where('woo_order_id').equals(wooId).first();
            isWebOrder = true;
        }
    } else if (!isNaN(invId)) {
        sale = await db.sales.get(parseInt(invId));
    }

    // NEW: Search by Serial Number if not found by ID
    if (!sale) {
        // Search through sales where items contain the serial
        const allSales = await db.sales.toArray();
        sale = allSales.find(s =>
            s.items && s.items.some(item =>
                item.serial && item.serial.split(/[\n,]+/).map(sn => sn.trim().toLowerCase()).includes(invId.toLowerCase())
            )
        );
        if (sale && sale.document_type === 'web_order') isWebOrder = true;
    }

    if (!sale || (sale.document_type === 'quote')) {
        errorEl.textContent = "Record not found (Checked ID & Serial Number).";
        errorEl.classList.remove('hidden');
        return;
    }

    hideReturnSearchDropdown();
    selectReturnInvoice(sale);
}

async function showReturnSearchDropdown() {
    const searchInput = document.getElementById('return-invoice-search');
    const dropdown = document.getElementById('return-search-dropdown');
    const errorEl = document.getElementById('return-search-error');

    if (!searchInput || !dropdown) return;

    const query = searchInput.value.trim();
    if (!query) {
        hideReturnSearchDropdown();
        return;
    }

    errorEl.classList.add('hidden');

    try {
        let results = [];
        const allSales = await db.sales.toArray();

        // Filter out quotes and get only valid sales
        const validSales = allSales.filter(s => s.document_type !== 'quote');

        const queryLower = query.toLowerCase();

        // Search by Invoice ID, Customer Name, or Serial Number
        results = validSales.filter(s => {
            const invNum = String(s.id);
            const custName = (s.customer_name || '').toLowerCase();
            const wooId = s.woo_order_id ? `w-${s.woo_order_id}` : '';

            // Match invoice ID
            if (invNum.includes(query) || wooId.toLowerCase().includes(queryLower)) {
                return true;
            }

            // Match customer name
            if (custName.includes(queryLower)) {
                return true;
            }

            // Match serial numbers in items
            if (s.items && s.items.some(item =>
                item.serial && item.serial.split(/[\n,]+/).map(sn => sn.trim().toLowerCase()).includes(queryLower)
            )) {
                return true;
            }

            return false;
        }).slice(0, 10); // Limit to 10 results

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="px-6 py-8 text-center text-gray-400">
                    <i class="fa-solid fa-magnifying-glass text-3xl mb-3 block opacity-30"></i>
                    <p class="text-xs font-black uppercase tracking-widest">No invoices found</p>
                </div>
            `;
            dropdown.classList.remove('hidden');
            return;
        }

        let html = '';
        results.forEach(sale => {
            const invDisplay = getInvoiceDisplayNumber(sale);
            const custName = sale.customer_name || 'Walk-in Customer';
            const dateStr = new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const totalStr = `Rs. ${parseFloat(sale.total).toLocaleString()}`;

            html += `
                <div onclick="selectReturnInvoice(${sale.id})" class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-all group">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-black text-primary uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">${invDisplay}</p>
                            <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${custName}</p>
                            <p class="text-[10px] text-gray-400 mt-1">${dateStr} • ${totalStr}</p>
                        </div>
                        <div class="shrink-0">
                            <i class="fa-solid fa-arrow-right text-gray-300 group-hover:text-primary transition-colors"></i>
                        </div>
                    </div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.classList.remove('hidden');
    } catch (err) {
        console.error("Return search dropdown error:", err);
        dropdown.innerHTML = `<div class="px-6 py-4 text-xs text-red-500">Error searching invoices</div>`;
        dropdown.classList.remove('hidden');
    }
}

function hideReturnSearchDropdown() {
    const dropdown = document.getElementById('return-search-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

function handleReturnSettlementMethodChange() {
    const selectedMethod = document.querySelector('input[name="return-settlement-method"]:checked')?.value;
    const bankRow = document.getElementById('return-bank-account-row');
    if (bankRow) {
        bankRow.classList.toggle('hidden', selectedMethod !== 'bank');
    }
}

async function loadReturnBankAccounts() {
    const bankSelect = document.getElementById('return-bank-account');
    if (!bankSelect) return;
    const bankAccounts = await db.bank_accounts.toArray();
    if (!bankAccounts || bankAccounts.length === 0) {
        bankSelect.innerHTML = `<option value="">No bank accounts available</option>`;
        return;
    }
    bankSelect.innerHTML = bankAccounts.map(acc => `
        <option value="${acc.id}">${acc.name}${acc.bank_name ? ` (${acc.bank_name})` : ''} - Rs. ${parseFloat(acc.balance || 0).toLocaleString()}</option>
    `).join('');
}

function updateReturnSettlementUI(sale) {
    const section = document.getElementById('return-settlement-section');
    const cashOptions = document.getElementById('return-settlement-cash-options');
    const creditNote = document.getElementById('return-settlement-credit-note');
    const creditAmount = document.getElementById('return-credit-note-amount');
    const bankRow = document.getElementById('return-bank-account-row');
    if (!section || !cashOptions || !creditNote) return;

    section.classList.remove('hidden');
    cashOptions.classList.add('hidden');
    creditNote.classList.add('hidden');
    if (bankRow) bankRow.classList.add('hidden');

    if (sale.payment_type === 'cash') {
        cashOptions.classList.remove('hidden');
        const cashInput = document.querySelector('input[name="return-settlement-method"][value="cash"]');
        if (cashInput) cashInput.checked = true;
        handleReturnSettlementMethodChange();
        loadReturnBankAccounts();
    } else if (sale.payment_type === 'credit') {
        if (creditAmount) {
            creditAmount.textContent = `Rs. ${parseFloat(sale.total || 0).toLocaleString()}`;
        }
        creditNote.classList.remove('hidden');
    } else {
        cashOptions.classList.remove('hidden');
        handleReturnSettlementMethodChange();
        loadReturnBankAccounts();
    }
}

async function selectReturnInvoice(saleId) {
    const sale = typeof saleId === 'object' ? saleId : await db.sales.get(parseInt(saleId));

    if (!sale) {
        const errorEl = document.getElementById('return-search-error');
        if (errorEl) {
            errorEl.textContent = "Invoice not found";
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const searchInput = document.getElementById('return-invoice-search');
    if (searchInput) {
        searchInput.value = getInvoiceDisplayNumber(sale);
    }

    hideReturnSearchDropdown();

    currentReturnSale = sale;

    // Transition to Step 2
    document.getElementById('return-step-1').classList.add('hidden');
    document.getElementById('return-step-2').classList.remove('hidden');
    // document.getElementById('finalize-return-btn').style.display = 'flex'; // Optional: Use for bulk return if implemented

    const refTag = getInvoiceDisplayNumber(sale);
    document.getElementById('return-header-ref').textContent = refTag;

    document.getElementById('return-inv-customer').textContent = sale.customer_name || 'Walk-in Customer';
    document.getElementById('return-inv-date').textContent = new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('return-inv-total').textContent = `Rs. ${parseFloat(sale.total).toLocaleString()}`;

    renderInvoiceItemsForReturn(sale);
    updateReturnSettlementUI(sale);
}


function renderInvoiceItemsForReturn(sale) {
    const tbody = document.getElementById('return-items-list');
    tbody.innerHTML = '';

    (sale.items || []).forEach((item, index) => {
        // Parse serials if they exist
        const serials = item.serial ? item.serial.split(',').map(s => s.trim()).filter(s => s) : [];
        const hasSerials = serials.length > 0;

        const row = document.createElement('div');
        row.className = "group border-b border-gray-50 dark:border-gray-800 last:border-0";

        let serialHtml = '';
        if (hasSerials) {
            serialHtml = `
                <div class="mt-4 p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-microchip text-primary"></i> Tracked Serials <span class="lowercase">(Select to Return)</span>
                    </p>
                    <div class="flex flex-wrap gap-2">
                        ${serials.map((s, i) => `
                            <label class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-primary transition-all group">
                                <input type="checkbox" name="return-serial-${index}" value="${s}" checked class="w-4 h-4 rounded accent-primary">
                                <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">${s}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        row.innerHTML = `
            <div class="p-8 flex flex-col">
                <div class="flex items-center justify-between">
                    <div class="flex-1 cursor-pointer group/item" onclick="previewReturnSerials(${index})">
                        <h5 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic group-hover/item:text-primary transition-colors">${item.name}</h5>
                        <p class="text-[10px] text-gray-400 font-mono mt-0.5 opacity-60">${item.sku || 'NO SKU'}</p>
                        <div id="return-extra-serials-${index}" class="mt-2 flex flex-wrap gap-1">
                            ${item.serial ? item.serial.split(',').map(s => `<span class="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">${s.trim()}</span>`).join('') : '<span class="text-[9px] text-gray-400 italic">Click to view/manage serials</span>'}
                        </div>
                    </div>
                    <div class="flex items-center gap-12">
                        <div class="w-20 text-center font-black text-gray-900 dark:text-white text-sm opacity-40">${item.qty}</div>
                        <div class="w-32 flex justify-center">
                            <input type="number" id="return-qty-${index}" value="${item.qty}" min="1" max="${item.qty}"
                                class="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-center text-xs font-black outline-none transition-all">
                        </div>
                        <div class="w-32 flex justify-center">
                            <input type="number" id="return-price-${index}" value="${item.price || item.cart_price || 0}"
                                class="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-center text-xs font-black outline-none transition-all">
                        </div>
                        <div class="w-32 flex justify-center">
                            <input type="number" id="return-discount-${index}" value="0"
                                class="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-xl text-center text-xs font-black outline-none transition-all" placeholder="Disc">
                        </div>
                        <button onclick="processItemReturn(${sale.id}, ${index})" 
                            class="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap">
                            <i class="fa-solid fa-rotate-left"></i>
                            Process
                        </button>
                    </div>
                </div>
                ${serialHtml}
            </div>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Preview serial numbers for a return item
 */
async function previewReturnSerials(index) {
    if (!currentReturnSale || !currentReturnSale.items[index]) return;
    const item = currentReturnSale.items[index];
    const serials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);

    let serialsHtml = '';
    if (serials.length === 0) {
        serialsHtml = `
            <div class="py-12 text-center bg-gray-50 dark:bg-gray-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <i class="fa-solid fa-barcode text-gray-200 dark:text-gray-700 text-5xl mb-3"></i>
                <p class="text-xs text-gray-400 font-bold uppercase tracking-widest">No serials enrolled</p>
            </div>
        `;
    } else {
        serialsHtml = `
            <div class="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto px-1 custom-scrollbar">
                ${serials.map(sn => `
                    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl hover:border-primary transition-all group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                <i class="fa-solid fa-barcode text-xl"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sale Serial</p>
                                <p class="text-sm font-black text-gray-900 dark:text-white font-mono break-all">${sn}</p>
                            </div>
                        </div>
                        <button onclick="Swal.close(); showWarrantyDetail('${sn.replace(/'/g, "\\'")}')" class="w-12 h-12 rounded-2xl bg-primary/5 dark:bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-inner" title="Serial Intelligence">
                            <i class="fa-solid fa-fingerprint text-xl"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    Swal.fire({
        title: 'Return Logistics Preview',
        html: `
            <div class="text-left space-y-8">
                <div class="flex items-center gap-4 p-5 bg-amber-500/10 rounded-3xl border-2 border-amber-500/20">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <i class="fa-solid fa-rotate-left text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Return Entity</p>
                        <h4 class="text-base font-black text-gray-900 dark:text-white truncate uppercase italic tracking-tighter">${item.name}</h4>
                    </div>
                </div>
                
                <div>
                    <div class="flex items-center justify-between mb-4 px-1">
                        <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Associated Tracking Codes (${serials.length})</h5>
                    </div>
                    ${serialsHtml}
                </div>
            </div>
        `,
        showCancelButton: true,
        cancelButtonText: 'CLOSE',
        showConfirmButton: true,
        confirmButtonText: '<i class="fa-solid fa-pen-to-square mr-2"></i> EDIT SERIALS',
        confirmButtonColor: '#0e3257',
        customClass: {
            container: 'premium-swal-container',
            popup: 'premium-swal-popup rounded-[3rem]',
            title: 'premium-swal-title text-2xl font-black italic tracking-tighter uppercase',
            htmlContainer: 'premium-swal-html text-left',
            confirmButton: 'premium-swal-confirm px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95',
            cancelButton: 'premium-swal-cancel px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            promptReturnSerials(index, item.serial);
        }
    });
}

async function promptReturnSerials(index, currentSerials) {
    const { value: serials } = await Swal.fire({
        title: 'Return Serial Numbers',
        input: 'textarea',
        inputLabel: 'Edit or add serial numbers for this return item',
        inputValue: currentSerials || '',
        placeholder: 'SN123, SN456...',
        showCancelButton: true,
        confirmButtonColor: '#0e3257'
    });

    if (serials !== undefined) {
        const cleaned = serials.split(/[\n,]+/).map(s => s.trim()).filter(s => s).join(', ');
        if (currentReturnSale && currentReturnSale.items[index]) {
            currentReturnSale.items[index].serial = cleaned;
            renderInvoiceItemsForReturn(currentReturnSale);
        }
    }
}

async function processItemReturn(invoiceId, itemIndex) {
    const sale = await db.sales.get(invoiceId);
    if (!sale) return;

    const item = sale.items[itemIndex];
    const type = currentReturnWizardType;
    const returnQtyInput = document.getElementById(`return-qty-${itemIndex}`);
    const returnQty = parseInt(returnQtyInput ? returnQtyInput.value : item.qty);

    // Reason from sidebar or prompt
    const globalReason = document.getElementById('return-reason-input') ? document.getElementById('return-reason-input').value.trim() : "";
    const reason = globalReason || prompt(`Reason for ${type.toUpperCase()}?`, "Defective / Customer Choice");
    if (reason === null) return;

    // Capture selected serials
    const serialCheckboxes = document.querySelectorAll(`input[name="return-serial-${itemIndex}"]:checked`);
    let selectedSerials = Array.from(serialCheckboxes).map(cb => cb.value);

    // Capture original serials from item record
    const originalSerials = item.serial ? item.serial.split(',').map(s => s.trim()).filter(s => s) : [];

    // Also include any serials manually added/edited in the description
    const manualSerials = item.serial ? item.serial.split(',').map(s => s.trim()).filter(s => s) : [];

    // If user used the description click to manage serials and no checkboxes exist (e.g. manual item), reconcile them.
    if (originalSerials.length === 0 && manualSerials.length > 0) {
        selectedSerials = manualSerials;
    }

    // Validation: If warranty item, must have serial number
    const isWarrantyItem = item.warranty && !['No Warranty', 'N/A', 'none', 'N/a', 'no warranty'].includes(item.warranty.toLowerCase().trim());

    if (isWarrantyItem && selectedSerials.length === 0 && returnQty > 0) {
        showAlert('Serial Required', `This is a warranty item (${item.warranty}). A serial number is mandatory to complete the return.`, 'error');
        return;
    }

    // Validation: If item had serials, must select at least some if returnQty > 0
    if (originalSerials.length > 0 && selectedSerials.length === 0 && returnQty > 0) {
        showAlert('Serial Required', 'Please select at least one serial number to return for tracked items.', 'warning');
        return;
    }

    // Sanity check: selected serials count should match/be less than return qty
    if (selectedSerials.length > returnQty) {
        showAlert('Logistics Conflict', `You have selected ${selectedSerials.length} serials but specified a return quantity of ${returnQty}.`, 'error');
        return;
    }

    const selectedSettlement = document.querySelector('input[name="return-settlement-method"]:checked')?.value || 'cash';
    const selectedBankId = document.getElementById('return-bank-account')?.value;
    if (sale.payment_type === 'cash' && selectedSettlement === 'bank' && !selectedBankId) {
        showAlert('Refund Account Required', 'Please select a bank account for the bank transfer refund.', 'warning');
        return;
    }

    try {
        await db.transaction('rw', db.returns, db.products, db.accounts, db.ledger, async () => {
            const priceInput = document.getElementById(`return-price-${itemIndex}`);
            const discInput = document.getElementById(`return-discount-${itemIndex}`);
            const returnPrice = parseFloat(priceInput ? priceInput.value : (item.price || item.cart_price || 0));
            const itemDiscount = parseFloat(discInput ? discInput.value : 0);
            const refundValue = (returnPrice * returnQty) - itemDiscount;

            await db.returns.add({
                date: new Date().toISOString(),
                invoice_id: invoiceId,
                item_name: item.name,
                item_sku: item.sku,
                qty: returnQty,
                price: returnPrice,
                discount: itemDiscount,
                refund_amount: refundValue,
                serials: selectedSerials.join(', '),
                status: type === 'return' ? 'Item Received' : 'Under Investigation',
                return_type: type,
                customer_id: sale.customer_id,
                customer_name: sale.customer_name || 'Walk-in Customer',
                reason: reason,
                rep_name: currentUser.username
            });

            const autoRestock = document.getElementById('return-auto-stock')?.checked;

            // Automatic Stock Update: Only if it's a standard return (non-RMA) and auto-restock is checked
            if (type === 'return' && autoRestock) {
                let prod = null;
                if (item.product_id) {
                    prod = await db.products.get(item.product_id);
                } else if (item.sku) {
                    prod = await db.products.where('sku').equals(item.sku).first();
                }

                if (prod) {
                    const newQty = (prod.stock_qty || 0) + returnQty;
                    let newSerialList = [...(prod.serial_list || [])];

                    // Add back newly returned serials if they are not already there
                    selectedSerials.forEach(sn => {
                        if (!newSerialList.includes(sn)) {
                            newSerialList.push(sn);
                        }
                    });

                    await db.products.update(prod.id, {
                        stock_qty: newQty,
                        serial_list: newSerialList
                    });
                }
            }

            // --- ACCOUNTING INTEGRATION ---
            // Record returns to a dedicated Sales Returns / Allowance account (Expense) so they
            // don't inflate Sales (Income). Create the account if it doesn't exist.
            if (typeof recordTransaction === 'function' && refundValue > 0) {
                const accounts = await db.accounts.toArray();
                const getAccId = (code) => accounts.find(a => a.code === code)?.id;
                const cashAccId = getAccId('1000');
                const bankAccId = getAccId('1010');
                const arAccId = getAccId('1200');

                // Look for an existing Sales Returns / Allowances account (by code or name)
                let salesReturnAcc = accounts.find(a => String(a.code) === '4110' || /sales\s*return/i.test(a.name || ''));
                let salesReturnAccId = salesReturnAcc ? salesReturnAcc.id : null;

                // If not found, create a new Expense account for Sales Returns
                if (!salesReturnAccId) {
                    try {
                        salesReturnAccId = await db.accounts.add({ name: 'Sales Returns / Allowances', type: 'Expense', code: '4110' });
                    } catch (e) {
                        // fallback: if account creation fails, use Sales Income (4000) to avoid losing the ledger entry
                        salesReturnAccId = getAccId('4000');
                    }
                }

                // Debit Sales Returns (Expense) to record the refund effect on profit
                if (salesReturnAccId) {
                    await recordTransaction(salesReturnAccId, refundValue, 'debit', `Sales Return: ${item.name} (#INV-M${String(invoiceId).padStart(4, '0')})`, 'Return', invoiceId);
                }

                // Determine which account to credit (cash/bank/receivable) when refunding
                let creditAccId = arAccId;
                if (sale.payment_type === 'cash') {
                    creditAccId = selectedSettlement === 'bank' ? bankAccId : cashAccId;
                } else if (sale.payment_type === 'credit') {
                    creditAccId = arAccId;
                } else if (sale.payment_type === 'card' || sale.payment_type === 'bank') {
                    creditAccId = bankAccId;
                } else if (sale.payment_type === 'qr' || sale.payment_type === 'cod') {
                    creditAccId = cashAccId;
                }

                if (creditAccId) {
                    await recordTransaction(creditAccId, refundValue, 'credit', `Refund for Return: ${item.name} (#INV-M${String(invoiceId).padStart(4, '0')})`, 'Return', invoiceId);
                }

                if (sale.payment_type === 'cash' && selectedSettlement === 'bank' && selectedBankId && typeof recordBankTransaction === 'function') {
                    await recordBankTransaction(selectedBankId, 'outward', 'Bank Transfer', refundValue, `Return Refund for Invoice #${String(invoiceId).padStart(5, '0')}`, 'Return');
                }
            }

            if (sale.payment_type === 'credit' && sale.customer_id) {
                const customer = await db.customers.get(sale.customer_id);
                if (customer) {
                    const newBalance = (parseFloat(customer.current_balance) || 0) - refundValue;
                    await db.customers.update(sale.customer_id, { current_balance: newBalance });
                }
            }
        });

        // --- ASYNC SYNC (OUTSIDE TRANSACTION) ---
        if (type === 'return') {
            let prod = null;
            if (item.product_id) {
                prod = await db.products.get(item.product_id);
            } else if (item.sku) {
                prod = await db.products.where('sku').equals(item.sku).first();
            }

            if (prod && prod.woo_id && typeof syncStockToWoo === 'function') {
                syncStockToWoo(prod.id, prod.stock_qty).catch(e => console.error("Woo stock sync fail:", e));
            }
        }

        showAlert('Success', `${type.toUpperCase()} record created for ${item.name}. Stock and serial master updated.`, 'success');

        // Refresh lists
        if (typeof renderReturnsList === 'function') {
            renderReturnsList('', type);
        }

        // Hide processed item row? Or just close modal.
        // For now closure is safer to prevent double processing without refresh.
        closeReturnModal();
    } catch (err) {
        console.error("Return Process Error:", err);
        showAlert('Error', 'Failed to process return: ' + err.message, 'error');
    }
}

async function deleteReturn(id, type = 'return') {
    const record = await db.returns.get(id);
    if (!record) return;

    // ROLE-BASED ACCESS CONTROL: Only owner or admin/manager can delete
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
    const isOwner = record.rep_name === currentUser.username;

    if (!isAdmin && !isOwner) {
        showAlert('Access Denied', 'Permanent deletion of protocol records is restricted to owners and executives.', 'error');
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Delete protocol?',
        text: 'This action will permanently erase the return/RMA record.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, Terminate',
        cancelButtonText: 'Abort'
    });

    if (!isConfirmed) return;

    try {
        await db.returns.delete(id);
        showAlert('Erased', 'Journal entry destroyed.', 'success');

        const searchInputId = type === 'return' ? 'returns-search' : 'rma-search';
        const searchVal = document.getElementById(searchInputId) ? document.getElementById(searchInputId).value : '';
        renderReturnsList(searchVal, type);
    } catch (err) {
        showAlert('Error', 'Deletion failed: ' + err.message, 'error');
    }
}

async function editReturn(id, type = 'return') {
    const rma = await db.returns.get(id);
    if (!rma) return;

    const { value: formValues } = await Swal.fire({
        title: 'Edit Journal Entry',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Process Reason</label>
                    <input id="swal-reason" class="swal2-input w-full m-0" value="${rma.reason || ''}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Journal Status</label>
                    <select id="swal-status" class="swal2-select w-full m-0">
                        <option value="Item Received" ${rma.status === 'Item Received' ? 'selected' : ''}>Item Received</option>
                        <option value="Under Investigation" ${rma.status === 'Under Investigation' ? 'selected' : ''}>Under Investigation</option>
                        <option value="Completed" ${rma.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Rejected" ${rma.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonColor: '#0e3257',
        preConfirm: () => {
            return {
                reason: document.getElementById('swal-reason').value,
                status: document.getElementById('swal-status').value
            }
        }
    });

    if (formValues) {
        try {
            await db.returns.update(id, {
                status: formValues.status,
                reason: formValues.reason
            });
            showAlert('Success', 'Journal entry updated.', 'success');
            renderReturnsList('', type);
        } catch (err) {
            showAlert('Error', 'Update failed.', 'error');
        }
    }
}

async function printReturn(id, isPreview = false, isReprint = false) {
    const rma = await db.returns.get(id);
    if (!rma) {
        showAlert('Error', 'Return record not found', 'error');
        return;
    }

    // Role-based Security: Authorize reprinting returns/RMAs
    if (isReprint && !isPreview) {
        const docName = (rma.return_type || 'return').toUpperCase();
        requestElevatedAuth(() => {
            // Re-call with isReprint = false once authorized
            printReturn(id, isPreview, false);
        }, `reprint this ${docName} NOTE`);
        return;
    }

    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || 'MobileMate Demo Shop';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeLogo = opts['store_logo'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const invoiceColor = opts['invoice_color'] || '#0ea5a4';
    const invoiceFooter = opts['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = opts['receipt_footer_info'] || '';
    const bankDetails = opts['bank_details'] || '';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';

    const dateStr = new Date(rma.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (rma.printer_layout === 'dotmatrix') {
        const dotHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>DOT MATRIX - RETURN NOTE</title>
                <style>
                    @media print { @page { size: A4; margin: 10mm; } }
                    body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; padding: 0; margin: 0; }
                    .container { width: 100%; border: 1px solid #000; padding: 10px; box-sizing: border-box; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { border: 1px solid #000; padding: 5px; text-align: left; background: #eee; -webkit-print-color-adjust: exact; }
                    td { border: 1px solid #000; padding: 5px; }
                    .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
                    .footer { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <h2 style="margin:0;">${storeName.toUpperCase()}</h2>
                            ${enabledStoreAddress ? `<p style="margin:5px 0; font-size: 12px;">${storeAddress}</p>` : ''}
                            <div style="font-size:11px; color:#444;">
                                Tel: ${storePhone} ${storeEmail ? ` | ${storeEmail}` : ''}
                                ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                ${storeBR ? ` | BR: ${storeBR}` : ''}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <h2 style="margin:0;">RETURN / RMA</h2>
                            <p style="margin:5px 0;">ID: RMA-${String(rma.id).padStart(5, '0')}</p>
                            <p style="margin:5px 0;">DATE: ${dateStr}</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <strong>CUSTOMER:</strong> ${rma.customer_name || 'Walk-in'}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th align="center">QTY</th>
                                <th>REMARK</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>${rma.item_name || 'Generic Item'}</strong><br>
                                    <small>SKU: ${rma.item_sku || 'N/A'} | Ref: ${rma.invoice_display || 'INV-M' + String(rma.invoice_id).padStart(4, '0')}</small>
                                    ${rma.serials ? `<br><small style="font-weight:bold;">S/N: ${rma.serials.split(/[\n,]+/).map(s => s.trim()).filter(s => s).join('<br>S/N: ')}</small>` : ''}
                                </td>
                                <td align="center">${rma.qty || 1}</td>
                                <td>${rma.reason || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        <p><strong>REMARK:</strong> This is a Return/RMA acknowledgement note. Items will be inspected within 14 days.</p>
                        <p align="center" style="margin-top:10px;">--- PLEASE RETAIN THIS FOR TRACKING ---</p>
                        <div style="margin-top: 10px; font-size: 8px; font-weight: bold; text-transform: uppercase; color: #666; text-align: center; border-top: 1px dotted #000; padding-top: 5px;">
                            Powered by Infinity Creative Works (+94 76 5 449 005)
                        </div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `;

        const win = window.open('', '_blank');
        if (win) { win.document.write(dotHtml); win.document.close(); }
        return;
    }

    // Standard layout with pagination
    const items = [{
        name: rma.item_name || 'Generic Item',
        sku: rma.item_sku || 'N/A',
        qty: rma.qty || 1,
        reason: rma.reason || 'N/A',
        serials: rma.serials || ''
    }]; // Returns currently has 1 item, but we'll use array for future/paging consistency

    const chunkSize = 8;
    const totalPages = Math.ceil(items.length / chunkSize) || 1;
    let pagesHtml = '';

    for (let i = 0; i < totalPages; i++) {
        const chunk = items.slice(i * chunkSize, (i + 1) * chunkSize);

        const chunkRows = chunk.map((item, idx) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td align="center" style="padding: 12px; font-size:12px;">${(i * chunkSize) + idx + 1}</td>
                <td align="left" style="padding: 12px;">
                    <div style="font-weight: bold; color: #111; font-size:14px;">${item.name}</div>
                    <div style="font-size: 11px; color: #666;">SKU: ${item.sku} | Ref: INV-M${String(rma.invoice_id).padStart(4, '0')}</div>
                    ${item.serials ? `<div style="font-size: 10px; color: ${invoiceColor}; font-weight:bold; margin-top:4px;">${item.serials.split(/[\n,]+/).map(s => s.trim()).filter(s => s).map(sn => `S/N: ${sn}`).join('<br>')}</div>` : ''}
                </td>
                <td align="center" style="padding: 12px; font-size:13px;">${item.qty}</td>
                <td align="center" style="padding: 12px; font-size:12px;">${item.reason}</td>
            </tr>
        `).join('');

        pagesHtml += `
            <div class="page" style="display: flex; flex-direction: column; position: relative; min-height: 297mm; padding: 10mm; box-sizing: border-box; background: #fff; ${i < totalPages - 1 ? 'page-break-after: always;' : ''}">
                <div style="flex: 1 0 auto; display: flex; flex-direction: column;">
                <!-- HEADER -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap: 15px;">
                        ${storeLogo ? `<img src="${storeLogo}" style="max-height: 80px; max-width:120px; object-fit:contain; margin-right: 15px;">` : ''}
                        <div>
                            <h1 style="margin:0; color:${invoiceColor}; font-size:22px; letter-spacing:1px; text-transform:uppercase;">
                                <b>${storeName.toUpperCase()}</b>
                            </h1>
                            <p style="margin:2px 0 0 0; font-size:11px; color:#444; letter-spacing: 0.5px;"><b>${storeSubheading}</b></p>
                            ${enabledStoreAddress ? `<p style="margin:5px 0; color:#4b5563; font-size:12px;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                            <div style="font-size:11px; color:#666;">
                                ${storePhone} ${storeEmail ? ` | ${storeEmail}` : ''}
                                ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                ${storeBR ? ` | BR: ${storeBR}` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <h2 style="margin:0; letter-spacing:1px; color:#444; font-size:22px;"><b>RETURN / RMA NOTE</b></h2>
                        <div style="margin-top:5px; font-size: 14px;">
                            <strong>RMA No:</strong> RMA-${String(rma.id).padStart(5, '0')}<br>
                            <strong>Date:</strong> ${dateStr}<br>
                            <strong>Page:</strong> ${i + 1} / ${totalPages}
                        </div>
                    </div>
                </div>

                <hr style="margin:20px 0; border:0; border-top:2px solid ${invoiceColor};">

                <div style="display:flex; justify-content:space-between; margin-bottom: 25px;">
                    <div style="width:50%; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <strong style="color:${invoiceColor}; text-transform: uppercase; font-size: 11px;">CUSTOMER / SHIP TO:</strong>
                        <div style="margin-top:8px; line-height: 1.6; font-size: 13px;">
                            <b style="font-size: 15px;">${rma.customer_name || 'Walk-in Customer'}</b><br>
                            <strong>Ref Invoice:</strong> INV-M${String(rma.invoice_id || 0).padStart(4, '0')}
                        </div>
                    </div>

                    <div style="width:40%; text-align:right; padding: 10px;">
                        <strong style="color:${invoiceColor}; text-transform: uppercase; font-size: 11px;">Note Details:</strong>
                        <div style="margin-top:8px; line-height: 1.6; font-size: 13px;">
                            <strong>Status:</strong> ${rma.status || 'Pending'}<br>
                            <strong>Type:</strong> ${(rma.return_type || 'Return').toUpperCase()}
                        </div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th align="center" width="5%" style="background: ${invoiceColor}; color: #fff; padding: 12px;">#</th>
                            <th align="left" width="55%" style="background: ${invoiceColor}; color: #fff; padding: 12px;">Item Description</th>
                            <th align="center" width="10%" style="background: ${invoiceColor}; color: #fff; padding: 12px;">Qty</th>
                            <th align="center" width="30%" style="background: ${invoiceColor}; color: #fff; padding: 12px;">Inspection Status/Reason</th>
                        </tr>
                    </thead>
                    <tbody>${chunkRows}</tbody>
                </table>
                </div>
                <div class="page-bottom" style="flex-shrink: 0; margin-top: auto;">

                <div style="display:flex; justify-content:space-between; font-size: 10px; font-weight: bold; margin-top: 20px;">
                    <div style="text-align:center; width: 18%;">
                        <div style="border-bottom: 1px solid #ccc; height: 35px;"></div>
                        <div style="margin-top: 8px; color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">Prepared By</div>
                    </div>
                    <div style="text-align:center; width: 18%;">
                        <div style="border-bottom: 1px solid #ccc; height: 35px;"></div>
                        <div style="margin-top: 8px; color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">Authorized By</div>
                    </div>
                    <div style="text-align:center; width: 18%;">
                        <div style="border-bottom: 1px solid #ccc; height: 35px;"></div>
                        <div style="margin-top: 8px; color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">Receiver Name</div>
                    </div>
                    <div style="text-align:center; width: 18%;">
                        <div style="border-bottom: 1px solid #ccc; height: 35px;"></div>
                        <div style="margin-top: 8px; color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">Customer Signature</div>
                    </div>
                    <div style="text-align:center; width: 18%;">
                        <div style="border-bottom: 1px solid #ccc; height: 35px;"></div>
                        <div style="margin-top: 8px; color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 1px;">NIC Number</div>
                    </div>
                </div>

                <!-- FOOTER -->
                <div style="text-align: center; color: #555; font-size: 10px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;">
                    <div style="margin-bottom: 5px; font-weight: 800; color: #000; text-transform: uppercase; font-size: 11px;">
                        ${invoiceFooter.toUpperCase()}
                    </div>
                    <div style="color: #6b7280; font-size: 11px; line-height: 1.5; font-weight: 700; white-space: pre-line;">
                        ${receiptFooterInfo}
                    </div>

                    <div style="margin-top: 10px; font-size: 8px; color: #94a3b8; border-top: 1px dashed #eee; padding-top: 8px; font-weight: 600;">
                        Powered by <a href="https://wa.me/94765449005" style="color: #4f46e5; text-decoration: none;">Infinity Creative Works +94 76 5 449 005</a>
                    </div>
                </div>
            </div>
            </div>
        `;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>RMA-${String(rma.id).padStart(5, '0')}</title>
            <style>
                @media print { 
                    @page { size: A4; margin: 0; } 
                    body { margin: 0; -webkit-print-color-adjust: exact; } 
                    .page { box-shadow: none !important; margin: 0 !important; }
                }
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    background: #f0f0f0;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
                .page { background: #fff; width: 210mm; margin: 10mm auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body>
            ${pagesHtml}
            <script>
                window.onload = function() { 
                    setTimeout(function() { window.print(); window.close(); }, 700);
                }
            </script>
        </body>
        </html>
    `;

    if (isPreview) {
        const type = rma.return_type || 'return';
        openPreviewModal(
            html,
            () => printReturn(id, false),
            () => editReturn(id, type),
            null,
            (html) => {
                const docNo = `RMA-${String(id).padStart(5, '0')}`;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Return/RMA Note', docNo, rma.customer_name, 0, [{ name: rma.item_name, qty: rma.qty || 1 }], html);
                }
            },
            (html) => generatePDFAndShare(html, `RMA-${String(id).padStart(5, '0')}.pdf`, { forceDownload: true })
        );
        return;
    }


    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
    } else {
        showAlert('Popup Blocked', 'Please allow popups to print RMA notes.', 'warning');
    }
}

