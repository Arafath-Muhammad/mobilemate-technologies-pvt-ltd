// RMA Tracking logic

async function loadRMA() {
    console.log("Loading RMA view...");
    const container = document.getElementById('rma-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden h-full flex flex-col">
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">RMA Tracking</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track warranty claims and service requests.</p>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <i class="fa-solid fa-calendar-alt text-primary text-sm ml-2"></i>
                        <input type="date" id="rma-start-date" value="${firstDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                        <span class="text-gray-300 font-black">/</span>
                        <input type="date" id="rma-end-date" value="${lastDay}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="rma-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-56 transition-colors" placeholder="Search RMA...">
                    </div>
                    <button onclick="openReturnModal('rma')" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> New RMA
                    </button>
                </div>
            </div>
            <div id="rma-summary-container" class="px-6 py-4 bg-gray-50/30 dark:bg-darkBg/20 border-b border-gray-100 dark:border-darkBorder">
                <!-- Summary Stats will be injected here -->
            </div>
            <div class="flex-1 overflow-auto custom-scrollbar p-0">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">RMA ID</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Date</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Original Ref</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Status</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="rma-list" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard"></tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

    const refreshRMA = () => {
        const query = document.getElementById('rma-search')?.value || '';
        const start = document.getElementById('rma-start-date')?.value || '';
        const end = document.getElementById('rma-end-date')?.value || '';
        renderReturnsList(query, 'rma', start, end);
    };

    document.getElementById('rma-search').addEventListener('input', refreshRMA);
    document.getElementById('rma-start-date').addEventListener('change', refreshRMA);
    document.getElementById('rma-end-date').addEventListener('change', refreshRMA);
    
    renderReturnsList('', 'rma', firstDay, lastDay);
}
