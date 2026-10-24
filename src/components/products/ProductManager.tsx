import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Archive,
} from 'lucide-react';

export const ProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unitPrice: 0,
    taxRate: 0,
    uom: 'PCS',
    stockQuantity: 100,
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      unitPrice: 0,
      taxRate: 0,
      uom: 'PCS',
      stockQuantity: 100,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      unitPrice: p.unitPrice || 0,
      taxRate: p.taxRate || 0,
      uom: p.uom || 'PCS',
      stockQuantity: p.stockQuantity || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter product name', 'error');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            <span>Product Catalog</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Maintain your items, rates, SKUs, inventory units and default GST rates
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products by title, SKU, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Showing <span className="font-bold text-white">{filteredProducts.length}</span> of{' '}
          {products.length} catalog items
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <AlertCircle className="w-10 h-10 mx-auto text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400">No products found</p>
            <p className="text-xs text-zinc-600">Try adjusting your search query or add a product</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (md:hidden) */}
            <div className="md:hidden divide-y divide-zinc-800/80">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{prod.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold">
                          {prod.sku || 'NO SKU'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {prod.uom}
                        </span>
                        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                          GST {prod.taxRate}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-white">{formatINR(prod.unitPrice)}</div>
                      <div className="text-[10px] text-zinc-500">
                        Stock: {prod.stockQuantity !== undefined ? prod.stockQuantity : '—'}
                      </div>
                    </div>
                  </div>

                  {prod.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">{prod.description}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete product "${prod.name}"?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name & Particulars</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Default Rate</th>
                    <th className="py-3 px-4 text-center">GST Rate</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-800/40 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-400">
                        {prod.sku || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                          {prod.name}
                        </div>
                        {prod.description && (
                          <div className="text-[11px] text-zinc-500 truncate max-w-md">
                            {prod.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-zinc-400">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                          {prod.uom}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-white">
                        {formatINR(prod.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[11px]">
                          {prod.taxRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-zinc-400">
                        {prod.stockQuantity !== undefined ? `${prod.stockQuantity} ${prod.uom}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete product "${prod.name}"?`)) {
                                deleteProduct(prod.id);
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
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
              <h2 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Metal Diya"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-purple-500"
                    placeholder="e.g. MD-01"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Unit of Measurement (UOM)
                  </label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="SET">SET</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="MTR">MTR (Meters)</option>
                    <option value="DOZ">DOZ (Dozen)</option>
                    <option value="PKT">PKT (Packets)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="68.00"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Default Tax Rate
                  </label>
                  <select
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Details, material, dimensions or special notes..."
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
