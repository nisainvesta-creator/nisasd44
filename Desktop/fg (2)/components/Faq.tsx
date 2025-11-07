
import React, { useState, useEffect } from 'react';
import { fetchFaqData } from '../api';
import { FaqItem } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const FaqAccordionItem: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-left"
      >
        <span className="font-medium">{item.question}</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="pb-4 pr-5 text-gray-600 text-sm">
          <p>{item.answer}</p>
        </div>
      )}
    </div>
  );
};

const FaqSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex justify-between items-center py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
      </div>
    ))}
  </div>
);

const Faq: React.FC = () => {
  const { t } = useLanguage();
  const [faqData, setFaqData] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchFaqData(t);
        setFaqData(data);
      } catch (error) {
        console.error("Failed to fetch FAQ data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [t]);


  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-bold mb-2">{t('faq.title')}</h2>
      <div className="bg-white rounded-lg">
        {isLoading ? (
          <FaqSkeleton />
        ) : (
            faqData.map((item, index) => (
              <FaqAccordionItem key={index} item={item} />
            ))
        )}
      </div>
    </div>
  );
};

export default Faq;