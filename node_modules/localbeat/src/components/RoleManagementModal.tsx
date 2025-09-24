import React, { useState } from 'react'
import { X, Save, Shield, Plus, Trash2 } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  module: string
}

interface RoleManagementModalProps {
  role: Role | null
  permissions: Permission[]
  onClose: () => void
  onSave: (role: Omit<Role, 'id' | 'userCount'>) => void
  onDelete?: (roleId: string) => void
}

const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  role,
  permissions,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  })

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permissionId)
      }))
    }
  }

  const handleSelectAll = (module: string, checked: boolean) => {
    const modulePermissions = groupedPermissions[module].map(p => p.id)
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissions])]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !modulePermissions.includes(p))
      }))
    }
  }

  const handleSave = () => {
    if (formData.name.trim() && formData.description.trim()) {
      onSave(formData)
      onClose()
    }
  }

  const handleDelete = () => {
    if (role && onDelete) {
      onDelete(role.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {role ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-sm text-gray-600">
                {role ? 'Modify role permissions and settings' : 'Define a new role with specific permissions'}
              </p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Role Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Count
                </label>
                <input
                  type="text"
                  value={role?.userCount || 0}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter role description"
              />
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                  const allSelected = modulePermissions.every(p => formData.permissions.includes(p.id))
                  const someSelected = modulePermissions.some(p => formData.permissions.includes(p.id))
                  
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
                          <span className="font-medium text-gray-900">{module}</span>
                          <span className="text-sm text-gray-500">
                            ({modulePermissions.filter(p => formData.permissions.includes(p.id)).length}/{modulePermissions.length})
                          </span>
                        </label>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {modulePermissions.map((permission) => (
                            <label key={permission.id} className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {formData.permissions.length} permissions selected
            </div>
            {role && onDelete && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Role</span>
              </button>
            )}
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
              {role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleManagementModal
