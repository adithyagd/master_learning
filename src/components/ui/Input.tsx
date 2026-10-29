import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftAddon, rightAddon, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-navy-800 tracking-wide">
            {label}
            {props.required && <span className="text-danger-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 pointer-events-none text-navy-400 flex items-center">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-navy-900 transition-colors duration-150",
              "placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
              "disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed",
              error
                ? "border-danger-400 focus:ring-danger-400 focus:border-danger-400"
                : "border-navy-300 hover:border-navy-400",
              leftAddon && "pl-9",
              rightAddon && "pr-9",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-navy-400">{rightAddon}</div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-danger-600 font-medium leading-none">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-navy-500 leading-none">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
