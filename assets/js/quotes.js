// Sales Quotations logic

async function loadQuotes() {
    console.log("Loading Quotes view...");
    const container = document.getElementById('quotes-view');
    if (!container) return;

    // Default dates: Today
    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    // Fetch stats for the header
    const allQuotes = await db.sales.where('document_type').equals('quote').toArray();
    const totalQty = allQuotes.length;
    const totalVal = allQuotes.reduce((sum, q) => sum + (q.total || 0), 0);

    // Quotes expiring in next 48 hours would be nice, but for now just active ones
    const activeQuotes = allQuotes.filter(q => q.status !== 'converted');

    const html = `
        <div class="space-y-6 pb-10">
            <!-- Real-Time Summary Section -->
            <div id="quotes-summary-container" class="bg-white dark:bg-darkCard px-8 py-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm">
                <!-- Populated by renderSalesList -->
                <div class="flex items-center justify-center py-4">
                    <i class="fa-solid fa-circle-notch fa-spin text-primary opacity-40"></i>
                </div>
            </div>

            <!-- Table Section -->
            <div class="bg-white dark:bg-darkCard rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden flex flex-col">
                <div class="p-6 md:p-8 border-b border-gray-50 dark:border-darkBorder flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-darkCard relative z-10">
                    <div>
                        <h2 class="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Sales Estimations</h2>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage and track your outgoing proposals</p>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus-within:border-primary/30 rounded-2xl px-4 py-2 shadow-inner transition-all">
                            <i class="fa-solid fa-calendar-alt text-gray-400 text-sm"></i>
                            <input type="date" id="quotes-start-date" value="${firstDay}" class="bg-transparent border-none text-xs font-bold dark:text-white focus:ring-0 w-28">
                            <span class="text-gray-400 text-xs font-bold">to</span>
                            <input type="date" id="quotes-end-date" value="${lastDay}" class="bg-transparent border-none text-xs font-bold dark:text-white focus:ring-0 w-28">
                        </div>
                        <div class="relative group">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm group-focus-within:text-primary transition-colors"></i>
                            <input type="text" id="quotes-search" 
                                class="pl-11 pr-5 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary/30 rounded-2xl text-sm font-medium text-gray-900 dark:text-white w-full md:w-72 outline-none transition-all shadow-inner" 
                                placeholder="Search by Client or ID...">
                        </div>
                        <button onclick="if(typeof openSalesDocModal === 'function') openSalesDocModal('quote'); else { preselectedDocType='quote'; document.querySelector('[data-target=pos-view]').click(); }" 
                            class="bg-primary hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
                            <i class="fa-solid fa-plus-circle text-lg"></i>
                            <span>New Quote</span>
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-10">
                            <tr>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800">Proposal #</th>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800">Issued On</th>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800">Proponent / Client</th>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800">Duration</th>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800 text-right">Valuation</th>
                                <th class="p-6 border-b border-gray-100 dark:border-gray-800 text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody id="quotes-list" class="divide-y divide-gray-50 dark:divide-gray-800/50">
                            <!-- Populated by renderSalesList -->
                        </tbody>
                    </table>
                </div>
                
                <div id="quotes-pagination" class="p-6 border-t border-gray-50 dark:border-darkBorder bg-gray-50/30 dark:bg-darkBg/30 flex justify-between items-center hidden">
                     <!-- Pagination will be added here if needed -->
                </div>
            </div>
        </div>`;

    container.innerHTML = html;

    const triggerSearch = () => {
        const query = document.getElementById('quotes-search').value;
        const start = document.getElementById('quotes-start-date').value;
        const end = document.getElementById('quotes-end-date').value;
        renderSalesList(query, 'quotes', start, end);
    };

    document.getElementById('quotes-search').addEventListener('input', triggerSearch);
    document.getElementById('quotes-start-date').addEventListener('change', triggerSearch);
    document.getElementById('quotes-end-date').addEventListener('change', triggerSearch);

    renderSalesList('', 'quotes', firstDay, lastDay);
}