
import React from 'react';
import { useError } from '../hooks/useError';
import { CloseIcon } from './Icons';

export const ErrorToast: React.FC = () => {
  const { error, clearError, success, clearSuccess } = useError();

  const toastData = error ? {
    message: error,
    onClose: clearError,
    bgColor: 'bg-red-600',
    hoverBgColor: 'hover:bg-red-700'
  } : success ? {
    message: success,
    onClose: clearSuccess,
    bgColor: 'bg-green-600',
    hoverBgColor: 'hover:bg-green-700'
  } : null;


  if (!toastData) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md text-white p-4 rounded-lg shadow-lg flex justify-between items-center animate-fade-in-down ${toastData.bgColor}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="pr-4">{toastData.message}</span>
      <button onClick={toastData.onClose} className={`p-1 rounded-full ${toastData.hoverBgColor} focus:outline-none focus:ring-2 focus:ring-white`} aria-label="Close">
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
