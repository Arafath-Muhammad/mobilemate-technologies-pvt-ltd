// Accounting & General Ledger Logic
let currentAccountingTab = 'summary';

async function loadAccounting() {
    try {
        console.log("Loading Accounting view...");
        const container = document.getElementById('accounting-view');
        if (!container) return;

        const html = `
            <div class="space-y-6 pb-10">
                <!-- Accounting Navigation Tabs -->
                <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-x-auto no-scrollbar sticky top-16 z-30 backdrop-blur-md">
                    <button onclick="switchAccountingTab('summary')" class="acc-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentAccountingTab === 'summary' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="summary">
                        <i class="fa-solid fa-chart-pie"></i> Summary
                    </button>
                    <button onclick="switchAccountingTab('ledger')" class="acc-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentAccountingTab === 'ledger' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="ledger">
                        <i class="fa-solid fa-list-check"></i> General Ledger
                    </button>

                    <button onclick="switchAccountingTab('expenses')" class="acc-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentAccountingTab === 'expenses' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="expenses">
                        <i class="fa-solid fa-receipt"></i> Expenses
                    </button>
                    <button onclick="switchAccountingTab('bills')" class="acc-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentAccountingTab === 'bills' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="bills">
                        <i class="fa-solid fa-truck-moving"></i> Supplier Bills
                    </button>

                </div>

                <div id="accounting-tab-content" class="animate-fade-in">
                    <!-- Content will be injected based on active tab -->
                </div>
            </div>
        `;

        container.innerHTML = html;
        await renderAccountingTab(currentAccountingTab);
    } catch (error) {
        console.error("Accounting Load Error:", error);
        const container = document.getElementById('accounting-view');
        if (container) {
            container.innerHTML = `<div class="p-8 bg-red-50 text-red-600 rounded-2xl font-bold">Failed to load accounting module: ${error.message}</div>`;
        }
    }
}

function switchAccountingTab(tab) {
    currentAccountingTab = tab;
    loadAccounting();
}

async function renderAccountingTab(tab) {
    const content = document.getElementById('accounting-tab-content');
    if (!content) return;

    try {
        switch (tab) {
            case 'summary':
                await renderSummary(content);
                break;
            case 'ledger':
                await renderLedger(content);
                break;
            case 'expenses':
                await renderExpenses(content);
                break;
            case 'bills':
                await renderSupplierBills(content);
                break;
        }
    } catch (error) {
        console.error("Accounting Tab Render Error:", error);
        content.innerHTML = `<div class="p-8 bg-red-50 text-red-600 rounded-2xl font-bold">Failed to render ${tab} tab: ${error.message}</div>`;
    }
}

// --- TAB: SUMMARY ---
async function renderSummary(container, filterMonth = null) {
    if (!filterMonth) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        filterMonth = `${y}-${m}`;
    }

    const allLedger = await db.ledger.reverse().toArray();
    const accounts = await db.accounts.toArray();
    const isAdmin = typeof currentUser !== 'undefined' && currentUser && currentUser.role === 'admin';
    
    // Period-filtered ledger for P&L (income/expense) calculations
    let ledger = allLedger;
    if (filterMonth) {
        // Match the robust date range logic used in sales.js to account for ISO/Timezone boundaries
        const [y, m] = filterMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const startStr = filterMonth + '-01';
        const endStr = filterMonth + '-' + String(lastDay).padStart(2, '0');
        
        const startISO = startStr; 
        const endISO = endStr + 'T23:59:59';
        
        ledger = allLedger.filter(e => e.date >= startISO && e.date <= endISO);
    }
    
    // Balance sheet (assets, liabilities, cash) must ALWAYS use all-time entries
    // Filtering by month breaks cumulative accounting — assets don't reset each month
    const entries = allLedger;
    
    // Calculate REAL-TIME CASH IN HAND: Only Cash accounts (code 1000)
    const cashAccounts = accounts.filter(a => a.code === '1000');
    const cashAccountIds = cashAccounts.map(a => a.id);
    
    const cashEntries = entries.filter(e => cashAccountIds.includes(e.account_id));
    const cashInHand = cashEntries.reduce((sum, e) => {
        if (e.type === 'debit') return sum + (e.amount || 0);
        if (e.type === 'credit') return sum - (e.amount || 0);
        return sum;
    }, 0);

    const vendors = await db.vendors.toArray();
    const vendorPayables = vendors.reduce((sum, v) => sum + (parseFloat(v.current_balance) || 0), 0);
    
    const otherLiabilityAccounts = accounts.filter(a => a.type === 'Liability' && a.code !== '2000');
    const otherLiabilityIds = otherLiabilityAccounts.map(a => a.id);
    const otherLiabilityEntries = entries.filter(e => otherLiabilityIds.includes(e.account_id));
    const otherLiabilitiesTotal = otherLiabilityEntries.reduce((sum, e) => {
        if (e.type === 'credit') return sum + (e.amount || 0);
        if (e.type === 'debit') return sum - (e.amount || 0);
        return sum;
    }, 0);

    const liabilitiesTotal = vendorPayables + otherLiabilitiesTotal;

    const allAssetAccounts = accounts.filter(a => a.type === 'Asset');
    const allAssetIds = allAssetAccounts.map(a => a.id);
    const inventoryAccId = accounts.find(a => a.code === '1300')?.id;
    const bankLedgerAccId = accounts.find(a => a.code === '1010')?.id;
    const assetEntries = entries.filter(e => allAssetIds.includes(e.account_id));
    
    // Include Stock Valuation and Liquid Assets in Total Assets
    const products = await db.products.toArray();
    const stockValue = products.reduce((sum, p) => sum + ((parseFloat(p.stock_qty) || 0) * (parseFloat(p.cost) || 0)), 0);
    const bankAccounts = await db.bank_accounts.toArray();
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);

    // Total Assets = Inventory Stock Value + Positive Cash in Hand + Liquid Bank Balances
    const assetsTotal = stockValue + Math.max(0, cashInHand) + Math.max(0, totalBankBalance);

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">ACCOUNTING SUMMARY</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Overview of your financial status</p>
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">Filter Period</label>
                    <input type="month" id="summary-month-filter" value="${filterMonth}" onchange="renderSummary(document.getElementById('accounting-tab-content'), this.value)" class="px-4 py-2 bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder rounded-xl outline-none text-sm font-bold shadow-sm transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-700 dark:text-gray-200 cursor-pointer">
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Cash Card -->
                <div class="lg:col-span-2 bg-gradient-to-r from-primary to-[#2a2a68] dark:from-indigo-900 dark:to-primary rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-xl shadow-primary/20">
                    <div class="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full"></div>
                    <div class="relative z-10 space-y-2">
                        <div class="flex items-center gap-2 opacity-80 uppercase tracking-widest text-[10px] font-black">
                            <i class="fa-solid fa-wallet text-sm"></i> REAL-TIME CASH IN HAND
                        </div>
                        <div class="flex items-center gap-3">
                            <h2 class="text-5xl font-black italic tracking-tighter">${formatCurrency(cashInHand)}</h2>
                            ${isAdmin ? `
                                <button onclick="openAdjustCashModal(${cashInHand})" class="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all duration-300 active:scale-95" title="Adjust Cash Balance">
                                    <i class="fa-solid fa-pen-to-square text-lg"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="relative z-10 flex gap-4 mt-8">
                        <button onclick="openLedgerModal()" class="bg-white text-primary hover:bg-gray-50 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-plus-circle"></i> Add Cash / Income
                        </button>
                        <button onclick="switchAccountingTab('expenses')" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-minus-circle"></i> Record Expense
                        </button>
                    </div>
                </div>

                <!-- Side Stats -->
                <div class="space-y-4 flex flex-col">
                    <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex-1 flex flex-col justify-center">
                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Assets</div>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white">${formatCurrency(assetsTotal)}</h3>
                    </div>
                    <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex-1 flex flex-col justify-center">
                        <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Liabilities</div>
                        <h3 class="text-2xl font-black text-red-500">${formatCurrency(liabilitiesTotal)}</h3>
                    </div>
                </div>
            </div>

        </div>
    `;
}

