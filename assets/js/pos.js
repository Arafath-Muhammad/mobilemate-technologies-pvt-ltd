// POS module functionality
let cart = [];
let currentMode = 'retail';
let searchResults = [];
let discountAmount = 0;
let deliveryCharge = 0;
let currentCustomer = null;
let editingCustomerId = null;
let customerCallback = null;
let vatRate = 0.15; // Default fallback
let taxEnabled = false;

async function loadPOS() {
    console.log("Loading POS interface...");
    const posView = document.getElementById('pos-view');
    if (!posView) return;

    let defaultLayout = 'thermal';
    try {
        const layoutPref = await db.settings.get('invoice_template');
        if (layoutPref && layoutPref.value) defaultLayout = layoutPref.value;

        const taxPref = await db.settings.get('vat_rate');
        if (taxPref) vatRate = (parseFloat(taxPref.value) || 0) / 100;

        const taxEnabledPref = await db.settings.get('tax_enabled');
        if (taxEnabledPref) taxEnabled = taxEnabledPref.value === true || taxEnabledPref.value === 'true';
    } catch (e) { }

    const html = `
        <div class="flex flex-col h-full w-full max-w-[1700px] mx-auto space-y-0 lg:space-y-6 pb-4 lg:pb-20 px-0 lg:px-4">

            <!-- ── Mobile Tab Bar (hidden on desktop) ─────────────────── -->
            <div class="lg:hidden flex bg-white dark:bg-darkCard border-b border-gray-100 dark:border-darkBorder sticky top-0 z-30 shadow-sm" id="pos-mobile-tabs">
                <button id="pos-tab-cart" onclick="posSwitchTab('cart')"
                    class="flex-1 py-3.5 text-[11px] font-black uppercase tracking-widest border-b-2 border-primary text-primary flex items-center justify-center gap-2 transition-all">
                    <i class="fa-solid fa-cart-shopping"></i>
                    Cart
                    <span id="pos-tab-cart-badge" class="bg-primary text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
                </button>
                <button id="pos-tab-checkout" onclick="posSwitchTab('checkout')"
                    class="flex-1 py-3.5 text-[11px] font-black uppercase tracking-widest border-b-2 border-transparent text-gray-400 flex items-center justify-center gap-2 transition-all">
                    <i class="fa-solid fa-money-check-dollar"></i>
                    Checkout
                </button>
            </div>

            <!-- ── Barcode / Search Bar ────────────────────────────────── -->
            <div class="relative w-full max-w-4xl mx-auto group mt-0 lg:mt-4 px-3 lg:px-0 pt-3 lg:pt-0">
                <div class="absolute inset-y-0 left-3 lg:left-0 flex items-center pl-6 pointer-events-none">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 group-focus-within:text-primary transition-colors text-lg lg:text-xl"></i>
                </div>
                <input type="text" id="pos-search" 
                       class="w-full pl-14 pr-4 py-4 lg:py-5 bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder rounded-2xl lg:rounded-[2.5rem] shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none text-base lg:text-lg transition-all dark:text-white placeholder-gray-400 font-medium" 
                       placeholder="Scan Barcode or Search Items..." autocomplete="off">
                <div id="pos-search-results" class="absolute left-3 lg:left-0 right-3 lg:right-0 mt-3 bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder rounded-2xl lg:rounded-3xl shadow-2xl max-h-[55vh] lg:max-h-96 overflow-y-auto hidden z-[60] backdrop-blur-xl bg-white/95 dark:bg-darkCard/95"></div>
            </div>

            <!-- ── Two-Section POS ─────────────────────────────────────── -->
            <div class="flex flex-col lg:flex-row gap-0 lg:gap-6 flex-1 lg:min-h-[600px]">
                
                <!-- LEFT: Cart items — shown on "Cart" tab (mobile) / always (desktop) -->
                <div id="pos-col-cart" class="flex-1 bg-white dark:bg-darkCard border-0 lg:border border-gray-100 dark:border-darkBorder rounded-none lg:rounded-[2.5rem] shadow-none lg:shadow-xl overflow-hidden flex flex-col">
                    <!-- Desktop-only column header -->
                    <div class="hidden lg:flex px-8 py-5 bg-gray-50/50 dark:bg-darkBg/30 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 backdrop-blur-md">
                        <div class="flex-1">Product Details</div>
                        <div class="w-48 text-center px-4">Serial / Warranty</div>
                        <div class="w-32 text-center">Unit Price</div>
                        <div class="w-32 text-center">Qty</div>
                        <div class="w-40 text-right">Subtotal</div>
                    </div>

                    <!-- Cart Items List -->
                    <div class="flex-1 overflow-y-auto custom-scrollbar relative px-4 lg:px-8" id="pos-cart-list">
                        <!-- Javascript will render items or empty state here -->
                    </div>
                </div>

                <!-- RIGHT: Checkout panel — shown on "Checkout" tab (mobile) / always (desktop) -->
                <div id="pos-col-checkout" class="hidden lg:flex lg:w-[420px] shrink-0 space-y-0 lg:space-y-6 flex-col">
                    
                    <!-- Customer & Mode Selection -->
                    <div class="bg-white dark:bg-darkCard border-0 lg:border border-gray-100 dark:border-darkBorder rounded-none lg:rounded-[2.5rem] shadow-none lg:shadow-xl p-4 lg:p-6">
                         <div class="flex flex-col gap-4 lg:gap-6">
                            <div class="flex items-center gap-4 cursor-pointer group/item" onclick="promptCustomer()">
                                <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-all">
                                    <i class="fa-solid fa-user-tag text-lg lg:text-xl"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">POS Customer</span>
                                    <div class="flex items-center justify-between">
                                        <span class="font-bold text-gray-900 dark:text-white group-hover/item:text-primary transition-colors truncate" id="customer-lbl">Walk-in Customer</span>
                                        <i class="fa-solid fa-chevron-right text-[10px] text-gray-300 ml-2"></i>
                                    </div>
                                </div>
                            </div>

                            <div class="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl flex gap-1">
                                <button id="mode-retail" class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Retail</button>
                                <button id="mode-wholesale" class="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Wholesale</button>
                            </div>
                         </div>
                    </div>

                    <!-- Checkout Box: Details & Totals -->
                    <div class="flex-1 bg-white dark:bg-darkCard border-0 lg:border border-gray-100 dark:border-darkBorder rounded-none lg:rounded-[2.5rem] shadow-none lg:shadow-xl p-4 lg:p-8 flex flex-col overflow-hidden">
                        <div class="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            <div class="grid grid-cols-2 gap-3 lg:gap-4">
                                <div class="space-y-1.5 col-span-2">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Date (Backdating)</label>
                                    <input type="date" id="pos-doc-date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Doc Type</label>
                                    <select id="pos-doc-type" onchange="togglePayMethod()" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="invoice">Sales Invoice</option>
                                        <option value="delivery_note">Delivery Note</option>
                                        <option value="quote">Sales Quote</option>
                                        <option value="sales_order">Sales Order</option>
                                        <option value="web_order">Web Order</option>
                                    </select>
                                </div>
                                <div id="pos-pay-wrap" class="space-y-1.5">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment</label>
                                    <select id="pos-pay-method" onchange="if(this.value==='qr') showQRPayment(); togglePayMethod();" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="bank">Bank</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="qr">QR / Online</option>
                                        <option value="koko">Koko</option>
                                        <option value="mintpay">Mintpay</option>
                                        <option value="cod">Cash on Delivery</option>
                                        <option value="credit">On Credit</option>
                                    </select>
                                </div>
                                <div id="pos-quote-validity-wrap" class="space-y-1.5 hidden">
                                    <label class="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Quote Validity</label>
                                    <select id="pos-quote-validity" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="1">1 Day</option>
                                        <option value="2">2 Days</option>
                                        <option value="3">3 Days</option>
                                        <option value="7">7 Days</option>
                                        <option value="14">14 Days</option>
                                        <option value="30">30 Days</option>
                                        <option value="60">60 Days</option>
                                    </select>
                                </div>
                                <div id="pos-credit-days-wrap" class="space-y-1.5 hidden">
                                    <label class="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Credit Days</label>
                                    <select id="pos-credit-days" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="1">1 Day</option>
                                        <option value="3">3 Days</option>
                                        <option value="7">7 Days</option>
                                        <option value="14">14 Days</option>
                                        <option value="21">21 Days</option>
                                        <option value="30">30 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Print Layout</label>
                                    <select id="pos-printer-layout" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="professional" ${defaultLayout === 'professional' ? 'selected' : ''}>Professional</option>
                                        <option value="thermal" ${defaultLayout === 'thermal' ? 'selected' : ''}>Thermal Style</option>
                                        <option value="minimal" ${defaultLayout === 'minimal' ? 'selected' : ''}>Minimal</option>
                                        <option value="dotmatrix" ${defaultLayout === 'dotmatrix' ? 'selected' : ''}>Dot Matrix</option>
                                    </select>
                                </div>
                                <div class="space-y-1.5">
                                     <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shipment Target</label>
                                    <select id="pos-ship-to" class="w-full bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat">
                                        <option value="Customer Pickup">Customer Pickup</option>
                                        <option value="Delivery">Delivery</option>
                                        <option value="Courier">Courier</option>
                                        <option value="Cash on Delivery">Cash on Delivery</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                 <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PO / Tracking #</label>
                                 <div class="flex gap-2">
                                     <input type="text" id="pos-po-number" class="w-1/2 bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20" placeholder="PO #">
                                     <input type="text" id="pos-tracking-number" class="w-1/2 bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-2xl text-xs font-bold py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/20" placeholder="Tracking #">
                                 </div>
                            </div>

                            <div class="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                <div class="flex justify-between text-xs font-bold text-gray-500">
                                    <span>Subtotal</span>
                                    <span id="cart-subtotal" class="text-gray-900 dark:text-white">Rs. 0</span>
                                </div>
                                <div class="flex justify-between text-xs font-bold text-red-500">
                                    <span class="flex items-center gap-2 cursor-pointer hover:underline transition-all" onclick="promptDiscount()"><i class="fa-solid fa-tag text-[10px]"></i> Apply Discount</span>
                                    <span id="cart-discount">- Rs. 0</span>
                                </div>
                                <div class="flex justify-between text-xs font-bold text-gray-500">
                                    <span class="flex items-center gap-2 cursor-pointer hover:underline transition-all" onclick="promptDeliveryCharge()"><i class="fa-solid fa-truck text-[10px]"></i> Delivery Charge</span>
                                    <span id="cart-delivery">+ Rs. 0</span>
                                </div>
                                <div id="cart-tax-details" class="bg-gray-50 dark:bg-gray-800/50 p-3 lg:p-4 rounded-2xl space-y-1 mt-2">
                                    <div class="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>Taxable Amt</span>
                                        <span id="cart-taxable">Rs. 0</span>
                                    </div>
                                    <div id="cart-base-wrap" class="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest hidden">
                                        <span>Base Price</span>
                                        <span id="cart-base">Rs. 0</span>
                                    </div>
                                    <div class="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        <span id="vat-label">VAT (15%)</span>
                                        <span id="cart-vat">Rs. 0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="pt-6 mt-auto flex flex-col items-center gap-4 lg:gap-6">
                            <div class="text-center">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Payable Amount</span>
                                <div id="cart-total" class="text-4xl lg:text-5xl font-black text-primary dark:text-white tracking-tighter italic">Rs. 0</div>
                            </div>
                            <button id="btn-pay" onclick="processPayment()" class="w-full h-16 lg:h-20 bg-primary hover:bg-slate-800 text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-lg lg:text-xl shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 group active:scale-95">
                                Complete Checkout <i class="fa-solid fa-chevron-right text-base group-hover:translate-x-1 transition-transform"></i>
                            </button>
                            <div class="flex flex-col gap-2 w-full">
                                <button onclick="holdInvoice()" class="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-pause"></i> Hold Invoice
                                </button>
                                <button onclick="showHeldInvoices()" class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-clock-rotate-left"></i> Recall Held Invoices
                                </button>
                                <button onclick="clearCart()" class="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-rotate-left"></i> Reset Terminal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    posView.innerHTML = html;

    // Update VAT label dynamically
    const vatLbl = document.getElementById('vat-label');
    if (vatLbl) vatLbl.textContent = `VAT (${(vatRate * 100).toFixed(0)}%)`;

    document.getElementById('mode-retail').addEventListener('click', () => switchMode('retail'));
    document.getElementById('mode-wholesale').addEventListener('click', () => switchMode('wholesale'));
    document.getElementById('pos-search').addEventListener('input', (e) => handleSearch(e.target.value));

    // Focus search bar automatically on desktop
    if (window.innerWidth >= 1024) {
        setTimeout(() => document.getElementById('pos-search')?.focus(), 100);
    }

    switchMode(currentMode);
    renderCart();

    // Mobile: start on Cart tab
    if (window.innerWidth < 1024) {
        posSwitchTab('cart');
    }

    if (editingSaleId) {
        loadExistingSale(editingSaleId);
    } else if (preselectedDocType) {
        const docTypeEl = document.getElementById('pos-doc-type');
        if (docTypeEl) {
            docTypeEl.value = preselectedDocType;
            togglePayMethod();
        }
        preselectedDocType = null;
    }
}

// ── Mobile POS tab switcher ─────────────────────────────────────────────────
function posSwitchTab(tab) {
    const cartCol = document.getElementById('pos-col-cart');
    const checkoutCol = document.getElementById('pos-col-checkout');
    const tabCart = document.getElementById('pos-tab-cart');
    const tabCheckout = document.getElementById('pos-tab-checkout');

    if (!cartCol || !checkoutCol) return;

    if (tab === 'cart') {
        cartCol.classList.remove('hidden');
        cartCol.classList.add('flex');
        checkoutCol.classList.add('hidden');
        checkoutCol.classList.remove('flex');

        if (tabCart) {
            tabCart.classList.add('border-primary', 'text-primary');
            tabCart.classList.remove('border-transparent', 'text-gray-400');
        }
        if (tabCheckout) {
            tabCheckout.classList.add('border-transparent', 'text-gray-400');
            tabCheckout.classList.remove('border-primary', 'text-primary');
        }
    } else {
        checkoutCol.classList.remove('hidden');
        checkoutCol.classList.add('flex');
        cartCol.classList.add('hidden');
        cartCol.classList.remove('flex');

        if (tabCheckout) {
            tabCheckout.classList.add('border-primary', 'text-primary');
            tabCheckout.classList.remove('border-transparent', 'text-gray-400');
        }
        if (tabCart) {
            tabCart.classList.add('border-transparent', 'text-gray-400');
            tabCart.classList.remove('border-primary', 'text-primary');
        }
    }
}

function initPOSMobileSwitcher() {
    const btnProducts = document.getElementById('show-products');
    const btnCart = document.getElementById('show-cart');
    const colProducts = document.getElementById('pos-products-col');
    const colCart = document.getElementById('pos-cart-col');

    if (!btnProducts || !btnCart || !colProducts || !colCart) return;

    btnProducts.addEventListener('click', () => {
        colProducts.classList.remove('hidden');
        colCart.classList.add('hidden');

        btnProducts.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnProducts.classList.remove('text-gray-500', 'dark:text-gray-400');

        btnCart.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btnCart.classList.add('text-gray-500', 'dark:text-gray-400');
    });

    btnCart.addEventListener('click', () => {
        colProducts.classList.add('hidden');
        colCart.classList.remove('hidden', 'lg:flex');
        colCart.classList.add('flex');

        btnCart.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnCart.classList.remove('text-gray-500', 'dark:text-gray-400');

        btnProducts.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        btnProducts.classList.add('text-gray-500', 'dark:text-gray-400');
    });
}


async function loadExistingSale(id) {
    const sale = await db.sales.get(id);
    if (!sale) return;

    cart = sale.items.map((item, index) => ({
        id: item.product_id || ('custom-' + Date.now() + '-' + index),
        name: item.name,
        cart_qty: item.qty,
        cart_price: item.price,
        retail_price: item.price,
        wholesale_price: item.price,
        warranty: item.warranty || 'No Warranty',
        serial: item.serial || '',
        description: item.description || '',
        is_custom: !item.product_id,
        // We need these for mode switching/pricing logic
        retail_price: item.price,
        wholesale_price: item.price,
        stock_qty: 999 // Placeholder, will be updated if we fetch product
    }));

    // Try to get real stock levels
    for (let item of cart) {
        if (!item.id) continue;
        const p = await db.products.get(item.id);
        if (p) {
            item.stock_qty = p.stock_qty + (sale.document_type === 'invoice' ? item.cart_qty : 0);
            item.retail_price = p.retail_price;
            item.wholesale_price = p.wholesale_price;
            item.serial_list = p.serial_list || [];
        }
    }

    currentCustomer = sale.customer_id ? await db.customers.get(sale.customer_id) : null;
    discountAmount = sale.discount || 0;
    deliveryCharge = sale.delivery_charge || 0;
    currentMode = sale.type || 'retail';

    const docTypeEl = document.getElementById('pos-doc-type');
    if (docTypeEl) {
        docTypeEl.value = sale.document_type || 'invoice';
        const dateEl = document.getElementById('pos-doc-date');
        if (dateEl && sale.date) dateEl.value = sale.date.split('T')[0];
        togglePayMethod();
        const validityEl = document.getElementById('pos-quote-validity');
        if (validityEl) validityEl.value = sale.validity || '7';
        const shipToEl = document.getElementById('pos-ship-to');
        if (shipToEl) shipToEl.value = sale.ship_to || 'Customer Pickup';
        const creditDaysEl = document.getElementById('pos-credit-days');
        if (creditDaysEl) creditDaysEl.value = sale.credit_days || '30';
        const trackingEl = document.getElementById('pos-tracking-number');
        if (trackingEl) trackingEl.value = sale.tracking_number || '';
        const poEl = document.getElementById('pos-po-number');
        if (poEl) poEl.value = sale.po_number || '';

        const layoutEl = document.getElementById('pos-printer-layout');
        if (layoutEl) layoutEl.value = sale.printer_layout || 'professional';
    }

    if (currentCustomer) {
        let ptsText = '';
        if (typeof getCustomerLoyalty === 'function') {
            const loyalty = await getCustomerLoyalty(currentCustomer.id);
            ptsText = ` ⭐ ${loyalty.points} pts`;
        }
        document.getElementById('customer-lbl').innerHTML = `${currentCustomer.name} <span class="text-[10px] text-amber-500 font-bold ml-1">${ptsText}</span>`;
    } else {
        document.getElementById('customer-lbl').innerHTML = sale.customer_name || 'Walk-in Customer';
    }

    await refreshCartHistory();
    switchMode(currentMode);
    renderCart();

    // Change button text
    document.getElementById('btn-pay').innerHTML = `<i class="fa-solid fa-save mr-2"></i> Update Document`;
}

function promptCustomer(callback = null) {
    customerCallback = callback;
    const modal = document.getElementById('customer-modal');
    const content = document.getElementById('customer-modal-content');

    // Ensure modal is visible and ready for animation
    modal.classList.remove('hidden', 'invisible', 'opacity-0');
    modal.classList.add('visible', 'opacity-100');

    if (content) {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }

    renderCustomerList();

    // Reset UI to show list
    document.getElementById('customer-form').classList.add('hidden');
    document.getElementById('customer-search-area').classList.remove('hidden');
    document.getElementById('cust-save-btn').classList.add('hidden'); // Ensure save button is hidden in list view

    // Attach search event lazily
    const searchInput = document.getElementById('cust-search');
    searchInput.oninput = (e) => renderCustomerList(e.target.value);
}

function closeCustomerModal() {
    const modal = document.getElementById('customer-modal');
    const content = document.getElementById('customer-modal-content');
    if (!modal) return;

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('visible');
        modal.classList.add('invisible');
        document.body.style.overflow = ''; // Restore scroll
    }, 300);
}

function toggleCustomerForm() {
    const form = document.getElementById('customer-form');
    const searchArea = document.getElementById('customer-search-area');
    const saveBtn = document.getElementById('cust-save-btn');
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        searchArea.classList.add('hidden');
        saveBtn.classList.remove('hidden'); // Show save button in header
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        document.getElementById('customer-modal-title').textContent = 'Create New Customer';

        editingCustomerId = null; // Ensure we are not in edit mode
        form.reset(); // Clear all fields


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
            if (typeof toggleCustomerTypeFields === 'function') toggleCustomerTypeFields();
        }

        // Initialize listeners for the new form
        if (typeof initCustomerModalListeners === 'function') {
            initCustomerModalListeners();
        }

    } else {
        form.classList.add('hidden');
        searchArea.classList.remove('hidden');
        saveBtn.classList.add('hidden'); // Hide save button in header
        document.getElementById('customer-modal-title').textContent = 'Select Customer';
        editingCustomerId = null; // Reset editing state
    }
}

async function editCustomer(id, event) {
    if (event) event.stopPropagation(); // Don't trigger setCustomer

    // Support both string or numeric ID (handles case where id might be passed as string)
    const searchId = (typeof id === 'string') ? (parseInt(id) || id) : id;
    const customer = await db.customers.get(searchId);
    if (!customer) {
        console.error('Customer not found for ID:', id);
        return;
    }

    editingCustomerId = searchId;

    // Ensure the modal container itself is visible
    const modal = document.getElementById('customer-modal');
    if (modal) {
        modal.classList.remove('hidden', 'invisible', 'opacity-0');
        modal.classList.add('visible', 'opacity-100');
    }

    // Populate form (guard against optional fields that may not be in all modal layouts)
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('cust-name', customer.name || '');
    setVal('cust-phone', customer.phone || '');
    setVal('cust-email', customer.email || '');
    setVal('cust-account-code', customer.account_code || '');
    setVal('cust-city', customer.city || '');
    setVal('cust-zip', customer.zip_code || '');
    setVal('cust-company', customer.company || '');
    setVal('cust-address', customer.address || '');
    setVal('cust-terms', customer.payment_terms || 'cash');
    setVal('cust-credit-limit', customer.credit_limit || 0);
    setVal('cust-credit-balance', customer.current_balance || 0);
    setVal('cust-credit-period', customer.credit_period || 0);

    // Toggle credit options visibility
    const creditWrapper = document.getElementById('credit-options');
    if (creditWrapper) {
        if (customer.payment_terms === 'credit') {
            creditWrapper.classList.remove('hidden');
        } else {
            creditWrapper.classList.add('hidden');
        }
    }

    // Ensure change listener is attached for credit terms
    if (typeof initCustomerModalListeners === 'function') {
        initCustomerModalListeners();
    }

    // Switch view
    document.getElementById('customer-form').classList.remove('hidden');
    document.getElementById('customer-search-area').classList.add('hidden');
    const saveBtn = document.getElementById('cust-save-btn');
    if (saveBtn) {
        saveBtn.classList.remove('hidden'); // Show save button in header
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    document.getElementById('customer-modal-title').textContent = 'Edit Customer Profile';

    // Populate BR Document if exists
    const brDataEl = document.getElementById('cust-br-data');
    const brLabelEl = document.getElementById('br-file-name');
    const viewBtn = document.getElementById('btn-view-br');

    if (brDataEl) brDataEl.value = customer.br_document || '';
    if (brLabelEl) {
        brLabelEl.textContent = customer.br_document ? 'Document Uploaded' : 'Upload BR Document (Image or PDF)';
        brLabelEl.dataset.filename = 'br-document'; // Default if not saved
    }

    if (viewBtn) {
        if (customer.br_document) viewBtn.classList.remove('hidden');
        else viewBtn.classList.add('hidden');
    }

    const catEl = document.getElementById('cust-category');
    if (catEl) catEl.value = customer.category || 'Retail';

    const typeEl = document.getElementById('cust-type');
    if (typeEl) {
        typeEl.value = customer.type || (customer.company ? 'company' : 'individual');
        if (typeof toggleCustomerTypeFields === 'function') toggleCustomerTypeFields();
    }

    const titleEl = document.getElementById('cust-title');
    if (titleEl) titleEl.value = customer.title || 'None';

    const contactEl = document.getElementById('cust-contact-person');
    if (contactEl) contactEl.value = customer.contact_person || '';
}

function toggleContactPersonField() {
    // This is now partially handled by toggleCustomerTypeFields
    // but we keep it for manual company name input changes
    const type = document.getElementById('cust-type')?.value;
    const company = document.getElementById('cust-company').value.trim();
    const wrap = document.getElementById('cust-contact-person-wrap');
    if (wrap && type === 'company') {
        if (company) {
            wrap.classList.remove('hidden');
        } else {
            // If company name is empty, we still show the wrap because it's a company type
            // but the user might want it hidden until name is typed? 
            // The requirement says "option to add the Contact Person Name" if Company is selected.
            wrap.classList.remove('hidden');
        }
    }
}

async function renderCustomerList(query = '') {
    const resEl = document.getElementById('customer-list-results');
    if (!resEl) return;

    let customers = await db.customers.toArray();
    if (query) {
        const q = query.toLowerCase();
        customers = customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.company && c.company.toLowerCase().includes(q)));
    }

    if (customers.length === 0) {
        resEl.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No customers found.</p>';
        return;
    }

    let html = '';
    customers.forEach(c => {
        const titleLine = c.company ? `<span class="text-primary">${c.name}</span> <span class="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded ml-2 uppercase tracking-widest text-gray-400">${c.company}</span>` : c.name;
        const subLine = c.contact_person ? `<p class="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black"><i class="fa-solid fa-user-tie mr-1"></i>Contact: ${c.contact_person}</p>` : (c.phone ? `<p class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black"><i class="fa-solid fa-phone mr-1"></i>${c.phone}</p>` : '');

        html += `
            <div onclick='setCustomer(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-2 border-gray-50 dark:border-gray-700 hover:border-primary dark:hover:border-primary rounded-2xl cursor-pointer transition-all group hover:shadow-lg hover:shadow-primary/5">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                            ${(c.title || '').charAt(0) || (c.name || 'C').charAt(0)}
                        </div>
                        <h5 class="text-sm font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">${titleLine}</h5>
                    </div>
                    ${subLine}
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editCustomer(${c.id}, event)" class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit Customer">
                        <i class="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <div class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                        <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </div>
                </div>
            </div>
        `;
    });
    resEl.innerHTML = html;
}

