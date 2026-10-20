let currentCommissionTab = 'list';

async function loadCommissions() {
    const container = document.getElementById('commissions-view');
    if (!container) return;

    try {
        container.innerHTML = `
            <div class="space-y-8 animate-fade-in">
                <!-- Header Section -->
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                            Commission Management
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage sales commissions for your team</p>
                    </div>
                    <button onclick="openNewCommissionModal()" 
                        class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-[0.1em] text-xs shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i>
                        Record Commission
                    </button>
                </div>

                <!-- Tab Navigation -->
                <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    <button onclick="switchCommissionTab('list')" 
                        class="commission-tab px-6 py-3 font-black uppercase text-xs tracking-[0.1em] border-b-2 transition-all ${currentCommissionTab === 'list' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'} dark:text-gray-400 dark:hover:text-gray-300"
                        data-tab="list">
                        <i class="fa-solid fa-list mr-2"></i>Commission List
                    </button>
                    <button onclick="switchCommissionTab('analytics')" 
                        class="commission-tab px-6 py-3 font-black uppercase text-xs tracking-[0.1em] border-b-2 transition-all ${currentCommissionTab === 'analytics' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'} dark:text-gray-400 dark:hover:text-gray-300"
                        data-tab="analytics">
                        <i class="fa-solid fa-chart-bar mr-2"></i>Analytics
                    </button>
                </div>

                <!-- Content Section -->
                <div id="commission-content">
                    <!-- Loaded dynamically -->
                </div>
            </div>
        `;

        await renderCommissionTab(currentCommissionTab);
    } catch (error) {
        console.error('Error loading commissions:', error);
        container.innerHTML = `<div class="p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400">Error loading commissions: ${error.message}</div>`;
    }
}

async function renderCommissionTab(tab) {
    const container = document.getElementById('commission-content');
    if (!container) return;

    try {
        if (tab === 'list') {
            await renderCommissionList(container);
        } else if (tab === 'analytics') {
            await renderCommissionAnalytics(container);
        }
    } catch (error) {
        console.error('Error rendering commission tab:', error);
        container.innerHTML = `<div class="p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400">Error: ${error.message}</div>`;
    }
}

function switchCommissionTab(tab) {
    currentCommissionTab = tab;
    
    // Update button states
    document.querySelectorAll('.commission-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        if (isActive) {
            btn.classList.add('border-purple-600', 'text-purple-600', 'dark:border-purple-500', 'dark:text-purple-400');
            btn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        } else {
            btn.classList.remove('border-purple-600', 'text-purple-600', 'dark:border-purple-500', 'dark:text-purple-400');
            btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-300');
        }
    });

    renderCommissionTab(tab);
}

