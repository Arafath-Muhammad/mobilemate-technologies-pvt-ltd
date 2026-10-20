// Company Loan Management
let selectedCompanyLoanId = null;

async function loadCompanyLoans() {
    const container = document.getElementById('company-loans-view');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-6 pb-10">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 class="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">Company Loan Management</h1>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Record loan amounts, interest, installment schedules and payment history.</p>
                </div>
                <div class="flex flex-wrap gap-3">
                    <button onclick="openCompanyLoanModal()" class="bg-primary hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-plus-circle"></i> Add New Loan
                    </button>
                    <button onclick="renderCompanyLoansView()" class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:border-primary shadow-sm active:scale-95">
                        <i class="fa-solid fa-arrows-rotate"></i> Refresh Data
                    </button>
                </div>
            </div>

            <div id="company-loans-summary" class="grid grid-cols-1 xl:grid-cols-3 gap-6"></div>
            <div id="company-loans-table" class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden"></div>
            <div id="company-loan-payments-panel" class="bg-white dark:bg-darkCard rounded-[2.5rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden"></div>
        </div>
    `;

    await renderCompanyLoansView();
}

async function renderCompanyLoansView() {
    await renderCompanyLoanSummary();
    await renderCompanyLoanTable();
    if (selectedCompanyLoanId) {
        await renderCompanyLoanPaymentsPanel(selectedCompanyLoanId);
    } else {
        document.getElementById('company-loan-payments-panel').innerHTML = `
            <div class="p-10 text-center text-gray-500 dark:text-gray-400">
                <i class="fa-solid fa-wallet text-4xl mb-4"></i>
                <h2 class="text-xl font-black mb-2">Select a loan to view payment history</h2>
                <p class="text-sm">Click on any loan row or use the payments button to inspect the installment schedule and recorded payments.</p>
            </div>
        `;
    }
}

async function renderCompanyLoanSummary() {
    const summaryContainer = document.getElementById('company-loans-summary');
    if (!summaryContainer) return;

    const loans = await db.company_loans.toArray();
    const payments = await db.company_loan_payments.toArray();

    const totalLoaned = loans.reduce((sum, loan) => sum + (parseFloat(loan.amount) || 0), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    const totalOutstanding = loans.reduce((sum, loan) => sum + (parseFloat(loan.outstanding_balance) || 0), 0);

    summaryContainer.innerHTML = `
        <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary transition-all">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Loan Amount</div>
            <div class="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">${formatCurrency(totalLoaned)}</div>
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">All loan amounts recorded for the company.</p>
        </div>
        <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-emerald-500 transition-all">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Paid</div>
            <div class="text-4xl font-black text-emerald-600 tracking-tighter">${formatCurrency(totalPaid)}</div>
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Payments recorded against company loans.</p>
        </div>
        <div class="bg-white dark:bg-darkCard p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-rose-500 transition-all">
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Outstanding</div>
            <div class="text-4xl font-black text-rose-500 tracking-tighter">${formatCurrency(totalOutstanding)}</div>
            <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">Outstanding balance remaining on company loans.</p>
        </div>
    `;
}

async function renderCompanyLoanTable() {
    const container = document.getElementById('company-loans-table');
    if (!container) return;

    const loans = await db.company_loans.reverse().toArray();
    container.innerHTML = `
        <div class="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h3 class="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">Loan Portfolio</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track each loan, lender details, installment plan, interest and balance.</p>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                    <tr>
                        <th class="p-4">Loan ID</th>
                        <th class="p-4">Loan Date</th>
                        <th class="p-4">Lender / Bank</th>
                        <th class="p-4">Loan Amount</th>
                        <th class="p-4">Paid</th>
                        <th class="p-4">Outstanding</th>
                        <th class="p-4">Interest</th>
                        <th class="p-4">Due Date</th>
                        <th class="p-4">Status</th>
                        <th class="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    ${loans.length === 0 ? `
                        <tr><td colspan="10" class="p-16 text-center text-gray-400 font-bold uppercase tracking-widest">No company loans recorded yet.</td></tr>
                    ` : loans.map(loan => {
                        const totalPaid = loan.amount - loan.outstanding_balance;
                        const status = getLoanStatus(loan);
                        const statusClass = status === 'Repaid' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : status === 'Overdue' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200';
                        return `
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors cursor-pointer" onclick="selectCompanyLoan(${loan.id})">
                                <td class="p-4 font-black text-gray-900 dark:text-white">#${loan.id}</td>
                                <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${formatDateDisplay(loan.loan_date)}</td>
                                <td class="p-4 text-sm text-gray-700 dark:text-gray-300">
                                    <div class="font-black uppercase tracking-tighter">${escapeHtml(loan.lender)}</div>
                                    <div class="text-xs text-gray-400 mt-1">${escapeHtml(loan.bank_details || 'No bank details')}</div>
                                </td>
                                <td class="p-4 font-black text-gray-900 dark:text-white">${formatCurrency(loan.amount)}</td>
                                <td class="p-4 font-bold text-emerald-600">${formatCurrency(totalPaid)}</td>
                                <td class="p-4 font-bold text-rose-500">${formatCurrency(loan.outstanding_balance)}</td>
                                <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${loan.interest_rate ? loan.interest_rate + '%' : 'N/A'}</td>
                                <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${formatDateDisplay(loan.due_date)}</td>
                                <td class="p-4">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.24em] ${statusClass}">${status}</span>
                                </td>
                                <td class="p-4 text-right space-x-2">
                                    <button onclick="event.stopPropagation(); openLoanPaymentModal(${loan.id})" class="px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600">Payment</button>
                                    <button onclick="event.stopPropagation(); openCompanyLoanModal(${loan.id})" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-gray-700">Edit</button>
                                    <button onclick="event.stopPropagation(); deleteCompanyLoan(${loan.id})" class="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 dark:hover:bg-rose-900">Delete</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getLoanStatus(loan) {
    const outstanding = parseFloat(loan.outstanding_balance) || 0;
    const dueDate = loan.due_date ? new Date(loan.due_date) : null;
    const today = new Date();

    if (outstanding <= 0) return 'Repaid';
    if (dueDate && dueDate < today) return 'Overdue';
    return 'Active';
}

