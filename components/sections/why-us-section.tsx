'use client';

import { useRef } from 'react';
import { useLanguage } from "@/lib/i18n/context";
import { whyUsContent } from "@/lib/i18n/content";
import MagicBentoCard from "@/components/ui/MagicBentoCard";
import MagicBentoSpotlight from "@/components/ui/MagicBentoSpotlight";

// Icon mapping — AI-generated solid-blue-fill PNGs
const iconMap: Record<string, string | null> = {
    'lock': '/assets/icons/lock.png',
    'arrow-up-right': '/assets/icons/growth.png',
    'layers': '/assets/icons/layers.png',
    'none': null,
};




export default function WhyUsSection() {
    const { lang } = useLanguage();
    const t = whyUsContent;
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <section id="why-us" className="relative py-24 overflow-hidden bento-section">
            <MagicBentoSpotlight gridRef={gridRef} />

            <div className="container mx-auto px-8 max-w-7xl">
                {/* Main container — transparent, but keeping border */}
                <div
                    className="relative rounded-3xl border border-blue-500/30 overflow-hidden"
                    style={{
                        backgroundImage: 'url(/assets/applications/clear.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >

                    <div className="relative z-10 grid lg:grid-cols-[45%_1fr] min-h-[600px]">

                        {/* Left Column — Text Only */}
                        <div className="relative flex flex-col justify-start p-8 lg:p-12">
                            <div className="relative z-10 mt-16">
                                <h2 className="text-4xl lg:text-[40px] font-light text-white leading-tight mb-6">
                                    {t.headline[lang]}
                                </h2>
                                <p className="text-white/60 text-sm leading-relaxed max-w-[360px]">
                                    {t.subtitle[lang]}
                                </p>
                            </div>
                        </div>

                        {/* Right Column — 2×2 glass cards with MagicBento */}
                        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8 lg:p-8">
                            {t.cards.map((card, index) => {
                                const isAccent = 'isAccent' in card && card.isAccent;
                                // @ts-ignore - we know these keys exist in content mapping
                                const IconComponent = iconMap[card.icon];

                                return (
                                    <MagicBentoCard
                                        key={index}
                                        className={`relative flex flex-col justify-start rounded-2xl border transition-all duration-300 ${isAccent
                                            ? 'p-0 border-blue-500/30 overflow-hidden'
                                            : 'p-7 bg-[#0a1a3a]/40 backdrop-blur-xl border-white/5'
                                            }`}
                                        style={{ borderRadius: '16px' }}
                                        glowColor={isAccent ? '0, 100, 247' : '100, 150, 255'}
                                        enableTilt={true}
                                        enableParticles={true}
                                        particleCount={5}
                                        clickEffect={true}
                                    >

                                        {/* Accent Card Background Image — fill entire card */}
                                        {isAccent && (
                                            <>
                                                <div className="absolute inset-0 z-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src="/assets/hero/bg-main.png"
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {/* Dark gradient overlay for text readability */}
                                                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-black/50" />
                                            </>
                                        )}

                                        <div className={`relative z-10 flex flex-col h-full ${isAccent ? 'p-7' : ''}`}>
                                            {/* Top: Icon (if present) */}
                                            {!isAccent && IconComponent && (
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={IconComponent} alt="" className="w-5 h-5 object-contain" />
                                                </div>
                                            )}

                                            {/* Title */}
                                            <div className={!isAccent ? 'mt-4' : ''}>
                                                <h3 className={`font-semibold leading-snug text-white ${isAccent ? 'text-2xl font-bold' : 'text-lg mb-2'
                                                    }`}>
                                                    {card.title[lang]}
                                                </h3>
                                            </div>

                                            {/* Spacer */}
                                            <div className="flex-grow" />

                                            {/* Description */}
                                            <p className={`text-sm leading-relaxed ${isAccent ? 'text-white/90' : 'text-white/60'
                                                }`}>
                                                {card.description[lang]}
                                            </p>
                                        </div>
                                    </MagicBentoCard>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
