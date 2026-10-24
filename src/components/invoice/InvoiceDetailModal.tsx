import React, { useState } from 'react';
import { Invoice } from '../../types';
import { InvoicePreview } from './InvoicePreview';
import { downloadInvoicePDF, printInvoice } from '../../utils/pdfGenerator';
import {
  X,
  Printer,
  Download,
  FileEdit,
  Copy,
  Moon,
  Sun,
  CheckCircle2,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (invoiceId: string) => void;
  onDuplicate: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onMarkPaid,
}) => {
  if (!isOpen) return null;

  const [theme, setTheme] = useState<'charcoal' | 'white'>(invoice.theme || 'charcoal');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    setIsExporting(true);
    await downloadInvoicePDF('modal-invoice-preview', {
      fileName: `Invoice_${invoice.invoiceNumber}.pdf`,
      theme,
    });
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto modal-overlay-print">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 modal-box-print flex flex-col">
        {/* Modal Header (Hidden on print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-zinc-800 bg-zinc-950 gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Invoice #{invoice.invoiceNumber}
              </h2>
              <span
                className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : invoice.status === 'Unpaid'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-700/40 text-zinc-300 border border-zinc-700'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            {/* Close button on mobile top-right */}
            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme((prev) => (prev === 'charcoal' ? 'white' : 'charcoal'))}
              className="p-2 sm:px-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
              title="Switch theme"
            >
              {theme === 'charcoal' ? (
                <>
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="hidden md:inline">Charcoal</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">White</span>
                </>
              )}
            </button>

            {/* Print */}
            <button
              onClick={() => printInvoice('modal-invoice-preview')}
              className="p-2 sm:px-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-2.5 py-2 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? '...' : 'PDF'}</span>
            </button>

            {/* Mark as paid */}
            {invoice.status !== 'Paid' && (
              <button
                onClick={() => onMarkPaid(invoice.id)}
                className="px-2.5 py-2 sm:px-3 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden md:inline">Paid</span>
              </button>
            )}

            {/* Edit */}
            <button
              onClick={() => {
                onClose();
                onEdit(invoice.id);
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
              title="Edit"
            >
              <FileEdit className="w-4 h-4" />
            </button>

            {/* Duplicate */}
            <button
              onClick={() => {
                onClose();
                onDuplicate(invoice.id);
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Close button on desktop */}
            <button
              onClick={onClose}
              className="hidden sm:inline-flex p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Invoice Live View with Mobile Pan */}
        <div className="p-2 sm:p-6 max-h-[82vh] overflow-y-auto bg-zinc-950/60 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-2 pb-1 text-[11px] text-zinc-400 sm:hidden">
            <span>📱 Pan horizontally to inspect invoice</span>
          </div>
          <div className="w-full overflow-x-auto flex justify-start sm:justify-center p-1 sm:p-2 -webkit-overflow-scrolling-touch">
            <div className="min-w-[650px] sm:min-w-full max-w-[800px] mx-auto">
              <InvoicePreview id="modal-invoice-preview" invoice={invoice} theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