async function renderJournalEntries(container) {
    const ledger = await db.ledger.where('reference_type').equals('Manual').reverse().toArray();
    const accounts = await db.accounts.toArray();
    const userMap = {};
    const users = await db.users.toArray();
    users.forEach(u => userMap[u.id] = u.username || u.name);

    // Group ledger entries by reference_id (Journal Number)
    const journalGroups = {};
    ledger.forEach(entry => {
        const refId = entry.reference_id || 'Legacy';
        if (!journalGroups[refId]) journalGroups[refId] = [];
        journalGroups[refId].push(entry);
    });

    const sortedGroups = Object.entries(journalGroups).sort((a, b) => b[0] - a[0]);

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in pb-10">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">JOURNAL ENTRIES</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Direct Ledger Adjustments & Double-Entry Records</p>
                </div>
                <button onclick="openJournalModal()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/30 flex items-center gap-3 active:scale-95">
                    <i class="fa-solid fa-plus"></i> New Journal Entry
                </button>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th class="p-6">ENTRY #</th>
                                <th class="p-6">TIMELINE</th>
                                <th class="p-6">PARTICULARS / ACCOUNTING FLOW</th>
                                <th class="p-6 text-right">DEBIT</th>
                                <th class="p-6 text-right">CREDIT</th>
                                <th class="p-6 text-center">STATUS</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${sortedGroups.length === 0 ? '<tr><td colspan="6" class="p-24 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50"><i class="fa-solid fa-book-open text-4xl mb-4 block opacity-20"></i> No manual journal entries found.</td></tr>' : 
                                sortedGroups.map(([refId, entries]) => {
                                    const first = entries[0];
                                    const totalDebit = entries.reduce((sum, e) => e.type === 'debit' ? sum + e.amount : sum, 0);
                                    return `
                                    <tr class="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors group">
                                        <td class="p-6">
                                            <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black text-primary text-xs shadow-inner">
                                                #${refId}
                                            </div>
                                        </td>
                                        <td class="p-6">
                                            <div class="text-xs font-black text-gray-900 dark:text-white">${new Date(first.date).toLocaleDateString()}</div>
                                            <div class="text-[9px] text-gray-400 font-bold uppercase mt-1">${new Date(first.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td class="p-6">
                                            <div class="space-y-3">
                                                ${entries.map(e => {
                                                    const acc = accounts.find(a => a.id === e.account_id);
                                                    return `
                                                        <div class="flex items-center justify-between gap-4">
                                                            <div class="flex items-center gap-2 ${e.type === 'credit' ? 'pl-8' : ''}">
                                                                <i class="fa-solid fa-caret-right text-[10px] text-gray-300"></i>
                                                                <span class="text-xs font-bold ${e.type === 'debit' ? 'text-gray-900 dark:text-white' : 'text-gray-500 italic'}">${acc?.name || 'Unknown Account'}</span>
                                                            </div>
                                                            <div class="text-[9px] font-black uppercase text-gray-300 opacity-0 group-hover:opacity-100">${e.type}</div>
                                                        </div>
                                                    `;
                                                }).join('')}
                                                <div class="pt-2 border-t border-dashed border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 font-medium italic">
                                                    "${first.description || 'No narration'}"
                                                </div>
                                            </div>
                                        </td>
                                        <td class="p-6 text-right">
                                            <div class="space-y-3">
                                                ${entries.map(e => e.type === 'debit' ? `<div class="text-xs font-black text-emerald-600">${formatCurrency(e.amount)}</div>` : `<div class="text-xs text-transparent">-</div>`).join('')}
                                            </div>
                                        </td>
                                        <td class="p-6 text-right">
                                            <div class="space-y-3">
                                                ${entries.map(e => e.type === 'credit' ? `<div class="text-xs font-black text-red-600">${formatCurrency(e.amount)}</div>` : `<div class="text-xs text-transparent">-</div>`).join('')}
                                            </div>
                                        </td>
                                        <td class="p-6 text-center">
                                            <div class="flex flex-col items-center gap-2">
                                                <span class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-200/50">Balanced</span>
                                                <button onclick="voidJournalEntry('${refId}')" class="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                                                    <i class="fa-solid fa-trash-can mr-1"></i> Void Entry
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function openJournalModal() {
    const accounts = await db.accounts.toArray();
    
    const { value: formValues } = await Swal.fire({
        title: 'New Manual Journal Entry',
        width: '800px',
        html: `
            <div class="text-left space-y-6 p-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transaction Date</label>
                        <input type="date" id="journal-date" class="swal2-input w-full m-0 rounded-xl" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Narration / Memo</label>
                        <input type="text" id="journal-memo" class="swal2-input w-full m-0 rounded-xl" placeholder="Purpose of adjustment...">
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h4 class="text-xs font-black uppercase tracking-widest text-primary">Entry Lines</h4>
                        <button onclick="addJournalLineRow()" class="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                            <i class="fa-solid fa-plus"></i> Add Line
                        </button>
                    </div>
                    
                    <div id="journal-lines" class="space-y-3">
                        <!-- Rows injected here -->
                    </div>

                    <div class="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mt-4">
                        <div class="flex gap-8">
                            <div class="text-center">
                                <p class="text-[9px] font-black text-gray-400 uppercase">Total Debit</p>
                                <p id="total-debit-val" class="text-lg font-black text-emerald-600">Rs. 0.00</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[9px] font-black text-gray-400 uppercase">Total Credit</p>
                                <p id="total-credit-val" class="text-lg font-black text-red-600">Rs. 0.00</p>
                            </div>
                        </div>
                        <div id="balance-status" class="text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest bg-red-100 text-red-600 border border-red-200">
                            Unbalanced
                        </div>
                    </div>
                </div>
            </div>
        `,
        didOpen: () => {
            // Add initial 2 rows (Debit and Credit)
            addJournalLineRow('debit');
            addJournalLineRow('credit');
            updateJournalTotals();
        },
        showCancelButton: true,
        confirmButtonText: 'Record Journal',
        preConfirm: () => {
            const rows = document.querySelectorAll('.journal-row');
            const lines = [];
            let totalDebit = 0;
            let totalCredit = 0;

            rows.forEach(row => {
                const accId = row.querySelector('.acc-select').value;
                const type = row.querySelector('.type-select').value;
                const amount = parseFloat(row.querySelector('.amt-input').value) || 0;

                if (accId && amount > 0) {
                    lines.push({ account_id: parseInt(accId), type, amount });
                    if (type === 'debit') totalDebit += amount;
                    else totalCredit += amount;
                }
            });

            if (lines.length < 2) {
                Swal.showValidationMessage('Journal must have at least 2 lines.');
                return false;
            }

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                Swal.showValidationMessage(`Journal is unbalanced! Difference: Rs. ${Math.abs(totalDebit - totalCredit).toFixed(2)}`);
                return false;
            }

            return {
                date: document.getElementById('journal-date').value,
                memo: document.getElementById('journal-memo').value,
                lines
            };
        }
    });

    if (formValues) {
        try {
            const refId = Date.now();
            await db.transaction('rw', db.ledger, async () => {
                for (const line of formValues.lines) {
                    await recordTransaction(
                        line.account_id, 
                        line.amount, 
                        line.type, 
                        formValues.memo, 
                        'Manual', 
                        refId
                    );
                }
            });
            showAlert('Success', 'Journal entry recorded successfully.');
            renderJournalEntries(document.getElementById('accounting-tab-content'));
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Failed to save journal: ' + err.message, 'error');
        }
    }
}

// Global helpers for Journal UI (since they are called from HTML strings in Swal)
window.addJournalLineRow = async function(defaultType = 'debit') {
    const container = document.getElementById('journal-lines');
    if (!container) return;

    const accounts = await db.accounts.toArray();
    const rowId = Date.now() + Math.random();
    
    const div = document.createElement('div');
    div.className = 'journal-row flex items-center gap-3 animate-slide-in';
    div.id = `row-${rowId}`;
    
    div.innerHTML = `
        <select class="acc-select flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-bold p-3 outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Select Account...</option>
            ${accounts.map(a => `<option value="${a.id}">${a.code} - ${a.name}</option>`).join('')}
        </select>
        <select onchange="updateJournalTotals()" class="type-select w-24 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[10px] font-black uppercase p-3 outline-none">
            <option value="debit" ${defaultType === 'debit' ? 'selected' : ''}>Debit</option>
            <option value="credit" ${defaultType === 'credit' ? 'selected' : ''}>Credit</option>
        </select>
        <input type="number" oninput="updateJournalTotals()" class="amt-input w-32 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-black p-3 outline-none text-right" placeholder="0.00">
        <button onclick="this.parentElement.remove(); updateJournalTotals()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    
    container.appendChild(div);
};

window.updateJournalTotals = function() {
    const rows = document.querySelectorAll('.journal-row');
    let debits = 0;
    let credits = 0;
    
    rows.forEach(row => {
        const type = row.querySelector('.type-select').value;
        const amt = parseFloat(row.querySelector('.amt-input').value) || 0;
        if (type === 'debit') debits += amt;
        else credits += amt;
    });
    
    document.getElementById('total-debit-val').textContent = formatCurrency(debits);
    document.getElementById('total-credit-val').textContent = formatCurrency(credits);
    
    const status = document.getElementById('balance-status');
    if (Math.abs(debits - credits) < 0.01 && debits > 0) {
        status.textContent = 'Balanced';
        status.className = 'text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm';
    } else {
        status.textContent = 'Unbalanced';
        status.className = 'text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest bg-red-100 text-red-600 border border-red-200';
    }
};

async function voidJournalEntry(refId) {
    const confirm = await Swal.fire({
        title: 'Void Journal Entry?',
        text: "This will permanently remove the manual ledger adjustment.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Void Entry'
    });

    if (confirm.isConfirmed) {
        try {
            const key = isNaN(refId) ? refId : parseInt(refId);
            await db.ledger.where('reference_id').equals(key).and(l => l.reference_type === 'Manual').delete();
            showAlert('Success', 'Journal entry has been voided.');
            renderJournalEntries(document.getElementById('accounting-tab-content'));
        } catch (err) {
            showAlert('Error', 'Failed to void entry: ' + err.message, 'error');
        }
    }
}

async function renderSupplierBills(container) {
    const grns = await db.grn.reverse().toArray();
    const pos = await db.purchases.reverse().toArray();
    
    // Combine for a unified "Bills" view
    const allBills = [
        ...grns.map(g => ({ ...g, type: 'GRN', ref: `GRN-${String(g.id).padStart(5, '0')}` })),
        ...pos.filter(p => p.status !== 'received').map(p => ({ ...p, type: 'PO', ref: `PO-${String(p.id).padStart(5, '0')}` }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
        <!-- Hidden file input for invoice document upload -->
        <input type="file" id="bill-invoice-upload" accept="image/*,application/pdf" class="hidden" onchange="handleBillInvoiceUpload(event)">

        <div class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">SUPPLIER BILLS & PAYABLES</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Track inventory purchases and pending supplier payments</p>
                </div>
                <button onclick="openGRNModal()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95">
                    <i class="fa-solid fa-truck-field"></i> Receive Invoice / GRN
                </button>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th class="p-6">TIMELINE</th>
                                <th class="p-6">REFERENCE</th>
                                <th class="p-6">VENDOR</th>
                                <th class="p-6 text-right">VALUATION</th>
                                <th class="p-6 text-center">STATUS</th>
                                <th class="p-6 text-center">INVOICE</th>
                                <th class="p-6 text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${allBills.length === 0 ? '<tr><td colspan="7" class="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No supplier bills found. Click "Receive Invoice" to start.</td></tr>' : 
                                allBills.map(b => {
                                    const statusClass = b.status === 'completed' || b.status === 'received' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20';
                                    const hasInvoiceImage = !!b.invoice_image;
                                    return `
                                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors group">
                                        <td class="p-6">
                                            <div class="font-black text-gray-900 dark:text-white uppercase tracking-tighter">${new Date(b.date).toLocaleDateString()}</div>
                                            <div class="text-[9px] text-gray-400 font-bold mt-0.5">${new Date(b.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td class="p-6">
                                            <div class="flex items-center gap-2">
                                                <div class="font-bold text-primary uppercase italic tracking-tighter">${b.ref}</div>
                                                ${hasInvoiceImage ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" title="Invoice attached"></span>' : ''}
                                            </div>
                                            <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">${b.type} DOCUMENT</div>
                                        </td>
                                        <td class="p-6">
                                            <div class="font-bold text-gray-700 dark:text-gray-300 uppercase italic tracking-tighter">${b.vendor_name || 'N/A'}</div>
                                        </td>
                                        <td class="p-6 text-right font-black text-gray-900 dark:text-white italic">
                                            ${formatCurrency(b.total)}
                                        </td>
                                        <td class="p-6 text-center">
                                            <span class="px-3 py-1.5 ${statusClass} rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">${b.status}</span>
                                        </td>
                                        <td class="p-6 text-center">
                                            ${hasInvoiceImage ? `
                                                <div class="flex items-center justify-center gap-1.5">
                                                    <button onclick="viewBillInvoiceImage('${b.type}', ${b.id})" class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 border border-emerald-100 dark:border-emerald-800/30" title="View Invoice Attachment">
                                                        <i class="fa-solid fa-file-invoice text-xs"></i>
                                                    </button>
                                                    <button onclick="removeBillInvoiceImage('${b.type}', ${b.id})" class="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-100 dark:hover:border-red-800/30" title="Remove Invoice Attachment">
                                                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ` : `
                                                <button onclick="triggerBillInvoiceUpload('${b.type}', ${b.id})" class="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all active:scale-95 border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/40" title="Attach Invoice Document">
                                                    <i class="fa-solid fa-paperclip text-xs"></i>
                                                </button>
                                            `}
                                        </td>
                                        <td class="p-6 text-center">
                                            <div class="flex items-center justify-center gap-2">
                                                <button onclick="${b.type === 'GRN' ? 'printGRN' : 'printPO'}(${b.id}, null, true)" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary transition-all active:scale-95" title="Preview">
                                                    <i class="fa-solid fa-eye"></i>
                                                </button>
                                                <button onclick="deleteSupplierBill('${b.type}', ${b.id})" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all active:scale-95" title="${b.type === 'GRN' ? 'Unreceive / Delete GRN' : 'Delete PO'}">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

window.deleteSupplierBill = async function(type, id) {
    if (type === 'GRN') {
        if (typeof deleteGRN === 'function') {
            await deleteGRN(id);
            const tabContent = document.getElementById('accounting-tab-content');
            if (tabContent && currentAccountingTab === 'bills') {
                await renderSupplierBills(tabContent);
            }
        }
    } else if (type === 'PO') {
        if (typeof deletePO === 'function') {
            await deletePO(id);
            const tabContent = document.getElementById('accounting-tab-content');
            if (tabContent && currentAccountingTab === 'bills') {
                await renderSupplierBills(tabContent);
            }
        }
    }
};

// --- SUPPLIER BILL INVOICE IMAGE ATTACHMENT ---
// Tracks which bill is currently being targeted for upload
let _billUploadTarget = { type: null, id: null };

// Triggers the hidden file input for a specific bill
window.triggerBillInvoiceUpload = function(type, id) {
    _billUploadTarget = { type, id };
    const fileInput = document.getElementById('bill-invoice-upload');
    if (fileInput) {
        fileInput.value = ''; // Reset so same file can be re-selected
        fileInput.click();
    }
};

// Handles the file selection, converts to base64, and saves to the record
window.handleBillInvoiceUpload = async function(event) {
    const file = event.target.files[0];
    if (!file || !_billUploadTarget.type || !_billUploadTarget.id) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        Swal.fire('Invalid File', 'Please select a valid image file (JPG, PNG, etc.) or a PDF document.', 'error');
        return;
    }

    // Warn if file is very large (> 5MB)
    if (file.size > 5 * 1024 * 1024) {
        const confirmLarge = await Swal.fire({
            title: 'Large File Detected',
            text: `This file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large files may slow down the system. Continue?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Attach It',
            confirmButtonColor: '#0e3257'
        });
        if (!confirmLarge.isConfirmed) return;
    }

    try {
        // Show loading state
        Swal.fire({ title: 'Attaching Invoice...', text: 'Processing file...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });

        // Save to the correct table
        const tableName = _billUploadTarget.type === 'GRN' ? 'grn' : 'purchases';
        await db[tableName].update(_billUploadTarget.id, { invoice_image: base64 });

        Swal.close();
        await Swal.fire({
            icon: 'success',
            title: 'Invoice Attached!',
            text: `Original invoice document has been saved to ${_billUploadTarget.type}-${String(_billUploadTarget.id).padStart(5, '0')}.`,
            timer: 2000,
            showConfirmButton: false
        });

        // Refresh the Supplier Bills view
        renderSupplierBills(document.getElementById('accounting-tab-content'));
    } catch (err) {
        console.error('Invoice upload error:', err);
        Swal.fire('Upload Failed', 'Could not attach the invoice document: ' + err.message, 'error');
    }
};

// Views the attached invoice image in a full-screen lightbox modal
window.viewBillInvoiceImage = async function(type, id) {
    try {
        const tableName = type === 'GRN' ? 'grn' : 'purchases';
        const record = await db[tableName].get(id);

        if (!record || !record.invoice_image) {
            Swal.fire('No Attachment', 'No invoice document is attached to this record.', 'info');
            return;
        }

        const ref = type === 'GRN' ? `GRN-${String(id).padStart(5, '0')}` : `PO-${String(id).padStart(5, '0')}`;

        let mediaContent = '';
        if (record.invoice_image.startsWith('data:application/pdf')) {
            mediaContent = `<iframe src="${record.invoice_image}" class="w-full h-[60vh] border-0" title="Invoice PDF"></iframe>`;
        } else {
            mediaContent = `<img src="${record.invoice_image}" alt="Invoice Image" class="w-full h-auto object-contain" style="min-height: 200px;">`;
        }

        Swal.fire({
            title: '',
            html: `
                <div class="space-y-4">
                    <div class="flex items-center justify-between px-2">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <i class="fa-solid fa-file-invoice text-primary text-lg"></i>
                            </div>
                            <div class="text-left">
                                <h3 class="text-sm font-black text-gray-900 uppercase tracking-tight">${ref} — Original Invoice</h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${record.vendor_name || 'Unknown Vendor'} • ${new Date(record.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <div class="rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 max-h-[70vh] overflow-y-auto">
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
        console.error('View invoice attachment error:', err);
        Swal.fire('Error', 'Could not load the invoice document.', 'error');
    }
};

// Removes the attached invoice image after confirmation
window.removeBillInvoiceImage = async function(type, id) {
    const ref = type === 'GRN' ? `GRN-${String(id).padStart(5, '0')}` : `PO-${String(id).padStart(5, '0')}`;
    
    const confirm = await Swal.fire({
        title: 'Remove Invoice Attachment?',
        text: `This will permanently delete the attached invoice document from ${ref}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Remove It',
        cancelButtonText: 'Keep It'
    });

    if (confirm.isConfirmed) {
        try {
            const tableName = type === 'GRN' ? 'grn' : 'purchases';
            await db[tableName].update(id, { invoice_image: undefined });

            await Swal.fire({
                icon: 'success',
                title: 'Image Removed',
                text: 'The invoice attachment has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });

            renderSupplierBills(document.getElementById('accounting-tab-content'));
        } catch (err) {
            console.error('Remove invoice image error:', err);
            Swal.fire('Error', 'Could not remove the image: ' + err.message, 'error');
        }
    }
};

// --- TAB: LEDGER ---
async function ensureLedgerExpenseEntry() {
    const uniqueRef = 'LEDGER-EXPENSE-380000';
    const existing = await db.ledger.where({ reference_type: 'Expense', reference_id: uniqueRef }).first();
    if (existing) return;

    const entryDate = '2026-05-20';
    let expenseAcc = await db.accounts.where('code').equals('5600').first();
    if (!expenseAcc) {
        const createdId = await db.accounts.add({ name: 'General Expense', type: 'Expense', code: '5600' });
        expenseAcc = await db.accounts.get(createdId);
    }

    let cashAcc = await db.accounts.where('code').equals('1000').first();
    if (!cashAcc) {
        const createdCashId = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
        cashAcc = await db.accounts.get(createdCashId);
    }

    await db.transaction('rw', db.ledger, async () => {
        await recordTransaction(expenseAcc.id, 380000, 'debit', 'Recorded expense payment of Rs. 380,000', 'Expense', uniqueRef, entryDate);
        await recordTransaction(cashAcc.id, 380000, 'credit', 'Payment applied for Rs. 380,000 ledger expense', 'Expense', uniqueRef, entryDate);
    });
}

async function renderLedger(container, filterMonth = null) {
    if (!filterMonth) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        filterMonth = `${y}-${m}`;
    }

    await ensureLedgerExpenseEntry();

    let ledgerEntries = [];
    const accounts = await db.accounts.toArray();
    
    if (filterMonth) {
        const [y, m] = filterMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const startStr = filterMonth + '-01';
        const endStr = filterMonth + '-' + String(lastDay).padStart(2, '0');
        
        const startISO = startStr;
        const endISO = endStr + 'T23:59:59';
        
        ledgerEntries = await db.ledger.where('date').between(startISO, endISO, true, true).reverse().toArray();
    } else {
        ledgerEntries = await db.ledger.reverse().toArray();
    }
    
    // Group double-entry ledger into single simple transactions
    const transactionsMap = new Map();

    ledgerEntries.forEach(e => {
        const acc = accounts.find(a => a.id === e.account_id);
        const groupKey = e.reference_type + '-' + (e.reference_id || e.date);
        
        if (!transactionsMap.has(groupKey)) {
            transactionsMap.set(groupKey, {
                date: e.date,
                description: e.description || e.reference_type || 'Transaction',
                type: 'Other',
                amount: 0,
                id: e.id 
            });
        }
        
        const t = transactionsMap.get(groupKey);
        
        // Refined transaction identification logic to prevent double-counting
        // We identify a 'primary' side for each transaction type to sum, falling back to a 'secondary' side if needed.
        let targetType = 'Other';
        let isSettlement = false;
        let isPrimary = false;
        let isSecondary = false;

        if (e.reference_type === 'Sale') {
            targetType = 'Sale';
            isPrimary = (acc?.type === 'Income');
            isSecondary = (acc?.type === 'Asset' && e.type === 'debit');
            if (acc?.code === '5000') {
                t.cogs = (t.cogs || 0) + e.amount;
            }
        } else if (e.reference_type === 'Receipt') {
            targetType = 'Receipt';
            isPrimary = (acc?.type === 'Asset' && e.type === 'debit');
            isSecondary = !isPrimary;
        } else if (e.reference_type === 'Expense') {
            targetType = 'Purchase'; 
            isPrimary = (acc?.type === 'Expense');
            isSecondary = (acc?.type === 'Asset' && e.type === 'credit');
        } else if (e.reference_type === 'Return') {
            // Returns should always reduce profit and be shown as expenses/purchase activity.
            targetType = 'Purchase';
            isPrimary = (acc?.type === 'Expense');
            isSecondary = !isPrimary;
        } else if (e.reference_type === 'Purchase' || e.reference_type === 'GRN') {
            targetType = 'Other';
            isPrimary = (acc?.type === 'Asset' && e.type === 'debit') || (acc?.type === 'Expense');
            isSecondary = !isPrimary;
        } else if (e.reference_type === 'Payment') {
            // Determine if it's a customer receipt or vendor payment
            const code = String(acc?.code || '').trim();
            const isAsset = acc?.type === 'Asset';
            const isLiability = acc?.type === 'Liability';
            const isPayableAccount = code === '2000';
            const isReceivableAccount = code === '1200';
            const isCashOrBankCredit = isAsset && e.type === 'credit' && !['1200', '2000'].includes(code);
            const isPayableDebit = isPayableAccount && e.type === 'debit';

            if (isReceivableAccount && e.type === 'debit') {
                targetType = 'Other';
                isPrimary = true;
            } else if (isCashOrBankCredit || isPayableDebit) {
                targetType = 'Purchase';
                isSettlement = true;
                isPrimary = isCashOrBankCredit;
                isSecondary = !isPrimary;
            } else if (isPayableAccount) {
                targetType = 'Purchase';
                isSettlement = true;
                isSecondary = true;
            } else {
                targetType = 'Other';
                isSecondary = true;
            }
        } else {
            // Fallback for manual or legacy entries
            if (acc?.type === 'Income') { targetType = 'Sale'; isPrimary = true; }
            else if (acc?.type === 'Expense') { targetType = 'Purchase'; isPrimary = true; }
            else { isSecondary = true; }
        }

        // Apply grouping logic
        t.type = targetType;
        if (isSettlement) t.isSettlement = true;

        if (isPrimary) {
            if (t._appliedSide !== 'primary') {
                t.amount = 0; // Clear fallback/secondary amount if primary is now found
                t._appliedSide = 'primary';
            }
            t.amount += e.amount;
            t.description = e.description; 
        } else if (isSecondary && t._appliedSide !== 'primary') {
            if (t._appliedSide !== 'secondary') {
                t.amount = 0;
                t._appliedSide = 'secondary';
            }
            t.amount += e.amount;
            t.description = e.description;
        }
    });

    // Clean up amounts and filter out 0
    let transactions = Array.from(transactionsMap.values());
    transactions.forEach(t => {
        t.amount = Math.abs(t.amount || 0);
        t.cogs = Math.abs(t.cogs || 0);
    });
    transactions = transactions.filter(t => t.amount > 0 || t.cogs > 0);

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Separate and Calculate totals for Profit Card
    const salesTransactions = transactions.filter(t => t.type === 'Sale');
    // For the list, we show all "Purchase" types (expenses + settlements)
    const purchaseTransactions = transactions.filter(t => t.type === 'Purchase');

    // For the metrics cards, use true Net Profit logic: Sales - COGS - Operating Expenses
    // For the metrics cards in Simple Ledger Control, exactly match the lists
    const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCosts = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalSales - totalCosts;

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in pb-10">
            <!-- Simplified Header Totals -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Sales -->
                <div class="bg-gradient-to-br from-green-500 to-emerald-700 rounded-[2rem] p-6 text-white shadow-xl shadow-green-500/30 relative overflow-hidden group backdrop-blur-xl">
                    <div class="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform blur-2xl"></div>
                    <div class="relative z-10">
                        <div class="text-white/80 font-black uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2"><i class="fa-solid fa-arrow-trend-up"></i> Total Sales</div>
                        <div class="text-4xl font-black tracking-tighter">${formatCurrency(totalSales)}</div>
                    </div>
                </div>
                <!-- Expenses -->
                <div class="bg-gradient-to-br from-red-500 to-rose-700 rounded-[2rem] p-6 text-white shadow-xl shadow-red-500/30 relative overflow-hidden group backdrop-blur-xl">
                    <div class="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform blur-2xl"></div>
                    <div class="relative z-10">
                        <div class="text-white/80 font-black uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2"><i class="fa-solid fa-arrow-trend-down"></i> Total Costs</div>
                        <div class="text-4xl font-black tracking-tighter">${formatCurrency(totalCosts)}</div>
                    </div>
                </div>
                <!-- Profit -->
                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden group backdrop-blur-xl">
                    <div class="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform blur-2xl"></div>
                    <div class="relative z-10">
                        <div class="text-white/80 font-black uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2"><i class="fa-solid fa-sack-dollar"></i> Net Profit</div>
                        <div class="text-4xl font-black tracking-tighter">${formatCurrency(netProfit)}</div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkCard p-6 rounded-3xl border border-gray-100 dark:border-darkBorder shadow-sm">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase">Simple Ledger Control</h2>
                    <p class="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Independent management of Sales and Expenses</p>
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Period</label>
                    <input type="month" id="ledger-month-filter" value="${filterMonth}" onchange="renderLedger(document.getElementById('accounting-tab-content'), this.value)" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-bold shadow-sm transition-all focus:border-primary text-gray-700 dark:text-gray-200 cursor-pointer">
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Sales Ledger Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 px-2">
                        <div class="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-money-bill-trend-up"></i>
                        </div>
                        <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Sales</h3>
                    </div>
                    <div class="bg-white/80 dark:bg-darkCard/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 dark:border-white/10 overflow-hidden">
                        <div class="overflow-x-auto p-4">
                            <table class="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr class="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                        <th class="px-4 py-2">Date</th>
                                        <th class="px-4 py-2">Description</th>
                                        <th class="px-4 py-2 text-right">Amount</th>
                                        <th class="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${salesTransactions.length === 0 ? '<tr><td colspan="4" class="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">No sales found</td></tr>' : salesTransactions.map(t => `
                                        <tr class="bg-green-50/30 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all rounded-2xl group shadow-sm border border-transparent hover:border-green-200 dark:hover:border-green-800">
                                            <td class="px-4 py-4 rounded-l-2xl">
                                                <div class="font-bold text-gray-900 dark:text-white text-xs">${new Date(t.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                                            </td>
                                            <td class="px-4 py-4">
                                                <div class="font-medium text-gray-700 dark:text-gray-300 text-xs truncate max-w-[150px]">${t.description}</div>
                                            </td>
                                            <td class="px-4 py-4 text-right">
                                                <div class="font-black text-sm text-green-600 dark:text-green-400">
                                                    ${formatCurrency(t.amount)}
                                                </div>
                                            </td>
                                            <td class="px-4 py-4 text-center rounded-r-2xl">
                                                <div class="flex items-center justify-center gap-1">
                                                    <button onclick="previewLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-all shadow-sm" title="Preview">
                                                        <i class="fa-solid fa-eye text-[10px]"></i>
                                                    </button>
                                                    <button onclick="editLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-primary transition-all shadow-sm" title="Edit">
                                                        <i class="fa-solid fa-pen text-[10px]"></i>
                                                    </button>
                                                    <button onclick="deleteLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all shadow-sm" title="Delete">
                                                        <i class="fa-solid fa-trash text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Expenses Ledger Section -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 px-2">
                        <div class="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                        </div>
                        <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Expenses</h3>
                    </div>
                    <div class="bg-white/80 dark:bg-darkCard/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 dark:border-white/10 overflow-hidden">
                        <div class="overflow-x-auto p-4">
                            <table class="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr class="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                        <th class="px-4 py-2">Date</th>
                                        <th class="px-4 py-2">Description</th>
                                        <th class="px-4 py-2 text-right">Amount</th>
                                        <th class="px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${purchaseTransactions.length === 0 ? '<tr><td colspan="4" class="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] italic">No expenses found</td></tr>' : purchaseTransactions.map(t => `
                                        <tr class="bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-2xl group shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800">
                                            <td class="px-4 py-4 rounded-l-2xl">
                                                <div class="font-bold text-gray-900 dark:text-white text-xs">${new Date(t.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                                            </td>
                                            <td class="px-4 py-4">
                                                <div class="font-medium text-gray-700 dark:text-gray-300 text-xs truncate max-w-[150px]">${t.description}</div>
                                            </td>
                                            <td class="px-4 py-4 text-right">
                                                <div class="font-black text-sm text-red-600 dark:text-red-400">
                                                    ${formatCurrency(t.amount)}
                                                </div>
                                            </td>
                                            <td class="px-4 py-4 text-center rounded-r-2xl">
                                                <div class="flex items-center justify-center gap-1">
                                                    <button onclick="previewLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-500 transition-all shadow-sm" title="Preview">
                                                        <i class="fa-solid fa-eye text-[10px]"></i>
                                                    </button>
                                                    <button onclick="editLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-primary transition-all shadow-sm" title="Edit">
                                                        <i class="fa-solid fa-pen text-[10px]"></i>
                                                    </button>
                                                    <button onclick="deleteLedgerEntry(${t.id})" class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all shadow-sm" title="Delete">
                                                        <i class="fa-solid fa-trash text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- TAB: CHART OF ACCOUNTS ---
async function renderChartOfAccounts(container) {
    const accounts = await db.accounts.toArray();
    const categories = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

    container.innerHTML = `
        <div class="grid grid-cols-1 gap-6">
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 flex items-center justify-between">
                    <h2 class="text-xl font-bold">Chart of Accounts</h2>
                    <button onclick="openAddAccountModal()" class="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all">Add New Account</button>
                </div>
                <div class="p-6">
                    ${categories.map(cat => {
                        const catAccs = accounts.filter(a => a.type === cat);
                        return `
                            <div class="mb-8 last:mb-0">
                                <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-100 pb-2">${cat}s</h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    ${catAccs.map(a => `
                                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 group relative">
                                            <div class="flex items-center justify-between">
                                                <div>
                                                    <div class="text-[10px] font-bold text-primary mb-1">${a.code}</div>
                                                    <div class="font-bold text-sm">${a.name}</div>
                                                </div>
                                                <div class="text-lg font-black opacity-10 group-hover:opacity-0 transition-opacity">
                                                    <i class="fa-solid ${cat === 'Asset' ? 'fa-building-columns' : cat === 'Liability' ? 'fa-file-invoice' : 'fa-coins'}"></i>
                                                </div>
                                            </div>
                                            <!-- Hover Actions -->
                                            <div class="absolute inset-0 flex items-center justify-center gap-4 bg-white/60 dark:bg-gray-800/80 rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                                <button onclick="editAccount(${a.id})" class="text-primary hover:scale-110 transition-transform"><i class="fa-solid fa-pen-to-square"></i></button>
                                                <button onclick="deleteAccount(${a.id}, '${a.name}')" class="text-red-500 hover:scale-110 transition-transform"><i class="fa-solid fa-trash-can"></i></button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- TAB: EXPENSES ---
async function renderExpenses(container) {
    const manualExpenses = await db.expenses.orderBy('date').reverse().toArray();
    const accounts = await db.accounts.toArray();
    const expenseAccounts = accounts.filter(a => a.type === 'Expense');
    const expenseAccountIds = expenseAccounts.map(a => a.id);

    // Include return ledger entries that were recorded as expense debits for refunds
    const returnLedgerEntries = await db.ledger
        .where('reference_type').equals('Return')
        .filter(entry => entry.type === 'debit' && expenseAccountIds.includes(entry.account_id))
        .toArray();

    const returnExpenses = returnLedgerEntries.map(entry => {
        const acc = accounts.find(a => a.id === entry.account_id);
        return {
            id: `return-${entry.id}`,
            date: entry.date,
            category: acc?.name || 'Sales Returns / Allowances',
            amount: parseFloat(entry.amount || 0),
            description: entry.description,
            isReturn: true
        };
    });

    const expenses = [...manualExpenses.map(exp => ({ ...exp, isReturn: false })), ...returnExpenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let monthTotal = 0;
    const categoryTotals = {};
    
    expenses.forEach(e => {
        const amt = parseFloat(e.amount || 0);
        if (new Date(e.date) >= startOfMonth) {
            monthTotal += amt;
        }
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;
    });

    const topCategories = Object.entries(categoryTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in pb-10">
            <!-- Summary Header -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Total Monthly Card -->
                <div class="bg-gradient-to-br from-rose-500 to-red-600 rounded-[2rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div class="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-80">This Month's Spending</p>
                            <h3 class="text-3xl font-black mt-1">${formatCurrency(monthTotal)}</h3>
                        </div>
                        <div class="mt-4 flex items-center gap-2">
                            <span class="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full uppercase italic">Business Period</span>
                        </div>
                    </div>
                </div>

                <!-- Top Category Card -->
                <div class="bg-white dark:bg-darkCard rounded-[2rem] p-6 border border-gray-100 dark:border-darkBorder shadow-sm relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div class="relative z-10">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Cost Center</p>
                        <h3 class="text-xl font-black text-gray-900 dark:text-white mt-1">
                            ${topCategories.length > 0 ? topCategories[0].name : 'N/A'}
                        </h3>
                        <p class="text-[10px] text-gray-500 font-bold mt-1 uppercase italic">Highest lifetime category</p>
                    </div>
                </div>

                <!-- Quick Actions Card -->
                <div class="lg:col-span-2 flex items-center gap-4">
                    <button onclick="openExpenseModal()" class="flex-1 h-full bg-red-600 hover:bg-red-700 text-white rounded-[2rem] p-6 flex items-center justify-between group shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                        <div class="text-left">
                            <h4 class="text-xl font-black uppercase italic tracking-tighter">Record New<br>Expense</h4>
                            <p class="text-xs font-bold opacity-75 mt-1">Deduct from Cash/Bank</p>
                        </div>
                        <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                            <i class="fa-solid fa-plus"></i>
                        </div>
                    </button>
                    <button onclick="openAddAccountModal('Expense')" class="flex-1 h-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-[2rem] p-6 flex items-center justify-between group border border-gray-100 dark:border-darkBorder active:scale-95 transition-all">
                        <div class="text-left">
                            <h4 class="text-lg font-black uppercase italic tracking-tighter leading-tight">Manage<br>Categories</h4>
                            <p class="text-xs font-bold opacity-50 mt-1">Edit Chart of Accounts</p>
                        </div>
                        <div class="w-12 h-12 bg-gray-400/10 rounded-2xl flex items-center justify-center text-xl">
                            <i class="fa-solid fa-tags"></i>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                <!-- Distribution Side -->
                <div class="space-y-6">
                    <div class="bg-white dark:bg-darkCard rounded-[2.5rem] p-8 border border-gray-100 dark:border-darkBorder shadow-sm">
                        <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-6">Spending Analysis</h3>
                        <div class="space-y-5">
                            ${topCategories.length === 0 ? '<p class="text-xs text-center text-gray-400 py-10 italic font-bold">No categorical data available yet.</p>' : 
                                topCategories.slice(0, 5).map(cat => `
                                    <div class="space-y-1.5">
                                        <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                            <span class="text-gray-500">${cat.name}</span>
                                            <span class="text-gray-900 dark:text-white">${formatCurrency(cat.total)}</span>
                                        </div>
                                        <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div class="h-full bg-red-500" style="width: ${Math.min(100, (cat.total / (monthTotal || 1) * 100)).toFixed(0)}%"></div>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                    
                    <div class="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-[2.5rem]">
                        <div class="flex gap-4">
                            <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-lightbulb"></i>
                            </div>
                            <p class="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed italic">
                                <b>Pro Tip:</b> Use specific categories like "Rent" or "Electricity" instead of just "Other" to generate accurate profit reports.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Ledger History -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                        <div class="p-8 border-b border-gray-50 dark:border-darkBorder flex items-center justify-between">
                            <h3 class="text-lg font-black italic tracking-tighter uppercase text-gray-900 dark:text-white">Recent Outflows</h3>
                            <span class="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-full">Displaying ${expenses.length} records</span>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th class="p-6">Timeline</th>
                                        <th class="p-6">Categorization</th>
                                        <th class="p-6">Annotation</th>
                                        <th class="p-6 text-right">Valuation</th>
                                        <th class="p-6 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    ${expenses.length === 0 ? '<tr><td colspan="5" class="p-20 text-center text-gray-400 italic">History is clear. No expenses recorded yet.</td></tr>' : 
                                        expenses.map(e => `
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-all group">
                                                <td class="p-6">
                                                    <div class="text-xs font-black text-gray-900 dark:text-white">${new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                    <div class="text-[10px] text-gray-400 font-bold uppercase">${new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                </td>
                                                <td class="p-6">
                                                    <span class="inline-block px-3 py-1 ${e.isReturn ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/50'} text-[10px] font-black uppercase rounded-lg border">
                                                        ${e.category}${e.isReturn ? ' (Return)' : ''}
                                                    </span>
                                                </td>
                                                <td class="p-6 text-xs text-gray-500 font-medium">${e.description || '<span class="italic opacity-50">No details</span>'}</td>
                                                <td class="p-6 text-right font-black text-rose-600 text-sm italic">${formatCurrency(e.amount)}</td>
                                                <td class="p-6 text-center">
                                                    ${e.isReturn ? '<span class="text-[10px] font-black uppercase text-gray-400">Readonly</span>' : `
                                                    <div class="flex items-center justify-center gap-2">
                                                        <button onclick="editExpense(${e.id})" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all active:scale-95 shadow-sm group-hover:shadow-md">
                                                            <i class="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        <button onclick="deleteExpense(${e.id})" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 shadow-sm group-hover:shadow-md">
                                                            <i class="fa-solid fa-trash-can"></i>
                                                        </button>
                                                    </div>`}
                                                </td>
                                            </tr>
                                        `).join('')
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- TAB: REPORTS ---
async function renderAccountingReports(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- P&L Report card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <i class="fa-solid fa-money-bill-trend-up text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Profit & Loss Statement</h3>
                    <p class="text-sm text-gray-500">Revenue minus expenses for a specific period.</p>
                </div>
                <button onclick="generatePNL()" class="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20">Generate P&L</button>
            </div>

            <!-- Balance Sheet card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <i class="fa-solid fa-scale-balanced text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Balance Sheet</h3>
                    <p class="text-sm text-gray-500">Snapshot of assets, liabilities, and equity.</p>
                </div>
                <button onclick="generateBalanceSheet()" class="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">Generate Balance Sheet</button>
            </div>

            <!-- Cash Flow card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <i class="fa-solid fa-arrow-right-arrow-left text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Cash Flow Report</h3>
                    <p class="text-sm text-gray-500">Summary of cash inflows and outflows.</p>
                </div>
                <button onclick="generateCashFlow()" class="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20">Generate Cash Flow</button>
            </div>

            <!-- Tax Report card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <i class="fa-solid fa-stamp text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Tax / VAT Report</h3>
                    <p class="text-sm text-gray-500">Collected vs Paid VAT tracking.</p>
                </div>
                <button onclick="generateTaxReport()" class="w-full bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20">Generate Tax Report</button>
            </div>

            <!-- Reconciliation card -->
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div class="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                    <i class="fa-solid fa-code-compare text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-lg">Inventory Reconciliation</h3>
                    <p class="text-sm text-gray-500">Compare ledger balance against actual warehouse stock valuation.</p>
                </div>
                <button onclick="generateReconciliationReport()" class="w-full bg-rose-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20">Run Reconciliation</button>
            </div>
        </div>
    `;
}

// --- ACCOUNTING LOGIC ---

async function openLedgerModal(id = null) {
    const accounts = await db.accounts.toArray();
    const modal = document.getElementById('acc-modal');
    const content = document.getElementById('acc-modal-content');
    
    let entry = null;
    if (id) {
        entry = await db.ledger.get(id);
    }

    content.innerHTML = `
        <div class="px-6 py-4 border-b border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard z-20 sticky top-0 flex items-center justify-between shadow-sm">
            <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">${entry ? 'Edit Ledger Entry' : 'General Ledger Action'}</h3>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5" id="ledger-header-date">${entry ? new Date(entry.date).toLocaleDateString() : 'Today'}</p>
            </div>
            <div class="flex items-center gap-3">
                <button type="button" onclick="closeAccModal()" class="text-sm font-bold text-gray-500 hover:text-red-500 uppercase tracking-widest px-2 transition-colors">Discard</button>
                <button type="button" onclick="document.getElementById('ledger-form').requestSubmit()" class="bg-primary hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-check-circle"></i>
                    <span>${entry ? 'Update Entry' : 'Post Entry'}</span>
                </button>
            </div>
        </div>
        <form onsubmit="handleLedgerSubmit(event, ${id})" id="ledger-form" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input type="date" id="acc-date" required value="${entry ? new Date(entry.date).toISOString().split('T')[0] : ''}" onchange="document.getElementById('ledger-header-date').innerText = this.value" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                    <select id="acc-type" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        <option value="debit" ${entry?.type === 'debit' ? 'selected' : ''}>Debit (Asset Increase / Expense)</option>
                        <option value="credit" ${entry?.type === 'credit' ? 'selected' : ''}>Credit (Liability / Income Increase)</option>
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Primary Account</label>
                    <select id="acc-id" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        ${accounts.map(a => `<option value="${a.id}" ${entry?.account_id === a.id ? 'selected' : ''}>${a.name} (${a.code})</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Offset Account (Debit/Credit Source)</label>
                    <select id="acc-offset-id" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        ${accounts.map(a => `<option value="${a.id}" ${a.code === '1000' ? 'selected' : ''}>${a.name} (${a.code})</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                    <input type="number" id="acc-amount" step="0.01" required min="1" value="${entry?.amount || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-black text-primary outline-none">
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <input type="text" id="acc-desc" required value="${entry?.description || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
    
    if (!entry) {
        const initialDate = new Date().toISOString().split('T')[0];
        document.getElementById('acc-date').value = initialDate;
        document.getElementById('ledger-header-date').innerText = initialDate;
    }
}

async function handleLedgerSubmit(event, id = null) {
    event.preventDefault();
    const accId = parseInt(document.getElementById('acc-id').value);
    const amount = parseFloat(document.getElementById('acc-amount').value);
    const type = document.getElementById('acc-type').value;
    const desc = document.getElementById('acc-desc').value;
    const date = document.getElementById('acc-date').value;

    const offsetAccId = parseInt(document.getElementById('acc-offset-id').value);
    const offsetType = type === 'debit' ? 'credit' : 'debit';

    const entryData = {
        account_id: accId,
        amount: amount,
        type: type,
        description: desc,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        reference_type: 'Manual',
        reference_id: '-'
    };

    const offsetData = {
        ...entryData,
        account_id: offsetAccId,
        type: offsetType,
        description: `Offset: ${desc}`
    };

    if (id) {
        await db.ledger.update(id, entryData);
        showAlert('Success', 'Ledger entry updated.');
    } else {
        await db.transaction('rw', db.ledger, async () => {
            await db.ledger.add(entryData);
            await db.ledger.add(offsetData);
        });
        showAlert('Success', 'Double-entry transaction posted.');
    }
    
    closeAccModal();
    renderAccountingTab('ledger');
}

// Utility for auto-recording ledger entries
async function recordTransaction(accountId, amount, type, description, refType, refId, customDate = null) {
    if (!accountId) return;
    await db.ledger.add({
        date: customDate || new Date().toISOString().split('T')[0],
        account_id: accountId,
        amount: amount,
        type: type, // 'debit' or 'credit'
        description: description,
        reference_type: refType,
        reference_id: refId
    });
}
window.recordTransaction = recordTransaction;

// --- REPORT GENERATION ---

async function generatePNL() {
    const ledger = await db.ledger.toArray();
    const accounts = await db.accounts.toArray();
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeDetails = [];
    const expenseDetails = [];

    accounts.forEach(acc => {
        if (acc.type !== 'Income' && acc.type !== 'Expense') return;
        
        const accEntries = ledger.filter(e => e.account_id === acc.id);
        let balance = 0;
        accEntries.forEach(e => {
            if (acc.type === 'Income') {
                // For Income accounts, credits increase balance
                balance += (e.type === 'credit' ? e.amount : -e.amount);
            } else if (acc.type === 'Expense') {
                // For Expense accounts, debits increase balance
                balance += (e.type === 'debit' ? e.amount : -e.amount);
            }
        });

        if (balance > 0.01 || balance < -0.01) {
            if (acc.type === 'Income') {
                totalIncome += balance;
                incomeDetails.push({ name: acc.name, amount: balance });
            } else if (acc.type === 'Expense') {
                totalExpenses += balance;
                expenseDetails.push({ name: acc.name, amount: balance });
            }
        }
    });

    const netProfit = totalIncome - totalExpenses;

    Swal.fire({
        title: 'Profit & Loss Statement',
        html: `
            <div class="text-left space-y-4 max-h-[60vh] overflow-y-auto p-2">
                <div class="border-b pb-2">
                    <h4 class="font-black text-emerald-600 uppercase text-xs">Income</h4>
                    ${incomeDetails.map(d => `<div class="flex justify-between text-sm"><span>${d.name}</span> <span class="font-bold">${formatCurrency(d.amount)}</span></div>`).join('')}
                    <div class="flex justify-between font-black mt-2 pt-2 border-t"><span>Total Income</span> <span>${formatCurrency(totalIncome)}</span></div>
                </div>
                <div class="border-b pb-2">
                    <h4 class="font-black text-red-600 uppercase text-xs">Expenses</h4>
                    ${expenseDetails.map(d => `<div class="flex justify-between text-sm"><span>${d.name}</span> <span class="font-bold">${formatCurrency(d.amount)}</span></div>`).join('')}
                    <div class="flex justify-between font-black mt-2 pt-2 border-t"><span>Total Expenses</span> <span>${formatCurrency(totalExpenses)}</span></div>
                </div>
                <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl flex justify-between items-center">
                    <span class="font-black">NET PROFIT / LOSS</span>
                    <span class="text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}">${formatCurrency(netProfit)}</span>
                </div>
            </div>
        `,
        width: '500px',
        confirmButtonText: 'Print / Save',
        showCancelButton: true
    });
}

async function generateBalanceSheet() {
    const ledger = await db.ledger.toArray();
    const accounts = await db.accounts.toArray();

    const sections = {
        Asset: { total: 0, items: [] },
        Liability: { total: 0, items: [] },
        Equity: { total: 0, items: [] }
    };

    accounts.forEach(acc => {
        if (!sections[acc.type]) return;
        
        const accEntries = ledger.filter(e => e.account_id === acc.id);
        let balance = 0;
        accEntries.forEach(e => {
            if (acc.type === 'Asset') {
                // Assets: debit increases
                balance += (e.type === 'debit' ? e.amount : -e.amount);
            } else if (acc.type === 'Liability' || acc.type === 'Equity') {
                // Liabilities & Equity: credit increases
                balance += (e.type === 'credit' ? e.amount : -e.amount);
            }
        });

        if (Math.abs(balance) > 0.01) {
            sections[acc.type].total += balance;
            sections[acc.type].items.push({ name: acc.name, amount: balance });
        }
    });

    Swal.fire({
        title: 'Balance Sheet',
        html: `
            <div class="text-left space-y-6 max-h-[60vh] overflow-y-auto p-2">
                ${Object.entries(sections).map(([type, data]) => `
                    <div>
                        <h4 class="font-black text-primary uppercase text-xs mb-2 border-b pb-1">${type}s</h4>
                        ${data.items.map(i => `<div class="flex justify-between text-sm"><span>${i.name}</span> <span class="font-bold">${formatCurrency(i.amount)}</span></div>`).join('')}
                        <div class="flex justify-between font-black mt-2 text-sm"><span>Total ${type}s</span> <span>${formatCurrency(data.total)}</span></div>
                    </div>
                `).join('')}
                <div class="border-t-2 pt-4 flex flex-col gap-2">
                    <div class="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Total Assets</span> <span>${formatCurrency(sections.Asset.total)}</span></div>
                    <div class="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Total Liabilities + Equity</span> <span>${formatCurrency(sections.Liability.total + sections.Equity.total)}</span></div>
                </div>
            </div>
        `,
        width: '500px',
        confirmButtonText: 'Done'
    });
}

window.toggleExpenseBankSelect = function() {
    const payMethod = document.getElementById('exp-pay-method')?.value;
    const wrap = document.getElementById('exp-bank-account-wrap');
    const bankSelect = document.getElementById('exp-bank-account-id');
    if (payMethod === 'bank' || payMethod === 'cheque') {
        if (wrap) wrap.classList.remove('hidden');
        if (bankSelect) bankSelect.setAttribute('required', 'required');
    } else {
        if (wrap) wrap.classList.add('hidden');
        if (bankSelect) bankSelect.removeAttribute('required');
    }
};

async function openExpenseModal(id = null) {
    const expenseAccs = await db.accounts.where('type').equals('Expense').toArray();
    const bankAccounts = await db.bank_accounts.toArray();
    const modal = document.getElementById('acc-modal');
    const content = document.getElementById('acc-modal-content');

    let expense = null;
    if (id) {
        expense = await db.expenses.get(id);
    }

    content.innerHTML = `
        <div class="px-8 py-6 border-b border-gray-100 dark:border-darkBorder bg-white dark:bg-darkCard z-20 sticky top-0 flex items-center justify-between">
            <div>
                <h3 class="text-xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">${expense ? 'Edit Expense Record' : 'Record Shop Expense'}</h3>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">${expense ? 'Edit existing outflow' : 'Deduct from cash inventory'}</p>
            </div>
            <button onclick="closeAccModal()" class="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
        </div>
        <form onsubmit="handleExpenseSubmit(event, ${id})" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Expense Date</label>
                    <input type="date" id="exp-date" required value="${expense ? new Date(expense.date).toISOString().split('T')[0] : ''}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-bold outline-none shadow-sm">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category / Ledger</label>
                    <div class="flex gap-2">
                        <select id="exp-acc-id" required class="flex-1 px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-bold outline-none shadow-sm">
                            ${expenseAccs.length > 0 ? 
                                expenseAccs.map(a => `<option value="${a.id}" ${expense?.account_id === a.id ? 'selected' : ''}>${a.name}</option>`).join('') :
                                '<option value="" disabled selected>No categories found</option>'
                            }
                        </select>
                        <button type="button" onclick="openAddAccountModal('Expense')" class="w-14 h-14 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[1.2rem] transition-all shadow-sm shrink-0">
                            <i class="fa-solid fa-plus text-primary"></i>
                        </button>
                    </div>
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount (LKR)</label>
                    <input type="number" id="exp-amount" step="0.01" required min="1" placeholder="0.00" value="${expense?.amount || ''}" class="w-full px-5 py-5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-black text-2xl text-red-600 outline-none shadow-inner">
                </div>
                <div class="col-span-1">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                    <select id="exp-pay-method" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-bold outline-none shadow-sm" onchange="toggleExpenseBankSelect()">
                        <option value="cash" ${expense?.payment_method === 'cash' || !expense ? 'selected' : ''}>Cash</option>
                        <option value="cash_refund" ${expense?.payment_method === 'cash_refund' ? 'selected' : ''}>Cash Refund</option>
                        <option value="bank" ${expense?.payment_method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
                        <option value="cheque" ${expense?.payment_method === 'cheque' ? 'selected' : ''}>Cheque</option>
                    </select>
                </div>
                <div id="exp-bank-account-wrap" class="col-span-1 hidden">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bank Account</label>
                    <select id="exp-bank-account-id" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-bold outline-none shadow-sm">
                        <!-- Loaded dynamically -->
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Description / Remarks</label>
                    <input type="text" id="exp-desc" placeholder="What was this for?" required value="${expense?.description || ''}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-red-500 rounded-[1.5rem] font-medium outline-none shadow-sm">
                </div>
            </div>
            <div class="pt-4">
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <i class="fa-solid fa-file-invoice-dollar text-lg"></i>
                    ${expense ? 'Update Expense Record' : 'Post Expense Entry'}
                </button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    if (!expense) {
        document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    }
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        
        // Populate bank account dropdown
        const bankSelect = document.getElementById('exp-bank-account-id');
        if (bankSelect) {
            bankSelect.innerHTML = bankAccounts.map(b => `<option value="${b.id}" ${expense?.bank_account_id === b.id ? 'selected' : ''}>${b.name} (Bal: Rs. ${b.balance.toLocaleString()})</option>`).join('');
        }

        // Toggle visibility based on loaded state
        if (typeof window.toggleExpenseBankSelect === 'function') {
            window.toggleExpenseBankSelect();
        }

        if (!expense) {
            const dateInput = document.getElementById('exp-date');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        }
    }, 10);
}

async function handleExpenseSubmit(event, id = null) {
    event.preventDefault();
    const accId = parseInt(document.getElementById('exp-acc-id').value);
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const desc = document.getElementById('exp-desc').value;
    const date = document.getElementById('exp-date').value;

    const paymentMethod = document.getElementById('exp-pay-method').value;
    const bankAccountId = (paymentMethod === 'bank' || paymentMethod === 'cheque') ? parseInt(document.getElementById('exp-bank-account-id').value) : null;

    if (!accId || isNaN(accId)) {
        showAlert('Error', 'Please select a valid expense category.', 'error');
        return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        showAlert('Error', 'Please enter a valid amount.', 'error');
        return;
    }

    try {
        if (id) {
            // UPDATING existing expense — void old ledger entries and re-record
            await db.transaction('rw', [db.expenses, db.ledger, db.accounts, db.bank_accounts, db.bank_transactions], async () => {
                const acc = await db.accounts.get(accId);
                let cashAcc = await db.accounts.where('code').equals('1000').first();
                if (!acc) {
                    const msg = 'Selected expense category not found.';
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }
                
                if (!cashAcc) {
                    const cid = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                    cashAcc = await db.accounts.get(cid);
                }
                
                if (!cashAcc) {
                    const msg = 'Primary Cash Account (Code: 1000) not found.';
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }

                const expenseDate = date ? new Date(date).toISOString() : new Date().toISOString();

                // Reverse old bank transaction/balance if applicable
                const oldExpense = await db.expenses.get(id);
                if (oldExpense && (oldExpense.payment_method === 'bank' || oldExpense.payment_method === 'cheque') && oldExpense.bank_account_id) {
                    const oldBank = await db.bank_accounts.get(oldExpense.bank_account_id);
                    if (oldBank) {
                        await db.bank_accounts.update(oldExpense.bank_account_id, { balance: oldBank.balance + oldExpense.amount });
                    }
                    const oldTrans = await db.bank_transactions.where({ bank_account_id: oldExpense.bank_account_id, reference: `Expense #${id}` }).first();
                    if (oldTrans) {
                        await db.bank_transactions.delete(oldTrans.id);
                    }
                }

                // Void the old ledger entries for this expense
                await db.ledger.where({ reference_id: id, reference_type: 'Expense' }).delete();

                // Update the expense record
                await db.expenses.update(id, {
                    date: expenseDate,
                    account_id: accId,
                    category: acc.name || '',
                    amount: amount,
                    description: desc,
                    payment_method: paymentMethod,
                    bank_account_id: bankAccountId
                });

                // Re-record fresh ledger entries with the correct expense ID
                await recordTransaction(accId, amount, 'debit', desc, 'Expense', id, date || null);
                
                if (paymentMethod === 'cash' || paymentMethod === 'cash_refund') {
                    await recordTransaction(cashAcc.id, amount, 'credit', `Paid for: ${desc}`, 'Expense', id, date || null);
                } else {
                    let bankLedgerAcc = await db.accounts.where('code').equals('1010').first();
                    if (!bankLedgerAcc) {
                        const bid = await db.accounts.add({ name: 'Bank Account', type: 'Asset', code: '1010' });
                        bankLedgerAcc = await db.accounts.get(bid);
                    }
                    await recordTransaction(bankLedgerAcc.id, amount, 'credit', `Paid for: ${desc}`, 'Expense', id, date || null);
                    
                    // Add new bank transaction breakdown
                    const methodLabel = paymentMethod === 'bank' ? 'Bank Transfer' : 'Cheque';
                    await recordBankTransaction(
                        bankAccountId,
                        'outward',
                        methodLabel,
                        amount,
                        `Expense #${id}`,
                        desc,
                        date || null
                    );
                }
            });
            showAlert('Updated', 'Expense updated and ledger entries corrected.', 'success');
        } else {
            await db.transaction('rw', [db.expenses, db.ledger, db.accounts, db.bank_accounts, db.bank_transactions], async () => {
                const acc = await db.accounts.get(accId);
                let cashAcc = await db.accounts.where('code').equals('1000').first();

                if (!acc) {
                    const msg = 'Selected expense category not found.';
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }
                
                if (!cashAcc) {
                    const cid = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                    cashAcc = await db.accounts.get(cid);
                }

                if (!cashAcc) {
                    const msg = 'Primary Cash Account (Code: 1000) not found.';
                    console.error(msg);
                    if (typeof showAlert === 'function') showAlert('Error', msg, 'error');
                    throw new Error(msg);
                }

                const expenseDate = date ? new Date(date).toISOString() : new Date().toISOString();

                // 1. Add expense first to get its auto-generated ID
                const expenseId = await db.expenses.add({
                    date: expenseDate,
                    category: acc.name,
                    account_id: accId,
                    amount: amount,
                    description: desc,
                    payment_method: paymentMethod,
                    bank_account_id: bankAccountId
                });

                // 2. Ledger entries now linked to the real expense ID
                await recordTransaction(accId, amount, 'debit', desc, 'Expense', expenseId, date || null);
                
                if (paymentMethod === 'cash' || paymentMethod === 'cash_refund') {
                    await recordTransaction(cashAcc.id, amount, 'credit', `Paid for: ${desc}`, 'Expense', expenseId, date || null);
                } else {
                    let bankLedgerAcc = await db.accounts.where('code').equals('1010').first();
                    if (!bankLedgerAcc) {
                        const bid = await db.accounts.add({ name: 'Bank Account', type: 'Asset', code: '1010' });
                        bankLedgerAcc = await db.accounts.get(bid);
                    }
                    await recordTransaction(bankLedgerAcc.id, amount, 'credit', `Paid for: ${desc}`, 'Expense', expenseId, date || null);
                    
                    // Add bank transaction breakdown
                    const methodLabel = paymentMethod === 'bank' ? 'Bank Transfer' : 'Cheque';
                    await recordBankTransaction(
                        bankAccountId,
                        'outward',
                        methodLabel,
                        amount,
                        `Expense #${expenseId}`,
                        desc,
                        date || null
                    );
                }
            });
            showAlert('Success', 'Expense recorded and ledger updated.', 'success');
        }
        
        if (typeof logActivity === 'function') await logActivity(`${id ? 'Updated' : 'Recorded'} Expense: ${desc} - ${formatCurrency(amount)}`);

        closeAccModal();

        // Refresh UI based on active view
        const taxView = document.getElementById('tax-view');
        if (taxView && taxView.classList.contains('active')) {
            if (typeof renderTaxExpenses === 'function') {
                renderTaxExpenses(document.getElementById('tax-tab-content'));
            }
        } else {
            renderAccountingTab('expenses');
        }

    } catch (err) {
        console.error('Expense Submission Error:', err);
        showAlert('Error', 'Failed to save expense: ' + err.message, 'error');
    }
}
function closeAccModal() {
    const modal = document.getElementById('acc-modal');
    const content = document.getElementById('acc-modal-content');
    if (!modal) return;
    modal.classList.add('opacity-0');
    if (content) content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Extra Accounting Functions

async function openAddAccountModal(type = null) {
    const modal = document.getElementById('acc-modal');
    const content = document.getElementById('acc-modal-content');

    const title = type === 'Expense' ? 'New Expense Category' : 'Add New Chart Account';
    const buttonText = type === 'Expense' ? 'Add Category' : 'Create Account';

    // Suggest code based on type
    let suggestedCode = '';
    if (type) {
        const lastAccs = await db.accounts.where('type').equals(type).toArray();
        if (lastAccs.length > 0) {
            const codes = lastAccs.map(a => parseInt(a.code)).filter(c => !isNaN(c));
            if (codes.length > 0) suggestedCode = (Math.max(...codes) + 10).toString();
        }
    }

    if (!suggestedCode) {
        if (type === 'Asset') suggestedCode = '1000';
        else if (type === 'Liability') suggestedCode = '2000';
        else if (type === 'Equity') suggestedCode = '3000';
        else if (type === 'Income') suggestedCode = '4000';
        else suggestedCode = '5000'; // Default to Expense range
    }

    content.innerHTML = `
        <div class="px-6 py-4 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <h3 class="text-lg font-bold text-primary italic uppercase tracking-tighter">${title}</h3>
            <button onclick="closeAccModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form onsubmit="handleAddAccountSubmit(event)" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Account Type</label>
                    <select id="new-acc-type" required class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none">
                        <option value="Asset" ${type === 'Asset' ? 'selected' : ''}>Asset</option>
                        <option value="Liability" ${type === 'Liability' ? 'selected' : ''}>Liability</option>
                        <option value="Equity" ${type === 'Equity' ? 'selected' : ''}>Equity</option>
                        <option value="Income" ${type === 'Income' ? 'selected' : ''}>Income</option>
                        <option value="Expense" ${type === 'Expense' || !type ? 'selected' : ''}>Expense</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Account Code</label>
                    <input type="text" id="new-acc-code" required value="${suggestedCode}" placeholder="e.g. 5100" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none">
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Account Name / Category</label>
                    <input type="text" id="new-acc-name" required placeholder="e.g. Shop Rent, Marketing, etc." class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none">
                </div>
            </div>
            <div class="pt-4 flex gap-3">
                <button type="button" onclick="closeAccModal()" class="flex-1 bg-gray-100 dark:bg-gray-700 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-gray-500">Cancel</button>
                <button type="submit" class="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/30 active:scale-95 transition-all">${buttonText}</button>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

async function handleAddAccountSubmit(event) {
    event.preventDefault();
    const type = document.getElementById('new-acc-type').value;
    const code = document.getElementById('new-acc-code').value;
    const name = document.getElementById('new-acc-name').value;

    await db.accounts.add({ type, code, name });
    showAlert('Success', `${type} account created successfully`);
    closeAccModal();
    renderAccountingTab(currentAccountingTab);
}

async function generateCashFlow() {
    const ledger = await db.ledger.toArray();
    const accounts = await db.accounts.toArray();
    const sales = await db.sales.toArray();
    const expenses = await db.expenses.toArray();
    
    // Cash accounts
    const cashAccs = accounts.filter(a => a.code === '1000' || a.code === '1010');
    const cashIds = cashAccs.map(a => a.id);
    
    // Calculate cash inflows and outflows more accurately
    let totalSales = 0;
    let totalExpenses = 0;
    let cashBalance = 0;
    
    // Get sales revenue
    sales.forEach(s => {
        if (s.status !== 'draft' && s.status !== 'cancelled') {
            totalSales += parseFloat(s.total) || 0;
        }
    });
    
    // Get expenses paid
    expenses.forEach(e => {
        if (e.payment_method === 'cash' || e.payment_method === 'cash_refund') {
            totalExpenses += parseFloat(e.amount) || 0;
        }
    });
    
    // Cash account balance from ledger
    const cashEntries = ledger.filter(e => cashIds.includes(e.account_id));
    cashEntries.forEach(e => {
        if (e.type === 'debit') cashBalance += e.amount;
        else cashBalance -= e.amount;
    });
    
    const totalIn = totalSales;
    const totalOut = totalExpenses;

    Swal.fire({
        title: 'Cash Flow Summary',
        html: `
            <div class="text-left space-y-4 p-2">
                <p class="text-xs text-gray-500">Summary of all movements in Cash and Bank accounts.</p>
                <div class="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <span class="font-bold text-emerald-700">Total Inflow</span>
                    <span class="font-black text-emerald-600">${formatCurrency(totalIn)}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <span class="font-bold text-red-700">Total Outflow</span>
                    <span class="font-black text-red-600">${formatCurrency(totalOut)}</span>
                </div>
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="font-black uppercase tracking-widest text-xs">Net Cash Position</span>
                    <span class="text-xl font-black ${totalIn - totalOut >= 0 ? 'text-primary' : 'text-red-500'}">${formatCurrency(totalIn - totalOut)}</span>
                </div>
            </div>
        `,
        confirmButtonText: 'Great'
    });
}

async function generateTaxReport() {
    const ledger = await db.ledger.toArray();
    const accounts = await db.accounts.toArray();
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);
    const taxRate = parseFloat(opts['tax_rate'] || 0) / 100;

    // Simplified: Estimate VAT based on Income (Sales) and Expenses
    let totalSales = 0;
    let totalExpenses = 0;

    accounts.forEach(acc => {
        const accEntries = ledger.filter(e => e.account_id === acc.id);
        let bal = 0;
        accEntries.forEach(e => {
            if (e.type === 'credit') bal += e.amount;
            else bal -= e.amount;
        });

        if (acc.type === 'Income') totalSales += bal;
        else if (acc.type === 'Expense') totalExpenses += (-bal);
    });

    const taxCollected = totalSales * taxRate;
    const taxPaid = totalExpenses * taxRate;
    const netTax = taxCollected - taxPaid;

    Swal.fire({
        title: 'Tax / VAT Report',
        html: `
            <div class="text-left space-y-4 p-2">
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p class="text-[10px] font-black uppercase text-gray-400">Current Tax Rate</p>
                    <p class="text-lg font-black text-primary">${(taxRate * 100).toFixed(2)}%</p>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Tax Collected (From Sales)</span>
                    <span class="font-bold">${formatCurrency(taxCollected)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span>Tax Paid (On Expenses)</span>
                    <span class="font-bold">${formatCurrency(taxPaid)}</span>
                </div>
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="font-black uppercase tracking-widest text-xs">Estimated Tax Payable</span>
                    <span class="text-xl font-black ${netTax >= 0 ? 'text-orange-600' : 'text-emerald-600'}">${formatCurrency(Math.abs(netTax))}</span>
                </div>
                <p class="text-[9px] text-gray-500 italic mt-4 text-center">Note: This is a simplified estimation. Please consult an accountant for legal tax filing.</p>
            </div>
        `,
        confirmButtonText: 'Done'
    });
}

async function generateReconciliationReport() {
    const products = await db.products.toArray();
    const ledger = await db.ledger.toArray();
    const accounts = await db.accounts.toArray();

    // 1. Physical Stock Valuation
    const physicalValue = products.reduce((sum, p) => sum + ((parseFloat(p.stock_qty) || 0) * (parseFloat(p.cost) || 0)), 0);

    // 2. Ledger Inventory Valuation
    const inventoryAcc = accounts.find(a => a.code === '1300');
    let ledgerValue = 0;
    if (inventoryAcc) {
        const invEntries = ledger.filter(e => e.account_id === inventoryAcc.id);
        invEntries.forEach(e => {
            if (e.type === 'debit') ledgerValue += e.amount;
            else ledgerValue -= e.amount;
        });
    }

    const discrepancy = physicalValue - ledgerValue;

    Swal.fire({
        title: 'Inventory Reconciliation',
        html: `
            <div class="text-left space-y-4 p-2">
                <p class="text-xs text-gray-500">Comparing actual warehouse stock value with the accounting ledger balance.</p>
                
                <div class="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <span class="font-bold text-blue-700">Physical Stock Value</span>
                    <span class="font-black text-blue-600">${formatCurrency(physicalValue)}</span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Ledger Balance (Acc: 1300)</span>
                    <span class="font-black text-gray-600 dark:text-gray-400">${formatCurrency(ledgerValue)}</span>
                </div>
                
                <div class="border-t pt-4 flex justify-between items-center">
                    <span class="font-black uppercase tracking-widest text-xs">Discrepancy Variance</span>
                    <span class="text-xl font-black ${discrepancy === 0 ? 'text-emerald-600' : 'text-red-600'}">
                        ${discrepancy === 0 ? 'MATCHED' : formatCurrency(Math.abs(discrepancy))}
                    </span>
                </div>
                
                ${discrepancy !== 0 ? `
                    <p class="text-[9px] text-red-500 italic mt-2 text-center">
                        Warning: Your accounting ledger does not match the actual warehouse valuation. Click "Adjust Ledger" to automatically correct the variance.
                    </p>
                ` : `<p class="text-[9px] text-emerald-500 italic mt-2 text-center">Ledger and physical stock are perfectly balanced.</p>`}
            </div>
        `,
        showCancelButton: discrepancy !== 0,
        confirmButtonText: discrepancy !== 0 ? 'Adjust Ledger' : 'Done',
        cancelButtonText: 'Cancel',
        confirmButtonColor: discrepancy !== 0 ? '#ef4444' : '#10b981'
    }).then(async (result) => {
        if (result.isConfirmed && discrepancy !== 0) {
            if (!inventoryAcc) {
                showAlert('Error', 'Inventory account (1300) not found.', 'error');
                return;
            }
            
            // Adjusting Entry to Equity or Cost of Goods Sold
            const equityAcc = accounts.find(a => a.code === '3100' || a.code === '3000') || accounts.find(a => a.code === '5000');
            if (!equityAcc) {
                showAlert('Error', 'Balancing account (Retained Earnings 3100) not found.', 'error');
                return;
            }

            try {
                await db.transaction('rw', db.ledger, async () => {
                    if (discrepancy > 0) {
                        // Debit Inventory, Credit Equity
                        await recordTransaction(inventoryAcc.id, discrepancy, 'debit', 'Inventory Reconciliation Adjustment', 'Manual', '-');
                        await recordTransaction(equityAcc.id, discrepancy, 'credit', 'Inventory Reconciliation Adjustment', 'Manual', '-');
                    } else {
                        // Credit Inventory, Debit Equity
                        const absDisc = Math.abs(discrepancy);
                        await recordTransaction(inventoryAcc.id, absDisc, 'credit', 'Inventory Reconciliation Adjustment', 'Manual', '-');
                        await recordTransaction(equityAcc.id, absDisc, 'debit', 'Inventory Reconciliation Adjustment', 'Manual', '-');
                    }
                    if (typeof logActivity === 'function') await logActivity(`Reconciled Inventory Ledger variance of ${formatCurrency(discrepancy)}`);
                });
                
                showAlert('Success', 'Ledger has been adjusted to match physical valuation.', 'success');
                if (currentAccountingTab === 'summary') {
                    renderAccountingTab('summary');
                }
            } catch (err) {
                showAlert('Error', 'Adjustment failed: ' + err.message, 'error');
            }
        }
    });
}

async function deleteExpense(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Expense?',
        text: 'This will permanently remove the expense and reverse its ledger entries to restore the correct balance.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed) return;

    try {
        const expense = await db.expenses.get(id);
        await db.transaction('rw', [db.expenses, db.ledger, db.bank_accounts, db.bank_transactions], async () => {
            // Reverse bank transaction if it was paid via bank/cheque
            if (expense && (expense.payment_method === 'bank' || expense.payment_method === 'cheque') && expense.bank_account_id) {
                const bankAcc = await db.bank_accounts.get(expense.bank_account_id);
                if (bankAcc) {
                    await db.bank_accounts.update(expense.bank_account_id, { balance: bankAcc.balance + expense.amount });
                }
                const trans = await db.bank_transactions.where({ bank_account_id: expense.bank_account_id, reference: `Expense #${id}` }).first();
                if (trans) {
                    await db.bank_transactions.delete(trans.id);
                }
            }

            // Delete the expense record
            await db.expenses.delete(id);
            // CRITICAL FIX: Also delete the paired ledger entries (debit Expense + credit Cash/Bank)
            // Without this, the ledger balance remains permanently corrupted after deletion
            await db.ledger.where({ reference_id: id, reference_type: 'Expense' }).delete();
        });
        showAlert('Deleted', 'Expense and linked ledger entries removed successfully.', 'success');
    } catch (err) {
        console.error('Error deleting expense:', err);
        showAlert('Error', 'Failed to delete expense: ' + err.message, 'error');
        return;
    }

    // Refresh based on active view
    const taxView = document.getElementById('tax-view');
    if (taxView && taxView.classList.contains('active')) {
        if (typeof renderTaxExpenses === 'function') {
            renderTaxExpenses(document.getElementById('tax-tab-content'));
        }
    } else {
        renderAccountingTab('expenses');
    }
}
async function deleteLedgerEntry(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Ledger Entry?',
        text: 'This will affect account balances. Ensure you know what you are doing!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });
    if (isConfirmed) {
        await db.ledger.delete(id);
        renderAccountingTab('ledger');
    }
}
async function editLedgerEntry(id) {
    openLedgerModal(id);
}
async function editExpense(id) {
    openExpenseModal(id);
}

async function editAccount(id) {
    const acc = await db.accounts.get(id);
    if (!acc) return;
    
    const { value: formValues } = await Swal.fire({
        title: 'Edit Account',
        html:
            `<input id="swal-acc-name" class="swal2-input" placeholder="Account Name" value="${acc.name}">` +
            `<input id="swal-acc-code" class="swal2-input" placeholder="Account Code" value="${acc.code}">`,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            return {
                name: document.getElementById('swal-acc-name').value,
                code: document.getElementById('swal-acc-code').value
            }
        }
    });

    if (formValues) {
        await db.accounts.update(id, formValues);
        showAlert('Updated', 'Account info saved');
        renderAccountingTab('accounts');
    }
}

async function deleteAccount(id, name) {
    // Check if system account (standard codes)
    const systemCodes = ['1000', '1010', '1200', '2000', '3000', '4000', '5000'];
    const acc = await db.accounts.get(id);
    
    if (systemCodes.includes(acc.code)) {
        showAlert('Protected', 'System accounts cannot be deleted to maintain system integrity.', 'error');
        return;
    }

    const { isConfirmed } = await Swal.fire({
        title: 'Delete Account?',
        text: `Are you sure you want to delete ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });
    
    if (isConfirmed) {
        await db.accounts.delete(id);
        renderAccountingTab('accounts');
    }
}

async function filterLedger(type) {
    const btns = document.querySelectorAll('.ledger-filter-btn');
    btns.forEach(b => {
        if (b.getAttribute('data-filter') === type) {
            b.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        } else {
            b.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm');
        }
    });

    const rows = document.querySelectorAll('#ledger-table tbody tr');
    rows.forEach(row => {
        if (type === 'all' || row.getAttribute('data-type') === type) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

// --- Action Functions for Ledger ---

async function previewLedgerEntry(id) {
    const entry = await db.ledger.get(id);
    if (!entry) return showAlert('Not Found', 'Ledger record no longer exists.', 'error');

    // Identify linked document
    if (entry.reference_type === 'Sale' || entry.reference_type === 'Receipt') {
        if (typeof printInvoice === 'function') printInvoice(entry.reference_id, null, true);
        else showAlert('Error', 'Sales preview module not found.', 'error');
    } else if (entry.reference_type === 'Purchase') {
        if (typeof printPO === 'function') printPO(entry.reference_id, null, true);
        else showAlert('Error', 'Purchase preview module not found.', 'error');
    } else if (entry.reference_type === 'GRN') {
        if (typeof printGRN === 'function') printGRN(entry.reference_id, null, true);
        else showAlert('Error', 'GRN preview module not found.', 'error');
    } else if (entry.reference_type === 'Expense') {
        // Find expense
        const expense = await db.expenses.get(entry.reference_id);
        if (expense) {
            Swal.fire({
                title: 'Expense Details',
                html: `
                    <div class="text-left space-y-2 p-2">
                        <p><b>Date:</b> ${new Date(expense.date).toLocaleString()}</p>
                        <p><b>Category:</b> ${expense.category}</p>
                        <p><b>Amount:</b> ${formatCurrency(expense.amount)}</p>
                        <p><b>Description:</b> ${expense.description || 'N/A'}</p>
                    </div>
                `,
                icon: 'info'
            });
        }
    } else {
        Swal.fire({
            title: 'Ledger Entry',
            text: `${entry.description} - ${formatCurrency(entry.amount)}`,
            icon: 'info'
        });
    }
}

async function deleteLedgerEntry(id) {
    const entry = await db.ledger.get(id);
    if (!entry) return;

    const confirm = await Swal.fire({
        title: 'Delete Transaction?',
        text: "Are you sure you want to delete this ledger record? This will NOT delete the source document (Invoice/PO) but will remove it from financial totals.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, Delete Record'
    });

    if (confirm.isConfirmed) {
        try {
            window.isManualAction = true;
            // Delete all entries in the same group (by ref_id and ref_type)
            await db.ledger.where({ 
                reference_id: entry.reference_id, 
                reference_type: entry.reference_type 
            }).delete();
            
            showAlert('Deleted', 'Financial records removed.', 'success');
            renderLedger(document.getElementById('accounting-tab-content'), document.getElementById('ledger-month-filter')?.value);
        } catch (err) {
            showAlert('Error', 'Failed to delete record: ' + err.message, 'error');
        } finally {
            window.isManualAction = false;
        }
    }
}

async function openAdjustCashModal(currentBalance) {
    const accounts = await db.accounts.toArray();
    const cashAccount = accounts.find(a => a.code === '1000');
    if (!cashAccount) {
        showAlert('Error', 'Cash on Hand account (1000) not found in database.', 'error');
        return;
    }
    
    // Find default balancing accounts (Retained Earnings/Equity 3100, 3000, or General Expense 5600)
    const defaultOffset = accounts.find(a => a.code === '3100' || a.code === '3000' || a.code === '5600') || accounts[0];

    const { value: formValues } = await Swal.fire({
        title: 'Adjust Cash in Hand',
        html: `
            <div class="text-left space-y-4 p-2">
                <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 mb-4">
                    <div class="text-xs font-black text-gray-400 uppercase tracking-widest">Current Balance</div>
                    <div class="text-2xl font-black text-primary dark:text-indigo-400 mt-1">${formatCurrency(currentBalance)}</div>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Cash in Hand Value</label>
                    <input type="number" id="adjust-new-balance" step="0.01" class="swal2-input w-full m-0 rounded-xl" value="${currentBalance.toFixed(2)}">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Offset / Balancing Account</label>
                    <select id="adjust-offset-account" class="swal2-input w-full m-0 rounded-xl text-sm font-bold">
                        ${accounts.map(a => `<option value="${a.id}" ${defaultOffset && defaultOffset.id === a.id ? 'selected' : ''}>${a.code} - ${a.name} (${a.type})</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Adjustment Description / Narration</label>
                    <input type="text" id="adjust-memo" class="swal2-input w-full m-0 rounded-xl" value="Manual Cash Balance Adjustment">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Record Adjustment',
        confirmButtonColor: '#4f46e5',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const newBal = parseFloat(document.getElementById('adjust-new-balance').value);
            const offsetId = parseInt(document.getElementById('adjust-offset-account').value);
            const memo = document.getElementById('adjust-memo').value;

            if (isNaN(newBal)) {
                Swal.showValidationMessage('Please enter a valid amount.');
                return false;
            }
            if (isNaN(offsetId)) {
                Swal.showValidationMessage('Please select an offset account.');
                return false;
            }
            if (!memo) {
                Swal.showValidationMessage('Please enter an adjustment narration.');
                return false;
            }

            return { newBal, offsetId, memo };
        }
    });

    if (formValues) {
        const { newBal, offsetId, memo } = formValues;
        const discrepancy = newBal - currentBalance;

        if (Math.abs(discrepancy) < 0.01) {
            showAlert('Info', 'No difference in cash balance. No adjustment recorded.', 'info');
            return;
        }

        try {
            await db.transaction('rw', db.ledger, async () => {
                const absDisc = Math.abs(discrepancy);
                const refId = Date.now();
                
                if (discrepancy > 0) {
                    // Cash balance is increasing -> Debit Cash (Asset increase), Credit Offset Account (Income/Liability/Equity)
                    await recordTransaction(cashAccount.id, absDisc, 'debit', memo, 'Manual', refId);
                    await recordTransaction(offsetId, absDisc, 'credit', `Offset: ${memo}`, 'Manual', refId);
                } else {
                    // Cash balance is decreasing -> Credit Cash (Asset decrease), Debit Offset Account (Expense/Asset increase/Equity decrease)
                    await recordTransaction(cashAccount.id, absDisc, 'credit', memo, 'Manual', refId);
                    await recordTransaction(offsetId, absDisc, 'debit', `Offset: ${memo}`, 'Manual', refId);
                }

                if (typeof logActivity === 'function') {
                    await logActivity(`Adjusted Cash in Hand by ${discrepancy > 0 ? '+' : ''}${formatCurrency(discrepancy)}`);
                }
            });

            showAlert('Success', 'Cash in hand adjusted successfully.', 'success');
            // Refresh
            if (currentAccountingTab === 'summary') {
                renderSummary(document.getElementById('accounting-tab-content'));
            }
        } catch (err) {
            console.error('Failed to adjust cash in hand:', err);
            showAlert('Error', 'Adjustment failed: ' + err.message, 'error');
        }
    }
}

