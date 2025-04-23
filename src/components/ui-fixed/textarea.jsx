import React from 'react';

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 border rounded-md text-sm resize-vertical ${className}`}
      {...props}
    />
  );
}

export default Textarea; 