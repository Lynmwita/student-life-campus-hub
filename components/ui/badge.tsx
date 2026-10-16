import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#0B1D33]/5 text-[#0B1D33] border border-[#C59B27]/30",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-300",
    warning: "bg-amber-50 text-amber-900 border border-amber-300",
    danger: "bg-rose-50 text-rose-800 border border-rose-300",
    info: "bg-[#0B1D33] text-[#FCD34D] border border-[#C59B27]/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
