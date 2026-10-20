// Customer Management Logic

async function getCustomerLoyalty(customerId) {
    const sales = await db.sales.where('customer_id').equals(customerId).toArray();
    const invoices = sales.filter(s => s.document_type === 'invoice');

    let totalSpent = invoices.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

    const returns = await db.returns.where('customer_id').equals(customerId).toArray();
    for (const r of returns) {
        if (r.return_type !== 'rma') {
            const inv = invoices.find(i => i.id === r.invoice_id);
            if (inv) {
                const item = inv.items.find(i => i.name === r.item_name || i.sku === r.item_sku);
                if (item) {
                    totalSpent -= (parseFloat(item.price || 0) * parseInt(r.qty || 1));
                }
            }
        }
    }

    if (totalSpent < 0) totalSpent = 0;
    return {
        totalSpent: totalSpent,
        points: Math.floor(totalSpent / 100)
    };
}

async function loadCustomers() {
    console.log("Loading Customers view...");
    const container = document.getElementById('customers-view');
    if (!container) return;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden h-full flex flex-col">
            <!-- Header Actions -->
            <div class="p-4 lg:p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50">
                <div>
                    <h2 class="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Customer Relationship</h2>
                    <p class="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage profiles and purchase history.</p>
                </div>
                
                <div class="flex items-center gap-3">
                    <div class="relative flex-1 md:flex-none">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                        <input type="text" id="customers-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs lg:text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-full md:w-64 transition-colors" placeholder="Search customers...">
                    </div>
                    <button onclick="openNewCustomerInRelationship()" class="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs lg:text-sm shadow-sm transition-all flex items-center gap-2">
                        <i class="fa-solid fa-user-plus"></i> <span class="hidden sm:inline">Add Customer</span>
                    </button>
                </div>
            </div>

            <!-- Table section -->
            <div class="flex-1 overflow-auto custom-scrollbar p-0">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Customer Name</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Phone</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Loyalty Points</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Balance Due</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="customers-list-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                        <tr><td colspan="5" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

    container.innerHTML = html;

    document.getElementById('customers-search').addEventListener('input', (e) => {
        renderCustomersList(e.target.value);
    });

    renderCustomersList();
}

