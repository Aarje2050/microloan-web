// app/dashboard/admin/settings/page.tsx - ADMIN SETTINGS (Coming Soon Placeholder)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Settings,
  Shield,
  Mail,
  Bell,
  Database,
  Users,
  CreditCard,
  Globe,
  Lock,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  Sliders,
  Key,
  Server,
  Smartphone,
  FileText,
  DollarSign,
  Calendar,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

export default function AdminSettings() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()

  console.log('⚙️ SETTINGS - State:', { 
    user: user?.email, 
    isAdmin
  })

  // Auth handling (same as other pages)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 SETTINGS - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 SETTINGS - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ SETTINGS - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  const settingsCategories = [
    {
      title: 'Platform Configuration',
      description: 'Core platform settings and configurations',
      icon: Settings,
      color: 'from-blue-500 to-cyan-500',
      settings: [
        { name: 'Platform Name & Branding', description: 'Customize platform identity and logos', icon: Globe },
        { name: 'General Settings', description: 'Basic platform configuration options', icon: Sliders },
        { name: 'Feature Toggles', description: 'Enable/disable platform features', icon: Zap },
        { name: 'Maintenance Mode', description: 'Platform maintenance and downtime settings', icon: AlertCircle }
      ]
    },
    {
      title: 'User Management',
      description: 'User roles, permissions, and access controls',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      settings: [
        { name: 'Role Management', description: 'Configure user roles and permissions', icon: Shield },
        { name: 'Registration Settings', description: 'User signup and onboarding controls', icon: Users },
        { name: 'KYC Configuration', description: 'Identity verification requirements', icon: CheckCircle },
        { name: 'Account Policies', description: 'Password and security policies', icon: Lock }
      ]
    },
    {
      title: 'Loan Configuration',
      description: 'Loan products, interest rates, and policies',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500',
      settings: [
        { name: 'Loan Products', description: 'Manage loan types and configurations', icon: CreditCard },
        { name: 'Interest Rate Settings', description: 'Configure interest rates and calculations', icon: DollarSign },
        { name: 'Approval Workflows', description: 'Loan approval process configuration', icon: CheckCircle },
        { name: 'Collection Policies', description: 'EMI collection and penalty settings', icon: Calendar }
      ]
    },
    {
      title: 'Security & Compliance',
      description: 'Security protocols and compliance settings',
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      settings: [
        { name: 'Authentication Settings', description: 'Login security and 2FA configuration', icon: Key },
        { name: 'API Security', description: 'API keys and access token management', icon: Server },
        { name: 'Audit Logs', description: 'System audit and logging configuration', icon: FileText },
        { name: 'Compliance Settings', description: 'Regulatory compliance configurations', icon: Shield }
      ]
    },
    {
      title: 'Notifications',
      description: 'Email, SMS, and push notification settings',
      icon: Bell,
      color: 'from-yellow-500 to-amber-500',
      settings: [
        { name: 'Email Templates', description: 'Customize email notification templates', icon: Mail },
        { name: 'SMS Configuration', description: 'SMS gateway and message settings', icon: Smartphone },
        { name: 'Push Notifications', description: 'Mobile app notification settings', icon: Bell },
        { name: 'Notification Rules', description: 'When and how to send notifications', icon: AlertCircle }
      ]
    },
    {
      title: 'System & Database',
      description: 'System performance and database management',
      icon: Database,
      color: 'from-indigo-500 to-blue-500',
      settings: [
        { name: 'Database Configuration', description: 'Database connection and optimization', icon: Database },
        { name: 'Backup Settings', description: 'Automated backup and recovery options', icon: Server },
        { name: 'Performance Monitoring', description: 'System performance and health checks', icon: Activity },
        { name: 'Cache Management', description: 'Caching strategies and configuration', icon: Zap }
      ]
    }
  ]

  // Mock current settings status
  const systemStatus = [
    { label: 'Platform Status', value: 'Online', status: 'success' },
    { label: 'Database Health', value: 'Optimal', status: 'success' },
    { label: 'API Response Time', value: '120ms', status: 'success' },
    { label: 'Active Users', value: '856', status: 'info' },
  ]

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading settings...</p>
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
            <Settings className="h-12 w-12 text-red-600 mx-auto mb-4" />
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
              <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              <p className="mt-2 text-sm text-gray-600">
                Configure and manage your lending platform settings
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

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStatus.map((status, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{status.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{status.value}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'success' ? 'bg-green-500' : 
                    status.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 mb-8">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced Settings Panel Coming Soon
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              We're building a comprehensive settings interface to give you complete control 
              over your lending platform. Configure everything from user permissions to 
              loan policies with ease.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button variant="outline" className="font-medium">
                <Bell className="h-4 w-4 mr-2" />
                Get Notified
              </Button>
              <Button variant="outline" className="font-medium">
                <FileText className="h-4 w-4 mr-2" />
                View Roadmap
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Categories */}
        <div className="space-y-8">
          {settingsCategories.map((category, categoryIndex) => {
            const CategoryIcon = category.icon
            return (
              <Card key={categoryIndex} className="overflow-hidden">
                <CardHeader className={`bg-gradient-to-r ${category.color} text-white`}>
                  <CardTitle className="flex items-center space-x-3">
                    <CategoryIcon className="h-6 w-6" />
                    <div>
                      <span className="text-xl">{category.title}</span>
                      <p className="text-sm opacity-90 font-normal mt-1">{category.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.settings.map((setting, settingIndex) => {
                      const SettingIcon = setting.icon
                      return (
                        <div
                          key={settingIndex}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <SettingIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{setting.name}</h4>
                              <p className="text-sm text-gray-600">{setting.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Switch disabled className="opacity-50" />
                            <Badge variant="outline" className="text-xs">
                              Preview
                            </Badge>
                          </div>
                          {/* Overlay for disabled state */}
                          <div className="absolute inset-0 bg-white bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="font-medium">
                              Coming Soon
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-6 justify-start space-x-4" disabled>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Backup Database</p>
                  <p className="text-sm text-gray-600">Create system backup</p>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto p-6 justify-start space-x-4" disabled>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Security Scan</p>
                  <p className="text-sm text-gray-600">Run security audit</p>
                </div>
              </Button>
              
              <Button variant="outline" className="h-auto p-6 justify-start space-x-4" disabled>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">System Health</p>
                  <p className="text-sm text-gray-600">Check system status</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Notice */}
        <Card className="mt-8 bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Settings Panel in Development</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Our comprehensive settings panel is currently under development. Once released, 
                  you'll have granular control over every aspect of your lending platform, from 
                  user permissions to loan configurations and system security settings.
                </p>
                <div className="mt-4 flex space-x-4">
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                    <Calendar className="h-4 w-4 mr-2" />
                    Subscribe to Updates
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                    <FileText className="h-4 w-4 mr-2" />
                    Feature Requests
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}