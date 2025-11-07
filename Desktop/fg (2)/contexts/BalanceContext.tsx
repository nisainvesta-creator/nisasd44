import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useBalance } from '../lib/wagmi-shim';
import { fetchPoolWalletUsdtBalance } from '../api';

interface BalanceContextType {
  bnbBalance: number;
  usdtBalance: number;
  poolWalletBalance: number | null;
  bnbUnderReview: number;
  usdtUnderReview: number;
  holdForReview: (currency: 'BNB' | 'USDT', amount: number) => void;
  refreshBalances: () => Promise<void>;
}

export const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

const USDT_CONTRACT_ADDRESS_BSC = '0x55d398326f99059fF775485246999027B3197955';

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();

  const [poolWalletBalance, setPoolWalletBalance] = useState<number | null>(null);
  const [bnbUnderReview, setBnbUnderReview] = useState(0);
  const [usdtUnderReview, setUsdtUnderReview] = useState(0);

  // FIX: Moved `enabled` and `refetchInterval` into the `query` object to match the expected type for this version of wagmi.
  const { data: bnbData, refetch: refetchBnbBalance } = useBalance({
    address,
    query: {
      enabled: isConnected,
      refetchInterval: 15000,
    },
  });

  // FIX: Moved `enabled` and `refetchInterval` into the `query` object to match the expected type for this version of wagmi.
  const { data: usdtData, refetch: refetchUsdtBalance } = useBalance({
    address,
    token: USDT_CONTRACT_ADDRESS_BSC,
    query: {
      enabled: isConnected,
      refetchInterval: 15000,
    },
  });
  
  const bnbBalance = bnbData ? parseFloat(bnbData.formatted) : 0;
  const usdtBalance = usdtData ? parseFloat(usdtData.formatted) : 0;

  const fetchAndSetPoolBalance = useCallback(async () => {
    try {
        const balance = await fetchPoolWalletUsdtBalance();
        setPoolWalletBalance(balance);
    } catch (e) {
        console.error("Failed to fetch pool balance:", e);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (address) {
        await Promise.all([
            refetchBnbBalance(),
            refetchUsdtBalance(),
            fetchAndSetPoolBalance(),
        ]);
    }
  }, [address, refetchBnbBalance, refetchUsdtBalance, fetchAndSetPoolBalance]);
  
  useEffect(() => {
    if (isConnected) {
      fetchAndSetPoolBalance();
      const intervalId = setInterval(fetchAndSetPoolBalance, 15000);
      return () => clearInterval(intervalId);
    } else {
      setPoolWalletBalance(null);
    }
  }, [isConnected, fetchAndSetPoolBalance]);

  useEffect(() => {
    if (!isConnected) {
        setBnbUnderReview(0);
        setUsdtUnderReview(0);
    }
  }, [isConnected]);

  const holdForReview = useCallback((currency: 'BNB' | 'USDT', amount: number) => {
    if (currency === 'BNB') {
      setBnbUnderReview(prev => prev + amount);
      setTimeout(() => {
        setBnbUnderReview(prev => Math.max(0, prev - amount));
      }, 15000);
    } else {
      setUsdtUnderReview(prev => prev + amount);
      setTimeout(() => {
        setUsdtUnderReview(prev => Math.max(0, prev - amount));
      }, 15000);
    }
  }, []);
  
  const value = { bnbBalance, usdtBalance, poolWalletBalance, refreshBalances, bnbUnderReview, usdtUnderReview, holdForReview };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};
