import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 hover:bg-zinc-800 border-transparent text-white",
        secondary:
          "bg-zinc-100 hover:bg-zinc-200 border-transparent text-zinc-700",
        destructive:
          "bg-red-50 hover:bg-red-100 border-red-200 text-red-700",
        outline: "text-zinc-700 border-zinc-200",
        active: "bg-emerald-50 text-emerald-700 border-emerald-100",
        pending: "bg-zinc-100 text-zinc-600 border-zinc-200",
        review: "bg-amber-50/80 text-amber-700 border-amber-100",
        draft: "bg-zinc-50 text-zinc-500 border-zinc-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
