'use client';

import Link from "next/link";

const industries = [
    {
        icon: "/5screen/icons 1.png",
        title: "Regulated industries",
        description: "Healthcare, finance, legal. Where compliance matters and errors cost.",
    },
    {
        icon: "/5screen/icons 2.png",
        title: "Government",
        description: "Systems that handle citizen-facing processes. Transparent, auditable, built for public accountability.",
    },
    {
        icon: "/5screen/icons 3.png",
        title: "Enterprise",
        description: "Systems for mid-size and large companies. Back-office operations that scale without adding headcount.",
    },
];

export default function IndustriesSection() {
    return (
        <section className="relative bg-[#040405] py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Industries we work with
                    </h2>
                    <div className="flex flex-col items-start md:items-end gap-4">
                        <p className="text-white/60 text-base text-right max-w-xs">
                            Where we've built<br />and deployed AI systems.
                        </p>
                        <Link
                            href="#contact"
                            className="flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white text-sm font-medium rounded-full hover:bg-[#2563EB] transition-colors"
                        >
                            <span>Contact us</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Industry Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {industries.map((industry, index) => (
                        <div
                            key={index}
                            className="relative rounded-3xl overflow-hidden min-h-[280px] flex flex-col"
                        >
                            {/* Card background with glow from card.png */}
                            <img
                                src="/5screen/card.png"
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Content overlay */}
                            <div className="relative z-10 p-8 flex flex-col h-full">
                                {/* Icon in white/10 container */}
                                <div className="w-12 h-12 mb-6 rounded-xl bg-white/10 flex items-center justify-center">
                                    <img
                                        src={industry.icon}
                                        alt=""
                                        className="w-6 h-6 object-contain"
                                    />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-white mb-3">
                                    {industry.title}
                                </h3>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    {industry.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom text */}
                <p className="text-center text-white/40 text-sm">
                    We work where accuracy and compliance matter.
                </p>
            </div>
        </section>
    );
}
