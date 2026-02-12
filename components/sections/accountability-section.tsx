'use client';

import { useLanguage } from "@/lib/i18n/context";
import { whyUsContent } from "@/lib/i18n/content";

const cardIcons: Record<string, string> = {
    'lock': '/assets/icons/lock.png',
    'arrow-up-right': '/assets/icons/growth.png',
    'layers': '/assets/icons/layers.png',
};

export default function AccountabilitySection() {
    const { lang } = useLanguage();
    const t = whyUsContent;

    return (
        <section className="relative bg-[#040405] py-20 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Main container — card.png bg + #031836 border */}
                <div className="relative rounded-lg border border-[#031836] overflow-hidden">

                    {/* Background — clear.png, scaled up to make blue streaks prominent */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/assets/applications/clear.png"
                        alt=""
                        className="absolute -bottom-[15%] -right-[10%] w-[75%] h-[120%] object-cover object-center pointer-events-none z-0 mix-blend-screen rotate-180"
                    />



                    {/* Content */}
                    <div className="relative z-10 p-10 md:p-12 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
                        {/* Left Column - Title & Description */}
                        <div className="flex flex-col justify-center min-h-full">
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                                {t.headline[lang]}
                            </h2>
                            <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-md">
                                {t.subtitle[lang]}
                            </p>
                        </div>

                        {/* Right Column - Cards Grid: 60% top row, 40% bottom row */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Top row — 2 cards (60%) */}
                            {t.cards.slice(0, 2).map((card, i) => {
                                const iconSrc = cardIcons[card.icon];
                                return (
                                    <div
                                        key={i}
                                        className="p-5 rounded-lg border border-[#031836] bg-[#031836]/60 backdrop-blur-md flex flex-col justify-start"
                                    >
                                        {iconSrc && (
                                            <div className="w-9 h-9 rounded-lg bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center mb-3 shrink-0">
                                                <img src={iconSrc} alt="" className="w-5 h-5" />
                                            </div>
                                        )}
                                        <h3 className="text-base font-bold text-white mb-2 leading-snug">
                                            {card.title[lang]}
                                        </h3>
                                        <p className="text-white/40 text-xs leading-relaxed">
                                            {card.description[lang]}
                                        </p>
                                    </div>
                                );
                            })}

                            {/* Bottom row — "We stay on call" + accent "It works or we fix it" (40%) */}
                            {(() => {
                                const supportCard = t.cards[2];
                                const accentCard = t.cards[3];
                                const supportIcon = cardIcons[supportCard.icon];
                                return (
                                    <>
                                        <div className="p-5 rounded-lg border border-[#031836] bg-[#031836]/60 backdrop-blur-md">
                                            {supportIcon && (
                                                <div className="w-9 h-9 rounded-lg bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center mb-4">
                                                    <img src={supportIcon} alt="" className="w-5 h-5" />
                                                </div>
                                            )}
                                            <h3 className="text-base font-bold text-white mb-2 leading-snug">
                                                {supportCard.title[lang]}
                                            </h3>
                                            <p className="text-white/40 text-xs leading-relaxed">
                                                {supportCard.description[lang]}
                                            </p>
                                        </div>

                                        {/* Accent card — bright blue gradient */}
                                        <div className="p-5 rounded-lg border border-blue-400/30 bg-gradient-to-br from-[#0066FF]/80 to-[#0044CC]/90 backdrop-blur-md flex flex-col justify-center">
                                            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug">
                                                {accentCard.title[lang]}
                                            </h3>
                                            <p className="text-white/70 text-sm leading-relaxed">
                                                {accentCard.description[lang]}
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
