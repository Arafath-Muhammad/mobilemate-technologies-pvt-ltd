/**
 * MobileMate POS & ERP — Cloud Database Layer (Supabase Integration)
 * Replaces local Dexie.js (IndexedDB) with Supabase Cloud Database & Realtime Sync.
 */

// Supabase Configuration
const SUPABASE_URL = "https://kwrqpplbmgwgrnqduegi.supabase.co";
const SUPABASE_KEY = "sb_publishable_LpmEFCLUq-YBytvChvPyAg_eUWOGlmb";

// Initialize official Supabase Client
let supabaseClient = null;
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    });
    window.supabaseClient = supabaseClient;
    console.log("✅ [Supabase] Client initialized successfully.");
} else {
    console.error("❌ [Supabase] SDK not found. Please ensure '@supabase/supabase-js' script is loaded.");
}

// Global POS State Variables
let editingSaleId = null;
let preselectedDocType = null;

// Helper to clean payloads before sending to PostgreSQL
function cleanPayload(item) {
    if (!item || typeof item !== 'object') return item;
    const clean = Array.isArray(item) ? [] : {};
    for (const [key, val] of Object.entries(item)) {
        if (val === undefined) continue;
        if (key === 'id') {
            if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
                continue; // Do not send empty/null ID so PostgreSQL identity auto-generates it
            }
            clean.id = (typeof val === 'string' && !isNaN(val)) ? parseInt(val) : val;
        } else if (typeof val === 'number' && Number.isNaN(val)) {
            clean[key] = null;
        } else {
            clean[key] = val;
        }
    }
    return clean;
}

// Query Builder & Collection Handler (Mimics Dexie Collection interface for Supabase)
class SupabaseCollection {
    constructor(tableName, pkField = 'id') {
        this.tableName = tableName;
        this.pkField = pkField;
        this.queryFilters = []; // { method, args }
        this.inMemoryFilters = []; // functions
        this.orderField = null;
        this.orderAsc = true;
        this.isReversed = false;
        this.limitCount = null;
        this.offsetCount = null;
    }

    addFilter(method, ...args) {
        this.queryFilters.push({ method, args });
        return this;
    }

    filter(fn) {
        if (typeof fn === 'function') this.inMemoryFilters.push(fn);
        return this;
    }

    and(fn) {
        return this.filter(fn);
    }

    reverse() {
        this.isReversed = !this.isReversed;
        return this;
    }

    orderBy(field, asc = true) {
        this.orderField = field;
        this.orderAsc = asc;
        return this;
    }

    limit(n) {
        this.limitCount = n;
        return this;
    }

    offset(n) {
        this.offsetCount = n;
        return this;
    }

    toCollection() {
        return this;
    }

    _buildQuery(selectClause = '*', countMode = null) {
        if (!supabaseClient) {
            console.error("[Supabase] Client not initialized.");
            return null;
        }

        let q = countMode
            ? supabaseClient.from(this.tableName).select(selectClause, { count: countMode, head: countMode === 'exact' && this.inMemoryFilters.length === 0 })
            : supabaseClient.from(this.tableName).select(selectClause).range(0, 99999);

        for (const f of this.queryFilters) {
            if (typeof q[f.method] === 'function') {
                q = q[f.method](...f.args);
            }
        }

        if (this.orderField) {
            const asc = this.isReversed ? !this.orderAsc : this.orderAsc;
            q = q.order(this.orderField, { ascending: asc });
        }

        if (this.inMemoryFilters.length === 0) {
            if (this.offsetCount !== null && this.limitCount !== null) {
                q = q.range(this.offsetCount, this.offsetCount + this.limitCount - 1);
            } else if (this.limitCount !== null) {
                q = q.limit(this.limitCount);
            }
        }

        return q;
    }

