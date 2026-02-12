"use client"

import { BarChart3 } from "lucide-react"

export default function MetricaPage() {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-zinc-100 p-6 rounded-full mb-6">
                <BarChart3 className="w-12 h-12 text-zinc-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Яндекс.Метрика</h1>
            <p className="text-zinc-500 max-w-md">
                Интеграция с Яндекс.Метрикой находится в разработке.
                Скоро здесь появится статистика посещений и конверсий.
            </p>
            <div className="mt-8 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                Coming Soon
            </div>
        </div>
    )
}
