import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ClipboardDocumentListIcon, BNBIcon, USDTIcon, ArrowRightIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';
import { 
    fetchSwapRecords, 
    fetchWithdrawalRecords, 
    fetchIncomeRecords
} from '../api';
import { 
    SwapRecordData,
    WithdrawRecordData,
    IncomeRecordData,
    RecordTab
} from '../types';
import { useAccount } from '../lib/wagmi-shim';

interface RecordProps {
  onBack: () => void;
  initialTab: RecordTab;
}

// --- Reusable UI components for records page ---
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
  </div>
);

const NoData: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="text-center py-20 text-gray-500">
            <ClipboardDocumentListIcon className="mx-auto w-16 h-16 text-gray-300" />
            <p className="mt-4 text-sm">{t('record.noRecords')}</p>
        </div>
    );
};

const StatusBadge: React.FC<{ status: 'Completed' | 'Pending' | 'Failed' }> = ({ status }) => {
  const { t } = useLanguage();
  const statusClasses = {
    Completed: 'text-green-600 bg-green-100',
    Pending: 'text-yellow-600 bg-yellow-100',
    Failed: 'text-red-600 bg-red-100',
  };
  const statusTranslations: Record<'Completed' | 'Pending' | 'Failed', string> = {
      Completed: t('record.status.completed'),
      Pending: t('record.status.pending'),
      Failed: t('record.status.failed'),
  }
  return <span className={`font-semibold px-2 py-1 rounded-md text-xs ${statusClasses[status]}`}>{statusTranslations[status]}</span>;
};

// --- Components to render history for each tab ---

const SwapHistory: React.FC<{ walletAddress: string | null | undefined }> = ({ walletAddress }) => {
    const [records, setRecords] = useState<SwapRecordData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedRecordIds, setHighlightedRecordIds] = useState<Set<number>>(new Set());
  
    useEffect(() => {
        if (!walletAddress) {
            setIsLoading(false);
            setRecords([]);
            return;
        }

        const loadData = async () => {
            const newRecords = await fetchSwapRecords(walletAddress);
            setRecords(currentRecords => {
                if (currentRecords.length === 0) {
                    return newRecords;
                }
                const currentRecordIds = new Set(currentRecords.map(r => r.id));
                const newIds = newRecords
                    .filter(r => !currentRecordIds.has(r.id))
                    .map(r => r.id);

                if (newIds.length > 0) {
                    setHighlightedRecordIds(new Set(newIds));
                    setTimeout(() => setHighlightedRecordIds(new Set()), 2000);
                }
                return newRecords;
            });
        };
    
        const initialLoad = async () => {
            setIsLoading(true);
            await loadData();
            setIsLoading(false);
        };
        initialLoad();

        const intervalId = setInterval(loadData, 5000);
        return () => clearInterval(intervalId);
    }, [walletAddress]);
  
    if (isLoading) return <LoadingSpinner />;
    if (records.length === 0) return <NoData />;
  
    return (
        <div className="space-y-2">
            {records.map((record) => (
            <div 
                key={record.id} 
                className={`bg-white rounded-lg p-4 transition-colors duration-1000 shadow-sm border ${highlightedRecordIds.has(record.id) ? 'animate-pulse-bg-once border-green-200' : 'border-transparent'}`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                    {record.fromCurrency === 'BNB' ? <BNBIcon className="w-6 h-6" /> : <USDTIcon className="w-6 h-6" />}
                    <div>
                        <p className="font-semibold text-gray-800">{record.fromAmount.toFixed(record.fromCurrency === 'BNB' ? 8 : 2)}</p>
                        <p className="text-xs text-gray-500">{record.fromCurrency}</p>
                    </div>
                    </div>
                    
                    <ArrowRightIcon className="w-5 h-5 text-gray-400" />

                    <div className="flex items-center space-x-2">
                    <div className="text-right">
                        <p className="font-semibold text-green-600">+ {record.toAmount.toFixed(record.toCurrency === 'USDT' ? 2 : 8)}</p>
                        <p className="text-xs text-gray-500">{record.toCurrency}</p>
                    </div>
                    {record.toCurrency === 'USDT' ? <USDTIcon className="w-6 h-6" /> : <BNBIcon className="w-6 h-6" />}
                    </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 text-right">
                    <span className="text-xs text-gray-500">{record.date}</span>
                </div>
            </div>
            ))}
      </div>
    );
  };
  
