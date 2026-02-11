/**
 * Development Section
 * Using Figma exported PNG assets from /public/2screen/
 * Cards have text INSIDE them, not outside
 */

export default function DevelopmentSection() {
    return (
        <section className="relative bg-[#040405] py-24 overflow-hidden">
            <div className="container mx-auto px-8 max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left side - Text */}
                    <div className="pt-8">
                        {/* Badge with blue border and dash icon */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 border border-blue-500/50 rounded-full bg-transparent">
                            <div className="w-5 h-1 bg-blue-500 rounded-full" />
                            <span className="text-white text-sm">How we deliver AI that actually works</span>
                        </div>

                        {/* Main heading */}
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            <span className="text-white">Development,</span>
                            <br />
                            <span className="text-blue-500">integration, training</span>
                        </h2>

                        {/* Description */}
                        <p className="text-white/60 text-base leading-relaxed mb-6 max-w-md">
                            We build AI systems for your specific requirements. We integrate with your current tools and data. We conduct staff training until independent operation is achieved.
                        </p>

                        <p className="text-white/60 text-base leading-relaxed max-w-md">
                            Final delivery: working system, trained team, full documentation.
                        </p>
                    </div>

                    {/* Right side - 3D Layer Cards Visual */}
                    <div className="relative w-full h-[550px] flex items-center justify-center">
                        {/* Central beam background */}
                        <img
                            src="/2screen/background image.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ opacity: 0.9 }}
                        />

                        {/* Human Layer Card - TOP CENTER, large with text INSIDE */}
                        <div className="absolute top-[30px] left-1/2 -translate-x-1/2">
                            <div className="relative w-[180px] h-[130px] rounded-2xl overflow-hidden border border-blue-500/30">
                                <img
                                    src="/2screen/card 1.png"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                                    <span className="text-white text-lg font-semibold mb-2">Human Layer</span>
                                    <p className="text-white/70 text-xs leading-relaxed">train your team, adapt to how they work</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Layer Card - LEFT, large with text INSIDE */}
                        <div className="absolute left-0 top-[45%] -translate-y-1/2">
                            <div className="relative w-[160px] h-[120px] rounded-2xl overflow-hidden border border-blue-500/30">
                                <img
                                    src="/2screen/card 2.png"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="relative z-10 flex flex-col items-start justify-start h-full p-4">
                                    <span className="text-white text-lg font-semibold mb-2">AI Layer</span>
                                    <p className="text-white/70 text-xs leading-relaxed">build solutions for your tasks</p>
                                </div>
                            </div>
                        </div>

                        {/* Infrastructure Layer Card - RIGHT BOTTOM, large with text INSIDE */}
                        <div className="absolute right-0 bottom-[60px]">
                            <div className="relative w-[180px] h-[130px] rounded-2xl overflow-hidden border border-blue-500/30">
                                <img
                                    src="/2screen/card 3.png"
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                                    <span className="text-white text-lg font-semibold">Infrastructure</span>
                                    <span className="text-white/70 text-sm mb-2">Layer</span>
                                    <p className="text-white/70 text-xs leading-relaxed">connect your data, tools, systems</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}