    async toArray() {
        const q = this._buildQuery('*');
        if (!q) return [];
        const { data, error } = await q;
        if (error) {
            console.error(`[Supabase ${this.tableName}.toArray Error]`, error);
            return [];
        }

        let result = data || [];

        // In-memory filters for Dexie compatibility
        if (this.inMemoryFilters.length > 0) {
            for (const fn of this.inMemoryFilters) {
                result = result.filter(fn);
            }
        }

        if (this.isReversed && !this.orderField) {
            result.reverse();
        }

        if (this.inMemoryFilters.length > 0) {
            if (this.offsetCount !== null) {
                result = result.slice(this.offsetCount);
            }
            if (this.limitCount !== null) {
                result = result.slice(0, this.limitCount);
            }
        }

        return result;
    }

    async first() {
        if (this.inMemoryFilters.length > 0) {
            const arr = await this.toArray();
            return arr[0] || undefined;
        }

        const prevLimit = this.limitCount;
        this.limitCount = 1;
        const arr = await this.toArray();
        this.limitCount = prevLimit;
        return arr[0] || undefined;
    }

    async last() {
        const arr = await this.toArray();
        return arr[arr.length - 1] || undefined;
    }

    async count() {
        if (this.inMemoryFilters.length > 0) {
            const arr = await this.toArray();
            return arr.length;
        }
        const q = this._buildQuery('*', 'exact');
        if (!q) return 0;
        const { count, error } = await q;
        if (error) {
            console.error(`[Supabase ${this.tableName}.count Error]`, error);
            return 0;
        }
        return count || 0;
    }

    async delete() {
        if (!supabaseClient) return 0;
        if (this.inMemoryFilters.length > 0) {
            const items = await this.toArray();
            const ids = items.map(x => x[this.pkField]).filter(Boolean);
            if (ids.length === 0) return 0;
            const { error } = await supabaseClient
                .from(this.tableName)
                .delete()
                .in(this.pkField, ids);
            if (error) console.error(`[Supabase ${this.tableName}.delete Error]`, error);
            return ids.length;
        }

        let q = supabaseClient.from(this.tableName).delete();
        for (const f of this.queryFilters) {
            if (typeof q[f.method] === 'function') {
                q = q[f.method](...f.args);
            }
        }
        const { data, error } = await q.select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.delete Error]`, error);
            return 0;
        }
        return data ? data.length : 0;
    }

    async modify(changesOrFn) {
        if (!supabaseClient) return 0;
        if (typeof changesOrFn === 'function') {
            const items = await this.toArray();
            for (const item of items) {
                changesOrFn(item);
                await supabaseClient
                    .from(this.tableName)
                    .update(cleanPayload(item))
                    .eq(this.pkField, item[this.pkField]);
            }
            return items.length;
        }

        if (this.inMemoryFilters.length > 0) {
            const items = await this.toArray();
            const ids = items.map(x => x[this.pkField]).filter(Boolean);
            if (ids.length === 0) return 0;
            const { error } = await supabaseClient
                .from(this.tableName)
                .update(cleanPayload(changesOrFn))
                .in(this.pkField, ids);
            if (error) console.error(`[Supabase ${this.tableName}.modify Error]`, error);
            return ids.length;
        }

        let q = supabaseClient.from(this.tableName).update(cleanPayload(changesOrFn));
        for (const f of this.queryFilters) {
            if (typeof q[f.method] === 'function') {
                q = q[f.method](...f.args);
            }
        }
        const { data, error } = await q.select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.modify Error]`, error);
            return 0;
        }
        return data ? data.length : 0;
    }

    async sortBy(field) {
        this.orderBy(field);
        return await this.toArray();
    }
}

// Where Clause Builder (Mimics Dexie WhereClause interface)
class SupabaseWhereClause {
    constructor(collection, field) {
        this.collection = collection;
        this.field = field;
    }

    equals(val) {
        if (Array.isArray(this.field) && Array.isArray(val)) {
            for (let i = 0; i < this.field.length; i++) {
                this.collection.addFilter('eq', this.field[i], val[i]);
            }
            return this.collection;
        }
        this.collection.addFilter('eq', this.field, val);
        return this.collection;
    }

    equalsIgnoreCase(val) {
        this.collection.addFilter('ilike', this.field, val);
        return this.collection;
    }

    startsWith(prefix) {
        this.collection.addFilter('like', this.field, prefix + '%');
        return this.collection;
    }

