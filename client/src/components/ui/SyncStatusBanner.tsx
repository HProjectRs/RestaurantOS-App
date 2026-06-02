import { useSyncStore } from '../../store/syncStore'
import { Wifi, WifiOff, RefreshCw, AlertTriangle, X } from 'lucide-react'
import worker from '../../workers/syncWorker'

const SyncStatusBanner = () => {
  const { isOnline, pendingCount, failures, removeFailure } = useSyncStore()

  if (isOnline && pendingCount === 0 && failures.length === 0) return null

  return (
    <div className="space-y-2">
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/80 border border-yellow-700/50 text-yellow-200 text-sm rounded-lg">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span className="flex-1">أنت غير متصل بالإنترنت. سيتم مزامنة البيانات تلقائياً عند الاتصال.</span>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/80 border border-blue-700/50 text-blue-200 text-sm rounded-lg">
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
          <span className="flex-1">جاري المزامنة... ({pendingCount} عملية)</span>
        </div>
      )}

      {failures.map((f) => (
        <div key={f.id} className="flex items-center gap-2 px-4 py-2 bg-red-900/80 border border-red-700/50 text-red-200 text-sm rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">فشلت المزامنة: {f.error}</span>
          <button
            onClick={() => removeFailure(f.id)}
            className="shrink-0 p-0.5 rounded hover:bg-black/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default SyncStatusBanner
