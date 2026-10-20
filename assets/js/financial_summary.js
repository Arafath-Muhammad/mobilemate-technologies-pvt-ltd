// Financial Summary Dashboard Logic
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

let fsFilterPeriod = 'all'; // 'all' | 'today' | 'this_month' | 'this_year' | 'custom'
let fsStartDate = '';
let fsEndDate = '';

async function loadFinancialSummary() {
    try {
        console.log("Loading Financial Summary Dashboard...");
        const container = document.getElementById('financial-summary-view');
        if (!container) return;

        // Initialize default dates if custom is selected but dates are empty
        if (!fsStartDate || !fsEndDate) {
            const today = new Date().toISOString().split('T')[0];
            fsStartDate = today;
            fsEndDate = today;
        }

        // Render the skeleton layout first
        container.innerHTML = `
            <div class="space-y-6 pb-12">
                <!-- Header and Filter Controls -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                    <div class="space-y-1">
                        <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
                            <i class="fa-solid fa-chart-simple text-sky-500"></i> Financial Summary
                        </h2>
                        <p class="text-xs font-black text-gray-400 uppercase tracking-widest opacity-80">Real-time business performance & cash flow auditing</p>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-3">
                        <!-- Period Dropdown selector -->
                        <div class="relative">
                            <select id="fs-period-select" onchange="changeFSPeriod(this.value)" class="pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[11px] font-black text-gray-700 dark:text-gray-300 transition-all outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat min-w-[140px]">
                                <option value="all" ${fsFilterPeriod === 'all' ? 'selected' : ''}>ALL TIME</option>
                                <option value="today" ${fsFilterPeriod === 'today' ? 'selected' : ''}>TODAY</option>
                                <option value="this_month" ${fsFilterPeriod === 'this_month' ? 'selected' : ''}>THIS MONTH</option>
                                <option value="this_year" ${fsFilterPeriod === 'this_year' ? 'selected' : ''}>THIS YEAR</option>
                                <option value="custom" ${fsFilterPeriod === 'custom' ? 'selected' : ''}>CUSTOM RANGE</option>
                            </select>
                        </div>
                        
                        <!-- Custom Date Pickers (Shown only when Custom is chosen) -->
                        <div id="fs-date-picker-wrap" class="flex items-center gap-2 ${fsFilterPeriod === 'custom' ? 'flex' : 'hidden'} bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <input type="date" id="fs-start-date" value="${fsStartDate}" onchange="updateFSCustomDates()" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-28 cursor-pointer uppercase">
                            <span class="text-gray-300 dark:text-gray-600 font-black">/</span>
                            <input type="date" id="fs-end-date" value="${fsEndDate}" onchange="updateFSCustomDates()" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-28 cursor-pointer uppercase">
                        </div>

                        <!-- Action Buttons -->
                        <button onclick="calculateFSMetrics()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-sync-alt"></i> Recalculate Accounts
                        </button>
                        <button onclick="exportFSReport()" class="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-file-pdf"></i> Report / Print
                        </button>
                    </div>
                </div>

                <!-- Primary KPI Grid -->
                <div id="fs-kpi-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Cards will be dynamically injected here -->
                </div>

                <!-- Secondary Breakdowns and Opening Balances -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Balance Sheet Ledger and Setters -->
                    <div class="lg:col-span-1 bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm p-6 space-y-6">
                        <div>
                            <h3 class="text-base font-black uppercase text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <i class="fa-solid fa-sliders text-sky-500"></i> Setup Balances
                            </h3>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">User-defined opening ledger balances</p>
                        </div>

                        <div class="space-y-4">
                            <!-- Opening Cash Balance Card -->
                            <div class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div>
                                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Opening Cash Balance</p>
                                    <h4 id="fs-opening-cash-lbl" class="text-lg font-black text-gray-900 dark:text-white">Rs. 0.00</h4>
                                </div>
                                <button onclick="promptEditFSOpeningBalance('cash')" class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl transition-all active:scale-95" title="Edit Cash Balance">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>

                            <!-- Opening Bank Balance Card -->
                            <div class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div>
                                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Opening Bank Balance</p>
                                    <h4 id="fs-opening-bank-lbl" class="text-lg font-black text-gray-900 dark:text-white">Rs. 0.00</h4>
                                </div>
                                <button onclick="promptEditFSOpeningBalance('bank')" class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl transition-all active:scale-95" title="Edit Bank Balance">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>
                        </div>

                        <!-- System Audit Indicators -->
                        <div class="pt-4 border-t border-gray-100 dark:border-gray-800/60 space-y-3">
                            <h4 class="text-[10px] font-black uppercase text-gray-400 tracking-wider">Audit Status</h4>
                            <div class="flex items-center justify-between text-xs font-semibold">
                                <span class="text-gray-500 dark:text-gray-400">Ledger Discrepancy</span>
                                <span id="fs-audit-discrepancy-badge" class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">0.00</span>
                            </div>
                            <div class="flex items-center justify-between text-xs font-semibold">
                                <span class="text-gray-500 dark:text-gray-400">Last Audited</span>
                                <span class="text-gray-700 dark:text-gray-300 font-mono text-[10px] font-bold">Real-time</span>
                            </div>
                        </div>
                    </div>

                    <!-- Cash & Bank Reconciliation Details -->
                    <div class="lg:col-span-2 bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm p-6 flex flex-col justify-between">
                        <div class="space-y-4">
                            <div>
                                <h3 class="text-base font-black uppercase text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <i class="fa-solid fa-building-columns text-sky-500"></i> Reconciliation breakdown
                                </h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Details of bank and cash-in-hand transactions</p>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr class="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                            <th class="pb-2.5">Component / Description</th>
                                            <th class="pb-2.5 text-right">Inflow (+)</th>
                                            <th class="pb-2.5 text-right">Outflow (-)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="fs-recon-table-body" class="divide-y divide-gray-100/50 dark:divide-gray-800/30">
                                        <!-- Dynamic table rows -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/60">
                            <div>
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Calculated Cash</p>
                                <h4 id="fs-recon-calc-cash" class="text-xl font-black text-emerald-600 dark:text-emerald-400">Rs. 0.00</h4>
                            </div>
                            <div>
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Calculated Bank</p>
                                <h4 id="fs-recon-calc-bank" class="text-xl font-black text-sky-600 dark:text-sky-400">Rs. 0.00</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Financial Logs table -->
                <div class="bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                    <div class="p-6 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between bg-gray-50/20 dark:bg-darkBg/20">
                        <div>
                            <h3 class="text-base font-black uppercase text-gray-900 dark:text-white tracking-tight">
                                <i class="fa-solid fa-list-check text-sky-500 mr-1.5"></i> Auditable Transactions
                            </h3>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Recent financial postings in the ledger</p>
                        </div>
                        <span id="fs-logs-count-badge" class="bg-gray-100 dark:bg-gray-800 text-[10px] px-2.5 py-1 rounded-full font-black text-gray-500 uppercase tracking-wider">0 LOGS</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-800/40 text-gray-500 text-[9px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th class="p-4">Timeline</th>
                                    <th class="p-4">Ref Type / No.</th>
                                    <th class="p-4">Ledger Account</th>
                                    <th class="p-4">Narration</th>
                                    <th class="p-4 text-right">Debit</th>
                                    <th class="p-4 text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody id="fs-logs-table-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                                <!-- Dynamic rows -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        await calculateFSMetrics();
    } catch (err) {
        console.error("Failed to load Financial Summary view:", err);
        const container = document.getElementById('financial-summary-view');
        if (container) {
            container.innerHTML = `<div class="p-8 bg-red-50 text-red-600 rounded-2xl font-bold">Failed to load summary: ${err.message}</div>`;
        }
    }
}

function changeFSPeriod(period) {
    fsFilterPeriod = period;
    const pickerWrap = document.getElementById('fs-date-picker-wrap');
    if (pickerWrap) {
        if (period === 'custom') {
            pickerWrap.classList.remove('hidden');
            pickerWrap.classList.add('flex');
        } else {
            pickerWrap.classList.remove('flex');
            pickerWrap.classList.add('hidden');
        }
    }
    calculateFSMetrics();
}

function updateFSCustomDates() {
    fsStartDate = document.getElementById('fs-start-date')?.value || '';
    fsEndDate = document.getElementById('fs-end-date')?.value || '';
    calculateFSMetrics();
}

async function calculateFSMetrics() {
    const kpiGrid = document.getElementById('fs-kpi-container');
    const reconBody = document.getElementById('fs-recon-table-body');
    const logsBody = document.getElementById('fs-logs-table-body');
    const logsBadge = document.getElementById('fs-logs-count-badge');
    const auditBadge = document.getElementById('fs-audit-discrepancy-badge');

    if (!kpiGrid) return;

    // Loading states
    kpiGrid.innerHTML = `<div class="col-span-full py-16 text-center text-gray-500 font-bold"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-sky-500 block"></i> Computing financial statistics...</div>`;

    try {
        // Fetch database data
        const sales = await db.sales.toArray();
        const payments = await db.payments.toArray();
        const vendors = await db.vendors.toArray();
        const bankAccounts = await db.bank_accounts.toArray();
        const bankTransactions = await db.bank_transactions.toArray();
        const expenses = await db.expenses.toArray();
        const ledger = await db.ledger.toArray();
        const accounts = await db.accounts.toArray();
        
        // Fetch opening balances from settings
        const opCashSetting = await db.settings.get('opening_cash_balance');
        const opBankSetting = await db.settings.get('opening_bank_balance');
        const openingCash = parseFloat(opCashSetting?.value || 0);
        const openingBank = parseFloat(opBankSetting?.value || 0);

        // Update settings cards in UI
        const cashLbl = document.getElementById('fs-opening-cash-lbl');
        const bankLbl = document.getElementById('fs-opening-bank-lbl');
        if (cashLbl) cashLbl.textContent = formatCurrency(openingCash);
        if (bankLbl) bankLbl.textContent = formatCurrency(openingBank);

        // Date Filter computation
        let rangeStart = null;
        let rangeEnd = null;
        const now = new Date();

        if (fsFilterPeriod === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            rangeStart = todayStr + 'T00:00:00';
            rangeEnd = todayStr + 'T23:59:59';
        } else if (fsFilterPeriod === 'this_month') {
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
            rangeStart = `${y}-${m}-01T00:00:00`;
            rangeEnd = `${y}-${m}-${String(lastDay).padStart(2, '0')}T23:59:59`;
        } else if (fsFilterPeriod === 'this_year') {
            const y = now.getFullYear();
            rangeStart = `${y}-01-01T00:00:00`;
            rangeEnd = `${y}-12-31T23:59:59`;
        } else if (fsFilterPeriod === 'custom' && fsStartDate && fsEndDate) {
            rangeStart = fsStartDate + 'T00:00:00';
            rangeEnd = fsEndDate + 'T23:59:59';
        }

        // Apply filters to records
        const filterByDate = (item) => {
            if (!rangeStart || !rangeEnd) return true;
            return item.date >= rangeStart && item.date <= rangeEnd;
        };

        const filteredSales = sales.filter(filterByDate);
        const filteredPayments = payments.filter(filterByDate);
        const filteredBankTransactions = bankTransactions.filter(filterByDate);
        const filteredExpenses = expenses.filter(filterByDate);
        const filteredLedger = ledger.filter(filterByDate);

        // 1. Total Sales (completed sales invoices)
        const completedInvoices = filteredSales.filter(s => s.document_type === 'invoice');
        const totalSales = completedInvoices.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

        // 2. Total Cash Received
        // Cash sales: Completed invoices where payment type was cash
        const cashSalesVal = completedInvoices
            .filter(s => s.payment_type === 'cash')
            .reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        // Customer cash payments from payments table
        const customerCashPaymentsVal = filteredPayments
            .filter(p => p.target_type !== 'vendor' && (p.method || '').toLowerCase() === 'cash')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCashReceived = cashSalesVal + customerCashPaymentsVal;

        // 3. Total Credit Sales (invoice type, unpaid or partial, excluding cash terms)
        const creditSalesInvoices = completedInvoices.filter(s => (s.status === 'unpaid' || s.status === 'partial') && !isCashTermsInvoice(s));
        const totalCreditSales = creditSalesInvoices.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

        // 4. Outstanding Receivables (Total Credit Sales - Payments Received on them)
        const outstandingReceivables = creditSalesInvoices.reduce((sum, s) => sum + ((parseFloat(s.total) || 0) - (parseFloat(s.paid_amount) || 0)), 0);

        // 5. Total Vendor Payments
        const totalVendorPayments = filteredPayments
            .filter(p => p.target_type === 'vendor')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // 6. Outstanding Payables (Sum of current balance of all vendors)
        // Note: vendor balances are cumulative, so we list current balances (all-time)
        const outstandingPayables = vendors.reduce((sum, v) => sum + (parseFloat(v.current_balance) || 0), 0);

        // 9. Total Cash Deposited to Bank (Sum of all cash-to-bank transfers)
        const totalCashDeposited = filteredBankTransactions
            .filter(t => t.type === 'inward' && t.method === 'Cash Deposit')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // 10. Total Cash Withdrawn from Bank (Sum of all bank-to-cash transfers)
        // Find withdrawals recorded in bank transactions or manual transfers
        const bankWithdrawalsVal = filteredBankTransactions
            .filter(t => t.type === 'outward' && (t.description || '').toLowerCase().includes('withdraw'))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
        // Map ledger manual cash debits bank credits
        let ledgerWithdrawalsVal = 0;
        const refGroups = {};
        filteredLedger.forEach(e => {
            if (e.reference_type === 'Manual') {
                const key = `${e.reference_type}-${e.reference_id}`;
                if (!refGroups[key]) refGroups[key] = [];
                refGroups[key].push(e);
            }
        });
        
        const cashAccId = accounts.find(a => a.code === '1000')?.id;
        const bankAccId = accounts.find(a => a.code === '1010')?.id;

        Object.values(refGroups).forEach(group => {
            const hasCashDebit = group.some(e => e.account_id === cashAccId && e.type === 'debit');
            const hasBankCredit = group.some(e => e.account_id === bankAccId && e.type === 'credit');
            if (hasCashDebit && hasBankCredit) {
                const cashEntry = group.find(e => e.account_id === cashAccId && e.type === 'debit');
                ledgerWithdrawalsVal += (parseFloat(cashEntry.amount) || 0);
            }
        });

        const totalCashWithdrawn = bankWithdrawalsVal + ledgerWithdrawalsVal;

        // 11. Current Bank Balance (Opening Bank Balance + Deposits - Withdrawals + Other Inward - Other Outward)
        const allInwardBank = filteredBankTransactions
            .filter(t => t.type === 'inward')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const allOutwardBank = filteredBankTransactions
            .filter(t => t.type === 'outward')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
        const currentBankBalance = openingBank + allInwardBank - allOutwardBank;

        // 12. Current Cash in Hand (Opening Cash + Cash Received - Cash Deposited + Cash Withdrawn - Cash Vendor Payments - Cash Expenses)
        // Cash Vendor payments
        const cashVendorPaymentsVal = filteredPayments
            .filter(p => p.target_type === 'vendor' && (p.method || '').toLowerCase() === 'cash')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        // Cash Expenses
        const cashExpensesVal = filteredExpenses
            .filter(e => (e.payment_method || '').toLowerCase() === 'cash' || (e.payment_method || '').toLowerCase() === 'cash_refund')
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const currentCashInHand = openingCash + totalCashReceived - totalCashDeposited + totalCashWithdrawn - cashVendorPaymentsVal - cashExpensesVal;

        // Render Cards
        kpiGrid.innerHTML = `
            <!-- CARD 1: Total Sales -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-none">${formatCurrency(totalSales)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <i class="fa-solid fa-cart-shopping text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Completed Invoices</div>
            </div>

            <!-- CARD 2: Total Cash Received -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash Received</p>
                        <h3 class="text-2xl font-black text-emerald-600 leading-none">${formatCurrency(totalCashReceived)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <i class="fa-solid fa-money-bill-wave text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Cash Sales & Receipts</div>
            </div>

            <!-- CARD 3: Total Credit Sales -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Sales</p>
                        <h3 class="text-2xl font-black text-rose-500 leading-none">${formatCurrency(totalCreditSales)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
                        <i class="fa-solid fa-file-invoice-dollar text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Invoices Awaiting Payment</div>
            </div>

            <!-- CARD 4: Outstanding Receivables -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receivables</p>
                        <h3 class="text-2xl font-black text-amber-500 leading-none">${formatCurrency(outstandingReceivables)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <i class="fa-solid fa-business-time text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Owed by Customers</div>
            </div>

            <!-- CARD 5: Total Vendor Payments -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor Payments</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-none">${formatCurrency(totalVendorPayments)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-950/30 flex items-center justify-center text-gray-600 dark:text-gray-400">
                        <i class="fa-solid fa-truck-fast text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Paid to Suppliers</div>
            </div>

            <!-- CARD 6: Outstanding Payables -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payables</p>
                        <h3 class="text-2xl font-black text-red-500 leading-none">${formatCurrency(outstandingPayables)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400">
                        <i class="fa-solid fa-receipt text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Owed to Suppliers</div>
            </div>

            <!-- CARD 7: Current Bank Balance -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Bank</p>
                        <h3 class="text-2xl font-black text-sky-600 leading-none">${formatCurrency(currentBankBalance)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <i class="fa-solid fa-building-columns text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Reconciled Bank Balance</div>
            </div>

            <!-- CARD 8: Current Cash in Hand -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cash in Hand</p>
                        <h3 class="text-2xl font-black text-emerald-600 leading-none">${formatCurrency(currentCashInHand)}</h3>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <i class="fa-solid fa-wallet text-base"></i>
                    </div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-4">Audited Liquid Cash</div>
            </div>
        `;

        // Render Reconciliation breakdown details
        const reconHtml = `
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Opening Balances (Setup)</td>
                <td class="py-3 text-right font-bold text-gray-700 dark:text-gray-300">${formatCurrency(openingCash)} (Cash)</td>
                <td class="py-3 text-right font-bold text-gray-700 dark:text-gray-300">${formatCurrency(openingBank)} (Bank)</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Customer Payments & Cash Invoices</td>
                <td class="py-3 text-right font-bold text-emerald-600">${formatCurrency(totalCashReceived)}</td>
                <td class="py-3 text-right text-gray-300 dark:text-gray-700">-</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Cash Deposited to Bank (Cash-to-Bank)</td>
                <td class="py-3 text-right font-bold text-sky-600">${formatCurrency(totalCashDeposited)} (Bank In)</td>
                <td class="py-3 text-right font-bold text-red-500">${formatCurrency(totalCashDeposited)} (Cash Out)</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Cash Withdrawn from Bank (Bank-to-Cash)</td>
                <td class="py-3 text-right font-bold text-emerald-600">${formatCurrency(totalCashWithdrawn)} (Cash In)</td>
                <td class="py-3 text-right font-bold text-red-500">${formatCurrency(totalCashWithdrawn)} (Bank Out)</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Other Bank Deposits / Inflow</td>
                <td class="py-3 text-right font-bold text-sky-600">${formatCurrency(allInwardBank - totalCashDeposited)}</td>
                <td class="py-3 text-right text-gray-300 dark:text-gray-700">-</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Cash Vendor Payments</td>
                <td class="py-3 text-right text-gray-300 dark:text-gray-700">-</td>
                <td class="py-3 text-right font-bold text-red-500">${formatCurrency(cashVendorPaymentsVal)}</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Other Bank Payments / Outflow</td>
                <td class="py-3 text-right text-gray-300 dark:text-gray-700">-</td>
                <td class="py-3 text-right font-bold text-red-500">${formatCurrency(allOutwardBank - totalCashWithdrawn)}</td>
            </tr>
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 font-semibold text-gray-900 dark:text-white">Cash Expenses</td>
                <td class="py-3 text-right text-gray-300 dark:text-gray-700">-</td>
                <td class="py-3 text-right font-bold text-red-500">${formatCurrency(cashExpensesVal)}</td>
            </tr>
        `;
        if (reconBody) reconBody.innerHTML = reconHtml;

        const calcCashEl = document.getElementById('fs-recon-calc-cash');
        const calcBankEl = document.getElementById('fs-recon-calc-bank');
        if (calcCashEl) calcCashEl.textContent = formatCurrency(currentCashInHand);
        if (calcBankEl) calcBankEl.textContent = formatCurrency(currentBankBalance);

        // Calculate Ledger cash in hand as source of truth and update discrepancy badge
        const ledgerCashAccounts = accounts.filter(a => a.code === '1000');
        const ledgerCashAccountIds = ledgerCashAccounts.map(a => a.id);
        const cashEntries = ledger.filter(e => ledgerCashAccountIds.includes(e.account_id));
        const ledgerCashInHand = cashEntries.reduce((sum, e) => {
            if (e.type === 'debit') return sum + (parseFloat(e.amount) || 0);
            if (e.type === 'credit') return sum - (parseFloat(e.amount) || 0);
            return sum;
        }, 0);

        const discrepancy = Math.abs(currentCashInHand - (openingCash + ledgerCashInHand));
        if (auditBadge) {
            auditBadge.textContent = formatCurrency(discrepancy);
            if (discrepancy > 0.01) {
                auditBadge.className = "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 animate-pulse";
            } else {
                auditBadge.className = "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
            }
        }

        // Render Recent Ledger Logs (Max 30 rows)
        const recentLedger = [...ledger].reverse().slice(0, 30);
        if (logsBadge) logsBadge.textContent = `${ledger.length} POSTINGS`;

        if (recentLedger.length === 0) {
            if (logsBody) logsBody.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-gray-400 italic">No ledger postings recorded.</td></tr>`;
        } else {
            const logsHtml = recentLedger.map(e => {
                const acc = accounts.find(a => a.id === e.account_id);
                return `
                    <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                        <td class="p-4 font-mono text-[10px] text-gray-500">${new Date(e.date).toLocaleDateString()}</td>
                        <td class="p-4"><span class="font-bold text-gray-900 dark:text-white uppercase text-[10px]">${e.reference_type}</span> <span class="text-gray-400">#${e.reference_id}</span></td>
                        <td class="p-4"><span class="font-semibold text-gray-700 dark:text-gray-300">${acc ? acc.name : 'Unknown Account'}</span> <span class="text-gray-400 font-mono">(${acc ? acc.code : '-'})</span></td>
                        <td class="p-4 text-gray-600 dark:text-gray-400">${e.description || '-'}</td>
                        <td class="p-4 text-right font-bold text-emerald-600">${e.type === 'debit' ? formatCurrency(e.amount) : '-'}</td>
                        <td class="p-4 text-right font-bold text-red-500">${e.type === 'credit' ? formatCurrency(e.amount) : '-'}</td>
                    </tr>
                `;
            }).join('');
            if (logsBody) logsBody.innerHTML = logsHtml;
        }

    } catch (err) {
        console.error("Calculation error inside Financial Summary:", err);
    }
}

async function promptEditFSOpeningBalance(type) {
    const key = type === 'cash' ? 'opening_cash_balance' : 'opening_bank_balance';
    const title = type === 'cash' ? 'Opening Cash Balance' : 'Opening Bank Balance';

    const currentValRecord = await db.settings.get(key);
    const currentVal = parseFloat(currentValRecord?.value || 0);

    const { value: newVal } = await Swal.fire({
        title: `Edit ${title}`,
        input: 'number',
        inputLabel: 'Specify opening balance in Rs.',
        inputValue: currentVal || '',
        showCancelButton: true,
        confirmButtonColor: '#0ea5e9',
        inputValidator: (value) => {
            if (value === null || value === '' || isNaN(value)) {
                return 'You must enter a numeric value!';
            }
            if (parseFloat(value) < 0) {
                return 'Balance cannot be negative!';
            }
        }
    });

    if (newVal !== undefined && newVal !== null) {
        await db.settings.put({ key: key, value: parseFloat(newVal) });
        if (typeof logActivity === 'function') {
            await logActivity(`Adjusted ${title} to ${formatCurrency(parseFloat(newVal))}`);
        }
        calculateFSMetrics();
        Swal.fire({
            icon: 'success',
            title: 'Balance Updated',
            text: `${title} is now set to ${formatCurrency(parseFloat(newVal))}`,
            timer: 1500,
            showConfirmButton: false
        });
    }
}

async function exportFSReport() {
    try {
        const opCashSetting = await db.settings.get('opening_cash_balance');
        const opBankSetting = await db.settings.get('opening_bank_balance');
        const openingCash = parseFloat(opCashSetting?.value || 0);
        const openingBank = parseFloat(opBankSetting?.value || 0);

        const sales = await db.sales.toArray();
        const payments = await db.payments.toArray();
        const vendors = await db.vendors.toArray();
        const bankTransactions = await db.bank_transactions.toArray();
        const expenses = await db.expenses.toArray();
        const accounts = await db.accounts.toArray();

        // Calculate same metrics for print preview
        const completedInvoices = sales.filter(s => s.document_type === 'invoice');
        const totalSales = completedInvoices.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

        const cashSalesVal = completedInvoices
            .filter(s => s.payment_type === 'cash')
            .reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        const customerCashPaymentsVal = payments
            .filter(p => p.target_type !== 'vendor' && (p.method || '').toLowerCase() === 'cash')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCashReceived = cashSalesVal + customerCashPaymentsVal;

        const creditSalesInvoices = completedInvoices.filter(s => (s.status === 'unpaid' || s.status === 'partial') && !isCashTermsInvoice(s));
        const totalCreditSales = creditSalesInvoices.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        const outstandingReceivables = creditSalesInvoices.reduce((sum, s) => sum + ((parseFloat(s.total) || 0) - (parseFloat(s.paid_amount) || 0)), 0);

        const totalVendorPayments = payments
            .filter(p => p.target_type === 'vendor')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const outstandingPayables = vendors.reduce((sum, v) => sum + (parseFloat(v.current_balance) || 0), 0);

        const totalCashDeposited = bankTransactions
            .filter(t => t.type === 'inward' && t.method === 'Cash Deposit')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const bankWithdrawalsVal = bankTransactions
            .filter(t => t.type === 'outward' && (t.description || '').toLowerCase().includes('withdraw'))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        // Include manual ledger bank to cash if available
        let ledgerWithdrawalsVal = 0;
        const ledger = await db.ledger.toArray();
        const refGroups = {};
        ledger.forEach(e => {
            if (e.reference_type === 'Manual') {
                const key = `${e.reference_type}-${e.reference_id}`;
                if (!refGroups[key]) refGroups[key] = [];
                refGroups[key].push(e);
            }
        });
        const cashAccId = accounts.find(a => a.code === '1000')?.id;
        const bankAccId = accounts.find(a => a.code === '1010')?.id;
        Object.values(refGroups).forEach(group => {
            const hasCashDebit = group.some(e => e.account_id === cashAccId && e.type === 'debit');
            const hasBankCredit = group.some(e => e.account_id === bankAccId && e.type === 'credit');
            if (hasCashDebit && hasBankCredit) {
                const cashEntry = group.find(e => e.account_id === cashAccId && e.type === 'debit');
                ledgerWithdrawalsVal += (parseFloat(cashEntry.amount) || 0);
            }
        });
        const totalCashWithdrawn = bankWithdrawalsVal + ledgerWithdrawalsVal;

        const allInwardBank = bankTransactions
            .filter(t => t.type === 'inward')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const allOutwardBank = bankTransactions
            .filter(t => t.type === 'outward')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
            
        const currentBankBalance = openingBank + allInwardBank - allOutwardBank;

        const cashVendorPaymentsVal = payments
            .filter(p => p.target_type === 'vendor' && (p.method || '').toLowerCase() === 'cash')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const cashExpensesVal = expenses
            .filter(e => (e.payment_method || '').toLowerCase() === 'cash' || (e.payment_method || '').toLowerCase() === 'cash_refund')
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const currentCashInHand = openingCash + totalCashReceived - totalCashDeposited + totalCashWithdrawn - cashVendorPaymentsVal - cashExpensesVal;

        const storeName = (await db.settings.get('store_name'))?.value || 'MobileMate POS';
        const storeAddress = (await db.settings.get('store_address'))?.value || '';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Financial Summary Audit Report</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                    h1 { margin: 0; color: #0f172a; font-size: 28px; text-transform: uppercase; font-weight: 900; }
                    p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
                    .report-title { color: #0284c7; font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 30px 0 15px 0; }
                    .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
                    .kpi-card p { margin: 0 0 5px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
                    .kpi-card h3 { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; }
                    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    .footer { margin-top: 60px; font-size: 10px; color: #cbd5e1; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>${storeName}</h1>
                        <p>${storeAddress}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #64748b;">FINANCIAL AUDIT</h2>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div class="report-title">Financial Performance Indicators</div>
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <p>Total Completed Sales</p>
                        <h3>${formatCurrency(totalSales)}</h3>
                    </div>
                    <div class="kpi-card">
                        <p>Total Cash Received</p>
                        <h3>${formatCurrency(totalCashReceived)}</h3>
                    </div>
                    <div class="kpi-card">
                        <p>Total Credit Sales</p>
                        <h3>${formatCurrency(totalCreditSales)}</h3>
                    </div>
                    <div class="kpi-card">
                        <p>Outstanding Customer Receivables</p>
                        <h3>${formatCurrency(outstandingReceivables)}</h3>
                    </div>
                    <div class="kpi-card">
                        <p>Total Vendor Payments</p>
                        <h3>${formatCurrency(totalVendorPayments)}</h3>
                    </div>
                    <div class="kpi-card">
                        <p>Outstanding Supplier Payables</p>
                        <h3>${formatCurrency(outstandingPayables)}</h3>
                    </div>
                </div>

                <div class="report-title">Cash & Bank Audit Statement</div>
                <table>
                    <thead>
                        <tr>
                            <th>Component Description</th>
                            <th class="text-right">Inflow (+)</th>
                            <th class="text-right">Outflow (-)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Opening Balance (Cash Setup)</td>
                            <td class="text-right font-bold">${formatCurrency(openingCash)}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <tr>
                            <td>Opening Balance (Bank Setup)</td>
                            <td class="text-right font-bold">${formatCurrency(openingBank)}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <tr>
                            <td>Payments Received from Customers</td>
                            <td class="text-right font-bold text-emerald-600">${formatCurrency(totalCashReceived)}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <tr>
                            <td>Cash Deposited to Bank (Cash-to-Bank)</td>
                            <td class="text-right font-bold">${formatCurrency(totalCashDeposited)}</td>
                            <td class="text-right text-red-500">${formatCurrency(totalCashDeposited)}</td>
                        </tr>
                        <tr>
                            <td>Cash Withdrawn from Bank (Bank-to-Cash)</td>
                            <td class="text-right font-bold">${formatCurrency(totalCashWithdrawn)}</td>
                            <td class="text-right text-red-500">${formatCurrency(totalCashWithdrawn)}</td>
                        </tr>
                        <tr>
                            <td>Other Inward Bank Transfers</td>
                            <td class="text-right font-bold">${formatCurrency(allInwardBank - totalCashDeposited)}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <tr>
                            <td>Cash Payments to Vendors</td>
                            <td class="text-right">-</td>
                            <td class="text-right text-red-500">${formatCurrency(cashVendorPaymentsVal)}</td>
                        </tr>
                        <tr>
                            <td>Other Outward Bank Payments</td>
                            <td class="text-right">-</td>
                            <td class="text-right text-red-500">${formatCurrency(allOutwardBank - totalCashWithdrawn)}</td>
                        </tr>
                        <tr>
                            <td>Cash Expenses Logged</td>
                            <td class="text-right">-</td>
                            <td class="text-right text-red-500">${formatCurrency(cashExpensesVal)}</td>
                        </tr>
                        <tr style="background: #f8fafc; font-weight: bold;">
                            <td>CLOSING BALANCES AUDITED</td>
                            <td class="text-right text-emerald-600">Cash: ${formatCurrency(currentCashInHand)}</td>
                            <td class="text-right text-sky-600">Bank: ${formatCurrency(currentBankBalance)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    Powered by Infinity Creative Works Financial Engine
                </div>
            </body>
            </html>
        `;

        if (typeof openPreviewModal === 'function') {
            openPreviewModal(html, () => {
                const win = window.open('', '_blank');
                win.document.write(html);
                win.document.close();
                win.print();
            });
        } else {
            const win = window.open('', '_blank');
            win.document.write(html);
            win.document.close();
            win.print();
        }
    } catch (err) {
        console.error("Failed to export financial report:", err);
    }
}
