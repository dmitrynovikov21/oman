import Link from "next/link";

/**
 * How We Deliver Section (Screen 003)
 * Pixel-perfect implementation based on Figma reference
 * 
 * Layout: 3-column grid
 * - Left: Cards 01 + 02
 * - Center: Sphere with rays (PNG)
 * - Right: Cards 03 + 04
 */

const deliverySteps = [
    {
        num: "01",
        title: "Assessment",
        subtitle: "We learn how your business runs",
        description: "We map your processes, find bottlenecks, see where data lives. We figure out which tasks AI can take over and what results to expect.",
    },
    {
        num: "02",
        title: "Build & Connect",
        subtitle: "We build the system and plug it in",
        description: "Custom AI for your tasks. Connected to your tools, your data, your workflows. Works inside your existing setup.",
    },
    {
        num: "03",
        title: "Rules & Control",
        subtitle: "We set boundaries and access",
        description: "Who sees what. What AI can and cannot do. How decisions are logged. Ready for audits from day one.",
    },
    {
        num: "04",
        title: "Training & Launch",
        subtitle: "We train your team until they own it",
        description: "We roll out gradually. Train people, collect feedback, adjust. Done when your team runs it without us.",
    },
];

export default function HowWeDeliver() {
    return (
        <section className="relative bg-[#040405] overflow-hidden">
            {/* CTA Bar - Blue */}
            <div className="bg-[#0066FF]">
                <div className="container mx-auto px-8 max-w-7xl py-4 flex items-center justify-between">
                    <span className="text-white text-lg font-medium">AI that fits your organization</span>
                    <Link
                        href="#contact"
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#0066FF] text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
                    >
                        <span>Book a call</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-8 max-w-7xl py-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        How we deliver
                    </h2>
                    <p className="text-white/70 text-lg">
                        From first call to daily use
                    </p>
                </div>

                {/* 3-Column Layout: Left Cards | Center Sphere | Right Cards */}
                <div className="relative max-w-6xl mx-auto">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
                        {/* Left Column - Cards 01 + 02 */}
                        <div className="flex flex-col gap-6">
                            <DeliveryCard step={deliverySteps[0]} />
                            <DeliveryCard step={deliverySteps[1]} />
                        </div>

                        {/* Center Column - Sphere Visual */}
                        <div className="flex items-center justify-center w-[200px]">
                            <img
                                src="/3screen/image.png"
                                alt=""
                                className="w-full h-auto max-h-[500px] object-contain"
                            />
                        </div>

                        {/* Right Column - Cards 03 + 04 */}
                        <div className="flex flex-col gap-6">
                            <DeliveryCard step={deliverySteps[2]} />
                            <DeliveryCard step={deliverySteps[3]} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Delivery Step Card Component
 */
function DeliveryCard({ step }: { step: typeof deliverySteps[0] }) {
    return (
        <div
            className="relative p-8 rounded-2xl border border-white/10 min-h-[220px] flex-1"
            style={{
                background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%)',
            }}
        >
            {/* Blue glow at bottom */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[80px] rounded-b-2xl pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                }}
            />

            {/* Number - top right */}
            <span className="absolute top-6 right-6 text-[#3B82F6] text-sm font-medium">
                {step.num}
            </span>

            {/* Content */}
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                </h3>
                <p className="text-white/60 text-sm mb-4">
                    {step.subtitle}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                    {step.description}
                </p>
            </div>
        </div>
    );
}
