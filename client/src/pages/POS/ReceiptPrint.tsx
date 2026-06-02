import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function ReceiptPrint({ order, restaurant }) {
  const printRef = useRef()
  const handlePrint = () => {
    const win = window.open('', '_blank')
    win.document.write(`<html><head><style>
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; text-align: center; direction: rtl; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { padding: 4px 2px; text-align: right; }
      .total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 5px; }
      .header { margin-bottom: 10px; }
      .header h2 { margin: 0; font-size: 16px; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
    </style></head><body>
      <div class="header"><h2>${restaurant?.name || 'مطعم'}</h2><p>${restaurant?.address || ''}<br>${restaurant?.phone || ''}</p></div>
      <div class="divider"></div>
      <p style="text-align:right;">فاتورة #${order?.orderNumber}<br>${new Date().toLocaleDateString('ar-DZ')} ${new Date().toLocaleTimeString('ar-DZ')}${order?.table ? '<br>طاولة: ' + order.table : ''}</p>
      <div class="divider"></div>
      <table><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th style="text-align:left;">السعر</th></tr>
      ${order?.items?.map(i => `<tr><td style="text-align:right;">${i.name}</td><td>${i.qty}</td><td style="text-align:left;">${(i.price * i.qty).toFixed(2)}</td></tr>`).join('')}
      </table>
      <div class="divider"></div>
      <div class="total"><p>المجموع: ${order?.total?.toFixed(2)} ${restaurant?.currency || 'DZD'}</p></div>
      <div class="divider"></div>
      <p style="font-size:10px;">شكراً لزيارتكم<br>نتمنى لكم يوماً سعيداً</p>
    </body></html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }
  return <Button variant="secondary" onClick={handlePrint}><Printer size={16} /> طباعة الفاتورة</Button>
}
