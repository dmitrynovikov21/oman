"use client"

import Link from "next/link"
import Image from "next/image"

export function RoistatFooter() {
    return (
        <footer className="py-12 md:py-16 bg-[#e8f4fc]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                    {/* Column 1: Brand + Contacts */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="mb-4 flex items-center gap-3">
                            <Image
                                src="/leoold_backup.png"
                                alt="LeoAgent Logo"
                                width={80}
                                height={80}
                                className="h-16 w-16 object-contain"
                            />
                            <span className="text-2xl font-[800] leading-none tracking-tighter text-black font-outfit">
                                LeoAgent
                            </span>
                        </div>
                        <p className="text-sm text-[#6b7a90] mb-4">
                            AI-помощник для бизнеса
                        </p>

                        {/* Telegram */}
                        {/* Contacts */}
                        <ul className="space-y-1 text-sm text-[#6b7a90]">
                            <li><a href="mailto:hello@leoagent.ru" className="hover:text-[#3d4f6f] transition-colors">hello@leoagent.ru</a></li>
                            <li className="flex items-center gap-3">
                                <a
                                    href="https://t.me/printrobot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:opacity-80 transition-opacity"
                                    title="Telegram: @printrobot"
                                >
                                    <Image
                                        src="/free-icon-telegram-2111646.png"
                                        alt="Telegram"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                </a>
                                <a href="tel:+74951285418" className="hover:text-[#3d4f6f] transition-colors">+7 (495) 128-54-18</a>
                            </li>
                            <li className="text-[#6b7a90] text-xs pt-1">Москва, ул. Орджоникидзе, 11с1А</li>
                        </ul>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="font-semibold text-[#3d4f6f] mb-3 text-sm">Продукт</h4>
                        <ul className="space-y-1.5 text-sm text-[#6b7a90]">
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Возможности</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Интеграции</Link></li>
                            <li><Link href="/ru#pricing" className="hover:text-[#3d4f6f] transition-colors">Цены</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Безопасность</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h4 className="font-semibold text-[#3d4f6f] mb-3 text-sm">Компания</h4>
                        <ul className="space-y-1.5 text-sm text-[#6b7a90]">
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">О нас</Link></li>
                            <li><Link href="/ru/blog" className="hover:text-[#3d4f6f] transition-colors">Блог</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Карьера</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Контакты</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Resources */}
                    <div>
                        <h4 className="font-semibold text-[#3d4f6f] mb-3 text-sm">Ресурсы</h4>
                        <ul className="space-y-1.5 text-sm text-[#6b7a90]">
                            <li><Link href="/ru/docs" className="hover:text-[#3d4f6f] transition-colors">Документация</Link></li>
                            <li><Link href="/ru/partners" className="hover:text-[#3d4f6f] transition-colors">Партнёрам</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">API</Link></li>
                            <li><Link href="/ru" className="hover:text-[#3d4f6f] transition-colors">Поддержка</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#c5dff0] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#6b7a90]">
                    <p>© 2026 LeoAgent. Все права защищены.</p>
                    <div className="flex gap-4">
                        <Link href="/ru/policy" className="hover:text-[#3d4f6f] transition-colors">Политика конфиденциальности</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
