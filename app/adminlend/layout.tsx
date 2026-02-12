"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, Users, Files, ArrowLeft, Lock } from "lucide-react"
import { Toaster } from "sonner"

const ADMIN_SECRET = "777"

const navItems = [
    { href: "/adminlend", label: "Dashboard", icon: LayoutDashboard },
    { href: "/adminlend/blog", label: "Articles", icon: FileText },
    { href: "/adminlend/leads", label: "Leads", icon: Users },
    { href: "/adminlend/pages", label: "Pages", icon: Files },
]

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const secret = searchParams.get("secret")
        if (secret === ADMIN_SECRET) {
            sessionStorage.setItem("admin_auth", "true")
            setAuthorized(true)
        } else if (sessionStorage.getItem("admin_auth") === "true") {
            setAuthorized(true)
        }
    }, [searchParams])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === ADMIN_SECRET) {
            sessionStorage.setItem("admin_auth", "true")
            setAuthorized(true)
            setError("")
        } else {
            setError("Wrong password")
            setPassword("")
        }
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Tilqai Admin</h1>
                        <p className="text-zinc-500 text-sm">Enter password to continue</p>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoFocus
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                        />
                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
                        >
                            Log In
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-lg font-bold text-white">Tilqai Admin</h1>
                    <p className="text-xs text-zinc-500 mt-1">Content Management</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? "bg-blue-600/20 text-blue-400"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t border-zinc-800">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Site
                    </Link>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
            <Toaster theme="dark" position="top-right" richColors closeButton />
        </div>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-zinc-500">Loading...</div>
            </div>
        }>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </Suspense>
    )
}
