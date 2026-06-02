import { useState, useEffect, useCallback } from 'react'
import { Save, Plus, Sun, Moon } from 'lucide-react'
import { getEmployees } from '../../services/hrService'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHIFTS = [
  { id: 'morning', label: 'Morning', start: '06:00', end: '14:00', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'afternoon', label: 'Afternoon', start: '14:00', end: '22:00', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'night', label: 'Night', start: '22:00', end: '06:00', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
]

const SchedulePage = () => {
  const [employees, setEmployees] = useState([])
  const [schedule, setSchedule] = useState({})
  const [loading, setLoading] = useState(true)
  const [dragShift, setDragShift] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEmployees({ status: 'active' })
      setEmployees(res.data || [])
    } catch (err) {
      console.error('Failed to load employees', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDrop = (employeeId, day) => {
    if (!dragShift) return
    setSchedule(prev => ({
      ...prev,
      [`${employeeId}-${day}`]: dragShift,
    }))
    setDragShift(null)
  }

  const clearShift = (employeeId, day) => {
    const key = `${employeeId}-${day}`
    setSchedule(prev => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  const getShiftColor = (employeeId, day) => {
    const shiftId = schedule[`${employeeId}-${day}`]
    const shift = SHIFTS.find(s => s.id === shiftId)
    return shift ? shift.color : ''
  }

  if (loading) {
    return <div className="text-gray-400">Loading schedule...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Weekly Schedule</h2>
          <div className="flex gap-2">
            {SHIFTS.map(shift => (
              <div
                key={shift.id}
                draggable
                onDragStart={() => setDragShift(shift.id)}
                className={`px-3 py-1 rounded-lg text-xs cursor-grab border ${shift.color} flex items-center gap-1`}
              >
                {shift.id === 'morning' ? <Sun className="w-3 h-3" /> :
                 shift.id === 'night' ? <Moon className="w-3 h-3" /> : null}
                {shift.label} ({shift.start}–{shift.end})
              </div>
            ))}
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-sm font-medium transition-colors">
          <Save className="w-4 h-4" /> Save Schedule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900/80 border border-gray-800 sticky left-0 z-10 min-w-[140px]">
                Employee
              </th>
              {DAYS.map(day => (
                <th key={day} className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-900/80 border border-gray-800 min-w-[100px]">
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-800/40">
                <td className="px-3 py-2 border border-gray-800 text-gray-200 font-medium sticky left-0 bg-gray-900/90">
                  {emp.name}
                </td>
                {DAYS.map(day => {
                  const key = `${emp.id}-${day}`
                  const shiftId = schedule[key]
                  const shift = SHIFTS.find(s => s.id === shiftId)
                  return (
                    <td
                      key={day}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(emp.id, day)}
                      onClick={() => shiftId ? clearShift(emp.id, day) : null}
                      className={`px-3 py-2 border border-gray-800 text-center cursor-pointer transition-colors min-h-[40px] ${shift ? shift.color : 'hover:bg-gray-700/40'}`}
                    >
                      {shift ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium">{shift.label}</span>
                          <span className="text-[10px] opacity-70">{shift.start}–{shift.end}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No active employees found. Add employees to create schedules.
        </div>
      )}
    </div>
  )
}

export default SchedulePage
