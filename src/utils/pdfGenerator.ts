import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PDFExportOptions {
  fileName?: string;
  theme?: 'charcoal' | 'white';
}

/**
 * Generates and downloads a high-fidelity PDF from an HTML element
 * accurately preserving exact fonts, borders, dark charcoal theme, and table structure.
 */
export async function downloadInvoicePDF(
  elementId?: string,
  options: PDFExportOptions = {}
): Promise<boolean> {
  // Locate the target element or any available invoice element
  let rawElement: HTMLElement | null = null;
  if (elementId) {
    rawElement = document.getElementById(elementId);
  }
  if (!rawElement) {
    rawElement =
      document.getElementById('modal-invoice-preview') ||
      document.getElementById('invoice-preview-container') ||
      document.getElementById('invoice-editor-offscreen-preview') ||
      (document.querySelector('.invoice-printable') as HTMLElement);
  }

  if (!rawElement) {
    console.error(`Element "${elementId || '.invoice-printable'}" not found in DOM.`);
    return false;
  }

  // Ensure we capture the exact .invoice-printable sheet
  const element = (rawElement.classList?.contains('invoice-printable')
    ? rawElement
    : rawElement.querySelector('.invoice-printable') || rawElement) as HTMLElement;

  const fileName = options.fileName || `Invoice_${Date.now()}.pdf`;
  const isDark = options.theme !== 'white';

  try {
    // High-resolution canvas snapshot with html2canvas-pro supporting modern CSS (oklch, oklab, flex, etc.)
    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: isDark ? '#252525' : '#ffffff',
      onclone: (clonedDoc) => {
        const clonedPrintable = clonedDoc.querySelector('.invoice-printable') as HTMLElement;
        if (clonedPrintable) {
          clonedPrintable.style.width = '800px';
          clonedPrintable.style.maxWidth = '800px';
          clonedPrintable.style.minHeight = '1040px';
          clonedPrintable.style.margin = '0 auto';
          clonedPrintable.style.visibility = 'visible';
          clonedPrintable.style.display = 'flex';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate aspect ratio
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      // Fits on a single A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page split
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF with html2canvas-pro:', error);
    return false;
  }
}

/**
 * Prints the invoice cleanly using an isolated hidden iframe.
 * Guarantees zero blank pages, no UI headers or modals, and exact 1-page output.
 */
export function printInvoice(elementId?: string): void {
  // Find the invoice element to print
  let rawElement: HTMLElement | null = null;
  if (elementId) {
    rawElement = document.getElementById(elementId);
  }
  if (!rawElement) {
    rawElement =
      document.getElementById('modal-invoice-preview') ||
      document.getElementById('invoice-preview-container') ||
      document.getElementById('invoice-editor-offscreen-preview') ||
      (document.querySelector('.invoice-printable') as HTMLElement);
  }

  if (!rawElement) {
    window.print();
    return;
  }

  const element = (rawElement.classList?.contains('invoice-printable')
    ? rawElement
    : rawElement.querySelector('.invoice-printable') || rawElement) as HTMLElement;

  // Clone invoice node to keep live DOM intact
  const clone = element.cloneNode(true) as HTMLElement;

  // Collect all stylesheet links and embedded styles
  const stylesAndLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  // Create an invisible iframe for isolated printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Dancing+Script:wght@600;700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800&family=Playball&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${stylesAndLinks}
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 6mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-printable {
            width: 100% !important;
            max-width: 100% !important;
            height: 278mm !important;
            min-height: 278mm !important;
            max-height: 278mm !important;
            margin: 0 !important;
            padding: 16px 20px !important;
            box-shadow: none !important;
            border: 2px solid currentColor !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Give fonts and styles a brief moment to render in the iframe, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print error, falling back to window.print', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
}
