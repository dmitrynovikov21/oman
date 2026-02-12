"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Types
interface ArticleData {
    title: string
    slug: string
    description?: string
    contentJson?: any
    category?: "GUIDE" | "BLOG" | "CASE" | "NEWS"
    status?: "DRAFT" | "PUBLISHED"
    isFeaturedOnHome?: boolean
    coverImageUrl?: string
}

// Get all articles (optional category filter)
export async function getArticles(category?: "BLOG" | "CASE" | "GUIDE" | "NEWS") {
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

// Get single article by ID
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

// Get article by slug
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

// Create new article
export async function createArticle(data: ArticleData) {
    try {
        // Check if slug already exists
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
                contentJson: data.contentJson || {},
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

// Update article
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

// Delete article
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

// Get featured BLOG articles for homepage (max 3)
export async function getFeaturedArticles() {
    try {
        const articles = await prisma.article.findMany({
            where: {
                isFeaturedOnHome: true,
                status: "PUBLISHED",
                category: {
                    not: "CASE"
                }
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

// Get featured CASES for homepage (max 3)
export async function getFeaturedCases() {
    try {
        const cases = await prisma.article.findMany({
            where: {
                isFeaturedOnHome: true,
                status: "PUBLISHED",
                category: "CASE"
            },
            orderBy: { updatedAt: "desc" },
            take: 3
        })
        return { success: true, data: cases }
    } catch (error) {
        console.error("Error fetching featured cases:", error)
        return { success: false, error: "Failed to fetch featured cases" }
    }
}

// Toggle featured status with max 3 limit PER CATEGORY
export async function toggleArticleFeatured(id: string) {
    try {
        const article = await prisma.article.findUnique({ where: { id } })
        if (!article) {
            return { success: false, error: "Article not found" }
        }

        // If turning on featured, check limit for this category
        if (!article.isFeaturedOnHome) {
            const featuredCount = await prisma.article.count({
                where: {
                    isFeaturedOnHome: true,
                    category: article.category
                }
            })
            if (featuredCount >= 3) {
                return { success: false, error: `Максимум 3 записи в категории ${article.category} на главной.` }
            }
        }

        const updated = await prisma.article.update({
            where: { id },
            data: { isFeaturedOnHome: !article.isFeaturedOnHome }
        })

        revalidatePath("/adminlend/blog")
        revalidatePath("/ru/blog")
        revalidatePath("/ru")
        revalidatePath("/")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Error toggling featured:", error)
        return { success: false, error: "Failed to toggle featured" }
    }
}
