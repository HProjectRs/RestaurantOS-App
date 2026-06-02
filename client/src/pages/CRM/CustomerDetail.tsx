import { useState, useEffect } from 'react'
import { X, Phone, Mail, MapPin, Calendar, ShoppingBag, Award, TrendingUp } from 'lucide-react'
import { getCustomerById, getLoyaltyHistory } from '../../services/crmService'

const CustomerDetail = ({ customer, onClose }) => {
  const [detail, setDetail] = useState(null)
  const [loyaltyHistory, setLoyaltyHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true)
      try {
        const [detailRes, loyaltyRes] = await Promise.all([
          getCustomerById(customer.id),
          getLoyaltyHistory(customer.id),
        ])
        setDetail(detailRes.data)
        setLoyaltyHistory(loyaltyRes.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDetail()
  }, [customer.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Customer Details</h2>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Profile</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingBag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium">{detail.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-gray-200">{detail.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-200">{detail.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Address:</span>
                    <span className="text-gray-200">{detail.address || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Registered:</span>
                    <span className="text-gray-200">
                      {detail.createdAt ? new Date(detail.createdAt).toLocaleDateString('fr-DZ') : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Orders</p>
                    <p className="text-lg font-bold text-white">{detail.ordersCount || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Total Spent</p>
                    <p className="text-lg font-bold text-emerald-400">{Number(detail.totalSpent || 0).toLocaleString()} DZD</p>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Points</p>
                    <p className="text-lg font-bold text-amber-400">{detail.loyaltyPoints || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400">Tier</p>
                    <p className="text-lg font-bold uppercase text-purple-400">{detail.tier || 'standard'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Order History</h3>
              {detail.orders?.length > 0 ? (
                <div className="space-y-2">
                  {detail.orders.map((order, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-200">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('fr-DZ')}</p>
                      </div>
                      <span className="text-sm font-medium text-white">{Number(order.total).toLocaleString()} DZD</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Loyalty Points History</h3>
              {loyaltyHistory.length > 0 ? (
                <div className="space-y-2">
                  {loyaltyHistory.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Award className={`w-4 h-4 ${entry.type === 'earn' ? 'text-green-400' : 'text-red-400'}`} />
                        <div>
                          <p className="text-sm text-gray-200">{entry.reason || entry.type}</p>
                          <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('fr-DZ')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${entry.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.type === 'earn' ? '+' : '-'}{entry.points}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No points history</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Customer not found</div>
        )}
      </div>
    </div>
  )
}

export default CustomerDetail
