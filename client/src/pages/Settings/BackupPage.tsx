import { useState } from 'react'

const initialBackups = [
  { id: 1, date: '2026-05-20 03:00', size: '128 MB', type: 'Auto', status: 'success' },
  { id: 2, date: '2026-05-19 03:00', size: '126 MB', type: 'Auto', status: 'success' },
  { id: 3, date: '2026-05-18 03:00', size: '125 MB', type: 'Auto', status: 'success' },
  { id: 4, date: '2026-05-17 14:30', size: '124 MB', type: 'Manual', status: 'success' },
  { id: 5, date: '2026-05-16 03:00', size: '124 MB', type: 'Auto', status: 'success' },
  { id: 6, date: '2026-05-15 03:00', size: '123 MB', type: 'Auto', status: 'failed' },
]

export default function BackupPage() {
  const [backups, setBackups] = useState(initialBackups)
  const [creating, setCreating] = useState(false)
  const [schedule, setSchedule] = useState({
    enabled: true,
    frequency: 'daily',
    time: '03:00',
    retention: 7,
  })

  const handleCreateBackup = () => {
    setCreating(true)
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        size: `${Math.floor(120 + Math.random() * 20)} MB`,
        type: 'Manual',
        status: 'success',
      }
      setBackups((prev) => [newBackup, ...prev])
      setCreating(false)
    }, 2000)
  }

  const handleRestore = (id) => {
    const confirmed = window.confirm('Are you sure you want to restore this backup? Current data will be replaced.')
    if (confirmed) {
      console.log('Restoring backup:', id)
    }
  }

  const handleDownload = (id) => {
    console.log('Downloading backup:', id)
  }

  const inputClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Backup</h2>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? 'Creating Backup...' : 'Create Backup Now'}
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Backup History</h3>
          <span className="text-xs text-gray-400">{backups.length} backups</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Size</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{b.date}</td>
                <td className="px-4 py-3 text-gray-700">{b.size}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.type === 'Auto' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {b.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {b.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleRestore(b.id)}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDownload(b.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Backup Schedule</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={() => setSchedule((p) => ({ ...p, enabled: !p.enabled }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable automatic backups</span>
          </label>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${schedule.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className={labelClass}>Frequency</label>
              <select
                className={inputClass}
                value={schedule.frequency}
                onChange={(e) => setSchedule((p) => ({ ...p, frequency: e.target.value }))}
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                className={inputClass}
                value={schedule.time}
                onChange={(e) => setSchedule((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Retention (days)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={schedule.retention}
                onChange={(e) => setSchedule((p) => ({ ...p, retention: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
