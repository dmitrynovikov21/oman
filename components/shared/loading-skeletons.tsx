import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Dashboard loading skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="size-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Case list skeleton
export function CaseListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="size-12 rounded" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Case workspace skeleton
export function CaseWorkspaceSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>

            {/* Tabs */}
            <Skeleton className="h-10 w-96 rounded-lg" />

            {/* Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Skeleton className="h-24 rounded-lg" />
                                <Skeleton className="h-24 rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-14 rounded-lg" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-20" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <div className="flex gap-4 pb-2 border-b">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2">
                    {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Chart skeleton
export function ChartSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-end gap-2 h-40">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-between">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-3 w-8" />
                ))}
            </div>
        </div>
    );
}
