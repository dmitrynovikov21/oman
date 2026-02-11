'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
    lang: Language;
    toggleLang: () => void;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    toggleLang: () => { },
    isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Language>('en');

    const toggleLang = useCallback(() => {
        setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
    }, []);

    const isRTL = lang === 'ar';

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, isRTL }}>
            <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : ''}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

/** Helper: pick text by current language */
export function useT<T extends Record<string, { en: string; ar: string }>>(
    section: T
): Record<keyof T, string> {
    const { lang } = useLanguage();
    const result = {} as Record<keyof T, string>;
    for (const key in section) {
        result[key] = section[key][lang];
    }
    return result;
}
