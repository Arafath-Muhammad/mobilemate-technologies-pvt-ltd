// Outstanding Payments Module
// Shows: Customer Receivables (money TO receive) + Vendor Payables (money WE owe)

function isCashTermsInvoice(sale) {
    if (!sale) return false;
    if (sale.status === 'unpaid' || sale.status === 'partial') return false;
    const payType = String(sale.payment_type || '').toLowerCase().trim();
    const payTerms = String(sale.payment_terms || '').toLowerCase().trim();
    const payMethod = String(sale.payment_method || '').toLowerCase().trim();

    if (payType === 'cash' || payTerms === 'cash' || payMethod === 'cash') return true;
    if (payType.includes('cash') || payTerms.includes('cash') || payMethod.includes('cash')) return true;
    return false;
}

async function loadOutstanding() {
    console.log('Loading Outstanding Payments view...');
    const container = document.getElementById('outstanding-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    container.innerHTML = `
        <div class="space-y-6">

            <!-- Page Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Outstanding Payments</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track receivables from customers &amp; payables to vendors in real-time.</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="outstanding-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="outstanding-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <button onclick="recalculateAllBalances()" class="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-bold text-sm transition-all shadow-sm">
                        <i class="fa-solid fa-calculator"></i> Sync Balances
                    </button>
                    <button onclick="loadOutstanding()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-all">
                        <i class="fa-solid fa-arrows-rotate"></i> Refresh
                    </button>
                    <button onclick="printOutstandingReport()" class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all">
                        <i class="fa-solid fa-print"></i> Print Report
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="outstanding-summary-cards">
                <div class="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-28"></div>
                <div class="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-28"></div>
                <div class="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-28"></div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200 dark:border-darkBorder">
                <div class="flex gap-1">
                    <button id="tab-receivables" onclick="switchOutstandingTab('receivables')"
                        class="px-6 py-3 text-sm font-bold border-b-2 border-primary text-primary transition-all">
                        <i class="fa-solid fa-arrow-down-to-bracket mr-2 text-emerald-500"></i>Receivable from Customers
                    </button>
                    <button id="tab-payables" onclick="switchOutstandingTab('payables')"
                        class="px-6 py-3 text-sm font-bold border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-primary transition-all">
                        <i class="fa-solid fa-arrow-up-from-bracket mr-2 text-red-500"></i>Payable to Vendors
                    </button>
                </div>
            </div>

            <!-- Receivables Panel -->
            <div id="panel-receivables" class="">
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-100 dark:border-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/40 dark:bg-emerald-900/10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                <i class="fa-solid fa-users text-emerald-600 dark:text-emerald-400"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-black text-gray-900 dark:text-white">Amounts to Collect from Customers</h3>
                                <p class="text-xs text-gray-500">Credit sales &amp; unpaid invoices</p>
                            </div>
                        </div>
                        <div class="relative">
                            <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                            <input type="text" id="receivables-search" oninput="filterOutstandingTable('receivables-body', this.value)"
                                class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white w-52 transition-colors"
                                placeholder="Search customer...">
                        </div>
                    </div>
                    <div class="overflow-auto custom-scrollbar">
                        <table class="w-full text-left border-collapse min-w-[700px]">
                            <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10">
                                <tr>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">#</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Customer</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Phone</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Invoices</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Outstanding (Rs.)</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="receivables-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                                <tr><td colspan="6" class="text-center py-12">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Payables Panel (hidden by default) -->
            <div id="panel-payables" class="hidden">
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-100 dark:border-darkBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/40 dark:bg-red-900/10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <i class="fa-solid fa-shop text-red-600 dark:text-red-400"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-black text-gray-900 dark:text-white">Amounts We Owe to Vendors</h3>
                                <p class="text-xs text-gray-500">Credit purchases &amp; unpaid supplier bills</p>
                            </div>
                        </div>
                        <div class="relative">
                            <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                            <input type="text" id="payables-search" oninput="filterOutstandingTable('payables-body', this.value)"
                                class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-gray-900 dark:text-white w-52 transition-colors"
                                placeholder="Search vendor...">
                        </div>
                    </div>
                    <div class="overflow-auto custom-scrollbar">
                        <table class="w-full text-left border-collapse min-w-[700px]">
                            <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10">
                                <tr>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">#</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Vendor</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Phone</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Bank Details</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Bills</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Outstanding (Rs.)</th>
                                    <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="payables-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                                <tr><td colspan="6" class="text-center py-12">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    `;

    const refreshOutstanding = () => {
        renderOutstandingSummary();
        renderReceivables();
        renderPayables();
    };

    document.getElementById('outstanding-start-date')?.addEventListener('change', refreshOutstanding);
    document.getElementById('outstanding-end-date')?.addEventListener('change', refreshOutstanding);

    await renderOutstandingSummary();
    await renderReceivables();
    await renderPayables();
}

function switchOutstandingTab(tab) {
    const tabs = ['receivables', 'payables'];
    tabs.forEach(t => {
        const tabBtn = document.getElementById('tab-' + t);
        const panel = document.getElementById('panel-' + t);
        if (t === tab) {
            tabBtn.classList.add('border-primary', 'text-primary');
            tabBtn.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            panel.classList.remove('hidden');
        } else {
            tabBtn.classList.remove('border-primary', 'text-primary');
            tabBtn.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
            panel.classList.add('hidden');
        }
    });
}

async function renderOutstandingSummary() {
    const cardsEl = document.getElementById('outstanding-summary-cards');
    if (!cardsEl) return;

    const startDate = document.getElementById('outstanding-start-date')?.value || '';
    const endDate = document.getElementById('outstanding-end-date')?.value || '';

    const customers = await db.customers.toArray();
    const vendors = await db.vendors.toArray();
    let allSales = await db.sales.toArray();
    let allGRNs = await db.grn.toArray();
    let allPayments = await db.payments.toArray();

    if (startDate && endDate) {
        allSales = allSales.filter(s => {
            const d = s.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
        allGRNs = allGRNs.filter(g => {
            const d = g.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
        allPayments = allPayments.filter(p => {
            const d = p.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    // Calculate Dynamic Receivables
    const customerBalances = customers.map(c => {
        const custSales = allSales.filter(s =>
            s.customer_id === c.id &&
            (['invoice', 'pos_invoice', 'web_order', 'sale'].includes(s.document_type)) &&
            !isCashTermsInvoice(s) &&
            (['credit', 'cod'].includes(String(s.payment_type || s.payment_terms || '').toLowerCase().trim()))
        );
        const totalSales = custSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        const custPayments = allPayments.filter(p => {
            if (p.target_type === 'customer') return p.target_id === c.id;
            if (p.target_type === 'invoice') {
                const sale = allSales.find(s => s.id === p.target_id);
                return sale && sale.customer_id === c.id;
            }
            return false;
        });
        const totalPaid = custPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        return { id: c.id, bal: totalSales - totalPaid };
    }).filter(b => b.bal > 0.01).sort((a, b) => b.bal - a.bal);

    // Keep all customer balances in the summary calculation

    // Calculate Dynamic Payables
    const vendorBalances = vendors.map(v => {
        const vendGRNs = allGRNs.filter(g => g.vendor_id === v.id && (g.status === 'completed' || g.status === 'partial' || g.status === 'received'));
        const totalPurchases = vendGRNs.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0);
        const vendPayments = allPayments.filter(p => p.target_id === v.id && p.target_type === 'vendor');
        const totalPaid = vendPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        return { id: v.id, bal: totalPurchases - totalPaid };
    });

    const totalReceivable = customerBalances.reduce((sum, b) => sum + Math.max(0, b.bal), 0);
    const totalPayable = vendorBalances.reduce((sum, b) => sum + Math.max(0, b.bal), 0);
    const netPosition = totalReceivable - totalPayable;

    const custWithBalance = customerBalances.filter(b => b.bal > 0.01).length;
    const vendWithBalance = vendorBalances.filter(b => b.bal > 0.01).length;

    cardsEl.innerHTML = `
        <!-- Total Receivable -->
        <div class="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div class="absolute -right-2 -bottom-6 w-16 h-16 bg-white/10 rounded-full"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-arrow-down-to-bracket text-sm"></i>
                    </div>
                    <p class="text-xs font-black uppercase tracking-widest opacity-90">Total Receivable</p>
                </div>
                <p class="text-3xl font-black tracking-tight leading-none">${formatCurrency(totalReceivable)}</p>
                <p class="text-xs font-bold mt-2 opacity-75">${custWithBalance} customer${custWithBalance !== 1 ? 's' : ''} with balance</p>
            </div>
        </div>

        <!-- Total Payable -->
        <div class="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-xl shadow-red-500/20">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div class="absolute -right-2 -bottom-6 w-16 h-16 bg-white/10 rounded-full"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-arrow-up-from-bracket text-sm"></i>
                    </div>
                    <p class="text-xs font-black uppercase tracking-widest opacity-90">Total Payable</p>
                </div>
                <p class="text-3xl font-black tracking-tight leading-none">${formatCurrency(totalPayable)}</p>
                <p class="text-xs font-bold mt-2 opacity-75">${vendWithBalance} vendor${vendWithBalance !== 1 ? 's' : ''} with balance</p>
            </div>
        </div>

        <!-- Net Position -->
        <div class="relative overflow-hidden bg-gradient-to-br ${netPosition >= 0 ? 'from-primary to-indigo-700' : 'from-amber-500 to-orange-600'} rounded-2xl p-5 text-white shadow-xl ${netPosition >= 0 ? 'shadow-primary/20' : 'shadow-amber-500/20'}">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div class="absolute -right-2 -bottom-6 w-16 h-16 bg-white/10 rounded-full"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-scale-balanced text-sm"></i>
                    </div>
                    <p class="text-xs font-black uppercase tracking-widest opacity-90">Net Position</p>
                </div>
                <p class="text-3xl font-black tracking-tight leading-none">${formatCurrency(Math.abs(netPosition))}</p>
                <p class="text-xs font-bold mt-2 opacity-75">${netPosition >= 0 ? '✓ Net Surplus (Receivable > Payable)' : '⚠ Net Deficit (Payable > Receivable)'}</p>
            </div>
        </div>
    `;
}

async function renderReceivables() {
    const tbody = document.getElementById('receivables-body');
    if (!tbody) return;

    const startDate = document.getElementById('outstanding-start-date')?.value || '';
    const endDate = document.getElementById('outstanding-end-date')?.value || '';

    const customers = await db.customers.toArray();
    let allSales = await db.sales.toArray();
    let allCustomerPayments = await db.payments.where('target_type').anyOf(['customer', 'invoice']).toArray();

    if (startDate && endDate) {
        allSales = allSales.filter(s => {
            const d = s.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
        allCustomerPayments = allCustomerPayments.filter(p => {
            const d = p.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    const withBalance = customers.map(c => {
        const custSales = allSales.filter(s =>
            s.customer_id === c.id &&
            (['invoice', 'pos_invoice', 'web_order', 'sale'].includes(s.document_type)) &&
            !isCashTermsInvoice(s) &&
            (['credit', 'cod'].includes(String(s.payment_type || s.payment_terms || '').toLowerCase().trim()))
        );
        const totalSales = custSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        
        const custPayments = allCustomerPayments.filter(p => {
            if (p.target_type === 'customer') return p.target_id === c.id;
            if (p.target_type === 'invoice') {
                const sale = allSales.find(s => s.id === p.target_id);
                return sale && sale.customer_id === c.id;
            }
            return false;
        });
        const totalPaid = custPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const dynamicBalance = totalSales - totalPaid;
        return { ...c, dynamicBalance };
    }).filter(c => c.dynamicBalance > 0.01)
    .sort((a, b) => b.dynamicBalance - a.dynamicBalance);

    if (withBalance.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-check-circle text-3xl text-emerald-400"></i>
                    </div>
                    <p class="text-gray-400 font-bold text-sm">All customer balances are clear!</p>
                    <p class="text-xs text-gray-400">No outstanding receivables found.</p>
                </div>
            </td></tr>`;
        return;
    }

    let html = '';
    withBalance.forEach((c, idx) => {
        const bal = c.dynamicBalance;
        const urgencyClass = bal > 50000 ? 'text-red-600 dark:text-red-400' :
                             bal > 10000 ? 'text-amber-600 dark:text-amber-400' :
                             'text-emerald-600 dark:text-emerald-400';
        const urgencyBg = bal > 50000 ? 'bg-red-50 dark:bg-red-900/20' :
                          bal > 10000 ? 'bg-amber-50 dark:bg-amber-900/20' :
                          'bg-emerald-50 dark:bg-emerald-900/20';
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group outstanding-row" data-name="${(c.name || '').toLowerCase()}">
                <td class="p-4 text-xs text-gray-400 font-bold">${idx + 1}</td>
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                            ${(c.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">${c.name || 'Unknown'}</p>
                            <p class="text-[10px] text-gray-500">${c.company || 'Private Customer'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${c.phone || '—'}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="previewCustomerOutstandingReport(${c.id})" class="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1" title="Outstanding Report (Pending Only)">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Report
                        </button>
                        <span class="text-gray-300 dark:text-gray-600">|</span>
                        <button onclick="viewCustomerProfile(${c.id})" class="text-xs font-bold text-primary hover:underline">Invoices</button>
                    </div>
                </td>
                <td class="p-4 text-right">
                    <span class="inline-block px-3 py-1.5 rounded-xl text-sm font-black ${urgencyClass} ${urgencyBg}">
                        ${formatCurrency(bal)}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex flex-col items-center gap-1.5">
                        <div class="flex items-center gap-1 w-full max-w-[90px]">
                            <button onclick="previewCustomerOutstandingReport(${c.id})" 
                                class="flex-1 p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-all text-xs border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800" title="Outstanding Report (Pending Only)">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </button>
                            <button onclick="viewCustomerProfile(${c.id})" 
                                class="flex-1 p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-all text-xs border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800" title="Preview Profile">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button onclick="editCustomerInRelationship(${c.id})" 
                                class="flex-1 p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition-all text-xs border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800" title="Edit Customer">
                                <i class="fa-solid fa-user-pen"></i>
                            </button>
                        </div>
                        <button onclick="quickReceivePayment(${c.id})"
                            class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-xs font-bold shadow-sm w-full max-w-[90px] justify-center">
                            <i class="fa-solid fa-money-bill-1-wave"></i> Receive
                        </button>
                        <button onclick="deleteOutstandingCustomer(${c.id})"
                            class="flex items-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white px-3 py-1 rounded-lg transition-all text-[10px] font-bold border border-red-500/20 w-full max-w-[90px] justify-center">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

async function renderPayables() {
    const tbody = document.getElementById('payables-body');
    if (!tbody) return;

    const startDate = document.getElementById('outstanding-start-date')?.value || '';
    const endDate = document.getElementById('outstanding-end-date')?.value || '';

    const vendors = await db.vendors.toArray();
    let allGRNs = await db.grn.toArray();
    let allPayments = await db.payments.where('target_type').equals('vendor').toArray();

    if (startDate && endDate) {
        allGRNs = allGRNs.filter(g => {
            const d = g.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
        allPayments = allPayments.filter(p => {
            const d = p.date.split('T')[0];
            return d >= startDate && d <= endDate;
        });
    }

    const withBalance = vendors.map(v => {
        // Calculate total from completed GRNs
        const vendorGRNs = allGRNs.filter(g => g.vendor_id === v.id && (g.status === 'completed' || g.status === 'partial' || g.status === 'received'));
        const totalPurchases = vendorGRNs.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0);
        
        // Calculate total payments to this vendor
        const vendorPayments = allPayments.filter(p => p.target_id === v.id);
        const totalPaid = vendorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const dynamicBalance = totalPurchases - totalPaid;
        const hasAttachments = vendorGRNs.some(g => !!g.invoice_image);
        return { ...v, dynamicBalance, hasAttachments };
    }).filter(v => v.dynamicBalance > 0.01)
    .sort((a, b) => b.dynamicBalance - a.dynamicBalance);

    if (withBalance.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-check-circle text-3xl text-emerald-400"></i>
                    </div>
                    <p class="text-gray-400 font-bold text-sm">No pending vendor payments!</p>
                    <p class="text-xs text-gray-400">All vendor balances are settled.</p>
                </div>
            </td></tr>`;
        return;
    }

    let html = '';
    withBalance.forEach((v, idx) => {
        const bal = v.dynamicBalance;
        const urgencyClass = bal > 50000 ? 'text-red-600 dark:text-red-400' :
                             bal > 10000 ? 'text-amber-600 dark:text-amber-400' :
                             'text-rose-600 dark:text-rose-400';
        const urgencyBg = bal > 50000 ? 'bg-red-50 dark:bg-red-900/20' :
                          bal > 10000 ? 'bg-amber-50 dark:bg-amber-900/20' :
                          'bg-red-50 dark:bg-red-900/20';
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group outstanding-row" data-name="${(v.name || '').toLowerCase()}">
                <td class="p-4 text-xs text-gray-400 font-bold">${idx + 1}</td>
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-sm shrink-0">
                            ${(v.name || 'V').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">${v.name || 'Unknown'}</p>
                            <p class="text-[10px] text-gray-500">${v.contact_person || 'Supplier'}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${v.phone || '—'}</td>
                <td class="p-4">
                    <p class="text-[11px] font-bold text-gray-800 dark:text-white">${v.bank_name || '—'}</p>
                    <p class="text-[10px] text-gray-500 font-mono">${v.bank_acc || ''}</p>
                </td>
                <td class="p-4 text-center">
                    <button onclick="viewVendorBillAttachments(${v.id}, event)" class="text-xs font-bold text-primary hover:underline">View Bills</button>
                </td>
                <td class="p-4 text-right">
                    <span class="inline-block px-3 py-1.5 rounded-xl text-sm font-black ${urgencyClass} ${urgencyBg}">
                        ${formatCurrency(bal)}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex flex-col items-center gap-1.5">
                        <div class="flex items-center gap-1 w-full max-w-[90px]">
                            <button onclick="editVendor(${v.id})" 
                                class="flex-1 p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition-all text-xs border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800" title="Edit Vendor">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="adjustVendorBalance(${v.id})" 
                                class="flex-1 p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-all text-xs border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800" title="Adjust Balance">
                                <i class="fa-solid fa-sliders"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-1 w-full max-w-[90px]">
                            <button onclick="quickVendorPayment(${v.id})"
                                class="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-xs font-bold shadow-sm justify-center">
                                <i class="fa-solid fa-money-bill-transfer"></i> Pay
                            </button>
                            ${v.hasAttachments ? `
                                <button onclick="viewVendorBillAttachments(${v.id}, event)"
                                    class="w-8 h-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-sm border border-emerald-400/20" title="Preview Attached Invoices">
                                    <i class="fa-solid fa-file-invoice"></i>
                                </button>
                            ` : ''}
                        </div>
                        <button onclick="deleteOutstandingVendor(${v.id})"
                            class="flex items-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white px-3 py-1 rounded-lg transition-all text-[10px] font-bold border border-red-500/20 w-full max-w-[90px] justify-center">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function filterOutstandingTable(tbodyId, query) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const q = query.toLowerCase().trim();
    tbody.querySelectorAll('.outstanding-row').forEach(row => {
        const name = row.getAttribute('data-name') || '';
        row.style.display = (!q || name.includes(q)) ? '' : 'none';
    });
}

// Quick receive payment from customer (re-uses customers.js logic)
async function quickReceivePayment(customerId) {
    if (typeof openCustomerPaymentModal === 'function') {
        await openCustomerPaymentModal(customerId);
    } else {
        showAlert('Error', 'Payment module not loaded.', 'error');
    }
}

// Quick pay vendor (re-uses vendors.js logic)
async function quickVendorPayment(vendorId) {
    if (typeof openVendorPaymentModal === 'function') {
        await openVendorPaymentModal(vendorId);
    } else {
        showAlert('Error', 'Payment module not loaded.', 'error');
    }
}

async function viewVendorBillAttachments(vendorId, event = null) {
    const vendor = await db.vendors.get(vendorId);
    if (!vendor) return;

    const ev = event || window.event;
    const isPreviewBtn = ev && ev.target && ev.target.closest('button') && ev.target.closest('button').title === 'Preview Attached Invoices';

    const grns = await db.grn.where('vendor_id').equals(vendorId).reverse().toArray();
    const grnsWithAttachments = grns.filter(g => !!g.invoice_image);

    if (grnsWithAttachments.length === 0) {
        // If they just clicked "View Bills", we can show all bills
        // But for the "Preview" button, we should warn if no attachments
        const hasBills = grns.length > 0;
        if (!hasBills) {
            return showAlert('No Bills', 'This vendor has no recorded GRN bills.', 'info');
        }
        
        // If they clicked "View Bills" column, show them all
        const listHtml = grns.map(g => `
            <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter">GRN-${String(g.id).padStart(5, '0')}</p>
                        ${g.invoice_image ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>' : ''}
                    </div>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${new Date(g.date).toLocaleDateString()} • Rs. ${parseFloat(g.total).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="printGRN(${g.id}, null, true)" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="View GRN">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    ${g.invoice_image ? `
                        <button onclick="viewBillInvoiceImage('GRN', ${g.id})" class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all" title="View Attachment">
                            <i class="fa-solid fa-file-invoice"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        return Swal.fire({
            title: `<div class="text-left px-2"><h3 class="text-xl font-black italic uppercase tracking-tighter">${vendor.name}</h3><p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Vendor Bill History</p></div>`,
            html: `<div class="space-y-3 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-2">${listHtml}</div>`,
            showConfirmButton: false,
            showCloseButton: true,
            width: '550px',
            customClass: { popup: 'rounded-3xl' }
        });
    }

    if (grnsWithAttachments.length === 1 && isPreviewBtn) {
        // Direct preview if only one and clicked the preview button
        if (typeof viewBillInvoiceImage === 'function') {
            viewBillInvoiceImage('GRN', grnsWithAttachments[0].id);
            return;
        }
    }

    // Show list if multiple or if "View Bills" column clicked
    const listHtml = grns.map(g => `
        <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div>
                <div class="flex items-center gap-2">
                    <p class="text-sm font-black text-gray-900 dark:text-white tracking-tighter">GRN-${String(g.id).padStart(5, '0')}</p>
                    ${g.invoice_image ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>' : ''}
                </div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${new Date(g.date).toLocaleDateString()} • Rs. ${parseFloat(g.total).toLocaleString()}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="printGRN(${g.id}, null, true)" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all" title="View GRN">
                    <i class="fa-solid fa-eye"></i>
                </button>
                ${g.invoice_image ? `
                    <button onclick="viewBillInvoiceImage('GRN', ${g.id})" class="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all" title="View Attachment">
                        <i class="fa-solid fa-file-invoice"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: `<div class="text-left px-2"><h3 class="text-xl font-black italic uppercase tracking-tighter">${vendor.name}</h3><p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Vendor Bill History</p></div>`,
        html: `<div class="space-y-3 mt-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-2">${listHtml}</div>`,
        showConfirmButton: false,
        showCloseButton: true,
        width: '550px',
        customClass: { popup: 'rounded-3xl' }
    });
}


async function adjustVendorBalance(vendorId) {
    const vendor = await db.vendors.get(vendorId);
    if (!vendor) return;

    const { value: newBalance } = await Swal.fire({
        title: 'Adjust Vendor Balance',
        html: `
            <div class="text-left">
                <p class="text-sm text-gray-500 mb-4">Setting manual balance for <b>${vendor.name}</b>. This will override the current system-calculated balance.</p>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Current Balance</label>
                <p class="text-lg font-black text-gray-900 dark:text-white mb-4">${formatCurrency(vendor.current_balance || 0)}</p>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">New Balance (Rs.)</label>
            </div>
        `,
        input: 'number',
        inputValue: vendor.current_balance || 0,
        inputAttributes: {
            step: '0.01',
            min: '0'
        },
        showCancelButton: true,
        confirmButtonText: 'Update Balance',
        confirmButtonColor: '#4f46e5',
        inputValidator: (value) => {
            if (!value && value !== 0) {
                return 'You must enter a balance!';
            }
        }
    });

    if (newBalance !== undefined) {
        try {
            const parsedBalance = parseFloat(newBalance);
            await db.vendors.update(vendorId, { current_balance: parsedBalance });
            
            if (typeof logActivity === 'function') {
                await logActivity(`Manually adjusted balance for vendor ${vendor.name} to ${formatCurrency(parsedBalance)}`);
            }
            
            showAlert('Success', 'Vendor balance updated successfully.', 'success');
            loadOutstanding(); // Refresh view
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to update balance: ' + err.message, 'error');
        }
    }
}

async function printOutstandingReport() {
    const customers = await db.customers.toArray();
    const vendors = await db.vendors.toArray();
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || 'MobileMate POS';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeLogo = opts['store_logo'] || '';
    const invoiceColor = opts['invoice_color'] || '#0e3257';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    // Auto-scale header font based on company name length
    const _snLen = (storeName || '').length;
    const headerFontSize = _snLen > 35 ? '12px' : _snLen > 28 ? '14px' : _snLen > 20 ? '17px' : '20px';


    const custWithBal = customers.filter(c => parseFloat(c.current_balance || 0) > 0)
        .sort((a, b) => parseFloat(b.current_balance) - parseFloat(a.current_balance));
    const vendWithBal = vendors.filter(v => parseFloat(v.current_balance || 0) > 0)
        .sort((a, b) => parseFloat(b.current_balance) - parseFloat(a.current_balance));

    const totalReceivable = custWithBal.reduce((s, c) => s + parseFloat(c.current_balance || 0), 0);
    const totalPayable = vendWithBal.reduce((s, v) => s + parseFloat(v.current_balance || 0), 0);
    const netPos = totalReceivable - totalPayable;

    const custRows = custWithBal.map((c, i) => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 12px;font-size:12px;">${i + 1}</td>
            <td style="padding:10px 12px;"><strong style="font-size:13px;">${c.name}</strong><br><span style="font-size:10px;color:#888;">${c.company || 'Private'}</span></td>
            <td style="padding:10px 12px;font-size:12px;">${c.phone || '—'}</td>
            <td align="right" style="padding:10px 12px;font-weight:900;font-size:13px;color:#10b981;">Rs. ${parseFloat(c.current_balance).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
        </tr>
    `).join('');

    const vendRows = vendWithBal.map((v, i) => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 12px;font-size:12px;">${i + 1}</td>
            <td style="padding:10px 12px;"><strong style="font-size:13px;">${v.name}</strong><br><span style="font-size:10px;color:#888;">${v.contact_person || 'Vendor'}</span></td>
            <td style="padding:10px 12px;font-size:12px;">${v.phone || '—'}</td>
            <td align="right" style="padding:10px 12px;font-weight:900;font-size:13px;color:#ef4444;">Rs. ${parseFloat(v.current_balance).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Outstanding Payments Report</title>
    <style>
        @media print { @page { size: A4; margin: 0; } body { margin: 0; } .page { box-shadow: none !important; margin: 0 !important; } .no-print { display: none !important; } }
        body { margin: 0; padding: 0; background: #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif; -webkit-print-color-adjust: exact; }
        .page { background: #fff; width: 210mm; margin: 10mm auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); min-height: 297mm; padding: 15mm; box-sizing: border-box; }
        h2.section { margin: 25px 0 10px 0; font-size: 14px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; padding: 8px 12px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr th { padding: 10px 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    </style>
</head>
<body>
<div class="page">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:15px;">
            ${storeLogo ? `<img src="${storeLogo}" style="max-height:70px;max-width:110px;object-fit:contain;">` : ''}
            <div>
                <h1 style="margin:0;color:${invoiceColor};font-size:${headerFontSize};text-transform:uppercase;font-weight:900;line-height:1.2;">${storeName}</h1>
                ${enabledStoreAddress ? `<p style="margin:3px 0 0 0;font-size:11px;color:#555;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                <p style="margin:2px 0 0 0;font-size:10px;color:#888;">${storePhone}${storeEmail ? ' | ' + storeEmail : ''}${storeWebsite ? ' | ' + storeWebsite : ''}</p>
            </div>
        </div>
        <div style="text-align:right;">
            <h2 style="margin:0;font-size:22px;font-weight:900;color:#334155;letter-spacing:2px;">OUTSTANDING<br>REPORT</h2>
            <p style="margin:5px 0 0 0;font-size:11px;color:#666;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})}</p>
        </div>
    </div>

    <hr style="border:0;border-top:3px solid ${invoiceColor};margin:0 0 20px 0;">

    <!-- Summary -->
    <div style="display:flex;gap:15px;margin-bottom:25px;">
        <div style="flex:1;background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:15px;">
            <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;color:#16a34a;letter-spacing:1px;">Total Receivable</p>
            <p style="margin:5px 0 0 0;font-size:22px;font-weight:900;color:#15803d;">Rs. ${totalReceivable.toLocaleString('en-US',{minimumFractionDigits:2})}</p>
            <p style="margin:3px 0 0 0;font-size:10px;color:#166534;">${custWithBal.length} customers with outstanding balance</p>
        </div>
        <div style="flex:1;background:#fff1f2;border:1.5px solid #fca5a5;border-radius:12px;padding:15px;">
            <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;color:#dc2626;letter-spacing:1px;">Total Payable</p>
            <p style="margin:5px 0 0 0;font-size:22px;font-weight:900;color:#b91c1c;">Rs. ${totalPayable.toLocaleString('en-US',{minimumFractionDigits:2})}</p>
            <p style="margin:3px 0 0 0;font-size:10px;color:#991b1b;">${vendWithBal.length} vendors with outstanding balance</p>
        </div>
        <div style="flex:1;background:${netPos >= 0 ? '#eff6ff' : '#fef3c7'};border:1.5px solid ${netPos >= 0 ? '#93c5fd' : '#fbbf24'};border-radius:12px;padding:15px;">
            <p style="margin:0;font-size:10px;font-weight:900;text-transform:uppercase;color:${netPos >= 0 ? '#2563eb' : '#d97706'};letter-spacing:1px;">Net Position</p>
            <p style="margin:5px 0 0 0;font-size:22px;font-weight:900;color:${netPos >= 0 ? '#1d4ed8' : '#92400e'};">Rs. ${Math.abs(netPos).toLocaleString('en-US',{minimumFractionDigits:2})}</p>
            <p style="margin:3px 0 0 0;font-size:10px;color:${netPos >= 0 ? '#1e3a8a' : '#78350f'};">${netPos >= 0 ? 'Net surplus (receivable > payable)' : 'Net deficit (payable > receivable)'}</p>
        </div>
    </div>

    <!-- Customer Receivables -->
    <h2 class="section" style="background:#f0fdf4;color:#15803d;border-left:4px solid #16a34a;">
        <i>▼</i> Customer Receivables — Amounts to Collect
    </h2>
    <table>
        <thead><tr style="background:${invoiceColor};color:#fff;">
            <th align="left" width="5%">#</th>
            <th align="left" width="40%">Customer Name</th>
            <th align="left" width="30%">Phone</th>
            <th align="right" width="25%">Outstanding</th>
        </tr></thead>
        <tbody>
            ${custRows || '<tr><td colspan="4" align="center" style="padding:20px;color:#aaa;font-style:italic;">No outstanding receivables.</td></tr>'}
            <tr style="border-top:2px solid #334155;">
                <td colspan="3" style="padding:10px 12px;font-weight:900;text-align:right;font-size:13px;">TOTAL RECEIVABLE</td>
                <td align="right" style="padding:10px 12px;font-weight:900;font-size:15px;color:#15803d;">Rs. ${totalReceivable.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
            </tr>
        </tbody>
    </table>

    <!-- Vendor Payables -->
    <h2 class="section" style="background:#fff1f2;color:#b91c1c;border-left:4px solid #dc2626;margin-top:30px;">
        <i>▲</i> Vendor Payables — Amounts We Owe
    </h2>
    <table>
        <thead><tr style="background:#dc2626;color:#fff;">
            <th align="left" width="5%">#</th>
            <th align="left" width="40%">Vendor Name</th>
            <th align="left" width="30%">Phone</th>
            <th align="right" width="25%">Outstanding</th>
        </tr></thead>
        <tbody>
            ${vendRows || '<tr><td colspan="4" align="center" style="padding:20px;color:#aaa;font-style:italic;">No outstanding payables.</td></tr>'}
            <tr style="border-top:2px solid #334155;">
                <td colspan="3" style="padding:10px 12px;font-weight:900;text-align:right;font-size:13px;">TOTAL PAYABLE</td>
                <td align="right" style="padding:10px 12px;font-weight:900;font-size:15px;color:#b91c1c;">Rs. ${totalPayable.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
            </tr>
        </tbody>
    </table>

    <!-- Footer -->
    <div style="position:absolute;bottom:15mm;left:15mm;right:15mm;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;color:#94a3b8;font-size:9px;">
        This is a computer-generated report and does not require a physical signature.<br>
        <strong style="color:#475569;">Powered by Infinity Creative Works (+94 76 5 449 005)</strong>
    </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 800); }</script>
</body>
</html>`;

    if (typeof openPreviewModal === 'function') {
        openPreviewModal(
            html, 
            () => {
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); }
            },
            null,
            null,
            (html) => {
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Outstanding Report', `ORD-${new Date().getTime().toString().slice(-6)}`, 'Internal Report', totalReceivable, [], html);
                }
            }
        );
    } else {
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); }
    }
}

async function deleteOutstandingCustomer(id) {
    const confirm = await Swal.fire({
        title: 'Delete Customer?',
        text: "This customer and their related history will be removed. Proceed with caution!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Delete it'
    });

    if (confirm.isConfirmed) {
        try {
            const customer = await db.customers.get(id);
            if (!customer) return;

            const sales = await db.sales.where('customer_id').equals(id).toArray();
            const saleIds = sales.map(s => s.id);

            await db.transaction('rw', db.customers, db.sales, db.payments, db.ledger, async () => {
                // 1. Delete Customer Record
                await db.customers.delete(id);

                // 2. Delete Sales & Ledger for Sales
                await db.sales.where('customer_id').equals(id).delete();
                for (const sid of saleIds) {
                    await db.ledger.where({ reference_id: sid, reference_type: 'Sale' }).delete();
                }

                // 3. Delete Payments & Ledger for Payments
                await db.payments.where({ target_id: id, target_type: 'customer' }).delete();
                await db.ledger.where({ reference_id: id, reference_type: 'Payment' }).delete();
            });
            
            if (typeof logActivity === 'function') await logActivity(`Deleted Customer: ${customer.name}`);
            
            showAlert('Success', 'Customer and history deleted successfully.');
            loadOutstanding(); // Refresh view
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to delete customer: ' + err.message, 'error');
        }
    }
}

async function deleteOutstandingVendor(id) {
    const confirm = await Swal.fire({
        title: 'Delete Vendor?',
        text: "This vendor and their related history will be removed. Proceed with caution!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Delete it'
    });

    if (confirm.isConfirmed) {
        try {
            const vendor = await db.vendors.get(id);
            if (!vendor) return;

            const purchases = await db.purchases.where('vendor_id').equals(id).toArray();
            const grns = await db.grn.where('vendor_id').equals(id).toArray();

            await db.transaction('rw', db.vendors, db.purchases, db.grn, db.payments, db.ledger, async () => {
                // 1. Delete Vendor Record
                await db.vendors.delete(id);

                // 2. Delete Purchases/GRNs
                await db.purchases.where('vendor_id').equals(id).delete();
                await db.grn.where('vendor_id').equals(id).delete();

                // 3. Delete Payments & Ledger for Payments
                await db.payments.where({ target_id: id, target_type: 'vendor' }).delete();
                await db.ledger.where({ reference_id: id, reference_type: 'Payment' }).delete();
            });
            
            if (typeof logActivity === 'function') await logActivity(`Deleted Vendor: ${vendor.name}`);
            
            showAlert('Success', 'Vendor and history deleted successfully.');
            loadOutstanding(); // Refresh view
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to delete vendor: ' + err.message, 'error');
        }
    }
}
async function recalculateAllBalances() {
    try {
        const confirm = await Swal.fire({
            title: 'Recalculate All Balances?',
            text: 'This will audit all GRNs and Payments to re-sync vendor balances. Use this if you see discrepancies.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Sync Now',
            confirmButtonColor: '#4f46e5'
        });

        if (!confirm.isConfirmed) return;

        Swal.fire({
            title: 'Syncing Balances...',
            html: 'Please wait while we audit all transactions.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const vendors = await db.vendors.toArray();
        const allGRNs = await db.grn.toArray();
        const allPayments = await db.payments.where('target_type').equals('vendor').toArray();

        for (const v of vendors) {
            const vendorGRNs = allGRNs.filter(g => g.vendor_id === v.id && (g.status === 'completed' || g.status === 'partial' || g.status === 'received'));
            const totalPurchases = vendorGRNs.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0);
            
            const vendorPayments = allPayments.filter(p => p.target_id === v.id);
            const totalPaid = vendorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            const newBalance = totalPurchases - totalPaid;
            await db.vendors.update(v.id, { current_balance: newBalance });
        }

        // Recalculate Customer Balances
        const customers = await db.customers.toArray();
        const allSales = await db.sales.toArray();
        const allCustomerPayments = await db.payments.where('target_type').anyOf(['customer', 'invoice']).toArray();

        for (const c of customers) {
            // IMPORTANT: Only credit and COD sales create a receivable balance.
            // Cash, bank, card, QR payments are settled at point-of-sale and
            // must NOT be included in the outstanding balance calculation.
            const custSales = allSales.filter(s =>
                s.customer_id === c.id &&
                (['invoice', 'pos_invoice', 'web_order', 'sale'].includes(s.document_type)) &&
                !isCashTermsInvoice(s) &&
                (['credit', 'cod'].includes(String(s.payment_type || s.payment_terms || '').toLowerCase().trim()))
            );
            const totalSales = custSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
            
            const custPayments = allCustomerPayments.filter(p => {
                if (p.target_type === 'customer') return p.target_id === c.id;
                if (p.target_type === 'invoice') {
                    const sale = allSales.find(s => s.id === p.target_id);
                    return sale && sale.customer_id === c.id;
                }
                return false;
            });
            const totalPaid = custPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            const newBalance = totalSales - totalPaid;
            await db.customers.update(c.id, { current_balance: newBalance });
        }

        await loadOutstanding();
        Swal.fire('Success', 'All vendor and customer balances have been re-synchronized.', 'success');
    } catch (err) {
        console.error('Error recalculating balances:', err);
        Swal.fire('Error', 'Failed to recalculate balances.', 'error');
    }
}
