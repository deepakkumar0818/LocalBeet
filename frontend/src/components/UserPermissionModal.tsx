import React, { useState } from 'react'
import { X, Save, RefreshCw, User, Shield, Key } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  module: string
}

interface UserPermissionModalProps {
  user: User | null
  permissions: Permission[]
  onClose: () => void
  onSave: (userId: string, permissions: string[]) => void
}

const UserPermissionModal: React.FC<UserPermissionModalProps> = ({
  user,
  permissions,
  onClose,
  onSave
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user?.permissions || []
  )

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId))
    }
  }

  const handleSelectAll = (module: string, checked: boolean) => {
    const modulePermissions = groupedPermissions[module].map(p => p.id)
    if (checked) {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissions])])
    } else {
      setSelectedPermissions(prev => prev.filter(p => !modulePermissions.includes(p)))
    }
  }

  const handleSave = () => {
    if (user) {
      onSave(user.id, selectedPermissions)
      onClose()
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Permissions
              </h2>
              <p className="text-sm text-gray-600">{user.name} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-sm text-gray-900">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Permissions by Module */}
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
              const allSelected = modulePermissions.every(p => selectedPermissions.includes(p.id))
              const someSelected = modulePermissions.some(p => selectedPermissions.includes(p.id))
              
              return (
                <div key={module} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected && !allSelected
                        }}
                        onChange={(e) => handleSelectAll(module, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{module}</span>
                        <span className="text-sm text-gray-500">
                          ({modulePermissions.filter(p => selectedPermissions.includes(p.id)).length}/{modulePermissions.length})
                        </span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modulePermissions.map((permission) => (
                        <label key={permission.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {permission.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {permission.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <Key className="h-4 w-4 inline mr-1" />
            {selectedPermissions.length} permissions selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPermissionModal
