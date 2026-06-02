import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'
import { toast } from 'react-hot-toast'
import { ROUTES } from '../../constants/routes'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setBusiness, setTokens } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await authService.login(email, password)
      setTokens(res.token, res.refreshToken)
      setUser(res.user); setBusiness(res.business)
      toast.success('تم تسجيل الدخول')
      navigate(ROUTES.DASHBOARD)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل تسجيل الدخول')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-amber-400">RestaurantOS</h1>
          <p className="text-gray-500 text-sm">نظام إدارة المطاعم</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <Input label="البريد الإلكتروني" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cafe.com" required />
          <Input label="كلمة المرور" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          <Button type="submit" loading={loading} className="w-full">تسجيل الدخول</Button>
        </form>
      </div>
    </div>
  )
}
