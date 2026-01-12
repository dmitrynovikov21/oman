"use client";

/**
 * Mission 15: Drag & Drop Document Manager
 * 
 * Позволяет перетаскивать документы между категориями
 * с немедленным сохранением в БД.
 */

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";

// Категории для drop zones
const CATEGORIES = [
    { key: "COURT", label: "Суд", color: "bg-purple-100 border-purple-300" },
    { key: "PLAINTIFF_EVIDENCE", label: "Истец", color: "bg-blue-100 border-blue-300" },
    { key: "DEFENDANT_EVIDENCE", label: "Ответчик", color: "bg-orange-100 border-orange-300" },
    { key: "FINANCIAL", label: "Финансы", color: "bg-green-100 border-green-300" },
    { key: "EXPERT_WORK", label: "Эксперт", color: "bg-indigo-100 border-indigo-300" },
    { key: "CONTRACT", label: "Договор", color: "bg-amber-100 border-amber-300" },
    { key: "OTHER", label: "Прочее", color: "bg-zinc-100 border-zinc-300" },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

interface DraggableDocument {
    id: string;
    name: string;
    category: CategoryKey;
}

interface DragDropManagerProps {
    documents: DraggableDocument[];
    onCategoryChange: (documentId: string, newCategory: CategoryKey) => Promise<void>;
}

/**
 * Перетаскиваемая карточка документа
 */
function DraggableDocumentCard({
    document,
    onDragStart,
}: {
    document: DraggableDocument;
    onDragStart: (doc: DraggableDocument) => void;
}) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(document)}
            className="bg-white rounded-xl border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-2">
                <Icons.fileText className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-700 truncate flex-1">
                    {document.name}
                </span>
                <Icons.gripVertical className="h-4 w-4 text-zinc-300" />
            </div>
        </div>
    );
}

/**
 * Drop zone для категории
 */
function CategoryDropZone({
    category,
    documents,
    isOver,
    onDrop,
    onDragOver,
    onDragLeave,
    onDragStart,
}: {
    category: typeof CATEGORIES[number];
    documents: DraggableDocument[];
    isOver: boolean;
    onDrop: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDragStart: (doc: DraggableDocument) => void;
}) {
    return (
        <div
            onDrop={(e) => {
                e.preventDefault();
                onDrop();
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
                "rounded-2xl border-2 border-dashed p-4 min-h-[200px] transition-all",
                category.color,
                isOver && "border-solid border-blue-500 bg-blue-50 scale-[1.02]"
            )}
        >
            <div className="flex items-center gap-2 mb-3">
                <Icons.folder className="h-4 w-4" />
                <h4 className="font-medium text-sm">{category.label}</h4>
                <span className="text-xs text-zinc-500 ml-auto">
                    {documents.length}
                </span>
            </div>

            <div className="space-y-2">
                {documents.map(doc => (
                    <DraggableDocumentCard
                        key={doc.id}
                        document={doc}
                        onDragStart={onDragStart}
                    />
                ))}
            </div>

            {documents.length === 0 && (
                <div className="text-center py-8 text-zinc-400 text-sm">
                    Перетащите файлы сюда
                </div>
            )}
        </div>
    );
}

/**
 * Основной компонент Drag & Drop Manager
 */
export function DragDropDocumentManager({
    documents,
    onCategoryChange,
}: DragDropManagerProps) {
    const [draggingDoc, setDraggingDoc] = useState<DraggableDocument | null>(null);
    const [overCategory, setOverCategory] = useState<CategoryKey | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleDragStart = useCallback((doc: DraggableDocument) => {
        setDraggingDoc(doc);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, category: CategoryKey) => {
        e.preventDefault();
        setOverCategory(category);
    }, []);

    const handleDragLeave = useCallback(() => {
        setOverCategory(null);
    }, []);

    const handleDrop = useCallback(async (targetCategory: CategoryKey) => {
        if (!draggingDoc || draggingDoc.category === targetCategory) {
            setDraggingDoc(null);
            setOverCategory(null);
            return;
        }

        setIsUpdating(true);

        try {
            await onCategoryChange(draggingDoc.id, targetCategory);
        } catch (error) {
            console.error("Failed to update category:", error);
        } finally {
            setIsUpdating(false);
            setDraggingDoc(null);
            setOverCategory(null);
        }
    }, [draggingDoc, onCategoryChange]);

    // Группировать документы по категориям
    const docsByCategory = CATEGORIES.reduce((acc, cat) => {
        acc[cat.key] = documents.filter(d => d.category === cat.key);
        return acc;
    }, {} as Record<CategoryKey, DraggableDocument[]>);

    return (
        <div className="bg-zinc-50 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-semibold text-zinc-900">Сортировка документов</h3>
                    <p className="text-sm text-zinc-500">
                        Перетащите файлы между папками для изменения категории
                    </p>
                </div>
                {isUpdating && (
                    <div className="flex items-center gap-2 text-blue-600">
                        <Icons.refresh className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Сохранение...</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {CATEGORIES.map(category => (
                    <CategoryDropZone
                        key={category.key}
                        category={category}
                        documents={docsByCategory[category.key] || []}
                        isOver={overCategory === category.key}
                        onDrop={() => handleDrop(category.key)}
                        onDragOver={(e) => handleDragOver(e, category.key)}
                        onDragLeave={handleDragLeave}
                        onDragStart={handleDragStart}
                    />
                ))}
            </div>

            {/* Подсказка при перетаскивании */}
            {draggingDoc && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-2 rounded-xl shadow-lg">
                    <span className="text-sm">
                        Перетаскиваем: <strong>{draggingDoc.name}</strong>
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * API хук для изменения категории
 */
export function useDocumentCategoryChange() {
    const changeCategory = async (documentId: string, newCategory: CategoryKey) => {
        const response = await fetch(`/api/documents/${documentId}/category`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: newCategory }),
        });

        if (!response.ok) {
            throw new Error("Failed to update document category");
        }

        return response.json();
    };

    return { changeCategory };
}
