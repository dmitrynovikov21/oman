"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ArrowRight, MessageCircle, Menu, X } from "lucide-react"
import { SubscribeModal } from "@/components/modals/subscribe-modal"

const forWhoItems = [
    { label: "Руководитель отдела продаж", href: "/ru#audience" },
    { label: "Начальник отдела кадров", href: "/ru#audience" },
    { label: "Предприниматель", href: "/ru#audience" },
    { label: "Руководитель в госкомпании", href: "/ru#audience" },
    { label: "Владелец интернет магазина", href: "/ru#audience" },
]

const solutionsItems = [
    { label: "Недвижимость", href: "/ru#solutions" },
    { label: "Интернет магазин", href: "/ru#solutions" },
    { label: "Отдел кадров", href: "/ru#solutions" },
    { label: "Обучение смен", href: "/ru#solutions" },
    { label: "Поддержка", href: "/ru#solutions" },
]

function RoistatDropdown({
    label,
    items,
    isOpen,
    onToggle
}: {
    label: string
    items: { label: string; href: string }[]
    isOpen: boolean
    onToggle: () => void
}) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-1 text-[15px] font-medium text-[#3d4f6f] hover:text-[#0077FF] transition-colors py-2"
            >
                {label}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md border border-[#eef2f4] shadow-xl py-2 z-50"
                    >
                        {items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="block px-4 py-2.5 text-sm text-[#3d4f6f]/80 hover:text-[#0077FF] hover:bg-zinc-50 transition-colors"
                                onClick={onToggle}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function RoistatHeader() {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [showSubscribeModal, setShowSubscribeModal] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name)
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-[#eef2f4]">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-12">
                    <Link href="/ru" className="flex items-center gap-2">
                        <Image
                            src="/leoold.png"
                            alt="LeoAgent"
                            width={48}
                            height={48}
                            className="h-10 w-10 object-contain"
                        />
                        <span className="text-2xl font-[800] leading-none tracking-tighter text-black font-outfit">
                            LeoAgent
                        </span>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden lg:flex items-center gap-6">
                        <RoistatDropdown
                            label="Для кого"
                            items={forWhoItems}
                            isOpen={openDropdown === "forWho"}
                            onToggle={() => toggleDropdown("forWho")}
                        />
                        <RoistatDropdown
                            label="Примеры решения"
                            items={solutionsItems}
                            isOpen={openDropdown === "solutions"}
                            onToggle={() => toggleDropdown("solutions")}
                        />
                        <Link href="/ru/partners" className="text-[15px] font-medium text-[#3d4f6f] hover:text-[#0077FF] transition-colors">
                            Партнёрам
                        </Link>
                        <Link href="/ru/docs" className="text-[15px] font-medium text-[#3d4f6f] hover:text-[#0077FF] transition-colors">
                            Документация
                        </Link>
                        <Link href="/ru#pricing" className="text-[15px] font-medium text-[#3d4f6f] hover:text-[#0077FF] transition-colors">
                            Цены
                        </Link>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.dispatchEvent(new Event('open-chat-widget'))}
                        className="hidden xl:flex items-center gap-2 text-[15px] font-medium text-[#3d4f6f] hover:text-[#0077FF] transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Чат-бот
                    </button>

                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="flex items-center justify-center h-10 px-5 rounded-lg border border-[#dce1e6] text-sm font-semibold text-[#3d4f6f] hover:bg-zinc-50 hover:border-[#c5d0db] transition-all"
                        >
                            Войти
                        </button>
                        <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="flex items-center justify-center h-10 px-5 rounded-lg bg-[#0077FF] text-sm font-semibold text-white hover:bg-[#0060cc] hover:shadow-lg hover:shadow-blue-500/20 transition-all gap-2"
                        >
                            Попробовать бесплатно
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-[#3d4f6f] hover:bg-gray-100 rounded-lg"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-[#eef2f4] bg-white overflow-hidden shadow-xl"
                    >
                        <nav className="flex flex-col p-4 space-y-4">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Для кого</p>
                                {forWhoItems.map(item => (
                                    <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 text-sm font-medium text-[#3d4f6f] hover:text-[#0077FF] hover:bg-blue-50 rounded-lg">
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Решения</p>
                                {solutionsItems.map(item => (
                                    <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 text-sm font-medium text-[#3d4f6f] hover:text-[#0077FF] hover:bg-blue-50 rounded-lg">
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                            <Link href="/ru/docs" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 text-sm font-medium text-[#3d4f6f] hover:text-[#0077FF] hover:bg-blue-50 rounded-lg">
                                Документация
                            </Link>
                            <Link href="/ru#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-2 py-2 text-sm font-medium text-[#3d4f6f] hover:text-[#0077FF] hover:bg-blue-50 rounded-lg">
                                Цены
                            </Link>

                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false)
                                    setShowSubscribeModal(true)
                                }}
                                className="w-full flex items-center justify-center h-10 px-5 rounded-lg bg-[#0077FF] text-sm font-semibold text-white"
                            >
                                Попробовать бесплатно
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            <SubscribeModal
                isOpen={showSubscribeModal}
                onClose={() => setShowSubscribeModal(false)}
            />
        </header>
    )
}
