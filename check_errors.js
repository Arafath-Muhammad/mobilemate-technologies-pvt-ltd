const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const errors = [];
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push('Console error: ' + msg.text());
        }
    });

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Let's type an admin password to login if there is a login modal
        // But MobileMate auto logins if there's no auth, or cashier loads POS
        
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
                await new Promise(r => setTimeout(r, 1000));
            } catch(e) {}
        }
        
        console.log(JSON.stringify(errors, null, 2));
    } catch (e) {
        console.error("Navigation error:", e);
    } finally {
        await browser.close();
    }
})();
