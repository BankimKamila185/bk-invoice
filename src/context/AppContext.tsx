import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessProfile,
  Customer,
  Product,
  Invoice,
  ActiveTab,
  PaymentStatus,
} from '../types';
import {
  initialBusinessProfile,
  initialCustomers,
  initialProducts,
  initialInvoices,
} from '../data/initialData';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  invoices: Invoice[];
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => Invoice | null;
  updateInvoiceStatus: (id: string, status: PaymentStatus) => void;
  getNextInvoiceNumber: () => string;
  
  editingInvoiceId: string | null;
  setEditingInvoiceId: (id: string | null) => void;
  selectedInvoiceForView: Invoice | null;
  setSelectedInvoiceForView: (invoice: Invoice | null) => void;
  
  exportAllData: () => string;
  importAllData: (jsonStr: string) => { success: boolean; message: string };
  resetToDemoData: () => void;
  clearAllData: () => void;
  
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUSINESS: 'bk_invoice_business',
  CUSTOMERS: 'bk_invoice_customers',
  PRODUCTS: 'bk_invoice_products',
  INVOICES: 'bk_invoice_invoices',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Business Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      return saved ? JSON.parse(saved) : initialBusinessProfile;
    } catch {
      return initialBusinessProfile;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(businessProfile));
    } catch (e) {
      console.error('Failed to save business profile to localStorage', e);
    }
  }, [businessProfile]);

  const updateBusinessProfile = (updates: Partial<BusinessProfile>) => {
    setBusinessProfile((prev) => ({ ...prev, ...updates }));
    showToast('Business profile updated successfully');
  };

  // 2. Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  }, [customers]);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`Customer "${newCustomer.name}" added`);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Customer information updated');
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast(`Customer ${target?.name || ''} removed`, 'info');
  };

  // 3. Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Product "${newProduct.name}" added`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Product updated');
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(`Product ${target?.name || ''} deleted`, 'info');
  };

  // 4. Invoices
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices to localStorage', e);
    }
  }, [invoices]);

  const getNextInvoiceNumber = (): string => {
    if (invoices.length === 0) return '001';
    // Find highest numeric invoice number
    const numbers = invoices
      .map((inv) => {
        const match = inv.invoiceNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return String(max + 1).padStart(3, '0');
  };

  const saveInvoice = (invoice: Invoice) => {
    // Check if duplicate invoice number with different ID
    const duplicate = invoices.find(
      (inv) => inv.id !== invoice.id && inv.invoiceNumber.trim().toLowerCase() === invoice.invoiceNumber.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(`Invoice number "${invoice.invoiceNumber}" already exists! Please use a unique number.`, 'error');
      return;
    }

    setInvoices((prev) => {
      const existsIndex = prev.findIndex((inv) => inv.id === invoice.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = { ...invoice, updatedAt: new Date().toISOString() };
        return updated;
      } else {
        return [{ ...invoice, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev];
      }
    });
    showToast(`Invoice #${invoice.invoiceNumber} saved successfully!`);
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (selectedInvoiceForView?.id === id) {
      setSelectedInvoiceForView(null);
    }
    showToast(`Invoice #${inv?.invoiceNumber || ''} deleted`, 'info');
  };

  const duplicateInvoice = (id: string): Invoice | null => {
    const source = invoices.find((inv) => inv.id === id);
    if (!source) return null;

    const nextNum = getNextInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    const duplicate: Invoice = {
      ...source,
      id: `inv-${Date.now()}`,
      invoiceNumber: nextNum,
      invoiceDate: today,
      dueDate: dueDate,
      status: 'Draft',
      amountPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => [duplicate, ...prev]);
    showToast(`Duplicated to new Draft Invoice #${nextNum}`);
    return duplicate;
  };

  const updateInvoiceStatus = (id: string, status: PaymentStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const isNowPaid = status === 'Paid';
          return {
            ...inv,
            status,
            amountPaid: isNowPaid ? inv.amountPaid || 1 : inv.amountPaid,
            updatedAt: new Date().toISOString(),
          };
        }
        return inv;
      })
    );
    showToast(`Invoice marked as ${status}`);
  };

  // 5. Backup & Persistence
  const exportAllData = (): string => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      businessProfile,
      customers,
      products,
      invoices,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importAllData = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON format' };
      }
      if (parsed.businessProfile) setBusinessProfile(parsed.businessProfile);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.products)) setProducts(parsed.products);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      showToast('All data imported successfully!');
      return { success: true, message: 'Data imported successfully' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to parse JSON file' };
    }
  };

  const resetToDemoData = () => {
    setBusinessProfile(initialBusinessProfile);
    setCustomers(initialCustomers);
    setProducts(initialProducts);
    setInvoices(initialInvoices);
    showToast('Reset to demo data matching reference template');
  };

  const clearAllData = () => {
    setCustomers([]);
    setProducts([]);
    setInvoices([]);
    showToast('All transaction records cleared', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        businessProfile,
        updateBusinessProfile,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        invoices,
        saveInvoice,
        deleteInvoice,
        duplicateInvoice,
        updateInvoiceStatus,
        getNextInvoiceNumber,
        editingInvoiceId,
        setEditingInvoiceId,
        selectedInvoiceForView,
        setSelectedInvoiceForView,
        exportAllData,
        importAllData,
        resetToDemoData,
        clearAllData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
