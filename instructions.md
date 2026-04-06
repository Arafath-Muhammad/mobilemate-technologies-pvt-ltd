# Business & Technical Requirements Document: MobileMate POS System

## 1. Project Overview
**Company Name:** MobileMate Technologies
**Business Model:** Wholesale & Retail (B2B & B2C) of Computer and Mobile Accessories.
**Platform:** Web-based POS System with Offline Capability and WooCommerce Integration.

---

## 3. Business Requirements & Modules

### A. Dashboard (The Nerve Center)
- Real-time summaries: Daily Sales, Monthly Profit, Low Stock Alerts.
- Quick action buttons for New Invoice and New Purchase.
- Sales charts (Weekly/Monthly).

### B. Inventory & Product Management
- **Product Registry:** Name, SKU, Category, Cost Price, Retail Price, Wholesale Price.
- **Serial Number Tracking:** Crucial for warranty (Barcode/QR integration).
- **Stock Levels:** Auto-update on sales/purchases.
- **Categories & Vendors:** Manage supplier lists and product groupings.

### C. POS Terminal (Sales)
- **Switchable Modes:** Retail/Wholesale pricing toggle.
- **Search:** Search by name or scan Barcode/QR code.
- **Cart Management:** Discounts, line items, and multi-payment options (Cash/Card/Bank Transfer).
- **Warranty/RMA:** Auto-generate warranty period based on product serial.

### D. Purchase & Vendor Management
- **Purchase Orders (PO):** Create and track orders sent to vendors.
- **Stock In:** Automatically update inventory when a PO is marked as 'Received'.
- **Banking Details:** Store vendor bank info for easy transfers.

### E. Sales & Documents
- **Quotations:** Create professional quotes; convert to Sales Order/Invoice with one click.
- **Sales Orders:** Track pending orders.
- **Delivery Notes:** Generate packing slips without pricing for delivery.
- **Templates:** Fully editable HTML/CSS templates for Invoices, Quotations, and POs.
- **Re-printing:** Ability to search old records and re-print any document.

### F. Returns & RMA (Crucial for Tech Gear)
- **Returns:** Customer returns with stock adjustment.
- **RMA Note:** Record serial numbers for faulty items sent back to vendors.

### G. Finance & Expenses
- **Expense Tracker:** Log shop rent, electricity, staff costs, etc.
- **Commission:** Calculate sales commission if you have staff.
- **No Tax:** System should skip tax calculations as per requirement.

### H. WooCommerce Integration
- Sync product stock levels between the local POS and the WordPress store.
- Fetch online orders into the POS "Sales Order" section.

---

## 4. Specific Instructions for Developer

1.  **Invoice Template:** Create a dedicated settings page where the user can upload a `.png/.jpg` logo and edit the shop header/footer text.
2.  **Product Search:** Implement a fast search bar that filters products by Name, SKU, or Category as the user types.
3.  **UI/UX:** Use a clean, dark/light mode compatible interface using Tailwind. Prioritize a 'Touch Friendly' design for mobile/tablet use.
4.  **Security:** Store API keys securely (Environment variables or encrypted local storage). Do not hardcode credentials in the JS file.

---

## 5. Development Roadmap (Phases)
* **Phase 1:** UI Design & Dexie.js local database setup.
* **Phase 2:** WooCommerce API connection & Product sync.
* **Phase 3:** Cart logic & Invoice generation module.
* **Phase 4:** Reporting dashboard & Final testing.

---

## 6. Recommended Future Enhancements (Consolidated Features)

### A. Advanced Inventory & CRM
- **Low Stock Automation:** Automatically generate 'Suggested Purchase Orders' and send alerts when stock hits the minimum threshold across all product lines.
- **Loyalty System:** Implement a customer points/rewards program for repeat business, trackable within the Customer Profile.

### B. Advanced Security & Auditing
- **Activity Logs UI:** Expose the existing backend activity logger to Admins/Managers to track unauthorized changes, deleted invoices, and login history.
- **Session Control:** Implement auto-logout after a configurable period of inactivity to secure the POS terminal.

### C. Advanced Reports & Insights
- **Best Sellers & Dead Stock:** Dedicated reports identifying top-selling items and items not moving (30+ days) to optimize purchasing.
- **Cash Flow Statement:** Provide a clear view of cash moving in and out, enhancing existing profit dashboards.