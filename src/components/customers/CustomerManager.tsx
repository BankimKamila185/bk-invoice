import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { calculateInvoiceTotals, formatINR } from '../../utils/calculations';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  Edit2,
  Trash2,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const { customers, invoices, addCustomer, updateCustomer, deleteCustomer, showToast } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    billingAddress: '',
    gstin: '',
    notes: '',
    state: 'Maharashtra',
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      billingAddress: '',
      gstin: '',
      notes: '',
      state: 'Maharashtra',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      contactPerson: c.contactPerson || '',
      phone: c.phone || '',
      email: c.email || '',
      billingAddress: c.billingAddress || '',
      gstin: c.gstin || '',
      notes: c.notes || '',
      state: c.state || 'Maharashtra',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter customer/company name', 'error');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q)) ||
        c.billingAddress.toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Compute metrics per customer
  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number; totalBilled: number; balanceDue: number }> =
      {};

    customers.forEach((c) => {
      stats[c.id] = { count: 0, totalBilled: 0, balanceDue: 0 };
    });

    invoices.forEach((inv) => {
      const custId = inv.customer.id;
      if (custId && stats[custId]) {
        const totals = calculateInvoiceTotals(inv);
        stats[custId].count += 1;
        stats[custId].totalBilled += totals.grandTotal;
        stats[custId].balanceDue += totals.balanceDue;
      }
    });

    return stats;
  }, [customers, invoices]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your client profiles, addresses, GSTINs and order histories
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-950 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search and stats */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Showing <span className="font-bold text-white">{filteredCustomers.length}</span> of{' '}
          {customers.length} customers
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 space-y-2">
          <AlertCircle className="w-10 h-10 mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-400">No customers found</p>
          <p className="text-xs text-zinc-600">Try adjusting your search query or add a customer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => {
            const stat = customerStats[cust.id] || { count: 0, totalBilled: 0, balanceDue: 0 };
            return (
              <div
                key={cust.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                        {cust.name}
                      </h3>
                      {cust.contactPerson && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Attn: {cust.contactPerson}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete customer "${cust.name}"?`)) {
                            deleteCustomer(cust.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-xs text-zinc-300">
                    {cust.gstin && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
                          GSTIN
                        </span>
                        <span className="font-mono text-zinc-200">{cust.gstin}</span>
                      </div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                    {cust.email && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-zinc-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed text-[11.5px]">
                        {cust.billingAddress || 'No address provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-5 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Invoices</span>
                    <div className="font-bold text-white">{stat.count} orders</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase">Pending Due</span>
                    <div className={`font-bold ${stat.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatINR(stat.balanceDue)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
              <h2 className="text-base font-bold text-white">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. SAMBHAV ARTS"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Ketan Shah"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 9833214567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 27AEDPJ0238G1ZV"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Maharashtra"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Billing Address *
                </label>
                <textarea
                  rows={2}
                  value={formData.billingAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, billingAddress: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Street address, locality, city, pin code..."
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. client@example.com"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Notes about payment terms or preferences..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
