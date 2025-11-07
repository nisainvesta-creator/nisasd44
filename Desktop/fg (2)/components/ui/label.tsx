import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, className = '', ...rest }) => {
  return (
    <label className={`text-sm font-medium text-gray-700 ${className}`} {...rest}>
      {children}
    </label>
  );
};

export default Label;