async function selectCompanyLoan(loanId) {
    selectedCompanyLoanId = loanId;
    await renderCompanyLoanPaymentsPanel(loanId);
}

function formatDateDisplay(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(value) {
    if (!value) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function openCompanyLoanModal(loanId = null) {
    let loan = {
        lender: '',
        bank_details: '',
        amount: '',
        loan_date: new Date().toISOString().split('T')[0],
        interest_rate: '',
        installment_amount: '',
        installments_total: '',
        due_date: new Date().toISOString().split('T')[0],
        notes: ''
    };

    if (loanId) {
        const existing = await db.company_loans.get(loanId);
        if (existing) {
            loan = {
                lender: existing.lender || '',
                bank_details: existing.bank_details || '',
                amount: existing.amount || '',
                loan_date: existing.loan_date || new Date().toISOString().split('T')[0],
                interest_rate: existing.interest_rate || '',
                installment_amount: existing.installment_amount || '',
                installments_total: existing.installments_total || '',
                due_date: existing.due_date || new Date().toISOString().split('T')[0],
                notes: existing.notes || ''
            };
        }
    }

    const { value: formValues } = await Swal.fire({
        title: `${loanId ? 'Edit' : 'New'} Company Loan`,
        html: `
            <div class="grid grid-cols-1 gap-4 text-left">
                <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Lender / Bank</label>
                <input id="loan-lender" class="swal2-input" placeholder="Lender or Bank name" value="${escapeHtml(loan.lender)}">

                <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Bank / Branch Details</label>
                <textarea id="loan-bank-details" class="swal2-textarea" placeholder="Bank, branch or lender contact">${escapeHtml(loan.bank_details)}</textarea>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Loan Amount</label>
                        <input id="loan-amount" type="number" min="0" step="0.01" class="swal2-input" placeholder="0.00" value="${loan.amount}">
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Loan Date</label>
                        <input id="loan-date" type="date" class="swal2-input" value="${loan.loan_date}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Interest Rate (%)</label>
                        <input id="loan-interest" type="number" min="0" step="0.01" class="swal2-input" placeholder="e.g. 12.5" value="${loan.interest_rate}">
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Due Date</label>
                        <input id="loan-due-date" type="date" class="swal2-input" value="${loan.due_date}">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Installment Amount</label>
                        <input id="loan-installment-amount" type="number" min="0" step="0.01" class="swal2-input" placeholder="0.00" value="${loan.installment_amount}">
                    </div>
                    <div>
                        <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Total Installments</label>
                        <input id="loan-installments-total" type="number" min="0" step="1" class="swal2-input" placeholder="e.g. 12" value="${loan.installments_total}">
                    </div>
                </div>

                <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Notes</label>
                <textarea id="loan-notes" class="swal2-textarea" placeholder="Any loan terms, remarks or repayment notes">${escapeHtml(loan.notes)}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: loanId ? 'Update Loan' : 'Save Loan',
        focusConfirm: false,
        customClass: {
            popup: 'rounded-[1.5rem] border border-gray-200 dark:border-darkBorder',
            confirmButton: 'bg-primary text-white rounded-xl px-6 py-3 font-black uppercase tracking-widest',
            cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest'
        },
        didOpen: () => {
            const inputs = Swal.getPopup().querySelectorAll('.swal2-input, .swal2-textarea');
            inputs.forEach(i => i.classList.add('border border-gray-200 dark:border-gray-700'));
        },
        preConfirm: () => {
            const lender = document.getElementById('loan-lender').value.trim();
            const amount = parseFloat(document.getElementById('loan-amount').value);
            const loanDate = document.getElementById('loan-date').value;
            const dueDate = document.getElementById('loan-due-date').value;
            const interestRate = parseFloat(document.getElementById('loan-interest').value) || 0;
            const installmentAmount = parseFloat(document.getElementById('loan-installment-amount').value) || 0;
            const installmentsTotal = parseInt(document.getElementById('loan-installments-total').value, 10) || 0;
            const bankDetails = document.getElementById('loan-bank-details').value.trim();
            const notes = document.getElementById('loan-notes').value.trim();

            if (!lender) {
                Swal.showValidationMessage('Lender or bank name is required.');
                return false;
            }
            if (!loanDate) {
                Swal.showValidationMessage('Loan date is required.');
                return false;
            }
            if (!dueDate) {
                Swal.showValidationMessage('Due date is required.');
                return false;
            }
            if (!amount || amount <= 0) {
                Swal.showValidationMessage('Please enter a valid loan amount.');
                return false;
            }

            return {
                lender,
                bank_details: bankDetails,
                amount,
                loan_date: loanDate,
                interest_rate: interestRate,
                installment_amount: installmentAmount,
                installments_total: installmentsTotal,
                due_date: dueDate,
                notes
            };
        }
    });

    if (!formValues) return;

    try {
        const selectedLoan = loanId ? await db.company_loans.get(loanId) : null;
        const existingPaymentTotal = selectedLoan ? await getLoanPaymentTotal(loanId) : 0;
        const outstandingBalance = selectedLoan
            ? Math.max(formValues.amount - existingPaymentTotal, 0)
            : formValues.amount;

        if (loanId) {
            await db.company_loans.update(loanId, {
                ...formValues,
                outstanding_balance: outstandingBalance,
                status: outstandingBalance <= 0 ? 'repaid' : 'active'
            });

            // Update/sync ledger entries
            try {
                if (typeof recordTransaction === 'function') {
                    // First, delete old entries
                    await db.ledger.where({ reference_id: loanId, reference_type: 'Loan' }).delete();

                    // Retrieve or create ledger accounts
                    const accounts = await db.accounts.toArray();
                    let cashAcc = accounts.find(a => a.code === '1000');
                    if (!cashAcc) {
                        const cid = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                        cashAcc = await db.accounts.get(cid);
                    }

                    let liabilityAcc = accounts.find(a => a.code === '2000');
                    if (!liabilityAcc) {
                        const lid = await db.accounts.add({ name: 'Accounts Payable', type: 'Liability', code: '2000' });
                        liabilityAcc = await db.accounts.get(lid);
                    }

                    // Record updated transactions
                    await db.transaction('rw', db.ledger, async () => {
                        await recordTransaction(cashAcc.id, formValues.amount, 'debit', `Loan #${loanId} received from ${formValues.lender}`, 'Loan', loanId, formValues.loan_date);
                        await recordTransaction(liabilityAcc.id, formValues.amount, 'credit', `Loan #${loanId} recorded as liability`, 'Loan', loanId, formValues.loan_date);
                    });
                }
            } catch (ledgerErr) {
                console.error('Error updating loan ledger entries:', ledgerErr);
            }

            showAlert('Loan Updated', 'Company loan record has been updated successfully.', 'success');
        } else {
            const newLoanId = await db.company_loans.add({
                ...formValues,
                outstanding_balance: outstandingBalance,
                status: 'active',
                created_at: new Date().toISOString()
            });

            // Auto-record the cash increase and corresponding liability in the ledger
            try {
                if (typeof recordTransaction === 'function') {
                    const accounts = await db.accounts.toArray();
                    let cashAcc = accounts.find(a => a.code === '1000');
                    if (!cashAcc) {
                        const cid = await db.accounts.add({ name: 'Cash on Hand', type: 'Asset', code: '1000' });
                        cashAcc = await db.accounts.get(cid);
                    }

                    let liabilityAcc = accounts.find(a => a.code === '2000');
                    if (!liabilityAcc) {
                        const lid = await db.accounts.add({ name: 'Accounts Payable', type: 'Liability', code: '2000' });
                        liabilityAcc = await db.accounts.get(lid);
                    }

                    await db.transaction('rw', db.ledger, async () => {
                        await recordTransaction(cashAcc.id, formValues.amount, 'debit', `Loan #${newLoanId} received from ${formValues.lender}`, 'Loan', newLoanId, formValues.loan_date);
                        await recordTransaction(liabilityAcc.id, formValues.amount, 'credit', `Loan #${newLoanId} recorded as liability`, 'Loan', newLoanId, formValues.loan_date);
                    });
                }
            } catch (ledgerErr) {
                console.error('Error recording loan ledger entries:', ledgerErr);
            }

            showAlert('Loan Saved', 'New company loan has been recorded.', 'success');
        }
        await renderCompanyLoansView();
    } catch (err) {
        console.error(err);
        showAlert('Error Saving Loan', err.message || 'Unable to save loan record.', 'error');
    }
}

