import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessProfile } from '../../types';
import {
  Building2,
  Save,
  Upload,
  Trash2,
  Download,
  RotateCcw,
  ShieldAlert,
  CreditCard,
  QrCode,
  FileText,
  Lock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const {
    businessProfile,
    updateBusinessProfile,
    exportAllData,
    importAllData,
    resetToDemoData,
    clearAllData,
    showToast,
  } = useApp();

  const [form, setForm] = useState<BusinessProfile>(businessProfile);
  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'backup'>('profile');
  const [showClearModal, setShowClearModal] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(form);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({ ...prev, logoUrl: result }));
      showToast('Logo image loaded');
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((prev) => ({ ...prev, signatureUrl: result }));
      showToast('Signature image loaded');
    };
    reader.readAsDataURL(file);
  };

  const handleExportJSON = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BillCraft_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('JSON backup file downloaded');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importAllData(content);
      if (!res.success) {
        showToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Business Profile & Settings</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure header details, GSTIN, bank credentials and data backups
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap sm:flex-nowrap bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold w-full sm:w-auto gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-colors text-center ${
              activeTab === 'profile' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('banking')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-colors text-center ${
              activeTab === 'banking' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bank & UPI
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-colors text-center ${
              activeTab === 'backup' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Backup & Reset
          </button>
        </div>
      </div>

      {/* Profile & Address Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Business & Tax Identity
              </h2>
              <span className="text-xs text-zinc-500">
                Populates top-right header on every invoice
              </span>
            </div>

            {/* Logo and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Logo Preview & Upload */}
              <div className="md:col-span-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-zinc-400 mb-2">Company Logo</span>
                {form.logoUrl ? (
                  <div className="relative group mb-3">
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="max-h-24 max-w-full object-contain p-2 bg-zinc-900 rounded-lg border border-zinc-800"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 mb-3">
                    <Building2 className="w-8 h-8" />
                  </div>
                )}

                <label className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG or SVG up to 2MB</span>
              </div>

              {/* Main Fields */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Business / Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Mrs. Himangshu Kamila"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Owner / Proprietor Name
                  </label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Himangshu Kamila"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 9821405448"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. contact@business.com"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={form.pan}
                    onChange={(e) => setForm({ ...form, pan: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-amber-500"
                    placeholder="e.g. BMPPK9569J"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 27AAECK1234F1Z5"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Conscious Aadhaar Toggle */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    Optional Aadhaar Number (Privacy Protected)
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Disabled by default. Only enable if required for local compliance or municipal permits.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showAadhar}
                    onChange={(e) => setForm({ ...form, showAadhar: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {form.showAadhar && (
                <div className="mt-3 pt-3 border-t border-zinc-800 max-w-sm">
                  <label className="block font-medium text-zinc-400 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={form.aadhar || ''}
                    onChange={(e) => setForm({ ...form, aadhar: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 718468807879"
                  />
                </div>
              )}
            </div>

            {/* Address Details (Structured exactly matching reference) */}
            <div className="border-t border-zinc-800 pt-4 space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-zinc-300 text-[11px]">
                Business Address (Reference Template Format)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Address Line 1 (Building / Chawl)
                  </label>
                  <input
                    type="text"
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 10, Shanti Niwas, Sai darshan"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Address Line 2 (Area / Village)
                  </label>
                  <input
                    type="text"
                    value={form.addressLine2}
                    onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Chl. 8, Laxman Nagar, Anand Wadi"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    Landmark / Cross Road
                  </label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Near Shiv Mandir, Malad (e)"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-400 mb-1">
                    City, State & PIN Code
                  </label>
                  <input
                    type="text"
                    value={form.cityStatePin}
                    onChange={(e) => setForm({ ...form, cityStatePin: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Mumbai 400097"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-950 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Banking & UPI Tab */}
      {activeTab === 'banking' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Bank Details & UPI Configuration</span>
              </h2>
              <span className="text-xs text-zinc-500">
                Printed in payment footer section
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={form.bankDetails?.bankName || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: { ...form.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. HDFC Bank"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={form.bankDetails?.accountHolderName || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: { ...form.bankDetails, accountHolderName: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Himangshu Kamila"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={form.bankDetails?.accountNumber || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: { ...form.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. 50200083921832"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={form.bankDetails?.ifscCode || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: { ...form.bankDetails, ifscCode: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. HDFC0000240"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={form.bankDetails?.branch || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bankDetails: { ...form.bankDetails, branch: e.target.value },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Malad East, Mumbai"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. 9821405448@okaxis"
                />
              </div>
            </div>

            <div className="pt-2 text-xs">
              <label className="block font-medium text-zinc-400 mb-1">
                Payment Instructions / Notes
              </label>
              <textarea
                rows={2}
                value={form.paymentInstructions}
                onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Please mention invoice number in transfer reference..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Bank Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Backup & Persistence Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-400" />
                <span>Local Data Storage & Backups</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your invoices, clients, products, and business profile are securely saved locally on this browser and device using LocalStorage. Export your data to JSON regularly to keep offline backups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export JSON */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Export Full Data Backup</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Download a comprehensive JSON file containing all invoices, customers, products and business profile settings.
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              {/* Import JSON */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Restore From Backup</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Upload an existing BillCraft backup file to restore your invoices and catalog.
                  </p>
                </div>
                <label className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Choose JSON Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-zinc-800 pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Management & Reset Actions</span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Reset to Demo Data */}
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        'Reset data to reference demo data? This will load the sample invoices matching your reference image.'
                      )
                    ) {
                      resetToDemoData();
                    }
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Reset to Demo Data (Reference Image)</span>
                </button>

                {/* Clear All */}
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold rounded-xl border border-rose-500/30 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Transaction Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Clear All Local Data?</h3>
            <p className="text-xs text-zinc-400">
              This action will erase all saved customer records, products, and invoices from this browser. This cannot be undone unless you have a JSON backup.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllData();
                  setShowClearModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
