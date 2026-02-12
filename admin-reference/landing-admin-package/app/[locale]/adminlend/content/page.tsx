import { MediaGallery } from "@/components/admin/media-gallery"
import { PostGenerator } from "@/components/admin/post-generator"

export default function ContentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Создание контента</h1>
                <p className="text-zinc-500 mt-1">
                    Генерируйте посты и изображения с помощью AI
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Post Generator */}
                <PostGenerator />

                {/* Media Gallery */}
                <MediaGallery />
            </div>
        </div>
    )
}
