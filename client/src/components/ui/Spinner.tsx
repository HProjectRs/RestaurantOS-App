interface SpinnerProps { size?: number; className?: string }

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="border-2 border-amber-500 border-t-transparent rounded-full animate-spin" style={{ width: size, height: size }} />
    </div>
  )
}
