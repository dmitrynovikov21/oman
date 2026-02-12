"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const TELEGRAM_TOPIC_LEADS = process.env.TELEGRAM_TOPIC_LEADS

interface LeadData {
    email?: string
    name?: string
    phone?: string
    comment?: string
}

async function sendTelegramNotification(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("Telegram configuration missing. Notification skipped.")
        return
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: "HTML",
                ...(TELEGRAM_TOPIC_LEADS && { message_thread_id: parseInt(TELEGRAM_TOPIC_LEADS) })
            })
        })
    } catch (error) {
        console.error("Failed to send Telegram notification:", error)
    }
}

export async function createLead(data: LeadData) {
    try {
        const lead = await prisma.lead.create({
            data: {
                email: data.email || "",
                name: data.name,
                phone: data.phone,
                comment: data.comment
            }
        })

        const message = `
🚀 <b>New Lead — Tilqai</b>

<b>Email:</b> ${data.email}
<b>Name:</b> ${data.name || "Not specified"}
<b>Phone:</b> ${data.phone || "Not specified"}
<b>Comment:</b> ${data.comment || "None"}
        `.trim()

        sendTelegramNotification(message)

        revalidatePath("/adminlend/leads")
        return { success: true, data: lead }
    } catch (error) {
        console.error("Error creating lead:", error)
        return { success: false, error: "Failed to submit request" }
    }
}

// Get all leads — consolidated from Lead + ChatLead tables
export async function getLeads() {
    try {
        const [leads, chatLeads] = await Promise.all([
            prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
            prisma.chatLead.findMany({ orderBy: { createdAt: "desc" } })
        ])

        const normalizedChatLeads = chatLeads.map(cl => ({
            id: cl.id,
            email: cl.email,
            name: cl.name,
            phone: null as string | null,
            comment: cl.message,
            status: "NEW",
            source: "chat" as const,
            createdAt: cl.createdAt,
            updatedAt: cl.createdAt,
        }))

        const normalizedLeads = leads.map(l => ({
            ...l,
            source: "form" as const,
        }))

        const all = [...normalizedLeads, ...normalizedChatLeads]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        return { success: true, data: all }
    } catch (error) {
        console.error("Error fetching leads:", error)
        return { success: false, error: "Failed to fetch leads" }
    }
}

export async function updateLeadStatus(id: string, status: string) {
    try {
        const lead = await prisma.lead.update({
            where: { id },
            data: { status }
        })
        revalidatePath("/adminlend/leads")
        return { success: true, data: lead }
    } catch (error) {
        console.error("Error updating lead status:", error)
        return { success: false, error: "Failed to update status" }
    }
}
