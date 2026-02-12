import { notFound } from "next/navigation"
import { allPages } from "contentlayer/generated"
import { getPageBySlug } from "@/actions/page"
import { RoistatHeader } from "@/components/roistat/header"
import { RoistatFooter } from "@/components/roistat/footer"

import { Mdx } from "@/components/content/mdx-components"

import "@/styles/mdx.css"

import { Metadata } from "next"
import { constructMetadata, getBlurDataURL } from "@/lib/utils"

interface PageProps {
  params: { slug: string; locale: string }
}

// Generate static params from contentlayer pages
export async function generateStaticParams() {
  return allPages.map((page) => ({
    slug: page.slugAsParams,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata | undefined> {
  // First check database pages
  const dbResult = await getPageBySlug(params.slug)
  if (dbResult.success && dbResult.data && dbResult.data.isPublished) {
    return constructMetadata({
      title: dbResult.data.title,
      description: dbResult.data.description || undefined,
    })
  }

  // Fall back to contentlayer pages
  const page = allPages.find((page) => page.slugAsParams === params.slug)
  if (!page) {
    return
  }

  const { title, description } = page
  return constructMetadata({
    title: `${title} – LeoAgent`,
    description: description,
  })
}

export default async function DynamicPage({ params }: PageProps) {
  // First check database pages
  const dbResult = await getPageBySlug(params.slug)

  if (dbResult.success && dbResult.data && dbResult.data.isPublished) {
    const page = dbResult.data
    return (
      <>
        <RoistatHeader />
        <main className="min-h-screen bg-white">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold text-zinc-900 mb-8">{page.title}</h1>
            <article
              className="prose prose-lg max-w-none prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: page.htmlContent }}
            />
          </div>
        </main>
        <RoistatFooter />
      </>
    )
  }

  // Fall back to contentlayer pages
  const page = allPages.find((page) => page.slugAsParams === params.slug)

  if (!page) {
    notFound()
  }

  const images = await Promise.all(
    page.images.map(async (src: string) => ({
      src,
      blurDataURL: await getBlurDataURL(src),
    })),
  )

  return (
    <article className="container max-w-3xl py-6 lg:py-12">
      <div className="space-y-4">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="text-xl text-muted-foreground">{page.description}</p>
        )}
      </div>
      <hr className="my-4" />
      <Mdx code={page.body.code} images={images} />
    </article>
  )
}
