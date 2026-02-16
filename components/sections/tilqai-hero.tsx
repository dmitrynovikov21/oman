'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLanguage } from "@/lib/i18n/context";
import { heroContent } from "@/lib/i18n/content";

const FloatingLines = dynamic(() => import("@/components/ui/FloatingLines"), {
    ssr: false,
});

export default function TilqaiHero() {
    const { lang, toggleLang } = useLanguage();
    const t = heroContent;

    return (
        <section className="relative min-h-screen overflow-hidden">
            {/* FloatingLines WebGL background */}
            <div className="absolute inset-0 z-[0]">
                <FloatingLines
                    linesGradient={["#001cf0", "#2F4BC0", "#d1e0ff"]}
                    animationSpeed={0.7}
                    interactive
                    bendRadius={5}
                    bendStrength={-0.5}
                    mouseDamping={0.05}
                    parallax
                    parallaxStrength={0.2}
                />
            </div>

            {/* Star particles overlay — above FloatingLines */}
            <div className="absolute inset-0 pointer-events-none z-[1]" style={{ mixBlendMode: 'screen' }}>
                <img
                    src="/assets/hero/Clip path group.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
            </div>

            {/* Bottom gradient — seamless transition to next section */}
            <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none z-[2]"
                style={{ background: 'linear-gradient(to bottom, transparent, #040405)' }} />

            {/* Navigation - TWO separate containers as per Figma */}
            <nav className="relative z-10 px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-stretch gap-4">
                    {/* LEFT: Logo + Nav links - logo left, links centered */}
                    <div className="flex-1 flex items-center gap-6 px-6 h-12 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
                        <img src="/brand/logo-dark.jpeg" alt="tilqai" className="h-9 w-auto object-contain rounded-sm" />
                        <div className="hidden md:flex items-center gap-5 flex-1 justify-center">
                            <a href="#applications" className="text-white/60 text-sm hover:text-white transition-colors" style={{ fontFamily: 'var(--font-manrope)' }}>{lang === 'ar' ? 'الخدمات' : 'Services'}</a>
                            <a href="#about" className="text-white/60 text-sm hover:text-white transition-colors" style={{ fontFamily: 'var(--font-manrope)' }}>{lang === 'ar' ? 'عنّا' : 'About'}</a>
                            <a href="#contact" className="text-white/60 text-sm hover:text-white transition-colors" style={{ fontFamily: 'var(--font-manrope)' }}>{lang === 'ar' ? 'تواصل' : 'Contact'}</a>
                        </div>
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
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-10 md:pt-20 pb-6 md:pb-20">
                {/* Oman badge - centered above heading */}
                <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-[#0164F7]/20 bg-transparent backdrop-blur-sm shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                    <span className="text-lg">🇴🇲</span>
                    <span className="text-white/80 text-sm font-medium" style={{ fontFamily: 'var(--font-manrope)' }}>{t.badge[lang]}</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold leading-[1.1] tracking-tight max-w-5xl mx-auto" style={{ fontFamily: 'var(--font-montserrat)' }}>
                    <span className="text-white">
                        {lang === 'en' ? (<>What if your work<br />runs by itself.</>) : t.headline[lang]}
                    </span>
                </h1>

                {/* Subheading */}
                <p className="max-w-2xl text-white/60 text-lg md:text-xl mt-8 mb-10 leading-relaxed" style={{ fontFamily: 'var(--font-manrope)' }}>
                    {t.subheadline[lang]}
                </p>

                {/* CTA Button */}
                <Link
                    href="#contact"
                    className="group flex items-center gap-2 px-8 py-4 bg-[#0066FF] text-white font-semibold rounded-full hover:bg-[#0452C7] transition-colors"
                    style={{ fontFamily: 'var(--font-montserrat)' }}
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
