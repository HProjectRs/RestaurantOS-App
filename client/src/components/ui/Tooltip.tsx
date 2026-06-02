import { useState } from 'react'

const Tooltip = ({ text, children, position = 'top', delay = 200 }) => {
  const [visible, setVisible] = useState(false)
  let timer

  const show = () => {
    timer = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    clearTimeout(timer)
    setVisible(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div
          className={`absolute z-50 ${positions[position]} px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap`}
        >
          {text}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-1'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -ml-1'
                : 'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip
