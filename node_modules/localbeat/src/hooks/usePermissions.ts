import { useState, useEffect } from 'react'


interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
  permissions: string[]
}

export const usePermissions = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    // In a real app, this would come from authentication context or API
    // For now, we'll simulate a logged-in user
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2024-01-15 10:30',
      permissions: ['all'] // Admin has all permissions
    }
    
    setCurrentUser(mockUser)
    setPermissions(mockUser.permissions)
  }, [])

  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false
    
    // Admin has all permissions
    if (permissions.includes('all')) return true
    
    // Check specific permission
    return permissions.includes(permissionId)
  }

  const hasAnyPermission = (permissionIds: string[]): boolean => {
    if (!currentUser) return false
    
    // Admin has all permissions
    if (permissions.includes('all')) return true
    
    // Check if user has any of the specified permissions
    return permissionIds.some(permissionId => permissions.includes(permissionId))
  }

  const hasAllPermissions = (permissionIds: string[]): boolean => {
    if (!currentUser) return false
    
    // Admin has all permissions
    if (permissions.includes('all')) return true
    
    // Check if user has all of the specified permissions
    return permissionIds.every(permissionId => permissions.includes(permissionId))
  }

  const canAccessModule = (module: string): boolean => {
    if (!currentUser) return false
    
    // Admin can access everything
    if (permissions.includes('all')) return true
    
    // Check for module-specific permissions
    const modulePermissions = [
      'dashboard.view',
      'inventory.view',
      'rawmaterials.view',
      'centralkitchen.view',
      'outlets.view',
      'sales.view',
      'reports.view',
      'users.view',
      'settings.view'
    ]
    
    return modulePermissions.some(permission => 
      permissions.includes(permission) && 
      permission.includes(module.toLowerCase())
    )
  }

  const getAvailablePermissions = (): string[] => {
    return permissions
  }

  const isAdmin = (): boolean => {
    return currentUser?.role === 'Admin' || permissions.includes('all')
  }

  const isManager = (): boolean => {
    return currentUser?.role === 'Manager'
  }

  const isStaff = (): boolean => {
    return currentUser?.role === 'Staff'
  }

  return {
    currentUser,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    getAvailablePermissions,
    isAdmin,
    isManager,
    isStaff
  }
}

export default usePermissions
