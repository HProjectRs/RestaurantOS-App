import { useState } from 'react'

const modules = [
  'POS',
  'Orders',
  'Menu',
  'Tables',
  'Inventory',
  'Recipes',
  'Suppliers',
  'HR',
  'Accounting',
  'CRM',
  'Delivery',
  'Reports',
  'Settings',
]

const actions = ['view', 'create', 'edit', 'delete', 'export']

const roleLabels = ['Admin', 'Manager', 'Cashier', 'Waiter', 'Chef']

const defaultPermissions = {
  Admin: modules.reduce((acc, m) => ({ ...acc, [m]: actions.reduce((a, act) => ({ ...a, [act]: true }), {}) }), {}),
  Manager: modules.reduce((acc, m) => ({ ...acc, [m]: actions.reduce((a, act) => ({ ...a, [act]: m === 'Settings' ? false : true }), {}) }), {}),
  Cashier: modules.reduce((acc, m) => ({ ...acc, [m]: { view: ['POS', 'Orders'].includes(m), create: m === 'POS', edit: false, delete: false, export: false } }), {}),
  Waiter: modules.reduce((acc, m) => ({ ...acc, [m]: { view: m === 'Orders' || m === 'Menu' || m === 'Tables', create: m === 'Orders', edit: false, delete: false, export: false } }), {}),
  Chef: modules.reduce((acc, m) => ({ ...acc, [m]: { view: m === 'Orders' || m === 'Menu' || m === 'Inventory' || m === 'Recipes', create: false, edit: m === 'Recipes', delete: false, export: false } }), {}),
}

export default function RolesPage() {
  const [permissions, setPermissions] = useState(defaultPermissions)
  const [selectedRole, setSelectedRole] = useState('Admin')

  const togglePermission = (module, action) => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [module]: {
          ...prev[selectedRole][module],
          [action]: !prev[selectedRole][module][action],
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {roleLabels.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRole === role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[120px]">Module</th>
              {actions.map((action) => (
                <th key={action} className="text-center px-3 py-3 font-medium text-gray-500 capitalize min-w-[72px]">
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{module}</td>
                {actions.map((action) => {
                  const checked = permissions[selectedRole]?.[module]?.[action] ?? false
                  return (
                    <td key={action} className="px-3 py-3 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(module, action)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </label>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
