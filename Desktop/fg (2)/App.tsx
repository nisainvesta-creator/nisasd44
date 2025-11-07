// FIX: Corrected import statement for React and useState.
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PoolStats from './components/PoolStats';
import OutputDetails from './components/OutputDetails';
import Faq from './components/Faq';
import Partners from './components/Partners';
import BottomNav from './components/BottomNav';
import FloatingChatButton from './components/FloatingChatButton';
import Withdrawal from './components/Withdrawal';
import Account from './components/Account';
import Certificate from './components/Certificate';
import Record from './components/Record';
import Team from './components/Team';
import { TradingInterface } from './components/TradingInterface';
import { MiningPage } from './components/MiningPage';
import { Page, RecordTab } from './types';
import { ErrorProvider } from './contexts/ErrorContext';
import { ErrorToast } from './components/ErrorToast';
import CustomerServiceModal from './components/CustomerServiceModal';
import { BalanceProvider } from './contexts/BalanceContext';
import ReceiveModal from './components/ReceiveModal';
import { useError } from './hooks/useError';
import { LanguageProvider } from './contexts/LanguageContext';
import { useLanguage } from './hooks/useLanguage';
import { UserStatusChecker } from './components/UserStatusChecker';
import WalletConnect from './components/WalletConnect';
import DepositModal from './components/DepositModal';
import WithdrawalModal from './components/WithdrawalModal';
import ClaimRewardModal from './components/ClaimRewardModal';
import AdminDashboard from './components/AdminDashboard';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';

import { useAccount } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppKit } from '@reown/appkit/react';

const queryClient = new QueryClient();


type SwapDirection = 'bnb-to-usdt' | 'usdt-to-bnb';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Home');
  const [isCustomerServiceModalOpen, setCustomerServiceModalOpen] = useState(false);
  const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
  const [recordSourcePage, setRecordSourcePage] = useState<Page>('Account');
  const [initialRecordTab, setInitialRecordTab] = useState<RecordTab>('swap');
  const [initialWithdrawalTab, setInitialWithdrawalTab] = useState<'swap' | 'withdraw'>('swap');
  const [initialSwapDirection, setInitialSwapDirection] = useState<SwapDirection>('bnb-to-usdt');
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Use wagmi for wallet connection
  const walletAccount = useAccount();
  const isConnected = walletAccount?.isConnected || false;
  const { open } = useAppKit();

  // Auto-open wallet modal immediately if not connected
  React.useEffect(() => {
    if (!isConnected) {
      open();
    }
  }, [isConnected, open]);
  const { showError } = useError();
  const { t } = useLanguage();

  const handleOpenRecords = (sourcePage: Page, initialTab: RecordTab) => {
    setRecordSourcePage(sourcePage);
    setInitialRecordTab(initialTab);
    setActivePage('Record');
  };

  const handleOpenWithdrawal = (initialTab: 'swap' | 'withdraw', direction: SwapDirection = 'bnb-to-usdt') => {
    setInitialWithdrawalTab(initialTab);
    if (initialTab === 'swap') {
      setInitialSwapDirection(direction);
    }
    setActivePage('Withdrawal');
  };

  const handleReceive = () => {
    if (!isConnected) {
      showError(t('error.connectWalletFirst'));
      return;
    }
    setReceiveModalOpen(false);
    // This action would typically interact with a wallet/contract.
    // For this prototype, we'll simulate a common failure case.
    showError(t('error.receiveFailed'));
  };

  // Listen for cross-component requests to open customer service modal
  React.useEffect(() => {
    const openHandler = () => setCustomerServiceModalOpen(true);
    window.addEventListener('openCustomerService', openHandler as EventListener);
    return () => window.removeEventListener('openCustomerService', openHandler as EventListener);
  }, []);

  const renderPage = () => {
    // Auto-connect wallet if available, otherwise show loading
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-md mx-auto pt-20">
            <Card className="shadow-xl border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground">Connecting wallet...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'Home':
        return (
          <>
            <Hero setActivePage={setActivePage} isConnected={isConnected} />
            <div className="px-4 space-y-4">
              <PoolStats />
              <OutputDetails />
              <Faq />
              <Partners />
            </div>
          </>
        );
      case 'Team':
        return <Team />;
      case 'Withdrawal':
        return <Withdrawal
                  initialTab={initialWithdrawalTab}
                  initialSwapDirection={initialSwapDirection}
                  onOpenRecords={(tab) => handleOpenRecords('Withdrawal', tab)}
                />;
      case 'Account':
        return <Account onOpenWithdrawal={handleOpenWithdrawal} onOpenRecords={(tab) => handleOpenRecords('Account', tab)} onGoToTrading={() => setActivePage('Trading')} />;
      case 'Certificate':
        return <Certificate onBack={() => setActivePage('Home')} />;
      case 'Record':
        return <Record onBack={() => setActivePage(recordSourcePage)} initialTab={initialRecordTab} />;
      case 'Trading':
        return <MiningPage isWalletConnected={isConnected} walletAddress={walletAccount?.address} />;
      case 'Admin':
        return <AdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-[#333] font-sans">
      <UserStatusChecker />
      <ErrorToast />
      {activePage !== 'Certificate' && activePage !== 'Record' && activePage !== 'Trading' && <Header />}
      <main className={activePage === 'Certificate' || activePage === 'Record' ? '' : 'pb-20'}>
        {renderPage()}
      </main>
      <FloatingChatButton onClick={() => setCustomerServiceModalOpen(true)} />
      {activePage !== 'Certificate' && activePage !== 'Record' && activePage !== 'Trading' && (
        <BottomNav activePage={activePage} setActivePage={setActivePage} />
      )}
      <CustomerServiceModal isOpen={isCustomerServiceModalOpen} onClose={() => setCustomerServiceModalOpen(false)} />
      <ReceiveModal 
        isOpen={isReceiveModalOpen} 
        onClose={() => setReceiveModalOpen(false)} 
        onReceive={handleReceive} 
      />
    </div>
  );
};

