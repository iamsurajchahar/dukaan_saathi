import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { reportService } from '../services/report.service';

export const reportController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, format = 'csv' } = req.body;

      if (!type) {
        res.status(400).json({ success: false, error: 'Report type is required' });
        return;
      }

      const { rows, filename } = await reportService.generate(req.storeId!, type, format);

      if (rows.length === 0) {
        res.status(200).json({ success: true, data: 'No data available for this report' });
        return;
      }

      if (format === 'csv') {
        const csv = rowsToCsv(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      } else if (format === 'pdf') {
        const titleMap: Record<string, string> = {
          inventory_valuation: 'Inventory Valuation Report',
          sales_trend: 'Sales Trend Report',
          forecast_accuracy: 'Forecast Accuracy Report',
        };
        const title = titleMap[type] || 'Report';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

        generatePdf(res, title, rows);
      } else {
        res.status(400).json({ success: false, error: 'Unsupported format. Use csv or pdf.' });
      }
    } catch (error) {
      next(error);
    }
  },
};

function rowsToCsv(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

function generatePdf(res: Response, title: string, rows: Record<string, any>[]) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  doc.pipe(res);

  const headers = Object.keys(rows[0]);

  // Title
  doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').fillColor('#666666')
    .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1);

  // Calculate column widths
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = Math.min(pageWidth / headers.length, 120);
  const tableWidth = colWidth * headers.length;
  const startX = doc.page.margins.left + (pageWidth - tableWidth) / 2;

  // Table header
  const headerY = doc.y;
  doc.rect(startX, headerY, tableWidth, 20).fill('#2563eb');

  headers.forEach((h, i) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
      .text(h, startX + i * colWidth + 4, headerY + 5, {
        width: colWidth - 8,
        height: 14,
        ellipsis: true,
      });
  });

  doc.y = headerY + 22;

  // Table rows
  rows.forEach((row, rowIdx) => {
    // Check if we need a new page
    if (doc.y > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
    }

    const rowY = doc.y;
    const bgColor = rowIdx % 2 === 0 ? '#f9fafb' : '#ffffff';

    // Check if this is a "total" or separator row
    const isTotal = Object.values(row).some((v) => typeof v === 'string' && v === 'TOTAL');

    if (isTotal) {
      doc.rect(startX, rowY, tableWidth, 18).fill('#e5e7eb');
    } else {
      doc.rect(startX, rowY, tableWidth, 18).fill(bgColor);
    }

    headers.forEach((h, i) => {
      const val = row[h];
      const displayVal = val === 0 ? '0' : val || '';
      const fontName = isTotal ? 'Helvetica-Bold' : 'Helvetica';

      doc.fontSize(7).font(fontName).fillColor('#1f2937')
        .text(String(displayVal), startX + i * colWidth + 4, rowY + 4, {
          width: colWidth - 8,
          height: 12,
          ellipsis: true,
        });
    });

    doc.y = rowY + 18;
  });

  // Footer
  doc.moveDown(1);
  doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
    .text('DukaanSathi - Smart Inventory for Your Store', { align: 'center' });

  doc.end();
}
