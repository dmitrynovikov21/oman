import Link from "next/link";

export default function TilqaiFooter() {
    return (
        <footer className="relative py-12 overflow-hidden">
            {/* Background image with noise */}
            <img
                src="/footer/background image.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Content overlay */}
            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Top row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    {/* Logo */}
                    <span className="text-white font-bold text-2xl tracking-wide">
                        tilqai
                    </span>

                    {/* Email */}
                    <a
                        href="mailto:hello@tilqai.com"
                        className="text-white hover:text-white/80 transition-colors"
                    >
                        hello@tilqai.com
                    </a>
                </div>

                {/* Middle row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <span className="text-white/90 text-lg">
                        Technology for human clarity
                    </span>
                    <span className="text-white/90">
                        Based in Oman
                    </span>
                </div>

                {/* Bottom row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/20 text-sm text-white/70">
                    <span>© 2026 tilqai</span>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <span>/</span>
                        <Link href="/terms" className="hover:text-white transition-colors">
                            Terms
                        </Link>
                        <span>/</span>
                        <span>All rights reserved</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
