import React from 'react';

// Minimal shim for wagmi hooks and providers used by the app during development.
// This avoids deep dependency issues and lets the UI render without a real wallet.

export const WagmiConfig: React.FC<{ config?: any; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const createConfig = (_: any) => {
  // Return a simple object; real wagmi createConfig does more but the shim only needs to be present.
  return {} as any;
};

export const useAccount = () => {
  return { address: undefined as string | undefined, isConnected: false };
};

export const useBalance = (_opts?: any) => {
  return { data: undefined as any, refetch: async () => undefined };
};

export const useConnect = () => {
  return { connect: async () => ({}) , connectors: [] };
};

export const useDisconnect = () => {
  return { disconnect: async () => {} };
};

export const useConfig = () => ({ /* minimal config */ });

export default {
  WagmiConfig,
  createConfig,
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useConfig,
};
