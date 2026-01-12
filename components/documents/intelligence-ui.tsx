"use client";

/**
 * Mission 15: Document Intelligence Hub UI
 * 
 * Компоненты:
 * - FolderTree - дерево папок в сайдбаре
 * - DocumentGrid - сетка файлов с бейджами статуса
 * - DocumentCard - карточка документа с конфликтами
 * - PrivacyMirrorToggle - переключатель анонимизации
 * - ConflictBanner - баннер конфликта данных
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Категории документов
const DOCUMENT_CATEGORIES = {
    COURT: { label: "Суд", labelAr: "المحكمة", icon: "scale", color: "bg-purple-100 text-purple-700" },
    PLAINTIFF_EVIDENCE: { label: "Истец", labelAr: "المدعي", icon: "user", color: "bg-blue-100 text-blue-700" },
    DEFENDANT_EVIDENCE: { label: "Ответчик", labelAr: "المدعى عليه", icon: "users", color: "bg-orange-100 text-orange-700" },
    FINANCIAL: { label: "Финансы", labelAr: "مالي", icon: "dollarSign", color: "bg-green-100 text-green-700" },
    EXPERT_WORK: { label: "Эксперт", labelAr: "الخبير", icon: "briefcase", color: "bg-indigo-100 text-indigo-700" },
    CONTRACT: { label: "Договор", labelAr: "عقد", icon: "fileText", color: "bg-amber-100 text-amber-700" },
    OTHER: { label: "Прочее", labelAr: "أخرى", icon: "folder", color: "bg-zinc-100 text-zinc-700" },
} as const;

type CategoryKey = keyof typeof DOCUMENT_CATEGORIES;

interface DocumentStatus {
    ocr: "pending" | "done" | "error";
    ai_summary: "pending" | "done" | "error";
    conflict: boolean;
}

interface DocumentItem {
    id: string;
    name: string;
    category: CategoryKey;
    status: DocumentStatus;
    pageCount: number;
    conflictCount: number;
    thumbnail?: string;
}

interface FolderTreeProps {
    selectedCategory: CategoryKey | "ALL";
    onSelectCategory: (category: CategoryKey | "ALL") => void;
    categoryCounts: Record<CategoryKey, number>;
}

/**
 * Дерево папок (сайдбар)
 */
export function FolderTree({
    selectedCategory,
    onSelectCategory,
    categoryCounts,
}: FolderTreeProps) {
    const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

    return (
        <div className="w-64 bg-white rounded-3xl border border-zinc-100 p-4 shadow-sm">
            <h3 className="font-semibold text-zinc-900 mb-4 px-2">Папки</h3>

            {/* Все документы */}
            <button
                onClick={() => onSelectCategory("ALL")}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors mb-1",
                    selectedCategory === "ALL"
                        ? "bg-zinc-900 text-white"
                        : "hover:bg-zinc-50 text-zinc-700"
                )}
            >
                <Icons.folder className="h-4 w-4" />
                <span className="flex-1 text-sm font-medium">Все документы</span>
                <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    selectedCategory === "ALL" ? "bg-white/20" : "bg-zinc-100"
                )}>
                    {totalCount}
                </span>
            </button>

            {/* Категории */}
            <div className="mt-2 space-y-1">
                {(Object.entries(DOCUMENT_CATEGORIES) as [CategoryKey, typeof DOCUMENT_CATEGORIES[CategoryKey]][]).map(
                    ([key, config]) => {
                        const IconComponent = Icons[config.icon as keyof typeof Icons] || Icons.folder;
                        const count = categoryCounts[key] || 0;

                        return (
                            <button
                                key={key}
                                onClick={() => onSelectCategory(key)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors",
                                    selectedCategory === key
                                        ? "bg-zinc-100 text-zinc-900"
                                        : "hover:bg-zinc-50 text-zinc-600"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-lg", config.color)}>
                                    <IconComponent className="h-3 w-3" />
                                </div>
                                <span className="flex-1 text-sm">{config.label}</span>
                                {count > 0 && (
                                    <span className="text-xs text-zinc-400">{count}</span>
                                )}
                            </button>
                        );
                    }
                )}
            </div>
        </div>
    );
}

interface DocumentCardProps {
    document: DocumentItem;
    isAnonymized: boolean;
    onClick?: () => void;
    onDragStart?: () => void;
}

/**
 * Карточка документа
 */
