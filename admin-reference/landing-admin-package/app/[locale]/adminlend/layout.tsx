"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, FileText, Brain, ArrowLeft, Mail, BarChart3, Lock, Layout } from "lucide-react"

interface AdminLayoutProps {
    children: ReactNode
}

const navItems = [
    { href: "/ru/adminlend", icon: LayoutDashboard, label: "Главная" },
    { href: "/ru/adminlend/blog", icon: FileText, label: "Блог" },
    { href: "/ru/adminlend/pages", icon: Layout, label: "Страницы" },
    { href: "/ru/adminlend/leads", icon: Mail, label: "Заявки" },
    { href: "/ru/adminlend/metrica", icon: BarChart3, label: "Метрика" },
    { href: "/ru/adminlend/agent", icon: Brain, label: "Агент" },
]

const ADMIN_PASSWORD = "777"
const COOKIE_NAME = "adminlend_auth"

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check if user already authenticated via cookie
        const authCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(COOKIE_NAME + "="))
        if (authCookie) {
            setIsAuthenticated(true)
        }
        setIsLoading(false)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === ADMIN_PASSWORD) {
            // Set cookie for 24 hours
            document.cookie = `${COOKIE_NAME}=true; path=/; max-age=86400`
            setIsAuthenticated(true)
            setError("")
        } else {
            setError("Неверный пароль")
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-zinc-200 w-full max-w-sm">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold text-center text-zinc-900 mb-2">Вход в админку</h1>
                    <p className="text-sm text-zinc-500 text-center mb-6">Введите пароль для доступа</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            className="w-full h-12 px-4 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Войти
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
                {/* Logo */}
                <div className="h-16 px-6 flex items-center border-b border-zinc-200">
                    <Link href="/ru/adminlend" className="flex items-center gap-2">
                        <Image
                            src="/leoold.png"
                            alt="LeoAgent"
                            width={32}
                            height={32}
                            className="w-8 h-8"
                        />
                        <span className="font-bold text-zinc-900">Админ-панель</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Back to Site */}
                <div className="p-4 border-t border-zinc-200">
                    <Link
                        href="/ru"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Вернуться на сайт
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
