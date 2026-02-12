"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Eye, Edit2, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getArticles, deleteArticle, toggleArticleFeatured } from "@/actions/article"

interface Article {
    id: string
    slug: string
    title: string
    description: string | null
    category: string
    status: string
    isFeaturedOnHome: boolean
    createdAt: Date
    updatedAt: Date
}

const categoryColors: Record<string, string> = {
    GUIDE: "bg-blue-100 text-blue-700",
    BLOG: "bg-purple-100 text-purple-700",
    CASE: "bg-green-100 text-green-700",
    NEWS: "bg-orange-100 text-orange-700",
}

const categoryLabels: Record<string, string> = {
    GUIDE: "Гайд",
    BLOG: "Блог",
    CASE: "Кейс",
    NEWS: "Новости",
}

const statusColors: Record<string, string> = {
    DRAFT: "bg-zinc-100 text-zinc-600",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
}

const statusLabels: Record<string, string> = {
    DRAFT: "Черновик",
    PUBLISHED: "Опубликовано",
}

export default function BlogListPage() {
    const router = useRouter()
    const [articles, setArticles] = useState<Article[]>([])
    const [search, setSearch] = useState("")
    const [displayMode, setDisplayMode] = useState<"auto" | "manual">("manual")
    const [isLoading, setIsLoading] = useState(true)

    // Load articles from database
    useEffect(() => {
        const loadArticles = async () => {
            try {
                const result = await getArticles()
                if (result.success && result.data) {
                    setArticles(result.data as Article[])
                }
            } catch (error) {
                console.error("Failed to load articles:", error)
                toast.error("Не удалось загрузить статьи")
            } finally {
                setIsLoading(false)
            }
        }
        loadArticles()
    }, [])

    const filteredArticles = articles.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleToggleFeatured = async (id: string) => {
        const result = await toggleArticleFeatured(id)
        if (result.success && result.data) {
            setArticles(articles.map(a =>
                a.id === id ? { ...a, isFeaturedOnHome: result.data!.isFeaturedOnHome } : a
            ))
            toast.success(result.data.isFeaturedOnHome ? "Добавлено в избранные" : "Убрано из избранных")
        } else {
            toast.error(result.error || "Ошибка обновления")
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("Вы уверены, что хотите удалить эту статью?")) {
            const result = await deleteArticle(id)
            if (result.success) {
                setArticles(articles.filter((a) => a.id !== id))
                toast.success("Статья удалена")
            } else {
                toast.error(result.error || "Ошибка удаления")
            }
        }
    }

    const handlePreview = (slug: string) => {
        window.open(`/ru/blog/${slug}`, "_blank")
    }

    const handleEdit = (id: string) => {
        router.push(`/ru/adminlend/blog/${id}`)
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "short",
            day: "numeric"
        })
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-zinc-500">Загрузка статей...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Статьи блога</h1>
                    <p className="text-zinc-500 mt-1">Управление контентом блога ({articles.length} статей)</p>
                </div>
                <Link href="/ru/adminlend/blog/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Новая статья
                    </Button>
                </Link>
            </div>

            {/* Display Mode Toggle */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-zinc-900">Режим отображения на главной</p>
                        <p className="text-sm text-zinc-500">
                            {displayMode === "auto"
                                ? "Показываются последние 3 опубликованные статьи"
                                : `Ручной выбор (макс. 3 статьи) • Выбрано: ${articles.filter(a => a.isFeaturedOnHome).length}/3`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={displayMode === "auto" ? "text-zinc-900 font-medium" : "text-zinc-400"}>
                            Авто
                        </span>
                        <Switch
                            checked={displayMode === "manual"}
                            onCheckedChange={(checked) => setDisplayMode(checked ? "manual" : "auto")}
                        />
                        <span className={displayMode === "manual" ? "text-zinc-900 font-medium" : "text-zinc-400"}>
                            Вручную
                        </span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск статей..."
                    className="pl-10"
                />
            </div>

            {/* Articles Table */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                {filteredArticles.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-zinc-500">Нет статей. Создайте первую!</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">
                                    Заголовок
                                </th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">
                                    Категория
                                </th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">
                                    Статус
                                </th>
                                {displayMode === "manual" && (
                                    <th className="text-center text-xs font-medium text-zinc-500 uppercase px-6 py-3">
                                        На главной
                                    </th>
                                )}
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">
                                    Дата
                                </th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredArticles.map((article) => (
                                <tr
                                    key={article.id}
                                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                                    onClick={() => handleEdit(article.id)}
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-zinc-900">{article.title}</p>
                                        <p className="text-sm text-zinc-500">/{article.slug}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={categoryColors[article.category] || "bg-zinc-100"}>
                                            {categoryLabels[article.category] || article.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={statusColors[article.status] || "bg-zinc-100"}>
                                            {statusLabels[article.status] || article.status}
                                        </Badge>
                                    </td>
                                    {displayMode === "manual" && (
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Switch
                                                checked={article.isFeaturedOnHome}
                                                onCheckedChange={() => handleToggleFeatured(article.id)}
                                                disabled={article.status !== "PUBLISHED"}
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {formatDate(article.createdAt)}
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handlePreview(article.slug)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Просмотр
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(article.id)}>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Редактировать
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(article.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Удалить
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
