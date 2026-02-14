'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from "@/lib/i18n/context";
import MagicBentoCard from "@/components/ui/MagicBentoCard";
import MagicBentoSpotlight from "@/components/ui/MagicBentoSpotlight";

const LaserFlow = dynamic(() => import('@/components/ui/LaserFlow'), { ssr: false });

const developmentContent = {
    badge: { en: 'How we deliver AI that actually works', ar: 'كيف نقدم ذكاءً اصطناعياً يعمل فعلاً' },
    heading: {
        en: ['Development,', 'integration,', 'training'],
        ar: ['التطوير،', 'والتكامل،', 'والتدريب'],
    },
    body: {
        en: 'We build AI systems for your specific requirements. We integrate with your current tools and data. We conduct staff training until independent operation is achieved.',
        ar: 'نبني أنظمة ذكاء اصطناعي تناسب متطلباتك. ندمجها مع أدواتك وبياناتك الحالية. وندرّب فريقك حتى يتقن التشغيل.',
    },
    delivery: {
        en: 'Final delivery: working system, trained team, full documentation.',
        ar: 'التسليم النهائي: نظام يعمل، فريق مدرّب، توثيق كامل.',
    },
    cards: [
        { title: { en: 'Human Layer', ar: 'الطبقة البشرية' }, desc: { en: 'train your team, adapt to how they work', ar: 'تدريب فريقك والتكيف مع أسلوب عملهم' } },
        { title: { en: 'AI Layer', ar: 'طبقة الذكاء' }, desc: { en: 'build solutions for your tasks', ar: 'بناء حلول لمهامك' } },
        { title: { en: 'Infrastructure Layer', ar: 'طبقة البنية' }, desc: { en: 'connect your data, tools, systems', ar: 'ربط بياناتك وأدواتك وأنظمتك' } },
    ],
};

/**
 * "Development, integration, training" Section
 * Cross-shaped 3-layer card arrangement with MagicBento effects
 */
export default function DevelopmentSection() {
    const { lang, isRTL } = useLanguage();
    const t = developmentContent;
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <section className="relative py-12 md:py-24 lg:py-32 overflow-x-clip bento-section">
            <MagicBentoSpotlight gridRef={gridRef} spotlightRadius={700} />

            <div className="container mx-auto px-8 max-w-7xl relative">
                <div className="grid lg:grid-cols-[40%_1fr] gap-8 lg:gap-12 items-center overflow-visible">
                    {/* Left side - Text */}
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 border border-[#0164F7]/20 rounded-full bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                            <span className="text-white/80 text-sm">{t.badge[lang]}</span>
                        </div>

                        {/* Main heading */}
                        <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight mb-8">
                            <span className="text-white block">{t.heading[lang][0]}</span>
                            <span className="text-[#3B82F6] block">{t.heading[lang][1]}</span>
                            <span className="text-[#3B82F6] block">{t.heading[lang][2]}</span>
                        </h2>

                        {/* Description */}
                        <p className="text-white/50 text-base leading-relaxed mb-4 max-w-[520px]">
                            {t.body[lang]}
                        </p>

                        {/* Delivery line */}
                        <p className="text-white/50 text-base leading-relaxed max-w-[520px]">
                            {t.delivery[lang]}
                        </p>
                    </div>

                    {/* Right side — Inverted-T card composition */}
                    <div className="relative flex items-center justify-center overflow-visible min-h-[280px] md:min-h-[480px]">

                        {/* LaserFlow WebGL background */}
                        <div className="absolute inset-0 z-0 pointer-events-none -left-[5%] md:left-[10%] top-[50%] md:top-[40%]" style={{ opacity: 0.7 }}>
                            <LaserFlow
                                horizontalBeamOffset={0.0}
                                verticalBeamOffset={0.0}
                                color="#405ef2"
                                horizontalSizing={0.5}
                                verticalSizing={2}
                                wispDensity={1}
                                wispSpeed={15}
                                wispIntensity={5}
                                flowSpeed={0.35}
                                flowStrength={0.25}
                                fogIntensity={0.45}
                                fogScale={0.3}
                                fogFallSpeed={0.6}
                                decay={1.1}
                                falloffStart={1.2}
                            />
                        </div>

                        {/* Card composition — inverted-T arrangement */}
                        <div ref={gridRef} className={`relative overflow-visible w-[360px] h-[300px] md:w-[540px] md:h-[460px] mx-auto ${isRTL ? 'md:-translate-x-[10%]' : 'md:translate-x-[10%]'}`}>

                            {/* Human Layer — top center, z-20 (in front) */}
                            <div className="absolute z-20 w-[150px] h-[150px] md:w-[220px] md:h-[220px] top-0 left-1/2 -translate-x-1/2">
                                <MagicBentoCard
                                    className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10"
                                    glowColor="0, 100, 247"
                                    enableTilt={true}
                                    enableParticles={true}
                                    particleCount={6}
                                    clickEffect={true}
                                >
                                    <img src="/assets/reality/card-1.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="relative z-10 p-3 md:p-5 h-full flex flex-col justify-between">
                                        <h3 className="text-white font-bold text-sm md:text-lg leading-tight">{t.cards[0].title[lang]}</h3>
                                        <p className="text-white/70 text-[11px] md:text-sm leading-snug">{t.cards[0].desc[lang]}</p>
                                    </div>
                                </MagicBentoCard>
                            </div>

                            {/* AI Layer — bottom left, z-10 */}
                            <div className="absolute z-30 md:z-10 w-[150px] h-[150px] md:w-[220px] md:h-[220px] top-[46%] md:top-[36%] start-0">
                                <MagicBentoCard
                                    className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10"
                                    glowColor="0, 100, 247"
                                    enableTilt={true}
                                    enableParticles={true}
                                    particleCount={6}
                                    clickEffect={true}
                                >
                                    <img src="/assets/reality/card-2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="relative z-10 p-3 md:p-5 h-full flex flex-col justify-between">
                                        <h3 className="text-white font-bold text-sm md:text-lg leading-tight">{t.cards[1].title[lang]}</h3>
                                        <p className="text-white/70 text-[11px] md:text-sm leading-snug">{t.cards[1].desc[lang]}</p>
                                    </div>
                                </MagicBentoCard>
                            </div>

                            {/* Infrastructure Layer — bottom right, z-10 */}
                            <div className="absolute z-30 md:z-10 w-[150px] h-[150px] md:w-[220px] md:h-[220px] top-[38%] md:top-[42%] end-0 md:-end-4">
                                <MagicBentoCard
                                    className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border border-white/10"
                                    glowColor="0, 100, 247"
                                    enableTilt={true}
                                    enableParticles={true}
                                    particleCount={6}
                                    clickEffect={true}
                                >
                                    <img src="/assets/reality/card-3.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="relative z-10 p-3 md:p-5 h-full flex flex-col justify-between">
                                        <h3 className="text-white font-bold text-sm md:text-lg leading-tight">{t.cards[2].title[lang]}</h3>
                                        <p className="text-white/70 text-[11px] md:text-sm leading-snug">{t.cards[2].desc[lang]}</p>
                                    </div>
                                </MagicBentoCard>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
