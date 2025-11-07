import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWallet } from '../hooks/useWallet';
import { API_BASE_URL } from '../constants';

const BotControl: React.FC = () => {
  const { token } = useWallet();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!message) return setStatus('Please enter a message');
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/bot/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token.access_token || token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const text = await res.text();
        setStatus(`Failed: ${res.status} ${text}`);
      } else {
        setStatus('Message sent');
        setMessage('');
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || String(err)}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-2">Bot Control</h3>
      <div className="space-y-2">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message to send" />
        <div className="flex items-center gap-2">
          <Button onClick={sendMessage} disabled={sending}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
          {status && <span className="text-sm text-gray-600">{status}</span>}
        </div>
      </div>
    </div>
  );
};

export default BotControl;
