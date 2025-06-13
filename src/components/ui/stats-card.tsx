// components/ui/stats-card.tsx - PROFESSIONAL MINIMAL DESIGN
'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendData {
  value: string | number
  label?: string
  positive?: boolean
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  className?: string
  loading?: boolean
  subtitle?: string
  color?: string
  trend?: TrendData
  variant?: string
  description?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className,
  loading = false,
  subtitle
}: StatsCardProps) {
  if (loading) {
    return (
      <div className={cn(
        'bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 group',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors duration-200">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      {/* Value */}
      <div className="space-y-1">
        <div className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
        </div>
        
        {/* Subtitle or Change */}
        {(subtitle || change) && (
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            {change && (
              <div className={cn(
                'text-sm font-medium flex items-center space-x-1',
                changeType === 'positive' && 'text-green-600',
                changeType === 'negative' && 'text-red-600',
                changeType === 'neutral' && 'text-gray-500'
              )}>
                {changeType === 'positive' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                )}
                {changeType === 'negative' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                  </svg>
                )}
                <span>{change}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Variant for key metrics
interface MetricCardProps {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  icon: LucideIcon
  className?: string
}

export function MetricCard({
  label,
  value,
  trend,
  trendValue,
  icon: Icon,
  className
}: MetricCardProps) {
  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && trendValue && (
            <div className={cn(
              'flex items-center mt-2 text-sm',
              trend === 'up' && 'text-green-600',
              trend === 'down' && 'text-red-600',
              trend === 'stable' && 'text-gray-500'
            )}>
              {trend === 'up' && <span className="mr-1">↗</span>}
              {trend === 'down' && <span className="mr-1">↘</span>}
              {trend === 'stable' && <span className="mr-1">→</span>}
              <span className="font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
      </div>
    </div>
  )
}

// Compact variant for mobile
interface CompactStatsProps {
  stats: Array<{
    label: string
    value: string | number
    icon: LucideIcon
  }>
  className?: string
}

export function CompactStats({ stats, className }: CompactStatsProps) {
  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-4 shadow-sm',
      className
    )}>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="text-center">
              <div className="p-2 bg-gray-50 rounded-lg inline-flex mb-2">
                <Icon className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}