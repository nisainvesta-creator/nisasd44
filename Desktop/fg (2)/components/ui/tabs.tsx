import React from 'react';

export const Tabs: React.FC<React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (v: string) => void }> = ({ children }) => {
  return <div>{children}</div>;
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...rest }) => (
  <div className={`flex ${className}`} {...rest}>{children}</div>
);

export const TabsTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }> = ({ children, className = '', ...rest }) => (
  <button className={`px-3 py-2 text-sm rounded ${className}`} {...rest}>{children}</button>
);

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { value?: string }> = ({ children, className = '', ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

export default Tabs;
