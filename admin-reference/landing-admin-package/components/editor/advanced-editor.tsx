"use client"

import { EditorRoot, EditorContent } from "novel"
import { StarterKit, TiptapImage } from "novel"
import { type Editor as TiptapEditor } from "@tiptap/core"
import { useState, useMemo } from "react"

interface AdvancedEditorProps {
    initialValue?: any
    onChange: (value: any) => void
    className?: string
    onEditorReady?: (editor: TiptapEditor) => void
}

export function AdvancedEditor({ initialValue, onChange, className, onEditorReady }: AdvancedEditorProps) {
    const extensions = useMemo(() => [
        StarterKit,
        TiptapImage.configure({
            allowBase64: true,
            HTMLAttributes: {
                class: 'rounded-lg border border-stone-200',
            },
        })
    ], [])

    return (
        <div className={`relative w-full border-zinc-200 bg-white sm:rounded-lg sm:border sm:shadow-lg ${className}`}>
            <EditorRoot>
                <EditorContent
                    initialContent={initialValue}
                    extensions={extensions}
                    onUpdate={({ editor }) => {
                        onChange(editor.getJSON())
                    }}
                    onCreate={({ editor }) => {
                        if (editor && onEditorReady) {
                            onEditorReady(editor as any)
                        }
                    }}
                    className="min-h-[500px] p-4 outline-none prose max-w-none"
                    editorProps={{
                        attributes: {
                            class: "prose prose-lg dark:prose-invert focus:outline-none max-w-full",
                        }
                    }}
                />
            </EditorRoot>
        </div>
    )
}
