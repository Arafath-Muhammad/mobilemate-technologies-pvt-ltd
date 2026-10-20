
async function loadUsers() {
    console.log("Loading Users View...");
    const container = document.getElementById('users-view');
    if (!container) return;

    // Get stats
    const users = await db.users.toArray();
    const adminCount = users.filter(u => u.role === 'admin').length;
    const staffCount = users.length - adminCount;

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in pb-10">
            <!-- Top Header & Modern Stats -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div class="space-y-2">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-[1.5rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 relative group overflow-hidden">
                            <i class="fa-solid fa-user-shield text-2xl relative z-10"></i>
                            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </div>
                        <div>
                            <h2 class="text-5xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase leading-none">Identity Management</h2>
                            <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-2 ml-1 opacity-70">Team Directory & Access Matrix</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-4">
                    <div class="px-8 py-5 bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-5 group transition-all hover:shadow-xl hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                            <i class="fa-solid fa-crown"></i>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Root Admins</p>
                            <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-none">${adminCount}</h3>
                        </div>
                    </div>
                    <div class="px-8 py-5 bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm flex items-center gap-5 group transition-all hover:shadow-xl hover:-translate-y-1">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl group-hover:-rotate-12 transition-transform">
                            <i class="fa-solid fa-id-card-clip"></i>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">System Staff</p>
                            <h3 class="text-2xl font-black text-gray-900 dark:text-white leading-none">${staffCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Export to Hardcode (Admin Alert Mode) -->
            ${currentUser && currentUser.role === 'admin' ? `
            <div class="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/40 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                        <i class="fa-solid fa-code-commit"></i>
                    </div>
                    <div>
                        <p class="text-[11px] text-amber-900 dark:text-amber-400 font-black uppercase tracking-tight">Persistence Synchronization Service</p>
                        <p class="text-[10px] text-amber-700/60 dark:text-amber-500/60 font-medium">Capture current state & map to source code for permanent deployment.</p>
                    </div>
                </div>
                <button onclick="exportToHardcode()" class="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-3 relative z-10">
                    <i class="fa-solid fa-bolt"></i>
                    Generate Source Snippet
                </button>
            </div>
            ` : ''}

            <!-- Main Workspace: Directory & Profiles -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <!-- Sidebar: Team Directory List -->
                <div class="lg:col-span-4 space-y-8">
                    <div class="flex items-center justify-between px-2">
                        <div>
                             <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Personnel Index</h4>
                             <p class="text-sm font-black text-gray-900 dark:text-white mt-1 italic uppercase tracking-tighter">Operational Directory</p>
                        </div>
                        ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') ? `
                        <button onclick="openUserModal()" class="w-12 h-12 rounded-2xl bg-primary text-white hover:bg-indigo-700 transition-all shadow-2xl shadow-primary/30 active:scale-90 flex items-center justify-center group">
                            <i class="fa-solid fa-plus group-hover:rotate-180 transition-transform duration-500"></i>
                        </button>
                        ` : ''}
                    </div>
                    
                    <div class="relative group">
                        <i class="fa-solid fa-search absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-all duration-300"></i>
                        <input type="text" id="user-search" oninput="renderUserList(this.value)" placeholder="Search operatives..." 
                            class="w-full pl-14 pr-6 py-6 bg-white dark:bg-darkCard border-2 border-transparent focus:border-primary/10 rounded-[2rem] outline-none shadow-sm focus:shadow-2xl transition-all dark:text-white placeholder-gray-400 font-bold text-sm">
                    </div>

                    <div id="user-list-items" class="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-3 pt-2">
                        <!-- Users dynamic -->
                    </div>
                </div>

                <!-- Main: Profile detail View -->
                <div class="lg:col-span-8">
                    <div id="user-details-container" class="bg-white dark:bg-darkCard rounded-[4rem] border border-gray-100 dark:border-darkBorder shadow-2xl shadow-gray-200/50 dark:shadow-none min-h-[800px] flex flex-col items-center justify-center p-20 text-center transition-all animate-fade-in relative overflow-hidden group">
                        <!-- Empty State Decor -->
                        <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10 duration-1000"></div>
                        <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] -ml-48 -mb-48 transition-all group-hover:bg-indigo-500/10 duration-1000"></div>
                        
                        <div class="w-48 h-48 bg-gray-50 dark:bg-gray-800/50 rounded-[3.5rem] flex items-center justify-center text-gray-200 mb-12 border-4 border-white dark:border-gray-800 shadow-inner group relative">
                            <i class="fa-solid fa-id-badge text-8xl group-hover:scale-110 transition-transform duration-700 delay-100 opacity-20 dark:opacity-40"></i>
                            <div class="absolute -inset-6 border-2 border-dashed border-primary/10 rounded-[4rem] animate-spin-slow"></div>
                            <div class="absolute -inset-10 border border-indigo-500/5 rounded-[5rem] animate-spin-slow-reverse"></div>
                        </div>
                        <h3 class="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic uppercase">Security Console</h3>
                        <p class="text-gray-400 max-w-sm leading-relaxed font-black text-[10px] uppercase tracking-[0.4em] opacity-60">Authentication & Access Subsystem</p>
                        <p class="text-gray-500 max-w-md mt-8 leading-relaxed font-medium text-sm">Select an active system operative from the index directory to initialize their profile, manage security clearaces, and synchronize credentials.</p>
                        
                        <div class="mt-16 flex gap-6">
                            <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                            <div class="w-16 h-1.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/30"></div>
                            <div class="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderUserList();
}

async function renderUserList(query = '') {
    const listContainer = document.getElementById('user-list-items');
    if (!listContainer) return;

    try {
        let users = await db.users.toArray();
        
        if (query) {
            const q = query.toLowerCase();
            users = users.filter(u => u.username && u.username.toLowerCase().includes(q));
        }

        if (users.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-gray-50 dark:bg-darkCard p-10 rounded-3xl text-center border-2 border-dashed border-gray-100 dark:border-gray-800 opacity-60">
                    <p class="text-sm font-bold text-gray-400">No users found</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = users.map(user => {
            const username = user.username || 'Unknown';
            const displayUsername = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') 
                ? username 
                : (username.charAt(0) + '****');

            const isSelected = selectedUserId === user.id;

            return `
            <div onclick="selectUser(${user.id})" class="user-card group p-5 ${isSelected ? 'bg-primary text-white shadow-2xl shadow-primary/30 ring-2 ring-primary/20' : 'bg-white dark:bg-darkCard hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent hover:border-primary/10'} rounded-[1.8rem] cursor-pointer transition-all flex items-center gap-5 relative overflow-hidden">
                <div class="w-14 h-14 rounded-2xl ${isSelected ? 'bg-white text-primary' : (user.role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-emerald-500 text-white shadow-emerald-100')} flex items-center justify-center text-2xl font-black shadow-lg relative z-10 transition-transform group-hover:scale-105 duration-500">
                    ${username.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0 relative z-10">
                    <h4 class="font-black ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'} truncate text-lg tracking-tighter italic uppercase">${displayUsername}</h4>
                    <div class="flex items-center gap-3 mt-1.5">
                        <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-emerald-400 animate-pulse'}"></span>
                            <p class="text-[9px] uppercase font-black tracking-widest ${isSelected ? 'text-white/80' : (user.role === 'admin' ? 'text-indigo-500' : 'text-emerald-500')}">${user.role}</p>
                        </div>
                        <div class="w-1 h-1 rounded-full ${isSelected ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'}"></div>
                        <p class="text-[9px] font-bold ${isSelected ? 'text-white/60' : 'text-gray-400'} uppercase tracking-tighter">OP-ID: #${user.id.toString().padStart(4, '0')}</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right text-lg ${isSelected ? 'text-white/40' : 'text-gray-200'} group-hover:translate-x-1 transition-transform"></i>
                
                <!-- Background Decoration -->
                <div class="absolute -right-4 -bottom-4 w-20 h-20 ${isSelected ? 'bg-white/10' : 'bg-gray-50 dark:bg-gray-900/50'} rounded-full group-hover:scale-[3] transition-transform duration-700 opacity-50"></div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Error rendering user list:", err);
    }
}

let selectedUserId = null;

async function selectUser(userId) {
    selectedUserId = userId;
    const container = document.getElementById('user-details-container');
    if (!container) return;

    try {
        const user = await db.users.get(userId);
        if (!user) return;

        // Default permissions if not present (Legacy/Fallback)
        if (!user.permissions) {
            user.permissions = (user.role === 'admin' || user.role === 'manager') 
                ? ['all'] 
                : ['pos-view', 'sales-view', 'quotes-view', 'customers-view', 'warranty-view', 'returns-view'];
        }

        container.classList.remove('items-center', 'justify-center', 'text-center', 'p-20');
        container.classList.add('p-0');
        
        container.innerHTML = `
            <div class="flex flex-col h-full animate-fade-in relative overflow-hidden rounded-[3.5rem] bg-white dark:bg-darkCard">
                <!-- Header: Digital Signature / Identity Card -->
                <div class="p-10 border-b border-gray-100 dark:border-darkBorder bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 dark:from-darkCard/50 dark:via-darkCard dark:to-darkCard/50 flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative overflow-hidden">
                    <div class="flex flex-col md:flex-row items-center gap-10 relative z-10 text-center md:text-left">
                        <div class="w-32 h-32 rounded-[3.5rem] ${user.role === 'admin' ? 'bg-indigo-600 shadow-3xl shadow-indigo-600/30' : 'bg-primary shadow-3xl shadow-primary/30'} text-white flex items-center justify-center text-6xl font-black relative overflow-hidden group">
                            <span class="relative z-10 italic">${user.username.charAt(0).toUpperCase()}</span>
                            <!-- Animated Glint -->
                            <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        </div>
                        <div class="space-y-4">
                            <div class="flex flex-col md:flex-row items-center gap-4">
                                <h3 class="text-6xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase leading-none">${currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') ? (user.username || 'Unknown') : ((user.username || 'Unknown').charAt(0) + '****')}</h3>
                                ${user.username === 'admin' || user.role === 'admin' ? '<div class="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30" title="Primary Administrator"><i class="fa-solid fa-crown"></i></div>' : ''}
                            </div>
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <div class="px-6 py-2 bg-gray-950 dark:bg-darkBorder text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center gap-3">
                                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></span>
                                    ${user.role} Operative
                                </div>
                                <div class="h-5 w-[2px] bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                <span class="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-3 italic"><i class="fa-solid fa-fingerprint text-sm"></i> SYS-REF: #${user.id.toString().padStart(4, '0')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-center xl:justify-end gap-5 relative z-10">
                        ${currentUser && currentUser.role === 'admin' ? `
                        <button onclick="editUserProfile(${user.id})" class="w-16 h-16 flex items-center justify-center text-primary bg-white dark:bg-gray-900 hover:bg-primary hover:text-white rounded-[1.8rem] transition-all shadow-xl hover:shadow-primary/40 active:scale-95 border border-gray-100 dark:border-gray-800 group" title="Modify Profile Data">
                            <i class="fa-solid fa-user-gear text-2xl group-hover:rotate-90 transition-transform duration-500"></i>
                        </button>
                        <button onclick="deleteUser(${user.id})" class="w-16 h-16 flex items-center justify-center text-red-500 bg-white dark:bg-gray-900 hover:bg-red-500 hover:text-white rounded-[1.8rem] transition-all shadow-xl hover:shadow-red-500/40 active:scale-95 border border-gray-100 dark:border-gray-800 group" title="Revoke Access">
                            <i class="fa-solid fa-user-slash text-2xl group-hover:scale-110 transition-transform"></i>
                        </button>
                        ` : ''}
                    </div>
                    
                    <!-- Atmospheric Background Overlay -->
                    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -mr-64 -mt-64 -z-10"></div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-20 bg-gray-50/10">
                    <!-- Section: Security Center (Credentials) -->
                    <section class="space-y-10">
                        <div class="flex items-center gap-6">
                            <div class="w-16 h-16 rounded-[1.8rem] bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner relative overflow-hidden group">
                                <i class="fa-solid fa-shield-keyhole text-2xl group-hover:rotate-12 transition-transform"></i>
                            </div>
                            <div>
                                <h4 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Security Center</h4>
                                <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1 opacity-70">Credential Rotation & Signature Management</p>
                            </div>
                        </div>
                        
                        ${currentUser && currentUser.role === 'admin' ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <!-- Current Hash -->
                            <div class="bg-white dark:bg-darkCard p-10 rounded-[3rem] border border-gray-100 dark:border-darkBorder shadow-sm space-y-6 relative overflow-hidden group">
                                <div class="absolute top-0 left-0 w-2 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors"></div>
                                <div class="flex items-center justify-between mb-2">
                                    <label class="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-3">
                                         Active Cipher Key
                                    </label>
                                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                                </div>
                                <div class="relative flex items-center bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 shadow-inner group-hover:border-emerald-500/20 transition-all">
                                    <input type="password" id="current-password-${user.id}" value="${user.password}" readonly 
                                        class="w-full bg-transparent border-none text-2xl font-black text-gray-900 dark:text-white outline-none cursor-default font-mono tracking-[0.3em]">
                                    <button type="button" onclick="toggleUserPasswordVisibility('current-password-${user.id}', 'curr-pass-icon-${user.id}')" 
                                        class="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-primary transition-colors focus:outline-none">
                                        <i id="curr-pass-icon-${user.id}" class="fa-solid fa-eye text-xl"></i>
                                    </button>
                                </div>
                                <p class="text-[10px] text-gray-400 font-bold px-1 flex items-center gap-2 italic leading-relaxed"><i class="fa-solid fa-circle-info text-primary"></i> This signature key grants full operational access to the operative.</p>
                            </div>

                            <!-- Key Rotation -->
                            <div class="bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent p-10 rounded-[3rem] border-2 border-primary/20 shadow-2xl shadow-primary/10 space-y-6 relative group overflow-hidden">
                                <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <label class="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-3 px-1">
                                    Cipher Rotation Protocol
                                </label>
                                <div class="flex gap-4 relative z-10">
                                    <div class="relative flex-1 group">
                                        <i class="fa-solid fa-fingerprint absolute left-6 top-1/2 -translate-y-1/2 text-primary/40 text-xl group-focus-within:text-primary transition-colors"></i>
                                        <input type="password" id="new-password-${user.id}" placeholder="Enter new signature..." 
                                            class="w-full pl-16 pr-16 py-6 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-primary rounded-[1.8rem] outline-none shadow-xl dark:text-white font-black text-xl transition-all">
                                        <button type="button" onclick="toggleUserPasswordVisibility('new-password-${user.id}', 'pass-icon-${user.id}')" 
                                            class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors focus:outline-none">
                                            <i id="pass-icon-${user.id}" class="fa-solid fa-eye text-xl"></i>
                                        </button>
                                    </div>
                                    <button onclick="updatePassword(${user.id})" class="w-20 bg-primary hover:bg-indigo-700 text-white rounded-[1.8rem] font-black transition-all shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 flex items-center justify-center">
                                        <i class="fa-solid fa-sync text-2xl"></i>
                                    </button>
                                </div>
                                <p class="text-[10px] text-primary font-black uppercase tracking-widest px-1 italic flex items-center gap-2"><i class="fa-solid fa-rotate text-sm"></i> Periodic rotation is highly recommended.</p>
                            </div>
                        </div>
                        ` : `
                        <div class="bg-amber-50 dark:bg-amber-900/10 p-16 rounded-[4rem] border-2 border-dashed border-amber-200 dark:border-amber-800/30 text-center flex flex-col items-center group overflow-hidden relative">
                            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent animate-pulse"></div>
                            <div class="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform duration-700 relative z-10">
                                <i class="fa-solid fa-lock text-5xl text-amber-500"></i>
                            </div>
                            <h4 class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase relative z-10">Clearance Required</h4>
                            <p class="text-sm text-gray-500 max-w-sm mt-5 leading-relaxed font-medium relative z-10">Credential modification is strictly reserved for Higher-Level Administrators. Contact the System Architect for authorized deployment.</p>
                        </div>
                        `}
                    </section>

                    <!-- Section: Authorization Matrix (Permissions) -->
                    <section class="space-y-12">
                        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div class="flex items-center gap-6">
                                <div class="w-16 h-16 rounded-[1.8rem] bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-inner relative group overflow-hidden">
                                     <i class="fa-solid fa-microchip text-2xl group-hover:scale-125 transition-transform duration-700"></i>
                                     <div class="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                </div>
                                <div>
                                    <h4 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Authorization Matrix</h4>
                                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-1 opacity-70">Functional Boundaries & Access Privileges</p>
                                </div>
                            </div>
                            ${user.role === 'admin' ? `
                                <div class="px-8 py-4 bg-gray-950 text-white text-[11px] font-black rounded-[1.8rem] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 flex items-center gap-4 italic group">
                                    <i class="fa-solid fa-bolt-lightning text-amber-400 group-hover:animate-bounce"></i> 
                                    <span>Full Spectrum Master Access</span>
                                </div>
                            ` : `
                                <div class="flex gap-3">
                                    <button onclick="toggleAllPermissions(true)" class="px-6 py-3 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-2xl border border-primary/10 transition-all">Select Universal</button>
                                    <button onclick="toggleAllPermissions(false)" class="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">Restrict All</button>
                                </div>
                            `}
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="permissions-grid">
                            ${renderPermissionItems(user)}
                        </div>
                        <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center mt-10 opacity-40">System authorization protocol v2.4 initialized</p>
                    </section>

                    <!-- Section: Operational Log (Digital Footprint) -->
                    <section class="space-y-10">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center group overflow-hidden">
                                <i class="fa-solid fa-chart-network text-xl group-hover:scale-110 transition-transform"></i>
                            </div>
                            <h4 class="text-xs font-black text-gray-400 uppercase tracking-[0.4em]">Operational Traceability</h4>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-800/30 rounded-[3.5rem] p-4 border border-gray-100/50 dark:border-gray-800/50 overflow-hidden relative">
                             <div class="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
                             
                             <div class="flex items-center gap-6 p-6 transition-all hover:bg-white dark:hover:bg-gray-800 rounded-[2.5rem] group relative">
                                <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl group-hover:rotate-[360deg] transition-transform duration-700 shadow-inner">
                                    <i class="fa-solid fa-fingerprint"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Identity Synced</p>
                                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Core Integrity System Verification</p>
                                </div>
                                <div class="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[8px] font-black uppercase">Active</div>
                                <div class="absolute inset-0 border-2 border-emerald-500/0 group-hover:border-emerald-500/10 rounded-[2.5rem] transition-all"></div>
                            </div>

                            <div class="flex items-center gap-6 p-6 transition-all hover:bg-white dark:hover:bg-gray-800 rounded-[2.5rem] group relative opacity-60">
                                <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-inner">
                                    <i class="fa-solid fa-microchip"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Token Refresh</p>
                                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Multi-Factor Access Persistence</p>
                                </div>
                                <span class="text-[9px] font-black text-gray-400 uppercase">2h ago</span>
                                <div class="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/10 rounded-[2.5rem] transition-all"></div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Footer Action Bar -->
                <div class="p-10 border-t border-gray-100 dark:border-darkBorder bg-white dark:bg-darkCard flex flex-col md:flex-row justify-between items-center gap-10 group overflow-hidden relative">
                    <div class="absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mb-32"></div>
                    
                    <div class="flex -space-x-5 relative z-10 transition-all hover:-space-x-2">
                        <div class="w-14 h-14 rounded-full bg-primary/20 border-4 border-white dark:border-darkCard flex items-center justify-center text-xs font-black text-primary relative z-40 shadow-xl hover:scale-110 transition-transform">A</div>
                        <div class="w-14 h-14 rounded-full bg-indigo-500/20 border-4 border-white dark:border-darkCard flex items-center justify-center text-xs font-black text-indigo-600 relative z-30 shadow-xl hover:scale-110 transition-transform">U</div>
                        <div class="w-14 h-14 rounded-full bg-emerald-500/20 border-4 border-white dark:border-darkCard flex items-center justify-center text-xs font-black text-emerald-600 relative z-20 shadow-xl hover:scale-110 transition-transform">T</div>
                        <div class="w-14 h-14 rounded-full bg-orange-500/20 border-4 border-white dark:border-darkCard flex items-center justify-center text-[10px] font-black text-orange-600 relative z-10 shadow-xl hover:scale-110 transition-transform">H</div>
                    </div>
                    
                    ${currentUser && currentUser.role === 'admin' ? `
                    <button onclick="savePermissions(${user.id})" class="w-full md:w-auto group relative px-16 py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-3xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-5 italic relative z-10">
                        <span class="relative z-10 uppercase tracking-tighter">Commit Authorization</span>
                        <i class="fa-solid fa-fingerprint text-3xl relative z-10 opacity-70 group-hover:rotate-12 transition-transform"></i>
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-primary translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out"></div>
                    </button>
                    ` : `
                    <div class="px-10 py-5 bg-gray-50 dark:bg-darkBorder rounded-[1.8rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex items-center gap-4 group relative z-10">
                        <div class="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center animate-pulse">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Read-Only View: Root Access Encrypted</p>
                    </div>
                    `}
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error selecting user:", err);
    }
}

function renderPermissionItems(user) {
    const modules = [
        { id: 'dashboard-view', name: 'Intelligence Dashboard', icon: 'fa-chart-network', color: 'indigo', desc: 'Real-time sales & analytics insight' },
        { id: 'pos-view', name: 'Master POS Terminal', icon: 'fa-cash-register', color: 'emerald', desc: 'Core transaction processing engine' },
        { id: 'products-view', name: 'Vault Inventory', icon: 'fa-box-open', color: 'blue', desc: 'Master stock & lifecycle control' },
        { id: 'purchases-view', name: 'Supply Chain (PO)', icon: 'fa-truck-ramp-box', color: 'amber', desc: 'Logistics procurement lifecycle' },
        { id: 'sales-view', name: 'Revenue Invoices', icon: 'fa-file-invoice-dollar', color: 'rose', desc: 'Tax-compliant fiscal documentation' },
        { id: 'quotes-view', name: 'Market Quotations', icon: 'fa-file-signature', color: 'violet', desc: 'Front-end sales projections' },
        { id: 'sales-orders-view', name: 'System Sales Orders', icon: 'fa-file-contract', color: 'indigo', desc: 'Pre-fulfillment revenue tracking' },
        { id: 'returns-view', name: 'Return Logistics', icon: 'fa-rotate-left', color: 'slate', desc: 'Reversal operations management' },
        { id: 'rma-view', name: 'Warranty & RMA', icon: 'fa-screwdriver-wrench', color: 'red', desc: 'Technical service & claims terminal' },
        { id: 'customers-view', name: 'CRM Index', icon: 'fa-user-group', color: 'cyan', desc: 'Customer relational intelligence' },
        { id: 'payments-view', name: 'Fiscal Settlements', icon: 'fa-receipt', color: 'emerald', desc: 'Ledger payment synchronization' },
        { id: 'vendors-view', name: 'Supplier Partners', icon: 'fa-building-columns', color: 'orange', desc: 'External procurement relationships' },
        { id: 'warranty-view', name: 'Serial Intelligence', icon: 'fa-shield-halved', color: 'blue', desc: 'Hardware warranty tracking matrix' },
        { id: 'outstanding-view', name: 'Operational Credit', icon: 'fa-scale-unbalanced', color: 'amber', desc: 'Outstanding receivable analytics' },
        { id: 'finance-view', name: 'Treasury & Expense', icon: 'fa-vault', color: 'green', desc: 'Corporate fiscal housekeeping' },
        { id: 'tax-view', name: 'Tax Compliance', icon: 'fa-file-shield', color: 'emerald', desc: 'Governmental levy reporting' },
        { id: 'reports-view', name: 'Static Intelligence', icon: 'fa-magnifying-glass-chart', color: 'teal', desc: 'Historical performance auditing' },
        { id: 'hr-view', name: 'Human Capital', icon: 'fa-user-tie', color: 'indigo', desc: 'Staff directory & performance monitoring' },
        { id: 'accounting-view', name: 'Ledger Accounting', icon: 'fa-calculator', color: 'zinc', desc: 'Full-spectrum financial double-entry' },
        { id: 'email-view', name: 'Communication Sync', icon: 'fa-paper-plane', color: 'sky', desc: 'Automated mail & notification relay' },
        { id: 'woo-view', name: 'WooCommerce Bridge', icon: 'fa-brands fa-wordpress', color: 'blue', desc: 'Real-time e-commerce synchronization' },
        { id: 'users-view', name: 'Identity Terminal', icon: 'fa-user-gear', color: 'orange', desc: 'This security cluster management' },
        { id: 'settings-view', name: 'Core Configuration', icon: 'fa-gears', color: 'gray', desc: 'Base system operational settings' }
    ];

    const isAdmin = user.role === 'admin';
    const permissions = user.permissions || [];

    return modules.map(mod => {
        const hasAccess = isAdmin || permissions.includes('all') || permissions.includes(mod.id);
        const colorClass = {
            indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10',
            emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10',
            blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10',
            amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10',
            rose: 'text-rose-600 bg-rose-50 dark:bg-rose-900/10',
            violet: 'text-violet-600 bg-violet-50 dark:bg-violet-900/10',
            slate: 'text-slate-600 bg-slate-50 dark:bg-slate-900/10',
            red: 'text-red-600 bg-red-50 dark:bg-red-900/10',
            cyan: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/10',
            orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/10',
            green: 'text-green-600 bg-green-50 dark:bg-green-900/10',
            teal: 'text-teal-600 bg-teal-50 dark:bg-teal-900/10',
            zinc: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/10',
            sky: 'text-sky-600 bg-sky-50 dark:bg-sky-900/10',
            gray: 'text-gray-600 bg-gray-50 dark:bg-gray-900/10'
        }[mod.color] || 'text-gray-600 bg-gray-50';

        return `
            <label class="relative group cursor-pointer select-none">
                <input type="checkbox" name="permission" value="${mod.id}" ${hasAccess ? 'checked' : ''} ${isAdmin ? 'disabled' : ''} class="sr-only peer">
                <div class="p-6 bg-white dark:bg-darkCard border-2 border-gray-100 dark:border-darkBorder rounded-[2.5rem] peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-between group-hover:shadow-2xl hover:-translate-y-1">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center transition-transform group-hover:rotate-6 duration-500 shadow-sm">
                            <i class="${mod.icon.includes(' ') ? mod.icon : 'fa-solid ' + mod.icon} text-lg"></i>
                        </div>
                        <div class="w-6 h-6 rounded-full border-2 border-gray-100 dark:border-darkBorder flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary transition-all">
                             <div class="w-2.5 h-2.5 rounded-full bg-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all duration-300"></div>
                        </div>
                    </div>
                    
                    <div class="space-y-1">
                        <span class="block text-sm font-black text-gray-900 dark:text-white truncate tracking-tight uppercase italic">${mod.name}</span>
                        <p class="text-[9px] text-gray-400 font-medium leading-tight line-clamp-2 pr-2">${mod.desc}</p>
                    </div>

                    <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <span class="w-2 h-2 rounded-full ${hasAccess ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}"></span>
                        <span class="block text-[8px] font-black uppercase tracking-[0.2em] ${hasAccess ? 'text-primary' : 'text-gray-400 opacity-60'} transition-all">${hasAccess ? 'Active Access' : 'Restricted'}</span>
                    </div>

                    <!-- Decorative Background Element -->
                    <div class="absolute -right-6 -bottom-6 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-[3] transition-transform duration-1000"></div>
                </div>
                ${isAdmin ? '<div class="absolute inset-0 bg-white/5 dark:bg-black/5 rounded-[2.5rem] cursor-not-allowed z-20"></div>' : ''}
            </label>
        `;
    }).join('');
}

window.toggleAllPermissions = function(checked) {
    const container = document.getElementById('user-details-container');
    const checkboxes = container.querySelectorAll('input[name="permission"]');
    checkboxes.forEach(cb => {
        if (!cb.disabled) cb.checked = checked;
    });
};


function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('user-modal-title');
    const form = document.getElementById('user-form');
    
    if (userId) {
        // Edit mode (handled in detail view)
    } else {
        title.textContent = "Create New User";
        form.reset();
        document.getElementById('edit-user-id').value = "";
        
        // Dynamic hint for persistence
        const hintArea = document.getElementById('user-creation-hint');
        if (hintArea) {
            hintArea.innerHTML = `
                <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
                    <p class="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-tight flex items-start gap-2">
                        <i class="fa-solid fa-circle-info mt-0.5"></i>
                        Note: Users created here are saved in the browser database. To make a user <b>Permanent (Hardcoded)</b> so they remain even after clearing history, they must be added to the source code configuration.
                    </p>
                </div>
            `;
        }
        
        // Manager restriction: cannot create admins
        const roleSelect = document.getElementById('user-role');
        if (currentUser && currentUser.role === 'manager') {
            const adminOption = roleSelect.querySelector('option[value="admin"]');
            if (adminOption) adminOption.classList.add('hidden');
            roleSelect.value = 'cashier';
        } else {
            const adminOption = roleSelect.querySelector('option[value="admin"]');
            if (adminOption) adminOption.classList.remove('hidden');
        }

        document.getElementById('password-field-group').classList.remove('hidden');
        renderModalPermissions();
        toggleModalPermissions();
    }

    modal.classList.remove('hidden');
    modal.classList.add('opacity-100');
    document.getElementById('user-modal-content').classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('opacity-100');
        const content = document.getElementById('user-modal-content');
        if (content) content.classList.add('scale-95');
        document.body.style.overflow = 'auto';
    }
}

