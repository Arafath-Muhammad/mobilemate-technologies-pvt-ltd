// Service & Maintenance Module
let currentServiceTab = 'list';
let currentServiceFilter = {
    status: 'all',
    dateRange: 'all'
};

async function loadService() {
    console.log("Loading Service & Maintenance view...");
    const container = document.getElementById('service-view');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const firstDay = today;
    const lastDay = today;

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Service & Maintenance</h2>
                    <p class="text-sm text-gray-500 font-medium tracking-wide">Track device servicing, repairs, and maintenance records.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="openServiceModal()" class="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/30 transition-all flex items-center gap-3 active:scale-95">
                        <i class="fa-solid fa-wrench text-lg"></i> Record Service
                    </button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex items-center gap-2 bg-white dark:bg-darkCard p-2 rounded-[2rem] shadow-sm border border-gray-100 dark:border-darkBorder overflow-x-auto no-scrollbar sticky top-16 z-30 backdrop-blur-md">
                <button onclick="switchServiceTab('list')" class="service-tab-btn flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${currentServiceTab === 'list' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}" data-tab="list">
                    <i class="fa-solid fa-list-check"></i> Service Orders
                </button>
                <button onclick="switchServiceTab('analytics')" class="service-tab-btn flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${currentServiceTab === 'analytics' ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}" data-tab="analytics">
                    <i class="fa-solid fa-chart-pie"></i> Maintenance Insights
                </button>
            </div>

            <div id="service-tab-content" class="animate-fade-in-up">
                <!-- Content injected here -->
            </div>
        </div>
    `;

    renderServiceTab(currentServiceTab);
}

function switchServiceTab(tab) {
    currentServiceTab = tab;
    renderServiceTab(tab);
}

async function renderServiceTab(tab) {
    const content = document.getElementById('service-tab-content');
    if (!content) return;

    // Update tab button styles
    document.querySelectorAll('.service-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('bg-amber-500', 'text-white', 'shadow-xl', 'shadow-amber-500/20');
            btn.classList.remove('text-gray-500', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');
        } else {
            btn.classList.remove('bg-amber-500', 'text-white', 'shadow-xl', 'shadow-amber-500/20');
            btn.classList.add('text-gray-500', 'hover:bg-gray-50', 'dark:hover:bg-gray-800');
        }
    });

    if (tab === 'list') {
        await renderServiceList(content);
    } else {
        await renderServiceAnalytics(content);
    }
}

async function renderServiceList(container) {
    const services = await db.service_records?.toArray() || [];
    
    const html = `
        <div class="space-y-6">
            <!-- Filters -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder p-4 flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl">
                    <i class="fa-solid fa-calendar-alt text-amber-500 text-sm ml-2"></i>
                    <input type="date" id="service-start-date" value="${new Date().toISOString().split('T')[0]}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                    <span class="text-gray-300 font-black">/</span>
                    <input type="date" id="service-end-date" value="${new Date().toISOString().split('T')[0]}" class="bg-transparent border-none text-[11px] font-black text-gray-700 dark:text-gray-300 focus:ring-0 w-32 cursor-pointer uppercase">
                </div>
                <select id="service-status-filter" onchange="filterServiceList()" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-bold">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <input type="text" id="service-search" oninput="filterServiceList()" placeholder="Search Order # or Customer..." class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-amber-500">
            </div>

            <!-- Service Orders Table -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden">
                <div class="p-4 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <h2 class="font-black italic uppercase tracking-tighter">Service Orders</h2>
                        <span class="bg-gray-100 dark:bg-gray-800 text-[10px] px-2 py-1 rounded-lg font-black text-gray-500" id="service-count">${services.length} TOTAL</span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400">
                            <tr>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Order #</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Customer</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Device</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest text-right">Cost</th>
                                <th class="p-4 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="service-list-body" class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${services.length === 0 ? `
                            <tr>
                                <td colspan="7" class="px-8 py-32 text-center">
                                    <i class="fa-solid fa-wrench text-6xl text-gray-200 dark:text-gray-800 mb-4 block"></i>
                                    <p class="text-sm font-black uppercase tracking-widest italic text-gray-400">No service records yet</p>
                                </td>
                            </tr>
                            ` : services.map(s => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td class="p-4 font-mono text-xs font-bold text-gray-400">SRV-${String(s.id).padStart(5, '0')}</td>
                                <td class="p-4 text-sm">${new Date(s.date).toLocaleDateString()}</td>
                                <td class="p-4">
                                    <div class="font-bold text-sm">${s.customer_name || 'N/A'}</div>
                                    <div class="text-[10px] text-gray-500">${s.phone || '-'}</div>
                                </td>
                                <td class="p-4 text-sm">${s.device_name || 'N/A'}</td>
                                <td class="p-4">
                                    <span class="px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                        s.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                        s.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                                        'bg-amber-100 text-amber-600'
                                    }">
                                        ${s.status || 'pending'}
                                    </span>
                                </td>
                                <td class="p-4 text-right font-bold text-amber-600">${formatCurrency(s.cost || 0)}</td>
                                <td class="p-4 text-center">
                                    <div class="flex items-center justify-center gap-1">
                                        <button onclick="editServiceRecord(${s.id})" class="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button onclick="deleteServiceRecord(${s.id})" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('service-start-date')?.addEventListener('change', filterServiceList);
    document.getElementById('service-end-date')?.addEventListener('change', filterServiceList);
    
    filterServiceList();
}

async function renderServiceAnalytics(container) {
    const services = await db.service_records?.toArray() || [];
    
    const completed = services.filter(s => s.status === 'completed').length;
    const inProgress = services.filter(s => s.status === 'in-progress').length;
    const pending = services.filter(s => s.status === 'pending').length;
    const totalCost = services.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
    
    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Orders</span>
                    <i class="fa-solid fa-wrench text-2xl text-amber-500 opacity-20"></i>
                </div>
                <div class="text-3xl font-black text-gray-900 dark:text-white">${services.length}</div>
            </div>
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Completed</span>
                    <i class="fa-solid fa-check-circle text-2xl text-emerald-500 opacity-20"></i>
                </div>
                <div class="text-3xl font-black text-emerald-600">${completed}</div>
            </div>
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">In Progress</span>
                    <i class="fa-solid fa-spinner text-2xl text-blue-500 opacity-20"></i>
                </div>
                <div class="text-3xl font-black text-blue-600">${inProgress}</div>
            </div>
            <div class="bg-white dark:bg-darkCard p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Revenue</span>
                    <i class="fa-solid fa-coins text-2xl text-amber-500 opacity-20"></i>
                </div>
                <div class="text-3xl font-black text-amber-600">${formatCurrency(totalCost)}</div>
            </div>
        </div>
        
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder p-6">
            <h3 class="text-lg font-black mb-4">Status Distribution</h3>
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>Completed</span>
                    </div>
                    <span class="font-black">${completed} (${services.length > 0 ? Math.round((completed/services.length)*100) : 0}%)</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>In Progress</span>
                    </div>
                    <span class="font-black">${inProgress} (${services.length > 0 ? Math.round((inProgress/services.length)*100) : 0}%)</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span>Pending</span>
                    </div>
                    <span class="font-black">${pending} (${services.length > 0 ? Math.round((pending/services.length)*100) : 0}%)</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

async function filterServiceList() {
    const search = document.getElementById('service-search')?.value.toLowerCase() || '';
    const status = document.getElementById('service-status-filter')?.value || 'all';
    const startDate = document.getElementById('service-start-date')?.value || '';
    const endDate = document.getElementById('service-end-date')?.value || '';
    const body = document.getElementById('service-list-body');
    
    if (!body) return;

    let services = await db.service_records?.toArray() || [];
    
    // Apply filters
    if (status !== 'all') {
        services = services.filter(s => s.status === status);
    }
    
    if (startDate || endDate) {
        services = services.filter(s => {
            const d = s.date ? s.date.split('T')[0] : '';
            if (startDate && endDate) return d >= startDate && d <= endDate;
            if (startDate) return d >= startDate;
            if (endDate) return d <= endDate;
            return true;
        });
    }
    
    const filtered = services.filter(s => {
        const orderNo = `SRV-${String(s.id).padStart(5, '0')}`;
        return orderNo.toLowerCase().includes(search) || 
               (s.customer_name && s.customer_name.toLowerCase().includes(search)) ||
               (s.device_name && s.device_name.toLowerCase().includes(search));
    });
    
    const countEl = document.getElementById('service-count');
    if (countEl) countEl.textContent = `${filtered.length} TOTAL`;
    
    body.innerHTML = filtered.length === 0 ? 
        '<tr><td colspan="7" class="p-12 text-center text-gray-400">No service records found.</td></tr>' : 
        filtered.map(s => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="p-4 font-mono text-xs font-bold text-gray-400">SRV-${String(s.id).padStart(5, '0')}</td>
            <td class="p-4 text-sm">${new Date(s.date).toLocaleDateString()}</td>
            <td class="p-4">
                <div class="font-bold text-sm">${s.customer_name || 'N/A'}</div>
                <div class="text-[10px] text-gray-500">${s.phone || '-'}</div>
            </td>
            <td class="p-4 text-sm">${s.device_name || 'N/A'}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                    s.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                    s.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                }">
                    ${s.status || 'pending'}
                </span>
            </td>
            <td class="p-4 text-right font-bold text-amber-600">${formatCurrency(s.cost || 0)}</td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center gap-1">
                    <button onclick="editServiceRecord(${s.id})" class="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteServiceRecord(${s.id})" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
        `).join('');
}

