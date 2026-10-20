/**
 * MobileMate Google Drive Backup Integration
 * Handles OAuth2 authentication and multipart file upload to Google Drive.
 */

// Cloud Console Credentials (Configured by User)
const CLIENT_ID = '392660574460-uqvd63ee9b0kse41rnvv3jidj8nk0bap.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDNEbA4tuzAk604j50eHltWw364Yoc4JSc';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let gapiInited = false;
let gisInited = false;
let tokenClient;

// Google API ලෝඩ් වුණාම මේක True වෙනවා
function gapiLoaded() {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
            gapiInited = true;
            console.log('GAPI initialized successfully');
        } catch (err) {
            console.error('GAPI Init Error:', err);
        }
    });
}

// Google Identity Services ලෝඩ් වුණාම මේක True වෙනවා
function gisLoaded() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', 
        });
        gisInited = true;
        console.log('GIS initialized successfully');
    } catch (err) {
        console.error('GIS Init Error:', err);
    }
}

// බොත්තම එබුවහම රන් වන කොටස
function handleBackupClick() {
    // වැදගත්ම හරිය: Scripts දෙකම ලෝඩ් වෙනකන් Check කරනවා
    if (!gapiInited || !gisInited) {
        alert('Google Services තවම ලෝඩ් වෙනවා... කරුණාකර තත්පර කිහිපයකින් නැවත උත්සාහ කරන්න.');
        return; // සර්විස් ලෝඩ් නැත්නම් මෙතනින් එහාට කෝඩ් එක රන් වෙන්නේ නැහැ
    }

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        await uploadERPBackupToDrive();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        uploadERPBackupToDrive();
    }
}

// Compatibility with old name
function handleGoogleDriveBackup() {
    handleBackupClick();
}

/**
 * Collects database data and uploads to Google Drive
 */
async function uploadERPBackupToDrive() {
    try {
        // Show detailed progress using SweetAlert2
        Swal.fire({
            title: 'Cloud Backup Sync',
            html: `
                <div class="text-left space-y-3">
                    <div class="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <i class="fa-brands fa-google-drive text-primary text-xl"></i>
                        <div>
                            <p class="text-sm font-bold">Securely connected to Drive</p>
                            <p class="text-[10px] text-gray-400">Authorized: drive.file scope</p>
                        </div>
                    </div>
                    <div class="space-y-2 mt-4">
                        <div class="flex justify-between text-[11px] font-bold text-gray-500">
                            <span>Processing Database</span>
                            <span id="backup-perc">0%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div id="backup-bar" class="bg-primary h-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                    <p id="backup-status" class="text-[10px] text-center text-gray-400 font-mono mt-4 italic italic">Initializing...</p>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                updateBackupUI(10, 'Compiling table data...');
            }
        });

        // 1. Export Data from Dexie
        const data = {};
        const tables = db.tables;
        let tableCount = 0;
        
        for (const table of tables) {
            data[table.name] = await table.toArray();
            tableCount++;
            const perc = 10 + Math.floor((tableCount / tables.length) * 50);
            updateBackupUI(perc, `Packing ${table.name}...`);
        }

        const backupData = {
            app: 'MobileMate POS',
            version: db.verno,
            timestamp: new Date().toISOString(),
            data: data
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        updateBackupUI(70, 'Encrypting payload...');

        // 2. Prepare Google Drive Metadata
        const metadata = {
            'name': `MobileMate_POS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
            'mimeType': 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        updateBackupUI(85, 'Uploading to Cloud...');

        // 3. POST to Google Drive Upload API
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
            body: form
        });

        const result = await response.json();
        
        if (result.id) {
            updateBackupUI(100, 'Sync Completed!');
            setTimeout(() => {
                Swal.fire({
                    title: 'Backup Successful',
                    text: 'Your database has been safely synchronized to your Google Drive.',
                    icon: 'success',
                    confirmButtonText: 'Great!',
                    confirmButtonColor: '#0e3257'
                });
                // Update last sync date in localStorage
                localStorage.setItem('last_google_sync', new Date().toLocaleString());
                if (typeof loadSettings === 'function') loadSettings(); // Refresh settings view if open
            }, 800);
        } else {
            const msg = result.error ? result.error.message : 'Unknown Drive error';
            console.error('Google Drive upload failed:', msg);
            if (typeof showAlert === 'function') showAlert('Backup Failed', 'Could not upload data: ' + msg, 'error');
            throw new Error(msg);
        }

    } catch (error) {
        console.error('Google Drive Backup Error:', error);
        Swal.fire({
            title: 'Backup Failed',
            text: 'Could not upload data: ' + error.message,
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    }
}

/**
 * Helper to update the Swal progress bar
 */
function updateBackupUI(percentage, status) {
    const bar = document.getElementById('backup-bar');
    const percText = document.getElementById('backup-perc');
    const statusText = document.getElementById('backup-status');
    
    if (bar) bar.style.width = percentage + '%';
    if (percText) percText.textContent = percentage + '%';
    if (statusText) statusText.textContent = status;
}
