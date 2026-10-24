import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateInvoiceTotals, formatINR, formatDateDMY } from '../../utils/calculations';
import { PaymentStatus } from '../../types';
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  FileEdit,
  Trash2,
  Copy,
  ArrowRight,
  Download,
  AlertCircle,
  Building2,
  Users,
  Package,
} from 'lucide-react';

interface DashboardProps {
  onOpenInvoice: (invoiceId: string) => void;
  onEditInvoice: (invoiceId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenInvoice,
  onEditInvoice,
}) => {
  const {
    invoices,
    customers,
    products,
    setActiveTab,
    duplicateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute dashboard metrics
  const stats = useMemo(() => {
    let totalSales = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoices.forEach((inv) => {
      const totals = calculateInvoiceTotals(inv);
      totalSales += totals.grandTotal;
      if (inv.status === 'Paid') {
        paidAmount += totals.grandTotal;
        paidCount++;
      } else {
        pendingAmount += totals.balanceDue;
        pendingCount++;
      }
    });

    return {
      totalInvoices: invoices.length,
      totalSales,
      paidAmount,
      pendingAmount,
      paidCount,
      pendingCount,
    };
  }, [invoices]);

  // Filtered recent invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Business Dashboard</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time financial overview, invoice management and sales tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('create-invoice')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Invoices
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{stats.totalInvoices}</div>
            <div className="text-xs text-zinc-500 mt-1">Generated invoices to date</div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Total Sales
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatINR(stats.totalSales)}</div>
            <div className="text-xs text-zinc-500 mt-1">Gross billed amount</div>
          </div>
        </div>

        {/* Paid Invoices */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Paid Amount
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400">
              {formatINR(stats.paidAmount)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {stats.paidCount} settled {stats.paidCount === 1 ? 'invoice' : 'invoices'}
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Pending Balance
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400">
              {formatINR(stats.pendingAmount)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {stats.pendingCount} unpaid / partial
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Shortcuts Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Client Management</div>
              <div className="text-xs text-zinc-400">{customers.length} registered customers</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Product Catalog</div>
              <div className="text-xs text-zinc-400">{products.length} active inventory items</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        <div
          onClick={() => setActiveTab('settings')}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Business Profile</div>
              <div className="text-xs text-zinc-400">GST, Bank & Template setup</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      </div>

      {/* 4. Recent Invoices Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Invoices</h2>
            <span className="text-xs text-zinc-500">({filteredInvoices.length} found)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search invoice or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-zinc-300 focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY PAID">Partially Paid</option>
                <option value="DRAFT">Draft</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-zinc-600" />
            <div className="text-base font-semibold text-zinc-400">No invoices found</div>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              No invoice records matched your query or filters. Create a new invoice or adjust filters.
            </p>
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
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white">{formatINR(totals.grandTotal)}</div>
                        {totals.balanceDue > 0 && (
                          <div className="text-[10px] text-amber-400 font-semibold">
                            Due: {formatINR(totals.balanceDue)}
                          </div>
                        )}
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
                          title="View Invoice"
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
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete Invoice"
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
                    <th className="py-3 px-4 text-right">Amount</th>
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
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <span>Bill No. {inv.invoiceNumber}</span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-medium">
                          {formatDateDMY(inv.invoiceDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{inv.customer.name}</div>
                          {inv.customer.gstin && (
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {inv.customer.gstin}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          {formatINR(totals.grandTotal)}
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
                              title="View Invoice"
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
                              title="Duplicate Invoice"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete invoice #${inv.invoiceNumber}?`)) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Delete Invoice"
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
