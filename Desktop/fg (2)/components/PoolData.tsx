import React, { useState, useEffect } from 'react';
import { fetchPoolData } from '../api';
import { useLanguage } from '../hooks/useLanguage';
import { PoolDataItem } from '../types';

const PoolDataSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="space-y-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>
    ))}
  </div>
);

const PoolData: React.FC = () => {
  const { t } = useLanguage();
  const [poolData, setPoolData] = useState<PoolDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPoolData(t);
        setPoolData(data);
      } catch (error) {
        console.error("Failed to fetch pool data:", error);
      }
    };
    
    const initialLoad = async () => {
        setIsLoading(true);
        await loadData();
        setIsLoading(false);
    }
    
    initialLoad();
    
    const intervalId = setInterval(loadData, 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [t]);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-5 -mt-10 relative z-10">
      {isLoading ? (
        <PoolDataSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {poolData.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="text-sm font-medium text-gray-500">{item.label}</div>
              <div className="font-bold text-2xl text-gray-900 truncate">
                <span>{item.value}</span>
                {item.currency && <span className="text-xl font-semibold ml-1.5">{item.currency}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoolData;