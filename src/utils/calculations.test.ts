import { describe, it, expect } from 'vitest';
import {
  calculateLineAmount,
  calculateSubtotal,
  calculateDiscount,
  calculateInvoiceTotals,
  formatINR,
  numberToWordsINR,
  formatDateDMY
} from './calculations';
import { InvoiceItem } from '../types';

describe('Financial Calculations Engine', () => {
  it('calculates line item amounts correctly', () => {
    expect(calculateLineAmount(360, 68)).toBe(24480);
    expect(calculateLineAmount(240, 37)).toBe(8880);
    expect(calculateLineAmount(1.5, 200)).toBe(300);
    expect(calculateLineAmount(0, 50)).toBe(0);
  });

  it('calculates subtotal matching reference image items', () => {
    const items: InvoiceItem[] = [
      { id: '1', particular: 'Metal Diya', quantity: 360, rate: 68, amount: 24480 },
      { id: '2', particular: 'Metal Diya', quantity: 240, rate: 37, amount: 8880 },
    ];
    expect(calculateSubtotal(items)).toBe(33360);
  });

  it('calculates percentage and fixed discounts properly', () => {
    expect(calculateDiscount(33360, 'percentage', 5)).toBe(1668);
    expect(calculateDiscount(33360, 'fixed', 500)).toBe(500);
    expect(calculateDiscount(33360, 'percentage', 0)).toBe(0);
  });

  it('computes GST Exclusive calculation with intra-state CGST & SGST', () => {
    const items: InvoiceItem[] = [
      { id: '1', particular: 'Widget A', quantity: 10, rate: 100, amount: 1000 },
    ];
    const totals = calculateInvoiceTotals({
      items,
      discountType: 'percentage',
      discountValue: 10, // 10% of 1000 = 100 -> after discount = 900
      shippingCharges: 100, // taxableAmount = 1000
      taxMode: 'EXCLUSIVE',
      taxRate: 18, // 18% of 1000 = 180
      isInterState: false, // CGST 90, SGST 90
      amountPaid: 500,
    });

    expect(totals.subtotal).toBe(1000);
    expect(totals.discountAmount).toBe(100);
    expect(totals.taxableAmount).toBe(1000);
    expect(totals.totalTax).toBe(180);
    expect(totals.cgstAmount).toBe(90);
    expect(totals.sgstAmount).toBe(90);
    expect(totals.igstAmount).toBe(0);
    expect(totals.grandTotal).toBe(1180);
    expect(totals.balanceDue).toBe(680);
  });

  it('computes GST Inclusive calculation properly without double tax', () => {
    const items: InvoiceItem[] = [
      { id: '1', particular: 'Inclusive Item', quantity: 1, rate: 118, amount: 118 },
    ];
    const totals = calculateInvoiceTotals({
      items,
      taxMode: 'INCLUSIVE',
      taxRate: 18,
      isInterState: true,
    });

    expect(totals.subtotal).toBe(118);
    expect(totals.taxableAmount).toBe(100);
    expect(totals.totalTax).toBe(18);
    expect(totals.igstAmount).toBe(18);
    expect(totals.grandTotal).toBe(118);
  });

  it('formats currency in Indian numbering system', () => {
    expect(formatINR(24480)).toBe('Rs 24,480.00');
    expect(formatINR(8880)).toBe('Rs 8,880.00');
    expect(formatINR(33360)).toBe('Rs 33,360.00');
    expect(formatINR(1000000)).toBe('Rs 10,00,000.00');
    expect(formatINR(33360, '₹ ')).toBe('₹ 33,360.00');
  });

  it('converts numbers to Indian Rupees words accurately', () => {
    expect(numberToWordsINR(33360)).toBe('Rupees Thirty Three Thousand Three Hundred Sixty Only');
    expect(numberToWordsINR(24480)).toBe('Rupees Twenty Four Thousand Four Hundred Eighty Only');
    expect(numberToWordsINR(100000)).toBe('Rupees One Lakh Only');
  });

  it('formats dates into DD/MM/YYYY', () => {
    expect(formatDateDMY('2026-10-16')).toBe('16/10/2026');
    expect(formatDateDMY('16/10/2026')).toBe('16/10/2026');
  });
});
