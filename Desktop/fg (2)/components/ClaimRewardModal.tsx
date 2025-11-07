import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWallet } from '../hooks/useWallet';
import { DEPOSIT_ADDRESSES } from '../constants';
import { API_BASE_URL } from '../constants';

interface ClaimRewardModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ClaimRewardModal: React.FC<ClaimRewardModalProps> = ({
  children,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}) => {
  const { user, token } = useWallet();
  const [rewardId, setRewardId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const depositAddress = DEPOSIT_ADDRESSES.BSC;

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  const handleClaimReward = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      alert('Please connect your wallet first');
      return;
    }

    if (!rewardId || !amount || parseFloat(amount) <= 0) {
      alert('Please enter valid reward ID and amount');
      return;
    }

    setIsLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/claim-reward`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: user?.id || null,
          reward_amount: parseFloat(amount),
          reward_type: 'mining',
        }),
      });

      if (!response.ok) {
        // Attempt to parse error body safely
        let errText = '';
        try { errText = await response.text(); errText = errText || response.statusText; } catch (e) { errText = response.statusText; }
        throw new Error(errText || 'Claim failed');
      }

      const result = await response.json();
      alert(`Claim successful! ${result.message}`);
      setRewardId('');
      setAmount('');
      setIsOpen(false);
    } catch (error) {
      console.error('Claim error:', error);
      alert(error instanceof Error ? error.message : 'Claim failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <div onClick={() => setIsOpen(true)}>
        {children || <Button variant="outline">Claim Reward</Button>}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Claim Reward</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleClaimReward} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rewardId">Reward ID</Label>
                <Input
                  id="rewardId"
                  type="number"
                  value={rewardId}
                  onChange={(e) => setRewardId(e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p><strong>Note:</strong> You must have deposited at least $5,555 to claim rewards over $25,000.</p>
                <p className="mt-2"><strong>Deposit Address:</strong> {depositAddress}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Claim Reward'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimRewardModal;
