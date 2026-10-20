// Backup Alarms and Reminders logic
let alarmInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check every hour for backup needs
    checkBackupAlarms();
    checkCustomerReminders();
    setInterval(() => {
        checkBackupAlarms();
        checkCustomerReminders();
    }, 3600000); // Check once per hour
});

async function checkBackupAlarms() {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().split('T')[0];
    
    const lastExport = localStorage.getItem('last_export_date');
    const lastImport = localStorage.getItem('last_import_date');

    // 1. Next Day Import Reminder (Morning: 6 AM to 11 AM)
    if (currentHour >= 6 && currentHour < 11) {
        if (lastImport !== today) {
            showBackupAlarm('import');
        }
    }

    // 2. End of Day Export Reminder (Evening: 4 PM to 11 PM)
    if (currentHour >= 16 && currentHour <= 23) {
        if (lastExport !== today) {
            showBackupAlarm('export');
        }
    }
}

function showBackupAlarm(type) {
    const isExport = type === 'export';
    const title = isExport ? '🚨 Daily Backup Required!' : '📥 Morning Import Required!';
    const text = isExport 
        ? 'It is the end of the day. Please export your data to avoid loss.' 
        : 'It is a new day! Please import the latest backup if required to sync and start fresh.';
    const confirmText = isExport ? 'Export Data Now' : 'Go to Settings';
    
    if (typeof Swal === 'undefined') return;

    // Play alarm sound
    const audio = document.getElementById('alarm-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.warn('Audio play failed:', e));
    }

    Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showCancelButton: true,
        confirmButtonColor: isExport ? '#01a5a5' : '#4f46e5',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: 'Remind Me Later',
        showClass: {
            popup: 'animate__animated animate__headShake' // Eye-catching animation
        },
        timer: 30000, // Show for 30 seconds
        timerProgressBar: true
    }).then((result) => {
        if (audio) audio.pause(); // Stop sound on action
        if (result.isConfirmed) {
            if (isExport) {
                // Call export from settings (need to ensure exportData is global or accessible)
                if (typeof exportData === 'function') {
                    exportData();
                } else {
                    // Fallback to navigate to settings
                    const settingsBtn = document.querySelector('[data-target="settings-view"]');
                    if (settingsBtn) settingsBtn.click();
                    showAlert('Tip', 'Find the Export button in Database & Backups section.', 'info');
                }
            } else {
                // Navigate to settings for import
                const settingsBtn = document.querySelector('[data-target="settings-view"]');
                if (settingsBtn) settingsBtn.click();
                showAlert('Tip', 'Find the Import button in Database & Backups section.', 'info');
            }
        }
    });
}

// ---------------------------------------------------------------------
// Customer Resale Reminders Auto-Check
// ---------------------------------------------------------------------
async function checkCustomerReminders() {
    try {
        if (!db.customer_reminders) return;
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Find reminders that are due today or earlier and still pending
        const dueReminders = await db.customer_reminders
            .where('status')
            .equals('pending')
            .filter(r => r.reminder_date && r.reminder_date < startOfDay)
            .toArray();

        if (dueReminders.length > 0 && typeof Swal !== 'undefined') {
            // Pick the first one for the alert to avoid spamming alerts
            const reminder = dueReminders[0];
            const customerText = reminder.customer_name + (reminder.customer_phone ? ` (${reminder.customer_phone})` : '');
            
            Swal.fire({
                title: '🛒 Customer Repurchase Reminder',
                html: `Customer <strong>${customerText}</strong> is due to renew or repurchase:<br><br><span class="text-primary font-bold">${reminder.item_name}</span>`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Mark as Handled',
                cancelButtonText: 'Remind Me Later',
                confirmButtonColor: '#10B981',
                toast: true,
                position: 'bottom-end',
                timer: null
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await db.customer_reminders.update(reminder.id, { status: 'handled' });
                    // Trigger check again in case there are more
                    checkCustomerReminders();
                }
            });
        }
    } catch (err) {
        console.error('Error checking customer reminders:', err);
    }
}