async function setCustomer(custObj) {
    if (customerCallback) {
        customerCallback(custObj);
        customerCallback = null;
    } else {
        currentCustomer = custObj;
        const lbl = document.getElementById('customer-lbl');
        if (lbl) {
            if (!custObj) {
                lbl.innerHTML = 'Walk-in Customer';
                document.getElementById('mode-retail').disabled = false;
                document.getElementById('mode-wholesale').disabled = false;
                document.getElementById('mode-retail').classList.remove('opacity-50', 'cursor-not-allowed');
                document.getElementById('mode-wholesale').classList.remove('opacity-50', 'cursor-not-allowed');
                await refreshCartHistory();
            } else {
                let ptsText = '';
                if (typeof getCustomerLoyalty === 'function') {
                    const loyalty = await getCustomerLoyalty(custObj.id);
                    ptsText = ` ⭐ ${loyalty.points} pts`;
                }
                lbl.innerHTML = `${custObj.name} <span class="text-[10px] text-amber-500 font-bold ml-1">${ptsText}</span>`;
                await refreshCartHistory();
                if (custObj.category === 'Wholesale') {
                    switchMode('wholesale');
                    document.getElementById('mode-retail').disabled = true;
                    document.getElementById('mode-retail').classList.add('opacity-50', 'cursor-not-allowed');
                    document.getElementById('mode-wholesale').disabled = false;
                    document.getElementById('mode-wholesale').classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    document.getElementById('mode-retail').disabled = false;
                    document.getElementById('mode-wholesale').disabled = false;
                    document.getElementById('mode-retail').classList.remove('opacity-50', 'cursor-not-allowed');
                    document.getElementById('mode-wholesale').classList.remove('opacity-50', 'cursor-not-allowed');
                    switchMode('retail');
                }
            }
        }
    }
    closeCustomerModal();
}

