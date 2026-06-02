export interface BankInfo {
  bankName: string
  accountNumber: string
  rib: string
}

export interface Employee {
  id: string
  name: string
  phone: string
  role: string
  department?: string
  salary: number
  contractType: 'cdi' | 'cdd' | 'freelance' | 'trainee'
  bankInfo?: BankInfo
  cnasNumber?: string
  bonuses?: number
  annualLeaveBalance?: number
  active: boolean
  hiredAt: string
}

export interface Payroll {
  id: string
  employeeId: string
  month: number
  year: number
  baseSalary: number
  bonuses?: number
  deductions?: number
  netSalary: number
  paidAt?: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'other'
  startDate: string
  endDate: string
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
}
