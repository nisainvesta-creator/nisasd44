import React, { useState, useEffect } from 'react';
import { ArrowsUpDownIcon, ListIcon, BNBIcon, USDTIcon } from './Icons';
import { useBalance } from '../hooks/useBalance';
import { RecordTab } from '../types';
import { CurrencyInput } from './CurrencyInput';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../hooks/useLanguage';
import { performBnbToUsdtSwap, performUsdtToBnbSwap, performUsdtWithdrawal } from '../api';
import { useError } from '../hooks/useError';
import { useAccount } from '../lib/wagmi-shim';
import useBnbPrice from '../hooks/useBnbPrice';

type Tab = 'swap' | 'withdraw';
type SwapDirection = 'bnb-to-usdt' | 'usdt-to-bnb';

interface WithdrawalProps {
  onOpenRecords: (tab: RecordTab) => void;
  initialTab: Tab;
  initialSwapDirection: SwapDirection;
}

const Withdrawal: React.FC<WithdrawalProps> = ({ onOpenRecords, initialTab, initialSwapDirection }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [swapDirection, setSwapDirection] = useState<SwapDirection>(initialSwapDirection);
  
  const { bnbBalance, usdtBalance, refreshBalances, holdForReview, bnbUnderReview, usdtUnderReview } = useBalance();
  const { t } = useLanguage();
  const { showError, showSuccess } = useError();
  const { address: walletAddress } = useAccount();

  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('0.00');
  const [swapError, setSwapError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
  }>({ title: '', message: '', onConfirm: () => {} });

  const { price: bnbPrice, isLoading: isBnbPriceLoading } = useBnbPrice();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSwapDirection(initialSwapDirection);
    setFromAmount('');
    setToAmount('0.00');
  }, [initialSwapDirection, activeTab]);
  
  useEffect(() => {
      const amount = parseFloat(fromAmount);
      if (!isNaN(amount) && amount > 0 && bnbPrice > 0) {
          if (swapDirection === 'bnb-to-usdt') {
            setToAmount((amount * bnbPrice).toFixed(2));
          } else {
            setToAmount((amount / bnbPrice).toFixed(8));
          }
      } else if (!isNaN(amount) && amount > 0 && bnbPrice <= 0) {
          // Price not available yet; show placeholder
          setToAmount('...');
      } else {
          setToAmount('0.00');
      }
  }, [fromAmount, swapDirection, bnbPrice]);

  const bnbAvailable = bnbBalance > bnbUnderReview ? bnbBalance - bnbUnderReview : 0;
  const usdtAvailable = usdtBalance > usdtUnderReview ? usdtBalance - usdtUnderReview : 0;

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value === '') {
      setSwapError(null);
      return;
    }
    const amount = parseFloat(value);
    const available = swapDirection === 'bnb-to-usdt' ? bnbAvailable : usdtAvailable;

    if (isNaN(amount)) {
      setSwapError(t('error.invalidNumber'));
    } else if (amount <= 0) {
      setSwapError(t('error.amountGreaterThanZero'));
    } else if (amount > available) {
      setSwapError(t('error.insufficientBalance'));
    } else {
      setSwapError(null);
    }
  };

  const handleWithdrawAmountChange = (value: string) => {
    setWithdrawAmount(value);
     if (value === '') {
      setWithdrawError(null);
      return;
    }
    const amount = parseFloat(value);
    if (isNaN(amount)) {
      setWithdrawError(t('error.invalidNumber'));
    } else if (amount <= 0) {
      setWithdrawError(t('error.amountGreaterThanZero'));
    } else if (amount > usdtAvailable) {
      setWithdrawError(t('error.insufficientBalance'));
    } else {
      setWithdrawError(null);
    }
  };

  const handleSwapClick = () => {
    const available = swapDirection === 'bnb-to-usdt' ? bnbAvailable : usdtAvailable;
    let error: string | null = null;
    if (fromAmount === '') {
      error = t('error.enterAmount');
    } else {
      const amount = parseFloat(fromAmount);
      if (isNaN(amount)) {
        error = t('error.invalidNumber');
      } else if (amount <= 0) {
        error = t('error.amountGreaterThanZero');
      } else if (amount > available) {
        error = t('error.insufficientBalance');
      }
    }
  
    setSwapError(error);
  
    if (error) {
      return;
    }

    const isBnbToUsdt = swapDirection === 'bnb-to-usdt';

    setModalContent({
        title: t('withdrawal.confirmSwap.title'),
        message: (
            <>
                <p>{t('withdrawal.confirmSwap.line1')}</p>
                <p className="font-bold text-lg my-2">{parseFloat(fromAmount).toFixed(isBnbToUsdt ? 8 : 2)} {isBnbToUsdt ? 'BNB' : 'USDT'}</p>
                <p>{t('withdrawal.confirmSwap.line2')}</p>
                <p className="font-bold text-lg my-2 text-green-600">{toAmount} {isBnbToUsdt ? 'USDT' : 'BNB'}</p>
                <p className="text-xs text-gray-500">{t('withdrawal.confirmSwap.line3')}</p>
            </>
        ),
        onConfirm: async () => {
            setIsModalOpen(false);
            if (!walletAddress) {
                showError(t('error.connectWalletFirst'));
                return;
            }
            if (isBnbToUsdt) {
              holdForReview('BNB', parseFloat(fromAmount));
            } else {
              holdForReview('USDT', parseFloat(fromAmount));
            }
            try {
                if (isBnbToUsdt) {
                  await performBnbToUsdtSwap(walletAddress, parseFloat(fromAmount), parseFloat(toAmount));
                } else {
                  await performUsdtToBnbSwap(walletAddress, parseFloat(fromAmount), parseFloat(toAmount));
                }
                showSuccess(t('withdrawal.swapSuccess'));
                await refreshBalances();
                setFromAmount('');
            } catch (e) {
                console.error("Swap failed:", e);
                showError(t('withdrawal.swapFailed'));
            }
        }
    });
    setIsModalOpen(true);
  };

  const handleWithdrawClick = () => {
    let error: string | null = null;
    if (withdrawAmount === '') {
      error = t('error.enterAmount');
    } else {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount)) {
        error = t('error.invalidNumber');
      } else if (amount <= 0) {
        error = t('error.amountGreaterThanZero');
      } else if (amount > usdtAvailable) {
        error = t('error.insufficientBalance');
      }
    }

    setWithdrawError(error);

    if (error) {
      return;
    }
    
    setModalContent({
        title: t('withdrawal.confirmWithdraw.title'),
        message: (
            <>
                <p>{t('withdrawal.confirmWithdraw.line1')}</p>
                <p className="font-bold text-lg my-2 text-green-600">{parseFloat(withdrawAmount).toFixed(2)} USDT</p>
                <p className="text-xs text-gray-500">{t('withdrawal.confirmWithdraw.line2')}</p>
            </>
        ),
        onConfirm: async () => {
            setIsModalOpen(false);
            if (!walletAddress) {
                showError(t('error.connectWalletFirst'));
                return;
            }
            holdForReview('USDT', parseFloat(withdrawAmount));
            try {
                await performUsdtWithdrawal(walletAddress, parseFloat(withdrawAmount));
                showSuccess(t('withdrawal.withdrawSuccess'));
                await refreshBalances();
                setWithdrawAmount('');
            } catch (e) {
                console.error("Withdrawal failed:", e);
                showError(t('withdrawal.withdrawFailed'));
            }
        }
    });
    setIsModalOpen(true);
  };
  
  const toggleSwapDirection = () => {
      setSwapDirection(prev => prev === 'bnb-to-usdt' ? 'usdt-to-bnb' : 'bnb-to-usdt');
      setFromAmount('');
      setToAmount('0.00');
      setSwapError(null);
  };

  const isSwapDisabled = !fromAmount || !!swapError;
  const isWithdrawDisabled = !withdrawAmount || !!withdrawError;

  const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 text-center font-semibold border-b-2 transition-colors duration-300 ${
        activeTab === tab
          ? 'text-[#07c160] border-[#07c160]'
          : 'text-gray-500 border-transparent hover:text-gray-800'
      }`}
      role="tab"
      aria-selected={activeTab === tab}
    >
      {label}
    </button>
  );
  
  const fromAsset = swapDirection === 'bnb-to-usdt' 
      ? { symbol: 'BNB', icon: <BNBIcon className="w-6 h-6" />, available: bnbAvailable, precision: 8 }
      : { symbol: 'USDT', icon: <USDTIcon className="w-6 h-6" />, available: usdtAvailable, precision: 2 };

  const toAsset = swapDirection === 'bnb-to-usdt'
      ? { symbol: 'USDT', icon: <USDTIcon className="w-6 h-6" /> }
      : { symbol: 'BNB', icon: <BNBIcon className="w-6 h-6" /> };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex border-b border-gray-200" role="tablist">
          <TabButton tab="swap" label={t('withdrawal.tabs.swap')} />
          <TabButton tab="withdraw" label={t('withdrawal.tabs.withdraw')} />
        </div>
        
        {activeTab === 'swap' && (
          <div className="p-4" role="tabpanel">
            <p className="text-sm text-gray-600 mb-4">
              {t('withdrawal.swapDescription')}
            </p>
            <div className="space-y-4">
                <CurrencyInput
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    placeholder="0.00"
                    availableAmount={fromAsset.available}
                    currencyIcon={fromAsset.icon}
                    currencySymbol={fromAsset.symbol}
                    precision={fromAsset.precision}
                    isError={!!swapError}
                    errorMessage={swapError}
                />

                <div className="flex justify-center py-1">
                    <button onClick={toggleSwapDirection} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-[#07c160] hover:bg-gray-50 transition-colors">
                        <ArrowsUpDownIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="relative">
                    <input type="text" className="w-full text-lg border border-gray-200 rounded-lg p-3 pr-24 bg-gray-50 focus:outline-none" value={toAmount} disabled readOnly />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {toAsset.icon}
                        <span className="font-semibold ml-2 text-gray-800">{toAsset.symbol}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm font-bold text-gray-800">{t('withdrawal.price')}: 1 BNB ≈ {bnbPrice.toFixed(2)} USDT</div>
              <button onClick={() => onOpenRecords('swap')} className="flex items-center space-x-1 text-sm text-gray-600">
                <ListIcon className="w-5 h-5" />
                <span>{t('common.record')}</span>
              </button>
            </div>
            <button
              onClick={handleSwapClick} 
              disabled={isSwapDisabled}
              className={`mt-6 w-full text-white font-bold py-3 rounded-full transition-colors ${
                isSwapDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#07c160] hover:bg-green-600'
              }`}
            >
              {t('common.swap')}
            </button>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="p-4" role="tabpanel">
            <p className="text-sm text-gray-600 mb-4">
              {t('withdrawal.withdrawDescription')}
            </p>
            <CurrencyInput
                value={withdrawAmount}
                onChange={handleWithdrawAmountChange}
                placeholder="0.00"
                availableAmount={usdtAvailable}
                currencyIcon={<USDTIcon className="w-6 h-6" />}
                currencySymbol="USDT"
                precision={2}
                isError={!!withdrawError}
                errorMessage={withdrawError}
            />
            <div className="flex justify-end items-center mt-4">
                <button onClick={() => onOpenRecords('withdraw')} className="flex items-center space-x-1 text-sm text-gray-600">
                    <ListIcon className="w-5 h-5" />
                    <span>{t('common.record')}</span>
                </button>
            </div>
            <button 
              onClick={handleWithdrawClick}
              disabled={isWithdrawDisabled}
              className={`mt-6 w-full text-white font-bold py-3 rounded-full transition-colors ${
                isWithdrawDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#07c160] hover:bg-green-600'
              }`}
            >
              {t('common.confirm')}
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
      >
        {modalContent.message}
      </ConfirmationModal>
    </div>
  );
};

export default Withdrawal;
