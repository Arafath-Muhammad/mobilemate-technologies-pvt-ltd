// Finance & Payments Logic

function isCashTermsInvoice(sale) {
    if (!sale) return false;
    if (sale.status === 'unpaid' || sale.status === 'partial') return false;
    const payType = String(sale.payment_type || '').toLowerCase().trim();
    const payTerms = String(sale.payment_terms || '').toLowerCase().trim();
    const payMethod = String(sale.payment_method || '').toLowerCase().trim();

    if (payType === 'cash' || payTerms === 'cash' || payMethod === 'cash') return true;
    if (payType.includes('cash') || payTerms.includes('cash') || payMethod.includes('cash')) return true;
    return false;
}
window.isCashTermsInvoice = isCashTermsInvoice;

async function loadFinance() {
    console.log("Loading Finance view...");
    const container = document.getElementById('finance-view');
    if (!container) return;

    // Auto-heal any cash terms invoices in DB that were previously misconfigured as unpaid
    try {
        const cashSalesToFix = await db.sales.filter(s =>
            (['invoice', 'pos_invoice', 'sale'].includes(s.document_type)) &&
            isCashTermsInvoice(s) &&
            (s.status !== 'paid' || (parseFloat(s.paid_amount) || 0) < (parseFloat(s.total) || 0) - 0.01)
        ).toArray();

        for (const cs of cashSalesToFix) {
            await db.sales.update(cs.id, {
                paid_amount: parseFloat(cs.total) || 0,
                status: 'paid'
            });
        }
    } catch (err) {
        console.warn('[Finance] Auto-heal cash invoices notice:', err);
    }

    const today = new Date();
    const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
    const firstDay = oneYearAgo.toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];

    const html = `
        <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">FINANCE & RECEIVABLES</h1>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Track outstanding customer balances and pending credit invoices.</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="finance-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="finance-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <button onclick="syncInvoiceStatusFromPayments()" class="flex items-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm border border-amber-200">
                        <i class="fa-solid fa-rotate"></i> Sync Status
                    </button>
                    <button onclick="batchReconcileInvoices()" class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                        <i class="fa-solid fa-circle-check"></i> Batch Mark Paid
                    </button>
                    <button onclick="openUnreceiveInvoiceModal()" class="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95" title="Unreceive a mistakenly received invoice">
                        <i class="fa-solid fa-rotate-left"></i> Unreceive Invoice
                    </button>
                    <div class="bg-gradient-to-br from-red-500 to-red-600 px-8 py-4 rounded-[2rem] shadow-xl shadow-red-500/20 text-white flex items-center gap-6">
                        <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <i class="fa-solid fa-file-invoice-dollar text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase opacity-80 tracking-widest leading-none mb-1">Total Outstanding</p>
                            <h3 class="text-3xl font-black italic tracking-tighter" id="total-outstanding-val">Rs. 0.00</h3>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Outstanding Invoices -->
            <div class="bg-white dark:bg-darkCard rounded-[2rem] shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden mt-8">
                <div class="p-6 border-b border-gray-50 dark:border-darkBorder flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-black italic uppercase tracking-tighter">OUTSTANDING SALES INVOICES</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pending collections from credit customers</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th class="p-6">INV REF</th>
                                <th class="p-6">CUSTOMER</th>
                                <th class="p-6">DATE</th>
                                <th class="p-6 text-right">TOTAL</th>
                                <th class="p-6 text-right">PAID</th>
                                <th class="p-6 text-right">BALANCE</th>
                                <th class="p-6 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody id="outstanding-list-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                            <!-- Loaded via renderOutstandingInvoices -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Recent Payments History -->
            <div class="bg-white dark:bg-darkCard rounded-[2rem] shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                <div class="p-6 border-b border-gray-50 dark:border-darkBorder flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-black italic uppercase tracking-tighter text-emerald-600">RECENTLY RECEIVED PAYMENTS</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Post-payment reconciliation & edits</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th class="p-6">DATE & TIME</th>
                                <th class="p-6">CUSTOMER</th>
                                <th class="p-6">REFERENCE</th>
                                <th class="p-6 text-right">AMOUNT</th>
                                <th class="p-6 text-center">METHOD</th>
                                <th class="p-6 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody id="recent-payments-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                            <!-- Loaded via renderRecentPayments -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const refreshFinance = async () => {
        const start = document.getElementById('finance-start-date')?.value || '';
        const end = document.getElementById('finance-end-date')?.value || '';

        const allSales = await db.sales.reverse().toArray();
        let filteredSales = allSales;
        if (start && end) {
            filteredSales = allSales.filter(s => {
                const d = s.date.split('T')[0];
                return d >= start && d <= end;
            });
        }

        // Include all invoices that are credit/COD and not explicitly marked paid.
        // Cash terms invoices are settled at point-of-sale and must NOT appear in outstanding.
        const allPayments = await db.payments.toArray();
        const outstanding = [];

        for (const s of filteredSales) {
            if (!['invoice', 'pos_invoice', 'sale'].includes(s.document_type)) continue;

            // Invoices with cash terms must NEVER show up in outstanding list
            if (isCashTermsInvoice(s)) continue;

            // Skip non-credit settled sales
            const payType = String(s.payment_type || s.payment_terms || '').toLowerCase().trim();
            if (!['credit', 'cod'].includes(payType) && (s.status === 'paid' || s.status === 'completed')) {
                continue;
            }

            const paidAmount = await getSaleComputedPaidAmount(s, allPayments);
            const remaining = Math.max(0, (parseFloat(s.total) || 0) - paidAmount);
            if (remaining > 0.01) {
                outstanding.push(s);
            }
        }

        renderOutstandingInvoices(outstanding);
        renderRecentPayments(start, end);
    };

    document.getElementById('finance-start-date')?.addEventListener('change', refreshFinance);
    document.getElementById('finance-end-date')?.addEventListener('change', refreshFinance);

    await refreshFinance();
}

async function getSaleComputedPaidAmount(sale, allPayments = null) {
    if (!sale) return 0;
    const total = parseFloat(sale.total) || 0;

    // Cash terms invoices are fully paid at point of sale
    if (isCashTermsInvoice(sale)) {
        return total;
    }

    const payType = String(sale.payment_type || sale.payment_terms || '').toLowerCase().trim();
    if (!['credit', 'cod'].includes(payType) && (sale.status === 'paid' || sale.status === 'completed')) {
        return total;
    }

    const payments = allPayments || await db.payments.toArray();
    const salePayments = payments.filter(p => {
        if (p.target_type === 'invoice' && Number(p.target_id) === Number(sale.id)) return true;
        if (p.target_type === 'customer' && Number(p.invoice_id) === Number(sale.id)) return true;
        return false;
    });
    const totalPaymentAmount = salePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const directPaid = parseFloat(sale.paid_amount) || 0;
    return Math.max(totalPaymentAmount, directPaid);
}

async function renderRecentPayments(startDate = null, endDate = null) {
    const tbody = document.getElementById('recent-payments-body');
    if (!tbody) return;

    const startVal = startDate || document.getElementById('finance-start-date')?.value || '';
    const endVal = endDate || document.getElementById('finance-end-date')?.value || '';

    let payments = await db.payments.where('target_type').equals('invoice').reverse().toArray();

    if (startVal && endVal) {
        payments = payments.filter(p => {
            const d = p.date.split('T')[0];
            return d >= startVal && d <= endVal;
        });
    }

    payments = payments.slice(0, 20);

    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-400">No payment history yet.</td></tr>';
        return;
    }

    let html = '';
    for (const p of payments) {
        let customerName = 'Walk-in Customer';
        let sale = null;

        if (p.target_type === 'invoice') {
            sale = await db.sales.get(p.target_id);
            if (sale && sale.customer_id) {
                const cust = await db.customers.get(sale.customer_id);
                if (cust) customerName = cust.name;
            } else if (sale && sale.customer_name) {
                customerName = sale.customer_name;
            }
        } else if (p.target_type === 'customer') {
            const cust = await db.customers.get(p.target_id);
            if (cust) customerName = cust.name;
        }

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-6">
                    <div class="text-xs font-bold text-gray-900 dark:text-white">${new Date(p.date).toLocaleDateString()}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">${new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td class="p-6 text-sm font-medium text-gray-700 dark:text-gray-300">${customerName}</td>
                <td class="p-6 text-[10px] font-black uppercase text-gray-400">${getInvoiceDisplayNumber(sale)}</td>
                <td class="p-6 text-sm text-right font-black text-emerald-600">Rs. ${parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-6 text-center">
                    <span class="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">${p.method}</span>
                    ${p.method.toLowerCase() === 'cheque' && p.cheque_number ? `<div class="text-[8px] font-black text-primary mt-1 uppercase tracking-tighter">#${p.cheque_number} - ${p.bank_name || 'N/A'}</div>` : ''}
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="editPayment(${p.id})" class="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit Payment">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="unreceiveInvoice(${sale ? sale.id : p.target_id})" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Unreceive Invoice (Reverse to Unpaid)">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button onclick="deletePayment(${p.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Payment">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

async function editPayment(paymentId) {
    const payment = await db.payments.get(paymentId);
    if (!payment) return;

    const { value: formValues } = await Swal.fire({
        title: 'Edit Payment Record',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Amount (Rs.)</label>
                    <input type="number" id="swal-payment-amount" class="swal2-input w-full m-0" value="${payment.amount}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <select id="swal-payment-method" class="swal2-input w-full m-0">
                        <option value="cash" ${payment.method === 'cash' ? 'selected' : ''}>Cash</option>
                        <option value="bank" ${payment.method === 'bank' ? 'selected' : ''}>Bank Transfer</option>
                        <option value="cheque" ${payment.method === 'cheque' ? 'selected' : ''}>Cheque</option>
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update Record',
        preConfirm: () => {
            return {
                amount: parseFloat(document.getElementById('swal-payment-amount').value),
                method: document.getElementById('swal-payment-method').value
            }
        }
    });

    if (formValues) {
        try {
            const diff = formValues.amount - payment.amount;

            await db.transaction('rw', db.payments, db.sales, db.customers, db.ledger, db.accounts, async () => {
                await db.payments.update(paymentId, {
                    amount: formValues.amount,
                    method: formValues.method
                });

                const saleId = payment.target_id;
                const sale = await db.sales.get(saleId);

                // 1. Recalculate invoice status
                if (sale) {
                    const newPaidAmount = (parseFloat(sale.paid_amount) || 0) + diff;

                    let newStatus = 'partial';
                    if (newPaidAmount >= parseFloat(sale.total)) newStatus = 'paid';
                    else if (newPaidAmount <= 0) newStatus = 'unpaid';

                    await db.sales.update(saleId, {
                        paid_amount: newPaidAmount,
                        status: newStatus
                    });

                    // 2. Adjust Customer Balance
                    if (sale.customer_id && diff !== 0) {
                        const customer = await db.customers.get(sale.customer_id);
                        if (customer) {
                            await db.customers.update(sale.customer_id, {
                                current_balance: (parseFloat(customer.current_balance) || 0) - diff
                            });
                        }
                    }
                }

                // 3. Adjust Ledger Entries
                if (diff !== 0) {
                    const ledgers = await db.ledger.where({ reference_type: 'Receipt', reference_id: paymentId }).toArray();
                    for (const l of ledgers) {
                        const newLedgerAmt = parseFloat(l.amount) + diff;
                        if (newLedgerAmt <= 0) {
                            await db.ledger.delete(l.id);
                        } else {
                            await db.ledger.update(l.id, { amount: newLedgerAmt });
                        }
                    }
                }
            });
            showAlert('Success', 'Payment record updated.');
            loadFinance();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        }
    }
}

async function deletePayment(paymentId) {
    const confirm = await Swal.fire({
        title: 'Delete Payment?',
        text: "This will remove the payment record and affect the invoice balance.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it'
    });

    if (confirm.isConfirmed) {
        try {
            const payment = await db.payments.get(paymentId);
            await db.transaction('rw', db.payments, db.sales, db.customers, db.ledger, async () => {
                const saleId = payment.target_id;

                // 1. Reverse Customer Balance
                const sale = await db.sales.get(saleId);
                if (sale && sale.customer_id) {
                    const customer = await db.customers.get(sale.customer_id);
                    if (customer) {
                        await db.customers.update(sale.customer_id, {
                            current_balance: (parseFloat(customer.current_balance) || 0) + payment.amount
                        });
                    }
                }

                // 2. Remove ledger entries linked to this payment
                await db.ledger.where({ reference_type: 'Receipt', reference_id: paymentId }).delete();

                // 3. Delete the payment
                await db.payments.delete(paymentId);

                // 4. Recalculate invoice status
                if (sale) {
                    const newPaidAmount = (parseFloat(sale.paid_amount) || 0) - payment.amount;

                    let newStatus = 'unpaid';
                    if (newPaidAmount >= parseFloat(sale.total)) newStatus = 'paid';
                    else if (newPaidAmount > 0) newStatus = 'partial';

                    await db.sales.update(saleId, {
                        paid_amount: newPaidAmount,
                        status: newStatus
                    });
                }
            });
            showAlert('Deleted', 'Payment record has been removed.');
            loadFinance();
        } catch (err) {
            showAlert('Error', err.message, 'error');
        }
    }
}

async function renderOutstandingInvoices(items) {
    const tbody = document.getElementById('outstanding-list-body');
    if (!tbody) return;

    // Filter out any cash terms invoices or non-credit settled items
    const filteredItems = (items || []).filter(item => {
        if (isCashTermsInvoice(item)) return false;
        const payType = String(item.payment_type || item.payment_terms || '').toLowerCase().trim();
        if (!['credit', 'cod'].includes(payType) && (item.status === 'paid' || item.status === 'completed')) return false;
        return true;
    });

    if (filteredItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-gray-400"><i class="fa-solid fa-check-circle text-emerald-500 text-3xl mb-3 block"></i> No outstanding payments found. All clear!</td></tr>';
        document.getElementById('total-outstanding-val').textContent = 'Rs. 0.00';
        return;
    }

    let totalOutstanding = 0;
    let html = '';

    for (const item of filteredItems) {
        let customerName = 'Walk-in Customer';
        if (item.customer_id) {
            const cust = await db.customers.get(item.customer_id);
            if (cust) customerName = cust.name;
        }

        // Calculate paid from payments table robustly (handles single & bulk payments).
        // Single payments: target_type='invoice', target_id=item.id
        // Bulk payments update sale.paid_amount directly, but we also check via invoice_id as a fallback.
        const paidAmount = await getSaleComputedPaidAmount(item);
        const remaining = Math.max(0, (parseFloat(item.total) || 0) - paidAmount);

        if (remaining <= 0.01) continue; // Skip fully paid (tolerance for floating-point rounding)

        totalOutstanding += remaining;

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-6 text-[10px] font-black uppercase tracking-tighter text-gray-400">${getInvoiceDisplayNumber(item)}</td>
                <td class="p-6">
                    <div class="text-sm font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">${customerName}</div>
                    <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Contact: ${item.customer_phone || '-'}</div>
                </td>
                <td class="p-6 text-xs font-bold text-gray-500">${new Date(item.date).toLocaleDateString()}</td>
                <td class="p-6 text-sm text-right font-black text-gray-900 dark:text-white">Rs. ${parseFloat(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-6 text-sm text-right font-black text-emerald-600">Rs. ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-6 text-sm text-right font-black text-red-600 bg-red-50/30 dark:bg-red-900/10">Rs. ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="openPaymentModal(${item.id}, ${remaining}, '${customerName.replace(/'/g, "\\'")}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95" title="Receive Payment">
                            <i class="fa-solid fa-cash-register mr-1"></i> Receive
                        </button>
                        <button onclick="markInvoiceAsPaid(${item.id})" class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Mark as Paid (Already Received)">
                            <i class="fa-solid fa-circle-check"></i>
                        </button>
                        <button onclick="editSale(${item.id})" class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all" title="Edit Invoice">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteSale(${item.id}, 'sales')" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Delete Invoice">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    if (!html) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-12 text-center text-gray-400"><i class="fa-solid fa-check-circle text-emerald-500 text-3xl mb-3 block"></i> All filtered items are fully paid. Great work!</td></tr>';
    } else {
        tbody.innerHTML = html;
    }
    document.getElementById('total-outstanding-val').textContent = 'Rs. ' + totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Mark Invoice as Paid (for payments received outside the system) ────────
async function markInvoiceAsPaid(saleId) {
    const sale = await db.sales.get(saleId);
    if (!sale) return;

    let customerName = 'Walk-in Customer';
    if (sale.customer_id) {
        const cust = await db.customers.get(sale.customer_id);
        if (cust) customerName = cust.name;
    }

    const total = parseFloat(sale.total) || 0;
    const currentPaid = parseFloat(sale.paid_amount) || 0;
    const outstanding = total - currentPaid;

    const { value: formValues, isConfirmed } = await Swal.fire({
        title: 'Mark Invoice as Paid',
        html: `
            <div class="text-left space-y-3 text-sm">
                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between mb-1">
                        <span class="text-gray-500">Invoice:</span>
                        <span class="font-black">${getInvoiceDisplayNumber(sale)}</span>
                    </div>
                    <div class="flex justify-between mb-1">
                        <span class="text-gray-500">Customer:</span>
                        <span class="font-bold">${customerName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Outstanding:</span>
                        <span class="font-black text-emerald-600">Rs. ${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</label>
                    <select id="quick-pay-method" class="swal2-input w-full m-0 text-sm">
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="KOKO">KOKO</option>
                    </select>
                </div>
                <div id="quick-cheque-fields" class="hidden space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Number</label>
                        <input type="text" id="quick-cheque-no" class="swal2-input w-full m-0 text-sm" placeholder="000000">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Bank Name</label>
                        <input type="text" id="quick-cheque-bank" class="swal2-input w-full m-0 text-sm" placeholder="e.g. Commercial Bank">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cheque Date</label>
                        <input type="date" id="quick-cheque-date" class="swal2-input w-full m-0 text-sm">
                    </div>
                </div>
                <div id="quick-bank-fields" class="hidden space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <label class="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Bank Transfer Reference Number</label>
                    <input type="text" id="quick-bank-ref" class="swal2-input w-full m-0 text-sm" placeholder="e.g. TXN-987654">
                </div>
                <div id="quick-koko-fields" class="hidden space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <label class="block text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">KOKO Reference ID</label>
                    <input type="text" id="quick-koko-ref" class="swal2-input w-full m-0 text-sm" placeholder="e.g. KOKO-12345 (optional)">
                </div>
            </div>
        `,
        didOpen: () => {
            const methodSelect = Swal.getPopup().querySelector('#quick-pay-method');
            const chqDiv = Swal.getPopup().querySelector('#quick-cheque-fields');
            const bankDiv = Swal.getPopup().querySelector('#quick-bank-fields');
            const kokoDiv = Swal.getPopup().querySelector('#quick-koko-fields');
            methodSelect.addEventListener('change', (e) => {
                chqDiv.classList.add('hidden');
                bankDiv.classList.add('hidden');
                kokoDiv.classList.add('hidden');
                if (e.target.value === 'Cheque') chqDiv.classList.remove('hidden');
                else if (e.target.value === 'Bank') bankDiv.classList.remove('hidden');
                else if (e.target.value === 'KOKO') kokoDiv.classList.remove('hidden');
            });
        },
        preConfirm: () => {
            const method = Swal.getPopup().querySelector('#quick-pay-method').value;
            const chequeNo = Swal.getPopup().querySelector('#quick-cheque-no')?.value?.trim();
            const chequeBank = Swal.getPopup().querySelector('#quick-cheque-bank')?.value?.trim();
            const chequeDate = Swal.getPopup().querySelector('#quick-cheque-date')?.value;
            const bankRef = Swal.getPopup().querySelector('#quick-bank-ref')?.value?.trim();
            const kokoRef = Swal.getPopup().querySelector('#quick-koko-ref')?.value?.trim();
            return { method, chequeNo, chequeBank, chequeDate, bankRef, kokoRef };
        },
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, Mark as Paid',
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed || !formValues) return;

    const { method, chequeNo, chequeBank, chequeDate, bankRef, kokoRef } = formValues;
    const nowIso = new Date().toISOString();

    try {
        await db.transaction('rw', db.sales, db.customers, db.payments, async () => {
            // Update sale record
            await db.sales.update(saleId, {
                paid_amount: total,
                status: 'paid',
                settlement_payment_method: method,
                settlement_date: nowIso,
                cheque_number: chequeNo || null,
                cheque_no: chequeNo || null,
                cheque_date: chequeDate || null,
                cheque_bank: chequeBank || null,
                bank_name: chequeBank || null,
                bank_reference: bankRef || null,
                bank_ref: bankRef || null,
                koko_reference: kokoRef || null,
                koko_ref: kokoRef || null
            });

            // Record in payments table
            await db.payments.add({
                date: nowIso,
                target_id: saleId,
                target_type: 'invoice',
                invoice_id: saleId,
                amount: outstanding > 0 ? outstanding : total,
                method: method,
                note: `Settled via Mark as Paid (${method})`,
                cheque_number: chequeNo || null,
                cheque_no: chequeNo || null,
                cheque_date: chequeDate || null,
                cheque_bank: chequeBank || null,
                bank_name: chequeBank || null,
                bank_reference: bankRef || null,
                bank_ref: bankRef || null,
                koko_reference: kokoRef || null,
                koko_ref: kokoRef || null
            });

            // Reduce customer outstanding balance
            if (sale.customer_id) {
                const customer = await db.customers.get(sale.customer_id);
                if (customer) {
                    const newBalance = Math.max(0, (parseFloat(customer.current_balance) || 0) - outstanding);
                    await db.customers.update(sale.customer_id, {
                        current_balance: newBalance
                    });
                }
            }
        });

        showAlert('Invoice Settled', `${getInvoiceDisplayNumber(sale)} has been marked as fully paid (${method}).`, 'success');
        loadFinance(); // Refresh the page
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to mark as paid: ' + err.message, 'error');
    }
}

function closePaymentModal() {
    if (typeof window.closePaymentModal === 'function') {
        window.closePaymentModal();
    } else {
        const modal = document.getElementById('payment-modal');
        if (modal) modal.classList.add('hidden');
    }
}

async function processReceivePayment(saleId, remaining) {
    const amount = parseFloat(document.getElementById('pay-amount-input').value);
    const method = document.getElementById('pay-method-select').value;
    if (isNaN(amount) || amount <= 0) return showAlert('Invalid Amount', 'Please enter a valid amount.', 'warning');

    let chequeDetails = null;
    let bankRef = null;
    let kokoRef = null;

    if (method === 'cheque') {
        const { value: formValues } = await Swal.fire({
            title: 'Cheque Payment Details',
            html:
                '<div class="space-y-4 pt-4">' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Cheque Number</label>' +
                '<input id="swal-cheque-num-fin" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary" placeholder="Enter cheque number"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Bank Name</label>' +
                '<input id="swal-bank-name-fin" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary" placeholder="Enter bank name"></div>' +
                '<div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Cheque Date</label>' +
                '<input id="swal-cheque-date-fin" type="date" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary"></div>' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirm Cheque',
            confirmButtonColor: '#4F46E5',
            preConfirm: () => {
                const num = document.getElementById('swal-cheque-num-fin').value;
                const bank = document.getElementById('swal-bank-name-fin').value;
                const dateVal = document.getElementById('swal-cheque-date-fin').value;
                if (!num || !bank) {
                    Swal.showValidationMessage('Both Cheque Number and Bank Name are required');
                    return false;
                }
                return { cheque_number: num, bank_name: bank, cheque_date: dateVal };
            }
        });

        if (!formValues) return;
        chequeDetails = formValues;
    } else if (method === 'bank') {
        const { value: refVal } = await Swal.fire({
            title: 'Bank Transfer Reference',
            input: 'text',
            inputLabel: 'Reference / Transaction Number',
            inputPlaceholder: 'e.g. TXN987654321',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5'
        });
        bankRef = refVal?.trim() || null;
    } else if (method === 'koko') {
        const { value: refVal } = await Swal.fire({
            title: 'KOKO Payment Details',
            input: 'text',
            inputLabel: 'KOKO Reference / Transaction ID (Optional)',
            inputPlaceholder: 'e.g. KOKO-12345',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5'
        });
        kokoRef = refVal?.trim() || null;
    }

    let selectedBankAccountId = null;
    if (method === 'bank' || method === 'cheque') {
        const bankAccounts = await db.bank_accounts.toArray();
        if (bankAccounts.length === 0) {
            showAlert('Bank Account Required', 'No bank accounts registered. Please register a bank account in the Bank Management module first.', 'warning');
            return;
        }

        if (bankAccounts.length === 1) {
            selectedBankAccountId = bankAccounts[0].id;
        } else {
            const options = {};
            bankAccounts.forEach(b => {
                options[b.id] = `${b.name} (${b.bank_name || ''} - Bal: Rs. ${b.balance.toLocaleString()})`;
            });

            const { value: bankId } = await Swal.fire({
                title: 'Select Bank Account',
                input: 'select',
                inputOptions: options,
                inputPlaceholder: 'Select designated bank account',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                inputValidator: (value) => {
                    if (!value) {
                        return 'You must select a bank account!';
                    }
                }
            });

            if (!bankId) return; // User cancelled
            selectedBankAccountId = parseInt(bankId);
        }
    }

    try {
        await db.transaction('rw', db.sales, db.payments, db.ledger, db.accounts, db.customers, db.bank_accounts, db.bank_transactions, async () => {
            const sale = await db.sales.get(saleId);
            const accounts = await db.accounts.toArray();
            const getAccId = (code) => accounts.find(a => a.code === code)?.id;

            const receivableAccId = getAccId('1200');
            const targetAccId = method === 'cash' ? getAccId('1000') : getAccId('1010');
            const nowIso = new Date().toISOString();

            // 1. Record payment
            const paymentId = await db.payments.add({
                date: nowIso,
                target_id: saleId,
                target_type: 'invoice',
                invoice_id: saleId,
                amount: amount,
                method: method,
                cheque_number: chequeDetails ? chequeDetails.cheque_number : null,
                cheque_no: chequeDetails ? chequeDetails.cheque_number : null,
                cheque_date: chequeDetails ? chequeDetails.cheque_date : null,
                bank_name: chequeDetails ? chequeDetails.bank_name : null,
                cheque_bank: chequeDetails ? chequeDetails.bank_name : null,
                bank_reference: bankRef,
                bank_ref: bankRef,
                koko_reference: kokoRef,
                koko_ref: kokoRef
            });

            // 2. Update Sale Status
            const nPaid = (parseFloat(sale.paid_amount) || 0) + amount;

            let newStatus = 'partial';
            if (nPaid >= parseFloat(sale.total)) {
                newStatus = 'paid';
            }

            const saleUpdate = {
                paid_amount: nPaid,
                status: newStatus
            };

            if (newStatus === 'paid') {
                saleUpdate.settlement_payment_method = method;
                saleUpdate.settlement_date = nowIso;
                saleUpdate.cheque_number = chequeDetails ? chequeDetails.cheque_number : null;
                saleUpdate.cheque_no = chequeDetails ? chequeDetails.cheque_number : null;
                saleUpdate.cheque_date = chequeDetails ? chequeDetails.cheque_date : null;
                saleUpdate.cheque_bank = chequeDetails ? chequeDetails.bank_name : null;
                saleUpdate.bank_name = chequeDetails ? chequeDetails.bank_name : null;
                saleUpdate.bank_reference = bankRef;
                saleUpdate.bank_ref = bankRef;
                saleUpdate.koko_reference = kokoRef;
                saleUpdate.koko_ref = kokoRef;
            }

            await db.sales.update(saleId, saleUpdate);

            // 3. Update Customer balance if applicable
            if (sale.customer_id) {
                const customer = await db.customers.get(sale.customer_id);
                if (customer) {
                    const newBal = (customer.current_balance || 0) - amount;
                    await db.customers.update(sale.customer_id, { current_balance: newBal });
                }
            }

            // 4. Ledger Record
            if (typeof recordTransaction === 'function') {
                const descSuffix = method === 'cheque' && chequeDetails ? ` (Chq: ${chequeDetails.cheque_number})` : ` (${method})`;
                await recordTransaction(targetAccId, amount, 'debit', `Invoice Payment ${getInvoiceDisplayNumber(sale)}${descSuffix}`, 'Receipt', paymentId);
                await recordTransaction(receivableAccId, amount, 'credit', `Invoice Payment ${getInvoiceDisplayNumber(sale)}`, 'Receipt', paymentId);
            }

            // 5. Bank Balance Update & Detailed Transaction Breakdown
            if (selectedBankAccountId && (method === 'bank' || method === 'cheque')) {
                const methodLabel = method === 'bank' ? 'Bank Transfer' : 'Cheque Deposit';
                const ref = `Invoice #${saleId}`;
                const descSuffix = method === 'cheque' && chequeDetails ? ` (Cheque No: ${chequeDetails.cheque_number}, Bank: ${chequeDetails.bank_name})` : '';
                const desc = `${methodLabel} Payment (Collection) for outstanding ${ref}${descSuffix}`;

                await recordBankTransaction(
                    selectedBankAccountId,
                    'inward',
                    methodLabel,
                    amount,
                    ref,
                    desc,
                    new Date().toISOString().split('T')[0]
                );
            }

            if (typeof logActivity === 'function') {
                await logActivity(`Received Payment: Rs. ${amount} for Invoice #${saleId}`);
            }
        });

        showAlert('Payment Received', `Recorded payment of Rs. ${amount.toLocaleString()}. Invoice status updated.`);
        closePaymentModal();
        loadFinance(); // Refresh
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to record payment: ' + err.message, 'error');
    }
}

// ─── Batch Reconcile: Mark specific invoices as fully paid ─────────────────
async function batchReconcileInvoices() {
    const { value: invoiceInput, isConfirmed } = await Swal.fire({
        title: 'Batch Mark Invoices as Paid',
        html: `
            <div class="text-left space-y-3 text-sm">
                <p class="text-gray-500 text-xs">Enter invoice numbers separated by commas. These will be marked as <b>fully received/paid</b> and the customer balances will be adjusted.</p>
                <textarea id="swal-batch-invoices" class="swal2-textarea w-full" rows="5"
                    placeholder="e.g. INV-M0001, INV-M0002, INV-M0004, INV-M0005"></textarea>
                <p class="text-[10px] text-amber-600 font-bold">💡 You can also enter just the number portion (e.g. 1, 2, 4) or the full reference (INV-M0001)</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: '<i class="fa-solid fa-circle-check mr-2"></i> Mark All as Paid',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            const val = document.getElementById('swal-batch-invoices').value.trim();
            if (!val) {
                Swal.showValidationMessage('Please enter at least one invoice number.');
                return false;
            }
            return val;
        }
    });

    if (!isConfirmed || !invoiceInput) return;

    // Parse all entered invoice refs
    const rawEntries = invoiceInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);

    // Load all sales once
    const allSales = await db.sales.toArray();
    const allPayments = await db.payments.toArray();

    const results = { success: [], notFound: [], alreadyPaid: [] };

    for (const entry of rawEntries) {
        // Try to find matching sale by invoice_number, or by generated display number, or by numeric ID
        let sale = null;

        // Exact match on stored invoice_number
        sale = allSales.find(s => s.invoice_number && s.invoice_number.trim().toUpperCase() === entry.toUpperCase());

        // Match by generated display number (e.g. INV-M0001 -> id=1)
        if (!sale) {
            sale = allSales.find(s => getInvoiceDisplayNumber(s).toUpperCase() === entry.toUpperCase());
        }

        // Match by numeric ID
        if (!sale && /^\d+$/.test(entry)) {
            sale = allSales.find(s => s.id === parseInt(entry));
        }

        if (!sale) {
            results.notFound.push(entry);
            continue;
        }

        if (isCashTermsInvoice(sale)) {
            results.alreadyPaid.push(getInvoiceDisplayNumber(sale));
            continue;
        }

        // Check if already fully paid via payments table
        const salePayments = allPayments.filter(p => {
            if (p.target_type === 'invoice' && Number(p.target_id) === Number(sale.id)) return true;
            if (p.target_type === 'customer' && Number(p.invoice_id) === Number(sale.id)) return true;
            return false;
        });
        const totalPaid = salePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const total = parseFloat(sale.total) || 0;
        const remaining = total - totalPaid;

        if (remaining <= 0.01 && sale.status === 'paid') {
            results.alreadyPaid.push(getInvoiceDisplayNumber(sale));
            continue;
        }

        try {
            await db.transaction('rw', db.sales, db.customers, async () => {
                // Mark as fully paid
                await db.sales.update(sale.id, {
                    paid_amount: total,
                    status: 'paid'
                });

                // Adjust customer outstanding balance by the remaining amount
                if (sale.customer_id && remaining > 0) {
                    const customer = await db.customers.get(sale.customer_id);
                    if (customer) {
                        const newBalance = (parseFloat(customer.current_balance) || 0) - remaining;
                        await db.customers.update(sale.customer_id, {
                            current_balance: newBalance
                        });
                    }
                }
            });

            if (typeof logActivity === 'function') {
                await logActivity(`Batch Reconcile: ${getInvoiceDisplayNumber(sale)} marked as fully paid.`);
            }

            results.success.push(getInvoiceDisplayNumber(sale));
        } catch (err) {
            console.error(`Failed to mark ${entry} as paid:`, err);
            results.notFound.push(`${entry} (error: ${err.message})`);
        }
    }

    // Show summary
    let summaryHtml = `<div class="text-left space-y-3 text-sm">`;
    if (results.success.length > 0) {
        summaryHtml += `<div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
            <p class="font-black text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-widest mb-1">✅ Successfully Marked Paid (${results.success.length})</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">${results.success.join(', ')}</p>
        </div>`;
    }
    if (results.alreadyPaid.length > 0) {
        summaryHtml += `<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
            <p class="font-black text-blue-700 dark:text-blue-400 text-xs uppercase tracking-widest mb-1">ℹ️ Already Paid (${results.alreadyPaid.length})</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">${results.alreadyPaid.join(', ')}</p>
        </div>`;
    }
    if (results.notFound.length > 0) {
        summaryHtml += `<div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/30">
            <p class="font-black text-red-700 dark:text-red-400 text-xs uppercase tracking-widest mb-1">❌ Not Found (${results.notFound.length})</p>
            <p class="text-xs text-gray-600 dark:text-gray-300">${results.notFound.join(', ')}</p>
        </div>`;
    }
    summaryHtml += `</div>`;

    await Swal.fire({
        title: 'Batch Reconciliation Complete',
        html: summaryHtml,
        icon: results.success.length > 0 ? 'success' : 'info',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Close & Refresh'
    });

    loadFinance();
}

// ─── Sync Invoice Status from Payments Table ────────────────────────────────
// Scans all invoices and corrects paid_amount + status based on actual payment records.
// Fixes cases where payments were recorded but the sale record wasn't updated.
async function syncInvoiceStatusFromPayments() {
    const { isConfirmed } = await Swal.fire({
        title: 'Sync Invoice Status from Payments?',
        html: `<p class="text-sm text-gray-500">This will scan <b>all invoices</b> and recalculate their <code>paid_amount</code> and <code>status</code> fields based on the actual payment records in the database.<br><br>This is a safe, non-destructive operation.</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: '<i class="fa-solid fa-rotate mr-2"></i> Run Sync',
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed) return;

    let fixed = 0;
    let checked = 0;

    try {
        const allSales = await db.sales.filter(s => s.document_type === 'invoice' || s.document_type === 'pos_invoice').toArray();
        const allPayments = await db.payments.toArray();

        for (const sale of allSales) {
            checked++;
            const total = parseFloat(sale.total) || 0;

            // Cash terms invoices must NEVER be marked as unpaid
            if (isCashTermsInvoice(sale)) {
                if (sale.status !== 'paid' || (parseFloat(sale.paid_amount) || 0) < total - 0.01) {
                    await db.sales.update(sale.id, {
                        paid_amount: total,
                        status: 'paid'
                    });
                    fixed++;
                }
                continue;
            }

            const payType = String(sale.payment_type || sale.payment_terms || '').toLowerCase().trim();
            if (!['credit', 'cod'].includes(payType)) {
                if (sale.status === 'paid' || sale.status === 'completed') {
                    continue;
                }
            }

            // Gather all payment entries for this invoice
            const salePayments = allPayments.filter(p => {
                if (p.target_type === 'invoice' && Number(p.target_id) === Number(sale.id)) return true;
                if (p.target_type === 'customer' && Number(p.invoice_id) === Number(sale.id)) return true;
                return false;
            });
            const computedPaid = salePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // Determine correct status
            let correctStatus = 'unpaid';
            if (computedPaid >= total - 0.01) correctStatus = 'paid';
            else if (computedPaid > 0) correctStatus = 'partial';

            // Only update if there's a discrepancy
            const storedPaid = parseFloat(sale.paid_amount) || 0;
            const paidDiff = Math.abs(computedPaid - storedPaid);

            if (paidDiff > 0.01 || sale.status !== correctStatus) {
                await db.sales.update(sale.id, {
                    paid_amount: computedPaid,
                    status: correctStatus
                });
                fixed++;
                console.log(`[Sync] ${getInvoiceDisplayNumber(sale)}: paid ${storedPaid} → ${computedPaid}, status ${sale.status} → ${correctStatus}`);
            }
        }

        showAlert('Sync Complete', `Checked ${checked} invoices. Fixed ${fixed} discrepancies.`, fixed > 0 ? 'success' : 'info');
        if (fixed > 0) loadFinance();

    } catch (err) {
        console.error('Sync error:', err);
        showAlert('Error', 'Sync failed: ' + err.message, 'error');
    }
}
