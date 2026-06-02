import { useState } from 'react'

const integrations = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept credit card payments via Stripe',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', secret: false },
      { key: 'secretKey', label: 'Secret Key', type: 'password', secret: true },
    ],
    enabled: true,
  },
  {
    id: 'sms',
    name: 'SMS API',
    description: 'Send SMS notifications to customers',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', secret: true },
      { key: 'senderId', label: 'Sender ID', type: 'text', secret: false },
    ],
    enabled: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Order confirmations and marketing via WhatsApp',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', secret: false },
      { key: 'accessToken', label: 'Access Token', type: 'password', secret: true },
    ],
    enabled: false,
  },
  {
    id: 'social',
    name: 'Facebook / Instagram Ordering',
    description: 'Receive orders directly from Facebook and Instagram',
    fields: [
      { key: 'pageId', label: 'Facebook Page ID', type: 'text', secret: false },
      { key: 'appSecret', label: 'App Secret', type: 'password', secret: true },
    ],
    enabled: false,
  },
]

export default function IntegrationsPage() {
  const [config, setConfig] = useState(
    integrations.reduce((acc, int) => {
      acc[int.id] = { enabled: int.enabled, values: int.fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}) }
      return acc
    }, {})
  )

  const toggleEnabled = (id) => {
    setConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }))
  }

  const updateValue = (id, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], values: { ...prev[id].values, [key]: value } },
    }))
  }

  return (
    <div className="max-w-3xl space-y-6">
      {integrations.map((int) => {
        const cfg = config[int.id]
        return (
          <div key={int.id} className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{int.name}</h3>
                <p className="text-sm text-gray-500">{int.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={() => toggleEnabled(int.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className={`space-y-3 transition-all ${cfg.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
              {int.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={cfg.values[field.key]}
                    onChange={(e) => updateValue(int.id, field.key, e.target.value)}
                    placeholder={field.secret ? '••••••••' : `Enter ${field.label}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