export function DocumentCard({
    document,
    isAnonymized,
    onClick,
    onDragStart,
}: DocumentCardProps) {
    const categoryConfig = DOCUMENT_CATEGORIES[document.category];
    const hasConflict = document.status.conflict;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className={cn(
                "bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md",
                hasConflict ? "border-red-400 border-2" : "border-zinc-100"
            )}
        >
            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-zinc-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                {document.thumbnail ? (
                    <img
                        src={document.thumbnail}
                        alt={document.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Icons.fileText className="h-12 w-12 text-zinc-300" />
                )}

                {/* Conflict badge */}
                {hasConflict && (
                    <div className="absolute top-2 right-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="p-1.5 bg-red-500 rounded-lg">
                                        <Icons.warning className="h-4 w-4 text-white" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Data Conflict: {document.conflictCount} расхождение</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
            </div>

            {/* Name */}
            <h4 className="font-medium text-sm text-zinc-900 truncate mb-2">
                {isAnonymized ? "[DOCUMENT_" + document.id.slice(-4) + "]" : document.name}
            </h4>

            {/* Status badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge
                    variant={document.status.ocr === "done" ? "default" : "secondary"}
                    className={cn(
                        "text-xs",
                        document.status.ocr === "done" && "bg-green-100 text-green-700 hover:bg-green-100",
                        document.status.ocr === "error" && "bg-red-100 text-red-700"
                    )}
                >
                    OCR
                </Badge>
                <Badge
                    variant={document.status.ai_summary === "done" ? "default" : "secondary"}
                    className={cn(
                        "text-xs",
                        document.status.ai_summary === "done" && "bg-blue-100 text-blue-700 hover:bg-blue-100"
                    )}
                >
                    AI
                </Badge>
                {hasConflict && (
                    <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100">
                        CONFLICT
                    </Badge>
                )}
            </div>

            {/* Category & pages */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className={cn("px-2 py-0.5 rounded-full", categoryConfig.color)}>
                    {categoryConfig.label}
                </span>
                <span>{document.pageCount} стр.</span>
            </div>
        </div>
    );
}

interface PrivacyMirrorToggleProps {
    isAnonymized: boolean;
    onToggle: (value: boolean) => void;
}

/**
 * Переключатель Privacy Mirror
 */
export function PrivacyMirrorToggle({
    isAnonymized,
    onToggle,
}: PrivacyMirrorToggleProps) {
    return (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-100 px-4 py-3 shadow-sm">
            <div className={cn(
                "p-2 rounded-xl transition-colors",
                isAnonymized ? "bg-blue-100" : "bg-zinc-100"
            )}>
                <Icons.eye className={cn(
                    "h-4 w-4",
                    isAnonymized ? "text-blue-600" : "text-zinc-500"
                )} />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">Privacy Mirror</p>
                <p className="text-xs text-zinc-500">
                    {isAnonymized ? "PII скрыты" : "Реальные данные"}
                </p>
            </div>
            <Switch
                checked={isAnonymized}
                onCheckedChange={onToggle}
            />
        </div>
    );
}

interface ConflictBannerProps {
    conflictCount: number;
    onReview: () => void;
}

/**
 * Баннер конфликтов данных
 */
export function ConflictBanner({
    conflictCount,
    onReview,
}: ConflictBannerProps) {
    if (conflictCount === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-red-100 rounded-xl">
                <Icons.warning className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
                <h4 className="font-medium text-red-800">
                    Обнаружено {conflictCount} расхождений
                </h4>
                <p className="text-sm text-red-600">
                    Данные из разных источников не совпадают. Требуется проверка.
                </p>
            </div>
            <button
                onClick={onReview}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
                Проверить
            </button>
        </div>
    );
}

/**
 * Основной компонент Documents Tab
 */
export function DocumentsTabLayout({
    documents,
    onDocumentClick,
    onCategoryChange,
}: {
    documents: DocumentItem[];
    onDocumentClick?: (doc: DocumentItem) => void;
    onCategoryChange?: (docId: string, newCategory: CategoryKey) => void;
}) {
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "ALL">("ALL");
    const [isAnonymized, setIsAnonymized] = useState(false);

    // Подсчёт по категориям
    const categoryCounts = documents.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
    }, {} as Record<CategoryKey, number>);

    // Фильтрация
    const filteredDocs = selectedCategory === "ALL"
        ? documents
        : documents.filter(d => d.category === selectedCategory);

    // Подсчёт конфликтов
    const totalConflicts = documents.filter(d => d.status.conflict).length;

    return (
        <div className="min-h-screen bg-zinc-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Документы</h1>
                    <p className="text-sm text-zinc-500">
                        {documents.length} файлов • {selectedCategory === "ALL" ? "Все" : DOCUMENT_CATEGORIES[selectedCategory].label}
                    </p>
                </div>
                <PrivacyMirrorToggle
                    isAnonymized={isAnonymized}
                    onToggle={setIsAnonymized}
                />
            </div>

            {/* Conflict Banner */}
            <div className="mb-6">
                <ConflictBanner
                    conflictCount={totalConflicts}
                    onReview={() => setSelectedCategory("ALL")}
                />
            </div>

            {/* Main Layout */}
            <div className="flex gap-6">
                {/* Sidebar */}
                <FolderTree
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    categoryCounts={categoryCounts}
                />

                {/* Documents Grid */}
                <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredDocs.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                isAnonymized={isAnonymized}
                                onClick={() => onDocumentClick?.(doc)}
                            />
                        ))}
                    </div>

                    {filteredDocs.length === 0 && (
                        <div className="text-center py-12">
                            <Icons.folder className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                            <p className="text-zinc-500">Нет документов в этой категории</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
