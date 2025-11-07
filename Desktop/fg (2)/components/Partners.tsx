
import React, { useState, useEffect } from 'react';
import { fetchPartners } from '../api';
import { useLanguage } from '../hooks/useLanguage';
import { Partner } from '../types';

const PartnersSkeleton: React.FC = () => (
    <div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-3 animate-pulse"></div>
        <div className="h-40 bg-gray-200 rounded-lg w-full max-w-xs mx-auto animate-pulse"></div>

        <div className="mt-6">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mt-2 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-200 p-2 rounded-lg h-16 animate-pulse"></div>
            ))}
            </div>
        </div>
    </div>
);

const Partners: React.FC = () => {
  const { t } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPartners();
        setPartners(data);
      } catch (error) {
        console.error("Failed to fetch partners data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-6">
      {isLoading ? (
        <PartnersSkeleton />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-bold mb-3 text-center">{t('partners.whitepaper')}</h2>
            <div className="flex justify-center">
                <img 
                    src="https://a8m4u5.aibotbnb88.cc/upload/20250501/2025050175542.png" 
                    alt="Whitepaper" 
                    className="rounded-lg max-w-xs w-full" 
                />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-center">{t('partners.title')}</h2>
            <p className="text-center text-gray-500 text-sm mb-4">{t('partners.subtitle')}</p>
            <div className="grid grid-cols-3 gap-4">
              {partners.map((partner, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
                  <img src={partner.logo} alt={partner.name} className="max-h-12 w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Partners;