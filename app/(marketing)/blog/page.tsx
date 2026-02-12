import { getArticles } from "@/actions/article"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TilqaiFooter from "@/components/sections/tilqai-footer"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Blog — Tilqai",
    description: "Insights, guides, and case studies about AI automation for business.",
}

export default async function BlogPage() {
    const result = await getArticles()
    const articles = (result.success && result.data)
        ? result.data.filter((a: any) => a.status === "PUBLISHED")
        : []

    return (
        <div className="min-h-screen bg-black relative">
            {/* Star overlay */}
            <img
                src="/assets/hero/Clip path group.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
            />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="max-w-6xl mx-auto px-6 pt-32 pb-16">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Insights & Resources</h1>
                    <p className="text-lg text-zinc-400 max-w-2xl">
                        Expert perspectives on AI automation, digital transformation, and business operations in the GCC region.
                    </p>
                </div>

                {/* Articles Grid */}
                <div className="max-w-6xl mx-auto px-6 pb-20">
                    {articles.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-zinc-500 text-lg">No articles published yet. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {articles.map((article: any) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug}`}
                                    className="group block"
                                >
                                    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80 hover:-translate-y-1">
                                        {/* Cover Image */}
                                        <div className="aspect-[16/10] relative overflow-hidden">
                                            {article.coverImageUrl ? (
                                                <img
                                                    src={article.coverImageUrl}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-zinc-900 flex items-center justify-center">
                                                    <span className="text-zinc-600 text-4xl">📝</span>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2.5 py-1 bg-zinc-900/80 backdrop-blur-sm rounded-lg text-xs text-zinc-300 border border-zinc-700/50">
                                                    {article.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                                {article.title}
                                            </h3>
                                            {article.description && (
                                                <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
                                                    {article.description}
                                                </p>
                                            )}
                                            <span className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                                                Read more →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10">
                <TilqaiFooter />
            </div>
        </div>
    )
}
