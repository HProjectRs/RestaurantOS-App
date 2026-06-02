import { apiGet, apiPost, apiPut, apiDelete } from './httpClient'
import { API } from '../config/api'
import { User, Shift, Attendance } from '../types'

export const employeeService = {
  list: () => apiGet<User[]>(API.EMPLOYEES.BASE),
  create: (data: any) => apiPost<User>(API.EMPLOYEES.BASE, data),
  update: (id: string, data: any) => apiPut<User>(`${API.EMPLOYEES.BASE}/${id}`, data),
  delete: (id: string) => apiDelete(`${API.EMPLOYEES.BASE}/${id}`),
  updateSalary: (id: string, data: { salary?: number; salaryPeriod?: string }) =>
    apiPut(`${API.EMPLOYEES.BASE}/${id}/salary`, data),
  getPayroll: () => apiGet<any[]>(API.EMPLOYEES.PAYROLL),
  clockIn: () => apiPost<Attendance>(API.EMPLOYEES.CLOCK_IN),
  clockOut: () => apiPost<Attendance>(API.EMPLOYEES.CLOCK_OUT),
  getAttendance: (params?: { from?: string; to?: string; userId?: string }) =>
    apiGet<Attendance[]>(API.EMPLOYEES.ATTENDANCE, params),
  getShifts: () => apiGet<Shift[]>(API.EMPLOYEES.SHIFTS),
  createShift: (data: any) => apiPost<Shift>(API.EMPLOYEES.SHIFTS, data),
  updateShift: (id: string, data: any) =>
    apiPut<Shift>(`${API.EMPLOYEES.SHIFTS}/${id}`, data),
  deleteShift: (id: string) => apiDelete(`${API.EMPLOYEES.SHIFTS}/${id}`),
}
