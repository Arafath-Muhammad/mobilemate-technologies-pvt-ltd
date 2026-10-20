// Dashboard functionality and rendering
let dashboardClockInterval = null;
let currentClockMode = 'digital';

async function loadDashboard() {
    try {
        console.log("Loading dashboard...");
        const dashboardView = document.getElementById('dashboard-view');
        if (!dashboardView) return;

        const now = new Date();
        // Determine period start date based on selected filter
        const period = window.dashboardPeriod || 'monthly';
        let startOfPeriod;
        if (period === 'daily') {
            startOfPeriod = now.toISOString().split('T')[0];
        } else if (period === 'weekly') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay()); // start of week (Sunday)
            startOfPeriod = start.toISOString().split('T')[0];
        } else { // monthly
            startOfPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        }
        // Fetch data
        const totalProducts = await db.products.count();
        const lowStockThreshold = 10;
        const lowStockItems = await db.products.filter(p => p.stock_qty < lowStockThreshold).count();

        // Calculate Today's Sales
        const startOfDay = now.toISOString().split('T')[0];
        const dailySales = await db.sales
            .where('date').aboveOrEqual(startOfDay)
            .filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order')
            .toArray();
        const dailyTotalSales = dailySales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);

        // Calculate Month-to-Date Sales (exclude quotes and sales orders)
        const startOfMonth = startOfPeriod;
        const monthlySalesRecords = await db.sales
            .where('date').aboveOrEqual(startOfMonth)
            .filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order')
            .toArray();
        const monthlyTotalSales = monthlySalesRecords.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);

        // Additional KPI calculations
        const totalPurchases = await db.purchases
            .where('date').aboveOrEqual(startOfPeriod)
            .filter(p => p.document_type !== 'quote' && p.document_type !== 'purchase_order')
            .toArray()
            .then(arr => arr.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0));

        const totalExpenses = await (db.expenses
            ? db.expenses.where('date').aboveOrEqual(startOfPeriod).toArray().then(arr => arr.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0))
            : Promise.resolve(0));

        const profitLoss = monthlyTotalSales - totalPurchases - totalExpenses;

        const salesThisPeriod = await db.sales
            .where('date').aboveOrEqual(startOfPeriod)
            .filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order')
            .toArray();

        const customerMap = {};
        salesThisPeriod.forEach(s => {
            const custId = s.customer_id || 'Unknown';
            const amt = parseFloat(s.total) || 0;
            if (!customerMap[custId]) customerMap[custId] = { total: 0, count: 0 };
            customerMap[custId].total += amt;
            customerMap[custId].count += 1;
        });

        const topCustomers = Object.entries(customerMap)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);

        const productMap = {};
        salesThisPeriod.forEach(s => {
            if (Array.isArray(s.items)) {
                s.items.forEach(item => {
                    const pid = item.product_id;
                    const qty = parseInt(item.qty) || 0;
                    if (!productMap[pid]) productMap[pid] = { qty: 0 };
                    productMap[pid].qty += qty;
                });
            }
        });
        const topProducts = Object.entries(productMap)
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 5);

        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStart = lastMonth.toISOString().split('T')[0];
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
        const lastMonthSales = await db.sales
            .where('date').between(lastMonthStart, lastMonthEnd, true, true)
            .filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order')
            .toArray();
        const lastMonthTotal = lastMonthSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
        const monthVsLastMonth = lastMonthTotal > 0 ? (((monthlyTotalSales - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1) : null;

        const safeTopCustomers = topCustomers || [];
        const safeTopProducts = topProducts || [];

        // Build UI
        const html = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
                <h2 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Real-time store statistics and operational metrics</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <div class="bg-gray-100 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 p-1 rounded-xl flex items-center gap-1 shadow-inner">
                    <button onclick="setDashboardPeriod('daily')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all dashboard-segment-btn ${period === 'daily' ? 'bg-primary dark:bg-secondary text-white shadow-sm active' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}">Daily</button>
                    <button onclick="setDashboardPeriod('weekly')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all dashboard-segment-btn ${period === 'weekly' ? 'bg-primary dark:bg-secondary text-white shadow-sm active' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}">Weekly</button>
                    <button onclick="setDashboardPeriod('monthly')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all dashboard-segment-btn ${period === 'monthly' ? 'bg-primary dark:bg-secondary text-white shadow-sm active' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}">Monthly</button>
                </div>
                <button onclick="exportDashboardPDF()" class="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-file-pdf"></i> Export PDF
                </button>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 lg:gap-6 mb-6">
            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider">Today's Sales</h3>
                    <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-calendar-day text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Rs. ${dailyTotalSales.toLocaleString()}</h2>
                    <p class="mt-2 text-xs text-gray-400">Daily Revenue</p>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider">Monthly Revenue</h3>
                    <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-chart-line text-emerald-600 dark:text-emerald-400 text-sm"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Rs. ${monthlyTotalSales.toLocaleString()}</h2>
                    <div class="mt-2 text-xs">
                        ${monthVsLastMonth !== null
                ? `<span class="${parseFloat(monthVsLastMonth) >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'} flex items-center gap-1"><i class="fa-solid ${parseFloat(monthVsLastMonth) >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${parseFloat(monthVsLastMonth) >= 0 ? '+' : ''}${monthVsLastMonth}% vs last month</span>`
                : `<span class="text-gray-400 font-medium">No data for last month</span>`
            }
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider">Profit / Loss</h3>
                    <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-chart-pie text-amber-600 dark:text-amber-400 text-sm"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl lg:text-3xl font-extrabold ${profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} tracking-tight">
                        ${profitLoss >= 0 ? '+' : '-'}Rs. ${Math.abs(profitLoss).toLocaleString()}
                    </h2>
                    <p class="mt-2 text-xs text-gray-400">Net ${profitLoss >= 0 ? 'Profit' : 'Loss'} this month</p>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider">Cash Flow (Month)</h3>
                    <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-money-bill-wave text-purple-600 dark:text-purple-400 text-sm"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Rs. ${(monthlyTotalSales - totalPurchases).toLocaleString()}</h2>
                    <p class="mt-2 text-xs text-gray-400">Inflows minus Outflows</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 lg:gap-6 mb-6">
            <div id="mobile-access-card" class="col-span-12 bg-indigo-600 dark:bg-indigo-900/40 rounded-2xl p-5 shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="flex items-center gap-5 relative z-10">
                    <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                        <i class="fa-solid fa-mobile-screen-button text-2xl animate-bounce"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-white uppercase tracking-tight">Access on Mobile</h3>
                        <p class="text-indigo-100 text-xs font-medium max-w-sm">Scan to open MobileMate on your phone instantly. Stay connected to your store on the go.</p>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
                    <div class="flex flex-col items-center sm:items-end gap-1">
                        <span class="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Local Server URL</span>
                        <div class="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white font-mono font-black text-sm">
                            http://<span id="local-ip-display">localhost</span>:3000
                        </div>
                    </div>
                    <button onclick="showMobileSetupGuide()" class="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2">
                        <i class="fa-solid fa-qrcode"></i>
                        <span>Show QR Code</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 lg:gap-6 mb-6">
            <div class="col-span-12 lg:col-span-6 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all hover:shadow-md relative min-h-[140px] flex items-center">
                <div class="absolute top-3 right-3 flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 scale-75 lg:scale-90 origin-top-right">
                    <button onclick="toggleClockMode('digital')" id="btn-mode-digital" class="px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currentClockMode === 'digital' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}">DIGITAL</button>
                    <button onclick="toggleClockMode('analog')" id="btn-mode-analog" class="px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currentClockMode === 'analog' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}">ANALOG</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center w-full mt-2 lg:mt-0 dashboard-mobile-cols">
                    <div class="text-center md:text-left">
                        <span class="text-xs font-bold text-secondary uppercase tracking-[0.2em]">System Time</span>
                        <div id="dash-clock-digital" class="${currentClockMode === 'digital' ? '' : 'hidden'} text-center md:text-left animate-fade-in mt-1">
                            <h2 id="dash-time-text" class="text-3xl lg:text-4xl font-extrabold text-primary dark:text-white digital-clock">00:00:00</h2>
                            <p id="dash-date-text" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monday, May 12</p>
                        </div>
                        <div id="dash-clock-digital-placeholder" class="${currentClockMode === 'analog' ? '' : 'hidden'} text-center md:text-left animate-fade-in mt-1">
                            <h2 class="text-2xl font-extrabold text-primary dark:text-white digital-clock">Time Active</h2>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Analog Mode</p>
                        </div>
                    </div>
                    <div class="flex justify-center md:justify-end">
                        <div id="dash-clock-analog" class="${currentClockMode === 'analog' ? '' : 'hidden'} animate-fade-in">
                            <div class="analog-clock" style="width: 100px; height: 100px; border-width: 3px;">
                                <div class="center-dot" style="width: 6px; height: 6px;"></div>
                                <div id="hour-h" class="hand hour" style="height: 25px; width: 3px; transform-origin: bottom;"></div>
                                <div id="min-h" class="hand minute" style="height: 35px; width: 2px; transform-origin: bottom;"></div>
                                <div id="sec-h" class="hand second" style="height: 40px; width: 1px; transform-origin: bottom;"></div>
                                ${[12, 3, 6, 9].map(n => {
                const angle = n * 30;
                return `<div class="mark" style="transform: rotate(${angle}deg); font-size: 8px; font-weight: 800; padding-top: 4px;"><span style="display:inline-block; transform: rotate(-${angle}deg)">${n}</span></div>`;
            }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Products</h3>
                    <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-boxes-stacked text-purple-600 dark:text-purple-400 text-sm"></i>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">${totalProducts.toLocaleString()}</h2>
                    <p class="mt-2 text-xs text-gray-400">Inventory Level</p>
                </div>
            </div>

            <div class="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder transition-all kpi-card-premium">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-wider ${lowStockItems > 0 ? 'text-orange-500' : ''}">Low Stock</h3>
                    <div class="w-9 h-9 rounded-xl ${lowStockItems > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'} flex items-center justify-center">
                        <i class="fa-solid fa-triangle-exclamation ${lowStockItems > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} text-sm"></i>
                    </div>
                </div>
                <div>
                    <div class="flex items-baseline gap-1">
                        <h2 class="text-2xl lg:text-3xl font-extrabold ${lowStockItems > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'} tracking-tight">${lowStockItems}</h2>
                        <span class="text-xs text-gray-500">items</span>
                    </div>
                    <div class="mt-2 flex items-center text-xs">
                        <button onclick="document.querySelector('[data-target=reports-view]').click()" class="text-primary dark:text-secondary hover:underline font-bold">View Report &rarr;</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 lg:gap-6 mb-6">
            <div class="col-span-12 lg:col-span-8 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-base lg:text-lg font-bold text-gray-900 dark:text-white">Sales Overview</h3>
                        <p class="text-xs text-gray-400 mt-0.5">7-day performance indicator</p>
                    </div>
                    <select class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 focus:ring-primary focus:border-primary cursor-pointer">
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Year</option>
                    </select>
                </div>
                <div class="h-64 lg:h-72 w-full">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-4 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-base lg:text-lg font-bold text-gray-900 dark:text-white">Recent Sales</h3>
                            <p class="text-xs text-gray-400 mt-0.5">Latest transactional updates</p>
                        </div>
                        <button onclick="document.querySelector('[data-target=sales-view]').click()" class="text-primary dark:text-secondary text-xs lg:text-sm hover:underline font-bold">View All</button>
                    </div>
                    <div class="space-y-3 dashboard-clean-list" id="recent-sales-list">
                        <div class="flex items-center justify-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-12 gap-4 lg:gap-6 mb-6">
            <div class="col-span-12 lg:col-span-6 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder flex flex-col">
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h3 class="text-base lg:text-lg font-bold text-gray-900 dark:text-white">Top Customers</h3>
                        <p class="text-xs text-gray-400 mt-0.5">Top contributors this period</p>
                    </div>
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-user-group text-indigo-600 dark:text-indigo-400 text-sm"></i>
                    </div>
                </div>
                <div class="space-y-3 flex-1 flex flex-col justify-center">
                    ${(() => {
                const maxCustomerTotal = safeTopCustomers.length > 0 ? safeTopCustomers[0][1].total : 1;
                return safeTopCustomers.length > 0
                    ? safeTopCustomers.map(([custId, data]) => {
                        const percent = Math.round((data.total / maxCustomerTotal) * 100);
                        return `
                                <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">
                                        ${custId.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex justify-between items-center mb-1">
                                            <p class="text-xs font-bold text-gray-800 dark:text-white truncate">${custId}</p>
                                            <span class="text-xs font-extrabold text-gray-900 dark:text-white">Rs. ${data.total.toLocaleString()}</span>
                                        </div>
                                        <div class="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div class="bg-indigo-500 h-full rounded-full" style="width: ${percent}%"></div>
                                        </div>
                                    </div>
                                </div>`;
                    }).join('')
                    : `<div class="text-center py-6 text-xs text-gray-400">No customer sales recorded.</div>`;
            })()}
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 bg-white dark:bg-darkCard rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-darkBorder flex flex-col">
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h3 class="text-base lg:text-lg font-bold text-gray-900 dark:text-white">Top Selling Products</h3>
                        <p class="text-xs text-gray-400 mt-0.5">Most in-demand products</p>
                    </div>
                    <div class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                        <i class="fa-solid fa-box-open text-teal-600 dark:text-teal-400 text-sm"></i>
                    </div>
                </div>
                <div class="space-y-3 flex-1 flex flex-col justify-center">
                    ${(() => {
                const maxProductQty = safeTopProducts.length > 0 ? safeTopProducts[0][1].qty : 1;
                return safeTopProducts.length > 0
                    ? safeTopProducts.map(([prodId, data]) => {
                        const percent = Math.round((data.qty / maxProductQty) * 100);
                        return `
                                <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div class="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center font-bold text-teal-600 dark:text-teal-400 text-xs shrink-0">
                                        <i class="fa-solid fa-box text-xs"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex justify-between items-center mb-1">
                                            <p class="text-xs font-bold text-gray-800 dark:text-white truncate">${prodId}</p>
                                            <span class="text-xs font-extrabold text-gray-900 dark:text-white">${data.qty} pcs</span>
                                        </div>
                                        <div class="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                            <div class="bg-teal-500 h-full rounded-full" style="width: ${percent}%"></div>
                                        </div>
                                    </div>
                                </div>`;
                    }).join('')
                    : `<div class="text-center py-6 text-xs text-gray-400">No product sales recorded.</div>`;
            })()}
                </div>
            </div>
        </div>

        <h3 class="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-4 mt-8">Quick Actions</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onclick="document.querySelector('[data-target=pos-view]').click()" class="bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-darkBorder p-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-1 hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-plus text-lg"></i>
                </div>
                <span class="text-xs lg:text-sm font-bold text-gray-800 dark:text-white">New Sale</span>
                <span class="text-[10px] text-gray-400">Launch POS terminal</span>
            </button>
            <button onclick="document.querySelector('[data-target=products-view]').click(); setTimeout(() => openProductModal(), 100)" class="bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-darkBorder p-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-1 hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-box-open text-lg"></i>
                </div>
                <span class="text-xs lg:text-sm font-bold text-gray-800 dark:text-white">Add Product</span>
                <span class="text-[10px] text-gray-400">Add to inventory</span>
            </button>
            <button onclick="document.querySelector('[data-target=purchases-view]').click(); setTimeout(() => openPOModal(), 100)" class="bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-darkBorder p-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-1 hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-truck-fast text-lg"></i>
                </div>
                <span class="text-xs lg:text-sm font-bold text-gray-800 dark:text-white">Receive Stock</span>
                <span class="text-[10px] text-gray-400">Create purchase order</span>
            </button>
            <button onclick="document.querySelector('[data-target=quotes-view]').click(); setTimeout(() => openSalesDocModal('quote'), 100)" class="bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-gray-800/80 border border-gray-100 dark:border-darkBorder p-4 rounded-2xl flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-1 hover:shadow-md group">
                <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-file-invoice text-lg"></i>
                </div>
                <span class="text-xs lg:text-sm font-bold text-gray-800 dark:text-white">Create Quote</span>
                <span class="text-[10px] text-gray-400">Generate estimate</span>
            </button>
        </div>
        
        <div class="mt-auto pt-10 pb-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex flex-col items-center md:items-start gap-1">
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    &copy; ${new Date().getFullYear()} MobileMate POS. All rights reserved.
                </p>
                <a href="https://www.mobilemate.lk" target="_blank" class="text-[10px] font-bold text-primary hover:text-secondary transition-colors flex items-center gap-1.5">
                    <i class="fa-solid fa-globe text-[8px]"></i>
                    www.mobilemate.lk
                </a>
            </div>
            <p class="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Created by 
                <a href="http://www.infinitycreativeworks.wuaze.com" target="_blank" class="text-primary hover:underline transition-all flex items-center gap-1.5">
                    Infinity Creative Works 
                    <i class="fa-solid fa-external-link text-[8px]"></i>
                </a>
            </p>
        </div>
        `;
        dashboardView.innerHTML = html;

        // Fetch IP and start tasks
        detectLocalIP();
        startDashboardClock();
        renderRecentSales(dailySales);
        await renderDashboardCharts();
    } catch (err) {
        console.error('Dashboard load error:', err);
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView) {
            dashboardView.innerHTML = `<div class="p-4 text-center text-red-600">Error loading dashboard. See console for details.</div>`;
        }
    }
}

async function detectLocalIP() {
    try {
        const display = document.getElementById('local-ip-display');
        if (!display) return;

        // This endpoint needs to be added to server.js
        const response = await fetch('/get-ip').catch(() => null);
        if (response) {
            const data = await response.json();
            if (data.ip) display.textContent = data.ip;
        }
    } catch (e) { }
}

function showMobileSetupGuide() {
    const ip = document.getElementById('local-ip-display').textContent;
    const url = `http://${ip}:3000`;

    Swal.fire({
        title: '<span class="text-indigo-600 uppercase font-black italic tracking-tighter">Mobile Connectivity</span>',
        html: `
            <div class="space-y-6 py-4">
                <div class="flex justify-center">
                    <div class="p-4 bg-white rounded-3xl shadow-inner border-2 border-dashed border-gray-100">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}" 
                             alt="QR Code" class="w-44 h-44">
                    </div>
                </div>
                <div class="text-center space-y-2">
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Your Connection URL</p>
                    <p class="text-xl font-black text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 py-3 rounded-2xl select-all">${url}</p>
                </div>
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-left">
                    <h4 class="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Instructions</h4>
                    <ul class="text-[11px] text-gray-600 dark:text-gray-300 space-y-2 font-medium">
                        <li class="flex gap-2"><span>1.</span> <span>Connect phone to <b>Same Wi-Fi</b>.</span></li>
                        <li class="flex gap-2"><span>2.</span> <span>Scan QR or type the URL in mobile browser.</span></li>
                        <li class="flex gap-2"><span>3.</span> <span>Install as App using <b>"Add to Home Screen"</b>.</span></li>
                    </ul>
                </div>
            </div>
        `,
        footer: '<p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by MobileMate Intelligence</p>',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#4f46e5',
        width: '400px',
        customClass: {
            popup: 'rounded-[3rem] border-none shadow-2xl dark:bg-darkCard',
            title: 'text-2xl pt-8',
            confirmButton: 'rounded-2xl px-10 py-4 text-xs font-black uppercase tracking-widest mb-6'
        }
    });
}

function startDashboardClock() {
    if (dashboardClockInterval) clearInterval(dashboardClockInterval);

    const update = () => {
        const now = new Date();

        // Digital Update
        const timeEl = document.getElementById('dash-time-text');
        const dateEl = document.getElementById('dash-date-text');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }

        // Analog Update
        const hHand = document.getElementById('hour-h');
        const mHand = document.getElementById('min-h');
        const sHand = document.getElementById('sec-h');

        if (hHand && mHand && sHand) {
            const h = now.getHours();
            const m = now.getMinutes();
            const s = now.getSeconds();

            const hDeg = (h % 12) * 30 + m * 0.5;
            const mDeg = m * 6;
            const sDeg = s * 6;

            hHand.style.transform = `translateX(-50%) rotate(${hDeg}deg)`;
            mHand.style.transform = `translateX(-50%) rotate(${mDeg}deg)`;
            sHand.style.transform = `translateX(-50%) rotate(${sDeg}deg)`;
        }
    };

    update();
    dashboardClockInterval = setInterval(update, 1000);
}

function toggleClockMode(mode) {
    currentClockMode = mode;
    const digital = document.getElementById('dash-clock-digital');
    const analog = document.getElementById('dash-clock-analog');
    const btnDigital = document.getElementById('btn-mode-digital');
    const btnAnalog = document.getElementById('btn-mode-analog');

    if (!digital || !analog || !btnDigital || !btnAnalog) return;

    if (mode === 'digital') {
        digital.classList.remove('hidden');
        analog.classList.add('hidden');
        btnDigital.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnDigital.classList.remove('text-gray-400', 'hover:text-gray-600');
        btnAnalog.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btnAnalog.classList.add('text-gray-400', 'hover:text-gray-600');
    } else {
        digital.classList.add('hidden');
        analog.classList.remove('hidden');
        btnAnalog.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnAnalog.classList.remove('text-gray-400', 'hover:text-gray-600');
        btnDigital.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btnDigital.classList.add('text-gray-400', 'hover:text-gray-600');
    }
}

// Set dashboard period and reload data
function setDashboardPeriod(period) {
    window.dashboardPeriod = period;
    loadDashboard();
}

async function renderRecentSales(salesData) {
    const listEl = document.getElementById('recent-sales-list');
    if (!listEl) return;

    if (!salesData || salesData.length === 0) {
        listEl.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No sales today yet.</p>';
        return;
    }

    // Sort by newest first and take top 5
    const latest = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    let html = '';
    latest.forEach(sale => {
        const time = new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isWholesale = sale.type === 'wholesale';

        html += `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${isWholesale ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shrink-0">
                        <i class="fa-solid ${isWholesale ? 'fa-building' : 'fa-user'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-bold text-gray-900 dark:text-white">${getInvoiceDisplayNumber(sale)}</p>
                            <div class="hidden group-hover:flex items-center gap-1">
                                <button onclick="previewInvoice(${sale.id})" class="text-[10px] text-primary hover:underline font-bold">VIEW</button>
                                <span class="text-gray-300">|</span>
                                <button onclick="editSale(${sale.id})" class="text-[10px] text-amber-600 hover:underline font-bold">EDIT</button>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${time} &bull; ${sale.payment_type || 'Cash'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-gray-900 dark:text-white">Rs. ${parseFloat(sale.total).toLocaleString()}</p>
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${isWholesale ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}">${sale.type.toUpperCase()}</span>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

let salesChartInstance = null;
async function renderDashboardCharts() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9CA3AF' : '#6B7280';
    const gridColor = isDark ? '#374151' : '#E5E7EB';

    // Build real 7-day sales data
    const last7Days = [];
    const last7Labels = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Labels.push(dayNames[d.getDay()]);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    let realSales;
    try {
        realSales = await db.sales
            .filter(s => s.document_type !== 'quote' && last7Days.some(day => s.date.startsWith(day)))
            .toArray();
    } catch (e) {
        realSales = [];
    }

    const data = last7Days.map(day => {
        return realSales
            .filter(s => s.date.startsWith(day))
            .reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    });
    const labels = last7Labels;

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (Rs)',
                data: data,
                borderColor: '#4F46E5', // Primary color
                backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#4F46E5',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? '#1F2937' : '#ffffff',
                    titleColor: isDark ? '#F3F4F6' : '#111827',
                    bodyColor: isDark ? '#D1D5DB' : '#4B5563',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return 'Rs. ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false,
                    },
                    ticks: {
                        color: textColor,
                        callback: function (value) {
                            return 'Rs. ' + (value / 1000) + 'k';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        }
    });
}
