let currentPaymentsFilter = {
    customer: 'all',
    method: 'all',
    dateRange: 'today'
};
let currentPaymentsTab = 'customer'; // New state to track tab

function normalizePaymentMethod(method) {
    return (method || '').toString().trim().toLowerCase().replace(/transfer$/, '').replace(/\s+/g, '');
}

async function loadPayments() {
    console.log("Loading Payments view...");
    const container = document.getElementById('payments-view');
    if (!container) return;

    // Get stats
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed month
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const allPayments = await db.payments.toArray();

    // Filter based on tab
    const payments = allPayments.filter(p => currentPaymentsTab === 'vendor' ? p.target_type === 'vendor' : p.target_type !== 'vendor');
    const monthPayments = payments.filter(p => p.date && p.date >= firstDay);
    const monthTotal = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const grandTotal = payments.reduce((s, p) => s + (p.amount || 0), 0);

    // Dynamic Labels
    const tabTitle = currentPaymentsTab === 'vendor' ? 'Vendor Payments' : 'Customer Payments';
    const tabDesc = currentPaymentsTab === 'vendor' ? 'Manage outflows, supplier settlements, and procurement payments.' : 'Manage receipts, single invoice payments, and bulk credits.';
    const stat1Label = currentPaymentsTab === 'vendor' ? 'Paid In Range' : 'Received In Range';
    const stat2Label = currentPaymentsTab === 'vendor' ? 'Total Paid' : 'Total Received';
    const stat3Label = currentPaymentsTab === 'vendor' ? 'Outstanding Payables' : 'Pending Receivables';
    const stat3Icon = currentPaymentsTab === 'vendor' ? 'fa-truck-fast' : 'fa-clock-rotate-left';
    const stat3Color = currentPaymentsTab === 'vendor' ? 'text-red-500' : 'text-amber-600';
    const stat3Bg = currentPaymentsTab === 'vendor' ? 'bg-red-50' : 'bg-amber-100';

    const actionSection = currentPaymentsTab === 'customer'
        ? `<div class="flex items-center gap-2">
                <button onclick="openPaymentModal('bulk')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-layer-group"></i> Payment Receive
                </button>
                <button onclick="openUnreceiveInvoiceModal()" class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-rose-500/20 transition-all flex items-center gap-2" title="Unreceive a mistakenly received invoice">
                    <i class="fa-solid fa-rotate-left"></i> Unreceive Invoice
                </button>
            </div>`
        : `<div class="flex items-center gap-2">
                <button onclick="switchAccountingTab('bills')" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-truck-field"></i> Record Supplier Payment
                </button>
            </div>`;

    const html = `
        <div class="space-y-6">
            <!-- Tab Navigation -->
            <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder w-fit">
                <button onclick="switchPaymentsTab('customer')" class="px-6 py-2.5 rounded-xl text-sm font-black transition-all ${currentPaymentsTab === 'customer' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">
                    <i class="fa-solid fa-user-tag mr-2"></i> Customer Receipts
                </button>
                <button onclick="switchPaymentsTab('vendor')" class="px-6 py-2.5 rounded-xl text-sm font-black transition-all ${currentPaymentsTab === 'vendor' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}">
                    <i class="fa-solid fa-shop mr-2"></i> Vendor Payments
                </button>
            </div>

            <!-- Header & Stats -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-black italic tracking-tighter uppercase">${tabTitle}</h1>
                    <p class="text-gray-500 text-sm font-medium">${tabDesc}</p>
                </div>
                ${actionSection}

            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Stat Cards -->
                <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder flex items-center gap-4 transition-all hover:shadow-md">
                    <div class="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-primary">
                        <i class="fa-solid fa-calendar-day text-2xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">${stat1Label}</p>
                        <h3 class="text-2xl font-black italic tracking-tighter" id="range-total-display">${formatCurrency(monthTotal)}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder flex items-center gap-4 transition-all hover:shadow-md">
                    <div class="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                        <i class="fa-solid fa-money-bill-wave text-2xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">${stat2Label}</p>
                        <h3 class="text-2xl font-black italic tracking-tighter">${formatCurrency(grandTotal)}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder flex items-center gap-4 transition-all hover:shadow-md">
                    <div class="w-14 h-14 ${stat3Bg} rounded-2xl flex items-center justify-center ${stat3Color}">
                        <i class="fa-solid ${stat3Icon} text-2xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">${stat3Label}</p>
                        <h3 class="text-2xl font-black italic tracking-tighter" id="total-pending-display">Rs. 0.00</h3>
                    </div>
                </div>
            </div>

            <!-- Payments List -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                <div class="p-4 border-b border-gray-100 dark:border-darkBorder flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-2">
                        <h2 class="font-black italic uppercase tracking-tighter">${currentPaymentsTab === 'vendor' ? 'Payment Vouchers' : 'Recent Receipts'}</h2>
                        <span class="bg-gray-100 dark:bg-gray-800 text-[10px] px-2 py-1 rounded-lg font-black text-gray-500" id="payments-total-count">${payments.length} TOTAL</span>
                    </div>
                    <div class="flex gap-2 flex-wrap items-center">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                            <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                            <input type="month" id="pay-month-picker" value="${firstDay.slice(0, 7)}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase" />
                            <span class="text-gray-300 font-black">/</span>
                            <input type="date" id="pay-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                            <span class="text-gray-300 font-black">/</span>
                            <input type="date" id="pay-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        </div>
                        <input type="text" id="pay-search" oninput="filterPaymentsList()" placeholder="Receipt # or Customer..." class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-primary">
                        <select id="pay-method-filter" onchange="filterPaymentsList()" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary">
                            <option value="all">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400">
                            <tr>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">${currentPaymentsTab === 'vendor' ? 'Voucher #' : 'Receipt #'}</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">${currentPaymentsTab === 'vendor' ? 'Vendor' : 'Customer'}</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Classification</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Method</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody id="payments-list-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                            <!-- Injected by filterPaymentsList -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    `;

    container.innerHTML = html;

    document.getElementById('pay-start-date')?.addEventListener('change', filterPaymentsList);
    document.getElementById('pay-end-date')?.addEventListener('change', filterPaymentsList);
    document.getElementById('pay-month-picker')?.addEventListener('change', filterPaymentsList);

    filterPaymentsList();
    updatePendingStats();
}

async function updatePendingStats() {
    let totalPending = 0;
    if (currentPaymentsTab === 'vendor') {
        const vendors = await db.vendors.toArray();
        vendors.forEach(v => {
            totalPending += Math.max(0, parseFloat(v.current_balance) || 0);
        });
    } else {
        const customers = await db.customers.toArray();
        customers.forEach(c => {
            totalPending += Math.max(0, parseFloat(c.current_balance) || 0);
        });
    }
    const display = document.getElementById('total-pending-display');
    if (display) display.textContent = formatCurrency(totalPending);
}

function switchPaymentsTab(tab) {
    currentPaymentsTab = tab;
    loadPayments();
}

