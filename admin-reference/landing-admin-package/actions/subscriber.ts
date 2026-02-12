"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface SubscribeData {
    email: string
    source?: string
    ipAddress?: string
}

// Create new subscriber
export async function createSubscriber(data: SubscribeData) {
    try {
        // Check if already subscribed
        const existing = await prisma.subscriber.findUnique({
            where: { email: data.email }
        })

        if (existing) {
            return { success: true, message: "Already subscribed", data: existing }
        }

        const subscriber = await prisma.subscriber.create({
            data: {
                email: data.email,
                source: data.source || "unknown",
                ipAddress: data.ipAddress,
            }
        })

        // Send Telegram notification
        await sendSubscriberNotification(subscriber, data.ipAddress)

        revalidatePath("/adminlend/subscribers")
        return { success: true, data: subscriber }
    } catch (error) {
        console.error("Error creating subscriber:", error)
        return { success: false, error: "Failed to subscribe" }
    }
}

// Get all subscribers
export async function getSubscribers() {
    try {
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { createdAt: "desc" }
        })
        return { success: true, data: subscribers }
    } catch (error) {
        console.error("Error fetching subscribers:", error)
        return { success: false, error: "Failed to fetch subscribers" }
    }
}

// Telegram notification for new subscriber
async function sendSubscriberNotification(subscriber: any, ipAddress?: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    const topicId = process.env.TELEGRAM_TOPIC_LEADS

    if (!botToken || !chatId) return

    const message = `📧 Новый подписчик
${subscriber.email}
📍 ${subscriber.source || "сайт"}
${ipAddress ? `🌐 ${ipAddress}` : ""}`

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                ...(topicId && { message_thread_id: parseInt(topicId) })
            })
        })
    } catch (error) {
        console.error("Telegram notification error:", error)
    }
}
