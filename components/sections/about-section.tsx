'use client';

import { useLanguage } from "@/lib/i18n/context";
import { aboutContent } from "@/lib/i18n/content";

/**
 * About + Founder Section
 * Cards styled to match DeliveryCard (How We Deliver) design tokens
 */
export default function AboutSection() {
    const { lang } = useLanguage();
    const t = aboutContent;

    return (
        <section className="relative py-24">
            <div className="container mx-auto px-8 max-w-7xl">

                {/* About tilqai - What / How / Why */}
                <div className="mb-20">
                    {/* Section heading — same style as other sections */}
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {t.badge[lang]}
                    </h2>

                    <div className="grid md:grid-cols-3 gap-5">
                        {t.sections.map((section, index) => (
                            <div
                                key={index}
                                className="group relative p-6 md:p-8 rounded-xl border border-[#0164F7]/20 bg-transparent hover:border-[#0164F7]/35 transition-all duration-500 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]"
                            >
                                <div className="relative z-10">
                                    <h3 className="text-base md:text-lg font-bold text-white mb-3 leading-tight group-hover:text-blue-100 transition-colors">
                                        {section.title[lang]}
                                    </h3>
                                    <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                        {section.body[lang]}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Founder - styled with matching design system */}
                <div className="group relative rounded-xl border border-[#0164F7]/20 bg-transparent hover:border-[#0164F7]/35 transition-all duration-500 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] p-8 md:p-12">
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

                            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                {t.founder.credentials?.map((cred, i) => (
                                    <Badge key={i}>{cred[lang]}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-[#0164F7]/20 text-white/60 text-xs font-medium uppercase tracking-wide shadow-[inset_0_1px_0_0_rgba(1,100,247,0.1)] hover:border-[#0164F7]/45 hover:text-white/80 hover:bg-white/[0.04] hover:scale-[1.03] hover:shadow-[0_0_12px_rgba(1,100,247,0.12),inset_0_1px_0_0_rgba(1,100,247,0.15)] transition-all duration-300 cursor-default">
            {children}
        </span>
    );
}
