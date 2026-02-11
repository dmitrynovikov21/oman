import Link from "next/link";

export default function TilqaiHero() {
    return (
        <section className="relative min-h-screen bg-[#040405] overflow-hidden">
            {/* Background effects container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">

                {/* TOP Grid line 2 - mirrored converging perspective lines */}
                <img
                    src="/one-screen/Background line 2.png"
                    alt=""
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[130vw] max-w-none h-auto"
                    style={{ opacity: 0.4, transform: 'translateX(-50%) scaleY(-1)' }}
                />

                {/* TOP Grid line 1 - mirrored horizontal perspective grid */}
                <img
                    src="/one-screen/Background line 1.png"
                    alt=""
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[130vw] max-w-none h-auto"
                    style={{ opacity: 0.4, transform: 'translateX(-50%) scaleY(-1)' }}
                />

                {/* LEFT side beams - mirrored image positioned at left edge */}
                <img
                    src="/one-screen/background image.png"
                    alt=""
                    className="absolute bottom-0 h-[85%] w-auto max-w-none"
                    style={{
                        opacity: 0.95,
                        transform: 'scaleX(-1)',
                        left: '-5%',
                    }}
                />

                {/* RIGHT side beams - original image positioned at right edge */}
                <img
                    src="/one-screen/background image.png"
                    alt=""
                    className="absolute bottom-0 right-0 h-[85%] w-auto max-w-none"
                    style={{
                        opacity: 0.95,
                        marginRight: '-5%',
                    }}
                />

                {/* BOTTOM Grid line 2 - converging perspective lines */}
                <img
                    src="/one-screen/Background line 2.png"
                    alt=""
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130vw] max-w-none h-auto"
                    style={{ opacity: 0.6 }}
                />

                {/* BOTTOM Grid line 1 - horizontal perspective grid */}
                <img
                    src="/one-screen/Background line 1.png"
                    alt=""
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130vw] max-w-none h-auto"
                    style={{ opacity: 0.6 }}
                />
            </div>

            {/* Navigation - TWO separate containers as per Figma */}
            <nav className="relative z-10 px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-stretch gap-4">
                    {/* LEFT: Logo container - takes most width, pill-shaped */}
                    <div className="flex-1 flex items-center px-6 h-12 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
                        <span className="text-white font-medium text-lg tracking-wide">tilqai</span>
                    </div>

                    {/* RIGHT: Language switcher - compact pill, same height */}
                    <div className="flex items-center gap-2 px-5 h-12 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm text-sm">
                        <span className="text-white">EN</span>
                        <span className="text-white/40">/</span>
                        <span className="text-white/60">AR</span>
                    </div>
                </div>
            </nav>

            {/* Hero Content - badge centered above heading */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16 pb-40">
                {/* Oman badge - centered above heading */}
                <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm">
                    <span className="text-lg">🇴🇲</span>
                    <span className="text-white/80 text-sm font-medium">Based in Omam</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold leading-[1.1] tracking-tight">
                    <span className="text-white">We build</span>
                    <br />
                    <span className="text-[#3B82F6]">AI systems</span>
                    <br />
                    <span className="text-white">for your business</span>
                </h1>

                {/* Subheading */}
                <p className="max-w-lg text-white/60 text-lg mt-6 mb-10">
                    Automate operations, cut costs, get clear reporting.
                </p>

                {/* CTA Button */}
                <Link
                    href="#contact"
                    className="group flex items-center gap-2 px-8 py-4 bg-[#3B82F6] text-white font-medium rounded-full hover:bg-[#2563EB] transition-colors"
                >
                    <span>Discuss your project</span>
                    <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
