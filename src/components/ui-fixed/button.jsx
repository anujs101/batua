import React from 'react';

export function Button({ children, className = "", onClick, disabled, ...props }) {
  return (
    <button
      className={`px-4 py-2.5 rounded-md font-medium text-sm transition-colors ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button; 