async function saveNewCustomer() {
    const form = document.getElementById('customer-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const type = getVal('cust-type');
    let name = getVal('cust-name');
    let company = getVal('cust-company');

    if (type === 'company') {
        name = company; // Primary name is company name for corporate entities
    }

    const data = {
        name: name,
        phone: getVal('cust-phone'),
        email: getVal('cust-email'),
        account_code: getVal('cust-account-code'),
        city: getVal('cust-city'),
        zip_code: getVal('cust-zip'),
        company: company,
        address: getVal('cust-address'),
        payment_terms: getVal('cust-terms') || 'cash',
        credit_limit: parseFloat(getVal('cust-credit-limit')) || 0,
        current_balance: parseFloat(getVal('cust-credit-balance')) || 0,
        credit_period: parseInt(getVal('cust-credit-period')) || 0,
        br_document: getVal('cust-br-data'),
        category: getVal('cust-category') || 'Retail',
        title: getVal('cust-title'),
        contact_person: getVal('cust-contact-person'),
        type: type
    };

    try {
        if (editingCustomerId) {
            await db.customers.update(editingCustomerId, data);
            data.id = editingCustomerId;
            showAlert('Success', 'Customer profile updated.', 'success');
        } else {
            const id = await db.customers.add(data);
            data.id = id;
            showAlert('Success', 'Customer profile created.', 'success');
        }
        if (customerCallback || document.getElementById('pos-view').classList.contains('active')) {
            if (typeof setCustomer === 'function') setCustomer(data);
        } else {
            closeCustomerModal();
        }


        // Refresh customer list if we are in the customers view
        if (typeof renderCustomersList === 'function') {
            renderCustomersList();
        }

        form.reset();
        editingCustomerId = null;
    } catch (err) {
        showAlert('Error', 'Failed to save customer.', 'error');
    }
}

function promptDiscount() {
    if (cart.length === 0) return;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Apply Discount',
            input: 'number',
            inputLabel: 'Amount in Rs.',
            inputValue: discountAmount || '',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5',
            inputValidator: (value) => {
                if (value < 0) {
                    return 'Discount cannot be negative!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                discountAmount = parseFloat(result.value) || 0;
                renderCart();
            }
        });
    } else {
        const res = prompt('Enter discount amount in Rs:', discountAmount);
        if (res !== null && !isNaN(res)) {
            discountAmount = parseFloat(res);
            renderCart();
        }
    }
}

