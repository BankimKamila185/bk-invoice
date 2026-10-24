export type PaymentStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';

export type TaxMode = 'NONE' | 'EXCLUSIVE' | 'INCLUSIVE';

export type InvoiceTheme = 'charcoal' | 'white';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branch: string;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  pan: string;
  gstin: string;
  aadhar?: string;
  showAadhar: boolean;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  cityStatePin: string;
  logoUrl?: string;
  bankDetails: BankDetails;
  upiId: string;
  paymentInstructions: string;
  signatureText: string;
  signatureUrl?: string;
  invoicePrefix: string;
  defaultTaxRate: number;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  billingAddress: string;
  gstin?: string;
  notes?: string;
  state?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  taxRate: number; // 0, 5, 12, 18, 28
  uom: string; // Pcs, Box, Kg, etc.
  stockQuantity?: number;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  particular: string; // Product name/description
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  shippingCharges: number;
  taxMode: TaxMode;
  taxRate: number;
  taxableAmount: number;
  isInterState: boolean;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  amountInWords: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "003" or "INV-003"
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  referenceNumber?: string;
  status: PaymentStatus;
  
  business: BusinessProfile;
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    billingAddress: string;
    gstin?: string;
  };
  
  items: InvoiceItem[];
  
  // Layout and Display options
  padBlankRows: boolean; // Pad empty lines to fill page like reference
  minRows: number; // e.g. 9 rows
  theme: InvoiceTheme; // 'charcoal' or 'white'
  showLogo: boolean;
  
  // Financial settings
  taxMode: TaxMode;
  taxRate: number; // 0, 5, 12, 18, 28
  isInterState: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  shippingCharges: number;
  amountPaid: number;
  
  notes?: string;
  terms?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'dashboard' | 'create-invoice' | 'invoices' | 'customers' | 'products' | 'settings';
