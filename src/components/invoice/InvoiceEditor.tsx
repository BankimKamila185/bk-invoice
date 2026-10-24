import React, { useState, useEffect } from 'react';
import {
  Invoice,
  InvoiceItem,
  PaymentStatus,
  TaxMode,
  InvoiceTheme,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateInvoiceTotals, formatINR } from '../../utils/calculations';
import { InvoicePreview } from './InvoicePreview';
import { downloadInvoicePDF, printInvoice } from '../../utils/pdfGenerator';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  Save,
  Copy,
  ArrowLeft,
  Eye,
  FileEdit,
  Sparkles,
  CheckCircle2,
  Moon,
  Sun,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface InvoiceEditorProps {
  initialInvoiceId?: string | null;
  onClose?: () => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoiceId,
  onClose,
}) => {
  const {
    businessProfile,
    customers,
    products,
    invoices,
    saveInvoice,
    duplicateInvoice,
    getNextInvoiceNumber,
    showToast,
    setActiveTab,
  } = useApp();

  // Find existing invoice or initialize fresh one
  const existingInvoice = initialInvoiceId
    ? invoices.find((inv) => inv.id === initialInvoiceId)
    : null;

  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (existingInvoice) return existingInvoice;

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    return {
      id: `inv-${Date.now()}`,
      invoiceNumber: getNextInvoiceNumber(),
      invoiceDate: today,
      dueDate: dueDate,
      referenceNumber: '',
      status: 'Draft',
      business: businessProfile,
      customer: {
        name: '',
        billingAddress: '',
        gstin: '',
        phone: '',
      },
      items: [
        {
          id: `item-${Date.now()}-1`,
          particular: 'Metal Diya',
          quantity: 360,
          rate: 68.0,
          amount: 24480.0,
        },
      ],
      padBlankRows: true,
      minRows: 9,
      theme: 'charcoal',
      showLogo: true,
      taxMode: 'NONE',
      taxRate: 0,
      isInterState: false,
      discountType: 'percentage',
      discountValue: 0,
      shippingCharges: 0,
      amountPaid: 0,
      notes: 'Thank you for your prompt business.',
      terms: 'Payment due on receipt.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'split'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'editor';
    }
    return 'split';
  });
  const [isExporting, setIsExporting] = useState(false);
  const totals = calculateInvoiceTotals(invoice);

  // Sync business profile changes if new invoice
  useEffect(() => {
    if (!existingInvoice) {
      setInvoice((prev) => ({
        ...prev,
        business: businessProfile,
      }));
    }
  }, [businessProfile, existingInvoice]);

  // Customer autofill
  const handleSelectCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    setInvoice((prev) => ({
      ...prev,
      customer: {
        id: cust.id,
        name: cust.name,
        billingAddress: cust.billingAddress,
        gstin: cust.gstin || '',
        phone: cust.phone || '',
        email: cust.email || '',
      },
      // Check inter-state automatically if states differ
      isInterState: Boolean(cust.state && cust.state.toLowerCase() !== 'maharashtra'),
    }));
  };

  // Product autofill in item row
  const handleSelectProduct = (itemId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const qty = item.quantity || 1;
          return {
            ...item,
            productId: prod.id,
            particular: prod.name,
            rate: prod.unitPrice,
            amount: Number((qty * prod.unitPrice).toFixed(2)),
          };
        }
        return item;
      }),
    }));
  };

  // Item row operations
  const handleItemChange = (
    itemId: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
            const rate = field === 'rate' ? Number(value) || 0 : item.rate;
            updated.amount = Number((qty * rate).toFixed(2));
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${invoice.items.length + 1}`,
      particular: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    if (invoice.items.length <= 1) {
      showToast('Invoice must have at least one line item', 'info');
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  // Save handler
  const handleSave = (status?: PaymentStatus) => {
    if (!invoice.customer.name.trim()) {
      showToast('Please enter customer or company name', 'error');
      return;
    }
    if (!invoice.invoiceNumber.trim()) {
      showToast('Please specify an invoice number', 'error');
      return;
    }

    const toSave: Invoice = {
      ...invoice,
      status: status || invoice.status,
    };

    saveInvoice(toSave);
    if (onClose) onClose();
    else setActiveTab('invoices');
  };

  // PDF Export handler
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    const targetId =
      activeView === 'editor'
        ? 'invoice-editor-offscreen-preview'
        : 'invoice-preview-container';
    const success = await downloadInvoicePDF(targetId, {
      fileName: `Invoice_${invoice.invoiceNumber || 'Draft'}.pdf`,
      theme: invoice.theme,
    });
    setIsExporting(false);
    if (success) {
      showToast('PDF downloaded successfully!');
    } else {
      showToast('Failed to generate PDF. Please try again or use Print.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (onClose ? onClose() : setActiveTab('invoices'))}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{existingInvoice ? `Edit Invoice #${invoice.invoiceNumber}` : 'Create New Invoice'}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : invoice.status === 'Unpaid'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-700/40 text-zinc-300 border border-zinc-700'
                }`}
              >
                {invoice.status}
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Live interactive editor with direct print & PDF generation
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle (Mobile / Tablet / Desktop) */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveView('editor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeView === 'editor' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`hidden lg:flex px-3 py-1.5 text-xs font-medium rounded-md transition-colors items-center gap-1.5 ${
                activeView === 'split' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeView === 'preview' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Theme Quick Switcher */}
          <button
            onClick={() =>
              setInvoice((prev) => ({
                ...prev,
                theme: prev.theme === 'charcoal' ? 'white' : 'charcoal',
              }))
            }
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
            title="Toggle Charcoal Dark / Classic White Theme"
          >
            {invoice.theme === 'charcoal' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Charcoal Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Classic White</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            onClick={() => {
              const targetId =
                activeView === 'editor'
                  ? 'invoice-editor-offscreen-preview'
                  : 'invoice-preview-container';
              printInvoice(targetId);
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating...' : 'PDF'}</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={() => handleSave('Draft')}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          {/* Finalize Button */}
          <button
            onClick={() => handleSave('Unpaid')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalize</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`grid gap-6 ${
          activeView === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* LEFT / FORM EDITOR */}
        {(activeView === 'editor' || activeView === 'split') && (
          <div
            className={`no-print space-y-6 ${
              activeView === 'split' ? 'lg:col-span-6' : 'max-w-4xl mx-auto w-full'
            }`}
          >
            {/* 1. Meta / Invoice Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2">
                1. Invoice Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Invoice / Bill No. *
                  </label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 003"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={invoice.invoiceDate}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, invoiceDate: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={invoice.status}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        status: e.target.value as PaymentStatus,
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Reference / PO Number
                  </label>
                  <input
                    type="text"
                    value={invoice.referenceNumber || ''}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, referenceNumber: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. PO-2026-001"
                  />
                </div>
              </div>
            </div>

            {/* 2. Customer Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  2. Billed To (Customer Details)
                </h2>
                {customers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Autofill:</span>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      defaultValue=""
                      className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="" disabled>
                        Choose saved customer...
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    value={invoice.customer.name}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, name: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. SAMBHAV ARTS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={invoice.customer.gstin || ''}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, gstin: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="e.g. 27AEDPJ0238G1ZV"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={invoice.customer.billingAddress}
                  onChange={(e) =>
                    setInvoice((prev) => ({
                      ...prev,
                      customer: { ...prev.customer, billingAddress: e.target.value },
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 94/96, Bhuleshwar Main Road, Mumbai - 400 002."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={invoice.customer.phone || ''}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, phone: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 9833214567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={invoice.customer.email || ''}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, email: e.target.value },
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. client@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 3. Line Items Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  3. Line Items (Particulars)
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {invoice.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg space-y-2 relative group hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {products.length > 0 && (
                          <select
                            onChange={(e) => handleSelectProduct(item.id, e.target.value)}
                            defaultValue=""
                            className="bg-zinc-900 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded px-2 py-0.5"
                          >
                            <option value="" disabled>
                              Insert catalog product...
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.unitPrice})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 pt-1">
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Particular / Item Description *
                        </label>
                        <input
                          type="text"
                          value={item.particular}
                          onChange={(e) =>
                            handleItemChange(item.id, 'particular', e.target.value)
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g. Metal Diya"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          QTY *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', e.target.value)
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white text-right focus:outline-none focus:border-emerald-500"
                          placeholder="1"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Rate (₹) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(item.id, 'rate', e.target.value)
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white text-right focus:outline-none focus:border-emerald-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[11px] text-zinc-400 mb-1 text-right">
                          Amount (₹)
                        </label>
                        <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-bold text-right truncate">
                          {formatINR(item.amount, '')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Tax & Totals Settings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2">
                4. Discount, Taxes & Shipping
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tax Mode */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Tax Mode
                  </label>
                  <select
                    value={invoice.taxMode}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        taxMode: e.target.value as TaxMode,
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NONE">No Tax / Non-GST (0%)</option>
                    <option value="EXCLUSIVE">GST Exclusive (Add tax)</option>
                    <option value="INCLUSIVE">GST Inclusive (Included)</option>
                  </select>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    disabled={invoice.taxMode === 'NONE'}
                    value={invoice.taxRate}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        taxRate: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-zinc-950 disabled:opacity-40 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                {/* Inter-state switch */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Tax Distribution
                  </label>
                  <button
                    type="button"
                    disabled={invoice.taxMode === 'NONE'}
                    onClick={() =>
                      setInvoice((prev) => ({
                        ...prev,
                        isInterState: !prev.isInterState,
                      }))
                    }
                    className="w-full bg-zinc-950 disabled:opacity-40 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white flex items-center justify-between"
                  >
                    <span>{invoice.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra)'}</span>
                    <span className="text-[10px] text-zinc-400 underline">toggle</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Discount */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-zinc-400">Discount</label>
                    <button
                      type="button"
                      onClick={() =>
                        setInvoice((prev) => ({
                          ...prev,
                          discountType:
                            prev.discountType === 'percentage' ? 'fixed' : 'percentage',
                        }))
                      }
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      {invoice.discountType === 'percentage' ? 'Switch to ₹' : 'Switch to %'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={invoice.discountValue}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          discountValue: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-xs text-zinc-500">
                      {invoice.discountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Shipping Charges (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={invoice.shippingCharges}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        shippingCharges: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={invoice.amountPaid}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        amountPaid: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Calculation Summary Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="text-white font-medium">{formatINR(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Discount:</span>
                    <span className="text-amber-400">-{formatINR(totals.discountAmount)}</span>
                  </div>
                )}
                {totals.shippingCharges > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Shipping:</span>
                    <span className="text-white">+{formatINR(totals.shippingCharges)}</span>
                  </div>
                )}
                {totals.totalTax > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>
                      {totals.isInterState ? `IGST (${totals.taxRate}%)` : `GST (${totals.taxRate}%)`}:
                    </span>
                    <span className="text-white font-medium">{formatINR(totals.totalTax)}</span>
                  </div>
                )}
                {totals.roundOff !== 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Round-off:</span>
                    <span>{totals.roundOff > 0 ? `+${totals.roundOff}` : totals.roundOff}</span>
                  </div>
                )}
                <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-white">Grand Total:</span>
                  <span className="text-emerald-400">{formatINR(totals.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Balance Due:</span>
                  <span className={totals.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {formatINR(totals.balanceDue)}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 italic pt-1">
                  {totals.amountInWords}
                </div>
              </div>
            </div>

            {/* 5. Layout & Display Options */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2">
                5. Reference Layout Settings
              </h2>
              <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.padBlankRows}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, padBlankRows: e.target.checked }))
                    }
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Pad table with blank rows (Matches reference sheet)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoice.showLogo}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, showLogo: e.target.checked }))
                    }
                    className="rounded bg-zinc-950 border-zinc-700 text-emerald-600 focus:ring-0"
                  />
                  <span>Display business logo</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT / LIVE PREVIEW */}
        {(activeView === 'preview' || activeView === 'split') ? (
          <div
            className={`${
              activeView === 'split' ? 'lg:col-span-6' : 'max-w-4xl mx-auto w-full'
            } flex flex-col items-center`}
          >
            <div className="w-full flex items-center justify-between mb-3 text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Live Invoice Preview ({invoice.theme === 'charcoal' ? 'Charcoal Dark' : 'Classic White'})
              </span>
              <span className="text-zinc-500">A4 Portrait (Print-Ready)</span>
            </div>

            {/* Scale wrapper for responsive preview */}
            <div className="w-full flex items-center justify-between px-2 pb-1 text-[11px] text-zinc-400 sm:hidden">
              <span>📱 Swipe / pan horizontally to inspect invoice</span>
            </div>
            <div className="w-full overflow-x-auto p-1 sm:p-2 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex justify-start sm:justify-center shadow-inner -webkit-overflow-scrolling-touch">
              <div id="invoice-preview-container" className="my-2 min-w-[650px] sm:min-w-full max-w-[800px] mx-auto">
                <InvoicePreview invoice={invoice} theme={invoice.theme} />
              </div>
            </div>
          </div>
        ) : (
          /* Off-screen invoice element so Print & PDF generation work even when in single-column Editor view */
          <div
            id="invoice-offscreen-container"
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: '0px',
              width: '800px',
              pointerEvents: 'none',
              zIndex: -999,
            }}
          >
            <div id="invoice-editor-offscreen-preview">
              <InvoicePreview invoice={invoice} theme={invoice.theme} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
