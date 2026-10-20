// Bank Management Logic
let currentBankingTab = 'accounts';

async function ensureDefaultAccounts() {
    try {
        const required = [
            { code: '1000', name: 'Cash on Hand', type: 'Asset' },
            { code: '1010', name: 'Bank Account', type: 'Asset' },
            { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
            { code: '5100', name: 'Staff Salaries', type: 'Expense' },
            { code: '5200', name: 'Director Fees', type: 'Expense' },
            { code: '5600', name: 'General Expense', type: 'Expense' }
        ];
        for (const req of required) {
            const exist = await db.accounts.where('code').equals(req.code).first();
            if (!exist) {
                await db.accounts.add(req);
            }
        }
    } catch (err) {
        console.error("Failed to seed default accounts:", err);
    }
}

async function loadBanking() {
    try {
        console.log("Loading Banking module...");
        await ensureDefaultAccounts();
        const container = document.getElementById('banking-view');
        if (!container) return;

        const html = `
            <div class="space-y-6 pb-10">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">BANKING MANAGEMENT</h1>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage accounts and inward/outward transactions</p>
                    </div>
                    <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder">
                        <button onclick="switchBankingTab('accounts')" class="bank-tab-btn px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentBankingTab === 'accounts' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="accounts">Accounts</button>
                        <button onclick="switchBankingTab('inward')" class="bank-tab-btn px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentBankingTab === 'inward' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="inward">Inward (Deposits)</button>
                        <button onclick="switchBankingTab('outward')" class="bank-tab-btn px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentBankingTab === 'outward' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="outward">Outward (Payments)</button>
                    </div>
                </div>

                <div id="banking-summary-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Summary cards will be injected here -->
                </div>

                <div id="banking-tab-content" class="animate-fade-in">
                    <!-- Tab content will be injected here -->
                </div>
            </div>
        `;

        container.innerHTML = html;
        await updateBankingSummary();
        await renderBankingTab(currentBankingTab);
    } catch (error) {
        console.error("Banking Load Error:", error);
    }
}

function switchBankingTab(tab) {
    currentBankingTab = tab;
    loadBanking();
}

async function updateBankingSummary() {
    const summaryContainer = document.getElementById('banking-summary-container');
    if (!summaryContainer) return;

    const accounts = await db.bank_accounts.toArray();
    const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);

    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM

    const transactions = await db.bank_transactions.where('date').startsWith(currentMonth).toArray();
    const totalInward = transactions.filter(t => t.type === 'inward').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalOutward = transactions.filter(t => t.type === 'outward').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    summaryContainer.innerHTML = `
        <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm relative overflow-hidden group hover:border-primary transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Bank Balance</div>
            <h3 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter relative z-10">${formatCurrency(totalBalance)}</h3>
            <div class="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest relative z-10">
                <i class="fa-solid fa-building-columns text-primary"></i> Across ${accounts.length} Accounts
            </div>
        </div>
        <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Inward This Month</div>
            <h3 class="text-3xl font-black text-emerald-500 tracking-tighter relative z-10">${formatCurrency(totalInward)}</h3>
            <div class="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest relative z-10">
                <i class="fa-solid fa-arrow-trend-up text-emerald-500"></i> Deposits & Transfers
            </div>
        </div>
        <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm relative overflow-hidden group hover:border-rose-500 transition-all">
            <div class="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Outward This Month</div>
            <h3 class="text-3xl font-black text-rose-500 tracking-tighter relative z-10">${formatCurrency(totalOutward)}</h3>
            <div class="mt-4 flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest relative z-10">
                <i class="fa-solid fa-arrow-trend-down text-rose-500"></i> Payments & Cheques
            </div>
        </div>
    `;
}

async function renderBankingTab(tab) {
    const content = document.getElementById('banking-tab-content');
    if (!content) return;

    switch (tab) {
        case 'accounts':
            await renderAccountsTab(content);
            break;
        case 'inward':
            await renderTransactionsTab(content, 'inward');
            break;
        case 'outward':
            await renderTransactionsTab(content, 'outward');
            break;
    }
}

