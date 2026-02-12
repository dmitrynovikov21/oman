"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { getPages, deletePage, togglePagePublished } from "@/actions/page"

interface Page {
    id: string
    slug: string
    title: string
    description: string | null
    isPublished: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
}

export default function PagesAdminPage() {
    const [pages, setPages] = useState<Page[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const loadPages = async () => {
        setIsLoading(true)
        const result = await getPages()
        if (result.success && result.data) {
            setPages(result.data)
        } else {
            toast.error("Ошибка загрузки страниц")
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadPages()
    }, [])

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        const result = await deletePage(deleteId)
        if (result.success) {
            toast.success("Страница удалена")
            loadPages()
        } else {
            toast.error(result.error || "Ошибка удаления")
        }
        setIsDeleting(false)
        setDeleteId(null)
    }

    const handleTogglePublished = async (id: string) => {
        const result = await togglePagePublished(id)
        if (result.success) {
            toast.success(result.data?.isPublished ? "Опубликовано" : "Скрыто")
            loadPages()
        } else {
            toast.error(result.error || "Ошибка")
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Страницы сайта</h1>
                    <p className="text-sm text-zinc-500">Управление статическими страницами</p>
                </div>
                <Link href="/ru/adminlend/pages/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Новая страница
                    </Button>
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50">
                            <TableHead className="w-[300px]">Название</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="w-[100px]">Статус</TableHead>
                            <TableHead className="w-[100px]">Порядок</TableHead>
                            <TableHead className="text-right w-[180px]">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                                </TableCell>
                            </TableRow>
                        ) : pages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                                    Нет страниц. Создайте первую!
                                </TableCell>
                            </TableRow>
                        ) : (
                            pages.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell>
                                        <div className="font-medium text-zinc-900">{page.title}</div>
                                        {page.description && (
                                            <div className="text-xs text-zinc-500 truncate max-w-[280px]">
                                                {page.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-zinc-100 px-2 py-1 rounded">
                                            /{page.slug}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        {page.isPublished ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                Опубл.
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Черновик</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-zinc-500">
                                        {page.sortOrder}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleTogglePublished(page.id)}
                                                title={page.isPublished ? "Скрыть" : "Опубликовать"}
                                            >
                                                {page.isPublished ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Link href={`/ru/${page.slug}`} target="_blank">
                                                <Button variant="ghost" size="icon" title="Открыть">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/ru/adminlend/pages/${page.id}`}>
                                                <Button variant="ghost" size="icon" title="Редактировать">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteId(page.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
