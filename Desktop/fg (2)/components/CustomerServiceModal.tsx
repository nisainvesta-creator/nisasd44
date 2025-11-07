
import React from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const avatarImage = "https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050185714.jpg";
const telegramIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAD/ElEQVRoQ+2ZW6hVVRSGv7+bFZEZlV2kFCKM7KECo8tDUg+h0kVTiEi0IiGNisqigm6QglYvWYJiBhGFREikWRAG0YNCvWQvBfmUURBBSBeiX4bMfVhnu9Zec529zjn7wB5PhzPHGvP/x2WOMecWU1w0xfEzJDDZERxGYBiBPj0w0Clk+wJgFbACmAk8KumdIueBI2D7RGAhcD+wCDipAPiwpAsHkoDtOQn0SuCiisw6IumMgSFg+xTgDuAB4GbghJqSOCBp/qQTsH15Ah25fU6DOn5L0kOTQsD26cDyBPx6GNMUsErSjgklYPuaBPpuYHoPb/8HbAN+B56p0Jsn6eC4E7AdQO9JwK/KSJFvk+4vwKfAlSXf/AmcJen/cSNg+8YEZBkQKVMnfwEvAZuA2cBnQJxGZfKlpJu6F/ruA7bPTY0mTpK5dYgL6/uAByX9YDuitCc1qyoTmyQ92QoB23Hc3ZK8fTsQx2Gu/AGsi3yXZNvh1V3AmTUGlkva2RcB27NSa78vhTwXdEfvI2CtpJ/jH7bvBN4DTs0wNEfSocYEbEcrX5y8fSsQrb6pHAYelvRh50PbkXJbMu39Jum8sk0ra8D2pYXWfn5TxEnfwHbgCUmROsfE9tPAKw16wW5JMRcdJ8cRsB05/QgQudlPkf8IrJb0RQF42HsVeKyhQ16U9EItAdtbU6o0tD9KPRrS68DzkuKY7Hg9UjGice8YjC+StDuHwE9jLM6O7WMNSdI3xc1snwbECVKaBhmEZkr6NYdA5Ppq4C7gXobhjspIQ5IUERgR2zOAj4EbGtgrqh6SVNXcqnPc9mXAUmAJEPNMVT2MNKRugLbj8lE1GuTy2SkphsBSySpS25ckIkEmJsloZKMaUgn4OMV6jQa5BNZJ2tgXga6UiDSLXN7TaUgl4K8GoujiHtuvLJAUUR57BJogaDAa5JiNyTMm0JhEx59Aw9Egh8BBST0Pk6wayNkpdGwfyRyjc03ukBTPKpXSGgHb04C/c5Fl6q2R9OZEEYjijqGtTZkv6cBEEYiXhu9bRP9P3BEk/TtRBK4Dvi7Z7Csg7hFxZWwi+yVdW/dBmzUQz4GfdG34ORDTbVxY3k5/12HqrG+WtLZOuU0C8QrxbmHDvfHqJmmksG3HGL0h8wq6svsht4xMmwTWAG+kTaILL5EUeTxKbEdafADEeNJLrpBUW1NtEngOeDlNnsvKwHfQpgk1Xthuq2BQ+gY03hGIl4aYfZ7qHqmr3Gz7cWA9cHKXzj5JC+ryP9Zbi0DOZmU6tuP0eh+4uLD+rKS4M9fKpBMIhLbPBl5LI/t38QNH8RGgF4uBIFDr5h4KQwL9eK+Nb4cRaMOL/diY8hE4CiBCI0DtzQWBAAAAAElFTkSuQmCC";

const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-service-title"
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

        <div className="mt-4">
            <img 
                src={avatarImage}
                alt="Assistant Avatar" 
                className="w-16 h-16 mx-auto rounded-full" 
            />
        </div>

        <h2 id="customer-service-title" className="text-xl font-bold text-gray-800 mt-4 mb-2">
          {t('customerService.title')}
        </h2>

        <p className="text-gray-600 text-sm mb-6">
          {t('customerService.description')}
        </p>

        <div className="border-t border-gray-100 pt-4">
            <a href="https://t.me/aibotbnb" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full space-x-2">
                <img src={telegramIcon} alt="Telegram" className="w-8 h-8"/>
                <span className="text-gray-700 font-semibold">@aibotbnb</span>
            </a>
        </div>

      </div>
    </div>
  );
};

export default CustomerServiceModal;