const WithdrawHistory: React.FC<{ walletAddress: string | null | undefined }> = ({ walletAddress }) => {
    const [records, setRecords] = useState<WithdrawRecordData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedRecordIds, setHighlightedRecordIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!walletAddress) {
            setIsLoading(false);
            setRecords([]);
            return;
        }

        const loadData = async () => {
            const newRecords = await fetchWithdrawalRecords(walletAddress);
            setRecords(currentRecords => {
                if (currentRecords.length === 0) {
                    return newRecords;
                }
                const currentRecordIds = new Set(currentRecords.map(r => r.id));
                const newIds = newRecords
                    .filter(r => !currentRecordIds.has(r.id))
                    .map(r => r.id);

                if (newIds.length > 0) {
                    setHighlightedRecordIds(new Set(newIds));
                    setTimeout(() => setHighlightedRecordIds(new Set()), 2000);
                }
                return newRecords;
            });
        };

        const initialLoad = async () => {
            setIsLoading(true);
            await loadData();
            setIsLoading(false);
        };
        initialLoad();

        const intervalId = setInterval(loadData, 5000);
        return () => clearInterval(intervalId);
    }, [walletAddress]);

    if (isLoading) return <LoadingSpinner />;
    if (records.length === 0) return <NoData />;

    return (
        <div className="space-y-2">
            {records.map((record) => (
                <div 
                    key={record.id} 
                    className={`bg-white rounded-lg p-4 flex justify-between items-center transition-colors duration-1000 shadow-sm border ${highlightedRecordIds.has(record.id) ? 'animate-pulse-bg-once border-green-200' : 'border-transparent'}`}
                >
                    <div>
                        <p className="font-bold text-lg flex items-center">
                        <USDTIcon className="w-6 h-6 mr-2" />
                        {record.amount.toFixed(2)} USDT
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{record.date}</p>
                    </div>
                    <div className="text-right">
                        <StatusBadge status={record.status} />
                    </div>
                </div>
            ))}
        </div>
    );
};

const IncomeHistory: React.FC<{ walletAddress: string | null | undefined }> = ({ walletAddress }) => {
    const [records, setRecords] = useState<IncomeRecordData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedRecordIds, setHighlightedRecordIds] = useState<Set<number>>(new Set());
    const [totalIncome, setTotalIncome] = useState(0);
    const { t } = useLanguage();

    useEffect(() => {
        if (!walletAddress) {
            setIsLoading(false);
            setRecords([]);
            setTotalIncome(0);
            return;
        }
        const loadData = async () => {
            const newRecords = await fetchIncomeRecords(walletAddress);
            
            setRecords(currentRecords => {
                if (currentRecords.length > 0 && newRecords.length > 0 && currentRecords[0].id !== newRecords[0].id) {
                     setHighlightedRecordIds(new Set([newRecords[0].id]));
                     setTimeout(() => setHighlightedRecordIds(new Set()), 2000);
                }
                return newRecords;
            });

            const total = newRecords.reduce((sum, record) => sum + record.amount, 0);
            setTotalIncome(total);
        };

        const initialLoad = async () => {
            setIsLoading(true);
            await loadData();
            setIsLoading(false);
        };
        initialLoad();

        const intervalId = setInterval(loadData, 5000);
        return () => clearInterval(intervalId);
    }, [walletAddress]);

    if (isLoading) return <LoadingSpinner />;
    if (records.length === 0) return <NoData />;

    return (
        <div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                <p className="text-sm text-green-700 font-semibold">{t('record.totalAccumulated')}</p>
                <p className="font-bold text-2xl text-green-600 mt-1 flex items-center">
                    <BNBIcon className="w-6 h-6 mr-2" />
                    {totalIncome.toFixed(8)} BNB
                </p>
            </div>
            <div className="space-y-2 mt-2">
                {records.map((record) => (
                    <div 
                        key={record.id} 
                        className={`bg-white rounded-lg p-4 flex justify-between items-center transition-colors duration-1000 shadow-sm border ${highlightedRecordIds.has(record.id) ? 'animate-pulse-bg-once border-green-200' : 'border-transparent'}`}
                    >
                        <p className="font-semibold text-gray-600">{record.date}</p>
                        <p className="font-bold text-gray-800 flex items-center">
                            <BNBIcon className="w-5 h-5 mr-2" />
                            +{record.amount.toFixed(8)} BNB
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Record: React.FC<RecordProps> = ({ onBack, initialTab }) => {
    const [activeTab, setActiveTab] = useState<RecordTab>(initialTab);
    const { t } = useLanguage();
    const { address: walletAddress } = useAccount();
  
    const TabButton: React.FC<{ tab: RecordTab; label: string }> = ({ tab, label }) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 py-3 font-semibold transition-colors duration-200 ${
          activeTab === tab 
            ? 'text-[#07c160] border-b-2 border-[#07c160]' 
            : 'text-gray-600 border-b-2 border-transparent'
        }`}
        role="tab"
        aria-selected={activeTab === tab}
      >
        {label}
      </button>
    );
  
    const renderContent = () => {
      switch (activeTab) {
        case 'swap':
          return <SwapHistory walletAddress={walletAddress} />;
        case 'withdraw':
          return <WithdrawHistory walletAddress={walletAddress} />;
        case 'income':
          return <IncomeHistory walletAddress={walletAddress} />;
        default:
          return null;
      }
    };
  
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="h-12 flex items-center justify-center relative">
            <button onClick={onBack} className="absolute left-4" aria-label="Go back">
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold">{t('record.pageTitle')}</h1>
          </div>
          <nav className="flex text-center bg-white">
            <TabButton tab="swap" label={t('record.tabs.swap')} />
            <TabButton tab="withdraw" label={t('record.tabs.withdraw')} />
            <TabButton tab="income" label={t('record.tabs.income')} />
          </nav>
        </header>
  
        <main className="p-2">
          {renderContent()}
        </main>
      </div>
    );
  };
  
  export default Record;
