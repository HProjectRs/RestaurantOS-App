import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Users, Shield, Printer, Link, Database, CreditCard } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAuthStore } from '../../stores/authStore'
import { subscriptionService } from '../../services/subscriptionService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { toast } from 'react-hot-toast'
import { formatDate } from '../../utils/formatters'

const tabs = [
  { key: 'general', label: 'عام', icon: SettingsIcon },
  { key: 'users', label: 'المستخدمين', icon: Users },
  { key: 'subscription', label: 'الباقة', icon: CreditCard },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { business, loading, fetch, update } = useSettingsStore()
  const { user } = useAuthStore()
  const [sub, setSub] = useState<any>(null)
  const [form, setForm] = useState({ name: '', nameAr: '', taxRate: '', serviceChargeRate: '', currency: 'SAR' })

  useEffect(() => {
    fetch()
    subscriptionService.getCurrent().then(setSub).catch(() => {})
  }, [])

  useEffect(() => {
    if (business) setForm({
      name: business.name || '',
      nameAr: business.nameAr || '',
      taxRate: String(business.taxRate || 0),
      serviceChargeRate: String(business.serviceChargeRate || 0),
      currency: business.currency || 'SAR',
    })
  }, [business])

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await update({ ...form, taxRate: Number(form.taxRate), serviceChargeRate: Number(form.serviceChargeRate) }); toast.success('تم الحفظ') }
    catch (err: any) { toast.error(err?.response?.data?.message || 'فشل الحفظ') }
  }

  const openPortal = async () => {
    try { const res = await subscriptionService.portal(window.location.href); window.open(res.url, '_blank') }
    catch { toast.error('فشل فتح بوابة الدفع') }
  }

  if (loading) return <Spinner className="py-20" />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">الإعدادات</h1>
      <div className="flex gap-1 p-1 bg-gray-900/80 border border-gray-800 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <form onSubmit={saveSettings} className="max-w-lg space-y-4 bg-gray-900/60 border border-gray-800 rounded-xl p-5">
          <Input label="اسم المطعم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="الاسم بالعربية" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="نسبة الضريبة (%)" type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
            <Input label="نسبة الخدمة (%)" type="number" value={form.serviceChargeRate} onChange={e => setForm(f => ({ ...f, serviceChargeRate: e.target.value }))} />
          </div>
          <Select label="العملة" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} options={[
            { value: 'SAR', label: 'ريال سعودي' }, { value: 'AED', label: 'درهم إماراتي' }, { value: 'EGP', label: 'جنيه مصري' }, { value: 'DZD', label: 'دينار جزائري' }, { value: 'USD', label: 'دولار' },
          ]} />
          <Button type="submit">حفظ الإعدادات</Button>
        </form>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 max-w-lg">
            <h2 className="font-bold mb-4">الباقة الحالية</h2>
            {sub ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">الباقة</span>
                  <Badge variant={sub.plan === 'FREE' ? 'default' : sub.plan === 'BASIC' ? 'info' : sub.plan === 'PRO' ? 'warning' : 'success'}>{sub.plan}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">الحالة</span>
                  <Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'PAST_DUE' ? 'danger' : 'warning'}>{sub.status === 'ACTIVE' ? 'نشط' : sub.status === 'PAST_DUE' ? 'متأخر' : sub.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">المستخدمون</span>
                  <span>{sub.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">الفروع</span>
                  <span>{sub.maxBranches}</span>
                </div>
                {sub.currentPeriodEnd && <div className="flex items-center justify-between"><span className="text-gray-400">تاريخ الانتهاء</span><span>{formatDate(sub.currentPeriodEnd)}</span></div>}
                {sub.plan !== 'FREE' && <Button onClick={openPortal} variant="outline" className="w-full">إدارة الدفع</Button>}
              </div>
            ) : <p className="text-gray-500 text-sm">لا توجد معلومات</p>}
          </div>
        </div>
      )}
    </div>
  )
}
