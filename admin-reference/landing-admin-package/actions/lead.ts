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

// Send notification to Telegram Leads topic
async function sendTelegramNotification(text: string) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("Telegram configuration missing. Notification skipped.")
        return
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: "HTML",
                // Send to Заявки topic if configured
                ...(TELEGRAM_TOPIC_LEADS && { message_thread_id: parseInt(TELEGRAM_TOPIC_LEADS) })
            })
        })

        if (!response.ok) {
            console.error("Telegram API Error:", await response.text())
        }
    } catch (error) {
        console.error("Failed to send Telegram notification:", error)
    }
}

// Create new lead
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

        // Notify Telegram
        const message = `
🚀 <b>Новая заявка LeoAgent</b>

<b>Email:</b> ${data.email}
<b>Имя:</b> ${data.name || "Не указано"}
<b>Телефон:</b> ${data.phone || "Не указан"}
<b>Комментарий:</b> ${data.comment || "Нет"}

Use Admin Panel to manage.
        `.trim()

        // Fire and forget notification to not block UI
        sendTelegramNotification(message)

        revalidatePath("/adminlend/leads")
        return { success: true, data: lead }
    } catch (error) {
        console.error("Error creating lead:", error)
        return { success: false, error: "Failed to submit request" }
    }
}

// Get all leads
export async function getLeads() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: "desc" }
        })
        return { success: true, data: leads }
    } catch (error) {
        console.error("Error fetching leads:", error)
        return { success: false, error: "Failed to fetch leads" }
    }
}

// Update lead status
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
