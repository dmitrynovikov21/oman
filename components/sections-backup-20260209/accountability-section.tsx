'use client';

export default function AccountabilitySection() {
    return (
        <section className="relative bg-[#040405] py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Main container with border */}
                <div className="relative rounded-3xl border border-white/10 p-12 overflow-hidden min-h-[550px]">

                    {/* BACKGROUND WAVE - anchored bottom-left, covers 60%+ of container */}
                    <div className="absolute -left-8 -bottom-16 w-[70%] h-[120%] z-0 pointer-events-none">
                        <img
                            src="/4screen/background image.png"
                            alt=""
                            className="w-full h-full object-cover object-right-top"
                        />
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-start">
                        {/* Left Column - Title & Description with dark gradient overlay */}
                        <div className="relative pt-4">
                            {/* Dark gradient overlay for text readability */}
                            <div
                                className="absolute -inset-4 -z-10 rounded-2xl"
                                style={{
                                    background: 'radial-gradient(ellipse 120% 100% at 0% 50%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
                                }}
                            />
                            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                                AI with clear rules and accountability
                            </h2>
                            <p className="text-white/70 text-lg leading-relaxed max-w-md">
                                Every system we deploy operates within defined boundaries, ownership, and responsibility.
                            </p>
                        </div>

                        {/* Right Column - 2x2 Feature Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Card 1: Data integrity and privacy */}
                            <div
                                className="p-6 rounded-2xl border border-white/15 backdrop-blur-xl"
                                style={{
                                    background: 'rgba(59, 130, 246, 0.30)',
                                }}
                            >
                                <div className="w-10 h-10 mb-4 rounded-lg bg-white/10 flex items-center justify-center">
                                    <img
                                        src="/4screen/icons 1.png"
                                        alt=""
                                        className="w-5 h-5 object-contain"
                                    />
                                </div>
                                <h4 className="text-white font-semibold text-lg mb-3">
                                    Data integrity and privacy
                                </h4>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    We treat data with the same sanctity as a private space. Systems are designed with security, transparency, and strict access controls at their core.
                                </p>
                            </div>

                            {/* Card 2: GCC-first approach */}
                            <div
                                className="p-6 rounded-2xl border border-white/15 backdrop-blur-xl"
                                style={{
                                    background: 'rgba(59, 130, 246, 0.30)',
                                }}
                            >
                                <div className="w-10 h-10 mb-4 rounded-lg bg-white/10 flex items-center justify-center">
                                    <img
                                        src="/4screen/icons 2.png"
                                        alt=""
                                        className="w-5 h-5 object-contain"
                                    />
                                </div>
                                <h4 className="text-white font-semibold text-lg mb-3">
                                    GCC-first approach
                                </h4>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    We know the region. Data sovereignty, Arabic language support, local business practices. Built for companies operating here.
                                </p>
                            </div>

                            {/* Card 3: We stay on call - wave visible behind this one */}
                            <div
                                className="p-6 rounded-2xl border border-white/15 backdrop-blur-xl relative overflow-hidden"
                                style={{
                                    background: 'rgba(59, 130, 246, 0.30)',
                                }}
                            >
                                <div className="w-10 h-10 mb-4 rounded-lg bg-white/10 flex items-center justify-center relative z-10">
                                    <img
                                        src="/4screen/icons 3.png"
                                        alt=""
                                        className="w-5 h-5 object-contain"
                                    />
                                </div>
                                <h4 className="text-white font-semibold text-lg mb-3 relative z-10">
                                    We stay on call
                                </h4>
                                <p className="text-white/80 text-sm leading-relaxed relative z-10">
                                    Updates, fixes, adjustments as your business changes. You have direct access to the team that built it.
                                </p>
                            </div>

                            {/* Card 4: It works or we fix it - with image.png inside */}
                            <div
                                className="relative p-6 rounded-2xl border border-[#3B82F6]/40 overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(29, 78, 216, 0.95) 100%)',
                                }}
                            >
                                {/* image.png as decorative element */}
                                <img
                                    src="/4screen/image.png"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                                />
                                <div className="relative z-10">
                                    <h4 className="text-white font-bold text-2xl mb-3 leading-tight">
                                        It works or we fix it
                                    </h4>
                                    <p className="text-white/90 text-base leading-relaxed">
                                        Something breaks, we're on it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
