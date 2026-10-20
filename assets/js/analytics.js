/**
 * Sales & Analytics Dashboard
 * 
 * Provides real-time insights into business performance including total sales,
 * profit/loss analysis, AOV, and product-level performance.
 */

async function loadAnalytics() {
    console.log("Loading Analytics Dashboard...");
    const container = document.getElementById('analytics-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="flex flex-col gap-6 animate-fade-in pb-12">
            <!-- Header Section -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-darkCard p-6 lg:p-8 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
                        <i class="fa-solid fa-chart-line text-indigo-500"></i> Analytics Dashboard
                    </h2>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">Strategic performance metrics and sales intelligence</p>
                </div>
                
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <i class="fa-solid fa-calendar-day text-primary text-sm ml-2"></i>
                        <input type="date" id="analytics-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="analytics-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <button onclick="refreshAnalytics()" class="bg-primary hover:bg-slate-800 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-95 group" title="Refresh Data">
                        <i class="fa-solid fa-rotate group-hover:rotate-180 transition-transform duration-500"></i>
                    </button>
                    <button onclick="window.print()" class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 w-12 h-12 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700 transition-all hover:bg-white dark:hover:bg-gray-700 shadow-sm" title="Export PDF">
                        <i class="fa-solid fa-file-pdf"></i>
                    </button>
                </div>
            </div>

            <!-- KPI Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Gross Sales -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex flex-col gap-4">
                        <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                            <i class="fa-solid fa-coins text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Gross Sales</p>
                            <h3 id="stat-gross-sales" class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Rs. 0.00</h3>
                        </div>
                    </div>
                </div>

                <!-- Total Profit -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex flex-col gap-4">
                        <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
                            <i class="fa-solid fa-sack-dollar text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Net Profit (EBITDA)</p>
                            <h3 id="stat-net-profit" class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Rs. 0.00</h3>
                        </div>
                    </div>
                </div>

                <!-- Total Loss -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex flex-col gap-4">
                        <div class="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600">
                            <i class="fa-solid fa-arrow-down-wide-short text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Impact (Loss/Discounts)</p>
                            <h3 id="stat-total-loss" class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Rs. 0.00</h3>
                        </div>
                    </div>
                </div>

                <!-- AOV -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative z-10 flex flex-col gap-4">
                        <div class="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                            <i class="fa-solid fa-file-invoice-dollar text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Average Order Value</p>
                            <h3 id="stat-aov" class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Rs. 0.00</h3>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Analytics Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Sales Trend -->
                <div class="lg:col-span-2 bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 flex flex-col">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h4 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Revenue Trends</h4>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">Daily performance analysis for the selected period</p>
                        </div>
                    </div>
                    <div class="flex-1 min-h-[400px]">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5 flex flex-col">
                    <div class="mb-8">
                        <h4 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Market Composition</h4>
                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">Sales distribution across product categories</p>
                    </div>
                    <div class="flex-1 flex flex-col items-center justify-center">
                        <div class="w-full aspect-square max-w-[280px]">
                            <canvas id="category-chart"></canvas>
                        </div>
                        <div id="category-legend" class="w-full mt-8 grid grid-cols-1 gap-3">
                            <!-- Legend items go here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Section: Top Products & Tax -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Products -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h4 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Velocity Index</h4>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">Top flying items by revenue volume</p>
                        </div>
                    </div>
                    <div id="top-products-list" class="space-y-4">
                        <!-- Top products list -->
                    </div>
                </div>

                <!-- Tax & Expenses -->
                <div class="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-xl shadow-primary/5">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h4 class="text-xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Fiscals & Contributions</h4>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">Tax liability and operational overhead insights</p>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div class="flex items-center justify-between p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <i class="fa-solid fa-receipt text-xl"></i>
                                </div>
                                <span class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Total Tax Collected</span>
                            </div>
                            <span id="stat-tax-collected" class="text-xl font-black text-emerald-600 tracking-tighter">Rs. 0.00</span>
                        </div>
                        
                        <div class="flex items-center justify-between p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/20">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                                    <i class="fa-solid fa-wallet text-xl"></i>
                                </div>
                                <span class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">OpEx (Total Expenses)</span>
                            </div>
                            <span id="stat-total-expenses" class="text-xl font-black text-rose-600 tracking-tighter">Rs. 0.00</span>
                        </div>

                        <div class="pt-4">
                            <h5 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Expense Categories Mix</h5>
                            <div id="expense-mix" class="space-y-3">
                                <!-- Expense mix progress bars -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Attach listeners
    document.getElementById('analytics-start-date').addEventListener('change', refreshAnalytics);
    document.getElementById('analytics-end-date').addEventListener('change', refreshAnalytics);

    // Initial load
    refreshAnalytics();
}

let revenueChart = null;
let categoryChart = null;

async function refreshAnalytics() {
    const startDate = document.getElementById('analytics-start-date').value;
    const endDate = document.getElementById('analytics-end-date').value;

    if (!startDate || !endDate) return;

    console.log(`Refreshing Analytics for ${startDate} to ${endDate}`);
    
    // Fetch Data
    const startISO = startDate; // Simple date bound to include records on start day
    const endISO = endDate + 'T23:59:59';

    // 1. Fetch Sales Data
    const sales = await db.sales
        .where('date').between(startISO, endISO, true, true)
        .toArray();
    
    // Filter only revenue-generating records (exclude quotes and sales orders to match Sales Terminal)
    const invoices = sales.filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order');
    
    console.log(`Found ${sales.length} total sales records. ${invoices.length} are revenue-generating (invoices/etc).`);

    // 2. Fetch Expenses
    const expenses = await db.expenses
        .where('date').between(startISO, endISO, true, true)
        .toArray();
    
    const totalOpEx = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // 3. Fetch Returns
    const returns = await db.returns
        .where('date').between(startISO, endISO, true, true)
        .toArray();

    // 4. Fetch VAT rate from settings
    const vatSetting = await db.settings.get('vat_rate');
    const vatRate = (vatSetting ? parseFloat(vatSetting.value || vatSetting) : 15) / 100;

    // --- Core KPI Calculation ---
    let grossSales = 0;
    let totalCogs = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    const productPerformance = {};
    const categoryPerformance = {};

    // Map categories for performance tracking
    const allProductIds = [...new Set(invoices.flatMap(inv => (inv.items || []).map(i => i.product_id)).filter(id => id))];
    const productsCache = await db.products.where('id').anyOf(allProductIds).toArray();
    const prodToCat = {};
    productsCache.forEach(p => {
        prodToCat[p.id] = p.category || 'Uncategorized';
        // Also map by name as fallback for older records
        prodToCat[p.name] = p.category || 'Uncategorized';
    });

    invoices.forEach(inv => {
        const saleTotal = parseFloat(inv.total) || 0;
        grossSales += saleTotal;
        totalDiscounts += parseFloat(inv.discount || 0) || 0;
        
        // Tax Calculation (Reversed from total)
        const baseAmount = saleTotal / (1 + vatRate);
        const invTax = saleTotal - baseAmount;
        totalTax += invTax;

        // Process Items
        (inv.items || []).forEach(item => {
            const qty = parseFloat(item.qty || item.cart_qty) || 0;
            const price = parseFloat(item.price || item.cart_price) || 0;
            const cost = parseFloat(item.cost) || 0;
            
            totalCogs += (cost * qty);

            // Velocity Tracking
            const itemName = item.name || 'Unknown Product';
            if (!productPerformance[itemName]) {
                productPerformance[itemName] = { revenue: 0, qty: 0 };
            }
            productPerformance[itemName].revenue += (price * qty);
            productPerformance[itemName].qty += qty;

            // Category Tracking
            const cat = item.category || prodToCat[item.product_id] || prodToCat[item.name] || 'Uncategorized';
            if (!categoryPerformance[cat]) categoryPerformance[cat] = 0;
            categoryPerformance[cat] += (price * qty);
        });
    });

    // --- Returns Impact Calculation ---
    let totalReturnsLoss = 0;
    for (const ret of returns) {
        // Find price of the returned item
        if (ret.invoice_id) {
            const linkedSale = await db.sales.get(ret.invoice_id);
            if (linkedSale && linkedSale.items) {
                const item = linkedSale.items.find(i => i.name === ret.item_name || i.product_id === ret.product_id);
                if (item) {
                    const price = parseFloat(item.price || item.cart_price) || 0;
                    totalReturnsLoss += (price * (parseFloat(ret.qty) || 0));
                }
            }
        }
    }

    // --- Net Profit Calculation ---
    const netProfit = grossSales - totalCogs - totalOpEx;
    const totalImpactLoss = totalDiscounts + totalReturnsLoss;
    const aov = invoices.length > 0 ? grossSales / invoices.length : 0;

    // --- UI Update ---
    document.getElementById('stat-gross-sales').textContent = formatCurrency(grossSales);
    document.getElementById('stat-net-profit').textContent = formatCurrency(netProfit);
    document.getElementById('stat-net-profit').className = `text-2xl font-black tracking-tighter ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-500'}`;
    document.getElementById('stat-total-loss').textContent = formatCurrency(totalImpactLoss);
    document.getElementById('stat-aov').textContent = formatCurrency(aov);
    document.getElementById('stat-tax-collected').textContent = formatCurrency(totalTax);
    document.getElementById('stat-total-expenses').textContent = formatCurrency(totalOpEx);

    // --- Category Mix for Expenses ---
    const expenseMix = {};
    expenses.forEach(e => {
        const cat = e.category || 'General';
        expenseMix[cat] = (expenseMix[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    // --- Render Charts & Lists ---
    renderRevenueChart(invoices, startDate, endDate);
    renderCategoryChart(categoryPerformance);
    renderTopProducts(productPerformance);
    renderExpenseMix(expenseMix, totalOpEx);
}

function renderRevenueChart(invoices, start, end) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    // Group invoices by date
    const dailyData = {};
    const dateRange = [];
    let curr = new Date(start);
    const last = new Date(end);
    
    while (curr <= last) {
        const dStr = curr.toISOString().split('T')[0];
        dailyData[dStr] = 0;
        dateRange.push(dStr);
        curr.setDate(curr.getDate() + 1);
    }

    invoices.forEach(inv => {
        const dStr = inv.date.split('T')[0];
        if (dailyData.hasOwnProperty(dStr)) {
            dailyData[dStr] += parseFloat(inv.total) || 0;
        }
    });

    const labels = dateRange.map(d => {
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    });
    const values = dateRange.map(d => dailyData[d]);

    if (revenueChart) revenueChart.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = '#6366f1'; // Indigo-500

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                borderColor: accentColor,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: accentColor,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Rs. ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false },
                    ticks: { 
                        color: isDark ? '#94a3b8' : '#64748b',
                        font: { size: 10, weight: 'bold' },
                        callback: (v) => 'Rs. ' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: isDark ? '#94a3b8' : '#64748b',
                        font: { size: 10, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    const categories = Object.keys(data);
    const values = Object.values(data);

    if (categoryChart) categoryChart.destroy();

    const colors = [
        '#6366f1', // indigo
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // rose
        '#8b5cf6', // violet
        '#06b6d4', // cyan
        '#ec4899'  // pink
    ];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Render Custom Legend
    const legendEl = document.getElementById('category-legend');
    const total = values.reduce((a, b) => a + b, 0);
    
    legendEl.innerHTML = categories.map((cat, i) => {
        const percent = total > 0 ? ((data[cat] / total) * 100).toFixed(1) : 0;
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${colors[i % colors.length]}"></div>
                    <span class="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">${cat}</span>
                </div>
                <span class="text-xs font-black text-gray-900 dark:text-white">${percent}%</span>
            </div>
        `;
    }).join('');
}

function renderTopProducts(performance) {
    const listEl = document.getElementById('top-products-list');
    const sorted = Object.entries(performance)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5);

    if (sorted.length === 0) {
        listEl.innerHTML = '<p class="text-center py-8 text-gray-400 font-bold uppercase tracking-widest text-[10px]">No sales recorded</p>';
        return;
    }

    const maxRevenue = sorted[0][1].revenue;

    listEl.innerHTML = sorted.map(([name, data], i) => {
        const width = (data.revenue / maxRevenue) * 100;
        return `
            <div class="space-y-2">
                <div class="flex items-center justify-between font-black text-xs">
                    <div class="flex items-center gap-3 truncate">
                        <span class="text-gray-300 italic">0${i+1}</span>
                        <span class="text-gray-900 dark:text-white uppercase tracking-tight truncate">${name}</span>
                    </div>
                    <span class="text-primary italic">Rs. ${data.revenue.toLocaleString()}</span>
                </div>
                <div class="h-2 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full" style="width: ${width}%"></div>
                </div>
                <div class="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest">
                    <span>${data.qty} Units Sold</span>
                    <span>Contribution Peak: ${((data.revenue / maxRevenue) * 100).toFixed(0)}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderExpenseMix(expenseMix, total) {
    const listEl = document.getElementById('expense-mix');
    const categories = Object.keys(expenseMix).sort((a, b) => expenseMix[b] - expenseMix[a]);

    if (categories.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-[10px] italic">No expenses recorded for this period.</p>';
        return;
    }

    listEl.innerHTML = categories.map(cat => {
        const amount = expenseMix[cat];
        const percent = total > 0 ? (amount / total * 100).toFixed(0) : 0;
        return `
            <div class="space-y-1.5">
                <div class="flex justify-between text-[10px] font-black uppercase">
                    <span class="text-gray-500">${cat}</span>
                    <span class="text-gray-900 dark:text-white">Rs. ${amount.toLocaleString()}</span>
                </div>
                <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-rose-500 opacity-70" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}
