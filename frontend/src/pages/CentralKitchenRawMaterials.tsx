import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, TrendingDown, AlertTriangle, Store, RefreshCw, Download, Upload, Plus } from 'lucide-react'
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

const CentralKitchenRawMaterials: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('materialName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadCentralKitchenData()
  }, [])

  // Reload inventory when filters change
  useEffect(() => {
    if (outlet && !loading) {
      loadInventory()
    }
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  const loadCentralKitchenData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Set up Central Kitchen outlet data
      const centralKitchen = {
        id: 'central-kitchen-001',
        outletCode: 'CK001',
        outletName: 'Central Kitchen',
        outletType: 'Central Kitchen',
        isCentralKitchen: true
      }
      
      setOutlet(centralKitchen)
      await loadInventory(centralKitchen.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load central kitchen data')
      console.error('Error loading central kitchen data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async (outletId?: string) => {
    const currentOutletId = outletId || outlet?.id || 'central-kitchen-001'
    
    try {
      console.log('Loading raw materials inventory for Central Kitchen:', currentOutletId)
      
      // For Central Kitchen, we'll use sample data since it's a central hub
      // In a real application, this would load from a central kitchen inventory API
      const sampleInventoryItems: OutletInventoryItem[] = [
        {
          id: 'ck-rm-001',
          outletId: 'central-kitchen-001',
          outletCode: 'CK001',
          outletName: 'Central Kitchen',
          materialId: '10001',
          materialCode: '10001',
          materialName: 'Bhujia',
          category: 'Bakery',
          unitOfMeasure: 'kg',
          unitPrice: 0,
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderPoint: 0,
          totalValue: 0,
          location: 'Main Storage',
          batchNumber: '',
          supplier: '',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: '',
          isActive: true
        },
        {
          id: 'ck-rm-002',
          outletId: 'central-kitchen-001',
          outletCode: 'CK001',
          outletName: 'Central Kitchen',
          materialId: '10002',
          materialCode: '10002',
          materialName: 'Bran Flakes',
          category: 'Bakery',
          unitOfMeasure: 'kg',
          unitPrice: 0,
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderPoint: 0,
          totalValue: 0,
          location: 'Main Storage',
          batchNumber: '',
          supplier: '',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: '',
          isActive: true
        },
        {
          id: 'ck-rm-003',
          outletId: 'central-kitchen-001',
          outletCode: 'CK001',
          outletName: 'Central Kitchen',
          materialId: '10003',
          materialCode: '10003',
          materialName: 'Bread Improver',
          category: 'Bakery',
          unitOfMeasure: 'kg',
          unitPrice: 0,
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderPoint: 0,
          totalValue: 0,
          location: 'Main Storage',
          batchNumber: '',
          supplier: '',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: '',
          isActive: true
        },
        {
          id: 'ck-rm-004',
          outletId: 'central-kitchen-001',
          outletCode: 'CK001',
          outletName: 'Central Kitchen',
          materialId: '10004',
          materialCode: '10004',
          materialName: 'Caramel Syrup',
          category: 'Bakery',
          unitOfMeasure: 'kg',
          unitPrice: 0,
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderPoint: 0,
          totalValue: 0,
          location: 'Main Storage',
          batchNumber: '',
          supplier: '',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: '',
          isActive: true
        },
        {
          id: 'ck-rm-005',
          outletId: 'central-kitchen-001',
          outletCode: 'CK001',
          outletName: 'Central Kitchen',
          materialId: '10005',
          materialCode: '10005',
          materialName: 'Cocoa Powder',
          category: 'Bakery',
          unitOfMeasure: 'kg',
          unitPrice: 0,
          currentStock: 0,
          reservedStock: 0,
          availableStock: 0,
          minimumStock: 0,
          maximumStock: 0,
          reorderPoint: 0,
          totalValue: 0,
          location: 'Main Storage',
          batchNumber: '',
          supplier: '',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: '',
          isActive: true
        }
      ]

      console.log('Loaded Central Kitchen Raw Materials Inventory:', sampleInventoryItems)
      setInventoryItems(sampleInventoryItems)
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

  const handleExport = () => {
    if (inventoryItems.length === 0) {
      alert('No raw materials to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'SKU',
        'Item Name',
        'Parent Category',
        'SubCategory Name',
        'Unit',
        'Unit Name',
        'Default Purchase Unit Name'
      ].join(','),
      // Data rows
      ...inventoryItems.map(item => [
        item.materialCode,
        item.materialName,
        'Raw Materials',
        item.category,
        item.unitOfMeasure,
        item.unitOfMeasure,
        item.unitOfMeasure
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `central-kitchen-raw-materials-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['SKU', 'Item Name', 'Parent Category', 'SubCategory Name', 'Unit', 'Unit Name', 'Default Purchase Unit Name'],
      ['10001', 'Bhujia', 'Raw Materials', 'Bakery', 'kg', 'kg', 'kg'],
      ['10002', 'Bran Flakes', 'Raw Materials', 'Bakery', 'kg', 'kg', 'kg'],
      ['10003', 'Bread Improver', 'Raw Materials', 'Bakery', 'kg', 'kg', 'kg'],
      ['10004', 'Caramel Syrup', 'Raw Materials', 'Bakery', 'kg', 'kg', 'kg'],
      ['10005', 'Cocoa Powder', 'Raw Materials', 'Bakery', 'kg', 'kg', 'kg']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'central-kitchen-raw-materials-sample.csv')
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
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      const dataRows = lines.slice(1)
      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          
          const materialData = {
            materialCode: values[0],
            materialName: values[1],
            category: values[3], // SubCategory Name
            unitOfMeasure: values[4], // Unit
            unitPrice: 0,
            currentStock: 0,
            minimumStock: 0,
            maximumStock: 0,
            supplier: '',
            notes: ''
          }
          
          // Add to local state
          const newItem: OutletInventoryItem = {
            id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            outletId: outlet?.id || 'central-kitchen-001',
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Raw Materials...</p>
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
            onClick={loadCentralKitchenData}
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raw Material Inventory</h1>
            <p className="text-gray-600">Central Kitchen - {outlet?.outletName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadCentralKitchenData}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/central-kitchen/add-item')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Raw Material
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
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search raw materials by name, code, or supplier..."
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
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
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
             Showing {inventoryItems.length} raw material items
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

      {/* Raw Materials Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Raw Materials Inventory</h3>
              <p className="text-sm text-gray-600">Complete inventory list with all fields</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubCategory Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Purchase Unit Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.materialCode}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.materialName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    Raw Materials
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unitOfMeasure}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unitOfMeasure}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unitOfMeasure}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/outlet-inventory/edit/${item.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default CentralKitchenRawMaterials
