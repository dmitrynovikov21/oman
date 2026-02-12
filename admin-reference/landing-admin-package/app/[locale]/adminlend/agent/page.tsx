"use client"

import { useState, useRef, useEffect } from "react"
import { Brain, Save, FileText, Database, Power, RefreshCw, Upload, Trash2, Edit2, X, Check, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAgentSettings, updateAgentSettings } from "@/actions/agent-settings"
import { KnowledgeFile, deleteKnowledgeFile, toggleKnowledgeFile, updateKnowledgeFile } from "@/actions/knowledge-core"
import { uploadKnowledgeFile } from "@/actions/knowledge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AgentControlCenter() {
    // Loading state
    const [isLoading, setIsLoading] = useState(true)

    // LLM Settings
    const [modelId, setModelId] = useState("")
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(4096)

    // System Prompt
    const [systemPrompt, setSystemPrompt] = useState(`Ты — LeoAgent, умный AI-ассистент для автоматизации онбординга сотрудников.

Твоя задача:
- Отвечать строго в рамках загруженных документов
- Быть вежливым и профессиональным
- Если не знаешь ответа, честно признаваться и предлагать связаться с HR

Тон общения: дружелюбный, но профессиональный.`)

    // Agent Status
    const [isActive, setIsActive] = useState(true)

    // Knowledge Files
    const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([])

    // Edit dialog state
    const [editingFile, setEditingFile] = useState<KnowledgeFile | null>(null)
    const [editContent, setEditContent] = useState("")
    const [editName, setEditName] = useState("")

    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load settings from DB
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await getAgentSettings()
                if (result.success && result.data) {
                    const data = result.data
                    setSystemPrompt(data.systemInstruction || "")
                    setModelId(data.modelId)
                    setTemperature(data.temperature)
                    setMaxTokens(data.maxTokens)
                    setIsActive(data.isActive)
                    setKnowledgeFiles((data.ragFiles as any as KnowledgeFile[]) || [])
                }
            } catch (error) {
                console.error("Failed to load settings", error)
                toast.error("Не удалось загрузить настройки")
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateAgentSettings({
                systemInstruction: systemPrompt,
                modelId,
                temperature,
                maxTokens,
                isActive,
            })

            if (result.success) {
                toast.success("Настройки агента сохранены в базу!")
            } else {
                throw new Error(result.error)
            }
        } catch (error) {
            toast.error("Ошибка сохранения")
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleFile = async (fileId: string) => {
        const res = await toggleKnowledgeFile(fileId)
        if (res.success) {
            setKnowledgeFiles(
                knowledgeFiles.map((f) =>
                    f.id === fileId ? { ...f, active: !f.active } : f
                )
            )
        } else {
            toast.error("Ошибка обновления")
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        setIsSaving(true)
        try {
            const promises = Array.from(files).map(file => {
                const formData = new FormData()
                formData.append("file", file)
                return uploadKnowledgeFile(formData)
            })

            const results = await Promise.all(promises)
            const successful = results.filter(r => r.success && r.data).map(r => r.data as KnowledgeFile)

            if (successful.length > 0) {
                setKnowledgeFiles(prev => [...prev, ...successful])
                toast.success(`Загружено ${successful.length} файл(ов)`)
            }

            const errors = results.filter(r => !r.success)
            if (errors.length > 0) {
                toast.error(`Ошибка при загрузке ${errors.length} файлов`)
            }
        } catch (error) {
            toast.error("Ошибка загрузки")
        } finally {
            setIsSaving(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleAddNote = () => {
        const newNote: KnowledgeFile = {
            id: crypto.randomUUID(),
            name: "Новая заметка",
            content: "",
            size: "0 KB",
            active: true,
            type: "note",
        }
        setEditingFile(newNote)
        setEditName(newNote.name)
        setEditContent(newNote.content)
    }

    const handleEditFile = (file: KnowledgeFile) => {
        setEditingFile(file)
        setEditName(file.name)
        setEditContent(file.content)
    }

    const handleSaveEdit = async () => {
        if (!editingFile) return

        const updatedFile: KnowledgeFile = {
            ...editingFile,
            name: editName,
            content: editContent,
            size: `${(editContent.length / 1024).toFixed(1)} KB`,
            type: editingFile.type
        }

        const res = await updateKnowledgeFile(updatedFile)

        if (res.success) {
            const existingIndex = knowledgeFiles.findIndex((f) => f.id === editingFile.id)
            if (existingIndex >= 0) {
                setKnowledgeFiles(
                    knowledgeFiles.map((f) => (f.id === editingFile.id ? updatedFile : f))
                )
                toast.success("Файл обновлён")
            } else {
                setKnowledgeFiles([...knowledgeFiles, updatedFile])
                toast.success("Заметка создана")
            }
            setEditingFile(null)
        } else {
            toast.error("Ошибка сохранения")
        }
    }

    const handleDeleteFile = async (fileId: string) => {
        if (confirm("Удалить этот файл из базы знаний?")) {
            const res = await deleteKnowledgeFile(fileId)
            if (res.success) {
                setKnowledgeFiles(knowledgeFiles.filter((f) => f.id !== fileId))
                toast.success("Файл удалён")
            } else {
                toast.error("Ошибка удаления")
            }
        }
    }

    const activeFilesCount = knowledgeFiles.filter((f) => f.active).length

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-zinc-500">Загрузка настроек...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-blue-600" />
                        Центр управления агентом
                    </h1>
                    <p className="text-zinc-500 mt-1">Настройка поведения чат-бота на сайте</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Power className={`w-4 h-4 ${isActive ? "text-green-600" : "text-zinc-400"}`} />
                        <span className="text-sm font-medium">
                            {isActive ? "Агент активен" : "Агент отключён"}
                        </span>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                        {isSaving ? "Сохранение..." : "Сохранить"}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Block 1: LLM Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            Настройки LLM
                        </CardTitle>
                        <CardDescription>Параметры языковой модели</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Model ID */}
                        <div className="space-y-2">
                            <Label htmlFor="model">ID модели</Label>
                            <Input
                                id="model"
                                value={modelId}
                                onChange={(e) => setModelId(e.target.value)}
                                placeholder="claude-sonnet-4-5-20250929"
                                className="font-mono"
                            />
                            <p className="text-xs text-zinc-500">
                                По умолчанию: claude-sonnet-4-5-20250929
                            </p>
                        </div>

                        {/* Temperature */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Температура</Label>
                                <Badge variant="outline" className="font-mono">
                                    {temperature.toFixed(1)}
                                </Badge>
                            </div>
                            <Slider
                                value={[temperature]}
                                onValueChange={(val) => setTemperature(val[0])}
                                max={1}
                                step={0.1}
                            />
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Строго (0.0)</span>
                                <span>Баланс (0.5)</span>
                                <span>Креатив (1.0)</span>
                            </div>
                        </div>

                        {/* Max Tokens */}
                        <div className="space-y-2">
                            <Label htmlFor="tokens">Макс. токенов</Label>
                            <Input
                                id="tokens"
                                type="number"
                                value={maxTokens}
                                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                                min={1}
                                max={100000}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Block 2: System Prompt */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Системный промпт (Личность)
                        </CardTitle>
                        <CardDescription>Определите поведение и характер агента</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Введите системные инструкции..."
                            rows={30}
                            className="font-mono text-sm h-[600px]"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            {systemPrompt.length} символов
                        </p>
                    </CardContent>
                </Card>

                {/* Block 3: Knowledge Base */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            База знаний (Память)
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            Файлы и заметки для контекста агента
                            <Badge variant="secondary">
                                {activeFilesCount} / {knowledgeFiles.length} активных
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Upload buttons */}
                        <div className="flex gap-2 mb-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt,.md,.json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Загрузить файл
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAddNote}
                                className="gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Добавить заметку
                            </Button>
                        </div>

                        {/* Files list */}
                        <div className="space-y-2">
                            {knowledgeFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-50 ${file.active
                                        ? "border-blue-200 bg-blue-50/50"
                                        : "border-zinc-200 bg-zinc-50/50"
                                        }`}
                                    onClick={() => handleEditFile(file)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={file.active}
                                                onCheckedChange={() => handleToggleFile(file.id)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <File className="w-4 h-4 text-zinc-400" />
                                            <div>
                                                <p className="font-medium text-zinc-900 text-sm">{file.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {file.size} • {file.type === "note" ? "Заметка" : "Файл"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {file.active && (
                                            <Badge className="bg-blue-100 text-blue-700">Активен</Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteFile(file.id)
                                            }}
                                            className="text-zinc-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-4">
                            Только активные файлы используются для контекста при ответах агента.
                            Кликните на файл, чтобы редактировать содержимое.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5" />
                            Редактирование
                        </DialogTitle>
                        <DialogDescription>
                            Измените название и содержимое файла
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 flex-1 overflow-auto py-4">
                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Название файла или заметки"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Содержимое</Label>
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Введите текст..."
                                rows={15}
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingFile(null)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveEdit} className="gap-2">
                            <Check className="w-4 h-4" />
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
