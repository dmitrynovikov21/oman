'use client';

import { useLanguage } from "@/lib/i18n/context";
import { faqContent } from "@/lib/i18n/content";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * FAQ Section
 */
export default function FaqSection() {
    const { lang } = useLanguage();
    const t = faqContent;

    return (
        <section className="relative py-24">
            <div className="container mx-auto px-8 max-w-3xl">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">
                    {t.headline[lang]}
                </h2>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {t.items.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 rounded-2xl bg-white/5 px-6">
                            <AccordionTrigger className="text-white text-lg hover:text-blue-400 py-6 text-left">
                                {faq.q[lang]}
                            </AccordionTrigger>
                            <AccordionContent className="text-white/60 text-base pb-6 leading-relaxed whitespace-pre-line">
                                {faq.a[lang]}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
