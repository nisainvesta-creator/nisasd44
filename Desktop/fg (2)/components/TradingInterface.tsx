import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from '../lib/wagmi-shim';
import { useBalance } from '../hooks/useBalance';
import StartMiningModal from './StartMiningModal';
import { getMiningStatus, startMiningSession, stopMiningSession } from '../api';
import { ArrowLeftIcon, USDTIcon, BNBIcon } from './Icons';
import IncomeTable from './IncomeTable';
import useBnbPrice from '../hooks/useBnbPrice';

interface TradingInterfaceProps {
  onBack: () => void;
}

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6 w-full">
    <div className="h-8 bg-gray-200 rounded-md w-3/4 mx-auto"></div>
    <div className="h-16 bg-gray-200 rounded-md w-1/2 mx-auto"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
    <div className="h-12 bg-gray-200 rounded-full w-full"></div>
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
}> = ({ icon, title, value, subtitle }) => (
  <div className="bg-white rounded-xl shadow p-4 text-center">
    <div className="flex flex-col items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{title}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    </div>
  </div>
);

const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashOffset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6e7eb" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2563eb"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
};

export function TradingInterface({ onBack }: TradingInterfaceProps) {
  const { isConnected, address: walletAddress } = useAccount();
  const { usdtBalance, bnbBalance } = useBalance();
  const { price: bnbPrice, isLoading: isBnbPriceLoading } = useBnbPrice();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [processingDuration, setProcessingDuration] = useState('24H');
  const [processingTime, setProcessingTime] = useState(0);
  const [miningAmount, setMiningAmount] = useState(0);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDepositedBalance, setTotalDepositedBalance] = useState(0);
  const [showStartupMessage, setShowStartupMessage] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [robotId, setRobotId] = useState<string | null>(null);
  const [isStartMiningModalOpen, setIsStartMiningModalOpen] = useState(false);

  const sessionRef = useRef<{ startTime: number; totalEarningsAtStart: number; completedTransactions?: number } | null>(null);

  useEffect(() => {
    if (isConnected && walletAddress) {
      const savedDeposited = localStorage.getItem(`totalDeposited_${walletAddress}`);
      setTotalDepositedBalance(savedDeposited ? parseFloat(savedDeposited) : 0);
      const savedEarnings = localStorage.getItem(`totalEarnings_${walletAddress}`);
      setTotalEarnings(savedEarnings ? parseFloat(savedEarnings) : 0);

      let userRobotId = localStorage.getItem(`robotId_${walletAddress}`);
      if (!userRobotId) {
        userRobotId = (10001 + Math.floor(Math.random() * 89999)).toString();
        localStorage.setItem(`robotId_${walletAddress}`, userRobotId);
      }
      setRobotId(userRobotId);
    } else {
      setTotalDepositedBalance(0);
      setTotalEarnings(0);
      setRobotId(null);
    }
  }, [isConnected, walletAddress]);

  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setIsProcessing(false);
      setIsLoadingStatus(false);
      return;
    }

    const checkStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const session = await getMiningStatus(walletAddress as string);
        if (session && session.isActive) {
          setMiningAmount(session.amount);
          setProcessingDuration(session.duration);
          sessionRef.current = { startTime: session.startTime, totalEarningsAtStart: session.totalEarningsAtStart, completedTransactions: (session as any).completedTransactions || 0 };
          setIsProcessing(true);
          setIsLoadingStatus(false);
          return;
        }
      } catch (err) {
        console.debug('getMiningStatus failed', err);
      }
      setIsProcessing(false);
      sessionRef.current = null;
      setIsLoadingStatus(false);
    };

    checkStatus();
  }, [isConnected, walletAddress]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isProcessing && sessionRef.current) {
      const { startTime } = sessionRef.current;
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setProcessingTime(elapsed);

        // simple profit model (configurable)
        const rates: Record<string, number> = { '24H': 0.35, '7D': 1.1, '30D': 1.3 };
        const rate = rates[processingDuration] || 0.35;
        const profitPerSecond = (miningAmount * (rate / 100)) / (24 * 3600);
        const newProfit = elapsed * profitPerSecond;
        setCurrentProfit(newProfit);
        setTotalEarnings((sessionRef.current?.totalEarningsAtStart || 0) + newProfit);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isProcessing, processingDuration, miningAmount]);

  const handleStartSession = async (amount: number, duration: string) => {
    if (!isConnected || !walletAddress) {
      setProcessingError('Please connect your wallet to start mining.');
      return;
    }
    setProcessingError(null);
    setIsStartMiningModalOpen(false);
    try {
      await startMiningSession(walletAddress as string, amount, duration, totalEarnings);
      setMiningAmount(amount);
      setProcessingDuration(duration);
      const newDeposited = totalDepositedBalance + amount;
      setTotalDepositedBalance(newDeposited);
      localStorage.setItem(`totalDeposited_${walletAddress}`, newDeposited.toString());
      sessionRef.current = { startTime: Date.now(), totalEarningsAtStart: totalEarnings, completedTransactions: 0 };
      setShowStartupMessage(true);
      setTimeout(() => { setShowStartupMessage(false); setIsProcessing(true); setProcessingTime(0); setCurrentProfit(0); }, 2000);
    } catch (err: any) {
      setProcessingError(err?.message || 'Failed to start session');
    }
  };

  const handleStopSession = async () => {
    if (!walletAddress) return;
    try {
      const result = await stopMiningSession(walletAddress as string);
      if (sessionRef.current) {
        const newEarnings = sessionRef.current.totalEarningsAtStart + result.sessionProfit;
        setTotalEarnings(newEarnings);
        localStorage.setItem(`totalEarnings_${walletAddress}`, newEarnings.toString());
      }
      setIsProcessing(false);
      setProcessingTime(0);
      setCurrentProfit(0);
      sessionRef.current = null;
      setShowStartupMessage(false);
      setProcessingError(null);
    } catch (err: any) {
      setProcessingError(err?.message || 'Failed to stop session');
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatCurrency = (v: number) => v.toFixed(4);

  const truncateAddress = (addr?: string | null) => {
    if (!addr) return 'Not Connected';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const renderMiningInterface = () => {
    if (isLoadingStatus) return <LoadingSkeleton />;
    if (showStartupMessage) {
      return (
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Starting Robot...</p>
            <p className="text-sm text-gray-500">Please wait while the session initializes.</p>
          </div>
        </div>
      );
    }

    if (isProcessing) {
      const elapsed = processingTime;
      const totalSeconds = processingDuration === '24H' ? 24 * 3600 : processingDuration === '7D' ? 7 * 24 * 3600 : 30 * 24 * 3600;
      const progress = Math.min((elapsed / totalSeconds) * 100, 100);
      return (
        <div className="space-y-6 w-full">
          <div className="text-center">
            <div className="text-sm text-gray-500 uppercase">Mining in Progress</div>
            <div className="text-4xl font-bold text-blue-600 mt-2">{formatTime(elapsed)}</div>
          </div>

          <div className="flex justify-center">
            <ProgressRing progress={progress} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow"> 
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-bold">{processingDuration}</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow"> 
              <div className="text-xs text-gray-500">Amount</div>
              <div className="font-bold">{formatCurrency(miningAmount)} USDT</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow"> 
              <div className="text-xs text-gray-500">Current Profit</div>
              <div className="font-bold text-green-600">+{formatCurrency(currentProfit)} USDT</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow"> 
              <div className="text-xs text-gray-500">Profit Rate</div>
              <div className="font-bold">{((currentProfit / (miningAmount || 1)) * 100).toFixed(2)}%</div>
            </div>
          </div>

          <button onClick={handleStopSession} className="w-full bg-red-500 text-white py-3 rounded-md font-semibold">Stop Mining</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-4 py-8">
        <h2 className="text-xl font-bold">Start Mining Session</h2>
        <p className="text-gray-500 text-sm">Click below to start a new mining session.</p>
        <button onClick={() => setIsStartMiningModalOpen(true)} disabled={!isConnected} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full disabled:bg-gray-300">
          Start Mining
        </button>
        {!isConnected && <p className="text-xs text-red-600 mt-2">Please connect your wallet to start mining.</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="h-12 flex items-center justify-between px-4">
          <button onClick={onBack} aria-label="Go back" className="p-2 rounded hover:bg-gray-100">
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">AI Trading</h1>
            {!isBnbPriceLoading && bnbPrice > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                1 BNB ≈ ${bnbPrice.toFixed(2)}
              </div>
            )}
          </div>
          <div className="w-6" />
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="font-semibold text-gray-600">Robot ID: <span className="text-blue-600">{robotId || 'N/A'}</span></div>
            <div className="font-mono text-gray-500">{truncateAddress(walletAddress)}</div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-4">
              <USDTIcon className="w-6 h-6" />
              <div>
                <div className="text-xs text-gray-500">Wallet Balance</div>
                <div className="font-bold text-lg">{(usdtBalance || 0).toFixed(2)} USDT</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BNBIcon className="w-6 h-6" />
              <div>
                <div className="text-xs text-gray-500">BNB Balance</div>
                <div className="font-bold text-lg">{(bnbBalance || 0).toFixed(4)} BNB</div>
                {!isBnbPriceLoading && bnbPrice > 0 && (
                  <div className="text-xs text-gray-400">
                    ≈ ${(bnbBalance * bnbPrice).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xs text-gray-500">Total Deposited</div>
            <div className="font-bold text-blue-600">{formatCurrency(totalDepositedBalance)} USDT</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-xs text-gray-500">Total Earnings</div>
            <div className="font-bold text-green-600">{formatCurrency(totalEarnings)} USDT</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 min-h-[20rem] flex items-center justify-center">
          {renderMiningInterface()}
        </div>

        <div className="my-4">
          <IncomeTable />
        </div>

        {processingError && <div className="text-center text-red-500 text-sm">{processingError}</div>}
      </main>

      <StartMiningModal
        isOpen={isStartMiningModalOpen}
        onClose={() => setIsStartMiningModalOpen(false)}
        onConfirm={handleStartSession}
        usdtBalance={usdtBalance}
      />
    </div>
  );
}