async function renderProductGrid() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;
    const products = await db.products.toArray();
    grid.classList.remove('hidden');
    let html = '';
    products.forEach(p => {
        const price = currentMode === 'retail' ? p.retail_price : p.wholesale_price;
        const hue = (p.id * 137.5) % 360;
        const lowStock = p.stock_qty <= 5;
        html += `
            <div onclick="addToCart(${p.id})" class="bg-white dark:bg-darkCard rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 shadow-sm cursor-pointer hover:border-primary/50 transition-all flex flex-col group h-full">
                <div class="flex flex-col flex-1">
                    <div class="flex justify-between items-start gap-2">
                        <h4 class="text-sm font-black dark:text-white line-clamp-3 leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">${p.name}</h4>
                        ${lowStock ? '<span class="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 animate-pulse">Low</span>' : ''}
                    </div>
                    <p class="text-[10px] text-gray-500 mt-1 mb-2 font-mono">${p.sku}</p>
                    <div class="font-black text-gray-900 dark:text-white mt-auto text-base border-t border-gray-50 dark:border-gray-800/50 pt-2 flex justify-between items-center group-hover:border-primary/20">
                        <span class="text-primary tracking-tighter">Rs. ${parseFloat(price).toLocaleString()}</span>
                        <div class="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 scale-90 group-hover:scale-100 transition-all opacity-0 group-hover:opacity-100"><i class="fa-solid fa-cart-plus text-xs"></i></div>
                    </div>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

async function switchMode(mode) {
    if (currentCustomer && currentCustomer.category === 'Wholesale' && mode === 'retail') {
        showAlert('Restriction', 'Wholesale customers are restricted to Wholesale pricing only.', 'warning');
        return;
    }
    currentMode = mode;
    const isRet = mode === 'retail';

    // Update active button styling
    const retBtn = document.getElementById('mode-retail');
    const wholeBtn = document.getElementById('mode-wholesale');

    if (retBtn && wholeBtn) {
        retBtn.className = isRet ? 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
        wholeBtn.className = !isRet ? 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
    }

    // update cart prices
    cart.forEach(c => {
        c.cart_price = currentMode === 'retail' ? c.retail_price : c.wholesale_price;
    });
    await refreshCartHistory();
    renderCart();
}

async function handleSearch(query) {
    const qTrimmed = query.trim();
    if (qTrimmed.length === 0) {
        document.getElementById('pos-search-results').classList.add('hidden');
        return;
    }

    // Exact Match for Barcode Scanners (SKU or Serial)
    const exactMatch = await db.products.filter(p =>
        p.sku === qTrimmed ||
        (p.serial_list && p.serial_list.includes(qTrimmed))
    ).first();

    if (exactMatch) {
        // Automatically add to cart and clear search
        // Pass the qTrimmed as the serial number if it was found in serial_list
        const matchedSerial = (exactMatch.serial_list && exactMatch.serial_list.includes(qTrimmed)) ? qTrimmed : '';
        addToCart(exactMatch.id, matchedSerial);
        document.getElementById('pos-search').value = '';
        document.getElementById('pos-search-results').classList.add('hidden');
        return;
    }

    if (qTrimmed.length < 2) {
        document.getElementById('pos-search-results').classList.add('hidden');
        return;
    }

    const q = qTrimmed.toLowerCase();
    let res = await db.products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.serial_list && p.serial_list.some(s => s.toLowerCase().includes(q)))
    ).limit(5).toArray();

    if (res.length > 0) {
        let html = '<div class="p-2 space-y-1">';
        res.forEach(p => {
            const price = currentMode === 'retail' ? p.retail_price : p.wholesale_price;
            html += `<div onclick="addToCart(${p.id}); document.getElementById('pos-search-results').classList.add('hidden'); document.getElementById('pos-search').value='';" 
                         class="p-4 flex items-center gap-4 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-all rounded-2xl group border border-transparent hover:border-primary/10">
                    <div class="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                         <i class="fa-solid fa-box text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-bold dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">${p.name}</p>
                        <p class="text-[10px] text-gray-500 font-mono mt-0.5">${p.sku} • Stock: <span class="${p.stock_qty <= 5 ? 'text-red-500 font-black' : 'text-gray-700 dark:text-gray-300 font-bold'}">${p.stock_qty}</span></p>
                    </div>
                    <div class="text-right">
                         <p class="text-sm font-black text-primary">Rs. ${parseFloat(price).toLocaleString()}</p>
                         <div class="flex items-center gap-2 mt-1 justify-end">
                            <button onclick="event.stopPropagation(); openPOSItemDetail(${p.id})" class="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary/20 hover:text-primary rounded-lg transition-all text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <i class="fa-solid fa-clock-rotate-left"></i> History
                            </button>
                            <div class="text-[8px] font-black uppercase text-gray-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add Info</div>
                         </div>
                    </div>
                </div>`;
        });
        html += '</div>';
        document.getElementById('pos-search-results').innerHTML = html;
        document.getElementById('pos-search-results').classList.remove('hidden');
    } else {
        document.getElementById('pos-search-results').innerHTML = '<div class="p-8 text-sm text-gray-500 text-center flex flex-col items-center gap-2"><i class="fa-solid fa-face-frown text-2xl opacity-20"></i> No items found for your search</div>';
        document.getElementById('pos-search-results').classList.remove('hidden');
    }
}

async function addToCart(id, serial = '') {
    const product = await db.products.get(id);
    if (!product) return;

    // Handle Variable Products
    if (product.product_type === 'variable' && !serial) {
        showVariationPicker(product);
        return;
    }

    const price = currentMode === 'retail' ? product.retail_price : product.wholesale_price;
    const existing = cart.find(c => c.id === id);

    if (existing) {
        const isInvoice = document.getElementById('pos-doc-type').value === 'invoice';
        if (isInvoice && existing.cart_qty >= product.stock_qty) {
            showAlert('Stock Limit', `Only ${product.stock_qty} available in stock. For backorder, please use Sales Order.`, 'warning');
            return;
        }
        existing.cart_qty += 1;
        if (serial) {
            const currentSerials = existing.serial ? existing.serial.split(/[\n,]+/).map(s => s.trim()).filter(s => s) : [];
            if (!currentSerials.includes(serial)) {
                currentSerials.push(serial);
                existing.serial = currentSerials.join(', ');
            }
        }
    } else {
        const docType = document.getElementById('pos-doc-type').value;
        const isRestrictedStock = docType === 'invoice';

        if (product.stock_qty <= 0 && isRestrictedStock) {
            Swal.fire({
                title: 'Out of Stock',
                text: "This item is out of stock. Would you like to create a Sales Order (Back Order) instead?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Create Sales Order',
                cancelButtonText: 'No, Skip',
                confirmButtonColor: '#8B5CF6'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (typeof openSalesDocModal === 'function') {
                        openSalesDocModal('sales_order');
                        setTimeout(() => addToSalesDoc(id), 500);
                    }
                }
            });
            return;
        }
        cart.push({
            ...product,
            cart_qty: 1,
            cart_price: price,
            retail_price: product.retail_price,
            wholesale_price: product.wholesale_price,
            warranty: product.warranty || 'No Warranty',
            description: '',
            serial: serial
        });
    }
    await refreshCartHistory();
    renderCart();
}

function showVariationPicker(product) {
    const variations = product.variations || [];
    if (variations.length === 0) {
        showAlert('No Variations', 'This product has no variations defined.', 'warning');
        return;
    }

    let html = `
        <div class="grid grid-cols-1 gap-4 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            ${variations.map((v, index) => `
                <button onclick="addVariationToCart(${product.id}, ${index})" class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-primary hover:bg-primary/5 rounded-[1.5rem] transition-all group text-left">
                    <div class="flex-1 min-w-0 pr-4">
                        <p class="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">${v.name}</p>
                        <p class="text-[10px] text-gray-500 font-mono mt-0.5">${v.sku}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="font-black text-primary text-base">Rs. ${parseFloat(v.price).toLocaleString()}</p>
                        <div class="flex items-center justify-end gap-1.5 mt-1">
                            <span class="w-2 h-2 rounded-full ${v.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}"></span>
                            <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest">Stock: ${v.stock}</p>
                        </div>
                    </div>
                </button>
            `).join('')}
        </div>
    `;

    Swal.fire({
        title: '<span class="text-xl font-black uppercase tracking-tight">Select Variation</span>',
        html: html,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        width: '550px',
        background: document.documentElement.classList.contains('dark') ? '#1E293B' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
        customClass: {
            container: 'z-[1000]',
            popup: 'rounded-[2.5rem] border-none shadow-2xl',
            cancelButton: 'rounded-xl font-black uppercase tracking-widest text-xs py-3 px-6'
        }
    });
}

async function addVariationToCart(parentId, varIndex) {
    const product = await db.products.get(parentId);
    if (!product || !product.variations || !product.variations[varIndex]) return;

    const variation = product.variations[varIndex];
    const price = variation.price || (currentMode === 'retail' ? product.retail_price : product.wholesale_price);

    const isInvoice = document.getElementById('pos-doc-type').value === 'invoice';
    if (isInvoice && variation.stock <= 0) {
        showAlert('Out of Stock', 'This variation is out of stock.', 'error');
        return;
    }

    const cartItem = {
        ...product,
        id: `${parentId}-${varIndex}`, // Composite ID for cart tracking
        real_id: parentId,
        name: `${product.name} - ${variation.name}`,
        sku: variation.sku,
        cart_qty: 1,
        cart_price: price,
        retail_price: price,
        wholesale_price: price,
        stock_qty: variation.stock,
        is_variation: true,
        variation_index: varIndex,
        parent_id: parentId,
        description: '',
        serial: ''
    };

    const existing = cart.find(c => c.id === cartItem.id);
    if (existing) {
        if (isInvoice && existing.cart_qty >= variation.stock) {
            showAlert('Stock Limit', 'Cannot exceed variation stock.', 'warning');
            return;
        }
        existing.cart_qty += 1;
    } else {
        cart.push(cartItem);
    }

    Swal.close();
    await refreshCartHistory();
    renderCart();
}

function updateCartQty(id, change) {
    const item = cart.find(c => c.id === id);
    if (item) {
        const isInvoice = document.getElementById('pos-doc-type').value === 'invoice';
        if (isInvoice && change > 0 && item.cart_qty + change > item.stock_qty) {
            showAlert('Stock Limit', 'Cannot exceed available stock for Invoices. Use Sales Order for backorders.', 'warning');
            return;
        }
        item.cart_qty += change;
        if (item.cart_qty <= 0) {
            cart = cart.filter(c => c.id !== id);
        }
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    renderCart();
}

function updateCartItem(id, field, value) {
    const item = cart.find(c => c.id === id);
    if (item) {
        item[field] = value;
    }
}

function clearCart() {
    if (cart.length === 0 && !editingSaleId) return;
    if (confirm('Clear cart / Cancel Edit?')) {
        cart = [];
        discountAmount = 0;
        deliveryCharge = 0;
        currentCustomer = null;
        editingSaleId = null;
        document.getElementById('customer-lbl').textContent = 'Walk-in Customer';
        document.getElementById('btn-pay').innerHTML = `Complete Checkout <i class="fa-solid fa-chevron-right text-base group-hover:translate-x-1 transition-transform"></i>`;
        renderCart();
    }
}

function renderCart() {
    const list = document.getElementById('pos-cart-list');
    let subtotal = 0;

    if (cart.length === 0) {
        list.innerHTML = `
             <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div class="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <i class="fa-solid fa-shopping-basket text-5xl text-gray-200 dark:text-gray-700"></i>
                </div>
                <div class="space-y-1">
                    <h3 class="text-xl font-black text-gray-300 dark:text-gray-700 uppercase tracking-tighter italic">Terminal Ready</h3>
                    <p class="text-sm text-gray-400 max-w-xs mx-auto">Scan a barcode or use the search bar above to begin.</p>
                </div>
            </div>
        `;
    } else {
        let html = '<div class="divide-y divide-gray-50 dark:divide-gray-800">';
        cart.forEach((c, index) => {
            const lineTotal = c.cart_qty * c.cart_price;
            subtotal += lineTotal;
            html += `
                <div class="group relative transition-all">
                    <!-- DESKTOP ROW (hidden on mobile) -->
                    <div class="hidden lg:flex items-center py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/10 -mx-8 px-8">
                        <div class="flex-1 flex flex-col group/item">
                            <span class="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-sm group-hover/item:text-primary transition-colors cursor-pointer" onclick="openPOSItemDetail(${c.id})">${c.name}</span>
                            <textarea onclick="event.stopPropagation()" oninput="updateCartItem(${c.id}, 'description', this.value)" placeholder="Add manual description..." class="w-full mt-1 px-2 py-1 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-primary/30 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 outline-none transition-all min-h-[45px]">${c.description || ''}</textarea>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[10px] text-gray-400 font-mono italic">${c.sku}</span>
                                ${c.last_purchase_date ? `<span class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest"><i class="fa-solid fa-clock-rotate-left mr-1"></i>Last Bought: ${new Date(c.last_purchase_date).toLocaleDateString()} @ Rs. ${parseFloat(c.last_purchase_price).toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                        <div class="w-48 flex flex-col gap-1 items-center px-4">
                            <input type="text" value="${c.serial || ''}" oninput="updateCartItem(${c.id}, 'serial', this.value)" class="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-primary/20" placeholder="S/N">
                            <input type="text" value="${c.warranty || 'No Warranty'}" oninput="updateCartItem(${c.id}, 'warranty', this.value)" class="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-center text-[10px] font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-primary/20" placeholder="Warranty">
                        </div>
                        <div class="w-32 px-4">
                            <input type="number" value="${c.cart_price}" onchange="updateCartItem(${c.id}, 'cart_price', parseFloat(this.value) || 0); renderCart();" class="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-center text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/20 hide-arrows">
                        </div>
                        <div class="w-32 flex justify-center">
                            <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                                <button onclick="updateCartQty(${c.id}, -1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg text-gray-500 shadow-sm hover:text-red-500 transition-all"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                <span class="w-10 text-center font-black text-sm dark:text-white">${c.cart_qty}</span>
                                <button onclick="updateCartQty(${c.id}, 1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg text-gray-500 shadow-sm hover:text-primary transition-all"><i class="fa-solid fa-plus text-[10px]"></i></button>
                            </div>
                        </div>
                        <div class="w-40 text-right font-black text-gray-900 dark:text-white text-base">Rs. ${lineTotal.toLocaleString()}</div>
                        <button onclick="removeFromCart(${c.id})" class="absolute -right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-red-500/20 translate-x-2 group-hover:translate-x-0 flex items-center justify-center">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>

                    <!-- MOBILE CARD (hidden on desktop) -->
                    <div class="lg:hidden flex items-center py-3 gap-3 px-1">
                        <div class="flex-1 min-w-0">
                            <p class="font-black text-gray-900 dark:text-white text-xs uppercase tracking-tight leading-tight truncate cursor-pointer" onclick="openPOSItemDetail(${c.id})">${c.name}</p>
                            <textarea onclick="event.stopPropagation()" oninput="updateCartItem(${c.id}, 'description', this.value)" placeholder="Description..." class="w-full mt-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded text-[9px] text-gray-600 dark:text-gray-400 font-bold outline-none min-h-[40px]">${c.description || ''}</textarea>
                            <div class="flex flex-col gap-0.5 mt-1">
                                <div class="flex items-center gap-1">
                                    <span class="text-[10px] text-gray-400 font-mono">Rs.</span>
                                    <input type="number" value="${c.cart_price}" onchange="updateCartItem(${c.id}, 'cart_price', parseFloat(this.value) || 0); renderCart();" class="w-16 bg-gray-100 dark:bg-gray-800 border-none rounded px-1 py-0.5 text-[10px] text-gray-900 dark:text-white font-mono hide-arrows outline-none">
                                    <span class="text-[10px] text-gray-400 font-mono">each</span>
                                </div>
                                ${c.last_purchase_date ? `<span class="text-[8px] text-emerald-500 font-bold uppercase tracking-widest leading-none mt-1"><i class="fa-solid fa-clock-rotate-left mr-0.5"></i>Bought: Rs. ${parseFloat(c.last_purchase_price).toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 shrink-0">
                            <button onclick="updateCartQty(${c.id}, -1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg text-gray-500 shadow-sm hover:text-red-500 transition-all active:scale-90"><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <span class="w-8 text-center font-black text-sm dark:text-white">${c.cart_qty}</span>
                            <button onclick="updateCartQty(${c.id}, 1)" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg text-gray-500 shadow-sm hover:text-primary transition-all active:scale-90"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                        <div class="text-right shrink-0">
                            <p class="font-black text-primary dark:text-white text-sm">Rs. ${lineTotal.toLocaleString()}</p>
                        </div>
                        <button onclick="removeFromCart(${c.id})" class="w-8 h-8 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl flex items-center justify-center transition-all active:scale-90 shrink-0">
                            <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        list.innerHTML = html;
    }

    // Calculations
    let total = subtotal - discountAmount + deliveryCharge;
    if (total < 0) total = 0;

    const basePrice = total / (1 + vatRate);
    const vatAmount = total - basePrice;

    document.getElementById('cart-subtotal').textContent = `Rs. ${subtotal.toLocaleString()}`;
    document.getElementById('cart-discount').textContent = `- Rs. ${discountAmount.toLocaleString()}`;
    document.getElementById('cart-delivery').textContent = `+ Rs. ${deliveryCharge.toLocaleString()}`;
    document.getElementById('cart-total').textContent = `Rs. ${total.toLocaleString()}`;

    // Detailed Tax Info
    const taxContainer = document.getElementById('cart-tax-details');
    if (taxContainer) {
        if (taxEnabled) {
            taxContainer.classList.remove('hidden');
            if (document.getElementById('cart-taxable')) {
                document.getElementById('cart-taxable').textContent = `Rs. ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                document.getElementById('cart-base').textContent = `Rs. ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                document.getElementById('cart-vat').textContent = `Rs. ${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                const vatLbl = document.getElementById('vat-label');
                if (vatLbl) vatLbl.textContent = `VAT (${(vatRate * 100).toFixed(0)}%)`;
            }
        } else {
            taxContainer.classList.add('hidden');
        }
    }

    const payBtn = document.getElementById('btn-pay');
    if (cart.length === 0) {
        payBtn.classList.add('opacity-50', 'cursor-not-allowed');
        payBtn.disabled = true;
    } else {
        payBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        payBtn.disabled = false;
    }

    // ── Mobile: update cart-tab badge ──────────────────────────────
    const badge = document.getElementById('pos-tab-cart-badge');
    if (badge) {
        const count = cart.reduce((s, i) => s + i.cart_qty, 0);
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

async function openPOSItemDetail(productId) {
    const product = await db.products.get(productId);
    if (!product) return;

    const modal = document.getElementById('pos-item-detail-modal');
    const titleEl = document.getElementById('pos-item-detail-title');
    const skuEl = document.getElementById('pos-item-detail-sku');
    const retailEl = document.getElementById('detail-retail-price');
    const stockEl = document.getElementById('detail-stock-qty');
    const specsEl = document.getElementById('detail-specs-list');
    const addBtn = document.getElementById('add-to-cart-detail-btn');

    titleEl.textContent = product.name;
    skuEl.textContent = `SKU: ${product.sku}`;
    retailEl.textContent = `Rs. ${parseFloat(product.retail_price).toLocaleString()}`;
    stockEl.textContent = `${product.stock_qty} Units In Stock`;

    // Build specs list
    let specs = [
        { label: 'Category', value: product.category || 'Uncategorized' },
        { label: 'Warranty', value: product.warranty || 'No Warranty' },
        { label: 'Wholesale', value: `Rs. ${parseFloat(product.wholesale_price).toLocaleString()}` },
        { label: 'Brand/Vendor', value: product.vendor || 'N/A' }
    ];

    specsEl.innerHTML = specs.map(s => `
        <div class="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span class="text-xs text-gray-500 font-bold uppercase tracking-widest">${s.label}</span>
            <span class="text-sm font-black text-gray-900 dark:text-white">${s.value}</span>
        </div>
    `).join('');

    addBtn.setAttribute('onclick', `addToCart(${product.id}); closePOSItemDetail();`);

    // Load Serials
    renderItemSerials(product);

    // Load History
    await renderItemHistory(productId);

    // Show modal
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);

    switchPOSItemTab('info');
}

function renderItemSerials(product) {
    const emptyEl = document.getElementById('item-serials-empty');
    const contentEl = document.getElementById('item-serials-content');
    const listEl = document.getElementById('item-serials-list');

    const serials = product.serial_list || [];

    if (serials.length === 0) {
        emptyEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
    } else {
        emptyEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        listEl.innerHTML = serials.map(s => `
            <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center group hover:border-primary/50 transition-all">
                <i class="fa-solid fa-barcode text-gray-300 dark:text-gray-600 mb-2 group-hover:text-primary transition-colors"></i>
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 break-all select-all">${s}</span>
            </div>
        `).join('');
    }
}

function closePOSItemDetail() {
    const modal = document.getElementById('pos-item-detail-modal');
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function switchPOSItemTab(tab) {
    const infoTab = document.getElementById('tab-item-info');
    const serialsTab = document.getElementById('tab-item-serials');
    const historyTab = document.getElementById('tab-item-history');

    const infoPane = document.getElementById('pane-item-info');
    const serialsPane = document.getElementById('pane-item-serials');
    const historyPane = document.getElementById('pane-item-history');

    // Reset all
    [infoTab, serialsTab, historyTab].forEach(t => {
        if (t) {
            t.classList.remove('border-primary', 'text-primary');
            t.classList.add('border-transparent', 'text-gray-400');
        }
    });
    [infoPane, serialsPane, historyPane].forEach(p => {
        if (p) p.classList.add('hidden');
    });

    if (tab === 'info') {
        infoTab.classList.add('border-primary', 'text-primary');
        infoTab.classList.remove('border-transparent', 'text-gray-400');
        infoPane.classList.remove('hidden');
    } else if (tab === 'serials') {
        serialsTab.classList.add('border-primary', 'text-primary');
        serialsTab.classList.remove('border-transparent', 'text-gray-400');
        serialsPane.classList.remove('hidden');
    } else if (tab === 'history') {
        historyTab.classList.add('border-primary', 'text-primary');
        historyTab.classList.remove('border-transparent', 'text-gray-400');
        historyPane.classList.remove('hidden');
    }
}

async function renderItemHistory(productId) {
    const historyPane = document.getElementById('pane-item-history');
    if (!historyPane) return;

    // Fetch the product master
    const product = await db.products.get(productId);
    if (!product) {
        historyPane.innerHTML = `<p class="text-center py-10 text-gray-400 italic">Product details not found.</p>`;
        return;
    }

    // 1. Fetch Sales History (invoices/completed sales across ALL customers)
    const allSales = await db.sales.reverse().sortBy('date');
    const salesHistory = [];

    allSales.forEach(sale => {
        if (sale.document_type === 'invoice' || sale.document_type === 'sale') {
            const item = (sale.items || []).find(i => i.product_id === productId || i.id === productId);
            if (item) {
                salesHistory.push({
                    date: sale.date,
                    invoice_number: sale.invoice_number || `INV-${sale.id}`,
                    customer_name: sale.customer_name || 'Walk-in Customer',
                    qty: item.qty || item.cart_qty || 0,
                    price: item.price || item.cart_price || 0,
                    warranty: item.warranty || product.warranty || 'N/A',
                    serial: item.serial || ''
                });
            }
        }
    });

    // 2. Fetch Purchase / Stock Inflow History (GRNs)
    const allGRNs = await db.grn.reverse().sortBy('date');
    const purchaseHistory = [];
    allGRNs.forEach(grn => {
        const item = (grn.items || []).find(i => i.product_id === productId || i.id === productId);
        if (item) {
            purchaseHistory.push({
                date: grn.date,
                grn_ref: `GRN-${String(grn.id).padStart(5, '0')}`,
                vendor_name: grn.vendor_name || 'Unknown Supplier',
                qty: item.received_qty || item.qty || 0,
                cost: item.cost || 0
            });
        }
    });

    // 3. Compute KPI Metrics
    // Last Selling Price
    let lastSellPrice = 'N/A';
    let lastSellCustomer = 'No Sales';
    let lastSellDate = 'N/A';
    if (salesHistory.length > 0) {
        const latestSale = salesHistory[0];
        lastSellPrice = parseFloat(latestSale.price).toLocaleString();
        lastSellCustomer = latestSale.customer_name;
        lastSellDate = new Date(latestSale.date).toLocaleDateString();
    }

    // Last Purchase Cost (using GRNs primarily, falling back to product master settings)
    let lastBuyCost = 'N/A';
    let lastBuyVendor = 'N/A';
    let lastBuyDate = 'N/A';
    let lastBuyCostVal = 0;
    if (purchaseHistory.length > 0) {
        const latestBuy = purchaseHistory[0];
        lastBuyCostVal = latestBuy.cost;
        lastBuyCost = parseFloat(latestBuy.cost).toLocaleString();
        lastBuyVendor = latestBuy.vendor_name;
        lastBuyDate = new Date(latestBuy.date).toLocaleDateString();
    } else if (product.cost) {
        lastBuyCostVal = parseFloat(product.cost);
        lastBuyCost = lastBuyCostVal.toLocaleString();
        lastBuyVendor = product.vendor || 'Product Master Cost';
        lastBuyDate = 'Product Master';
    }

    // Margin Calculations
    let marginPercent = 'N/A';
    if (product.retail_price && lastBuyCostVal > 0) {
        const retail = parseFloat(product.retail_price);
        const margin = Math.round(((retail - lastBuyCostVal) / retail) * 100);
        marginPercent = margin + '%';
    }

    // Warranty Helper Functions
    const getWarrantyExpiry = (saleDateStr, warrantyTerm) => {
        if (!warrantyTerm || ['no warranty', 'n/a', 'none', 'na', 'no', ''].includes(warrantyTerm.toLowerCase().trim())) {
            return null;
        }
        const saleDate = new Date(saleDateStr);
        const term = warrantyTerm.toLowerCase().trim();

        const numMatch = term.match(/\d+/);
        if (!numMatch) return null;
        const num = parseInt(numMatch[0]);

        const expiryDate = new Date(saleDate);
        if (term.includes('year')) {
            expiryDate.setFullYear(expiryDate.getFullYear() + num);
        } else if (term.includes('month')) {
            expiryDate.setMonth(expiryDate.getMonth() + num);
        } else if (term.includes('day')) {
            expiryDate.setDate(expiryDate.getDate() + num);
        } else if (term.includes('week')) {
            expiryDate.setDate(expiryDate.getDate() + (num * 7));
        } else {
            expiryDate.setFullYear(expiryDate.getFullYear() + num);
        }
        return expiryDate;
    };

    const isWarrantyActive = (saleDateStr, warrantyTerm) => {
        const expiry = getWarrantyExpiry(saleDateStr, warrantyTerm);
        if (!expiry) return false;
        return expiry >= new Date();
    };

    // Calculate Active Warranties Count
    let activeWarrantiesCount = 0;
    salesHistory.forEach(s => {
        if (isWarrantyActive(s.date, s.warranty)) {
            activeWarrantiesCount += s.qty;
        }
    });

    // 4. Generate Tables Rows HTML
    // Sales rows
    const salesRows = salesHistory.length === 0
        ? `<tr><td colspan="5" class="py-6 text-center text-gray-400 italic">No sales transactions recorded for this item.</td></tr>`
        : salesHistory.map(s => {
            const active = isWarrantyActive(s.date, s.warranty);
            const wBadge = active
                ? `<span class="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold">Active</span>`
                : `<span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded text-[9px] font-medium">Expired</span>`;

            return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors">
                    <td class="py-3 pr-2">
                        <div class="flex flex-col">
                            <span class="font-bold text-gray-900 dark:text-white">${new Date(s.date).toLocaleDateString()}</span>
                            <span class="text-[9px] text-gray-400 uppercase font-mono tracking-tighter">${s.invoice_number}</span>
                        </div>
                    </td>
                    <td class="py-3 px-2">
                        <div class="flex flex-col">
                            <span class="font-bold text-gray-800 dark:text-gray-300 leading-tight">${s.customer_name}</span>
                            ${s.serial ? `<span class="text-[8px] text-gray-400 font-mono">S/N: ${s.serial}</span>` : ''}
                        </div>
                    </td>
                    <td class="py-3 text-center font-bold px-2">${s.qty}</td>
                    <td class="py-3 text-right font-black text-primary px-2">Rs. ${parseFloat(s.price).toLocaleString()}</td>
                    <td class="py-3 text-center pl-2">${wBadge}</td>
                </tr>
            `;
        }).join('');

    // Purchase rows
    const purchaseRows = purchaseHistory.length === 0
        ? `<tr><td colspan="4" class="py-6 text-center text-gray-400 italic">No purchase or goods receipts recorded for this item.</td></tr>`
        : purchaseHistory.map(p => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors">
                <td class="py-3 pr-2">
                    <div class="flex flex-col">
                        <span class="font-bold text-gray-900 dark:text-white">${new Date(p.date).toLocaleDateString()}</span>
                        <span class="text-[9px] text-gray-400 uppercase font-mono tracking-tighter">${p.grn_ref}</span>
                    </div>
                </td>
                <td class="py-3 px-2 font-bold text-gray-800 dark:text-gray-300">${p.vendor_name}</td>
                <td class="py-3 text-center font-bold px-2">${p.qty}</td>
                <td class="py-3 text-right font-black text-indigo-500 pl-2">Rs. ${parseFloat(p.cost).toLocaleString()}</td>
            </tr>
        `).join('');

    // Derive additional data for section 3 (Pricing) and section 5 (Stock & Audit)
    const lastGRNRef = purchaseHistory.length > 0 ? purchaseHistory[0].grn_ref : 'N/A';
    const lastGRNDate = purchaseHistory.length > 0 ? new Date(purchaseHistory[0].date).toLocaleDateString('en-GB') : 'N/A';
    const stockLevel = product.stock_qty ?? 0;
    const stockColor = stockLevel <= 0 ? 'text-red-500' : stockLevel <= 5 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400';

    // 5. Render to DOM
    historyPane.innerHTML = `
        <!-- ── Section Header ──────────────────────────────────── -->
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <i class="fa-solid fa-clock-rotate-left text-primary dark:text-secondary text-sm"></i>
            </div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Intelligence</p>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">${product.name}</p>
            </div>
        </div>

        <!-- ── KPI Cards: Pricing + Warranty ──────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl">
                <p class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Last Selling Price</p>
                <p class="text-lg font-black text-gray-900 dark:text-white leading-none">Rs. ${lastSellPrice}</p>
                <p class="text-[9px] text-gray-500 mt-1.5 font-semibold truncate">${lastSellCustomer}</p>
                <p class="text-[9px] text-gray-400 font-mono">${lastSellDate}</p>
            </div>
            <div class="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
                <p class="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Last Purchase Cost</p>
                <p class="text-lg font-black text-gray-900 dark:text-white leading-none">Rs. ${lastBuyCost}</p>
                <p class="text-[9px] text-gray-500 mt-1.5 font-semibold truncate">${lastBuyVendor}</p>
                <p class="text-[9px] text-gray-400 font-mono">${lastBuyDate}</p>
            </div>
            <div class="p-4 bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800/30 rounded-2xl">
                <p class="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">Gross Margin</p>
                <p class="text-lg font-black text-gray-900 dark:text-white leading-none">${marginPercent}</p>
                <p class="text-[9px] text-gray-500 mt-1.5 font-semibold">Last buy vs retail</p>
                <p class="text-[9px] text-gray-400">Retail: Rs. ${parseFloat(product.retail_price || 0).toLocaleString()}</p>
            </div>
            <div class="p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl">
                <p class="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Warranty Coverage</p>
                <p class="text-base font-black text-gray-900 dark:text-white leading-tight">${product.warranty || 'No Warranty'}</p>
                <p class="text-[9px] text-gray-500 mt-1.5 font-semibold">${activeWarrantiesCount} units active</p>
                <p class="text-[9px] ${activeWarrantiesCount > 0 ? 'text-emerald-500' : 'text-gray-400'} font-black uppercase tracking-widest">${activeWarrantiesCount > 0 ? '● Live Coverage' : '○ No Active Cover'}</p>
            </div>
        </div>

        <!-- ── History Tables ──────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- 1. SALES HISTORY -->
            <div class="bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col">
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200/50 dark:border-gray-800">
                    <h4 class="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-2">
                        <i class="fa-solid fa-cart-shopping text-emerald-500 text-xs"></i> Sales History
                    </h4>
                    <span class="text-[9px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-lg uppercase tracking-widest">${salesHistory.length} Records</span>
                </div>
                <div class="overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800/50">
                                <th class="pb-2 pr-2">Date / Invoice No.</th>
                                <th class="pb-2 px-2">Customer Name</th>
                                <th class="pb-2 text-center px-1">Qty</th>
                                <th class="pb-2 text-right px-1">Price</th>
                                <th class="pb-2 text-center pl-1">Cover</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100/50 dark:divide-gray-800/30">
                            ${salesRows}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 2. PURCHASE HISTORY -->
            <div class="bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col">
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200/50 dark:border-gray-800">
                    <h4 class="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-2">
                        <i class="fa-solid fa-truck-ramp-box text-indigo-500 text-xs"></i> Purchase History
                    </h4>
                    <span class="text-[9px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-lg uppercase tracking-widest">${purchaseHistory.length} GRNs</span>
                </div>
                <div class="overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800/50">
                                <th class="pb-2 pr-2">Date / PO No.</th>
                                <th class="pb-2 px-2">Supplier Name</th>
                                <th class="pb-2 text-center px-1">Qty Recv.</th>
                                <th class="pb-2 text-right pl-1">Unit Cost</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100/50 dark:divide-gray-800/30">
                            ${purchaseRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ── Additional Historical Data (Section 5) ──────────── -->
        <div class="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div class="px-5 py-3 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                <h4 class="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-database text-violet-500 text-xs"></i> Additional Historical Data
                </h4>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-gray-100 dark:divide-gray-800">
                <div class="p-4">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Stock Level</p>
                    <p class="text-lg font-black ${stockColor}">${stockLevel} <span class="text-xs font-bold text-gray-400">Units</span></p>
                    <p class="text-[9px] text-gray-400 mt-0.5 font-mono">${stockLevel <= 0 ? '⚠ Out of Stock' : stockLevel <= 5 ? '⚡ Low Stock' : '✓ In Stock'}</p>
                </div>
                <div class="p-4">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last GRN Reference</p>
                    <p class="text-sm font-black text-gray-900 dark:text-white font-mono">${lastGRNRef}</p>
                    <p class="text-[9px] text-gray-400 mt-0.5 font-mono">${lastGRNDate}</p>
                </div>
                <div class="p-4">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales Volume</p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">${salesHistory.reduce((s, i) => s + i.qty, 0)} <span class="text-xs font-bold text-gray-400">Units</span></p>
                    <p class="text-[9px] text-gray-400 mt-0.5">across ${salesHistory.length} transactions</p>
                </div>
                <div class="p-4">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Procured</p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">${purchaseHistory.reduce((s, i) => s + i.qty, 0)} <span class="text-xs font-bold text-gray-400">Units</span></p>
                    <p class="text-[9px] text-gray-400 mt-0.5">across ${purchaseHistory.length} receipts</p>
                </div>
            </div>
        </div>
    `;
}

async function processPayment() {
    if (cart.length === 0) return;

    const docTypeEl = document.getElementById('pos-doc-type');
    const docType = docTypeEl ? docTypeEl.value : 'invoice';
    const trackingNo = document.getElementById('pos-tracking-number') ? document.getElementById('pos-tracking-number').value : '';
    const poNo = document.getElementById('pos-po-number') ? document.getElementById('pos-po-number').value : '';
    const docDateVal = document.getElementById('pos-doc-date')?.value || new Date().toISOString().split('T')[0];

    // Save to DB
    let sub = 0;
    const items = cart.map(c => {
        sub += c.cart_qty * c.cart_price;
        return {
            product_id: c.id,
            name: c.name,
            qty: c.cart_qty,
            price: c.cart_price,
            cost: c.cost || 0, // Save cost for profit reporting
            total: c.cart_qty * c.cart_price,
            warranty: c.warranty,
            description: c.description || '',
            serial: c.serial
        };
    });

    const payMethod = document.getElementById('pos-pay-method').value;
    const finalTotal = sub - discountAmount + deliveryCharge;

    let selectedBankAccountId = null;
    if ((payMethod === 'bank' || payMethod === 'cheque') && docType === 'invoice') {
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

    let chequeDetails = null;
    if (payMethod === 'cheque' && docType === 'invoice') {
        const { value: formValues } = await Swal.fire({
            title: 'Cheque Payment Details',
            html:
                '<div class="space-y-4 pt-4 text-left">' +
                '  <div class="grid grid-cols-2 gap-4">' +
                '    <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Cheque Number</label>' +
                '    <input id="swal-cheque-num" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs" placeholder="Enter cheque number"></div>' +
                '    <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Cheque Date</label>' +
                '    <input id="swal-cheque-date" type="date" value="' + new Date().toISOString().split('T')[0] + '" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs"></div>' +
                '  </div>' +
                '  <div class="grid grid-cols-2 gap-4">' +
                '    <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Bank Name</label>' +
                '    <input id="swal-bank-name" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs" placeholder="Enter bank name"></div>' +
                '    <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Cheque Amount (Rs.)</label>' +
                '    <input id="swal-cheque-amount" type="number" step="0.01" value="' + finalTotal + '" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs text-primary"></div>' +
                '  </div>' +
                '  <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Cheque Payee / Recipient</label>' +
                '  <input id="swal-cheque-payee" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs" value="' + (currentCustomer ? currentCustomer.name : 'Walk-in Customer') + '" placeholder="Enter payee/recipient name"></div>' +
                '  <div><label class="block text-left text-[10px] font-black uppercase text-gray-400 mb-1.5 ml-1">Notes / Remarks</label>' +
                '  <textarea id="swal-cheque-notes" rows="2" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:border-primary font-bold text-xs resize-none" placeholder="Any extra details..."></textarea></div>' +
                '</div>',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirm Cheque',
            confirmButtonColor: '#4F46E5',
            preConfirm: () => {
                const num = document.getElementById('swal-cheque-num').value.trim();
                const bank = document.getElementById('swal-bank-name').value.trim();
                const date = document.getElementById('swal-cheque-date').value;
                const amt = parseFloat(document.getElementById('swal-cheque-amount').value) || 0;
                const payee = document.getElementById('swal-cheque-payee').value.trim();
                const notes = document.getElementById('swal-cheque-notes').value.trim();
                if (!num || !bank || !date || amt <= 0) {
                    Swal.showValidationMessage('Cheque Number, Bank Name, Date, and a valid positive Amount are required');
                    return false;
                }
                return { cheque_number: num, bank_name: bank, cheque_date: date, cheque_amount: amt, cheque_payee: payee, cheque_notes: notes };
            }
        });

        if (!formValues) return;
        chequeDetails = formValues;
    }

    const quoteValidity = document.getElementById('pos-quote-validity').value;
    const creditDays = document.getElementById('pos-credit-days').value;
    const printerLayout = document.getElementById('pos-printer-layout').value;
    const status = (docType === 'invoice' && !['credit', 'cod', 'cheque'].includes(payMethod)) ? 'paid' : 'unpaid';

    // Validation: Mandatory serials for tracked items
    for (const item of items) {
        const p = await db.products.get(item.product_id);
        if (!p) continue;

        const isWarrantyItem = item.warranty && !['no warranty', 'n/a', 'none', 'na', 'no', ''].includes(item.warranty.toLowerCase().trim());
        const isSerialTracked = !!p.serial_tracked;

        if (docType === 'invoice' && (isWarrantyItem || isSerialTracked) && item.qty > 0) {
            const enteredSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);

            if (enteredSerials.length === 0) {
                showAlert('Serial Required', `Item "${item.name}" requires serial numbers. Please enter them in the cart.`, 'error');
                return;
            }

            if (enteredSerials.length !== item.qty) {
                showAlert('Serial Count Mismatch', `Entered ${enteredSerials.length} serials for "${item.name}", but quantity is ${item.qty}.`, 'error');
                return;
            }

            for (const sn of enteredSerials) {
                if (!p.serial_list || !p.serial_list.includes(sn)) {
                    showAlert('Wrong Serial Number', `The serial number "${sn}" for product "${item.name}" is not recognized or not in stock.`, 'error');
                    return;
                }
            }
        }
    }

    try {
        const saleId = await db.transaction('rw', db.sales, db.products, db.ledger, db.accounts, db.customers, db.customer_reminders, db.bank_accounts, db.bank_transactions, async () => {
            let id;
            if (editingSaleId) {
                const oldSale = await db.sales.get(editingSaleId);

                // Reverse old stock if it was an invoice or sales_order
                if (oldSale && (oldSale.document_type === 'invoice' || oldSale.document_type === 'sales_order')) {
                    // 1. Reverse Stock
                    for (let item of (oldSale.items || [])) {
                        if (!item.product_id) continue;
                        const p = await db.products.get(item.product_id);
                        if (p) {
                            let newSerialList = [...(p.serial_list || [])];
                            const oldSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
                            oldSerials.forEach(sn => {
                                if (!newSerialList.includes(sn)) newSerialList.push(sn);
                            });

                            await db.products.update(item.product_id, {
                                stock_qty: p.stock_qty + item.qty,
                                serial_list: newSerialList
                            });
                        }
                    }

                    // 2. Reverse Customer Balance (only if it was a credit sale)
                    if (oldSale.payment_type === 'credit' && oldSale.customer_id) {
                        const customer = await db.customers.get(oldSale.customer_id);
                        if (customer) {
                            await db.customers.update(oldSale.customer_id, {
                                current_balance: (customer.current_balance || 0) - oldSale.total
                            });
                        }
                    }

                    // 3. Delete old ledger entries
                    await db.ledger.filter(l => l.reference_id === editingSaleId && l.reference_type === 'Sale').delete();
                }

                await db.sales.update(editingSaleId, {
                    customer_name: currentCustomer ? currentCustomer.name : 'Walk-in',
                    customer_id: currentCustomer ? currentCustomer.id : null,
                    items: items,
                    subtotal: sub,
                    discount: discountAmount,
                    delivery_charge: deliveryCharge,
                    total: finalTotal,
                    type: currentMode,
                    document_type: docType,
                    status: status,
                    payment_type: docType === 'invoice' ? payMethod : null,
                    paid_amount: (docType === 'invoice' && !['credit', 'cod'].includes(payMethod)) ? finalTotal : 0,
                    validity: docType === 'quote' ? quoteValidity : null,
                    credit_days: (docType === 'invoice' && payMethod === 'credit') ? parseInt(creditDays) : null,
                    printer_layout: printerLayout,
                    ship_to: document.getElementById('pos-ship-to').value,
                    tracking_number: trackingNo || null,
                    po_number: poNo || null,
                    cheque_number: chequeDetails ? chequeDetails.cheque_number : null,
                    bank_name: chequeDetails ? chequeDetails.bank_name : null,
                    cheque_date: chequeDetails ? chequeDetails.cheque_date : null,
                    cheque_amount: chequeDetails ? chequeDetails.cheque_amount : null,
                    cheque_payee: chequeDetails ? chequeDetails.cheque_payee : null,
                    cheque_notes: chequeDetails ? chequeDetails.cheque_notes : null,
                    rep_name: typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'Admin',
                    rep_contact_number: typeof currentUser !== 'undefined' && currentUser ? (currentUser.contact_number || '') : ''
                });
                id = editingSaleId;
            } else {
                const docDate = new Date(docDateVal + 'T' + new Date().toTimeString().split(' ')[0]);
                id = await db.sales.add({
                    date: docDate.toISOString(),
                    customer_name: currentCustomer ? currentCustomer.name : 'Walk-in',
                    customer_id: currentCustomer ? currentCustomer.id : null,
                    items: items,
                    subtotal: sub,
                    discount: discountAmount,
                    delivery_charge: deliveryCharge,
                    total: finalTotal,
                    type: currentMode,
                    document_type: docType,
                    status: status,
                    payment_type: docType === 'invoice' ? payMethod : null,
                    paid_amount: (docType === 'invoice' && !['credit', 'cod'].includes(payMethod)) ? finalTotal : 0,
                    validity: docType === 'quote' ? quoteValidity : null,
                    credit_days: (docType === 'invoice' && payMethod === 'credit') ? parseInt(creditDays) : null,
                    printer_layout: printerLayout,
                    ship_to: document.getElementById('pos-ship-to').value,
                    tracking_number: trackingNo || null,
                    po_number: poNo || null,
                    cheque_number: chequeDetails ? chequeDetails.cheque_number : null,
                    bank_name: chequeDetails ? chequeDetails.bank_name : null,
                    cheque_date: chequeDetails ? chequeDetails.cheque_date : null,
                    cheque_amount: chequeDetails ? chequeDetails.cheque_amount : null,
                    cheque_payee: chequeDetails ? chequeDetails.cheque_payee : null,
                    cheque_notes: chequeDetails ? chequeDetails.cheque_notes : null,
                    rep_name: typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'Admin',
                    rep_contact_number: typeof currentUser !== 'undefined' && currentUser ? (currentUser.contact_number || '') : '',
                    invoice_number: await getNextInvoiceNumber(docType)
                });
            }

            // Update Stock only for physical movement (Invoice, Delivery Note, Web Order)
            // Sales Order and Quotes do NOT reduce physical stock available
            if (['invoice', 'delivery_note', 'web_order'].includes(docType)) {
                for (let item of items) {
                    if (!item.product_id) continue;
                    const p = await db.products.get(item.product_id);
                    if (p) {
                        // Handle Bundle Stock Deduction
                        if (p.product_type === 'bundle') {
                            for (let bundleItem of (p.bundle_items || [])) {
                                const bp = await db.products.get(bundleItem.product_id);
                                if (bp) {
                                    await db.products.update(bundleItem.product_id, {
                                        stock_qty: bp.stock_qty - (item.qty * bundleItem.qty)
                                    });
                                }
                            }
                        }

                        // Normal Stock Deduction (including Variable parents if they track stock, 
                        // though usually variations track stock)
                        // Handle Variation Stock Deduction
                        if (item.is_variation) {
                            const parent = await db.products.get(item.parent_id);
                            if (parent && parent.variations && parent.variations[item.variation_index]) {
                                parent.variations[item.variation_index].stock -= item.qty;
                                await db.products.update(item.parent_id, {
                                    variations: parent.variations
                                });
                            }
                        }

                        // Normal Stock Deduction (for simple products and parent items)
                        // If it's a variation, we don't deduct from the parent's general stock_qty 
                        // unless specifically intended. In this UI, we treat variations as the stock holders.
                        if (!item.is_variation) {
                            let newSerialList = [...(p.serial_list || [])];
                            const usedSerials = (item.serial || '').split(/[\n,]+/).map(s => s.trim()).filter(s => s);
                            newSerialList = newSerialList.filter(sn => !usedSerials.includes(sn));

                            await db.products.update(item.product_id, {
                                stock_qty: p.stock_qty - item.qty,
                                serial_list: newSerialList
                            });
                        }

                        // Create Resale Reminder
                        if (docType === 'invoice' && p.resale_reminder && currentCustomer && currentCustomer.id) {
                            const remDate = new Date();
                            remDate.setDate(remDate.getDate() + (p.resale_days || 0));

                            await db.customer_reminders.add({
                                customer_id: currentCustomer.id,
                                customer_name: currentCustomer.name,
                                customer_phone: currentCustomer.phone || '',
                                customer_email: currentCustomer.email || '',
                                item_name: p.name,
                                invoice_id: id,
                                reminder_date: remDate.toISOString(),
                                status: 'pending'
                            });
                        }
                    }
                }
            }

            // --- ACCOUNTING INTEGRATION ---
            // Only record financial transactions for final sales (Invoice or Web Order)
            if (typeof recordTransaction === 'function' && (docType === 'invoice' || docType === 'web_order')) {
                const accounts = await db.accounts.toArray();
                const getAccId = (code) => accounts.find(a => a.code === code)?.id;

                // 1. Credit Sales & Service Income
                const itemSubtotal = sub - discountAmount;
                await recordTransaction(getAccId('4000'), itemSubtotal, 'credit', `Sale Invoice #${id}`, 'Sale', id);
                if (deliveryCharge > 0) {
                    await recordTransaction(getAccId('4100'), deliveryCharge, 'credit', `Delivery Charge for Invoice #${id}`, 'Sale', id);
                }

                // 2. Debit Payment Method
                if (payMethod === 'cash' || payMethod === 'qr') {
                    await recordTransaction(getAccId('1000'), finalTotal, 'debit', `${payMethod.toUpperCase()} Payment #${id}`, 'Sale', id);
                } else if (['card', 'bank', 'koko', 'mintpay', 'payzy', 'cheque'].includes(payMethod)) {
                    const methodLabels = { 'card': 'Card', 'bank': 'Bank Transfer', 'koko': 'Koko', 'mintpay': 'Mintpay', 'payzy': 'Payzy', 'cheque': 'Cheque' };
                    const descSuffix = payMethod === 'cheque' && chequeDetails ? ` (${chequeDetails.cheque_number} - Date: ${chequeDetails.cheque_date})` : '';
                    await recordTransaction(getAccId('1010'), finalTotal, 'debit', `${methodLabels[payMethod]} Payment #${id}${descSuffix}`, 'Sale', id);
                } else if (payMethod === 'credit' || payMethod === 'cod') {
                    const label = payMethod === 'credit' ? 'Credit Sale' : 'COD Sale (Awaiting Payment)';
                    await recordTransaction(getAccId('1200'), finalTotal, 'debit', `${label} #${id}`, 'Sale', id);
                    // Update Customer Balance — re-fetch from DB to avoid stale in-memory value
                    if (currentCustomer) {
                        const freshCustomer = await db.customers.get(currentCustomer.id);
                        if (freshCustomer) {
                            const newBal = (parseFloat(freshCustomer.current_balance) || 0) + finalTotal;
                            await db.customers.update(currentCustomer.id, { current_balance: newBal });
                        }
                    }
                }

                // 3. COGS & Inventory
                const totalCost = items.reduce((sum, i) => sum + (i.cost * i.qty), 0);
                if (totalCost > 0) {
                    await recordTransaction(getAccId('5000'), totalCost, 'debit', `COGS for Sale #${id}`, 'Sale', id);
                    await recordTransaction(getAccId('1300'), totalCost, 'credit', `Inventory reduction #${id}`, 'Sale', id);
                }

                // 4. Bank Balance Update & Detailed Transaction Breakdown
                if (selectedBankAccountId && (payMethod === 'bank' || payMethod === 'cheque')) {
                    const methodLabel = payMethod === 'bank' ? 'Bank Transfer' : 'Cheque Deposit';
                    const ref = `Invoice #${id}`;
                    const descSuffix = payMethod === 'cheque' && chequeDetails ? ` (Cheque No: ${chequeDetails.cheque_number}, Bank: ${chequeDetails.bank_name}, Date: ${chequeDetails.cheque_date})` : '';
                    const desc = `${methodLabel} Payment for ${ref}${descSuffix}`;

                    await recordBankTransaction(
                        selectedBankAccountId,
                        'inward',
                        methodLabel,
                        finalTotal,
                        ref,
                        desc,
                        docDateVal
                    );
                }
            }
            return id;
        });

        // SYNC TO WOOCOMMERCE - Outside Transaction for stability
        if (docType === 'invoice' || docType === 'sales_order') {
            for (let item of items) {
                if (!item.product_id) continue;
                const p = await db.products.get(item.product_id);
                if (p && p.woo_id && typeof syncStockToWoo === 'function') {
                    syncStockToWoo(item.product_id, p.stock_qty).catch(e => console.error("Woo stock sync fail:", e));
                }
            }
        }

        showAlert('Success', editingSaleId ? 'Document updated!' : 'Document saved!', 'success');

        // --- PRINTING ---
        if (typeof printInvoice === 'function') {
            printInvoice(saleId, printerLayout, true);
        }

        cart = [];
        discountAmount = 0;
        deliveryCharge = 0;
        currentCustomer = null;
        editingSaleId = null;
        document.getElementById('customer-lbl').textContent = 'Walk-in Customer';
        document.getElementById('btn-pay').innerHTML = `<i class="fa-solid fa-check-double mr-2"></i> Save / Checkout`;
        renderCart();
        renderProductGrid();

        if (typeof logActivity === 'function') await logActivity(`Processed Sale #${saleId} - Total: ${formatCurrency(finalTotal)}`);

    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to save transaction/document: ' + err.message, 'error');
    }
}

function promptDeliveryCharge() {
    if (cart.length === 0) return;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Add Delivery Charge',
            input: 'number',
            inputLabel: 'Amount in Rs.',
            inputValue: deliveryCharge || '',
            showCancelButton: true,
            confirmButtonColor: '#4F46E5',
            inputValidator: (value) => {
                if (value < 0) {
                    return 'Charge cannot be negative!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                deliveryCharge = parseFloat(result.value) || 0;
                renderCart();
            }
        });
    } else {
        const res = prompt('Enter delivery charge in Rs:', deliveryCharge);
        if (res !== null && !isNaN(res)) {
            deliveryCharge = parseFloat(res);
            renderCart();
        }
    }
}

// QR Code Payment Helper
function showQRPayment() {
    let subtotal = 0;
    cart.forEach(c => { subtotal += c.cart_qty * c.cart_price; });
    let total = subtotal - discountAmount + deliveryCharge;
    if (total <= 0) {
        showAlert('QR Error', 'Cart total must be greater than 0 to generate QR.', 'error');
        return;
    }

    // Using a dynamic UPI link format for generalization
    const upiLink = `upi://pay?pa=store@upi&pn=MobileMate&am=${total}&cu=LKR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&margin=10`;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `Scan to Pay Rs. ${total.toLocaleString()}`,
            html: `<div class="flex flex-col items-center justify-center p-4"><img src="${qrUrl}" class="w-56 h-56 rounded-xl shadow-lg border border-gray-200 p-2 bg-white object-contain"></div><p class="mt-2 text-sm text-gray-500">Awaiting customer scan...</p>`,
            confirmButtonText: 'Done / Paid',
            confirmButtonColor: '#10B981',
            showCancelButton: true,
            cancelButtonText: 'Switch Payment Method'
        }).then((res) => {
            if (!res.isConfirmed) {
                // switch back to cash if dismissed explicitly via cancel
                const el = document.getElementById('pos-pay-method');
                if (el && el.value === 'qr') el.value = 'cash';
            }
        });
    }
}

// Global Barcode Scanner Listener
let _posBcBuffer = '';
let _posBcTimeout = null;
document.addEventListener('keypress', (e) => {
    const posView = document.getElementById('pos-view');
    // Ensure POS is active and we're not inside it already focused on something else like a dialog
    if (!posView || posView.classList.contains('hidden')) return;

    // Ignore if typing inside any input EXCEPT the pos-search
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.target.id !== 'pos-search') return;
    }

    if (e.key === 'Enter') {
        if (_posBcBuffer.length >= 2) {
            handleSearch(_posBcBuffer);
            _posBcBuffer = '';
        }
    } else {
        _posBcBuffer += e.key;
        clearTimeout(_posBcTimeout);
        // Scanners act precisely very fast, typically 10-30ms per character
        _posBcTimeout = setTimeout(() => { _posBcBuffer = ''; }, 75);
    }
});

