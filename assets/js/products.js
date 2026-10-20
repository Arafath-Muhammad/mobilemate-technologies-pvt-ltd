// Inventory and Product Management
let inventoryCurrentPage = 1;
const inventoryPerPage = 20;
let inventoryCurrentCategory = '';

async function loadProducts() {
    console.log("Loading products view...");
    const productsView = document.getElementById('products-view');
    localStorage.setItem('last_active_view', 'products-view');
    if (!productsView) return;

    // Build UI
    const html = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder mb-6 flex flex-col">
            <!-- Header Actions -->
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50 sticky top-16 z-30 backdrop-blur-md">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all your shop products, pricing, and stock levels.</p>
                </div>
                
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div class="relative flex-1 sm:flex-none">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" id="inv-search" class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-primary focus:border-primary text-gray-900 dark:text-white w-full sm:w-64 transition-colors" placeholder="Search inventory...">
                    </div>
                    
                    <div class="flex items-center gap-2 flex-wrap">
                        <select id="inv-status-filter" onchange="inventoryCurrentPage=1; renderInventoryList(document.getElementById('inv-search').value);" class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus:ring-1 focus:ring-primary">
                            <option value="">All Stock</option>
                            <option value="in_stock">In Stock</option>
                            <option value="out_stock">Out of Stock</option>
                            <option value="low_stock">Re-order Level</option>
                        </select>

                        <select id="inv-category-filter" onchange="inventoryCurrentPage=1; renderInventoryList(document.getElementById('inv-search').value);" class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus:ring-1 focus:ring-primary">
                            <option value="">All Categories</option>
                        </select>
                        
                        <button onclick="openExportFilterModal()" class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 shadow-sm">
                            <i class="fa-solid fa-file-pdf text-red-500"></i> Report
                        </button>

                        <button onclick="openProductModal()" class="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                            <i class="fa-solid fa-plus"></i> <span class="whitespace-nowrap">Add Product</span>
                        </button>

                        <button onclick="resetAllStocksToZero()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                            <i class="fa-solid fa-rotate"></i> <span class="whitespace-nowrap">Reset Stocks</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Table section -->
            <div class="flex-1 p-0">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-[164px] z-10 shadow-sm">
                        <tr>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Product Name</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Category</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Brand</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">SKU/Barcode</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Cost</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Retail</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-right">Wholesl</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Stock</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Manual Edit</th>
                            <th class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list" class="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-darkCard">
                        <tr><td colspan="8" class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination / Footer -->
            <div class="p-4 border-t border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span id="inv-count">Showing 0 items</span>
                <div class="flex gap-1">
                    <button id="inv-prev" onclick="changeInventoryPage(-1)" class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">&laquo;</button>
                    <div id="inv-page-num" class="px-3 py-1 border border-primary bg-primary text-white rounded font-bold">1</div>
                    <button id="inv-next" onclick="changeInventoryPage(1)" class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">&raquo;</button>
                </div>
            </div>
        </div>
            </div>
        </div>
    `;


    productsView.innerHTML = html;

    // Attach search event
    document.getElementById('inv-search').addEventListener('input', (e) => {
        inventoryCurrentPage = 1;
        renderInventoryList(e.target.value);
    });

    // Load categories for filter
    loadFilterCategories();

    // Initial render
    renderInventoryList();

    // Background System Auto-Link (No manual button needed anymore)
    setTimeout(() => {
        autoLinkSystem(true);
    }, 1000);

    // Category dropdown change handler
    const categorySelect = document.getElementById('prod-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', async (e) => {
            if (e.target.value === '__new__') {
                const { value: newCat } = await Swal.fire({
                    title: 'New Category',
                    input: 'text',
                    inputLabel: 'Enter category name',
                    inputPlaceholder: 'e.g. Smartphones',
                    showCancelButton: true,
                    confirmButtonColor: '#4F46E5',
                });
                
                if (newCat && newCat.trim()) {
                    const exists = Array.from(categorySelect.options).some(opt => opt.value === newCat.trim());
                    if (!exists) {
                        const newOpt = document.createElement('option');
                        newOpt.value = newCat.trim();
                        newOpt.textContent = newCat.trim();
                        categorySelect.insertBefore(newOpt, categorySelect.lastElementChild);
                        categorySelect.value = newCat.trim();
                    } else {
                        categorySelect.value = newCat.trim();
                    }
                } else {
                    categorySelect.value = '';
                }
            }
        });
    }
}

// Special CSS for toggle dot
const style = document.createElement('style');
style.innerHTML = `
    input:checked ~ .dot {
        transform: translateX(100%);
    }
    input:checked ~ .block {
        background-color: #4F46E5; /* primary */
    }
`;
document.head.appendChild(style);


async function loadFilterCategories() {
    const filterSelect = document.getElementById('inv-category-filter');
    if (!filterSelect) return;
    
    try {
        const products = await db.products.toArray();
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        let optionsHtml = '<option value="">All Categories</option>';
        categories.sort().forEach(c => {
            optionsHtml += `<option value="${c}">${c}</option>`;
        });
        filterSelect.innerHTML = optionsHtml;
    } catch (err) {
        console.error("Error loading filter categories:", err);
    }
}

function changeInventoryPage(delta) {
    inventoryCurrentPage += delta;
    if (inventoryCurrentPage < 1) inventoryCurrentPage = 1;
    renderInventoryList(document.getElementById('inv-search').value);
}

async function renderInventoryList(searchQuery = '') {
    const tbody = document.getElementById('inventory-list');
    const countEl = document.getElementById('inv-count');
    const categoryFilter = document.getElementById('inv-category-filter')?.value || '';
    const statusFilter = document.getElementById('inv-status-filter')?.value || '';
    if (!tbody) return;

    let collection = db.products.orderBy('id').reverse();

    if (searchQuery && searchQuery.length > 1) {
        const q = searchQuery.toLowerCase();
        collection = db.products.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    }

    if (categoryFilter) {
        collection = collection.filter(p => p.category === categoryFilter);
    }

    if (statusFilter) {
        if (statusFilter === 'in_stock') {
            collection = collection.filter(p => p.stock_qty > 0);
        } else if (statusFilter === 'out_stock') {
            collection = collection.filter(p => p.stock_qty <= 0);
        } else if (statusFilter === 'low_stock') {
            collection = collection.filter(p => p.stock_qty <= (p.min_stock || 5));
        }
    }

    const totalCount = await collection.count();
    const products = await collection
        .offset((inventoryCurrentPage - 1) * inventoryPerPage)
        .limit(inventoryPerPage)
        .toArray();

    // Update Pagination UI
    const totalPages = Math.ceil(totalCount / inventoryPerPage) || 1;
    if (inventoryCurrentPage > totalPages) inventoryCurrentPage = totalPages;
    
    document.getElementById('inv-page-num').textContent = inventoryCurrentPage;
    document.getElementById('inv-prev').disabled = inventoryCurrentPage <= 1;
    document.getElementById('inv-next').disabled = inventoryCurrentPage >= totalPages;

    countEl.textContent = `Showing ${(inventoryCurrentPage - 1) * inventoryPerPage + 1}-${Math.min(inventoryCurrentPage * inventoryPerPage, totalCount)} of ${totalCount} items`;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-gray-500"><i class="fa-solid fa-box-open text-4xl mb-3 block opacity-20"></i> No products found.</td></tr>';
        return;
    }

    let html = '';
    products.forEach(p => {
        const hasSerials = (p.serial_list && p.serial_list.length > 0) || p.serial_tracked;
        const minStockAlert = p.min_stock || 5;
        const lowStock = p.stock_qty <= minStockAlert;

        let stockBadge = `
            <span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-bold ${lowStock ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}">
                ${lowStock ? '<i class="fa-solid fa-circle-exclamation text-[10px]"></i>' : ''}
                ${p.stock_qty}
            </span>
        `;

        html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-box text-gray-400"></i>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">${p.name}</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${hasSerials ? '<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 inline-block"><i class="fa-solid fa-barcode mr-1"></i>Serial Tracked</span>' : ''}
                                ${p.woo_id ? `<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 inline-block" title="WooID: ${p.woo_id}"><i class="fa-brands fa-wordpress mr-1"></i>Linked</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <span class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        ${p.category || 'General'}
                    </span>
                </td>
                <td class="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">${p.brands || 'No Brand'}</td>
                <td class="p-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-xs uppercase">${p.sku}</td>
                <td class="p-4 text-sm text-gray-900 dark:text-white font-medium text-right">Rs. ${parseFloat(p.cost || 0).toLocaleString()}</td>
                <td class="p-4 text-sm text-primary font-bold text-right">Rs. ${parseFloat(p.retail_price).toLocaleString()}</td>
                <td class="p-4 text-sm text-purple-600 dark:text-purple-400 font-bold text-right">Rs. ${parseFloat(p.wholesale_price).toLocaleString()}</td>
                <td class="p-4 text-center">${stockBadge}</td>
                <td class="p-4 text-center">
                    <input type="number" value="${p.stock_qty}" 
                        onchange="updateProductStock(${p.id}, this.value)"
                        class="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-xs font-black text-primary focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="printBarcode('${p.sku}', '${p.name.replace(/'/g, "\\'")}')" class="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Print Barcode">
                            <i class="fa-solid fa-barcode"></i>
                        </button>
                        <button onclick="editProduct(${p.id})" class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteProduct(${p.id})" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function generateSKU() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'PRD-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('prod-sku');
    if (input) {
        input.value = result;
        if (typeof updateBarcodePreview === 'function') updateBarcodePreview();
    }
}

