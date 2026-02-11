import Script from "next/script";

export default function ContactSection() {
    return (
        <section id="contact" className="relative bg-[#040405] py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Your point of contact
                    </h2>
                    <p className="text-white/60 text-base max-w-sm md:text-right">
                        Tariq Al-Maskari, founder. He runs implementations from scoping to launch. Direct communication, clear accountability.
                    </p>
                </div>

                {/* Calendly Embed */}
                <div className="rounded-3xl overflow-hidden bg-white">
                    <div
                        className="calendly-inline-widget"
                        data-url="https://calendly.com/futurist-ai/30min?hide_gdpr_banner=1"
                        style={{ minWidth: '320px', height: '700px' }}
                    />
                    <Script
                        src="https://assets.calendly.com/assets/external/widget.js"
                        strategy="lazyOnload"
                    />
                </div>
            </div>
        </section>
    );
}

