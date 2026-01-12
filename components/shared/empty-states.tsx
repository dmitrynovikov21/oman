import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface EmptyStateProps {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export function EmptyState({
    icon: Icon = Icons.fileText,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
                <Icon className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
            {action && (
                action.href ? (
                    <Link href={action.href}>
                        <Button>
                            <Icons.add className="mr-2 size-4" />
                            {action.label}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={action.onClick}>
                        <Icons.add className="mr-2 size-4" />
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );
}

// Pre-configured empty states for common scenarios
export function NoCasesEmpty() {
    return (
        <EmptyState
            icon={Icons.fileText}
            title="No cases yet"
            description="Create your first case to get started with ExpertOS"
            action={{ label: "Create New Case", href: "/cases/new" }}
        />
    );
}

export function NoDocumentsEmpty() {
    return (
        <EmptyState
            icon={Icons.upload}
            title="No documents uploaded"
            description="Upload documents to begin processing and analysis"
            action={{ label: "Upload Documents" }}
        />
    );
}

export function NoMeetingsEmpty() {
    return (
        <EmptyState
            icon={Icons.messages}
            title="No meetings recorded"
            description="Record or schedule a meeting with case parties"
            action={{ label: "New Recording" }}
        />
    );
}

export function NoResultsEmpty({ query }: { query: string }) {
    return (
        <EmptyState
            icon={Icons.search}
            title="No results found"
            description={`We couldn't find any results for "${query}". Try adjusting your search.`}
        />
    );
}

export function NoNotificationsEmpty() {
    return (
        <EmptyState
            icon={Icons.messages}
            title="All caught up!"
            description="You have no new notifications"
        />
    );
}
