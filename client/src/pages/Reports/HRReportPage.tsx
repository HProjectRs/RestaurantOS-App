import { useState } from 'react'

const salarySummary = {
  totalSalary: '4,850,000.00 DA',
  laborCostPercent: 32,
  overtimeCost: '420,000.00 DA',
  totalEmployees: 28,
}

const departmentCosts = [
  { dept: 'Kitchen', cost: '1,950,000 DA', headcount: 10, percent: 40 },
  { dept: 'Service', cost: '1,200,000 DA', headcount: 8, percent: 25 },
  { dept: 'Management', cost: '850,000 DA', headcount: 4, percent: 17 },
  { dept: 'Bar', cost: '500,000 DA', headcount: 3, percent: 10 },
  { dept: 'Cleaning', cost: '350,000 DA', headcount: 3, percent: 8 },
]

const attendanceData = {
  present: 24,
  absent: 2,
  onLeave: 2,
  late: 3,
}

const hiringStats = {
  hiredThisMonth: 2,
  leftThisMonth: 1,
  totalApplications: 12,
  avgTimeToHire: 14,
}

export default function HRReportPage() {
  const [period, setPeriod] = useState('month')

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-center gap-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Salary Cost</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{salarySummary.totalSalary}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Labor Cost % of Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{salarySummary.laborCostPercent}%</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${salarySummary.laborCostPercent}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Overtime Cost</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{salarySummary.overtimeCost}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{salarySummary.totalEmployees}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Department Cost Breakdown</h3>
          <div className="space-y-3">
            {departmentCosts.map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{d.dept} ({d.headcount})</span>
                  <span className="text-gray-500">{d.cost}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{attendanceData.present}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{attendanceData.absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{attendanceData.onLeave}</p>
                <p className="text-xs text-gray-500">On Leave</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{attendanceData.late}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Hiring / Leaving Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{hiringStats.hiredThisMonth}</p>
                <p className="text-xs text-gray-500">Hired This Month</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{hiringStats.leftThisMonth}</p>
                <p className="text-xs text-gray-500">Left This Month</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{hiringStats.totalApplications}</p>
                <p className="text-xs text-gray-500">Applications</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{hiringStats.avgTimeToHire}</p>
                <p className="text-xs text-gray-500">Avg Days to Hire</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