function renderModalPermissions() {
    const grid = document.getElementById('modal-permissions-grid');
    if (!grid) return;

    const modules = [
        { id: 'dashboard-view', name: 'Dashboard' },
        { id: 'pos-view', name: 'Master POS' },
        { id: 'products-view', name: 'Inventory' },
        { id: 'purchases-view', name: 'Purchases' },
        { id: 'sales-view', name: 'Sales' },
        { id: 'quotes-view', name: 'Quotes' },
        { id: 'sales-orders-view', name: 'Orders' },
        { id: 'returns-view', name: 'Returns' },
        { id: 'rma-view', name: 'RMA Center' },
        { id: 'customers-view', name: 'Customers' },
        { id: 'payments-view', name: 'Payments' },
        { id: 'vendors-view', name: 'Vendors' },
        { id: 'warranty-view', name: 'Warranty' },
        { id: 'outstanding-view', name: 'Outstanding' },
        { id: 'finance-view', name: 'Finance' },
        { id: 'tax-view', name: 'Tax/Profit' },
        { id: 'reports-view', name: 'Reports' },
        { id: 'hr-view', name: 'HR Admin' },
        { id: 'accounting-view', name: 'Accounting' },
        { id: 'email-view', name: 'Marketing' },
        { id: 'woo-view', name: 'WooCommerce' },
        { id: 'users-view', name: 'Users' },
        { id: 'settings-view', name: 'Settings' }
    ];

    grid.innerHTML = modules.map(mod => `
        <label class="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl cursor-pointer hover:bg-white dark:hover:bg-gray-750 hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20 group select-none">
            <input type="checkbox" name="modal-permission" value="${mod.id}" class="w-6 h-6 accent-primary rounded-lg">
            <span class="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest group-hover:text-primary transition-colors italic">${mod.name}</span>
        </label>
    `).join('');
}

