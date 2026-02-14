import ExcelJS from 'exceljs';

interface SheetData {
  name: string;
  data: Record<string, any>[];
}

/**
 * Create and download an Excel workbook with one or more sheets
 */
export async function exportToExcelFile(sheets: SheetData[], fileName: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    
    if (sheet.data.length === 0) continue;
    
    // Get headers from first object's keys
    const headers = Object.keys(sheet.data[0]);
    
    // Add header row with styling
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add data rows
    sheet.data.forEach(item => {
      const row = headers.map(header => item[header] ?? '');
      worksheet.addRow(row);
    });
    
    // Auto-fit columns (approximate)
    worksheet.columns.forEach((column, index) => {
      const header = headers[index];
      let maxLength = header.length;
      
      sheet.data.forEach(item => {
        const value = String(item[header] ?? '');
        if (value.length > maxLength) {
          maxLength = Math.min(value.length, 50); // Cap at 50
        }
      });
      
      column.width = maxLength + 2;
    });
  }
  
  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Simple single-sheet export helper
 */
export async function exportSingleSheet(
  data: Record<string, any>[], 
  sheetName: string, 
  fileName: string
): Promise<void> {
  return exportToExcelFile([{ name: sheetName, data }], fileName);
}
