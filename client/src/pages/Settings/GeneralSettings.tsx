import { useState } from 'react'

export default function GeneralSettings() {
  const [form, setForm] = useState({
    nameAr: 'مطعم السلام',
    nameEn: 'El Salam Restaurant',
    currency: 'DZD',
    taxRate: 19,
    defaultLanguage: 'ar',
    address: '15 Rue Didouche Mourad, Alger',
    phone: '+213 21 63 12 45',
    email: 'contact@elsalam.dz',
  })

  const [logo, setLogo] = useState(null)

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogo(URL.createObjectURL(file))
    }
  }

  const handleSave = () => {
    console.log('Saving settings:', form)
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name (Arabic)</label>
            <input
              className={inputClass}
              value={form.nameAr}
              onChange={handleChange('nameAr')}
              dir="rtl"
            />
          </div>
          <div>
            <label className={labelClass}>Name (English)</label>
            <input
              className={inputClass}
              value={form.nameEn}
              onChange={handleChange('nameEn')}
            />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select className={inputClass} value={form.currency} onChange={handleChange('currency')}>
              <option value="DZD">DZD - Algerian Dinar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tax Rate (TVA) %</label>
            <input
              type="number"
              className={inputClass}
              value={form.taxRate}
              onChange={handleChange('taxRate')}
            />
          </div>
          <div>
            <label className={labelClass}>Default Language</label>
            <select className={inputClass} value={form.defaultLanguage} onChange={handleChange('defaultLanguage')}>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.phone} onChange={handleChange('phone')} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={form.email} onChange={handleChange('email')} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={handleChange('address')} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
        <div className="flex items-center gap-4">
          {logo && (
            <img src={logo} alt="Logo preview" className="w-20 h-20 object-contain border rounded-lg" />
          )}
          <div>
            <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-block">
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            <p className="text-xs text-gray-400 mt-1">PNG or JPG, max 2MB</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
