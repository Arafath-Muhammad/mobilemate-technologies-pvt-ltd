/**
 * Advanced Calculator Module
 * Handles VAT breakdowns and Discount calculations
 */

function initCalculator() {
    const container = document.getElementById('calculator-view');
    if (!container) return;

    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Advanced Financial Calculator</h1>
                    <p class="text-gray-500 text-sm">VAT Breakdowns, Discounts, and Margin Calculations</p>
                </div>
                <div class="p-3 bg-rose-500/10 rounded-2xl">
                    <i class="fa-solid fa-square-root-variable text-2xl text-rose-500"></i>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- VAT Splitter Card -->
                <div class="bg-white dark:bg-darkCard rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder p-6 space-y-4">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <i class="fa-solid fa-percent"></i>
                        </div>
                        <h3 class="font-bold text-lg">VAT Breakdown (Reverse VAT)</h3>
                    </div>
                    <p class="text-xs text-gray-500">Split a total amount into its base price and VAT component.</p>
                    
                    <div class="space-y-4 pt-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Total Inclusive Amount</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                                <input type="number" id="vat-total-input" oninput="calculateVATBreakdown()" 
                                    class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                    placeholder="0.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">VAT Percentage (%)</label>
                            <input type="number" id="vat-percent-input" oninput="calculateVATBreakdown()" value="18"
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                placeholder="18">
                        </div>

                        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3 mt-4 border border-dashed border-gray-200 dark:border-gray-700">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Base Price (Exclusive):</span>
                                <span id="vat-base-display" class="font-bold text-gray-900 dark:text-white">Rs. 0.00</span>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">VAT Amount:</span>
                                <span id="vat-amount-display" class="font-bold text-secondary">Rs. 0.00</span>
                            </div>
                            <div class="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <span class="text-xs font-bold uppercase text-gray-400">Total Check:</span>
                                <span id="vat-check-display" class="font-black text-primary">Rs. 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Discount Calculator Card -->
                <div class="bg-white dark:bg-darkCard rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder p-6 space-y-4">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <i class="fa-solid fa-tags"></i>
                        </div>
                        <h3 class="font-bold text-lg">Discount Wizard</h3>
                    </div>
                    <p class="text-xs text-gray-500">Calculate final price after applying % or fixed discounts.</p>

                    <div class="space-y-4 pt-2">
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Subtotal</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                                <input type="number" id="disc-subtotal-input" oninput="calculateDiscountResult()" 
                                    class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                    placeholder="0.00">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Discount (%)</label>
                                <input type="number" id="disc-percent-input" oninput="calculateDiscountResult('percent')"
                                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                    placeholder="0%">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Fixed Discount (Rs.)</label>
                                <input type="number" id="disc-fixed-input" oninput="calculateDiscountResult('fixed')"
                                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                    placeholder="0.00">
                            </div>
                        </div>

                        <div class="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 space-y-3 mt-4 border border-dashed border-amber-200 dark:border-amber-900/30">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Total Discount:</span>
                                <span id="disc-saved-display" class="font-bold text-amber-600">- Rs. 0.00</span>
                            </div>
                            <div class="pt-2 border-t border-amber-200 dark:border-amber-900/30 flex justify-between items-center">
                                <span class="text-xs font-bold uppercase text-gray-400 text-amber-900">Final Total:</span>
                                <span id="disc-final-display" class="font-black text-gray-900 dark:text-white">Rs. 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Margin & Markup Tool -->
            <div class="bg-white dark:bg-darkCard rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <i class="fa-solid fa-arrow-up-right-dots"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg">Profit Margin Tool</h3>
                        <p class="text-xs text-gray-500">Calculate markups and selling prices based on desired margins.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Cost Price</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                            <input type="number" id="margin-cost-input" oninput="calculateMarginResult()" 
                                class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                                placeholder="0.00">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Desired Margin (%)</label>
                        <input type="number" id="margin-percent-input" oninput="calculateMarginResult()" 
                            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl outline-none transition-all" 
                            placeholder="20">
                    </div>
                    <div class="flex items-end">
                        <div class="w-full bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 flex justify-between items-center border border-emerald-100 dark:border-emerald-900/20">
                            <div class="leading-none">
                                <span class="text-[10px] uppercase font-bold text-emerald-600 block mb-1">Suggested Selling Price</span>
                                <span id="margin-sell-display" class="text-xl font-black text-gray-900 dark:text-white">Rs. 0.00</span>
                            </div>
                            <div class="text-right">
                                <span class="text-[10px] uppercase font-bold text-gray-400 block">Total Profit</span>
                                <span id="margin-profit-display" class="font-bold text-emerald-50 text-emerald-600 block">Rs. 0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * VAT Breakdown logic
 * Split Total into Base + VAT
 */
function calculateVATBreakdown() {
    const total = parseFloat(document.getElementById('vat-total-input').value) || 0;
    const vatRate = parseFloat(document.getElementById('vat-percent-input').value) || 0;

    // Formula: Total = Base * (1 + (Rate/100))
    // Base = Total / (1 + (Rate/100))
    const base = total / (1 + (vatRate / 100));
    const vatAmount = total - base;

    document.getElementById('vat-base-display').innerText = `Rs. ${base.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('vat-amount-display').innerText = `Rs. ${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('vat-check-display').innerText = `Rs. ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Discount Calculator Logic
 */
function calculateDiscountResult(trigger = '') {
    const subtotal = parseFloat(document.getElementById('disc-subtotal-input').value) || 0;
    let discPercent = parseFloat(document.getElementById('disc-percent-input').value) || 0;
    let discFixed = parseFloat(document.getElementById('disc-fixed-input').value) || 0;

    // If one is adjusted, recalculate based on subtotal or keep both additive?
    // Let's make them additive for flexibility as "Total Amount can have multiple discounts"
    // OR, if the user fills Percent, we calculate Fixed. If they fill Fixed, we calculate Percent.
    // Let's do linked calculation if possible, or just ADDITIVE.
    // Fixed logic: If Percent changed, update Fixed to match that percent of subtotal.
    if (trigger === 'percent' && subtotal > 0) {
        discFixed = (subtotal * discPercent) / 100;
        document.getElementById('disc-fixed-input').value = discFixed.toFixed(2);
    } else if (trigger === 'fixed' && subtotal > 0) {
        discPercent = (discFixed / subtotal) * 100;
        document.getElementById('disc-percent-input').value = discPercent.toFixed(1);
    }

    const totalDisc = discFixed; // Since we linked them, fixed is the final amount
    const finalTotal = subtotal - totalDisc;

    document.getElementById('disc-saved-display').innerText = `- Rs. ${totalDisc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('disc-final-display').innerText = `Rs. ${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Profit Margin calculation
 */
function calculateMarginResult() {
    const cost = parseFloat(document.getElementById('margin-cost-input').value) || 0;
    const margin = parseFloat(document.getElementById('margin-percent-input').value) || 0;

    // Use Markup logic as this is what most retail users expect when they input "margin"
    // Selling Price = Cost * (1 + Margin/100)
    const sellPrice = cost * (1 + (margin / 100));
    const profit = sellPrice - cost;

    document.getElementById('margin-sell-display').innerText = `Rs. ${sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('margin-profit-display').innerText = `Rs. ${profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Hook into the navigation system
document.addEventListener('DOMContentLoaded', () => {
    const navBtn = document.querySelector('[data-target="calculator-view"]');
    if (navBtn) {
        navBtn.addEventListener('click', initCalculator);
    }
});
