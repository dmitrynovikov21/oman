"use client"

import { useState } from "react"
import { ArrowLeft, Save, Sparkles, Loader2, X, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { TelegraphEditor } from "@/components/editor/telegraph-editor"
import { type Editor as TiptapEditor } from "@tiptap/core"
import { createArticle } from "@/actions/article"
import { useRouter } from "next/navigation"

export default function NewArticlePage() {
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [content, setContent] = useState<any>(null)
    const [editorRef, setEditorRef] = useState<TiptapEditor | null>(null)
    const [category, setCategory] = useState("BLOG")
    const [status, setStatus] = useState("DRAFT")
    const [isFeatured, setIsFeatured] = useState(false)
    const [coverImage, setCoverImage] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // AI Image Generation
    const [imagePrompt, setImagePrompt] = useState("")
    const [generatedImages, setGeneratedImages] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)

    // Drag-drop file upload
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleFileDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))
        if (files.length === 0) {
            toast.error("Перетащите изображение (jpg, png, gif, webp)")
            return
        }

        setIsUploading(true)
        try {
            for (const file of files) {
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                })

                const data = await response.json()

                if (data.success && data.url) {
                    // Add to generated images for easy access
                    setGeneratedImages(prev => [...prev, data.url])
                    // Auto-insert into editor
                    if (editorRef) {
                        editorRef.chain().focus().setImage({ src: data.url }).run()
                    }
                    toast.success(`Изображение "${file.name}" загружено!`)
                } else {
                    toast.error(data.error || "Ошибка загрузки")
                }
            }
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error("Ошибка загрузки файла")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleTitleChange = (value: string) => {
        setTitle(value)
        const transliterate = (str: string) => {
            const ru: { [key: string]: string } = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu',
                'я': 'ya', 'ъ': '', 'ь': ''
            };

            return str.split('').map(char => {
                const lowerChar = char.toLowerCase();
                return ru[lowerChar] !== undefined ? ru[lowerChar] : char;
            }).join('').toLowerCase().replace(/[^\w\s-]/g, "").replace(/[-\s]+/g, "-").replace(/^-+|-+$/g, "");
        }
        setSlug(transliterate(value))
    }

    const handleGenerateImages = async () => {
        if (!imagePrompt.trim()) {
            toast.error("Введите промпт для генерации")
            return
        }
        setIsGenerating(true)
        setGeneratedImages([])

        try {
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: imagePrompt })
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            if (data.images && data.images.length > 0) {
                setGeneratedImages(data.images)
                toast.success("Изображения сгенерированы!")
            } else {
                toast.error("Не удалось сгенерировать изображения. Попробуйте другой промпт.")
            }
        } catch (error: any) {
            console.error("Image generation error:", error)
            toast.error(error.message || "Ошибка генерации изображений")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSetCover = (url: string) => {
        setCoverImage(url)
        toast.success("Обложка установлена")
    }

    const handleInsertImage = (url: string) => {
        if (editorRef) {
            editorRef.chain().focus().setImage({ src: url }).run()
            toast.success("Изображение вставлено")
        }
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Заголовок обязателен")
            return
        }
        if (!slug.trim()) {
            toast.error("URL (slug) обязателен")
            return
        }

        const finalContent = editorRef ? { html: editorRef.getHTML() } : content

        setIsSaving(true)
        try {
            const result = await createArticle({
                title,
                slug,
                description,
                contentJson: finalContent,
                category: category as "GUIDE" | "BLOG" | "CASE" | "NEWS",
                status: status as "DRAFT" | "PUBLISHED",
                isFeaturedOnHome: isFeatured,
                coverImageUrl: coverImage,
            })

            if (result.success && result.data) {
                toast.success("Статья создана!")
                router.push(`/ru/adminlend/blog/${result.data.id}`)
            } else {
                throw new Error(result.error || "Ошибка создания статьи")
            }
        } catch (error: any) {
            toast.error(error.message || "Ошибка сохранения")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div
            className="flex h-[calc(100vh-64px)] relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg font-semibold text-zinc-800">Отпустите для загрузки</p>
                        <p className="text-sm text-zinc-500 mt-1">Изображение будет добавлено в статью</p>
                    </div>
                </div>
            )}

            {/* Upload overlay */}
            {isUploading && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                        <p className="text-lg font-semibold text-zinc-800">Загрузка изображения...</p>
                    </div>
                </div>
            )}

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
                    <div className="flex items-center gap-4">
                        <Link href="/ru/adminlend/blog">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <Input
                                value={title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Заголовок статьи..."
                                className="text-xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Черновик</SelectItem>
                                <SelectItem value="PUBLISHED">Опубликовано</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Сохранить
                        </Button>
                    </div>
                </div>

                {/* Cover Image */}
                {coverImage && (
                    <div className="relative h-48 bg-zinc-100 border-b border-zinc-200">
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setCoverImage("")}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Telegraph Editor - Full Height */}
                <div className="flex-1 overflow-hidden border border-zinc-200 rounded-lg m-4">
                    <TelegraphEditor
                        initialValue={content}
                        onChange={setContent}
                        onEditorReady={setEditorRef}
                    />
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 border-l border-zinc-200 bg-white overflow-auto">
                {/* Settings */}
                <div className="p-4 border-b border-zinc-200">
                    <h3 className="font-semibold text-zinc-900 mb-4">Настройки</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-500">URL (slug)</Label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="url-stati"
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-500">Описание (SEO)</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Краткое описание..."
                                rows={2}
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-500">Категория</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GUIDE">Гайд</SelectItem>
                                    <SelectItem value="BLOG">Блог</SelectItem>
                                    <SelectItem value="CASE">Кейс</SelectItem>
                                    <SelectItem value="NEWS">Новости</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <Label className="text-sm">На главной</Label>
                            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="p-4 border-b border-zinc-200">
                    <h3 className="font-semibold text-zinc-900 mb-4">Обложка</h3>
                    <div className="space-y-3">
                        {coverImage && (
                            <div className="relative rounded-lg overflow-hidden border border-zinc-200">
                                <img src={coverImage} alt="Cover" className="w-full h-32 object-cover" />
                                <button
                                    onClick={() => setCoverImage("")}
                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Input
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="URL изображения..."
                                className="text-sm flex-1"
                            />
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        const formData = new FormData()
                                        formData.append("file", file)

                                        try {
                                            const response = await fetch("/api/upload", {
                                                method: "POST",
                                                body: formData
                                            })
                                            if (!response.ok) {
                                                throw new Error(`HTTP ${response.status}`)
                                            }
                                            const data = await response.json()
                                            if (data && data.success && data.url) {
                                                setCoverImage(data.url)
                                                toast.success("Обложка загружена!")
                                            } else {
                                                toast.error(data?.error || "Ошибка загрузки")
                                            }
                                        } catch (error: any) {
                                            console.error("Upload error:", error)
                                            toast.error(error?.message || "Ошибка загрузки файла")
                                        }
                                    }}
                                />
                                <div className="h-9 px-3 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors">
                                    <Upload className="w-4 h-4" />
                                </div>
                            </label>
                        </div>
                        <p className="text-xs text-zinc-400">Загрузите с компьютера или укажите URL</p>
                    </div>
                </div>

                {/* AI Images */}
                <div className="p-4">
                    <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        AI Изображения
                    </h3>

                    <div className="space-y-3">
                        <Textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="Опишите изображение..."
                            rows={2}
                            className="text-sm"
                        />
                        <Button
                            onClick={handleGenerateImages}
                            disabled={isGenerating}
                            className="w-full gap-2"
                            size="sm"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isGenerating ? "Генерация..." : "Сгенерировать"}
                        </Button>
                    </div>

                    {generatedImages.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs text-zinc-500">Перетащите или нажмите:</p>
                            {generatedImages.map((url, i) => (
                                <div
                                    key={i}
                                    className="relative group rounded-lg overflow-hidden border border-zinc-200 cursor-grab"
                                    draggable="true"
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/image-url', url)
                                    }}
                                >
                                    <img src={url} alt={`Generated ${i + 1}`} className="w-full h-20 object-cover" />
                                    {/* Delete button - always visible */}
                                    <button
                                        onClick={() => setGeneratedImages(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleInsertImage(url)} className="text-xs h-7">
                                            Вставить
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleSetCover(url)} className="text-xs h-7">
                                            Обложка
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
