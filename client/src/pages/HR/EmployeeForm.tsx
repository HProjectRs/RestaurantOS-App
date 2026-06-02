import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createEmployee, updateEmployee } from '../../services/hrService'

const defaultBonuses = {
  experience: 0, position: 0, performance: 0,
  transport: 0, housing: 0, nightShift: 0,
}

const EmployeeForm = ({ employee, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', role: '', department: '',
    salary: '', contractType: 'CDI',
    bankName: '', bankAccount: '', cnasNumber: '',
    bonuses: { ...defaultBonuses },
    leaveBalance: 21,
    status: 'active',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        phone: employee.phone || '',
        email: employee.email || '',
        role: employee.role || '',
        department: employee.department || '',
        salary: employee.salary || '',
        contractType: employee.contractType || 'CDI',
        bankName: employee.bankName || '',
        bankAccount: employee.bankAccount || '',
        cnasNumber: employee.cnasNumber || '',
        bonuses: { ...defaultBonuses, ...(employee.bonuses || {}) },
        leaveBalance: employee.leaveBalance ?? 21,
        status: employee.status || 'active',
      })
    }
  }, [employee])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBonusChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      bonuses: { ...prev.bonuses, [field]: Number(value) || 0 }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (employee) {
        await updateEmployee(employee.id, form)
      } else {
        await createEmployee(form)
      }
      onSaved()
    } catch (err) {
      console.error('Failed to save employee', err)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
  const labelClass = "block text-sm font-medium text-gray-300 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input type="text" value={form.role} onChange={(e) => handleChange('role', e.target.value)}
                className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input type="text" value={form.department} onChange={(e) => handleChange('department', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Salary (DZD)</label>
              <input type="number" value={form.salary} onChange={(e) => handleChange('salary', e.target.value)}
                className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Contract Type</label>
              <select value={form.contractType} onChange={(e) => handleChange('contractType', e.target.value)}
                className={inputClass}>
                <option value="CDI">CDI (Permanent)</option>
                <option value="CDD">CDD (Fixed Term)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Leave Balance (days)</label>
              <input type="number" value={form.leaveBalance}
                onChange={(e) => handleChange('leaveBalance', Number(e.target.value))}
                className={inputClass} />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Bank Name</label>
                <input type="text" value={form.bankName} onChange={(e) => handleChange('bankName', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input type="text" value={form.bankAccount} onChange={(e) => handleChange('bankAccount', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>CNAS Number</label>
                <input type="text" value={form.cnasNumber} onChange={(e) => handleChange('cnasNumber', e.target.value)}
                  className={inputClass} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Bonuses</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'experience', label: 'Experience' },
                { key: 'position', label: 'Position' },
                { key: 'performance', label: 'Performance' },
                { key: 'transport', label: 'Transport' },
                { key: 'housing', label: 'Housing' },
                { key: 'nightShift', label: 'Night Shift' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input type="number" value={form.bonuses[key]}
                    onChange={(e) => handleBonusChange(key, e.target.value)}
                    className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : employee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EmployeeForm
