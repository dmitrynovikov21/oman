"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getArticles, deleteArticle, toggleArticleFeatured } from "@/actions/article"
import Link from "next/link"
import { Plus, Pencil, Trash2, Star, StarOff, Eye } from "lucide-react"
import { toast } from "sonner"

type Article = {
    id: string
    title: string
    slug: string
    category: string
    status: string
    isFeaturedOnHome: boolean
    createdAt: Date
}

const CATEGORIES = ["ALL", "BLOG", "CASE", "GUIDE", "NEWS"]

export default function AdminBlogPage() {
    const router = useRouter()
    const [articles, setArticles] = useState<Article[]>([])
    const [activeCategory, setActiveCategory] = useState("ALL")
    const [loading, setLoading] = useState(true)

    const fetchArticles = async () => {
        setLoading(true)
        const cat = activeCategory === "ALL" ? undefined : activeCategory
        const result = await getArticles(cat)
        if (result.success && result.data) {
            setArticles(result.data as Article[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchArticles()
    }, [activeCategory])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this article?")) return
        const result = await deleteArticle(id)
        if (result.success) {
            toast.success("Article deleted")
            fetchArticles()
        } else {
            toast.error(result.error)
        }
    }

    const handleToggleFeatured = async (id: string) => {
        const result = await toggleArticleFeatured(id)
        if (result.success) {
            toast.success("Featured status updated")
            fetchArticles()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Articles</h1>
                <Link
                    href="/adminlend/blog/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Article
                </Link>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${activeCategory === cat
                            ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                            : "text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700/50"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Articles Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Category</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Featured</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading...</td>
                            </tr>
                        ) : articles.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                    No articles yet. Create your first one.
                                </td>
                            </tr>
                        ) : (
                            articles.map((article) => (
                                <tr
                                    key={article.id}
                                    onClick={() => router.push(`/adminlend/blog/${article.id}`)}
                                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-white">{article.title}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">/{article.slug}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-300">{article.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${article.status === "PUBLISHED"
                                            ? "bg-green-600/20 text-green-400"
                                            : "bg-amber-600/20 text-amber-400"
                                            }`}>
                                            {article.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleFeatured(article.id) }}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${article.isFeaturedOnHome
                                                ? "bg-amber-600/20 text-amber-400"
                                                : "text-zinc-500 hover:text-zinc-300"
                                                }`}
                                        >
                                            {article.isFeaturedOnHome ? (
                                                <><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> На главной</>
                                            ) : (
                                                <><StarOff className="w-3.5 h-3.5" /> Скрыта</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/blog/${article.slug}`}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/adminlend/blog/${article.id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-zinc-400 hover:text-blue-400 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(article.id) }}
                                                className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