    between(lower, upper, incLower = true, incUpper = true) {
        if (incLower) {
            this.collection.addFilter('gte', this.field, lower);
        } else {
            this.collection.addFilter('gt', this.field, lower);
        }
        if (incUpper) {
            this.collection.addFilter('lte', this.field, upper);
        } else {
            this.collection.addFilter('lt', this.field, upper);
        }
        return this.collection;
    }

    aboveOrEqual(val) {
        this.collection.addFilter('gte', this.field, val);
        return this.collection;
    }

    belowOrEqual(val) {
        this.collection.addFilter('lte', this.field, val);
        return this.collection;
    }

    above(val) {
        this.collection.addFilter('gt', this.field, val);
        return this.collection;
    }

    below(val) {
        this.collection.addFilter('lt', this.field, val);
        return this.collection;
    }

    anyOf(arr) {
        if (Array.isArray(arr)) {
            this.collection.addFilter('in', this.field, arr);
        }
        return this.collection;
    }
}

// Supabase Table Handler (Drop-in replacement for Dexie.Table)
class SupabaseTable {
    constructor(tableName, pkField = 'id') {
        this.tableName = tableName;
        this.name = tableName;
        this.pkField = pkField;
    }

    async toArray() {
        if (!supabaseClient) return [];
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .select('*')
            .range(0, 99999);
        if (error) {
            console.error(`[Supabase ${this.tableName}.toArray Error]`, error);
            return [];
        }
        return data || [];
    }

    async get(idOrKey) {
        if (!supabaseClient) return undefined;
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .select('*')
            .eq(this.pkField, idOrKey)
            .maybeSingle();
        if (error) {
            console.error(`[Supabase ${this.tableName}.get Error]`, error);
            return undefined;
        }
        return data || undefined;
    }

    async add(record) {
        if (!supabaseClient) throw new Error("Supabase client not initialized");
        const clean = cleanPayload(record);
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .insert([clean])
            .select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.add Error]`, error);
            throw error;
        }
        return (data && data[0]) ? data[0][this.pkField] : undefined;
    }

    async put(record) {
        if (!supabaseClient) throw new Error("Supabase client not initialized");
        const clean = cleanPayload(record);
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .upsert([clean], { onConflict: this.pkField })
            .select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.put Error]`, error);
            throw error;
        }
        return (data && data[0]) ? data[0][this.pkField] : undefined;
    }

    async update(idOrKey, changes) {
        if (!supabaseClient) throw new Error("Supabase client not initialized");
        const clean = cleanPayload(changes);
        delete clean[this.pkField]; // Never mutate primary key
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .update(clean)
            .eq(this.pkField, idOrKey)
            .select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.update Error]`, error);
            throw error;
        }
        return (data && data.length) ? data.length : 1;
    }

    async delete(idOrKey) {
        if (!supabaseClient) return false;
        const { error } = await supabaseClient
            .from(this.tableName)
            .delete()
            .eq(this.pkField, idOrKey);
        if (error) {
            console.error(`[Supabase ${this.tableName}.delete Error]`, error);
            throw error;
        }
        return true;
    }

    async clear() {
        if (!supabaseClient) return false;
        const { error } = await supabaseClient
            .from(this.tableName)
            .delete()
            .not(this.pkField, 'is', null);
        if (error) {
            console.error(`[Supabase ${this.tableName}.clear Error]`, error);
            throw error;
        }
        return true;
    }

    async count() {
        if (!supabaseClient) return 0;
        const { count, error } = await supabaseClient
            .from(this.tableName)
            .select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`[Supabase ${this.tableName}.count Error]`, error);
            return 0;
        }
        return count || 0;
    }

    async bulkAdd(records) {
        if (!supabaseClient || !Array.isArray(records) || records.length === 0) return [];
        const cleanList = records.map(cleanPayload);
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .insert(cleanList)
            .select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.bulkAdd Error]`, error);
            throw error;
        }
        return (data || []).map(r => r[this.pkField]);
    }

    async bulkPut(records) {
        if (!supabaseClient || !Array.isArray(records) || records.length === 0) return [];
        const cleanList = records.map(cleanPayload);
        const { data, error } = await supabaseClient
            .from(this.tableName)
            .upsert(cleanList, { onConflict: this.pkField })
            .select();
        if (error) {
            console.error(`[Supabase ${this.tableName}.bulkPut Error]`, error);
            throw error;
        }
        return (data || []).map(r => r[this.pkField]);
    }

    where(arg) {
        const collection = new SupabaseCollection(this.tableName, this.pkField);
        if (typeof arg === 'string') {
            if (arg.startsWith('[') && arg.endsWith(']')) {
                const fields = arg.slice(1, -1).split('+').map(s => s.trim());
                return new SupabaseWhereClause(collection, fields);
            }
            return new SupabaseWhereClause(collection, arg);
        } else if (typeof arg === 'object' && arg !== null) {
            for (const [key, value] of Object.entries(arg)) {
                collection.addFilter('eq', key, value);
            }
            return collection;
        }
        return collection;
    }

    filter(fn) {
        return new SupabaseCollection(this.tableName, this.pkField).filter(fn);
    }

    orderBy(field, asc = true) {
        return new SupabaseCollection(this.tableName, this.pkField).orderBy(field, asc);
    }

    reverse() {
        return new SupabaseCollection(this.tableName, this.pkField).reverse();
    }

    limit(n) {
        return new SupabaseCollection(this.tableName, this.pkField).limit(n);
    }

    offset(n) {
        return new SupabaseCollection(this.tableName, this.pkField).offset(n);
    }

    toCollection() {
        return new SupabaseCollection(this.tableName, this.pkField);
    }
}

