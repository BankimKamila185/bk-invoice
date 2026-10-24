import { Invoice, InvoiceItem, InvoiceTotals, TaxMode } from '../types';

/**
 * Calculates the amount for an individual invoice line item.
 */
export function calculateLineAmount(quantity: number, rate: number): number {
  const qty = Number(quantity) || 0;
  const rt = Number(rate) || 0;
  return Number((qty * rt).toFixed(2));
}

/**
 * Calculates the subtotal of all items in an invoice.
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  const sum = items.reduce((acc, item) => {
    return acc + calculateLineAmount(item.quantity, item.rate);
  }, 0);
  return Number(sum.toFixed(2));
}

/**
 * Calculates the discount amount based on type and value.
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number
): number {
  const val = Number(discountValue) || 0;
  if (val <= 0 || subtotal <= 0) return 0;

  if (discountType === 'percentage') {
    const amount = (subtotal * val) / 100;
    return Number(Math.min(subtotal, amount).toFixed(2));
  } else {
    return Number(Math.min(subtotal, val).toFixed(2));
  }
}

/**
 * Computes all financial totals according to Indian GST standards and user settings.
 */
export function calculateInvoiceTotals(invoice: {
  items: InvoiceItem[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  shippingCharges?: number;
  taxMode?: TaxMode;
  taxRate?: number;
  isInterState?: boolean;
  amountPaid?: number;
}): InvoiceTotals {
  const items = invoice.items || [];
  const subtotal = calculateSubtotal(items);
  const discountType = invoice.discountType || 'percentage';
  const discountValue = Number(invoice.discountValue) || 0;
  const shippingCharges = Number(invoice.shippingCharges) || 0;
  const taxMode = invoice.taxMode || 'NONE';
  const taxRate = Number(invoice.taxRate) || 0;
  const isInterState = Boolean(invoice.isInterState);
  const amountPaid = Number(invoice.amountPaid) || 0;

  const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  let taxableAmount = 0;
  let totalTax = 0;
  let rawGrandTotal = 0;

  if (taxMode === 'NONE' || taxRate <= 0) {
    taxableAmount = afterDiscount;
    totalTax = 0;
    rawGrandTotal = afterDiscount + shippingCharges;
  } else if (taxMode === 'EXCLUSIVE') {
    // Base amount is after discount + taxable shipping
    taxableAmount = Number((afterDiscount + shippingCharges).toFixed(2));
    totalTax = Number(((taxableAmount * taxRate) / 100).toFixed(2));
    rawGrandTotal = Number((taxableAmount + totalTax).toFixed(2));
  } else if (taxMode === 'INCLUSIVE') {
    // Price already includes GST
    const grossAmount = afterDiscount + shippingCharges;
    const baseAmount = grossAmount / (1 + taxRate / 100);
    taxableAmount = Number(baseAmount.toFixed(2));
    totalTax = Number((grossAmount - taxableAmount).toFixed(2));
    rawGrandTotal = Number(grossAmount.toFixed(2));
  }

  // CGST / SGST vs IGST split
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (totalTax > 0) {
    if (isInterState) {
      igstAmount = totalTax;
    } else {
      cgstAmount = Number((totalTax / 2).toFixed(2));
      sgstAmount = Number((totalTax - cgstAmount).toFixed(2)); // ensures no rounding discrepancy
    }
  }

  // Round off adjustment to nearest rupee
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
  const grandTotal = roundedGrandTotal;

  // Balance due
  const balanceDue = Number(Math.max(0, grandTotal - amountPaid).toFixed(2));

  // Amount in words
  const amountInWords = numberToWordsINR(grandTotal);

  return {
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    shippingCharges,
    taxMode,
    taxRate,
    taxableAmount,
    isInterState,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    roundOff,
    grandTotal,
    amountPaid,
    balanceDue,
    amountInWords,
  };
}

/**
 * Formats a number to Indian Currency string (e.g. "Rs 24,480.00" or "₹ 24,480.00").
 */
export function formatINR(amount: number, prefix: 'Rs ' | '₹ ' | '' = 'Rs '): string {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const parts = absNum.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian comma formatting: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}${prefix}${formattedInteger}.${decimalPart}`;
}

/**
 * Converts Indian Currency number to words (e.g., "Rupees Thirty-Three Thousand Three Hundred Sixty Only").
 */
export function numberToWordsINR(amount: number): string {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const tensUnit = tens[Math.floor(n / 10)];
    const unit = singleDigits[n % 10];
    return unit ? `${tensUnit} ${unit}` : tensUnit;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${singleDigits[hundred]} Hundred`;
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let words = '';
  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let hundredPart = remainder;

  if (crore > 0) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundredPart > 0) {
    words += `${convertThreeDigits(hundredPart)} `;
  }

  return `Rupees ${words.trim()} Only`;
}

/**
 * Formats date into DD/MM/YYYY matching the reference image.
 */
export function formatDateDMY(dateStr: string): string {
  if (!dateStr) return '';
  // handles YYYY-MM-DD or existing DD/MM/YYYY
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
