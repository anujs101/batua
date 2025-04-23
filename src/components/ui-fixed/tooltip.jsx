import React, { useState } from "react";

export function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 whitespace-nowrap">
          {content}
          <div className="absolute w-2 h-2 rotate-45 bg-black bottom-[-4px] left-1/2 transform -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
}

export default Tooltip; 