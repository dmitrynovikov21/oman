import { getArticleBySlug } from "@/actions/article"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import TilqaiFooter from "@/components/sections/tilqai-footer"

export const dynamic = "force-dynamic"

interface PageProps {
    params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
    const result = await getArticleBySlug(params.slug)
    if (!result.success || !result.data) return { title: "Article Not Found" }

    return {
        title: `${result.data.title} — Tilqai`,
        description: result.data.description || "",
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const result = await getArticleBySlug(params.slug)

    if (!result.success || !result.data || result.data.status !== "PUBLISHED") {
        notFound()
    }

    const article = result.data
    let htmlContent = ""
    try {
        const parsed = JSON.parse(article.contentJson || "{}")
        htmlContent = parsed.html || parsed.text || ""
    } catch {
        htmlContent = article.contentJson || ""
    }

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
                <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
                    {/* Back Nav */}
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        All articles
                    </Link>

                    {/* Category */}
                    <div className="mb-4">
                        <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-xs rounded-lg border border-blue-600/20">
                            {article.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Description */}
                    {article.description && (
                        <p className="text-lg text-zinc-400 mb-8">{article.description}</p>
                    )}

                    {/* Date */}
                    <p className="text-sm text-zinc-600 mb-8">
                        {new Date(article.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "long", year: "numeric"
                        })}
                    </p>

                    {/* Cover Image */}
                    {article.coverImageUrl && (
                        <div className="mb-10 rounded-2xl overflow-hidden border border-zinc-800">
                            <img
                                src={article.coverImageUrl}
                                alt={article.title}
                                className="w-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <article
                        className="prose prose-invert prose-lg max-w-none
                            prose-headings:text-white prose-headings:font-bold
                            prose-p:text-zinc-300 prose-p:leading-relaxed
                            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-white
                            prose-img:rounded-xl prose-img:border prose-img:border-zinc-800
                            prose-blockquote:border-l-blue-600 prose-blockquote:text-zinc-400
                            prose-code:text-blue-300 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                        "
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />

                    {/* Footer Nav */}
                    <div className="mt-16 pt-8 border-t border-zinc-800">
                        <Link
                            href="/blog"
                            className="text-sm text-zinc-500 hover:text-blue-400 transition-colors"
                        >
                            ← Back to all articles
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10">
                <TilqaiFooter />
            </div>
        </div>
    )
}
