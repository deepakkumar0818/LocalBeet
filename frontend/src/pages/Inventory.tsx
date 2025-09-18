import React, { useState } from 'react'
import { Search, Download, Eye, AlertTriangle, TrendingUp, TrendingDown, Package, BarChart3, RefreshCw } from 'lucide-react'
import { InventoryItem, StockMovement } from '../types'

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'movements' | 'reports'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')

  // Mock inventory data
  const [inventoryItems] = useState<InventoryItem[]>([
    {
      id: '1',
      materialId: 'RM-001',
      materialCode: 'RM-001',
      materialName: 'Steel Rod 12mm',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      currentStock: 150,
      reservedStock: 25,
      availableStock: 125,
      minimumStock: 50,
      maximumStock: 500,
      reorderPoint: 75,
      unitOfMeasure: 'KG',
      unitPrice: 45.50,
      totalValue: 6825.00,
      lastUpdated: new Date('2024-01-20'),
      status: 'In Stock',
      location: 'A-01-15',
      batchNumber: 'B001',
      supplier: 'Steel Corp',
      notes: 'High quality steel rods'
    },
    {
      id: '2',
      materialId: 'RM-002',
      materialCode: 'RM-002',
      materialName: 'Aluminum Sheet 2mm',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      currentStock: 25,
      reservedStock: 5,
      availableStock: 20,
      minimumStock: 30,
      maximumStock: 200,
      reorderPoint: 40,
      unitOfMeasure: 'SQM',
      unitPrice: 125.00,
      totalValue: 3125.00,
      lastUpdated: new Date('2024-01-19'),
      status: 'Low Stock',
      location: 'B-02-08',
      batchNumber: 'B002',
      supplier: 'Aluminum Ltd',
      notes: 'Premium grade aluminum'
    },
    {
      id: '3',
      materialId: 'RM-003',
      materialCode: 'RM-003',
      materialName: 'Copper Wire 10 AWG',
      warehouseId: 'WH-002',
      warehouseName: 'Secondary Warehouse',
      currentStock: 0,
      reservedStock: 0,
      availableStock: 0,
      minimumStock: 100,
      maximumStock: 1000,
      reorderPoint: 150,
      unitOfMeasure: 'M',
      unitPrice: 23.75,
      totalValue: 0.00,
      lastUpdated: new Date('2024-01-18'),
      status: 'Out of Stock',
      location: 'C-03-12',
      batchNumber: 'B003',
      supplier: 'Wire Co',
      notes: 'Electrical grade copper'
    },
    {
      id: '4',
      materialId: 'RM-004',
      materialCode: 'RM-004',
      materialName: 'Plastic Pellets HDPE',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      currentStock: 800,
      reservedStock: 50,
      availableStock: 750,
      minimumStock: 200,
      maximumStock: 1000,
      reorderPoint: 300,
      unitOfMeasure: 'KG',
      unitPrice: 12.50,
      totalValue: 10000.00,
      lastUpdated: new Date('2024-01-21'),
      status: 'Overstock',
      location: 'D-04-20',
      batchNumber: 'B004',
      supplier: 'Plastic Inc',
      notes: 'High density polyethylene'
    }
  ])

  // Mock stock movements data
  const [stockMovements] = useState<StockMovement[]>([
    {
      id: '1',
      materialId: 'RM-001',
      materialCode: 'RM-001',
      materialName: 'Steel Rod 12mm',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      movementType: 'In',
      movementReason: 'Purchase',
      quantity: 50,
      unitPrice: 45.50,
      totalValue: 2275.00,
      referenceNumber: 'PO-2024-001',
      referenceType: 'Purchase Order',
      movementDate: new Date('2024-01-20'),
      performedBy: 'John Smith',
      notes: 'Received from supplier',
      batchNumber: 'B001'
    },
    {
      id: '2',
      materialId: 'RM-002',
      materialCode: 'RM-002',
      materialName: 'Aluminum Sheet 2mm',
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      movementType: 'Out',
      movementReason: 'Production',
      quantity: 15,
      unitPrice: 125.00,
      totalValue: 1875.00,
      referenceNumber: 'JO-2024-001',
      referenceType: 'Production Order',
      movementDate: new Date('2024-01-19'),
      performedBy: 'Jane Doe',
      notes: 'Issued for production',
      batchNumber: 'B002'
    },
    {
      id: '3',
      materialId: 'RM-003',
      materialCode: 'RM-003',
      materialName: 'Copper Wire 10 AWG',
      warehouseId: 'WH-002',
      warehouseName: 'Secondary Warehouse',
      movementType: 'Out',
      movementReason: 'Sale',
      quantity: 200,
      unitPrice: 23.75,
      totalValue: 4750.00,
      referenceNumber: 'SO-2024-001',
      referenceType: 'Sales Order',
      movementDate: new Date('2024-01-18'),
      performedBy: 'Mike Johnson',
      notes: 'Sold to customer',
      batchNumber: 'B003'
    }
  ])

  const warehouses = [
    { id: 'WH-001', name: 'Main Warehouse' },
    { id: 'WH-002', name: 'Secondary Warehouse' },
    { id: 'WH-003', name: 'Cold Storage' },
    { id: 'WH-004', name: 'Hazardous Storage' }
  ]

  const statusOptions = ['In Stock', 'Low Stock', 'Out of Stock', 'Overstock']

  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = item.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || item.status === statusFilter
    const matchesWarehouse = !warehouseFilter || item.warehouseId === warehouseFilter
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = movement.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesWarehouse = !warehouseFilter || movement.warehouseId === warehouseFilter
    return matchesSearch && matchesWarehouse
  })

  // Calculate summary statistics
  const totalItems = inventoryItems.length
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventoryItems.filter(item => item.status === 'Low Stock').length
  const outOfStockItems = inventoryItems.filter(item => item.status === 'Out of Stock').length
  const overstockItems = inventoryItems.filter(item => item.status === 'Overstock').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100'
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100'
      case 'Out of Stock': return 'text-red-600 bg-red-100'
      case 'Overstock': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'In': return 'text-green-600 bg-green-100'
      case 'Out': return 'text-red-600 bg-red-100'
      case 'Transfer': return 'text-blue-600 bg-blue-100'
      case 'Adjustment': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Monitor stock levels, movements, and generate reports</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="btn-primary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'stock', name: 'Stock Levels', icon: Package },
              { id: 'movements', name: 'Stock Movements', icon: TrendingUp },
              { id: 'reports', name: 'Reports', icon: Download }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Search materials, warehouses, or reference numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                className="input-field"
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
              >
                <option value="">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Status Chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Status Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Stock</span>
                      <span className="text-sm font-medium">{inventoryItems.filter(item => item.status === 'In Stock').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Low Stock</span>
                      <span className="text-sm font-medium">{lowStockItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Out of Stock</span>
                      <span className="text-sm font-medium">{outOfStockItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overstock</span>
                      <span className="text-sm font-medium">{overstockItems}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Movements */}
                <div className="card p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Stock Movements</h3>
                  <div className="space-y-3">
                    {stockMovements.slice(0, 5).map(movement => (
                      <div key={movement.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{movement.materialName}</p>
                          <p className="text-xs text-gray-500">{movement.movementDate.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeColor(movement.movementType)}`}>
                            {movement.movementType} {movement.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.materialName}</div>
                          <div className="text-sm text-gray-500">{item.materialCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.warehouseName}</div>
                        <div className="text-sm text-gray-500">{item.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.currentStock} {item.unitOfMeasure}</div>
                        <div className="text-sm text-gray-500">Reserved: {item.reservedStock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.availableStock} {item.unitOfMeasure}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.minimumStock}/{item.maximumStock}</div>
                        <div className="text-sm text-gray-500">Reorder: {item.reorderPoint}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${item.totalValue.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">@ ${item.unitPrice}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'movements' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovements.map(movement => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.movementDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{movement.materialName}</div>
                          <div className="text-sm text-gray-500">{movement.materialCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.warehouseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeColor(movement.movementType)}`}>
                          {movement.movementType}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{movement.movementReason}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${movement.totalValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{movement.referenceNumber}</div>
                        <div className="text-xs text-gray-500">{movement.referenceType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.performedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Stock Summary</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Generate comprehensive stock level report</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Stock Movements</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Track all stock movements for a period</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Identify items below reorder point</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Value Report</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Calculate total inventory value</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <BarChart3 className="h-8 w-8 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">ABC Analysis</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Classify items by value and usage</p>
                  <button className="btn-primary w-full">Generate Report</button>
                </div>

                <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    <Download className="h-8 w-8 text-gray-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">Custom Report</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Create custom inventory reports</p>
                  <button className="btn-primary w-full">Create Report</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
