import React from 'react';
import { HomeIcon, CardIcon, UserIcon } from './Icons';
import type { Page } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const BottomNav: React.FC<{
  activePage: Page;
  setActivePage: (page: Page) => void;
}> = ({ activePage, setActivePage }) => {
  const { t } = useLanguage();

  const navItems = [
    { name: 'Home', icon: HomeIcon, label: t('bottomNav.home') },
    { name: 'Withdrawal', icon: CardIcon, label: t('bottomNav.withdrawal') },
    { name: 'Account', icon: UserIcon, label: t('bottomNav.account') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activePage === item.name;
          const IconComponent = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name as Page)}
              className={`flex flex-col items-center justify-center space-y-1 text-sm ${isActive ? 'text-[#07c160]' : 'text-gray-500'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <IconComponent className="w-6 h-6" isActive={isActive} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
