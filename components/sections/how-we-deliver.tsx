'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { howWeDeliverContent, navContent } from "@/lib/i18n/content";

/**
 * How We Deliver Section
 * Layout: CTA bar + 3-column grid (Left cards | Center Sphere | Right cards)
 */
export default function HowWeDeliver() {
    const { lang } = useLanguage();
    const t = howWeDeliverContent;
    const nav = navContent;

    return (
        <section className="relative overflow-hidden">
            {/* CTA Bar - Blue with media bg */}
            <div className="relative overflow-hidden bg-[#0066FF]">
                <img
                    src="/assets/delivery/main.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
                />
                {/* Noise texture */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: '128px 128px',
                    }}
                />
                <div className="container mx-auto px-8 max-w-7xl py-4 flex items-center justify-between relative z-10">
                    <span className="text-white text-lg font-medium">{nav.ctaBar[lang]}</span>
                    <Link
                        href="#contact"
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#0066FF] text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
                    >
                        <span>{nav.ctaButton[lang]}</span>
                        <svg className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Blue ellipse glow — centered on section */}
            <img
                src="/assets/delivery/blueelips.png"
                alt=""
                className="absolute pointer-events-none z-0"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130%', height: '130%', opacity: 0.4 }}
            />



            <div className="container mx-auto px-4 md:px-8 max-w-7xl py-8 md:py-10 relative z-10">
                {/* Header - Compact */}
                <div className="text-center mb-5 md:mb-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        {t.headline[lang]}
                    </h2>
                    <p className="text-white/50 text-sm md:text-base">
                        {t.subtitle[lang]}
                    </p>
                </div>

                {/* Mobile: stacked cards */}
                <div className="md:hidden flex flex-col gap-4">
                    {t.phases.map((phase, i) => (
                        <DeliveryCard key={i} step={phase} lang={lang} />
                    ))}
                </div>

                {/* Desktop: Compact 3-Column Layout — narrow sides, wide center */}
                <div className="hidden md:block relative max-w-[860px] mx-auto h-[570px]">
                    <div className="grid grid-cols-[270px_1fr_270px] gap-4 h-full">
                        {/* Left Column - Cards 01 + 02 */}
                        <div className="flex flex-col gap-4 h-full">
                            <DeliveryCard step={t.phases[0]} lang={lang} />
                            <DeliveryCard step={t.phases[1]} lang={lang} />
                        </div>

                        {/* Center Column - Visuals (Wide) */}
                        {/* ⬇️ Change 660px here to resize BOTH images at once */}
                        <div className="flex flex-col gap-4 h-full" style={{ '--img-h': '980px' } as React.CSSProperties}>
                            {/* Top Visual */}
                            <div className="relative flex-[2] rounded-xl border border-[#0164F7]/20 bg-white/[0.02] overflow-hidden group shadow-[0_0_15px_rgba(0,102,255,0.08),inset_0_1px_0_0_rgba(0,102,255,0.1)]">

                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <img
                                    src="/assets/applications/main.png"
                                    alt=""
                                    className="absolute left-1/2 -translate-x-1/2 w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                    style={{ top: '0', height: 'var(--img-h)' }}
                                />
                            </div>

                            {/* Bottom Visual */}
                            <div className="relative flex-[3] rounded-xl border border-[#0164F7]/20 bg-white/[0.02] overflow-hidden group shadow-[0_0_15px_rgba(0,102,255,0.08),inset_0_1px_0_0_rgba(0,102,255,0.1)]">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <img
                                    src="/assets/applications/main.png"
                                    alt=""
                                    className="absolute left-1/2 -translate-x-1/2 w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                    style={{ top: '-228px', height: 'var(--img-h)' }}
                                />
                            </div>
                        </div>

                        {/* Right Column - Cards 03 + 04 */}
                        <div className="flex flex-col gap-4 h-full">
                            <DeliveryCard step={t.phases[2]} lang={lang} />
                            <DeliveryCard step={t.phases[3]} lang={lang} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Delivery Step Card Component
 * Reference: Compact vertical card, bottom-aligned content
 */
function DeliveryCard({ step, lang }: {
    step: typeof howWeDeliverContent.phases[0];
    lang: 'en' | 'ar';
}) {
    return (
        <div
            className="relative p-5 md:p-6 rounded-xl border border-[#0164F7]/20 flex-[0.95] flex flex-col shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] hover:border-[#0164F7]/35 transition-all duration-500 group bg-transparent"
        >
            {/* Number - Compact positioning */}
            <span className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} text-blue-500 text-xs font-medium tracking-wide opacity-80`}>
                {step.num}
            </span>

            {/* Content - Pushed to bottom */}
            <div className="relative z-10 flex flex-col flex-1 justify-end mt-auto">
                <h3 className="text-base md:text-lg font-bold text-white mb-1 leading-tight group-hover:text-blue-100 transition-colors">
                    {step.title[lang]}
                </h3>
                <p className="text-white/50 text-[11px] md:text-xs font-medium mb-1.5 whitespace-pre-line">
                    {step.subtitle[lang]}
                </p>
                <p className="text-white/30 text-[10px] md:text-[11px] leading-relaxed">
                    {step.description[lang]}
                </p>
            </div>
        </div>
    );
}