const App: React.FC = () => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);

    const onError = (ev: ErrorEvent) => {
      // Quietly handle third-party fetch errors that are out of our control
      if (ev.message && (ev.message.includes('body stream already read') || ev.message.includes('Failed to fetch') || ev.message.includes('Unexpected end of input'))) {
        // swallow to avoid flooding logs during previews
        ev.preventDefault();
        return;
      }
    };

    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason && typeof ev.reason === 'object' && 'message' in ev.reason ? (ev.reason as any).message : String(ev.reason);
      if (reason && (reason.includes('body stream already read') || reason.includes('Failed to fetch') || reason.includes('Unexpected end of input'))) {
        ev.preventDefault();
      }
    };

    // Wrap window.fetch to avoid noisy uncaught network errors from third-party scripts in preview
    try {
      const originalFetch = window.fetch.bind(window);
      // Only wrap once
      if (!(originalFetch as any).__wrappedByApp) {
        const wrappedFetch: typeof fetch = async (...args: Parameters<typeof fetch>) => {
          try {
            return await originalFetch(...args);
          } catch (err) {
            // Swallow transient network errors and return a valid JSON Response to prevent parsing errors
            console.debug('Wrapped fetch caught network error (non-fatal):', err);
            return new Response(JSON.stringify({}), { status: 504, statusText: 'Gateway Timeout', headers: { 'Content-Type': 'application/json' } });
          }
        };
        (wrappedFetch as any).__wrappedByApp = true;
        (wrappedFetch as any).original = originalFetch;
        // @ts-ignore
        window.fetch = wrappedFetch;
      }
    } catch (err) {
      // ignore if environment forbids overriding fetch
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <LanguageProvider>
          <BalanceProvider>
            <AppContent />
          </BalanceProvider>
        </LanguageProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
};

export default App;