// Modal Functions


function toggleResaleInput() {
    const isChecked = document.getElementById('prod-resale-reminder').checked;
    const area = document.getElementById('resale-input-area');
    if (isChecked) {
        area.classList.remove('hidden');
    } else {
        area.classList.add('hidden');
    }
}

async function openProductModal() {
    await populateVendorDropdown();
    await populateBrandDropdown();
    await populateCategoryDropdown();

    // Reset form
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add New Product';

    document.getElementById('prod-category').value = ''; // Ensure select is reset
    document.getElementById('prod-woo-id').value = ''; 
    document.getElementById('prod-woo-sync-enable').checked = true; // Default to sync


    document.getElementById('prod-serial-tracked').checked = false;
    document.getElementById('prod-resale-reminder').checked = false;
    document.getElementById('prod-resale-days').value = '';
    toggleResaleInput();

    // Reset WooCommerce/SEO fields
    document.getElementById('prod-short-desc').value = '';
    document.getElementById('prod-sku').value = '';
    document.getElementById('prod-barcode').value = '';
    document.getElementById('prod-stock').value = 0;
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-tags').value = '';
    document.getElementById('prod-meta-title').value = '';
    document.getElementById('prod-meta-desc').value = '';
    document.getElementById('prod-sale-price').value = '';
    document.getElementById('prod-image-data').value = '';
    document.getElementById('prod-image-name').textContent = 'Upload Main Image';
    document.getElementById('prod-image-preview-container').classList.add('hidden');

    // Reset Shipping & Attributes
    document.getElementById('prod-weight').value = '';
    document.getElementById('prod-length').value = '';
    document.getElementById('prod-width').value = '';
    document.getElementById('prod-height').value = '';
    document.getElementById('prod-attr-colors').value = '';
    document.getElementById('prod-attr-sizes').value = '';

    // Reset Gallery
    document.getElementById('prod-gallery-data').value = '[]';
    document.getElementById('prod-gallery-preview').innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 italic text-xs">No gallery images added yet.</div>';

    // Auto-generate SKU if empty
    if (!document.getElementById('prod-sku').value) {
        generateSKU();
    }

    // Reset Product Type
    setProductType('simple');
    document.getElementById('variations-list').innerHTML = '';
    document.getElementById('bundle-items-list').innerHTML = '<div class="text-center py-8 text-indigo-300 italic text-sm">No items added to this bundle yet.</div>';

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');

        document.getElementById('prod-name').focus();
    }, 10);
}

