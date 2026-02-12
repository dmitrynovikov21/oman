"use client"

import { EditorRoot, EditorContent, EditorBubble } from "novel"
import { StarterKit, TiptapImage, Placeholder } from "novel"
import { type Editor as TiptapEditor } from "@tiptap/core"
import { useMemo, useState, useCallback } from "react"
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Image as ImageIcon, Quote, Undo, Redo, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TelegraphEditorProps {
    initialValue?: any
    onChange: (value: any) => void
    onEditorReady?: (editor: TiptapEditor) => void
}

export function TelegraphEditor({ initialValue, onChange, onEditorReady }: TelegraphEditorProps) {
    const [editor, setEditor] = useState<TiptapEditor | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    const extensions = useMemo(() => [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3]
            }
        }),
        TiptapImage.configure({
            allowBase64: true,
            HTMLAttributes: {
                class: 'rounded-lg max-w-full mx-auto my-4',
            },
        }),
        Placeholder.configure({
            placeholder: 'Начните писать статью здесь...',
        })
    ], [])

    const handleEditorReady = useCallback((ed: TiptapEditor) => {
        setEditor(ed)
        if (onEditorReady) onEditorReady(ed)
    }, [onEditorReady])

    // Toolbar button helper
    const ToolbarButton = ({
        onClick,
        isActive,
        children,
        title
    }: {
        onClick: () => void
        isActive?: boolean
        children: React.ReactNode
        title: string
    }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn(
                "p-2 rounded hover:bg-zinc-100 transition-colors",
                isActive && "bg-zinc-200 text-blue-600"
            )}
        >
            {children}
        </button>
    )

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-zinc-200 bg-white sticky top-0 z-10 flex-wrap">
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    isActive={editor?.isActive('bold')}
                    title="Жирный (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    isActive={editor?.isActive('italic')}
                    title="Курсив (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-zinc-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor?.isActive('heading', { level: 1 })}
                    title="Заголовок 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor?.isActive('heading', { level: 2 })}
                    title="Заголовок 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-zinc-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    isActive={editor?.isActive('bulletList')}
                    title="Маркированный список"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    isActive={editor?.isActive('orderedList')}
                    title="Нумерованный список"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    isActive={editor?.isActive('blockquote')}
                    title="Цитата"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-zinc-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor?.chain().focus().undo().run()}
                    title="Отменить (Ctrl+Z)"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().redo().run()}
                    title="Повторить (Ctrl+Shift+Z)"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>

                <div className="flex-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-2"
                >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? "Редактор" : "Превью"}
                </Button>
            </div>

            {/* Editor / Preview */}
            <div
                className="flex-1 overflow-auto bg-white"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    const imageUrl = e.dataTransfer.getData('text/image-url')
                    if (imageUrl && editor) {
                        editor.chain().focus().setImage({ src: imageUrl }).run()
                    }
                }}
            >
                {showPreview ? (
                    <div className="max-w-3xl mx-auto p-8 prose prose-lg">
                        <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
                    </div>
                ) : (
                    <EditorRoot>
                        <EditorContent
                            initialContent={initialValue}
                            extensions={extensions}
                            onUpdate={({ editor }) => {
                                onChange({ html: editor.getHTML() })
                            }}
                            onCreate={({ editor }) => {
                                handleEditorReady(editor as any)
                            }}
                            className="h-full max-w-3xl mx-auto p-8 outline-none"
                            editorProps={{
                                attributes: {
                                    class: "prose prose-lg focus:outline-none max-w-full h-full",
                                }
                            }}
                        />
                    </EditorRoot>
                )}
            </div>
        </div>
    )
}
