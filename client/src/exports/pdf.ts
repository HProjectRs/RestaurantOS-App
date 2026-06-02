export function exportToPDF(element, filename = 'document.pdf') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Popup blocked. Please allow popups for this site.');
    return;
  }

  const content = element.innerHTML || element.outerHTML || element;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f4f4f4; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

export function generateReport(title, data, format = 'table') {
  let html = `<h1>${title}</h1>`;
  html += `<p>Generated: ${new Date().toLocaleString()}</p>`;

  if (format === 'table' && data && data.length) {
    const headers = Object.keys(data[0]);
    html += '<table><thead><tr>';
    html += headers.map((h) => `<th>${h}</th>`).join('');
    html += '</tr></thead><tbody>';

    for (const row of data) {
      html += '<tr>';
      html += headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('');
      html += '</tr>';
    }

    html += '</tbody></table>';
  } else if (data && typeof data === 'object') {
    html += '<ul>';
    for (const [key, value] of Object.entries(data)) {
      html += `<li><strong>${key}:</strong> ${value}</li>`;
    }
    html += '</ul>';
  }

  return html;
}
