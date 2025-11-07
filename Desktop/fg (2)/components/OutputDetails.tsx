import React, { useState, useEffect } from 'react';
import { fetchOutputDetails } from '../api';
import { EarningHeadIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';
import { OutputItem } from '../types';

const OutputDetailsSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex justify-between items-center py-2">
        <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>
    ))}
  </div>
);

const OutputDetails: React.FC = () => {
  const { t } = useLanguage();
  const [details, setDetails] = useState<OutputItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchOutputDetails();
        setDetails(data);
      } catch (error) {
        console.error("Failed to fetch output details:", error);
      }
    };
    
    const initialLoad = async () => {
        setIsLoading(true);
        await loadData();
        setIsLoading(false);
    };

    initialLoad();

    const intervalId = setInterval(loadData, 20000); // Poll every 20 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold mb-3">{t('output.title')}</h2>
      <div className="h-48 overflow-hidden relative">
        {isLoading ? (
          <OutputDetailsSkeleton />
        ) : (
          <ul className="animate-scroll-vertical absolute top-0 left-0 w-full">
            {details.map((item, index) => (
              <li key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="flex items-center text-sm text-blue-600">
                  <EarningHeadIcon className="w-5 h-5 mr-2" />
                  {item.address}
                </span>
                <span className="text-sm text-gray-500">{item.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OutputDetails;