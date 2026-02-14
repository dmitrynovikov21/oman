'use client';

import { useLanguage } from "@/lib/i18n/context";
import { realityContent } from "@/lib/i18n/content";
import Link from "next/link";

/**
 * "The Reality" Hook Section
 * Clean dark section — no mouse-follow orb, just subtle card glow
 */
export default function RealityHookSection() {
    const { lang } = useLanguage();
    const t = realityContent;

    return (
        <section className="relative py-20 md:py-28 overflow-hidden">
            {/* Bottom gradient — smooth transition to next section */}
            <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-20"
                style={{ background: 'linear-gradient(to bottom, transparent, #040405)' }} />

            {/* Content layer */}
            <div className="container mx-auto px-8 max-w-5xl relative z-10">
                {/* Badge */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#0164F7]/20 rounded-full bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                        <span className="text-white/80 text-sm">
                            {t.headline[lang]}
                        </span>
                    </div>
                </div>

                {/* Main body text */}
                <p className="text-center text-white/50 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-12">
                    {t.body[lang]}
                </p>

                {/* Hook statement card — subtle border, no blue orb */}
                <div className="relative rounded-2xl border border-[#0164F7]/15 p-8 md:p-12 mb-10 overflow-hidden bg-[#060818]/30">
                    <div className="relative z-[2] text-center">
                        {/* Big hook title */}
                        <h2 className="text-3xl md:text-5xl lg:text-[56px] font-bold leading-[1.15] tracking-tight mb-8">
                            {t.hookTitle[lang].split('\n').map((line: string, i: number) => (
                                <span key={i} className="block">
                                    {i === 0 ? (
                                        <span className="text-white/70">{line}</span>
                                    ) : (
                                        <span className="text-[#3B82F6]">{line}</span>
                                    )}
                                </span>
                            ))}
                        </h2>

                        {/* Separator line */}
                        <div className="w-16 h-px bg-[#3B82F6]/30 mx-auto mb-6" />

                        {/* Hook lines */}
                        <p className="text-white/40 text-base md:text-lg leading-relaxed">
                            {t.hookLine1[lang]}{' '}
                            <span className="text-white/70 font-medium">{t.hookLine2[lang]}</span>
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="flex justify-center">
                    <Link
                        href="#applications"
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
            </div>
        </section>
    );
}
