import { useEffect, useCallback } from 'react'
import { getSocket, connectSocket, joinBusiness } from '../socket/socketClient'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export function useRealtime(event?: string, handler?: (data: any) => void) {
  const businessId = useAuthStore(s => s.user?.businessId)

  useEffect(() => {
    if (!businessId) return
    const socket = connectSocket()
    socket.on('connect', () => joinBusiness(businessId))
    if (event && handler) socket.on(event, handler)
    return () => { if (event && handler) socket.off(event, handler) }
  }, [businessId, event])

  return { socket: getSocket() }
}

export function useOrderNotifications() {
  useRealtime('order:incoming', (data) => toast.success(`طلب جديد #${data.orderNumber}`))
  useRealtime('order:updated', (data) => toast(`تم تحديث الطلب #${data.orderNumber}`, { icon: '📋' }))
  useRealtime('waiter:called', (data) => toast(`طلب خدمة من طاولة ${data.tableNumber}`, { icon: '🔔' }))
  useRealtime('delivery:new', (data) => toast(`توصيل جديد: ${data.customerName}`, { icon: '🚚' }))
  useRealtime('subscription:payment_failed', () => toast.error('فشلت عملية الدفع للاشتراك'))
}
