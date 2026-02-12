"use client"

import { FileText, Brain, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

const stats = [
    { label: "Опубликовано статей", value: "12", icon: FileText, href: "/ru/adminlend/blog" },
    { label: "Всего просмотров", value: "2.4K", icon: TrendingUp, href: "/ru/adminlend/blog" },
    { label: "Статус агента", value: "Активен", icon: Brain, href: "/ru/adminlend/agent" },
    { label: "Диалогов", value: "847", icon: Users, href: "/ru/adminlend/agent" },
]

export default function AdminDashboard() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900">Панель управления</h1>
                <p className="text-zinc-500 mt-1">Обзор админ-панели</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        href={stat.href}
                        className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                        <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Быстрые действия</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/ru/adminlend/blog/new"
                        className="flex items-center gap-3 p-4 border border-zinc-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                    >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-zinc-900">Создать статью</p>
                            <p className="text-sm text-zinc-500">Добавить новую публикацию в блог</p>
                        </div>
                    </Link>
                    <Link
                        href="/ru/adminlend/agent"
                        className="flex items-center gap-3 p-4 border border-zinc-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                    >
                        <Brain className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-zinc-900">Настроить агента</p>
                            <p className="text-sm text-zinc-500">Изменить промпт и параметры</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
