import React from 'react';
import { ListIcon, BNBIcon, USDTIcon, ExchangeIcon } from './Icons';
import { useBalance } from '../hooks/useBalance';
import { RecordTab } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAccount } from '../lib/wagmi-shim';
import { getMiningStatus, stopMiningSession } from '../api';
import { useEffect, useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawalModal from './WithdrawalModal';
import ClaimRewardModal from './ClaimRewardModal';

type SwapDirection = 'bnb-to-usdt' | 'usdt-to-bnb';

interface AccountProps {
  onOpenRecords: (tab: RecordTab) => void;
  onOpenWithdrawal: (tab: 'swap' | 'withdraw', direction?: SwapDirection) => void;
  onGoToTrading?: () => void;
}

const StatCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 mb-4 ${className}`}>{children}</div>
);

const AssetCard: React.FC<{
  icon: React.ReactNode;
  name: string;
  buttons: React.ReactNode[];
  total: string;
  underReview: string;
  available: string;
}> = ({ icon, name, buttons, total, underReview, available }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center">
          {icon}
          <span className="ml-2 font-semibold">{name}</span>
        </div>
        <div className="flex items-center space-x-2">{buttons}</div>
      </div>
      <div className="flex text-center pt-3">
        <div className="flex-1">
          <h4 className="text-sm text-gray-500">{t('account.total')}</h4>
          <p className="font-semibold text-sm">{total}</p>
        </div>
        <div className="flex-1">
          <h4 className="text-sm text-gray-500">{t('account.underReview')}</h4>
          <p className={`font-semibold text-sm transition-colors duration-300 ${parseFloat(underReview.replace(/[^0-9.-]+/g, '')) > 0 ? 'text-red-500 animate-pulse' : ''}`}>
            {underReview}
          </p>
        </div>
        <div className="flex-1">
          <h4 className="text-sm text-gray-500">{t('account.available')}</h4>
          <p className="font-semibold text-sm">{available}</p>
        </div>
      </div>
    </div>
  );
};

function parseDurationToMinutes(duration: string | null): number | null {
  if (!duration) return null;
  // If it's a number in minutes
  const numeric = parseFloat(duration);
  if (!isNaN(numeric) && /^[0-9.]+$/.test(duration.trim())) return numeric;

  // HH:MM:SS or MM:SS
  const parts = duration.split(':').map(p => parseInt(p, 10));
  if (parts.length === 3 && parts.every(n => !isNaN(n))) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  }
  if (parts.length === 2 && parts.every(n => !isNaN(n))) {
    return parts[0] + parts[1] / 60;
  }

  // Patterns like "123m" or "123 min"
  const mMatch = duration.match(/(\d+(?:\.\d+)?)\s*m/);
  if (mMatch) return parseFloat(mMatch[1]);

  // Fallback: extract first number as minutes
  const anyNumber = duration.match(/(\d+(?:\.\d+)?)/);
  if (anyNumber) return parseFloat(anyNumber[1]);

  return null;
}

const Account: React.FC<AccountProps> = ({ onOpenRecords, onOpenWithdrawal }) => {
  const { bnbBalance, usdtBalance, poolWalletBalance, bnbUnderReview, usdtUnderReview } = useBalance();
  const { t } = useLanguage();
  const { isConnected, address } = useAccount();

  const [isMining, setIsMining] = useState(false);
  const [miningDuration, setMiningDuration] = useState<string | null>(null);
  const [miningAmount, setMiningAmount] = useState<number | null>(null);

  const YIELD_PERCENTAGE = 1.85; // APY used across UI
  const todaysEarnings = bnbBalance * (YIELD_PERCENTAGE / 100 / 365);

  const bnbAvailable = bnbBalance > bnbUnderReview ? bnbBalance - bnbUnderReview : 0;
  const usdtAvailable = usdtBalance > usdtUnderReview ? usdtBalance - usdtUnderReview : 0;

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!isConnected || !address) {
        if (mounted) setIsMining(false);
        return;
      }
      try {
        const session = await getMiningStatus(address);
        if (!mounted) return;
        if (session && session.isActive) {
          setIsMining(true);
          // prefer numeric duration_minutes if provided
          if (session.duration_minutes != null) {
            setMiningDuration(String(session.duration_minutes));
          } else if (session.duration) {
            setMiningDuration(String(session.duration));
          } else if (session.started_at) {
            const started = new Date(session.started_at).getTime();
            const minutes = Math.floor((Date.now() - started) / 60000);
            setMiningDuration(String(minutes));
          }
          setMiningAmount(session.amount ?? null);
        } else {
          setIsMining(false);
          setMiningDuration(null);
          setMiningAmount(null);
        }
      } catch (err) {
        if (mounted) setIsMining(false);
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isConnected, address]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const estimateMiningProfit = (): number | null => {
    if (!isMining || miningAmount == null) return null;
    const minutes = parseDurationToMinutes(miningDuration);
    if (minutes == null || minutes <= 0) return 0;
    // APY to earned fraction: amount * APY% * (minutes / minutesPerYear)
    const minutesPerYear = 365 * 24 * 60;
    const profit = Number(miningAmount) * (YIELD_PERCENTAGE / 100) * (minutes / minutesPerYear);
    return profit;
  };

  const miningProfit = estimateMiningProfit();

  // When user is connected show a view: Accumulated earnings, Today's earnings, Wallet Balance + USDT + BNB
  if (isConnected) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatCard className="col-span-1">
            <div>
              <span className="text-md font-bold text-gray-600">{t('account.accumulatedEarnings')}</span>
              <h2 className="text-2xl font-bold text-[#07c160]">{bnbBalance.toFixed(8)} BNB</h2>
            </div>
          </StatCard>

          <StatCard className="col-span-1">
            <div>
              <span className="text-md font-bold text-gray-600">{t('account.todaysEarnings')}</span>
              <h2 className="text-2xl font-bold text-[#07c160]">{todaysEarnings.toFixed(8)} BNB</h2>
            </div>
          </StatCard>

          <StatCard className="col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-md font-bold text-gray-600">{t('account.walletBalance')}</span>
                <h2 className="text-2xl font-bold text-[#07c160]">{formatCurrency(usdtBalance)} USDT</h2>
              </div>
              <div>
                <button onClick={() => onOpenRecords('income')} className="flex items-center space-x-1 text-sm text-gray-600">
                  <ListIcon className="w-5 h-5" />
                  <span>{t('common.record')}</span>
                </button>
              </div>
            </div>
          </StatCard>
        </div>

        {isMining && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Mining in Progress</div>
                <div className="text-sm">
                  {miningDuration ? `${miningDuration} minutes` : ''} {miningAmount ? `· ${miningAmount} USDT` : ''}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-700">Estimated profit so far</div>
                <div className="font-semibold text-lg text-gray-900">{miningProfit != null ? `${formatCurrency(miningProfit)} USDT` : '--'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={async () => {
                  if (!address) return;
                  try {
                    await stopMiningSession(address);
                    const session = await getMiningStatus(address);
                    if (!session || !session.isActive) {
                      setIsMining(false);
                      setMiningDuration(null);
                      setMiningAmount(null);
                    }
                  } catch (err) {
                    console.error('Failed to stop mining from Account banner:', err);
                  }
                }}
                className="bg-red-500 text-white px-3 py-1.5 rounded text-sm"
              >
                Stop
              </button>

              <button onClick={() => onOpenWithdrawal('swap', 'usdt-to-bnb')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">
                Go to Trading
              </button>
            </div>
          </div>
        )}

        <div className="assets-list">
          <AssetCard
            icon={<BNBIcon className="w-8 h-8" />}
            name="BNB"
            buttons={[
              <button key="swap-bnb" onClick={() => onOpenWithdrawal('swap', 'bnb-to-usdt')} className="px-3 py-1.5 rounded text-sm flex items-center space-x-1 bg-[#07c160] text-white">
                <ExchangeIcon className="w-4 h-4" />
                <span>{t('common.swap')}</span>
              </button>,
            ]}
            total={bnbBalance.toFixed(8)}
            underReview={bnbUnderReview.toFixed(8)}
            available={bnbAvailable.toFixed(8)}
          />

          <AssetCard
            icon={<USDTIcon className="w-8 h-8" />}
            name="USDT"
            buttons={[
              <button key="swap-usdt" onClick={() => onOpenWithdrawal('swap', 'usdt-to-bnb')} className="px-3 py-1.5 rounded text-sm flex items-center space-x-1 bg-gray-200 text-gray-800">
                <ExchangeIcon className="w-4 h-4" />
                <span>{t('common.swap')}</span>
              </button>,
              <WithdrawalModal key="withdraw-usdt">
                <button className="px-3 py-1.5 rounded text-sm flex items-center bg-[#07c160] text-white ml-2">
                  <span className="font-semibold text-lg leading-none mr-1">$</span>
                  <span>{t('common.withdraw')}</span>
                </button>
              </WithdrawalModal>,
            ]}
            total={formatCurrency(usdtBalance)}
            underReview={formatCurrency(usdtUnderReview)}
            available={formatCurrency(usdtAvailable)}
          />
        </div>
      </div>
    );
  }

  // Default (not connected) view - full account overview
  return (
    <div className="p-4">
      <StatCard>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-md font-bold text-gray-600">{t('account.accumulatedEarnings')}</span>
            <h2 className="text-2xl font-bold text-[#07c160]">{bnbBalance.toFixed(8)} BNB</h2>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button onClick={() => onOpenRecords('income')} className="flex items-center space-x-1 text-sm text-gray-600">
              <ListIcon className="w-5 h-5" />
              <span>{t('common.record')}</span>
            </button>
          </div>
        </div>
      </StatCard>

      <StatCard>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="text-md font-bold text-gray-600">{t('account.todaysEarnings')}</span>
            <h2 className="text-2xl font-bold text-[#07c160]">{todaysEarnings.toFixed(8)} BNB</h2>
          </div>
          <div className="flex-1 text-right">
            <span className="text-md text-gray-600 font-semibold">{t('account.yield')}</span>
            <h2 className="text-2xl text-gray-600 font-semibold">{YIELD_PERCENTAGE.toFixed(2)}%</h2>
          </div>
        </div>
      </StatCard>

      <StatCard>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="text-md font-bold text-gray-600">{t('account.poolWallet')}</span>
            <h2 className="text-2xl font-bold text-[#07c160] h-9 flex items-center">
              {poolWalletBalance === null ? (
                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                `${formatCurrency(poolWalletBalance)} USDT`
              )}
            </h2>
          </div>
          <div className="flex-1 text-right">
            <span className="text-md font-bold text-gray-600">{t('account.walletBalance')}</span>
            <h2 className="text-2xl font-bold text-[#07c160]">{formatCurrency(usdtBalance)} USDT</h2>
          </div>
        </div>
      </StatCard>

      <div>
        {isMining && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Mining in Progress</div>
                <div className="text-sm">
                  {miningDuration ? `${miningDuration}` : ''} {miningAmount ? `· ${miningAmount} USDT` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!address) return;
                    try {
                      await stopMiningSession(address);
                      const session = await getMiningStatus(address);
                      if (!session || !session.isActive) {
                        setIsMining(false);
                        setMiningDuration(null);
                        setMiningAmount(null);
                      }
                    } catch (err) {
                      console.error('Failed to stop mining from Account banner:', err);
                    }
                  }}
                  className="bg-red-500 text-white px-3 py-1.5 rounded text-sm"
                >
                  Stop
                </button>
                <button onClick={() => onOpenWithdrawal('swap', 'usdt-to-bnb')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">
                  Go to Trading
                </button>
              </div>
            </div>
          </div>
        )}

        <AssetCard
          icon={<BNBIcon className="w-8 h-8" />}
          name="BNB"
          buttons={[
            <button key="swap-bnb" onClick={() => onOpenWithdrawal('swap', 'bnb-to-usdt')} disabled={isMining} className={`px-3 py-1.5 rounded text-sm flex items-center space-x-1 ${isMining ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#07c160] text-white'}`}>
              <ExchangeIcon className="w-4 h-4" />
              <span>{t('common.swap')}</span>
            </button>,
          ]}
          total={bnbBalance.toFixed(8)}
          underReview={bnbUnderReview.toFixed(8)}
          available={bnbAvailable.toFixed(8)}
        />
        <AssetCard
          icon={<USDTIcon className="w-8 h-8" />}
          name="USDT"
          buttons={[
            <button key="swap-usdt" onClick={() => onOpenWithdrawal('swap', 'usdt-to-bnb')} disabled={isMining} className={`px-3 py-1.5 rounded text-sm flex items-center space-x-1 ${isMining ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-800'}`}>
              <ExchangeIcon className="w-4 h-4" />
              <span>{t('common.swap')}</span>
            </button>,
            <button key="withdraw-usdt" onClick={() => onOpenWithdrawal('withdraw')} disabled={isMining} className={`px-3 py-1.5 rounded text-sm flex items-center ${isMining ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#07c160] text-white'}`}>
              <span className="font-semibold text-lg leading-none mr-1">$</span>
              <span>{t('common.withdraw')}</span>
            </button>,
          ]}
          total={formatCurrency(usdtBalance)}
          underReview={formatCurrency(usdtUnderReview)}
          available={formatCurrency(usdtAvailable)}
        />
      </div>

    </div>
  );
};

export default Account;
