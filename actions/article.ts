"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface ArticleData {
    title: string
    slug: string
    description?: string
    contentJson?: string
    category?: string
    status?: string
    isFeaturedOnHome?: boolean
    coverImageUrl?: string
}

export async function getArticles(category?: string) {
    try {
        const where = category ? { category } : {}
        const articles = await prisma.article.findMany({
            where,
            orderBy: { createdAt: "desc" }
        })
        return { success: true, data: articles }
    } catch (error) {
        console.error("Error fetching articles:", error)
        return { success: false, error: "Failed to fetch articles" }
    }
}

export async function getArticle(id: string) {
    try {
        const article = await prisma.article.findUnique({
            where: { id }
        })
        if (!article) {
            return { success: false, error: "Article not found" }
        }
        return { success: true, data: article }
    } catch (error) {
        console.error("Error fetching article:", error)
        return { success: false, error: "Failed to fetch article" }
    }
}

export async function getArticleBySlug(slug: string) {
    try {
        const article = await prisma.article.findUnique({
            where: { slug }
        })
        if (!article) {
            return { success: false, error: "Article not found" }
        }
        return { success: true, data: article }
    } catch (error) {
        console.error("Error fetching article:", error)
        return { success: false, error: "Failed to fetch article" }
    }
}

export async function createArticle(data: ArticleData) {
    try {
        const existing = await prisma.article.findUnique({
            where: { slug: data.slug }
        })
        if (existing) {
            return { success: false, error: "Slug already exists" }
        }

        const article = await prisma.article.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                contentJson: data.contentJson || "{}",
                category: data.category || "BLOG",
                status: data.status || "DRAFT",
                isFeaturedOnHome: data.isFeaturedOnHome || false,
                coverImageUrl: data.coverImageUrl,
            }
        })

        revalidatePath("/adminlend/blog")
        revalidatePath("/blog")
        return { success: true, data: article }
    } catch (error) {
        console.error("Error creating article:", error)
        return { success: false, error: "Failed to create article" }
    }
}

export async function updateArticle(id: string, data: Partial<ArticleData>) {
    try {
        const article = await prisma.article.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        })

        revalidatePath("/adminlend/blog")
        revalidatePath(`/adminlend/blog/${id}`)
        revalidatePath("/blog")
        return { success: true, data: article }
    } catch (error) {
        console.error("Error updating article:", error)
        return { success: false, error: "Failed to update article" }
    }
}

export async function deleteArticle(id: string) {
    try {
        await prisma.article.delete({
            where: { id }
        })

        revalidatePath("/adminlend/blog")
        revalidatePath("/blog")
        return { success: true }
    } catch (error) {
        console.error("Error deleting article:", error)
        return { success: false, error: "Failed to delete article" }
    }
}

export async function getFeaturedArticles() {
    try {
        const articles = await prisma.article.findMany({
            where: {
                isFeaturedOnHome: true,
                status: "PUBLISHED",
                category: { not: "CASE" }
            },
            orderBy: { updatedAt: "desc" },
            take: 3
        })
        return { success: true, data: articles }
    } catch (error) {
        console.error("Error fetching featured articles:", error)
        return { success: false, error: "Failed to fetch featured articles" }
    }
}

export async function toggleArticleFeatured(id: string) {
    try {
        const article = await prisma.article.findUnique({ where: { id } })
        if (!article) {
            return { success: false, error: "Article not found" }
        }

        if (!article.isFeaturedOnHome) {
            const featuredCount = await prisma.article.count({
                where: {
                    isFeaturedOnHome: true,
                    category: article.category
                }
            })
            if (featuredCount >= 3) {
                return { success: false, error: `Maximum 3 featured articles per category.` }
            }
        }

        const updated = await prisma.article.update({
            where: { id },
            data: { isFeaturedOnHome: !article.isFeaturedOnHome }
        })

        revalidatePath("/adminlend/blog")
        revalidatePath("/blog")
        revalidatePath("/")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Error toggling featured:", error)
        return { success: false, error: "Failed to toggle featured" }
    }
}
