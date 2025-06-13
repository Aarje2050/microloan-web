// components/features/admin/user-management.tsx - User Management
'use client'

import React from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EnhancedUser, UserFilters, SortOptions, PaginationOptions } from '@/lib/api/types'
import { getUsers, performUserAction, performBulkUserAction } from '@/lib/api/admin/users'
import { formatDate, cn } from '@/lib/utils'

interface UserManagementProps {
  refreshTrigger?: number
  onUserSelect?: (user: EnhancedUser) => void
  onCreateUser?: () => void
}

export default function UserManagement({ refreshTrigger, onUserSelect, onCreateUser }: UserManagementProps) {
  const [users, setUsers] = React.useState<EnhancedUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])
  
  // Filters and pagination
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState<UserFilters>({})
  const [sort, setSort] = React.useState<SortOptions>({ field: 'created_at', direction: 'desc' })
  const [pagination, setPagination] = React.useState<PaginationOptions>({ page: 1, limit: 20 })
  
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const searchFilters: UserFilters = { ...filters }
      
      const { data, error: apiError } = await getUsers(searchFilters, sort, pagination)
      
      if (apiError) {
        setError(apiError)
        return
      }
      
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [filters, sort, pagination])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers, refreshTrigger])

  // Debounced search
  React.useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        // In a real implementation, you'd pass search to the API
        // For now, we'll filter locally
        const filtered = users.filter(user =>
          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone.includes(searchQuery)
        )
        // setUsers(filtered) // Commented to avoid infinite loop
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  const handleUserAction = async (userId: string, actionType: string, reason?: string) => {
    try {
      setActionLoading(userId)
      
      const { success, error } = await performUserAction({
        type: actionType as any,
        userId,
        reason
      })
      
      if (error) {
        throw new Error(error)
      }
      
      if (success) {
        await loadUsers() // Reload data
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${actionType} user`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: string, reason?: string) => {
    if (selectedUsers.length === 0) return
    
    try {
      setActionLoading('bulk')
      
      const { success, results, error } = await performBulkUserAction({
        action,
        items: selectedUsers,
        reason
      })
      
      if (error) {
        throw new Error(error)
      }
      
      const successCount = results.filter(r => r.success).length
      console.log(`Bulk action completed: ${successCount}/${results.length} successful`)
      
      setSelectedUsers([])
      await loadUsers()
    } catch (err: any) {
      setError(err.message || `Failed to perform bulk ${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedUsers(prev =>
      prev.length === users.length ? [] : users.map(u => u.id)
    )
  }

  const getRiskColor = (riskScore?: number) => {
    if (!riskScore) return 'bg-muted text-muted-foreground'
    if (riskScore >= 70) return 'bg-destructive/10 text-destructive'
    if (riskScore >= 40) return 'bg-warning/10 text-warning'
    return 'bg-success/10 text-success'
  }

  const getRiskLabel = (riskScore?: number) => {
    if (!riskScore) return 'Unknown'
    if (riskScore >= 70) return 'High'
    if (riskScore >= 40) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Button onClick={onCreateUser} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading === 'bulk'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('activate')}
                disabled={actionLoading === 'bulk'}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('deactivate')}
                disabled={actionLoading === 'bulk'}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-center justify-between">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-4">
        {/* Desktop Table Header */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 rounded-lg font-medium text-sm">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-border"
              />
            </div>
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role & Status</div>
            <div className="col-span-2">Portfolio</div>
            <div className="col-span-2">Risk & KYC</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden hover-lift">
                {/* Mobile Card */}
                <div className="lg:hidden p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-border mr-3"
                      />
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <Badge variant="secondary">{user.role}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={user.active ? "default" : "destructive"}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Portfolio</p>
                      <p className="text-sm font-medium">
                        {user.loan_count || 0} loans
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <Badge className={getRiskColor(user.risk_score)}>
                        {getRiskLabel(user.risk_score)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {user.pending_approval ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'approve')}
                          disabled={actionLoading === user.id}
                          className="flex-1"
                        >
                          {actionLoading === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUserAction(user.id, 'reject')}
                          disabled={actionLoading === user.id}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUserSelect?.(user)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={user.active ? "destructive" : "default"}
                          onClick={() => handleUserAction(user.id, user.active ? 'deactivate' : 'activate')}
                          disabled={actionLoading === user.id}
                          className="flex-1"
                        >
                          {user.active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Row */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-border"
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-primary-foreground font-semibold text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <Badge variant="secondary">{user.role}</Badge>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.pending_approval && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-sm">
                      <p className="font-medium">{user.loan_count || 0} loans</p>
                      <p className="text-muted-foreground">
                        Portfolio: {user.portfolio_value ? `₹${user.portfolio_value.toLocaleString()}` : '₹0'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <Badge className={getRiskColor(user.risk_score)}>
                        {getRiskLabel(user.risk_score)} Risk
                      </Badge>
                      <Badge variant={
                        user.kyc_status === 'verified' ? 'default' :
                        user.kyc_status === 'pending' ? 'warning' : 'destructive'
                      }>
                        KYC: {user.kyc_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      {user.pending_approval ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserAction(user.id, 'approve')}
                            disabled={actionLoading === user.id}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserAction(user.id, 'reject')}
                            disabled={actionLoading === user.id}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onUserSelect?.(user)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUserAction(user.id, user.active ? 'deactivate' : 'activate')}
                            disabled={actionLoading === user.id}
                            title={user.active ? 'Deactivate' : 'Activate'}
                          >
                            {user.active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-success" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {users.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {users.length} users
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">Page {pagination.page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}