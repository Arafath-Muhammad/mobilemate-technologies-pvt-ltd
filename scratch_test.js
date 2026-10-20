const fs = require('fs');

// Verify that the replacement HTML structures for purchases.js and sales.js compile cleanly
console.log("Testing syntax and template string parsing...");

const themeColor = '#00A9AB';
const storeName = "MobileMate Tech Hub";
const headerFontSize = "22px";
const enabledStoreSubheading = true;
const storeSubheading = "YOUR TRUSTED TECH GADGETS PROVIDER";
const enabledStoreAddress = true;
const storeAddress = "No 123, Galle Road, Colombo 03";
const storePhone = "+94775165589";
const storeEmail = "info@mobilemate.lk";
const storeWebsite = "www.mobilemate.lk";
const storeBR = "PV-12345";
const storeLogo = "";
const id = 101;
const po = {
    date: new Date().toISOString(),
    vendor_name: "Supplier Lanka",
    payment_type: "credit",
    status: "approved",
    ship_to: "main",
    total: 120000,
    notes: "Special delivery instructions"
};
const vendor = { contact_person: "Mr. Perera", phone: "0771234567", email: "perera@supplier.lk" };
const invoiceFooter = "Thank you for your business!";
const receiptFooterInfo = "12 Months Warranty for all electronic items.";

const MAX_ITEMS_PER_PAGE = 6;
const items = [
    { name: "Item 1", sku: "SKU1", qty: 2, cost: 10000 },
    { name: "Item 2", sku: "SKU2", qty: 1, cost: 20000 },
    { name: "Item 3", sku: "SKU3", qty: 4, cost: 5000 },
    { name: "Item 4", sku: "SKU4", qty: 3, cost: 10000 },
    { name: "Item 5", sku: "SKU5", qty: 2, cost: 15000 },
    { name: "Item 6", sku: "SKU6", qty: 5, cost: 4000 },
    { name: "Item 7", sku: "SKU7", qty: 1, cost: 10000 },
    { name: "Item 8", sku: "SKU8", qty: 2, cost: 5000 }
];

const pagesData = [];
for (let i = 0; i < items.length; i += MAX_ITEMS_PER_PAGE) {
    pagesData.push(items.slice(i, i + MAX_ITEMS_PER_PAGE));
}
const totalPages = pagesData.length;

