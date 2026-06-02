const PageWrapper = ({ title, children, className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export default PageWrapper
