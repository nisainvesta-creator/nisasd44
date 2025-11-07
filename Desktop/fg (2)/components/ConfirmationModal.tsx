

import React from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-5 m-4 w-full max-w-sm text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 id="confirmation-title" className="text-xl font-bold text-gray-800 mt-4 mb-4">
          {title}
        </h2>

        <div className="text-gray-600 text-sm mb-8">
          {children}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-full hover:bg-gray-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#07c160] text-white font-bold py-3 rounded-full hover:bg-green-600 transition-colors"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
