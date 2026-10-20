// Warranty Tracking Logic
async function loadWarrantyTracker() {
    console.log("Loading Warranty Tracker...");
    const container = document.getElementById('warranty-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden h-full flex flex-col">
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <i class="fa-solid fa-shield-halved text-primary"></i>
                        Warranty Intelligence
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track item warranty status and expiration across all customers.</p>
                </div>
                
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="warranty-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="warranty-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="warranty-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-64 transition-colors" placeholder="Search S/N, Customer or SKU...">
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-auto custom-scrollbar p-0">
                <table class="w-full text-left border-collapse min-w-[900px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Item Detail</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Serial Number</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Supplier & GRN</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Customer & Sale</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Sale Date</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Status</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="warranty-list-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                        <tr><td colspan="7" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const refreshWarranty = () => {
        const query = document.getElementById('warranty-search')?.value || '';
        const start = document.getElementById('warranty-start-date')?.value || '';
        const end = document.getElementById('warranty-end-date')?.value || '';
        renderWarrantyList(query, start, end);
    };

    document.getElementById('warranty-search').addEventListener('input', refreshWarranty);
    document.getElementById('warranty-start-date').addEventListener('change', refreshWarranty);
    document.getElementById('warranty-end-date').addEventListener('change', refreshWarranty);

    renderWarrantyList('', firstDay, lastDay);
}

async function renderWarrantyList(query = '', startDate = null, endDate = null) {
    const tbody = document.getElementById('warranty-list-body');
    if (!tbody) return;

    const startVal = startDate || document.getElementById('warranty-start-date')?.value || '';
    const endVal = endDate || document.getElementById('warranty-end-date')?.value || '';

    // Get all sales that are invoices
    const sales = await db.sales.where('document_type').equals('invoice').reverse().toArray();
    const grns = await db.grn.toArray();

    let items = [];
    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            let supplierName = 'N/A';
            let purchaseInvoice = 'N/A';
            let grnId = null;

            if (item.serial) {
                for (const grn of grns) {
                    for (const gItem of (grn.items || [])) {
                        if (gItem.product_id === item.product_id && gItem.serials && gItem.serials.includes(item.serial)) {
                            supplierName = grn.vendor_name || 'Walk-in Vendor';
                            purchaseInvoice = grn.invoice_ref || (grn.po_id ? 'PO-' + grn.po_id : 'GRN-' + grn.id);
                            grnId = grn.id;
                            break;
                        }
                    }
                    if (grnId) break;
                }
            }

            items.push({
                ...item,
                sale_id: sale.id,
                invoice_number: getInvoiceDisplayNumber(sale),
                sale_date: sale.date,
                customer_name: sale.customer_name || 'Walk-in Customer',
                supplierName,
                purchaseInvoice,
                grnId
            });
        });
    });

    if (startVal && endVal) {
        items = items.filter(i => {
            const d = i.sale_date.split('T')[0];
            return d >= startVal && d <= endVal;
        });
    }

    if (query) {
        const q = query.toLowerCase();
        items = items.filter(i =>
            (i.name && i.name.toLowerCase().includes(q)) ||
            (i.sku && i.sku.toLowerCase().includes(q)) ||
            (i.serial && i.serial.toLowerCase().includes(q)) ||
            (i.customer_name && i.customer_name.toLowerCase().includes(q)) ||
            (i.supplierName && i.supplierName.toLowerCase().includes(q)) ||
            (i.purchaseInvoice && i.purchaseInvoice.toLowerCase().includes(q))
        );
    }

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-gray-400 italic">No warranty records discovered.</td></tr>';
        return;
    }

    let html = '';
    items.forEach(i => {
        // Filter out items with no warranty
        if (!i.warranty || i.warranty.toLowerCase().includes('no warranty') || i.warranty === 'N/W' || i.warranty === 'N/A') {
            return;
        }

        const purchaseDate = new Date(i.sale_date);
        const { status, expiryDate, colorClass } = calculateWarrantyStatus(purchaseDate, i.warranty);

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-sm">
                <td class="p-4">
                    <p class="font-bold text-gray-900 dark:text-white">${i.name}</p>
                    <p class="text-[10px] text-gray-500 font-mono uppercase">${i.sku || 'N/A'}</p>
                </td>
                <td class="p-4">
                    <div class="flex flex-col gap-1">
                        ${(i.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s).map(s => `
                            <button onclick="showWarrantyDetail('${s.replace(/'/g, "\\'")}')" class="font-mono text-[10px] text-primary font-bold hover:underline text-left">
                                ${s}
                            </button>
                        `).join('') || '<span class="text-gray-400">NO S/N</span>'}
                    </div>
                </td>
                <td class="p-4">
                    <p class="font-bold text-gray-700 dark:text-gray-300 text-[11px]">${i.supplierName}</p>
                    <p class="text-[10px] text-gray-400 font-mono uppercase mt-0.5">${i.purchaseInvoice}</p>
                </td>
                <td class="p-4">
                    <p class="font-medium text-gray-700 dark:text-gray-300 text-xs">${i.customer_name}</p>
                    <p class="text-[10px] text-gray-400 uppercase mt-0.5">${i.invoice_number}</p>
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-400">
                    ${purchaseDate.toLocaleDateString()}
                    <p class="text-[10px] text-gray-400 uppercase mt-0.5">${i.warranty || 'No Warranty'}</p>
                </td>
                <td class="p-4">
                    <div class="flex flex-col">
                        <span class="${colorClass} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit">
                            ${status}
                        </span>
                        <p class="text-[10px] text-gray-500 mt-1">${status === 'N/A' ? 'No Warranty' : `Expires: ${expiryDate.toLocaleDateString()}`}</p>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <button onclick="printInvoice(${i.sale_id}, null, true, true)" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Sale">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button onclick="printWarrantySticker(${i.sale_id}, '${i.serial}')" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Print Tracking Sticker">
                        <i class="fa-solid fa-barcode"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function calculateWarrantyStatus(purchaseDate, warrantyStr) {
    if (!warrantyStr || warrantyStr.toLowerCase().includes('no warranty') || warrantyStr === 'N/W') {
        return { status: 'N/A', expiryDate: purchaseDate, colorClass: 'bg-gray-100 text-gray-500' };
    }

    let days = 0;
    const w = warrantyStr.toUpperCase();

    // Custom mapping as per user rules previously seen (1 Year = 350 Days base)
    if (w.includes('1Y') || w.includes('1 YEAR')) days = 350;
    else if (w.includes('2Y') || w.includes('2 YEAR')) days = 700;
    else if (w.includes('3Y') || w.includes('3 YEAR')) days = 1050;
    else if (w.includes('6M') || w.includes('6 MONTH')) days = 175;
    else if (w.includes('7D')) days = 7;
    else if (w.includes('14D')) days = 14;
    else if (w.includes('30D') || w.includes('1M')) days = 30;
    else {
        // Generic parser for flexible durations like "24 MONTHS" or "24M"
        const matches = w.match(/(\d+)[-\s]*(YEAR|MONTH|WEEK|DAY|Y|M|W|D)S?/);
        if (matches) {
            const num = parseInt(matches[1]);
            const unit = matches[2];
            if (unit.startsWith('Y')) days = num * 350;
            else if (unit.startsWith('M')) days = Math.floor(num * (350 / 12));
            else if (unit.startsWith('W')) days = num * 7;
            else if (unit.startsWith('D')) days = num;
        }
    }

    if (days === 0) return { status: 'N/A', expiryDate: purchaseDate, colorClass: 'bg-gray-100 text-gray-500' };

    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + days);

    const now = new Date();
    if (now > expiryDate) {
        return { status: 'Expired', expiryDate, colorClass: 'bg-red-100 text-red-600' };
    } else {
        const diffTime = Math.abs(expiryDate - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
            return { status: 'Expiring Soon', expiryDate, colorClass: 'bg-amber-100 text-amber-600' };
        }
        return { status: 'In Warranty', expiryDate, colorClass: 'bg-emerald-100 text-emerald-600' };
    }
}

async function printWarrantySticker(saleId, serial) {
    showAlert('Info', 'Thermal Warranty Sticker printing requires label printer configuration.', 'info');
}

async function showWarrantyDetail(serial) {
    if (!serial) return;

    console.log("Fetching Intelligence for S/N:", serial);
    const modal = document.getElementById('warranty-detail-modal');
    const snText = document.getElementById('warranty-detail-sn');
    const purchaseHistoryDir = document.getElementById('warranty-purchase-history');
    const salesHistoryDir = document.getElementById('warranty-sales-history');
    const progressBar = document.getElementById('lifecycle-progress-bar');
    const soldIcon = document.getElementById('step-sold-icon');
    const soldIconFa = document.getElementById('step-sold-icon-fa');
    const warrantyIcon = document.getElementById('step-warranty-icon');
    const warrantyIconFa = document.getElementById('step-warranty-icon-fa');

    if (!modal) return;

    snText.innerText = `S/N: ${serial}`;
    purchaseHistoryDir.innerHTML = '<div class="animate-pulse flex space-x-4"><div class="flex-1 space-y-4 py-1"><div class="h-4 bg-gray-200 rounded w-3/4"></div><div class="space-y-2"><div class="h-4 bg-gray-200 rounded"></div><div class="h-4 bg-gray-200 rounded w-5/6"></div></div></div></div>';
    salesHistoryDir.innerHTML = purchaseHistoryDir.innerHTML;

    // Reset Progress
    progressBar.style.width = '0%';
    soldIcon.className = 'w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center z-10 transition-colors';
    soldIconFa.className = 'fa-solid fa-cash-register text-xs text-gray-300 transition-colors';
    warrantyIcon.className = 'w-10 h-10 rounded-full bg-white dark:bg-gray-900 border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center z-10 transition-colors';
    warrantyIconFa.className = 'fa-solid fa-shield-halved text-xs text-gray-300 transition-colors';

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // 1. Fetch Purchase History (GRN)
    const grns = await db.grn.toArray();
    let purchaseItems = [];
    grns.forEach(grn => {
        (grn.items || []).forEach(item => {
            if (item.serials && item.serials.includes(serial)) {
                purchaseItems.push({
                    ...item,
                    grn_id: grn.id,
                    vendor_name: grn.vendor_name || 'Walk-in Vendor',
                    date: grn.date,
                    invoice_ref: grn.invoice_ref || (grn.po_id ? 'PO-' + grn.po_id : 'GRN-' + grn.id)
                });
            }
        });
    });

    // 2. Fetch Sales History
    const sales = await db.sales.where('document_type').equals('invoice').toArray();
    let saleItems = [];
    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            if (item.serial === serial) {
                saleItems.push({
                    ...item,
                    sale_id: sale.id,
                    sale_obj: sale,
                    customer_name: sale.customer_name || 'Walk-in Customer',
                    date: sale.date,
                    price: item.price
                });
            }
        });
    });

    // Render Purchase History
    if (purchaseItems.length === 0) {
        purchaseHistoryDir.innerHTML = '<p class="text-sm italic text-gray-400">No procurement records found for this serial.</p>';
    } else {
        let phtml = '';
        purchaseItems.forEach(pi => {
            phtml += `
                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/30 transition-all group">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-gray-900 dark:text-white">${pi.vendor_name}</p>
                            <p class="text-[10px] text-gray-500 font-mono uppercase mt-0.5">${pi.invoice_ref}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-bold text-gray-700 dark:text-gray-300">${new Date(pi.date).toLocaleDateString()}</p>
                            <p class="text-[10px] text-emerald-600 font-bold mt-1">Cost: ${formatCurrency(pi.cost || 0)}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        purchaseHistoryDir.innerHTML = phtml;
        progressBar.style.width = '25%';
    }

    // Render Sales History
    if (saleItems.length === 0) {
        salesHistoryDir.innerHTML = '<p class="text-sm italic text-gray-400">This item has not been sold yet.</p>';
    } else {
        let shtml = '';
        saleItems.forEach(si => {
            shtml += `
                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-gray-900 dark:text-white">${si.customer_name}</p>
                            <p class="text-[10px] text-gray-500 font-mono uppercase mt-0.5">${getInvoiceDisplayNumber(si.sale_obj)}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-bold text-gray-700 dark:text-gray-300">${new Date(si.date).toLocaleDateString()}</p>
                            <p class="text-[10px] text-primary font-bold mt-1">Sold at: ${formatCurrency(si.price || 0)}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        salesHistoryDir.innerHTML = shtml;

        // Update Progress UI
        progressBar.style.width = '60%';
        soldIcon.classList.remove('border-gray-100', 'dark:border-gray-800');
        soldIcon.classList.add('border-primary');
        soldIconFa.classList.remove('text-gray-300');
        soldIconFa.classList.add('text-primary');

        // Check Warranty Status for last sale
        const lastSale = saleItems[saleItems.length - 1];
        const purchaseDate = new Date(lastSale.date);
        const { status } = calculateWarrantyStatus(purchaseDate, lastSale.warranty);

        if (status === 'In Warranty' || status === 'Expiring Soon') {
            progressBar.style.width = '100%';
            warrantyIcon.classList.remove('border-gray-100', 'dark:border-gray-800');
            warrantyIcon.classList.add('border-primary');
            warrantyIconFa.classList.remove('text-gray-300');
            warrantyIconFa.classList.add('text-primary');
        } else if (status === 'Expired') {
            progressBar.style.width = '100%';
            warrantyIcon.classList.remove('border-gray-100', 'dark:border-gray-800');
            warrantyIcon.classList.add('border-red-500');
            warrantyIconFa.classList.remove('text-gray-300');
            warrantyIconFa.classList.add('text-red-500');
        }
    }
}

function closeWarrantyDetailModal() {
    const modal = document.getElementById('warranty-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

