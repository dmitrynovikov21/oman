"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getArticle, createArticle, updateArticle } from "@/actions/article"
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const CATEGORIES = ["BLOG", "CASE", "GUIDE", "NEWS"]
const STATUSES = ["DRAFT", "PUBLISHED"]

export default function ArticleEditorPage() {
    const params = useParams()
    const router = useRouter()
    const isNew = params.id === "new"
    const articleId = isNew ? null : (params.id as string)

    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [content, setContent] = useState("")
    const [category, setCategory] = useState("BLOG")
    const [status, setStatus] = useState("DRAFT")
    const [coverImageUrl, setCoverImageUrl] = useState("")
    const [isFeatured, setIsFeatured] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(!isNew)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (articleId) {
            getArticle(articleId).then((result) => {
                if (result.success && result.data) {
                    const a = result.data
                    setTitle(a.title)
                    setSlug(a.slug)
                    setDescription(a.description || "")
                    setCategory(a.category)
                    setStatus(a.status)
                    setCoverImageUrl(a.coverImageUrl || "")
                    setIsFeatured(a.isFeaturedOnHome)
                    try {
                        const parsed = JSON.parse(a.contentJson || "{}")
                        setContent(parsed.html || parsed.text || "")
                    } catch {
                        setContent(a.contentJson || "")
                    }
                }
                setLoading(false)
            })
        }
    }, [articleId])

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
    }

    const handleTitleChange = (value: string) => {
        setTitle(value)
        if (isNew) {
            setSlug(generateSlug(value))
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData })
            const data = await res.json()
            if (data.success) {
                setCoverImageUrl(data.url)
                toast.success("Image uploaded")
            } else {
                toast.error(data.error)
            }
        } catch {
            toast.error("Upload failed")
        }
        setUploading(false)
    }

    const handleSave = async () => {
        if (!title.trim() || !slug.trim()) {
            toast.error("Title and slug are required")
            return
        }

        setSaving(true)
        const data = {
            title,
            slug,
            description,
            contentJson: JSON.stringify({ html: content }),
            category,
            status,
            coverImageUrl,
            isFeaturedOnHome: isFeatured,
        }

        const result = isNew
            ? await createArticle(data)
            : await updateArticle(articleId!, data)

        if (result.success) {
            toast.success(isNew ? "Article created" : "Article updated")
            if (isNew && result.data) {
                router.push(`/adminlend/blog/${result.data.id}`)
            }
        } else {
            toast.error(result.error)
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/adminlend/blog"
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">
                        {isNew ? "New Article" : "Edit Article"}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg text-sm transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>

            <div className="space-y-6">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
                        placeholder="Article title..."
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Slug (URL)</label>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-600 text-sm">/blog/</span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors"
                            placeholder="article-slug"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors resize-none"
                        placeholder="Short description for previews..."
                    />
                </div>

                {/* Category & Status Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600 transition-colors"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-blue-600 transition-colors"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Cover Image */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image</label>
                    <div className="flex items-start gap-4">
                        {coverImageUrl ? (
                            <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-zinc-800">
                                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setCoverImageUrl("")}
                                    className="absolute top-1 right-1 p-1 bg-zinc-900/80 rounded text-zinc-400 hover:text-red-400 text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="w-48 h-32 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-zinc-600" />
                            </div>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm cursor-pointer transition-colors">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? "Uploading..." : "Upload Image"}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-sm text-zinc-400">Featured on homepage</span>
                    </label>
                </div>

                {/* Content Editor (HTML textarea) */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Content (HTML)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={20}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-600 transition-colors resize-y"
                        placeholder="Write your article content in HTML..."
                    />
                </div>
            </div>
        </div>
    )
}
