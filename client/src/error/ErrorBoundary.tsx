import { Component, ReactNode, ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary caught:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">حدث خطأ</h1>
            <p className="text-gray-400 text-sm">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-amber-500 text-black rounded-xl font-medium">
              إعادة تحميل
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