// All 41 ERP Tables
const TABLE_NAMES = [
    'products', 'sales', 'purchases', 'grn', 'expenses', 'commissions', 'settings',
    'customers', 'vendors', 'brands', 'returns', 'payments', 'departments',
    'employees', 'attendance', 'leaves', 'payroll', 'payroll_batches', 'ledger',
    'accounts', 'bank_accounts', 'bank_transactions', 'loans', 'allowances', 'kpis',
    'assets', 'recruitment', 'users', 'activity_log', 'tax_reports', 'repair_jobs',
    'stores', 'inventory', 'stock_transfers', 'bills', 'customer_reminders',
    'held_invoices', 'forecasted_expenses', 'company_loans', 'company_loan_payments',
    'service_records'
];

// Main Database Object
const db = {
    isOpen: () => !!supabaseClient,
    open: async () => true,
    version: function () {
        return {
            stores: function () { return db; }
        };
    },
    transaction: async function (mode, tables, callback) {
        if (typeof mode === 'function') return await mode();
        if (typeof tables === 'function') return await tables();
        if (typeof callback === 'function') return await callback();
    },
    delete: async function () {
        for (const table of db.tables) {
            await table.clear();
        }
    }
};

// Instantiate all tables
for (const name of TABLE_NAMES) {
    db[name] = new SupabaseTable(name, name === 'settings' ? 'key' : 'id');
}
db.tables = TABLE_NAMES.map(name => db[name]);

// Bind to window for global access
window.db = db;

// ==============================================================================
// Supabase Realtime Sync Channel (postgres_changes)
// ==============================================================================

let realtimeDebounceTimers = {};
function debounceRefresh(key, fn, delay = 350) {
    if (realtimeDebounceTimers[key]) clearTimeout(realtimeDebounceTimers[key]);
    realtimeDebounceTimers[key] = setTimeout(fn, delay);
}

function updateRealtimeStatusIndicator(isConnected) {
    let badge = document.getElementById('supabase-realtime-badge');
    if (!badge) {
        const header = document.querySelector('header');
        if (header) {
            badge = document.createElement('div');
            badge.id = 'supabase-realtime-badge';
            badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border mr-2 transition-all';
            header.insertBefore(badge, header.querySelector('.relative.hidden.sm\\:block.w-64'));
        }
    }
    if (badge) {
        if (isConnected) {
            badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 mr-2';
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Sync Active';
            badge.title = 'Connected to Supabase Realtime: Changes sync automatically across all devices';
        } else {
            badge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 mr-2';
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span> Reconnecting...';
            badge.title = 'Connecting to Supabase Realtime...';
        }
    }
}

