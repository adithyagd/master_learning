import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "brand" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  benchmark?: number; // e.g. 70% passing score marker
  benchmarkLabel?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = "brand",
  size = "md",
  showLabel = false,
  benchmark,
  benchmarkLabel = "Passing (70%)",
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const fillVariants = {
    brand: "bg-brand-600",
    success: "bg-success-600",
    warning: "bg-warning-500",
    danger: "bg-danger-600",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1.5 select-none", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-navy-700">Progress</span>
          <span className="font-semibold text-navy-900">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full bg-navy-100 rounded-full overflow-hidden relative shadow-inner",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            fillVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
        {benchmark !== undefined && (
          <div
            title={benchmarkLabel}
            className="absolute top-0 bottom-0 w-0.5 bg-navy-900/60 z-10"
            style={{ left: `${benchmark}%` }}
          />
        )}
      </div>
      {benchmark !== undefined && (
        <div className="flex justify-between text-[10px] text-navy-400 font-medium">
          <span>0%</span>
          <span className="text-navy-600 font-semibold">{benchmarkLabel}</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
