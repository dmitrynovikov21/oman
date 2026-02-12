"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface PageData {
    title: string
    slug: string
    description?: string
    htmlContent: string
    isPublished?: boolean
    sortOrder?: number
}

export async function getPages() {
    try {
        const pages = await prisma.page.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
        })
        return { success: true, data: pages }
    } catch (error) {
        console.error("Error fetching pages:", error)
        return { success: false, error: "Failed to fetch pages" }
    }
}

export async function getPublishedPages() {
    try {
        const pages = await prisma.page.findMany({
            where: { isPublished: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
        })
        return { success: true, data: pages }
    } catch (error) {
        console.error("Error fetching published pages:", error)
        return { success: false, error: "Failed to fetch pages" }
    }
}

export async function getPage(id: string) {
    try {
        const page = await prisma.page.findUnique({ where: { id } })
        if (!page) {
            return { success: false, error: "Page not found" }
        }
        return { success: true, data: page }
    } catch (error) {
        console.error("Error fetching page:", error)
        return { success: false, error: "Failed to fetch page" }
    }
}

export async function getPageBySlug(slug: string) {
    try {
        const page = await prisma.page.findUnique({ where: { slug } })
        if (!page) {
            return { success: false, error: "Page not found" }
        }
        return { success: true, data: page }
    } catch (error) {
        console.error("Error fetching page:", error)
        return { success: false, error: "Failed to fetch page" }
    }
}

export async function createPage(data: PageData) {
    try {
        const page = await prisma.page.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                htmlContent: data.htmlContent,
                isPublished: data.isPublished ?? false,
                sortOrder: data.sortOrder ?? 0
            }
        })
        revalidatePath("/adminlend/pages")
        revalidatePath("/ru")
        return { success: true, data: page }
    } catch (error: any) {
        console.error("Error creating page:", error)
        if (error.code === "P2002") {
            return { success: false, error: "URL уже существует" }
        }
        return { success: false, error: "Failed to create page" }
    }
}

export async function updatePage(id: string, data: Partial<PageData>) {
    try {
        const page = await prisma.page.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        })
        revalidatePath("/adminlend/pages")
        revalidatePath(`/ru/p/${page.slug}`)
        revalidatePath("/ru")
        return { success: true, data: page }
    } catch (error: any) {
        console.error("Error updating page:", error)
        if (error.code === "P2002") {
            return { success: false, error: "URL уже существует" }
        }
        return { success: false, error: "Failed to update page" }
    }
}

export async function deletePage(id: string) {
    try {
        await prisma.page.delete({ where: { id } })
        revalidatePath("/adminlend/pages")
        revalidatePath("/ru")
        return { success: true }
    } catch (error) {
        console.error("Error deleting page:", error)
        return { success: false, error: "Failed to delete page" }
    }
}

export async function togglePagePublished(id: string) {
    try {
        const page = await prisma.page.findUnique({ where: { id } })
        if (!page) {
            return { success: false, error: "Page not found" }
        }
        const updated = await prisma.page.update({
            where: { id },
            data: { isPublished: !page.isPublished }
        })
        revalidatePath("/adminlend/pages")
        revalidatePath(`/ru/p/${updated.slug}`)
        return { success: true, data: updated }
    } catch (error) {
        console.error("Error toggling page:", error)
        return { success: false, error: "Failed to toggle page" }
    }
}
