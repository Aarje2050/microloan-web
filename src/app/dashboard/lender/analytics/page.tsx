// app/dashboard/admin/analytics/page.tsx - ANALYTICS DASHBOARD (Coming Soon Placeholder)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Users,
  CreditCard,
  DollarSign,
  Calendar,
  Target,
  Activity,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminAnalytics() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()

  console.log('📊 ANALYTICS - State:', { 
    user: user?.email, 
    isAdmin
  })

  // Auth handling (same as other pages)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 ANALYTICS - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 ANALYTICS - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ ANALYTICS - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Mock data for visualization
  const mockStats = [
    { label: 'Total Loans', value: '1,234', icon: CreditCard, trend: '+12.5%', trendUp: true },
    { label: 'Active Users', value: '856', icon: Users, trend: '+8.2%', trendUp: true },
    { label: 'Portfolio Value', value: '₹45.6M', icon: DollarSign, trend: '+15.3%', trendUp: true },
    { label: 'Collection Rate', value: '94.2%', icon: Target, trend: '-2.1%', trendUp: false },
  ]

  const upcomingFeatures = [
    {
      title: 'Loan Performance Analytics',
      description: 'Track loan disbursement trends, repayment rates, and portfolio health metrics',
      icon: TrendingUp,
      category: 'Performance'
    },
    {
      title: 'User Behavior Analytics',
      description: 'Analyze user engagement, signup patterns, and platform usage statistics',
      icon: Users,
      category: 'User Insights'
    },
    {
      title: 'Financial Dashboards',
      description: 'Revenue tracking, profit margins, and comprehensive financial reporting',
      icon: DollarSign,
      category: 'Finance'
    },
    {
      title: 'Risk Assessment Tools',
      description: 'Credit risk analysis, default prediction models, and early warning systems',
      icon: AlertCircle,
      category: 'Risk Management'
    },
    {
      title: 'Real-time Monitoring',
      description: 'Live transaction monitoring, system health metrics, and performance alerts',
      icon: Activity,
      category: 'Monitoring'
    },
    {
      title: 'Custom Report Builder',
      description: 'Create custom analytics reports with drag-and-drop interface and scheduling',
      icon: BarChart3,
      category: 'Reporting'
    }
  ]

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Not authenticated state
  if (!isAuthenticated || !isAdmin) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Comprehensive analytics and insights for platform performance
              </p>
            </div>
            <div className="flex space-x-3">
              <Badge variant="outline" className="font-medium">
                <Clock className="h-3 w-3 mr-1" />
                Coming Soon
              </Badge>
            </div>
          </div>
        </div>

        {/* Mock Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        {stat.trendUp ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.trendUp ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.trend}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center opacity-20">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {/* Overlay for disabled state */}
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="font-medium">
                      Preview Mode
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced Analytics Coming Soon
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're building powerful analytics tools to help you make data-driven decisions. 
            Get ready for comprehensive insights into your lending platform's performance.
          </p>
        </div>

        {/* Upcoming Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        {feature.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mock Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Loan Disbursement Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Chart Preview</p>
                  <p className="text-sm text-gray-400">Interactive charts coming soon</p>
                </div>
                {/* Mock chart lines */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 400 200">
                    <path d="M 50 150 Q 100 100 150 120 T 250 80 T 350 100" stroke="#3B82F6" strokeWidth="3" fill="none" />
                    <path d="M 50 120 Q 100 80 150 90 T 250 60 T 350 70" stroke="#10B981" strokeWidth="3" fill="none" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Portfolio Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-center z-10">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Chart Preview</p>
                  <p className="text-sm text-gray-400">Interactive charts coming soon</p>
                </div>
                {/* Mock pie chart */}
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-8 border-blue-500 border-t-green-500 border-r-purple-500 border-b-yellow-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Stay Tuned for Powerful Analytics
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our analytics dashboard will provide real-time insights, custom reports, and 
              predictive analytics to help you optimize your lending operations and make 
              informed business decisions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button variant="outline" className="font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                Get Notified
              </Button>
              <Button variant="outline" className="font-medium">
                <Activity className="h-4 w-4 mr-2" />
                Request Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}