window.toggleAllModalPermissions = function(checked) {
    const checkboxes = document.querySelectorAll('input[name="modal-permission"]');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
};


function toggleModalPermissions() {
    const role = document.getElementById('user-role').value;
    const area = document.getElementById('modal-permissions-area');
    if (!area) return;

    if (role === 'admin' || role === 'manager') {
        area.classList.add('hidden');
    } else {
        area.classList.remove('hidden');
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('user-username').value.trim();
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const full_name = document.getElementById('user-display-name') ? document.getElementById('user-display-name').value.trim() : '';
    const contact_number = document.getElementById('user-phone') ? document.getElementById('user-phone').value.trim() : '';
    const email = document.getElementById('user-email') ? document.getElementById('user-email').value.trim() : '';

    if (!username || !password) {
        showAlert('Warning', 'Username and Password are required', 'warning');
        return;
    }

    try {
        // Check if username exists
        const exists = await db.users.where('username').equals(username).first();
        if (exists) {
            showAlert('Error', 'Username already exists', 'error');
            return;
        }

        // Collect permissions
        let permissions = [];
        if (role === 'admin' || role === 'manager') {
            permissions = ['all'];
        } else {
            const checkboxes = document.querySelectorAll('input[name="modal-permission"]:checked');
            permissions = Array.from(checkboxes).map(cb => cb.value);
            
            if (permissions.length === 0) {
                showAlert('Warning', 'Please select at least one permission', 'warning');
                return;
            }
        }

        const newUser = {
            username,
            password,
            role,
            permissions,
            full_name,
            contact_number,
            email
        };

        await db.users.add(newUser);
        showAlert('Success', 'User created successfully');
        closeUserModal();
        renderUserList();
    } catch (err) {
        console.error("Error creating user:", err);
        showAlert('Error', 'Failed to create user', 'error');
    }
}

async function updatePassword(userId) {
    const passInput = document.getElementById(`new-password-${userId}`);
    const newPass = passInput.value;

    if (!newPass) {
        showAlert('Warning', 'Please enter a new password', 'warning');
        return;
    }

    try {
        await db.users.update(userId, { password: newPass });
        showAlert('Success', 'Password updated successfully');
        passInput.value = '';
    } catch (err) {
        console.error("Error updating password:", err);
        showAlert('Error', 'Failed to update password', 'error');
    }
}

async function savePermissions(userId) {
    const container = document.getElementById('user-details-container');
    const checkboxes = container.querySelectorAll('input[name="permission"]:checked');
    const permissions = Array.from(checkboxes).map(cb => cb.value);

    try {
        await db.users.update(userId, { permissions });
        showAlert('Success', 'Permissions saved successfully');
        
        // If current user is being updated, we might need to refresh their session
        if (currentUser && currentUser.id === userId) {
            const updated = await db.users.get(userId);
            sessionStorage.setItem('mm_user', JSON.stringify(updated));
            currentUser = updated;
            applyPermissions();
        }
    } catch (err) {
        console.error("Error saving permissions:", err);
        showAlert('Error', 'Failed to save permissions', 'error');
    }
}

async function deleteUser(userId) {
    const user = await db.users.get(userId);
    if (user.username === 'admin') {
        showAlert('Denied', 'Cannot delete the primary admin user', 'error');
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete user "${user.username}". This cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.users.delete(userId);
                showAlert('Deleted', 'User removed successfully');
                document.getElementById('user-details-container').innerHTML = `
        <div class="bg-white dark:bg-darkCard rounded-2xl shadow-sm border border-gray-200 dark:border-darkBorder mb-6 flex flex-col">
            <!-- Header section sticky for fluid page -->
            <div class="p-6 border-b border-gray-200 dark:border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-darkBg/50 sticky top-16 z-30 backdrop-blur-md">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <i class="fa-solid fa-user-gear text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Select a user to manage</h3>
                        <p class="text-sm text-gray-500">User has been deleted.</p>
                    </div>
                </div>
            </div>
        </div>
                `;
                renderUserList();
            } catch (err) {
                console.error("Error deleting user:", err);
                showAlert('Error', 'Failed to delete user', 'error');
            }
        }
    });
}

function toggleUserPasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function exportToHardcode() {
    try {
        const users = await db.users.toArray();
        const snippet = `const HARDCODED_USERS = ${JSON.stringify(users, null, 4)};`;
        
        Swal.fire({
            title: 'Hardcode Persistence Tool',
            html: `
                <div class="text-left space-y-4 pt-2">
                    <p class="text-[11px] text-gray-500 font-medium leading-relaxed">
                        To permanently save all users (including those created or edited recently):<br>
                        1. Copy the code snippet below.<br>
                        2. Tell <b>Antigravity</b>: "Use this snippet to update <b>auth.js</b>"
                    </p>
                    <textarea id="hardcode-snippet" readonly class="w-full h-64 p-4 font-mono text-[10px] bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 outline-none select-all custom-scrollbar">${snippet}</textarea>
                    <button onclick="copyHardcodeToClipboard()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                        <i class="fa-solid fa-code mr-2"></i> Copy Hardcoded Config
                    </button>
                    <div class="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                        <p class="text-[9px] text-amber-700 dark:text-amber-400 font-bold leading-tight flex items-start gap-2">
                            <i class="fa-solid fa-circle-info mt-0.5"></i>
                            Permanently hardcoded users remain even after a complete browser history reset.
                        </p>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            width: '600px'
        });
    } catch (err) {
        console.error("Export error:", err);
        showAlert('Error', 'Failed to generate snippet', 'error');
    }
}

window.copyHardcodeToClipboard = function() {
    const textarea = document.getElementById('hardcode-snippet');
    if (!textarea) return;
    textarea.select();
    document.execCommand('copy');
    showAlert('Copied!', 'Config snippet copied to clipboard', 'success');
};

async function editUserProfile(userId) {
    const user = await db.users.get(userId);
    if (!user) return;

    if (user.username === 'admin') {
        showAlert('Protected', 'The primary admin account username cannot be modified.', 'warning');
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: 'Edit User Profile',
        html: `
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                    <input id="swal-edit-fullname" class="swal2-input w-full m-0" value="${user.full_name || ''}" placeholder="Full Name">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Number</label>
                    <input id="swal-edit-phone" class="swal2-input w-full m-0" value="${user.contact_number || ''}" placeholder="Contact Number">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input id="swal-edit-email" class="swal2-input w-full m-0" value="${user.email || ''}" placeholder="Email Address">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                    <input id="swal-edit-username" class="swal2-input w-full m-0" value="${user.username}" placeholder="Username">
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                    <select id="swal-edit-role" class="swal2-select w-full m-0">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="cashier" ${user.role === 'cashier' ? 'selected' : ''}>Cashier</option>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        confirmButtonColor: '#0e3257',
        preConfirm: () => {
            const username = document.getElementById('swal-edit-username').value.trim();
            const role = document.getElementById('swal-edit-role').value;
            const full_name = document.getElementById('swal-edit-fullname').value.trim();
            const contact_number = document.getElementById('swal-edit-phone').value.trim();
            const email = document.getElementById('swal-edit-email').value.trim();
            if (!username) {
                Swal.showValidationMessage('Username is required');
                return false;
            }
            return { username, role, full_name, contact_number, email };
        }
    });

    if (formValues) {
        try {
            // Check for duplicate username (only if changed)
            if (formValues.username !== user.username) {
                const exists = await db.users.where('username').equals(formValues.username).first();
                if (exists) {
                    showAlert('Error', 'Username already taken by another user.', 'error');
                    return;
                }
            }

            // Update permissions based on role change
            const updateData = {
                username: formValues.username,
                role: formValues.role,
                full_name: formValues.full_name,
                contact_number: formValues.contact_number,
                email: formValues.email
            };

            if (formValues.role === 'admin' || formValues.role === 'manager') {
                updateData.permissions = ['all'];
            }

            await db.users.update(userId, updateData);
            showAlert('Success', 'User profile updated successfully.');

            // If current user was updated, refresh session
            if (currentUser && currentUser.id === userId) {
                const updated = await db.users.get(userId);
                sessionStorage.setItem('mm_user', JSON.stringify(updated));
                currentUser = updated;
                if (typeof applyPermissions === 'function') applyPermissions();
            }

            selectUser(userId);
            renderUserList();
        } catch (err) {
            console.error("Error updating user:", err);
            showAlert('Error', 'Failed to update user profile.', 'error');
        }
    }
}

// --- ACTIVITY LOGS UI ---

async function loadActivityLogs() {
    console.log("Loading Activity Logs View...");
    const container = document.getElementById('activity-logs-view');
    if (!container) return;

    try {
        const logs = await db.activity_log.reverse().limit(500).toArray(); // Get latest 500 logs
        const users = await db.users.toArray();
        const userMap = {};
        
        // Map users
        users.forEach(u => { userMap[u.id] = u.name || u.username || 'System'; });
        // Include HARDCODED_USERS just in case
        if (typeof HARDCODED_USERS !== 'undefined') {
            HARDCODED_USERS.forEach(u => { userMap[u.id] = u.name || u.username || 'System'; });
        }
        
        // Ensure "System" is mapped if user_id is 0 or undefined
        userMap[0] = 'System';

        const html = `
            <div class="space-y-6 animate-fade-in pb-10">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">System Activity Logs</h2>
                        <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Audit Trail & Security Monitoring</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="loadActivityLogs()" class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                            <i class="fa-solid fa-rotate-right"></i> Refresh
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-darkCard rounded-[2rem] border border-gray-100 dark:border-darkBorder shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th class="p-6 w-48">Timestamp</th>
                                    <th class="p-6 w-48">User / Operator</th>
                                    <th class="p-6">Action Details</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800/50">
                                ${logs.length === 0 ? '<tr><td colspan="3" class="p-12 text-center text-gray-400 font-bold italic uppercase tracking-widest text-[10px]">No activity logs found.</td></tr>' : 
                                    logs.map(log => {
                                        const date = new Date(log.date);
                                        const operator = userMap[log.user_id] || 'System User';
                                        
                                        // Color code actions
                                        let actionColor = 'text-gray-700 dark:text-gray-300';
                                        let icon = 'fa-circle-dot text-gray-400';
                                        
                                        const actLower = (log.action || '').toLowerCase();
                                        if (actLower.includes('delete') || actLower.includes('remove') || actLower.includes('void')) {
                                            actionColor = 'text-red-600 dark:text-red-400 font-medium';
                                            icon = 'fa-trash text-red-500';
                                        } else if (actLower.includes('login') || actLower.includes('auth')) {
                                            actionColor = 'text-blue-600 dark:text-blue-400 font-medium';
                                            icon = 'fa-right-to-bracket text-blue-500';
                                        } else if (actLower.includes('sale') || actLower.includes('invoice') || actLower.includes('payment')) {
                                            actionColor = 'text-emerald-600 dark:text-emerald-400 font-medium';
                                            icon = 'fa-money-bill-wave text-emerald-500';
                                        } else if (actLower.includes('update') || actLower.includes('edit')) {
                                            actionColor = 'text-amber-600 dark:text-amber-400 font-medium';
                                            icon = 'fa-pen text-amber-500';
                                        }

                                        return `
                                        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                            <td class="p-6">
                                                <div class="text-xs font-black text-gray-900 dark:text-white">${date.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                                                <div class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                                            </td>
                                            <td class="p-6">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 text-[10px]">
                                                        <i class="fa-solid fa-user"></i>
                                                    </div>
                                                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">${operator}</span>
                                                </div>
                                            </td>
                                            <td class="p-6">
                                                <div class="flex items-center gap-3">
                                                    <i class="fa-solid ${icon} text-[10px] opacity-70"></i>
                                                    <span class="text-sm ${actionColor}">${log.action}</span>
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
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        console.error("Error loading activity logs:", error);
        container.innerHTML = `<div class="p-8 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200">Failed to load activity logs: ${error.message}</div>`;
    }
}
