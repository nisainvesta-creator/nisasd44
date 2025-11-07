import React, { useEffect, useState } from 'react';
import { getPoolStats } from '../api';

export const PoolStats: React.FC = () => {
  const [selectedDuration, setSelectedDuration] = useState('24H');

  const [stats, setStats] = useState([
    { label: 'Total Output', value: '—', unit: 'BNB' },
    { label: 'Valid Nodes', value: '—', unit: '' },
    { label: 'Participants', value: '—', unit: '' },
    { label: 'User Revenue', value: '—', unit: 'USDT' },
  ]);

  useEffect(() => {
    let mounted = true;
    getPoolStats()
      .then((data) => {
        if (!mounted) return;
        setStats([
          { label: 'Total Output', value: data.total_output_bnb.toLocaleString('en-US', { maximumFractionDigits: 2 }), unit: 'BNB' },
          { label: 'Valid Nodes', value: data.valid_nodes.toLocaleString('en-US'), unit: '' },
          { label: 'Participants', value: data.participants.toLocaleString('en-US'), unit: '' },
          { label: 'User Revenue', value: data.user_revenue_usdt.toLocaleString('en-US', { maximumFractionDigits: 2 }), unit: 'USDT' },
        ]);
      })
      .catch(() => {});
    return () => { mounted = false };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm mx-4 my-6 p-6">
      <div className="poolData-container">
        <div className="grid grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="poolData-item text-center">
              <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
              <div className="value">
                <span className="text-lg text-gray-900">{stat.value}</span>
                {stat.unit && <span className="text-sm text-gray-700 ml-1">{stat.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoolStats;
