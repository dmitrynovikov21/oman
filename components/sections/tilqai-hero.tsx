'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { heroContent } from "@/lib/i18n/content";

export default function TilqaiHero() {
    const { lang, toggleLang } = useLanguage();
    const t = heroContent;

    return (
        <section className="relative min-h-screen overflow-hidden">
            {/* Layer 1: Main hero media (spirals) — deepest */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-[-2]">
                <img
                    src="/assets/hero/hero-left.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Layer 2: Gray squares — top and bottom vignettes */}
            <div className="absolute inset-x-0 top-0 h-[30%] pointer-events-none z-[-1]"
                style={{ background: 'linear-gradient(to bottom, rgba(12,12,18,0.7), transparent)' }} />
            <div className="absolute inset-x-0 bottom-0 h-[30%] pointer-events-none z-[-1]"
                style={{ background: 'linear-gradient(to top, rgba(12,12,18,0.7), transparent)' }} />

            {/* Layer 3: Perspective grid lines — above gray squares */}
            <div className="absolute inset-x-0 top-0 pointer-events-none z-[0] opacity-40">
                <img
                    src="/assets/hero/bg-lines-2.png"
                    alt=""
                    className="w-full h-auto"
                />
            </div>
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-[0] opacity-40">
                <img
                    src="/assets/hero/bg-lines-1.png"
                    alt=""
                    className="w-full h-auto"
                />
            </div>

            {/* Navigation - TWO separate containers as per Figma */}
            <nav className="relative z-10 px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-stretch gap-4">
                    {/* LEFT: Logo container - takes most width, pill-shaped */}
                    <div className="flex-1 flex items-center px-6 h-12 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
                        <span className="text-white font-medium text-lg tracking-wide">tilqai</span>
                    </div>

                    {/* RIGHT: Language switcher - compact pill, same height */}
                    <button
                        onClick={toggleLang}
                        className="flex items-center gap-2 px-5 h-12 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm text-sm cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <span className={`font-medium transition-colors ${lang === 'en' ? 'text-white' : 'text-white/60'}`}>EN</span>
                        <span className="text-white/40">/</span>
                        <span className={`font-medium transition-colors ${lang === 'ar' ? 'text-white' : 'text-white/60'}`}>AR</span>
                    </button>
                </div>
            </nav>

            {/* Hero Content - centered */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-10 md:pt-20 pb-40">
                {/* Oman badge - centered above heading */}
                <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-[#0164F7]/20 bg-transparent backdrop-blur-sm shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                    <span className="text-lg">🇴🇲</span>
                    <span className="text-white/80 text-sm font-medium">{t.badge[lang]}</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold leading-[1.1] tracking-tight max-w-5xl mx-auto">
                    <span className="text-white">{t.headline[lang]}</span>
                </h1>

                {/* Subheading */}
                <p className="max-w-2xl text-white/60 text-lg md:text-xl mt-8 mb-10 leading-relaxed">
                    {t.subheadline[lang]}
                </p>

                {/* CTA Button */}
                <Link
                    href="#contact"
                    className="group flex items-center gap-2 px-8 py-4 bg-[#3B82F6] text-white font-medium rounded-full hover:bg-[#2563EB] transition-colors"
                >
                    <span>{t.cta[lang]}</span>
                    <svg
                        className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
