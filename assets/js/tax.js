// Tax Calculation & Reporting Module - Sri Lanka
// MobileMate Technologies - Private Limited Company

let currentTaxTab = 'dashboard';
let currentTaxYear = new Date().getFullYear();

/**
 * Main entry point for Tax & Profit view
 */
async function loadTax() {
    console.log("Initializing Tax & Profit Center...");
    const container = document.getElementById('tax-view');
    if (!container) {
        console.error("CRITICAL: Container 'tax-view' not found in DOM.");
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const firstDay = today;
        const lastDay = today;

        const html = `
        <div class="space-y-6 pb-10">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Tax & Profit Center</h2>
                    <p class="text-sm text-gray-500 font-medium tracking-wide">Compliance & financial health monitoring for ${currentTaxYear}</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="tax-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="tax-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <button onclick="generateNewTaxReport()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-file-export"></i> Generate Tax Report
                    </button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-x-auto no-scrollbar sticky top-16 z-30 backdrop-blur-md">
                <button onclick="switchTaxTab('dashboard')" class="tax-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTaxTab === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="dashboard">
                    <i class="fa-solid fa-chart-line"></i> Dashboard
                </button>
                <button onclick="switchTaxTab('expenses')" class="tax-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTaxTab === 'expenses' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="expenses">
                    <i class="fa-solid fa-receipt"></i> Expense Management
                </button>
                <button onclick="switchTaxTab('status')" class="tax-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTaxTab === 'status' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="status">
                    <i class="fa-solid fa-clock-rotate-left"></i> Report History
                </button>
                <button onclick="switchTaxTab('forecasted')" class="tax-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTaxTab === 'forecasted' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="forecasted">
                    <i class="fa-solid fa-calendar-check"></i> Monthly Fixed Costs
                </button>
                <button onclick="switchTaxTab('links')" class="tax-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTaxTab === 'links' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="links">
                    <i class="fa-solid fa-landmark"></i> Gov Links
                </button>
            </div>

            <div id="tax-tab-content" class="animate-fade-in-up">
                <!-- Content injected here -->
            </div>
        </div>
    `;

    container.innerHTML = html;
    
    document.getElementById('tax-start-date')?.addEventListener('change', () => switchTaxTab(currentTaxTab));
    document.getElementById('tax-end-date')?.addEventListener('change', () => switchTaxTab(currentTaxTab));

    await renderTaxTab(currentTaxTab);
    } catch (error) {
        console.error("Error in loadTax:", error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <div class="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                </div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase italic">Tax Module Initialization Error</h2>
                <p class="text-gray-500 max-w-md mx-auto">We encountered a problem while loading your financial data. This may be due to an outdated database version or missing tables.</p>
                <button onclick="location.reload()" class="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">Refresh Application</button>
            </div>
        `;
    }
}

function switchTaxTab(tab) {
    currentTaxTab = tab;
    // Update UI active state if needed without full reload
    const btns = document.querySelectorAll('.tax-tab-btn');
    btns.forEach(b => {
        if (b.getAttribute('data-tab') === tab) {
            b.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/20');
            b.classList.remove('text-gray-500', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
        } else {
            b.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/20');
            b.classList.add('text-gray-500', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
        }
    });
    renderTaxTab(tab);
}

async function renderTaxTab(tab) {
    const content = document.getElementById('tax-tab-content');
    if (!content) return;

    switch (tab) {
        case 'dashboard':
            await renderTaxDashboard(content);
            break;
        case 'expenses':
            await renderTaxExpenses(content);
            break;
        case 'status':
            await renderTaxHistory(content);
            break;
        case 'forecasted':
            await renderForecastedExpenses(content);
            break;
        case 'links':
            await renderGovLinks(content);
            break;
    }
}

/**
 * Tab 1: Dashboard - Financial Summary Cards
 */
async function renderTaxDashboard(container) {
    const now = new Date();
    const startVal = document.getElementById('tax-start-date')?.value || '';
    let endVal = document.getElementById('tax-end-date')?.value || '';
    if (endVal && !endVal.includes('T')) {
        endVal = endVal + 'T23:59:59';
    }

    const stats = await calculateFinancialStats(startVal, endVal);
    
    // Calculate for Current Financial Year (Sri Lanka: April to March)
    let fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const startOfFY = `${fyStartYear}-04-01`; // April 1st
    const endOfFY = `${fyStartYear + 1}-03-31T23:59:59`; // March 31st
    
    const fyStats = await calculateFinancialStats(startOfFY, endOfFY);

    if (stats.revenue === 0 && stats.expenses === 0 && fyStats.revenue === 0 && fyStats.expenses === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 lg:p-20 bg-white dark:bg-darkCard rounded-[3rem] border border-gray-100 dark:border-darkBorder shadow-sm animate-fade-in">
                <div class="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                    <i class="fa-solid fa-leaf text-4xl"></i>
                </div>
                <h3 class="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase mb-4 text-center">Ready to track your profits?</h3>
                <p class="text-gray-500 max-w-lg mx-auto text-center font-medium leading-relaxed mb-10">
                    Your Tax & Profit center is currently empty because no sales or expenses have been recorded for the selected period. 
                    Start by recording a sale in the POS or adding shop expenses to see your realistic profit margins.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    <div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500 transition-all group cursor-pointer" onclick="switchTaxTab('forecasted')">
                        <div class="w-10 h-10 rounded-xl bg-white dark:bg-darkCard flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-calendar-check text-emerald-500"></i>
                        </div>
                        <h4 class="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-2">1. Define Fixed Costs</h4>
                        <p class="text-[10px] text-gray-500 font-bold leading-relaxed">Add rent, salaries, and electricity to see realistic profit from day one.</p>
                    </div>
                    <div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all group cursor-pointer" onclick="switchTaxTab('expenses')">
                        <div class="w-10 h-10 rounded-xl bg-white dark:bg-darkCard flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-receipt text-blue-500"></i>
                        </div>
                        <h4 class="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-2">2. Record Expenses</h4>
                        <p class="text-[10px] text-gray-500 font-bold leading-relaxed">Log your shop purchases and overheads for accurate tax assessments.</p>
                    </div>
                    <div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-all group cursor-pointer" onclick="document.querySelector('[data-target=\'pos-view\']').click()">
                        <div class="w-10 h-10 rounded-xl bg-white dark:bg-darkCard flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <i class="fa-solid fa-cash-register text-primary"></i>
                        </div>
                        <h4 class="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white mb-2">3. Start Selling</h4>
                        <p class="text-[10px] text-gray-500 font-bold leading-relaxed">Head over to the POS terminal and process your first invoice.</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <!-- Revenue Card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
                        <i class="fa-solid fa-money-bill-trend-up text-xl"></i>
                    </div>
                </div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue (Today)</p>
                <h3 class="text-2xl font-black text-gray-900 dark:text-white mt-1">${formatCurrency(stats.revenue)}</h3>
                <div class="mt-4 flex items-center gap-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">Net Sales Volume</span>
                </div>
            </div>

            <!-- Expenses Card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
                        <i class="fa-solid fa-receipt text-xl"></i>
                    </div>
                </div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expenses (Today)</p>
                <h3 class="text-2xl font-black text-gray-900 dark:text-white mt-1">${formatCurrency(stats.realisticExpenses || stats.expenses)}</h3>
                <div class="mt-4 flex flex-wrap gap-1">
                    <span class="text-[8px] font-black uppercase text-gray-400 border border-gray-100 dark:border-gray-800 px-2 py-0.5 rounded">Actual: ${formatCurrency(stats.expenses)}</span>
                    ${stats.remainingFixed > 0 ? `<span class="text-[8px] font-black uppercase text-orange-400 border border-orange-100 dark:border-orange-800 px-2 py-0.5 rounded">Forecasted: +${formatCurrency(stats.remainingFixed)}</span>` : ''}
                </div>
            </div>

            <!-- Net Profit Card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                        <i class="fa-solid fa-sack-dollar text-xl"></i>
                    </div>
                </div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Realistic Profit (Today)</p>
                <h3 class="text-2xl font-black ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-1">${formatCurrency(stats.profit)}</h3>
                <div class="mt-4">
                    <p class="text-[10px] text-gray-500 font-bold">Margin: <span class="text-gray-900 dark:text-gray-100">${stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(1) : 0}%</span></p>
                    ${stats.remainingFixed > 0 ? `<p class="text-[8px] text-orange-500 font-bold mt-1 animate-pulse">Adjusted for Fixed Costs</p>` : ''}
                </div>
            </div>

            <!-- Estimated Tax Card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border-2 border-orange-500/20 dark:border-orange-500/10 bg-gradient-to-br from-white to-orange-50/30 dark:from-darkCard dark:to-orange-950/5 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/10">
                        <i class="fa-solid fa-stamp text-xl"></i>
                    </div>
                </div>
                <p class="text-[10px] font-black text-orange-600 uppercase tracking-widest italic">Corporate Tax Estim. (30%)</p>
                <h3 class="text-2xl font-black text-orange-600 mt-1">${formatCurrency(stats.tax)}</h3>
                <div class="mt-4 bg-orange-500/10 h-1 rounded-full overflow-hidden">
                    <div class="bg-orange-500 h-full w-1/3"></div>
                </div>
            </div>
        </div>

        <!-- Annual Progress & Detailed Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-fade-in">
            <!-- Financial Year Overview -->
            <div class="lg:col-span-2 bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-darkBorder p-10">
                <div class="flex items-center justify-between mb-10">
                    <div>
                        <h4 class="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Financial Year Recap</h4>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">April ${fyStartYear} - March ${fyStartYear + 1} Assessment</p>
                    </div>
                    <button onclick="exportTaxReport(null, 'yearly')" class="w-10 h-10 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                        <i class="fa-solid fa-file-pdf"></i>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales (FY)</p>
                        <p class="text-2xl font-black text-gray-900 dark:text-white">${formatCurrency(fyStats.revenue)}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Expenses (FY)</p>
                        <p class="text-2xl font-black text-gray-900 dark:text-white">${formatCurrency(fyStats.expenses)}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cumulative Profit (FY)</p>
                        <p class="text-2xl font-black text-emerald-600">${formatCurrency(fyStats.profit)}</p>
                    </div>
                </div>

                <div class="mt-12 p-8 rounded-3xl bg-amber-500/5 border border-dashed border-amber-500/20">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-circle-info"></i>
                        </div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed italic">
                            Tax assessment for Private Limited companies in Sri Lanka requires filing at a <b class="text-orange-600">30% Corporate Rate</b>. The figures above are estimates based on digitized logic. Please verify with a certified accountant for IRD filing.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Expense Categories Chart-ish -->
            <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-darkBorder p-10 flex flex-col">
                <h4 class="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-8">Top Expenses</h4>
                <div class="flex-1 space-y-6">
                    ${stats.topCategories.length === 0 ? '<div class="text-center py-20 text-gray-400 italic">No expense data found</div>' : 
                        stats.topCategories.slice(0, 5).map(cat => `
                            <div class="space-y-2">
                                <div class="flex justify-between items-end">
                                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">${cat.name}</span>
                                    <span class="text-sm font-black text-gray-900 dark:text-white">${formatCurrency(cat.total)}</span>
                                </div>
                                <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${(cat.total / stats.expenses * 100).toFixed(0)}%"></div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                <div class="mt-10">
                    <button onclick="switchTaxTab('expenses')" class="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">Categorize Expenses</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Calculations Helper
 */
async function calculateFinancialStats(startDate, endDate) {
    console.log(`Calculating stats for range: ${startDate} to ${endDate}`);
    
    let sales = [];
    let expenses = [];
    let commissions = [];
    let forecasted = [];

    try {
        sales = await db.sales.where('date').between(startDate, endDate).toArray();
    } catch (e) { console.warn("Missing sales table or query error", e); }

    try {
        expenses = await db.expenses.where('date').between(startDate, endDate).toArray();
    } catch (e) { console.warn("Missing expenses table or query error", e); }

    try {
        commissions = await db.commissions.where('date').between(startDate, endDate).toArray();
    } catch (e) { console.warn("Missing commissions table or query error", e); }

    try {
        forecasted = await db.forecasted_expenses.toArray();
    } catch (e) { console.warn("Missing forecasted_expenses table or query error", e); }
    
    // 1. Revenue — Exclude quotes and sales orders; only count finalized invoices
    const REVENUE_TYPES = ['invoice', 'pos_invoice', 'web_order'];
    let grossRevenue = 0;
    sales.forEach(s => {
        if (REVENUE_TYPES.includes(s.document_type)) {
            grossRevenue += parseFloat(s.total || 0);
        }
    });

    // 1.1 Subtract Commissions (to get Net Sales Value as requested)
    const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const revenue = grossRevenue - totalCommissions;

    // 2. Expenses Categorized
    let totalExpenses = 0;
    const categories = {};
    expenses.forEach(e => {
        const amt = parseFloat(e.amount || 0);
        totalExpenses += amt;
        categories[e.category] = (categories[e.category] || 0) + amt;
    });

    // Sort categories by amount
    const topCategories = Object.entries(categories)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

    // 3. Realistic Profit Calculation (User Request: Sales - (Actual + Remaining Fixed))
    // We only apply "Forecasted" logic if we are looking at the current month
    const now = new Date();
    const isCurrentMonth = new Date(startDate).getMonth() === now.getMonth() && new Date(startDate).getFullYear() === now.getFullYear();
    
    let realisticExpenses = totalExpenses;
    let remainingFixed = 0;

    if (isCurrentMonth) {
        forecasted.forEach(f => {
            const actualForCat = categories[f.category] || 0;
            const remaining = Math.max(0, parseFloat(f.amount) - actualForCat);
            remainingFixed += remaining;
        });
        realisticExpenses += remainingFixed;
    }

    const profit = revenue - realisticExpenses;
    const taxableProfit = Math.max(0, profit);
    const tax = taxableProfit * 0.30; 

    return { 
        revenue, 
        expenses: totalExpenses, 
        realisticExpenses, 
        remainingFixed,
        profit, 
        tax, 
        topCategories, 
        taxableProfit 
    };
}

/**
 * Tab 2: Expense Management
 */
async function renderTaxExpenses(container) {
    const expenses = await db.expenses.orderBy('date').reverse().toArray();

    container.innerHTML = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden animate-fade-in-up">
            <div class="p-8 md:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30 dark:bg-darkBg/20">
                <div>
                    <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Categorized Expenses</h3>
                    <p class="text-sm text-gray-500 font-medium">Record every shop expense for accurate P&L statements.</p>
                </div>
                <button onclick="if(typeof openExpenseModal === 'function') openExpenseModal()" class="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-95">
                    <i class="fa-solid fa-plus-circle"></i> Add Shop Expense
                </button>
            </div>
            <div class="p-0 overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase text-[10px] font-black tracking-[0.2em]">
                        <tr>
                            <th class="p-6">Date</th>
                            <th class="p-6">Ledger Category</th>
                            <th class="p-6">Description / Remarks</th>
                            <th class="p-6 text-right">Amount (LKR)</th>
                            <th class="p-6 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        ${expenses.length === 0 ? '<tr><td colspan="5" class="p-32 text-center text-gray-400 italic font-medium">No expenses found in your ledger.</td></tr>' : 
                            expenses.map(e => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td class="p-6 font-bold text-gray-900 dark:text-white">${new Date(e.date).toLocaleDateString()}</td>
                                    <td class="p-6">
                                        <span class="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/10">${e.category}</span>
                                    </td>
                                    <td class="p-6 text-gray-500 font-medium">${e.description || '-'}</td>
                                    <td class="p-6 text-right font-black text-rose-600">${formatCurrency(e.amount)}</td>
                                    <td class="p-6 text-center">
                                        <button onclick="deleteExpenseEntry(${e.id})" class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-rose-600 transition-all">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function deleteExpenseEntry(id) {
    if (confirm('Permanently delete this expense? This will affect your current tax calculations.')) {
        try {
            window.isManualAction = true;
            await db.expenses.delete(id);
            showAlert('Updated', 'Expense removed successfully.');
            renderTaxExpenses(document.getElementById('tax-tab-content'));
        } finally {
            window.isManualAction = false;
        }
    }
}

/**
 * Tab 3: Report History
 */
async function renderTaxHistory(container) {
    const historicalReports = await db.tax_reports.orderBy('id').reverse().toArray();

    container.innerHTML = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden animate-fade-in-up">
            <div class="p-8 md:p-10 border-b border-gray-100 dark:border-darkBorder bg-gray-50/30 dark:bg-darkBg/20 flex items-center justify-between">
                <div>
                    <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Tax Report History</h3>
                    <p class="text-sm text-gray-500 font-medium">Archive of generated quarterly and annual tax assessments.</p>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                    <i class="fa-solid fa-folder-open text-xl font-bold"></i>
                </div>
            </div>
            <div class="p-0 overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase text-[10px] font-black tracking-[0.2em]">
                        <tr>
                            <th class="p-6">Financial Period</th>
                            <th class="p-6">Archived On</th>
                            <th class="p-6 text-right">Net Profit</th>
                            <th class="p-6 text-right">Tax Payable</th>
                            <th class="p-6 text-center">Export</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        ${historicalReports.length === 0 ? '<tr><td colspan="5" class="p-32 text-center text-gray-400 italic">No archived reports found. Generate one to see it here.</td></tr>' : 
                            historicalReports.map(r => `
                                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td class="p-6">
                                        <div class="font-black text-gray-900 dark:text-white uppercase tracking-tight italic">${r.financial_year}</div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}</div>
                                    </td>
                                    <td class="p-6 text-gray-500 font-medium">${new Date(r.generated_date).toLocaleString()}</td>
                                    <td class="p-6 text-right font-black text-emerald-600">${formatCurrency(r.net_profit)}</td>
                                    <td class="p-6 text-right font-black text-orange-600">${formatCurrency(r.tax_payable)}</td>
                                    <td class="p-6 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button onclick="exportTaxReport(${r.id})" class="w-10 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                                                <i class="fa-solid fa-cloud-arrow-down"></i>
                                            </button>
                                            <button onclick="deleteHistoricalReport(${r.id})" class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-300 hover:text-rose-600 transition-all flex items-center justify-center">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function deleteHistoricalReport(id) {
    if (confirm('Permanently remove this report from archive?')) {
        try {
            window.isManualAction = true;
            await db.tax_reports.delete(id);
            renderTaxHistory(document.getElementById('tax-tab-content'));
        } finally {
            window.isManualAction = false;
        }
    }
}

/**
 * Tab: Forecasted/Fixed Expenses Management
 */
async function renderForecastedExpenses(container) {
    const forecasted = await db.forecasted_expenses.toArray();
    const accounts = await db.accounts.filter(a => a.type === 'Expense').toArray();

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="bg-amber-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                <i class="fa-solid fa-chart-line absolute bottom-[-30px] right-[-20px] text-[180px] opacity-10 group-hover:scale-110 transition-transform duration-700"></i>
                <div class="relative z-10 max-w-2xl">
                    <h3 class="text-3xl font-black italic tracking-tighter uppercase mb-4">Realistic Profit Engine</h3>
                    <p class="text-amber-100 font-medium leading-relaxed mb-6">
                        Define your monthly fixed costs (Rent, Salaries, Electricity, etc.) below. 
                        The system will automatically deduct these from your sales to show a <b>Realistic Profit</b> from day one of the month, even before you record the actual bills.
                    </p>
                    <button onclick="openForecastModal()" class="bg-white text-amber-600 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                        <i class="fa-solid fa-plus-circle"></i> Define New Fixed Cost
                    </button>
                </div>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                <div class="p-8 border-b border-gray-100 dark:border-darkBorder bg-gray-50/30 dark:bg-darkBg/20">
                    <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Forecasted Monthly Expenses</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-gray-800 text-gray-400 uppercase text-[10px] font-black tracking-[0.2em]">
                            <tr>
                                <th class="p-6">Expense Name</th>
                                <th class="p-6">Ledger Category</th>
                                <th class="p-6 text-right">Target Amount (Monthly)</th>
                                <th class="p-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${forecasted.length === 0 ? '<tr><td colspan="4" class="p-20 text-center text-gray-400 italic">No fixed costs defined. Click "Define New Fixed Cost" to start.</td></tr>' : 
                                forecasted.map(f => `
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td class="p-6 font-bold text-gray-900 dark:text-white">${f.name}</td>
                                        <td class="p-6">
                                            <span class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100">${f.category}</span>
                                        </td>
                                        <td class="p-6 text-right font-black text-gray-900 dark:text-white">${formatCurrency(f.amount)}</td>
                                        <td class="p-6 text-center">
                                            <button onclick="deleteForecastEntry(${f.id})" class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-300 hover:text-rose-600 transition-all">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')
                            }
                        </tbody>
                        ${forecasted.length > 0 ? `
                            <tfoot class="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <td colspan="2" class="p-6 font-black text-gray-500 uppercase tracking-widest text-[10px]">Total Monthly Fixed Commitment</td>
                                    <td class="p-6 text-right font-black text-xl text-primary dark:text-secondary">${formatCurrency(forecasted.reduce((sum, f) => sum + parseFloat(f.amount), 0))}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        ` : ''}
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function openForecastModal() {
    const accounts = await db.accounts.filter(a => a.type === 'Expense').toArray();
    
    const { value: formValues } = await Swal.fire({
        title: 'Define Fixed Cost',
        html: `
            <div class="space-y-4 text-left p-2">
                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Description (e.g. Shop Rent)</label>
                    <input id="f-name" class="swal2-input !m-0 !w-full" placeholder="Expense Description">
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Budgeted Amount (LKR)</label>
                    <input id="f-amount" type="number" class="swal2-input !m-0 !w-full" placeholder="50000">
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Ledger Category</label>
                    <select id="f-category" class="swal2-input !m-0 !w-full">
                        ${accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Fixed Cost',
        preConfirm: () => {
            const name = document.getElementById('f-name').value;
            const amount = document.getElementById('f-amount').value;
            const category = document.getElementById('f-category').value;
            if (!name || !amount) {
                Swal.showValidationMessage('Please fill all fields');
            }
            return { name, amount, category };
        }
    });

    if (formValues) {
        await db.forecasted_expenses.add(formValues);
        renderForecastedExpenses(document.getElementById('tax-tab-content'));
    }
}

async function deleteForecastEntry(id) {
    if (confirm('Delete this forecasted expense?')) {
        await db.forecasted_expenses.delete(id);
        renderForecastedExpenses(document.getElementById('tax-tab-content'));
    }
}

/**
 * Tab 4: Government Links
 */
async function renderGovLinks(container) {
    // Fetch actual business identification from settings
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);
    
    const storeBR = opts['store_br'] || 'PV 0025XXXX';
    const storeName = opts['store_name'] || 'MobileMate Technologies Private Limited Company';
    const tinNum = opts['tax_tin'] || 'TIN 123456780'; // Keeping a fallback if TIN not found

    const links = [
        {
            name: "Inland Revenue Sri Lanka",
            desc: "Income Tax, VAT, and RAMIS portal for tax filing and payments.",
            url: "https://www.ird.gov.lk/",
            icon: "fa-land-mine-on",
            color: "blue"
        },
        {
            name: "Registrar of Companies",
            desc: "Annual Return (Form 15) and company profile registration.",
            url: "https://eroc.drc.gov.lk/",
            icon: "fa-building-shield",
            color: "emerald"
        },
        {
            name: "VAT Portal SL",
            desc: "Direct endpoint for VAT/SVAT return submissions and e-filing.",
            url: "https://www.ird.gov.lk/en/e-Services/SitePages/Access-to-e-Services.aspx",
            icon: "fa-file-signature",
            color: "orange"
        },
        {
            name: "SL Customs Service",
            desc: "ASycuda Portal for business trade and import duty entries.",
            url: "http://www.customs.gov.lk/",
            icon: "fa-ship",
            color: "indigo"
        }
    ];

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
            ${links.map(l => `
                <a href="${l.url}" target="_blank" class="bg-white dark:bg-darkCard p-10 rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm group hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5">
                    <div class="flex items-start gap-8">
                        <div class="w-20 h-20 rounded-3xl bg-${l.color}-50 text-${l.color}-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                            <i class="fa-solid ${l.icon}"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-3">
                                <h3 class="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter italic">${l.name}</h3>
                                <i class="fa-solid fa-external-link text-xs text-gray-300"></i>
                            </div>
                            <p class="text-sm text-gray-500 leading-relaxed font-bold">${l.desc}</p>
                        </div>
                    </div>
                </a>
            `).join('')}
            
            <!-- Company Verification Badge -->
            <div class="md:col-span-2 bg-gradient-to-r from-primary to-indigo-900 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
                <i class="fa-solid fa-fingerprint absolute bottom-[-40px] right-[-20px] text-[200px] opacity-10 group-hover:rotate-12 transition-transform duration-1000"></i>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div>
                        <h3 class="text-2xl font-black italic tracking-tighter uppercase mb-2">Corporate Identity Verification</h3>
                        <p class="text-indigo-200 text-sm font-bold uppercase tracking-[0.2em] opacity-80">${storeName}</p>
                    </div>
                    <div class="flex flex-wrap gap-4">
                         <div class="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                             <p class="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Company Reg #</p>
                             <p class="font-black text-lg tracking-tight">${storeBR}</p>
                         </div>
                         <div class="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
                             <p class="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Tax TIN #</p>
                             <p class="font-black text-lg tracking-tight">${tinNum}</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * REPORT GENERATION WIZARD
 */
async function generateNewTaxReport() {
    const { value: formValues } = await Swal.fire({
        title: 'Tax Generation Wizard',
        html: `
            <div class="space-y-6 text-left p-2">
                <div class="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 dark:bg-emerald-900/5 dark:border-emerald-800/30">
                    <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 font-black italic">Select Reporting Cycle</p>
                    <select id="swal-range" class="w-full px-5 py-4 bg-white dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none font-bold text-lg shadow-sm">
                        <option value="month">Current Month Analysis</option>
                        <option value="quarter">Quarterly Tax Assessment</option>
                        <option value="yearly">Financial Year (April-March)</option>
                        <option value="custom">Custom Date Range Select</option>
                    </select>
                </div>
                <div id="custom-range-inputs" style="display:none;" class="animate-fade-in-down grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-500 mb-1 block ml-2 tracking-widest">Start Date</label>
                        <input type="date" id="swal-start" value="${new Date().toISOString().split('T')[0]}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-gray-500 mb-1 block ml-2 tracking-widest">End Date</label>
                        <input type="date" id="swal-end" value="${new Date().toISOString().split('T')[0]}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-primary outline-none font-bold">
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false,
        confirmButtonText: '<div class="flex items-center gap-2"><span>Compute Statistics</span> <i class="fa-solid fa-chevron-right"></i></div>',
        showCancelButton: true,
        customClass: {
            popup: 'rounded-[3rem]',
            confirmButton: 'bg-emerald-600 hover:bg-emerald-700 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs',
            cancelButton: 'text-gray-400 font-bold uppercase text-xs'
        },
        willOpen: () => {
            document.getElementById('swal-range').addEventListener('change', (e) => {
                document.getElementById('custom-range-inputs').style.display = e.target.value === 'custom' ? 'grid' : 'none';
            });
        },
        preConfirm: () => {
            return {
                range: document.getElementById('swal-range').value,
                start: document.getElementById('swal-start').value,
                end: document.getElementById('swal-end').value
            }
        }
    });

    if (formValues) {
        let start, end, label;
        const now = new Date();
        
        if (formValues.range === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
            label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else if (formValues.range === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1).toISOString();
            end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59).toISOString();
            label = `Q${quarter + 1} ${now.getFullYear()}`;
        } else if (formValues.range === 'yearly') {
            let fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
            start = new Date(fyStartYear, 3, 1).toISOString();
            end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59).toISOString();
            label = `FY ${fyStartYear}/${fyStartYear + 1}`;
        } else {
            start = new Date(formValues.start).toISOString();
            end = new Date(formValues.end).toISOString();
            label = `${formValues.start} to ${formValues.end}`;
        }

        const stats = await calculateFinancialStats(start, end);
        
        // Results & Save option
        const result = await Swal.fire({
            title: 'Assessment Computed',
            html: `
                <div class="text-left space-y-4 p-2 font-bold animate-fade-in">
                    <div class="flex justify-between p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</span>
                        <span class="text-xl font-black">${formatCurrency(stats.revenue)}</span>
                    </div>
                    <div class="flex justify-between p-5 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                        <span class="text-[10px] font-black text-rose-400 uppercase tracking-widest">Deductible Expenses</span>
                        <span class="text-xl font-black text-rose-600">${formatCurrency(stats.expenses)}</span>
                    </div>
                    <div class="flex justify-between p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                        <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Bottom-Line Profit</span>
                        <span class="text-xl font-black text-emerald-600">${formatCurrency(stats.profit)}</span>
                    </div>
                    <div class="p-6 bg-orange-600 rounded-3xl text-white shadow-xl shadow-orange-600/30">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Corp. Tax Payable (30%)</span>
                            <span class="text-2xl font-black italic tracking-tighter">${formatCurrency(stats.tax)}</span>
                        </div>
                    </div>
                </div>
            `,
            showDenyButton: true,
            confirmButtonText: 'Save & Export Formal PDF',
            denyButtonText: 'Discard & Exit',
            customClass: {
                popup: 'rounded-[3rem]',
                confirmButton: 'bg-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl',
                denyButton: 'bg-gray-100 dark:bg-gray-800 text-gray-500 px-6 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]'
            }
        });

        if (result.isConfirmed) {
            const reportId = await db.tax_reports.add({
                financial_year: label,
                start_date: start,
                end_date: end,
                total_sales: stats.revenue,
                total_expenses: stats.expenses,
                net_profit: stats.profit,
                taxable_profit: stats.taxableProfit,
                tax_payable: stats.tax,
                generated_date: new Date().toISOString()
            });
            exportTaxReport(reportId);
            setTimeout(() => switchTaxTab('status'), 500);
        }
    }
}

/**
 * PDF FORMAL EXPORT
 */
async function exportTaxReport(reportId, type = null, mockData = null) {
    let report = mockData;
    if (reportId && !mockData) {
        report = await db.tax_reports.get(reportId);
    }
    
    if (!report && type === 'yearly') {
        const now = new Date();
        let fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const s = new Date(fyStartYear, 3, 1).toISOString();
        const e = new Date(fyStartYear + 1, 2, 31, 23, 59, 59).toISOString();
        const stats = await calculateFinancialStats(s, e);
        report = {
            financial_year: `Annual FY ${fyStartYear}/${fyStartYear + 1}`,
            start_date: s,
            end_date: e,
            total_sales: stats.revenue,
            total_expenses: stats.expenses,
            net_profit: stats.profit,
            taxable_profit: stats.taxableProfit,
            tax_payable: stats.tax
        };
    }

    if (!report) return;

    // Settings
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);
    
    const storeName = opts['store_name'] || 'MobileMate Technologies (PVT) LTD';
    const storeAddress = opts['store_address'] || '123 Tech Lane, Colombo, Sri Lanka';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '+94 XX XXX XXXX';
    const storeBR = opts['store_br'] || 'PV 0025XXXX';
    const tin = `REG: ${storeBR}`; 

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tax Report - ${report.financial_year}</title>
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; line-height: 1.6; background: #fff; padding: 0; margin: 0; }
                .sheet { width: 210mm; min-height: 297mm; padding: 25mm; margin: 0 auto; box-sizing: border-box; }
                .top-header { border-bottom: 2px solid #0f172a; padding-bottom: 25px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: flex-end; }
                .company-info h1 { font-size: 26px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase; }
                .rep-meta { text-align: right; }
                .rep-meta h2 { font-size: 18px; font-weight: 800; color: #64748b; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
                .grid-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
                .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .card-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
                .card-val { font-size: 22px; font-weight: 900; color: #0f172a; }
                .highlight-profit { background: #f0fdf4; border-color: #dcfce7; }
                .highlight-tax { background: #fff7ed; border-color: #ffedd5; }
                table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                th { text-align: left; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding: 12px 0; }
                td { padding: 15px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                .row-bold td { font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 20px; font-size: 16px; }
                .footer-box { margin-top: 60px; padding: 30px; background: #0f172a; border-radius: 16px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
                .signatures { display: flex; justify-content: space-between; margin-top: 100px; }
                .sig-line { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 12px; font-size: 11px; font-weight: bold; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="sheet">
                <div class="top-header">
                    <div class="company-info">
                        <h1>${storeName}</h1>
                        ${enabledStoreAddress ? `<p style="font-size: 13px; font-weight: 600; color: #64748b; margin: 5px 0 0 0;">${storeAddress}</p>` : ''}
                        <p style="font-size: 11px; font-weight: 900; color: #10b981; margin: 3px 0 0 0; text-transform: uppercase;">Reg Document: ${tin}</p>
                    </div>
                    <div class="rep-meta">
                        <h2>Tax & P&L Statement</h2>
                        <p style="font-size: 14px; font-weight: 900; margin: 5px 0 0 0;">CYCLE: ${report.financial_year}</p>
                    </div>
                </div>

                <div class="grid-summary">
                    <div class="card">
                        <div class="card-label">Revenue Assessment</div>
                        <div class="card-val">${formatCurrency(report.total_sales)}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Operational Expenditure</div>
                        <div class="card-val" style="color: #ef4444;">${formatCurrency(report.total_expenses)}</div>
                    </div>
                    <div class="card highlight-profit">
                        <div class="card-label" style="color: #166534;">Final Net Profit</div>
                        <div class="card-val" style="color: #10b981;">${formatCurrency(report.net_profit)}</div>
                    </div>
                    <div class="card highlight-tax">
                        <div class="card-label" style="color: #9a3412;">Corporate Tax Estim. (30%)</div>
                        <div class="card-val" style="color: #f97316;">${formatCurrency(report.tax_payable)}</div>
                    </div>
                </div>

                <h3 style="font-size:12px; font-weight:900; text-transform:uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom:10px; margin-top:50px;">Detailed Provision Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Classification</th>
                            <th style="text-align: right;">Valuation (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Digital Invoices & POS Terminals Revenue</td><td style="text-align: right;">${formatCurrency(report.total_sales)}</td></tr>
                        <tr><td>Cost of Goods Sold & Direct Stock Procurement</td><td style="text-align: right;">(Computed)</td></tr>
                        <tr><td>Shop Overheads (Rent, Utilities, Salaries)</td><td style="text-align: right; color: #ef4444;">${formatCurrency(report.total_expenses)}</td></tr>
                        <tr class="row-bold"><td>NET TAXABLE INCOME</td><td style="text-align: right;">${formatCurrency(report.net_profit)}</td></tr>
                    </tbody>
                </table>

                <div class="footer-box">
                    <div>
                        <p style="text-transform: uppercase; font-size: 10px; font-weight: 800; color: #94a3b8; margin: 0 0 5px 0;">Calculated Tax liability</p>
                        <p style="font-size: 28px; font-weight: 900; margin: 0;">${formatCurrency(report.tax_payable)}</p>
                    </div>
                    <div style="text-align: right; max-width: 50%;">
                        <p style="font-size: 10px; color: #94a3b8; line-height: 1.4;">Official digital certification. Valid for audit and annual government return submissions to ROC & IRD Sri Lanka.</p>
                    </div>
                </div>

                <div class="signatures">
                    <div class="sig-line">Director's Endorsement</div>
                    <div class="sig-line">Certified Auditor Signature</div>
                </div>

                <div style="text-align: center; margin-top: 60px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    Powered by <span style="font-weight: 800; color: #01a5a5;">Infinity Creative Works</span> <a href="https://wa.me/94765449005" style="color: #01a5a5; text-decoration: none; margin-left: 5px;">+94 76 5 449 005</a> | &copy; ${new Date().getFullYear()} ${storeName}
                </div>
            </div>
        </body>
        </html>
    `;

    if (typeof openPreviewModal === 'function') {
        openPreviewModal(
            html, 
            () => {
                generatePDFAndShare(html, `Formal_Tax_Report_${report.financial_year.replace(/\s+/g, '_')}.pdf`);
            },
            null,
            null,
            (html) => {
                const docNo = `TAX-${report.financial_year.replace(/\s+/g, '-')}`;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Formal Tax Assessment', docNo, 'Tax Authority / Internal', report.tax_payable, [], html);
                }
            }
        );
    } else {
        generatePDFAndShare(html, `Formal_Tax_Report_${report.financial_year.replace(/\s+/g, '_')}.pdf`);
    }
}
