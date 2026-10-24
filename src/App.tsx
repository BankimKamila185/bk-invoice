import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { InvoiceEditor } from './components/invoice/InvoiceEditor';
import { InvoiceList } from './components/invoices/InvoiceList';
import { CustomerManager } from './components/customers/CustomerManager';
import { ProductManager } from './components/products/ProductManager';
import { BusinessSettings } from './components/settings/BusinessSettings';
import { InvoiceDetailModal } from './components/invoice/InvoiceDetailModal';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    editingInvoiceId,
    setEditingInvoiceId,
    selectedInvoiceForView,
    setSelectedInvoiceForView,
    invoices,
    duplicateInvoice,
    updateInvoiceStatus,
  } = useApp();

  const handleOpenInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      setSelectedInvoiceForView(inv);
    }
  };

  const handleEditInvoice = (invoiceId: string) => {
    setEditingInvoiceId(invoiceId);
    setActiveTab('create-invoice');
  };

  const handleCloseEditor = () => {
    setEditingInvoiceId(null);
    setActiveTab('invoices');
  };

  return (
    <AppLayout>
      {activeTab === 'dashboard' && (
        <Dashboard
          onOpenInvoice={handleOpenInvoice}
          onEditInvoice={handleEditInvoice}
        />
      )}

      {activeTab === 'create-invoice' && (
        <InvoiceEditor
          initialInvoiceId={editingInvoiceId}
          onClose={handleCloseEditor}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoiceList
          onOpenInvoice={handleOpenInvoice}
          onEditInvoice={handleEditInvoice}
        />
      )}

      {activeTab === 'customers' && <CustomerManager />}

      {activeTab === 'products' && <ProductManager />}

      {activeTab === 'settings' && <BusinessSettings />}

      {/* Detail / View Invoice Modal */}
      {selectedInvoiceForView && (
        <InvoiceDetailModal
          invoice={selectedInvoiceForView}
          isOpen={Boolean(selectedInvoiceForView)}
          onClose={() => setSelectedInvoiceForView(null)}
          onEdit={(id) => {
            setSelectedInvoiceForView(null);
            handleEditInvoice(id);
          }}
          onDuplicate={(id) => {
            duplicateInvoice(id);
            setSelectedInvoiceForView(null);
          }}
          onMarkPaid={(id) => {
            updateInvoiceStatus(id, 'Paid');
            if (selectedInvoiceForView && selectedInvoiceForView.id === id) {
              setSelectedInvoiceForView({ ...selectedInvoiceForView, status: 'Paid' });
            }
          }}
        />
      )}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
