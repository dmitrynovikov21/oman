"use client"

import { useEffect, useState } from "react"
import { getLeads, updateLeadStatus } from "@/actions/lead"
import { toast } from "sonner"
import { MessageSquare, Mail } from "lucide-react"

type LeadItem = {
    id: string
    email: string
    name: string | null
    phone: string | null
    comment: string | null
    status: string
    source: "form" | "chat"
    createdAt: Date
}

const STATUSES = ["NEW", "CONTACTED", "CLOSED"]

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<LeadItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLeads = async () => {
        setLoading(true)
        const result = await getLeads()
        if (result.success && result.data) {
            setLeads(result.data as LeadItem[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLeads()
    }, [])

    const handleStatusChange = async (id: string, status: string, source: string) => {
        if (source === "chat") {
            toast.error("Chat leads cannot be updated from here")
            return
        }
        const result = await updateLeadStatus(id, status)
        if (result.success) {
            toast.success("Status updated")
            fetchLeads()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Leads</h1>
                <span className="text-sm text-zinc-500">{leads.length} total</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800">
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Source</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Email</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Comment</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-medium text-zinc-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading...</td>
                            </tr>
                        ) : leads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                    No leads yet.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={`${lead.source}-${lead.id}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-xs ${lead.source === "chat" ? "text-purple-400" : "text-blue-400"
                                            }`}>
                                            {lead.source === "chat" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                                            {lead.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white">{lead.name || "—"}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-300">{lead.email}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">{lead.phone || "—"}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate">{lead.comment || "—"}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => handleStatusChange(lead.id, e.target.value, lead.source)}
                                            disabled={lead.source === "chat"}
                                            className={`px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 focus:outline-none ${lead.status === "NEW" ? "text-green-400" :
                                                    lead.status === "CONTACTED" ? "text-blue-400" :
                                                        "text-zinc-400"
                                                } ${lead.source === "chat" ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-zinc-500">
                                        {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit", month: "short", year: "numeric"
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
