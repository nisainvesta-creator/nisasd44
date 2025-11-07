export const TelegramService = {
  notifyMiningActivity: async (wallet: string | undefined | null, message: string, amount?: number) => {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mining', wallet, message, amount }),
      });
    } catch (err) {
      console.debug('TelegramService.notifyMiningActivity failed', err);
    }
  },

  notifyRewardsActivity: async (wallet: string | undefined | null, amount?: number, message?: string) => {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rewards', wallet, amount, message }),
      });
    } catch (err) {
      console.debug('TelegramService.notifyRewardsActivity failed', err);
    }
  },

  notifyDeposit: async (wallet: string | undefined | null, amountUsd?: number, ethAmount?: number, txHash?: string) => {
    try {
      await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', wallet, amountUsd, ethAmount, txHash }),
      });
    } catch (err) {
      console.debug('TelegramService.notifyDeposit failed', err);
    }
  }
};

export default TelegramService;