async function getLoanPaymentTotal(loanId) {
    const payments = await db.company_loan_payments.where('loan_id').equals(loanId).toArray();
    return payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
}

async function openLoanPaymentModal(loanId) {
    const loan = await db.company_loans.get(loanId);
    if (!loan) return showAlert('Loan Not Found', 'The selected loan record could not be located.', 'error');

    const { value: paymentData } = await Swal.fire({
        title: `Record Payment for Loan #${loan.id}`,
        html: `
            <div class="grid grid-cols-1 gap-4 text-left">
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Payment Date</label>
                    <input id="loan-payment-date" type="date" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Amount Paid</label>
                    <input id="loan-payment-amount" type="number" min="0" step="0.01" class="swal2-input" placeholder="0.00">
                </div>
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Payment Method</label>
                    <select id="loan-payment-method" class="swal2-select">
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Reference / Cheque No.</label>
                    <input id="loan-payment-reference" class="swal2-input" placeholder="Reference number or cheque details">
                </div>
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Bank Name</label>
                    <input id="loan-payment-bank" class="swal2-input" placeholder="Bank name if applicable">
                </div>
                <div>
                    <label class="block text-xs font-black uppercase tracking-widest text-gray-500">Notes</label>
                    <textarea id="loan-payment-notes" class="swal2-textarea" placeholder="Any payment details or remarks"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Payment',
        focusConfirm: false,
        customClass: {
            popup: 'rounded-[1.5rem] border border-gray-200 dark:border-darkBorder',
            confirmButton: 'bg-primary text-white rounded-xl px-6 py-3 font-black uppercase tracking-widest',
            cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest'
        },
        preConfirm: () => {
            const amount = parseFloat(document.getElementById('loan-payment-amount').value);
            const date = document.getElementById('loan-payment-date').value;
            const method = document.getElementById('loan-payment-method').value;
            const reference = document.getElementById('loan-payment-reference').value.trim();
            const bankName = document.getElementById('loan-payment-bank').value.trim();
            const notes = document.getElementById('loan-payment-notes').value.trim();

            if (!date) {
                Swal.showValidationMessage('Payment date is required.');
                return false;
            }
            if (!amount || amount <= 0) {
                Swal.showValidationMessage('Enter a valid payment amount.');
                return false;
            }
            if (amount > loan.outstanding_balance) {
                Swal.showValidationMessage('Payment cannot exceed outstanding balance.');
                return false;
            }

            return { date, amount, method, reference, bank_name: bankName, notes };
        }
    });

    if (!paymentData) return;

    try {
        await db.company_loan_payments.add({
            loan_id: loan.id,
            date: paymentData.date,
            amount: paymentData.amount,
            method: paymentData.method,
            reference: paymentData.reference,
            bank_name: paymentData.bank_name,
            notes: paymentData.notes
        });

        const paymentTotal = await getLoanPaymentTotal(loan.id);
        const outstanding = Math.max(loan.amount - paymentTotal, 0);
        await db.company_loans.update(loan.id, {
            outstanding_balance: outstanding,
            status: outstanding <= 0 ? 'repaid' : 'active'
        });

        showAlert('Payment Recorded', `Payment of ${formatCurrency(paymentData.amount)} has been saved.`, 'success');
        selectedCompanyLoanId = loan.id;
        await renderCompanyLoansView();
    } catch (err) {
        console.error(err);
        showAlert('Error Recording Payment', err.message || 'Unable to save payment.', 'error');
    }
}

async function renderCompanyLoanPaymentsPanel(loanId) {
    const container = document.getElementById('company-loan-payments-panel');
    if (!container) return;

    const loan = await db.company_loans.get(loanId);
    if (!loan) {
        container.innerHTML = `<div class="p-10 text-center text-gray-500 dark:text-gray-400">Loan not found.</div>`;
        return;
    }

    const payments = await db.company_loan_payments.where('loan_id').equals(loanId).reverse().toArray();
    const paidTotal = await getLoanPaymentTotal(loanId);

    container.innerHTML = `
        <div class="px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/30 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h3 class="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">Payment History for Loan #${loan.id}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${escapeHtml(loan.lender)} • Outstanding ${formatCurrency(loan.outstanding_balance)}</p>
            </div>
            <button onclick="openLoanPaymentModal(${loan.id})" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95">
                <i class="fa-solid fa-money-bill-wave"></i> Add Payment
            </button>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 p-8 border-b border-gray-100 dark:border-gray-800">
            <div class="bg-slate-50 dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Loan Amount</div>
                <div class="text-2xl font-black text-gray-900 dark:text-white">${formatCurrency(loan.amount)}</div>
            </div>
            <div class="bg-slate-50 dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Paid So Far</div>
                <div class="text-2xl font-black text-emerald-600">${formatCurrency(paidTotal)}</div>
            </div>
            <div class="bg-slate-50 dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Remaining Balance</div>
                <div class="text-2xl font-black text-rose-500">${formatCurrency(loan.outstanding_balance)}</div>
            </div>
        </div>
        <div class="overflow-x-auto p-8">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                    <tr>
                        <th class="p-4">Date</th>
                        <th class="p-4">Amount</th>
                        <th class="p-4">Method</th>
                        <th class="p-4">Reference</th>
                        <th class="p-4">Bank</th>
                        <th class="p-4">Notes</th>
                        <th class="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    ${payments.length === 0 ? `
                        <tr><td colspan="7" class="p-16 text-center text-gray-400 font-bold uppercase tracking-widest">No payments recorded for this loan yet.</td></tr>
                    ` : payments.map(payment => `
                        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${formatDateDisplay(payment.date)}</td>
                            <td class="p-4 font-black text-gray-900 dark:text-white">${formatCurrency(payment.amount)}</td>
                            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${escapeHtml(payment.method)}</td>
                            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${escapeHtml(payment.reference)}</td>
                            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${escapeHtml(payment.bank_name)}</td>
                            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${escapeHtml(payment.notes)}</td>
                            <td class="p-4 text-right">
                                <button onclick="event.stopPropagation(); deleteCompanyLoanPayment(${payment.id}, ${loan.id})" class="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 dark:hover:bg-rose-900">Remove</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function deleteCompanyLoanPayment(paymentId, loanId) {
    const confirmed = await Swal.fire({
        title: 'Delete Payment?',
        text: 'This action will remove the payment record and update loan balances.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'bg-rose-600 text-white rounded-xl px-6 py-3',
            cancelButton: 'rounded-xl px-6 py-3'
        }
    });

    if (!confirmed.isConfirmed) return;

    await db.company_loan_payments.delete(paymentId);
    const loan = await db.company_loans.get(loanId);
    const paymentTotal = await getLoanPaymentTotal(loanId);
    const outstanding = Math.max(loan.amount - paymentTotal, 0);
    await db.company_loans.update(loanId, {
        outstanding_balance: outstanding,
        status: outstanding <= 0 ? 'repaid' : 'active'
    });

    showAlert('Payment Removed', 'The payment record has been deleted.', 'success');
    await renderCompanyLoansView();
}

async function deleteCompanyLoan(loanId) {
    const confirmed = await Swal.fire({
        title: 'Delete Loan Record?',
        text: 'Removing this loan will also delete its payment history and corresponding general ledger entries. This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete Loan',
        cancelButtonText: 'Cancel',
        customClass: {
            confirmButton: 'bg-rose-600 text-white rounded-xl px-6 py-3',
            cancelButton: 'rounded-xl px-6 py-3'
        }
    });

    if (!confirmed.isConfirmed) return;

    try {
        await db.company_loan_payments.where('loan_id').equals(loanId).delete();
        await db.company_loans.delete(loanId);
        
        // Clean up associated ledger records
        try {
            if (typeof db.ledger !== 'undefined') {
                await db.ledger.where({ reference_id: loanId, reference_type: 'Loan' }).delete();
            }
        } catch (ledgerErr) {
            console.error('Error deleting loan ledger entries:', ledgerErr);
        }

        selectedCompanyLoanId = null;
        showAlert('Loan Deleted', 'Company loan and associated payments/ledger records have been removed.', 'success');
        await renderCompanyLoansView();
    } catch (err) {
        console.error(err);
        showAlert('Error Deleting Loan', err.message || 'Unable to delete loan record.', 'error');
    }
}
