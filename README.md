# BillCraft - Professional Business Invoice Generator

A complete, responsive, and professional business invoice generation web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Designed specifically to match the luxury dark charcoal and white physical invoice layout:
- **Dark Charcoal theme** (`#252525`) with crisp thin white table borders and white typography
- **Classic White theme** option for standard black-and-white printing
- **Top-right business identity block** (Proprietor name, phone, PAN, optional Aadhaar, address)
- **Structured customer box** on the left with **Bill No.** and **Date** on the right
- **Itemized product table** with `No.`, `QTY`, `PARTICULAR`, `RATE`, and `AMOUNT`
- **Lined blank row padding** (filling rows 3 through 9 to match physical pre-printed bill sheets)
- **Accurate Indian GST calculations** (Subtotal, Discount, Shipping, CGST/SGST vs IGST, Round-off, Grand Total, and Amount in Words)
- **Calligraphic footer**: *"Thank you for your business"*
- **Full PDF generation** using `jsPDF` and `html2canvas` at 300 DPI high resolution
- **Browser printing** with custom print stylesheet
- **LocalStorage persistence** with JSON export/import and CSV reporting

---

## Quick Start

### 1. Development Server
The development server runs locally:
```bash
npm run dev
```
Open [http://localhost:5177/](http://localhost:5177/) in your browser.

### 2. Run Financial Calculation Tests
```bash
npx vitest run
```

### 3. Build for Production
```bash
npm run build
```

---

## Features & Modules

1. **Dashboard**:
   - Total Invoices, Total Sales (₹), Paid Amount, and Pending Balance.
   - Filterable list of recent invoices with quick action status toggles.
   - Quick navigation shortcuts.

2. **Invoice Editor & Live Split Preview**:
   - Side-by-side editing on desktop, with responsive toggle for mobile/tablet.
   - Customer autofill from saved customer directory.
   - Catalog item dropdown to auto-fill particulars, rate, and tax.
   - Tax mode options: Non-GST (0%), GST Exclusive, and GST Inclusive.
   - CGST/SGST vs IGST toggle for intra-state vs inter-state transactions.
   - Discount (% or fixed ₹) and shipping charges.
   - Real-time Indian Rupee words generation (e.g., *"Rupees Thirty-Three Thousand Three Hundred Sixty Only"*).
   - "Pad blank rows" toggle to fill empty rows like traditional invoices.

3. **Customer Management**:
   - Add, edit, search, and delete customers.
   - Fields: Name, Contact Person, Phone, Email, Billing Address, GSTIN, Notes, State.
   - Real-time metrics: Orders placed and pending balance per customer.

4. **Product Catalog**:
   - Add, edit, search, and delete products.
   - Fields: Product Name, SKU, Description, Unit Price, Tax Rate, UOM (PCS, SET, BOX, KG, etc.), and Stock.

5. **Business Profile & Backup**:
   - Manage business entity name, owner, mobile, PAN, GSTIN, and formatted address lines.
   - Optional Aadhaar field (disabled by default for privacy).
   - Company logo and signature upload.
   - Bank details (Bank, A/C No, IFSC, Branch) and UPI ID.
   - Offline-first LocalStorage with full JSON Backup & Restore.
   - Reset to initial reference demo data or clear all data.
   - CSV export for accounting and spreadsheet reporting.

---

## Deployment with Coolify / Docker

### 1. Installing Coolify on your VPS (Ubuntu / Debian)
On your remote Linux server (run as `root` via SSH):
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Once installed, open `http://<your-server-ip>:8000` to set up your Coolify dashboard.

### 2. Deploying this Invoice Generator to Coolify
1. Push this repository to GitHub / GitLab.
2. In Coolify, click **+ Add Resource** -> **Public/Private Repository**.
3. Select this repository.
4. Choose **Dockerfile** as the build pack (a production multi-stage [`Dockerfile`](./Dockerfile) and [`nginx.conf`](./nginx.conf) are provided).
5. Click **Deploy**. Your professional invoice suite will be live with automatic SSL!

### 3. Running with Docker locally
```bash
docker build -t billcraft-invoice .
docker run -p 8080:80 billcraft-invoice
```
Visit `http://localhost:8080`.
