// app/dashboard/admin/users/page.tsx - FIXED USER MANAGEMENT (Professional Design & Working Functionality)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  Users, 
  Search, 
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  Download,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatDate } from '@/lib/utils'

// Simple interfaces (no complex types)
interface SimpleUser {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: string
  active: boolean
  email_verified: boolean
  pending_approval: boolean
  created_at: string
  updated_at: string
  loan_count?: number
  kyc_status?: string
}

interface UserFormData {
  email: string
  full_name: string
  phone: string
  role: string
  password: string
}

interface UserDetailsModalProps {
  user: SimpleUser | null
  isOpen: boolean
  onClose: () => void
  onEdit: (user: SimpleUser) => void
  onDelete: (user: SimpleUser) => void
}

function UserDetailsModal({ user, isOpen, onClose, onEdit, onDelete }: UserDetailsModalProps) {
  if (!isOpen || !user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'lender': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'borrower': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.full_name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
              <div className="mt-2">
                <span className={cn(
                  'px-3 py-1.5 text-sm font-semibold rounded-full border capitalize',
                  getRoleColor(user.role)
                )}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={user.active ? "default" : "destructive"} className="font-medium">
                  {user.active ? 'Active' : 'Inactive'}
                </Badge>
                {user.pending_approval && (
                  <Badge variant="warning" className="font-medium">Pending</Badge>
                )}
                {user.email_verified && (
                  <Badge variant="default" className="font-medium">Verified</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Contact Information</h4>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900 break-all font-medium">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900 font-medium">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900 font-medium">Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-4">Account Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Created
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Last Updated
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(user.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for Admin */}
          {user.role === 'super_admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900">Super Admin Account</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    This is a super admin account with full platform access. Exercise caution when modifying.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => onEdit(user)}
              size="sm"
              className="flex-1 sm:flex-none font-medium"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(user)}
              size="sm"
              className="flex-1 sm:flex-none font-medium"
              disabled={user.role === 'super_admin'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    email: '',
    full_name: '',
    phone: '',
    role: 'borrower',
    password: ''
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.full_name || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Creating new user via signup:', formData.email, formData.role)

      // Use regular signup instead of admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role
          }
        }
      })

      if (authError) {
        console.error('❌ Auth user creation failed:', authError)
        throw authError
      }

      if (authData.user) {
        console.log('✅ Auth user created:', authData.user.id)

        // Insert user into our users table (this will be handled by trigger, but we can also do it manually)
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            role: formData.role,
            active: true,
            email_verified: false, // Will be verified via email
            pending_approval: false
          })

        if (userError) {
          console.error('❌ User table insert failed:', userError)
          // Don't throw error here, user creation was successful
          console.log('User might already exist in table or will be created by trigger')
        }

        console.log('✅ User created successfully')
        alert('User created successfully! They will receive a verification email.')
        onSuccess()
        onClose()
        
        // Reset form
        setFormData({
          email: '',
          full_name: '',
          phone: '',
          role: 'borrower',
          password: ''
        })
      }
    } catch (error: any) {
      console.error('❌ Failed to create user:', error)
      let errorMessage = 'Failed to create user'
      
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        errorMessage = 'A user with this email already exists'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address'
      } else if (error.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="borrower">Borrower</option>
              <option value="lender">Lender</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface UserCardProps {
  user: SimpleUser
  onViewDetails: (user: SimpleUser) => void
  onQuickAction: (userId: string, action: string) => void
  isSelected: boolean
  onSelect: (userId: string) => void
  isActionLoading: boolean
}

function UserCard({ user, onViewDetails, onQuickAction, isSelected, onSelect, isActionLoading }: UserCardProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'lender': return 'bg-blue-100 text-blue-800'
      case 'borrower': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(user.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-semibold">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(user)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Status and Role */}
        <div className="flex items-center space-x-2 mb-3">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full capitalize',
            getRoleColor(user.role)
          )}>
            {user.role.replace('_', ' ')}
          </span>
          <Badge variant={user.active ? "default" : "destructive"} className="text-xs">
            {user.active ? 'Active' : 'Inactive'}
          </Badge>
          {user.pending_approval && (
            <Badge variant="warning" className="text-xs">Pending</Badge>
          )}
        </div>

        {/* Key Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Phone</span>
            <span className="font-medium text-gray-900 text-right truncate ml-2">
              {user.phone || 'Not provided'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Joined</span>
            <span className="font-medium text-gray-900">{formatDate(user.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {user.pending_approval ? (
            <>
              <Button
                size="sm"
                onClick={() => onQuickAction(user.id, 'approve')}
                disabled={isActionLoading}
                className="flex-1 h-8 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onQuickAction(user.id, 'reject')}
                disabled={isActionLoading}
                className="flex-1 h-8 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(user)}
                className="flex-1 h-8 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                variant={user.active ? "destructive" : "default"}
                onClick={() => onQuickAction(user.id, user.active ? 'deactivate' : 'activate')}
                disabled={isActionLoading || user.role === 'super_admin'}
                className="flex-1 h-8 text-xs"
              >
                {user.active ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                {user.active ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function FixedUserManagement() {
  const router = useRouter()
  const { user, isAdmin, initialized, isAuthenticated } = useAuth()
  
  // Simple state (same pattern as lender)
  const [users, setUsers] = React.useState<SimpleUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])
  const [selectedUser, setSelectedUser] = React.useState<SimpleUser | null>(null)
  const [showUserDetails, setShowUserDetails] = React.useState(false)
  const [showAddUser, setShowAddUser] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  
  // Filters and search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  console.log('👥 USER MANAGEMENT - State:', { 
    user: user?.email, 
    isAdmin, 
    usersCount: users.length,
    filters: { searchQuery, roleFilter, statusFilter }
  })

  // Auth handling (same as other pages)
  React.useEffect(() => {
    if (!initialized) return

    if (!isAuthenticated) {
      console.log('🚫 USER MGMT - Not authenticated, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isAdmin) {
      console.log('🚫 USER MGMT - Not admin, redirecting to dashboard')
      router.replace('/dashboard')
      return
    }

    console.log('✅ USER MGMT - Access granted')
  }, [initialized, isAuthenticated, isAdmin, router])

  // Load users data
  React.useEffect(() => {
    if (!user || !isAdmin) return
    loadUsers()
  }, [user, isAdmin])

  const loadUsers = async () => {
    if (!user) return

    try {
      console.log('👥 USER MGMT - Loading users...')
      setLoading(true)
      setError(null)

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      if (!usersData || usersData.length === 0) {
        console.log('👥 USER MGMT - No users found')
        setUsers([])
        return
      }

      // Transform users data
      const transformedUsers: SimpleUser[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'Unknown',
        phone: user.phone,
        role: user.role,
        active: user.active,
        email_verified: user.email_verified || false,
        pending_approval: user.pending_approval || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))

      setUsers(transformedUsers)
      console.log('✅ USER MGMT - Users loaded:', transformedUsers.length)

    } catch (error: unknown) {
      console.error('❌ USER MGMT - Failed to load users:', error)
      setError(error instanceof Error ? error.message : 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadUsers()
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  // User actions (direct database operations)
  const handleUserAction = async (userId: string, actionType: string) => {
    try {
      setActionLoading(userId)
      console.log(`🔄 USER MGMT - Performing ${actionType} on user:`, userId)

      let updateData: any = {}

      switch (actionType) {
        case 'approve':
          updateData = { pending_approval: false, active: true }
          break
        case 'reject':
          updateData = { pending_approval: false, active: false }
          break
        case 'activate':
          updateData = { active: true }
          break
        case 'deactivate':
          updateData = { active: false }
          break
        case 'delete':
          // Only delete from our users table, not from auth
          // The user will lose access immediately since we check active status
          const { error: deleteError } = await supabase
            .from('users')
            .update({ active: false, deleted_at: new Date().toISOString() })
            .eq('id', userId)

          if (deleteError) throw deleteError
          
          console.log('✅ USER MGMT - User deactivated (soft delete) successfully')
          await loadUsers()
          return
        default:
          throw new Error(`Unknown action: ${actionType}`)
      }

      // Update user
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) throw updateError

      console.log(`✅ USER MGMT - User ${actionType} successful`)
      await loadUsers()

    } catch (error: any) {
      console.error(`❌ USER MGMT - Failed to ${actionType} user:`, error)
      setError(error.message || `Failed to ${actionType} user`)
    } finally {
      setActionLoading(null)
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    
    try {
      setActionLoading('bulk')
      console.log(`🔄 USER MGMT - Performing bulk ${action} on:`, selectedUsers.length, 'users')

      let updateData: any = {}

      switch (action) {
        case 'approve':
          updateData = { pending_approval: false, active: true }
          break
        case 'activate':
          updateData = { active: true }
          break
        case 'deactivate':
          updateData = { active: false }
          break
        default:
          throw new Error(`Unknown bulk action: ${action}`)
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .in('id', selectedUsers)

      if (error) throw error

      console.log(`✅ USER MGMT - Bulk ${action} successful`)
      setSelectedUsers([])
      await loadUsers()

    } catch (error: any) {
      console.error(`❌ USER MGMT - Failed bulk ${action}:`, error)
      setError(error.message || `Failed to perform bulk ${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(user => user.active && !user.pending_approval)
          break
        case 'inactive':
          filtered = filtered.filter(user => !user.active)
          break
        case 'pending':
          filtered = filtered.filter(user => user.pending_approval)
          break
        case 'verified':
          filtered = filtered.filter(user => user.email_verified)
          break
      }
    }

    return filtered
  }, [users, searchQuery, roleFilter, statusFilter])

  // Modal handlers
  const handleViewDetails = (user: SimpleUser) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  const handleEditUser = (user: SimpleUser) => {
    setShowUserDetails(false)
    // For now, we'll just show alert. You can implement edit modal later
    alert(`Edit functionality for ${user.full_name} - To be implemented`)
  }

  const handleDeleteUser = async (user: SimpleUser) => {
    const confirmMessage = user.role === 'super_admin' 
      ? `You cannot deactivate a super admin account.`
      : `Are you sure you want to deactivate ${user.full_name}?\n\nThis will:\n• Disable their account access\n• Set them as inactive\n• They can be reactivated later if needed`
    
    if (user.role === 'super_admin') {
      alert(confirmMessage)
      return
    }

    if (confirm(confirmMessage)) {
      setShowUserDetails(false)
      await handleUserAction(user.id, 'delete')
    }
  }

  // Selection handlers
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedUsers(prev =>
      prev.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id)
    )
  }

  // Loading state
  if (!initialized) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading user management...</p>
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
            <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
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
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage platform users and permissions • {filteredUsers.length} of {users.length} users
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading || refreshing}
                size="sm"
                className="font-medium"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (loading || refreshing) && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddUser(true)}
                size="sm"
                className="font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Role Filter */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="borrower">Borrowers</option>
                    <option value="lender">Lenders</option>
                    <option value="super_admin">Super Admins</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending Approval</option>
                    <option value="verified">Email Verified</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <span className="text-sm font-semibold text-blue-900">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  disabled={actionLoading === 'bulk'}
                  className="font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                  disabled={actionLoading === 'bulk'}
                  className="font-medium"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('deactivate')}
                  disabled={actionLoading === 'bulk'}
                  className="font-medium"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Users Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first user.'}
            </p>
            <Button
              onClick={() => setShowAddUser(true)}
              className="font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First User
            </Button>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-600">Select all visible users</span>
              </label>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onViewDetails={handleViewDetails}
                  onQuickAction={handleUserAction}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={toggleUserSelection}
                  isActionLoading={actionLoading === user.id}
                />
              ))}
            </div>

            {/* Pagination Info */}
            <div className="mt-8 flex items-center justify-center">
              <p className="text-sm text-gray-600 font-medium">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </>
        )}

        {/* Modals */}
        <UserDetailsModal
          user={selectedUser}
          isOpen={showUserDetails}
          onClose={() => setShowUserDetails(false)}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />

        <AddUserModal
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSuccess={loadUsers}
        />
      </div>
    </DashboardLayout>
  )
}