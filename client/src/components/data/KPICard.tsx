type KPICardProps = { label?: any; value?: any; percentage?: number; progressColor?: string; comparisonText?: any; icon?: any }
const KPICard = ({ label, value, percentage, progressColor = 'bg-amber-500', comparisonText, icon: Icon }: KPICardProps) => {
  const clamped = Math.min(100, Math.max(0, percentage || 0))
  return (
    <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
      </div>
      <p className="text-2xl font-bold text-white mb-3">{value}</p>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-400">{clamped}%</span>
        {comparisonText && <span className={`text-xs ${percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>{comparisonText}</span>}
      </div>
    </div>
  )
}
export default KPICard
