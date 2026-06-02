import { useState, useEffect } from 'react'
import httpClient from '../../services/base/httpClient'

interface Subscription {
  id: string
  plan: string
  status: string
  trialEndsAt?: string
  currentPeriodEnd?: string
  maxUsers: number
  maxBranches: number
  features: string[]
}

interface Plan {
  name: string
  label: string
  labelAr: string
  price: number
  maxUsers: number
  maxBranches: number
  features: string[]
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      httpClient.get('/api/subscriptions/current'),
      httpClient.get('/api/subscriptions/plans'),
    ]).then(([subRes, plansRes]) => {
      setSubscription(subRes.data)
      setPlans(plansRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    PAST_DUE: 'bg-red-100 text-red-800',
    CANCELED: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Active',
    TRIALING: 'Trial',
    PAST_DUE: 'Payment Failed',
    CANCELED: 'Canceled',
    EXPIRED: 'Expired',
  }

  const planLabels: Record<string, string> = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Professional',
    ENTERPRISE: 'Enterprise',
  }

  async function handleCreateCheckout(priceId: string) {
    try {
      const res = await httpClient.post('/api/subscriptions/create-checkout', {
        priceId,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      })
      window.location.href = res.data.url
    } catch (err) {
      alert('Failed to create checkout session')
    }
  }

  async function handleManageBilling() {
    try {
      const res = await httpClient.post('/api/subscriptions/portal', {
        returnUrl: window.location.href,
      })
      window.location.href = res.data.url
    } catch (err) {
      alert('Failed to open billing portal')
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure? Your subscription will be canceled at the end of the billing period.')) return
    try {
      await httpClient.post('/api/subscriptions/cancel')
      alert('Subscription canceled')
      window.location.reload()
    } catch (err) {
      alert('Failed to cancel subscription')
    }
  }

  const isPaid = subscription && subscription.plan !== 'FREE' && subscription.status === 'ACTIVE'

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Subscription & Billing</h2>
        {isPaid && (
          <button onClick={handleManageBilling} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Manage Billing
          </button>
        )}
      </div>

      {subscription && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {planLabels[subscription.plan] || subscription.plan} Plan
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {subscription.maxUsers} user{subscription.maxUsers > 1 ? 's' : ''} &bull; {subscription.maxBranches} branch{subscription.maxBranches > 1 ? 'es' : ''}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[subscription.status] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabels[subscription.status] || subscription.status}
            </span>
          </div>

          {subscription.currentPeriodEnd && (
            <p className="text-sm text-gray-500">
              {subscription.status === 'ACTIVE' ? 'Renews on' : 'Expired on'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {subscription.status === 'PAST_DUE' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Payment failed. Please update your payment method to continue using RestaurantOS.</p>
              <button onClick={handleManageBilling} className="mt-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                Update Payment Method
              </button>
            </div>
          )}

          {subscription.features?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Features</h4>
              <ul className="grid grid-cols-2 gap-1">
                {subscription.features.map((f, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {subscription.plan !== 'FREE' && subscription.status !== 'CANCELED' && subscription.status !== 'EXPIRED' && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button onClick={handleCancel} className="text-sm text-red-600 hover:text-red-700 font-medium">
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      )}

      {subscription && (subscription.plan === 'FREE' || subscription.status === 'EXPIRED' || subscription.status === 'CANCELED') && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.filter(p => p.name !== 'FREE').map((plan) => (
              <div key={plan.name} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                <h4 className="text-lg font-bold text-gray-900">{plan.label}</h4>
                <p className="text-sm text-gray-500 mb-2">{plan.labelAr}</p>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{plan.maxUsers} users &bull; {plan.maxBranches} branches</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCreateCheckout(plan.name)}
                  className="mt-6 w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Cards (Development)</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <p>4242 4242 4242 4242 &mdash; Success</p>
          <p>4000 0000 0000 0002 &mdash; Decline</p>
          <p>4000 0025 0000 3155 &mdash; 3D Secure</p>
        </div>
      </div>
    </div>
  )
}
