import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateInvoiceTotals, formatINR, formatDateDMY } from '../../utils/calculations';
import { PaymentStatus } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  FileEdit,
  Trash2,
  Copy,
  Download,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceListProps {
  onOpenInvoice: (invoiceId: string) => void;
  onEditInvoice: (invoiceId: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onOpenInvoice,
  onEditInvoice,
}) => {
  const {
    invoices,
    setActiveTab,
    duplicateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter.toUpperCase();

      const invDate = inv.invoiceDate;
      const matchesStart = !startDate || invDate >= startDate;
      const matchesEnd = !endDate || invDate <= endDate;

      return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });
  }, [invoices, searchQuery, statusFilter, startDate, endDate]);

  // Aggregate totals
  const aggregate = useMemo(() => {
    let grandTotal = 0;
    let balanceDue = 0;
    filteredInvoices.forEach((inv) => {
      const totals = calculateInvoiceTotals(inv);
      grandTotal += totals.grandTotal;
      balanceDue += totals.balanceDue;
    });
    return {
      count: filteredInvoices.length,
      grandTotal,
      balanceDue,
    };
  }, [filteredInvoices]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast('No invoices to export', 'info');
      return;
    }

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Due Date',
      'Customer Name',
      'Customer GSTIN',
      'Status',
      'Subtotal',
      'Discount',
      'Shipping',
      'Tax',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
    ];

    const rows = filteredInvoices.map((inv) => {
      const totals = calculateInvoiceTotals(inv);
      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.invoiceDate}"`,
        `"${inv.dueDate}"`,
        `"${inv.customer.name.replace(/"/g, '""')}"`,
        `"${inv.customer.gstin || ''}"`,
        `"${inv.status}"`,
        totals.subtotal,
        totals.discountAmount,
        totals.shippingCharges,
        totals.totalTax,
        totals.grandTotal,
        totals.amountPaid,
        totals.balanceDue,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>All Invoices</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search, filter, track payment statuses and export invoices
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl flex items-center gap-2 border border-zinc-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('create-invoice')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400">Total Filtered</span>
          <span className="text-lg font-bold text-white">{aggregate.count} invoices</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400">Total Billed</span>
          <span className="text-lg font-black text-white">{formatINR(aggregate.grandTotal)}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs text-zinc-400">Outstanding Balance</span>
          <span className="text-lg font-black text-amber-400">
            {formatINR(aggregate.balanceDue)}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search invoice number, client or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY PAID">Partially Paid</option>
            <option value="DRAFT">Draft</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
              title="Start date"
            />
          </div>
          <span className="text-zinc-500">to</span>
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
              title="End date"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-zinc-500 hover:text-white underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table & Mobile Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <p className="text-sm font-semibold text-zinc-400">No invoices match your filters</p>
            <p className="text-xs text-zinc-600">Try adjusting your search query or date range</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (md:hidden) */}
            <div className="md:hidden divide-y divide-zinc-800/80">
              {filteredInvoices.map((inv) => {
                const totals = calculateInvoiceTotals(inv);
                return (
                  <div
                    key={inv.id}
                    onClick={() => onOpenInvoice(inv.id)}
                    className="p-4 space-y-3 hover:bg-zinc-800/30 transition-colors active:bg-zinc-800/50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">Bill No. {inv.invoiceNumber}</span>
                        <span className="text-zinc-500 text-xs">• {formatDateDMY(inv.invoiceDate)}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : inv.status === 'Unpaid'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : inv.status === 'Partially Paid'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{inv.customer.name}</div>
                        {inv.customer.gstin && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{inv.customer.gstin}</div>
                        )}
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{formatINR(totals.grandTotal)}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${totals.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {totals.balanceDue > 0 ? `Due: ${formatINR(totals.balanceDue)}` : 'Fully Paid'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-2 border-t border-zinc-800/60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={inv.status}
                        onChange={(e) =>
                          updateInvoiceStatus(inv.id, e.target.value as PaymentStatus)
                        }
                        className="text-[11px] bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 font-medium"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenInvoice(inv.id)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                          title="View / Print / PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditInvoice(inv.id)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateInvoice(inv.id)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete invoice #${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Items</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredInvoices.map((inv) => {
                    const totals = calculateInvoiceTotals(inv);
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                        onClick={() => onOpenInvoice(inv.id)}
                      >
                        <td className="py-3.5 px-4 font-bold text-white">
                          Bill No. {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-medium">
                          {formatDateDMY(inv.invoiceDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{inv.customer.name}</div>
                          {inv.customer.billingAddress && (
                            <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                              {inv.customer.billingAddress}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-zinc-400">
                          {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          {formatINR(totals.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span className={totals.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                            {formatINR(totals.balanceDue)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={inv.status}
                            onChange={(e) =>
                              updateInvoiceStatus(inv.id, e.target.value as PaymentStatus)
                            }
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none border ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : inv.status === 'Unpaid'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : inv.status === 'Partially Paid'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenInvoice(inv.id)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="View / Print / PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditInvoice(inv.id)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Edit Invoice"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => duplicateInvoice(inv.id)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete invoice #${inv.invoiceNumber}?`)) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
