"use client"

import { useState, useEffect } from "react"
import { Loader2, Search, Mail, Phone, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { getLeads, updateLeadStatus } from "@/actions/lead"

interface Lead {
    id: string
    email: string
    name: string | null
    phone: string | null
    comment: string | null
    status: string
    createdAt: Date
    updatedAt: Date
}

const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    CLOSED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
}

const statusLabels: Record<string, string> = {
    NEW: "Новая",
    CONTACTED: "В работе",
    CLOSED: "Закрыта",
    REJECTED: "Отклонена",
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadLeads = async () => {
            try {
                const result = await getLeads()
                if (result.success && result.data) {
                    setLeads(result.data as Lead[])
                }
            } catch (error) {
                console.error("Failed to load leads:", error)
                toast.error("Не удалось загрузить заявки")
            } finally {
                setIsLoading(false)
            }
        }
        loadLeads()
    }, [])

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const result = await updateLeadStatus(id, newStatus)
            if (result.success) {
                setLeads(leads.map(lead =>
                    lead.id === id ? { ...lead, status: newStatus } : lead
                ))
                toast.success("Статус обновлен")
            } else {
                toast.error("Ошибка обновления статуса")
            }
        } catch (e) {
            toast.error("Ошибка сети")
        }
    }

    const filteredLeads = leads.filter((lead) =>
        (lead.email?.toLowerCase().includes(search.toLowerCase()) || "") ||
        (lead.name?.toLowerCase().includes(search.toLowerCase()) || "") ||
        (lead.phone?.toLowerCase().includes(search.toLowerCase()) || "")
    )

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-zinc-500">Загрузка заявок...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Заявки (Лиды)</h1>
                    <p className="text-zinc-500 mt-1">Управление входящими заявками ({leads.length})</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по email, имени или телефону..."
                    className="pl-10"
                />
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                {filteredLeads.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-zinc-500">Нет заявок</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">Дата</th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">Контакт</th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">Детали</th>
                                <th className="text-left text-xs font-medium text-zinc-500 uppercase px-6 py-3">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(lead.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900">{lead.name || "Без имени"}</div>
                                        <div className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                                            <Mail className="w-3 h-3" /> {lead.email}
                                        </div>
                                        {lead.phone && (
                                            <div className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                                                <Phone className="w-3 h-3" /> {lead.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.comment ? (
                                            <div className="flex flex-col gap-1">
                                                {lead.comment.includes("до запуска") && (
                                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 w-fit">
                                                        🚀 До запуска
                                                    </Badge>
                                                )}
                                                {lead.comment.includes("Партнерка") && (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 w-fit">
                                                        🤝 Партнерка
                                                    </Badge>
                                                )}
                                                <p className="text-sm text-zinc-700 max-w-xs">{lead.comment}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-400 italic">Нет комментария</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Select
                                            defaultValue={lead.status}
                                            onValueChange={(val) => handleStatusChange(lead.id, val)}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(statusLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
