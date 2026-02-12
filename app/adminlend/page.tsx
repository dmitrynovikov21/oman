import { prisma } from "@/lib/db"
import { FileText, Users, Files } from "lucide-react"

export const dynamic = "force-dynamic"

async function getStats() {
    const [articlesCount, leadsCount, chatLeadsCount, pagesCount] = await Promise.all([
        prisma.article.count(),
        prisma.lead.count(),
        prisma.chatLead.count(),
        prisma.page.count(),
    ])

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const newLeadsToday = await prisma.lead.count({
        where: { createdAt: { gte: todayStart } }
    })
    const newChatLeadsToday = await prisma.chatLead.count({
        where: { createdAt: { gte: todayStart } }
    })

    return {
        articles: articlesCount,
        totalLeads: leadsCount + chatLeadsCount,
        newLeadsToday: newLeadsToday + newChatLeadsToday,
        pages: pagesCount,
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    const cards = [
        { label: "Articles", value: stats.articles, icon: FileText, color: "text-blue-400", bg: "bg-blue-600/10" },
        { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-green-400", bg: "bg-green-600/10" },
        { label: "New Leads Today", value: stats.newLeadsToday, icon: Users, color: "text-amber-400", bg: "bg-amber-600/10" },
        { label: "Pages", value: stats.pages, icon: Files, color: "text-purple-400", bg: "bg-purple-600/10" },
    ]

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-zinc-400">{card.label}</span>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
