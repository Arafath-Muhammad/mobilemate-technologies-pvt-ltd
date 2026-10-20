// Settings logic

async function loadSettings() {
    console.log("Loading Settings view...");
    const container = document.getElementById('settings-view');
    if (!container) return;

    // Permissions check
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isManager = currentUser && currentUser.role === 'manager';
    // isLocked applies to general store settings but NOT necessarily to backups (those are handled below)
    const isLocked = isManager || !isAdmin;
    const isSettingsRestricted = isManager; // Flag for manager-specific restriction

    // Load actual settings
    const settings = await db.settings.toArray();
    let opts = {};
    settings.forEach(s => opts[s.key] = s.value);

    const storeName = opts['store_name'] || 'MobileMate Demo Shop';
    const storeAddress = opts['store_address'] || '';
    const storePhone = opts['store_phone'] || '';
    const storeSubheading = opts['store_subheading'] || 'YOUR TRUSTED TECH GADGETS PROVIDER';
    const storeLogo = opts['store_logo'] || '';
    const googleClientId = opts['google_client_id'] || '';
    const invoiceTemplate = opts['invoice_template'] || 'professional';
    const invoiceColor = opts['invoice_color'] || '#05a8a8';
    const invoiceFooter = opts['invoice_footer'] || 'Thank you for your business!';
    const receiptFooterInfo = opts['receipt_footer_info'] || '';
    const bankDetails = opts['bank_details'] || '';
    const storeEmail = opts['store_email'] || '';
    const storeWebsite = opts['store_website'] || '';
    const storeBR = opts['store_br'] || '';
    const enabledBankDetails = opts['enabled_bank_details'] !== undefined ? opts['enabled_bank_details'] : true;
    const enabledCommission = opts['enabled_commission_management'] !== undefined ? opts['enabled_commission_management'] : true;
    const chequeName = opts['cheque_name'] || '';
    const enabledChequeName = opts['enabled_cheque_name'] !== undefined ? opts['enabled_cheque_name'] : false;
    const thankYouImage = opts['thank_you_image'] || '';
    const storeFavicon = opts['store_favicon'] || '';
    const qrCode = opts['payment_qr'] || '';
    const enabledPaymentQR = opts['enabled_payment_qr'] !== undefined ? opts['enabled_payment_qr'] : true;
    const moduleVisibility = opts['module_visibility'] || {};

    const enabledStoreName = opts['enabled_store_name'] !== false;
    const enabledStorePhone = opts['enabled_store_phone'] !== false;
    const enabledStoreEmail = opts['enabled_store_email'] !== false;
    const enabledStoreWebsite = opts['enabled_store_website'] !== false;
    const enabledStoreBR = opts['enabled_store_br'] !== false;
    const enabledStoreSubheading = opts['enabled_store_subheading'] !== false;
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const enabledInvoiceFooter = opts['enabled_invoice_footer'] !== false;
    const enabledReceiptFooterInfo = opts['enabled_receipt_footer_info'] !== false;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder h-full flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">General Settings</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your POS receipt details, taxes, and backups.</p>
                ${isLocked ? '<span class="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tighter"><i class="fa-solid fa-lock mr-1"></i> Read-Only Mode (Limited Access)</span>' : ''}
            </div>
            
            <!-- Body -->
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                
                <!-- Receipt Info -->
                <section class="${isLocked ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                        <i class="fa-solid fa-receipt text-primary mr-2"></i> Receipt Identity
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                            <input type="text" id="set-store-name" value="${storeName}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-name" ${enabledStoreName ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-name" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                            <input type="text" id="set-store-phone" value="${storePhone}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-phone" ${enabledStorePhone ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-phone" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Email</label>
                            <input type="email" id="set-store-email" value="${storeEmail}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="e.g. info@shop.com">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-email" ${enabledStoreEmail ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-email" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                            <input type="text" id="set-store-website" value="${storeWebsite}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="e.g. www.shop.com">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-website" ${enabledStoreWebsite ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-website" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BR Number / Reg No</label>
                            <input type="text" id="set-store-br" value="${storeBR}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="Business Registration No">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-br" ${enabledStoreBR ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-br" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TIN Number (Tax Identity)</label>
                            <input type="text" id="set-store-tin" value="${opts['tax_tin'] || ''}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="e.g. TIN-123456789">
                            <p class="mt-1 text-[10px] text-gray-400">Syncs with Corporate Identity Verification bar.</p>
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Subheading</label>
                            <input type="text" id="set-store-subheading" value="${storeSubheading}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="e.g. YOUR TRUSTED TECH GADGETS PROVIDER">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-subheading" ${enabledStoreSubheading ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-subheading" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Template</label>
                            <select id="set-invoice-template" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50">
                                <option value="thermal" ${invoiceTemplate === 'thermal' ? 'selected' : ''}>Thermal Printer Style</option>
                                <option value="professional" ${invoiceTemplate === 'professional' ? 'selected' : ''}>Professional</option>
                                <option value="minimal" ${invoiceTemplate === 'minimal' ? 'selected' : ''}>Minimal</option>
                                <option value="letterhead" ${invoiceTemplate === 'letterhead' ? 'selected' : ''}>Letterhead Format</option>
                            </select>
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-primary uppercase tracking-widest text-xs font-bold">Company Logo</label>
                            <div class="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <div id="logo-preview-container" class="w-24 h-24 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                                    ${storeLogo ? `<img src="${storeLogo}" class="w-full h-full object-contain">` : `<i class="fa-solid fa-image text-3xl text-gray-300"></i>`}
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-3">Upload your business logo. Recommended size: 200x200px (JPG, PNG, WebP).</p>
                                    <button onclick="document.getElementById('logo-upload-input').click()" ${isLocked ? 'disabled' : ''} class="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Select Logo
                                    </button>
                                    <input type="file" id="logo-upload-input" class="hidden" accept="image/*" onchange="previewAndSaveLogo(event)">
                                    ${storeLogo && !isLocked ? `<button onclick="removeLogo()" class="text-xs text-red-500 hover:underline mt-2 block">Remove Logo</button>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-primary uppercase tracking-widest text-xs font-bold">Site Icon (Favicon)</label>
                            <div class="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <div id="favicon-preview-container" class="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                                    ${storeFavicon ? `<img src="${storeFavicon}" class="w-8 h-8 object-contain">` : `<i class="fa-solid fa-icons text-2xl text-gray-300"></i>`}
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-3">Upload your tab icon. Recommended: 32x32px or 64x64px (PNG, ICO, SVG).</p>
                                    <button onclick="document.getElementById('favicon-upload-input').click()" ${isLocked ? 'disabled' : ''} class="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Select Favicon
                                    </button>
                                    <input type="file" id="favicon-upload-input" class="hidden" accept="image/*" onchange="previewAndSaveFavicon(event)">
                                    ${storeFavicon && !isLocked ? `<button onclick="removeFavicon()" class="text-xs text-red-500 hover:underline mt-2 block">Remove Favicon</button>` : ''}
                                </div>
                            </div>
                        </div>

                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-primary uppercase tracking-widest text-xs font-bold">Delivery Note "Thank You" Image</label>
                            <div class="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <div id="thank-you-preview-container" class="w-24 h-24 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                                    ${thankYouImage ? `<img src="${thankYouImage}" class="w-full h-full object-contain">` : `<i class="fa-solid fa-heart text-3xl text-gray-300"></i>`}
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-3">Upload an image to show next to "THANK YOU" in Delivery Notes.</p>
                                    <button onclick="document.getElementById('thank-you-upload-input').click()" ${isLocked ? 'disabled' : ''} class="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Select Image
                                    </button>
                                    <input type="file" id="thank-you-upload-input" class="hidden" accept="image/*" onchange="previewAndSaveThankYouImage(event)">
                                    ${thankYouImage && !isLocked ? `<button onclick="removeThankYouImage()" class="text-xs text-red-500 hover:underline mt-2 block">Remove Image</button>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-primary uppercase tracking-widest text-xs font-bold">Payment QR Code</label>
                            <div class="flex items-center gap-6 p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                <div id="qr-preview-container" class="w-24 h-24 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                                    ${qrCode ? `<img src="${qrCode}" class="w-full h-full object-contain">` : `<i class="fa-solid fa-qrcode text-3xl text-gray-300"></i>`}
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-500 mb-3">Upload your payment QR Code (UPI, Bank, etc.). This will show near Payment Details on documents.</p>
                                    <button onclick="document.getElementById('qr-upload-input').click()" ${isLocked ? 'disabled' : ''} class="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Select QR Code
                                    </button>
                                    <input type="file" id="qr-upload-input" class="hidden" accept="image/*" onchange="previewAndSaveQRCode(event)">
                                    ${qrCode && !isLocked ? `<button onclick="removeQRCode()" class="text-xs text-red-500 hover:underline mt-2 block">Remove QR Code</button>` : ''}
                                    <div class="mt-3 flex items-center">
                                        <input type="checkbox" id="set-enabled-qr" ${enabledPaymentQR ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                        <label for="set-enabled-qr" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable QR Code on Invoices</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-full">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Address</label>
                            <textarea id="set-store-address" rows="2" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50">${storeAddress}</textarea>
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-store-address" ${enabledStoreAddress ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-store-address" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Note</label>
                            <input type="text" id="setting-invoice-footer" value="${invoiceFooter}" ${isLocked ? 'disabled' : ''} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white" placeholder="Thank you for your business!">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-invoice-footer" ${enabledInvoiceFooter ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-invoice-footer" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Info (Warranty/Terms)</label>
                            <textarea id="setting-receipt-footer-info" rows="3" ${isLocked ? 'disabled' : ''} class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white text-xs" placeholder="WARRANTY PERIODS: ...">${receiptFooterInfo}</textarea>
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-receipt-footer-info" ${enabledReceiptFooterInfo ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-receipt-footer-info" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Field</label>
                            </div>
                        </div>
                        <div class="col-span-full md:col-span-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Details (Shows on Invoices/Quotes)</label>
                            <textarea id="set-bank-details" rows="2" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50">${bankDetails}</textarea>
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-bank" ${enabledBankDetails ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-bank" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Bank Details on Invoices</label>
                            </div>
                        </div>
                        <div class="col-span-full md:col-span-1">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cheque Name</label>
                            <input type="text" id="set-cheque-name" value="${chequeName}" ${isLocked ? 'disabled' : ''} class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="Cheque Payable to...">
                            <div class="mt-2 flex items-center">
                                <input type="checkbox" id="set-enabled-cheque" ${enabledChequeName ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary">
                                <label for="set-enabled-cheque" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Cheque Details on Invoices</label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Color (Professional Template)</label>
                            <input type="color" id="set-invoice-color" value="${invoiceColor}" ${isLocked ? 'disabled' : ''} class="w-full h-10 px-1 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer disabled:opacity-50">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax / VAT Rate (%)</label>
                            <input type="number" id="set-tax-rate" value="${opts['tax_rate'] || 0}" ${isLocked ? 'disabled' : ''} step="0.01" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50" placeholder="e.g. 15.00">
                        </div>
                    </div>
                    <div class="mt-4 ${isLocked ? 'hidden' : ''}">
                        <button onclick="saveStoreSettings()" class="bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">Save Receipt Info</button>
                    </div>
                </section>



                <!-- Database Tools -->
                <section>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                        <i class="fa-solid fa-database text-blue-500 mr-2"></i> Database & Backups
                    </h3>
                    
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-2xl">Frequent exports avoid data loss from browser cache clears.</p>
                    
                    <div class="flex flex-wrap gap-4">
                        <button onclick="migrateDexieToSupabase()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/30 flex items-center transform hover:scale-105 active:scale-95">
                            <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Migrate Local Data to Supabase
                        </button>
                        <button onclick="exportData()" class="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-300 dark:hover:bg-blue-900/50 px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center transform hover:scale-105 active:scale-95">
                            <i class="fa-solid fa-download mr-2"></i> Export Data (JSON)
                        </button>
                        <button onclick="document.getElementById('import-file').click()" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center transform hover:scale-105 active:scale-95">
                            <i class="fa-solid fa-upload mr-2"></i> Import Backup
                        </button>
                        <button onclick="handleGoogleDriveBackup()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/30 flex items-center transform hover:scale-105 active:scale-95">
                            <i class="fa-brands fa-google-drive mr-2"></i> Cloud Sync (Google Drive)
                        </button>
                        <button onclick="cleanDuplicateSales()" class="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center transform hover:scale-105 active:scale-95">
                            <i class="fa-solid fa-broom mr-2"></i> Clean Duplicate Sales
                        </button>
                        <input type="file" id="import-file" class="hidden" accept=".json" onchange="importBackup(event)">
                    </div>

                    ${localStorage.getItem('last_google_sync') ? `
                        <p class="text-[10px] text-indigo-500 font-bold mt-3 uppercase tracking-widest flex items-center gap-1.5">
                            <i class="fa-solid fa-cloud-check"></i> Last Cloud Sync: ${localStorage.getItem('last_google_sync')}
                        </p>
                    ` : ''}
                    
                    <div class="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl max-w-xl ${!isAdmin ? 'opacity-30 pointer-events-none' : ''}">
                        <h4 class="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Danger Zone</h4>
                        <p class="text-sm text-red-600/80 dark:text-red-400/80 mb-3">Clear all products, sales, and settings. This cannot be undone.</p>
                        <button onclick="factoryReset()" ${!isAdmin ? 'disabled' : ''} class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50">Factory Reset DB</button>
                    </div>
                </section>
                
                <!-- Module Visibility Section -->
                <section>
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
                        <i class="fa-solid fa-puzzle-piece text-primary mr-2"></i> Modules
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                            <input type="checkbox" id="set-enabled-commission" ${enabledCommission ? 'checked' : ''} ${isLocked ? 'disabled' : ''} class="w-4 h-4 text-primary bg-gray-100 rounded border-gray-300 focus:ring-primary"/>
                            <label for="set-enabled-commission" class="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400">Enable Commission Management</label>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

async function saveStoreSettings() {
    const name = document.getElementById('set-store-name').value;
    const phone = document.getElementById('set-store-phone').value;
    const subheading = document.getElementById('set-store-subheading').value;
    const address = document.getElementById('set-store-address').value;
    const invoiceTemplate = document.getElementById('set-invoice-template').value;
    const invoiceColor = document.getElementById('set-invoice-color').value;
    const invoice_footer = document.getElementById('setting-invoice-footer').value;
    const receipt_footer_info = document.getElementById('setting-receipt-footer-info').value;
    const bankDetails = document.getElementById('set-bank-details').value;
    const enabledBankDetails = document.getElementById('set-enabled-bank').checked;
    const chequeName = document.getElementById('set-cheque-name').value;
    const enabledChequeName = document.getElementById('set-enabled-cheque').checked;
    const email = document.getElementById('set-store-email').value;
    const website = document.getElementById('set-store-website').value;
    const br = document.getElementById('set-store-br').value;
    const tin = document.getElementById('set-store-tin').value;
    const taxRate = document.getElementById('set-tax-rate').value;
    const enabledQR = document.getElementById('set-enabled-qr').checked;
    
    // Toggles
    const enabledStoreName = document.getElementById('set-enabled-store-name').checked;
    const enabledStorePhone = document.getElementById('set-enabled-store-phone').checked;
    const enabledStoreEmail = document.getElementById('set-enabled-store-email').checked;
    const enabledStoreWebsite = document.getElementById('set-enabled-store-website').checked;
    const enabledStoreBR = document.getElementById('set-enabled-store-br').checked;
    const enabledStoreSubheading = document.getElementById('set-enabled-store-subheading').checked;
    const enabledStoreAddress = document.getElementById('set-enabled-store-address').checked;
    const enabledInvoiceFooter = document.getElementById('set-enabled-invoice-footer').checked;
    const enabledReceiptFooterInfo = document.getElementById('set-enabled-receipt-footer-info').checked;
    const enabledCommission = document.getElementById('set-enabled-commission').checked;

    try {
        await db.settings.put({ key: 'store_name', value: name });
        await db.settings.put({ key: 'store_phone', value: phone });
        await db.settings.put({ key: 'store_subheading', value: subheading });
        await db.settings.put({ key: 'store_address', value: address });
        await db.settings.put({ key: 'invoice_template', value: invoiceTemplate });
        await db.settings.put({ key: 'invoice_color', value: invoiceColor });
        await db.settings.put({ key: 'invoice_footer', value: invoice_footer });
        await db.settings.put({ key: 'receipt_footer_info', value: receipt_footer_info });
        await db.settings.put({ key: 'bank_details', value: bankDetails });
        await db.settings.put({ key: 'enabled_bank_details', value: enabledBankDetails });
        await db.settings.put({ key: 'cheque_name', value: chequeName });
        await db.settings.put({ key: 'enabled_cheque_name', value: enabledChequeName });
        await db.settings.put({ key: 'enabled_commission_management', value: enabledCommission });
        await db.settings.put({ key: 'store_email', value: email });
        await db.settings.put({ key: 'store_website', value: website });
        await db.settings.put({ key: 'store_br', value: br });
        await db.settings.put({ key: 'tax_tin', value: tin });
        await db.settings.put({ key: 'tax_rate', value: taxRate });
        await db.settings.put({ key: 'enabled_payment_qr', value: enabledQR });
        await db.settings.put({ key: 'enabled_store_name', value: enabledStoreName });
        await db.settings.put({ key: 'enabled_store_phone', value: enabledStorePhone });
        await db.settings.put({ key: 'enabled_store_email', value: enabledStoreEmail });
        await db.settings.put({ key: 'enabled_store_website', value: enabledStoreWebsite });
        await db.settings.put({ key: 'enabled_store_br', value: enabledStoreBR });
        await db.settings.put({ key: 'enabled_store_subheading', value: enabledStoreSubheading });
        await db.settings.put({ key: 'enabled_store_address', value: enabledStoreAddress });
        await db.settings.put({ key: 'enabled_invoice_footer', value: enabledInvoiceFooter });
        await db.settings.put({ key: 'enabled_receipt_footer_info', value: enabledReceiptFooterInfo });

        if (typeof updateBranding === 'function') updateBranding();
        
        // Sync TIN to Tax Identity Bar if applicable
        if (typeof renderTaxIdentity === 'function') renderTaxIdentity();
        
        showAlert('Saved', 'Store settings updated.', 'success');
    } catch (err) {
        showAlert('Error', 'Failed to save settings: ' + err.message, 'error');
    }
}

async function previewAndSaveLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        return showAlert('File too large', 'Please select an image smaller than 2MB', 'warning');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
            await db.settings.put({ key: 'store_logo', value: base64 });
            loadSettings(); // Refresh UI
            if (typeof updateAppLogo === 'function') updateAppLogo(); // Update sidebar logo
            showAlert('Success', 'Logo updated successfully', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to save logo', 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function removeLogo() {
    if (confirm("Remove company logo?")) {
        await db.settings.delete('store_logo');
        loadSettings();
        if (typeof updateAppLogo === 'function') updateAppLogo();
    }
}

async function previewAndSaveFavicon(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
        return showAlert('File too large', 'Favicons should be small (max 512KB)', 'warning');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
            await db.settings.put({ key: 'store_favicon', value: base64 });
            loadSettings(); // Refresh UI
            if (typeof updateAppFavicon === 'function') updateAppFavicon(); 
            showAlert('Success', 'Favicon updated successfully', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to save favicon', 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function removeFavicon() {
    if (confirm("Remove site favicon?")) {
        await db.settings.delete('store_favicon');
        loadSettings();
        if (typeof updateAppFavicon === 'function') updateAppFavicon();
    }
}

async function previewAndSaveThankYouImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        return showAlert('File too large', 'Please select an image smaller than 2MB', 'warning');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
            await db.settings.put({ key: 'thank_you_image', value: base64 });
            loadSettings(); // Refresh UI
            showAlert('Success', 'Thank You image updated successfully', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to save image', 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function removeThankYouImage() {
    if (confirm("Remove 'Thank You' image?")) {
        await db.settings.delete('thank_you_image');
        loadSettings();
    }
}

async function previewAndSaveQRCode(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        return showAlert('File too large', 'Please select an image smaller than 2MB', 'warning');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        try {
            await db.settings.put({ key: 'payment_qr', value: base64 });
            loadSettings(); // Refresh UI
            showAlert('Success', 'QR Code updated successfully', 'success');
        } catch (err) {
            showAlert('Error', 'Failed to save QR Code', 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function removeQRCode() {
    if (confirm("Remove payment QR Code?")) {
        await db.settings.delete('payment_qr');
        loadSettings();
    }
}

async function exportData() {
    try {
        const data = {};
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MobileMate_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        localStorage.setItem('last_export_date', new Date().toISOString().split('T')[0]);
        showAlert('Success', 'Backup created and downloaded.', 'success');
    } catch (err) {
        showAlert('Error', 'Export failed: ' + err.message, 'error');
    }
}

async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);

            if (confirm("This will overwrite your current data. Continue?")) {
                await db.transaction('rw', db.tables, async () => {
                    for (const tableName in data) {
                        if (db[tableName]) {
                            await db[tableName].clear();
                            await db[tableName].bulkAdd(data[tableName]);
                        }
                    }
                });
                localStorage.setItem('last_import_date', new Date().toISOString().split('T')[0]);
                showAlert('Success', 'Backup imported successfully. Reloading...', 'success');
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err) {
            showAlert('Error', 'Invalid backup file: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function factoryReset() {
    if (prompt("Type 'RESET' to confirm deleting all data") === 'RESET') {
        try {
            await db.delete();
            alert("Database resetting. The page will now reload.");
            window.location.reload();
    } catch (err) {
            showAlert('Error', 'Failed to delete db', 'error');
        }
    }
}

// ─── DUPLICATE SALES CLEANER & ACCOUNTS RECONCILIATION ───────────────────────

async function cleanDuplicateSales() {
    try {
        Swal.fire({
            title: 'Scanning Database...',
            html: '<div class="text-sm text-gray-500">Analyzing sales, payments, and ledger entries for duplicates...</div>',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // ── 1. SCAN FOR DUPLICATE INVOICE NUMBERS ──
        const allSales = await db.sales.toArray();
        const invoiceMap = {};
        allSales.forEach(sale => {
            const inv = sale.invoice_number || '';
            if (!inv) return;
            if (!invoiceMap[inv]) invoiceMap[inv] = [];
            invoiceMap[inv].push(sale);
        });

        const duplicateGroups = Object.entries(invoiceMap)
            .filter(([inv, sales]) => sales.length > 1)
            .map(([inv, sales]) => {
                // Sort by id ascending — keep the first (original), mark rest as duplicates
                sales.sort((a, b) => a.id - b.id);
                return {
                    invoice_number: inv,
                    keep: sales[0],
                    duplicates: sales.slice(1)
                };
            });

        const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0);

        // ── 2. SCAN FOR DUPLICATE PAYMENTS (same target_id + target_type + amount + date) ──
        const allPayments = await db.payments.toArray();
        const paymentKeyMap = {};
        allPayments.forEach(p => {
            const key = `${p.target_id}_${p.target_type}_${p.amount}_${(p.date || '').substring(0, 10)}`;
            if (!paymentKeyMap[key]) paymentKeyMap[key] = [];
            paymentKeyMap[key].push(p);
        });
        const duplicatePaymentGroups = Object.entries(paymentKeyMap)
            .filter(([k, payments]) => payments.length > 1)
            .map(([k, payments]) => {
                payments.sort((a, b) => a.id - b.id);
                return { key: k, keep: payments[0], duplicates: payments.slice(1) };
            });
        const totalDuplicatePayments = duplicatePaymentGroups.reduce((sum, g) => sum + g.duplicates.length, 0);

        // ── 3. SCAN FOR DUPLICATE LEDGER ENTRIES (same reference_id + reference_type + account_id + amount + type) ──
        const allLedger = await db.ledger.toArray();
        const ledgerKeyMap = {};
        allLedger.forEach(l => {
            const key = `${l.reference_id}_${l.reference_type}_${l.account_id}_${l.amount}_${l.type}`;
            if (!ledgerKeyMap[key]) ledgerKeyMap[key] = [];
            ledgerKeyMap[key].push(l);
        });
        const duplicateLedgerGroups = Object.entries(ledgerKeyMap)
            .filter(([k, entries]) => entries.length > 1)
            .map(([k, entries]) => {
                entries.sort((a, b) => a.id - b.id);
                return { key: k, keep: entries[0], duplicates: entries.slice(1) };
            });
        const totalDuplicateLedger = duplicateLedgerGroups.reduce((sum, g) => sum + g.duplicates.length, 0);

        Swal.close();

        // ── 4. BUILD REPORT ──
        const hasDuplicates = totalDuplicates > 0 || totalDuplicatePayments > 0 || totalDuplicateLedger > 0;

        // Build duplicate sales detail rows
        const salesRows = duplicateGroups.map(g => `
            <tr class="border-b border-gray-100 dark:border-gray-800">
                <td class="px-4 py-3 text-xs font-black text-primary">${g.invoice_number}</td>
                <td class="px-4 py-3 text-xs text-gray-600">${g.duplicates.length + 1} copies</td>
                <td class="px-4 py-3 text-xs font-bold text-red-500">${g.duplicates.length} to remove</td>
                <td class="px-4 py-3 text-xs text-gray-400">Keep ID #${g.keep.id}</td>
            </tr>
        `).join('');

        const reportHtml = `
            <div class="text-left space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                <!-- Summary Cards -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-center">
                        <div class="text-2xl font-black text-amber-600">${totalDuplicates}</div>
                        <div class="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Duplicate Sales</div>
                    </div>
                    <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-4 text-center">
                        <div class="text-2xl font-black text-orange-600">${totalDuplicatePayments}</div>
                        <div class="text-[9px] font-black text-orange-500 uppercase tracking-widest mt-1">Duplicate Payments</div>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-4 text-center">
                        <div class="text-2xl font-black text-red-600">${totalDuplicateLedger}</div>
                        <div class="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">Duplicate Ledger</div>
                    </div>
                </div>

                ${totalDuplicates > 0 ? `
                    <!-- Duplicate Sales Detail -->
                    <div class="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-gray-500"><i class="fa-solid fa-copy mr-1.5 text-amber-500"></i>Duplicate Sales by Invoice Number</h4>
                        </div>
                        <table class="w-full">
                            <thead class="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 dark:bg-gray-900/30">
                                <tr>
                                    <th class="px-4 py-2 text-left">Invoice #</th>
                                    <th class="px-4 py-2 text-left">Total Copies</th>
                                    <th class="px-4 py-2 text-left">To Remove</th>
                                    <th class="px-4 py-2 text-left">Keeping</th>
                                </tr>
                            </thead>
                            <tbody>${salesRows}</tbody>
                        </table>
                    </div>
                ` : ''}

                ${!hasDuplicates ? `
                    <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-8 text-center">
                        <i class="fa-solid fa-circle-check text-4xl text-emerald-500 mb-3"></i>
                        <h4 class="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-sm">No Duplicates Found</h4>
                        <p class="text-xs text-emerald-600/70 mt-2">Your database is clean! All records are unique.</p>
                    </div>
                ` : `
                    <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
                        <p class="text-xs text-amber-700 dark:text-amber-400 font-bold">
                            <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
                            Clicking "Clean All Duplicates" will permanently remove ${totalDuplicates + totalDuplicatePayments + totalDuplicateLedger} duplicate record(s). The earliest (original) entry for each group is always kept.
                        </p>
                    </div>
                `}
            </div>
        `;

        const result = await Swal.fire({
            title: '<i class="fa-solid fa-broom mr-2 text-amber-500"></i> Duplicate Scan Report',
            html: reportHtml,
            width: '720px',
            showCancelButton: true,
            showConfirmButton: hasDuplicates,
            confirmButtonText: '<i class="fa-solid fa-trash-can mr-2"></i> Clean All Duplicates',
            confirmButtonColor: '#f59e0b',
            cancelButtonText: hasDuplicates ? 'Cancel' : 'Close',
            customClass: { popup: 'rounded-3xl' }
        });

        if (result.isConfirmed && hasDuplicates) {
            await executeDuplicateCleanup(duplicateGroups, duplicatePaymentGroups, duplicateLedgerGroups);
        }

    } catch (err) {
        console.error('Duplicate scan failed:', err);
        Swal.close();
        showAlert('Error', 'Failed to scan for duplicates: ' + err.message, 'error');
    }
}

async function executeDuplicateCleanup(salesGroups, paymentGroups, ledgerGroups) {
    try {
        Swal.fire({
            title: 'Cleaning Duplicates...',
            html: '<div class="text-sm text-gray-500">Removing duplicate records and resyncing balances...</div>',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        let removedSales = 0;
        let removedPayments = 0;
        let removedLedger = 0;

        await db.transaction('rw', [db.sales, db.payments, db.ledger, db.customers, db.vendors, db.bank_accounts, db.bank_transactions], async () => {
            // ── Remove duplicate sales ──
            for (const group of salesGroups) {
                for (const dup of group.duplicates) {
                    // Also remove any payments and ledger entries specifically linked to this duplicate sale
                    const linkedPayments = await db.payments.where({ target_id: dup.id, target_type: 'customer' }).toArray();
                    for (const lp of linkedPayments) {
                        await db.payments.delete(lp.id);
                    }
                    const linkedLedger = await db.ledger.where({ reference_id: dup.id, reference_type: 'Sale' }).toArray();
                    for (const ll of linkedLedger) {
                        await db.ledger.delete(ll.id);
                    }
                    await db.sales.delete(dup.id);
                    removedSales++;
                }
            }

            // ── Remove duplicate payments ──
            for (const group of paymentGroups) {
                for (const dup of group.duplicates) {
                    await db.payments.delete(dup.id);
                    removedPayments++;
                }
            }

            // ── Remove duplicate ledger entries ──
            for (const group of ledgerGroups) {
                for (const dup of group.duplicates) {
                    await db.ledger.delete(dup.id);
                    removedLedger++;
                }
            }
        });

        Swal.close();

        // ── Show Reconciliation Summary ──
        await showReconciliationSummary(removedSales, removedPayments, removedLedger);

    } catch (err) {
        console.error('Duplicate cleanup failed:', err);
        Swal.close();
        showAlert('Error', 'Cleanup failed: ' + err.message, 'error');
    }
}

async function showReconciliationSummary(removedSales, removedPayments, removedLedger) {
    try {
        // ── Recalculate all accounting figures from clean data ──
        const sales = await db.sales.toArray();
        const payments = await db.payments.toArray();
        const customers = await db.customers.toArray();
        const vendors = await db.vendors.toArray();
        const bankAccounts = await db.bank_accounts.toArray();
        const accounts = await db.accounts.toArray();
        const allLedger = await db.ledger.toArray();

        // Total Sales
        const totalSales = sales.reduce((sum, s) => {
            const total = parseFloat(s.total) || 0;
            if (s.document_type === 'sale' || !s.document_type) return sum + total;
            return sum;
        }, 0);

        // Cash received (payments from customers with method = Cash)
        const customerPayments = payments.filter(p => p.target_type === 'customer');
        const cashReceived = customerPayments
            .filter(p => (p.method || '').toLowerCase() === 'cash')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // Total payments received from customers (all methods)
        const totalCustomerPaymentsReceived = customerPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        // Credit outstanding from customers
        const creditOutstanding = customers.reduce((sum, c) => sum + (parseFloat(c.current_balance) || 0), 0);

        // Vendor payables
        const vendorPayables = vendors.reduce((sum, v) => sum + (parseFloat(v.current_balance) || 0), 0);

        // Bank balance
        const totalBankBalance = bankAccounts.reduce((sum, ba) => sum + (parseFloat(ba.balance) || 0), 0);

        // Cash in Hand from ledger
        const cashAccounts = accounts.filter(a => a.code === '1000');
        const cashAccountIds = cashAccounts.map(a => a.id);
        const cashEntries = allLedger.filter(e => cashAccountIds.includes(e.account_id));
        const cashInHand = cashEntries.reduce((sum, e) => {
            if (e.type === 'debit') return sum + (e.amount || 0);
            if (e.type === 'credit') return sum - (e.amount || 0);
            return sum;
        }, 0);

        // Expected cash: totalSales - creditOutstanding - vendorPayables - bankBalance
        // This is a simplified cross-check
        const expectedCash = totalSales - creditOutstanding - vendorPayables;

        const summaryHtml = `
            <div class="text-left space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                <!-- Cleanup Stats -->
                <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <i class="fa-solid fa-check text-white text-lg"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-emerald-700 dark:text-emerald-400 text-sm uppercase tracking-tight">Cleanup Complete</h4>
                            <p class="text-[10px] text-emerald-600/60 font-bold uppercase tracking-widest">All duplicates have been removed</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3 mt-3">
                        <div class="text-center bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <div class="text-lg font-black text-emerald-600">${removedSales}</div>
                            <div class="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">Sales Removed</div>
                        </div>
                        <div class="text-center bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <div class="text-lg font-black text-emerald-600">${removedPayments}</div>
                            <div class="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">Payments Removed</div>
                        </div>
                        <div class="text-center bg-white dark:bg-gray-800/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <div class="text-lg font-black text-emerald-600">${removedLedger}</div>
                            <div class="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">Ledger Removed</div>
                        </div>
                    </div>
                </div>

                <!-- Reconciliation Report -->
                <div class="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                        <h4 class="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <i class="fa-solid fa-scale-balanced"></i> ACCOUNTS RECONCILIATION
                        </h4>
                        <p class="text-indigo-200 text-[10px] font-bold mt-1">Post-cleanup financial summary</p>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                        <div class="flex justify-between items-center px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <i class="fa-solid fa-chart-line text-blue-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Total Sales</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">All completed sale invoices</div>
                                </div>
                            </div>
                            <div class="text-lg font-black text-gray-900 dark:text-white">${formatCurrency(totalSales)}</div>
                        </div>

                        <div class="flex justify-between items-center px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <i class="fa-solid fa-money-bill-wave text-emerald-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Cash Received</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">Customer payments (cash method)</div>
                                </div>
                            </div>
                            <div class="text-lg font-black text-emerald-600">${formatCurrency(cashReceived)}</div>
                        </div>

                        <div class="flex justify-between items-center px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                    <i class="fa-solid fa-clock text-amber-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Credit Outstanding</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">Pending from customers</div>
                                </div>
                            </div>
                            <div class="text-lg font-black text-amber-600">${formatCurrency(creditOutstanding)}</div>
                        </div>

                        <div class="flex justify-between items-center px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                    <i class="fa-solid fa-truck text-red-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Vendor Payables</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">Outstanding to suppliers</div>
                                </div>
                            </div>
                            <div class="text-lg font-black text-red-600">${formatCurrency(vendorPayables)}</div>
                        </div>

                        <div class="flex justify-between items-center px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <i class="fa-solid fa-building-columns text-indigo-500 text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Bank Balance</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">All bank accounts combined</div>
                                </div>
                            </div>
                            <div class="text-lg font-black text-indigo-600">${formatCurrency(totalBankBalance)}</div>
                        </div>

                        <div class="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <i class="fa-solid fa-wallet text-primary text-sm"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-bold text-gray-900 dark:text-white">Cash in Hand (Ledger)</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase">From accounting ledger entries</div>
                                </div>
                            </div>
                            <div class="text-xl font-black ${cashInHand >= 0 ? 'text-primary' : 'text-red-600'}">${formatCurrency(cashInHand)}</div>
                        </div>
                    </div>
                </div>

                <!-- Cross-Check -->
                <div class="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <h5 class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3"><i class="fa-solid fa-calculator mr-1"></i> CROSS-CHECK</h5>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Total Sales</span>
                            <span class="font-bold">${formatCurrency(totalSales)}</span>
                        </div>
                        <div class="flex justify-between text-gray-600 dark:text-gray-400">
                            <span class="pl-4">− Credit Outstanding</span>
                            <span class="font-bold text-amber-600">− ${formatCurrency(creditOutstanding)}</span>
                        </div>
                        <div class="flex justify-between text-gray-600 dark:text-gray-400">
                            <span class="pl-4">− Vendor Payables</span>
                            <span class="font-bold text-red-600">− ${formatCurrency(vendorPayables)}</span>
                        </div>
                        <div class="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-black text-gray-900 dark:text-white">
                            <span>= Expected Cash Flow</span>
                            <span>${formatCurrency(expectedCash)}</span>
                        </div>
                        <div class="flex justify-between text-gray-600 dark:text-gray-400 pt-1">
                            <span class="pl-4">Cash in Hand (Ledger)</span>
                            <span class="font-bold">${formatCurrency(cashInHand)}</span>
                        </div>
                        <div class="flex justify-between text-gray-600 dark:text-gray-400">
                            <span class="pl-4">Bank Balance</span>
                            <span class="font-bold">${formatCurrency(totalBankBalance)}</span>
                        </div>
                        <div class="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-black ${Math.abs(expectedCash - cashInHand - totalBankBalance) < 1 ? 'text-emerald-600' : 'text-red-600'}">
                            <span>= Discrepancy</span>
                            <span>${formatCurrency(expectedCash - cashInHand - totalBankBalance)}</span>
                        </div>
                    </div>
                </div>

                ${cashInHand < 0 ? `
                    <div class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-2xl p-4">
                        <p class="text-xs text-red-700 dark:text-red-400 font-bold">
                            <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
                            Cash in Hand is negative (${formatCurrency(cashInHand)}). This may indicate over-recorded expenses or missing income entries. 
                            You can use the <strong>Adjust Cash</strong> button in Accounting → Summary to manually correct it.
                        </p>
                    </div>
                ` : ''}
            </div>
        `;

        await Swal.fire({
            title: '<i class="fa-solid fa-scale-balanced mr-2 text-primary"></i> Reconciliation Summary',
            html: summaryHtml,
            width: '720px',
            confirmButtonText: 'Done',
            confirmButtonColor: '#4f46e5',
            customClass: { popup: 'rounded-3xl' }
        });

        // Refresh accounting view if visible
        if (typeof loadAccounting === 'function' && document.getElementById('accounting-view')) {
            loadAccounting();
        }

    } catch (err) {
        console.error('Reconciliation summary failed:', err);
        showAlert('Error', 'Could not generate reconciliation summary: ' + err.message, 'error');
    }
}






