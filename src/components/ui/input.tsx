import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input hover:border-primary/50 focus:border-primary",
        error: "border-destructive hover:border-destructive/80 focus:border-destructive focus-visible:ring-destructive",
        success: "border-success hover:border-success/80 focus:border-success focus-visible:ring-success",
        warning: "border-warning hover:border-warning/80 focus:border-warning focus-visible:ring-warning",
      },
      inputSize: {
        sm: "h-8 px-3 py-1 text-xs",
        default: "h-10 px-3 py-2",
        lg: "h-11 px-4 py-3",
        xl: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  error?: string
  success?: string
  helperText?: string
  label?: string
  required?: boolean
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    inputSize,
    type = "text",
    leftIcon,
    rightIcon,
    leftElement,
    rightElement,
    error,
    success,
    helperText,
    label,
    required,
    containerClassName,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId()
    const helperTextId = `${inputId}-helper`
    
    // Determine variant based on state
    const currentVariant = error ? "error" : success ? "success" : variant
    
    const hasLeftContent = leftIcon || leftElement
    const hasRightContent = rightIcon || rightElement
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        
        <div className="relative">
          {/* Left content */}
          {hasLeftContent && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
              {leftIcon && (
                <span className="text-muted-foreground">
                  {leftIcon}
                </span>
              )}
              {leftElement}
            </div>
          )}
          
          {/* Input */}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: currentVariant, inputSize }),
              hasLeftContent && "pl-10",
              hasRightContent && "pr-10",
              className
            )}
            ref={ref}
            id={inputId}
            aria-describedby={
              (error || success || helperText) ? helperTextId : undefined
            }
            aria-invalid={error ? true : undefined}
            {...props}
          />
          
          {/* Right content */}
          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightIcon && (
                <span className="text-muted-foreground">
                  {rightIcon}
                </span>
              )}
              {rightElement}
            </div>
          )}
        </div>
        
        {/* Helper text / Error / Success message */}
        {(error || success || helperText) && (
          <p
            id={helperTextId}
            className={cn(
              "text-sm",
              error && "text-destructive",
              success && "text-success",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Specialized input components
export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={
        leftIcon || (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )
      }
      {...props}
    />
  )
)
SearchInput.displayName = "SearchInput"

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    
    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        }
        {...props}
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export const NumberInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="number"
      {...props}
    />
  )
)
NumberInput.displayName = "NumberInput"

export const EmailInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => (
    <Input
      ref={ref}
      type="email"
      leftIcon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      }
      {...props}
    />
  )
)
EmailInput.displayName = "EmailInput"

export { Input, inputVariants }