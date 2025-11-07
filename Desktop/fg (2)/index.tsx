import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Buffer } from 'buffer';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, bsc } from '@reown/appkit/networks';
import { QueryClient } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

// Polyfill Buffer for wagmi/viem
// FIX: Cast window to any to assign Buffer property and resolve TypeScript error.
(window as any).Buffer = Buffer;

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://dashboard.reown.com
const projectId = '1a0c7cdbde5bbcbd844bfc6f858ecbd5'; // Replace with your actual project ID

// 2. Create a metadata object - optional
const metadata = {
  name: 'AI Bot Smart',
  description: 'AI-powered trading and mining platform',
  url: 'https://ai-bot-smart.com',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
};

// 3. Set the networks
const networks: [typeof mainnet, typeof bsc] = [mainnet, bsc];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  ssr: true
});

// 5. Get the wagmi config from the adapter
const wagmiConfig = wagmiAdapter.wagmiConfig;

// 6. Create modal with network-safe fallback
try {
  // Expose W3M project id to runtime for Web3Modal/AppKit internals
  (window as any).W3M_PROJECT_ID = projectId;

  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: undefined,
    themeMode: "light",
    themeVariables: {
      "--w3m-color-mix": "#ffffff",
      "--w3m-color-mix-strength": 0,
      "--w3m-border-radius-master": "12px",
      "--w3m-accent": "#07c160",
      "--w3m-font-family": "Inter, sans-serif",
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
      emailShowWallets: false,
      swaps: false,
      onramp: false
    },
    allWallets: "HIDE",
    enableWalletConnect: true,
    enableInjected: true,
    enableEIP6963: true,
    enableCoinbase: true,
    enableWalletGuide: true
  });
} catch (err) {
  // If remote fetch fails (CORS/network), fall back to local-only config without projectId and disable remote wallet discovery
  console.warn('createAppKit remote initialization failed, falling back to local features:', err);
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    metadata: undefined,
    themeMode: "light",
    themeVariables: {
      "--w3m-color-mix": "#ffffff",
      "--w3m-color-mix-strength": 0,
      "--w3m-border-radius-master": "12px",
      "--w3m-accent": "#07c160",
      "--w3m-font-family": "Inter, sans-serif",
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
      emailShowWallets: false,
      swaps: false,
      onramp: false
    },
    allWallets: "HIDE",
    // Disable remote wallet discovery in fallback
    enableWalletConnect: false,
    enableInjected: false,
    enableEIP6963: false,
    enableCoinbase: false,
    enableWalletGuide: false
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <App />
    </WagmiProvider>
  </React.StrictMode>
);
