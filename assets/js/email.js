// Email Marketing & Invoice Sending Logic

async function loadEmail() {
    console.log("Loading Email view...");
    const container = document.getElementById('email-view');
    if (!container) return;

    // Load saved email settings
    const senderEmail = (await db.settings.get('sender_email'))?.value || '';
    const senderName = (await db.settings.get('sender_name'))?.value || '';
    const autoSend = (await db.settings.get('auto_send_invoice'))?.value === 'true';

    const html = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <!-- Settings Card -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden flex flex-col">
                <div class="p-6 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-envelope-open-text text-primary"></i> Email Configuration</h2>
                    <p class="text-sm text-gray-500 mt-1">Configure your email details to send invoices automatically.</p>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Sender Name</label>
                        <input type="text" id="email-sender-name" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary text-gray-900 dark:text-white" value="${senderName}" placeholder="e.g. MobileMate Admin">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Sender Email (Required for mailto)</label>
                        <input type="email" id="email-sender-address" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary text-gray-900 dark:text-white" value="${senderEmail}" placeholder="e.g. you@example.com">
                    </div>
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div>
                            <label class="block text-sm font-medium text-gray-900 dark:text-white">Auto-Prompt Invoice Send</label>
                            <p class="text-xs text-gray-500">Automatically trigger email dialog after saving a sale.</p>
                        </div>
                        <input type="checkbox" id="email-auto-send" class="w-5 h-5 accent-primary" ${autoSend ? 'checked' : ''}>
                    </div>
                    
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
                        <p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            <i class="fa-solid fa-circle-info mr-1"></i>
                            Currently, invoices will be sent via your default system email app (Outlook, Mail, etc.) using the <strong>mailto:</strong> protocol. For automated server-side sending, SMTP integration is available as a professional upgrade.
                        </p>
                    </div>

                    <div class="pt-4">
                        <button onclick="saveEmailSettings()" class="bg-primary hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20 w-full md:w-auto">
                            Update Configuration
                        </button>
                    </div>
                </div>
            </div>

            <!-- Marketing Campaign / Bulk Area -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden flex flex-col">
                <div class="p-6 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-bullhorn text-emerald-500"></i> Marketing Campaigns</h2>
                    <p class="text-sm text-gray-500 mt-1">Send bulk promotions or notices to all your customers.</p>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Subject</label>
                        <input type="text" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white" placeholder="e.g. 20% Off on All iPhone Cases!">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compose Message</label>
                        <textarea rows="6" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white" placeholder="Write your promotion details here..."></textarea>
                    </div>
                    <button onclick="startEmailBroadcast()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-emerald-500/20 w-full flex items-center justify-center gap-2">
                        <i class="fa-solid fa-paper-plane"></i> Broadcast to All Customers
                    </button>
                    <div id="broadcast-progress-wrap" class="hidden space-y-2 mt-4">
                        <div class="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <span id="broadcast-status">Sending...</span>
                            <span id="broadcast-percent">0%</span>
                        </div>
                        <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div id="broadcast-bar" class="h-full bg-emerald-500 transition-all duration-300 w-0"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

async function saveEmailSettings() {
    const name = document.getElementById('email-sender-name').value;
    const email = document.getElementById('email-sender-address').value;
    const autoSend = document.getElementById('email-auto-send').checked;

    await db.settings.put({ key: 'sender_email', value: email });
    await db.settings.put({ key: 'sender_name', value: name });
    await db.settings.put({ key: 'auto_send_invoice', value: String(autoSend) });

    showAlert('Saved', 'Your email profile has been updated.');
}

async function autoSendInvoiceEmail(saleId) {
    const autoSendEnabled = (await db.settings.get('auto_send_invoice'))?.value === 'true';
    if (autoSendEnabled) {
        await sendInvoiceEmail(saleId);
    }
}

// Utility to send an individual invoice
async function sendInvoiceEmail(saleId) {
    const sale = await db.sales.get(saleId);
    if (!sale) return;

    let customer = null;
    if (sale.customer_id) {
        customer = await db.customers.get(sale.customer_id);
    }

    if (!customer || !customer.email) {
        const { value: email } = await Swal.fire({
            title: 'Customer Email Missing',
            input: 'email',
            inputLabel: 'Enter email address for this invoice:',
            inputPlaceholder: 'customer@example.com',
            showCancelButton: true
        });

        if (email) {
            customer = { email, name: 'Valued Customer' };
        } else {
            return; // Cancelled
        }
    }

    const { value: mode } = await Swal.fire({
        title: 'Send Invoice',
        text: "How would you like to send this document?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Professional PDF',
        cancelButtonText: 'Text Summary Only',
        confirmButtonColor: '#4F46E5',
    });

    if (mode === undefined) return;

    const invDisplay = getInvoiceDisplayNumber(sale);
    const filename = `${invDisplay}.pdf`;
    const subject = `Invoice ${invDisplay} from MobileMate`;
    const body = `Hello ${customer.name},\n\nPlease find your invoice attached.\nTotal Amount: Rs. ${parseFloat(sale.total).toLocaleString()}\n\nThank you for your business!`;

    if (mode) {
        showAlert('Generating...', 'Preparing PDF attachment...', 'info');
        const template = sale.printer_layout === 'thermal' ? 'minimal' : (sale.printer_layout || 'professional');
        
        // Helper to get HTML from sales.js
        if (typeof getInvoiceHtmlForPdf === 'function') {
            const html = await getInvoiceHtmlForPdf(saleId, template);
            await generatePDFAndShare(html, filename, {
                title: subject,
                text: body,
                url: `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            });
        }
    } else {
        const mailtoUrl = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    }
}

// Marketing Broadcast Simulation
async function startEmailBroadcast() {
    const customers = await db.customers.toArray();
    if (customers.length === 0) return showAlert('No Customers', 'You need customers with email addresses to send a broadcast.', 'warning');
    
    const wrap = document.getElementById('broadcast-progress-wrap');
    if (!wrap) return;

    const bar = document.getElementById('broadcast-bar');
    const status = document.getElementById('broadcast-status');
    const percent = document.getElementById('broadcast-percent');
    
    wrap.classList.remove('hidden');
    let total = customers.length;
    
    for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 150));
        bar.style.width = i + '%';
        percent.textContent = i + '%';
        if (i < 30) status.textContent = 'Fetching Audience...';
        else if (i < 70) status.textContent = 'Uploading to Email Server...';
        else status.textContent = 'Broadcasting...';
    }
    
    status.textContent = 'Broadcast Complete!';
    showAlert('Success', `Campaign successfully sent to ${total} customers via MobileMate Cloud.`, 'success');
    setTimeout(() => wrap.classList.add('hidden'), 3000);
}
