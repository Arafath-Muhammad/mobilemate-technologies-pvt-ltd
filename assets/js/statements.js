// ============================================================
//  Monthly Statement Generator
//  Scans sales + payments to compute outstanding balances
//  and sends summary emails using the email.js mailto logic
// ============================================================

// ─── State ───────────────────────────────────────────────────
let stmtCurrentMonth  = new Date().getMonth();   // 0-based
let stmtCurrentYear   = new Date().getFullYear();
let stmtEntityType    = 'customer';              // 'customer' | 'vendor'
let stmtGeneratedData = [];                      // Cache of last generated batch

// ─── Main Loader ─────────────────────────────────────────────
async function loadStatements() {
    console.log('Loading Monthly Statements view...');
    const container = document.getElementById('statements-view');
    if (!container) return;

    const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    const html = `
        <div class="space-y-6">

            <!-- Header -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <i class="fa-solid fa-file-invoice"></i>
                        </div>
                        Monthly Statements
                    </h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-13">
                        Generate & email transaction summaries for customers and vendors.
                    </p>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="stmtGenerateAll()" id="stmt-generate-btn"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                        <i class="fa-solid fa-rotate"></i> Generate Statements
                    </button>
                    <button onclick="stmtBulkEmail()" id="stmt-email-btn"
                        class="hidden bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i> Email All With Balance
                    </button>
                </div>
            </div>

            <!-- Filters Row -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder p-5">
                <div class="flex flex-wrap items-center gap-4">

                    <!-- Entity Type Toggle -->
                    <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                        <button id="stmt-tab-customer" onclick="stmtSetEntityType('customer')"
                            class="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white dark:bg-darkCard text-gray-900 dark:text-white shadow-sm">
                            <i class="fa-solid fa-users mr-1.5 text-indigo-500"></i>Customers
                        </button>
                        <button id="stmt-tab-vendor" onclick="stmtSetEntityType('vendor')"
                            class="px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 dark:text-gray-400">
                            <i class="fa-solid fa-shop mr-1.5 text-emerald-500"></i>Vendors
                        </button>
                    </div>

                    <!-- Month Picker -->
                    <div class="flex items-center gap-2">
                        <button onclick="stmtChangeMonth(-1)"
                            class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
                            <i class="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-bold text-gray-900 dark:text-white min-w-[140px] text-center" id="stmt-period-label">
                            ${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}
                        </div>
                        <button onclick="stmtChangeMonth(1)"
                            class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
                            <i class="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>

                    <!-- Balance Filter -->
                    <div class="flex items-center gap-2">
                        <label class="text-xs font-bold text-gray-500 uppercase tracking-widest">Show:</label>
                        <select id="stmt-balance-filter" onchange="stmtApplyFilter()"
                            class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="all">All</option>
                            <option value="outstanding">With Outstanding Balance</option>
                            <option value="settled">Settled (Zero Balance)</option>
                        </select>
                    </div>

                    <!-- Search -->
                    <div class="relative flex-1 min-w-[200px]">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                        <input type="text" id="stmt-search" oninput="stmtApplyFilter()"
                            placeholder="Search by name..."
                            class="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                </div>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="stmt-stats-row">
                <!-- Injected by stmtRenderStats -->
            </div>

            <!-- Statement Table -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                <div class="p-4 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between">
                    <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span id="stmt-entity-label">Customer</span> Statements
                        <span id="stmt-count-badge" class="bg-gray-100 dark:bg-gray-800 text-[10px] px-2 py-0.5 rounded font-black text-gray-500">0</span>
                    </h2>
                    <span id="stmt-loading-indicator" class="hidden text-xs text-indigo-500 font-bold animate-pulse flex items-center gap-1">
                        <i class="fa-solid fa-circle-notch fa-spin"></i> Calculating...
                    </span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500">Name</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-right">Opening Balance</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-right">Month Charges</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-right">Month Payments</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-right">Closing Balance</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-center">Status</th>
                                <th class="p-4 text-xs font-bold uppercase text-gray-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="stmt-table-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                            <tr>
                                <td colspan="7" class="p-16 text-center text-gray-400">
                                    <i class="fa-solid fa-file-invoice text-5xl mb-4 block opacity-20"></i>
                                    Click "Generate Statements" to load data for
                                    <span class="font-bold">${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Auto-generate on load
    setTimeout(stmtGenerateAll, 100);
}

// ─── Change Month ─────────────────────────────────────────────
function stmtChangeMonth(delta) {
    stmtCurrentMonth += delta;
    if (stmtCurrentMonth > 11) { stmtCurrentMonth = 0; stmtCurrentYear++; }
    if (stmtCurrentMonth < 0)  { stmtCurrentMonth = 11; stmtCurrentYear--; }

    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    const label = document.getElementById('stmt-period-label');
    if (label) label.textContent = `${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}`;

    // Reset generated data so user knows to re-generate
    stmtGeneratedData = [];
    const tbody = document.getElementById('stmt-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-16 text-center text-gray-400">
                    <i class="fa-solid fa-file-invoice text-5xl mb-4 block opacity-20"></i>
                    Click "Generate Statements" for <strong>${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}</strong>
                </td>
            </tr>`;
    }
    document.getElementById('stmt-email-btn')?.classList.add('hidden');
}

