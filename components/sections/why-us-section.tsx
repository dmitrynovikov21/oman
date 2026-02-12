'use client';

import { useLanguage } from "@/lib/i18n/context";
import { whyUsContent } from "@/lib/i18n/content";

// Icon mapping — AI-generated solid-blue-fill PNGs
const iconMap: Record<string, string | null> = {
    'lock': '/assets/icons/lock.png',
    'arrow-up-right': '/assets/icons/growth.png',
    'layers': '/assets/icons/layers.png',
    'none': null,
};

// Noise pattern for glass effect
const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E`;

export default function WhyUsSection() {
    const { lang } = useLanguage();
    const t = whyUsContent;

    return (
        <section id="why-us" className="relative py-24 overflow-hidden">
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

                        {/* Right Column — 2×2 glass cards */}
                        {/* grid-rows-[1.5fr_1fr] makes the top row significantly taller (~60/40 split) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 md:p-8 lg:p-8">
                            {t.cards.map((card, index) => {
                                const isAccent = 'isAccent' in card && card.isAccent;
                                // @ts-ignore - we know these keys exist in content mapping
                                const IconComponent = iconMap[card.icon];

                                return (
                                    <div
                                        key={index}
                                        className={`relative p-7 flex flex-col ${isAccent ? 'justify-end' : 'justify-start'} rounded-3xl border overflow-hidden transition-all duration-300 ${isAccent
                                            ? 'border-blue-500/30'
                                            : 'bg-[#0a1a3a]/40 backdrop-blur-xl border-white/5 hover:bg-[#0a1a3a]/50'
                                            }`}
                                    >
                                        {/* Noise Overlay */}
                                        <div
                                            className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none z-0"
                                            style={{ backgroundImage: `url("${noiseSvg}")` }}
                                        />

                                        {/* Accent Card Background Image */}
                                        {isAccent && (
                                            <div className="absolute inset-0 z-0">
                                                <img
                                                    src="/assets/hero/bg-main.png"
                                                    alt=""
                                                    className="w-full h-full object-cover opacity-100" // Opacity as needed
                                                />
                                            </div>
                                        )}

                                        <div className="relative z-10 flex flex-col h-full">
                                            {/* Top: Icon (if present) */}
                                            {!isAccent && IconComponent && (
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
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

                                            {/* Spacer for accent card */}
                                            {isAccent && <div className="flex-grow" />}

                                            {/* Description */}
                                            <p className={`text-sm leading-relaxed ${isAccent ? 'text-white/90' : 'text-white/60'
                                                }`}>
                                                {card.description[lang]}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
