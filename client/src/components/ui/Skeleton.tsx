interface SkeletonProps { className?: string; count?: number; height?: number; rounded?: string }

export function Skeleton({ className = 'h-4 w-full', count = 1, height, rounded }: SkeletonProps) {
  const style = { ...(height ? { height } : {}), ...(rounded ? { borderRadius: rounded === 'xl' ? '0.75rem' : rounded === 'lg' ? '0.5rem' : '0.375rem' } : {}) }
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-800 rounded animate-pulse ${className}`} style={style} />
      ))}
    </>
  )
}
