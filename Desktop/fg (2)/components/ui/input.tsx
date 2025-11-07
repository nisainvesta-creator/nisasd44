import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...rest }) => {
  return <input className={`border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#07c160] ${className}`} {...rest} />;
};

export default Input;
