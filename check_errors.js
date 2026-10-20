const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));
    const launchOptions = { headless: true };
    if (chromePath) launchOptions.executablePath = chromePath;
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const errors = [];
    
    page.on('console', msg => {
        console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
        if (msg.type() === 'error') {
            errors.push('Console error: ' + msg.text());
        }
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
        
        // Wait for page to load and login overlay to show
        await new Promise(r => setTimeout(r, 1500));
        
        // Log in as admin
        await page.type('#login-username', 'admin');
        await page.type('#login-password', 'Arafath97Aysha01Afran25');
        await page.click('button[type="submit"]');
        
        // Wait for login to process and dashboard to load
        await new Promise(r => setTimeout(r, 3000));

        const dashboardHtml = await page.evaluate(() => {
            const el = document.getElementById('dashboard-view');
            return el ? el.innerHTML : 'No dashboard element';
        });
        console.log("=== DASHBOARD HTML ===");
        console.log(dashboardHtml);
        console.log("======================");

        // Let's try clicking some nav buttons
        const navSelectors = [
            '[data-target="dashboard-view"]',
            '[data-target="pos-view"]',
            '[data-target="products-view"]',
            '[data-target="sales-view"]',
            '[data-target="customers-view"]'
        ];
        
        for (let sel of navSelectors) {
            try {
                await page.click(sel);
                await new Promise(r => setTimeout(r, 1500));
            } catch(e) {}
        }
        
        console.log(JSON.stringify(errors, null, 2));
    } catch (e) {
        console.error("Navigation error:", e);
    } finally {
        await browser.close();
    }
})();
