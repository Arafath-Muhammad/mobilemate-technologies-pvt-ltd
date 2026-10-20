// Vendor Management Logic
let editingVendorId = null;

async function loadVendors() {
    console.log("Loading Vendors view...");
    const container = document.getElementById('vendors-view');
    if (!container) return;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder mb-6 flex flex-col">
            <!-- Header Actions -->
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50 sticky top-16 z-30 backdrop-blur-md">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Vendor Management</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your suppliers and track procurement history.</p>
                </div>
                
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="vendors-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-64 transition-colors" placeholder="Search vendors...">
                    </div>
                    <button onclick="openVendorModal()" class="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Add Vendor
                    </button>
                </div>
            </div>

            <!-- Table section -->
            <div class="flex-1 p-0">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-[152px] z-20 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Vendor Name</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Contact Person</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Phone</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Bank Details</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Outstanding</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="vendors-list-body" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                        <tr><td colspan="5" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    `;

    container.innerHTML = html;

    // Search event
    document.getElementById('vendors-search').addEventListener('input', (e) => {
        renderVendorsList(e.target.value);
    });

    // Form submit
    document.getElementById('vendor-form').addEventListener('submit', saveVendor);

    renderVendorsList();
    renderVendorsList();
}


async function renderVendorsList(query = '') {
    const tbody = document.getElementById('vendors-list-body');
    if (!tbody) return;

    let vendors = await db.vendors.toArray();

    if (query) {
        const q = query.toLowerCase();
        vendors = vendors.filter(v => 
            (v.name && v.name.toLowerCase().includes(q)) || 
            (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
            (v.phone && v.phone.toLowerCase().includes(q))
        );
    }

    if (vendors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No vendors found.</td></tr>';
        return;
    }

    let html = '';
    vendors.forEach(v => {
        const displayBalance = Math.max(v.current_balance || 0, 0);
        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            ${(v.name || 'V').charAt(0).toUpperCase()}
                        </div>
                        <p class="text-sm font-bold text-gray-900 dark:text-white">${v.name}</p>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${v.contact_person || 'N/A'}</td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400">${v.phone || 'N/A'}</td>
                <td class="p-4">
                    <p class="text-[10px] font-bold text-gray-900 dark:text-white leading-tight uppercase">${v.bank_name || '-'}</p>
                    <p class="text-[9px] text-gray-500 font-mono">${v.bank_acc || '-'}</p>
                    <p class="text-[9px] text-gray-400 italic">${v.bank_holder || ''}</p>
                </td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400 font-bold text-right ${v.current_balance > 0 ? 'text-red-500' : 'text-emerald-500'}">
                    ${formatCurrency(displayBalance)}
                </td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="openVendorPaymentModal(${v.id})" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Record Payment">
                            <i class="fa-solid fa-money-bill-1-wave"></i>
                        </button>
                        <button onclick="editVendor(${v.id})" class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteVendor(${v.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function openVendorModal() {
    editingVendorId = null;
    document.getElementById('vendor-modal-title').textContent = 'Add New Vendor';
    document.getElementById('vendor-form').reset();
    
    const modal = document.getElementById('vendor-modal');
    const content = document.getElementById('vendor-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeVendorModal() {
    const modal = document.getElementById('vendor-modal');
    const content = document.getElementById('vendor-modal-content');
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function saveVendor(e) {
    e.preventDefault();
    
    const vendorData = {
        name: document.getElementById('vend-name').value,
        contact_person: document.getElementById('vend-contact').value,
        phone: document.getElementById('vend-phone').value,
        email: document.getElementById('vend-email').value,
        address: document.getElementById('vend-address').value,
        bank_name: document.getElementById('vend-bank-name').value,
        bank_acc: document.getElementById('vend-bank-acc').value,
        bank_holder: document.getElementById('vend-bank-holder').value,
        updated_at: new Date().toISOString()
    };

    try {
        if (editingVendorId) {
            await db.vendors.update(editingVendorId, vendorData);
            showAlert('Success', 'Vendor updated successfully.');
        } else {
            vendorData.created_at = new Date().toISOString();
            await db.vendors.add(vendorData);
            showAlert('Success', 'New vendor added successfully.');
        }
        
        closeVendorModal();
        renderVendorsList();
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to save vendor.', 'error');
    }
}

async function editVendor(id) {
    const vendor = await db.vendors.get(id);
    if (!vendor) return;

    editingVendorId = id;
    document.getElementById('vendor-modal-title').textContent = 'Edit Vendor';
    
    document.getElementById('vend-name').value = vendor.name;
    document.getElementById('vend-contact').value = vendor.contact_person || '';
    document.getElementById('vend-phone').value = vendor.phone;
    document.getElementById('vend-email').value = vendor.email || '';
    document.getElementById('vend-address').value = vendor.address || '';
    document.getElementById('vend-bank-name').value = vendor.bank_name || '';
    document.getElementById('vend-bank-acc').value = vendor.bank_acc || '';
    document.getElementById('vend-bank-holder').value = vendor.bank_holder || '';

    const modal = document.getElementById('vendor-modal');
    const content = document.getElementById('vendor-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

async function deleteVendor(id) {
    const confirm = await Swal.fire({
        title: 'Are you sure?',
        text: "This vendor will be permanently deleted!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d3',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
        try {
            window.isManualAction = true;
            await db.vendors.delete(id);
            renderVendorsList();
            showAlert('Deleted', 'Vendor has been deleted.');
        } finally {
            window.isManualAction = false;
        }
    }
}
async function openVendorPaymentModal(id) {
    const vendor = await db.vendors.get(id);
    if (!vendor) return;

    // Pre-load bank accounts so the modal can build the dropdown
    const bankAccounts = await db.bank_accounts.toArray();

    // Build the bank-account select options HTML
    const bankOptHtml = bankAccounts.length === 0
        ? '<option value="">No bank accounts registered</option>'
        : bankAccounts.map(b =>
            `<option value="${b.id}">${b.name} — ${b.bank_name || ''} (Bal: ${formatCurrency(b.balance || 0)})</option>`
          ).join('');

    const displayOutstanding = Math.max(vendor.current_balance || 0, 0);
    Swal.fire({
        title: `Payment to ${vendor.name}`,
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Current Outstanding</label>
                    <div class="text-xl font-black text-red-600">${formatCurrency(displayOutstanding)}</div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Amount</label>
                    <input type="number" id="vpay-amount" class="swal2-input w-full m-0" placeholder="0.00" value="${displayOutstanding}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <select id="vpay-method" class="swal2-input w-full m-0">
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                    </select>
                </div>

                <!-- Bank Account Selector (shown for bank & cheque) -->
                <div id="vbank-account-section" class="hidden animate-fade-in space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <label class="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                        <i class="fa-solid fa-building-columns mr-1"></i>Deduct From Bank Account
                    </label>
                    <select id="vpay-bank-account-id" class="swal2-input w-full m-0">
                        ${bankOptHtml}
                    </select>
                </div>

                <!-- Cheque Details -->
                <div id="vcheque-details" class="hidden animate-fade-in space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Number</label>
                            <input type="text" id="vpay-cheque-no" class="swal2-input w-full m-0" placeholder="000000">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Date</label>
                            <input type="date" id="vpay-cheque-date" class="swal2-input w-full m-0">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Issuing Bank</label>
                            <input type="text" id="vpay-cheque-bank" class="swal2-input w-full m-0" placeholder="Bank Name">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</label>
                            <input type="text" id="vpay-cheque-branch" class="swal2-input w-full m-0" placeholder="Branch Name">
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Record Payment',
        didOpen: () => {
            const methodSelect = Swal.getPopup().querySelector('#vpay-method');
            const bankAccountSection = Swal.getPopup().querySelector('#vbank-account-section');
            const chequeDetails = Swal.getPopup().querySelector('#vcheque-details');

            methodSelect.addEventListener('change', (e) => {
                bankAccountSection.classList.add('hidden');
                chequeDetails.classList.add('hidden');

                if (e.target.value === 'bank') {
                    bankAccountSection.classList.remove('hidden');
                } else if (e.target.value === 'cheque') {
                    bankAccountSection.classList.remove('hidden');
                    chequeDetails.classList.remove('hidden');
                }
            });
        },
        preConfirm: () => {
            const amount = parseFloat(Swal.getPopup().querySelector('#vpay-amount').value);
            const method = Swal.getPopup().querySelector('#vpay-method').value;

            if (!amount || amount <= 0) {
                Swal.showValidationMessage(`Please enter a valid amount`);
                return false;
            }

            const paymentData = { amount, method };

            if (method === 'bank' || method === 'cheque') {
                const bankAccIdEl = Swal.getPopup().querySelector('#vpay-bank-account-id');
                const bankAccId = bankAccIdEl ? parseInt(bankAccIdEl.value) : null;
                if (!bankAccId) {
                    Swal.showValidationMessage('Please select a bank account to deduct from.');
                    return false;
                }
                paymentData.selectedBankAccountId = bankAccId;
            }

            if (method === 'cheque') {
                paymentData.cheque_no = Swal.getPopup().querySelector('#vpay-cheque-no').value;
                paymentData.cheque_date = Swal.getPopup().querySelector('#vpay-cheque-date').value;
                paymentData.cheque_bank = Swal.getPopup().querySelector('#vpay-cheque-bank').value;
                paymentData.cheque_branch = Swal.getPopup().querySelector('#vpay-cheque-branch').value;
            }

            return paymentData;
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await recordVendorPayment(id, result.value);
        }
    });
}

async function recordVendorPayment(vendorId, data) {
    const { amount, method, cheque_no, cheque_date, cheque_bank, cheque_branch, selectedBankAccountId } = data;
    try {
        await db.transaction('rw', db.vendors, db.payments, db.ledger, db.accounts, db.expenses, db.bank_accounts, db.bank_transactions, async () => {
            const vendor = await db.vendors.get(vendorId);
            const accounts = await db.accounts.toArray();
            let payableAcc = accounts.find(a => a.code === '2000');
            if (!payableAcc) {
                const id = await db.accounts.add({ name: 'Accounts Payable', type: 'Liability', code: '2000' });
                payableAcc = await db.accounts.get(id);
            }
            const payableAccId = payableAcc.id;

            let sourceAccId;
            if (method === 'cash') {
                let cashAcc = accounts.find(a => a.code === '1000');
                if (!cashAcc) {
                    const id = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                    cashAcc = await db.accounts.get(id);
                }
                sourceAccId = cashAcc.id;
            } else {
                let bankAcc = accounts.find(a => a.code === '1010');
                if (!bankAcc) {
                    const id = await db.accounts.add({ name: 'Bank Account', type: 'Asset', code: '1010' });
                    bankAcc = await db.accounts.get(id);
                }
                sourceAccId = bankAcc.id;
            }

            // 1. Update Vendor Balance
            const newBalance = (vendor.current_balance || 0) - amount;
            await db.vendors.update(vendorId, { current_balance: newBalance });

            // 2. Add Payment Record
            const paymentId = await db.payments.add({
                date: new Date().toISOString(),
                target_id: vendorId,
                target_type: 'vendor',
                amount: amount,
                method: method,
                account_id: selectedBankAccountId || null,
                bank_name: cheque_bank || null,
                cheque_number: cheque_no || null,
                cheque_no: cheque_no || null,
                cheque_date: cheque_date || null,
                cheque_bank: cheque_bank || null,
                cheque_branch: cheque_branch || null
            });

            // 3. Add to Expenses table (payments to suppliers recorded under expenses)
            await db.expenses.add({
                date: new Date().toISOString(),
                category: 'Supplier Payment',
                account_id: payableAccId,
                amount: amount,
                description: `Payment to ${vendor.name} (${method})`,
                payment_method: method === 'bank' || method === 'cheque' ? method : 'cash',
                bank_account_id: selectedBankAccountId || null,
                reference_type: 'Payment',
                reference_id: paymentId
            });

            // 4. Ledger Record (Debit Payable, Credit Cash/Bank)
            if (typeof recordTransaction === 'function') {
                await recordTransaction(payableAccId, amount, 'debit', `Payment to ${vendor.name}`, 'Payment', paymentId);
                await recordTransaction(sourceAccId, amount, 'credit', `Payment to ${vendor.name}`, 'Payment', paymentId);
            }

            // 5. Deduct from Bank Account balance when method is bank or cheque
            if (selectedBankAccountId && (method === 'bank' || method === 'cheque')) {
                const methodLabel = method === 'bank' ? 'Bank Transfer' : 'Cheque Payment';
                const ref = `Payment Receipt #${paymentId}`;
                const descSuffix = method === 'cheque' && cheque_no
                    ? ` (Cheque No: ${cheque_no}${cheque_bank ? ', Bank: ' + cheque_bank : ''})`
                    : '';
                const desc = `${methodLabel} — Payment to ${vendor.name}${descSuffix}`;

                if (typeof recordBankTransaction === 'function') {
                    await recordBankTransaction(
                        selectedBankAccountId,
                        'outward',
                        methodLabel,
                        amount,
                        ref,
                        desc,
                        new Date().toISOString().split('T')[0]
                    );
                }
            }

            if (typeof logActivity === 'function') {
                await logActivity(`Vendor Payment: ${vendor.name} - ${formatCurrency(amount)} (${method})`);
            }
        });

        showAlert('Success', 'Payment recorded successfully');
        if (typeof renderVendorsList === 'function') renderVendorsList();
        if (typeof loadOutstanding === 'function') loadOutstanding(); // Refresh outstanding view
    } catch (err) {
        showAlert('Error', 'Failed to record payment: ' + err.message, 'error');
    }
}