function togglePayMethod() {
    const docType = document.getElementById('pos-doc-type').value;
    const payMethod = document.getElementById('pos-pay-method').value;
    const payWrap = document.getElementById('pos-pay-wrap');
    const quoteWrap = document.getElementById('pos-quote-validity-wrap');
    const creditWrap = document.getElementById('pos-credit-days-wrap');

    if (!payWrap || !quoteWrap || !creditWrap) return;

    if (docType !== 'invoice') {
        payWrap.classList.add('hidden');
    } else {
        payWrap.classList.remove('hidden');
    }

    if (docType === 'quote') {
        quoteWrap.classList.remove('hidden');
    } else {
        quoteWrap.classList.add('hidden');
    }

    if (docType === 'invoice' && payMethod === 'credit') {
        creditWrap.classList.remove('hidden');
    } else {
        creditWrap.classList.add('hidden');
    }
}

// Centralized Customer Form Logic
document.addEventListener('DOMContentLoaded', () => {
    const custTerms = document.getElementById('cust-terms');
    if (custTerms) {
        custTerms.addEventListener('change', (e) => {
            const creditWrapper = document.getElementById('credit-options');
            const saveBtn = document.getElementById('cust-save-btn');
            if (e.target.value === 'credit') {
                creditWrapper.classList.remove('hidden');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            } else {
                creditWrapper.classList.add('hidden');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    }
});

async function refreshCartHistory() {
    if (!currentCustomer || cart.length === 0) {
        cart.forEach(c => {
            c.last_purchase_price = null;
            c.last_purchase_date = null;
        });
        return;
    }

    const allSales = await db.sales.where('customer_id').equals(currentCustomer.id).reverse().sortBy('date');

    cart.forEach(c => {
        c.last_purchase_price = null;
        c.last_purchase_date = null;
        for (const sale of allSales) {
            const item = sale.items.find(i => i.product_id === c.id || i.id === c.id);
            if (item) {
                c.last_purchase_price = item.price || item.cart_price;
                c.last_purchase_date = sale.date;
                break;
            }
        }
    });
}

async function holdInvoice() {
    if (cart.length === 0) {
        showAlert('Empty Cart', 'Cannot hold an empty invoice.', 'warning');
        return;
    }

    const data = {
        date: new Date().toISOString(),
        customer_id: currentCustomer ? currentCustomer.id : null,
        customer_name: currentCustomer ? currentCustomer.name : 'Walk-in Customer',
        cart: JSON.parse(JSON.stringify(cart)),
        discountAmount: discountAmount,
        currentMode: currentMode,
        docType: document.getElementById('pos-doc-type').value,
        payMethod: document.getElementById('pos-pay-method').value
    };

    try {
        await db.held_invoices.add(data);
        showAlert('Invoice Held', 'The current transaction has been put on hold.', 'success');
        clearCart();
    } catch (err) {
        console.error("Hold Invoice Error:", err);
        showAlert('Error', 'Failed to hold invoice.', 'error');
    }
}

async function showHeldInvoices() {
    const held = await db.held_invoices.toArray();

    let heldListHtml = held.map(h => `
        <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-all group">
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-900 dark:text-white">${h.customer_name}</span>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-700 px-2 py-0.5 rounded">${h.docType}</span>
                </div>
                <p class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-black">
                    <i class="fa-solid fa-clock mr-1"></i> ${new Date(h.date).toLocaleString()} | ${h.cart.length} items
                </p>
            </div>
            <div class="flex gap-2">
                <button onclick="recallHeldInvoice(${h.id})" class="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Recall</button>
                <button onclick="deleteHeldInvoice(${h.id})" class="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    if (held.length === 0) {
        heldListHtml = '<p class="text-center text-gray-500 py-8 font-bold">No held invoices found.</p>';
    }

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Held Invoices',
            html: `<div class="space-y-3 mt-4 text-left max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">${heldListHtml}</div>`,
            showConfirmButton: false,
            showCloseButton: true,
            width: '500px'
        });
    } else {
        alert('Recall functionality requires SweetAlert2.');
    }
}

async function recallHeldInvoice(id) {
    const held = await db.held_invoices.get(id);
    if (!held) return;

    if (cart.length > 0) {
        const confirm = await Swal.fire({
            title: 'Unsaved Changes',
            text: 'Current cart will be cleared. Continue?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Recall',
            cancelButtonText: 'Cancel'
        });
        if (!confirm.isConfirmed) return;
    }

    cart = held.cart;
    currentCustomer = held.customer_id ? await db.customers.get(held.customer_id) : null;
    discountAmount = held.discountAmount || 0;
    currentMode = held.currentMode || 'retail';

    const docTypeEl = document.getElementById('pos-doc-type');
    if (docTypeEl) docTypeEl.value = held.docType || 'invoice';

    const payMethodEl = document.getElementById('pos-pay-method');
    if (payMethodEl) payMethodEl.value = held.payMethod || 'cash';

    if (currentCustomer) {
        let ptsText = '';
        if (typeof getCustomerLoyalty === 'function') {
            const loyalty = await getCustomerLoyalty(currentCustomer.id);
            ptsText = ` ⭐ ${loyalty.points} pts`;
        }
        document.getElementById('customer-lbl').innerHTML = `${currentCustomer.name} <span class="text-[10px] text-amber-500 font-bold ml-1">${ptsText}</span>`;
    } else {
        document.getElementById('customer-lbl').innerHTML = 'Walk-in Customer';
    }

    await refreshCartHistory();
    switchMode(currentMode);
    renderCart();

    await db.held_invoices.delete(id);
    Swal.close();
    showAlert('Success', 'Invoice recalled successfully.', 'success');
}

async function deleteHeldInvoice(id) {
    const confirm = await Swal.fire({
        title: 'Delete Held Invoice?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        confirmButtonText: 'Yes, Delete'
    });

    if (confirm.isConfirmed) {
        await db.held_invoices.delete(id);
        showHeldInvoices(); // Refresh list
    }
}
