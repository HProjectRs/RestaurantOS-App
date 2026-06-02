export function formatReceipt(data, width = '80mm') {
  const { restaurant, items, totals, orderId, date, customer } = data;

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="text-align:right">${item.name}</td>
          <td style="text-align:center">${item.qty}</td>
          <td style="text-align:left">${totals.currency} ${(item.price * item.qty).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="utf-8" />
      <style>
        @page { margin: 0; size: ${width}; }
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 2px; }
        .center { text-align: center; }
        .right { text-align: right; }
        .left { text-align: left; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        .bold { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin:0">${restaurant}</h2>
        <p style="margin:2px 0">فاتورة رقم: ${orderId}</p>
        <p style="margin:2px 0">${date}</p>
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr>
            <th style="text-align:right">الصنف</th>
            <th style="text-align:center">العدد</th>
            <th style="text-align:left">المجموع</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td style="text-align:right">المجموع</td><td style="text-align:left">${totals.currency} ${totals.subtotal.toFixed(2)}</td></tr>
        <tr><td style="text-align:right">الضريبة</td><td style="text-align:left">${totals.currency} ${totals.tax.toFixed(2)}</td></tr>
        <tr class="bold"><td style="text-align:right">الإجمالي</td><td style="text-align:left">${totals.currency} ${totals.total.toFixed(2)}</td></tr>
      </table>
      <div class="divider"></div>
      <p class="center">شكراً لزيارتكم</p>
    </body>
    </html>
  `;
}

export function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=300,height=600');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
