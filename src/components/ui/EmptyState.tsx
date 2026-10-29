import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Inbox } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  variant?: "card" | "plain";
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  variant = "plain",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 select-none",
        variant === "card" &&
          "bg-white border border-dashed border-navy-300 rounded-xl shadow-sm",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-navy-100/80 text-navy-500 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6 text-navy-400" />}
      </div>
      <h4 className="text-sm font-semibold text-navy-900 mb-1">{title}</h4>
      <p className="text-xs text-navy-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
