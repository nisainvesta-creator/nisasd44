import React from 'react';

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ children, className = '', ...rest }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${className}`} {...rest}>{children}</span>
);

export default Badge;
