"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Code, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getPage, updatePage, deletePage } from "@/actions/page"

interface EditPageProps {
    params: { id: string }
}

export default function EditPageAdmin({ params }: EditPageProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [htmlContent, setHtmlContent] = useState("")
    const [isPublished, setIsPublished] = useState(false)
    const [sortOrder, setSortOrder] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const loadPage = async () => {
            const result = await getPage(params.id)
            if (result.success && result.data) {
                setTitle(result.data.title)
                setSlug(result.data.slug)
                setDescription(result.data.description || "")
                setHtmlContent(result.data.htmlContent)
                setIsPublished(result.data.isPublished)
                setSortOrder(result.data.sortOrder)
            } else {
                toast.error("Страница не найдена")
                router.push("/ru/adminlend/pages")
            }
            setIsLoading(false)
        }
        loadPage()
    }, [params.id, router])

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Введите название страницы")
            return
        }
        if (!slug.trim()) {
            toast.error("Введите URL страницы")
            return
        }

        setIsSaving(true)
        try {
            const result = await updatePage(params.id, {
                title,
                slug,
                description,
                htmlContent,
                isPublished,
                sortOrder
            })

            if (result.success) {
                toast.success("Сохранено!")
            } else {
                throw new Error(result.error || "Ошибка сохранения")
            }
        } catch (error: any) {
            toast.error(error.message || "Ошибка сохранения")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deletePage(params.id)
        if (result.success) {
            toast.success("Страница удалена")
            router.push("/ru/adminlend/pages")
        } else {
            toast.error(result.error || "Ошибка удаления")
        }
        setIsDeleting(false)
        setShowDelete(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Main Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
                    <div className="flex items-center gap-4">
                        <Link href="/ru/adminlend/pages">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Название страницы..."
                                className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-zinc-500">Опубликовать</Label>
                            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(true)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Сохранить
                        </Button>
                    </div>
                </div>

                {/* Editor Tabs */}
                <div className="flex-1 overflow-hidden p-4">
                    <Tabs defaultValue="code" className="h-full flex flex-col">
                        <TabsList className="mb-4">
                            <TabsTrigger value="code" className="gap-2">
                                <Code className="w-4 h-4" />
                                HTML
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="gap-2">
                                <Eye className="w-4 h-4" />
                                Превью
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="code" className="flex-1 overflow-hidden">
                            <Textarea
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                placeholder="<div>Введите HTML код страницы...</div>"
                                className="h-full font-mono text-sm resize-none"
                            />
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 overflow-auto">
                            <div className="bg-white rounded-lg border border-zinc-200 p-6 min-h-full">
                                <div
                                    className="prose max-w-none"
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 border-l border-zinc-200 bg-white overflow-auto p-4">
                <h3 className="font-semibold text-zinc-900 mb-4">Настройки</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">URL (slug)</Label>
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="url-stranitsy"
                            className="text-sm"
                        />
                        <p className="text-xs text-zinc-400">
                            Доступна по адресу: /{slug || "..."}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">Описание (SEO)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Краткое описание для поисковиков..."
                            rows={3}
                            className="text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-zinc-500">Порядок сортировки</Label>
                        <Input
                            type="number"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                            className="text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить страницу?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Страница будет удалена навсегда.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
