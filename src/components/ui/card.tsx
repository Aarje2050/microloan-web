import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm hover:shadow-md",
        elevated: "shadow-md hover:shadow-lg",
        outline: "border-2 shadow-none hover:shadow-sm",
        ghost: "border-transparent shadow-none hover:bg-accent/50",
        interactive: "shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean
  }
>(({ className, divider = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      divider && "border-b border-border pb-4 mb-6",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, as: Comp = "h3", ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean
    align?: "left" | "center" | "right" | "between"
  }
>(({ className, divider = false, align = "right", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      divider && "border-t border-border pt-4 mt-6",
      align === "left" && "justify-start",
      align === "center" && "justify-center",
      align === "right" && "justify-end",
      align === "between" && "justify-between",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Specialized card components
export interface StatsCardProps extends Omit<CardProps, 'children'> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label?: string
    positive?: boolean
  }
  loading?: boolean
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ 
    title, 
    value, 
    description, 
    icon, 
    trend, 
    loading = false,
    className,
    ...props 
  }, ref) => (
    <Card
      ref={ref}
      variant="elevated"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      )}
      
      <CardContent className="space-y-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {loading ? (
                <span className="skeleton h-8 w-20 rounded"></span>
              ) : (
                value
              )}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0 p-3 bg-primary/5 rounded-lg">
              <div className="text-primary">
                {icon}
              </div>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="flex items-center mt-4 pt-4 border-t border-border">
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              <svg
                className={cn(
                  "w-3 h-3 mr-1",
                  trend.positive ? "rotate-0" : "rotate-180"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {Math.abs(trend.value)}%
            </div>
            {trend.label && (
              <span className="text-xs text-muted-foreground ml-2">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
)
StatsCard.displayName = "StatsCard"

export interface ActionCardProps extends CardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  href?: string
  onClick?: () => void
}

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ 
    title, 
    description, 
    icon, 
    action, 
    href, 
    onClick,
    className,
    ...props 
  }, ref) => {
    const isInteractive = Boolean(href || onClick)
    
    const cardContent = (
      <Card
        ref={ref}
        variant={isInteractive ? "interactive" : "default"}
        className={className}
        onClick={onClick}
        {...props}
      >
        <CardContent>
          <div className="flex items-start space-x-4">
            {icon && (
              <div className="flex-shrink-0 p-2 bg-primary/5 rounded-lg">
                <div className="text-primary">
                  {icon}
                </div>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
    
    if (href) {
      return (
        <a href={href} className="block">
          {cardContent}
        </a>
      )
    }
    
    return cardContent
  }
)
ActionCard.displayName = "ActionCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  StatsCard,
  ActionCard,
  cardVariants 
}