function handleRealtimeChange(payload) {
    const table = payload.table;
    console.log(`⚡ [Realtime] Event: ${payload.eventType} on table: ${table}`, payload);

    // Dispatch global custom event for any module-specific listeners
    try {
        window.dispatchEvent(new CustomEvent('supabase:change', { detail: payload }));
    } catch (e) {}

    // Identify active view in DOM
    const activeViewEl = document.querySelector('.view-section.active') ||
        document.querySelector('.view-section:not(.hidden)');
    const activeId = activeViewEl ? activeViewEl.id : '';

    // Debounced UI re-render
    debounceRefresh(`refresh-${table}`, () => {
        if (table === 'products' || table === 'inventory') {
            if (activeId === 'products-view' && typeof renderInventoryList === 'function') {
                renderInventoryList(document.getElementById('inv-search')?.value || '');
            } else if (activeId === 'pos-view' && typeof loadPOS === 'function') {
                loadPOS();
            } else if (activeId === 'dashboard-view' && typeof loadDashboard === 'function') {
                loadDashboard();
            }
        } else if (table === 'sales' || table === 'held_invoices') {
            if (activeId === 'sales-view' && typeof renderSalesList === 'function') {
                renderSalesList(document.getElementById('sales-search')?.value || '');
            } else if (activeId === 'pos-view' && typeof renderHeldInvoices === 'function') {
                renderHeldInvoices();
            } else if (activeId === 'dashboard-view' && typeof loadDashboard === 'function') {
                loadDashboard();
            } else if (activeId === 'financial-summary-view' && typeof loadFinancialSummary === 'function') {
                loadFinancialSummary();
            } else if (activeId === 'tax-view' && typeof loadTax === 'function') {
                loadTax();
            } else if (activeId === 'analytics-view' && typeof loadAnalytics === 'function') {
                loadAnalytics();
            }
        } else if (table === 'customers') {
            if (activeId === 'customers-view' && typeof renderCustomersList === 'function') {
                renderCustomersList(document.getElementById('customers-search')?.value || '');
            } else if (activeId === 'pos-view' && typeof populateCustomerDropdown === 'function') {
                populateCustomerDropdown();
            }
        } else if (table === 'vendors') {
            if (activeId === 'vendors-view' && typeof renderVendorsList === 'function') {
                renderVendorsList();
            }
        } else if (table === 'purchases') {
            if (activeId === 'purchases-view' && typeof loadPurchases === 'function') {
                loadPurchases();
            }
        } else if (table === 'grn') {
            if (activeId === 'grn-view' && typeof loadGRN === 'function') {
                loadGRN();
            }
        } else if (table === 'expenses') {
            if (activeId === 'finance-view' && typeof loadFinance === 'function') {
                loadFinance();
            } else if (activeId === 'accounting-view' && typeof loadAccounting === 'function') {
                loadAccounting();
            } else if (activeId === 'dashboard-view' && typeof loadDashboard === 'function') {
                loadDashboard();
            }
        } else if (table === 'bank_accounts' || table === 'bank_transactions') {
            if (activeId === 'banking-view' && typeof loadBanking === 'function') {
                loadBanking();
            } else if (activeId === 'finance-view' && typeof loadFinance === 'function') {
                loadFinance();
            }
        } else if (table === 'payments') {
            if (activeId === 'payments-view' && typeof loadPayments === 'function') {
                loadPayments();
            } else if (activeId === 'outstanding-view' && typeof loadOutstanding === 'function') {
                loadOutstanding();
            }
        } else if (table === 'company_loans' || table === 'company_loan_payments') {
            if (activeId === 'company-loans-view' && typeof loadCompanyLoans === 'function') {
                loadCompanyLoans();
            }
        } else if (['employees', 'attendance', 'leaves', 'payroll', 'payroll_batches'].includes(table)) {
            if (activeId === 'hr-view' && typeof loadHR === 'function') {
                loadHR();
            }
        } else if (table === 'users') {
            if (activeId === 'users-view' && typeof loadUsers === 'function') {
                loadUsers();
            }
        } else if (table === 'settings') {
            if (activeId === 'settings-view' && typeof loadSettings === 'function') {
                loadSettings();
            }
            if (typeof updateAppLogo === 'function') updateAppLogo();
            if (typeof updateBranding === 'function') updateBranding();
        }
    }, 350);
}

