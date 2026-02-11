'use client';

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { industriesContent } from "@/lib/i18n/content";
import { ShieldCheck, Building2, Sparkles } from "lucide-react";

const industryIcons = [
    <ShieldCheck key="shield" className="w-6 h-6 text-blue-400" />,
    <Building2 key="building" className="w-6 h-6 text-blue-400" />,
    <Sparkles key="sparkles" className="w-6 h-6 text-blue-400" />,
];

export default function IndustriesSection() {
    const { lang } = useLanguage();
    const t = industriesContent;

    return (
        <section className="relative py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl">
                {/* Header — grid layout: title left, info center-right */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight whitespace-nowrap">
                        {t.headline[lang]}
                    </h2>

                    <div className="flex flex-col items-start gap-3 md:ml-[10%]">
                        <p className="text-white/50 text-sm leading-relaxed">
                            {lang === 'en' ? "Where we've built and deployed AI systems." : "حيث بنينا ونشرنا أنظمة الذكاء الاصطناعي."}
                        </p>
                        <Link
                            href="#contact"
                            className="flex items-center gap-2.5 px-7 py-3 bg-[#0066FF] text-white text-base font-medium rounded-full hover:bg-[#0052cc] transition-colors"
                        >
                            <span>{lang === 'en' ? 'Contact us' : 'تواصل معنا'}</span>
                            <svg className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Industry Cards — full-width, tight gap */}
                <div className="grid md:grid-cols-3 gap-2 justify-items-center">
                    {t.items.map((industry, index) => (
                        <div
                            key={index}
                            className="relative rounded-[24px] h-[340px] w-full max-w-[380px] flex flex-col p-8 group overflow-hidden transition-all duration-500"
                        >
                            {/* Card background image - contains glow, border, and rounded corners */}
                            <img
                                src="/assets/why-us/card.png"
                                alt=""
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-85"
                            />

                            {/* Content Layer */}
                            <div className="relative z-10 flex flex-col h-full">
                                {/* Icon Container */}
                                <div className="w-12 h-12 mb-6 rounded-xl bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center group-hover:bg-[#0a1a3a]/50 transition-colors">
                                    <img
                                        src={`/assets/why-us/icon-${index + 1}.png`}
                                        alt=""
                                        className="w-6 h-6 object-contain opacity-90"
                                    />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-normal text-white/60 mb-auto tracking-wide">
                                    {industry.title[lang]}
                                </h3>

                                {/* Description */}
                                <p className="text-white/90 text-[13px] leading-relaxed max-w-[95%] font-light">
                                    {industry.description[lang]}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom tagline */}
                <p className="text-center text-white/40 text-sm mt-10">
                    {lang === 'en' ? 'We work where accuracy and compliance matter.' : 'نعمل حيث الدقة والامتثال أساسيان.'}
                </p>
            </div>
        </section>
    );
}
