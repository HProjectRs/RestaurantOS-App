import { Inbox, LucideIcon } from 'lucide-react'
type EmptyStateProps = { icon?: LucideIcon; title?: any; description?: any; action?: any; actionText?: any }
const EmptyState = ({ icon: Icon = Inbox, title, description, action, actionText }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-800 mb-4"><Icon className="w-10 h-10 text-gray-500" /></div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 text-center max-w-sm mb-6">{description}</p>}
      {action && actionText && (
        <button onClick={action} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-lg transition-colors">{actionText}</button>
      )}
    </div>
  )
}
export default EmptyState