function initSupabaseRealtime() {
    if (!supabaseClient) return;

    try {
        const channel = supabaseClient.channel('mobilemate-pos-realtime-all')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                (payload) => handleRealtimeChange(payload)
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [Supabase Realtime] Subscribed to all public database changes.');
                    updateRealtimeStatusIndicator(true);
                } else if (status === 'CHANNEL_ERROR') {
                    console.warn('⚠️ [Supabase Realtime] Channel error:', err);
                    updateRealtimeStatusIndicator(false);
                } else if (status === 'TIMED_OUT') {
                    console.warn('⚠️ [Supabase Realtime] Timed out.');
                    updateRealtimeStatusIndicator(false);
                }
            });

        window.realtimeChannel = channel;
    } catch (err) {
        console.error("Failed to setup Supabase Realtime channel:", err);
    }
}

// Helper for bank transactions & balance updates
window.recordBankTransaction = async function(bankAccountId, type, method, amount, reference, description, date) {
    if (!bankAccountId) return null;

    let accId = parseInt(bankAccountId);
    if (isNaN(accId)) {
        if (typeof bankAccountId === 'string' && bankAccountId.startsWith('BANK-')) {
            accId = parseInt(bankAccountId.split('-')[1]);
        }
    }
    if (isNaN(accId)) return null;

    const dateStr = (date || new Date().toISOString().split('T')[0]) + 'T' + new Date().toLocaleTimeString('en-GB');

    try {
        const acc = await db.bank_accounts.get(accId);
        if (!acc) {
            console.error(`Bank account with ID ${accId} not found.`);
            return null;
        }

        const transId = await db.bank_transactions.add({
            date: dateStr,
            bank_account_id: accId,
            type: type,
            method: method,
            amount: amount,
            reference: reference,
            description: description,
            status: 'Cleared'
        });

        const newBalance = type === 'inward' 
            ? (parseFloat(acc.balance) || 0) + amount 
            : (parseFloat(acc.balance) || 0) - amount;

        await db.bank_accounts.update(accId, { balance: newBalance });
        console.log(`Bank account ${acc.name} balance updated from ${acc.balance} to ${newBalance}`);
        return transId;
    } catch (err) {
        console.error("Failed to record bank transaction:", err);
        throw err;
    }
};

// Database Self-Healing Routine
async function runDatabaseSelfHealing() {
    try {
        const payments = await db.payments.filter(p => p.amount === 160000 && p.target_type === 'vendor').toArray();
        if (payments.length === 0) return;

        const targetPayment = payments[0];
        const bankTrans = await db.bank_transactions.where('amount').equals(160000).toArray();
        const outwardTrans = bankTrans.find(t => t.type === 'outward' && t.bank_account_id);
        if (outwardTrans) return;

        const bankAccounts = await db.bank_accounts.toArray();
        if (bankAccounts.length === 0) return;

        let bankAcc = bankAccounts.find(b => b.id === parseInt(targetPayment.account_id)) || bankAccounts[0];
        const newBalance = (bankAcc.balance || 0) - 160000;
        await db.bank_accounts.update(bankAcc.id, { balance: newBalance });

        const dateStr = new Date().toISOString().split('T')[0] + 'T' + new Date().toLocaleTimeString('en-GB');
        await db.bank_transactions.add({
            date: dateStr,
            bank_account_id: bankAcc.id,
            type: 'outward',
            method: 'Bank Transfer',
            amount: 160000,
            reference: `Payment Receipt #${targetPayment.id}`,
            description: `Self-Healed Bank Transfer — Outward payment to supplier`,
            status: 'Cleared'
        });

        await db.payments.update(targetPayment.id, { account_id: bankAcc.id });
    } catch (err) {
        console.warn("Database self-healing skipped:", err);
    }
}