async function openServiceModal(recordId = null) {
    const modal = document.getElementById('service-modal');
    if (!modal) {
        // Create modal if it doesn't exist
        createServiceModal();
        return openServiceModal(recordId);
    }
    
    const isEdit = recordId !== null;
    const record = isEdit ? await db.service_records?.get(recordId) : null;
    const customers = await db.customers.toArray();
    
    const html = `
        <div class="px-6 py-5 border-b border-gray-200 dark:border-darkBorder bg-amber-600 flex items-center justify-between text-white">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <i class="fa-solid fa-wrench text-lg"></i>
                </div>
                <div>
                    <h3 class="text-lg font-black italic tracking-tighter uppercase leading-none">${isEdit ? 'Edit Service Record' : 'Record Service'}</h3>
                    <p class="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">${isEdit ? 'Update service details' : 'Log a new service order'}</p>
                </div>
            </div>
            <button type="button" onclick="closeServiceModal()" class="w-8 h-8 rounded-lg bg-black/10 hover:bg-black/20 transition-colors flex items-center justify-center"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="handleServiceSubmit(event, ${recordId})" class="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-150px)]">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Customer</label>
                <select id="service-customer" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold">
                    <option value="">Select Customer...</option>
                    ${customers.map(c => `<option value="${c.id}" ${record?.customer_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Device Name / Serial</label>
                <input type="text" id="service-device" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold" 
                    placeholder="e.g. iPhone 14 Pro" value="${record?.device_name || ''}">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Service Type</label>
                    <select id="service-type" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold">
                        <option value="maintenance" ${record?.service_type === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="repair" ${record?.service_type === 'repair' ? 'selected' : ''}>Repair</option>
                        <option value="replacement" ${record?.service_type === 'replacement' ? 'selected' : ''}>Replacement</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                    <select id="service-status" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl outline-none font-bold">
                        <option value="pending" ${record?.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${record?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${record?.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Service Cost (Rs.)</label>
                <input type="number" id="service-cost" step="0.01" required class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl font-black text-amber-600 outline-none"
                    placeholder="0.00" value="${record?.cost || ''}">
            </div>
            
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Description</label>
                <textarea id="service-notes" class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-amber-500 rounded-2xl font-bold outline-none" 
                    rows="4" placeholder="Service details...">${record?.notes || ''}</textarea>
            </div>
            
            <div class="pt-4 flex gap-4 sticky bottom-0 bg-white dark:bg-darkCard">
                <button type="submit" class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/30 transition-all active:scale-95">
                    ${isEdit ? 'Update Service' : 'Record Service'}
                </button>
            </div>
        </form>
    `;
    
    modal.querySelector('.modal-content').innerHTML = html;
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        modal.querySelector('.modal-content').classList.remove('scale-95');
        modal.querySelector('.modal-content').classList.add('scale-100');
    }, 10);
}

function closeServiceModal() {
    const modal = document.getElementById('service-modal');
    if (modal) {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.remove('scale-100');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

async function handleServiceSubmit(event, recordId = null) {
    event.preventDefault();
    
    const customerId = parseInt(document.getElementById('service-customer').value);
    const deviceName = document.getElementById('service-device').value;
    const serviceType = document.getElementById('service-type').value;
    const status = document.getElementById('service-status').value;
    const cost = parseFloat(document.getElementById('service-cost').value) || 0;
    const notes = document.getElementById('service-notes').value;
    
    try {
        if (recordId) {
            // Update existing record
            await db.service_records.update(recordId, {
                customer_id: customerId,
                device_name: deviceName,
                service_type: serviceType,
                status: status,
                cost: cost,
                notes: notes
            });
        } else {
            // Create new record
            const customer = await db.customers.get(customerId);
            await db.service_records.add({
                date: new Date().toISOString(),
                customer_id: customerId,
                customer_name: customer?.name || 'Unknown',
                phone: customer?.phone || '',
                device_name: deviceName,
                service_type: serviceType,
                status: status,
                cost: cost,
                notes: notes
            });
        }
        
        showAlert('Success', recordId ? 'Service record updated.' : 'Service record created.', 'success');
        closeServiceModal();
        loadService();
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to save service record: ' + err.message, 'error');
    }
}

async function editServiceRecord(recordId) {
    await openServiceModal(recordId);
}

async function deleteServiceRecord(recordId) {
    const record = await db.service_records?.get(recordId);
    if (!record) return;
    
    const { isConfirmed } = await Swal.fire({
        title: 'Delete Service Record?',
        html: `<p>Service Order: <strong>SRV-${String(recordId).padStart(5, '0')}</strong></p>`,
        icon: 'warning',
        confirmButtonText: 'Yes, Delete',
        confirmButtonColor: '#ef4444',
        showCancelButton: true,
        cancelButtonText: 'Cancel'
    });
    
    if (isConfirmed) {
        try {
            await db.service_records?.delete(recordId);
            showAlert('Deleted', 'Service record deleted.', 'success');
            loadService();
        } catch (err) {
            showAlert('Error', 'Failed to delete: ' + err.message, 'error');
        }
    }
}

function createServiceModal() {
    const modal = document.createElement('div');
    modal.id = 'service-modal';
    modal.className = 'fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-md hidden opacity-0 transition-opacity duration-300';
    modal.innerHTML = `
        <div class="bg-white dark:bg-darkCard w-full h-full max-w-2xl max-h-[90vh] shadow-3xl flex flex-col overflow-hidden transform transition-transform duration-300 rounded-2xl modal-content scale-95">
            <!-- Filled by openServiceModal -->
        </div>
    `;
    document.body.appendChild(modal);
}

// Initialize modal on page load
if (!document.getElementById('service-modal')) {
    createServiceModal();
}
