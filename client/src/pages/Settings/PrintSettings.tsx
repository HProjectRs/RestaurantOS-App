import { useState } from 'react'

export default function PrintSettings() {
  const [settings, setSettings] = useState({
    printerType: 'thermal-80mm',
    receiptHeader: 'EL SALAM RESTAURANT\n15 Rue Didouche Mourad, Alger\nTel: +213 21 63 12 45',
    receiptFooter: 'Thank you for your visit!\nVeuillez patienter votre commande',
    autoPrintPayment: true,
    kitchenPrintOnOrder: true,
    copies: 1,
  })

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setSettings((p) => ({ ...p, [field]: value }))
  }

  const handleTestPrint = () => {
    console.log('Test print initiated with settings:', settings)
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Printer Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Printer Type</label>
            <select className={inputClass} value={settings.printerType} onChange={handleChange('printerType')}>
              <option value="thermal-58mm">Thermal 58mm</option>
              <option value="thermal-80mm">Thermal 80mm</option>
              <option value="a4">A4 Printer</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Number of Copies</label>
            <input
              type="number"
              min={1}
              max={5}
              className={inputClass}
              value={settings.copies}
              onChange={handleChange('copies')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Customization</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Receipt Header</label>
            <textarea
              rows={4}
              className={inputClass}
              value={settings.receiptHeader}
              onChange={handleChange('receiptHeader')}
            />
          </div>
          <div>
            <label className={labelClass}>Receipt Footer</label>
            <textarea
              rows={3}
              className={inputClass}
              value={settings.receiptFooter}
              onChange={handleChange('receiptFooter')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Print Triggers</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoPrintPayment}
              onChange={handleChange('autoPrintPayment')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-print receipt after payment</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.kitchenPrintOnOrder}
              onChange={handleChange('kitchenPrintOnOrder')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-print kitchen ticket when order is placed</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleTestPrint}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 mr-3"
        >
          Test Print
        </button>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  )
}
