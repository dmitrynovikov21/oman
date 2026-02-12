"use client"

import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useState } from "react"
import { useEditMode } from "@/lib/edit-mode-context"
import { toast } from "sonner"

export function EditModeToggleClient() {
    const { isEditMode, setEditMode, saveContent, discardChanges, hasChanges } = useEditMode()
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        const success = await saveContent()
        setIsSaving(false)
        if (success) {
            toast.success("Изменения сохранены!")
        } else {
            toast.error("Ошибка при сохранении")
        }
    }

    const handleCancel = () => {
        discardChanges()
        toast.info("Изменения отменены")
    }

    const handleEnterEditMode = () => {
        setEditMode(true)
        toast.info("Режим редактирования включен. Кликните на любой текст для редактирования.")
    }

    if (!isEditMode) {
        return (
            <button
                onClick={handleEnterEditMode}
                className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                title="Редактировать страницу"
            >
                <Pencil className="w-4 h-4" />
                <span className="text-sm font-medium">Редактировать</span>
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
                {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Save className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                    {isSaving ? "Сохранение..." : "Сохранить"}
                </span>
            </button>

            {/* Cancel Button */}
            <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Отмена</span>
            </button>

            {/* Edit Mode Indicator */}
            <div className="px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg">
                <span className="text-sm font-medium">✏️ Режим редактирования</span>
            </div>
        </div>
    )
}
