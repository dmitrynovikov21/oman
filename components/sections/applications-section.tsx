'use client';

import { useLanguage } from "@/lib/i18n/context";
import { applicationsContent } from "@/lib/i18n/content";

/**
 * Icon paths — AI-generated solid-blue-fill PNGs matching Industries style
 */
const iconPaths: Record<string, string> = {
    workflow: '/assets/icons/workflow.png',
    crm: '/assets/icons/crm.png',
    hr: '/assets/icons/hr.png',
    support: '/assets/icons/support.png',
    compliance: '/assets/icons/compliance.png',
};

const iconKeys = ['workflow', 'crm', 'hr', 'support', 'compliance'];

/**
 * Applications Section — "What becomes automatic"
 * Full-width card grid, no media asset
 */
export default function ApplicationsSection() {
    const { lang } = useLanguage();
    const t = applicationsContent;

    return (
        <section id="applications" className="relative py-24 overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Header — centered */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 border border-[#0164F7]/20 rounded-full bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                        <span className="text-white/80 text-sm">
                            {lang === 'en' ? 'Applications' : 'التطبيقات'}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        {t.sectionTitle[lang]}
                    </h2>
                </div>

                {/* Card Grid: 3 + 2 layout */}
                <div className="grid md:grid-cols-3 gap-5 mb-5">
                    {t.items.slice(0, 3).map((app, index) => (
                        <ApplicationCard
                            key={index}
                            icon={iconPaths[iconKeys[index]]}
                            title={app.title[lang]}
                            description={app.description[lang]}
                            index={index}
                        />
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                    {t.items.slice(3).map((app, index) => (
                        <ApplicationCard
                            key={index + 3}
                            icon={iconPaths[iconKeys[index + 3]]}
                            title={app.title[lang]}
                            description={app.description[lang]}
                            index={index + 3}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ApplicationCard({
    icon,
    title,
    description,
    index,
}: {
    icon: string;
    title: string;
    description: string;
    index: number;
}) {
    return (
        <div className="group relative p-6 md:p-8 rounded-xl border border-[#0164F7]/20 bg-transparent hover:border-[#0164F7]/35 transition-all duration-500 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
            {/* Hover glow */}
            <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
                {/* Icon + Number */}
                <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center">
                        <img src={icon} alt="" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-blue-500 text-xs font-medium tracking-wide opacity-80">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-base md:text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-100 transition-colors">
                    {title}
                </h3>
                <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
