// store_management.js

let currentActiveStore = 'all';

// Initialize the module
async function initStoreManagement() {
    renderStoresUI();
    await loadGlobalStores();
    
    // Listen for global store change
    const globalSelector = document.getElementById('global-store-selector');
    if (globalSelector) {
        globalSelector.addEventListener('change', async (e) => {
            currentActiveStore = e.target.value;
            // Dispatch a custom event so other modules can reactively filter data
            window.dispatchEvent(new CustomEvent('activeStoreChanged', { detail: { storeId: currentActiveStore } }));
            await loadTransfers(); // Reload transfers based on context
        });
    }
}

// Ensure init is run when DOM is loaded or when script is parsed
document.addEventListener('DOMContentLoaded', initStoreManagement);

function renderStoresUI() {
    const container = document.getElementById('stores-view');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col space-y-6 max-w-7xl mx-auto h-full">
            <div class="flex justify-between items-center bg-white dark:bg-darkCard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder">
                <div>
                    <h2 class="text-2xl font-black text-gray-900 dark:text-white">Virtual Stores & Transfers</h2>
                    <p class="text-sm text-gray-500">Manage multiple store locations and transfer stock between them.</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="openAddStoreModal()" class="bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Add New Store
                    </button>
                    <button onclick="openTransferModal()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                        <i class="fa-solid fa-right-left"></i> New Transfer
                    </button>
                </div>
            </div>

            <!-- Stores List -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="stores-grid">
                <!-- Store cards will be loaded here -->
            </div>

            <!-- Transfers Section -->
            <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder overflow-hidden flex-1 flex flex-col">
                <div class="p-6 border-b border-gray-100 dark:border-darkBorder flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">Stock Transfers</h3>
                    <div class="flex gap-2">
                        <button onclick="filterTransfers('all')" class="px-4 py-2 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">All</button>
                        <button onclick="filterTransfers('pending')" class="px-4 py-2 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</button>
                        <button onclick="filterTransfers('completed')" class="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Completed</button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-darkBorder">
                                <th class="p-4 font-bold">Date / Ref</th>
                                <th class="p-4 font-bold">From Store</th>
                                <th class="p-4 font-bold">To Store</th>
                                <th class="p-4 font-bold">Product</th>
                                <th class="p-4 font-bold text-right">Qty</th>
                                <th class="p-4 font-bold text-center">Status</th>
                                <th class="p-4 font-bold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody id="transfers-table-body" class="divide-y divide-gray-100 dark:divide-darkBorder text-sm">
                            <!-- Transfers load here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    loadStores();
    loadTransfers();
}

async function loadGlobalStores() {
    const globalSelector = document.getElementById('global-store-selector');
    if (!globalSelector) return;
    
    try {
        let stores = await db.stores.toArray();
        let optionsHtml = '<option value="all">Global/All Stores</option>';

        // Filter stores based on current user assignedStoreIds
        if (window.currentUser && window.currentUser.role !== 'admin') {
            const assigned = window.currentUser.assignedStoreIds || [];
            stores = stores.filter(store => assigned.includes(store.id));
            
            // Re-check if 'all' should be active or the first assigned store
            if (!assigned.includes(Number(currentActiveStore)) && currentActiveStore !== 'all') {
                currentActiveStore = stores.length > 0 ? String(stores[0].id) : 'all';
                window.dispatchEvent(new CustomEvent('activeStoreChanged', { detail: { storeId: currentActiveStore } }));
                loadTransfers();
            }
        }

        stores.forEach(store => {
            optionsHtml += `<option value="${store.id}">${store.name}</option>`;
        });
        globalSelector.innerHTML = optionsHtml;
        globalSelector.value = currentActiveStore;
    } catch (e) {
        console.error("Failed to load stores for global dropdown:", e);
    }
}