async function renderCommissionList(container) {
    try {
        const commissions = await db.commissions.toArray();
        
        if (commissions.length === 0) {
            container.innerHTML = `
                <div class="p-20 text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <i class="fa-solid fa-inbox text-5xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
                    <h3 class="text-xl font-black text-gray-600 dark:text-gray-400 uppercase italic">No Commissions Recorded</h3>
                    <p class="text-gray-500 dark:text-gray-500 mt-2">Start by recording your first commission</p>
                </div>
            `;
            return;
        }

        const sortedCommissions = commissions.sort((a, b) => new Date(b.date) - new Date(a.date));

        let tableHTML = `
            <div class="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
                            <th class="px-6 py-4 text-left font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Commission ID</th>
                            <th class="px-6 py-4 text-left font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Date</th>
                            <th class="px-6 py-4 text-left font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Recipient</th>
                            <th class="px-6 py-4 text-left font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Invoice</th>
                            <th class="px-6 py-4 text-right font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Amount</th>
                            <th class="px-6 py-4 text-center font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Status</th>
                            <th class="px-6 py-4 text-center font-black uppercase text-xs tracking-wider text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        `;

        sortedCommissions.forEach((comm, index) => {
            const statusColor = comm.status === 'approved' ? 'emerald' : comm.status === 'pending' ? 'amber' : 'red';
            const dateStr = new Date(comm.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            tableHTML += `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4 font-black text-purple-600 dark:text-purple-400">COMM-${String(comm.id).padStart(5, '0')}</td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-400">${dateStr}</td>
                    <td class="px-6 py-4">
                        <div class="font-black text-gray-900 dark:text-white">${comm.recipient_name}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-500">${comm.recipient_contact}</div>
                    </td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-400 font-bold">${comm.invoice_number || 'N/A'}</td>
                    <td class="px-6 py-4 text-right">
                        <span class="font-black text-lg text-gray-900 dark:text-white">${formatCurrency(comm.amount)}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-${statusColor}-100 text-${statusColor}-700 dark:bg-${statusColor}-900/20 dark:text-${statusColor}-400">
                            ${comm.status || 'pending'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center space-x-2">
                        <button onclick="editCommission(${comm.id})" 
                            class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 transition-colors font-bold text-xs">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <button onclick="deleteCommission(${comm.id})" 
                            class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors font-bold text-xs">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error rendering commission list:', error);
        container.innerHTML = `<div class="p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400">Error loading list: ${error.message}</div>`;
    }
}

async function renderCommissionAnalytics(container) {
    try {
        const commissions = await db.commissions.toArray();

        const totalAmount = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const approvedAmount = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0);
        const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);
        const avgAmount = commissions.length > 0 ? totalAmount / commissions.length : 0;

        // Calculate by recipient
        const byRecipient = {};
        commissions.forEach(c => {
            if (!byRecipient[c.recipient_name]) {
                byRecipient[c.recipient_name] = { count: 0, total: 0, contact: c.recipient_contact };
            }
            byRecipient[c.recipient_name].count++;
            byRecipient[c.recipient_name].total += c.amount || 0;
        });

        const topRecipients = Object.entries(byRecipient)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        container.innerHTML = `
            <div class="space-y-8">
                <!-- KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700/30 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Commissions</span>
                            <i class="fa-solid fa-coins text-2xl text-purple-300"></i>
                        </div>
                        <p class="text-3xl font-black text-purple-900 dark:text-purple-200 italic">${formatCurrency(totalAmount)}</p>
                        <p class="text-xs text-purple-600 dark:text-purple-300 mt-2 font-bold">${commissions.length} transactions</p>
                    </div>

                    <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700/30 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved</span>
                            <i class="fa-solid fa-check-circle text-2xl text-emerald-300"></i>
                        </div>
                        <p class="text-3xl font-black text-emerald-900 dark:text-emerald-200 italic">${formatCurrency(approvedAmount)}</p>
                        <p class="text-xs text-emerald-600 dark:text-emerald-300 mt-2 font-bold">${(approvedAmount / totalAmount * 100 || 0).toFixed(1)}% of total</p>
                    </div>

                    <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-700/30 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending</span>
                            <i class="fa-solid fa-clock text-2xl text-amber-300"></i>
                        </div>
                        <p class="text-3xl font-black text-amber-900 dark:text-amber-200 italic">${formatCurrency(pendingAmount)}</p>
                        <p class="text-xs text-amber-600 dark:text-amber-300 mt-2 font-bold">${(pendingAmount / totalAmount * 100 || 0).toFixed(1)}% of total</p>
                    </div>

                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700/30 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Average</span>
                            <i class="fa-solid fa-chart-line text-2xl text-blue-300"></i>
                        </div>
                        <p class="text-3xl font-black text-blue-900 dark:text-blue-200 italic">${formatCurrency(avgAmount)}</p>
                        <p class="text-xs text-blue-600 dark:text-blue-300 mt-2 font-bold">per transaction</p>
                    </div>
                </div>

                <!-- Top Recipients -->
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkBg/10">
                        <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Top Commission Recipients</h3>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${topRecipients.length === 0 ? '<div class="p-8 text-center text-gray-400">No data available</div>' : topRecipients.map((r, idx) => `
                            <div class="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-black text-lg">#${idx + 1}</div>
                                    <div>
                                        <h4 class="font-black text-gray-900 dark:text-white">${r.name}</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">${r.contact}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-black text-purple-600 dark:text-purple-400">${formatCurrency(r.total)}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-bold">${r.count} commissions</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering analytics:', error);
        container.innerHTML = `<div class="p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400">Error loading analytics: ${error.message}</div>`;
    }
}

async function openNewCommissionModal() {
    try {
        const sales = await db.sales.toArray();
        if (sales.length === 0) {
            Swal.fire('No Sales', 'Please create a sale first before recording commissions.', 'info');
            return;
        }

        const modalHTML = buildCommissionModal(null);
        
        const modal = document.createElement('div');
        modal.id = 'commission-modal';
        modal.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white dark:bg-darkCard rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                ${modalHTML}
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('comm-invoice-search-input')?.focus();
    } catch (error) {
        console.error('Error opening commission modal:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

function closeCommissionModal() {
    const modal = document.getElementById('commission-modal');
    if (modal) {
        modal.remove();
    }
}

async function searchInvoicesForCommission(query) {
    const resultsContainer = document.getElementById('comm-invoice-search-results');
    if (!resultsContainer) return;

    if (!query || query.trim().length === 0) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('hidden');
        return;
    }

    try {
        const normalizedQuery = query.toLowerCase().trim();
        const sales = await db.sales.toArray();
        
        const matchingSales = [];
        for (const sale of sales) {
            const displayNo = getInvoiceDisplayNumber(sale);
            const customer = sale.customer_id ? await db.customers.get(sale.customer_id) : null;
            const custName = customer ? customer.name : 'Walk-in Customer';
            
            if (
                displayNo.toLowerCase().includes(normalizedQuery) ||
                custName.toLowerCase().includes(normalizedQuery) ||
                String(sale.id).includes(normalizedQuery)
            ) {
                matchingSales.push({ sale, displayNo, custName });
            }
            if (matchingSales.length >= 10) break; // Limit to 10 results
        }

        if (matchingSales.length === 0) {
            resultsContainer.innerHTML = `
                <div class="p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                    No matching invoices found
                </div>
            `;
            resultsContainer.classList.remove('hidden');
            return;
        }

        resultsContainer.innerHTML = matchingSales.map(({ sale, displayNo, custName }) => `
            <div onclick="selectInvoiceForCommission(${sale.id}, '${displayNo}', ${sale.total || 0}, '${custName.replace(/'/g, "\\'")}')"
                class="p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors flex items-center justify-between">
                <div>
                    <span class="font-black text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">${displayNo}</span>
                    <span class="text-xs text-gray-400 font-bold ml-2">${new Date(sale.date).toLocaleDateString()}</span>
                    <p class="text-xs font-bold text-gray-600 dark:text-gray-400 mt-1">${custName}</p>
                </div>
                <div class="text-right">
                    <span class="font-black text-sm text-gray-900 dark:text-white">${formatCurrency(sale.total || 0)}</span>
                </div>
            </div>
        `).join('');
        resultsContainer.classList.remove('hidden');
    } catch (err) {
        console.error("Error searching invoices:", err);
    }
}

function selectInvoiceForCommission(saleId, invoiceNum, total, customerName) {
    const saleIdInput = document.getElementById('comm-sale-id');
    const invoiceNumInput = document.getElementById('comm-invoice-num');
    
    if (saleIdInput) saleIdInput.value = saleId;
    if (invoiceNumInput) invoiceNumInput.value = invoiceNum;
    
    const resultsContainer = document.getElementById('comm-invoice-search-results');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
    }
    
    const searchInput = document.getElementById('comm-invoice-search-input');
    if (searchInput) {
        searchInput.value = invoiceNum;
    }
    
    const detailsContainer = document.getElementById('comm-selected-invoice-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                <div>
                    <p class="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Selected Invoice</p>
                    <p class="text-lg font-black text-emerald-800 dark:text-emerald-200 mt-1">${invoiceNum}</p>
                    <p class="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">Customer: ${customerName}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Sale Total</p>
                    <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">${formatCurrency(total)}</p>
                </div>
            </div>
        `;
        detailsContainer.classList.remove('hidden');
    }
    
    const totalDisplay = document.getElementById('comm-sale-total-box');
    if (totalDisplay) {
        totalDisplay.innerHTML = `
            <div>
                <p class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Sale Total</p>
                <p class="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">${formatCurrency(total)}</p>
            </div>
            <i class="fa-solid fa-receipt text-2xl text-blue-200 dark:text-blue-800"></i>
        `;
    }
    
    calculateCommAmount();
}

function buildCommissionModal(sale = null) {
    const saleId = sale ? sale.id : '';
    const invoiceNum = sale ? (sale.invoice_number || getInvoiceDisplayNumber(sale)) : '';
    const saleTotal = sale ? (sale.total || 0) : 0;
    
    return `
        <div class="px-8 py-6 border-b border-gray-200 dark:border-darkBorder bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 z-20 sticky top-0 flex items-center justify-between">
            <div>
                <h3 class="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
                    ${sale ? 'Edit Commission' : 'Record Commission'}
                </h3>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    ${sale ? `Editing Commission for Invoice: ${invoiceNum}` : 'Record a new commission for a sales invoice'}
                </p>
            </div>
            <button type="button" onclick="closeCommissionModal()" class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>
        <form onsubmit="handleCommissionSubmit(event)" class="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
            <input type="hidden" id="comm-sale-id" value="${saleId}">
            <input type="hidden" id="comm-invoice-num" value="${invoiceNum}">
            <input type="hidden" id="comm-edit-id" value="">
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Search & Recipient -->
                <div class="space-y-6">
                    <!-- Search Invoice Section (Hidden in Edit mode to prevent changing linked invoice) -->
                    <div id="comm-invoice-search-container" class="${sale ? 'hidden' : 'space-y-2 relative'}">
                        <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Search Invoice *</label>
                        <div class="relative">
                            <input type="text" id="comm-invoice-search-input" oninput="searchInvoicesForCommission(this.value)" placeholder="Type Invoice number or Customer name..." class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-lg font-semibold outline-none transition-colors">
                            <i class="fa-solid fa-search absolute right-4 top-4 text-gray-400"></i>
                        </div>
                        <div id="comm-invoice-search-results" class="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-lg shadow-xl z-30 hidden custom-scrollbar"></div>
                    </div>

                    <!-- Selected Invoice Details Block -->
                    <div id="comm-selected-invoice-details" class="${sale ? '' : 'hidden'}">
                        ${sale ? `
                            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Selected Invoice</p>
                                    <p class="text-lg font-black text-emerald-800 dark:text-emerald-200 mt-1">${invoiceNum}</p>
                                    <p class="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">Invoice linked successfully</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Sale Total</p>
                                    <p class="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">${formatCurrency(saleTotal)}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-user text-purple-600"></i>
                            <h4 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Recipient Information</h4>
                        </div>
                        
                        <div>
                            <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                            <input type="text" id="comm-recipient-name" required placeholder="e.g. John Perera" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-lg font-semibold outline-none transition-colors">
                        </div>

                        <div>
                            <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Contact Number *</label>
                            <input type="text" id="comm-recipient-contact" required placeholder="07XXXXXXXX" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-lg font-semibold outline-none transition-colors">
                        </div>

                        <div>
                            <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">NIC / ID Number</label>
                            <input type="text" id="comm-recipient-nic" placeholder="Optional" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-lg font-semibold outline-none transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">NIC Image Upload</label>
                            <input type="file" id="comm-recipient-nic-image" accept="image/*" onchange="handleNicImageUpload(event)" class="w-full text-xs text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                            <input type="hidden" id="comm-recipient-nic-image-base64" value="">
                            <div id="comm-nic-image-preview" class="mt-3 hidden rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                <img src="" alt="NIC preview" class="w-full h-auto object-contain">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Calculation & Totals -->
                <div class="space-y-6">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-calculator text-indigo-600"></i>
                        <h4 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Commission Details</h4>
                    </div>

                    <div id="comm-sale-total-box" class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                        <div>
                            <p class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Sale Total</p>
                            <p class="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">${formatCurrency(saleTotal)}</p>
                        </div>
                        <i class="fa-solid fa-receipt text-2xl text-blue-200 dark:text-blue-800"></i>
                    </div>

                    <div>
                        <label id="comm-input-label" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Amount (LKR)</label>
                        <input type="text" id="comm-input-val" required placeholder="0.00" oninput="calculateCommAmount()" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-lg font-black text-lg outline-none transition-colors">
                    </div>

                    <div class="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 text-center">
                        <p class="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Calculated Amount</p>
                        <p class="text-3xl font-black text-purple-700 dark:text-purple-300 mt-2 italic" id="comm-display-amt">Rs. 0.00</p>
                    </div>
                </div>
            </div>

            <div class="pt-4 space-y-3">
                <p class="text-xs text-gray-600 dark:text-gray-400 italic flex items-center gap-2">
                    <i class="fa-solid fa-info-circle"></i>
                    Recording this commission will automatically debit Commission Expense (5510) and credit Cash on Hand (1000).
                </p>
                <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-black uppercase tracking-[0.1em] text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-check-circle"></i> Save & Post Commission
                </button>
            </div>
        </form>
    `;
}

function calculateCommAmount() {
    const valueInput = document.getElementById('comm-input-val');
    const displayAmt = document.getElementById('comm-display-amt');

    if (!valueInput || !displayAmt) return;

    // Remove commas and any non-numeric characters except dot
    const raw = valueInput.value.replace(/,/g, '').trim();
    const value = parseFloat(raw) || 0;
    displayAmt.textContent = formatCurrency(value);
}

function handleNicImageUpload(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    const previewContainer = document.getElementById('comm-nic-image-preview');
    const previewImage = previewContainer?.querySelector('img');
    const hiddenField = document.getElementById('comm-recipient-nic-image-base64');

    if (!file || !previewContainer || !previewImage || !hiddenField) return;

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        hiddenField.value = reader.result || '';
        previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function reverseCommissionAccounting(commissionId) {
    // 1. Delete double-entry ledger records for this commission
    await db.ledger.where({ reference_type: 'Commission', reference_id: commissionId }).delete();
    
    // 2. Find and delete linked expenses for this commission
    const matchingExpenses = await db.expenses.toArray();
    const expensesToDelete = matchingExpenses.filter(e => e.commission_id === commissionId);
    for (const exp of expensesToDelete) {
        await db.expenses.delete(exp.id);
    }
}

async function handleCommissionSubmit(event) {
    event.preventDefault();

    const editId = document.getElementById('comm-edit-id').value;
    const saleId = parseInt(document.getElementById('comm-sale-id').value);
    const invoiceNum = document.getElementById('comm-invoice-num').value;
    const recipientName = document.getElementById('comm-recipient-name').value.trim();
    const recipientContact = document.getElementById('comm-recipient-contact').value.trim();
    const recipientNic = document.getElementById('comm-recipient-nic').value.trim();
    const nicImageBase64 = document.getElementById('comm-recipient-nic-image-base64').value || '';
    // Use raw input value to compute amount, avoiding formatting issues
    const amountInput = document.getElementById('comm-input-val');
    const rawVal = amountInput ? amountInput.value.replace(/,/g, '').trim() : '';
    const amount = parseFloat(rawVal) || 0;

    if (isNaN(saleId) || !invoiceNum) {
        Swal.fire('Validation Error', 'Please search and select a valid invoice first.', 'warning');
        return;
    }

    if (!recipientName || !recipientContact || amount <= 0) {
        Swal.fire('Validation Error', 'Please fill all required fields correctly', 'warning');
        return;
    }

    try {
        const commissionData = {
            date: new Date().toISOString(),
            sale_id: saleId,
            recipient_name: recipientName,
            recipient_contact: recipientContact,
            recipient_nic: recipientNic,
            recipient_nic_image: nicImageBase64,
            amount: amount,
            type: 'fixed',
            status: 'approved',
            invoice_number: invoiceNum
        };

        await db.transaction('rw', [db.commissions, db.accounts, db.ledger, db.expenses], async () => {
            let commissionId;
            if (editId) {
                commissionId = parseInt(editId);
                await db.commissions.update(commissionId, commissionData);
                // Reverse old ledger and expense entries before re-recording
                await reverseCommissionAccounting(commissionId);
            } else {
                commissionId = await db.commissions.add(commissionData);
            }

            // Post Accounting double entry & add expense
            // 1. Get/Create Commission Expense Account (5510)
            let commissionExpenseAcc = await db.accounts.where('code').equals('5510').first();
            if (!commissionExpenseAcc) {
                const accId = await db.accounts.add({
                    name: 'Commission Expense',
                    type: 'Expense',
                    code: '5510'
                });
                commissionExpenseAcc = await db.accounts.get(accId);
            }
            const commissionExpenseAccId = commissionExpenseAcc.id;

            // 2. Get/Create Cash on Hand Account (1000)
            let cashAcc = await db.accounts.where('code').equals('1000').first();
            if (!cashAcc) {
                const accId = await db.accounts.add({
                    name: 'Cash on Hand',
                    type: 'Asset',
                    code: '1000'
                });
                cashAcc = await db.accounts.get(accId);
            }
            const cashAccId = cashAcc.id;

            const commissionDate = commissionData.date;
            const description = `Commission payment to ${recipientName} for Invoice ${invoiceNum}`;

            // Debit: Commission Expense
            await db.ledger.add({
                date: commissionDate,
                account_id: commissionExpenseAccId,
                amount: amount,
                type: 'debit',
                description: description,
                reference_type: 'Commission',
                reference_id: commissionId
            });

            // Credit: Cash on Hand
            await db.ledger.add({
                date: commissionDate,
                account_id: cashAccId,
                amount: amount,
                type: 'credit',
                description: description,
                reference_type: 'Commission',
                reference_id: commissionId
            });

            // Create linked expense entry
            await db.expenses.add({
                date: commissionDate,
                category: 'Commission Expense',
                account_id: commissionExpenseAccId,
                amount: amount,
                description: description,
                invoice_id: saleId,
                commission_id: commissionId
            });
        });

        if (editId) {
            Swal.fire('Success', 'Commission and ledger records updated successfully', 'success');
        } else {
            Swal.fire('Success', 'Commission recorded and posted to ledger successfully', 'success');
        }

        closeCommissionModal();
        loadCommissions();
    } catch (error) {
        console.error('Error saving commission:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

async function editCommission(id) {
    try {
        const commission = await db.commissions.get(id);
        if (!commission) {
            Swal.fire('Error', 'Commission not found', 'error');
            return;
        }

        let sale = await db.sales.get(commission.sale_id);
        if (!sale) {
            sale = { id: commission.sale_id, invoice_number: commission.invoice_number, total: commission.amount };
        }

        const modalHTML = buildCommissionModal(sale);
        
        const modal = document.createElement('div');
        modal.id = 'commission-modal';
        modal.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white dark:bg-darkCard rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                ${modalHTML}
            </div>
        `;

        document.body.appendChild(modal);

        // Fill in existing data
        setTimeout(() => {
            document.getElementById('comm-recipient-name').value = commission.recipient_name;
            document.getElementById('comm-recipient-contact').value = commission.recipient_contact;
            document.getElementById('comm-recipient-nic').value = commission.recipient_nic || '';
            document.getElementById('comm-edit-id').value = id;
            document.getElementById('comm-input-val').value = commission.amount;
            calculateCommAmount();

            if (commission.recipient_nic_image) {
                const previewContainer = document.getElementById('comm-nic-image-preview');
                const previewImage = previewContainer?.querySelector('img');
                const hiddenField = document.getElementById('comm-recipient-nic-image-base64');
                if (previewContainer && previewImage && hiddenField) {
                    previewImage.src = commission.recipient_nic_image;
                    hiddenField.value = commission.recipient_nic_image;
                    previewContainer.classList.remove('hidden');
                }
            }
        }, 100);
    } catch (error) {
        console.error('Error editing commission:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

async function deleteCommission(id) {
    try {
        const result = await Swal.fire({
            title: 'Confirm Delete',
            text: 'Are you sure you want to delete this commission?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            await db.transaction('rw', [db.commissions, db.ledger, db.expenses], async () => {
                // Reverse accounting first
                await reverseCommissionAccounting(id);
                // Delete commission record
                await db.commissions.delete(id);
            });
            Swal.fire('Deleted', 'Commission deleted successfully', 'success');
            loadCommissions();
        }
    } catch (error) {
        console.error('Error deleting commission:', error);
        Swal.fire('Error', error.message, 'error');
    }
}

// Utility function for currency formatting (if not already defined globally)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}
