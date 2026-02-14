'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { footerContent } from "@/lib/i18n/content";

export default function TilqaiFooter() {
    const { lang } = useLanguage();
    const t = footerContent;

    return (
        <footer className="relative py-12 overflow-hidden">
            {/* Background image with noise */}
            <img
                src="/assets/footer/bg-main.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Content overlay */}
            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Top row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    {/* Logo */}
                    <img src="/brand/logo-dark.jpeg" alt="tilqai" className="h-12 w-auto object-contain rounded-sm" />

                    {/* Email */}
                    <a
                        href="mailto:hello@tilqai.com"
                        className="text-white hover:text-white/80 transition-colors"
                    >
                        hello@tilqai.com
                    </a>
                </div>

                {/* Middle row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <span className="text-white/90 text-lg">
                        {t.tagline[lang]}
                    </span>
                    <span className="text-white/90 flex items-center gap-2">
                        <span className="text-xl">🇴🇲</span>
                        {t.location[lang]}
                    </span>
                </div>

                {/* Bottom row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/20 text-sm text-white/70">
                    <span>{t.copyright[lang]}</span>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            {t.privacy[lang]}
                        </Link>
                        <span>/</span>
                        <Link href="/terms" className="hover:text-white transition-colors">
                            {t.terms[lang]}
                        </Link>
                        <span>/</span>
                        <span>{t.rights[lang]}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
