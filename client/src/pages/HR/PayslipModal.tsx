import { useRef } from 'react'
import { X, Printer } from 'lucide-react'

const PayslipModal = ({ payslip, onClose }) => {
  const printRef = useRef(null)

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Payslip - ${payslip.employeeName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .total { font-weight: bold; border-top: 2px solid #333; }
        .header { text-align: center; margin-bottom: 32px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 4px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .grid div { padding: 8px 0; }
        .grid label { font-size: 12px; color: #666; display: block; }
        .grid span { font-size: 14px; font-weight: 500; }
        .net-salary { text-align: center; font-size: 28px; font-weight: bold; color: #059669; margin: 24px 0; }
      </style></head><body>
      <div class="header">
        <h1>PAYSLIP</h1>
        <p>Period: ${payslip.period || ''}</p>
      </div>
      <div class="grid">
        <div><label>Employee</label><span>${payslip.employeeName || ''}</span></div>
        <div><label>Department</label><span>${payslip.department || ''}</span></div>
        <div><label>Role</label><span>${payslip.role || ''}</span></div>
        <div><label>CNAS</label><span>${payslip.cnasNumber || ''}</span></div>
      </div>
      <table>
        <thead><tr><th>Earnings</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Base Salary</td><td style="text-align:right">${Number(payslip.baseSalary || 0).toLocaleString()} DZD</td></tr>
          <tr><td>Bonuses</td><td style="text-align:right">${Number(payslip.totalBonuses || 0).toLocaleString()} DZD</td></tr>
          <tr><td>Overtime</td><td style="text-align:right">${Number(payslip.overtime || 0).toLocaleString()} DZD</td></tr>
          <tr class="total"><td>Total Earnings</td><td style="text-align:right">${(Number(payslip.baseSalary || 0) + Number(payslip.totalBonuses || 0) + Number(payslip.overtime || 0)).toLocaleString()} DZD</td></tr>
        </tbody>
      </table>
      <table>
        <thead><tr><th>Deductions</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>CNAS (9%)</td><td style="text-align:right">${Number(payslip.cnas || 0).toLocaleString()} DZD</td></tr>
          <tr><td>IRG Tax</td><td style="text-align:right">${Number(payslip.irg || 0).toLocaleString()} DZD</td></tr>
          <tr><td>Absence</td><td style="text-align:right">${Number(payslip.absenceDeduction || 0).toLocaleString()} DZD</td></tr>
          <tr><td>Insurance</td><td style="text-align:right">${Number(payslip.insurance || 0).toLocaleString()} DZD</td></tr>
          <tr class="total"><td>Total Deductions</td><td style="text-align:right">${Number(payslip.deductions || 0).toLocaleString()} DZD</td></tr>
        </tbody>
      </table>
      <div class="net-salary">Net Salary: ${Number(payslip.netSalary || 0).toLocaleString()} DZD</div>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  const earnings = (Number(payslip.baseSalary || 0) + Number(payslip.totalBonuses || 0) + Number(payslip.overtime || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Payslip</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="space-y-6" id="payslip-content">
          <div className="text-center pb-4 border-b border-gray-800">
            <h3 className="text-xl font-bold text-white">PAYSLIP</h3>
            <p className="text-sm text-gray-400">Period: {payslip.period || ''}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Employee', value: payslip.employeeName },
              { label: 'Department', value: payslip.department },
              { label: 'Role', value: payslip.role },
              { label: 'CNAS Number', value: payslip.cnasNumber },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="text-xs text-gray-500">{label}</label>
                <p className="text-sm text-gray-200 font-medium">{value || '—'}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Earnings</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400 font-medium">Description</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Base Salary', value: payslip.baseSalary },
                  { label: 'Bonuses', value: payslip.totalBonuses },
                  { label: 'Overtime', value: payslip.overtime },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-300">{label}</td>
                    <td className="py-2 text-right text-gray-200">{Number(value || 0).toLocaleString()} DZD</td>
                  </tr>
                ))}
                <tr className="font-semibold border-b border-gray-800">
                  <td className="py-2 text-gray-200">Total Earnings</td>
                  <td className="py-2 text-right text-green-400">{earnings.toLocaleString()} DZD</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Deductions</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-400 font-medium">Description</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'CNAS (9%)', value: payslip.cnas },
                  { label: 'IRG Tax', value: payslip.irg },
                  { label: 'Absence', value: payslip.absenceDeduction },
                  { label: 'Insurance', value: payslip.insurance },
                ].map(({ label, value }) => (
                  <tr key={label} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-300">{label}</td>
                    <td className="py-2 text-right text-gray-200">{Number(value || 0).toLocaleString()} DZD</td>
                  </tr>
                ))}
                <tr className="font-semibold border-b border-gray-800">
                  <td className="py-2 text-gray-200">Total Deductions</td>
                  <td className="py-2 text-right text-red-400">{Number(payslip.deductions || 0).toLocaleString()} DZD</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center py-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Net Salary</p>
            <p className="text-3xl font-bold text-emerald-400">
              {Number(payslip.netSalary || 0).toLocaleString()} DZD
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PayslipModal
