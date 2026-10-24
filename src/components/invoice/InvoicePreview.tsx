import React from 'react';
import { Invoice, InvoiceTheme } from '../../types';
import { calculateInvoiceTotals, formatDateDMY, formatINR } from '../../utils/calculations';

interface InvoicePreviewProps {
  invoice: Invoice;
  id?: string;
  theme?: InvoiceTheme;
  currencyPrefix?: 'Rs ' | '₹ ';
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  id = 'invoice-print-area',
  theme = invoice.theme || 'charcoal',
  currencyPrefix = 'Rs ',
}) => {
  const isDark = theme === 'charcoal';
  const totals = calculateInvoiceTotals(invoice);

  // Styling tokens based on theme
  const bgClass = isDark ? 'bg-[#252525]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  const borderClass = isDark ? 'border-zinc-200' : 'border-black';
  const borderCol = isDark ? '#e4e4e7' : '#000000';
  const headerBgClass = isDark ? 'bg-[#2f2f32]' : 'bg-zinc-50';

  // Fill up to minRows (default 9) to reproduce reference table layout
  const actualItems = invoice.items || [];
  const minRows = invoice.padBlankRows ? Math.max(invoice.minRows || 9, actualItems.length) : actualItems.length;
  const blankRowsCount = Math.max(0, minRows - actualItems.length);

  const formattedDate = formatDateDMY(invoice.invoiceDate);
  const formattedDueDate = formatDateDMY(invoice.dueDate);

  return (
    <div
      id={id}
      className={`invoice-printable font-invoice-body ${bgClass} ${textClass} w-full max-w-[800px] mx-auto p-4 sm:p-6 md:p-8 border-2 ${borderClass} shadow-2xl transition-colors duration-200 select-text flex flex-col justify-between`}
      style={{
        boxSizing: 'border-box',
        minHeight: '1040px',
        position: 'relative',
      }}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="flex justify-between items-start mb-6">
        {/* Top Left: Logo or Company Branding (if present) */}
        <div className="w-1/2 pr-4 flex flex-col justify-between">
          {invoice.showLogo && invoice.business.logoUrl ? (
            <img
              src={invoice.business.logoUrl}
              alt={invoice.business.businessName}
              className="max-h-20 max-w-[200px] object-contain mb-2"
            />
          ) : (
            <div className="h-6"></div>
          )}
        </div>

        {/* Top Right: Business details (Mrs. Himangshu Kamila ...) */}
        <div className="w-1/2 text-right text-[13px] leading-[1.35] font-medium tracking-tight">
          <div className="font-bold text-[15px]">{invoice.business.businessName || invoice.business.ownerName}</div>
          {invoice.business.phone && <div>Mob no. {invoice.business.phone}</div>}
          {invoice.business.pan && <div>Pan no. {invoice.business.pan}</div>}
          {invoice.business.showAadhar && invoice.business.aadhar && (
            <div>Aadhar. {invoice.business.aadhar}</div>
          )}
          
          <div className="mt-3">
            {invoice.business.addressLine1 && <div>{invoice.business.addressLine1}</div>}
            {invoice.business.addressLine2 && <div>{invoice.business.addressLine2}</div>}
            {invoice.business.landmark && <div>{invoice.business.landmark}</div>}
            {invoice.business.cityStatePin && <div>{invoice.business.cityStatePin}</div>}
            {invoice.business.gstin && <div className="text-[12px] opacity-90 mt-1">GSTIN: {invoice.business.gstin}</div>}
          </div>
        </div>
      </div>

      {/* 2. CUSTOMER & BILL NO. / DATE SECTION */}
      <div className={`grid grid-cols-12 border ${borderClass} mb-0`}>
        {/* Customer Details Box (Left 8 columns) */}
        <div className={`col-span-8 p-2.5 text-[12.5px] leading-[1.4] border-r ${borderClass}`}>
          <div className="font-bold">
            To: <span className="uppercase">{invoice.customer.name || 'CUSTOMER NAME'}</span>
          </div>
          {invoice.customer.gstin && (
            <div>
              <span className="font-semibold">Gst no:</span> {invoice.customer.gstin}
            </div>
          )}
          <div>
            <span className="font-semibold">Address:</span> {invoice.customer.billingAddress || 'N/A'}
          </div>
          {invoice.customer.phone && (
            <div>
              <span className="font-semibold">Phone:</span> {invoice.customer.phone}
            </div>
          )}
        </div>

        {/* Bill No. and Date Box (Right 4 columns) */}
        <div className="col-span-4 flex flex-col">
          <div className={`p-2.5 font-bold text-[13px] border-b ${borderClass} flex items-center`}>
            <span>Bill No. {invoice.invoiceNumber || '001'}</span>
          </div>
          <div className="p-2.5 font-bold text-[13px] flex items-center">
            <span>Date. {formattedDate}</span>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT TABLE */}
      <div className={`border-x border-b ${borderClass} flex-1 flex flex-col`}>
        {/* Table Header */}
        <div className={`grid grid-cols-12 border-b ${borderClass} font-bold text-[12.5px] tracking-wide text-center uppercase`}>
          <div className={`col-span-1 py-1.5 px-1 border-r ${borderClass}`}>No.</div>
          <div className={`col-span-1 py-1.5 px-1 border-r ${borderClass}`}>QTY</div>
          <div className={`col-span-5 py-1.5 px-2 border-r ${borderClass} text-center`}>PARTICULAR</div>
          <div className={`col-span-2 py-1.5 px-1 border-r ${borderClass}`}>RATE</div>
          <div className="col-span-3 py-1.5 px-2 text-right">AMOUNT</div>
        </div>

        {/* Actual Line Items */}
        {actualItems.map((item, index) => {
          const itemAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
          return (
            <div
              key={item.id || index}
              className={`grid grid-cols-12 border-b ${borderClass} text-[13px] items-center flex-1`}
              style={{ minHeight: '38px' }}
            >
              <div className={`col-span-1 py-1.5 px-1 text-center font-bold border-r ${borderClass} self-stretch flex items-center justify-center`}>
                {index + 1}
              </div>
              <div className={`col-span-1 py-1.5 px-1 text-center font-bold border-r ${borderClass} self-stretch flex items-center justify-center`}>
                {item.quantity}
              </div>
              <div className={`col-span-5 py-1.5 px-3 font-semibold border-r ${borderClass} self-stretch flex items-center`}>
                {item.particular}
              </div>
              <div className={`col-span-2 py-1.5 px-2 text-right font-bold border-r ${borderClass} self-stretch flex items-center justify-end whitespace-nowrap`}>
                {Number(item.rate).toFixed(2)}
              </div>
              <div className="col-span-3 py-1.5 px-2 text-right font-bold self-stretch flex items-center justify-end whitespace-nowrap">
                {formatINR(itemAmount, currencyPrefix)}
              </div>
            </div>
          );
        })}

        {/* Lined Blank Rows (filling to minRows, matching reference image rows 3 through 9) */}
        {Array.from({ length: blankRowsCount }).map((_, idx) => {
          const rowNum = actualItems.length + idx + 1;
          return (
            <div
              key={`blank-${idx}`}
              className={`grid grid-cols-12 border-b ${borderClass} text-[13px] flex-1`}
              style={{ minHeight: '38px' }}
            >
              <div className={`col-span-1 py-1 px-1 text-center font-bold border-r ${borderClass} self-stretch flex items-center justify-center`}>
                {rowNum}
              </div>
              <div className={`col-span-1 py-1 px-1 border-r ${borderClass} self-stretch`}>&nbsp;</div>
              <div className={`col-span-5 py-1 px-2 border-r ${borderClass} self-stretch`}>&nbsp;</div>
              <div className={`col-span-2 py-1 px-1 border-r ${borderClass} self-stretch`}>&nbsp;</div>
              <div className="col-span-3 py-1 px-1 self-stretch">&nbsp;</div>
            </div>
          );
        })}

        {/* 4. TOTALS SECTION */}
        {/* Subtotal Row */}
        <div className={`grid grid-cols-12 border-b ${borderClass} text-[13px]`}>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-5 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-2 py-1.5 px-2 text-right font-bold uppercase border-r ${borderClass}`}>
            SUBTOTAL
          </div>
          <div className="col-span-3 py-1.5 px-2 text-right font-bold whitespace-nowrap">
            {formatINR(totals.subtotal, currencyPrefix)}
          </div>
        </div>

        {/* Discount Row */}
        <div className={`grid grid-cols-12 border-b ${borderClass} text-[13px]`}>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-5 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-2 py-1.5 px-2 text-right font-bold uppercase border-r ${borderClass}`}>
            DISCOUNT {totals.discountType === 'percentage' && totals.discountValue > 0 ? `(${totals.discountValue}%)` : ''}
          </div>
          <div className="col-span-3 py-1.5 px-2 text-right font-bold whitespace-nowrap">
            {totals.discountAmount > 0 ? formatINR(totals.discountAmount, currencyPrefix) : 'Rs 00'}
          </div>
        </div>

        {/* Shipping / Sipping Row */}
        <div className={`grid grid-cols-12 border-b ${borderClass} text-[13px]`}>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-5 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-2 py-1.5 px-2 text-right font-bold uppercase border-r ${borderClass}`}>
            SHIPPING CHG
          </div>
          <div className="col-span-3 py-1.5 px-2 text-right font-bold whitespace-nowrap">
            {totals.shippingCharges > 0 ? formatINR(totals.shippingCharges, currencyPrefix) : 'Rs 00'}
          </div>
        </div>

        {/* Tax / GST Row */}
        <div className={`grid grid-cols-12 border-b ${borderClass} text-[13px]`}>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-5 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-2 py-1.5 px-2 text-right font-bold uppercase border-r ${borderClass}`}>
            {totals.taxMode === 'NONE'
              ? 'TAX (0%)'
              : totals.isInterState
              ? `IGST (${totals.taxRate}%)`
              : `GST (${totals.taxRate}%)`}
          </div>
          <div className="col-span-3 py-1.5 px-2 text-right font-bold whitespace-nowrap">
            {totals.totalTax > 0 ? formatINR(totals.totalTax, currencyPrefix) : 'Rs 00'}
          </div>
        </div>

        {/* Grand Total Row */}
        <div className={`grid grid-cols-12 text-[14px]`}>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-1 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-5 border-r ${borderClass}`}>&nbsp;</div>
          <div className={`col-span-2 py-2 px-2 text-right font-black uppercase border-r ${borderClass}`}>
            TOTAL
          </div>
          <div className="col-span-3 py-2 px-2 text-right font-black text-[15px] whitespace-nowrap">
            {formatINR(totals.grandTotal, currencyPrefix)}
          </div>
        </div>
      </div>

      {/* 5. FOOTER: SCRIPT THANK YOU MATCHING REFERENCE */}
      <div className="mt-5 pt-3 print:mt-3 print:pt-1">
        {/* Elegant cursive "Thank you for your business" matching the reference image */}
        <div className="text-left select-none">
          <span className="font-script text-3xl md:text-4xl print:text-3xl italic tracking-wide inline-block opacity-95">
            Thank you for your business
          </span>
        </div>
      </div>
    </div>
  );
};
