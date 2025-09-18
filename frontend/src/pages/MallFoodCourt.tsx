import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Truck, Users, Clock, RefreshCw, ShoppingBag, Download, Upload } from 'lucide-react'
import { apiService } from '../services/api'

interface OutletInventoryItem {
  id: string
  outletId: string
  outletCode: string
  outletName: string
  materialId: string
  materialCode: string
  materialName: string
  category: string
  unitOfMeasure: string
  unitPrice: number
  currentStock: number
  reservedStock: number
  availableStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  totalValue: number
  location: string
  batchNumber: string
  supplier: string
  lastUpdated: string
  status: string
  notes: string
  isActive: boolean
}

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

const MallFoodCourt: React.FC = () => {
  const navigate = useNavigate()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('materialName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadOutletData()
  }, [])

  // Reload inventory when filters change
  useEffect(() => {
    if (outlet && !loading) {
      loadInventory()
    }
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  const loadOutletData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get Mall Food Court outlet
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const mallFoodCourt = outletsResponse.data.find(outlet => outlet.outletCode === 'OUT-003')
        if (mallFoodCourt) {
          setOutlet(mallFoodCourt)
          await loadInventory(mallFoodCourt.id)
        } else {
          setError('Mall Food Court not found')
        }
      } else {
        setError('Failed to load outlet data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlet data')
      console.error('Error loading outlet data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async (outletId?: string) => {
    if (!outletId && !outlet) return
    
    try {
      const response = await apiService.getOutletInventoryByOutlet(outletId || outlet!.id, {
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy,
        sortOrder
      })

      if (response.success) {
        console.log('Loaded Mall Food Court Inventory:', response.data)
        setInventoryItems(response.data)
      } else {
        setError('Failed to load inventory')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      console.error('Error loading inventory:', err)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterStatus('')
    setSortBy('materialName')
    setSortOrder('asc')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800'
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock': return 'bg-red-100 text-red-800'
      case 'Overstock': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <Package className="h-4 w-4" />
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />
      case 'Out of Stock': return <TrendingDown className="h-4 w-4" />
      case 'Overstock': return <TrendingUp className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  // Calculate summary statistics
  const totalItems = inventoryItems.length
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventoryItems.filter(item => item.status === 'Low Stock').length
  const outOfStockItems = inventoryItems.filter(item => item.status === 'Out of Stock').length
  const overstockItems = inventoryItems.filter(item => item.status === 'Overstock').length

  // Get unique categories
  const categories = [...new Set(inventoryItems.map(item => item.category))]

  const handleExport = () => {
    if (inventoryItems.length === 0) {
      alert('No inventory to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'Item Code',
        'Item Name',
        'Category',
        'Unit of Measure',
        'Unit Price',
        'Current Stock',
        'Available Stock',
        'Minimum Stock',
        'Maximum Stock',
        'Total Value',
        'Status',
        'Supplier',
        'Last Updated',
        'Notes'
      ].join(','),
      // Data rows
      ...inventoryItems.map(item => [
        item.materialCode,
        item.materialName,
        item.category,
        item.unitOfMeasure,
        item.unitPrice.toFixed(2),
        item.currentStock.toString(),
        item.availableStock.toString(),
        item.minimumStock.toString(),
        item.maximumStock.toString(),
        item.totalValue.toFixed(2),
        item.status,
        item.supplier,
        new Date(item.lastUpdated).toLocaleDateString(),
        item.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mall-food-court-inventory-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    try {
      setImporting(true)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      // const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          const materialData = {
            materialCode: values[0],
            materialName: values[1],
            category: values[2],
            unitOfMeasure: values[3],
            unitPrice: parseFloat(values[4]) || 0,
            currentStock: parseInt(values[5]) || 0,
            minimumStock: parseInt(values[7]) || 0,
            maximumStock: parseInt(values[8]) || 0,
            supplier: values[11] || '',
            notes: values[13] || ''
          }
          
          // Add to local state
          const newItem: OutletInventoryItem = {
            id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            outletId: outlet?.id || '',
            outletCode: outlet?.outletCode || '',
            outletName: outlet?.outletName || '',
            materialId: materialData.materialCode,
            materialCode: materialData.materialCode,
            materialName: materialData.materialName,
            category: materialData.category,
            unitOfMeasure: materialData.unitOfMeasure,
            unitPrice: materialData.unitPrice,
            currentStock: materialData.currentStock,
            reservedStock: 0,
            availableStock: materialData.currentStock,
            minimumStock: materialData.minimumStock,
            maximumStock: materialData.maximumStock,
            reorderPoint: Math.ceil(materialData.minimumStock * 1.5),
            totalValue: materialData.currentStock * materialData.unitPrice,
            location: 'Main Storage',
            batchNumber: `BATCH-${Date.now()}`,
            supplier: materialData.supplier,
            lastUpdated: new Date().toISOString(),
            status: 'In Stock',
            notes: materialData.notes,
            isActive: true
          }
          
          setInventoryItems(prev => [...prev, newItem])
          successCount++
        } catch (err) {
          errorCount++
        }
      }

      alert(`Import completed!\n\nSuccessfully imported: ${successCount} items\nErrors: ${errorCount}`)
    } catch (err) {
      alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Item Code', 'Item Name', 'Category', 'Unit of Measure', 'Unit Price', 'Current Stock', 'Available Stock', 'Minimum Stock', 'Maximum Stock', 'Total Value', 'Status', 'Supplier', 'Last Updated', 'Notes'],
      ['RM-001', 'Burger Buns', 'Bakery', 'PIECE', '0.50', '100', '100', '20', '200', '50.00', 'In Stock', 'Fresh Bakery Ltd', '2024-01-15', 'Fresh daily'],
      ['RM-002', 'French Fries', 'Frozen', 'KG', '2.50', '50', '50', '10', '100', '125.00', 'In Stock', 'Frozen Foods Co', '2024-01-15', 'Premium quality']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'mall-food-court-sample-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Mall Food Court...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadOutletData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <ShoppingBag className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mall Food Court</h1>
            <p className="text-gray-600">Fast-service food court outlet - {outlet?.outletName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadOutletData}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/transfer-orders/add')}
            className="btn-primary flex items-center"
          >
            <Truck className="h-4 w-4 mr-2" />
            Request Transfer
          </button>
        </div>
      </div>

      {/* Food Court Info Card */}
      <div className="card p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingBag className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{outlet?.outletName}</h2>
              <p className="text-gray-600">High-Traffic Food Court Location</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  40 Seating Capacity
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  10:00 AM - 10:00 PM
                </span>
                <span className="flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Quick Service & Takeaway
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-600">{outlet?.outletCode}</div>
            <div className="text-sm text-gray-500">Food Court</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">{totalValue.toFixed(2)} KWD</p>
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
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overstock</p>
              <p className="text-2xl font-semibold text-gray-900">{overstockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials by name, code, or supplier..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center"
                title="Clear all filters"
              >
                Clear Filters
              </button>
              <button 
                onClick={handleExport}
                className="btn-secondary flex items-center"
                title="Export inventory to CSV"
                disabled={inventoryItems.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={handleImport}
                className="btn-secondary flex items-center"
                title="Import inventory from CSV"
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button 
                onClick={downloadSampleCSV}
                className="btn-secondary flex items-center"
                title="Download sample CSV template"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="input-field"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Overstock">Overstock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-1">
                <select
                  className="input-field flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="materialName">Material Name</option>
                  <option value="currentStock">Current Stock</option>
                  <option value="totalValue">Total Value</option>
                  <option value="status">Status</option>
                  <option value="lastUpdated">Last Updated</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn-secondary px-3"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {inventoryItems.length} inventory items
              {(searchTerm || filterCategory || filterStatus) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {(searchTerm || filterCategory || filterStatus) && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Material</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Available</th>
                <th className="table-header">Min/Max</th>
                <th className="table-header">Status</th>
                <th className="table-header">Value</th>
                <th className="table-header">Location</th>
                <th className="table-header">Last Updated</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900 font-medium">{item.materialName}</div>
                      <div className="text-gray-500 text-sm">{item.materialCode}</div>
                      <div className="text-gray-500 text-sm">{item.category}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 font-medium">{item.currentStock}</div>
                    <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 font-medium">{item.availableStock}</div>
                    <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 text-sm">{item.minimumStock}/{item.maximumStock}</div>
                    <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status}</span>
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 font-medium">{item.totalValue.toFixed(2)} KWD</div>
                    <div className="text-gray-500 text-sm">{item.unitPrice.toFixed(2)} per {item.unitOfMeasure}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 text-sm">{item.location}</div>
                    <div className="text-gray-500 text-sm">{item.batchNumber}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 text-sm">{new Date(item.lastUpdated).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-sm">{new Date(item.lastUpdated).toLocaleTimeString()}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/outlet-inventory/edit/${item.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default MallFoodCourt
