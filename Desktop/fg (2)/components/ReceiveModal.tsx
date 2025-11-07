import React from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceive: () => void;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, onReceive }) => {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-modal-title"
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

        <h2 id="receive-modal-title" className="text-xl font-bold text-gray-800 mt-4 mb-4">
          {t('receiveModal.title')}
        </h2>

        <p className="text-gray-600 text-sm mb-8 px-2">
          {t('receiveModal.description')}
        </p>

        <div className="flex justify-center">
          <button
            onClick={onReceive}
            className="bg-[#07c160] text-white font-bold py-3 px-10 rounded-lg hover:bg-green-600 transition-colors"
          >
            {t('hero.receive')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;
