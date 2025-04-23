"use client"

import { useState } from "react"

export function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)} // For mobile support
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg border border-gray-700 max-w-xs whitespace-normal left-1/2 transform -translate-x-1/2 mt-1">
          {content}
        </div>
      )}
    </div>
  )
}
