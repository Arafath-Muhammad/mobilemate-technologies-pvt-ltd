// HR Management & Payroll Logic
let currentHRTab = 'staff';
const payrollSystem = new PayrollController(db);

async function loadHR() {
    console.log("Loading HR view...");
    const container = document.getElementById('hr-view');
    if (!container) return;

    const html = `
        <div class="space-y-6 pb-10">
            <!-- HR Navigation Tabs -->
            <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-x-auto no-scrollbar sticky top-16 z-30 backdrop-blur-md">
                <button onclick="switchHRTab('staff')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="staff">
                    <i class="fa-solid fa-users"></i> Staff List
                </button>
                <button onclick="switchHRTab('attendance')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'attendance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="attendance">
                    <i class="fa-solid fa-calendar-check"></i> Attendance
                </button>
                <button onclick="switchHRTab('leave')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'leave' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="leave">
                    <i class="fa-solid fa-plane-departure"></i> Leave
                </button>
                <button onclick="switchHRTab('earnings')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'earnings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="earnings">
                    <i class="fa-solid fa-sack-dollar"></i> Earnings
                </button>
                <button onclick="switchHRTab('loans')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'loans' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="loans">
                    <i class="fa-solid fa-hand-holding-dollar"></i> Loans
                </button>
                <button onclick="switchHRTab('payroll')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'payroll' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="payroll">
                    <i class="fa-solid fa-file-invoice-dollar"></i> Payroll
                </button>
                <button onclick="switchHRTab('performance')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'performance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="performance">
                    <i class="fa-solid fa-chart-line"></i> Performance
                </button>
                <button onclick="switchHRTab('recruitment')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'recruitment' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="recruitment">
                    <i class="fa-solid fa-user-plus"></i> Recruitment & Assets
                </button>
                <button onclick="switchHRTab('reports')" class="hr-tab-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentHRTab === 'reports' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}" data-tab="reports">
                    <i class="fa-solid fa-file-contract"></i> Gov. Reports
                </button>
            </div>

            <div id="hr-tab-content" class="animate-fade-in px-2">
                <!-- Content will be injected based on active tab -->
            </div>
        </div>
    `;

    container.innerHTML = html;
    renderHRTab(currentHRTab);
}

function switchHRTab(tab) {
    currentHRTab = tab;
    loadHR();
}

async function renderHRTab(tab) {
    const content = document.getElementById('hr-tab-content');
    if (!content) return;

    switch (tab) {
        case 'staff':
            await renderStaffList(content);
            break;
        case 'attendance':
            await renderAttendance(content);
            break;
        case 'leave':
            await renderLeave(content);
            break;
        case 'earnings':
            await renderEarnings(content);
            break;
        case 'loans':
            await renderLoans(content);
            break;
        case 'payroll':
            await renderPayroll(content);
            break;
        case 'performance':
            await renderPerformance(content);
            break;
        case 'recruitment':
            await renderRecruitment(content);
            break;
        case 'reports':
            await renderGovReports(content);
            break;
    }
}