async function renderCustomersList(query = '', targetId = 'customers-list-body') {
    const tbody = document.getElementById(targetId);
    if (!tbody) return;

    let customers = await db.customers.toArray();

    if (query) {
        const q = query.toLowerCase();
        customers = customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    }

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No customers found.</td></tr>';
        return;
    }

    let html = '';
    for (const c of customers) {
        // Calculate points (1 point per 100 Rs spent, excluding quotes and deducting returns)
        const loyalty = await getCustomerLoyalty(c.id);
        const points = loyalty.points;

        // Calculate Balance
        const balance = c.current_balance || 0;

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            ${(c.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">${c.name}</p>
                                ${c.category === 'Wholesale' ? '<span class="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 rounded uppercase tracking-widest">Wholesale</span>' : ''}
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${c.company || 'Private Customer'}</p>
                                ${c.contact_person ? `<div class="h-2 w-px bg-gray-300 mx-1"></div><p class="text-[10px] text-primary font-bold uppercase tracking-widest">Contact: ${c.contact_person}</p>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${c.phone || 'N/A'}</td>
                <td class="p-4">
                    <span class="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                        <i class="fa-solid fa-star mr-1"></i> ${points} pts
                    </span>
                </td>
                <td class="p-4 text-sm font-bold text-right ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}">
                    Rs. ${balance.toLocaleString()}
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-1.5 flex-wrap">
                        <button onclick="viewCustomerProfile(${c.id})" class="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all text-xs font-bold" title="View Profile">
                            <i class="fa-solid fa-eye"></i> VIEW
                        </button>
                        <button onclick="previewCustomerOutstandingReport(${c.id})" class="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all text-xs font-bold" title="Outstanding Report (Pending Payments Only)">
                            <i class="fa-solid fa-file-invoice-dollar"></i> OUTSTANDING
                        </button>
                        <button onclick="printCustomerStatement(${c.id})" class="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg transition-all text-xs font-bold" title="Full Purchase History & Statement">
                            <i class="fa-solid fa-file-lines"></i> STATEMENT
                        </button>
                        <button onclick="editCustomerInRelationship(${c.id})" class="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg transition-all text-xs font-bold" title="Edit Customer">
                            <i class="fa-solid fa-user-pen"></i> EDIT
                        </button>
                        ${(currentUser && (currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes('all')))) ? `
                        <button onclick="editCustomerBalance(${c.id})" class="flex items-center gap-1 px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 rounded-lg transition-all text-xs font-bold" title="Edit Balance Due">
                            <i class="fa-solid fa-scale-balanced"></i> BALANCE
                        </button>` : ''}
                        <button onclick="deleteCustomer(${c.id}, '${c.name.replace(/'/g, "\\'")}')" class="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-all text-xs font-bold" title="Delete Customer">
                            <i class="fa-solid fa-trash-can"></i> DELETE
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    if (targetId === 'pos-customer-results') {
        let posHtml = '';
        customers.forEach(c => {
            posHtml += `
                <div onclick="setCustomer(${c.id})" class="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-primary cursor-pointer group transition-all">
                    <p class="text-xs font-black dark:text-white uppercase tracking-tight">${c.name}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-[9px] font-mono text-gray-500">${c.phone || 'No Phone'} | ${c.company || 'Private'}</span>
                        <span class="text-xs font-bold text-primary">Rs. ${(c.current_balance || 0).toLocaleString()}</span>
                    </div>
                </div>
            `;
        });
        tbody.innerHTML = posHtml;
    } else {
        tbody.innerHTML = html;
    }
}

function handleBRFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataInput = document.getElementById('cust-br-data');
        const nameLabel = document.getElementById('br-file-name');
        const viewBtn = document.getElementById('btn-view-br');

        if (dataInput) dataInput.value = e.target.result;
        if (nameLabel) nameLabel.textContent = file.name;
        if (viewBtn) viewBtn.classList.remove('hidden');

        // Store filename in a hidden attribute if needed, but for now just UI
        nameLabel.dataset.filename = file.name;
    };
    reader.readAsDataURL(file);
}

function viewBRDocument() {
    const data = document.getElementById('cust-br-data').value;
    if (!data) {
        showAlert('No Document', 'No document uploaded to view.', 'warning');
        return;
    }

    const modal = document.getElementById('br-preview-modal');
    const content = document.getElementById('br-preview-content');
    const frame = document.getElementById('br-preview-frame');
    const filenameEl = document.getElementById('br-preview-filename');
    const nameLabel = document.getElementById('br-file-name');

    filenameEl.textContent = nameLabel.dataset.filename || 'Business Registration Document';

    if (data.startsWith('data:application/pdf')) {
        frame.innerHTML = `<iframe src="${data}" class="w-full h-full border-none"></iframe>`;
    } else if (data.startsWith('data:image')) {
        frame.innerHTML = `<img src="${data}" class="max-w-full max-h-full object-contain shadow-lg rounded-lg">`;
    } else {
        frame.innerHTML = `<div class="p-8 text-center"><p class="text-gray-500">Preview not available for this file type.</p></div>`;
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeBRPreview() {
    const modal = document.getElementById('br-preview-modal');
    const content = document.getElementById('br-preview-content');
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('br-preview-frame').innerHTML = '';
    }, 300);
}

function downloadBRDocument() {
    const data = document.getElementById('cust-br-data').value;
    const nameLabel = document.getElementById('br-file-name');
    const filename = nameLabel.dataset.filename || 'br-document';

    if (!data) return;

    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function viewCustomerProfile(id) {
    const customer = await db.customers.get(id);
    if (!customer) return;

    const modal = document.getElementById('customer-profile-modal');
    const content = document.getElementById('customer-profile-content');
    const container = document.getElementById('profile-container');

    // Fetch History & Financial Data
    const finData = await getCustomerFinancialData(id);
    const sales = finData ? finData.sales : (await db.sales.where('customer_id').equals(id).reverse().sortBy('date'));
    const loyalty = await getCustomerLoyalty(id);
    const totalSpent = loyalty.totalSpent;
    const points = loyalty.points;

    let historyHtml = '';
    if (!sales || sales.length === 0) {
        historyHtml = '<div class="text-center py-6 text-gray-500">No purchase history found.</div>';
    } else {
        historyHtml = `
            <table class="w-full text-left text-sm border-collapse">
                <thead class="text-xs text-gray-500 uppercase">
                    <tr>
                        <th class="py-2 border-b">Date</th>
                        <th class="py-2 border-b">Doc #</th>
                        <th class="py-2 border-b">Type</th>
                        <th class="py-2 border-b text-right">Amount</th>
                        <th class="py-2 border-b text-center">Status</th>
                        <th class="py-2 border-b text-center">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    ${sales.map(s => {
                        const statusClass = s.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                           s.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                           'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-bold';
                        const rowHighlight = s.isPending ? 'bg-rose-50/40 dark:bg-rose-950/20' : '';
                        return `
                        <tr class="${rowHighlight} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td class="py-2.5 text-xs text-gray-600 dark:text-gray-400">${new Date(s.date).toLocaleDateString()}</td>
                            <td class="py-2.5 font-mono font-bold text-xs">${getInvoiceDisplayNumber(s)}</td>
                            <td class="py-2.5 capitalize text-xs text-gray-600 dark:text-gray-400">${(s.document_type || 'invoice').replace('_', ' ')}</td>
                            <td class="py-2.5 text-right font-bold text-gray-900 dark:text-white text-xs">Rs. ${parseFloat(s.total).toLocaleString()}</td>
                            <td class="py-2.5 text-center">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
                                    ${s.status || 'PAID'} ${s.isPending ? `(Due: Rs. ${s.due.toLocaleString()})` : ''}
                                </span>
                            </td>
                            <td class="py-2.5 text-center">
                                <div class="flex items-center justify-center gap-1">
                                    <button onclick="if(typeof printInvoice === 'function') printInvoice(${s.id}, null, true, true); else showAlert('Error', 'Print function not found', 'error');" 
                                        class="p-1 px-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                                        <i class="fa-solid fa-eye"></i> View
                                    </button>
                                    ${s.isPending ? `
                                        <button onclick="openCustomerPaymentModal(${customer.id})" 
                                            class="p-1 px-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all" title="Pay Balance">
                                            <i class="fa-solid fa-money-bill-wave"></i> Pay
                                        </button>
                                    ` : `
                                        <button onclick="unreceiveInvoice(${s.id})" 
                                            class="p-1 px-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all" title="Unreceive / Reverse Invoice">
                                            <i class="fa-solid fa-rotate-left"></i> Unreceive
                                        </button>
                                    `}
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        `;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left Info Card -->
            <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div class="flex flex-col items-center text-center">
                    <div class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">
                        ${(customer.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <h4 class="text-xl font-bold dark:text-white">${customer.name}</h4>
                    <p class="text-sm text-gray-500 mb-4">${customer.company || 'Private Customer'}</p>
                    <div class="w-full space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Phone</span>
                            <span class="font-medium h-full flex items-center dark:text-white">${customer.phone || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Email</span>
                            <span class="font-medium dark:text-white truncate max-w-24 overflow-hidden">${customer.email || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Location</span>
                            <span class="font-medium dark:text-white">${customer.city || ''} ${customer.zip_code || ''}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Account Code</span>
                            <span class="font-mono text-xs font-bold text-primary">${customer.account_code || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-500">Address</span>
                            <span class="font-medium text-right text-xs dark:text-white">${customer.address || 'N/A'}</span>
                        </div>
                        ${customer.br_document ? `
                        <div class="pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
                            <button onclick="window.open('${customer.br_document}')" class="w-full py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                                <i class="fa-solid fa-file-shield mr-1"></i> View KYC Document
                            </button>
                        </div>` : ''}
                    </div>
                </div>
            </div>

            <!-- Stats & History -->
            <div class="md:col-span-2 space-y-6">
                <!-- Stat Cards -->
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <p class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Total Spent</p>
                        <p class="font-bold text-gray-900 dark:text-white">Rs. ${totalSpent.toLocaleString()}</p>
                    </div>
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30">
                        <p class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Loyalty</p>
                        <p class="font-bold text-gray-900 dark:text-white">${points} Points</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100 dark:bg-red-900/10 dark:border-red-800/30">
                        <p class="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Current Balance</p>
                        <p class="font-bold text-gray-900 dark:text-white">${formatCurrency(customer.current_balance || 0)}</p>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="grid grid-cols-2 ${(currentUser && (currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes('all')))) ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3">
                    <button onclick="openCustomerPaymentModal(${customer.id})" class="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-money-bill-transfer"></i> Record Payment
                    </button>
                    <button onclick="previewCustomerOutstandingReport(${customer.id})" class="bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2" title="Preview Outstanding Report (Pending Payments Only)">
                        <i class="fa-solid fa-file-invoice-dollar"></i> Outstanding Report
                    </button>
                    <button onclick="printCustomerStatement(${customer.id})" class="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2" title="Print Full Purchase History Statement">
                        <i class="fa-solid fa-file-invoice"></i> Print Statement
                    </button>
                    <button onclick="editCustomerInRelationship(${customer.id})" class="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-user-pen"></i> Edit Profile
                    </button>
                    <button onclick="viewCustomerWarranty(${customer.id})" class="bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-shield-halved"></i> Warranty Tracker
                    </button>
                    ${(currentUser && (currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes('all')))) ? `
                    <button onclick="editCustomerBalance(${customer.id})" class="bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-scale-balanced"></i> Edit Balance
                    </button>` : ''}
                </div>

                <!-- History Table Area -->
                <div class="bg-white dark:bg-darkCard rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                        <h5 class="text-sm font-bold text-gray-900 dark:text-white">Transaction History</h5>
                        <i class="fa-solid fa-clock-rotate-left text-gray-400"></i>
                    </div>
                    <div class="p-4 max-h-64 overflow-y-auto custom-scrollbar">
                        ${historyHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    if (content) {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }
    document.getElementById('profile-modal-name').textContent = customer.name;
}

function toggleCustomerTypeFields() {
    const type = document.getElementById('cust-type').value;
    const nameWrap = document.getElementById('cust-name-wrap');
    const companyWrap = document.getElementById('cust-company-wrap');
    const contactWrap = document.getElementById('cust-contact-person-wrap');

    if (type === 'company') {
        if (nameWrap) nameWrap.classList.add('hidden');
        if (companyWrap) companyWrap.classList.remove('hidden');
        if (contactWrap) contactWrap.classList.remove('hidden');

        // Make company name required if company type
        const companyInput = document.getElementById('cust-company');
        if (companyInput) companyInput.required = true;
        const nameInput = document.getElementById('cust-name');
        if (nameInput) nameInput.required = false;
    } else {
        if (nameWrap) nameWrap.classList.remove('hidden');
        if (companyWrap) companyWrap.classList.add('hidden');
        if (contactWrap) contactWrap.classList.add('hidden');

        // Make individual name required if individual type
        const nameInput = document.getElementById('cust-name');
        if (nameInput) nameInput.required = true;
        const companyInput = document.getElementById('cust-company');
        if (companyInput) companyInput.required = false;
    }
}


function closeCustomerProfile() {
    const modal = document.getElementById('customer-profile-modal');
    const content = document.getElementById('customer-profile-content');
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// Global Customer Modal Logic (shared with POS)
function openNewCustomerInRelationship() {
    const modal = document.getElementById('customer-modal');
    const content = document.getElementById('customer-modal-content');

    // Hide search area, show form directly
    document.getElementById('customer-search-area').classList.add('hidden');
    document.getElementById('customer-form').classList.remove('hidden');
    const saveBtn = document.getElementById('cust-save-btn');
    if (saveBtn) {
        saveBtn.classList.remove('hidden');
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    document.getElementById('customer-modal-title').innerHTML = '<i class="fa-solid fa-user-plus text-primary"></i> Create New Customer';

    // Generate Auto Account Code for new customer
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);
    document.getElementById('cust-account-code').value = `ACC-${randomStr}-${timestamp}`;

    // Set Default: Title to None
    const titleEl = document.getElementById('cust-title');
    if (titleEl) titleEl.value = 'None';

    // Set Default: Customer Type to Individual
    const typeEl = document.getElementById('cust-type');
    if (typeEl) {
        typeEl.value = 'individual';
        toggleCustomerTypeFields();
    }

    // Reset other fields
    document.getElementById('customer-form').reset();
    document.getElementById('cust-account-code').value = `ACC-${randomStr}-${timestamp}`; // Re-set after reset
    if (titleEl) titleEl.value = 'None';
    if (typeEl) typeEl.value = 'individual';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('cust-name', '');
    setVal('cust-phone', '');
    setVal('cust-email', '');
    setVal('cust-title', 'Mr.');
    setVal('cust-company', '');
    setVal('cust-contact-person', '');
    setVal('cust-address', '');
    setVal('cust-city', '');
    setVal('cust-zip', '');
    setVal('cust-terms', 'cash');
    setVal('cust-credit-limit', 0);
    setVal('cust-credit-period', 0);
    setVal('cust-category', 'Retail');

    // Hide credit options by default for new customer (since default is cash)
    const creditWrapper = document.getElementById('credit-options');
    if (creditWrapper) creditWrapper.classList.add('hidden');

    // Hide view button
    const viewBtn = document.getElementById('btn-view-br');
    if (viewBtn) viewBtn.classList.add('hidden');

    if (typeof toggleContactPersonField === 'function') toggleContactPersonField();

    // Ensure change listener is attached for credit terms
    initCustomerModalListeners();

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0', 'invisible');
        modal.classList.add('opacity-100', 'visible');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function initCustomerModalListeners() {
    const termsSelect = document.getElementById('cust-terms');
    const creditOptions = document.getElementById('credit-options');

    if (termsSelect && creditOptions) {
        // Initial state
        if (termsSelect.value === 'credit') {
            creditOptions.classList.remove('hidden');
        } else {
            creditOptions.classList.add('hidden');
        }

        // Change listener
        termsSelect.addEventListener('change', function (e) {
            if (e.target.value === 'credit') {
                creditOptions.classList.remove('hidden');
            } else {
                creditOptions.classList.add('hidden');
            }
        });
    }

    // Customer Type toggle
    const typeSelect = document.getElementById('cust-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', toggleCustomerTypeFields);
    }
}


async function editCustomerInRelationship(id) {
    if (typeof editCustomer === 'function') {
        try {
            closeCustomerProfile(); // Close profile if open
            await editCustomer(id);

            // Ensure customer modal is visible (editCustomer populates it)
            const modal = document.getElementById('customer-modal');
            const content = document.getElementById('customer-modal-content');

            // Comprehensive visibility check
            modal.classList.remove('hidden', 'invisible', 'opacity-0');
            modal.classList.add('visible', 'opacity-100');

            if (content) {
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }
        } catch (err) {
            console.error('Error triggering edit modal:', err);
            showAlert('Error', 'Failed to open edit modal: ' + err.message, 'error');
        }
    } else {
        showAlert('Error', 'Edit customer function not found', 'error');
    }
}
async function openCustomerPaymentModal(id) {
    const customer = await db.customers.get(id);
    if (!customer) return;

    // Pre-load company bank accounts for the dropdown
    const bankAccounts = await db.bank_accounts.toArray();
    const bankOptHtml = bankAccounts.length === 0
        ? '<option value="">No bank accounts registered</option>'
        : bankAccounts.map(b =>
            `<option value="${b.id}">${b.name} — ${b.bank_name || ''} (Bal: ${formatCurrency(b.balance || 0)})</option>`
        ).join('');

    Swal.fire({
        title: `Payment from ${customer.name}`,
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Current Balance Due</label>
                    <div class="text-xl font-black text-red-600">${formatCurrency(customer.current_balance || 0)}</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Amount</label>
                    <input type="number" id="pay-amount" class="swal2-input w-full m-0" placeholder="0.00" value="${customer.current_balance || 0}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <select id="pay-method" class="swal2-input w-full m-0">
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="koko">KOKO Payment</option>
                    </select>
                </div>

                <!-- Bank Account Selector (shown when Bank Transfer is selected) -->
                <div id="bank-account-section" class="hidden animate-fade-in space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <label class="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                        <i class="fa-solid fa-building-columns mr-1"></i>Deposit Into Company Bank Account
                    </label>
                    <select id="pay-bank-account-id" class="swal2-input w-full m-0">
                        ${bankOptHtml}
                    </select>
                    <div class="mt-2">
                        <label class="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                            Bank Transfer Reference Number
                        </label>
                        <input type="text" id="pay-bank-ref" class="swal2-input w-full m-0" placeholder="e.g. TXN-987654321">
                    </div>
                </div>

                <!-- Cheque Details -->
                <div id="cheque-details" class="hidden animate-fade-in space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Number</label>
                            <input type="text" id="pay-cheque-no" class="swal2-input w-full m-0" placeholder="000000">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Date</label>
                            <input type="date" id="pay-cheque-date" class="swal2-input w-full m-0">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issuing Bank</label>
                            <input type="text" id="pay-cheque-bank" class="swal2-input w-full m-0" placeholder="Bank Name">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</label>
                            <input type="text" id="pay-cheque-branch" class="swal2-input w-full m-0" placeholder="Branch Name">
                        </div>
                    </div>
                </div>

                <!-- KOKO Details -->
                <div id="koko-details" class="hidden animate-fade-in space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <label class="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">
                        KOKO Reference / Transaction ID
                    </label>
                    <input type="text" id="pay-koko-ref" class="swal2-input w-full m-0" placeholder="e.g. KOKO-12345 (optional)">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Reference / Note</label>
                    <input type="text" id="pay-ref" class="swal2-input w-full m-0" placeholder="e.g. Inv #1234">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Record Payment',
        didOpen: () => {
            const methodSelect = Swal.getPopup().querySelector('#pay-method');
            const bankAccountSection = Swal.getPopup().querySelector('#bank-account-section');
            const chequeDetails = Swal.getPopup().querySelector('#cheque-details');
            const kokoDetails = Swal.getPopup().querySelector('#koko-details');

            methodSelect.addEventListener('change', (e) => {
                bankAccountSection.classList.add('hidden');
                chequeDetails.classList.add('hidden');
                if (kokoDetails) kokoDetails.classList.add('hidden');

                if (e.target.value === 'bank') {
                    bankAccountSection.classList.remove('hidden');
                } else if (e.target.value === 'cheque') {
                    chequeDetails.classList.remove('hidden');
                } else if (e.target.value === 'koko') {
                    if (kokoDetails) kokoDetails.classList.remove('hidden');
                }
            });
        },
        preConfirm: () => {
            const amount = parseFloat(Swal.getPopup().querySelector('#pay-amount').value);
            const method = Swal.getPopup().querySelector('#pay-method').value;
            const ref = Swal.getPopup().querySelector('#pay-ref').value;

            if (!amount || amount <= 0) {
                Swal.showValidationMessage(`Please enter a valid amount`);
                return false;
            }

            const paymentData = { amount, method, ref };

            if (method === 'bank') {
                const bankAccIdEl = Swal.getPopup().querySelector('#pay-bank-account-id');
                const bankAccId = bankAccIdEl ? parseInt(bankAccIdEl.value) : null;
                if (!bankAccId) {
                    Swal.showValidationMessage('Please select a company bank account.');
                    return false;
                }
                paymentData.bank_account_id = bankAccId;
                const selectedOpt = bankAccIdEl.options[bankAccIdEl.selectedIndex];
                paymentData.bank_name = selectedOpt ? selectedOpt.text : '';
                paymentData.bank_reference = Swal.getPopup().querySelector('#pay-bank-ref')?.value?.trim() || ref;
            } else if (method === 'cheque') {
                paymentData.cheque_no = Swal.getPopup().querySelector('#pay-cheque-no').value;
                paymentData.cheque_date = Swal.getPopup().querySelector('#pay-cheque-date').value;
                paymentData.cheque_bank = Swal.getPopup().querySelector('#pay-cheque-bank').value;
                paymentData.cheque_branch = Swal.getPopup().querySelector('#pay-cheque-branch').value;
            } else if (method === 'koko') {
                paymentData.koko_reference = Swal.getPopup().querySelector('#pay-koko-ref')?.value?.trim() || ref;
            }

            return paymentData;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await recordCustomerPayment(id, result.value);
        }
    });
}

async function recordCustomerPayment(custId, data) {
    const { amount, method, ref, bank_name, bank_account_id, cheque_no, cheque_date, cheque_bank, cheque_branch, bank_reference, koko_reference } = data;
    try {
        // Expand transaction scope to include db.sales and bank stores
        await db.transaction('rw', db.customers, db.payments, db.sales, db.ledger, db.accounts, db.bank_accounts, db.bank_transactions, async () => {
            const customer = await db.customers.get(custId);
            const accounts = await db.accounts.toArray();
            const getAccId = (code) => accounts.find(a => a.code === code)?.id;

            const receivableAccId = getAccId('1200'); // Accounts Receivable
            const targetAccId = method === 'cash' ? getAccId('1000') : getAccId('1010');
            const nowIso = new Date().toISOString();

            // 1. Update Customer Balance
            const newBalance = (customer.current_balance || 0) - amount;
            await db.customers.update(custId, { current_balance: newBalance });

            // 2. Allocate payment FIFO to unpaid/partial credit sales
            const custSales = await db.sales.where('customer_id').equals(custId).toArray();
            const unpaidSales = custSales
                .filter(s => s.status !== 'paid' && s.status !== 'completed' && (s.payment_type === 'credit' || s.payment_method === 'credit' || s.status === 'unpaid' || s.status === 'partial'))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            let unallocated = amount;
            for (const s of unpaidSales) {
                if (unallocated <= 0) break;
                const sTotal = parseFloat(s.total) || 0;
                const sPaid = parseFloat(s.paid_amount) || 0;
                const sDue = Math.max(0, sTotal - sPaid);
                if (sDue > 0) {
                    const payForSale = Math.min(unallocated, sDue);
                    const nPaid = sPaid + payForSale;
                    const nStatus = (nPaid >= sTotal) ? 'paid' : 'partial';

                    const updateData = {
                        paid_amount: nPaid,
                        status: nStatus
                    };

                    if (nStatus === 'paid') {
                        updateData.settlement_payment_method = method;
                        updateData.settlement_date = nowIso;
                        updateData.cheque_number = cheque_no || null;
                        updateData.cheque_no = cheque_no || null;
                        updateData.cheque_date = cheque_date || null;
                        updateData.cheque_bank = cheque_bank || bank_name || null;
                        updateData.bank_name = cheque_bank || bank_name || null;
                        updateData.cheque_branch = cheque_branch || null;
                        updateData.bank_reference = bank_reference || (method === 'bank' ? ref : null);
                        updateData.bank_ref = bank_reference || (method === 'bank' ? ref : null);
                        updateData.koko_reference = koko_reference || (method === 'koko' ? ref : null);
                        updateData.koko_ref = koko_reference || (method === 'koko' ? ref : null);
                    }

                    await db.sales.update(s.id, updateData);
                    unallocated -= payForSale;
                }
            }

            // 3. Add Payment Record
            await db.payments.add({
                date: nowIso,
                target_id: custId,
                target_type: 'customer',
                amount: amount,
                method: method,
                reference: ref,
                bank_name: bank_name || cheque_bank || null,
                bank_account_id: bank_account_id || null,
                account_id: method === 'cash' ? '1000' : (bank_account_id ? 'BANK-' + bank_account_id : '1010'),
                cheque_number: cheque_no || null,
                cheque_no: cheque_no || null,
                cheque_date: cheque_date || null,
                cheque_bank: cheque_bank || null,
                cheque_branch: cheque_branch || null,
                bank_reference: bank_reference || (method === 'bank' ? ref : null),
                bank_ref: bank_reference || (method === 'bank' ? ref : null),
                koko_reference: koko_reference || (method === 'koko' ? ref : null),
                koko_ref: koko_reference || (method === 'koko' ? ref : null)
            });

            // 4. Ledger Record (Debit Cash/Bank, Credit Receivable)
            if (typeof recordTransaction === 'function') {
                await recordTransaction(targetAccId, amount, 'debit', `Payment from ${customer.name} (${ref || method})`, 'Payment', custId);
                await recordTransaction(receivableAccId, amount, 'credit', `Payment from ${customer.name} (${ref || method})`, 'Payment', custId);
            }

            // 5. Update Bank Account balance for Bank Transfer payments
            if (method === 'bank' && bank_account_id) {
                if (typeof recordBankTransaction === 'function') {
                    await recordBankTransaction(
                        bank_account_id,
                        'inward',
                        'Bank Transfer',
                        amount,
                        `Customer #${custId}`,
                        `Bank Transfer — Payment received from ${customer.name}${ref ? ' (' + ref + ')' : ''}`,
                        nowIso.split('T')[0]
                    );
                }
            }

            if (typeof logActivity === 'function') {
                await logActivity(`Customer Payment: ${customer.name} - ${formatCurrency(amount)} (${method})`);
            }
        });

        showAlert('Success', 'Payment recorded successfully and invoices updated.');
        if (typeof viewCustomerProfile === 'function') viewCustomerProfile(custId); // Refresh profile
        if (typeof renderCustomersList === 'function') renderCustomersList(); // Refresh list
        if (typeof loadOutstanding === 'function') loadOutstanding(); // Refresh outstanding view
    } catch (err) {
        showAlert('Error', 'Failed to record payment: ' + err.message, 'error');
    }
}

// ─── Customer Financial Calculations & Reports ─────────────────────────────────

/**
 * Computes complete financial transactions, invoice statuses, paid amounts,
 * remaining due balances, and pending invoices for a customer.
 */
async function getCustomerFinancialData(id) {
    const customer = await db.customers.get(id);
    if (!customer) return null;

    // Fetch all sales for this customer
    const rawSales = await db.sales.where('customer_id').equals(id).toArray();
    // Finalized revenue documents only (exclude draft quotes and estimates)
    const sales = rawSales.filter(s =>
        ['invoice', 'pos_invoice', 'web_order', 'sale'].includes(s.document_type || 'invoice')
    );

    // Fetch payments related to this customer or their invoices
    const allCustomerPayments = await db.payments.where({ target_id: id, target_type: 'customer' }).toArray();
    const allInvoicePayments = await db.payments.where('target_type').equals('invoice').toArray();
    
    const saleIds = new Set(sales.map(s => Number(s.id)));
    const relatedInvoicePayments = allInvoicePayments.filter(p => saleIds.has(Number(p.target_id || p.invoice_id)));
    const allOtherPayments = await db.payments.filter(p => p.invoice_id && saleIds.has(Number(p.invoice_id))).toArray();

    const paymentsMap = new Map();
    [...allCustomerPayments, ...relatedInvoicePayments, ...allOtherPayments].forEach(p => {
        paymentsMap.set(p.id, p);
    });
    const allPayments = Array.from(paymentsMap.values());

    // Sort sales chronologically (oldest first)
    sales.sort((a, b) => new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0));

    // Direct payments assigned to specific invoices
    const directPayBySaleId = {};
    allPayments.forEach(p => {
        const invId = p.target_type === 'invoice' ? (p.target_id || p.invoice_id) : p.invoice_id;
        if (invId) {
            const sid = Number(invId);
            directPayBySaleId[sid] = (directPayBySaleId[sid] || 0) + (parseFloat(p.amount) || 0);
        }
    });

    // Unallocated general customer payments (not tied to specific invoice)
    let generalPaymentsTotal = allPayments
        .filter(p => p.target_type === 'customer' && !p.invoice_id)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const isCustomerZeroBalance = (parseFloat(customer.current_balance) || 0) <= 0.001;

    // Process each sale
    const processedSales = sales.map(s => {
        const total = parseFloat(s.total) || 0;
        const payType = (s.payment_type || '').toLowerCase();
        const isCreditOrCod = ['credit', 'cod'].includes(payType);

        let paid = 0;
        if (!isCreditOrCod) {
            // Cash / Bank / Cheque / Card at checkout paid in full immediately
            paid = total;
        } else {
            const direct = directPayBySaleId[Number(s.id)] || 0;
            const stored = parseFloat(s.paid_amount) || 0;
            paid = Math.max(direct, stored);
            if (s.status === 'paid' && paid < total) {
                paid = total;
            }
        }

        // If customer record indicates zero overall balance, mark all invoices as fully paid
        if (isCustomerZeroBalance) {
            paid = total;
        }

        return {
            ...s,
            parsedTotal: total,
            parsedPaid: Math.min(total, paid),
            remainingDue: Math.max(0, total - Math.min(total, paid)),
            isCreditSale: isCreditOrCod
        };
    });

    // Allocate unallocated general customer payments to remaining credit sales (FIFO)
    if (!isCustomerZeroBalance) {
        let remainingGeneralPay = generalPaymentsTotal;
        for (const s of processedSales) {
            if (s.remainingDue > 0.001 && remainingGeneralPay > 0.001) {
                const applied = Math.min(s.remainingDue, remainingGeneralPay);
                s.parsedPaid += applied;
                s.remainingDue -= applied;
                remainingGeneralPay -= applied;
            }
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedSales = processedSales.map(s => {
        const total = s.parsedTotal;
        const paid = s.parsedPaid;
        const due = Math.max(0, total - paid);
        let status = 'PAID';
        let isPending = false;

        if (due > 0.01 && !isCustomerZeroBalance) {
            isPending = true;
            status = paid > 0.01 ? 'PARTIAL' : 'UNPAID';
        }

        const creditDays = parseInt(s.credit_days) || 14;
        const saleDateObj = new Date(s.date || s.timestamp || Date.now());
        const dueDateObj = new Date(saleDateObj.getTime() + (creditDays * 24 * 60 * 60 * 1000));
        dueDateObj.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - dueDateObj.getTime();
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return {
            ...s,
            total,
            paid,
            due,
            status,
            isPending,
            displayNumber: getInvoiceDisplayNumber(s),
            dueDateStr: dueDateObj.toLocaleDateString(),
            daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
            isOverdue: isPending && daysOverdue > 0
        };
    });

    // Pending invoices only
    const pendingInvoices = enrichedSales.filter(s => s.isPending);
    const sumPending = pendingInvoices.reduce((sum, s) => sum + s.due, 0);
    const currentBalance = parseFloat(customer.current_balance || 0);

    let unlinkedBalance = 0;
    if (currentBalance > sumPending + 0.01) {
        unlinkedBalance = currentBalance - sumPending;
    }

    const totalOutstanding = isCustomerZeroBalance ? 0 : Math.max(currentBalance, sumPending);
    const totalSpent = enrichedSales.reduce((sum, s) => sum + s.total, 0);
    const totalPaidLifetime = Math.max(0, totalSpent - totalOutstanding);

    return {
        customer,
        sales: enrichedSales,
        pendingInvoices,
        unlinkedBalance,
        totalOutstanding,
        totalSpent,
        totalPaidLifetime,
        allPayments
    };
}

/**
 * Preview Customer Outstanding Report (Shows ONLY Pending Payments / Unpaid Invoices)
 */
async function previewCustomerOutstandingReport(id) {
    const finData = await getCustomerFinancialData(id);
    if (!finData) {
        showAlert('Error', 'Customer record not found.', 'error');
        return;
    }

    const { customer, pendingInvoices, unlinkedBalance, totalOutstanding, sales } = finData;

    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || 'MobileMate POS';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeLogo = opts['store_logo'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const invoiceColor = opts['invoice_color'] || '#0e3257';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';
    const invoiceFooter = opts['invoice_footer'] || 'Thank you for your prompt settlement!';

    // Bank accounts for payment deposit instructions
    const bankAccounts = await db.bank_accounts.toArray();
    let bankAccountsHtml = '';
    if (bankAccounts && bankAccounts.length > 0) {
        bankAccountsHtml = `
            <div style="margin-top: 20px; padding: 14px 18px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px;">
                <div style="font-weight: 800; color: ${invoiceColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                    Bank Settlement Instructions (Deposit / Fund Transfer)
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: #334155;">
                    ${bankAccounts.map(b => `
                        <div style="background: #fff; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; min-width: 180px;">
                            <strong style="color:${invoiceColor};">${b.bank_name || b.name}</strong><br>
                            <span>Acc Name: <b>${b.name}</b></span><br>
                            <span>Acc No: <b style="font-family: monospace; font-size: 12px; color: #0f172a;">${b.account_number || 'N/A'}</b></span>
                            ${b.branch ? `<br><span>Branch: ${b.branch}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                <div style="font-size: 10px; color: #64748b; margin-top: 8px;">
                    Please state reference: <b>${customer.account_code || ('CUST-' + customer.id)} / ${customer.name}</b> when making payments.
                </div>
            </div>
        `;
    }

    const _snLen = (storeName || '').length;
    const headerFontSize = _snLen > 35 ? '13px' : _snLen > 28 ? '15px' : _snLen > 20 ? '18px' : '22px';

    // Build pending rows
    let rowsHtml = '';
    if (pendingInvoices.length === 0 && unlinkedBalance <= 0.01) {
        rowsHtml = `
            <tr>
                <td colspan="9" style="padding: 45px 20px; text-align: center;">
                    <div style="display: inline-block; width: 50px; height: 50px; border-radius: 50%; background: #dcfce7; color: #16a34a; font-size: 26px; line-height: 50px; margin-bottom: 12px;">✓</div>
                    <div style="font-size: 17px; font-weight: 900; color: #15803d; text-transform: uppercase;">No Outstanding Payments</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">All invoices and transactions for ${customer.name} are completely paid and up to date.</div>
                </td>
            </tr>
        `;
    } else {
        let idx = 0;
        rowsHtml = pendingInvoices.map(s => {
            idx++;
            const overdueHtml = s.isOverdue 
                ? `<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; display: inline-block;">⚠ ${s.daysOverdue} Days Overdue</span><br><span style="font-size:10px; color:#64748b;">Due: ${s.dueDateStr}</span>`
                : `<span style="color: #059669; font-size: 11px; font-weight: bold;">Due: ${s.dueDateStr}</span>`;

            const statusBadge = s.status === 'PARTIAL'
                ? `<span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">PARTIAL</span>`
                : `<span style="background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">UNPAID</span>`;

            return `
                <tr style="border-bottom: 1px solid #fed7aa; background-color: ${idx % 2 === 0 ? '#fffaf5' : '#ffffff'};">
                    <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #64748b;">${idx}</td>
                    <td style="padding: 10px 12px; font-size: 12px; color: #334155;">${new Date(s.date).toLocaleDateString()}</td>
                    <td style="padding: 10px 12px;">
                        <strong style="color: #0f172a; font-size: 13px; font-family: monospace;">${s.displayNumber}</strong>
                        <div style="font-size: 10px; color: #64748b;">${(s.document_type || 'invoice').replace('_', ' ').toUpperCase()}</div>
                    </td>
                    <td style="padding: 10px 12px; font-size: 11px; color: #475569;">
                        ${(s.payment_type || 'Credit').toUpperCase()} (${s.credit_days || 14}D)
                    </td>
                    <td style="padding: 10px 12px; font-size: 11px;">
                        ${overdueHtml}
                    </td>
                    <td align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #1e293b;">
                        Rs. ${s.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #059669;">
                        Rs. ${s.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td align="right" style="padding: 10px 12px; font-size: 14px; font-weight: 900; color: #e11d48; background: #fff1f2;">
                        Rs. ${s.due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td align="center" style="padding: 10px 12px;">
                        ${statusBadge}
                    </td>
                </tr>
            `;
        }).join('');

        if (unlinkedBalance > 0.01) {
            idx++;
            rowsHtml += `
                <tr style="border-bottom: 1px solid #fed7aa; background-color: #fff1f2;">
                    <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #64748b;">${idx}</td>
                    <td style="padding: 10px 12px; font-size: 12px; color: #334155;">—</td>
                    <td style="padding: 10px 12px;">
                        <strong style="color: #0f172a; font-size: 13px;">Previous / Opening Balance</strong>
                        <div style="font-size: 10px; color: #64748b;">Carried Forward Outstanding Balance</div>
                    </td>
                    <td style="padding: 10px 12px; font-size: 11px; color: #475569;">ACCOUNT BAL</td>
                    <td style="padding: 10px 12px; font-size: 11px;"><span style="color: #e11d48; font-weight: bold;">Immediate</span></td>
                    <td align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600;">Rs. ${unlinkedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #059669;">Rs. 0.00</td>
                    <td align="right" style="padding: 10px 12px; font-size: 14px; font-weight: 900; color: #e11d48; background: #ffe4e6;">Rs. ${unlinkedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td align="center" style="padding: 10px 12px;"><span style="background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800;">UNPAID</span></td>
                </tr>
            `;
        }
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Outstanding Report - ${customer.name}</title>
            <style>
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body { margin: 0; background: #fff !important; }
                    .page { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                }
                body { margin: 0; padding: 0; background: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .page { background: #fff; width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 14mm; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
                table { border-collapse: collapse; width: 100%; }
            </style>
        </head>
        <body>
            <div class="page">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap: 15px;">
                        ${storeLogo ? `<img src="${storeLogo}" style="max-height: 75px; max-width:120px; object-fit:contain;">` : ''}
                        <div>
                            <h1 style="margin:0; color:${invoiceColor}; font-size:${headerFontSize}; text-transform:uppercase; line-height:1.2;"><b>${storeName}</b></h1>
                            <p style="margin:2px 0; font-size:11px; color:#475569; letter-spacing: 0.5px;"><b>${storeSubheading}</b></p>
                            ${enabledStoreAddress ? `<p style="margin:4px 0; color:#64748b; font-size:11px;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                            <div style="font-size:10px; color:#888;">
                                ${storePhone ? `Phone: ${storePhone}` : ''} ${storeEmail ? ` | Email: ${storeEmail}` : ''}
                                ${storeWebsite ? ` | Web: ${storeWebsite}` : ''}
                                ${storeBR ? ` | BR: ${storeBR}` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="display:inline-block; padding: 6px 14px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
                            <h2 style="margin:0; color:#e11d48; font-size:18px; font-weight:900; letter-spacing:1px; text-transform:uppercase;">OUTSTANDING REPORT</h2>
                            <div style="font-size: 10px; font-weight: bold; color: #be123c; margin-top: 2px;">PENDING PAYMENTS ONLY</div>
                        </div>
                        <div style="margin-top:10px; font-size: 11px; color: #475569; line-height: 1.5;">
                            <strong>Report Date:</strong> ${new Date().toLocaleDateString()}<br>
                            <strong>Generated:</strong> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br>
                            <strong>Account Ref:</strong> <span style="font-family:monospace; font-weight:bold; color:${invoiceColor};">${customer.account_code || ('CUST-' + customer.id)}</span>
                        </div>
                    </div>
                </div>

                <hr style="margin:16px 0; border:0; border-top:3px solid #e11d48;">

                <!-- Customer Details & Financial Cards -->
                <div style="display:flex; justify-content:space-between; gap: 20px; margin-bottom: 20px;">
                    <!-- Left: Customer info -->
                    <div style="flex:1; padding: 15px 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="color:${invoiceColor}; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;">
                            Customer Details
                        </div>
                        <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">${customer.name}</div>
                        ${customer.company ? `<div style="font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 4px;">${customer.company}</div>` : ''}
                        <div style="font-size: 11px; color: #475569; line-height: 1.5; margin-top: 6px;">
                            ${customer.phone ? `<div><b>Phone:</b> ${customer.phone}</div>` : ''}
                            ${customer.email ? `<div><b>Email:</b> ${customer.email}</div>` : ''}
                            ${customer.address ? `<div><b>Address:</b> ${customer.address}</div>` : ''}
                        </div>
                    </div>

                    <!-- Right: Outstanding summary callout -->
                    <div style="width: 260px; display: flex; flex-direction: column; gap: 10px;">
                        <div style="background: linear-gradient(135deg, #e11d48, #be123c); color: white; padding: 14px 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25); text-align: right;">
                            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; opacity: 0.9;">Total Outstanding Due</div>
                            <div style="font-size: 22px; font-weight: 900; margin-top: 4px; letter-spacing: -0.5px;">Rs. ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 11px; color: #475569; line-height: 1.6;">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Pending Invoices:</span>
                                <b style="color: ${pendingInvoices.length > 0 ? '#e11d48' : '#059669'};">${pendingInvoices.length}</b>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Credit Limit:</span>
                                <b>Rs. ${(customer.credit_limit || 0).toLocaleString()}</b>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Account Status:</span>
                                <b>${totalOutstanding > (customer.credit_limit || 0) && (customer.credit_limit || 0) > 0 ? '<span style="color:#e11d48;">LIMIT EXCEEDED</span>' : '<span style="color:#059669;">ACTIVE</span>'}</b>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table Header & Badge -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <div style="font-weight: 800; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        Pending Invoices Breakdown
                    </div>
                    <div style="font-size: 11px; color: #64748b;">
                        Showing only unpaid &amp; partially paid customer invoices
                    </div>
                </div>

                <!-- Outstanding Invoices Table -->
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #0f172a; color: #ffffff;">
                            <th align="center" width="4%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">#</th>
                            <th align="left" width="12%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Date</th>
                            <th align="left" width="16%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Invoice #</th>
                            <th align="left" width="12%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Terms</th>
                            <th align="left" width="16%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Due / Aging</th>
                            <th align="right" width="13%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Total</th>
                            <th align="right" width="12%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase;">Paid</th>
                            <th align="right" width="15%" style="padding: 9px 8px; font-size: 11px; text-transform:uppercase; background:#be123c;">Balance Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    ${(pendingInvoices.length > 0 || unlinkedBalance > 0.01) ? `
                        <tfoot>
                            <tr style="background: #fff1f2; border-top: 2px solid #e11d48;">
                                <td colspan="5" align="right" style="padding: 12px; font-weight: 800; font-size: 12px; color: #0f172a; text-transform: uppercase;">
                                    Total Outstanding Payable:
                                </td>
                                <td align="right" style="padding: 12px; font-weight: 700; font-size: 12px; color: #334155;">
                                    Rs. ${(pendingInvoices.reduce((s, i) => s + i.total, 0) + unlinkedBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td align="right" style="padding: 12px; font-weight: 700; font-size: 12px; color: #059669;">
                                    Rs. ${pendingInvoices.reduce((s, i) => s + i.paid, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td align="right" style="padding: 12px; font-weight: 900; font-size: 15px; color: #e11d48; background: #ffe4e6;">
                                    Rs. ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    ` : ''}
                </table>

                <!-- Bank Instructions -->
                ${bankAccountsHtml}

                <!-- Footer Sign-off -->
                <div style="margin-top: 25px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px;">
                    <div style="font-size: 10px; color: #64748b; line-height: 1.5; max-width: 380px;">
                        <p style="margin: 0 0 3px 0; font-weight: bold; color: #334155;">Notice:</p>
                        Please settle all outstanding balances within agreed credit terms. If you have already made this payment, kindly forward your deposit slip or transaction receipt so we can update your statement immediately.
                    </div>
                    <div style="text-align: center; width: 180px;">
                        <div style="height: 35px;"></div>
                        <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 10px; font-weight: bold; color: #334155; text-transform: uppercase;">
                            Authorized Signature
                        </div>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 9px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    <div>${invoiceFooter}</div>
                    <div style="margin-top: 2px;">This is a computer-generated Outstanding Report. • Powered by Infinity Creative Works</div>
                </div>
            </div>
        </body>
        </html>
    `;

    if (typeof openPreviewModal === 'function') {
        openPreviewModal(
            html,
            () => {
                const printWin = window.open('', '_blank');
                if (printWin) {
                    printWin.document.write(html);
                    printWin.document.close();
                }
            },
            null,
            null,
            (html) => {
                const docNo = `OUT-${customer.account_code || ('CUST-' + id)}`;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Customer Outstanding Report', docNo, customer.name, totalOutstanding, [], html);
                }
            }
        );
    } else {
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(html);
            printWin.document.close();
        }
    }
}

/**
 * Print Customer Statement (Shows FULL Purchase & Payment History with Highlighted Pending Payments)
 */
async function printCustomerStatement(id) {
    const finData = await getCustomerFinancialData(id);
    if (!finData) {
        showAlert('Error', 'Customer record not found.', 'error');
        return;
    }

    const { customer, sales, allPayments, pendingInvoices, totalOutstanding, totalSpent, totalPaidLifetime } = finData;

    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || 'MobileMate Demo Shop';
    const storeAddress = opts['store_address'] || '';
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const storePhone = opts['store_phone'] || '';
    const storeLogo = opts['store_logo'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const invoiceColor = opts['invoice_color'] || '#0e3257';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';
    const invoiceFooter = opts['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = opts['receipt_footer_info'] || '';

    const _snLen = (storeName || '').length;
    const headerFontSize = _snLen > 35 ? '13px' : _snLen > 28 ? '15px' : _snLen > 20 ? '18px' : '22px';

    // Map into shared full ledger format
    let transactions = [
        ...sales.map(s => {
            const isInstantCash = s.payment_type && !['credit', 'cod'].includes(s.payment_type.toLowerCase());
            return {
                date: s.date || s.timestamp,
                ref: s.displayNumber,
                desc: `${(s.document_type || 'invoice').replace('_', ' ').toUpperCase()} • ${(s.payment_type || 'CASH').toUpperCase()}`,
                debit: s.total,
                credit: isInstantCash ? s.total : 0,
                type: 'sale',
                isPending: s.isPending,
                status: s.status,
                due: s.due,
                paid: s.paid,
                dueDateStr: s.dueDateStr,
                daysOverdue: s.daysOverdue,
                isOverdue: s.isOverdue
            };
        }),
        ...allPayments.map(p => ({
            date: p.date,
            ref: `PAY-${String(p.id).padStart(4, '0')}`,
            desc: `Payment Received (${(p.method || 'cash').toUpperCase()})${p.reference ? ' - ' + p.reference : ''}`,
            debit: 0,
            credit: parseFloat(p.amount) || 0,
            type: 'payment',
            isPending: false,
            status: 'PAID'
        }))
    ];

    // Filter valid financial transactions and sort chronologically
    transactions = transactions.filter(t => t.debit > 0 || t.credit > 0);
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const rowsHtml = transactions.map((t, idx) => {
        balance += (t.debit - t.credit);

        // Visual highlighting for pending payments vs paid transactions
        let rowStyle = 'border-bottom: 1px solid #eee;';
        let statusBadge = '';

        if (t.isPending && t.status === 'UNPAID') {
            rowStyle = 'background-color: #fef2f2; border-left: 5px solid #ef4444; border-bottom: 1px solid #fecaca;';
            statusBadge = `<span style="background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-left: 6px; text-transform: uppercase;">PENDING (Due: Rs. ${t.due.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>`;
            if (t.isOverdue) {
                statusBadge += ` <span style="background: #b91c1c; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-left: 4px;">⚠ ${t.daysOverdue}D OVERDUE</span>`;
            }
        } else if (t.isPending && t.status === 'PARTIAL') {
            rowStyle = 'background-color: #fffbeb; border-left: 5px solid #f59e0b; border-bottom: 1px solid #fed7aa;';
            statusBadge = `<span style="background: #f59e0b; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-left: 6px; text-transform: uppercase;">PARTIAL (Paid: Rs. ${t.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })} / Due: Rs. ${t.due.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>`;
        } else if (t.type === 'sale') {
            statusBadge = `<span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-left: 6px;">PAID IN FULL</span>`;
        } else {
            statusBadge = `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-left: 6px;">PAYMENT RECEIVED</span>`;
        }

        return `
            <tr style="${rowStyle}">
                <td style="padding: 10px 12px; font-size:12px; color:#64748b;">${idx + 1}</td>
                <td style="padding: 10px 12px; font-size:12px; color:#334155; white-space:nowrap;">${new Date(t.date).toLocaleDateString()}</td>
                <td style="padding: 10px 12px;">
                    <div style="font-weight: bold; color: #111; font-size:13px;">
                        ${t.ref} ${statusBadge}
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                        ${t.desc} ${t.dueDateStr ? `• Due: ${t.dueDateStr}` : ''}
                    </div>
                </td>
                <td align="right" style="padding: 10px 12px; font-size:13px; font-weight:600; color: ${t.debit > 0 ? '#111' : '#ccc'};">${t.debit > 0 ? 'Rs. ' + t.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                <td align="right" style="padding: 10px 12px; font-size:13px; font-weight:600; color: ${t.credit > 0 ? '#10b981' : '#ccc'};">${t.credit > 0 ? 'Rs. ' + t.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                <td align="right" style="padding: 10px 12px; font-size:13px; font-weight: bold; color: ${balance > 0 ? '#ef4444' : '#10b981'};">Rs. ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Statement - ${customer.name}</title>
            <style>
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body { margin: 0; background: #fff !important; }
                    .page { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }
                }
                body { margin: 0; padding: 0; background: #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .page { background: #fff; width: 210mm; margin: 10mm auto; box-shadow: 0 0 12px rgba(0,0,0,0.1); min-height: 297mm; padding: 14mm; box-sizing: border-box; position: relative; }
            </style>
        </head>
        <body>
            <div class="page">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; align-items:center; gap: 15px;">
                        ${storeLogo ? `<img src="${storeLogo}" style="max-height: 80px; max-width:120px; object-fit:contain;">` : ''}
                        <div>
                            <h1 style="margin:0; color:${invoiceColor}; font-size:${headerFontSize}; text-transform:uppercase; line-height:1.2;"><b>${storeName}</b></h1>
                            <p style="margin:2px 0; font-size:11px; color:#444; letter-spacing: 0.5px;"><b>${storeSubheading}</b></p>
                            ${enabledStoreAddress ? `<p style="margin:5px 0; color:#666; font-size:11px;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                            <div style="font-size:10px; color:#888;">
                                ${storePhone ? `Phone: ${storePhone}` : ''} ${storeEmail ? ` | Email: ${storeEmail}` : ''}
                                ${storeWebsite ? ` | Web: ${storeWebsite}` : ''}
                                ${storeBR ? ` | BR: ${storeBR}` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <h2 style="margin:0; letter-spacing:2px; color:#1e293b; font-size:24px;"><b>STATEMENT</b></h2>
                        <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">Full Purchase History</div>
                        <div style="margin-top:10px; font-size: 12px; line-height: 1.5;">
                            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                            <strong>Account:</strong> <span style="font-family: monospace; font-weight: bold;">${customer.account_code || ('CUST-' + id)}</span>
                        </div>
                    </div>
                </div>

                <hr style="margin:18px 0; border:0; border-top:3px solid ${invoiceColor};">

                <!-- Statement Overview & Customer Details -->
                <div style="display:flex; justify-content:space-between; gap: 20px; margin-bottom: 20px;">
                    <div style="flex: 1; padding: 15px 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <strong style="color:${invoiceColor}; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Statement For:</strong>
                        <div style="margin-top:8px; line-height: 1.6; font-size: 13px;">
                            <b style="font-size: 17px; color: #1e293b;">${customer.name}</b><br>
                            ${customer.company ? `<strong>${customer.company}</strong><br>` : ''}
                            ${customer.phone ? `Phone: ${customer.phone}<br>` : ''}
                            ${customer.email ? `Email: ${customer.email}<br>` : ''}
                            ${customer.address ? `Address: ${customer.address}` : ''}
                        </div>
                    </div>
                    <div style="width: 280px; text-align:right; display: flex; flex-direction: column; gap: 10px;">
                        <div style="background: ${invoiceColor}; color: white; padding: 14px 18px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                            <p style="margin:0; font-size: 10px; text-transform: uppercase; opacity: 0.85; font-weight: bold; letter-spacing: 0.5px;">Current Total Outstanding</p>
                            <p style="margin:4px 0 0 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Rs. ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 11px; color: #64748b; line-height: 1.6;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Pending Invoices:</span>
                                <b style="color: ${pendingInvoices.length > 0 ? '#ef4444' : '#10b981'};">${pendingInvoices.length} Invoices</b>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Credit Limit:</span>
                                <b>Rs. ${(customer.credit_limit || 0).toLocaleString()}</b>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Account Status:</span>
                                <b>${totalOutstanding > (customer.credit_limit || 0) && (customer.credit_limit || 0) > 0 ? '<span style="color:#ef4444;">LIMIT EXCEEDED</span>' : '<span style="color:#10b981;">ACTIVE</span>'}</b>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Legend Banner -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; padding: 8px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
                    <div style="font-weight: bold; text-transform: uppercase; color: #0f172a; font-size: 10px; letter-spacing: 0.5px;">
                        Full Purchase History Ledger
                    </div>
                    <div style="display: flex; gap: 14px;">
                        <span><b style="display:inline-block; width:10px; height:10px; background:#fef2f2; border:1px solid #ef4444; border-radius:2px; vertical-align:middle; margin-right:4px;"></b> Red = Unpaid Invoice</span>
                        <span><b style="display:inline-block; width:10px; height:10px; background:#fffbeb; border:1px solid #f59e0b; border-radius:2px; vertical-align:middle; margin-right:4px;"></b> Amber = Partially Paid</span>
                        <span><b style="display:inline-block; width:10px; height:10px; background:#f0fdf4; border:1px solid #22c55e; border-radius:2px; vertical-align:middle; margin-right:4px;"></b> Green = Paid in Full</span>
                    </div>
                </div>

                <!-- Full Transaction Table with Highlighted Pending -->
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: ${invoiceColor}; color: #fff;">
                            <th align="center" width="4%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">#</th>
                            <th align="left" width="12%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">Date</th>
                            <th align="left" width="40%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">Transaction Details &amp; Status</th>
                            <th align="right" width="15%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">Dr (Charges)</th>
                            <th align="right" width="15%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">Cr (Payments)</th>
                            <th align="right" width="14%" style="padding: 10px 8px; font-size: 11px; text-transform:uppercase;">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                        ${transactions.length === 0 ? '<tr><td colspan="6" align="center" style="padding: 50px; color: #94a3b8; font-style: italic;">No financial activity recorded for this customer.</td></tr>' : ''}
                    </tbody>
                </table>

                <!-- Summary Totals -->
                <div style="margin-top: 25px; display: flex; justify-content: flex-end;">
                    <table style="width: 320px; border-collapse: collapse;">
                        <tr style="border-top: 1px solid #cbd5e1;">
                            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Total Lifetime Purchases:</td>
                            <td align="right" style="padding: 6px 0; font-size: 12px; font-weight: bold; color: #1e293b;">Rs. ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 12px; color: #64748b;">Total Payments Received:</td>
                            <td align="right" style="padding: 6px 0; font-size: 12px; font-weight: bold; color: #10b981;">Rs. ${totalPaidLifetime.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="border-top: 2px solid #334155;">
                            <td style="padding: 10px 0; font-weight: bold; color: #475569; font-size: 13px;">NET OUTSTANDING DUE</td>
                            <td align="right" style="padding: 10px 0; font-weight: 900; color: #e11d48; font-size: 18px;">Rs. ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>
                </div>

                <!-- Footer -->
                <div style="position: absolute; bottom: 12mm; left: 14mm; right: 14mm; text-align: center; color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    <div style="margin-bottom: 6px; font-weight: bold; color: #1e293b; text-transform: uppercase;">${invoiceFooter}</div>
                    ${receiptFooterInfo ? `<div style="margin-bottom: 6px; font-size: 11px; color: #4b5563; line-height: 1.5; font-weight: 700; white-space: pre-line;">${receiptFooterInfo}</div>` : ''}
                    <div style="font-size: 9px; line-height: 1.4;">
                        This is a computer generated statement of full purchase history with highlighted pending payments.<br>
                        Please notify us within 7 days if any discrepancies are found.<br>
                        <span style="font-weight: bold; color: #475569;">Powered by Infinity Creative Works</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    if (typeof openPreviewModal === 'function') {
        openPreviewModal(
            html,
            () => {
                const printWin = window.open('', '_blank');
                if (printWin) {
                    printWin.document.write(html);
                    printWin.document.close();
                }
            },
            null,
            null,
            (html) => {
                const docNo = `STMT-${customer.account_code || ('CUST-' + id)}`;
                if (typeof shareDocumentViaOutlook === 'function') {
                    shareDocumentViaOutlook('Customer Statement', docNo, customer.name, customer.current_balance || 0, [], html);
                }
            }
        );
    } else {
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(html);
            printWin.document.close();
        }
    }
}

async function viewCustomerWarranty(id) {
    const customer = await db.customers.get(id);
    if (!customer) return;

    closeCustomerProfile();

    // Switch to warranty view
    const navBtn = document.querySelector('[data-target="warranty-view"]');
    if (navBtn) navBtn.click();

    // Search for this customer's warranties
    setTimeout(() => {
        const searchInput = document.getElementById('warranty-search');
        if (searchInput) {
            searchInput.value = customer.name;
            renderWarrantyList(customer.name);
        }
    }, 500);
}
/**
 * Admin-only: Manually adjust the stored balance due for a customer.
 * Opens a Swal dialog pre-filled with the current balance, requires a reason,
 * writes a ledger adjustment entry, and refreshes all relevant UI.
 */
async function editCustomerBalance(id) {
    // Guard: only admins
    if (!currentUser || !(currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes('all')))) {
        showAlert('Access Denied', 'Only administrators can manually edit a customer balance.', 'error');
        return;
    }

    const customer = await db.customers.get(id);
    if (!customer) return;

    const currentBal = parseFloat(customer.current_balance || 0);

    const { value: formData, isConfirmed } = await Swal.fire({
        title: '<span style="font-size:1.1rem">✏️ Edit Balance Due</span>',
        html: `
            <div class="text-left space-y-4">
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p class="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">⚠️ Admin Override</p>
                    <p class="text-xs text-amber-600">This directly sets the stored balance. Use only to correct data errors. A ledger adjustment entry will be recorded.</p>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Customer</label>
                    <div class="text-sm font-black text-gray-800">${customer.name}</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Current Balance Due</label>
                    <div class="text-xl font-black ${currentBal > 0 ? 'text-red-600' : 'text-emerald-600'}">${formatCurrency(currentBal)}</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">New Balance Amount (Rs.)</label>
                    <input type="number" id="adj-new-balance" class="swal2-input w-full m-0" step="0.01" placeholder="0.00" value="${currentBal}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Note <span class="text-red-500">*</span></label>
                    <input type="text" id="adj-reason" class="swal2-input w-full m-0" placeholder="e.g. Correcting double-entry error, Write-off, etc.">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-check mr-1"></i> Apply Adjustment',
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#6B7280',
        focusConfirm: false,
        preConfirm: () => {
            const newBal = parseFloat(document.getElementById('adj-new-balance').value);
            const reason = document.getElementById('adj-reason').value.trim();
            if (isNaN(newBal)) {
                Swal.showValidationMessage('Please enter a valid balance amount.');
                return false;
            }
            if (!reason) {
                Swal.showValidationMessage('A reason/note is required for audit purposes.');
                return false;
            }
            return { newBal, reason };
        }
    });

    if (!isConfirmed || !formData) return;

    const { newBal, reason } = formData;
    const diff = newBal - currentBal; // positive = balance increased, negative = decreased

    try {
        await db.transaction('rw', db.customers, db.ledger, db.accounts, async () => {
            // 1. Update customer balance
            await db.customers.update(id, { current_balance: newBal });

            // 2. Write adjustment ledger entry
            if (typeof recordTransaction === 'function') {
                const accounts = await db.accounts.toArray();
                const receivableAccId = accounts.find(a => a.code === '1200')?.id;
                if (receivableAccId) {
                    // Debit or credit receivables based on direction of adjustment
                    const entryType = diff >= 0 ? 'debit' : 'credit';
                    await recordTransaction(
                        receivableAccId,
                        Math.abs(diff),
                        entryType,
                        `Balance Adjustment — ${customer.name} | Reason: ${reason} | Admin: ${currentUser.username}`,
                        'Adjustment',
                        id
                    );
                }
            }

            // 3. Activity log
            if (typeof logActivity === 'function') {
                await logActivity(
                    `Balance Adjusted: ${customer.name} | ${formatCurrency(currentBal)} → ${formatCurrency(newBal)} | Reason: ${reason} | By: ${currentUser.username}`
                );
            }
        });

        showAlert('Balance Updated', `Balance for <b>${customer.name}</b> updated to <b>${formatCurrency(newBal)}</b>.`);

        // Refresh any open views
        if (typeof renderCustomersList === 'function') renderCustomersList(document.getElementById('customers-search')?.value);
        if (typeof loadOutstanding === 'function') loadOutstanding();
        // Refresh profile modal if it's currently open for this customer
        const profileModal = document.getElementById('customer-profile-modal');
        if (profileModal && !profileModal.classList.contains('hidden')) {
            viewCustomerProfile(id);
        }
    } catch (err) {
        showAlert('Error', 'Failed to update balance: ' + err.message, 'error');
    }
}

async function deleteCustomer(id, name) {
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Customer?',
        text: `Are you sure you want to delete ${name}? This will NOT remove their transaction history but the profile will be gone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete!'
    });

    if (isConfirmed) {
        try {
            window.isManualAction = true;
            await db.customers.delete(id);
            if (typeof logActivity === 'function') await logActivity(`Deleted Customer: ${name}`);
            showAlert('Deleted', 'Customer record removed successfully');
            renderCustomersList(document.getElementById('customers-search')?.value);
        } catch (err) {
            showAlert('Error', 'Failed to delete customer: ' + err.message, 'error');
        } finally {
            window.isManualAction = false;
        }
    }
}
