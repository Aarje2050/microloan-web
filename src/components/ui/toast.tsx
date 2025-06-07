// components/ui/toast.tsx - Basic toast for notifications
'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
interface ToastProps {
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
    onClose?: () => void
  }
  
  const Toast: React.FC<ToastProps> = ({ 
    title, 
    description, 
    variant = 'default',
    onClose 
  }) => {
    const variants = {
      default: "bg-background text-foreground border",
      destructive: "bg-destructive text-destructive-foreground border-destructive",
      success: "bg-green-600 text-white border-green-600",
    }
  
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onClose?.()
      }, 5000)
      
      return () => clearTimeout(timer)
    }, [onClose])
  
    return (
      <div className={cn(
        "fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg",
        variants[variant]
      )}>
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    )
  }

  // Export all components
export { 
    Toast
  }