function setProductType(type) {
    document.getElementById('prod-type').value = type;
    
    // Update button styles
    const buttons = ['simple', 'variable', 'bundle'];
    buttons.forEach(b => {
        const btn = document.getElementById('type-' + b);
        if (!btn) return;
        if (b === type) {
            btn.className = 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-primary text-white shadow-lg shadow-primary/20';
        } else {
            btn.className = 'flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-primary';
        }
    });

    // Update description
    const desc = document.getElementById('type-desc');
    if (type === 'simple') {
        desc.textContent = 'A simple product is a unique item with its own SKU and stock tracking.';
        document.getElementById('variations-section').classList.add('hidden');
        document.getElementById('bundle-section').classList.add('hidden');
    } else if (type === 'variable') {
        desc.textContent = 'A variable product has multiple variations (like color/size), each with its own SKU and stock.';
        document.getElementById('variations-section').classList.remove('hidden');
        document.getElementById('bundle-section').classList.add('hidden');
    } else if (type === 'bundle') {
        desc.textContent = 'A bundle (kit) is a collection of existing products sold together. Stock is deducted from component items.';
        document.getElementById('variations-section').classList.add('hidden');
        document.getElementById('bundle-section').classList.remove('hidden');
    }
}

function addVariation(data = null) {
    const list = document.getElementById('variations-list');
    const row = document.createElement('tr');
    row.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden';
    
    const id = data?.id || '';
    const name = data?.name || '';
    const sku = data?.sku || '';
    const price = data?.price || '';
    const stock = data?.stock || 0;

    row.innerHTML = `
        <td class="p-3">
            <input type="text" value="${name}" placeholder="e.g. Black / XL" class="var-name w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary">
        </td>
        <td class="p-3">
            <input type="text" value="${sku}" placeholder="Auto" class="var-sku w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary">
        </td>
        <td class="p-3 w-32">
            <input type="number" value="${price}" placeholder="0.00" class="var-price w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary">
        </td>
        <td class="p-3 w-24 text-center">
             <input type="number" value="${stock}" class="var-stock w-full px-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold text-center outline-none focus:ring-1 focus:ring-primary">
        </td>
        <td class="p-3 text-right">
            <button type="button" onclick="this.closest('tr').remove()" class="w-8 h-8 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </td>
    `;
    list.appendChild(row);
}

async function searchBundleItems(query) {
    const results = document.getElementById('bundle-search-results');
    if (!query || query.length < 2) {
        results.classList.add('hidden');
        return;
    }

    const products = await db.products.filter(p => 
        (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())) &&
        p.product_type !== 'bundle'
    ).limit(5).toArray();

    if (products.length === 0) {
        results.innerHTML = '<div class="p-4 text-xs text-slate-400 italic">No products found</div>';
    } else {
        results.innerHTML = products.map(p => `
            <div onclick="addBundleItem(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.sku}')" class="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-800 last:border-0 group">
                <div>
                    <p class="text-xs font-bold dark:text-white group-hover:text-indigo-600 transition-colors">${p.name}</p>
                    <p class="text-[9px] text-slate-400 font-mono">${p.sku}</p>
                </div>
                <i class="fa-solid fa-plus text-indigo-300"></i>
            </div>
        `).join('');
    }
    results.classList.remove('hidden');
}

function addBundleItem(productId, name, sku, qty = 1) {
    const list = document.getElementById('bundle-items-list');
    
    // Check if already exists
    const existing = list.querySelector(`[data-id="${productId}"]`);
    if (existing) {
        const qtyInput = existing.querySelector('.bundle-qty');
        qtyInput.value = parseInt(qtyInput.value) + 1;
        document.getElementById('bundle-search-results').classList.add('hidden');
        document.getElementById('bundle-item-search').value = '';
        return;
    }

    if (list.querySelector('.italic')) list.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-4 shadow-sm animate-fade-in';
    div.setAttribute('data-id', productId);
    div.innerHTML = `
        <div class="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 font-black text-xs">
            ${qty}
        </div>
        <div class="flex-1">
            <p class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">${name}</p>
            <p class="text-[9px] text-slate-400 font-mono">${sku}</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty:</span>
            <input type="number" value="${qty}" class="bundle-qty w-16 px-3 py-1.5 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-xs font-black text-center outline-none focus:ring-1 focus:ring-indigo-500">
        </div>
        <button type="button" onclick="this.closest('div').remove(); if(!document.getElementById('bundle-items-list').children.length) document.getElementById('bundle-items-list').innerHTML = '<div class=\\'text-center py-8 text-indigo-300 italic text-sm\\'>No items added to this bundle yet.</div>';" class="w-8 h-8 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
            <i class="fa-solid fa-xmark text-xs"></i>
        </button>
    `;
    list.appendChild(div);
    document.getElementById('bundle-search-results').classList.add('hidden');
    document.getElementById('bundle-item-search').value = '';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // match transition duration
}

