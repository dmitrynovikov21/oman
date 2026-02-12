"use client"

import { useEffect, useState } from "react"
import { getPages, deletePage, togglePagePublished } from "@/actions/page"
import { Plus, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react"
import { toast } from "sonner"

type PageItem = {
    id: string
    title: string
    slug: string
    isPublished: boolean
    createdAt: Date
}

export default function AdminPagesPage() {
    const [pages, setPages] = useState<PageItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPages = async () => {
        setLoading(true)
        const result = await getPages()
        if (result.success && result.data) {
            setPages(result.data as PageItem[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPages()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this page?")) return
        const result = await deletePage(id)
        if (result.success) {
            toast.success("Page deleted")
            fetchPages()
        } else {
            toast.error(result.error)
        }
    }

    const handleTogglePublished = async (id: string) => {
        const result = await togglePagePublished(id)
        if (result.success) {
            toast.success("Status updated")
            fetchPages()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Pages</h1>
                <p className="text-sm text-zinc-500">Custom HTML pages (Coming soon: Page editor)</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Title</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Slug</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                            <th className="text-right px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Loading...</td>
                            </tr>
                        ) : pages.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                    No pages yet.
                                </td>
                            </tr>
                        ) : (
                            pages.map((page) => (
                                <tr key={page.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-white">{page.title}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">/{page.slug}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleTogglePublished(page.id)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${page.isPublished
                                                    ? "bg-green-600/20 text-green-400"
                                                    : "bg-zinc-800 text-zinc-400"
                                                }`}
                                        >
                                            {page.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {page.isPublished ? "Published" : "Draft"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(page.id)}
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
