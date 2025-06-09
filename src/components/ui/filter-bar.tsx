// components/ui/filter-bar.tsx - PROFESSIONAL ENTERPRISE FILTER BAR
'use client'

import React from 'react'
import { Search, Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface SortOption {
  value: string
  label: string
}

interface FilterBarProps {
  // Search
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  
  // Filters
  filters?: Array<{
    key: string
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }>
  
  // Sort
  sortOptions?: SortOption[]
  sortValue?: string
  onSortChange?: (value: string) => void
  
  // Actions
  onRefresh?: () => void
  isRefreshing?: boolean
  customActions?: React.ReactNode
  
  // Mobile
  className?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortOptions = [],
  sortValue,
  onSortChange,
  onRefresh,
  isRefreshing = false,
  customActions,
  className
}: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false)
  const activeFiltersCount = filters.filter(f => f.value !== 'all' && f.value !== '').length

  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      <div className="p-4 space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Desktop Filters & Sort */}
        <div className="hidden md:flex items-center justify-between space-x-4">
          {/* Filter Buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {filters.map((filter) => (
              <div key={filter.key} className="relative group">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.count !== undefined && `(${option.count})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Sort & Actions */}
          <div className="flex items-center space-x-3">
            {sortOptions.length > 0 && (
              <div className="relative">
                <select
                  value={sortValue}
                  onChange={(e) => onSortChange?.(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            
            {customActions}
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        {(filters.length > 0 || sortOptions.length > 0) && (
          <div className="md:hidden flex items-center justify-between">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters & Sort
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {customActions && (
              <div className="flex items-center space-x-2">
                {customActions}
              </div>
            )}
          </div>
        )}

        {/* Mobile Filters Dropdown */}
        {showMobileFilters && (
          <div className="md:hidden space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* Mobile Filters */}
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.count !== undefined && `(${option.count})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Mobile Sort */}
            {sortOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <select
                  value={sortValue}
                  onChange={(e) => onSortChange?.(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Close Mobile Filters */}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Filter Chips Component
interface QuickFilterChipsProps {
  filters: Array<{
    key: string
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }>
  className?: string
}

export function QuickFilterChips({ filters, className }: QuickFilterChipsProps) {
  return (
    <div className={cn("flex items-center space-x-2 overflow-x-auto pb-2", className)}>
      {filters.map((filter) => (
        <div key={filter.key} className="flex space-x-1 whitespace-nowrap">
          {filter.options.slice(0, 4).map((option) => (
            <button
              key={option.value}
              onClick={() => filter.onChange(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                filter.value === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

// Professional Stats Bar Component
interface StatsBarProps {
  stats: Array<{
    label: string
    value: string | number
    color?: string
    onClick?: () => void
  }>
  className?: string
}

export function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              className={cn(
                "text-center p-3 rounded-lg border border-gray-200 transition-colors",
                stat.onClick ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300" : "",
                stat.color === 'green' && "bg-green-50 border-green-200",
                stat.color === 'blue' && "bg-blue-50 border-blue-200",
                stat.color === 'red' && "bg-red-50 border-red-200",
                stat.color === 'yellow' && "bg-yellow-50 border-yellow-200"
              )}
            >
              <p className={cn(
                "text-xl font-bold",
                stat.color === 'green' && "text-green-900",
                stat.color === 'blue' && "text-blue-900",
                stat.color === 'red' && "text-red-900",
                stat.color === 'yellow' && "text-yellow-900",
                !stat.color && "text-gray-900"
              )}>
                {stat.value}
              </p>
              <p className={cn(
                "text-sm",
                stat.color === 'green' && "text-green-600",
                stat.color === 'blue' && "text-blue-600",
                stat.color === 'red' && "text-red-600",
                stat.color === 'yellow' && "text-yellow-600",
                !stat.color && "text-gray-600"
              )}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}