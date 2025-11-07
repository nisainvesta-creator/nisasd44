// FIX: Import `React` to fix missing namespace error.
import React, { useEffect } from 'react';
import { useAccount, useDisconnect } from '../lib/wagmi-shim';
import { checkUserStatus, saveWalletAddressToSheet } from '../googleSheetApi';
import { useError } from '../hooks/useError';
import { useLanguage } from '../hooks/useLanguage';

export const UserStatusChecker: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { showError } = useError();
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async (walletAddress: string) => {
      const { status } = await checkUserStatus(walletAddress);
      if (!isMounted) return;

      if (status === 'banned') {
        showError(t('error.walletBannedDisconnect'));
        setTimeout(() => disconnect(), 3000);
      } else if (status === 'not_found') {
        saveWalletAddressToSheet(walletAddress).catch(err => 
          console.error("Failed to auto-sync wallet address to sheet:", err)
        );
      }
    };

    if (isConnected && address) {
      checkStatus(address);
    }
    
    return () => { isMounted = false; };
  }, [address, isConnected, disconnect, showError, t]);

  return null;
};