async function filterPaymentsList() {
    const search = document.getElementById('pay-search')?.value.toLowerCase() || '';
    const method = document.getElementById('pay-method-filter')?.value || 'all';
    const monthPicker = document.getElementById('pay-month-picker')?.value;
    let startDate = document.getElementById('pay-start-date')?.value || '';
    let endDate = document.getElementById('pay-end-date')?.value || '';
    if (monthPicker) {
        const [y, m] = monthPicker.split('-');
        startDate = `${y}-${m}-01`;
        endDate = new Date(y, parseInt(m), 0).toISOString().split('T')[0];
    }
    const body = document.getElementById('payments-list-body');
    if (!body) return;

    let payments = await db.payments.reverse().toArray();
    const vendors = await db.vendors.toArray();
    const customers = await db.customers.toArray();

    // Filter based on active tab
    if (currentPaymentsTab === 'vendor') {
        payments = payments.filter(p => p.target_type === 'vendor');
    } else {
        payments = payments.filter(p => p.target_type !== 'vendor');
    }

    if (startDate || endDate) {
        payments = payments.filter(p => {
            const d = p.date ? p.date.split('T')[0] : '';
            if (startDate && endDate) return d >= startDate && d <= endDate;
            if (startDate) return d >= startDate;
            if (endDate) return d <= endDate;
            return true;
        });
    }

    if (method !== 'all') {
        const normalizedMethod = normalizePaymentMethod(method);
        payments = payments.filter(p => normalizePaymentMethod(p.method) === normalizedMethod);
    }

    const rangeTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const rangeTotalEl = document.getElementById('range-total-display');
    if (rangeTotalEl) rangeTotalEl.textContent = formatCurrency(rangeTotal);

    const sales = await db.sales.toArray();
    const salesById = Object.fromEntries(sales.map(s => [s.id, s]));

    const filtered = payments.filter(p => {
        let name = 'Walk-in';
        if (p.target_type === 'vendor') {
            const v = vendors.find(v => v.id === p.target_id);
            if (v) name = v.name;
        } else if (p.target_type === 'customer') {
            const c = customers.find(c => c.id === p.target_id);
            if (c) name = c.name;
        } else if (p.target_type === 'invoice') {
            const sale = salesById[p.target_id];
            if (sale) {
                if (sale.customer_id) {
                    const c = customers.find(c => c.id === sale.customer_id);
                    if (c) name = c.name;
                } else if (sale.customer_name) {
                    name = sale.customer_name;
                } else {
                    name = `Invoice #${sale.id}`;
                }
            }
        }

        const receiptNo = `RCP-${String(p.id).padStart(5, '0')}`;
        return receiptNo.toLowerCase().includes(search) ||
            name.toLowerCase().includes(search) ||
            (p.note && p.note.toLowerCase().includes(search));
    });

    const totalCountEl = document.getElementById('payments-total-count');
    if (totalCountEl) totalCountEl.textContent = `${filtered.length} TOTAL`;

    // We need to fetch entities for the filtered list
    const entities = {};
    for (const p of filtered.slice(0, 50)) {
        if (p.target_type === 'invoice') {
            const sale = await db.sales.get(p.target_id);
            if (sale && sale.customer_id) {
                const cust = await db.customers.get(sale.customer_id);
                if (cust) entities[p.id] = cust;
            } else if (sale && sale.customer_name) {
                entities[p.id] = { name: sale.customer_name };
            }
        } else if (p.target_type === 'customer') {
            entities[p.id] = customers.find(c => c.id === p.target_id);
        } else if (p.target_type === 'vendor') {
            entities[p.id] = vendors.find(v => v.id === p.target_id);
        }
    }

    body.innerHTML = filtered.length === 0 ?
        '<tr><td colspan="7" class="p-12 text-center text-gray-400">No payment records found.</td></tr>' :
        filtered.slice(0, 50).map(p => {
            const isVendor = p.target_type === 'vendor';
            const entity = entities[p.id];
            const isSingle = p.target_type === 'invoice';

            let typeLabel = 'Bulk Payment';
            let typeColor = 'bg-emerald-100 text-emerald-600';

            if (isSingle) {
                typeLabel = 'Single Invoice';
                typeColor = 'bg-indigo-100 text-indigo-600';
            } else if (isVendor) {
                typeLabel = 'Vendor Payment';
                typeColor = 'bg-amber-100 text-amber-600';
            }
            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="p-4 font-mono text-xs font-bold text-gray-400">RCP-${String(p.id).padStart(5, '0')}</td>
                    <td class="p-4 text-sm">${p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}</td>
                    <td class="p-4">
                        <div class="font-bold text-sm">${entity?.name || 'Walk-in'}</div>
                        <div class="text-[10px] text-gray-500 uppercase font-bold">${(isVendor ? entity?.contact_person : entity?.company) || '-'}</div>
                    </td>
                    <td class="p-4">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${typeColor}">
                            ${typeLabel}
                        </span>
                    </td>
                    <td class="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">${p.method}</td>
                    <td class="p-4 text-right font-black ${isVendor ? 'text-red-500' : 'text-emerald-600'}">${isVendor ? '-' : ''}${formatCurrency(p.amount)}</td>
                    <td class="p-4 text-center">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="printPaymentReceipt(${p.id}, true)" class="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Preview Receipt">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button onclick="printPaymentReceipt(${p.id})" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Print Receipt">
                                <i class="fa-solid fa-print"></i>
                            </button>
                            <button onclick="editPaymentReceipt(${p.id})" class="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit Receipt">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            ${(p.target_type === 'invoice' || p.invoice_id) ? `
                            <button onclick="unreceiveInvoice(${p.invoice_id || p.target_id})" class="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Unreceive Invoice (Reverse to Unpaid)">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>` : ''}
                            <button onclick="deletePaymentReceipt(${p.id})" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Receipt">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
}

async function openPaymentModal(typeOrId, remaining = null, custName = null) {
    const modal = document.getElementById('payment-modal');
    const content = document.getElementById('payment-modal-content');
    if (!modal || !content) return;

    const customers = await db.customers.toArray();
    const bankAccounts = (await db.bank_accounts?.toArray()) || [];

    let type = typeOrId;
    let prefilledInvoiceId = null;

    // Detect if we are calling by ID (from Finance view)
    if (typeof typeOrId === 'number' || (!isNaN(typeOrId) && !['single', 'bulk'].includes(typeOrId))) {
        type = 'single';
        prefilledInvoiceId = parseInt(typeOrId);
    }

    // Adjust modal size
    content.classList.remove('max-w-md', 'max-w-lg', 'max-w-3xl');
    content.classList.add('max-w-3xl');

    let formHtml = '';

    if (type === 'single') {
        formHtml = `
            <div class="px-6 py-5 border-b border-gray-200 dark:border-darkBorder bg-indigo-600 flex items-center justify-between text-white">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <i class="fa-solid fa-file-invoice-dollar text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black italic tracking-tighter uppercase leading-none">Receive Payment</h3>
                        <p class="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Post credit to specific invoice</p>
                    </div>
                </div>
                <button type="button" onclick="closePaymentModal()" class="w-8 h-8 rounded-lg bg-black/10 hover:bg-black/20 transition-colors flex items-center justify-center"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onsubmit="handlePaymentSubmit(event, 'single')" class="p-6 space-y-5">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Document</label>
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" id="pay-invoice-search" oninput="searchInvoicesForPay()" 
                            class="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold" 
                            placeholder="Invoice # (e.g. 10)" value="${prefilledInvoiceId || ''}">
                    </div>
                    <div id="pay-invoice-result" class="mt-2 text-sm"></div>
                    <input type="hidden" id="pay-invoice-id" value="${prefilledInvoiceId || ''}">
                    <input type="hidden" id="pay-customer-id">
                    <div id="customer-credit-info" class="mt-2 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hidden"></div>
                </div>
                <div id="pending-invoices-container" class="hidden space-y-3">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Pending Invoices</label>
                    <div class="bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-200 dark:border-darkBorder overflow-hidden">
                        <div class="max-h-60 overflow-y-auto custom-scrollbar">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-gray-100 dark:bg-gray-800 text-gray-500 font-black uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th class="p-3 w-10"><input type="checkbox" id="select-all-invoices" onclick="toggleAllInvoices(this)"></th>
                                        <th class="p-3">Invoice #</th>
                                        <th class="p-3">Date</th>
                                        <th class="p-3 text-right">Outstanding</th>
                                        <th class="p-3 text-right w-32">Paying</th>
                                    </tr>
                                </thead>
                                <tbody id="pending-invoices-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <!-- Loaded via searchInvoicesForPay -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="space-y-5 hidden" id="pay-fields">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amt Outstanding</label>
                            <input type="text" id="pay-outstanding" readonly class="w-full px-5 py-4 bg-gray-100 dark:bg-gray-700/50 border-2 border-transparent font-black text-red-500 rounded-2xl outline-none cursor-not-allowed text-xl shadow-inner">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Paying Amount</label>
                            <input type="number" id="pay-amount" step="0.01" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-indigo-600 text-xl outline-none shadow-inner">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                            <select id="pay-method" onchange="toggleChequeDetails()" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold">
                                <option value="Cash">Cash on Hand</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="Cheque">Cheque Payment</option>
                                <option value="KOKO">KOKO Payment</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Deposit To Account</label>
                            <select id="pay-account" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold">
                                <option value="1000">Cash on Hand (1000)</option>
                                <option value="1010">Bank Account (1010)</option>
                                ${bankAccounts.map(b => `<option value="BANK-${b.id}">${b.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="cheque-details" class="grid grid-cols-4 gap-4 hidden mt-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cheque Number</label>
                            <input type="text" id="pay-cheque-no" placeholder="000000" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cheque Date</label>
                            <input type="date" id="pay-cheque-date" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank</label>
                            <input type="text" id="pay-cheque-bank" placeholder="Bank Name" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Branch</label>
                            <input type="text" id="pay-cheque-branch" placeholder="Branch Name" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                    </div>
                    <div id="bank-transfer-details" class="hidden mt-4">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank Transfer Reference Number</label>
                        <input type="text" id="pay-bank-ref" placeholder="Enter bank reference number (e.g. TXN-987654)" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                    </div>
                    <div id="koko-details" class="hidden mt-4">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">KOKO Reference / Transaction ID</label>
                        <input type="text" id="pay-koko-ref" placeholder="Enter KOKO reference number (optional)" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                    </div>
                    <div id="bank-account-preview" class="hidden mt-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 animate-fade-in">
                        <!-- Loaded dynamically by loadBankAccountPreview -->
                    </div>
                </div>
                <div class="pt-4 flex gap-4">
                    <button type="submit" id="pay-submit-btn" disabled class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/30 opacity-50 cursor-not-allowed transition-all active:scale-95">Record Receipt</button>
                </div>
            </form>
        `;
    } else {
        formHtml = `
            <div class="px-6 py-5 border-b border-gray-200 dark:border-darkBorder bg-emerald-600 flex items-center justify-between text-white">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <i class="fa-solid fa-layer-group text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black italic tracking-tighter uppercase leading-none">Payment Receiver</h3>
                        <p class="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Receive lump-sum from customer</p>
                    </div>
                </div>
                <button onclick="closePaymentModal()" class="w-8 h-8 rounded-lg bg-black/10 hover:bg-black/20 transition-colors flex items-center justify-center"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <form onsubmit="handlePaymentSubmit(event, 'bulk')" class="p-6 space-y-5">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Customer</label>
                    <select id="pay-customer-select" onchange="updateCustomerCreditInfo()" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold">
                        <option value="">Search customer...</option>
                        ${customers.map(c => `<option value="${c.id}">${c.name} (${c.company || 'Personal'})</option>`).join('')}
                    </select>
                    <div id="customer-credit-info" class="mt-2 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hidden"></div>
                </div>
                <div id="pending-invoices-container" class="hidden space-y-3">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Pending Invoices</label>
                    <div class="bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-gray-200 dark:border-darkBorder overflow-hidden">
                        <div class="max-h-60 overflow-y-auto custom-scrollbar">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-gray-100 dark:bg-gray-800 text-gray-500 font-black uppercase tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th class="p-3 w-10"><input type="checkbox" id="select-all-invoices" onclick="toggleAllInvoices(this)"></th>
                                        <th class="p-3">Invoice #</th>
                                        <th class="p-3">Date</th>
                                        <th class="p-3 text-right">Outstanding</th>
                                        <th class="p-3 text-right w-32">Paying</th>
                                    </tr>
                                </thead>
                                <tbody id="pending-invoices-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <!-- Loaded via updateCustomerCreditInfo -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Receiving Amount (Rs.)</label>
                        <input type="number" id="pay-amount" step="0.01" required min="1" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl font-black text-emerald-600 text-xl outline-none shadow-inner" placeholder="0.00">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Method</label>
                            <select id="pay-method" onchange="toggleChequeDetails()" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold">
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="KOKO">KOKO Payment</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Deposit To</label>
                            <select id="pay-account" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold">
                                <option value="1000">Cash (1000)</option>
                                <option value="1010">Bank (1010)</option>
                                ${bankAccounts.map(b => `<option value="BANK-${b.id}">${b.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="cheque-details" class="grid grid-cols-4 gap-4 hidden mt-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cheque Number</label>
                            <input type="text" id="pay-cheque-no" placeholder="000000" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cheque Date</label>
                            <input type="date" id="pay-cheque-date" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank</label>
                            <input type="text" id="pay-cheque-bank" placeholder="Bank Name" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Branch</label>
                            <input type="text" id="pay-cheque-branch" placeholder="Branch Name" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                        </div>
                    </div>
                    <div id="bank-transfer-details" class="hidden mt-4">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank Transfer Reference Number</label>
                        <input type="text" id="pay-bank-ref" placeholder="Enter bank reference number (e.g. TXN-987654)" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                    </div>
                    <div id="koko-details" class="hidden mt-4">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">KOKO Reference / Transaction ID</label>
                        <input type="text" id="pay-koko-ref" placeholder="Enter KOKO reference number (optional)" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm font-bold text-gray-700 dark:text-gray-300">
                    </div>
                    <div id="bank-account-preview" class="hidden mt-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 animate-fade-in">
                        <!-- Loaded dynamically by loadBankAccountPreview -->
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reference / Note</label>
                        <input type="text" id="pay-note" placeholder="Optional reference info..." class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-sm">
                    </div>
                </div>
                <div class="pt-4 flex gap-4">
                    <button type="submit" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-95">Received</button>
                </div>
            </form>
        `;
    }

    content.innerHTML = formHtml;
    modal.classList.remove('hidden');

    // Auto-trigger search if we have a prefilled ID
    if (prefilledInvoiceId) {
        setTimeout(searchInvoicesForPay, 100);
    }

    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    const content = document.getElementById('payment-modal-content');
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function toggleChequeDetails() {
    const method = document.getElementById('pay-method')?.value;
    const detailsDiv = document.getElementById('cheque-details');
    const bankTransferDiv = document.getElementById('bank-transfer-details');
    const kokoDiv = document.getElementById('koko-details');
    const bankPreview = document.getElementById('bank-account-preview');

    if (detailsDiv) {
        if (method === 'Cheque') detailsDiv.classList.remove('hidden');
        else detailsDiv.classList.add('hidden');
    }
    if (bankTransferDiv) {
        if (method === 'Bank') bankTransferDiv.classList.remove('hidden');
        else bankTransferDiv.classList.add('hidden');
    }
    if (kokoDiv) {
        if (method === 'KOKO') kokoDiv.classList.remove('hidden');
        else kokoDiv.classList.add('hidden');
    }
    if (bankPreview) {
        if (method === 'Bank') {
            bankPreview.classList.remove('hidden');
            loadBankAccountPreview('bank-account-preview');
        } else {
            bankPreview.classList.add('hidden');
        }
    }
}

async function loadBankAccountPreview(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const bankAccounts = (await db.bank_accounts?.toArray()) || [];
    if (bankAccounts.length === 0) {
        container.innerHTML = `
            <div class="flex items-center gap-3 p-4">
                <i class="fa-solid fa-circle-info text-amber-500 text-lg"></i>
                <span class="text-sm font-bold text-gray-500">No company bank accounts configured. Add accounts in Accounting &rarr; Bank Accounts.</span>
            </div>`;
        return;
    }
    container.innerHTML = `
        <div class="flex items-center gap-2 mb-3 px-1">
            <i class="fa-solid fa-building-columns text-indigo-500"></i>
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Bank Accounts</span>
        </div>
        <div class="space-y-2">
            ${bankAccounts.map(b => `
                <div class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fa-solid fa-landmark text-indigo-500 text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-black text-sm text-gray-800 dark:text-gray-200 truncate">${b.name || 'Unnamed Account'}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">${b.account_number || 'N/A'}</div>
                        <div class="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <span><i class="fa-solid fa-university mr-1"></i>${b.bank_name || '-'}</span>
                            <span><i class="fa-solid fa-location-dot mr-1"></i>${b.branch || '-'}</span>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</div>
                        <div class="font-black text-sm ${(b.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}">${typeof formatCurrency === 'function' ? formatCurrency(b.balance || 0) : 'Rs. ' + (b.balance || 0).toLocaleString()}</div>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

async function searchInvoicesForPay() {
    const val = document.getElementById('pay-invoice-search').value;
    const resultDiv = document.getElementById('pay-invoice-result');
    const fieldsDiv = document.getElementById('pay-fields');
    const submitBtn = document.getElementById('pay-submit-btn');

    if (!val) {
        resultDiv.innerHTML = '';
        fieldsDiv.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const saleId = parseInt(val, 10);
    if (Number.isNaN(saleId) || saleId <= 0) {
        resultDiv.innerHTML = '<span class="text-red-500 font-bold">Please enter a valid invoice number.</span>';
        fieldsDiv.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const sale = await db.sales.get(saleId);
    if (!sale) {
        resultDiv.innerHTML = '<span class="text-red-500 font-bold">Invoice not found!</span>';
        fieldsDiv.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    if (sale.status?.toLowerCase() === 'paid' || (parseFloat(sale.paid_amount) || 0) >= (parseFloat(sale.total) || 0)) {
        resultDiv.innerHTML = '<span class="text-emerald-600 font-bold">This invoice is already PAID.</span>';
        fieldsDiv.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    const customer = await db.customers.get(sale.customer_id);
    const paidSoFar = parseFloat(sale.paid_amount) || 0;
    const total = parseFloat(sale.total) || 0;
    const outstanding = total - paidSoFar;

    resultDiv.innerHTML = `
        <div class="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <div class="font-bold flex justify-between">
                <span>${getInvoiceDisplayNumber(sale)}</span>
                <span class="text-indigo-600">${customer?.name || 'Walk-in'}</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">Total: ${formatCurrency(total)} | Paid: ${formatCurrency(paidSoFar)}</div>
        </div>
    `;

    document.getElementById('pay-invoice-id').value = sale.id;
    document.getElementById('pay-customer-id').value = sale.customer_id || '';
    document.getElementById('pay-outstanding').value = formatCurrency(outstanding);
    document.getElementById('pay-amount').value = outstanding;
    document.getElementById('pay-amount').max = outstanding;

    fieldsDiv.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    // Also load all pending invoices for this customer
    if (sale.customer_id) {
        const custSelect = document.createElement('select');
        custSelect.id = 'pay-customer-select';
        custSelect.value = sale.customer_id;
        // Temporary injection to reuse updateCustomerCreditInfo
        const wrapper = document.createElement('div');
        wrapper.style.display = 'none';
        wrapper.appendChild(custSelect);
        document.body.appendChild(wrapper);

        await updateCustomerCreditInfo();

        document.body.removeChild(wrapper);

        // Pre-check the current invoice in the list
        const cb = document.querySelector(`.invoice-checkbox[value="${sale.id}"]`);
        if (cb) {
            cb.checked = true;
            const row = cb.closest('tr');
            const input = row.querySelector('.invoice-pay-amount');
            if (input) input.disabled = false;
            calculateBulkTotal();
        }
    }
}

async function updateCustomerCreditInfo() {
    const custId = document.getElementById('pay-customer-select').value;
    const infoDiv = document.getElementById('customer-credit-info');
    const invContainer = document.getElementById('pending-invoices-container');
    const invBody = document.getElementById('pending-invoices-body');

    if (!custId) {
        infoDiv.innerHTML = '';
        infoDiv.classList.add('hidden');
        if (invContainer) invContainer.classList.add('hidden');
        const mainPayInput = document.getElementById('pay-amount');
        if (mainPayInput) mainPayInput.value = '';
        return;
    }

    // Reset select all checkbox
    const selectAll = document.getElementById('select-all-invoices');
    if (selectAll) selectAll.checked = false;
    const mainPayInput = document.getElementById('pay-amount');
    if (mainPayInput) mainPayInput.value = '';

    const customerId = parseInt(custId);
    const customer = await db.customers.get(customerId);
    if (customer) {
        infoDiv.innerHTML = `Total Outstanding Balance: <span class="text-red-500">${formatCurrency(customer.current_balance || 0)}</span>`;
        infoDiv.classList.remove('hidden');

        // Fetch pending invoices
        const pendingInvoices = await db.sales
            .where('customer_id').equals(customerId)
            .filter(s => s.document_type === 'invoice' && s.status !== 'paid' && s.status !== 'Paid')
            .toArray();

        if (invContainer && invBody) {
            if (pendingInvoices.length > 0) {
                invBody.innerHTML = pendingInvoices.map(inv => {
                    const total = parseFloat(inv.total) || 0;
                    const paid = parseFloat(inv.paid_amount) || 0;
                    const outstanding = total - paid;
                    return `
                        <tr class="hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors">
                            <td class="p-3"><input type="checkbox" class="invoice-checkbox h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" value="${inv.id}" onclick="calculateBulkTotal()"></td>
                            <td class="p-3 font-bold">${getInvoiceDisplayNumber(inv)}</td>
                            <td class="p-3 text-gray-400 font-medium">${new Date(inv.date).toLocaleDateString()}</td>
                            <td class="p-3 text-right font-bold text-red-500">${formatCurrency(outstanding)}</td>
                            <td class="p-3 text-right">
                                <input type="number" class="invoice-pay-amount w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-right font-black text-emerald-600 text-xs" 
                                    step="0.01" max="${outstanding}" value="${outstanding.toFixed(2)}" oninput="calculateBulkTotal()" disabled>
                            </td>
                        </tr>
                    `;
                }).join('');
                invContainer.classList.remove('hidden');
            } else {
                invBody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-400 font-bold italic">No pending invoices found for this customer.</td></tr>';
                invContainer.classList.remove('hidden');
            }
        }
    }
}

function toggleAllInvoices(master) {
    const checkboxes = document.querySelectorAll('.invoice-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = master.checked;
        const row = cb.closest('tr');
        const input = row.querySelector('.invoice-pay-amount');
        if (input) input.disabled = !cb.checked;
    });
    calculateBulkTotal();
}

function calculateBulkTotal() {
    const checkboxes = document.querySelectorAll('.invoice-checkbox');
    let total = 0;
    checkboxes.forEach(cb => {
        const row = cb.closest('tr');
        const input = row.querySelector('.invoice-pay-amount');
        if (cb.checked) {
            input.disabled = false;
            total += parseFloat(input.value) || 0;
        } else {
            input.disabled = true;
        }
    });
    const mainPayInput = document.getElementById('pay-amount');
    if (mainPayInput) {
        mainPayInput.value = total > 0 ? total.toFixed(2) : '';
    }
}

async function handlePaymentSubmit(event, type) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const method = document.getElementById('pay-method').value;
    const accountCode = document.getElementById('pay-account').value;
    const date = new Date().toISOString();

    let chequeNo = null;
    let chequeDate = null;
    let chequeBank = null;
    let chequeBranch = null;
    let bankRef = null;
    let kokoRef = null;

    if (method === 'Cheque') {
        chequeNo = document.getElementById('pay-cheque-no')?.value?.trim() || null;
        chequeDate = document.getElementById('pay-cheque-date')?.value || null;
        chequeBank = document.getElementById('pay-cheque-bank')?.value?.trim() || null;
        chequeBranch = document.getElementById('pay-cheque-branch')?.value?.trim() || null;
    } else if (method === 'Bank') {
        bankRef = document.getElementById('pay-bank-ref')?.value?.trim() || null;
    } else if (method === 'KOKO') {
        kokoRef = document.getElementById('pay-koko-ref')?.value?.trim() || null;
    }

    const makeSettlementFields = (nPaid, nStatus) => {
        const fields = {
            paid_amount: nPaid,
            status: nStatus
        };
        if (nStatus === 'paid') {
            fields.settlement_payment_method = method;
            fields.settlement_date = date;
            fields.cheque_number = chequeNo;
            fields.cheque_no = chequeNo;
            fields.cheque_date = chequeDate;
            fields.cheque_bank = chequeBank;
            fields.bank_name = chequeBank;
            fields.cheque_branch = chequeBranch;
            fields.bank_reference = bankRef;
            fields.bank_ref = bankRef;
            fields.koko_reference = kokoRef;
            fields.koko_ref = kokoRef;
        }
        return fields;
    };

    try {
        let paymentId;
        await db.transaction('rw', [db.payments, db.sales, db.customers, db.ledger, db.accounts, db.bank_accounts, db.bank_transactions], async () => {
            let customerId;
            let invoiceId = null;
            let targetSale = null;
            let bulkNote = document.getElementById('pay-note')?.value || "";

            if (type === 'single') {
                invoiceId = parseInt(document.getElementById('pay-invoice-id').value);
                targetSale = await db.sales.get(invoiceId);
                if (!targetSale) {
                    const msg = `Sale record not found for Invoice #${invoiceId}.`;
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }

                customerId = targetSale.customer_id;

                // Update Sale
                const currentPaid = parseFloat(targetSale.paid_amount) || 0;
                const newPaid = currentPaid + amount;
                const total = parseFloat(targetSale.total) || 0;
                const newStatus = (newPaid >= total) ? 'paid' : 'partial';

                // Check for additional selected invoices
                const checkboxes = document.querySelectorAll('.invoice-checkbox:checked');
                const invNotes = [];

                let processedIds = new Set();

                for (const cb of checkboxes) {
                    const invId = parseInt(cb.value);
                    const row = cb.closest('tr');
                    const payAmt = parseFloat(row.querySelector('.invoice-pay-amount').value) || 0;

                    if (payAmt > 0) {
                        const s = await db.sales.get(invId);
                        if (s) {
                            const nPaid = (parseFloat(s.paid_amount) || 0) + payAmt;
                            const tTotal = parseFloat(s.total) || 0;
                            const nStatus = (nPaid >= tTotal) ? 'paid' : 'partial';
                            await db.sales.update(invId, makeSettlementFields(nPaid, nStatus));
                            invNotes.push(`${getInvoiceDisplayNumber(s)} (Rs.${payAmt.toFixed(2)})`);
                            processedIds.add(invId);
                        }
                    }
                }

                if (!processedIds.has(invoiceId)) {
                    await db.sales.update(invoiceId, makeSettlementFields(newPaid, newStatus));
                    invNotes.push(`${getInvoiceDisplayNumber(targetSale)} (Rs.${amount.toFixed(2)})`);
                }

                if (invNotes.length > 0) {
                    bulkNote = `Applied to: ${invNotes.join(', ')}`;
                }

                // Update Customer Balance
                if (customerId) {
                    const customer = await db.customers.get(customerId);
                    if (customer) {
                        const currentBal = parseFloat(customer.current_balance) || 0;
                        await db.customers.update(customerId, { current_balance: currentBal - amount });
                    }
                }
            } else {
                customerId = parseInt(document.getElementById('pay-customer-select').value);
                const customer = await db.customers.get(customerId);
                if (!customer) {
                    const msg = "Customer record not found for bulk payment.";
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }

                // Update Customer Balance
                const currentBal = parseFloat(customer.current_balance) || 0;
                await db.customers.update(customerId, { current_balance: currentBal - amount });

                // Process individual invoices if selected
                const checkboxes = document.querySelectorAll('.invoice-checkbox:checked');
                const invNotes = [];
                for (const cb of checkboxes) {
                    const invId = parseInt(cb.value);
                    const row = cb.closest('tr');
                    const payAmt = parseFloat(row.querySelector('.invoice-pay-amount').value) || 0;

                    if (payAmt > 0) {
                        const sale = await db.sales.get(invId);
                        if (sale) {
                            const newPaid = (parseFloat(sale.paid_amount) || 0) + payAmt;
                            const total = parseFloat(sale.total) || 0;
                            const newStatus = (newPaid >= total) ? 'paid' : 'partial';
                            await db.sales.update(invId, makeSettlementFields(newPaid, newStatus));
                            invNotes.push(`${getInvoiceDisplayNumber(sale)} (Rs.${payAmt.toFixed(2)})`);
                        }
                    }
                }

                // If no specific checkboxes were checked, auto-allocate FIFO across unpaid credit sales
                if (checkboxes.length === 0) {
                    const custSales = await db.sales.where('customer_id').equals(customerId).toArray();
                    const unpaidSales = custSales.filter(s => s.status !== 'paid' && s.status !== 'completed' && (s.payment_type === 'credit' || s.payment_method === 'credit' || s.status === 'unpaid' || s.status === 'partial')).sort((a, b) => new Date(a.date) - new Date(b.date));
                    let unallocated = amount;
                    for (const s of unpaidSales) {
                        if (unallocated <= 0) break;
                        const sTotal = parseFloat(s.total) || 0;
                        const sPaid = parseFloat(s.paid_amount) || 0;
                        const sDue = Math.max(0, sTotal - sPaid);
                        if (sDue > 0) {
                            const payForSale = Math.min(unallocated, sDue);
                            const nPaid = sPaid + payForSale;
                            const nStatus = (nPaid >= sTotal) ? 'paid' : 'partial';
                            await db.sales.update(s.id, makeSettlementFields(nPaid, nStatus));
                            invNotes.push(`${getInvoiceDisplayNumber(s)} (Rs.${payForSale.toFixed(2)})`);
                            unallocated -= payForSale;
                        }
                    }
                }

                if (invNotes.length > 0) {
                    bulkNote = `Applied to: ${invNotes.join(', ')}` + (bulkNote ? ` | Note: ${bulkNote}` : '');
                }
            }

            // Record Payment
            paymentId = await db.payments.add({
                date: date,
                target_id: type === 'single' ? invoiceId : (customerId || 0),
                target_type: type === 'single' ? 'invoice' : 'customer',
                invoice_id: invoiceId,
                amount: amount,
                method: method,
                account_id: accountCode,
                note: type === 'single' ? `Payment for Invoice ${getInvoiceDisplayNumber(targetSale)}` : bulkNote,
                cheque_number: chequeNo,
                cheque_no: chequeNo,
                cheque_date: chequeDate,
                cheque_bank: chequeBank,
                bank_name: chequeBank,
                cheque_branch: chequeBranch,
                bank_reference: bankRef,
                bank_ref: bankRef,
                koko_reference: kokoRef,
                koko_ref: kokoRef
            });

            // Ledger Entries
            // Safety check and auto-initialization for required system accounts
            let cashAcc = await db.accounts.where('code').equals('1000').first();
            let bankAcc = await db.accounts.where('code').equals('1010').first();
            let arAcc = await db.accounts.where('code').equals('1200').first(); // Accounts Receivable

            if (!cashAcc) {
                const id = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                cashAcc = await db.accounts.get(id);
            }
            if (!bankAcc) {
                const id = await db.accounts.add({ name: 'Bank Account', type: 'Asset', code: '1010' });
                bankAcc = await db.accounts.get(id);
            }
            if (!arAcc) {
                const id = await db.accounts.add({ name: 'Accounts Receivable', type: 'Asset', code: '1200' });
                arAcc = await db.accounts.get(id);
            }

            if (!cashAcc || !bankAcc || !arAcc) {
                const msg = 'CRITICAL: Failed to initialize system accounts (1000/1010/1200). Please check Chart of Accounts.';
                console.error(msg);
                if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                throw new Error(msg);
            }

            let depositAccId = null;
            if (accountCode === '1000') {
                depositAccId = cashAcc.id;
            } else if (accountCode === '1010') {
                depositAccId = bankAcc.id;
            } else if (typeof accountCode === 'string' && accountCode.startsWith('BANK-')) {
                depositAccId = parseInt(accountCode.split('-')[1], 10);
            }

            if (!depositAccId || Number.isNaN(depositAccId)) {
                const msg = 'Selected deposit account is invalid. Please choose a valid account.';
                console.error(msg);
                if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                throw new Error(msg);
            }

            // Debit (Increase) Cash/Bank
            await db.ledger.add({
                date: date.split('T')[0],
                account_id: depositAccId,
                amount: amount,
                type: 'debit',
                description: type === 'single' ? `Payment received for Invoice ${getInvoiceDisplayNumber(targetSale)}` : `Bulk payment from customer`,
                reference_type: 'Receipt',
                reference_id: paymentId
            });

            // Credit (Decrease) Accounts Receivable
            await db.ledger.add({
                date: date.split('T')[0],
                account_id: arAcc.id,
                amount: amount,
                type: 'credit',
                description: type === 'single' ? `Customer credit reduction for ${getInvoiceDisplayNumber(targetSale)}` : `Lump sum customer credit reduction`,
                reference_type: 'Receipt',
                reference_id: paymentId
            });

            // Update Bank Account balance & Detailed Transaction Breakdown
            if (accountCode.startsWith('BANK-')) {
                const bId = parseInt(accountCode.split('-')[1]);
                const methodLabel = method === 'Cheque' ? 'Cheque Deposit' : 'Bank Transfer';
                const ref = `Payment Receipt #${paymentId}`;
                const desc = `${methodLabel} received from Customer - ${type === 'single' ? `Invoice #${invoiceId}` : 'Bulk Collection'}`;
                await recordBankTransaction(
                    bId,
                    'inward',
                    methodLabel,
                    amount,
                    ref,
                    desc,
                    date.split('T')[0]
                );
            }
        });

        showAlert('Success', 'Payment received and recorded.');
        closePaymentModal();
        loadPayments();

        // Also refresh Finance & Receivables view if it's currently visible
        const financeView = document.getElementById('finance-view');
        if (financeView && !financeView.classList.contains('hidden') && typeof loadFinance === 'function') {
            loadFinance();
        }

        // Ask to print receipt
        Swal.fire({
            title: 'Payment Recorded',
            text: 'Would you like to print the payment receipt?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes, Print',
            cancelButtonText: 'No, Later'
        }).then((result) => {
            if (result.isConfirmed) {
                printPaymentReceipt(paymentId);
            }
        });

    } catch (err) {
        console.error(err);
        showAlert('Error', 'Payment processing failed: ' + err.message, 'error');
    }
}

// ─── Edit Payment Receipt ───────────────────────────────────────────────────
async function editPaymentReceipt(paymentId) {
    const payment = await db.payments.get(paymentId);
    if (!payment) return;

    const bankAccounts = (await db.bank_accounts?.toArray()) || [];
    let entityName = 'Walk-in';
    const isVendor = payment.target_type === 'vendor';

    if (isVendor) {
        const vendor = await db.vendors.get(payment.target_id);
        entityName = vendor?.name || 'Unknown Vendor';
    } else if (payment.target_type === 'customer') {
        const customer = await db.customers.get(payment.target_id);
        entityName = customer?.name || 'Walk-in';
    } else if (payment.target_type === 'invoice') {
        const sale = await db.sales.get(payment.target_id);
        if (sale && sale.customer_id) {
            const customer = await db.customers.get(sale.customer_id);
            entityName = customer?.name || 'Walk-in';
        } else if (sale && sale.customer_name) {
            entityName = sale.customer_name;
        }
    }

    const receiptNo = `RCP-${String(paymentId).padStart(5, '0')}`;

    let accountSelectHtml = '';
    if (isVendor) {
        accountSelectHtml = `
            <div id="edit-account-section" class="${payment.method !== 'Cash' && payment.method !== 'cash' ? '' : 'hidden'}">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deduct From Bank Account</label>
                <select id="edit-pay-account" class="swal2-input w-full m-0">
                    ${bankAccounts.map(b => `
                        <option value="${b.id}" ${payment.account_id == b.id ? 'selected' : ''}>${b.name} &mdash; ${b.bank_name || ''} (Bal: ${formatCurrency(b.balance || 0)})</option>
                    `).join('')}
                </select>
            </div>
        `;
    } else {
        accountSelectHtml = `
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deposit To</label>
                <select id="edit-pay-account" class="swal2-input w-full m-0">
                    <option value="1000" ${payment.account_id == '1000' ? 'selected' : ''}>Cash on Hand (1000)</option>
                    <option value="1010" ${payment.account_id == '1010' ? 'selected' : ''}>Bank Account (1010)</option>
                    ${bankAccounts.map(b => `
                        <option value="BANK-${b.id}" ${payment.account_id == `BANK-${b.id}` ? 'selected' : ''}>${b.name} (Bal: ${formatCurrency(b.balance || 0)})</option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    const { value: formValues, isConfirmed } = await Swal.fire({
        title: `Edit ${receiptNo}`,
        html: `
            <div class="text-left space-y-4 px-1">
                <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm">
                    <span class="font-bold text-indigo-700">${receiptNo}</span> &mdash;
                    <span class="text-gray-600">${entityName}</span>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount (Rs.)</label>
                    <input type="number" id="edit-pay-amount" step="0.01" value="${payment.amount}" class="swal2-input w-full m-0" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Method</label>
                    <select id="edit-pay-method" class="swal2-input w-full m-0">
                        <option value="Cash" ${payment.method === 'Cash' || payment.method === 'cash' ? 'selected' : ''}>Cash on Hand</option>
                        <option value="Bank" ${payment.method === 'Bank' || payment.method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
                        <option value="Cheque" ${payment.method === 'Cheque' || payment.method === 'cheque' ? 'selected' : ''}>Cheque Payment</option>
                    </select>
                </div>

                ${accountSelectHtml}
                
                <!-- Cheque Details -->
                <div id="edit-cheque-details" class="${payment.method === 'Cheque' || payment.method === 'cheque' ? '' : 'hidden'} animate-fade-in space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 text-left">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Number</label>
                            <input type="text" id="edit-pay-cheque-no" value="${payment.cheque_number || payment.cheque_no || ''}" class="swal2-input w-full m-0" placeholder="000000">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Date</label>
                            <input type="date" id="edit-pay-cheque-date" value="${payment.cheque_date || ''}" class="swal2-input w-full m-0">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issuing Bank</label>
                            <input type="text" id="edit-pay-cheque-bank" value="${payment.bank_name || payment.cheque_bank || ''}" class="swal2-input w-full m-0" placeholder="Bank Name">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</label>
                            <input type="text" id="edit-pay-cheque-branch" value="${payment.cheque_branch || ''}" class="swal2-input w-full m-0" placeholder="Branch Name">
                        </div>
                    </div>
                </div>

                <!-- Bank Account Preview -->
                <div id="edit-bank-account-preview" class="${payment.method === 'Bank' || payment.method === 'bank' ? '' : 'hidden'} animate-fade-in p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 text-left">
                    <!-- Loaded dynamically -->
                </div>

                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Remarks / Note</label>
                    <input type="text" id="edit-pay-note" value="${payment.note || ''}" class="swal2-input w-full m-0" placeholder="Optional note...">
                </div>
            </div>
        `,
        confirmButtonText: '<i class="fa-solid fa-save mr-2"></i> Save Changes',
        confirmButtonColor: '#4F46E5',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        didOpen: () => {
            const methodSelect = Swal.getPopup().querySelector('#edit-pay-method');
            const chequeDetails = Swal.getPopup().querySelector('#edit-cheque-details');
            const bankPreview = Swal.getPopup().querySelector('#edit-bank-account-preview');
            const accountSection = Swal.getPopup().querySelector('#edit-account-section');

            // Load bank preview if Bank is initially selected
            if ((methodSelect.value === 'Bank' || methodSelect.value === 'bank') && bankPreview) {
                loadBankAccountPreview('edit-bank-account-preview');
            }

            methodSelect.addEventListener('change', (e) => {
                const methodVal = e.target.value;
                if (methodVal === 'Cheque' || methodVal === 'cheque') {
                    chequeDetails.classList.remove('hidden');
                } else {
                    chequeDetails.classList.add('hidden');
                }
                if (methodVal === 'Bank' || methodVal === 'bank') {
                    if (bankPreview) {
                        bankPreview.classList.remove('hidden');
                        loadBankAccountPreview('edit-bank-account-preview');
                    }
                } else {
                    if (bankPreview) bankPreview.classList.add('hidden');
                }

                if (accountSection) {
                    if (methodVal.toLowerCase() === 'cash') {
                        accountSection.classList.add('hidden');
                    } else {
                        accountSection.classList.remove('hidden');
                    }
                }
            });
        },
        preConfirm: () => {
            const amount = parseFloat(document.getElementById('edit-pay-amount').value);
            if (!amount || amount <= 0) {
                Swal.showValidationMessage('Please enter a valid amount.');
                return false;
            }

            const method = document.getElementById('edit-pay-method').value;
            const accountIdEl = document.getElementById('edit-pay-account');
            let account_id = null;
            if (accountIdEl && !accountIdEl.closest('.hidden')) {
                account_id = isVendor ? parseInt(accountIdEl.value, 10) : accountIdEl.value;
            }

            const data = {
                amount,
                method: isVendor ? method.toLowerCase() : method,
                account_id,
                note: document.getElementById('edit-pay-note').value
            };

            if (method === 'Cheque' || method === 'cheque') {
                data.cheque_number = document.getElementById('edit-pay-cheque-no').value;
                data.cheque_no = document.getElementById('edit-pay-cheque-no').value;
                data.cheque_date = document.getElementById('edit-pay-cheque-date').value;
                data.bank_name = document.getElementById('edit-pay-cheque-bank').value;
                data.cheque_bank = document.getElementById('edit-pay-cheque-bank').value;
                data.cheque_branch = document.getElementById('edit-pay-cheque-branch').value;
            } else {
                data.cheque_number = null;
                data.cheque_no = null;
                data.cheque_date = null;
                data.bank_name = null;
                data.cheque_bank = null;
                data.cheque_branch = null;
            }

            return data;
        }
    });

    if (!isConfirmed || !formValues) return;

    try {
        const oldAmount = payment.amount;

        await db.transaction('rw', [db.payments, db.customers, db.vendors, db.sales, db.ledger, db.accounts, db.bank_accounts, db.bank_transactions, db.expenses], async () => {
            // 1. REVERSAL OF OLD PAYMENT IMPACTS

            // Revert customer/vendor balance
            if (payment.target_id) {
                const table = isVendor ? db.vendors : db.customers;
                let entityId = payment.target_id;
                if (payment.target_type === 'invoice') {
                    const sale = await db.sales.get(payment.target_id);
                    if (sale && sale.customer_id) entityId = sale.customer_id;
                    else entityId = null;
                }
                if (entityId) {
                    const ent = await table.get(entityId);
                    if (ent) {
                        await table.update(entityId, {
                            current_balance: (parseFloat(ent.current_balance) || 0) + oldAmount
                        });
                    }
                }
            }

            // Revert old bank transactions & balances
            let refQueryStr = `Payment Receipt #${paymentId}`;
            let matchTransactions = await db.bank_transactions.filter(t => t.reference === refQueryStr || (isVendor && t.reference === `Vendor #${payment.target_id}` && t.amount === oldAmount)).toArray();
            for (const t of matchTransactions) {
                const bankAcc = await db.bank_accounts.get(t.bank_account_id);
                if (bankAcc) {
                    const newBalance = t.type === 'inward'
                        ? bankAcc.balance - t.amount
                        : bankAcc.balance + t.amount;
                    await db.bank_accounts.update(t.bank_account_id, { balance: newBalance });
                }
                await db.bank_transactions.delete(t.id);
            }

            // Remove old ledger entries
            await db.ledger.where({ reference_id: paymentId }).delete();

            // Remove old expense records (if vendor payment)
            if (isVendor) {
                const linkedExpenses = await db.expenses.filter(e =>
                    (e.reference_type === 'Payment' && e.reference_id === paymentId) ||
                    (e.category === 'Supplier Payment' && e.reference_type === 'Payment' && e.reference_id === payment.target_id && e.amount === oldAmount)
                ).toArray();
                for (const exp of linkedExpenses) {
                    await db.expenses.delete(exp.id);
                }
            }

            // 2. APPLY NEW PAYMENT IMPACTS
            const newAmount = formValues.amount;
            const newMethod = formValues.method;
            const newAccountId = formValues.account_id;
            const newNote = formValues.note;

            // Update payment record in database
            await db.payments.update(paymentId, {
                amount: newAmount,
                method: newMethod,
                account_id: newAccountId,
                note: newNote,
                cheque_number: formValues.cheque_number,
                cheque_no: formValues.cheque_no,
                cheque_date: formValues.cheque_date,
                bank_name: formValues.bank_name,
                cheque_bank: formValues.cheque_bank,
                cheque_branch: formValues.cheque_branch
            });

            // Adjust customer/vendor balance with new amount
            if (payment.target_id) {
                const table = isVendor ? db.vendors : db.customers;
                let entityId = payment.target_id;
                if (payment.target_type === 'invoice') {
                    const sale = await db.sales.get(payment.target_id);
                    if (sale && sale.customer_id) entityId = sale.customer_id;
                    else entityId = null;
                }
                if (entityId) {
                    const ent = await table.get(entityId);
                    if (ent) {
                        await table.update(entityId, {
                            current_balance: (parseFloat(ent.current_balance) || 0) - newAmount
                        });
                    }
                }
            }

            // Create new ledger entries
            const accounts = await db.accounts.toArray();
            let payableAcc = accounts.find(a => a.code === '2000');
            if (!payableAcc) {
                const id = await db.accounts.add({ name: 'Accounts Payable', type: 'Liability', code: '2000' });
                payableAcc = await db.accounts.get(id);
            }

            let cashAcc = accounts.find(a => a.code === '1000');
            if (!cashAcc) {
                const id = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                cashAcc = await db.accounts.get(id);
            }

            let bankAcc = accounts.find(a => a.code === '1010');
            if (!bankAcc) {
                const id = await db.accounts.add({ name: 'Bank Account', type: 'Asset', code: '1010' });
                bankAcc = await db.accounts.get(id);
            }

            let arAcc = accounts.find(a => a.code === '1200');
            if (!arAcc) {
                const id = await db.accounts.add({ name: 'Accounts Receivable', type: 'Asset', code: '1200' });
                arAcc = await db.accounts.get(id);
            }

            if (isVendor) {
                let sourceAccId = newMethod.toLowerCase() === 'cash' ? cashAcc.id : bankAcc.id;
                // Debit Payable, Credit Cash/Bank
                await db.ledger.add({
                    date: payment.date.split('T')[0],
                    account_id: payableAcc.id,
                    amount: newAmount,
                    type: 'debit',
                    description: newNote || `Payment to supplier`,
                    reference_type: 'Payment',
                    reference_id: paymentId
                });
                await db.ledger.add({
                    date: payment.date.split('T')[0],
                    account_id: sourceAccId,
                    amount: newAmount,
                    type: 'credit',
                    description: newNote || `Payment to supplier`,
                    reference_type: 'Payment',
                    reference_id: paymentId
                });

                // Add new Expense record
                await db.expenses.add({
                    date: payment.date,
                    category: 'Supplier Payment',
                    account_id: payableAcc.id,
                    amount: newAmount,
                    description: newNote || `Payment to supplier (${newMethod})`,
                    payment_method: newMethod.toLowerCase() === 'bank' || newMethod.toLowerCase() === 'cheque' ? newMethod.toLowerCase() : 'cash',
                    bank_account_id: newAccountId || null,
                    reference_type: 'Payment',
                    reference_id: paymentId
                });

                // Record new Outward Bank Transaction
                if (newAccountId && (newMethod.toLowerCase() === 'bank' || newMethod.toLowerCase() === 'cheque')) {
                    const methodLabel = newMethod.toLowerCase() === 'bank' ? 'Bank Transfer' : 'Cheque Payment';
                    const ref = `Payment Receipt #${paymentId}`;
                    const descSuffix = newMethod.toLowerCase() === 'cheque' && formValues.cheque_no
                        ? ` (Cheque No: ${formValues.cheque_no}${formValues.cheque_bank ? ', Bank: ' + formValues.cheque_bank : ''})`
                        : '';
                    const vendor = await db.vendors.get(payment.target_id);
                    const desc = `${methodLabel} — Payment to ${vendor?.name || 'Supplier'}${descSuffix}`;

                    await recordBankTransaction(
                        newAccountId,
                        'outward',
                        methodLabel,
                        newAmount,
                        ref,
                        desc,
                        payment.date.split('T')[0]
                    );
                }
            } else {
                // Customer Payment Receipt
                let depositAccId = null;
                if (newAccountId === '1000') {
                    depositAccId = cashAcc.id;
                } else if (newAccountId === '1010') {
                    depositAccId = bankAcc.id;
                } else if (typeof newAccountId === 'string' && newAccountId.startsWith('BANK-')) {
                    depositAccId = parseInt(newAccountId.split('-')[1], 10);
                }

                if (!depositAccId || Number.isNaN(depositAccId)) {
                    const msg = 'Selected deposit account is invalid.';
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }

                // Debit Cash/Bank, Credit Accounts Receivable
                await db.ledger.add({
                    date: payment.date.split('T')[0],
                    account_id: depositAccId,
                    amount: newAmount,
                    type: 'debit',
                    description: newNote || `Payment received from customer`,
                    reference_type: 'Receipt',
                    reference_id: paymentId
                });
                await db.ledger.add({
                    date: payment.date.split('T')[0],
                    account_id: arAcc.id,
                    amount: newAmount,
                    type: 'credit',
                    description: newNote || `Customer credit reduction`,
                    reference_type: 'Receipt',
                    reference_id: paymentId
                });

                // Record new Inward Bank Transaction
                if (typeof newAccountId === 'string' && newAccountId.startsWith('BANK-')) {
                    const bId = parseInt(newAccountId.split('-')[1]);
                    const methodLabel = newMethod === 'Cheque' ? 'Cheque Deposit' : 'Bank Transfer';
                    const ref = `Payment Receipt #${paymentId}`;
                    const desc = `${methodLabel} received from Customer - ${payment.target_type === 'invoice' ? `Invoice #${payment.target_id}` : 'Bulk Collection'}`;
                    await recordBankTransaction(
                        bId,
                        'inward',
                        methodLabel,
                        newAmount,
                        ref,
                        desc,
                        payment.date.split('T')[0]
                    );
                }
            }

            // Recalculate invoice status if it's an invoice payment
            if (payment.target_type === 'invoice') {
                const saleId = payment.target_id;
                const sale = await db.sales.get(saleId);
                if (sale) {
                    const diff = newAmount - oldAmount;
                    const newPaid = (parseFloat(sale.paid_amount) || 0) + diff;

                    let newStatus = 'partial';
                    if (newPaid >= parseFloat(sale.total)) newStatus = 'paid';
                    else if (newPaid <= 0) newStatus = 'unpaid';

                    await db.sales.update(saleId, {
                        paid_amount: newPaid,
                        status: newStatus
                    });
                }
            }
        });

        showAlert('Success', 'Payment record updated successfully.', 'success');
        filterPaymentsList();
        updatePendingStats();
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to update payment: ' + err.message, 'error');
    }
}

// ─── Delete Payment Receipt ──────────────────────────────────────────────────
async function deletePaymentReceipt(paymentId) {
    const payment = await db.payments.get(paymentId);
    if (!payment) return;

    const isVendor = payment.target_type === 'vendor';
    let entityName = 'Walk-in';
    if (isVendor) {
        const vendor = await db.vendors.get(payment.target_id);
        entityName = vendor?.name || 'Unknown Vendor';
    } else if (payment.target_type === 'customer') {
        const customer = await db.customers.get(payment.target_id);
        entityName = customer?.name || 'Walk-in';
    } else if (payment.target_type === 'invoice') {
        const sale = await db.sales.get(payment.target_id);
        if (sale && sale.customer_id) {
            const customer = await db.customers.get(sale.customer_id);
            entityName = customer?.name || 'Walk-in';
        } else if (sale && sale.customer_name) {
            entityName = sale.customer_name;
        }
    }
    const receiptNo = `RCP-${String(paymentId).padStart(5, '0')}`;

    const { isConfirmed } = await Swal.fire({
        title: `Delete ${receiptNo}?`,
        html: `
            <div class="text-sm text-gray-600">
                <p>This will <strong class="text-red-600">permanently delete</strong> this payment receipt and <strong>reverse the customer's balance</strong>.</p>
                <div class="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-left">
                    <div class="flex justify-between text-xs">
                        <span class="text-gray-500">Receipt</span>
                        <span class="font-black">${receiptNo}</span>
                    </div>
                    <div class="flex justify-between text-xs mt-1">
                        <span class="text-gray-500">${isVendor ? 'Vendor' : 'Customer'}</span>
                        <span class="font-black">${entityName}</span>
                    </div>
                    <div class="flex justify-between text-xs mt-1">
                        <span class="text-gray-500">Amount</span>
                        <span class="font-black text-red-600">${formatCurrency(payment.amount)}</span>
                    </div>
                </div>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: '<i class="fa-solid fa-trash-can mr-2"></i> Yes, Delete',
        confirmButtonColor: '#ef4444',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
        await db.transaction('rw', [db.payments, db.customers, db.vendors, db.ledger, db.sales, db.bank_accounts, db.bank_transactions, db.expenses], async () => {
            // Reverse balance (add the amount back — undoing the payment)
            if (payment.target_id) {
                const table = isVendor ? db.vendors : db.customers;
                let entityId = payment.target_id;
                if (payment.target_type === 'invoice') {
                    const sale = await db.sales.get(payment.target_id);
                    if (sale && sale.customer_id) entityId = sale.customer_id;
                    else entityId = null;
                }
                if (entityId) {
                    const ent = await table.get(entityId);
                    if (ent) {
                        await table.update(entityId, {
                            current_balance: (parseFloat(ent.current_balance) || 0) + payment.amount
                        });
                    }
                }
            }

            // Reverse old bank transactions & balances
            let refQueryStr = `Payment Receipt #${paymentId}`;
            let matchTransactions = await db.bank_transactions.filter(t => t.reference === refQueryStr || (isVendor && t.reference === `Vendor #${payment.target_id}` && t.amount === payment.amount)).toArray();
            for (const t of matchTransactions) {
                const bankAcc = await db.bank_accounts.get(t.bank_account_id);
                if (bankAcc) {
                    const newBalance = t.type === 'inward'
                        ? bankAcc.balance - t.amount
                        : bankAcc.balance + t.amount;
                    await db.bank_accounts.update(t.bank_account_id, { balance: newBalance });
                }
                await db.bank_transactions.delete(t.id);
            }

            // Remove related ledger entries (both Receipt and Payment types)
            await db.ledger.where({ reference_id: paymentId }).delete();

            // Delete related expense if it is a vendor payment
            if (isVendor) {
                const linkedExpenses = await db.expenses.filter(e =>
                    (e.reference_type === 'Payment' && e.reference_id === paymentId) ||
                    (e.category === 'Supplier Payment' && e.reference_type === 'Payment' && e.reference_id === payment.target_id && e.amount === payment.amount)
                ).toArray();
                for (const exp of linkedExpenses) {
                    await db.expenses.delete(exp.id);
                }
            }

            // Delete the payment
            await db.payments.delete(paymentId);

            // Recalculate invoice status if it's an invoice payment
            if (payment.target_type === 'invoice') {
                const saleId = payment.target_id;
                const sale = await db.sales.get(saleId);
                if (sale) {
                    const newPaid = (parseFloat(sale.paid_amount) || 0) - payment.amount;

                    let newStatus = 'unpaid';
                    if (newPaid >= parseFloat(sale.total)) newStatus = 'paid';
                    else if (newPaid > 0) newStatus = 'partial';

                    await db.sales.update(saleId, {
                        paid_amount: newPaid,
                        status: newStatus
                    });
                }
            }
        });

        showAlert('Deleted', 'Payment receipt deleted and balance reversed.', 'success');
        loadPayments(); // Full reload to update stats
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to delete payment: ' + err.message, 'error');
    }
}

// ─── Print Payment Receipt ────────────────────────────────────────────────────
async function printPaymentReceipt(paymentId, isPreview = false) {
    const payment = await db.payments.get(paymentId);
    if (!payment) return;

    const isVendor = payment.target_type === 'vendor';
    let entity = null;
    if (isVendor) {
        entity = await db.vendors.get(payment.target_id);
    } else {
        entity = await db.customers.get(payment.target_id);
    }

    // If entity is not found, try to get customer name from linked invoice
    let linkedSale = null;
    if (payment.invoice_id) {
        linkedSale = await db.sales.get(payment.invoice_id);
        if (!entity && linkedSale && linkedSale.customer_name) {
            entity = { id: payment.target_id, name: linkedSale.customer_name };
        }
    }
    const invDisplay = linkedSale ? getInvoiceDisplayNumber(linkedSale) : (payment.invoice_id ? 'INV-M' + String(payment.invoice_id).padStart(4, '0') : 'N/A');

    // Load store settings
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || '';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const storeLogo = opts['store_logo'] || '';
    const invoiceColor = opts['invoice_color'] || '#4F46E5';
    const invoiceTemplate = opts['invoice_template'] || 'thermal';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';
    const receiptFooterInfo = opts['receipt_footer_info'] || '';
    const bankDetails = opts['enabled_bank_details'] === false ? '' : (opts['bank_details'] || '');
    const chequeName = opts['enabled_cheque_name'] === true ? (opts['cheque_name'] || '') : '';
    const paymentQR = opts['enabled_payment_qr'] === false ? '' : (opts['payment_qr'] || '');

    const docTitle = isVendor ? 'PAYMENT VOUCHER' : 'OFFICIAL RECEIPT';
    const docPrefix = 'RCP-';
    const accentColor = isVendor ? '#ef4444' : invoiceColor;
    const dateStr = new Date(payment.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let html = '';

    // ==========================================
    // TEMPLATE: THERMAL
    // ==========================================
    if (invoiceTemplate === 'thermal') {
        html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Thermal ${docTitle} - ${docPrefix}${String(paymentId).padStart(5, '0')}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #000; padding: 5px; margin: 0; width: 80mm; background: #fff; }
                    .center { text-align: center; }
                    .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                    .text-xs { font-size: 10px; }
                    .text-sm { font-size: 12px; }
                    .bold { font-weight: bold; }
                    @media print { margin: 0; }
                </style>
            </head>
            <body>
                <div class="center">
                    ${storeLogo ? `<img src="${storeLogo}" style="max-width: 60px; max-height: 60px; margin-bottom: 5px;">` : ''}
                    <h2 style="margin:0; font-size:14px;">${storeName.toUpperCase()}</h2>
                    <p class="text-xs" style="margin:2px 0;"><b>${storeSubheading}</b></p>
                    ${enabledStoreAddress ? `<p class="text-xs" style="margin:2px 0;">${storeAddress.split('\n').join('<br>')}</p>` : ''}
                    <p class="text-xs" style="margin:2px 0;">Tel: ${storePhone}</p>
                </div>
                
                <div class="divider"></div>
                <div class="text-xs">
                    <strong>${docTitle}</strong><br>
                    No: ${docPrefix}${String(paymentId).padStart(5, '0')}<br>
                    Date: ${dateStr}<br>
                    ${isVendor ? 'Paid To' : 'Received From'}: ${entity?.name || (isVendor ? 'Unknown Vendor' : 'Walk-in Customer')}<br>
                    Ref: ${invDisplay}
                </div>
                <div class="divider"></div>

                <div class="center" style="padding: 10px 0;">
                    <div class="text-xs" style="text-transform: uppercase; margin-bottom: 5px;">Total Amount ${isVendor ? 'Paid' : 'Received'}</div>
                    <div style="font-size: 24px; font-weight: 900;">${formatCurrency(payment.amount)}</div>
                    <div class="text-xs" style="margin-top: 5px; font-weight: bold;">Method: ${payment.method}</div>
                    ${payment.method === 'Cheque' && payment.cheque_number ? `
                    <div class="text-xs" style="margin-top: 2px;">Cheque: ${payment.cheque_number} (${payment.bank_name || 'N/A'})</div>` : ''}
                </div>

                <div class="divider"></div>
                ${payment.note ? `<div class="text-xs" style="font-style: italic; margin-bottom: 10px;">Note: ${payment.note}</div><div class="divider"></div>` : ''}
                
                ${paymentQR ? `<div class="center" style="margin: 10px 0;"><img src="${paymentQR}" style="max-width: 100px; height: auto;"></div>` : ''}
                
                <div class="center text-xs" style="margin-top:10px;">
                    <p>Thank you for your business.</p>
                    ${receiptFooterInfo ? `<div style="margin-top: 6px; font-size: 10px; color: #4b5563; line-height: 1.5; font-weight: 700; white-space: pre-line; border-top: 1px dashed #ddd; padding-top: 5px;">${receiptFooterInfo}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 8px; color: #666; border-top: 1px dashed #ccc; padding-top: 5px; font-weight: bold;">
                        Powered by Infinity Creative Works (+94 76 5 449 005)
                    </div>
                </div>
                ${isPreview ? '' : '<script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>'}
            </body>
            </html>
        `;
    }
    // ==========================================
    // TEMPLATE: PROFESSIONAL (DEFAULT)
    // ==========================================
    else {
        const _snLen = (storeName || '').length;
        const headerFontSize = _snLen > 35 ? '13px' : _snLen > 28 ? '15px' : _snLen > 20 ? '18px' : '22px';

        html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docTitle} - ${docPrefix}${String(paymentId).padStart(5, '0')}</title>
                <style>
                    @media print { 
                        @page { size: A4; margin: 0; } 
                        body { margin: 0; -webkit-print-color-adjust: exact; } 
                        .page { box-shadow: none !important; margin: 0 !important; }
                    }
                    html, body { margin: 0; padding: 0; width: 100%; background: #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif; }
                    .page { background: #fff; width: 210mm; min-height: 297mm; margin: 10mm auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 15mm; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
                    .text-primary { color: ${accentColor}; }
                    .label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="page">
                    <div style="flex: 1 0 auto; display: flex; flex-direction: column;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="display:flex; align-items:center; gap: 15px;">
                            ${storeLogo ? `<img src="${storeLogo}" style="max-height: 80px; max-width:120px; object-fit:contain; margin-right: 15px;">` : ''}
                            <div>
                                <h1 style="margin:0; font-size:${headerFontSize}; text-transform:uppercase; line-height:1.2;" class="text-primary"><b>${storeName}</b></h1>
                                <p style="margin:2px 0 0 0; font-size:11px; color:#444; letter-spacing: 0.5px;"><b>${storeSubheading}</b></p>
                                ${enabledStoreAddress ? `<p style="margin:5px 0 0 0; font-size:12px; color:#666;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                                <div style="margin-top:5px; font-size:11px; color:#666;">
                                    ${storePhone} ${storeEmail ? ` | ${storeEmail}` : ''}
                                    ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                    ${storeBR ? ` | BR: ${storeBR}` : ''}
                                </div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <h2 style="margin:0; font-size:24px; text-transform: uppercase;"><b>${docTitle}</b></h2>
                            <div style="margin-top:5px; font-size: 14px;">
                                <strong>Doc No:</strong> ${docPrefix}${String(paymentId).padStart(5, '0')}<br>
                                <strong>Date:</strong> ${dateStr}
                            </div>
                        </div>
                    </div>

                    <hr style="margin:20px 0; border:0; border-top:2px solid ${accentColor};">

                    <div style="display:flex; justify-content:space-between; margin-bottom: 40px;">
                        <div style="width:55%; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #eee;">
                            <strong style="text-transform: uppercase; font-size: 10px;" class="text-primary">${isVendor ? 'PAID TO:' : 'RECEIVED FROM:'}</strong>
                            <div style="margin-top:10px; line-height: 1.4; font-size: 13px;">
                                <b style="font-size: 18px;">${entity?.name || (isVendor ? 'Unknown Vendor' : 'Walk-in Customer')}</b><br>
                                ${(isVendor ? entity?.contact_person : entity?.company) || '-'}<br>
                                <strong>Contact:</strong> ${entity?.phone || '-'}
                            </div>
                        </div>
                        <div style="width:40%; text-align:right; padding: 10px;">
                            <strong style="text-transform: uppercase; font-size: 10px;" class="text-primary">Transaction Details:</strong>
                            <div style="margin-top:10px; line-height: 1.8; font-size: 13px;">
                                <strong>Method:</strong> ${payment.method}<br>
                                ${payment.method === 'Cheque' && payment.cheque_number ? `<strong>Cheque:</strong> ${payment.cheque_number} (${payment.bank_name || 'N/A'})<br>` : ''}
                                <strong>Ref:</strong> ${invDisplay}<br>
                                <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">RECORDED</span>
                            </div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 50px; border-radius: 25px; text-align: center; border: 2px solid #e2e8f0; margin-bottom: 40px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -20px; left: -20px; width: 100px; height: 100px; background: ${accentColor}; opacity: 0.03; border-radius: 50%;"></div>
                        <div class="label" style="margin-bottom: 20px;">Total Amount ${isVendor ? 'Paid' : 'Received'}</div>
                        <div style="font-size: 56px; font-weight: 900; color: ${accentColor}; letter-spacing: -2px;">${formatCurrency(payment.amount)}</div>
                        <div style="margin-top: 25px; font-style: italic; color: #64748b; font-size: 16px; max-width: 80%; margin-left: auto; margin-right: auto; line-height: 1.6;">
                            "${payment.note || 'No additional remarks.'}"
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 60px;">
                        <div style="width:45%; display: flex; flex-direction: column; gap: 10px;">
                            ${bankDetails ? `
                            <div style="border: 1px dashed ${accentColor}; border-radius: 10px; padding: 15px; background: #fafafa; font-size: 11px;">
                                <strong style="color: ${accentColor}; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 5px;">Bank Transfer Details:</strong>
                                <div style="line-height: 1.5; color: #444;">
                                    ${bankDetails.split('\n').map(line => line.includes(':') ? `<strong>${line.split(':')[0]}:</strong>${line.split(':').slice(1).join(':')}` : line).join('<br>')}
                                </div>
                            </div>` : ''}
                        </div>
                        <div style="width:25%; text-align: center;">
                            ${paymentQR ? `<div style="border: 2px dashed ${accentColor}; border-radius: 15px; padding: 12px; background: #fff; display: inline-block;"><img src="${paymentQR}" style="max-width: 100px; height: auto;"></div>` : ''}
                        </div>
                        <div style="width:25%;"></div>
                    </div>
                    </div>
                    <div class="page-bottom" style="flex-shrink: 0; margin-top: auto;">

                    <div style="display:flex; justify-content:space-between; margin-top: 20px; font-size: 10px; font-weight: bold;">
                        <div style="text-align:center; width: 30%;">
                            <div style="border-bottom: 1px solid #ccc; height: 45px; margin-bottom: 10px;"></div>
                            <div style="color: #666; text-transform: uppercase; font-size: 9px; letter-spacing: 1px;">Authorized Signature</div>
                        </div>
                        <div style="text-align:center; width: 30%;">
                            <div style="border-bottom: 1px solid #ccc; height: 45px; margin-bottom: 10px;"></div>
                            <div style="color: #666; text-transform: uppercase; font-size: 9px; letter-spacing: 1px;">${isVendor ? 'Vendor' : 'Customer'} Signature</div>
                        </div>
                    </div>

                    <div style="text-align: center; color: #555; font-size:10px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                        <div style="margin-bottom: 8px; font-weight: 800; color: #111; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
                            Thank you for your business. This is a computer-generated receipt.
                        </div>
                        ${receiptFooterInfo ? `<div style="color: #4b5563; font-size: 10px; line-height: 1.5; font-weight: 700; white-space: pre-line; margin: 8px 0; border-top: 1px dashed #eee; padding-top: 8px;">${receiptFooterInfo}</div>` : ''}
                        <div style="margin-top: 15px; font-size: 8px; color: #94a3b8; border-top: 1px dashed #eee; padding-top: 10px; font-weight: 600;">
                            Powered by <a href="https://wa.me/94765449005" style="color: #4f46e5; text-decoration: none; font-weight: bold;">Infinity Creative Works +94 76 5 449 005</a>
                        </div>
                    </div>
                </div>
                </div>
                ${isPreview ? '' : '<script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>'}
            </body>
            </html>
        `;
    }

    if (isPreview) {
        openPreviewModal(
            html,
            () => printPaymentReceipt(paymentId, false),
            () => editPaymentReceipt(paymentId),
            null,
            null
        );
        return;
    }

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        showAlert('Popup Blocked', 'Please allow popups for this site to print.', 'warning');
    }
}

