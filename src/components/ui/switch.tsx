// components/ui/switch.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  id?: string
  name?: string
  value?: string
  required?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      disabled = false,
      onCheckedChange,
      className,
      id,
      name,
      value,
      required,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isControlled = checked !== undefined
    const switchChecked = isControlled ? checked : internalChecked

    const handleClick = () => {
      if (disabled) return
      
      const newChecked = !switchChecked
      
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      
      onCheckedChange?.(newChecked)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        handleClick()
      }
    }

    return (
      <>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={switchChecked}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base styles
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            // Checked styles
            switchChecked
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-200 hover:bg-gray-300",
            // Disabled styles
            disabled && "cursor-not-allowed opacity-50 hover:bg-gray-200",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              // Base thumb styles
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
              // Transform based on checked state
              switchChecked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {/* Hidden input for form compatibility */}
        {(name || required) && (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={switchChecked}
            required={required}
            onChange={() => {}} // Controlled by button
            className="sr-only"
            tabIndex={-1}
          />
        )}
      </>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }