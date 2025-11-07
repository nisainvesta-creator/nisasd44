import { useAccount, useBalance } from '../lib/wagmi-shim';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { useAccount } from 'wagmi';
import { useBalance as wagmiUseBalance } from '../lib/wagmi-shim';

interface User {
  id: number;
  name?: string;
  email: string;
  wallet_address: string;
  is_active: boolean;
  wallet_connected?: boolean;
  last_wallet_connection?: string;
}

interface Token {
  access_token: string;
  token_type: string;
}

export const useWallet = () => {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = wagmiUseBalance({ address, token: undefined });

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const ethBalance = balanceData ? balanceData.formatted : '0';

  const connectWallet = async (walletAddress: string) => {
    setIsConnecting(true);
    const controller = new AbortController();
    const timeoutMs = 8000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use backend auth login endpoint to get JWT by wallet address
      let response: Response | null = null;
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: walletAddress }),
          signal: controller.signal,
        });
      } catch (networkErr: any) {
        if (networkErr.name === 'AbortError') {
          throw new Error('Request timed out connecting to backend');
        }
        throw new Error(`Network error connecting to backend: ${networkErr?.message || networkErr}`);
      } finally {
        clearTimeout(timeout);
      }

      if (!response || !response.ok) {
        const text = response ? await response.text().catch(() => '') : '';
        console.error(`Backend login failed (${response?.status}):`, text);
        throw new Error(`Login failed: ${response?.status || 'no response'} ${text}`);
      }

      const loginData = await response.json();
      const accessToken = loginData?.access_token;
      if (!accessToken) {
        throw new Error('No access token returned from backend login');
      }

      // Store token and fetch user info
      localStorage.setItem('auth_token', accessToken);
      setToken({ access_token: accessToken, token_type: loginData?.token_type || 'bearer' });

      const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!meRes.ok) {
        const text = await meRes.text().catch(() => '');
        console.error('Failed to fetch user after login:', meRes.status, text);
        throw new Error('Failed to fetch user data after login');
      }

      const me = await meRes.json();
      setUser(me);

      // Notify backend that wallet is connected for this user (mark wallet_connected)
      try {
        await fetch(`${API_BASE_URL}/api/v1/connect-wallet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ user_id: me.id, wallet_address: walletAddress }),
        });
      } catch (notifyErr) {
        console.warn('Failed to notify backend of wallet connection:', notifyErr);
      }

    } catch (error) {
      console.error('Wallet connection failed:', error);
      // cleanup on failure
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  // Check for existing token on mount and validate with backend
  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken || user) return;

      try {
        setIsConnecting(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (!res.ok) {
          // Invalid or expired token
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
          return;
        }

        const userData = await res.json();
        setUser(userData);
        setToken({ access_token: storedToken, token_type: 'bearer' });
      } catch (err) {
        console.error('Failed to restore session from stored token:', err);
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsConnecting(false);
      }
    };

    restore();
  }, [user]);

  return {
    isConnected: !!isConnected,
    walletAddress: address ?? null,
    ethBalance,
    user,
    token,
    isConnecting,
    connectWallet,
    logout,
  };
};

export default useWallet;
