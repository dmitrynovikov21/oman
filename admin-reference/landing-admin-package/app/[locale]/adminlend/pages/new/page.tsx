"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Code, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { createPage } from "@/actions/page"

export default function NewPageAdmin() {
    const router = useRouter()
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [htmlContent, setHtmlContent] = useState("")
    const [isPublished, setIsPublished] = useState(false)
    const [sortOrder, setSortOrder] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    const handleTitleChange = (value: string) => {
        setTitle(value)
        // Auto-generate slug from title
        const transliterate = (str: string) => {
            const ru: { [key: string]: string } = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu',
                'я': 'ya', 'ъ': '', 'ь': ''
            }
            return str.split('').map(char => {
                const lowerChar = char.toLowerCase()
                return ru[lowerChar] !== undefined ? ru[lowerChar] : char
            }).join('').toLowerCase().replace(/[^\w\s-]/g, "").replace(/[-\s]+/g, "-").replace(/^-+|-+$/g, "")
        }
        setSlug(transliterate(value))
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Введите название страницы")
            return
        }
        if (!slug.trim()) {
            toast.error("Введите URL страницы")
            return
        }
        if (!htmlContent.trim()) {
            toast.error("Введите содержимое страницы")
            return
        }

        setIsSaving(true)
        try {
            const result = await createPage({
                title,
                slug,
                description,
                htmlContent,
                isPublished,
                sortOrder
            })

            if (result.success && result.data) {
                toast.success("Страница создана!")
                router.push(`/ru/adminlend/pages/${result.data.id}`)
            } else {
                throw new Error(result.error || "Ошибка создания")
            }
        } catch (error: any) {
            toast.error(error.message || "Ошибка сохранения")
        } finally {
            setIsSaving(false)
        }
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
                                onChange={(e) => handleTitleChange(e.target.value)}
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
                            Будет доступна по адресу: /{slug || "..."}
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
        </div>
    )
}
