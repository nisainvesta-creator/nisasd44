import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useError } from '../hooks/useError';
import MiningReward from './MiningReward';
import './Hero.css';

interface HeroProps {
  setActivePage: (page: Page) => void;
  isConnected?: boolean;
}

const Hero: React.FC<HeroProps> = ({ setActivePage, isConnected }) => {
  const { t } = useLanguage();
  const { showError } = useError();
  const [showMining, setShowMining] = useState(false);
  const [reminderShown, setReminderShown] = useState(false);
  const [showWalletAlert, setShowWalletAlert] = useState(false);

  // Show wallet connection reminder immediately if not connected
  useEffect(() => {
    if (!isConnected && !reminderShown) {
      setShowWalletAlert(true);
      setReminderShown(true);
    }
  }, [isConnected, reminderShown]);

  return (
    <>
      {showWalletAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
            <p className="text-center mb-4">Please connect your wallet to unlock mining, trading, account management, and all platform features.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setActivePage('Trading'); // Navigate to wallet connect page
                  setShowWalletAlert(false);
                }}
                className="bg-[#07c160] text-white px-4 py-2 rounded-lg"
              >
                Connect Wallet
              </button>
              <button
                onClick={() => setShowWalletAlert(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="h-56 bg-cover bg-center text-white p-5 flex flex-col justify-end hero-background"
      >
        <div className="space-y-2">
          <h3 className="text-3xl font-bold hero-text-shadow">{t('hero.receiveVoucher')}</h3>
          <h3 className="text-3xl font-bold hero-text-shadow">{t('hero.noPledge')}</h3>
          <p className="text-sm">{t('hero.joinAndMine')}</p>
          <div className="pt-2 flex items-center space-x-4">
            <button
              onClick={() => {
                if (!isConnected) {
                  setActivePage('Trading'); // Navigate to mining page which will show connect wallet
                } else {
                  setShowMining(true);
                }
              }}
              disabled={!isConnected}
              className={`text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-md ${isConnected ? 'bg-[#07c160]' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {t('hero.startMining')}
            </button>
            <button
              onClick={() => setActivePage('Certificate')}
              className="bg-white/20 backdrop-blur-sm border border-white/50 text-white text-sm font-semibold px-6 py-2 rounded-lg"
            >
              {t('hero.certificate')}
            </button>
          </div>
        </div>
      </div>

      {showMining && (
        <MiningReward openInitially={true} hideTriggerButton={true} onClose={() => setShowMining(false)} />
      )}
    </>
  );
};

export default Hero;
