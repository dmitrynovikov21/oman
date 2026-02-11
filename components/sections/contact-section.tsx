'use client';

import { useEffect } from 'react';
import { useLanguage } from "@/lib/i18n/context";
import { contactContent } from "@/lib/i18n/content";

/**
 * Contact Section — "Your point of contact" layout per reference:
 * - Title (left) + description (right) top row
 * - Calendly widget full-width below in a styled card
 * - Contact form is extracted to ContactFormModal (exported separately)
 */
export default function ContactSection() {
    const { lang } = useLanguage();
    const t = contactContent;

    // Load Calendly CSS + JS and re-init widget
    useEffect(() => {
        // Inject CSS if missing
        if (!document.querySelector('link[href*="calendly"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://assets.calendly.com/assets/external/widget.css';
            document.head.appendChild(link);
        }

        // Inject script if missing, then init
        const existing = document.querySelector('script[src*="calendly"]');
        if (!existing) {
            const script = document.createElement('script');
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.async = true;
            script.onload = () => {
                // @ts-expect-error Calendly global
                if (window.Calendly) window.Calendly.initInlineWidget();
            };
            document.head.appendChild(script);
        } else {
            // Script already loaded — just re-init
            // @ts-expect-error Calendly global
            if (window.Calendly) window.Calendly.initInlineWidget();
        }
    }, []);

    return (
        <section id="contact" className="relative py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl">
                {/* Header — title left, description right (per reference) */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        {t.headline[lang]}
                    </h2>
                    <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-lg lg:text-right lg:pt-1">
                        {t.subtitle[lang]}
                    </p>
                </div>

                {/* Calendly Widget — full-width card */}
                <div className="rounded-xl border border-[#0164F7]/20 bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] overflow-hidden">
                    <div
                        className="calendly-inline-widget"
                        data-url="https://calendly.com/futurist-ai/30min?hide_gdpr_banner=1"
                        style={{ minWidth: '320px', height: '580px' }}
                    />
                </div>
            </div>
        </section>
    );
}

/**
 * Contact Form Modal — exported separately for future popup use
 * Import and render this component wherever the popup should appear,
 * controlling visibility with the `open` and `onClose` props.
 */
export function ContactFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { lang } = useLanguage();
    const t = contactContent;

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-lg rounded-xl border border-[#0164F7]/20 bg-[#040405] shadow-[0_0_40px_rgba(1,100,247,0.15)] p-8">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-xl font-bold text-white mb-6">
                    {lang === 'en' ? 'Send us a message' : 'أرسل لنا رسالة'}
                </h3>

                <form className="flex flex-col gap-4">
                    <InputField label={t.form.name[lang]} type="text" name="name" />
                    <InputField label={t.form.organization[lang]} type="text" name="organization" />
                    <InputField label={t.form.email[lang]} type="email" name="email" />
                    <InputField label={t.form.phone[lang]} type="tel" name="phone" />

                    <div>
                        <label className="block text-white/50 text-xs mb-1.5">{t.form.message[lang]}</label>
                        <textarea
                            name="message"
                            rows={3}
                            placeholder={t.form.placeholder[lang]}
                            className="w-full bg-white/5 border border-[#0164F7]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#0164F7]/40 transition-colors resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full px-8 py-3.5 bg-[#0066FF] text-white font-medium rounded-full hover:bg-[#0052CC] transition-colors shadow-lg shadow-blue-500/20 mt-1"
                    >
                        {t.form.submit[lang]}
                    </button>
                </form>
            </div>
        </div>
    );
}

function InputField({ label, type, name }: { label: string; type: string; name: string }) {
    return (
        <div>
            <label className="block text-white/50 text-xs mb-1.5">{label}</label>
            <input
                type={type}
                name={name}
                className="w-full bg-white/5 border border-[#0164F7]/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#0164F7]/40 transition-colors"
            />
        </div>
    );
}