async function renderAccountsTab(container) {
    const accounts = await db.bank_accounts.toArray();

    container.innerHTML = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/20">
                <h3 class="text-lg font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">Bank Accounts Master</h3>
                <button onclick="openBankAccountModal()" class="bg-primary hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95">
                    <i class="fa-solid fa-plus-circle"></i> Add New Account
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th class="p-6">Account Name / Details</th>
                            <th class="p-6 text-right">Current Balance</th>
                            <th class="p-6 text-center">Status</th>
                            <th class="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${accounts.length === 0 ? '<tr><td colspan="5" class="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No bank accounts registered.</td></tr>' :
            accounts.map(acc => `
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors group">
                                <td class="p-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-secondary shadow-inner">
                                            <i class="fa-solid fa-university text-xl"></i>
                                        </div>
                                        <div>
                                            <div class="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">${acc.name}</div>
                                            <div class="text-[10px] text-primary font-black uppercase tracking-widest mt-1">${acc.bank_name || 'N/A'} - ${acc.branch || 'N/A'}</div>
                                            <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">A/C: ${acc.account_number || 'N/A'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-6 text-right">
                                    <div class="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter">${formatCurrency(acc.balance)}</div>
                                </td>
                                <td class="p-6 text-center">
                                    <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-200/50 shadow-sm">Active</span>
                                </td>
                                <td class="p-6 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button onclick="openBankAccountModal(${acc.id})" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary transition-all active:scale-95 border border-gray-100 dark:border-gray-700">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button onclick="deleteBankAccount(${acc.id})" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-rose-500 transition-all active:scale-95 border border-gray-100 dark:border-gray-700">
                                            <i class="fa-solid fa-trash"></i>
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

async function renderTransactionsTab(container, type) {
    const transactions = await db.bank_transactions.where('type').equals(type).reverse().toArray();
    const accounts = await db.bank_accounts.toArray();
    const accMap = {};
    accounts.forEach(a => accMap[a.id] = a.name);

    const title = type === 'inward' ? 'Deposit Records' : 'Payment Records';
    const btnText = type === 'inward' ? 'Record New Deposit' : 'Record New Payment';
    const btnColor = type === 'inward' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600';

    container.innerHTML = `
        <div class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-800/20">
                <h3 class="text-lg font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">${title}</h3>
                <div class="flex items-center gap-3">
                    <button onclick="downloadBankingReport('${type}')" class="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-file-pdf text-rose-500"></i> Download Report
                    </button>
                    <button onclick="openTransactionModal('${type}')" class="${btnColor} text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-plus-circle"></i> ${btnText}
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th class="p-6">Date</th>
                            <th class="p-6">Account</th>
                            <th class="p-6">Method</th>
                            <th class="p-6">Reference / Desc</th>
                            <th class="p-6 text-right">Amount</th>
                            <th class="p-6 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${transactions.length === 0 ? `<tr><td colspan="6" class="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No ${type} transactions found.</td></tr>` :
            transactions.map(t => `
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors group">
                                <td class="p-6">
                                    <div class="font-black text-gray-900 dark:text-white uppercase tracking-tighter">${new Date(t.date).toLocaleDateString()}</div>
                                    <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td class="p-6">
                                    <div class="font-bold text-primary dark:text-secondary uppercase italic tracking-tighter">${accMap[t.bank_account_id] || 'Unknown Account'}</div>
                                </td>
                                <td class="p-6">
                                    <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[9px] font-black uppercase rounded-lg border border-gray-200/50">${t.method}</span>
                                </td>
                                <td class="p-6">
                                    <div class="font-bold text-gray-700 dark:text-gray-300 uppercase italic tracking-tighter">${t.reference || 'N/A'}</div>
                                    <div class="text-[10px] text-gray-400 font-medium truncate max-w-xs">${t.description || ''}</div>
                                    ${t.file_name ? `
                                    <div class="mt-1.5">
                                        <button onclick="viewTransactionAttachment(${t.id})" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-800/30 transition-all active:scale-95">
                                            <i class="fa-solid fa-paperclip text-[10px]"></i>
                                            <span>${t.file_name}</span>
                                        </button>
                                    </div>
                                    ` : ''}
                                </td>
                                <td class="p-6 text-right">
                                    <div class="text-xl font-black ${type === 'inward' ? 'text-emerald-500' : 'text-rose-500'} italic tracking-tighter">${formatCurrency(t.amount)}</div>
                                </td>
                                <td class="p-6 text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[9px] font-black uppercase rounded-lg border border-blue-200/50 shadow-sm">${t.status || 'Cleared'}</span>
                                        <button onclick="editBankTransaction(${t.id}, '${type}')" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-700" title="Edit Transaction">
                                            <i class="fa-solid fa-pen-to-square text-[10px]"></i>
                                        </button>
                                        <button onclick="voidBankTransaction(${t.id})" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-gray-700" title="Delete Transaction">
                                            <i class="fa-solid fa-trash-can text-[10px]"></i>
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

async function openBankAccountModal(id = null) {
    let account = { name: '', account_number: '', bank_name: '', branch: '', balance: 0 };
    if (id) {
        account = await db.bank_accounts.get(id);
    }

    const isAdmin = typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin';

    const { value: formValues } = await Swal.fire({
        title: id ? 'Edit Bank Account' : 'Add Bank Account',
        width: '600px',
        html: `
            <div class="text-left space-y-4 p-2">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Company / Account Name</label>
                    <input type="text" id="bank-acc-name" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${account.name}" placeholder="Enter account name...">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank Name</label>
                        <input type="text" id="bank-name" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${account.bank_name || ''}" placeholder="e.g. HNB, BOC...">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Branch</label>
                        <input type="text" id="bank-branch" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${account.branch || ''}" placeholder="e.g. Colombo 03...">
                    </div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Account Number</label>
                    <input type="text" id="bank-acc-num" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${account.account_number || ''}" placeholder="Enter account number...">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Current Available Balance (Rs.)</label>
                    <input type="number" id="bank-acc-balance" class="swal2-input w-full m-0 rounded-2xl font-black" value="${account.balance}" placeholder="0.00" ${(id && !isAdmin) ? 'disabled' : ''}>
                    ${id ? (isAdmin ? '<p class="text-[9px] text-emerald-500 font-bold uppercase mt-1 ml-1">* As Admin, you can directly set the current available balance here.</p>' : '<p class="text-[9px] text-amber-500 font-bold uppercase mt-1 ml-1">* Balance cannot be edited manually. Contact an Administrator.</p>') : ''}
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: id ? 'Update Account' : 'Register Account',
        confirmButtonColor: '#0e3257',
        preConfirm: () => {
            const name = document.getElementById('bank-acc-name').value;
            const bank_name = document.getElementById('bank-name').value;
            const branch = document.getElementById('bank-branch').value;
            const account_number = document.getElementById('bank-acc-num').value;
            const balance = parseFloat(document.getElementById('bank-acc-balance').value) || 0;

            if (!name) {
                Swal.showValidationMessage('Account name is required');
                return false;
            }
            return { name, bank_name, branch, account_number, balance };
        }
    });

    if (formValues) {
        try {
            if (id) {
                const updateData = {
                    name: formValues.name,
                    bank_name: formValues.bank_name,
                    branch: formValues.branch,
                    account_number: formValues.account_number
                };
                if (isAdmin) {
                    updateData.balance = formValues.balance;
                }
                await db.bank_accounts.update(id, updateData);
            } else {
                await db.bank_accounts.add({
                    name: formValues.name,
                    bank_name: formValues.bank_name,
                    branch: formValues.branch,
                    account_number: formValues.account_number,
                    balance: formValues.balance,
                    created_at: new Date().toISOString()
                });
            }
            Swal.fire({ icon: 'success', title: 'Saved!', timer: 1500, showConfirmButton: false });
            loadBanking();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
}

async function openTransactionModal(type) {
    const accounts = await db.bank_accounts.toArray();
    if (accounts.length === 0) {
        Swal.fire('No Accounts', 'Please add a bank account first.', 'warning');
        return;
    }

    let expenseAccounts = [];
    if (type === 'outward') {
        expenseAccounts = await db.accounts.where('type').equals('Expense').toArray();
        if (expenseAccounts.length === 0) {
            await ensureDefaultAccounts();
            expenseAccounts = await db.accounts.where('type').equals('Expense').toArray();
        }
    }

    const title = type === 'inward' ? 'Record Deposit / Inward' : 'Record Payment / Outward';
    const methodOptions = type === 'inward'
        ? ['Cash Deposit', 'Cheque Deposit', 'Bank Transfer']
        : ['Company Cheque', 'Bank Transfer'];

    const { value: formValues } = await Swal.fire({
        title: title,
        width: '600px',
        html: `
            <div class="text-left space-y-4 p-2">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Bank Account</label>
                        <select id="trans-acc-id" class="swal2-select w-full m-0 rounded-2xl font-bold">
                            ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                        <select id="trans-method" class="swal2-select w-full m-0 rounded-2xl font-bold">
                            ${methodOptions.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount (Rs.)</label>
                        <input type="number" id="trans-amount" class="swal2-input w-full m-0 rounded-2xl font-black" placeholder="0.00">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reference # (Cheque/Ref)</label>
                        <input type="text" id="trans-ref" class="swal2-input w-full m-0 rounded-2xl font-bold" placeholder="Optional...">
                    </div>
                </div>
                ${type === 'outward' ? `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Category</label>
                        <select id="trans-category-id" class="swal2-select w-full m-0 rounded-2xl font-bold">
                            ${expenseAccounts.map(e => `<option value="${e.id}" ${e.code === '5600' ? 'selected' : ''}>${e.code} - ${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reference File (JPG, PDF, WEBP)</label>
                        <input type="file" id="trans-file" accept="image/jpeg,image/webp,application/pdf" class="swal2-file w-full m-0 rounded-2xl font-bold" style="padding-top: 10px; padding-bottom: 10px;">
                    </div>
                </div>
                ` : ''}
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description / Memo</label>
                    <textarea id="trans-desc" class="swal2-textarea w-full m-0 rounded-2xl text-sm p-4 h-24" placeholder="Purpose of transaction..."></textarea>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Date</label>
                    <input type="date" id="trans-date" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Transaction',
        confirmButtonColor: type === 'inward' ? '#10b981' : '#f43f5e',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const accId = parseInt(document.getElementById('trans-acc-id').value);
            const method = document.getElementById('trans-method').value;
            const amount = parseFloat(document.getElementById('trans-amount').value) || 0;
            const reference = document.getElementById('trans-ref').value;
            const description = document.getElementById('trans-desc').value;
            const date = document.getElementById('trans-date').value;

            let categoryId = null;
            let fileData = null;
            let fileName = '';
            let filePath = '';

            if (type === 'outward') {
                categoryId = parseInt(document.getElementById('trans-category-id').value);
                const fileInput = document.getElementById('trans-file');
                const file = fileInput ? fileInput.files[0] : null;

                if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                        Swal.showValidationMessage('Reference file size must be less than 10MB');
                        return false;
                    }
                    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
                        Swal.showValidationMessage('Only JPG, WEBP, and PDF files are allowed as references');
                        return false;
                    }
                    try {
                        // Read file as base64
                        fileData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(new Error('Failed to read file'));
                            reader.readAsDataURL(file);
                        });
                        fileName = file.name;

                        // Post to node server `/upload`
                        const uniqueName = Date.now() + '_' + file.name;
                        const renamedFile = new File([file], uniqueName, { type: file.type });
                        const formData = new FormData();
                        formData.append('file', renamedFile);

                        try {
                            const response = await fetch('/upload', {
                                method: 'POST',
                                body: formData
                            });
                            if (response.ok) {
                                filePath = `/uploads/${uniqueName}`;
                            } else {
                                console.warn("Backend file upload rejected, using client base64 storage");
                            }
                        } catch (uploadErr) {
                            console.warn("Backend file upload offline, using client base64 storage:", uploadErr);
                        }
                    } catch (err) {
                        Swal.showValidationMessage('Error reading reference file: ' + err.message);
                        return false;
                    }
                }
            }

            if (amount <= 0) {
                Swal.showValidationMessage('Amount must be greater than zero');
                return false;
            }
            return { accId, method, amount, reference, description, date, categoryId, fileData, fileName, filePath };
        }
    });

    if (formValues) {
        try {
            await db.transaction('rw', [db.bank_transactions, db.bank_accounts, db.ledger, db.accounts], async () => {
                const transId = await db.bank_transactions.add({
                    date: formValues.date + 'T' + new Date().toLocaleTimeString('en-GB'),
                    bank_account_id: formValues.accId,
                    type: type,
                    method: formValues.method,
                    amount: formValues.amount,
                    reference: formValues.reference,
                    description: formValues.description,
                    status: 'Cleared',
                    file_data: formValues.fileData || null,
                    file_name: formValues.fileName || '',
                    file_path: formValues.filePath || ''
                });

                // Update Bank Account Balance
                const acc = await db.bank_accounts.get(formValues.accId);
                const newBalance = type === 'inward' ? acc.balance + formValues.amount : acc.balance - formValues.amount;
                await db.bank_accounts.update(formValues.accId, { balance: newBalance });

                // Record in Ledger
                if (typeof recordTransaction === 'function') {
                    const bankAccName = acc.name;
                    const bankAccIdInLedger = (await db.accounts.where('code').equals('1010').first())?.id || 1010;

                    if (type === 'inward') {
                        // Debit Bank, Credit Cash/Suspense
                        let creditAccId = (await db.accounts.where('code').equals('1000').first())?.id || 1000; // Default to Cash on Hand if deposit
                        if (formValues.method.includes('Transfer')) {
                            creditAccId = (await db.accounts.where('code').equals('4000').first())?.id || 4000;
                        }

                        await recordTransaction(bankAccIdInLedger, formValues.amount, 'debit', `Bank Deposit: ${formValues.method} (${bankAccName}) - Ref: ${formValues.reference}`, 'BankTransaction', transId, formValues.date);
                        await recordTransaction(creditAccId, formValues.amount, 'credit', `Bank Inward: ${formValues.method} to ${bankAccName}`, 'BankTransaction', transId, formValues.date);
                    } else {
                        // Credit Bank, Debit Expense
                        let debitAccId = formValues.categoryId;
                        if (!debitAccId) {
                            debitAccId = (await db.accounts.where('code').equals('5600').first())?.id || 5600; // Default to General Expense
                        }

                        await recordTransaction(debitAccId, formValues.amount, 'debit', `Bank Payment: ${formValues.method} from ${bankAccName} - Category: ${((await db.accounts.get(debitAccId))?.name || 'General Expense')}`, 'BankTransaction', transId, formValues.date);
                        await recordTransaction(bankAccIdInLedger, formValues.amount, 'credit', `Bank Withdrawal: ${formValues.method} (${bankAccName}) - Ref: ${formValues.reference}`, 'BankTransaction', transId, formValues.date);
                    }
                }
            });

            Swal.fire({ icon: 'success', title: 'Transaction Recorded', timer: 1500, showConfirmButton: false });
            loadBanking();
        } catch (err) {
            console.error(err);
            Swal.fire('Error', err.message, 'error');
        }
    }
}

async function editBankTransaction(id, type) {
    const trans = await db.bank_transactions.get(id);
    if (!trans) return;

    const accounts = await db.bank_accounts.toArray();

    let expenseAccounts = [];
    if (type === 'outward') {
        expenseAccounts = await db.accounts.where('type').equals('Expense').toArray();
        if (expenseAccounts.length === 0) {
            await ensureDefaultAccounts();
            expenseAccounts = await db.accounts.where('type').equals('Expense').toArray();
        }
    }

    const methodOptions = type === 'inward'
        ? ['Cash Deposit', 'Cheque Deposit', 'Bank Transfer']
        : ['Company Cheque', 'Bank Transfer'];

    const { value: formValues } = await Swal.fire({
        title: `Edit ${type === 'inward' ? 'Deposit' : 'Payment'} Record`,
        width: '620px',
        html: `
            <div class="text-left space-y-4 p-2">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Bank Account</label>
                        <select id="edit-trans-acc-id" class="swal2-select w-full m-0 rounded-2xl font-bold">
                            ${accounts.map(a => `<option value="${a.id}" ${a.id === trans.bank_account_id ? 'selected' : ''}>${a.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                        <select id="edit-trans-method" class="swal2-select w-full m-0 rounded-2xl font-bold">
                            ${methodOptions.map(m => `<option value="${m}" ${m === trans.method ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount (Rs.)</label>
                        <input type="number" id="edit-trans-amount" class="swal2-input w-full m-0 rounded-2xl font-black" value="${trans.amount}" placeholder="0.00">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reference # (Cheque/Ref)</label>
                        <input type="text" id="edit-trans-ref" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${trans.reference || ''}" placeholder="Optional...">
                    </div>
                </div>
                ${type === 'outward' ? `
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Category</label>
                    <select id="edit-trans-category-id" class="swal2-select w-full m-0 rounded-2xl font-bold">
                        ${expenseAccounts.map(e => `<option value="${e.id}" ${e.id === trans.category_id ? 'selected' : (e.code === '5600' && !trans.category_id ? 'selected' : '')}>${e.code} - ${e.name}</option>`).join('')}
                    </select>
                </div>
                ` : ''}
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description / Memo</label>
                    <textarea id="edit-trans-desc" class="swal2-textarea w-full m-0 rounded-2xl text-sm p-4 h-24" placeholder="Purpose of transaction...">${trans.description || ''}</textarea>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Date</label>
                    <input type="date" id="edit-trans-date" class="swal2-input w-full m-0 rounded-2xl font-bold" value="${(trans.date || '').split('T')[0]}">
                </div>
                ${type === 'outward' ? `
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Replace Reference File (JPG, PDF, WEBP — optional)</label>
                    <input type="file" id="edit-trans-file" accept="image/jpeg,image/webp,application/pdf" class="swal2-file w-full m-0 rounded-2xl font-bold" style="padding-top: 10px; padding-bottom: 10px;">
                    ${trans.file_name ? `<p class="text-[10px] text-gray-500 font-bold ml-1 mt-1">Current: ${trans.file_name}</p>` : ''}
                </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save mr-2"></i> Save Changes',
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const accId = parseInt(document.getElementById('edit-trans-acc-id').value);
            const method = document.getElementById('edit-trans-method').value;
            const amount = parseFloat(document.getElementById('edit-trans-amount').value) || 0;
            const reference = document.getElementById('edit-trans-ref').value;
            const description = document.getElementById('edit-trans-desc').value;
            const date = document.getElementById('edit-trans-date').value;

            if (amount <= 0) {
                Swal.showValidationMessage('Amount must be greater than zero');
                return false;
            }

            let categoryId = trans.category_id || null;
            if (type === 'outward') {
                const catEl = document.getElementById('edit-trans-category-id');
                if (catEl) categoryId = parseInt(catEl.value);
            }

            // Handle optional file replacement
            let fileData = trans.file_data || null;
            let fileName = trans.file_name || '';
            let filePath = trans.file_path || '';

            if (type === 'outward') {
                const fileInput = document.getElementById('edit-trans-file');
                const file = fileInput ? fileInput.files[0] : null;
                if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                        Swal.showValidationMessage('Reference file size must be less than 10MB');
                        return false;
                    }
                    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
                        Swal.showValidationMessage('Only JPG, WEBP, and PDF files are allowed');
                        return false;
                    }
                    try {
                        fileData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = () => reject(new Error('Failed to read file'));
                            reader.readAsDataURL(file);
                        });
                        fileName = file.name;
                        const uniqueName = Date.now() + '_' + file.name;
                        const renamedFile = new File([file], uniqueName, { type: file.type });
                        const formData = new FormData();
                        formData.append('file', renamedFile);
                        try {
                            const response = await fetch('/upload', { method: 'POST', body: formData });
                            if (response.ok) filePath = `/uploads/${uniqueName}`;
                        } catch (e) {
                            console.warn('Backend upload offline, using base64 storage');
                        }
                    } catch (err) {
                        Swal.showValidationMessage('Error reading file: ' + err.message);
                        return false;
                    }
                }
            }

            return { accId, method, amount, reference, description, date, categoryId, fileData, fileName, filePath };
        }
    });

    if (!formValues) return;

    try {
        await db.transaction('rw', [db.bank_transactions, db.bank_accounts, db.ledger], async () => {
            const oldTrans = await db.bank_transactions.get(id);

            // Reverse old balance impact on original account
            const oldAcc = await db.bank_accounts.get(oldTrans.bank_account_id);
            if (oldAcc) {
                const reversedBalance = oldTrans.type === 'inward'
                    ? oldAcc.balance - oldTrans.amount
                    : oldAcc.balance + oldTrans.amount;
                await db.bank_accounts.update(oldTrans.bank_account_id, { balance: reversedBalance });
            }

            // Apply new balance impact on new (or same) account
            const newAcc = await db.bank_accounts.get(formValues.accId);
            if (newAcc) {
                const updatedBalance = type === 'inward'
                    ? newAcc.balance + formValues.amount
                    : newAcc.balance - formValues.amount;
                await db.bank_accounts.update(formValues.accId, { balance: updatedBalance });
            }

            // Remove old ledger entries for this transaction
            await db.ledger.where('reference_id').equals(id)
                .and(l => l.reference_type === 'BankTransaction').delete();

            // Update the transaction record
            await db.bank_transactions.update(id, {
                bank_account_id: formValues.accId,
                method: formValues.method,
                amount: formValues.amount,
                reference: formValues.reference,
                description: formValues.description,
                date: formValues.date + 'T' + new Date().toLocaleTimeString('en-GB'),
                category_id: formValues.categoryId || null,
                file_data: formValues.fileData,
                file_name: formValues.fileName,
                file_path: formValues.filePath
            });

            // Re-record ledger entries
            if (typeof recordTransaction === 'function' && newAcc) {
                const bankAccIdInLedger = (await db.accounts.where('code').equals('1010').first())?.id || 1010;
                if (type === 'inward') {
                    let creditAccId = (await db.accounts.where('code').equals('1000').first())?.id || 1000;
                    if (formValues.method.includes('Transfer')) {
                        creditAccId = (await db.accounts.where('code').equals('4000').first())?.id || 4000;
                    }
                    await recordTransaction(bankAccIdInLedger, formValues.amount, 'debit', `Bank Deposit (Edited): ${formValues.method} (${newAcc.name}) - Ref: ${formValues.reference}`, 'BankTransaction', id, formValues.date);
                    await recordTransaction(creditAccId, formValues.amount, 'credit', `Bank Inward (Edited): ${formValues.method} to ${newAcc.name}`, 'BankTransaction', id, formValues.date);
                } else {
                    let debitAccId = formValues.categoryId;
                    if (!debitAccId) {
                        debitAccId = (await db.accounts.where('code').equals('5600').first())?.id || 5600;
                    }
                    await recordTransaction(debitAccId, formValues.amount, 'debit', `Bank Payment (Edited): ${formValues.method} from ${newAcc.name}`, 'BankTransaction', id, formValues.date);
                    await recordTransaction(bankAccIdInLedger, formValues.amount, 'credit', `Bank Withdrawal (Edited): ${formValues.method} (${newAcc.name}) - Ref: ${formValues.reference}`, 'BankTransaction', id, formValues.date);
                }
            }
        });

        Swal.fire({ icon: 'success', title: 'Transaction Updated!', timer: 1500, showConfirmButton: false });
        loadBanking();
    } catch (err) {
        console.error(err);
        Swal.fire('Error', err.message, 'error');
    }
}

async function voidBankTransaction(id) {
    const confirm = await Swal.fire({
        title: 'Void Transaction?',
        text: "This will reverse the balance adjustment and delete the record.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Void It'
    });

    if (confirm.isConfirmed) {
        try {
            await db.transaction('rw', [db.bank_transactions, db.bank_accounts, db.ledger], async () => {
                const trans = await db.bank_transactions.get(id);
                if (!trans) return;

                // Reverse Bank Account Balance
                const acc = await db.bank_accounts.get(trans.bank_account_id);
                const newBalance = trans.type === 'inward' ? acc.balance - trans.amount : acc.balance + trans.amount;
                await db.bank_accounts.update(trans.bank_account_id, { balance: newBalance });

                // Delete from Ledger
                await db.ledger.where('reference_id').equals(id).and(l => l.reference_type === 'BankTransaction').delete();

                // Delete Transaction Record
                await db.bank_transactions.delete(id);
            });

            Swal.fire({ icon: 'success', title: 'Voided!', timer: 1500, showConfirmButton: false });
            loadBanking();
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }
}

async function deleteBankAccount(id) {
    const transactions = await db.bank_transactions.where('bank_account_id').equals(id).count();
    if (transactions > 0) {
        Swal.fire('Cannot Delete', 'This account has existing transactions. Void them first.', 'error');
        return;
    }

    const confirm = await Swal.fire({
        title: 'Delete Bank Account?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Delete'
    });

    if (confirm.isConfirmed) {
        await db.bank_accounts.delete(id);
        loadBanking();
    }
}

async function downloadBankingReport(type) {
    const transactions = await db.bank_transactions.where('type').equals(type).reverse().toArray();
    const accounts = await db.bank_accounts.toArray();
    const accMap = {};
    accounts.forEach(a => {
        accMap[a.id] = {
            name: a.name,
            bank: a.bank_name || 'N/A',
            branch: a.branch || 'N/A',
            acc_num: a.account_number || 'N/A'
        };
    });

    const title = type === 'inward' ? 'BANK DEPOSIT REPORT' : 'BANK PAYMENT REPORT';
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    let html = `
        <html>
        <head>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                .header { display: flex; justify-between; border-bottom: 4px solid #0e3257; padding-bottom: 20px; margin-bottom: 30px; }
                .title { font-size: 24px; font-weight: 900; color: #0e3257; }
                .meta { font-size: 12px; color: #666; text-align: right; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f8fafc; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                td { padding: 12px; font-size: 10px; border-bottom: 1px solid #f1f5f9; }
                .text-right { text-align: right; }
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                .summary { margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 10px; display: flex; justify-content: flex-end; }
                .summary-box { text-align: right; }
                .summary-label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; }
                .summary-value { font-size: 20px; font-weight: 900; color: #0e3257; }
                .acc-info { font-size: 9px; color: #777; margin-top: 2px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="title">${title}</div>
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">MobileMate POS System</div>
                </div>
                <div class="meta">
                    Report Generated: ${new Date().toLocaleString()}<br>
                    Total Records: ${transactions.length}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Bank / Account Details</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th class="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
        const acc = accMap[t.bank_account_id] || { name: 'Unknown', bank: '-', branch: '-', acc_num: '-' };
        return `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td>
                                <div><b>${acc.name}</b></div>
                                <div class="acc-info">${acc.bank} (${acc.branch})</div>
                                <div class="acc-info">A/C: ${acc.acc_num}</div>
                            </td>
                            <td>${t.method}</td>
                            <td>${t.reference || '-'}</td>
                            <td>${t.description || '-'}</td>
                            <td class="text-right"><b>Rs. ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
                        </tr>
                        `;
    }).join('')}
                </tbody>
            </table>

            <div class="summary">
                <div class="summary-box">
                    <div class="summary-label">Total ${type === 'inward' ? 'Deposited' : 'Paid Out'}</div>
                    <div class="summary-value">Rs. ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div class="footer">
                This is a computer-generated report from MobileMate POS.<br>
                www.mobilemate.lk
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

async function viewTransactionAttachment(id) {
    try {
        const t = await db.bank_transactions.get(id);
        if (!t || (!t.file_data && !t.file_path)) {
            Swal.fire('No Attachment', 'No reference document found for this transaction.', 'info');
            return;
        }

        const mediaSource = t.file_data || t.file_path;
        let mediaContent = '';

        if (mediaSource.startsWith('data:application/pdf') || mediaSource.endsWith('.pdf')) {
            mediaContent = `<iframe src="${mediaSource}" class="w-full h-[60vh] border-0 rounded-2xl" title="Reference PDF"></iframe>`;
        } else {
            mediaContent = `<img src="${mediaSource}" alt="Reference Image" class="w-full h-auto max-h-[60vh] object-contain rounded-2xl" style="min-height: 200px;">`;
        }

        Swal.fire({
            title: '',
            html: `
                <div class="space-y-4 text-left">
                    <div class="flex items-center justify-between px-2">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-secondary shadow-inner">
                                <i class="fa-solid fa-file-invoice text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">${t.file_name || 'Attached File'}</h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Reference # (Cheque/Ref): ${t.reference || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-3xl overflow-hidden border border-gray-100 dark:border-darkBorder shadow-inner bg-gray-50 dark:bg-gray-900 p-2">
                        ${mediaContent}
                    </div>
                </div>
            `,
            width: '800px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-3xl'
            }
        });
    } catch (err) {
        console.error("Failed to view attachment:", err);
        Swal.fire('Error', 'Could not open the reference document: ' + err.message, 'error');
    }
}

// Initialized via app.js navigation
window.loadBanking = loadBanking;
window.downloadBankingReport = downloadBankingReport;
window.viewTransactionAttachment = viewTransactionAttachment;
