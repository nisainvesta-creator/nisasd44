import { useContext } from 'react';
import { LanguageContext, availableLanguages } from '../contexts/LanguageContext';

const noop = () => {};

export const useLanguage = () => {
  const context = useContext(LanguageContext as any);
  if (context === undefined || context === null) {
    console.warn('useLanguage called outside LanguageProvider — returning safe fallback');
    return {
      language: 'en',
      setLanguage: noop,
      t: (key: string, ..._args: any[]) => key,
      availableLanguages,
    } as any;
  }
  return context;
};
