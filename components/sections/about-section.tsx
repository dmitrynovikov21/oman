'use client';

import { useRef } from 'react';
import { useLanguage } from "@/lib/i18n/context";
import { aboutContent } from "@/lib/i18n/content";
import MagicBentoCard from "@/components/ui/MagicBentoCard";
import MagicBentoSpotlight from "@/components/ui/MagicBentoSpotlight";

/**
 * About + Founder Section
 * Redesigned with MagicBento effects — particles, border glow, spotlight
 */
export default function AboutSection() {
    const { lang } = useLanguage();
    const t = aboutContent;
    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <section id="about" className="relative py-24 bento-section">
            <MagicBentoSpotlight gridRef={gridRef} />

            <div className="container mx-auto px-8 max-w-7xl">

                {/* Section heading */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
                    {t.badge[lang]}
                </h2>

                {/* About cards — bento layout: 1 large + 2 stacked */}
                <div ref={gridRef} className="grid md:grid-cols-[1.3fr_1fr] gap-4 mb-16">
                    {/* First card — large, spans full left */}
                    <MagicBentoCard
                        className="relative p-10 md:p-12 rounded-2xl border border-[#0164F7]/15 bg-gradient-to-br from-[#060818]/80 to-[#040405]"
                        glowColor="0, 100, 247"
                        enableTilt={true}
                        enableParticles={true}
                        clickEffect={true}
                    >
                        <div className="relative z-10">
                            <span className="text-[#0164F7]/20 text-8xl font-bold absolute -top-2 -right-2 select-none pointer-events-none leading-none">01</span>
                            <div className="w-1.5 h-10 bg-[#0164F7]/50 rounded-full mb-6" />
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">
                                {t.sections[0].title[lang]}
                            </h3>
                            <p className="text-white/50 text-base leading-relaxed max-w-md">
                                {t.sections[0].body[lang]}
                            </p>
                        </div>
                    </MagicBentoCard>

                    {/* Right column — 2 stacked cards */}
                    <div className="flex flex-col gap-4">
                        {t.sections.slice(1).map((section, index) => (
                            <MagicBentoCard
                                key={index}
                                className="relative p-8 md:p-10 rounded-2xl border border-[#0164F7]/15 bg-gradient-to-br from-[#060818]/80 to-[#040405] flex-1"
                                glowColor="0, 100, 247"
                                enableTilt={true}
                                enableParticles={true}
                                clickEffect={true}
                            >
                                <div className="relative z-10">
                                    <span className="text-[#0164F7]/20 text-7xl font-bold absolute -top-1 -right-1 select-none pointer-events-none leading-none">
                                        {String(index + 2).padStart(2, '0')}
                                    </span>
                                    <div className="w-1 h-8 bg-[#0164F7]/40 rounded-full mb-5" />
                                    <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight">
                                        {section.title[lang]}
                                    </h3>
                                    <p className="text-white/50 text-sm md:text-base leading-relaxed">
                                        {section.body[lang]}
                                    </p>
                                </div>
                            </MagicBentoCard>
                        ))}
                    </div>
                </div>

                {/* Founder - styled with matching design system */}
                <MagicBentoCard
                    className="relative rounded-xl border border-[#0164F7]/20 bg-transparent p-8 md:p-12"
                    glowColor="0, 100, 247"
                    enableTilt={false}
                    enableParticles={true}
                    particleCount={6}
                    clickEffect={true}
                >
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        {/* Founder Avatar */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden border-2 border-[#0164F7]/30 shadow-[0_0_30px_rgba(1,100,247,0.15)]">
                                <img src="/t.png" alt="Tariq Al Maskari" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-3 right-2 bg-[#040405] border border-[#0164F7]/30 px-3 py-1.5 rounded-full text-blue-400 text-xs font-medium">
                                {lang === 'en' ? 'Founder' : 'المؤسس'}
                            </div>
                        </div>

                        <div className="flex-1 text-center lg:text-start">
                            <p className="text-blue-500 text-xs font-medium tracking-wide opacity-80 mb-3">
                                {t.founder.label[lang]}
                            </p>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                                {t.founder.name[lang]}
                            </h3>

                            <p className="text-white/50 text-sm md:text-base leading-relaxed mb-6">
                                {t.founder.bio[lang]}
                            </p>

                            <div className="flex flex-col gap-3 items-center lg:items-start">
                                {t.founder.credentials?.map((cred, i) => (
                                    <Badge key={i} isPrimary={i === 0}>{cred[lang]}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </MagicBentoCard>
            </div>
        </section>
    );
}

function Badge({ children, isPrimary = false }: { children: React.ReactNode; isPrimary?: boolean }) {
    return (
        <span className={`
            relative px-5 py-3 rounded-xl text-sm font-medium uppercase tracking-wider
            backdrop-blur-md transition-all duration-300 cursor-default
            flex items-center gap-2.5
            ${isPrimary
                ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/10 border border-blue-400/30 text-white shadow-[0_0_20px_rgba(0,100,247,0.15),inset_0_1px_0_0_rgba(100,180,255,0.2)] hover:shadow-[0_0_25px_rgba(0,100,247,0.25)] hover:border-blue-400/50'
                : 'bg-white/[0.03] border border-white/10 text-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-blue-400/30 hover:text-white/90 hover:bg-white/[0.06] hover:shadow-[0_0_15px_rgba(0,100,247,0.1)]'
            }
        `}>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isPrimary ? 'text-blue-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {children}
        </span>
    );
}