// Initial Data Seeding for Demo/Showcase if cloud database is empty
async function seedDemoData() {
    try {
        const salesCount = await db.sales.count();
        if (salesCount === 0) {
            const now = new Date();
            const sampleSales = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(now.getDate() - i);
                const isoDate = date.toISOString().split('T')[0] + 'T12:00:00';
                sampleSales.push({
                    date: isoDate,
                    customer_id: 1,
                    customer_name: 'Walk-in Customer',
                    type: i % 2 === 0 ? 'retail' : 'wholesale',
                    document_type: 'sale',
                    status: 'completed',
                    tracking_number: '',
                    woo_order_id: null,
                    invoice_number: `INV-${1000 + i}`,
                    total: parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
                    items: []
                });
            }
            await db.sales.bulkAdd(sampleSales);
            console.log('Demo sales data seeded to Supabase Cloud');
        }
    } catch (e) {
        console.warn('Notice: Demo seeding skipped (tables may be pending creation)', e.message);
    }
}

// Automatic / Manual Migration from Local Dexie IndexedDB to Supabase Cloud
window.migrateDexieToSupabase = async function() {
    if (!window.indexedDB) {
        alert("IndexedDB is not supported in this browser.");
        return;
    }

    try {
        if (typeof Swal !== 'undefined') {
            const confirm = await Swal.fire({
                title: 'Migrate Local Data to Cloud?',
                text: 'This will copy all products, sales, customers, and settings from your local browser IndexedDB to your Supabase Cloud Database.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0e3257',
                confirmButtonText: 'Yes, Start Migration'
            });
            if (!confirm.isConfirmed) return;

            Swal.fire({
                title: 'Migrating Data...',
                html: '<div class="py-4"><div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div><p id="migration-progress" class="text-sm font-bold mt-4 text-gray-600">Reading local database...</p></div>',
                showConfirmButton: false,
                allowOutsideClick: false
            });
        }

        const req = indexedDB.open('MobileMatePOS');
        req.onerror = () => {
            if (typeof showAlert === 'function') showAlert('Migration Error', 'Could not access local MobileMatePOS database', 'error');
        };

        req.onsuccess = async (event) => {
            const localDb = event.target.result;
            const objectStoreNames = Array.from(localDb.objectStoreNames);
            console.log("Local IndexedDB Object Stores:", objectStoreNames);

            let totalMigrated = 0;

            for (const storeName of objectStoreNames) {
                if (!db[storeName]) continue;

                const progressEl = document.getElementById('migration-progress');
                if (progressEl) progressEl.textContent = `Migrating ${storeName}...`;

                const records = await new Promise((resolve) => {
                    const tx = localDb.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const getAllReq = store.getAll();
                    getAllReq.onsuccess = () => resolve(getAllReq.result || []);
                    getAllReq.onerror = () => resolve([]);
                });

                if (records && records.length > 0) {
                    console.log(`Migrating ${records.length} records for ${storeName}...`);
                    await db[storeName].bulkPut(records);
                    totalMigrated += records.length;
                }
            }

            localDb.close();

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Migration Complete!',
                    text: `Successfully synced ${totalMigrated} records to your Supabase Cloud Database!`,
                    icon: 'success',
                    confirmButtonColor: '#0e3257'
                }).then(() => window.location.reload());
            } else {
                alert(`Migration Complete! ${totalMigrated} records synced to Supabase.`);
                window.location.reload();
            }
        };
    } catch (err) {
        console.error("Migration failed:", err);
        if (typeof showAlert === 'function') showAlert('Migration Failed', err.message, 'error');
    }
};

// Initialize Realtime & Seeding when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSupabaseRealtime();
        setTimeout(seedDemoData, 1200);
        setTimeout(runDatabaseSelfHealing, 2000);
    });
} else {
    initSupabaseRealtime();
    setTimeout(seedDemoData, 1200);
    setTimeout(runDatabaseSelfHealing, 2000);
}
