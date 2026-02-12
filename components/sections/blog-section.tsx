import { getFeaturedArticles } from "@/actions/article"
import Link from "next/link"

export default async function BlogSection() {
    const result = await getFeaturedArticles()
    const articles = (result.success && result.data) ? result.data : []

    // Don't render if no featured articles
    if (articles.length === 0) return null

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Subtle background glow — same as Applications */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-8 max-w-7xl relative z-10">
                {/* Header — Applications style */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 border border-[#0164F7]/20 rounded-full bg-transparent shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)]">
                        <span className="text-white/80 text-sm">
                            Insights & Resources
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold text-white">
                        Latest from Tilqai
                    </h2>
                </div>

                {/* Articles Grid — 3 in a row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {articles.map((article: any, index: number) => (
                        <Link
                            key={article.id}
                            href={`/blog/${article.slug}`}
                            className="group block h-full"
                        >
                            {/* h-full + flex col = all cards same height, "Read more" pinned to bottom */}
                            <div className="relative h-full flex flex-col rounded-xl border border-[#0164F7]/20 bg-transparent hover:border-[#0164F7]/35 transition-all duration-500 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] overflow-hidden">
                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Cover Image — fixed aspect, never changes height */}
                                <div className="aspect-[16/10] relative overflow-hidden flex-shrink-0">
                                    {article.coverImageUrl ? (
                                        <img
                                            src={article.coverImageUrl}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#0164F7]/15 via-[#0a1a3a]/40 to-transparent flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-xl bg-[#0a1a3a]/40 backdrop-blur-xl border border-white/5 flex items-center justify-center">
                                                <span className="text-blue-400 text-lg">✦</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content — flex-1 fills remaining space, pushes "Read more" down */}
                                <div className="relative z-10 p-6 md:p-8 flex flex-col flex-1">
                                    <span className="text-blue-500 text-xs font-medium tracking-wide opacity-80 mb-4">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <h3 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-100 transition-colors">
                                        {article.title}
                                    </h3>
                                    <p className="text-white/50 text-xs md:text-sm line-clamp-2 leading-relaxed flex-1">
                                        {article.description || '\u00A0'}
                                    </p>
                                    <span className="text-sm text-blue-400/80 group-hover:text-blue-300 transition-colors font-medium mt-4">
                                        Read more →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Link — styled to match */}
                <div className="text-center mt-12">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-[#0164F7]/20 hover:border-[#0164F7]/35 text-white/80 hover:text-white rounded-full text-sm transition-all duration-300 shadow-[0_0_15px_rgba(1,100,247,0.08),inset_0_1px_0_0_rgba(1,100,247,0.1)] hover:bg-blue-500/5"
                    >
                        View all articles
                        <span className="text-blue-400">→</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}
