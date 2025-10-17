import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Users, 
  Shield, 
  Key, 
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import UserPermissionModal from '../components/UserPermissionModal'
import RoleManagementModal from '../components/RoleManagementModal'
import { apiService } from '../services/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastLogin: string
  permissions: string[]
}

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

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Staff', status: 'Active' as 'Active' | 'Inactive' })

  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      description: 'Full system access',
      permissions: ['all'],
      userCount: 1
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Management level access',
      permissions: ['inventory.view', 'inventory.edit', 'reports.view', 'users.view'],
      userCount: 1
    },
    {
      id: '3',
      name: 'Staff',
      description: 'Basic operational access',
      permissions: ['inventory.view', 'sales.view'],
      userCount: 1
    }
  ])

  const [permissions] = useState<Permission[]>([
    // Dashboard
    { id: 'dashboard.view', name: 'View Dashboard', description: 'Access to main dashboard', category: 'Dashboard', module: 'Dashboard' },
    
    // Inventory Management
    { id: 'inventory.view', name: 'View Inventory', description: 'View inventory items', category: 'Inventory', module: 'Inventory Management' },
    { id: 'inventory.edit', name: 'Edit Inventory', description: 'Modify inventory items', category: 'Inventory', module: 'Inventory Management' },
    { id: 'inventory.add', name: 'Add Inventory', description: 'Add new inventory items', category: 'Inventory', module: 'Inventory Management' },
    { id: 'inventory.delete', name: 'Delete Inventory', description: 'Delete inventory items', category: 'Inventory', module: 'Inventory Management' },
    
    // Raw Materials
    { id: 'rawmaterials.view', name: 'View Raw Materials', description: 'View raw materials', category: 'Raw Materials', module: 'Raw Materials' },
    { id: 'rawmaterials.edit', name: 'Edit Raw Materials', description: 'Edit raw materials', category: 'Raw Materials', module: 'Raw Materials' },
    { id: 'rawmaterials.add', name: 'Add Raw Materials', description: 'Add new raw materials', category: 'Raw Materials', module: 'Raw Materials' },
    
    // Central Kitchen
    { id: 'centralkitchen.view', name: 'View Central Kitchen', description: 'Access central kitchen', category: 'Central Kitchen', module: 'Central Kitchen' },
    { id: 'centralkitchen.edit', name: 'Edit Central Kitchen', description: 'Modify central kitchen data', category: 'Central Kitchen', module: 'Central Kitchen' },
    { id: 'centralkitchen.transfer', name: 'Create Transfers', description: 'Create transfer orders', category: 'Central Kitchen', module: 'Central Kitchen' },
    
    // Outlets
    { id: 'outlets.view', name: 'View Outlets', description: 'View outlet information', category: 'Outlets', module: 'Outlet Management' },
    { id: 'outlets.edit', name: 'Edit Outlets', description: 'Modify outlet data', category: 'Outlets', module: 'Outlet Management' },
    { id: 'outlets.kuwait', name: 'Kuwait City Access', description: 'Access Kuwait City outlet', category: 'Outlets', module: 'Outlet Management' },
    { id: 'outlets.mall360', name: '360 Mall Access', description: 'Access 360 Mall outlets', category: 'Outlets', module: 'Outlet Management' },
    { id: 'outlets.taiba', name: 'Taiba Hospital Access', description: 'Access Taiba Hospital outlet', category: 'Outlets', module: 'Outlet Management' },
    
    // Sales
    { id: 'sales.view', name: 'View Sales', description: 'View sales data', category: 'Sales', module: 'Sales Management' },
    { id: 'sales.edit', name: 'Edit Sales', description: 'Modify sales data', category: 'Sales', module: 'Sales Management' },
    { id: 'sales.create', name: 'Create Sales', description: 'Create new sales orders', category: 'Sales', module: 'Sales Management' },
    
    // Reports
    { id: 'reports.view', name: 'View Reports', description: 'Access reports', category: 'Reports', module: 'Reporting' },
    { id: 'reports.export', name: 'Export Reports', description: 'Export report data', category: 'Reports', module: 'Reporting' },
    
    // User Management
    { id: 'users.view', name: 'View Users', description: 'View user information', category: 'Users', module: 'User Management' },
    { id: 'users.edit', name: 'Edit Users', description: 'Modify user data', category: 'Users', module: 'User Management' },
    { id: 'users.add', name: 'Add Users', description: 'Add new users', category: 'Users', module: 'User Management' },
    { id: 'users.delete', name: 'Delete Users', description: 'Delete users', category: 'Users', module: 'User Management' },
    
    // Settings
    { id: 'settings.view', name: 'View Settings', description: 'Access system settings', category: 'Settings', module: 'System Settings' },
    { id: 'settings.edit', name: 'Edit Settings', description: 'Modify system settings', category: 'Settings', module: 'System Settings' }
  ])

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showUserPermissionModal, setShowUserPermissionModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleUserPermissionChange = (userId: string, permissionId: string, checked: boolean) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        if (checked) {
          return { ...user, permissions: [...user.permissions, permissionId] }
        } else {
          return { ...user, permissions: user.permissions.filter(p => p !== permissionId) }
        }
      }
      return user
    }))
  }


  const handleUserPermissionSave = (userId: string, newPermissions: string[]) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, permissions: newPermissions }
        : user
    ))
  }

  const handleRoleSave = (roleData: Omit<Role, 'id' | 'userCount'>) => {
    if (editingRole) {
      // Update existing role
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id 
          ? { ...role, ...roleData }
          : role
      ))
    } else {
      // Create new role
      const newRole: Role = {
        id: Date.now().toString(),
        ...roleData,
        userCount: 0
      }
      setRoles(prev => [...prev, newRole])
    }
  }

  const handleRoleDelete = (roleId: string) => {
    setRoles(prev => prev.filter(role => role.id !== roleId))
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowUserPermissionModal(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setShowRoleModal(true)
  }

  const handleAddRole = () => {
    setEditingRole(null)
    setShowRoleModal(true)
  }

  const tabs = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield },
    { id: 'permissions', name: 'Permissions', icon: Key }
  ]

  React.useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getUsers()
        if (res?.success) {
          setUsers(res.data.map((u: any) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: (u.status || 'Active').toLowerCase(),
            lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-',
            permissions: []
          })))
        }
      } catch {}
    })()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings & Permissions</h1>
            <p className="text-gray-600">Manage user access and system permissions</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn-primary flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-3 font-medium text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Users Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Roles Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Role Management</h2>
            <button
              onClick={handleAddRole}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{role.permissions.length} permissions</span>
                  <span>{role.userCount} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Permission Management</h2>
          
          {/* Permissions by Module */}
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <div key={module} className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{module}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modulePermissions.map((permission) => (
                  <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {permission.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{permission.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Permission Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add User</h2>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="input-field" placeholder="Full name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" placeholder="you@company.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowAddUser(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={async () => {
                  const res = await apiService.createUser({ name: newUser.name, email: newUser.email, password: newUser.password, role: 'Staff', status: 'Active' })
                  if (res?.success) {
                    setShowAddUser(false)
                    setNewUser({ name: '', email: '', password: '', role: 'Staff', status: 'Active' })
                    const list = await apiService.getUsers()
                    if (list?.success) {
                      setUsers(list.data.map((u: any) => ({
                        id: u._id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        status: (u.status || 'Active').toLowerCase() as any,
                        lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '-',
                        permissions: []
                      })))
                    }
                  }
                }}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Permissions - {editingUser.name}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{module}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modulePermissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={editingUser.permissions.includes(permission.id)}
                          onChange={(e) => handleUserPermissionChange(editingUser.id, permission.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Permission Modal */}
      {showUserPermissionModal && editingUser && (
        <UserPermissionModal
          user={editingUser}
          permissions={permissions}
          onClose={() => {
            setShowUserPermissionModal(false)
            setEditingUser(null)
          }}
          onSave={handleUserPermissionSave}
        />
      )}

      {/* Role Management Modal */}
      {showRoleModal && (
        <RoleManagementModal
          role={editingRole}
          permissions={permissions}
          onClose={() => {
            setShowRoleModal(false)
            setEditingRole(null)
          }}
          onSave={handleRoleSave}
          onDelete={handleRoleDelete}
        />
      )}
    </div>
  )
}

export default Settings
