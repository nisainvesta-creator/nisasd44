import React, { useState, useEffect } from 'react';
import { CurrencyInput } from './CurrencyInput';
import { USDTIcon } from './Icons';
import { DurationSelector } from './DurationSelector';
import { useLanguage } from '../hooks/useLanguage';

interface StartMiningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, duration: string) => void;
  usdtBalance: number;
}

const StartMiningModal: React.FC<StartMiningModalProps> = ({ isOpen, onClose, onConfirm, usdtBalance }) => {
  const [amount, setAmount] = useState('10');
  const [duration, setDuration] = useState('24H');
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      // Reset to default and validate when the modal opens
      const initialAmount = '10';
      setAmount(initialAmount);
      setDuration('24H');
      handleAmountChange(initialAmount);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, usdtBalance]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numericValue = parseFloat(value);
    if (value === '') {
      setError(t('error.enterAmount'));
    } else if (isNaN(numericValue)) {
      setError(t('error.invalidNumber'));
    } else if (numericValue < 10) {
      setError('Minimum to start is 10 USDT.');
    } else if (numericValue > usdtBalance) {
      setError(t('error.insufficientBalance'));
    } else {
      setError(null);
    }
  };

  const handleConfirmClick = () => {
    if (!error && amount) {
      onConfirm(parseFloat(amount), duration);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-mining-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 m-4 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="start-mining-title" className="text-xl font-bold text-gray-800 text-center mb-4">
          Start New Mining Session
        </h2>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Mine
            </label>
            <CurrencyInput
                value={amount}
                onChange={handleAmountChange}
                placeholder="10.00"
                availableAmount={usdtBalance}
                currencyIcon={<USDTIcon className="w-6 h-6" />}
                currencySymbol="USDT"
                precision={2}
                isError={!!error}
                errorMessage={error}
            />
        </div>
        
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Duration
            </label>
            <DurationSelector
                onDurationChange={setDuration}
                defaultDuration={duration}
            />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-full hover:bg-gray-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={!!error || !amount}
            className="flex-1 bg-[#07c160] text-white font-bold py-3 rounded-full hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Mining
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartMiningModal;
