/* eslint-disable */
// Sales and Quotes logic

async function loadSales() {
    console.log("Loading Sales view...");
    const container = document.getElementById('sales-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-gray-100 dark:border-darkBorder flex flex-col h-full overflow-hidden">
            <div class="p-8 lg:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/20 dark:bg-darkBg/20 relative">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Sales Terminal</h2>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] opacity-70">Complete history of processed invoices and revenue</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-week text-primary text-sm ml-2"></i>
                        <input type="date" id="sales-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="sales-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative group">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors text-sm"></i>
                        <input type="text" id="sales-search" class="pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-transparent focus:border-primary/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/5 text-gray-900 dark:text-white w-full md:w-72 transition-all shadow-sm" placeholder="Ref ID, Customer Name...">
                    </div>
                </div>
            </div>
            <div id="sales-summary-container" class="px-8 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-darkBorder">
                <!-- Summary Stats will be injected here -->
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Doc Identity</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Timeline</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Customer Portfolio</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Classification</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-right">Revenue</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-center">Protocol</th>
                        </tr>
                    </thead>
                    <tbody id="sales-list" class="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

    const triggerSearch = () => {
        const query = document.getElementById('sales-search').value;
        const start = document.getElementById('sales-start-date').value;
        const end = document.getElementById('sales-end-date').value;
        renderSalesList(query, 'sales', start, end);
    };

    document.getElementById('sales-search').addEventListener('input', triggerSearch);
    document.getElementById('sales-start-date').addEventListener('change', triggerSearch);
    document.getElementById('sales-end-date').addEventListener('change', triggerSearch);

    renderSalesList('', 'sales', firstDay, lastDay);
}