// ─── Toggle Customer / Vendor ────────────────────────────────
function stmtSetEntityType(type) {
    stmtEntityType = type;

    const custBtn   = document.getElementById('stmt-tab-customer');
    const vendBtn   = document.getElementById('stmt-tab-vendor');
    const labelEl   = document.getElementById('stmt-entity-label');

    const activeClass   = ['bg-white','dark:bg-darkCard','text-gray-900','dark:text-white','shadow-sm'];
    const inactiveClass = ['text-gray-500','dark:text-gray-400'];

    if (type === 'customer') {
        custBtn.classList.add(...activeClass);
        custBtn.classList.remove(...inactiveClass);
        vendBtn.classList.remove(...activeClass);
        vendBtn.classList.add(...inactiveClass);
        if (labelEl) labelEl.textContent = 'Customer';
    } else {
        vendBtn.classList.add(...activeClass);
        vendBtn.classList.remove(...inactiveClass);
        custBtn.classList.remove(...activeClass);
        custBtn.classList.add(...inactiveClass);
        if (labelEl) labelEl.textContent = 'Vendor';
    }

    stmtGeneratedData = [];
    document.getElementById('stmt-email-btn')?.classList.add('hidden');
    stmtShowEmpty();
}

function stmtShowEmpty() {
    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    const tbody = document.getElementById('stmt-table-body');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="p-16 text-center text-gray-400">
                <i class="fa-solid fa-file-invoice text-5xl mb-4 block opacity-20"></i>
                Click "Generate Statements" to load data.
            </td>
        </tr>`;
    document.getElementById('stmt-stats-row').innerHTML = '';
}

// ─── Core Generation ─────────────────────────────────────────
async function stmtGenerateAll() {
    const loadingEl = document.getElementById('stmt-loading-indicator');
    const genBtn    = document.getElementById('stmt-generate-btn');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (genBtn)    genBtn.disabled = true;

    try {
        stmtGeneratedData = await stmtBuildStatements(stmtEntityType, stmtCurrentMonth, stmtCurrentYear);
        stmtApplyFilter();
        document.getElementById('stmt-email-btn')?.classList.remove('hidden');
    } catch (err) {
        console.error('Statement generation failed:', err);
        showAlert('Error', 'Failed to generate statements: ' + err.message, 'error');
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
        if (genBtn)    genBtn.disabled = false;
    }
}

/**
 * Build statement data for all customers OR vendors for a given month.
 * For each entity:
 *   opening_balance  = current_balance MINUS activity in the selected month
 *   month_charges    = invoices / purchases issued in that month
 *   month_payments   = payments received/made in that month
 *   closing_balance  = opening + charges − payments
 */
async function stmtBuildStatements(type, month, year) {
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const statements = [];

    if (type === 'customer') {
        const customers = await db.customers.toArray();
        // Only count finalized revenue documents — explicitly exclude quotes and sales orders
        const rawSales  = await db.sales.toArray();
        const allSales  = rawSales.filter(s =>
            s.document_type === 'invoice' || s.document_type === 'pos_invoice' ||
            s.document_type === 'web_order' || s.document_type === 'sale'
        );
        const allPays   = (await db.payments.toArray()).filter(p =>
            p.target_type === 'customer' || p.target_type === 'invoice'
        );

        // Build a map of invoice ID to customer ID for matching single-invoice payments
        const saleToCustomerMap = new Map();
        for (const s of rawSales) {
            if (s.id && s.customer_id) {
                saleToCustomerMap.set(s.id, s.customer_id);
            }
        }

        for (const c of customers) {
            // --- Month-scoped transactions ---
            const monthSales = allSales.filter(s =>
                s.customer_id === c.id && s.date >= start && s.date <= end
            );
            const monthPays  = allPays.filter(p => {
                const isDateInScope = p.date >= start && p.date <= end;
                if (!isDateInScope) return false;
                if (p.target_type === 'customer' && p.target_id === c.id) {
                    return true;
                }
                if (p.target_type === 'invoice') {
                    const saleId = p.target_id || p.invoice_id;
                    if (saleId && saleToCustomerMap.get(saleId) === c.id) {
                        return true;
                    }
                }
                return false;
            });

            const monthCharges  = monthSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
            const monthPayments = monthPays.reduce((sum, p)  => sum + (parseFloat(p.amount) || 0), 0);

            const closingBalance = parseFloat(c.current_balance) || 0;
            const openingBalance = closingBalance - monthCharges + monthPayments;

            statements.push({
                id:             c.id,
                name:           c.name,
                company:        c.company || '',
                email:          c.email || '',
                phone:          c.phone || '',
                address:        c.address || '',
                openingBalance: openingBalance,
                monthCharges:   monthCharges,
                monthPayments:  monthPayments,
                closingBalance: closingBalance,
                monthSales:     monthSales,
                monthPayments_detail: monthPays,
                type:           'customer'
            });
        }
    } else {
        // Vendor statements use purchases + vendor payments
        const vendors    = await db.vendors.toArray();
        const allPurchases = await db.purchases.toArray();
        const allBills   = await db.bills.toArray();
        const allPays    = (await db.payments.toArray()).filter(p =>
            p.target_type === 'vendor'
        );

        for (const v of vendors) {
            const monthPurchases = allPurchases.filter(p =>
                p.vendor_id === v.id && p.date >= start && p.date <= end
            );
            const monthBills = allBills.filter(b =>
                b.vendor_id === v.id && b.date >= start && b.date <= end
            );
            const monthPays = allPays.filter(p =>
                p.target_id === v.id && p.date >= start && p.date <= end
            );

            const purchaseCharges = monthPurchases.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            const billCharges     = monthBills.reduce((sum, b)     => sum + (parseFloat(b.total) || 0), 0);
            const monthCharges    = purchaseCharges + billCharges;
            const monthPayments   = monthPays.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            const closingBalance = parseFloat(v.current_balance) || 0;
            const openingBalance = closingBalance - monthCharges + monthPayments;

            statements.push({
                id:             v.id,
                name:           v.name,
                company:        v.name,
                email:          v.email || '',
                phone:          v.phone || '',
                address:        v.address || '',
                openingBalance: openingBalance,
                monthCharges:   monthCharges,
                monthPayments:  monthPayments,
                closingBalance: closingBalance,
                monthPurchases: monthPurchases,
                monthBills:     monthBills,
                monthPayments_detail: monthPays,
                type:           'vendor'
            });
        }
    }

    return statements;
}

// ─── Filter + Render ──────────────────────────────────────────
function stmtApplyFilter() {
    const filter  = document.getElementById('stmt-balance-filter')?.value || 'all';
    const search  = document.getElementById('stmt-search')?.value.toLowerCase() || '';

    let data = [...stmtGeneratedData];

    if (search) {
        data = data.filter(s =>
            s.name.toLowerCase().includes(search) ||
            (s.company && s.company.toLowerCase().includes(search))
        );
    }
    if (filter === 'outstanding') data = data.filter(s => s.closingBalance > 0.01);
    if (filter === 'settled')     data = data.filter(s => s.closingBalance <= 0.01);

    // Sort: highest balance first
    data.sort((a, b) => b.closingBalance - a.closingBalance);

    stmtRenderTable(data);
    stmtRenderStats(stmtGeneratedData); // Stats always from full set
}

function stmtRenderStats(data) {
    const statsRow = document.getElementById('stmt-stats-row');
    if (!statsRow) return;

    const totalEntities  = data.length;
    const withBalance    = data.filter(s => s.closingBalance > 0.01).length;
    const totalBalance   = data.reduce((sum, s) => sum + s.closingBalance, 0);
    const totalCharges   = data.reduce((sum, s) => sum + s.monthCharges, 0);

    const statCard = (icon, color, label, value) => `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-md">
                <i class="${icon} text-lg"></i>
            </div>
            <div>
                <p class="text-[10px] font-black uppercase text-gray-400 tracking-widest">${label}</p>
                <p class="text-xl font-black text-gray-900 dark:text-white">${value}</p>
            </div>
        </div>
    `;

    statsRow.innerHTML =
        statCard('fa-solid fa-users', 'bg-indigo-600', 'Total Entities', totalEntities) +
        statCard('fa-solid fa-triangle-exclamation', 'bg-amber-500', 'With Balance', withBalance) +
        statCard('fa-solid fa-scale-unbalanced-flip', 'bg-red-500', 'Total Outstanding', formatCurrency(totalBalance)) +
        statCard('fa-solid fa-file-invoice-dollar', 'bg-emerald-600', 'Month Charges', formatCurrency(totalCharges));
}

function stmtRenderTable(data) {
    const tbody    = document.getElementById('stmt-table-body');
    const badge    = document.getElementById('stmt-count-badge');
    if (!tbody) return;
    if (badge) badge.textContent = data.length + (data.length === 1 ? ' ENTITY' : ' ENTITIES');

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-12 text-center text-gray-400">
                    <i class="fa-solid fa-magnifying-glass text-4xl mb-3 block opacity-20"></i>
                    No matching statements found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(s => {
        const isOutstanding = s.closingBalance > 0.01;
        const isCredit      = s.closingBalance < -0.01;
        const statusClass   = isOutstanding ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                              isCredit       ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                                              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20';
        const statusLabel   = isOutstanding ? 'Outstanding' : isCredit ? 'Credit' : 'Settled';

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full ${s.type === 'customer' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center font-bold text-sm">
                            ${(s.name || 'X').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-bold text-sm text-gray-900 dark:text-white">${s.name}</div>
                            <div class="text-[10px] text-gray-500">${s.company || s.email || '-'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-right text-sm font-medium text-gray-600 dark:text-gray-400">${formatCurrency(s.openingBalance)}</td>
                <td class="p-4 text-right text-sm font-bold text-red-500">${s.monthCharges > 0 ? formatCurrency(s.monthCharges) : '-'}</td>
                <td class="p-4 text-right text-sm font-bold text-emerald-600">${s.monthPayments > 0 ? formatCurrency(s.monthPayments) : '-'}</td>
                <td class="p-4 text-right">
                    <span class="font-black text-base ${isOutstanding ? 'text-red-500' : isCredit ? 'text-blue-600' : 'text-emerald-600'}">
                        ${formatCurrency(s.closingBalance)}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        <button onclick="stmtPreviewStatement(${s.id}, '${s.type}')"
                            title="Preview Statement"
                            class="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors text-sm">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="stmtPrintSingle(${s.id}, '${s.type}')"
                            title="Print Statement"
                            class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        <button onclick="stmtEmailSingle(${s.id}, '${s.type}')"
                            title="Send Email"
                            class="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors text-sm">
                            <i class="fa-solid fa-envelope"></i>
                        </button>
                        <button onclick="stmtEditStatement(${s.id}, '${s.type}')"
                            title="Edit Statement"
                            class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="stmtDeleteStatement(${s.id}, '${s.type}')"
                            title="Delete Statement"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ─── Statement HTML Builder ───────────────────────────────────
async function stmtBuildHTML(id, type) {
    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    const period = `${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}`;

    // Load from cache if already generated
    let stmt = stmtGeneratedData.find(s => s.id === id && s.type === type);

    if (!stmt) {
        // Generate on the fly for a single entity
        const data = await stmtBuildStatements(type, stmtCurrentMonth, stmtCurrentYear);
        stmt = data.find(s => s.id === id);
    }
    if (!stmt) return null;

    // Load store settings
    const settings  = await db.settings.toArray();
    const opts      = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName      = opts['store_name']      || 'MobileMate POS';
    const storeAddress   = opts['store_address']   || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone     = opts['store_phone']     || '';
    const storeEmail     = opts['store_email']     || '';
    const storeLogo      = opts['store_logo']      || '';
    const invoiceColor   = opts['invoice_color']   || '#0e3257';
    const invoiceFooter  = opts['invoice_footer']  || 'Thank you for your business!';
    // Auto-scale header font based on company name length
    const _snLen = (storeName || '').length;
    const headerFontSize = _snLen > 35 ? '13px' : _snLen > 28 ? '15px' : _snLen > 20 ? '18px' : '22px';


    // Build transaction rows
    const rows = [];

    if (type === 'customer') {
        const allSales = stmt.monthSales || [];
        const allPays  = stmt.monthPayments_detail || [];
        [...allSales.map(s => ({
            date:   s.date,
            ref:    getInvoiceDisplayNumber(s),
            desc:   'Sales Invoice',
            debit:  parseFloat(s.total) || 0,
            credit: 0
        })), ...allPays.map(p => ({
            date:   p.date,
            ref:    `PAY-${String(p.id).padStart(5,'0')}`,
            desc:   `Payment (${p.method || 'Cash'})`,
            debit:  0,
            credit: parseFloat(p.amount) || 0
        }))].sort((a,b) => new Date(a.date)-new Date(b.date))
            .forEach(t => rows.push(t));
    } else {
        const purchases = stmt.monthPurchases || [];
        const bills     = stmt.monthBills     || [];
        const pays      = stmt.monthPayments_detail  || [];
        [...purchases.map(p => ({
            date:   p.date,
            ref:    `PO-${String(p.id).padStart(5,'0')}`,
            desc:   'Purchase Order',
            debit:  parseFloat(p.total) || 0,
            credit: 0
        })), ...bills.map(b => ({
            date:   b.date,
            ref:    `BILL-${String(b.id).padStart(5,'0')}`,
            desc:   'Supplier Bill',
            debit:  parseFloat(b.total) || 0,
            credit: 0
        })), ...pays.map(p => ({
            date:   p.date,
            ref:    `PAY-${String(p.id).padStart(5,'0')}`,
            desc:   `Payment Sent (${p.method || 'Cash'})`,
            debit:  0,
            credit: parseFloat(p.amount) || 0
        }))].sort((a,b) => new Date(a.date)-new Date(b.date))
            .forEach(t => rows.push(t));
    }

    let runBalance = stmt.openingBalance;
    const rowsHtml = rows.length === 0 ? `
        <tr>
            <td colspan="6" style="padding:40px; text-align:center; color:#94a3b8; font-style:italic;">
                No transactions recorded in this period.
            </td>
        </tr>
    ` : rows.map((t, i) => {
        runBalance += t.debit - t.credit;
        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding:10px 12px; font-size:12px; color:#64748b;">${i+1}</td>
                <td style="padding:10px 12px; font-size:12px;">${new Date(t.date).toLocaleDateString()}</td>
                <td style="padding:10px 12px;">
                    <div style="font-weight:700; font-size:13px; color:#1e293b;">${t.ref}</div>
                    <div style="font-size:11px; color:#94a3b8;">${t.desc}</div>
                </td>
                <td style="padding:10px 12px; text-align:right; font-size:13px; color:${t.debit > 0 ? '#1e293b' : '#cbd5e1'};">
                    ${t.debit > 0 ? t.debit.toLocaleString(undefined,{minimumFractionDigits:2}) : '-'}
                </td>
                <td style="padding:10px 12px; text-align:right; font-size:13px; color:${t.credit > 0 ? '#10b981' : '#cbd5e1'};">
                    ${t.credit > 0 ? t.credit.toLocaleString(undefined,{minimumFractionDigits:2}) : '-'}
                </td>
                <td style="padding:10px 12px; text-align:right; font-weight:700; font-size:13px; color:${runBalance > 0 ? '#ef4444' : '#10b981'};">
                    Rs. ${runBalance.toLocaleString(undefined,{minimumFractionDigits:2})}
                </td>
            </tr>
        `;
    }).join('');

    const isOutstanding = stmt.closingBalance > 0.01;
    const balanceColor  = isOutstanding ? '#ef4444' : '#10b981';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Monthly Statement — ${stmt.name} — ${period}</title>
    <style>
        @media print { @page { size: A4; margin: 0; } body { margin: 0; } .page { box-shadow: none !important; margin: 0 !important; } }
        * { box-sizing: border-box; }
        body { margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI', Arial, sans-serif; -webkit-print-color-adjust:exact; color:#334155; }
        .page { background:#fff; width:210mm; margin:10mm auto; box-shadow:0 0 20px rgba(0,0,0,.12); min-height:297mm; padding:15mm; position:relative; }
        .header-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; }
        .divider { height:3px; background:${invoiceColor}; margin:20px 0; border-radius:3px; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px; }
        .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; }
        .balance-badge { background:${invoiceColor}; color:#fff; padding:16px 20px; border-radius:12px; text-align:center; }
        table.stmt-table { width:100%; border-collapse:collapse; }
        table.stmt-table thead tr { background:${invoiceColor}; color:#fff; }
        table.stmt-table thead th { padding:12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
        .footer { position:absolute; bottom:15mm; left:15mm; right:15mm; text-align:center; color:#94a3b8; font-size:10px; border-top:1px solid #e2e8f0; padding-top:14px; }
        .label { font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
    </style>
</head>
<body>
    <div class="page">
        <!-- Store Header -->
        <div class="header-bar">
            <div style="display:flex;align-items:center;gap:16px;">
                ${storeLogo ? `<img src="${storeLogo}" style="max-height:70px;max-width:100px;object-fit:contain;">` : ''}
                <div>
                    <h1 style="margin:0;font-size:${headerFontSize};color:${invoiceColor};font-weight:900;text-transform:uppercase;line-height:1.2;">${storeName}</h1>
                    ${enabledStoreAddress ? `<p style="margin:4px 0 0;font-size:11px;color:#64748b;">${storeAddress}</p>` : ''}
                    <p style="margin:2px 0 0;font-size:11px;color:#64748b;">${storePhone}${storeEmail ? ' | ' + storeEmail : ''}</p>
                </div>
            </div>
            <div style="text-align:right;">
                <h2 style="margin:0;font-size:28px;font-weight:900;letter-spacing:2px;color:#334155;">STATEMENT</h2>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Period: <strong>${period}</strong></p>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Issued: ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
        <div class="divider"></div>

        <!-- Entity Info + Balance Badge -->
        <div class="info-grid">
            <div class="info-box">
                <div class="label">Statement For</div>
                <div style="font-size:20px;font-weight:900;color:#1e293b;margin-bottom:6px;">${stmt.name}</div>
                ${stmt.company && stmt.company !== stmt.name ? `<div style="font-size:13px;color:#475569;">${stmt.company}</div>` : ''}
                ${stmt.phone ? `<div style="font-size:12px;color:#64748b;margin-top:4px;"><i>Phone: ${stmt.phone}</i></div>` : ''}
                ${stmt.address ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px;">${stmt.address}</div>` : ''}
            </div>
            <div>
                <div class="balance-badge">
                    <div style="font-size:10px;font-weight:800;opacity:.8;text-transform:uppercase;letter-spacing:1px;">Closing Balance</div>
                    <div style="font-size:28px;font-weight:900;letter-spacing:-1px;margin-top:4px;">
                        Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </div>
                    <div style="font-size:11px;opacity:.8;margin-top:4px;">${isOutstanding ? '⚠ Amount Due' : '✓ Account Settled'}</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px;text-align:center;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;">
                        <div class="label">Opening</div>
                        <div style="font-size:12px;font-weight:700;color:#334155;">Rs. ${stmt.openingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                    </div>
                    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;">
                        <div class="label" style="color:#b91c1c;">Charges</div>
                        <div style="font-size:12px;font-weight:700;color:#ef4444;">Rs. ${stmt.monthCharges.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                    </div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;">
                        <div class="label" style="color:#15803d;">Payments</div>
                        <div style="font-size:12px;font-weight:700;color:#10b981;">Rs. ${stmt.monthPayments.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Transaction Table -->
        <table class="stmt-table">
            <thead>
                <tr>
                    <th style="width:5%;">#</th>
                    <th style="width:12%;text-align:left;">Date</th>
                    <th style="text-align:left;">Transaction</th>
                    <th style="width:15%;text-align:right;">Dr (Charges)</th>
                    <th style="width:15%;text-align:right;">Cr (Payments)</th>
                    <th style="width:16%;text-align:right;">Balance</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc;border-top:2px solid #334155;">
                    <td colspan="3" style="padding:14px 12px;font-weight:800;font-size:13px;text-align:right;color:#334155;">CLOSING BALANCE</td>
                    <td style="padding:14px 12px;text-align:right;font-size:12px;color:#ef4444;font-weight:700;">
                        Rs. ${stmt.monthCharges.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </td>
                    <td style="padding:14px 12px;text-align:right;font-size:12px;color:#10b981;font-weight:700;">
                        Rs. ${stmt.monthPayments.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </td>
                    <td style="padding:14px 12px;text-align:right;font-size:16px;font-weight:900;color:${balanceColor};">
                        Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}
                    </td>
                </tr>
            </tfoot>
        </table>

        <!-- Footer -->
        <div class="footer">
            <div style="font-weight:800;color:#334155;text-transform:uppercase;margin-bottom:6px;">${invoiceFooter}</div>
            <div>Please notify us within 7 days if any discrepancies are found.<br>
                <strong>Powered by Infinity Creative Works <a href="https://wa.me/94765449005" style="color: inherit; text-decoration: none;">+94 76 5 449 005</a></strong>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 800); }
    </script>
</body>
</html>`;
}

// ─── Preview Modal ────────────────────────────────────────────
async function stmtPreviewStatement(id, type) {
    const html = await stmtBuildHTML(id, type);
    if (!html) return showAlert('Error', 'Could not find statement data. Generate first.', 'error');

    if (typeof openPreviewModal === 'function') {
        const monthNames = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
        const period = `${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}`;
        
        openPreviewModal(
            html, 
            () => stmtPrintSingle(id, type),
            null,
            null,
            (html) => {
                const stmt = stmtGeneratedData.find(s => s.id === id && s.type === type);
                if (stmt && typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Month Statement', `STM-${period.replace(' ','-').toUpperCase()}`, stmt.name, stmt.closingBalance, [], html);
                }
            }
        );
    }
}

// ─── Print Single ─────────────────────────────────────────────
async function stmtPrintSingle(id, type) {
    const html = await stmtBuildHTML(id, type);
    if (!html) return showAlert('Error', 'Could not find statement data. Generate first.', 'error');

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    }
}

// ─── Email Single  ────────────────────────────────────────────
async function stmtEmailSingle(id, type) {
    const stmt = stmtGeneratedData.find(s => s.id === id && s.type === type);
    if (!stmt) {
        // Try generating on the fly
        const data = await stmtBuildStatements(type, stmtCurrentMonth, stmtCurrentYear);
        const found = data.find(s => s.id === id);
        if (!found) return showAlert('Error', 'Statement not found. Please generate first.', 'error');
        stmtGeneratedData.push(found);
        return stmtEmailSingle(id, type);
    }

    await stmtSendStatementEmail(stmt);
}

/**
 * Core email sender — mirrors the email.js sendInvoiceEmail pattern,
 * using the mailto: protocol with a structured summary in the body.
 */
async function stmtSendStatementEmail(stmt) {
    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    const period = `${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}`;

    // Resolve email address
    let toEmail = stmt.email;
    if (!toEmail) {
        const { value: email } = await Swal.fire({
            title: 'Email Address Missing',
            html: `<p class="text-sm text-gray-600">No email on file for <strong>${stmt.name}</strong>.</p>`,
            input: 'email',
            inputLabel: 'Enter email address:',
            inputPlaceholder: 'customer@example.com',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5'
        });
        if (!email) return;
        toEmail = email;
    }

    // Load sender info from settings
    const senderName  = (await db.settings.get('sender_name'))?.value  || 'MobileMate POS';
    const storeName   = (await db.settings.get('store_name'))?.value   || 'MobileMate';
    const storePhone  = (await db.settings.get('store_phone'))?.value  || '';

    const isOutstanding = stmt.closingBalance > 0.01;
    const subject = `Monthly Statement — ${period} — ${stmt.name}`;

    const body = [
        `Dear ${stmt.name},`,
        '',
        `Please find your Monthly Account Statement for ${period} from ${storeName}.`,
        '',
        '─────────────────────────────────────',
        `  Period          : ${period}`,
        `  Opening Balance : Rs. ${stmt.openingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,
        `  Month Charges   : Rs. ${stmt.monthCharges.toLocaleString(undefined,{minimumFractionDigits:2})}`,
        `  Payments Made   : Rs. ${stmt.monthPayments.toLocaleString(undefined,{minimumFractionDigits:2})}`,
        `  Closing Balance : Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,
        '─────────────────────────────────────',
        '',
        isOutstanding
            ? `⚠ Amount Due: Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}. Please arrange payment at your earliest convenience.`
            : '✓ Your account is fully settled. Thank you!',
        '',
        `For queries, contact us at: ${storePhone}`,
        '',
        `Thank you for your continued business.`,
        '',
        `Warm regards,`,
        `${senderName}`,
        storeName
    ].join('\n');

    const { value: mode } = await Swal.fire({
        title: `Email Statement`,
        html: `
            <div class="text-left p-2 space-y-3">
                <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100">
                    <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-0.5">Sending To</p>
                    <p class="font-bold text-gray-800">${stmt.name}</p>
                    <p class="text-sm text-indigo-600 font-mono">${toEmail}</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                    <div class="flex justify-between"><span class="text-gray-500">Period</span><span class="font-bold">${period}</span></div>
                    <div class="flex justify-between mt-1"><span class="text-gray-500">Closing Balance</span>
                        <span class="font-black ${isOutstanding ? 'text-red-600' : 'text-emerald-600'}">
                            Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}
                        </span>
                    </div>
                </div>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-paper-plane mr-2"></i>Open in Mail App',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4F46E5'
    });

    if (!mode) return; // Cancelled

    const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    showAlert('Email Prepared', `Opening your mail app for ${stmt.name}.`, 'success');
}

// ─── Bulk Email ───────────────────────────────────────────────
async function stmtBulkEmail() {
    const withBalance = stmtGeneratedData.filter(s => s.closingBalance > 0.01);

    if (withBalance.length === 0) {
        return showAlert('No Outstanding Balances', 'All accounts are settled — no emails to send.', 'info');
    }

    const emailCount = withBalance.filter(s => s.email).length;
    const noEmail    = withBalance.filter(s => !s.email).length;

    const { isConfirmed } = await Swal.fire({
        title: 'Bulk Statement Email',
        html: `
            <div class="text-left space-y-3 p-2">
                <p class="text-sm text-gray-600">This will open email drafts for entities with outstanding balances.</p>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 bg-indigo-50 rounded-xl text-center">
                        <div class="text-2xl font-black text-indigo-600">${withBalance.length}</div>
                        <div class="text-xs text-gray-500 font-bold uppercase">Outstanding</div>
                    </div>
                    <div class="p-3 bg-emerald-50 rounded-xl text-center">
                        <div class="text-2xl font-black text-emerald-600">${emailCount}</div>
                        <div class="text-xs text-gray-500 font-bold uppercase">Have Email</div>
                    </div>
                </div>
                ${noEmail > 0 ? `<p class="text-xs text-amber-600 font-bold">⚠ ${noEmail} entities have no email address and will be skipped.</p>` : ''}
                <p class="text-xs text-gray-400 italic">Emails open one at a time via your default mail app.</p>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: `<i class="fa-solid fa-paper-plane mr-2"></i>Send to ${emailCount} Contacts`,
        confirmButtonColor: '#4F46E5'
    });

    if (!isConfirmed) return;

    const monthNames = ['January','February','March','April','May','June',
        'July','August','September','October','November','December'];
    const period     = `${monthNames[stmtCurrentMonth]} ${stmtCurrentYear}`;
    const senderName = (await db.settings.get('sender_name'))?.value || 'MobileMate POS';
    const storeName  = (await db.settings.get('store_name'))?.value  || 'MobileMate';
    const storePhone = (await db.settings.get('store_phone'))?.value || '';

    let sent = 0;
    for (const stmt of withBalance.filter(s => s.email)) {
        const subject = `Monthly Statement — ${period} — ${stmt.name}`;
        const body = [
            `Dear ${stmt.name},`,
            '',
            `Please find below your Monthly Statement for ${period} from ${storeName}.`,
            '',
            '─────────────────────────────────────',
            `  Period          : ${period}`,
            `  Opening Balance : Rs. ${stmt.openingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,
            `  Month Charges   : Rs. ${stmt.monthCharges.toLocaleString(undefined,{minimumFractionDigits:2})}`,
            `  Payments Made   : Rs. ${stmt.monthPayments.toLocaleString(undefined,{minimumFractionDigits:2})}`,
            `  Closing Balance : Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}`,
            '─────────────────────────────────────',
            '',
            `⚠ Amount Due: Rs. ${stmt.closingBalance.toLocaleString(undefined,{minimumFractionDigits:2})}. Please arrange payment.`,
            '',
            `Contact: ${storePhone}`,
            '',
            `Regards, ${senderName} | ${storeName}`
        ].join('\n');

        const mailtoUrl = `mailto:${stmt.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
        sent++;
        await new Promise(r => setTimeout(r, 800)); // Stagger to avoid browser blocking
    }

    showAlert('Done', `${sent} statement emails prepared and queued in your mail app.`, 'success');
}
// ─── Edit Statement ──────────────────────────────────────────────────
async function stmtEditStatement(id, type) {
    const stmt = stmtGeneratedData.find(s => s.id === id && s.type === type);
    if (!stmt) return showAlert('Error', 'Statement not found for editing.', 'error');

    const { value: formValues } = await Swal.fire({
        title: '<span class="text-base font-bold flex items-center gap-2"><i class="fa-solid fa-pen text-indigo-500"></i> Edit Statement</span>',
        html: `
            <div class="text-left space-y-4 p-1">
                <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <p class="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-0.5">📝 Manual Override</p>
                    <p class="text-[11px] text-indigo-600/90 dark:text-indigo-300/90 leading-relaxed">Editing these values will update the statement view/printout. Saving will also update the entity's database Current Balance to match the Closing Balance.</p>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entity Name</label>
                    <div class="text-sm font-black text-gray-800 dark:text-white">${stmt.name}</div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Opening Balance (Rs.)</label>
                        <input type="number" id="edit-stmt-opening" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white" step="0.01" value="${stmt.openingBalance.toFixed(2)}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Month Charges (Rs.)</label>
                        <input type="number" id="edit-stmt-charges" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white" step="0.01" value="${stmt.monthCharges.toFixed(2)}">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Month Payments (Rs.)</label>
                        <input type="number" id="edit-stmt-payments" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white" step="0.01" value="${stmt.monthPayments.toFixed(2)}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Closing Balance (Rs.)</label>
                        <input type="number" id="edit-stmt-closing" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-black text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" step="0.01" value="${stmt.closingBalance.toFixed(2)}">
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4F46E5',
        focusConfirm: false,
        didOpen: () => {
            const openInput = Swal.getPopup().querySelector('#edit-stmt-opening');
            const chargesInput = Swal.getPopup().querySelector('#edit-stmt-charges');
            const paymentsInput = Swal.getPopup().querySelector('#edit-stmt-payments');
            const closingInput = Swal.getPopup().querySelector('#edit-stmt-closing');

            const recalculateClosing = () => {
                const opening = parseFloat(openInput.value) || 0;
                const charges = parseFloat(chargesInput.value) || 0;
                const payments = parseFloat(paymentsInput.value) || 0;
                closingInput.value = (opening + charges - payments).toFixed(2);
            };

            openInput.addEventListener('input', recalculateClosing);
            chargesInput.addEventListener('input', recalculateClosing);
            paymentsInput.addEventListener('input', recalculateClosing);
        },
        preConfirm: () => {
            const opening = parseFloat(document.getElementById('edit-stmt-opening').value);
            const charges = parseFloat(document.getElementById('edit-stmt-charges').value);
            const payments = parseFloat(document.getElementById('edit-stmt-payments').value);
            const closing = parseFloat(document.getElementById('edit-stmt-closing').value);

            if (isNaN(opening) || isNaN(charges) || isNaN(payments) || isNaN(closing)) {
                Swal.showValidationMessage('Please enter valid numbers for all fields.');
                return false;
            }

            return { opening, charges, payments, closing };
        }
    });

    if (formValues) {
        try {
            const { opening, charges, payments, closing } = formValues;

            // Update Database Balance
            if (type === 'customer') {
                await db.transaction('rw', db.customers, async () => {
                    await db.customers.update(id, { current_balance: closing });
                });
            } else {
                await db.transaction('rw', db.vendors, async () => {
                    await db.vendors.update(id, { current_balance: closing });
                });
            }

            // Update Cache
            stmt.openingBalance = opening;
            stmt.monthCharges = charges;
            stmt.monthPayments = payments;
            stmt.closingBalance = closing;

            // Re-render
            stmtApplyFilter();

            if (typeof logActivity === 'function') {
                await logActivity(`Statement Edited: ${stmt.name} (${type}) - Balance updated to Rs. ${closing.toFixed(2)}`);
            }

            showAlert('Success', 'Statement updated and database balance synced.', 'success');
        } catch (err) {
            console.error('Failed to update statement:', err);
            showAlert('Error', 'Failed to update statement: ' + err.message, 'error');
        }
    }
}

// ─── Delete Statement Placeholder ────────────────────────────────────────
async function stmtDeleteStatement(id, type) {
    const stmt = stmtGeneratedData.find(s => s.id === id && s.type === type);
    if (!stmt) return showAlert('Error', 'Statement not found for deletion.', 'error');
    const { isConfirmed } = await Swal.fire({
        title: 'Confirm Delete',
        text: `Are you sure you want to delete statement for ${stmt.name}? This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });
    if (!isConfirmed) return;
    stmtGeneratedData = stmtGeneratedData.filter(s => !(s.id === id && s.type === type));
    stmtApplyFilter();
    showAlert('Deleted', `Statement for ${stmt.name} has been removed.`, 'success');
}
