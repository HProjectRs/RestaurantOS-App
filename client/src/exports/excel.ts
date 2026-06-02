export function exportToExcel(data, columns, filename = 'export.xlsx') {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  const headers = columns || Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header] ?? '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateWorkbook(sheets) {
  const workbook = [];

  for (const [name, data] of Object.entries<any[]>(sheets)) {
    if (data && data.length) {
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => row[h] ?? ''));
      workbook.push({ name, headers, rows });
    }
  }

  const csvParts = [];
  for (const sheet of workbook) {
    csvParts.push(`Sheet: ${sheet.name}`);
    csvParts.push(sheet.headers.join(','));
    for (const row of sheet.rows) {
      const escaped = row.map((v) => {
        const str = String(v ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvParts.push(escaped.join(','));
    }
    csvParts.push('');
  }

  const csvString = csvParts.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  return blob;
}