const pagesHtml = pagesData.map((pageItems, pageIndex) => {
    const chunkRows = pageItems.map((item, relIdx) => {
        const idx = (pageIndex * MAX_ITEMS_PER_PAGE) + relIdx;
        return `
            <tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid;">
                <td align="center" style="padding: 10px 8px; font-size:12px; color: #6b7280;">${idx + 1}</td>
                <td align="left" style="padding: 10px 8px; font-size:13px;">
                    <div style="font-weight: 900; color: #111827; text-transform: uppercase;">${item.name}</div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px; font-family: monospace;">${item.sku}</div>
                </td>
                <td align="center" style="padding: 10px 8px; font-size:12px; font-weight: bold;">${item.qty}</td>
                <td align="right" style="padding: 10px 8px; font-size: 12px; color: #6b7280;">Rs. ${(parseFloat(item.cost) || 0).toLocaleString()}</td>
                <td align="right" style="padding: 10px 8px; font-size: 13px; font-weight: 900; color: #111827;">Rs. ${(parseFloat(item.qty * item.cost) || 0).toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="page" style="${pageIndex > 0 ? 'page-break-before: always; break-before: page;' : ''}">
            <table>
                <thead>
                    <tr>
                        <th colspan="5" style="font-weight:normal; text-align:left; border:none; padding:0; margin:0;">
                            <!-- HEADER -->
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; padding-bottom: 15px; margin-bottom: 8px;">
                                <div style="display:flex; align-items:center; gap: 18px;">
                                    ${storeLogo ? `<img src="${storeLogo}" style="max-height: 70px; max-width: 110px; object-fit: contain;">` : ''}
                                    <div>
                                        <h1 style="margin:0; font-size:${headerFontSize}; font-weight:900; color:${themeColor}; text-transform:uppercase;">${storeName}</h1>
                                        ${enabledStoreSubheading && storeSubheading ? `<p style="margin:2px 0; font-size:11px; color:#111827; font-weight: bold; text-transform:uppercase;">${storeSubheading}</p>` : ''}
                                        ${enabledStoreAddress && storeAddress ? `<p style="margin:2px 0; font-size:10px; color:#4b5563; font-weight: 500;">${storeAddress.split('\n').join(' | ')}</p>` : ''}
                                        <div style="font-size:10px; color:#4b5563; margin-top: 4px; white-space: nowrap;">
                                            ${storePhone ? `+${storePhone.replace('+', '')}` : ''} | ${storeEmail} | ${storeWebsite} | BR: ${storeBR}
                                        </div>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <h2 style="margin:0; font-size:26px; font-weight:900; color:#111827; letter-spacing:1px;">PURCHASE ORDER</h2>
                                    <div style="margin-top: 8px; font-size: 13px; color: #111827;">
                                        <p style="margin:2px 0;"><b>Doc No:</b> PO-${String(id).padStart(5, '0')}</p>
                                        <p style="margin:2px 0;"><b>Date:</b> ${new Date(po.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div style="border-top: 1px solid #eee; margin-top: 4px; margin-bottom: 8px;"></div>

                            <!-- INFO SECTION -->
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                                <div style="width: 55%; background:#f9fafb; padding:15px; border-radius:4px;">
                                    <h3 style="margin-top:0; font-size:10px; color:${themeColor}; text-transform:uppercase; letter-spacing:1px; font-weight:900; margin-bottom: 6px;">VENDOR / SUPPLIER:</h3>
                                    <p style="margin:0; font-size:16px; font-weight:900; color:#111827; text-transform: uppercase;">${po.vendor_name}</p>
                                    ${vendor ? `
                                    <div style="margin-top:6px; font-size:11px; color:#4b5563; line-height: 1.4;">
                                        ${vendor.contact_person ? `<b>Contact Person:</b> ${vendor.contact_person}<br>` : ''}
                                        ${vendor.phone ? `<b>Tel:</b> ${vendor.phone}<br>` : ''}
                                        ${vendor.email ? `<b>Email:</b> ${vendor.email}` : ''}
                                    </div>` : ''}
                                </div>
                                <div style="width: 40%; text-align: right; padding-top: 4px;">
                                    <p style="font-size: 10px; color: ${themeColor}; font-weight: 900; text-transform: uppercase; margin-bottom: 6px;">ORDER DETAILS:</p>
                                    <p style="margin:3px 0; font-size:12px; color:#111827;"><b>Payment Terms:</b> ${po.payment_type ? po.payment_type.toUpperCase() : 'N/A'}</p>
                                    <p style="margin:3px 0; font-size:12px; color:#111827;"><b>Status:</b> ${po.status.toUpperCase()}</p>
                                    ${po.ship_to ? `<p style="margin:3px 0; font-size:12px; color:#111827;"><b>Ship to:</b> ${po.ship_to.toUpperCase()}</p>` : ''}
                                    <p class="page-number" style="margin:4px 0; font-size:12px; font-weight: bold; color: #111827;">Page ${pageIndex + 1} of ${totalPages}</p>
                                </div>
                            </div>
                        </th>
                    </tr>
                    <tr style="background: ${themeColor}; color: #fff; -webkit-print-color-adjust: exact;">
                        <th align="center" width="5%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">#</th>
                        <th align="left" width="50%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Item Description</th>
                        <th align="center" width="10%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Qty</th>
                        <th align="right" width="15%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Unit Cost</th>
                        <th align="right" width="20%" style="padding:10px; font-size:12px; font-weight: 900; border:none;">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${chunkRows}
                    ${po.notes && pageIndex === totalPages - 1 ? `
                    <tr>
                        <td colspan="5" style="border:none;">
                            <div style="margin:10px 0; background:#fffbeb; padding:12px; border-radius:8px; border:1px solid #fef3c7;">
                                <h3 style="margin-top:0; color:#d97706; font-size:10px; text-transform:uppercase; letter-spacing:1px; font-weight: 900;">Notes:</h3>
                                <p style="margin:0; font-size:12px; color:#92400e;">${po.notes}</p>
                            </div>
                        </td>
                    </tr>` : ''}
                </tbody>
            </table>

            <!-- FOOTER MUST BE ON EVERY PAGE -->
            <div class="print-footer">
                <div style="display:flex; justify-content:flex-end; margin-bottom: 12px;">
                    <div style="width: 45%;">
                        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:15px; font-weight: 900; color:#4b5563; text-transform: uppercase;">
                            <span>Grand Valuation</span>
                            <span style="color: ${themeColor};">Rs. ${(parseFloat(po.total) || 0).toLocaleString()}</span>
                        </div>
                        <div style="border-top: 3px solid ${themeColor}; margin-top: 4px;"></div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 10px;">
                    ${['PREPARED BY', 'AUTHORIZED BY', 'SUPPLIER APPROVAL', 'STORE KEEPER', 'NIC NUMBER'].map(label => `
                        <div style="text-align: center;">
                            <div style="border-bottom: 1px solid #d1d5db; height: 30px; margin-bottom: 6px;"></div>
                            <p style="margin: 0; font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
                        </div>
                    `).join('')}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #eee; padding-top: 6px; margin-bottom: 6px;">
                    <div style="font-size:9px; color:#9ca3af; font-weight: bold;">PURCHASE ORDER | PO-${String(id).padStart(5, '0')} | Page ${pageIndex + 1} of ${totalPages}</div>
                </div>
                <div style="text-align: center; padding-top: 2px;">
                    <h3 style="margin:0; font-size:11px; font-weight:900; color:#111827; text-transform:uppercase; letter-spacing:1px;">${invoiceFooter.toUpperCase()}</h3>
                    ${receiptFooterInfo ? `<p style="margin:4px 0; font-size:8px; color:#6b7280; line-height: 1.3; max-width: 90%; margin-left: auto; margin-right: auto;">${receiptFooterInfo}</p>` : ''}
                    <div style="margin-top: 4px; font-size:8px; color:#9ca3af;">
                        Contact: +94 77 51 65 589 | info@mobilemate.lk | www.mobilemate.lk
                    </div>
                    <div style="margin-top: 3px; font-size:8px; color:#111827; font-weight:bold;">
                        Powered by INFINITY CREATIVE WORKS
                    </div>
                </div>
            </div>
        </div>
    `;
}).join('');

console.log("pagesHtml generated length:", pagesHtml.length);
fs.writeFileSync('scratch_out.txt', 'Render test succeeded! Total pages: ' + totalPages);