async function editProduct(id) {
    const product = await db.products.get(id);
    if (!product) return;

    await populateVendorDropdown();
    await populateBrandDropdown();
    await populateCategoryDropdown();

    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-sku').value = product.sku || '';
    document.getElementById('prod-barcode').value = product.barcode || '';
    // stock_qty is populated for manual adjustment
    document.getElementById('prod-stock').value = product.stock_qty || 0;
    document.getElementById('prod-cost').value = product.cost || 0;
    document.getElementById('prod-retail').value = product.retail_price;
    document.getElementById('prod-wholesale').value = product.wholesale_price;
    document.getElementById('prod-category').value = product.category || '';
    document.getElementById('prod-brand').value = product.brands || '';
    document.getElementById('prod-vendor').value = product.vendor || '';
    document.getElementById('prod-warranty').value = product.warranty || '';
    document.getElementById('prod-min-stock').value = product.min_stock || 0;
    document.getElementById('prod-woo-id').value = product.woo_id || '';
    
    if (product.woo_sync === false) {
        document.getElementById('prod-woo-sync-enable').checked = false;
    } else {
        document.getElementById('prod-woo-sync-enable').checked = true;
    }

    document.getElementById('prod-serial-tracked').checked = !!product.serial_tracked;



    if (product.resale_reminder) {
        document.getElementById('prod-resale-reminder').checked = true;
        document.getElementById('prod-resale-days').value = product.resale_days || 0;
        toggleResaleInput();
    } else {
        document.getElementById('prod-resale-reminder').checked = false;
        document.getElementById('prod-resale-days').value = '';
        toggleResaleInput();
    }

    // Load WooCommerce/SEO fields
    document.getElementById('prod-short-desc').value = product.short_description || '';
    document.getElementById('prod-desc').value = product.description || '';
    document.getElementById('prod-tags').value = product.tags || '';
    document.getElementById('prod-meta-title').value = product.meta_title || '';
    document.getElementById('prod-meta-desc').value = product.meta_description || '';
    document.getElementById('prod-sale-price').value = product.sale_price || '';
    document.getElementById('prod-image-data').value = product.image_data || '';
    
    if (product.image_data) {
        document.getElementById('prod-image-preview').src = product.image_data;
        document.getElementById('prod-image-preview-container').classList.remove('hidden');
        document.getElementById('prod-image-name').textContent = 'Image Attached';
    } else {
        document.getElementById('prod-image-preview-container').classList.add('hidden');
        document.getElementById('prod-image-name').textContent = 'Upload Main Image';
    }

    // Load Shipping & Attributes
    document.getElementById('prod-weight').value = product.weight || '';
    document.getElementById('prod-length').value = product.length || '';
    document.getElementById('prod-width').value = product.width || '';
    document.getElementById('prod-height').value = product.height || '';
    document.getElementById('prod-attr-colors').value = product.attributes?.colors?.join(', ') || '';
    document.getElementById('prod-attr-sizes').value = product.attributes?.sizes?.join(', ') || '';

    // Load Gallery
    const gallery = product.gallery || [];
    document.getElementById('prod-gallery-data').value = JSON.stringify(gallery);
    renderGalleryPreview(gallery);

    // Product Type handling
    setProductType(product.product_type || 'simple');
    if (product.product_type === 'variable') {
        document.getElementById('variations-list').innerHTML = '';
        (product.variations || []).forEach(v => addVariation(v));
    } else if (product.product_type === 'bundle') {
        document.getElementById('bundle-items-list').innerHTML = '';
        (product.bundle_items || []).forEach(item => {
            addBundleItem(item.product_id, item.name, item.sku, item.qty);
        });
    }

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
    }, 10);
}

async function saveProduct() {
    // Basic validation
    const form = document.getElementById('product-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const sku = document.getElementById('prod-sku').value.toUpperCase();
    const barcode = document.getElementById('prod-barcode').value.trim();
    const stock_qty = document.getElementById('prod-stock') ? (parseInt(document.getElementById('prod-stock').value) || 0) : 0;
    const cost = Math.round((parseFloat(document.getElementById('prod-cost').value) || 0) * 100) / 100;
    const retail_price = Math.round((parseFloat(document.getElementById('prod-retail').value) || 0) * 100) / 100;
    const wholesale_price = Math.round((parseFloat(document.getElementById('prod-wholesale').value) || 0) * 100) / 100;
    const category = document.getElementById('prod-category').value;
    const vendor = document.getElementById('prod-vendor').value;
    const brands = document.getElementById('prod-brand').value;
    const min_stock = document.getElementById('prod-min-stock') ? (parseInt(document.getElementById('prod-min-stock').value) || 0) : 5;
    const warranty = document.getElementById('prod-warranty').value;
    const woo_id = parseInt(document.getElementById('prod-woo-id').value) || null;
    const woo_sync = document.getElementById('prod-woo-sync-enable').checked;

    const resale_reminder = document.getElementById('prod-resale-reminder').checked;
    const resale_days = parseInt(document.getElementById('prod-resale-days').value) || 0;
    const serial_tracked = document.getElementById('prod-serial-tracked').checked;



    const productData = {
        name,
        sku,
        barcode,
        stock_qty: stock_qty,
        min_stock: min_stock,
        cost,
        retail_price,
        wholesale_price,
        category,
        vendor,
        brands,
        warranty,
        // serial_list is maintained via GRN process
        serial_list: (id && !isNaN(parseInt(id))) ? (await db.products.get(parseInt(id)))?.serial_list || [] : [],
        woo_id,
        woo_sync,
        resale_reminder,
        resale_days,
        serial_tracked,
        short_description: document.getElementById('prod-short-desc').value,
        description: document.getElementById('prod-desc').value,
        tags: document.getElementById('prod-tags').value,
        meta_title: document.getElementById('prod-meta-title').value,
        meta_description: document.getElementById('prod-meta-desc').value,
        sale_price: document.getElementById('prod-sale-price').value ? Math.round((parseFloat(document.getElementById('prod-sale-price').value) || 0) * 100) / 100 : null,
        image_data: document.getElementById('prod-image-data').value,
        weight: parseFloat(document.getElementById('prod-weight').value) || null,
        length: parseFloat(document.getElementById('prod-length').value) || null,
        width: parseFloat(document.getElementById('prod-width').value) || null,
        height: parseFloat(document.getElementById('prod-height').value) || null,
        attributes: {
            colors: document.getElementById('prod-attr-colors').value.split(',').map(s => s.trim()).filter(s => s),
            sizes: document.getElementById('prod-attr-sizes').value.split(',').map(s => s.trim()).filter(s => s)
        },
        gallery: JSON.parse(document.getElementById('prod-gallery-data').value || '[]'),
        product_type: document.getElementById('prod-type').value,
        updated_at: new Date().toISOString()
    };

    // Variations Data
    if (productData.product_type === 'variable') {
        const varRows = Array.from(document.querySelectorAll('#variations-list tr'));
        productData.variations = varRows.map(row => ({
            name: row.querySelector('.var-name').value,
            sku: row.querySelector('.var-sku').value || (sku + '-' + row.querySelector('.var-name').value.replace(/\s+/g, '-').toUpperCase()),
            price: parseFloat(row.querySelector('.var-price').value) || productData.retail_price,
            stock: parseInt(row.querySelector('.var-stock').value) || 0
        }));
    }

    // Bundle Data
    if (productData.product_type === 'bundle') {
        const bundleRows = Array.from(document.querySelectorAll('#bundle-items-list > div[data-id]'));
        productData.bundle_items = bundleRows.map(row => ({
            product_id: parseInt(row.dataset.id),
            name: row.querySelector('p.text-xs').textContent,
            sku: row.querySelector('p.text-mono').textContent,
            qty: parseInt(row.querySelector('.bundle-qty').value) || 1
        }));
    }

    // Auto-link missing brand/category before saving
    // Only run if the user didn't pick anything or left it as General
    if (!productData.brands || !productData.category || productData.category === 'General' || productData.category === 'Uncategorized') {
        const autoMatched = await runAutoLinkDetection(productData.name);
        
        // Only assign brand if currently empty
        if (autoMatched.brand && !productData.brands) {
            productData.brands = autoMatched.brand;
        }
        
        // Only assign category if currently empty or a placeholder
        if (autoMatched.category) {
            if (!productData.category || productData.category === 'General' || productData.category === 'Uncategorized') {
                productData.category = autoMatched.category;
            }
        }
    }

    try {
        if (id && !isNaN(parseInt(id))) {
            // Update
            const numericId = parseInt(id);
            productData.id = numericId; // IMPORTANT: Attach for sync
            await db.products.update(numericId, productData);
            showAlert('Success', 'Product updated successfully.', 'success');
        } else {
            // Create
            productData.added_date = new Date().toISOString();
            const newId = await db.products.add(productData);
            productData.id = newId; // Attach ID for sync
            showAlert('Success', 'New product added successfully.', 'success');
        }

        closeProductModal();
        renderInventoryList(document.getElementById('inv-search').value);

        // SYNC TO WOOCOMMERCE
        if (woo_sync && typeof syncProductToWordPress === 'function') {
            syncProductToWordPress(productData);
        }
    } catch (err) {
        console.error(err);
        showAlert('Error', 'Failed to save product: ' + err.message, 'error');
    }
}

// Image handling with WebP conversion
function previewProductImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Create a canvas to perform the conversion
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to WebP (quality 0.8)
            const webpData = canvas.toDataURL('image/webp', 0.8);
            
            // Store and preview
            document.getElementById('prod-image-data').value = webpData;
            document.getElementById('prod-image-preview').src = webpData;
            document.getElementById('prod-image-preview-container').classList.remove('hidden');
            document.getElementById('prod-image-name').textContent = file.name + ' (Converted to WebP)';
            
            console.log("📸 Image converted to WebP. Size reduction estimate: ~30-50%");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleGalleryUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const galleryDataInput = document.getElementById('prod-gallery-data');
    let currentGallery = JSON.parse(galleryDataInput.value || '[]');

    for (const file of files) {
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
        currentGallery.push(base64);
    }

    galleryDataInput.value = JSON.stringify(currentGallery);
    renderGalleryPreview(currentGallery);
    event.target.value = ''; // Reset input
}

