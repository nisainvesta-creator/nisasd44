import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useWallet } from '../hooks/useWallet';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { API_BASE_URL } from '../constants';

interface WalletConnectProps {
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  onConnect,
  onDisconnect,
}) => {
  const [address, setAddress] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const { connectWallet, logout, isConnecting: isBackendConnecting, user } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [walletStatus, setWalletStatus] = useState<{wallet_connected?: boolean, wallet_address?: string, last_connection?: string} | null>(null);
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();

  // Sync with AppKit account state
  useEffect(() => {
    if (appKitConnected && appKitAddress) {
      setAddress(appKitAddress);
      setIsConnected(true);
    } else {
      setAddress(undefined);
      setIsConnected(false);
    }
  }, [appKitConnected, appKitAddress]);

  // Update display name when address changes
  useEffect(() => {
    if (address) {
      setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
    }
  }, [address]);

  // Auto-connect backend when wallet is connected
  useEffect(() => {
    if (isConnected && address && !user && !isAuthenticating) {
      handleWalletConnect();
    }
  }, [isConnected, address, user]);

  // Fetch wallet status when user is available
  useEffect(() => {
    if (user?.id) {
      fetchWalletStatus();
    }
  }, [user?.id]);

  const handleWalletConnect = async () => {
    if (!address) return;

    setIsAuthenticating(true);
    try {
      try {
        await connectWallet(address);
        if (onConnect) {
          onConnect(address);
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.error('Failed to authenticate with backend:', errorMsg);
        // Don't crash on auth errors - wallet is still connected
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const fetchWalletStatus = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wallet-status/${user.id}`);
      if (response.ok) {
        const status = await response.json();
        setWalletStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch wallet status:', error);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      // Disconnect from backend
      if (user?.id) {
        await fetch(`${API_BASE_URL}/api/v1/disconnect-wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        });
      }

      logout();

      // Clear local state
      setAddress(undefined);
      setIsConnected(false);
      setDisplayName('');
      setWalletStatus(null);

      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = async () => {
    try {
      open();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
    }
  };

  const isLoading = isAuthenticating || isBackendConnecting || isDisconnecting;

  // Connected state - show address and disconnect button
  if (isConnected && address) {
    return (
      <div className={className}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleConnect}
              className="text-sm font-medium hover:opacity-80 transition-opacity bg-[#07c160] text-white px-3 py-1 rounded-md"
              title={address}
            >
              {displayName}
            </button>
            {walletStatus?.wallet_connected && (
              <span className="text-xs text-green-500">✓ Connected to backend</span>
            )}
            {walletStatus?.last_connection && (
              <span className="text-xs text-gray-500">
                Last: {new Date(walletStatus.last_connection).toLocaleDateString()}
              </span>
            )}
          </div>

          <Button
            onClick={handleDisconnect}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className={className}>
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        variant={variant === 'ghost' ? 'ghost' : 'default'}
        size={size}
        className={variant === 'default' ? 'bg-[#07c160] hover:bg-[#06a552] text-white' : ''}
      >
        {isAuthenticating ? 'Authenticating...' : isBackendConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
};

export default WalletConnect;