async function loadStores() {
    try {
        const stores = await db.stores.toArray();
        const grid = document.getElementById('stores-grid');
        if (!grid) return;

        if (stores.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <i class="fa-solid fa-store-slash text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
                    <p class="text-gray-500 font-medium">No stores added yet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = stores.map(store => `
            <div class="bg-white dark:bg-darkCard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkBorder hover:shadow-md transition-shadow relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div class="flex justify-between items-start mb-4 relative">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <i class="fa-solid fa-store text-xl"></i>
                    </div>
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${store.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}">
                        ${store.status}
                    </span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">${store.name}</h3>
                <p class="text-xs text-gray-500 mb-4 whitespace-nowrap overflow-hidden text-ellipsis"><i class="fa-solid fa-location-dot mr-1"></i> ${store.location || 'No location'}</p>
                <div class="flex justify-between items-center border-t border-gray-100 dark:border-darkBorder pt-4 mt-auto">
                    <button onclick="editStore(${store.id})" class="text-xs font-bold text-primary hover:text-indigo-700 transition-colors uppercase tracking-widest"><i class="fa-solid fa-pen-to-square mr-1"></i> Edit</button>
                    <button onclick="deleteStore(${store.id})" class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest"><i class="fa-solid fa-trash mr-1"></i> Delete</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Error loading stores:", e);
    }
}

async function openAddStoreModal(storeId = null) {
    let store = null;
    if (storeId) {
        store = await db.stores.get(storeId);
    }

    Swal.fire({
        title: storeId ? 'Edit Virtual Store' : 'Add Virtual Store',
        html: `
            <div class="space-y-4 text-left">
                <input id="swal-store-name" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-gray-900 dark:text-white transition-all outline-none" placeholder="Store Name" value="${store ? store.name : ''}">
                <input id="swal-store-location" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-gray-900 dark:text-white transition-all outline-none" placeholder="Location/Address" value="${store ? store.location : ''}">
                <input id="swal-store-contact" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-gray-900 dark:text-white transition-all outline-none" placeholder="Contact Number" value="${store ? store.contact || '' : ''}">
                <select id="swal-store-status" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl text-gray-900 dark:text-white transition-all outline-none">
                    <option value="active" ${store && store.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${store && store.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: storeId ? 'Update Store' : 'Save Store',
        confirmButtonColor: '#0e3257',
        preConfirm: () => {
            const name = document.getElementById('swal-store-name').value;
            if (!name) {
                Swal.showValidationMessage('Store name is required');
                return false;
            }
            return {
                name,
                location: document.getElementById('swal-store-location').value,
                contact: document.getElementById('swal-store-contact').value,
                status: document.getElementById('swal-store-status').value
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            if (storeId) {
                await db.stores.update(storeId, result.value);
                Swal.fire('Updated!', 'Store has been updated.', 'success');
            } else {
                await db.stores.add(result.value);
                Swal.fire('Added!', 'Store has been added log.', 'success');
            }
            loadStores();
            loadGlobalStores();
        }
    });
}

window.editStore = openAddStoreModal;

window.deleteStore = async function(id) {
    const result = await Swal.fire({
        title: 'Delete this store?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
        await db.stores.delete(id);
        Swal.fire('Deleted', '', 'success');
        loadStores();
        loadGlobalStores();
    }
}

let activeTransferFilter = 'all';

window.filterTransfers = function(status) {
    activeTransferFilter = status;
    loadTransfers();
};

async function loadTransfers() {
    try {
        const tbody = document.getElementById('transfers-table-body');
        if (!tbody) return;

        let transfersQuery = db.stock_transfers;
        
        // Context aware: filter by active store if not 'all'
        let transfers = await transfersQuery.reverse().toArray();
        if (currentActiveStore !== 'all') {
            const sid = Number(currentActiveStore);
            transfers = transfers.filter(t => t.from_store_id === sid || t.to_store_id === sid);
        }

        if (activeTransferFilter !== 'all') {
            transfers = transfers.filter(t => t.status === activeTransferFilter);
        }

        if (transfers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500 font-medium">No transfers found in this context.</td></tr>`;
            return;
        }

        let html = '';
        for (const tr of transfers) {
            const fromStore = await db.stores.get(tr.from_store_id);
            const toStore = await db.stores.get(tr.to_store_id);
            const prod = await db.products.get(tr.product_id);
            
            let statusBadge = '';
            let actionBtn = '';
            
            if (tr.status === 'pending') {
                statusBadge = `<span class="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 font-bold rounded text-[10px] uppercase tracking-widest">Pending</span>`;
                // Only destination store context can complete it
                const canComplete = currentActiveStore === 'all' || Number(currentActiveStore) === tr.to_store_id;
                
                if (canComplete) {
                     actionBtn = `<button onclick="completeTransfer(${tr.id})" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold text-xs shadow-sm transition-colors">Receive</button>`;
                } else {
                     actionBtn = `<span class="text-xs text-gray-400">Waiting Receipt</span>`;
                }
            } else {
                statusBadge = `<span class="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 font-bold rounded text-[10px] uppercase tracking-widest">Completed</span>`;
                actionBtn = `<i class="fa-solid fa-check text-emerald-500"></i>`;
            }

            html += `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td class="p-4">
                        <div class="font-bold text-gray-900 dark:text-white">${tr.reference || 'TR-Auto'}</div>
                        <div class="text-xs text-gray-500">${new Date(tr.date).toLocaleDateString()}</div>
                    </td>
                    <td class="p-4 text-gray-700 dark:text-gray-300">${fromStore ? fromStore.name : 'Unknown'}</td>
                    <td class="p-4 text-gray-700 dark:text-gray-300">${toStore ? toStore.name : 'Unknown'}</td>
                    <td class="p-4 font-bold text-primary dark:text-indigo-400">${prod ? prod.name : 'Unknown Product'}</td>
                    <td class="p-4 text-right font-black">${tr.quantity}</td>
                    <td class="p-4 text-center">${statusBadge}</td>
                    <td class="p-4 text-center">
                        <div class="flex items-center justify-center gap-1">
                            ${actionBtn}
                            <button onclick="editTransfer(${tr.id})" class="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Edit Transfer"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="deleteTransfer(${tr.id})" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Delete Transfer"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    } catch(e) {
        console.error("Error loading transfers:", e);
    }
}

window.openTransferModal = async function() {
    const stores = await db.stores.toArray();
    if(stores.length < 2) {
         Swal.fire('Error', 'You need at least 2 stores to create a transfer.', 'error');
         return;
    }
    
    // Fetch products
    const products = await db.products.toArray();
    let pOptions = '<option value="">Select a Product</option>';
    products.forEach(p => { pOptions += `<option value="${p.id}">${p.name} (SKU: ${p.sku})</option>` });

    let sOptions = '';
    stores.forEach(s => { sOptions += `<option value="${s.id}">${s.name}</option>` });

    Swal.fire({
        title: 'New Stock Transfer',
        html: `
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">From Store</label>
                    <select id="swal-tr-from" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">${sOptions}</select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">To Store</label>
                    <select id="swal-tr-to" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">${sOptions}</select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Product</label>
                    <select id="swal-tr-prod" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none">${pOptions}</select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                    <input type="number" id="swal-tr-qty" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-xl outline-none" min="1" placeholder="Transfer Qty">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Initiate Transfer',
        confirmButtonColor: '#01a5a5',
        preConfirm: () => {
            const fromId = Number(document.getElementById('swal-tr-from').value);
            const toId = Number(document.getElementById('swal-tr-to').value);
            const prodId = Number(document.getElementById('swal-tr-prod').value);
            const qty = Number(document.getElementById('swal-tr-qty').value);

            if (fromId === toId) {
                Swal.showValidationMessage('Source and destination stores must be different');
                return false;
            }
            if (!prodId || qty <= 0) {
                 Swal.showValidationMessage('Valid product and quantity required');
                 return false;
            }
            return { fromId, toId, prodId, qty };
        }
    }).then(async (result) => {
        if(result.isConfirmed) {
            await createTransfer(result.value);
        }
    });
}

async function createTransfer({fromId, toId, prodId, qty}) {
    // 1. Check if source store has enough stock in inventory table
    const invRecord = await db.inventory.where({product_id: prodId, store_id: fromId}).first();
    const sourceStock = invRecord ? invRecord.stock_qty : 0;
    
    // For simplicity, if standard product stock is tracked in main products, 
    // we should rely on inventory table first. If not found, check main product and migrate?
    // Let's assume inventory table tracks store stocks. If not enough stock, we warn.
    if (sourceStock < qty) {
        const prod = await db.products.get(prodId);
        // Maybe it's in the global stock but not assigned yet.
        if (prod.stock_qty >= qty && sourceStock === 0) {
             // Migrate standard stock to this store as a baseline for this simulation
             await db.inventory.add({product_id: prodId, store_id: fromId, stock_qty: prod.stock_qty});
        } else {
             Swal.fire('Insufficient Stock', `Store does not have ${qty} units. Current stock: ${sourceStock}`, 'error');
             return;
        }
    }

    // 2. Deduct from source store IMMEDIATELY (it's in transit)
    const updatedSourceRec = await db.inventory.where({product_id: prodId, store_id: fromId}).first();
    await db.inventory.update(updatedSourceRec.id, { stock_qty: updatedSourceRec.stock_qty - qty });

    // 3. Create Transfer Record (Pending)
    const transfer = {
        date: new Date().toISOString(),
        from_store_id: fromId,
        to_store_id: toId,
        product_id: prodId,
        quantity: qty,
        status: 'pending',
        reference: 'TR-' + Date.now().toString().slice(-6)
    };
    await db.stock_transfers.add(transfer);

    Swal.fire('Transfer Initiated', 'Stock deducted from source and is pending receipt.', 'success');
    loadTransfers();
}

window.completeTransfer = async function(transferId) {
    const tr = await db.stock_transfers.get(transferId);
    if (!tr || tr.status !== 'pending') return;

    // 1. Check if destination inventory record exists
    let destInv = await db.inventory.where({product_id: tr.product_id, store_id: tr.to_store_id}).first();
    if (destInv) {
         await db.inventory.update(destInv.id, { stock_qty: destInv.stock_qty + tr.quantity });
    } else {
         await db.inventory.add({
             product_id: tr.product_id, 
             store_id: tr.to_store_id, 
             stock_qty: tr.quantity
         });
    }

    // 2. Mark transfer as completed
    await db.stock_transfers.update(transferId, { status: 'completed' });
    
    Swal.fire('Transfer Completed', 'Stock has been added to destination store.', 'success');
    loadTransfers();
}

window.editTransfer = async function(transferId) {
    const tr = await db.stock_transfers.get(transferId);
    if (!tr) return;

    const stores = await db.stores.toArray();
    const products = await db.products.toArray();
    const prod = products.find(p => p.id === tr.product_id);

    const { value: formValues } = await Swal.fire({
        title: 'Edit Stock Transfer',
        html: `
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Product</label>
                    <input id="swal-tr-prod-name" class="swal2-input w-full m-0" value="${prod ? prod.name : 'Unknown'}" readonly disabled>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label>
                    <input type="number" id="swal-tr-qty" class="swal2-input w-full m-0" min="1" value="${tr.quantity}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Reference</label>
                    <input type="text" id="swal-tr-ref" class="swal2-input w-full m-0" value="${tr.reference || ''}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                    <select id="swal-tr-status" class="swal2-select w-full m-0">
                        <option value="pending" ${tr.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${tr.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Update Transfer',
        confirmButtonColor: '#0e3257',
        preConfirm: () => {
            const qty = Number(document.getElementById('swal-tr-qty').value);
            if (!qty || qty <= 0) {
                Swal.showValidationMessage('Quantity must be greater than 0');
                return false;
            }
            return {
                quantity: qty,
                reference: document.getElementById('swal-tr-ref').value,
                status: document.getElementById('swal-tr-status').value
            };
        }
    });

    if (formValues) {
        try {
            await db.stock_transfers.update(transferId, formValues);
            showAlert('Updated', 'Transfer record updated successfully.', 'success');
            loadTransfers();
        } catch (err) {
            showAlert('Error', 'Failed to update transfer: ' + err.message, 'error');
        }
    }
}

window.deleteTransfer = async function(transferId) {
    const tr = await db.stock_transfers.get(transferId);
    if (!tr) return;

    const result = await Swal.fire({
        title: 'Delete Transfer?',
        text: tr.status === 'pending' ? 'This pending transfer will be cancelled and stock returned to the source store.' : 'This completed transfer record will be permanently removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            // If transfer was pending, return stock to source store
            if (tr.status === 'pending') {
                const sourceInv = await db.inventory.where({product_id: tr.product_id, store_id: tr.from_store_id}).first();
                if (sourceInv) {
                    await db.inventory.update(sourceInv.id, { stock_qty: sourceInv.stock_qty + tr.quantity });
                }
            }

            await db.stock_transfers.delete(transferId);
            showAlert('Deleted', 'Transfer record removed.', 'success');
            loadTransfers();
        } catch (err) {
            showAlert('Error', 'Failed to delete transfer: ' + err.message, 'error');
        }
    }
}