async function loadSalesOrders() {
    console.log("Loading Sales Orders view...");
    const container = document.getElementById('sales-orders-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-gray-100 dark:border-darkBorder flex flex-col h-full overflow-hidden">
            <div class="p-8 lg:p-10 border-b border-gray-100 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/20 dark:bg-darkBg/20 relative">
                <div class="space-y-1">
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Back Orders</h2>
                    <p class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] opacity-70">Manage reserved stock and advance bookings</p>
                </div>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-purple-500 text-sm ml-2"></i>
                        <input type="date" id="so-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="so-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative group">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors text-sm"></i>
                        <input type="text" id="so-search" class="pl-12 pr-6 py-4 bg-white dark:bg-gray-800 border border-transparent focus:border-purple-500/30 rounded-2xl text-xs font-black focus:ring-4 focus:ring-purple-500/5 text-gray-900 dark:text-white w-full md:w-72 transition-all shadow-sm" placeholder="Ref ID, Customer Name...">
                    </div>
                    <button onclick="if(typeof openSalesDocModal === 'function') openSalesDocModal('sales_order'); else { preselectedDocType='sales_order'; document.querySelector('[data-target=pos-view]').click(); }" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center gap-3">
                        <i class="fa-solid fa-plus-circle text-lg"></i>
                        <span>New Order</span>
                    </button>
                </div>
            </div>
            <div id="so-summary-container" class="px-8 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-darkBorder">
                <!-- Summary Stats will be injected here -->
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[1000px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Order ID</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Timestamp</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Stakeholder</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Fulfillment</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-right">Valuation</th>
                            <th class="p-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody id="so-list" class="divide-y divide-gray-50 dark:divide-gray-800/40 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

    const triggerSearch = () => {
        const query = document.getElementById('so-search').value;
        const start = document.getElementById('so-start-date').value;
        const end = document.getElementById('so-end-date').value;
        renderSalesList(query, 'sales_orders', start, end);
    };

    document.getElementById('so-search').addEventListener('input', triggerSearch);
    document.getElementById('so-start-date').addEventListener('change', triggerSearch);
    document.getElementById('so-end-date').addEventListener('change', triggerSearch);

    renderSalesList('', 'sales_orders', firstDay, lastDay);
}

async function renderSalesList(query = '', type = 'sales', startDate = null, endDate = null) {
    let listId = 'sales-list';
    if (type === 'quotes') listId = 'quotes-list';
    else if (type === 'sales_orders') listId = 'so-list';

    const tbody = document.getElementById(listId);
    if (!tbody) return;

    // Loading state
    tbody.innerHTML = `<tr><td colspan="6" class="p-12 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-primary opacity-40"></i></td></tr>`;

    let sales = [];

    // Determine user role and restrictions
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || (currentUser.permissions && currentUser.permissions.includes('all')));

    try {
        // Build base collection
        let collection = db.sales.orderBy('id').reverse();

        // Filter by date first if provided
        if (startDate && endDate) {
            // Dexie between is inclusive. Dates are ISO strings in DB
            const startISO = startDate; // Use simple date string to include day-of records
            const endISO = endDate + 'T23:59:59';
            collection = db.sales.where('date').between(startISO, endISO, true, true).reverse();
        }

        sales = await collection.toArray();
    } catch (err) {
        console.error("Dexie Query Error:", err);
        sales = await db.sales.orderBy('id').reverse().limit(500).toArray();
    }

    // Filter by type
    if (type === 'sales') {
        sales = sales.filter(s => s.document_type !== 'quote' && s.document_type !== 'sales_order');
    } else if (type === 'quotes') {
        sales = sales.filter(s => s.document_type === 'quote');
    } else if (type === 'sales_orders') {
        sales = sales.filter(s => s.document_type === 'sales_order');
    }

    // ROLE-BASED ACCESS CONTROL
    // Also include records without rep_name (legacy records created before this field existed)
    if (!isAdmin) {
        sales = sales.filter(s => !s.rep_name || s.rep_name === currentUser.username);
    }

    if (query) {
        const q = query.toLowerCase();
        sales = sales.filter(s => {
            const idStr = String(s.id).toLowerCase();
            const invStr = getInvoiceDisplayNumber(s).toLowerCase();
            const soStr = `so-${s.id}`.toLowerCase();
            const qteStr = `qte-${s.id}`.toLowerCase();

            return idStr.includes(q) ||
                invStr.includes(q) ||
                soStr.includes(q) ||
                qteStr.includes(q) ||
                (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
                (s.order_id && String(s.order_id).toLowerCase().includes(q))
        });
    }

    if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500"><i class="fa-solid fa-receipt text-4xl mb-3 block opacity-20"></i> No ${type} records found.</td></tr>`;
        return;
    }

    let html = '';
    for (const s of sales) {
        const dateObj = new Date(s.date);
        const time = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const fullTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let docColor = 'blue';
        if (s.document_type === 'quote') { docColor = 'amber'; }
        else if (s.document_type === 'sales_order') { docColor = 'purple'; }
        else if (s.document_type === 'delivery_note') { docColor = 'slate'; }

        const isPaid = (s.status === 'paid') || ((parseFloat(s.paid_amount) || 0) >= (parseFloat(s.total) || 0) - 0.01 && (parseFloat(s.total) || 0) > 0);
        const isCredit = ['credit', 'cod'].includes(String(s.payment_type || s.payment_terms || '').toLowerCase().trim()) || (parseInt(s.credit_days) > 0);
        
        let paymentBadge = '';
        if (s.document_type !== 'quote' && s.document_type !== 'sales_order' && s.document_type !== 'delivery_note') {
            if (isPaid) {
                paymentBadge = `<span class="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 ml-1.5"><i class="fa-solid fa-circle-check mr-1"></i>PAID</span>`;
            } else if (isCredit) {
                paymentBadge = `<span class="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800 ml-1.5"><i class="fa-solid fa-clock mr-1"></i>CREDIT</span>`;
            }
        }

        const docBadge = `<span class="bg-${docColor}-50 text-${docColor}-600 dark:bg-${docColor}-900/30 dark:text-${docColor}-400 text-[10px] px-3 py-1 rounded-full font-black uppercase border border-${docColor}-100/50 dark:border-${docColor}-900/50 tracking-widest">${(s.document_type || 'invoice').replace('_', ' ')}</span>`;

        const typeBadge = s.type === 'wholesale' ?
            '<span class="text-[9px] text-gray-400 uppercase font-black tracking-widest italic opacity-60">Wholesale</span>' :
            '<span class="text-[9px] text-gray-400 uppercase font-black tracking-widest italic opacity-60">Retail Sale</span>';

        const validityTag = s.document_type === 'quote' ?
            `<div class="flex flex-col"><span class="text-[10px] font-black text-amber-600 uppercase tracking-tight">${s.validity || '7'} Days Validity</span><span class="text-[9px] text-gray-400 font-bold uppercase opacity-50">Expires Soon</span></div>` :
            `<div class="flex items-center flex-wrap gap-1">${docBadge}${paymentBadge}</div>`;

        // Actions
        let actionIcons = '';
        if (s.document_type === 'quote' || s.document_type === 'sales_order') {
            const isSO = s.document_type === 'sales_order';
            let availability = { status: 'available', missing: [] };

            if (isSO) {
                availability = await checkOrderAvailability(s);
            }

            let statusBadge = '';
            if (isSO) {
                if (availability.status === 'available') statusBadge = '<span class="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded ml-2 uppercase tracking-widest"><i class="fa-solid fa-circle-check mr-1"></i> Ready</span>';
                else if (availability.status === 'partial') statusBadge = '<span class="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded ml-2 uppercase tracking-widest"><i class="fa-solid fa-clock-rotate-left mr-1"></i> Partial</span>';
                else statusBadge = '<span class="text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded ml-2 uppercase tracking-widest"><i class="fa-solid fa-box-open mr-1"></i> Awaiting GRN</span>';
            }

            actionIcons += `
                <button onclick="convertToInvoice(${s.id})" class="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Finalize to Invoice">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                </button>
            `;

            if (s.document_type === 'quote') {
                actionIcons += `
                    <button onclick="convertQuoteToPO(${s.id})" class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Convert to Purchase Order">
                        <i class="fa-solid fa-cart-shopping"></i>
                    </button>
                `;
            }

            s.status_badge_extra = statusBadge; // Store for use in HTML
        }

        actionIcons += `
            <button onclick="sendWhatsAppInvoice(${s.id})" class="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="WhatsApp Customer">
                <i class="fa-brands fa-whatsapp"></i>
            </button>
            <button onclick="printInvoice(${s.id}, null, true, true)" class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Detailed View">
                <i class="fa-solid fa-eye"></i>
            </button>
            <button onclick="editSale(${s.id})" class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Edit">
                <i class="fa-solid fa-file-pen"></i>
            </button>
            ${type !== 'quotes' ? `
            <button onclick="printInvoice(${s.id}, null, true, true, false, null, 'delivery_note')" class="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900/20 text-slate-600 hover:bg-slate-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Print Delivery Note">
                <i class="fa-solid fa-truck-ramp-box"></i>
            </button>` : ''}
            <button onclick="printInvoice(${s.id}, null, false, true)" class="w-10 h-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Generate Printout">
                <i class="fa-solid fa-print"></i>
            </button>
            ${(type === 'sales' && (isPaid || (parseFloat(s.paid_amount) || 0) > 0 || s.status === 'paid' || s.status === 'partial')) ? `
            <button onclick="unreceiveInvoice(${s.id})" class="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Unreceive Invoice (Reverse Received Payment)">
                <i class="fa-solid fa-rotate-left"></i>
            </button>` : ''}
            <button onclick="deleteSale(${s.id}, '${type}')" class="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm group-hover:shadow-md" title="Remove Record">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        html += `
            <tr class="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-all group">
                <td class="p-6">
                    <div class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">${getInvoiceDisplayNumber(s)}</div>
                    ${s.tracking_number ? `<div class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1"><i class="fa-solid fa-truck"></i> ${s.tracking_number}</div>` : ''}
                    ${typeBadge}
                </td>
                <td class="p-6">
                    <div class="text-[11px] font-black text-gray-900 dark:text-white uppercase">${time}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase opacity-50">${fullTime}</div>
                </td>
                <td class="p-6">
                    <div class="text-xs font-black text-gray-800 dark:text-white uppercase italic tracking-tight">${s.customer_name || 'Walk-in Client'}</div>
                    <div class="text-[9px] text-primary font-bold uppercase tracking-widest opacity-60">Verified Origin</div>
                </td>
                <td class="p-6">${validityTag}${s.status_badge_extra || ''}</td>
                <td class="p-6 text-right">
                    <div class="text-sm font-black text-primary italic tracking-tight">Rs. ${parseFloat(s.total || 0).toLocaleString()}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase opacity-50">Net Valuation</div>
                </td>
                <td class="p-6">
                    <div class="flex items-center justify-center gap-2">
                        ${actionIcons}
                    </div>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;

    // Render Summary Section
    renderRealTimeSalesSummary(sales, type);
}

/**
 * Renders a real-time summary of the filtered sales records
 */
function renderRealTimeSalesSummary(data, type) {
    let summaryId = 'sales-summary-container';
    if (type === 'sales_orders') summaryId = 'so-summary-container';
    else if (type === 'quotes') summaryId = 'quotes-summary-container';

    const container = document.getElementById(summaryId);
    if (!container) return;

    const count = data.length;
    const totalVal = data.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalDiscount = data.reduce((sum, s) => sum + (parseFloat(s.discount) || 0), 0);

    // For profit, we need to check if costs were recorded
    let totalProfit = 0;
    let hasProfitData = false;
    data.forEach(s => {
        if (s.items) {
            s.items.forEach(item => {
                const cost = parseFloat(item.cost || 0);
                const price = parseFloat(item.price || 0);
                const qty = parseFloat(item.qty || 0);
                if (cost > 0) {
                    totalProfit += (price - cost) * qty;
                    hasProfitData = true;
                }
            });
        }
    });

    // Special stats for Sales Orders
    let readyCount = 0;
    let partialCount = 0;
    let awaitingCount = 0;

    if (type === 'sales_orders') {
        // Note: We can't easily check availability here for all without making it slow
        // But if the list is small, we could. For now, let's just show basic stats.
    }

    let colorClass = 'primary';
    let icon = 'fa-file-invoice-dollar';
    let label = 'Sales';
    if (type === 'sales_orders') { colorClass = 'purple-600'; icon = 'fa-file-signature'; label = 'Orders'; }
    else if (type === 'quotes') { colorClass = 'amber-500'; icon = 'fa-file-lines'; label = 'Quotes'; }

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex flex-col">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total ${label}</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <span class="text-lg font-black text-gray-900 dark:text-white tracking-tighter">${count}</span>
                </div>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross Valuation</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 text-xs">
                        <i class="fa-solid fa-sack-dollar"></i>
                    </div>
                    <span class="text-lg font-black text-emerald-600 tracking-tighter">Rs. ${totalVal.toLocaleString()}</span>
                </div>
            </div>
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Savings/Disc</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 text-xs">
                        <i class="fa-solid fa-tags"></i>
                    </div>
                    <span class="text-lg font-black text-amber-600 tracking-tighter">Rs. ${totalDiscount.toLocaleString()}</span>
                </div>
            </div>
            ${hasProfitData ? `
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Est. Net Profit</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 text-xs">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <span class="text-lg font-black text-indigo-600 tracking-tighter">Rs. ${totalProfit.toLocaleString()}</span>
                </div>
            </div>
            ` : `
            <div class="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-4">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Average Ticket</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 text-xs">
                        <i class="fa-solid fa-receipt"></i>
                    </div>
                    <span class="text-lg font-black text-sky-600 tracking-tighter">Rs. ${(count > 0 ? (totalVal / count) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            </div>
            `}
        </div>
    `;
}

async function deleteSale(id, type = 'sales') {
    const sale = await db.sales.get(id);
    if (!sale) return;

    // ROLE-BASED ACCESS CONTROL: Only owner or admin/manager can delete
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
    const isOwner = sale.rep_name === currentUser.username;

    if (!isAdmin && !isOwner) {
        showAlert('Access Denied', 'Permanent deletion of protocol records is restricted to owners and executives.', 'error');
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Delete protocol?',
        text: 'This action will permanently erase the document and reverse all accounting/inventory impacts.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, Terminate',
        cancelButtonText: 'Abort'
    });

    if (!isConfirmed) return;

    try {
        window.isManualAction = true;
        await db.transaction('rw', db.sales, db.ledger, db.products, db.customers, async () => {
            // Reverse Stock if it was an invoice or sales_order
            if (sale.document_type === 'invoice' || sale.document_type === 'sales_order') {
                for (let item of (sale.items || [])) {
                    if (!item.product_id) continue;
                    const p = await db.products.get(item.product_id);
                    if (p) {
                        await db.products.update(item.product_id, {
                            stock_qty: p.stock_qty + item.qty
                        });
                    }
                }

                // Reverse Customer Balance for credit and COD sales
                // Both payment types create a receivable entry that must be reversed on deletion
                if (['credit', 'cod'].includes(sale.payment_type) && sale.customer_id) {
                    const customer = await db.customers.get(sale.customer_id);
                    if (customer) {
                        await db.customers.update(sale.customer_id, {
                            current_balance: (customer.current_balance || 0) - sale.total
                        });
                    }
                }
            }

            await db.sales.delete(id);
            await db.ledger.where({ reference_id: id, reference_type: 'Sale' }).delete();
        });

        showAlert('Erased', 'Document and linked ledger entries destroyed.', 'success');

        // Refresh Current View
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn) activeBtn.click();
    } catch (err) {
        showAlert('Protocol Error', 'Failed to erase document: ' + err.message, 'error');
    } finally {
        window.isManualAction = false;
    }
}

/**
 * Reverses a received invoice back to UNPAID status.
 * Reverses any linked payments, restores customer balance due, removes ledger/bank entries.
 */
async function unreceiveInvoice(saleId) {
    if (!saleId) return;
    const sale = await db.sales.get(parseInt(saleId));
    if (!sale) {
        return showAlert('Error', 'Invoice not found in records.', 'error');
    }

    const invRef = getInvoiceDisplayNumber(sale);

    // Get customer info
    let customerName = 'Walk-in Customer';
    let customer = null;
    if (sale.customer_id) {
        customer = await db.customers.get(sale.customer_id);
        if (customer) customerName = customer.name;
    } else if (sale.customer_name) {
        customerName = sale.customer_name;
    }

    // Find all linked payments in db.payments
    const allPayments = (await db.payments.toArray()) || [];
    const linkedPayments = allPayments.filter(p => {
        if (p.target_type === 'invoice' && Number(p.target_id) === Number(sale.id)) return true;
        if (p.target_type === 'customer' && Number(p.invoice_id) === Number(sale.id)) return true;
        return false;
    });

    const totalFromPayments = linkedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const paidAmount = parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) || 0;
    const effectivePaid = Math.max(paidAmount, totalFromPayments);
    const total = parseFloat(sale.total) || 0;

    const isAlreadyUnpaid = (sale.status === 'unpaid') && effectivePaid <= 0.01;
    if (isAlreadyUnpaid) {
        return showAlert('Notice', `Invoice ${invRef} is already UNPAID and has no received payments.`, 'info');
    }

    const reverseAmount = effectivePaid > 0 ? effectivePaid : total;

    // Confirm dialog
    const confirmResult = await Swal.fire({
        title: `Unreceive Invoice ${invRef}?`,
        html: `
            <div class="text-left text-sm space-y-3">
                <div class="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs">
                    <p class="font-black flex items-center gap-1.5 mb-1">
                        <i class="fa-solid fa-rotate-left text-rose-600"></i> Reverse Mistakenly Received Invoice
                    </p>
                    <p>Are you sure you want to unreceive this invoice? This will reset the invoice status to <b>UNPAID</b>, void recorded payments, and add <b>Rs. ${reverseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b> back to the customer's balance due.</p>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs">
                    <div class="flex justify-between"><span class="text-gray-500">Invoice:</span><span class="font-black">${invRef}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Customer:</span><span class="font-bold">${customerName}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Total Valuation:</span><span class="font-bold">Rs. ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Amount to Reverse:</span><span class="font-black text-rose-600">Rs. ${reverseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    ${linkedPayments.length > 0 ? `<div class="flex justify-between"><span class="text-gray-500">Payments Linked:</span><span class="font-mono font-bold">${linkedPayments.length} payment(s)</span></div>` : ''}
                </div>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fa-solid fa-rotate-left mr-1.5"></i> Yes, Unreceive / Reverse',
        cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    try {
        window.isManualAction = true;
        await db.transaction('rw', [db.sales, db.customers, db.payments, db.ledger, db.bank_accounts, db.bank_transactions, db.activity_log], async () => {
            // 1. Restore Customer Balance
            if (sale.customer_id) {
                const cust = await db.customers.get(sale.customer_id);
                if (cust) {
                    const newBal = (parseFloat(cust.current_balance) || 0) + reverseAmount;
                    await db.customers.update(sale.customer_id, {
                        current_balance: newBal
                    });
                }
            }

            // 2. Void & Reverse linked payments
            for (const p of linkedPayments) {
                // Bank transactions reversal
                const refQueryStr = `Payment Receipt #${p.id}`;
                const matchTransactions = await db.bank_transactions.filter(t => 
                    t.reference === refQueryStr || 
                    t.reference === `Invoice #${sale.id}` || 
                    t.reference === invRef
                ).toArray();

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

                // Delete related ledger entries for this receipt
                await db.ledger.where({ reference_id: p.id }).delete();

                // Delete payment entry
                await db.payments.delete(p.id);
            }

            // Also clean up any orphan ledger entries directly referencing this invoice receipt
            const orphanLedgers = await db.ledger.filter(l => 
                l.reference_type === 'Receipt' && 
                l.description && (l.description.includes(invRef) || l.description.includes(`Invoice #${sale.id}`))
            ).toArray();
            for (const ol of orphanLedgers) {
                await db.ledger.delete(ol.id);
            }

            // 3. Reset Sale Record to UNPAID credit status
            await db.sales.update(sale.id, {
                status: 'unpaid',
                paid_amount: 0,
                amount_paid: 0,
                payment_type: 'credit',
                payment_terms: 'credit',
                payment_method: 'credit',
                settlement_payment_method: null,
                settlement_date: null,
                settlement_details: null,
                paid_date: null,
                cheque_number: null,
                cheque_no: null,
                cheque_date: null,
                cheque_bank: null,
                bank_name: null,
                bank_reference: null,
                bank_ref: null,
                koko_reference: null,
                koko_ref: null
            });

            // 4. Activity Log
            if (typeof logActivity === 'function') {
                await logActivity(`Unreceived Invoice ${invRef}: Reversed Rs. ${reverseAmount} back to credit`);
            }
        });

        showAlert('Invoice Unreceived', `Invoice ${invRef} has been reversed to UNPAID. Rs. ${reverseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been restored to customer balance.`, 'success');

        // Refresh active views
        if (typeof renderSalesList === 'function' && document.getElementById('sales-list')) {
            const start = document.getElementById('sales-start-date')?.value;
            const end = document.getElementById('sales-end-date')?.value;
            const q = document.getElementById('sales-search')?.value || '';
            renderSalesList(q, 'sales', start, end);
        }
        if (typeof loadFinance === 'function' && document.getElementById('finance-view') && !document.getElementById('finance-view').classList.contains('hidden')) {
            loadFinance();
        }
        if (typeof loadPayments === 'function' && document.getElementById('payments-view') && !document.getElementById('payments-view').classList.contains('hidden')) {
            loadPayments();
        }
        if (typeof loadOutstanding === 'function' && document.getElementById('outstanding-view') && !document.getElementById('outstanding-view').classList.contains('hidden')) {
            loadOutstanding();
        }
        if (typeof loadCustomers === 'function' && document.getElementById('customers-view') && !document.getElementById('customers-view').classList.contains('hidden')) {
            loadCustomers();
        }
        if (sale.customer_id && typeof viewCustomerProfile === 'function') {
            const custModal = document.getElementById('customer-modal');
            if (custModal && !custModal.classList.contains('hidden')) {
                viewCustomerProfile(sale.customer_id);
            }
        }
    } catch (err) {
        console.error('Failed to unreceive invoice:', err);
        showAlert('Error', 'Failed to unreceive invoice: ' + err.message, 'error');
    } finally {
        window.isManualAction = false;
    }
}
window.unreceiveInvoice = unreceiveInvoice;

async function openUnreceiveInvoiceModal() {
    const allSales = await db.sales.orderBy('id').reverse().toArray();
    const paidSales = allSales.filter(s => 
        ['invoice', 'pos_invoice', 'sale'].includes(s.document_type || 'invoice') &&
        (s.status === 'paid' || (parseFloat(s.paid_amount) || 0) > 0)
    ).slice(0, 50);

    const customers = await db.customers.toArray();
    const custMap = new Map();
    customers.forEach(c => custMap.set(c.id, c.name));

    const optionsHtml = paidSales.map(s => {
        const custName = s.customer_id ? (custMap.get(s.customer_id) || s.customer_name || 'Customer') : (s.customer_name || 'Walk-in');
        const invNum = getInvoiceDisplayNumber(s);
        const dateStr = s.date ? new Date(s.date).toLocaleDateString() : '';
        const totalStr = parseFloat(s.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
        return `<option value="${s.id}">${invNum} - ${custName} (Rs. ${totalStr}) [${dateStr}]</option>`;
    }).join('');

    const { value: selectedId, isConfirmed } = await Swal.fire({
        title: 'Unreceive / Reverse Invoice',
        html: `
            <div class="text-left space-y-4 text-sm">
                <p class="text-xs text-gray-500">Select an invoice that was mistakenly marked as received/paid. This will restore the customer balance and mark the invoice as <b>UNPAID</b>.</p>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Received Invoice</label>
                    <select id="swal-unreceive-select" class="swal2-input w-full m-0 text-xs font-bold">
                        <option value="">-- Choose an Invoice to Unreceive --</option>
                        ${optionsHtml}
                    </select>
                </div>
                <div class="relative flex py-1 items-center">
                    <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span class="flex-shrink mx-3 text-gray-400 text-[10px] font-black uppercase">Or enter Invoice Number</span>
                    <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div>
                    <input type="text" id="swal-unreceive-input" class="swal2-input w-full m-0 text-sm font-bold" placeholder="e.g. INV-M0005 or 5">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="fa-solid fa-rotate-left mr-1.5"></i> Proceed to Unreceive',
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            const selectVal = document.getElementById('swal-unreceive-select')?.value;
            const inputVal = document.getElementById('swal-unreceive-input')?.value?.trim();

            if (selectVal) {
                return parseInt(selectVal);
            }
            if (inputVal) {
                let found = allSales.find(s => s.invoice_number && s.invoice_number.trim().toUpperCase() === inputVal.toUpperCase());
                if (!found) {
                    found = allSales.find(s => getInvoiceDisplayNumber(s).toUpperCase() === inputVal.toUpperCase());
                }
                if (!found && /^\d+$/.test(inputVal)) {
                    found = allSales.find(s => s.id === parseInt(inputVal));
                }
                if (!found) {
                    Swal.showValidationMessage(`Invoice "${inputVal}" not found. Please check the reference number.`);
                    return false;
                }
                return found.id;
            }
            Swal.showValidationMessage('Please select an invoice or enter an invoice reference number.');
            return false;
        }
    });

    if (isConfirmed && selectedId) {
        await unreceiveInvoice(selectedId);
    }
}
window.openUnreceiveInvoiceModal = openUnreceiveInvoiceModal;

async function editSale(id, forcePOS = false) {
    const sale = await db.sales.get(id);
    if (!sale) return;

    // ROLE-BASED ACCESS CONTROL: Only owner or admin/manager can edit
    // RELAXED FOR QUOTES: Allow anyone with permission to edit quotes/orders
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager' || (currentUser.permissions && currentUser.permissions.includes('all')));
    const isOwner = sale.rep_name === currentUser.username;
    const isQuoteOrOrder = sale.document_type === 'quote' || sale.document_type === 'sales_order';

    if (!isAdmin && !isOwner && !isQuoteOrOrder) {
        showAlert('Access Denied', 'You are only authorized to modify documents that you personally initiated.', 'error');
        return;
    }

    if (sale.document_type === 'quote' || sale.document_type === 'sales_order') {
        if (typeof openSalesDocModal === 'function') {
            openSalesDocModal(sale.document_type, id);
        } else {
            showAlert('Error', 'Sales Document module not loaded properly.', 'error');
        }
    } else {
        if (!forcePOS) {
            // Open preview first as requested by user
            printInvoice(id, null, true, true);
            return;
        }
        editingSaleId = id;
        const posNavBtn = document.querySelector('[data-target="pos-view"]');
        if (posNavBtn) {
            posNavBtn.click();
        }
    }
}

async function shareViaOutlook(id, htmlContent = null) {
    const sale = await db.sales.get(id);
    if (!sale) return;

    // Fallback if HTML is not provided directly (rare if called from Preview)
    if (!htmlContent && typeof getInvoiceHtmlForPdf === 'function') {
        showAlert('Preparing...', 'Fetching document layout...', 'info');
        htmlContent = await getInvoiceHtmlForPdf(id, sale.printer_layout || 'professional');
    }

    const docNo = getInvoiceDisplayNumber(sale);
    const type = (sale.document_type || 'Invoice').toUpperCase();

    if (typeof shareDocumentViaOutlook === 'function') {
        shareDocumentViaOutlook(type, docNo, sale.customer_name, sale.total, sale.items, htmlContent);
    }
}

async function checkOrderAvailability(doc) {
    let status = 'available';
    let missingItems = [];

    for (const item of (doc.items || [])) {
        if (item.is_custom || !item.product_id) continue;
        const p = await db.products.get(item.product_id);
        if (!p || p.stock_qty < item.qty) {
            status = 'partial';
            missingItems.push({ name: item.name, current: p ? p.stock_qty : 0, required: item.qty });
        }
    }

    if (missingItems.length === (doc.items || []).filter(i => !i.is_custom).length && missingItems.length > 0) status = 'unavailable';

    return { status, missingItems };
}

async function convertToInvoice(id) {
    const doc = await db.sales.get(id);
    if (!doc) return;

    const availability = await checkOrderAvailability(doc);

    if (availability.status !== 'available') {
        const missingList = availability.missingItems.map(i => `<div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-1"><span class="text-xs font-bold text-gray-700 dark:text-gray-200">${i.name}</span> <span class="text-[10px] font-black text-red-600 bg-red-100 px-2 py-1 rounded">Need ${i.required} | Have ${i.current}</span></div>`).join('');
        return Swal.fire({
            title: 'Inventory Insufficient',
            html: `<p class="text-sm text-gray-500 mb-4 text-left">The following items are missing from your current stock. Please process a GRN to restock before converting this order.</p><div class="max-h-[200px] overflow-y-auto no-scrollbar">${missingList}</div>`,
            icon: 'error',
            confirmButtonColor: '#4F46E5',
            confirmButtonText: 'Understood'
        });
    } else {
        const confirmResult = await Swal.fire({
            title: 'Confirm Conversion',
            text: "Convert this document to an Invoice? This will deduct the items from stock and finalize the record.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5',
            confirmButtonText: 'Yes, Convert'
        });
        if (!confirmResult.isConfirmed) return;
    }

    try {
        await db.transaction('rw', db.sales, db.products, db.ledger, db.accounts, async () => {
            const updatedItems = [];
            const isFromSO = doc.document_type === 'sales_order';

            for (let item of doc.items) {
                if (item.is_custom || !item.product_id) {
                    updatedItems.push(item);
                    continue;
                }

                const p = await db.products.get(item.product_id);
                if (p) {
                    let selectedSerials = [];
                    const needsSerials = p.warranty && p.warranty !== 'No Warranty' && p.serial_list && p.serial_list.length > 0;

                    if (needsSerials) {
                        selectedSerials = p.serial_list.slice(0, Math.min(item.qty, p.serial_list.length));
                        const remainingSerials = (p.serial_list || []).filter(sn => !selectedSerials.includes(sn));

                        // If it's from SO, we ALREADY deducted quantity, so just update serials
                        // If it's from Quote, we need to deduct quantity AND update serials
                        await db.products.update(item.product_id, {
                            stock_qty: isFromSO ? p.stock_qty : (p.stock_qty - item.qty),
                            serial_list: remainingSerials
                        });
                        item.serial = selectedSerials.join(', ');
                    } else if (!isFromSO) {
                        // For non-serial items coming from Quote, deduct quantity
                        await db.products.update(item.product_id, {
                            stock_qty: p.stock_qty - item.qty
                        });
                    }
                }
                if (!item.total) item.total = (parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0);
                // Ensure warranty field is present
                if (!item.warranty) item.warranty = 'N/A';
                updatedItems.push(item);
            }

            // Update record
            await db.sales.update(id, {
                document_type: 'invoice',
                status: (doc.payment_type === 'credit' || doc.payment_type === 'cod') ? 'unpaid' : 'completed',
                paid_amount: (doc.payment_type === 'credit' || doc.payment_type === 'cod') ? 0 : doc.total,
                items: updatedItems,
                timestamp: new Date().getTime(),
                invoice_number: await getNextInvoiceNumber('invoice')
            });

            // Handle accounting
            if (typeof recordTransaction === 'function') {
                const accounts = await db.accounts.toArray();
                const getAccId = (code) => accounts.find(a => a.code === code)?.id;

                // Credit Revenue (4000)
                await recordTransaction(getAccId('4000'), doc.total, 'credit', `Invoice #${id} from ${doc.document_type} conversion`, 'Sale', id);

                // Debit Asset (1000 for Cash, 1010 for Bank/Cheque/Card, 1200 for Receivable)
                if (doc.payment_type === 'credit' || doc.payment_type === 'cod') {
                    await recordTransaction(getAccId('1200'), doc.total, 'debit', `Receivable from Invoice #${id}(${doc.payment_type.toUpperCase()})`, 'Sale', id);
                } else if (doc.payment_type === 'cash' || doc.payment_type === 'qr') {
                    await recordTransaction(getAccId('1000'), doc.total, 'debit', `${doc.payment_type.toUpperCase()} from Invoice #${id}`, 'Sale', id);
                } else {
                    // For Bank, Card, Cheque, etc.
                    const methodLabel = doc.payment_type.charAt(0).toUpperCase() + doc.payment_type.slice(1);
                    const descSuffix = (doc.payment_type === 'cheque' && doc.cheque_number) ? ` (${doc.cheque_number})` : '';
                    await recordTransaction(getAccId('1010'), doc.total, 'debit', `${methodLabel} from Invoice #${id}${descSuffix}`, 'Sale', id);
                }
            }
        });

        showAlert('Converted', 'Document has been converted to an Invoice and stock updated.', 'success');

        // Refresh whichever view we are on
        const activeTab = document.querySelector('.nav-btn.active')?.dataset.target;
        if (activeTab === 'sales-view') renderSalesList('', 'sales');
        else if (activeTab === 'quotes-view') renderSalesList('', 'quotes');
        else if (activeTab === 'sales-orders-view') renderSalesList('', 'sales_orders');

        // Ask to print
        const printConfirm = await Swal.fire({
            title: 'Print Invoice?',
            text: "Would you like to print the finalized invoice now?",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Yes, Print',
            cancelButtonText: 'Later'
        });
        if (printConfirm.isConfirmed) printInvoice(id);

    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to convert to invoice: ' + err.message, 'error');
    }
}

/**
 * Estimates rendered pixel height of an item row including name, description, and serials.
 */
function estimateItemRowHeight(item) {
    let h = 36; // base row padding (10px * 2) + font line height (~16px)
    const nameLen = (item.name || '').length;
    if (nameLen > 40) h += Math.ceil((nameLen - 40) / 40) * 16;
    if (item.description) {
        const descLines = String(item.description).split('\n').filter(l => l.trim()).length || 1;
        h += 4 + (descLines * 14);
    }
    if (item.serial) {
        const serials = String(item.serial).split(',').map(s => s.trim()).filter(Boolean);
        if (serials.length > 0) {
            h += 4 + 14 + (serials.length * 13);
        }
    }
    return h;
}

/**
 * Intelligently paginates products across pages.
 * Fills each page completely to its maximum capacity.
 * Only breaks onto the next page when the current page is genuinely full.
 */
function paginateItemsForInvoice(items, isMinimal = false) {
    const totalItems = (items || []).length;
    if (totalItems === 0) {
        return [{ items: [], hasTotals: true, startIndex: 0 }];
    }

    // Limits calibrated for standard A4 printable height (approx 1030px available)
    // When Subtotal & Account Details are on the page, max item space is ~490px
    const MAX_HEIGHT_PAGE = isMinimal ? 470 : 490;
    const MAX_COUNT_PAGE = 12;

    const pages = [];
    let currentIndex = 0;

    while (currentIndex < totalItems) {
        const remainingItems = items.slice(currentIndex);

        // Can ALL remaining items fit cleanly on this page with Subtotal & Account Details?
        let remHeight = 0;
        for (const it of remainingItems) {
            remHeight += estimateItemRowHeight(it);
        }

        if (remHeight <= MAX_HEIGHT_PAGE && remainingItems.length <= MAX_COUNT_PAGE) {
            pages.push({
                items: remainingItems,
                hasTotals: true,
                startIndex: currentIndex
            });
            break;
        }

        // Not all remaining items fit with totals. Fill this page to maximum capacity!
        let pageItems = [];
        let curHeight = 0;

        for (let i = 0; i < remainingItems.length; i++) {
            const nextItem = remainingItems[i];
            const nextItemHeight = estimateItemRowHeight(nextItem);

            if (pageItems.length > 0 && 
                (curHeight + nextItemHeight > MAX_HEIGHT_PAGE || pageItems.length >= MAX_COUNT_PAGE)) {
                break;
            }

            pageItems.push(nextItem);
            curHeight += nextItemHeight;
        }

        if (pageItems.length === 0) {
            pageItems.push(remainingItems[0]);
        }

        const isLastPage = (currentIndex + pageItems.length >= totalItems);

        pages.push({
            items: pageItems,
            hasTotals: isLastPage,
            startIndex: currentIndex
        });

        currentIndex += pageItems.length;
    }

    return pages;
}

/**
 * Resolves settlement status, payment method, and complete payment details
 * for credit invoices and all finalized sales.
 */
async function getInvoiceSettlementInfo(sale) {
    if (!sale || sale.document_type === 'quote') return null;
    const saleId = sale.id;
    const total = parseFloat(sale.total) || 0;
    let paidAmount = parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) || 0;

    // Retrieve all payment records linked to this invoice
    let payments = [];
    try {
        if (typeof db !== 'undefined' && db.payments) {
            const allP = typeof db.payments.toArray === 'function' ? await db.payments.toArray() : [];
            payments = allP.filter(p =>
                (p.target_type === 'invoice' && (Number(p.target_id) === Number(saleId) || Number(p.invoice_id) === Number(saleId))) ||
                (Number(p.invoice_id) === Number(saleId))
            );
        }
    } catch (err) {
        console.warn('[Settlement] Error querying invoice payments:', err);
    }

    const totalFromPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const effectivePaid = Math.max(paidAmount, totalFromPayments);
    const isCredit = ['credit', 'cod'].includes(String(sale.payment_type || sale.payment_terms || '').toLowerCase().trim()) || (parseInt(sale.credit_days || sale.credit_period) > 0);
    
    // Auto-detect settled: status is paid OR effective paid covers total OR settlement details present
    const isSettled = (sale.status === 'paid') || (effectivePaid >= (total - 0.01) && total > 0) || (sale.document_type === 'invoice' && !isCredit && sale.status !== 'unpaid');

    // Auto-update status in database if paid (even if payment received after due date)
    if (isSettled && sale.status !== 'paid' && typeof db !== 'undefined' && db.sales) {
        try {
            await db.sales.update(saleId, {
                status: 'paid',
                paid_amount: Math.max(effectivePaid, total)
            });
            sale.status = 'paid';
            sale.paid_amount = Math.max(effectivePaid, total);
        } catch (err) {
            console.warn('[Settlement] Auto-update paid status notice:', err);
        }
    }

    const settlement = sale.settlement_details || {};
    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;

    // Detect payment method used to settle the invoice
    let rawMethod = (
        settlement.method ||
        sale.settlement_payment_method ||
        (latestPayment ? latestPayment.method : null) ||
        sale.payment_method ||
        sale.payment_type ||
        ''
    ).toString().toLowerCase().trim();

    let methodKey = 'cash';
    let methodTitle = 'Paid by Cash';

    if (rawMethod.includes('cheque') || rawMethod.includes('check') || sale.cheque_number || sale.cheque_no || (latestPayment && (latestPayment.cheque_number || latestPayment.cheque_no))) {
        methodKey = 'cheque';
        methodTitle = 'Paid by Cheque';
    } else if (rawMethod.includes('bank') || rawMethod.includes('transfer') || sale.bank_reference || sale.bank_ref || (latestPayment && (latestPayment.bank_reference || latestPayment.reference || latestPayment.bank_ref))) {
        methodKey = 'bank';
        methodTitle = 'Paid by Bank Transfer';
    } else if (rawMethod.includes('koko') || sale.koko_reference || sale.koko_ref || (latestPayment && (latestPayment.koko_reference || latestPayment.koko_ref))) {
        methodKey = 'koko';
        methodTitle = 'Paid by KOKO';
    } else {
        methodKey = 'cash';
        methodTitle = 'Paid by Cash';
    }

    // Extract Cheque Details
    const chequeNumber = settlement.cheque_number || (latestPayment ? (latestPayment.cheque_number || latestPayment.cheque_no) : null) || sale.cheque_number || sale.cheque_no || '';
    const chequeDate = settlement.cheque_date || (latestPayment ? latestPayment.cheque_date : null) || sale.cheque_date || '';
    const chequeBank = settlement.cheque_bank || (latestPayment ? (latestPayment.cheque_bank || latestPayment.bank_name) : null) || sale.cheque_bank || sale.bank_name || '';

    // Extract Bank Transfer Details
    const bankRef = settlement.bank_reference || (latestPayment ? (latestPayment.bank_reference || latestPayment.reference || latestPayment.bank_ref) : null) || sale.bank_reference || sale.bank_ref || '';

    // Extract KOKO Details
    const kokoRef = settlement.koko_reference || (latestPayment ? (latestPayment.koko_reference || latestPayment.reference || latestPayment.koko_ref) : null) || sale.koko_reference || sale.koko_ref || '';

    // Paid Date
    const paidDateRaw = settlement.paid_date || (latestPayment ? latestPayment.date : null) || sale.settlement_date || sale.paid_date || null;
    let formattedPaidDate = '';
    if (paidDateRaw) {
        try {
            formattedPaidDate = new Date(paidDateRaw).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            formattedPaidDate = String(paidDateRaw);
        }
    }

    return {
        isSettled,
        isCredit,
        status: isSettled ? 'PAID' : (sale.status ? sale.status.toUpperCase() : 'UNPAID'),
        methodKey,
        methodTitle,
        chequeNumber,
        chequeDate,
        chequeBank,
        bankRef,
        kokoRef,
        paidDate: formattedPaidDate,
        effectivePaid,
        total,
        balanceDue: isSettled ? 0 : Math.max(0, total - effectivePaid),
        payments
    };
}
window.getInvoiceSettlementInfo = getInvoiceSettlementInfo;

async function printInvoice(id, layout = null, isPreview = false, isReprint = false, returnHtml = false, onReady = null, forceType = null) {
    const sale = await db.sales.get(id);
    if (!sale) {
        showAlert('Error', 'Sale not found', 'error');
        return;
    }

    // Role-based Security: Authorize reprinting (except for Quotes)
    if (isReprint && !isPreview && sale.document_type !== 'quote') {
        const docName = (sale.document_type || 'invoice').replace('_', ' ').toUpperCase();
        requestElevatedAuth(() => {
            // Re-call with isReprint = false once authorized
            printInvoice(id, layout, isPreview, false, returnHtml, onReady);
        }, `reprint this ${docName}`);
        return;
    }

    // Load store settings
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || '';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const enabledStoreSubheading = opts['enabled_store_subheading'] !== false;
    const storeLogo = opts['store_logo'] || '';
    const invoiceTemplate = opts['invoice_template'] || 'professional';
    const invoiceColor = opts['invoice_color'] || '#4F46E5';
    let invoiceFooter = opts['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = opts['receipt_footer_info'] || '';
    const bankDetails = opts['enabled_bank_details'] === false ? '' : (opts['bank_details'] || '');
    const chequeName = opts['enabled_cheque_name'] === true ? (opts['cheque_name'] || '') : '';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';
    const taxEnabled = opts['tax_enabled'] === true || opts['tax_enabled'] === 'true';
    const vatPercent = parseFloat(opts['vat_rate']) || 15;
    const vatRate = vatPercent / 100;

    // Calculate Tax Breakdown
    const total = parseFloat(sale.total) || 0;
    const basePrice = total / (1 + vatRate);
    const vatAmount = total - basePrice;
    const storeTIN = opts['tax_tin'] || '';
    const paymentQR = opts['enabled_payment_qr'] === false ? '' : (opts['payment_qr'] || '');

    if (sale.document_type === 'quote') {
        invoiceFooter = 'THANK YOU FOR YOUR INQUIRY!';
    } else {
        invoiceFooter = 'THANK YOU FOR YOUR BUSINESS!';
    }


    let docTitle = 'INVOICE';
    let hidePrices = false;

    const docType = forceType || sale.document_type || 'invoice';
    const isQuote = (docType === 'quote');
    if (docType === 'quote') { docTitle = 'QUOTATION'; }
    else if (docType === 'sales_order') { docTitle = 'SALES ORDER'; }
    else if (docType === 'delivery_note') {
        docTitle = 'DELIVERY NOTE';
        hidePrices = true;
        // Check if we should use the premium layout
        return printPremiumDeliveryNote(sale, opts, isPreview, returnHtml);
    }
    else if (docType === 'web_order') { docTitle = 'WEB ORDER'; }

    let custName = sale.customer_name || 'Walk-in Customer';
    let custAddress = 'N/A';
    let custPhone = 'N/A';

    const repName = sale.rep_name || (document.getElementById('pos-user') ? document.getElementById('pos-user').innerText : (typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'Admin'));
    const repContact = sale.rep_contact_number || (typeof currentUser !== 'undefined' && currentUser ? (currentUser.contact_number || '') : '');
    const repDisplay = repContact ? `${repName} (${repContact})` : repName;

    let customerObj = null;
    if (sale.customer_id) {
        let c = await db.customers.get(sale.customer_id);
        if (c) {
            customerObj = c;
            custName = c.name || custName;
            custAddress = c.address || 'N/A';
            custPhone = c.phone || 'N/A';
            if (c.title && c.title !== 'None' && !custName.startsWith(c.title)) {
                custName = `${c.title}. ${custName}`;
            }
        }
    } else if (sale.customer_title && sale.customer_title !== 'None' && !custName.startsWith(sale.customer_title)) {
        custName = `${sale.customer_title}. ${custName}`;
    }

    if (!customerObj && custName && custName !== 'Walk-in Customer' && custName !== 'Walk-in') {
        try {
            const cleanName = custName.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Rev\.)\s+/i, '').trim();
            customerObj = await db.customers.where('name').equalsIgnoreCase(custName).first() ||
                          await db.customers.where('name').equalsIgnoreCase(cleanName).first();
        } catch (e) {
            console.warn('Error matching customer by name:', e);
        }
    }

    const dateStr = new Date(sale.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const effectiveLayout = layout || sale.printer_layout || invoiceTemplate;
    const settlementInfo = isQuote ? null : await getInvoiceSettlementInfo(sale);

    // Calculate Customer Total Due for Sales Orders and Sales Invoices
    let customerTotalDue = 0;
    if (!isQuote) {
        const docPaid = parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) || 0;
        const docTotal = parseFloat(sale.total) || 0;

        if (customerObj) {
            let baseOutstanding = 0;
            if (typeof getCustomerFinancialData === 'function') {
                try {
                    const fin = await getCustomerFinancialData(customerObj.id);
                    if (fin && fin.totalOutstanding !== undefined) {
                        baseOutstanding = parseFloat(fin.totalOutstanding) || 0;
                    } else {
                        baseOutstanding = parseFloat(customerObj.current_balance) || 0;
                    }
                } catch (e) {
                    baseOutstanding = parseFloat(customerObj.current_balance) || 0;
                }
            } else {
                baseOutstanding = parseFloat(customerObj.current_balance) || 0;
            }

            if (docType === 'sales_order') {
                // A Sales Order is an order document, not yet finalized into revenue/ledger accounts.
                // Include this order's remaining unpaid balance with customer's outstanding balance.
                const isSOPaid = (sale.status === 'paid') || (docPaid >= docTotal - 0.01 && docTotal > 0);
                const orderDue = isSOPaid ? 0 : Math.max(0, docTotal - docPaid);
                customerTotalDue = baseOutstanding + orderDue;
            } else {
                // For an invoice, getCustomerFinancialData already audits finalized invoices.
                const isPaidInvoice = (settlementInfo && settlementInfo.isSettled) || (sale.status === 'paid') || (docPaid >= docTotal - 0.01 && docTotal > 0);
                if (isPaidInvoice) {
                    customerTotalDue = baseOutstanding;
                } else {
                    const invDue = Math.max(0, docTotal - docPaid);
                    customerTotalDue = Math.max(baseOutstanding, invDue);
                }
            }
        } else {
            // Walk-in / unrecorded customer
            const isSettledDoc = (settlementInfo && settlementInfo.isSettled) || (sale.status === 'paid') || (docPaid >= docTotal - 0.01 && docTotal > 0);
            customerTotalDue = isSettledDoc ? 0 : Math.max(0, docTotal - docPaid);
        }
    }

    let settlementCardHtml = '';
    if (settlementInfo && settlementInfo.isSettled) {
        let methodSpecificDetailsHtml = '';
        if (settlementInfo.methodKey === 'cheque') {
            methodSpecificDetailsHtml = `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #86efac; font-size: 11px; color: #1f2937; line-height: 1.6;">
                    <div><b>Cheque Number:</b> <span style="font-family: monospace; font-weight: bold; font-size: 12px; color: #111827;">${settlementInfo.chequeNumber || 'N/A'}</span></div>
                    <div><b>Cheque Bank Name:</b> <span style="font-weight: 700; color: #111827;">${settlementInfo.chequeBank || 'N/A'}</span></div>
                    <div><b>Cheque Date:</b> <span style="font-weight: 700; color: #111827;">${settlementInfo.chequeDate || 'N/A'}</span></div>
                </div>
            `;
        } else if (settlementInfo.methodKey === 'bank') {
            methodSpecificDetailsHtml = `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #86efac; font-size: 11px; color: #1f2937; line-height: 1.6;">
                    <div><b>Bank Transfer Reference Number:</b> <span style="font-family: monospace; font-weight: bold; font-size: 12px; color: #111827;">${settlementInfo.bankRef || 'N/A'}</span></div>
                </div>
            `;
        } else if (settlementInfo.methodKey === 'koko') {
            methodSpecificDetailsHtml = `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #86efac; font-size: 11px; color: #1f2937; line-height: 1.6;">
                    ${settlementInfo.kokoRef ? `<div><b>KOKO Reference Number:</b> <span style="font-family: monospace; font-weight: bold; font-size: 12px; color: #111827;">${settlementInfo.kokoRef}</span></div>` : '<div><b>KOKO Payment:</b> Settled via KOKO</div>'}
                </div>
            `;
        } else {
            methodSpecificDetailsHtml = `
                <div style="margin-top: 4px; font-size: 11px; color: #374151;">
                    <span>Payment received in full via Cash.</span>
                </div>
            `;
        }

        settlementCardHtml = `
            <div style="font-size:11px; color:#111827; padding:12px 14px; background:#f0fdf4; border: 1.5px solid #86efac; border-radius:8px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <h4 style="margin:0; font-size:10px; color:#15803d; text-transform:uppercase; font-weight:900; letter-spacing: 0.5px;">Payment Settlement Record</h4>
                    <span style="font-size: 9px; font-weight: 900; background: #16a34a; color: white; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;">PAID</span>
                </div>
                <div style="font-size: 13px; font-weight: 900; color: #166534;">
                    ✓ ${settlementInfo.methodTitle}
                </div>
                ${methodSpecificDetailsHtml}
                ${settlementInfo.paidDate ? `<div style="margin-top: 6px; padding-top: 4px; border-top: 1px dotted #bbf7d0; font-size: 10px; color: #4b5563;"><b>Settled Date:</b> ${settlementInfo.paidDate}</div>` : ''}
            </div>
        `;
    }

    let itemsHtml = '';
    (sale.items || []).forEach(item => {
        itemsHtml += `
            <tr style="border-bottom: 1px solid #eee;">
                <td align="left" style="padding: 10px; font-size:12px;">
                    <div style="font-weight: bold;">${item.name}</div>
                    ${item.description ? `<div style="font-size: 11px; color: #444; margin-top: 2px; font-style: italic; white-space: pre-line;">${item.description}</div>` : ''}
                    ${item.serial ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</div>` : ''}
                </td>
                <td align="center" style="padding: 10px; font-size: 11px;">${item.warranty || 'N/A'}</td>
                <td align="center" style="padding: 10px; font-size: 12px;">${item.qty}</td>
                ${!hidePrices ? `<td align="right" style="padding: 10px; font-size: 12px;">Rs. ${parseFloat(item.price).toLocaleString()}</td>
                <td align="right" style="padding: 10px; font-size: 12px; font-weight:bold;">Rs. ${parseFloat(item.total).toLocaleString()}</td>` : ''}
            </tr>
        `;
    });

    let html = '';

    // ==========================================
    // TEMPLATE: DOT MATRIX
    // ==========================================
    if (effectiveLayout === 'dotmatrix') {
        const dotItems = (sale.items || []).map((item, idx) => `
            <tr style="border-bottom: 1px dotted #000;">
                <td align="center" style="padding: 5px; font-size: 14px;">${idx + 1}</td>
                <td style="padding: 5px; font-size: 14px;">
                    ${item.name}
                    ${item.description ? `<div style="font-size: 12px; font-style: italic; color: #333; white-space: pre-line;">${item.description}</div>` : ''}
                    ${item.serial ? `<div style="font-size: 12px;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</div>` : ''}
                </td>
                <td align="center" style="padding: 5px; font-size: 14px;">${item.warranty || 'N/A'}</td>
                <td align="center" style="padding: 5px; font-size: 14px;">${item.qty}</td>
                ${!hidePrices ? `<td align="right" style="padding: 5px; font-size: 14px;">${(parseFloat(item.price) || 0).toLocaleString()}</td>
                <td align="right" style="padding: 5px; font-size: 14px; font-weight:bold;">${(parseFloat(item.total || (item.qty * item.price)) || 0).toLocaleString()}</td>` : ''}
            </tr>
        `).join('');

        html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>DOT MATRIX - ${docTitle}</title>
                <style>
                    @media print { @page { size: A4; margin: 10mm; } }
                    body { font-family: 'Courier New', Courier, monospace; color: #000; background: #fff; padding: 0; margin: 0; }
                    .container { width: 100%; min-height: 297mm; border: 1px solid #000; padding: 10px; box-sizing: border-box; position: relative; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { border: 1px solid #000; padding: 5px; text-align: left; background: #eee; -webkit-print-color-adjust: exact; }
                    td { border: 1px solid #000; padding: 5px; }
                    .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <h2 style="margin:0;">${storeName.toUpperCase()}</h2>
                            ${enabledStoreAddress ? `<p style="margin:5px 0; font-size: 12px;">${storeAddress}</p>` : ''}
                            <div style="font-size:11px; color:#444;">
                                Tel: ${storePhone} ${storeEmail}
                                ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                ${storeBR ? ` | BR: ${storeBR}` : ''}
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <h2 style="margin:0;">${docTitle}</h2>
                            <p style="margin:5px 0;">ID: ${getInvoiceDisplayNumber(sale)}</p>
                            <p style="margin:5px 0;">DATE: ${dateStr}</p>
                            ${!isQuote && settlementInfo && settlementInfo.isSettled ? `<p style="margin:5px 0; font-weight:bold; color:#059669;">[STATUS: PAID - ${settlementInfo.methodTitle.toUpperCase()}]</p>` : (!isQuote && settlementInfo && settlementInfo.isCredit ? `<p style="margin:5px 0; font-weight:bold; color:#d97706;">[STATUS: CREDIT UNPAID]</p>` : '')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom:10px; display:flex; justify-content:space-between;">
                        <div style="width: 48%;">
                            <strong>CUSTOMER:</strong> ${custName}<br>
                            Address: ${custAddress}<br>
                            Phone: ${custPhone}
                        </div>
                        <div style="width: 48%; text-align: right;">
                            <strong>REP:</strong> ${repDisplay}<br>
                            ${sale.document_type === 'quote' ? `<strong>VALIDITY:</strong> ${sale.validity || '7'} Days <br>` : ''}
                            ${!isQuote && sale.credit_days ? `<strong>CREDIT:</strong> ${sale.credit_days} Days <br>` : ''}
                            ${!isQuote && settlementInfo && settlementInfo.isSettled ? `<strong>SETTLEMENT:</strong> ${settlementInfo.methodTitle}` : ''}
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th align="center">#</th>
                                <th>DESCRIPTION</th>
                                <th align="center">WARRANTY</th>
                                <th align="center">QTY</th>
                                ${!hidePrices ? `<th align="right">PRICE</th>
                                <th align="right">TOTAL</th>` : ''}
                            </tr>
                        </thead>
                        <tbody>${dotItems}</tbody>
                    </table>

                    <!--BANK DETAILS & TOTALS MOVED DOWN-- >
        <div style="position: absolute; bottom: 85mm; left: 10mm; right: 10mm; display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="width:30%; display: flex; flex-direction: column; gap: 5px;">
                ${!isQuote && settlementInfo && settlementInfo.isSettled ? `
                    <div style="font-size: 11px; padding: 8px; border: 1px solid #000; margin-bottom: 5px;">
                        <strong>SETTLEMENT DETAILS:</strong><br>
                        Status: PAID<br>
                        Method: ${settlementInfo.methodTitle}<br>
                        ${settlementInfo.methodKey === 'cheque' ? `Cheque No: ${settlementInfo.chequeNumber}<br>Bank: ${settlementInfo.chequeBank}<br>Date: ${settlementInfo.chequeDate}<br>` : ''}
                        ${settlementInfo.methodKey === 'bank' ? `Bank Ref: ${settlementInfo.bankRef}<br>` : ''}
                        ${settlementInfo.methodKey === 'koko' && settlementInfo.kokoRef ? `KOKO Ref: ${settlementInfo.kokoRef}<br>` : ''}
                        ${settlementInfo.paidDate ? `Date: ${settlementInfo.paidDate}` : ''}
                    </div>
                ` : ''}
                ${(!settlementInfo || !settlementInfo.isSettled) && bankDetails ? `<div style="font-size: 11px; padding: 10px; border: 1px solid #000;"><strong>Bank Details:</strong><br>${bankDetails.split('\n').join('<br>')}</div>` : ''}
                ${(!settlementInfo || !settlementInfo.isSettled) && chequeName ? `<div style="font-size: 11px; padding: 10px; border: 1px solid #000; margin-top: 5px;"><strong>Make Cheques Payable to:</strong><br>${chequeName}</div>` : ''}
                ${sale.payment_type === 'cheque' && sale.cheque_number ? `
                             <div style="font-size: 11px; padding: 10px; border: 1px solid #000; margin-top: 5px;">
                                <strong>Cheque Details:</strong><br>
                                No: ${sale.cheque_number}<br>
                                Bank: ${sale.bank_name || 'N/A'}
                             </div>` : ''}
            </div>
            <div style="width: 20%; text-align: center;">
                ${paymentQR ? `<img src="${paymentQR}" style="max-height: 80px; max-width: 80px; border: 1px solid #000; padding: 5px;">` : ''}
                </div>
                        ${!hidePrices ? `
                        <div style="text-align:right; border: 2px solid #000; padding: 10px; min-width: 250px;">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Subtotal:</span>
                                <span>Rs. ${(parseFloat(sale.subtotal || sale.total) || 0).toLocaleString()}</span>
                            </div>
                            ${sale.discount > 0 ? `
                            <div style="display:flex; justify-content:space-between;">
                                <span>Discount:</span>
                                <span>- Rs. ${(parseFloat(sale.discount) || 0).toLocaleString()}</span>
                            </div>` : ''}
                            ${sale.delivery_charge > 0 ? `
                            <div style="display:flex; justify-content:space-between;">
                                <span>Delivery Charge:</span>
                                <span>+ Rs. ${(parseFloat(sale.delivery_charge) || 0).toLocaleString()}</span>
                            </div>` : ''}
                            ${taxEnabled ? `
                            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000; font-size: 11px; opacity: 0.7;">
                                <div style="display:flex; justify-content:space-between;">
                                    <span>Taxable Amt:</span>
                                    <span>Rs. ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style="display:flex; justify-content:space-between;">
                                    <span>VAT (${vatPercent}%):</span>
                                    <span>Rs. ${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>` : ''}
                            <h2 style="margin:10px 0 0 0; border-top: 1px solid #000; padding-top: 5px;">TOTAL: Rs. ${parseFloat(sale.total).toLocaleString()}</h2>
                            ${!isQuote ? `
                            ${(settlementInfo && settlementInfo.isSettled) || (parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) > 0) ? `
                            <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:4px;">
                                <span>Amount Paid:</span>
                                <span>Rs. ${(parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : (sale.amount_paid || sale.total)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            ` : ''}
                            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; margin-top:3px; border-top:1px dashed #000; padding-top:3px;">
                                <span>Balance Due:</span>
                                <span>Rs. ${customerTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${customerTotalDue <= 0 ? ' (PAID)' : ''}</span>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}
            </div>

            <div style="position: absolute; bottom: 45mm; left: 10mm; right: 10mm; display:flex; justify-content:space-between; font-size: 10px; font-weight: bold;">
                <div style="text-align:center; width: 18%;">
                    <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                    <div style="margin-top: 5px; text-transform: uppercase; font-size: 8px;">Prepared By</div>
                </div>
                <div style="text-align:center; width: 18%;">
                    <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                    <div style="margin-top: 5px; text-transform: uppercase; font-size: 8px;">Authorized By</div>
                </div>
                <div style="text-align:center; width: 18%;">
                    <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                    <div style="margin-top: 5px; text-transform: uppercase; font-size: 8px;">Receiver Name</div>
                </div>
                <div style="text-align:center; width: 18%;">
                    <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                    <div style="margin-top: 5px; text-transform: uppercase; font-size: 8px;">Customer Signature</div>
                </div>
                <div style="text-align:center; width: 18%;">
                    <div style="border-bottom: 1px solid #000; height: 30px;"></div>
                    <div style="margin-top: 5px; text-transform: uppercase; font-size: 8px;">NIC Number</div>
                </div>
            </div>

            <div style="position: absolute; bottom: 10mm; left: 10mm; right: 10mm; text-align:center; font-size:10px; border-top: 1px solid #000; padding-top:10px;">
                ${invoiceFooter}
                ${receiptFooterInfo ? `<div style="margin-top: 5px; font-size: 10px; color: #4b5563; line-height: 1.5; font-weight: 700; white-space: pre-line;">${receiptFooterInfo}</div>` : ''}
                <div style="margin-top: 5px; font-size: 8px; color: #666; font-weight: bold; text-transform: uppercase;">
                    Powered by Infinity Creative Works <a href="https://wa.me/94765449005" style="color: #666; text-decoration: none; margin-left: 5px;">+94 76 5 449 005</a>
                </div>
            </div>
        </div>
                ${(returnHtml || isPreview) ? '' : '<script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>'}
            </body >
            </html >
        `;
    }
    // ==========================================
    // TEMPLATE: THERMAL
    // ==========================================
    else if (effectiveLayout === 'thermal') {
        const thermalItems = (sale.items || []).map((item, idx) => `
        <tr>
        <td style="padding: 3px 0; font-size: 11px; border-bottom: 1px dashed #ddd;">
            <div style="display:flex; gap: 5px;">
                <span style="font-weight:bold;">${idx + 1}.</span>
                <div style="flex:1;">
                    ${item.name}
                    ${item.description ? `<br><span style="font-size: 10px; font-style: italic; color: #444; white-space: pre-line;">${item.description}</span>` : ''}
                ${item.serial ? `<br><span style="font-size: 9px; color:#555;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</span>` : ''}
                </div>
                    </div>
                    ${!hidePrices ? `
                    <div style="display:flex; justify-content:space-between; margin-top:2px; margin-left: 20px;">
                        <span>${item.qty} x ${(parseFloat(item.price) || 0).toLocaleString()}</span>
                        <strong>${(parseFloat(item.total || (item.qty * item.price)) || 0).toLocaleString()}</strong>
                    </div>` : `
                    <div style="margin-top:2px; margin-left: 20px; font-weight: bold;">
                        Quantity: ${item.qty}
                    </div>`}
                </td>
            </tr>
        `).join('');

        html = `
        < !DOCTYPE html >
            <html>
                <head>
                    <title>Thermal Receipt - ${getInvoiceDisplayNumber(sale)}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #000; padding: 0; margin: 0; width: 80mm; background: #fff; }
                        .center { text-align: center; }
                        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                        .text-xs { font-size: 10px; }
                        .text-sm { font-size: 12px; }
                        .bold { font-weight: bold; }
                        @media print { margin: 0; }
                    </style>
                </head>
                <body style="padding: 5px;">
                    <div class="center">
                        ${storeLogo ? `<img src="${storeLogo}" style="max-width: 60px; max-height: 60px; margin-bottom: 5px;">` : ''}
                    <h2 style="margin:0; font-size:14px;">${storeName.toUpperCase()}</h2>
                    <p class="text-xs" style="margin:2px 0;"><b>${storeSubheading}</b></p>
                    ${enabledStoreAddress ? `<p class="text-xs" style="margin:2px 0;">${storeAddress.split('\n').join('<br>')}</p>` : ''}
                    <p class="text-xs" style="margin:2px 0;">Tel: ${storePhone} ${storeEmail ? `| ${storeEmail}` : ''}</p>
                    <p class="text-xs" style="margin:2px 0;">
                        ${storeWebsite ? `${storeWebsite} | ` : ''}
                        ${storeBR ? `BR: ${storeBR}` : ''}
                    </p>
                </div>
                
                <div class="divider"></div>
                <div class="text-xs">
                    <strong>${docTitle}</strong><br>
                    No: ${getInvoiceDisplayNumber(sale)}<br>
                    Date: ${dateStr}<br>
                    Customer: ${custName}<br>
                    Rep: ${repDisplay}
                    ${!isQuote && sale.credit_days ? `<br>Credit: ${sale.credit_days} Days` : ''}
                    ${isQuote ? `<br>Validity: ${sale.validity || '7'} Days` : ''}
                    ${!isQuote && settlementInfo && settlementInfo.isSettled ? `
                    <div style="margin: 4px 0; padding: 3px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 11px;">
                        *** STATUS: PAID ***
                    </div>
                    <strong>${settlementInfo.methodTitle}</strong>
                    ${settlementInfo.methodKey === 'cheque' ? `<br>Cheque No: ${settlementInfo.chequeNumber}<br>Bank: ${settlementInfo.chequeBank}<br>Date: ${settlementInfo.chequeDate}` : ''}
                    ${settlementInfo.methodKey === 'bank' ? `<br>Bank Ref: ${settlementInfo.bankRef}` : ''}
                    ${settlementInfo.methodKey === 'koko' && settlementInfo.kokoRef ? `<br>KOKO Ref: ${settlementInfo.kokoRef}` : ''}
                    ${settlementInfo.paidDate ? `<br>Settled: ${settlementInfo.paidDate}` : ''}
                    ` : (!isQuote && settlementInfo && settlementInfo.isCredit ? `<br><strong style="color:red;">STATUS: UNPAID CREDIT</strong>` : '')}
                </div>
                <div class="divider"></div>
                
                <table width="100%" style="border-collapse: collapse;">
                    ${thermalItems}
                </table>
 
                ${!hidePrices ? `
                <div class="divider"></div>
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span>Subtotal:</span>
                    <span>${(parseFloat(sale.subtotal || sale.total) || 0).toLocaleString()}</span>
                </div>
                ${sale.discount > 0 ? `
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span>Discount:</span>
                    <span>-${(parseFloat(sale.discount) || 0).toLocaleString()}</span>
                </div>` : ''}
                ${sale.delivery_charge > 0 ? `
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span>Delivery:</span>
                    <span>+${(parseFloat(sale.delivery_charge) || 0).toLocaleString()}</span>
                </div>` : ''}
                ${taxEnabled ? `
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #eee; font-size: 10px; color: #555;">
                    <div style="display:flex; justify-content:space-between;">
                        <span>Taxable:</span>
                        <span>${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>VAT (${vatPercent}%):</span>
                        <span>${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                </div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-top:5px;">
                    <span>TOTAL:</span>
                    <span>Rs. ${(parseFloat(sale.total) || 0).toLocaleString()}</span>
                </div>
                ${!isQuote ? `
                ${(settlementInfo && settlementInfo.isSettled) || (parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) > 0) ? `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:3px;">
                    <span>Amount Paid:</span>
                    <span>Rs. ${(parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : (sale.amount_paid || sale.total)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ` : ''}
                <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; margin-top:3px;">
                    <span>Balance Due:</span>
                    <span>Rs. ${customerTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${customerTotalDue <= 0 ? ' (PAID)' : ''}</span>
                </div>
                ` : ''}` : ''}
 
                <div class="divider"></div>
                ${paymentQR ? `<div class="center" style="margin: 10px 0;"><img src="${paymentQR}" style="max-width: 100px; height: auto;"></div>` : ''}
                <div class="center text-xs" style="margin-top:10px;">
                    <p>${sale.document_type === 'quote' ? 'Quotation Valid for ' + (sale.validity || '7') + ' Days' : invoiceFooter}</p>
                    ${receiptFooterInfo ? `<div style="margin-top: 6px; font-size: 10px; color: #4b5563; line-height: 1.5; font-weight: 700; white-space: pre-line; border-top: 1px dashed #ddd; padding-top: 5px;">${receiptFooterInfo}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 8px; color: #666; border-top: 1px dashed #ccc; padding-top: 5px; font-weight: bold;">
                        Powered by Infinity Creative Works <a href="https://wa.me/94765449005" style="color: #666; text-decoration: none; margin-left: 5px;">+94 76 5 449 005</a>
                    </div>
                </div>
                ${(returnHtml || isPreview) ? '' : '<script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>'}
            </body>
            </html>
        `;
    }
    // ==========================================
    // TEMPLATE: MINIMAL
    // ==========================================
    else if (effectiveLayout === 'minimal') {
        const pagesData = paginateItemsForInvoice(sale.items || [], true);
        const totalPages = pagesData.length;

        const pagesHtml = pagesData.map((pageInfo, pageIndex) => {
            const pageItems = pageInfo.items;
            const hasTotals = pageInfo.hasTotals;
            const startIndex = pageInfo.startIndex;

            const minItems = pageItems.map((item, relIdx) => {
                const idx = startIndex + relIdx;
                return `
                <tr style="border-bottom: 1px solid #eee;">
                    <td align="center" style="padding: 10px 8px; font-size:12px;">${idx + 1}</td>
                    <td align="left" style="padding: 10px 8px; font-size:12px;">
                        <div style="font-weight: bold;">${item.name}</div>
                        ${item.description ? `<div style="font-size: 11px; color: #444; margin-top: 2px; font-style: italic; white-space: pre-line;">${item.description}</div>` : ''}
                        ${item.serial ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</div>` : ''}
                    </td>
                    <td align="center" style="padding: 10px 8px; font-size: 11px;">${item.warranty || 'N/A'}</td>
                    <td align="center" style="padding: 10px 8px; font-size: 12px;">${item.qty}</td>
                    ${!hidePrices ? `<td align="right" style="padding: 10px 8px; font-size: 12px;">Rs. ${(parseFloat(item.price) || 0).toLocaleString()}</td>
                    <td align="right" style="padding: 10px 8px; font-size: 12px; font-weight:bold;">Rs. ${(parseFloat(item.total || (item.qty * item.price)) || 0).toLocaleString()}</td>` : ''}
                </tr>
                `;
            }).join('');

            const pageSubtotal = pageItems.reduce((acc, it) => acc + (parseFloat(it.total || (it.qty * it.price)) || 0), 0);

            return `
                <div class="page-container" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
                    <div class="page-main-content">
                        <!-- HEADER ON EVERY PAGE -->
                        <div>
                            <div class="header-top">
                                <div>
                                    <h1 style="margin:0; font-size:20px; font-weight:900;">${storeName.toUpperCase()}</h1>
                                    ${enabledStoreSubheading && storeSubheading ? `<p style="margin:2px 0; font-size:12px; color:#666; font-weight:bold;">${storeSubheading}</p>` : ''}
                                    ${enabledStoreAddress && storeAddress ? `<p style="margin:5px 0; font-size:12px; color:#4b5563;">${storeAddress}</p>` : ''}
                                    <div style="font-size:11px; color:#666;">
                                        Tel: ${storePhone} ${storeEmail ? ` | ${storeEmail}` : ''}
                                        ${storeWebsite ? ` | ${storeWebsite}` : ''}
                                        ${storeBR ? ` | BR: ${storeBR}` : ''}
                                        ${taxEnabled && storeTIN ? ` | TIN: ${storeTIN}` : ''}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <h2 style="margin:0; font-size: 24px; font-weight: 900; color: #1a1a1a;">${docTitle}</h2>
                                    <p style="margin:5px 0; font-size: 14px; font-weight: bold; color: #4b5563;">ID: ${getInvoiceDisplayNumber(sale)}</p>
                                    <p style="margin:5px 0; font-size: 12px; color: #6b7280;">Date: ${dateStr}</p>
                                    <p class="page-number" style="margin:4px 0; font-size:11px; font-weight: bold; color: #1a1a1a;">Page ${pageIndex + 1} of ${totalPages}</p>
                                    ${!isQuote && settlementInfo && settlementInfo.isSettled ? `
                                        <div style="margin-top: 6px;">
                                            <span style="display: inline-block; padding: 3px 12px; background: #ecfdf5; color: #047857; border: 2px solid #10b981; border-radius: 6px; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                                                ✓ PAID
                                            </span>
                                        </div>
                                    ` : (!isQuote && settlementInfo && settlementInfo.isCredit ? `
                                        <div style="margin-top: 6px;">
                                            <span style="display: inline-block; padding: 3px 10px; background: #fffbeb; color: #b45309; border: 2px solid #f59e0b; border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                                                CREDIT UNPAID
                                            </span>
                                        </div>
                                    ` : '')}
                                </div>
                            </div>

                            <div style="margin-bottom: 25px; display: flex; gap: 40px;">
                                <div style="flex: 1;">
                                    <h3 style="margin-top:0; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">Billed To:</h3>
                                    <p style="margin:0; font-size: 15px; font-weight: 900;">${custName}</p>
                                    <p style="margin:3px 0; font-size: 12px; color: #4b5563;">${custAddress}</p>
                                    <p style="margin:3px 0; font-size: 12px; color: #4b5563;"><b>Tel:</b> ${custPhone}</p>
                                </div>
                                <div style="flex: 1; text-align: right;">
                                    <h3 style="margin-top:0; color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">${isQuote ? 'Quote Details:' : 'Payment Protocol:'}</h3>
                                    ${isQuote ? `
                                        <p style="margin:3px 0; font-size: 12px; color: #b45309;"><b>Validity:</b> ${sale.validity || '7'} Days</p>
                                        ${sale.payment_type ? `<p style="margin:3px 0; font-size: 12px; color: #111827;"><b>Terms:</b> ${sale.payment_type.toUpperCase()}${sale.payment_type === 'credit' ? ` (${sale.credit_days || sale.credit_period || 7} Days)` : ''}</p>` : ''}
                                    ` : `
                                        <p style="margin:0; font-size: 14px; font-weight: 900; text-transform: uppercase;">${sale.payment_type || 'Cash Sale'}</p>
                                        ${settlementInfo && settlementInfo.isSettled ? `
                                            <p style="margin:3px 0; font-size: 12px; color: #047857;"><b>Status:</b> <span style="font-weight: 900; background: #dcfce7; padding: 1px 6px; border-radius: 4px;">PAID</span></p>
                                            <p style="margin:3px 0; font-size: 12px; color: #047857;"><b>Settlement:</b> <span style="font-weight: 900;">${settlementInfo.methodTitle}</span></p>
                                        ` : `
                                            <p style="margin:3px 0; font-size: 12px; color: #b45309;"><b>Status:</b> <span style="font-weight: 900; background: #fef3c7; padding: 1px 6px; border-radius: 4px;">UNPAID</span></p>
                                        `}
                                        ${sale.credit_days ? `<p style="margin:3px 0; font-size: 12px; color: #ef4444;"><b>Credit Period:</b> ${sale.credit_days} Days</p>` : ''}
                                    `}
                                    <p style="margin:3px 0; font-size: 12px; color: #4b5563;"><b>Representative:</b> ${repDisplay}</p>
                                </div>
                            </div>

                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                <thead>
                                    <tr>
                                        <th align="center" width="5%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">#</th>
                                        <th align="left" width="50%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">Item Details</th>
                                        <th align="center" width="15%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">Warranty</th>
                                        <th align="center" width="10%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">Qty</th>
                                        ${!hidePrices ? `
                                        <th align="right" width="10%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">Rate</th>
                                        <th align="right" width="10%" style="padding: 10px; border-bottom: 2px solid #1a1a1a;">Amount</th>` : ''}
                                    </tr>
                                </thead>
                                <tbody>${minItems}</tbody>
                            </table>
                        </div>

                    </div>

                    <!-- FOOTER MUST BE ON EVERY PAGE -->
                    <div class="print-footer" style="margin-top: auto; padding-top: 15px;">
                        <!-- ACCOUNT DETAILS & SUBTOTAL SECTION (PRESENT ON EVERY PAGE, INCLUDING PAGE 1) -->
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div style="width: 50%;">
                                ${!isQuote ? settlementCardHtml : ''}
                                ${(!settlementInfo || !settlementInfo.isSettled) && bankDetails ? `<div style="font-size: 10px; color: #6b7280; padding: 10px 12px; background: #f9fafb; border-radius: 8px;">
                                    <strong style="color: #1a1a1a; text-transform: uppercase;">Bank Transfer Details:</strong><br>
                                    ${bankDetails.split('\n').join('<br>')}
                                </div>` : ''}
                                ${(!settlementInfo || !settlementInfo.isSettled) && chequeName ? `<div style="font-size: 10px; color: #6b7280; margin-top: 6px;">
                                    <b>Make cheques payable to:</b> ${chequeName}
                                </div>` : ''}
                                ${(!settlementInfo || !settlementInfo.isSettled) && paymentQR ? `<div style="margin-top: 10px;">
                                    <img src="${paymentQR}" style="max-height: 60px; max-width: 60px; border: 1px solid #eee; padding: 4px; border-radius: 6px;">
                                </div>` : ''}
                            </div>
                            <div style="width: 40%;">
                                ${hasTotals ? `
                                ${!hidePrices ? `
                                <div style="display:flex; justify-content:space-between; padding: 3px 0;">
                                    <span style="color: #6b7280; font-size: 12px;">Subtotal:</span>
                                    <span style="font-weight: bold; font-size: 12px;">Rs. ${(parseFloat(sale.subtotal || sale.total) || 0).toLocaleString()}</span>
                                </div>
                                ${sale.discount > 0 ? `
                                <div style="display:flex; justify-content:space-between; padding: 3px 0; color: #ef4444;">
                                    <span style="font-size: 12px;">Total Savings:</span>
                                    <span style="font-weight: bold; font-size: 12px;">- Rs. ${(parseFloat(sale.discount) || 0).toLocaleString()}</span>
                                </div>` : ''}
                                ${sale.delivery_charge > 0 ? `
                                <div style="display:flex; justify-content:space-between; padding: 3px 0;">
                                    <span style="color: #6b7280; font-size: 12px;">Delivery:</span>
                                    <span style="font-weight: bold; font-size: 12px;">+ Rs. ${(parseFloat(sale.delivery_charge) || 0).toLocaleString()}</span>
                                </div>` : ''}
                                ${taxEnabled ? `
                                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #eee; font-size: 11px; color: #6b7280;">
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>Taxable Total:</span>
                                        <span>Rs. ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style="display:flex; justify-content:space-between;">
                                        <span>VAT (${vatPercent}%):</span>
                                        <span>Rs. ${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>` : ''}
                                <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #1a1a1a; display:flex; justify-content:space-between; align-items: baseline;">
                                    <span style="font-size: 14px; font-weight: 900; text-transform: uppercase;">Grand Total:</span>
                                    <span style="font-size: 18px; font-weight: 900; color: #1a1a1a;">Rs. ${parseFloat(sale.total).toLocaleString()}</span>
                                </div>
                                ${!isQuote ? `
                                ${(settlementInfo && settlementInfo.isSettled) || (parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) > 0) ? `
                                <div style="display:flex; justify-content:space-between; padding: 3px 0; color: #047857; margin-top: 4px;">
                                    <span style="font-size: 12px; font-weight: bold;">Amount Paid:</span>
                                    <span style="font-weight: 900; font-size: 12px;">Rs. ${(parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : (sale.amount_paid || sale.total)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                ` : ''}
                                <div style="display:flex; justify-content:space-between; padding: 2px 0; color: ${customerTotalDue > 0 ? '#b91c1c' : '#047857'}; margin-top: 2px;">
                                    <span style="font-size: 12px; font-weight: bold;">Balance Due:</span>
                                    <span style="font-weight: 900; font-size: 12px;">Rs. ${customerTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${customerTotalDue <= 0 ? ' (SETTLED)' : ((!settlementInfo || !settlementInfo.isSettled) ? ' (UNPAID)' : '')}</span>
                                </div>
                                ` : ''}
                                ` : ''}
                                ` : `
                                ${!hidePrices ? `
                                <div style="display:flex; justify-content:space-between; padding: 3px 0;">
                                    <span style="color: #6b7280; font-size: 12px;">Page Subtotal:</span>
                                    <span style="font-weight: bold; font-size: 12px;">Rs. ${pageSubtotal.toLocaleString()}</span>
                                </div>
                                <div style="margin-top: 8px; padding: 8px 10px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 6px; text-align: center;">
                                    <span style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase;">
                                        Products continued on Page ${pageIndex + 2}...
                                    </span>
                                </div>` : `
                                <div style="padding: 8px 10px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 6px; text-align: center;">
                                    <span style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase;">
                                        Products continued on Page ${pageIndex + 2}...
                                    </span>
                                </div>`}
                                `}
                            </div>
                        </div>

                        <!-- SIGNATURE LINES -->
                        <div style="margin-bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                            <div style="border-top: 1px solid #ccc; padding-top: 6px;">
                                <span style="font-size: 8px; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Prepared By</span>
                            </div>
                            <div style="border-top: 1px solid #ccc; padding-top: 6px;">
                                <span style="font-size: 8px; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Authorized Signature</span>
                            </div>
                            <div style="border-top: 1px solid #ccc; padding-top: 6px;">
                                <span style="font-size: 8px; font-weight: bold; color: #9ca3af; text-transform: uppercase;">Receiver Signature</span>
                            </div>
                            <div style="border-top: 1px solid #ccc; padding-top: 6px;">
                                <span style="font-size: 8px; font-weight: bold; color: #9ca3af; text-transform: uppercase;">NIC / Stamp</span>
                            </div>
                        </div>

                        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 8px;">
                            <p style="margin: 0; font-size: 11px; font-weight: 900; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px;">${invoiceFooter}</p>
                            ${receiptFooterInfo ? `<p style="margin: 4px 0; font-size: 9px; color: #6b7280; white-space: pre-line;">${receiptFooterInfo}</p>` : ''}
                            <div style="margin-top: 6px; font-size: 8px; color: #9ca3af; font-weight: bold;">
                                POWERED BY INFINITY CREATIVE WORKS | CONTACT: +94 76 5 449 005
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Minimal - ${docTitle}</title>
                <style>
                    @media print { 
                        @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; } 
                        html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: #fff !important; width: 100% !important; }
                        .page-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-height: 275mm !important;
                            height: 277mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            display: flex !important; 
                            flex-direction: column !important; 
                            justify-content: space-between !important;
                            page-break-after: always !important; 
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            box-sizing: border-box !important;
                            overflow: hidden !important;
                        }
                        .page-container:last-child { page-break-after: auto !important; break-after: auto !important; }
                        .print-footer { margin-top: auto !important; width: 100% !important; box-sizing: border-box !important; background: white !important; }
                        .page-number { display: block !important; }
                    }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f0f0f0; }
                    .page-container { 
                        position: relative; 
                        width: 210mm; 
                        min-height: 297mm; 
                        margin: 15px auto; 
                        padding: 15mm 20mm; 
                        box-sizing: border-box; 
                        background: #fff; 
                        display: flex; 
                        flex-direction: column; 
                        justify-content: space-between;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        page-break-after: always;
                        break-after: page;
                    }
                    .page-container:last-child { page-break-after: auto; break-after: auto; }
                    .print-footer { margin-top: auto; padding-top: 15px; }
                    .page-number { display: block !important; }
                    .page-main-content { flex: 1; display: flex; flex-direction: column; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { border-bottom: 2px solid #333; padding: 8px 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
                    td { border-bottom: 1px solid #eee; padding: 8px 10px; }
                    .text-right { text-align: right; }
                    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                </style>
            </head>
            <body>
                ${pagesHtml}
                ${(returnHtml || isPreview) ? '' : '<script>window.onload = function() { setTimeout(function(){ window.print(); window.close(); }, 500); }</script>'}
            </body>
            </html>
        `;
    }
    // ==========================================
    // TEMPLATE: PROFESSIONAL (Premium)
    // ==========================================
    else {
        const pagesData = paginateItemsForInvoice(sale.items || [], false);
        const totalPages = pagesData.length;

        const themeColor = '#00A9AB';
        const headerFontSize = storeName.length > 30 ? '16px' : storeName.length > 20 ? '19px' : '24px';
        const termsStr = isQuote ? (sale.payment_type ? sale.payment_type.toUpperCase() + (sale.payment_type === 'credit' ? ` (${sale.credit_days || sale.credit_period || 7} Days)` : '') : 'CASH') : (sale.payment_type === 'credit' ? `CREDIT (${sale.credit_days || 7} Days)` : (sale.validity ? `${sale.validity} Days Validity` : (sale.payment_type ? sale.payment_type.toUpperCase() : 'CASH')));
        const deliveryStr = sale.ship_to || 'DELIVERY';
        const poStr = sale.po_number ? `<p style="margin:4px 0; font-size:13px; color:#111827;"><b>PO #:</b> ${sale.po_number}</p>` : '';
        const leadTimeStr = sale.delivery_lead_time ? `<p style="margin:4px 0; font-size:13px; color:#111827;"><b>Lead Time:</b> ${sale.delivery_lead_time}</p>` : '';
        let parsedCustName = custName;

        const pagesHtml = pagesData.map((pageInfo, pageIndex) => {
            const pageItems = pageInfo.items;
            const hasTotals = pageInfo.hasTotals;
            const startIndex = pageInfo.startIndex;

            const profItems = pageItems.map((item, relIdx) => {
                const idx = startIndex + relIdx;
                return `
                    <tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid;">
                        <td align="center" style="padding: 10px 8px; font-size:12px; color: #6b7280;">${idx + 1}</td>
                        <td align="left" style="padding: 10px 8px; font-size:13px;">
                            <div style="font-weight: 900; color: #111827; text-transform: uppercase;">${item.name}</div>
                            ${item.description ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px; font-style: italic; white-space: pre-line;">${item.description}</div>` : ''}
                            ${item.serial ? `<div style="font-size: 10px; color: #00A9AB; margin-top: 3px; font-weight: bold;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</div>` : ''}
                        </td>
                        <td align="center" style="padding: 10px 8px; font-size:12px; font-weight: bold;">${item.warranty || '12 MONTHS'}</td>
                        <td align="center" style="padding: 10px 8px; font-size:12px; font-weight: bold;">${item.qty}</td>
                        ${!hidePrices ? `<td align="right" style="padding: 10px 8px; font-size: 12px; color: #6b7280;">Rs. ${(parseFloat(item.price) || 0).toLocaleString()}</td>
                        <td align="right" style="padding: 10px 8px; font-size: 13px; font-weight: 900; color: #111827;">Rs. ${(parseFloat(item.total || (item.qty * item.price)) || 0).toLocaleString()}</td>` : ''}
                    </tr>
                `;
            }).join('');

            const pageSubtotal = pageItems.reduce((acc, it) => acc + (parseFloat(it.total || (it.qty * it.price)) || 0), 0);

            return `
                <div class="page" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
                    <div class="page-main-content">
                        <!-- HEADER ON EVERY PAGE -->
                        <div class="invoice-header">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom: 10px; margin-bottom: 5px;">
                                <div style="display:flex; align-items:center; gap: 20px;">
                                    ${storeLogo ? `<img src="${storeLogo}" style="max-height: 75px; max-width: 120px; object-fit: contain;">` : ''}
                                    <div>
                                        <h1 style="margin:0; font-size:${headerFontSize}; font-weight:900; color:${themeColor}; text-transform:uppercase;">${storeName}</h1>
                                        ${enabledStoreSubheading && storeSubheading ? `<p style="margin:2px 0; font-size:11px; color:#111827; font-weight: bold; text-transform:uppercase;">${storeSubheading}</p>` : ''}
                                        ${enabledStoreAddress && storeAddress ? `<p style="margin:2px 0; font-size:10px; color:#4b5563; font-weight: 500;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                                        <div style="font-size:10px; color:#4b5563; margin-top: 5px; white-space: nowrap;">
                                            ${storePhone ? `+${storePhone.replace('+', '')}` : ''} | ${storeEmail} | ${storeWebsite} | BR: ${storeBR}
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <h2 style="margin:0; font-size:28px; font-weight:900; color:#111827; letter-spacing:1px;">${docTitle}</h2>
                                    <div style="margin-top: 10px; font-size: 13px; color: #111827;">
                                        <p style="margin:2px 0;"><b>Doc No:</b> ${getInvoiceDisplayNumber(sale)}</p>
                                        <p style="margin:2px 0;"><b>Date:</b> ${dateStr}</p>
                                        ${!isQuote && settlementInfo && settlementInfo.isSettled ? `
                                            <div style="margin-top: 6px;">
                                                <span style="display: inline-block; padding: 4px 14px; background: #ecfdf5; color: #047857; border: 2px solid #10b981; border-radius: 6px; font-size: 13px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
                                                    ✓ PAID
                                                </span>
                                            </div>
                                        ` : (!isQuote && settlementInfo && settlementInfo.isCredit ? `
                                            <div style="margin-top: 6px;">
                                                <span style="display: inline-block; padding: 4px 12px; background: #fffbeb; color: #b45309; border: 2px solid #f59e0b; border-radius: 6px; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                                                    CREDIT UNPAID
                                                </span>
                                            </div>
                                        ` : '')}
                                    </div>
                                </div>
                            </div>

                            <div style="border-top: 1px solid #eee; margin-top: 5px; margin-bottom: 10px;"></div>

                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <div style="width: 55%; background:#f9fafb; padding:15px; border-radius:4px; position: relative;">
                                    <h3 style="margin-top:0; font-size:10px; color:${themeColor}; text-transform:uppercase; letter-spacing:1px; font-weight:900; margin-bottom: 8px;">Bill To / Ship To:</h3>
                                    <p style="margin:0; font-size:16px; font-weight:900; color:#111827; text-transform: uppercase;">${parsedCustName}</p>
                                    <p style="margin:5px 0; font-size:12px; color:#4b5563;">${custAddress}</p>
                                    <p style="margin:5px 0; font-size:12px; color:#111827;"><b>Contact:</b> ${custPhone}</p>
                                </div>
                                <div style="width: 40%; text-align: right; padding-top: 5px;">
                                    <p style="font-size: 10px; color: ${themeColor}; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">DETAILS:</p>
                                    ${isQuote ? `
                                        <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Validity:</b> <span style="font-weight:900; color:#b45309;">${sale.validity || '7'} Days</span></p>
                                        <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Terms:</b> ${termsStr}</p>
                                    ` : `
                                        <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Terms:</b> ${termsStr}</p>
                                        ${settlementInfo && settlementInfo.isSettled ? `
                                            <p style="margin:4px 0; font-size:13px; color:#047857;"><b>Payment Status:</b> <span style="color:#047857; font-weight:900; background:#dcfce7; padding:2px 8px; border-radius:4px;">PAID</span></p>
                                            <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Settlement:</b> <span style="font-weight:900; color:#0f766e;">${settlementInfo.methodTitle}</span></p>
                                        ` : `
                                            <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Payment Status:</b> <span style="color:#b45309; font-weight:900; background:#fef3c7; padding:2px 8px; border-radius:4px;">UNPAID</span></p>
                                        `}
                                    `}
                                    <p style="margin:4px 0; font-size:13px; color:#111827;"><b>Rep:</b> ${repDisplay}</p>
                                    ${poStr}
                                    ${leadTimeStr}
                                    <p class="page-number" style="margin:4px 0; font-size:12px; font-weight: bold; color: #111827;">Page ${pageIndex + 1} of ${totalPages}</p>
                                    <p style="margin:8px 0; font-size:13px; font-weight: 900; color: #D97706; text-transform: uppercase;">[${deliveryStr}]</p>
                                </div>
                            </div>
                        </div>

                        <!-- PRODUCTS TABLE -->
                        <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
                            <thead>
                                <tr style="background: ${themeColor}; color: #fff; -webkit-print-color-adjust: exact;">
                                    <th align="center" width="5%" style="padding:10px; font-size:12px; font-weight: 900; border: none;">#</th>
                                    <th align="left" width="${hidePrices ? '70%' : '45%'}" style="padding:10px; font-size:12px; font-weight: 900; border: none;">Description</th>
                                    <th align="center" width="15%" style="padding:10px; font-size:12px; font-weight: 900; border: none;">Warranty</th>
                                    <th align="center" width="10%" style="padding:10px; font-size:12px; font-weight: 900; border: none;">Qty</th>
                                    ${!hidePrices ? `<th align="right" width="12%" style="padding:10px; font-size:12px; font-weight: 900; border: none;">Price</th>
                                    <th align="right" width="13%" style="padding:10px; font-size:12px; font-weight: 900; border: none;">Total</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${profItems}
                            </tbody>
                        </table>

                    </div>

                    <!-- FOOTER MUST BE ON EVERY PAGE -->
                    <div class="print-footer" style="margin-top: auto; padding-top: 10px;">
                        <!-- ACCOUNT DETAILS & TOTALS / SUBTOTAL SECTION (PRESENT ON EVERY PAGE, INCLUDING PAGE 1) -->
                        <div style="display:flex; justify-content:space-between; align-items: flex-end; margin-bottom: 15px;">
                            <div style="width: 44%;">
                                <!-- Settlement Card (if settled) -->
                                ${!isQuote ? settlementCardHtml : ''}
                                <!-- Account Details -->
                                ${bankDetails ? `
                                <div style="font-size:10px; color:#111827; padding:10px 12px; background:#f9fafb; border: 1px solid #e5e7eb; border-radius:8px;">
                                    <h4 style="margin:0 0 6px 0; font-size:9px; color:${themeColor}; text-transform:uppercase; font-weight:900; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">Account / Bank Transfer Details:</h4>
                                    ${bankDetails.split('\n').map(line => `<p style="margin:2px 0;">${line}</p>`).join('')}
                                </div>` : ''}
                                ${chequeName ? `
                                <div style="font-size:9px; color:#111827; padding:8px 10px; border: 1px solid #e5e7eb; border-radius:8px; margin-top: 6px;">
                                    <h4 style="margin:0 0 4px 0; font-size:8px; color:${themeColor}; text-transform:uppercase; font-weight:900;">Make cheques payable to:</h4>
                                    <p style="margin:0; font-weight: 900;">${chequeName}</p>
                                </div>` : ''}
                                ${paymentQR ? `
                                <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                                    <img src="${paymentQR}" style="max-height: 50px; max-width: 50px; border: 1px solid #e5e7eb; padding: 2px; border-radius: 6px;">
                                    <span style="font-size: 9px; color: #6b7280; font-weight: bold;">Scan to Pay via QR</span>
                                </div>` : ''}
                            </div>
                            
                            <div style="width: 46%;">
                                ${hasTotals ? `
                                <!-- Subtotal & Grand Total -->
                                ${!hidePrices ? `
                                <div style="display:flex; flex-direction: column; align-items: flex-end;">
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#4b5563;">
                                        <span>Subtotal</span>
                                        <span style="font-weight: bold; color: #111827;">Rs. ${(parseFloat(sale.subtotal || sale.total) || 0).toLocaleString()}</span>
                                    </div>
                                    ${sale.discount > 0 ? `
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#ef4444;">
                                        <span>Total Savings:</span>
                                        <span style="font-weight: bold;">- Rs. ${(parseFloat(sale.discount) || 0).toLocaleString()}</span>
                                    </div>` : ''}
                                    ${sale.delivery_charge > 0 ? `
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#4b5563;">
                                        <span>Delivery:</span>
                                        <span style="font-weight: bold; color: #111827;">+ Rs. ${(parseFloat(sale.delivery_charge) || 0).toLocaleString()}</span>
                                    </div>` : ''}
                                    ${taxEnabled ? `
                                    <div style="width: 100%; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e5e7eb; font-size: 11px; color: #6b7280;">
                                        <div style="display:flex; justify-content:space-between; padding: 2px 0;">
                                            <span>Taxable Total:</span>
                                            <span>Rs. ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; padding: 2px 0;">
                                            <span>VAT (${vatPercent}%):</span>
                                            <span>Rs. ${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>` : ''}
                                    <div style="width: 100%; background: ${themeColor}; color: #fff; padding: 10px 18px; border-radius: 10px; margin-top: 6px; display: flex; justify-content: center; align-items: center;">
                                        <h2 style="margin: 0; font-size: 18px; font-weight: 900;">Total: Rs. ${parseFloat(sale.total).toLocaleString()}</h2>
                                    </div>
                                    ${!isQuote ? `
                                    ${(settlementInfo && settlementInfo.isSettled) || (parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : sale.amount_paid) > 0) ? `
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#16a34a; font-weight:bold; margin-top:4px;">
                                        <span>Amount Paid:</span>
                                        <span>Rs. ${(parseFloat(sale.paid_amount !== undefined ? sale.paid_amount : (sale.amount_paid || sale.total)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    ` : ''}
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:${customerTotalDue > 0 ? '#ef4444' : '#16a34a'}; font-weight:900; margin-top:4px;">
                                        <span>Balance Due:</span>
                                        <span>Rs. ${customerTotalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${customerTotalDue <= 0 ? ' (PAID)' : ((!settlementInfo || !settlementInfo.isSettled) ? ' (UNPAID)' : '')}</span>
                                    </div>
                                    ` : ''}
                                </div>` : ''}
                                ` : `
                                <!-- Continuation Page: Page Subtotal & Continuation Notice -->
                                ${!hidePrices ? `
                                <div style="display:flex; flex-direction: column; align-items: flex-end;">
                                    <div style="width: 100%; display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#4b5563;">
                                        <span>Page Subtotal</span>
                                        <span style="font-weight: bold; color: #111827;">Rs. ${pageSubtotal.toLocaleString()}</span>
                                    </div>
                                    <div style="width: 100%; background: #f9fafb; border: 1px dashed #d1d5db; padding: 10px 14px; border-radius: 8px; margin-top: 6px; display: flex; justify-content: center; align-items: center;">
                                        <span style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">
                                            <i class="fa-solid fa-arrow-turn-down" style="color:${themeColor}; margin-right:6px;"></i> Products continued on Page ${pageIndex + 2}...
                                        </span>
                                    </div>
                                </div>` : `
                                <div style="width: 100%; background: #f9fafb; border: 1px dashed #d1d5db; padding: 10px 14px; border-radius: 8px; margin-top: 6px; display: flex; justify-content: center; align-items: center;">
                                    <span style="font-size: 11px; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">
                                        <i class="fa-solid fa-arrow-turn-down" style="color:${themeColor}; margin-right:6px;"></i> Products continued on Page ${pageIndex + 2}...
                                    </span>
                                </div>`}
                                `}
                            </div>
                        </div>

                        <!-- SIGNATURE LINES -->
                        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 8px;">
                            ${['PREPARED BY', 'AUTHORIZED BY', 'RECEIVER NAME', 'CUSTOMER SIGNATURE', 'NIC NUMBER'].map(label => `
                                <div style="text-align: center;">
                                    <div style="border-bottom: 1px solid #d1d5db; height: 26px; margin-bottom: 5px;"></div>
                                    <p style="margin: 0; font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                                </div>
                            `).join('')}
                        </div>

                        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 6px; margin-top: 4px;">
                            <h3 style="margin:0; font-size:11px; font-weight:900; color:#111827; text-transform:uppercase; letter-spacing:1px;">${invoiceFooter}</h3>
                            ${receiptFooterInfo ? `<p style="margin:3px 0; font-size:8px; color:#6b7280; line-height: 1.3; max-width: 95%; margin-left:auto; margin-right:auto;">${receiptFooterInfo}</p>` : ''}
                            <div style="margin-top: 4px; font-size:8px; color:#9ca3af;">
                                Contact: ${storePhone ? `+${storePhone.replace('+', '')}` : '+94 77 51 65 589'} | ${storeEmail || 'info@mobilemate.lk'} | ${storeWebsite || 'www.mobilemate.lk'}
                            </div>
                            <div style="margin-top: 2px; font-size:8px; color:#111827; font-weight:bold;">
                                Powered by INFINITY CREATIVE WORKS
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${docTitle} - ${getInvoiceDisplayNumber(sale)}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    @media print { 
                        @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; } 
                        html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: #fff !important; width: 100% !important; }
                        .page { 
                            width: 100% !important;
                            max-width: 100% !important;
                            min-height: 275mm !important;
                            height: 277mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            display: flex !important; 
                            flex-direction: column !important; 
                            justify-content: space-between !important;
                            page-break-after: always !important; 
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: hidden !important; 
                            box-sizing: border-box !important;
                        }
                        .page:last-child { page-break-after: auto !important; break-after: auto !important; }
                        .print-footer { margin-top: auto !important; width: 100% !important; box-sizing: border-box !important; background: white !important; }
                        .page-number { display: block !important; }
                    }
                    html, body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f0f0f0; }
                    .page { 
                        background: #fff; 
                        width: 210mm; 
                        min-height: 297mm; 
                        margin: 15px auto; 
                        padding: 12mm; 
                        box-sizing: border-box; 
                        display: flex; 
                        flex-direction: column; 
                        justify-content: space-between;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        page-break-after: always;
                        break-after: page;
                    }
                    .page:last-child { page-break-after: auto; break-after: auto; }
                    .page-number { display: block !important; }
                    .page-main-content { flex: 1; display: flex; flex-direction: column; }
                    table { width: 100%; border-collapse: collapse; }
                    .text-teal { color: ${themeColor}; }
                    .bg-teal { background-color: ${themeColor}; }
                    .border-teal { border-color: ${themeColor}; }
                    @media screen {
                        .print-footer { margin-top: auto; padding-top: 15px; }
                        .spacer-footer { display: none; }
                        thead { display: table-header-group; }
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
                ${(returnHtml || isPreview) ? '' : '<script>window.onload=function(){setTimeout(function(){window.print();window.close();},500);}<\/script>'}
            </body>
            </html>
        `;
    }

    if (returnHtml) return html;


    if (isPreview) {
        if (typeof openPreviewModal === 'function') {
            openPreviewModal(
                html,
                () => printInvoice(id, layout, false, true, false, null, forceType),
                () => editSale(id, true),
                () => printInvoice(id, layout, false, true, false, null, 'delivery_note'),
                (html) => shareViaOutlook(id, html),
                (html) => {
                    if (typeof generatePDFAndShare === 'function') {
                        generatePDFAndShare(html, `${getInvoiceDisplayNumber(sale)}.pdf`, { forceDownload: true });
                    }
                }
            );
        } else {
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); }
        }
    } else {
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    }
}
window.previewInvoice = function(saleId) {
    if (typeof printInvoice === 'function') {
        printInvoice(saleId, null, true, true);
    }
};

/**
 * Premium Delivery Note Template
 */
async function printPremiumDeliveryNote(sale, opts, isPreview, returnHtml) {
    const storeName = opts['store_name'] || 'MobileMate';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const enabledStoreSubheading = opts['enabled_store_subheading'] !== false;
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const storeLogo = opts['store_logo'] || '';
    const invoiceColor = opts['invoice_color'] || '#4F46E5';

    let custName = sale.customer_name || 'Walk-in Customer';
    let custAddress = 'N/A';
    let custPhone = 'N/A';

    if (sale.customer_id) {
        let c = await db.customers.get(sale.customer_id);
        if (c) {
            custName = c.name || custName;
            custAddress = c.address || 'N/A';
            custPhone = c.phone || 'N/A';
        }
    }

    const MAX_ITEMS_PER_PAGE = 10;
    const pagesData = [];
    for (let i = 0; i < (sale.items || []).length; i += MAX_ITEMS_PER_PAGE) {
        pagesData.push((sale.items || []).slice(i, i + MAX_ITEMS_PER_PAGE));
    }
    if (pagesData.length === 0) pagesData.push([]);
    const totalPages = pagesData.length;

    const pagesHtml = pagesData.map((pageItems, pageIndex) => {
        const itemsRows = pageItems.map((item, relIdx) => {
            const idx = (pageIndex * MAX_ITEMS_PER_PAGE) + relIdx;
            return `
                    <tr style="border-bottom: 2px solid #f3f4f6; page-break-inside: avoid;">
                        <td align="center" style="padding: 12px 10px;">${idx + 1}</td>
                        <td align="left" style="padding: 12px 10px;">
                            <b style="font-size: 14px; text-transform: uppercase;">${item.name}</b><br>
                            ${item.description ? `<small style="color: #6b7280;">${item.description}</small><br>` : ''}
                            ${item.serial ? `<small style="color: #1a1a1a; font-weight:bold;">S/N:<br>${item.serial.split(',').map(s => s.trim()).join('<br>')}</small>` : ''}
                        </td>
                        <td align="center" style="padding: 12px 10px; font-weight: bold; font-size: 15px;">${item.qty} ${item.unit || 'PCS'}</td>
                        <td align="center" style="padding: 12px 10px; font-weight: bold;">${item.warranty || 'N/A'}</td>
                    </tr>
                `;
        }).join('');

        return `
                <div class="page" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
                    <table>
                        <thead>
                            <tr>
                                <th colspan="4" style="font-weight:normal; text-align:left; border:none; padding:0; margin:0;">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 4px solid ${invoiceColor}; padding-bottom: 15px; margin-bottom: 12px;">
                                        <div style="display:flex; align-items:center; gap: 20px;">
                                            ${storeLogo ? `<img src="${storeLogo}" style="max-height: 80px;">` : ''}
                                            <div>
                                                <h1 style="margin:0; font-size: 28px; font-weight: 900; color: ${invoiceColor};">${storeName.toUpperCase()}</h1>
                                                ${enabledStoreSubheading && storeSubheading ? `<p style="margin:2px 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; color: #6b7280;">PREMIUM LOGISTICS PROTOCOL</p>` : ''}
                                                ${enabledStoreAddress && storeAddress ? `<p style="margin:2px 0; font-size:10px; color:#4b5563;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                                            </div>
                                        </div>
                                        <div style="text-align:right;">
                                            <h2 style="margin:0; font-size: 22px; font-weight: 900; color: #111827;">DELIVERY NOTE</h2>
                                            <p style="margin:5px 0; font-weight: bold; color: #4b5563;">REF: ${getInvoiceDisplayNumber(sale)}</p>
                                            <p style="margin:5px 0; font-size: 12px; color: #9ca3af;">DATE: ${new Date(sale.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 12px;">
                                        <div style="background: #f9fafb; padding: 12px 15px; border-radius: 16px;">
                                            <h3 style="margin-top:0; font-size: 11px; color: ${invoiceColor}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">CONSIGNEE / RECIPIENT:</h3>
                                            <p style="margin:0; font-size: 16px; font-weight: 900; color: #111827;">${custName}</p>
                                            <p style="margin:4px 0; font-size: 12px; color: #4b5563;">${custAddress}</p>
                                            <p style="margin:4px 0; font-size: 12px; color: #4b5563;"><b>PHONE:</b> ${custPhone}</p>
                                        </div>
                                        <div style="padding: 12px 15px;">
                                            <h3 style="margin-top:0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">FULFILLMENT STATUS:</h3>
                                            <p style="margin:0; font-size: 13px; font-weight: bold;">MODE: PHYSICAL SHIPMENT</p>
                                            <p style="margin:4px 0; font-size: 13px; font-weight: bold;">ORIGIN: MAIN WAREHOUSE</p>
                                            <p class="page-number" style="margin:4px 0; font-size: 12px; font-weight: bold; color: #111827;">Page ${pageIndex + 1} of ${totalPages}</p>
                                            <p style="margin:8px 0 0; font-size: 11px; font-weight: bold; color: #ef4444; border: 1px solid #fee2e2; background: #fef2f2; padding: 6px 12px; border-radius: 8px; display: inline-block;">INTERNAL REF: SALE-${sale.id}</p>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr style="-webkit-print-color-adjust: exact;">
                                <th align="center" style="background: ${invoiceColor}; color: #fff; padding: 12px 10px;">ID</th>
                                <th align="left" style="background: ${invoiceColor}; color: #fff; padding: 12px 10px;">ITEM DESCRIPTION & SERIAL NUMBERS</th>
                                <th align="center" style="background: ${invoiceColor}; color: #fff; padding: 12px 10px;">QUANTITY</th>
                                <th align="center" style="background: ${invoiceColor}; color: #fff; padding: 12px 10px;">WARRANTY</th>
                            </tr>
                        </thead>
                        <tbody>${itemsRows}</tbody>
                    </table>

                    <!-- FOOTER MUST BE ON EVERY PAGE -->
                    <div class="print-footer">
                        <div style="margin-bottom: 25px; grid-template-columns: repeat(3, 1fr); display: grid; gap: 30px; text-align: center;">
                            <div>
                                <div style="border-bottom: 1px solid #111827; height: 35px; margin-bottom: 6px;"></div>
                                <p style="margin:0; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase;">ISSUED BY</p>
                            </div>
                            <div>
                                <div style="border-bottom: 1px solid #111827; height: 35px; margin-bottom: 6px;"></div>
                                <p style="margin:0; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase;">CHECKED BY</p>
                            </div>
                            <div>
                                <div style="border-bottom: 1px solid #111827; height: 35px; margin-bottom: 6px;"></div>
                                <p style="margin:0; font-size: 10px; font-weight: 900; color: #6b7280; text-transform: uppercase;">RECEIVED BY (SIGN & SEAL)</p>
                            </div>
                        </div>

                        <div style="padding-top: 10px; text-align: center;">
                            <div style="background: #111827; color: #fff; padding: 12px 20px; border-radius: 16px;">
                                <p style="margin:0; font-size: 11px; font-weight: bold; letter-spacing: 1px;">PLEASE INSPECT ALL ITEMS UPON DELIVERY. NO CLAIMS ACCEPTED AFTER SIGNING.</p>
                                <p style="margin:4px 0 0; font-size: 10px; opacity: 0.6;">THANK YOU FOR YOUR VALUED BUSINESS</p>
                            </div>
                            <p style="margin-top: 10px; font-size: 9px; color: #9ca3af; font-weight: bold;">POWERED BY INFINITY CREATIVE WORKS</p>
                        </div>
                    </div>
                </div>
            `;
    }).join('');

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>DELIVERY NOTE - ${getInvoiceDisplayNumber(sale)}</title>
                <style>
                    @media print { 
                        @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; } 
                        html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0 !important; padding: 0 !important; background: #fff !important; width: 100% !important; }
                        .page { 
                            width: 100% !important;
                            max-width: 100% !important;
                            min-height: 277mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            border: none !important;
                            display: flex !important; 
                            flex-direction: column !important; 
                            page-break-after: always !important; 
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: visible !important; 
                            box-sizing: border-box !important;
                        }
                        .page:last-child { page-break-after: auto !important; break-after: auto !important; }
                        .print-footer { margin-top: auto !important; width: 100%; box-sizing: border-box; background: white; }
                        .page-number { display: block !important; }
                    }
                    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
                    .page { width: 210mm; min-height: 297mm; margin: 15px auto; background: #fff; padding: 15mm; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.08); display: flex; flex-direction: column; page-break-after: always; break-after: page; }
                    .page:last-child { page-break-after: auto; break-after: auto; }
                    .page-number { display: block !important; }
                    table { width: 100%; border-collapse: collapse; }
                </style>
            </head>
            <body>
                ${pagesHtml}
                ${(returnHtml || isPreview) ? '' : '<script>window.onload = function() { window.print(); window.close(); }</script>'}
            </body>
            </html>
        `;

    if (returnHtml) return html;

    if (isPreview) {
        if (typeof openPreviewModal === 'function') {
            openPreviewModal(
                html,
                () => printPremiumDeliveryNote(sale, opts, false),
                null,
                null,
                (html) => shareViaOutlook(sale.id, html),
                (html) => { if (typeof generatePDFAndShare === 'function') generatePDFAndShare(html, `DN_${getInvoiceDisplayNumber(sale)}.pdf`, { forceDownload: true }); }
            );
        } else {
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); }
        }
    } else {
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    }
}