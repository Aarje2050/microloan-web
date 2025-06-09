// components/ui/input.tsx - PROFESSIONAL ENTERPRISE INPUT
'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'minimal'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, variant = 'default', disabled, ...props }, ref) => {
    const inputId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              // Base styles - CLEAN WHITE BACKGROUND
              "flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500",
              "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Variant styles
              variant === 'default' && "border-gray-300 hover:border-gray-400",
              variant === 'filled' && "border-gray-200 bg-gray-50",
              variant === 'minimal' && "border-gray-200",
              // Icon padding
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              // Error styles
              error && "border-red-300 focus-visible:ring-red-500",
              // Disabled styles
              disabled && "bg-gray-50 text-gray-500",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Professional Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    const selectId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 flex items-center mt-1">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

// Export all components
export { 
  Input,
  Select
}