async function renderEarnings(container) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const allowances = await db.allowances.reverse().toArray();

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in pb-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter">Earnings & Allowances</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Incentives, bonuses and recurring allowances</p>
                </div>
                <button onclick="openAllowanceModal()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95">
                    <i class="fa-solid fa-plus-circle"></i> Add New Allowance
                </button>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th class="p-6">Employee</th>
                            <th class="p-6">Type</th>
                            <th class="p-6">Period</th>
                            <th class="p-6">Description</th>
                            <th class="p-6 text-right">Amount</th>
                            <th class="p-6 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        ${allowances.length === 0 ? '<tr><td colspan="6" class="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No earnings or allowances recorded yet.</td></tr>' : 
                            allowances.map(a => {
                                const emp = employees.find(e => e.id === a.employee_id);
                                return `
                                    <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                                        <td class="p-6 font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">${emp?.name || 'Staff Member'}</td>
                                        <td class="p-6">
                                            <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-200/50 uppercase tracking-widest">${a.type}</span>
                                        </td>
                                        <td class="p-6 text-gray-500 font-bold uppercase text-xs">${a.month} ${a.year}</td>
                                        <td class="p-6 text-gray-500 font-medium">${a.description || '-'}</td>
                                        <td class="p-6 text-right font-black text-primary italic text-base">${formatCurrency(a.amount)}</td>
                                        <td class="p-6 text-center">
                                            <div class="flex items-center justify-center gap-2">
                                                <button onclick="openAllowanceModal(${a.id})" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary transition-all border border-transparent hover:border-primary/20 shadow-sm"><i class="fa-solid fa-pen-to-square text-sm"></i></button>
                                                <button onclick="deleteAllowance(${a.id})" class="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 shadow-sm"><i class="fa-solid fa-trash-can text-sm"></i></button>
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
    `;
}

async function openAllowanceModal(id = null) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');

    let allowance = null;
    if (id) {
        allowance = await db.allowances.get(id);
    }

    document.getElementById('hr-modal-title').textContent = allowance ? 'Edit Allowance' : 'Add Allowance / Bonus';
    document.getElementById('hr-modal-subtitle').textContent = 'Earnings Management';
    document.getElementById('hr-submit-btn-text').textContent = allowance ? 'Update Record' : 'Save Record';

    body.innerHTML = `
        <form id="hr-form" onsubmit="handleAllowanceSubmit(event, ${id})" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Staff Member</label>
                    <select id="allow-emp-id" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                        ${employees.map(e => `<option value="${e.id}" ${allowance?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Allowance Type</label>
                    <select id="allow-type" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                        <option value="Incentive" ${allowance?.type === 'Incentive' ? 'selected' : ''}>Incentive</option>
                        <option value="Bonus" ${allowance?.type === 'Bonus' ? 'selected' : ''}>Performance Bonus</option>
                        <option value="Travel" ${allowance?.type === 'Travel' ? 'selected' : ''}>Travel Allowance</option>
                        <option value="OT" ${allowance?.type === 'OT' ? 'selected' : ''}>Overtime Payment</option>
                        <option value="Other" ${allowance?.type === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Month</label>
                    <select id="allow-month" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                        ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => `
                            <option value="${m}" ${allowance ? (allowance.month === m ? 'selected' : '') : (new Date().toLocaleString('default', { month: 'long' }) === m ? 'selected' : '')}>${m}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Year</label>
                    <input type="number" id="allow-year" value="${allowance?.year || new Date().getFullYear()}" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount (LKR)</label>
                    <input type="number" id="allow-amount" required min="1" placeholder="0.00" value="${allowance?.amount || ''}" class="w-full px-5 py-5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-black text-2xl text-primary outline-none shadow-inner">
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reason / Description</label>
                    <input type="text" id="allow-desc" placeholder="Details about this payment..." required value="${allowance?.description || ''}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-medium outline-none shadow-sm">
                </div>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleAllowanceSubmit(event, id = null) {
    event.preventDefault();
    const data = {
        employee_id: parseInt(document.getElementById('allow-emp-id').value),
        type: document.getElementById('allow-type').value,
        month: document.getElementById('allow-month').value,
        year: parseInt(document.getElementById('allow-year').value),
        amount: parseFloat(document.getElementById('allow-amount').value),
        description: document.getElementById('allow-desc').value
    };

    if (id) {
        await db.allowances.update(id, data);
        showAlert('Record Updated', `Successfully updated the allowance record.`);
    } else {
        await db.allowances.add(data);
        showAlert('Record Saved', `Successfully added ${data.type} to staff record.`);
    }
    closeHRModal();
    renderHRTab('earnings');
}

async function deleteAllowance(id) {
    if (confirm("Delete this allowance record?")) {
        await db.allowances.delete(id);
        renderHRTab('earnings');
    }
}


async function renderPerformance(container) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const kpis = await db.kpis.reverse().toArray();

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in pb-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter">Performance Reviews</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">KPI tracking and employee evaluations</p>
                </div>
                <button onclick="openKPIModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 active:scale-95">
                    <i class="fa-solid fa-star"></i> Post New Review
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${kpis.length === 0 ? '<div class="col-span-full p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50 bg-white dark:bg-darkCard rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">No performance records found.</div>' : 
                    kpis.map(k => {
                        const emp = employees.find(e => e.id === k.employee_id);
                        return `
                            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm space-y-4 hover:shadow-md transition-shadow relative group">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-100/50">${emp?.name.charAt(0)}</div>
                                    <div>
                                        <div class="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">${emp?.name || 'Staff Member'}</div>
                                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">${new Date(k.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-1">
                                    ${Array(5).fill(0).map((_, i) => `<i class="fa-solid fa-star ${i < k.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-800'} text-xs"></i>`).join('')}
                                    <span class="ml-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">${k.rating}/5 Score</span>
                                </div>

                                <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 italic">"${k.feedback}"</p>
                                
                                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onclick="openKPIModal(${k.id})" class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-400 hover:bg-indigo-500 hover:text-white flex items-center justify-center border border-indigo-100/50 shadow-sm"><i class="fa-solid fa-pen-to-square text-[10px]"></i></button>
                                    <button onclick="deleteKPI(${k.id})" class="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center border border-red-100/50 shadow-sm"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;
}

async function openKPIModal(id = null) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');

    let kpi = null;
    if (id) {
        kpi = await db.kpis.get(id);
    }

    document.getElementById('hr-modal-title').textContent = kpi ? 'Edit Evaluation' : 'New Evaluation';
    document.getElementById('hr-modal-subtitle').textContent = 'Performance Tracking';
    document.getElementById('hr-submit-btn-text').textContent = kpi ? 'Update Review' : 'Post Review';

    body.innerHTML = `
        <form id="hr-form" onsubmit="handleKPISubmit(event, ${id})" class="p-8 space-y-6">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Employee Targeted</label>
                <select id="kpi-emp-id" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold outline-none shadow-sm">
                    ${employees.map(e => `<option value="${e.id}" ${kpi?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rating (Out of 5 Stars)</label>
                <div class="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border-2 border-transparent focus-within:border-indigo-500 shadow-inner">
                    <input type="range" id="kpi-rating" min="1" max="5" step="1" value="${kpi?.rating || 5}" class="flex-1 accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <span id="kpi-rating-val" class="w-8 text-center font-black text-indigo-600">${kpi?.rating || 5}</span>
                </div>
            </div>
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Behavioral Feedback & Notes</label>
                <textarea id="kpi-feedback" rows="4" placeholder="Detail the performance, achievements or areas of improvement..." required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl font-medium outline-none shadow-sm">${kpi?.feedback || ''}</textarea>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    // Manual listener since script tag might not execute in innerHTML safely in all browsers
    const range = document.getElementById('kpi-rating');
    const val = document.getElementById('kpi-rating-val');
    if(range && val) range.oninput = () => val.innerText = range.value;
}

async function handleKPISubmit(event, id = null) {
    event.preventDefault();
    const data = {
        employee_id: parseInt(document.getElementById('kpi-emp-id').value),
        date: new Date().toISOString().split('T')[0],
        rating: parseInt(document.getElementById('kpi-rating').value),
        feedback: document.getElementById('kpi-feedback').value
    };

    if (id) {
        await db.kpis.update(id, data);
        showAlert('Review Updated', `Performance evaluation has been modified.`);
    } else {
        await db.kpis.add(data);
        showAlert('Review Posted', `Successfully recorded evaluation for ${data.date}.`);
    }
    closeHRModal();
    renderHRTab('performance');
}

async function deleteKPI(id) {
    if (confirm("Permanently delete this performance record?")) {
        await db.kpis.delete(id);
        renderHRTab('performance');
    }
}


async function renderRecruitment(container) {
    const jobs = await db.recruitment.toArray();
    const assets = await db.assets.toArray();
    const employees = await db.employees.toArray();

    container.innerHTML = `
        <div class="space-y-10 animate-fade-in pb-10">
            <!-- Job Openings Section -->
            <section class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-black italic uppercase tracking-tighter">Active Job Openings</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage talent acquisition and hiring pipeline</p>
                    </div>
                    <button onclick="openJobModal()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-plus-circle"></i> Create Vacancy
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${jobs.length === 0 ? '<div class="col-span-full p-12 text-center text-gray-400 font-bold italic uppercase tracking-widest bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder">No active vacancies listed.</div>' : 
                        jobs.map(j => `
                            <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm relative group">
                                <div class="flex justify-between items-start mb-4">
                                    <span class="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest border border-primary/20">${j.department}</span>
                                    <span class="px-2 py-1 ${j.status === 'Open' ? 'bg-emerald-500' : 'bg-gray-400'} text-white text-[9px] font-black rounded-lg uppercase tracking-widest">${j.status}</span>
                                </div>
                                <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">${j.job_title}</h3>
                                <div class="mt-6 flex items-center justify-between">
                                    <button onclick="viewApplicants(${j.id})" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Applicants <i class="fa-solid fa-arrow-right ml-1"></i></button>
                                    <div class="flex gap-2">
                                        <button onclick="openJobModal(${j.id})" class="text-gray-300 hover:text-primary transition-colors"><i class="fa-solid fa-pen-to-square text-xs"></i></button>
                                        <button onclick="deleteJob(${j.id})" class="text-gray-300 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can text-xs"></i></button>
                                    </div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </section>

            <!-- Asset Management Section -->
            <section class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-black italic uppercase tracking-tighter">Inventory & Assets</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Company equipment assigned to employees</p>
                    </div>
                    <button onclick="openAssetModal()" class="bg-gray-900 dark:bg-indigo-900/50 hover:bg-black text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2">
                        <i class="fa-solid fa-laptop-code"></i> Register Asset
                    </button>
                </div>

                <div class="bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th class="p-6">Asset Specification</th>
                                <th class="p-6">Serial / Tag</th>
                                <th class="p-6">Assigned To</th>
                                <th class="p-6 text-center">Condition</th>
                                <th class="p-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            ${assets.length === 0 ? '<tr><td colspan="5" class="p-20 text-center text-gray-400 font-bold italic uppercase tracking-widest opacity-50">No company assets registered.</td></tr>' : 
                                assets.map(a => {
                                    const emp = employees.find(e => e.id === parseInt(a.assigned_to));
                                    return `
                                        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                                            <td class="p-6 font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">${a.name}</td>
                                            <td class="p-6 font-mono text-[10px] text-gray-500 font-bold">${a.serial_no}</td>
                                            <td class="p-6">
                                                <div class="flex items-center gap-2">
                                                    <div class="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black capitalize">${emp?.name.charAt(0) || '?'}</div>
                                                    <span class="font-bold text-gray-600 dark:text-gray-400">${emp?.name || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td class="p-6 text-center text-xs font-black uppercase italic ${a.status === 'Excellent' ? 'text-emerald-500' : 'text-amber-500'}">${a.status}</td>
                                            <td class="p-6 text-center">
                                                <div class="flex items-center justify-center gap-2">
                                                    <button onclick="openAssetModal(${a.id})" class="text-gray-300 hover:text-primary transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                                                    <button onclick="deleteAsset(${a.id})" class="text-gray-300 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

async function openJobModal(id = null) {
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');
    const departments = await db.departments.toArray();

    let job = null;
    if (id) {
        job = await db.recruitment.get(id);
    }

    document.getElementById('hr-modal-title').textContent = job ? 'Edit Vacancy' : 'Create New Vacancy';
    document.getElementById('hr-modal-subtitle').textContent = 'Recruitment Pipeline';
    document.getElementById('hr-submit-btn-text').textContent = job ? 'Update Position' : 'Open Position';

    body.innerHTML = `
        <form id="hr-form" onsubmit="handleJobSubmit(event, ${id})" class="p-8 space-y-6">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Job Title</label>
                <input type="text" id="job-title" placeholder="e.g. Senior Mobile Technician" value="${job?.job_title || ''}" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
            </div>
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                <select id="job-dept" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                    <option value="General">General</option>
                    ${departments.map(d => `<option value="${d.name}" ${job?.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
            </div>
             <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Publication Status</label>
                <select id="job-status" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                    <option value="Open" ${job?.status === 'Open' ? 'selected' : ''}>Published / Open</option>
                    <option value="Draft" ${job?.status === 'Draft' ? 'selected' : ''}>Internal Draft</option>
                    <option value="Closed" ${job?.status === 'Closed' ? 'selected' : ''}>Closed / Filled</option>
                </select>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleJobSubmit(event, id = null) {
    event.preventDefault();
    const data = {
        job_title: document.getElementById('job-title').value,
        department: document.getElementById('job-dept').value,
        status: document.getElementById('job-status').value
    };
    if (id) {
        await db.recruitment.update(id, data);
        showAlert('Vacancy Updated', 'Job opening details modified.');
    } else {
        await db.recruitment.add(data);
        showAlert('Vacancy Created', 'Job opening has been listed successfully.');
    }
    closeHRModal();
    renderHRTab('recruitment');
}

async function deleteJob(id) {
    if (confirm("Remove this job listing?")) {
        await db.recruitment.delete(id);
        renderHRTab('recruitment');
    }
}

async function viewApplicants(jobId) {
    showAlert('Coming Soon', 'The Applicant Tracking System (ATS) is currently under development.', 'info');
}

async function openAssetModal(id = null) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');

    let asset = null;
    if (id) {
        asset = await db.assets.get(id);
    }

    document.getElementById('hr-modal-title').textContent = asset ? 'Edit Asset' : 'Register Asset';
    document.getElementById('hr-modal-subtitle').textContent = 'Equipment Assignment';
    document.getElementById('hr-submit-btn-text').textContent = asset ? 'Update Record' : 'Register & Assign';

    body.innerHTML = `
        <form id="hr-form" onsubmit="handleAssetSubmit(event, ${id})" class="p-8 space-y-6">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Asset Name</label>
                <input type="text" id="asset-name" placeholder="e.g. MacBook Pro M3" value="${asset?.name || ''}" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
            </div>
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Serial Number / Asset Tag</label>
                <input type="text" id="asset-serial" placeholder="SN-MM-XXXX" value="${asset?.serial_no || ''}" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold font-mono outline-none shadow-sm">
            </div>
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Assign To (Staff)</label>
                    <select id="asset-assignee" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                        <option value="0">Unassigned (In Store)</option>
                        ${employees.map(e => `<option value="${e.id}" ${parseInt(asset?.assigned_to) === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Current Condition</label>
                    <select id="asset-status" required class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none shadow-sm">
                        <option value="Excellent" ${asset?.status === 'Excellent' ? 'selected' : ''}>Excellent / New</option>
                        <option value="Good" ${asset?.status === 'Good' ? 'selected' : ''}>Good / Used</option>
                        <option value="Fair" ${asset?.status === 'Fair' ? 'selected' : ''}>Fair / Damaged</option>
                        <option value="Poor" ${asset?.status === 'Poor' ? 'selected' : ''}>Poor / Needs Repair</option>
                    </select>
                </div>
            </div>
        </form>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleAssetSubmit(event, id = null) {
    event.preventDefault();
    const data = {
        name: document.getElementById('asset-name').value,
        serial_no: document.getElementById('asset-serial').value,
        assigned_to: document.getElementById('asset-assignee').value,
        status: document.getElementById('asset-status').value
    };
    if (id) {
        await db.assets.update(id, data);
        showAlert('Asset Updated', 'Equipment registry record modified.');
    } else {
        await db.assets.add(data);
        showAlert('Asset Registered', 'Company equipment recorded and assigned.');
    }
    closeHRModal();
    renderHRTab('recruitment');
}

async function deleteAsset(id) {
    if (confirm("Remove this asset from registry?")) {
        await db.assets.delete(id);
        renderHRTab('recruitment');
    }
}


async function renderGovReports(container) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in pb-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter">Government Compliance</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">EPF/ETF and monthly statutory returns</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- EPF/ETF Generator -->
                <div class="bg-white dark:bg-darkCard rounded-[2.5rem] p-8 border border-gray-100 dark:border-darkBorder shadow-sm space-y-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">
                            <i class="fa-solid fa-landmark"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-black uppercase italic tracking-tighter">EPF/ETF Surcharges</h3>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monthly contribution summaries (12% + 3% + 8%)</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reporting Month</label>
                            <select id="gov-month" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold outline-none shadow-sm">
                                ${months.map(m => `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reporting Year</label>
                            <input type="number" id="gov-year" value="${currentYear}" class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl font-bold outline-none shadow-sm">
                        </div>
                    </div>

                    <button onclick="generateGovReport('epf')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-file-export"></i> Generate EPF/ETF Return (C-Form)
                    </button>
                </div>

                <!-- PAYE / APIT Report -->
                <div class="bg-white dark:bg-darkCard rounded-[2.5rem] p-8 border border-gray-100 dark:border-darkBorder shadow-sm space-y-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                            <i class="fa-solid fa-stamp"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-black uppercase italic tracking-tighter">PAYE / APIT Taxation</h3>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inland Revenue Department (IRD) Tax Reports</p>
                        </div>
                    </div>

                    <div class="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 italic">
                        <p class="text-xs text-gray-500 font-medium leading-relaxed">
                            <i class="fa-solid fa-circle-info mr-1 text-indigo-500"></i>
                            Generates tax schedules for employees with gross earnings exceeding the LKR 100,000 threshold as per the latest IRD circulars.
                        </p>
                    </div>

                    <button onclick="generateGovReport('tax')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <i class="fa-solid fa-file-shield"></i> Generate PAYE Tax Schedule
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function generateGovReport(type) {
    const month = document.getElementById('gov-month').value;
    const year = parseInt(document.getElementById('gov-year').value);
    const employees = await db.employees.where('status').equals('active').toArray();
    
    if (type === 'epf') {
        let html = `
            <div class="space-y-6 text-left">
                <div class="text-center border-b pb-4">
                    <h1 class="text-xl font-black uppercase tracking-tighter">EPF/ETF CONTRIBUTION RETURN</h1>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${month} ${year}</p>
                </div>
                <table class="w-full text-[10px] border-collapse">
                    <thead class="bg-gray-50 uppercase font-black">
                        <tr>
                            <th class="p-2 border">Employee Name</th>
                            <th class="p-2 border text-right">Gross Salary</th>
                            <th class="p-2 border text-right">EPF (8%)</th>
                            <th class="p-2 border text-right">EPF (12%)</th>
                            <th class="p-2 border text-right">ETF (3%)</th>
                            <th class="p-2 border text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(e => {
                            const sal = e.salary || 0;
                            const epf8 = sal * 0.08;
                            const epf12 = sal * 0.12;
                            const etf3 = sal * 0.03;
                            return `
                                <tr>
                                    <td class="p-2 border uppercase font-bold">${e.name}</td>
                                    <td class="p-2 border text-right">${formatCurrency(sal)}</td>
                                    <td class="p-2 border text-right">${formatCurrency(epf8)}</td>
                                    <td class="p-2 border text-right">${formatCurrency(epf12)}</td>
                                    <td class="p-2 border text-right">${formatCurrency(etf3)}</td>
                                    <td class="p-2 border text-right font-black">${formatCurrency(epf8 + epf12 + etf3)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        Swal.fire({
            title: 'Compliance Report Generated',
            html: html,
            width: '800px',
            confirmButtonText: 'Download as PDF',
            showCancelButton: true
        }).then(result => {
            if (result.isConfirmed) {
                generatePDFAndShare(html, `EPF_ETF_${month}_${year}.pdf`, { title: 'Compliance Report' });
            }
        });
    } else if (type === 'tax') {
        const taxableStaff = employees.filter(e => e.salary > 100000);
        
        if (taxableStaff.length === 0) {
            return showAlert('Clear Record', 'No employees found above the taxable threshold (LKR 100,000).', 'info');
        }

        let html = `
            <div class="space-y-6 text-left">
                <div class="text-center border-b pb-4">
                    <h1 class="text-xl font-black uppercase tracking-tighter text-indigo-600">PAYE/APIT TAX SCHEDULE</h1>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${month} ${year}</p>
                </div>
                <table class="w-full text-[10px] border-collapse">
                    <thead class="bg-gray-50 uppercase font-black">
                        <tr>
                            <th class="p-2 border">Employee Name</th>
                            <th class="p-2 border">TIN Number</th>
                            <th class="p-2 border text-right">Taxable Income</th>
                            <th class="p-2 border text-right">Tax Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${taxableStaff.map(e => {
                            const sal = e.salary || 0;
                            const taxable = sal - 100000;
                            // Simplified tax brackets for UI demonstration
                            let tax = 0;
                            if (taxable > 0) tax = taxable * 0.06;
                            return `
                                <tr>
                                    <td class="p-2 border uppercase font-bold">${e.name}</td>
                                    <td class="p-2 border text-center">${e.tin || 'PENDING'}</td>
                                    <td class="p-2 border text-right">${formatCurrency(sal)}</td>
                                    <td class="p-2 border text-right font-black text-red-600">${formatCurrency(tax)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        Swal.fire({
            title: 'Tax Schedule Ready',
            html: html,
            width: '600px',
            confirmButtonText: 'Export to IRD Format',
            showCancelButton: true
        }).then(result => {
            if (result.isConfirmed) {
                generatePDFAndShare(html, `PAYE_Tax_${month}_${year}.pdf`, { title: 'Tax Report' });
            }
        });
    }
}


// --- TAB: STAFF LIST ---
async function renderStaffList(container) {
    const employees = await db.employees.toArray();
    const today = new Date().toISOString().split('T')[0];
    const attendanceLogs = await db.attendance.where('date').equals(today).toArray();
    const onDutyCount = attendanceLogs.filter(log => log.status === 'present' || log.status === 'half-day').length;
    const leaves = await db.leaves.filter(l => l.status === 'approved' && l.start_date <= today && l.end_date >= today).toArray();
    const onLeaveCount = leaves.length;

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <!-- HR Summary Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-users text-xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Staff</p>
                        <h3 class="text-2xl font-black text-gray-900 dark:text-white">${employees.length}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-calendar-check text-xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">On Duty Today</p>
                        <h3 class="text-2xl font-black text-emerald-600">${onDutyCount}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-plane-departure text-xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">On Leave</p>
                        <h3 class="text-2xl font-black text-amber-600">${onLeaveCount}</h3>
                    </div>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div class="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-money-bill-wave text-xl"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Monthly Payroll</p>
                        <h3 class="text-2xl font-black text-indigo-600">${formatCurrency(employees.reduce((s, e) => s + (e.salary || 0), 0))}</h3>
                    </div>
                </div>
            </div>

                <div class="p-8 border-b border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkBg/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 class="text-2xl font-black italic uppercase tracking-tighter">EMPLOYEE DIRECTORY</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage organization human resources & payroll</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="relative hidden lg:block mr-2">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="Search staff..." class="pl-11 pr-4 py-3 bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all w-64">
                        </div>
                        <button onclick="openDepartmentModal()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm border border-indigo-100/50 flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-folder-tree"></i> Departments
                        </button>
                        <button onclick="openEmployeeModal()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95">
                            <i class="fa-solid fa-user-plus"></i> Add New Employee
                        </button>
                    </div>
                </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th class="p-6">STAFF IDENTITY</th>
                            <th class="p-6">POSITION & DEPARTMENT</th>
                            <th class="p-6">TYPE</th>
                            <th class="p-6">COMMUNICATION</th>
                            <th class="p-6 text-right">VALUATION</th>
                            <th class="p-6 text-center">STATUS</th>
                            <th class="p-6 text-center">CONTROL</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${employees.length === 0 ? '<tr><td colspan="6" class="p-12 text-center text-gray-400">No employees registered.</td></tr>' : employees.map(e => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td class="p-6 flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-black text-sm border-2 border-white dark:border-gray-700 shadow-sm">${e.name.charAt(0)}</div>
                                    <div>
                                        <div class="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter text-sm">${e.name}</div>
                                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">NIC: ${e.nic || 'N/A'}</div>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">${e.designation}</div>
                                    <div class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">${e.department || 'General'}</div>
                                </td>
                                <td class="p-6">
                                    <div class="text-[9px] font-black uppercase ${e.role === 'director' ? 'text-purple-600 bg-purple-100/50 dark:text-purple-400' : 'text-emerald-600 bg-emerald-100/50'} border border-current/20 px-2 py-1 rounded-lg inline-block tracking-widest">${e.role === 'director' ? 'Director' : 'Staff'}</div>
                                    <div class="text-[8px] text-gray-400 font-bold mt-1 uppercase">${e.type || 'Permanent'}</div>
                                </td>
                                <td class="p-6">
                                    <div class="text-[10px] font-black text-gray-600 dark:text-gray-400 tracking-widest select-all"><i class="fa-solid fa-phone mr-1.5 text-[8px] opacity-50"></i>${e.phone}</div>
                                </td>
                                <td class="p-6 text-sm text-right font-black text-primary italic tracking-tighter">${formatCurrency(e.salary)}</td>
                                <td class="p-6 text-center">
                                    <span class="px-3 py-1.5 ${e.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'} text-[9px] font-black rounded-xl uppercase tracking-widest shadow-lg ${e.status === 'active' ? 'shadow-emerald-500/20' : 'shadow-red-500/20'}">${e.status}</span>
                                </td>
                                <td class="p-6 text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button onclick="editEmployee(${e.id})" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-primary/20"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button onclick="deleteEmployee(${e.id})" class="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all active:scale-95 border border-transparent hover:border-red-500/20"><i class="fa-solid fa-trash-can"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- TAB: ATTENDANCE ---
async function renderAttendance(container) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const today = new Date().toISOString().split('T')[0];
    const logs = await db.attendance.where('date').equals(today).toArray();

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder overflow-hidden">
                    <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex items-center justify-between">
                        <h2 class="text-xl font-bold">Daily Attendance - ${new Date().toLocaleDateString()}</h2>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500">Auto-refresh ready</span>
                            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                <tr>
                                    <th class="p-4 text-xs font-bold uppercase">Staff</th>
                                    <th class="p-4 text-xs font-bold uppercase text-center">Clock In</th>
                                    <th class="p-4 text-xs font-bold uppercase text-center">Clock Out</th>
                                    <th class="p-4 text-xs font-bold uppercase text-center">Status</th>
                                    <th class="p-4 text-xs font-bold uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                ${employees.map(e => {
                                    const log = logs.find(l => l.employee_id === e.id);
                                    return `
                                        <tr>
                                            <td class="p-4 font-bold text-sm">${e.name}</td>
                                            <td class="p-4 text-center text-sm font-black text-emerald-600">${log?.clock_in || '--:--'}</td>
                                            <td class="p-4 text-center text-sm font-black text-red-600">${log?.clock_out || '--:--'}</td>
                                            <td class="p-4 text-center">
                                                ${log ? `
                                                    <span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Present</span>
                                                ` : `
                                                    <span class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase">Absent</span>
                                                `}
                                            <td class="p-4">
                                                <div class="flex items-center justify-center gap-2">
                                                    ${!log ? `
                                                        <button onclick="clockIn(${e.id})" class="text-[10px] font-black uppercase bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-all">Clock In</button>
                                                    ` : !log.clock_out ? `
                                                        <button onclick="clockOut(${e.id})" class="text-[10px] font-black uppercase bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">Clock Out</button>
                                                    ` : `
                                                        <i class="fa-solid fa-check-double text-emerald-500"></i>
                                                    `}
                                                    <div class="flex items-center gap-1">
                                                        <button onclick="editAttendance(${e.id}, '${today}')" class="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg" title="Edit Log"><i class="fa-solid fa-pen-to-square"></i></button>
                                                        ${log ? `<button onclick="deleteAttendance(${log.id})" class="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg" title="Delete Log"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Attendance Stats -->
            <div class="space-y-6">
                <div class="bg-indigo-600 p-6 rounded-2xl shadow-xl text-white">
                    <h3 class="font-bold mb-4 opacity-75">Quick Summary</h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span>Total Present Today</span>
                            <span class="text-2xl font-black">${logs.length}</span>
                        </div>
                        <div class="flex justify-between items-center text-indigo-200">
                            <span>Absent / Leave</span>
                            <span class="text-xl font-bold">${employees.length - logs.length}</span>
                        </div>
                        <div class="pt-4 border-t border-indigo-400">
                            <button onclick="exportAttendanceReport()" class="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-bold transition-all">Download Monthly Report</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- TAB: PAYROLL ---
async function renderPayroll(container) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    // Calculate preview data for the current period
    const payrollPreviews = [];
    let totalLiability = 0;
    
    const mIdx = new Date().getMonth();
    const start = new Date(currentYear, mIdx, 1).toISOString().split('T')[0];
    const end = new Date(currentYear, mIdx + 1, 0).toISOString().split('T')[0];

    for (let emp of employees) {
        const metrics = await payrollSystem.calculateEarningsFromAttendance(emp, start, end);
        const gross = metrics.basePay + metrics.otPay - metrics.latePenalty;
        const tax = payrollSystem.calculateTaxes(gross, 'LK');
        const net = gross - tax;
        
        payrollPreviews.push({
            emp,
            metrics,
            gross,
            tax,
            net
        });
        totalLiability += net;
    }

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in pb-10">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-black italic uppercase tracking-tighter">Payroll Processing</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">${currentMonth} ${currentYear} Period</p>
                </div>
                <div class="flex gap-4">
                    <button onclick="renderPayrollHistory()" class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-gray-200 active:scale-95">
                        <i class="fa-solid fa-clock-rotate-left"></i> History
                    </button>
                    <button onclick="generateAllPayslips()" class="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95">
                        <i class="fa-solid fa-stamp"></i> Run Batch Process
                    </button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">Total Net Payout</p>
                    <h3 class="text-3xl font-black text-gray-900 dark:text-white relative z-10">${formatCurrency(totalLiability)}</h3>
                    <p class="text-[9px] text-emerald-600 font-bold mt-2 uppercase italic">Estimated for current month</p>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tax Liability (PAYE)</p>
                    <h3 class="text-2xl font-black text-rose-500">${formatCurrency(payrollPreviews.reduce((s, p) => s + p.tax, 0))}</h3>
                </div>
                <div class="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Personnel</p>
                    <h3 class="text-2xl font-black text-indigo-600">${employees.length} Staff</h3>
                </div>
            </div>

            <div class="bg-white dark:bg-darkCard rounded-[2rem] shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th class="p-6">Employee</th>
                            <th class="p-6 text-right">Base</th>
                            <th class="p-6 text-right">OT Pay</th>
                            <th class="p-6 text-right">Tax (APIT)</th>
                            <th class="p-6 text-right font-black">Net Payable</th>
                            <th class="p-6 text-center">Snapshot</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${payrollPreviews.map(p => `
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                                <td class="p-6">
                                    <div class="font-bold text-gray-900 dark:text-white uppercase italic tracking-tighter">${p.emp.name}</div>
                                    <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest">${p.emp.designation}</div>
                                </td>
                                <td class="p-6 text-right text-xs font-bold text-gray-600 dark:text-gray-400">${formatCurrency(p.metrics.basePay)}</td>
                                <td class="p-6 text-right text-xs font-black text-emerald-600 italic">+ ${formatCurrency(p.metrics.otPay)}</td>
                                <td class="p-6 text-right text-xs font-black text-rose-600 italic">- ${formatCurrency(p.tax)}</td>
                                <td class="p-4 text-right">
                                    <div class="text-base font-black text-primary italic">${formatCurrency(p.net)}</div>
                                </td>
                                <td class="p-6 text-center">
                                    <button onclick="previewPayslip(${p.emp.id}, true)" class="w-10 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/10"><i class="fa-solid fa-magnifying-glass-chart"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function renderPayrollHistory() {
    const batches = await db.payroll_batches.reverse().toArray();
    
    let html = `
        <div class="space-y-6 text-left">
            <div class="flex items-center justify-between border-b pb-4">
                <h2 class="text-xl font-black uppercase tracking-tighter">Payroll Execution History</h2>
                <div class="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">Master Records</div>
            </div>
            
            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                ${batches.length === 0 ? '<p class="text-center py-10 text-gray-400 font-bold uppercase text-xs">No batches processed yet</p>' : batches.map(b => {
                    const isPending = b.status === 'Pending_Bank_Transfer';
                    const statusBadge = isPending 
                        ? `<span class="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-200/20">Pending</span>` 
                        : `<span class="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-200/20">Paid</span>`;
                    
                    const payButton = isPending 
                        ? `<button onclick="payPayrollBatch(${b.id})" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/10 flex items-center gap-1.5"><i class="fa-solid fa-credit-card"></i> Pay</button>`
                        : '';
                    
                    return `
                    <div class="p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                <i class="fa-solid fa-layer-group text-xl"></i>
                            </div>
                            <div>
                                <div class="font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">${b.month} ${b.year}</div>
                                <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest">${b.batch_id}</div>
                            </div>
                        </div>
                        <div class="text-right flex items-center gap-4">
                            <div class="flex flex-col items-end gap-1">
                                <div class="text-sm font-black text-primary">${formatCurrency(b.total_net_payout)}</div>
                                <div>${statusBadge}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                ${payButton}
                                <button onclick="deletePayrollBatch(${b.id})" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Rollback Batch"><i class="fa-solid fa-rotate-left"></i></button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    Swal.fire({
        html: html,
        width: '600px',
        showConfirmButton: false,
        showCloseButton: true
    });
}

async function generateAllPayslips() {
    const month = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();
    const monthYear = `${month} ${year}`;

    const { isConfirmed } = await Swal.fire({
        title: 'Run Advanced Payroll Batch?',
        text: `This will trigger the Payroll Engine to calculate OT, check attendance logs, compute PAYE taxes and record salary expenses for ${monthYear}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Initialize Processing',
        confirmButtonColor: '#4F46E5',
        backdrop: `rgba(0,0,123,0.4)`
    });

    if (!isConfirmed) return;

    Swal.fire({
        title: 'Processing Salaries...',
        html: 'Engine is calculating variables...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const batchId = await payrollSystem.processBatchPayroll(month, year, 'LK');
        
        // Custom entry in ledger for the whole batch total
        const batch = await db.payroll_batches.where('batch_id').equals(batchId).first();
        const accounts = await db.accounts.toArray();
        const getAccId = (code) => accounts.find(a => a.code === code)?.id;
        const salaryAccId = getAccId('5500'); 
        const bankAccId = getAccId('1010');

        if (typeof recordTransaction === 'function') {
            await recordTransaction(salaryAccId, batch.total_net_payout, 'debit', `Payroll Batch: ${monthYear} (${batchId})`, 'Payroll', batchId);
            await recordTransaction(bankAccId, batch.total_net_payout, 'credit', `Cash Payout: ${monthYear} Batch`, 'Payroll', batchId);
        }

        if (typeof logActivity === 'function') await logActivity(`Executed Payroll Engine for ${monthYear}`);
        
        Swal.close();

        // Show the total salary summary with download options
        await showPayrollSummary(batchId, month, year);
        renderHRTab('payroll');
    } catch (err) {
        Swal.close();
        showAlert('Engine Failure', 'Payroll processing error: ' + err.message, 'error');
    }
}

async function showPayrollSummary(batchId, month, year) {
    const batch = await db.payroll_batches.where('batch_id').equals(batchId).first();
    if (!batch) return;

    const payrollRecords = await db.payroll.where('batch_id').equals(batchId).toArray();
    const employees = await db.employees.toArray();
    const storeInfo = await db.settings.toArray();
    let opts = {};
    storeInfo.forEach(s => opts[s.key] = s.value);

    const totalGross = payrollRecords.reduce((s, r) => s + (r.gross_salary || 0), 0);
    const totalTax = payrollRecords.reduce((s, r) => s + (r.tax_deduction || 0), 0);
    const totalNet = batch.total_net_payout;

    const rowsHtml = payrollRecords.map(r => {
        const emp = employees.find(e => e.id === r.employee_id);
        return `
            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 12px;">
                <td style="padding: 12px 16px; font-weight: 700; color: #1e293b;">${emp?.name || 'Staff'}</td>
                <td style="padding: 12px 16px; text-align: right; color: #475569;">${formatCurrency(r.basic_salary || 0)}</td>
                <td style="padding: 12px 16px; text-align: right; color: #10b981;">${formatCurrency(r.ot_pay || 0)}</td>
                <td style="padding: 12px 16px; text-align: right; color: #ef4444;">${formatCurrency(r.tax_deduction || 0)}</td>
                <td style="padding: 12px 16px; text-align: right; font-weight: 900; color: #4F46E5;">${formatCurrency(r.net_salary || 0)}</td>
                <td style="padding: 12px 16px; text-align: center;">
                    <button onclick="downloadSinglePayslip(${r.employee_id}, '${month}', ${year})" 
                        style="background: #4F46E5; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">
                        <i class="fa-solid fa-download" style="margin-right:4px;"></i>Payslip
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const summaryHtml = `
        <div style="font-family: 'Inter', sans-serif; color: #1e293b; text-align: left;">
            <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 28px 32px; border-radius: 20px; color: white; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin:0; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.15em; opacity:0.8;">Payroll Batch Completed</p>
                        <h2 style="margin: 6px 0 0 0; font-size: 26px; font-weight: 900; font-style: italic; letter-spacing: -0.03em;">${month} ${year}</h2>
                        <p style="margin: 4px 0 0 0; font-size: 10px; opacity: 0.7; font-weight: 600;">Batch ID: ${batchId}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; opacity: 0.8;">Total Net Payout</p>
                        <h1 style="margin: 6px 0 0 0; font-size: 36px; font-weight: 900; letter-spacing: -0.04em;">${formatCurrency(totalNet)}</h1>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 20px; background: rgba(255,255,255,0.15); padding: 16px; border-radius: 12px;">
                    <div>
                        <p style="margin:0; font-size:9px; opacity:0.75; text-transform:uppercase; font-weight:800;">Total Gross</p>
                        <p style="margin:4px 0 0 0; font-size:16px; font-weight:900;">${formatCurrency(totalGross)}</p>
                    </div>
                    <div>
                        <p style="margin:0; font-size:9px; opacity:0.75; text-transform:uppercase; font-weight:800;">Tax Deducted</p>
                        <p style="margin:4px 0 0 0; font-size:16px; font-weight:900; color: #fca5a5;">${formatCurrency(totalTax)}</p>
                    </div>
                    <div>
                        <p style="margin:0; font-size:9px; opacity:0.75; text-transform:uppercase; font-weight:800;">Staff Count</p>
                        <p style="margin:4px 0 0 0; font-size:16px; font-weight:900;">${payrollRecords.length} Employees</p>
                    </div>
                </div>
            </div>

            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 16px;">
                <div style="background: #f8fafc; padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin:0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:0.1em; color:#475569;">Employee Salary Breakdown</h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #1e293b; color: white; font-size: 10px; text-transform: uppercase; font-weight: 900;">
                            <th style="padding: 12px 16px; text-align: left;">Employee</th>
                            <th style="padding: 12px 16px; text-align: right;">Basic</th>
                            <th style="padding: 12px 16px; text-align: right;">OT Pay</th>
                            <th style="padding: 12px 16px; text-align: right;">Tax</th>
                            <th style="padding: 12px 16px; text-align: right;">Net Pay</th>
                            <th style="padding: 12px 16px; text-align: center;">Payslip</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                    <tfoot style="background: #f8fafc; font-weight: 900; border-top: 2px solid #e2e8f0;">
                        <tr>
                            <td style="padding: 14px 16px; font-size: 12px; text-transform: uppercase;">TOTAL</td>
                            <td style="padding: 14px 16px; text-align: right; font-size: 13px;">${formatCurrency(payrollRecords.reduce((s,r) => s+(r.basic_salary||0), 0))}</td>
                            <td style="padding: 14px 16px; text-align: right; font-size: 13px; color: #10b981;">${formatCurrency(payrollRecords.reduce((s,r) => s+(r.ot_pay||0), 0))}</td>
                            <td style="padding: 14px 16px; text-align: right; font-size: 13px; color: #ef4444;">${formatCurrency(totalTax)}</td>
                            <td style="padding: 14px 16px; text-align: right; font-size: 16px; color: #4F46E5; font-weight: 900;">${formatCurrency(totalNet)}</td>
                            <td style="padding: 14px 16px; text-align: center;">
                                <button onclick="downloadAllPayslips('${batchId}', '${month}', ${year})" 
                                    style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-size: 10px; font-weight: 800; cursor: pointer; text-transform: uppercase;">
                                    <i class="fa-solid fa-file-arrow-down" style="margin-right:4px;"></i>All
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;

    await Swal.fire({
        title: 'Payroll Processed Successfully',
        html: summaryHtml,
        width: '900px',
        confirmButtonText: '<i class="fa-solid fa-file-arrow-down mr-2"></i> Download All Payslips',
        confirmButtonColor: '#4F46E5',
        showCancelButton: true,
        cancelButtonText: 'Close',
        didOpen: () => {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }).then(result => {
        if (result.isConfirmed) {
            downloadAllPayslips(batchId, month, year);
        }
    });
}

async function downloadSinglePayslip(empId, month, year) {
    const emp = await db.employees.get(empId);
    if (!emp) return;

    const storeInfo = await db.settings.toArray();
    let opts = {};
    storeInfo.forEach(s => opts[s.key] = s.value);

    const mIdx = new Date(Date.parse(month + ' 1, 2000')).getMonth();
    const start = new Date(year, mIdx, 1).toISOString().split('T')[0];
    const end = new Date(year, mIdx + 1, 0).toISOString().split('T')[0];

    // Try to fetch from saved payroll records first
    const savedRecord = await db.payroll.where('employee_id').equals(empId).filter(r => r.month === month && r.year === year).first();

    let basePay, otPay, latePenalty, tax, net, totalOTHours;
    if (savedRecord) {
        basePay = savedRecord.basic_salary || 0;
        otPay = savedRecord.ot_pay || 0;
        latePenalty = savedRecord.late_penalty || 0;
        tax = savedRecord.tax_deduction || 0;
        net = savedRecord.net_salary || 0;
        totalOTHours = 0;
    } else {
        const metrics = await payrollSystem.calculateEarningsFromAttendance(emp, start, end);
        basePay = metrics.basePay;
        otPay = metrics.otPay;
        latePenalty = metrics.latePenalty;
        totalOTHours = metrics.totalOTHours;
        tax = payrollSystem.calculateTaxes(basePay + otPay - latePenalty, 'LK');
        net = basePay + otPay - latePenalty - tax;
    }

    // Fetch allowances for this employee and period
    const allowances = await db.allowances.where('employee_id').equals(empId).filter(a => a.month === month && a.year === year).toArray();
    const totalAllowances = allowances.reduce((s, a) => s + (a.amount || 0), 0);
    const netWithAllowances = net + totalAllowances;

    // Fetch loan deductions
    const loans = await db.loans.where('employee_id').equals(empId).filter(l => l.status === 'pending').toArray();
    const loanDeduction = loans.reduce((s, l) => s + (l.amount || 0), 0);
    const finalNet = netWithAllowances - loanDeduction;

    const payslipHtml = buildPayslipHTML(emp, opts, month, year, {
        basePay, otPay, latePenalty, tax, net: finalNet,
        totalOTHours: totalOTHours || 0,
        allowances, loanDeduction, totalAllowances
    }, false);

    generatePDFAndShare(payslipHtml, `Payslip_${emp.name.replace(/\s+/g, '_')}_${month}_${year}.pdf`, { title: 'Employee Payslip' });
}

async function downloadAllPayslips(batchId, month, year) {
    const payrollRecords = await db.payroll.where('batch_id').equals(batchId).toArray();
    if (payrollRecords.length === 0) {
        showAlert('Info', 'No payroll records found for this batch.', 'info');
        return;
    }
    for (const record of payrollRecords) {
        await downloadSinglePayslip(record.employee_id, month, year);
        await new Promise(r => setTimeout(r, 300)); // small delay between downloads
    }
    showAlert('Done', `Downloaded payslips for ${payrollRecords.length} employees.`, 'success');
}

function buildPayslipHTML(emp, opts, month, year, data, isPreviewOnly = false) {
    const { basePay, otPay, latePenalty, tax, net, totalOTHours, allowances, loanDeduction, totalAllowances } = data;
    const enabledStoreAddress = opts['enabled_store_address'] !== false;
    const allowanceRows = (allowances || []).map(a => `
        <tr style="background: #f0fdf4;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9;">${a.type} Allowance <small style="display:block; font-size:9px; color:#94a3b8;">${a.description || ''}</small></td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981;">+ ${formatCurrency(a.amount)}</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #94a3b8;">--</td>
        </tr>
    `).join('');

    const loanRow = (loanDeduction > 0) ? `
        <tr style="background: #fff5f5;">
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9;">Advance / Loan Recovery</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #94a3b8;">--</td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #ef4444;">- ${formatCurrency(loanDeduction)}</td>
        </tr>
    ` : '';

    return `
        <div id="payslip-to-print" style="font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 4px solid #4F46E5; padding-bottom: 20px;">
                <div>
                    <h1 style="margin: 0; color: #4F46E5; font-size: 32px; font-weight: 900; font-style: italic; letter-spacing: -0.05em;">PAYSLIP</h1>
                    <p style="margin: 5px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Statement Period: ${month} ${year}</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase;">${opts['store_name'] || 'MobileMate POS'}</h2>
                    ${enabledStoreAddress ? `<p style="margin: 2px 0; font-size: 11px; color: #64748b; font-weight: 600;">${opts['store_address'] || ''}</p>` : ''}
                    <p style="margin: 2px 0; font-size: 11px; color: #64748b; font-weight: 600;">Hotline: ${opts['store_phone'] || ''}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 20px;">
                <div>
                    <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Employee Details</p>
                    <h3 style="margin: 10px 0 5px 0; font-size: 20px; font-weight: 900; text-transform: uppercase; font-style: italic;">${emp.name}</h3>
                    <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 700;">${emp.designation}</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Department: ${emp.department || 'General'}</p>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Employment: ${emp.type || 'Permanent'}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Identification</p>
                    <p style="margin: 10px 0; font-size: 16px; font-weight: 900; color: #4F46E5;">ID: #EMP-${emp.id.toString().padStart(4, '0')}</p>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">NIC: ${emp.nic || 'N/A'}</p>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600;">Phone: ${emp.phone || 'N/A'}</p>
                </div>
            </div>

            <div style="margin-bottom: 40px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #1e293b; color: white;">
                            <th style="padding: 15px; text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; border-top-left-radius: 12px;">Description</th>
                            <th style="padding: 15px; text-align: right; font-size: 11px; font-weight: 900; text-transform: uppercase;">Earnings</th>
                            <th style="padding: 15px; text-align: right; font-size: 11px; font-weight: 900; text-transform: uppercase; border-top-right-radius: 12px;">Deductions</th>
                        </tr>
                    </thead>
                    <tbody style="font-weight: 700; color: #334155; font-size: 13px;">
                        <tr style="background: white;">
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">Basic Salary</td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatCurrency(basePay)}</td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #94a3b8;">--</td>
                        </tr>
                        <tr style="background: #fdfdfd;">
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">Overtime (OT) <small style="display:block; font-size: 9px; color:#94a3b8; text-transform:uppercase;">${(totalOTHours || 0).toFixed(1)} Hours</small></td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981;">+ ${formatCurrency(otPay)}</td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #94a3b8;">--</td>
                        </tr>
                        ${allowanceRows}
                        <tr style="background: #fffafa;">
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9;">Late Attendance Penalty</td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #94a3b8;">--</td>
                            <td style="padding: 15px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #ef4444;">- ${formatCurrency(latePenalty)}</td>
                        </tr>
                        ${loanRow}
                        <tr style="background: #fffafa;">
                            <td style="padding: 15px; border-bottom: 2px solid #e2e8f0; font-weight: 800;">Statutory Tax (PAYE / APIT)</td>
                            <td style="padding: 15px; border-bottom: 2px solid #e2e8f0; text-align: right; color: #94a3b8;">--</td>
                            <td style="padding: 15px; border-bottom: 2px solid #e2e8f0; text-align: right; color: #ef4444; font-weight: 900;">- ${formatCurrency(tax)}</td>
                        </tr>
                    </tbody>
                    <tfoot style="background: #f8fafc; font-size: 14px; font-weight: 900;">
                        <tr>
                            <th style="padding: 18px; text-align: left; text-transform: uppercase; border-bottom-left-radius: 12px;">Total Summaries</th>
                            <th style="padding: 18px; text-align: right; color: #10b981;">+ ${formatCurrency(basePay + otPay + (totalAllowances || 0))}</th>
                            <th style="padding: 18px; text-align: right; color: #ef4444; border-bottom-right-radius: 12px;">- ${formatCurrency(latePenalty + tax + (loanDeduction || 0))}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div style="background: #4F46E5; padding: 30px; border-radius: 25px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.2);">
                <div>
                    <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.8;">Net Salary Payable</p>
                    <h2 style="margin: 5px 0 0 0; font-size: 36px; font-weight: 900; font-style: italic; letter-spacing: -0.05em;">${formatCurrency(net)}</h2>
                </div>
                <div style="text-align: right;">
                    <div style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">
                        ${isPreviewOnly ? 'Unprocessed Draft' : 'Disbursement Complete'}
                    </div>
                </div>
            </div>

            <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center;">
                <div>
                    <div style="border-top: 2px solid #e2e8f0; padding-top: 15px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Authorized Signature</div>
                </div>
                <div>
                    <div style="border-top: 2px solid #e2e8f0; padding-top: 15px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Employee Acknowledgment</div>
                </div>
            </div>

            <div style="margin-top: 50px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
                <p style="font-size: 9px; color: #94a3b8; font-weight: 600;">Computer generated payslip. Signature not required where electronic approval is recorded. <br>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    `;
}


// --- LOGIC FUNCTIONS ---

async function clockIn(empId) {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    try {
        await db.attendance.add({
            employee_id: empId,
            date: today,
            clock_in: time,
            status: 'present'
        });
        showAlert('Success', 'Clocked in successfully');
        renderHRTab('attendance');
    } catch (err) {
        showAlert('Error', 'Already clocked in today', 'error');
    }
}

async function clockOut(empId) {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    const record = await db.attendance.where({ employee_id: empId, date: today }).first();
    if (record) {
        await db.attendance.update(record.id, { clock_out: time });
        showAlert('Success', 'Clocked out successfully');
        renderHRTab('attendance');
    }
}

async function openEmployeeModal(empId = null) {
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');
    const departments = await db.departments.toArray();
    
    let emp = null;
    if (empId) {
        emp = await db.employees.get(empId);
    }

    document.getElementById('hr-modal-title').textContent = emp ? 'Edit Employee Profile' : 'New Employee Profile';
    document.getElementById('hr-modal-subtitle').textContent = 'Employee Master File';
    document.getElementById('hr-submit-btn-text').textContent = emp ? 'Update Profile' : 'Save Profile';

    body.innerHTML = `
        <form id="hr-form" onsubmit="handleEmployeeSubmit(event, ${empId})" class="p-8 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input type="text" id="emp-name" required value="${emp?.name || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary dark:focus:border-primary rounded-xl transition-all outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">NIC / ID Card</label>
                    <input type="text" id="emp-nic" value="${emp?.nic || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number *</label>
                    <input type="text" id="emp-phone" required value="${emp?.phone || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Position / Title *</label>
                    <input type="text" id="emp-pos" required value="${emp?.designation || ''}" placeholder="e.g. Sales Manager" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                    <select id="emp-dept" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        <option value="General">General</option>
                        ${departments.map(d => `<option value="${d.name}" ${emp?.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Employee Category *</label>
                    <select id="emp-role" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        <option value="staff" ${emp?.role !== 'director' ? 'selected' : ''}>Staff (Salaried)</option>
                        <option value="director" ${emp?.role === 'director' ? 'selected' : ''}>Director (Fee-based)</option>
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                    <textarea id="emp-address" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none" rows="2">${emp?.address || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary *</label>
                    <input type="number" id="emp-salary" required value="${emp?.salary || 0}" min="0" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-black text-primary outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select id="emp-status" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                        <option value="active" ${emp?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="on-leave" ${emp?.status === 'on-leave' ? 'selected' : ''}>On Leave</option>
                        <option value="inactive" ${emp?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeHRModal() {
    const modal = document.getElementById('hr-modal');
    if (!modal) return;
    const content = modal.querySelector('.transform');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function handleEmployeeSubmit(event, empId = null) {
    event.preventDefault();
    const data = {
        name: document.getElementById('emp-name').value,
        nic: document.getElementById('emp-nic').value,
        phone: document.getElementById('emp-phone').value,
        designation: document.getElementById('emp-pos').value,
        department: document.getElementById('emp-dept').value,
        address: document.getElementById('emp-address').value,
        salary: parseFloat(document.getElementById('emp-salary').value) || 0,
        status: document.getElementById('emp-status').value
    };

    if (empId) {
        await db.employees.update(empId, data);
        if (typeof logActivity === 'function') await logActivity(`Updated Employee: ${data.name}`);
        showAlert('Success', 'Employee profile updated successfully');
    } else {
        await db.employees.add(data);
        if (typeof logActivity === 'function') await logActivity(`Added Employee: ${data.name}`);
        showAlert('Success', 'Employee profile created successfully');
    }
    closeHRModal();
    renderHRTab('staff');
}

function editEmployee(id) {
    openEmployeeModal(id);
}

async function deleteEmployee(id) {
    const emp = await db.employees.get(id);
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Employee?',
        text: `Are you sure you want to delete ${emp.name}? This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });

    if (isConfirmed) {
        await db.employees.delete(id);
        showAlert('Deleted', 'Employee has been removed.');
        renderHRTab('staff');
    }
}

async function renderLeave(container) {
    const leaves = await db.leaves.toArray();
    const employees = await db.employees.toArray();

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold">Leave Requests</h2>
                <button onclick="openLeaveModal()" class="bg-primary px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> New Request
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${leaves.length === 0 ? '<div class="col-span-full p-12 text-center text-gray-400 bg-white dark:bg-darkCard rounded-2xl border-2 border-dashed border-gray-200 dark:border-darkBorder">No leave requests found.</div>' : leaves.map(l => {
                    const emp = employees.find(e => e.id === l.employee_id);
                    return `
                        <div class="bg-white dark:bg-darkCard p-6 rounded-2xl border border-gray-200 dark:border-darkBorder shadow-sm space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-bold">${emp?.name.charAt(0)}</div>
                                    <div>
                                        <div class="font-bold text-sm">${emp?.name}</div>
                                        <div class="text-[10px] text-gray-400 uppercase font-black">${l.type}</div>
                                    </div>
                                </div>
                                <span class="px-2 py-1 ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : l.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} text-[10px] font-black rounded-full uppercase">${l.status}</span>
                            </div>
                            <div class="flex items-center gap-4 text-xs font-bold text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                                <div><i class="fa-solid fa-calendar mr-2"></i> ${l.start_date}</div>
                                <div><i class="fa-solid fa-arrow-right mr-2"></i> ${l.end_date}</div>
                            </div>
                                <div class="flex gap-2">
                                    <button onclick="editLeave(${l.id})" class="p-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-500 rounded-lg transition-all" title="Edit record"><i class="fa-solid fa-pen-to-square text-[10px]"></i></button>
                                    ${l.status === 'pending' ? `
                                        <button onclick="updateLeaveStatus(${l.id}, 'approved')" class="flex-1 bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-700 py-2 rounded-lg text-[10px] font-black uppercase transition-all">Approve</button>
                                        <button onclick="updateLeaveStatus(${l.id}, 'rejected')" class="flex-1 bg-red-100 hover:bg-red-600 hover:text-white text-red-700 py-2 rounded-lg text-[10px] font-black uppercase transition-all">Reject</button>
                                    ` : ''}
                                    <button onclick="deleteLeave(${l.id})" class="p-2 bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 rounded-lg transition-all" title="Delete record"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                                </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

async function renderLoans(container) {
    const loans = await db.loans.reverse().toArray();
    const employees = await db.employees.toArray();

    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold">Employee Loans & Advances</h2>
                <button onclick="openLoanModal()" class="bg-primary px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> New Advance
                </button>
            </div>
            <div class="bg-white dark:bg-darkCard rounded-2xl border border-gray-200 dark:border-darkBorder overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500">
                        <tr>
                            <th class="p-4 text-xs font-bold uppercase">Employee</th>
                            <th class="p-4 text-xs font-bold uppercase">Date</th>
                            <th class="p-4 text-xs font-bold uppercase text-right">Amount</th>
                            <th class="p-4 text-xs font-bold uppercase text-center">Status</th>
                            <th class="p-4 text-xs font-bold uppercase text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                        ${loans.length === 0 ? '<tr><td colspan="5" class="p-12 text-center text-gray-400">No active loans.</td></tr>' : loans.map(l => {
                            const emp = employees.find(e => e.id === l.employee_id);
                            return `
                                <tr>
                                    <td class="p-4 font-bold text-sm">${emp?.name}</td>
                                    <td class="p-4 text-sm text-gray-500">${new Date(l.date).toLocaleDateString()}</td>
                                    <td class="p-4 text-right font-black ${l.status === 'repaid' ? 'text-emerald-500' : 'text-red-600'}">${formatCurrency(l.amount)}</td>
                                    <td class="p-4 text-center">
                                        <span class="px-2 py-1 ${l.status === 'repaid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-[10px] font-bold rounded-full uppercase">${l.status}</span>
                                    </td>
                                    <td class="p-4 text-center">
                                        <div class="flex items-center justify-center gap-3">
                                            ${l.status === 'pending' ? `
                                                <button onclick="markLoanRepaid(${l.id})" class="text-[10px] font-black uppercase text-primary hover:underline">Repaid?</button>
                                            ` : `
                                                <i class="fa-solid fa-circle-check text-emerald-500"></i>
                                            `}
                                            <button onclick="editLoan(${l.id})" class="p-2 text-gray-400 hover:text-primary transition-colors" title="Edit Advance">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            <button onclick="deleteLoan(${l.id})" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete Advance">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- MODAL & FORM HELPERS ---

async function openLeaveModal(id = null) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');

    let leave = null;
    if (id) {
        leave = await db.leaves.get(id);
    }

    document.getElementById('hr-modal-title').textContent = leave ? 'Edit Leave Request' : 'New Leave Request';
    document.getElementById('hr-modal-subtitle').textContent = 'Employee Absence Management';
    document.getElementById('hr-submit-btn-text').textContent = leave ? 'Update Request' : 'Submit Request';
    
    body.innerHTML = `
        <form id="hr-form" onsubmit="handleLeaveSubmit(event, ${id})" class="p-8 space-y-6">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Employee</label>
                <select id="leave-emp-id" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                    ${employees.map(e => `<option value="${e.id}" ${leave?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Leave Type</label>
                <select id="leave-type" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                    <option value="Annual" ${leave?.type === 'Annual' ? 'selected' : ''}>Annual Leave</option>
                    <option value="Sick" ${leave?.type === 'Sick' ? 'selected' : ''}>Sick Leave</option>
                    <option value="Casual" ${leave?.type === 'Casual' ? 'selected' : ''}>Casual Leave</option>
                    <option value="Emergency" ${leave?.type === 'Emergency' ? 'selected' : ''}>Emergency</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                    <input type="date" id="leave-start" required value="${leave?.start_date || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                    <input type="date" id="leave-end" required value="${leave?.end_date || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                <input type="text" id="leave-reason" value="${leave?.reason || ''}" placeholder="Brief explanation..." class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
            </div>
        </form>
    `;

    if (!leave) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('leave-start').value = today;
        document.getElementById('leave-end').value = today;
    }


    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleLeaveSubmit(event, id = null) {
    event.preventDefault();
    const data = {
        employee_id: parseInt(document.getElementById('leave-emp-id').value),
        type: document.getElementById('leave-type').value,
        start_date: document.getElementById('leave-start').value,
        end_date: document.getElementById('leave-end').value,
        reason: document.getElementById('leave-reason').value,
        status: 'pending'
    };

    if (id) {
        await db.leaves.update(id, data);
        showAlert('Updated', 'Leave request updated.');
    } else {
        await db.leaves.add(data);
        showAlert('Success', 'Leave request submitted for approval.');
    }
    
    closeHRModal();
    renderHRTab('leave');
}

async function openLoanModal(id = null) {
    const employees = await db.employees.where('status').equals('active').toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');

    let loan = null;
    if (id) {
        loan = await db.loans.get(id);
    }

    document.getElementById('hr-modal-title').textContent = loan ? 'Edit Loan Record' : 'New Loan / Advance';
    document.getElementById('hr-modal-subtitle').textContent = 'Employee Financial Support';
    document.getElementById('hr-submit-btn-text').textContent = loan ? 'Update Record' : 'Disburse Funds';
    
    body.innerHTML = `
        <form id="hr-form" onsubmit="handleLoanSubmit(event, ${id})" class="p-8 space-y-6">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Employee</label>
                <select id="loan-emp-id" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                    ${employees.map(e => `<option value="${e.id}" ${loan?.employee_id === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Advance Amount</label>
                <input type="number" id="loan-amount" step="0.01" required min="1" value="${loan?.amount || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl font-black text-primary outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input type="date" id="loan-date" required value="${loan?.date || ''}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
            </div>
        </form>
    `;

    if (!loan) {
        document.getElementById('loan-date').value = new Date().toISOString().split('T')[0];
    }
    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleLoanSubmit(event, id = null) {
    event.preventDefault();
    const empId = parseInt(document.getElementById('loan-emp-id').value);
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const date = document.getElementById('loan-date').value;
    const emp = await db.employees.get(empId);

    try {
        if (id) {
            await db.loans.update(id, {
                employee_id: empId,
                amount: amount,
                date: date
            });
            showAlert('Updated', 'Loan record modified. Ledger entries must be manually checked if amount changed.');
        } else {
            await db.transaction('rw', db.loans, db.ledger, db.accounts, async () => {
                const accounts = await db.accounts.toArray();
                const getAccId = (code) => accounts.find(a => a.code === code)?.id;
                const receivableAccId = getAccId('1200'); // Use Accounts Receivable or employee loan account
                const cashAccId = getAccId('1000'); 

                // 1. Add Loan Record
                await db.loans.add({
                    employee_id: empId,
                    amount: amount,
                    date: date,
                    status: 'pending'
                });

                // 2. Ledger Record (Debit Loan Receivable, Credit Cash)
                if (typeof recordTransaction === 'function') {
                    await recordTransaction(receivableAccId, amount, 'debit', `Loan Disbursement - ${emp.name}`, 'Loan', '-');
                    await recordTransaction(cashAccId, amount, 'credit', `Loan Disbursement - ${emp.name}`, 'Loan', '-');
                }
            });
            showAlert('Success', 'Loan disbursed and recorded in ledger.');
        }

        closeHRModal();
        renderHRTab('loans');
    } catch (err) {
        showAlert('Error', 'Failed to process loan: ' + err.message, 'error');
    }
}

async function markLoanRepaid(loanId) {
    const loan = await db.loans.get(loanId);
    const emp = await db.employees.get(loan.employee_id);

    const { isConfirmed } = await Swal.fire({
        title: 'Mark as Repaid?',
        text: `Confirm repayment of ${formatCurrency(loan.amount)} from ${emp.name}. This will debit Cash and credit Receivable.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Repaid'
    });

    if (!isConfirmed) return;

    try {
        await db.transaction('rw', db.loans, db.ledger, db.accounts, async () => {
            const accounts = await db.accounts.toArray();
            const getAccId = (code) => accounts.find(a => a.code === code)?.id;
            const receivableAccId = getAccId('1200');
            const cashAccId = getAccId('1000');

            await db.loans.update(loanId, { status: 'repaid' });

            if (typeof recordTransaction === 'function') {
                await recordTransaction(cashAccId, loan.amount, 'debit', `Loan Repayment - ${emp.name}`, 'Loan', loanId);
                await recordTransaction(receivableAccId, loan.amount, 'credit', `Loan Repayment - ${emp.name}`, 'Loan', loanId);
            }
        });

        showAlert('Success', 'Loan marked as repaid.');
        renderHRTab('loans');
    } catch (err) {
        showAlert('Error', 'Failed to update loan status: ' + err.message, 'error');
    }
}

async function updateLeaveStatus(id, status) {
    await db.leaves.update(id, { status });
    showAlert('Success', `Leave request ${status}`);
    renderHRTab('leave');
}
async function previewPayslip(empId, isPreviewOnly = false) {
    const emp = await db.employees.get(empId);
    if (!emp) return;

    const month = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();
    const storeInfo = await db.settings.toArray();
    let opts = {};
    storeInfo.forEach(s => opts[s.key] = s.value);

    const mIdx = new Date().getMonth();
    const start = new Date(year, mIdx, 1).toISOString().split('T')[0];
    const end = new Date(year, mIdx + 1, 0).toISOString().split('T')[0];
    
    const metrics = await payrollSystem.calculateEarningsFromAttendance(emp, start, end);
    const grossBase = metrics.basePay + metrics.otPay - metrics.latePenalty;
    const tax = payrollSystem.calculateTaxes(grossBase, 'LK');

    // Fetch allowances
    const allowances = await db.allowances.where('employee_id').equals(empId).filter(a => a.month === month && a.year === year).toArray();
    const totalAllowances = allowances.reduce((s, a) => s + (a.amount || 0), 0);

    // Fetch pending loan deductions
    const loans = await db.loans.where('employee_id').equals(empId).filter(l => l.status === 'pending').toArray();
    const loanDeduction = loans.reduce((s, l) => s + (l.amount || 0), 0);

    const net = grossBase + totalAllowances - tax - loanDeduction;

    const html = buildPayslipHTML(emp, opts, month, year, {
        basePay: metrics.basePay,
        otPay: metrics.otPay,
        latePenalty: metrics.latePenalty,
        tax,
        net,
        totalOTHours: metrics.totalOTHours,
        allowances,
        loanDeduction,
        totalAllowances
    }, isPreviewOnly);

    Swal.fire({
        title: isPreviewOnly ? 'Payslip Preview' : 'Official Payslip',
        html: html,
        width: '850px',
        confirmButtonText: '<i class="fa-solid fa-file-arrow-down mr-2"></i> Download PDF',
        showDenyButton: true,
        denyButtonText: '<i class="fa-solid fa-print mr-1"></i> Print',
        denyButtonColor: '#475569',
        showCancelButton: true,
        cancelButtonText: 'Close',
        confirmButtonColor: '#4F46E5',
        didOpen: () => {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }).then(result => {
        if (result.isConfirmed) {
            generatePDFAndShare(html, `Payslip_${emp.name.replace(/\s+/g, '_')}_${month}_${year}.pdf`, { title: 'Employee Payslip' });
        } else if (result.isDenied) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`<html><head><title>Payslip - ${emp.name}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"></head><body>${html}<script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
            printWindow.document.close();
        }
    });
}

// Extra HR Functions
async function openDepartmentModal() {
    const departments = await db.departments.toArray();
    const modal = document.getElementById('hr-modal');
    const body = document.getElementById('hr-modal-body');
    
    document.getElementById('hr-modal-title').textContent = 'Department Management';
    document.getElementById('hr-modal-subtitle').textContent = 'Organize your organization';
    document.getElementById('hr-submit-btn-text').textContent = 'Create Department';
    
    body.innerHTML = `
        <div class="p-8 space-y-6">
            <form onsubmit="handleDepartmentSubmit(event)" class="flex gap-2">
                <input type="text" id="dept-name" required placeholder="New Department Name" class="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">
                <button type="submit" class="bg-primary text-white px-6 py-2 rounded-xl font-bold">Add</button>
            </form>
            
            <div class="space-y-2">
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-1">Existing Departments</h4>
                <div class="grid grid-cols-2 gap-2" id="dept-list">
                    ${departments.length === 0 ? '<p class="text-xs text-center text-gray-500 py-4 col-span-2">No departments created yet.</p>' : departments.map(d => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                            <span class="text-sm font-bold">${d.name}</span>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="editDepartment(${d.id}, '${d.name}')" class="text-blue-400 hover:text-blue-600 transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="deleteDepartment(${d.id})" class="text-red-400 hover:text-red-600 transition-colors"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    const content = modal.querySelector('.transform');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

async function handleDepartmentSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('dept-name').value;
    await db.departments.add({ name });
    document.getElementById('dept-name').value = '';
    openDepartmentModal(); // Refresh list
    if (typeof logActivity === 'function') await logActivity(`Created Department: ${name}`);
}

async function deleteDepartment(id) {
    if (confirm('Are you sure you want to delete this department?')) {
        await db.departments.delete(id);
        openDepartmentModal();
    }
}

async function editAttendance(empId, date) {
    const log = await db.attendance.where({ employee_id: empId, date: date }).first();
    const emp = await db.employees.get(empId);
    
    const { value: formValues } = await Swal.fire({
        title: `Edit Attendance - ${emp.name}`,
        html: `
            <div class="p-4 space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Clock In Time</label>
                    <input type="time" id="swal-clock-in" value="${log?.clock_in || ''}" class="w-full px-4 py-2 border rounded-xl">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Clock Out Time</label>
                    <input type="time" id="swal-clock-out" value="${log?.clock_out || ''}" class="w-full px-4 py-2 border rounded-xl">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select id="swal-status" class="w-full px-4 py-2 border rounded-xl">
                        <option value="present" ${log?.status === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${log?.status === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="half-day" ${log?.status === 'half-day' ? 'selected' : ''}>Half Day</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
            return {
                clock_in: document.getElementById('swal-clock-in').value,
                clock_out: document.getElementById('swal-clock-out').value,
                status: document.getElementById('swal-status').value
            }
        }
    });

    if (formValues) {
        if (log) {
            await db.attendance.update(log.id, formValues);
        } else {
            await db.attendance.add({
                employee_id: empId,
                date: date,
                ...formValues
            });
        }
        showAlert('Success', 'Attendance record updated');
        renderHRTab('attendance');
    }
}

async function exportAttendanceReport() {
    showAlert('Processing', 'Generating detailed monthly attendance report...', 'info');
    try {
        const employees = await db.employees.toArray();
        const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        
        const currentDate = new Date();
        const startObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endObj = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Pad month with zero if needed for ISO format
        const smStr = (startObj.getMonth() + 1).toString().padStart(2, '0');
        const emStr = (endObj.getMonth() + 1).toString().padStart(2, '0');
        const startDate = `${startObj.getFullYear()}-${smStr}-01`;
        const endDate = `${endObj.getFullYear()}-${emStr}-${endObj.getDate()}`;
        
        const logs = await db.attendance.where('date').between(startDate, endDate, true, true).toArray();
        
        if (logs.length === 0) {
            return showAlert('Info', 'No attendance logs found for this month.', 'info');
        }

        let csv = 'Employee ID,Name,Date,Clock In,Clock Out,Status\n';
        
        logs.forEach(log => {
            const emp = employees.find(e => e.id === log.employee_id);
            const name = emp ? emp.name : 'Unknown';
            csv += `${log.employee_id},"${name}","${log.date}","${log.clock_in || '--:--'}","${log.clock_out || '--:--'}","${log.status}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Attendance_${month.replace(' ', '_')}.csv`);
        a.style.visibility = 'hidden';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('Success', 'Monthly attendance report downloaded as CSV.', 'success');
    } catch (error) {
        console.error("Failed to export attendance:", error);
        showAlert('Error', 'Failed to generate attendance report.', 'error');
    }
}
async function deleteLeave(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Leave Request?',
        text: 'This record will be permanently removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });
    if (isConfirmed) {
        await db.leaves.delete(id);
        renderHRTab('leave');
    }
}

async function deleteLoan(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Advance Record?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });
    if (isConfirmed) {
        await db.loans.delete(id);
        renderHRTab('loans');
    }
}
async function deleteAttendance(id) {
    if (confirm('Delete this attendance record?')) {
        await db.attendance.delete(id);
        renderHRTab('attendance');
    }
}

async function editDepartment(id, oldName) {
    const { value: newName } = await Swal.fire({
        title: 'Edit Department',
        input: 'text',
        inputValue: oldName,
        showCancelButton: true
    });
    if (newName && newName !== oldName) {
        await db.departments.update(id, { name: newName });
        openDepartmentModal();
    }
}
function editLeave(id) {
    openLeaveModal(id);
}

function editLoan(id) {
    openLoanModal(id);
}

async function deletePayrollBatch(id) {
    const { isConfirmed } = await Swal.fire({
        title: 'Rollback Payroll Batch?',
        text: 'This will delete the batch record and all associated records. Are you SURE?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444'
    });

    if (isConfirmed) {
        const batch = await db.payroll_batches.get(id);
        if (batch) {
            await db.payroll.where('batch_id').equals(batch.batch_id).delete();
            await db.payroll_batches.delete(id);
            showAlert('Rollback', 'Payroll batch record and corresponding entries removed.');
            renderPayrollHistory();
        }
    }
}

async function payPayrollBatch(id) {
    const batch = await db.payroll_batches.get(id);
    if (!batch) return;

    const bankAccounts = await db.bank_accounts.toArray();
    if (bankAccounts.length === 0) {
        Swal.fire({
            title: 'No Bank Accounts',
            text: 'You need to register at least one bank account first under Bank Management.',
            icon: 'warning',
            confirmButtonColor: '#4F46E5'
        });
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: 'Disburse Payroll Payout',
        width: '600px',
        html: `
            <div class="text-left space-y-4 p-2 font-sans">
                <!-- Batch Info Card -->
                <div class="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-400 font-bold uppercase tracking-widest">Disbursement Period</span>
                        <span class="font-black text-indigo-600 uppercase italic tracking-tighter">${batch.month} ${batch.year}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs mt-1.5">
                        <span class="text-gray-400 font-bold uppercase tracking-widest">Batch Reference</span>
                        <span class="font-bold text-gray-500 font-mono select-all">${batch.batch_id}</span>
                    </div>
                    <div class="flex justify-between items-center mt-3 pt-3 border-t border-indigo-100/50">
                        <span class="text-gray-500 font-black uppercase text-[10px] tracking-widest">Total Net Payable</span>
                        <span class="font-black text-2xl text-primary italic">${formatCurrency(batch.total_net_payout)}</span>
                    </div>
                </div>

                <!-- Fields -->
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Pay From Bank Account</label>
                    <select id="payout-bank-id" class="swal2-select w-full m-0 rounded-2xl font-bold" style="display: block; box-sizing: border-box; width: 100%;">
                        ${bankAccounts.map(a => `<option value="${a.id}">${a.name} (${a.bank_name || ''}) — Bal: ${formatCurrency(a.balance)}</option>`).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                        <select id="payout-method" class="swal2-select w-full m-0 rounded-2xl font-bold" style="display: block; box-sizing: border-box; width: 100%;">
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Company Cheque">Company Cheque</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Transaction Ref #</label>
                        <input type="text" id="payout-ref" class="swal2-input w-full m-0 rounded-2xl font-bold" style="box-sizing: border-box; width: 100%; height: 48px;" placeholder="Txn Hash, Cheque #, etc.">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payout Date</label>
                    <input type="date" id="payout-date" class="swal2-input w-full m-0 rounded-2xl font-bold" style="box-sizing: border-box; width: 100%; height: 48px;" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-circle-check mr-2"></i> Confirm Disbursement',
        confirmButtonColor: '#10b981',
        preConfirm: () => {
            const bankAccId = parseInt(document.getElementById('payout-bank-id').value);
            const method = document.getElementById('payout-method').value;
            const reference = document.getElementById('payout-ref').value;
            const date = document.getElementById('payout-date').value;

            if (isNaN(bankAccId)) {
                Swal.showValidationMessage('Please select a valid bank account');
                return false;
            }
            return { bankAccId, method, reference, date };
        }
    });

    if (formValues) {
        const selectedAcc = bankAccounts.find(a => a.id === formValues.bankAccId);
        if (!selectedAcc) return;

        // Balance Check & Alert
        if (selectedAcc.balance < batch.total_net_payout) {
            const confirmLowBalance = await Swal.fire({
                title: 'Insufficient Balance',
                text: `Account balance (${formatCurrency(selectedAcc.balance)}) is less than total payout (${formatCurrency(batch.total_net_payout)}). Proceed anyway?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Yes, Proceed'
            });
            if (!confirmLowBalance.isConfirmed) return;
        }

        try {
            Swal.fire({
                title: 'Disbursing Salaries...',
                html: 'Updating ledgers and deducting balances...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            // 1. Process Bank Transaction and update bank balance
            const referenceStr = formValues.reference || batch.batch_id;
            await recordBankTransaction(
                formValues.bankAccId,
                'outward',
                formValues.method,
                batch.total_net_payout,
                referenceStr,
                `Payroll Payout for ${batch.month} ${batch.year} (Batch: ${batch.batch_id})`,
                formValues.date
            );

            // 2. Update Batch Status in database
            await db.payroll_batches.update(id, {
                status: 'Paid',
                paid_date: formValues.date,
                payment_method: formValues.method,
                payment_reference: referenceStr,
                paid_from_bank_account_id: formValues.bankAccId
            });

            Swal.close();

            await Swal.fire({
                title: 'Salaries Paid Successfully',
                text: `Rs. ${batch.total_net_payout.toLocaleString(undefined, {minimumFractionDigits: 2})} successfully disbursed from ${selectedAcc.name}.`,
                icon: 'success',
                confirmButtonColor: '#4F46E5'
            });

            // Refresh views
            if (typeof renderHRTab === 'function') renderHRTab('payroll');
            await renderPayrollHistory();

        } catch (err) {
            Swal.close();
            console.error("Disbursement failure:", err);
            showAlert('Disbursement Error', err.message, 'error');
        }
    }
}

