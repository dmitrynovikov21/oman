import { cn } from "@/lib/utils";
import { Icons } from "@/components/shared/icons";

interface AlertProps {
    type?: "info" | "success" | "warning" | "error";
    title?: string;
    children: React.ReactNode;
    className?: string;
}

const styles = {
    info: { bg: "bg-blue-50 border-blue-200", icon: Icons.messages, iconColor: "text-blue-600" },
    success: { bg: "bg-green-50 border-green-200", icon: Icons.check, iconColor: "text-green-600" },
    warning: { bg: "bg-amber-50 border-amber-200", icon: Icons.warning, iconColor: "text-amber-600" },
    error: { bg: "bg-red-50 border-red-200", icon: Icons.close, iconColor: "text-red-600" },
};

export function Alert({ type = "info", title, children, className }: AlertProps) {
    const { bg, icon: IconComponent, iconColor } = styles[type];

    return (
        <div className={cn("flex gap-3 p-4 rounded-lg border", bg, className)}>
            <IconComponent className={cn("size-5 shrink-0 mt-0.5", iconColor)} />
            <div>
                {title && <p className="font-medium mb-1">{title}</p>}
                <div className="text-sm">{children}</div>
            </div>
        </div>
    );
}
