import React, { useState, useRef, useEffect } from 'react';
// FIX: Import 'CloseIcon' to be used in the renderSyncIcon function.
import { ChevronDownIcon, BellIcon, GlobeAltIcon } from './Icons';
import { useLanguage } from '../hooks/useLanguage';
import WalletConnect from './WalletConnect';
import { Language } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const [isLangDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  

  return (
    <header className="bg-white p-3">
      <div className="flex justify-between items-center">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center space-x-1 text-sm text-gray-700">
            <GlobeAltIcon className="w-5 h-5" />
            <span>{availableLanguages[language]}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {isLangDropdownOpen && (
            <div className="absolute top-full mt-2 w-32 bg-white rounded-md shadow-lg z-20 animate-fade-in-down">
              <ul>
                {(Object.keys(availableLanguages) as Language[]).map(langKey => (
                  <li key={langKey}>
                    <button 
                      onClick={() => handleLanguageChange(langKey)}
                      className={`w-full text-left px-4 py-2 text-sm ${language === langKey ? 'font-bold text-[#07c160]' : 'text-gray-700'} hover:bg-gray-100`}
                    >
                      {availableLanguages[langKey]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <WalletConnect />
          <div className="text-gray-500">
            <BellIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
