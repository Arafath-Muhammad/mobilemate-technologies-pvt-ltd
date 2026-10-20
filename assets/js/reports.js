// Reports & Analytics Logic

async function loadReports() {
    console.log("Loading Reports view...");
    const container = document.getElementById('reports-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    // Render the skeleton shell (header + containers)
    container.innerHTML = `
        <div class="space-y-6" id="reports-inner">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Business Performance Reports</h2>
                <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                    <input type="date" id="reports-start-date" value="${today}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    <span class="text-gray-300 font-black">/</span>
                    <input type="date" id="reports-end-date" value="${today}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                </div>
            </div>
            <div id="reports-body"></div>
        </div>
    `;

    const refreshReports = async () => {
        const startDate = document.getElementById('reports-start-date')?.value || '';
        const endDate = document.getElementById('reports-end-date')?.value || '';

        const products = await db.products.toArray();
        let sales = await db.sales.toArray();

        if (startDate && endDate) {
            sales = sales.filter(s => {
                const d = s.date.split('T')[0];
                return d >= startDate && d <= endDate;
            });
        }

        // Calculations
        const outOfStock = products.filter(p => (p.stock_qty || 0) <= 0);
        const lowStock = products.filter(p => (p.stock_qty || 0) > 0 && (p.stock_qty || 0) <= (p.min_stock || 5));

        let totalRevenue = 0;
        let totalCost = 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let productSalesMap = {};
        let productLastSaleMap = {};
        products.forEach(p => { productSalesMap[p.id] = { product: p, qty_sold: 0 }; });

        sales.forEach(sale => {
            if (sale.document_type === 'invoice') {
                totalRevenue += parseFloat(sale.total || 0);
                const saleDate = new Date(sale.date);
                (sale.items || []).forEach(item => {
                    totalCost += ((item.cost || 0) * item.qty);
                    if (item.product_id && productSalesMap[item.product_id]) {
                        productSalesMap[item.product_id].qty_sold += parseInt(item.qty || 0);
                        if (!productLastSaleMap[item.product_id] || saleDate > productLastSaleMap[item.product_id]) {
                            productLastSaleMap[item.product_id] = saleDate;
                        }
                    }
                });
            }
        });

        let allCommissions = await db.commissions.toArray();
        if (startDate && endDate) {
            allCommissions = allCommissions.filter(c => {
                const d = c.date.split('T')[0];
                return d >= startDate && d <= endDate;
            });
        }
        const totalCommissions = allCommissions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        totalRevenue = totalRevenue - totalCommissions;
        const totalProfit = totalRevenue - totalCost;

        const bestSellers = Object.values(productSalesMap)
            .filter(p => p.qty_sold > 0)
            .sort((a, b) => b.qty_sold - a.qty_sold)
            .slice(0, 10);

        const deadStock = products.filter(p => {
            if ((p.stock_qty || 0) <= 0) return false;
            const lastSale = productLastSaleMap[p.id];
            if (!lastSale) return true;
            return lastSale < thirtyDaysAgo;
        });

        document.getElementById('reports-body').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Profit Card -->
                <div class="bg-white dark:bg-darkCard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <i class="fa-solid fa-sack-dollar text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 font-medium">Total Estim. Profit</p>
                            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Rs. ${totalProfit.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 space-y-1">
                        <div class="flex justify-between"><span>Revenue:</span><span class="font-bold text-emerald-600">Rs. ${totalRevenue.toLocaleString()}</span></div>
                        <div class="flex justify-between"><span>Cost of Goods:</span><span class="font-bold text-red-500">Rs. ${totalCost.toLocaleString()}</span></div>
                    </div>
                </div>

                <!-- Out of Stock Card -->
                <div class="bg-white dark:bg-darkCard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <i class="fa-solid fa-box-archive text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 font-medium">Out of Stock</p>
                            <h3 class="text-2xl font-bold text-red-600">${outOfStock.length}</h3>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500">Products requiring immediate reordering.</p>
                </div>

                <!-- Low Stock Card -->
                <div class="bg-white dark:bg-darkCard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
                            <h3 class="text-2xl font-bold text-amber-600">${lowStock.length}</h3>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500">Products below defined minimum threshold.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Best Sellers -->
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex justify-between items-center">
                        <h4 class="font-bold text-primary flex items-center gap-2"><i class="fa-solid fa-arrow-trend-up"></i> Top 10 Best Sellers</h4>
                        <button onclick="exportAnalytics('Best Sellers', 'best-sellers-table')" class="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-print"></i> Print
                        </button>
                    </div>
                    <div class="p-0 overflow-auto max-h-80 custom-scrollbar">
                        <table id="best-sellers-table" class="w-full text-left text-sm border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 sticky top-0">
                                <tr><th class="p-3">Product</th><th class="p-3 text-center">Qty Sold</th></tr>
                            </thead>
                            <tbody>
                                ${bestSellers.length === 0 ? '<tr><td colspan="2" class="p-8 text-center text-gray-400">No sales data available.</td></tr>' :
                                    bestSellers.map(p => `
                                        <tr class="border-b border-gray-100 dark:border-gray-800">
                                            <td class="p-3 font-medium dark:text-white">${p.product.name}</td>
                                            <td class="p-3 text-center font-bold text-primary">${p.qty_sold}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Dead Stock -->
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex justify-between items-center">
                        <h4 class="font-bold text-red-600 flex items-center gap-2"><i class="fa-solid fa-skull"></i> Dead Stock (30+ Days)</h4>
                        <button onclick="exportAnalytics('Dead Stock', 'dead-stock-table')" class="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-print"></i> Print
                        </button>
                    </div>
                    <div class="p-0 overflow-auto max-h-80 custom-scrollbar">
                        <table id="dead-stock-table" class="w-full text-left text-sm border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 sticky top-0">
                                <tr><th class="p-3">Product</th><th class="p-3 text-center">Current Stock</th><th class="p-3 text-right">Last Sale</th></tr>
                            </thead>
                            <tbody>
                                ${deadStock.length === 0 ? '<tr><td colspan="3" class="p-8 text-center text-gray-400">No dead stock found.</td></tr>' :
                                    deadStock.map(p => {
                                        const ls = productLastSaleMap[p.id];
                                        const lsText = ls ? ls.toLocaleDateString() : 'Never';
                                        return `
                                        <tr class="border-b border-gray-100 dark:border-gray-800">
                                            <td class="p-3 font-medium dark:text-white">${p.name}</td>
                                            <td class="p-3 text-center font-bold text-red-500">${p.stock_qty}</td>
                                            <td class="p-3 text-right text-gray-500">${lsText}</td>
                                        </tr>
                                        `;
                                    }).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Out of Stock Detail -->
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex justify-between items-center">
                        <h4 class="font-bold text-red-600 flex items-center gap-2"><i class="fa-solid fa-circle-exclamation"></i> Out of Stock Items</h4>
                        <button onclick="exportAnalytics('Out of Stock', 'out-of-stock-table')" class="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-print"></i> Print
                        </button>
                    </div>
                    <div class="p-0 overflow-auto max-h-80 custom-scrollbar">
                        <table id="out-of-stock-table" class="w-full text-left text-sm border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 sticky top-0">
                                <tr><th class="p-3">Product</th><th class="p-3">SKU</th><th class="p-3 text-right">Vendor</th></tr>
                            </thead>
                            <tbody>
                                ${outOfStock.length === 0 ? '<tr><td colspan="3" class="p-8 text-center text-gray-400">All items are in stock.</td></tr>' :
                                    outOfStock.map(p => `
                                        <tr class="border-b border-gray-100 dark:border-gray-800">
                                            <td class="p-3 font-medium dark:text-white">${p.name}</td>
                                            <td class="p-3 font-mono text-xs">${p.sku}</td>
                                            <td class="p-3 text-right text-gray-500">${p.vendor || 'N/A'}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Low Stock Detail -->
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex justify-between items-center">
                        <h4 class="font-bold text-amber-600 flex items-center gap-2"><i class="fa-solid fa-bell"></i> Low Stock Items</h4>
                        <button onclick="exportAnalytics('Low Stock', 'low-stock-table')" class="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <i class="fa-solid fa-print"></i> Print
                        </button>
                    </div>
                    <div class="p-0 overflow-auto max-h-80 custom-scrollbar">
                        <table id="low-stock-table" class="w-full text-left text-sm border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 sticky top-0">
                                <tr><th class="p-3">Product</th><th class="p-3 text-center">Qty</th><th class="p-3 text-center">Min</th><th class="p-3 text-right">Action</th></tr>
                            </thead>
                            <tbody>
                                ${lowStock.length === 0 ? '<tr><td colspan="4" class="p-8 text-center text-gray-400">No low stock items.</td></tr>' :
                                    lowStock.map(p => `
                                        <tr class="border-b border-gray-100 dark:border-gray-800">
                                            <td class="p-3 font-medium dark:text-white">${p.name}</td>
                                            <td class="p-3 text-center font-bold text-red-500">${p.stock_qty}</td>
                                            <td class="p-3 text-center text-gray-400">${p.min_stock || 5}</td>
                                            <td class="p-3 text-right">
                                                <button onclick="document.querySelector('[data-target=\\'purchases-view\\']').click()" class="text-primary text-xs font-bold hover:underline">Reorder</button>
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    };

    document.getElementById('reports-start-date')?.addEventListener('change', refreshReports);
    document.getElementById('reports-end-date')?.addEventListener('change', refreshReports);

    await refreshReports();
}


async function exportAnalytics(title, tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const storeName = (await db.settings.get('store_name'))?.value || 'MobileMate POS';
    const storeAddress = (await db.settings.get('store_address'))?.value || '';
    const enabledStoreAddress = (await db.settings.get('enabled_store_address'))?.value !== false;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} Report</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                h1 { margin-bottom: 5px; color: #111; }
                p { margin: 0 0 20px 0; color: #666; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f8f8f8; padding: 12px; text-align: left; border-bottom: 2px solid #eee; font-size: 12px; text-transform: uppercase; }
                td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
                .footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; }
            </style>
        </head>
        <body>
            <h1>${storeName}</h1>
            ${enabledStoreAddress ? `<p>${storeAddress}</p>` : ''}
            <h2 style="text-transform: uppercase; letter-spacing: 1px; color: #4F46E5;">${title} Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <table>
                ${table.innerHTML}
            </table>
            <div class="footer">
                Powered by MobileMate POS System
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
}
