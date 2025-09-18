import React from 'react'
import { 
  Package, 
  ClipboardList, 
  ShoppingCart, 
  Receipt, 
  Warehouse, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    { name: 'Total Recipe Orders', value: '156', icon: ClipboardList, color: 'bg-blue-500', change: '+12%' },
    { name: 'Pending Orders', value: '23', icon: AlertTriangle, color: 'bg-yellow-500', change: '-5%' },
    { name: 'Completed Orders', value: '133', icon: CheckCircle, color: 'bg-green-500', change: '+18%' },
    { name: 'Ingredients', value: '1,247', icon: Package, color: 'bg-purple-500', change: '+8%' },
    { name: 'Purchase Orders', value: '89', icon: ShoppingCart, color: 'bg-indigo-500', change: '+15%' },
    { name: 'Warehouses', value: '12', icon: Warehouse, color: 'bg-pink-500', change: '+2%' },
  ]

  const orderTrendData = [
    { month: 'Jan', orders: 45, completed: 38 },
    { month: 'Feb', orders: 52, completed: 48 },
    { month: 'Mar', orders: 48, completed: 42 },
    { month: 'Apr', orders: 61, completed: 55 },
    { month: 'May', orders: 55, completed: 50 },
    { month: 'Jun', orders: 67, completed: 62 },
  ]

  const materialCategoryData = [
    { name: 'Fresh Produce', value: 35, color: '#3B82F6' },
    { name: 'Dairy', value: 25, color: '#10B981' },
    { name: 'Pantry Items', value: 20, color: '#F59E0B' },
    { name: 'Supplements', value: 15, color: '#EF4444' },
    { name: 'Others', value: 5, color: '#8B5CF6' },
  ]

  const recentActivities = [
    { id: 1, type: 'Recipe Order', description: 'New recipe order #JO-2024-001 created', time: '2 hours ago', status: 'success' },
    { id: 2, type: 'Purchase Order', description: 'Purchase order #PO-2024-045 approved', time: '4 hours ago', status: 'success' },
    { id: 3, type: 'Ingredient', description: 'Low stock alert for Fresh Bananas', time: '6 hours ago', status: 'warning' },
    { id: 4, type: 'GRN', description: 'Good receipt note #GRN-2024-023 received', time: '8 hours ago', status: 'success' },
    { id: 5, type: 'Store Issue', description: 'Store issue voucher #SIV-2024-012 issued', time: '10 hours ago', status: 'success' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to localbeet ERP System</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="ml-2 text-sm font-medium text-green-600">{stat.change}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Order Trends Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orderTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Total Orders" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ingredient Categories Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ingredient Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={materialCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {materialCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                activity.status === 'success' ? 'bg-green-400' : 'bg-yellow-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ClipboardList className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-sm font-medium">Create Recipe Order</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ShoppingCart className="h-5 w-5 text-indigo-500 mr-3" />
            <span className="text-sm font-medium">Create Purchase Order</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="h-5 w-5 text-purple-500 mr-3" />
            <span className="text-sm font-medium">Add Ingredient</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Receipt className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm font-medium">Create GRN</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