function renderGalleryPreview(gallery) {
    const container = document.getElementById('prod-gallery-preview');
    if (!gallery || !gallery.length) {
        container.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 italic text-xs">No gallery images added yet.</div>';
        return;
    }

    container.innerHTML = gallery.map((data, index) => `
        <div class="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <img src="${data}" class="w-full h-full object-cover">
            <button type="button" onclick="removeGalleryImage(${index})" class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <i class="fa-solid fa-xmark text-[10px]"></i>
            </button>
        </div>
    `).join('');
}

function removeGalleryImage(index) {
    const galleryDataInput = document.getElementById('prod-gallery-data');
    let currentGallery = JSON.parse(galleryDataInput.value || '[]');
    currentGallery.splice(index, 1);
    galleryDataInput.value = JSON.stringify(currentGallery);
    renderGalleryPreview(currentGallery);
}

async function deleteProduct(id) {
    if (confirm('Are you certain you want to delete this product? This action cannot be undone.')) {
        try {
            window.isManualAction = true;
            await db.products.delete(id);
            showAlert('Deleted', 'Product was removed.', 'success');
            renderInventoryList(document.getElementById('inv-search').value);
        } catch (err) {
            showAlert('Error', 'Could not delete product.', 'error');
        } finally {
            window.isManualAction = false;
        }
    }
}

function printBarcode(sku, name) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Barcode - ${sku}</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #fff; }
                .label { display: flex; flex-direction: column; align-items: center; border: 1px dashed #ccc; padding: 10px; width: 40mm; height: 30mm; box-sizing: border-box; justify-content: center; }
                .name { font-size: 10px; text-align: center; margin-bottom: 2px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; max-width: 38mm; }
                .barcode-container svg { width: 100%; height: auto; max-height: 18mm; max-width: 38mm; }
                
                @media print {
                    @page { size: 40mm 30mm; margin: 0; }
                    body { height: auto; display: block; }
                    .label { border: none; padding: 1mm; page-break-after: always; justify-content: flex-start; }
                }
            </style>
        </head>
        <body>
            <div class="label">
                <div class="name">${name}</div>
                <div class="barcode-container">
                    <svg id="barcode"></svg>
                </div>
            </div>
            <script>
                window.onload = function() {
                    JsBarcode("#barcode", "${sku}", {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 12,
                        margin: 0,
                        height: 40,
                        width: 1.5
                    });
                    
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    const printWin = window.open('', '_blank', `width=${screen.availWidth},height=${screen.availHeight}`);
    printWin.document.write(html);
    printWin.document.close();
}

function updateBarcodePreview() {
    const sku = document.getElementById('prod-sku').value;
    const svg = document.querySelector("#prod-barcode-preview");
    if (!svg) return;
    
    // Check if JsBarcode is available
    if (typeof JsBarcode !== 'undefined' && sku && sku.trim().length > 0) {
        try {
            JsBarcode("#prod-barcode-preview", sku, {
                format: "CODE128",
                displayValue: true,
                fontSize: 14,
                margin: 0,
                height: 40,
                width: 1.5,
                background: "transparent",
                lineColor: "#000000"
            });
            svg.style.display = "block";
        } catch(e) {
            // Usually invalid barcode text format
            svg.style.display = "none";
        }
    } else {
        svg.style.display = "none";
        svg.innerHTML = '';
    }
}

async function populateVendorDropdown() {
    const vendorSelect = document.getElementById('prod-vendor');
    if (!vendorSelect) return;
    
    // Remember current value so we can restore it after reloading options
    const currentValue = vendorSelect.value;
    
    try {
        if (!db.vendors) return;
        const vendors = await db.vendors.toArray();
        let optionsHtml = '<option value="">Select Vendor</option>';
        vendors.forEach(v => {
            optionsHtml += `<option value="${v.name}">${v.name}</option>`;
        });
        vendorSelect.innerHTML = optionsHtml;
        
        // Restore value if it exists in the new list
        if (currentValue) {
            vendorSelect.value = currentValue;
        }
    } catch (err) {
        console.error("Error loading vendors:", err);
    }
}

async function populateBrandDropdown() {
    const brandSelect = document.getElementById('prod-brand');
    if (!brandSelect) return;
    
    const currentValue = brandSelect.value;
    
    try {
        if (!db.brands) return;
        const brands = await db.brands.toArray();
        let optionsHtml = '<option value="">Select Brand</option>';
        brands.sort((a,b) => a.name.localeCompare(b.name)).forEach(b => {
            optionsHtml += `<option value="${b.name}">${b.name}</option>`;
        });
        brandSelect.innerHTML = optionsHtml;
        
        if (currentValue) {
            brandSelect.value = currentValue;
        }
    } catch (err) {
        console.error("Error populating brands:", err);
    }
}

/**
 * Core engine to detect brand and category from a string (product name).
 * Returns { brand: string|null, category: string|null }
 */
async function runAutoLinkDetection(productName) {
    if (!productName || productName.length < 2) return { brand: null, category: null };
    const name = productName.toLowerCase();
    let detectedBrand = null;
    let detectedCategory = null;

    try {
        // 1. Detect Brand
        if (db.brands) {
            const brands = await db.brands.toArray();
            brands.sort((a, b) => b.name.length - a.name.length);
            for (const b of brands) {
                const regex = new RegExp(`\\b${b.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(name)) {
                    detectedBrand = b.name;
                    break;
                }
            }
        }

        // 2. Detect Category (from existing categories in products)
        const products = await db.products.toArray();
        const categories = [...new Set(products.map(p => p.category).filter(c => c && c !== 'General'))];
        categories.sort((a, b) => b.length - a.length);
        for (const c of categories) {
            // Be more specific: only match if the category name is reasonably long or an exact match
            // to avoid matching parts of words incorrectly.
            const regex = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(name)) {
                detectedCategory = c;
                break;
            }
        }
    } catch (err) {
        console.error("Auto-link detection error:", err);
    }

    return { brand: detectedBrand, category: detectedCategory };
}

/**
 * Automatically detect a brand from the product name field for the UI modal.
 */
async function detectBrandFromProductName(showToast = false) {
    const nameInput = document.getElementById('prod-name');
    const brandSelect = document.getElementById('prod-brand');
    const categorySelect = document.getElementById('prod-category');
    
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    const result = await runAutoLinkDetection(name);
    
    let changed = false;
    if (result.brand && brandSelect && !brandSelect.value) {
        brandSelect.value = result.brand;
        changed = true;
    }
    if (result.category && categorySelect && (!categorySelect.value || categorySelect.value === 'General')) {
        categorySelect.value = result.category;
        changed = true;
    }

    if (changed && showToast && typeof showAlert === 'function') {
        showAlert('Auto-Link', `Detected brand/category based on product name.`, 'info');
    }
}

/**
 * System-wide background auto-link. 
 * Scans all products and fills in missing brands/categories silently.
 */
async function autoLinkSystem(silent = true) {
    try {
        const products = await db.products.toArray();
        const unlinked = products.filter(p => !p.brands || !p.category || p.category === 'General');
        
        if (unlinked.length === 0) return;

        if (!silent) {
            Swal.fire({
                title: 'Auto-Linking...',
                html: 'Refining product metadata...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
        }
        
        let updateCount = 0;
        for (const p of unlinked) {
            const result = await runAutoLinkDetection(p.name);
            let needsUpdate = false;
            let updates = {};

            if (result.brand && !p.brands) {
                updates.brands = result.brand;
                needsUpdate = true;
            }
            if (result.category && (!p.category || p.category === 'General')) {
                updates.category = result.category;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await db.products.update(p.id, updates);
                updateCount++;
            }
        }
        
        if (updateCount > 0) {
            console.log(`🤖 System Auto-Link: Updated ${updateCount} products.`);
            if (!silent) {
                Swal.close();
                showAlert('Auto-Link Complete', `Successfully associated brands/categories with ${updateCount} products.`, 'success');
            }
            renderInventoryList();
        } else if (!silent) {
            Swal.close();
        }
        
    } catch (err) {
        console.error("Background auto-link failed:", err);
        if (!silent) {
            Swal.close();
            showAlert('Error', 'Failed to complete auto-link: ' + err.message, 'error');
        }
    }
}

/**
 * Legacy wrapper for compatibility if called elsewhere.
 */
async function bulkAutoLinkBrands() {
    return autoLinkSystem(false);
}

async function populateCategoryDropdown() {
    const categorySelect = document.getElementById('prod-category');
    if (!categorySelect) return;
    
    const currentValue = categorySelect.value;
    
    try {
        const products = await db.products.toArray();
        const categories = [...new Set(products.map(p => p.category).filter(c => c))];
        
        let optionsHtml = '<option value="">Select Category</option>';
        categories.sort().forEach(c => {
            optionsHtml += `<option value="${c}">${c}</option>`;
        });
        optionsHtml += '<option value="__new__">+ Add New Category</option>';
        
        categorySelect.innerHTML = optionsHtml;
        
        // Restore value if it exists in the new list
        if (currentValue && categories.includes(currentValue)) {
            categorySelect.value = currentValue;
        }
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

// Inline Brand Addition Logic
function showAddBrandInput() {
    const btn = document.getElementById('add-brand-btn');
    const area = document.getElementById('new-brand-input-area');
    const input = document.getElementById('new-brand-name');
    
    if (btn) btn.classList.add('hidden');
    if (area) area.classList.remove('hidden');
    if (area) area.classList.add('flex');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function hideAddBrandInput() {
    const btn = document.getElementById('add-brand-btn');
    const area = document.getElementById('new-brand-input-area');
    
    if (btn) btn.classList.remove('hidden');
    if (area) {
        area.classList.add('hidden');
        area.classList.remove('flex');
    }
}

async function confirmAddBrand() {
    const input = document.getElementById('new-brand-name');
    const name = input ? input.value.trim() : '';
    
    if (!name) {
        hideAddBrandInput();
        return;
    }
    
    try {
        const exists = await db.brands.where('name').equalsIgnoreCase(name).first();
        if (exists) {
            showAlert('Exist', 'This brand already exists.', 'warning');
            return;
        }
        
        await db.brands.add({ 
            name: name,
            created_at: new Date().toISOString()
        });
        
        showAlert('Success', 'Brand added successfully.', 'success');
        await populateBrandDropdown();
        
        // Select the newly added brand
        const brandSelect = document.getElementById('prod-brand');
        if (brandSelect) {
            brandSelect.value = name;
        }
        
        hideAddBrandInput();
    } catch (err) {
        console.error("Error adding brand:", err);
        showAlert('Error', 'Could not save the brand.', 'error');
    }
}

// Inline Category Addition Logic
function showAddCategoryInput() {
    const btn = document.getElementById('add-category-btn');
    const area = document.getElementById('new-category-input-area');
    const input = document.getElementById('new-category-name');
    
    if (btn) btn.classList.add('hidden');
    if (area) area.classList.remove('hidden');
    if (area) area.classList.add('flex');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function hideAddCategoryInput() {
    const btn = document.getElementById('add-category-btn');
    const area = document.getElementById('new-category-input-area');
    
    if (btn) btn.classList.remove('hidden');
    if (area) {
        area.classList.add('hidden');
        area.classList.remove('flex');
    }
}

async function confirmAddCategory() {
    const input = document.getElementById('new-category-name');
    const name = input ? input.value.trim() : '';
    
    if (!name) {
        hideAddCategoryInput();
        return;
    }
    
    try {
        // Categories are derived from unique values in products.category traditionally in this app
        // But some apps use a separate categories table. Let's check db.js
        
        // Refresh categories dropdown
        await populateCategoryDropdown();
        
        const categorySelect = document.getElementById('prod-category');
        if (categorySelect) {
            // Check if it already exists in the dropdown (ignoring case)
            let found = false;
            for (let i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].value.toLowerCase() === name.toLowerCase()) {
                    categorySelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                // Add it temporarily to the dropdown so it can be selected
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                categorySelect.insertBefore(opt, categorySelect.options[categorySelect.options.length - 1]);
                categorySelect.value = name;
            }
        }
        
        hideAddCategoryInput();
    } catch (err) {
        console.error("Error adding category:", err);
    }
}

async function openExportFilterModal() {
    const modal = document.getElementById('export-filter-modal');
    const content = document.getElementById('export-filter-modal-content');
    
    // Populate Categories
    const catSelect = document.getElementById('export-category');
    const products = await db.products.toArray();
    const categories = [...new Set(products.map(p => p.category).filter(c => c))];
    let catHtml = '<option value="">All Categories</option>';
    categories.sort().forEach(c => {
        catHtml += `<option value="${c}">${c}</option>`;
    });
    catSelect.innerHTML = catHtml;
    
    // Populate Brands
    const brandSelect = document.getElementById('export-brand');
    const brands = [...new Set(products.map(p => p.brands).filter(b => b))];
    let brandHtml = '<option value="">All Brands</option>';
    brands.sort().forEach(b => {
        brandHtml += `<option value="${b}">${b}</option>`;
    });
    brandSelect.innerHTML = brandHtml;

    // Reset fields
    document.getElementById('export-min-price').value = '';
    document.getElementById('export-max-price').value = '';
    document.getElementById('export-stock-status').value = '';

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
}

function closeExportFilterModal() {
    const modal = document.getElementById('export-filter-modal');
    const content = document.getElementById('export-filter-modal-content');
    
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

async function applyExportFilters() {
    const filters = {
        category: document.getElementById('export-category').value,
        brand: document.getElementById('export-brand').value,
        minPrice: parseFloat(document.getElementById('export-min-price').value) || 0,
        maxPrice: parseFloat(document.getElementById('export-max-price').value) || Infinity,
        stockStatus: document.getElementById('export-stock-status').value
    };
    
    closeExportFilterModal();
    generateFullStockReport(filters);
}

async function generateFullStockReport(filters = null) {
    let products = await db.products.toArray();
    
    // Apply Filters if provided
    let reportSubtitle = "FULL STOCK INVENTORY REPORT";
    if (filters) {
        let filterParts = [];
        if (filters.category) {
            products = products.filter(p => p.category === filters.category);
            filterParts.push(`Category: ${filters.category}`);
        }
        if (filters.brand) {
            products = products.filter(p => p.brands === filters.brand);
            filterParts.push(`Brand: ${filters.brand}`);
        }
        if (filters.minPrice > 0 || filters.maxPrice !== Infinity) {
            products = products.filter(p => {
                const price = p.retail_price || 0;
                return price >= filters.minPrice && price <= filters.maxPrice;
            });
            filterParts.push(`Price: Rs. ${filters.minPrice} - ${filters.maxPrice === Infinity ? 'Any' : filters.maxPrice}`);
        }
        if (filters.stockStatus) {
            if (filters.stockStatus === 'in_stock') {
                products = products.filter(p => p.stock_qty > 0);
                filterParts.push("Status: In Stock");
            } else if (filters.stockStatus === 'out_stock') {
                products = products.filter(p => p.stock_qty <= 0);
                filterParts.push("Status: Out of Stock");
            } else if (filters.stockStatus === 'low_stock') {
                products = products.filter(p => p.stock_qty <= (p.min_stock || 5));
                filterParts.push("Status: Low Stock");
            }
        }
        
        if (filterParts.length > 0) {
            reportSubtitle = "FILTERED INVENTORY REPORT<br><small style='color:#666; font-size:10px;'>" + filterParts.join(' | ') + "</small>";
        }
    }

    if (!products.length) {
        showAlert('No Data', 'No products found matching these filters.', 'info');
        return;
    }

    const sArr = await db.settings.toArray();
    const s = {}; sArr.forEach(x => s[x.key] = x.value);
    const storeName = s['store_name'] || 'MobileMate';
    const date = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

    // Summary Stats
    const totalItems = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + ((p.stock_qty || 0) * (p.cost || 0)), 0);
    const retailValue = products.reduce((sum, p) => sum + ((p.stock_qty || 0) * (p.retail_price || 0)), 0);

    const rows = products.sort((a,b) => (a.category||'').localeCompare(b.category||'')).map((p, idx) => {
        const isLow = (p.stock_qty || 0) <= (p.min_stock || 5);
        const isOut = (p.stock_qty || 0) <= 0;
        const status = isOut ? '<span style="color:#ef4444;font-weight:900;">OUT</span>' : isLow ? '<span style="color:#f59e0b;font-weight:900;">LOW</span>' : '<span style="color:#10b981;">OK</span>';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; text-align:center;">${idx + 1}</td>
                <td style="padding: 8px;"><b>${p.name}</b><br><small style="color:#666;font-family:monospace;">${p.sku}</small></td>
                <td style="padding: 8px;">${p.category || 'N/A'}</td>
                <td style="padding: 8px; text-align:right;">Rs. ${(p.cost || 0).toLocaleString()}</td>
                <td style="padding: 8px; text-align:right;">Rs. ${(p.retail_price || 0).toLocaleString()}</td>
                <td style="padding: 8px; text-align:center; font-weight:bold; ${isLow ? 'background:#fef2f2;' : ''}">${p.stock_qty}</td>
                <td style="padding: 8px; text-align:center;">${status}</td>
                <td style="padding: 8px; text-align:right; font-weight:bold;">Rs. ${((p.stock_qty || 0) * (p.cost || 0)).toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Stock Report - ${storeName}</title>
            <style>
                body { font-family: 'Inter', sans-serif; color: #333; margin: 0; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
                .stats { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; }
                .stat-val { display: block; font-size: 18px; font-weight: 900; color: #4F46E5; }
                .stat-lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { background: #4F46E5; color: white; padding: 12px 8px; text-align: left; text-transform: uppercase; }
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 20px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin:0; color:#4F46E5;">${storeName.toUpperCase()}</h1>
                <h2 style="margin:5px 0; font-weight:300; letter-spacing:2px; line-height:1.4;">${reportSubtitle}</h2>
                <p style="margin:5px 0; font-size:12px; color:#666;">Generated on ${date}</p>
            </div>

            <div class="stats">
                <div class="stat-card"><span class="stat-val">${totalItems}</span><span class="stat-lbl">Unique Products</span></div>
                <div class="stat-card"><span class="stat-val">${totalStock}</span><span class="stat-lbl">Total Quantity</span></div>
                <div class="stat-card"><span class="stat-val">Rs. ${totalValue.toLocaleString()}</span><span class="stat-lbl">Inventory Value (Cost)</span></div>
                <div class="stat-card"><span class="stat-val">Rs. ${retailValue.toLocaleString()}</span><span class="stat-lbl">Est. Retail Value</span></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align:center;">#</th>
                        <th>Product Details</th>
                        <th>Category</th>
                        <th style="text-align:right;">Cost</th>
                        <th style="text-align:right;">Retail</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:center;">Status</th>
                        <th style="text-align:right;">Stock Val</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <div class="footer">
                <p>End of Stock Report - ${storeName} - All rights reserved</p>
                <button class="no-print" onclick="window.print()" style="margin-top:20px; padding:10px 20px; background:#4F46E5; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Print Report</button>
            </div>
        </body>
        </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        showAlert('Popup Blocked', 'Please allow popups to view the report.', 'warning');
    }
}

// Quick manual stock update from the list
window.updateProductStock = async function(id, newQty) {
    newQty = parseInt(newQty) || 0;
    
    try {
        await db.products.update(id, { stock_qty: newQty });
        // Show a small toast notification
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: 'Stock Updated'
        });
        
        // Refresh the list to update badges/colors
        renderInventoryList();
    } catch (err) {
        console.error("Failed to update stock:", err);
        Swal.fire('Error', 'Failed to update stock manually.', 'error');
    }
};

async function resetAllStocksToZero() {
    const { isConfirmed } = await Swal.fire({
        title: 'Reset All Stocks?',
        text: "Are you sure you want to set the stock quantity of ALL items, variations, and warehouse stocks to 0? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, reset everything!'
    });

    if (isConfirmed) {
        try {
            // 1. Reset standard stock and variations stock
            await db.products.toCollection().modify(p => {
                p.stock_qty = 0;
                if (p.variations && Array.isArray(p.variations)) {
                    p.variations.forEach(v => {
                        v.stock = 0;
                    });
                }
            });

            // 2. Reset multi-store inventory stocks
            if (db.inventory) {
                await db.inventory.toCollection().modify({ stock_qty: 0 });
            }

            showAlert('Success', 'All stock levels have been reset to 0.', 'success');
            renderInventoryList();
            
            if (typeof logActivity === 'function') {
                await logActivity('Inventory Reset: All stock levels set to 0');
            }
        } catch (err) {
            showAlert('Error', 'Failed to reset stocks: ' + err.message, 'error');
        }
    }
}
