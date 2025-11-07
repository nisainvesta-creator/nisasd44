import { createContext, useCallback, useEffect, useState, ReactNode, FC } from 'react';

export type Language = 'en' | 'es' | 'zh' | 'ja' | 'fr' | 'pt' | 'de' | 'sv' | 'ru' | 'it' | 'tr';

export const availableLanguages: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    zh: '中文',
    ja: '日本語',
    fr: 'Français',
    pt: 'Português',
    de: 'Deutsch',
    sv: 'Svenska',
    ru: 'Русский',
    it: 'Italiano',
    tr: 'Türkçe',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string,
  ...args: any[]) => string;
  availableLanguages: Record<Language, string>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper: map browser locale to supported language
const detectBrowserLanguage = (): Language => {
    if (typeof navigator === 'undefined' || !navigator.language) return 'en';
    const nav = navigator.language.toLowerCase();
    const base = nav.split('-')[0];
    if ((Object.keys(availableLanguages) as string[]).includes(base)) {
        return base as Language;
    }
    // handle specific fallbacks
    if (base === 'zh') return 'zh';
    if (base === 'ja') return 'ja';
    return 'en';
};

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [translations, setTranslations] = useState<Record<string, any> | null>(null);
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const storedLang = localStorage.getItem('app-language');
            if (storedLang && (availableLanguages as any)[storedLang]) return storedLang as Language;
        } catch (e) {
            // ignore
        }
        return detectBrowserLanguage();
    });
    
    useEffect(() => {
        const fetchTranslations = async () => {
            const languagesToFetch = Object.keys(availableLanguages) as Language[];
            try {
                const translationPromises = languagesToFetch.map(lang =>
                    fetch(`./i18n/locales/${lang}.json`).then(async res => {
                        if (!res.ok) {
                            // Treat non-OK as empty translations to avoid throwing
                            return {};
                        }
                        try {
                            return await res.json();
                        } catch {
                            return {};
                        }
                    }).catch(() => {
                        // Network error -> return empty object
                        return {};
                    })
                );

                const settledTranslations = await Promise.allSettled(translationPromises);

                const newTranslations = languagesToFetch.reduce((acc, lang, index) => {
                    const settled = settledTranslations[index];
                    if (settled && settled.status === 'fulfilled') {
                        acc[lang] = settled.value as Record<string, any>;
                    } else {
                        acc[lang] = {};
                    }
                    return acc;
                }, {} as Record<Language, any>);

                setTranslations(newTranslations);

            } catch (error) {
                // This should be rare; fall back gracefully without noisy logging
                console.debug("Failed to load translations (fallback):", error);
                const fallbackTranslations = languagesToFetch.reduce((acc, lang) => {
                    acc[lang] = {};
                    return acc;
                }, {} as Record<Language, any>);
                setTranslations(fallbackTranslations);
            }
        };
        fetchTranslations();
    }, []);

    useEffect(() => {
        localStorage.setItem('app-language', language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        if (availableLanguages[lang]) {
            setLanguageState(lang);
        }
    };

    const t = useCallback((key: string, ...args: any[]): string => {
        if (!translations) {
            return key; // Return key as a fallback while loading
        }

        const getNestedTranslation = (lang: Language, k: string): string | undefined => {
            if (!translations[lang]) return undefined;
            return k.split('.').reduce((obj, part) => obj && obj[part], translations[lang]);
        };

        const translation = getNestedTranslation(language, key);
        if (translation === undefined || translation === null) {
            console.warn(`Translation key "${key}" not found for language "${language}"`);
            // Fallback to English if key not found in current language
            const fallback = getNestedTranslation('en', key);
            return fallback || key;
        }

        if (args.length > 0) {
            // Basic interpolation, e.g., t('key', 'value') replaces {0} with 'value'
            return translation.replace(/{(\d+)}/g, (match, number) => {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        }

        return translation;
    }, [language, translations]);

    const value = { language, setLanguage, t, availableLanguages };

    // Render children immediately while translations load. t() will fallback to keys until translations arrive.
    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
