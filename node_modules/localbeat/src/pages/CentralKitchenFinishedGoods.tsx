import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, TrendingDown, AlertTriangle, Store, RefreshCw, Download, Upload, Plus } from 'lucide-react'
import { apiService } from '../services/api'

interface FinishedGoodInventoryItem {
  id: string
  outletId: string
  outletCode: string
  outletName: string
  productId: string
  productCode: string
  productName: string
  category: string
  unitOfMeasure: string
  unitPrice: number
  costPrice: number
  currentStock: number
  reservedStock: number
  availableStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  totalValue: number
  productionDate: string
  expiryDate: string
  batchNumber: string
  storageLocation: string
  storageTemperature: string
  qualityStatus: string
  qualityNotes: string
  status: string
  transferSource: string
  lastUpdated: string
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

const CentralKitchenFinishedGoods: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [finishedGoodInventoryItems, setFinishedGoodInventoryItems] = useState<FinishedGoodInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('productName')
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
      
      // Get central kitchen outlet
      const outletsResponse = await apiService.getCentralKitchens()
      if (outletsResponse.success && outletsResponse.data.length > 0) {
        const centralKitchen = outletsResponse.data[0]
        setOutlet(centralKitchen)
        await loadInventory(centralKitchen.id)
      } else {
        setError('Central Kitchen not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load central kitchen data')
      console.error('Error loading central kitchen data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async (outletId?: string) => {
    const currentOutletId = outletId || outlet?.id
    if (!currentOutletId) {
      console.log('No outlet ID available for loading inventory')
      return
    }
    
    try {
      console.log('Loading finished goods inventory for outlet:', currentOutletId)
      // Load finished goods inventory
      const finishedGoodsResponse = await apiService.getFinishedGoodInventoryByOutlet(currentOutletId, {
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'productName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded Central Kitchen Finished Goods Inventory:', finishedGoodsResponse.data)
        setFinishedGoodInventoryItems(finishedGoodsResponse.data)
      } else {
        console.error('Failed to load finished goods inventory:', 'API Error')
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
    setSortBy('productName')
    setSortOrder('asc')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800'
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock': return 'bg-red-100 text-red-800'
      case 'Overstock': return 'bg-blue-100 text-blue-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <Package className="h-4 w-4" />
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />
      case 'Out of Stock': return <TrendingDown className="h-4 w-4" />
      case 'Overstock': return <TrendingUp className="h-4 w-4" />
      case 'Expired': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const handleExport = () => {
    if (finishedGoodInventoryItems.length === 0) {
      alert('No finished goods to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'Product Code',
        'Product Name',
        'Category',
        'Unit of Measure',
        'Unit Price',
        'Cost Price',
        'Current Stock',
        'Available Stock',
        'Minimum Stock',
        'Maximum Stock',
        'Total Value',
        'Status',
        'Production Date',
        'Expiry Date',
        'Batch Number',
        'Storage Location',
        'Storage Temperature',
        'Quality Status',
        'Last Updated',
        'Notes'
      ].join(','),
      // Data rows
      ...finishedGoodInventoryItems.map(item => [
        item.productCode,
        item.productName,
        item.category,
        item.unitOfMeasure,
        item.unitPrice.toFixed(2),
        item.costPrice.toFixed(2),
        item.currentStock.toString(),
        item.availableStock.toString(),
        item.minimumStock.toString(),
        item.maximumStock.toString(),
        item.totalValue.toFixed(2),
        item.status,
        new Date(item.productionDate).toLocaleDateString(),
        new Date(item.expiryDate).toLocaleDateString(),
        item.batchNumber,
        item.storageLocation,
        item.storageTemperature,
        item.qualityStatus,
        new Date(item.lastUpdated).toLocaleDateString(),
        item.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `central-kitchen-finished-goods-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Product Code', 'Product Name', 'Category', 'Unit of Measure', 'Unit Price', 'Cost Price', 'Current Stock', 'Available Stock', 'Minimum Stock', 'Maximum Stock', 'Total Value', 'Status', 'Production Date', 'Expiry Date', 'Batch Number', 'Storage Location', 'Storage Temperature', 'Quality Status', 'Last Updated', 'Notes'],
      ['FG001', 'Espresso', 'Beverages', 'pcs', '3.50', '1.75', '150', '135', '30', '300', '525.00', 'In Stock', new Date().toLocaleDateString(), new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(), 'BATCH-ES-001', 'Service Counter', 'Hot', 'Good', new Date().toLocaleDateString(), 'Freshly brewed espresso'],
      ['FG002', 'Latte', 'Beverages', 'pcs', '4.25', '2.10', '120', '108', '25', '250', '510.00', 'In Stock', new Date().toLocaleDateString(), new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(), 'BATCH-LT-001', 'Service Counter', 'Hot', 'Good', new Date().toLocaleDateString(), 'Creamy latte with steamed milk']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'central-kitchen-finished-goods-sample.csv')
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
          
          const productData = {
            productCode: values[0],
            productName: values[1],
            category: values[2],
            unitOfMeasure: values[3],
            unitPrice: parseFloat(values[4]) || 0,
            costPrice: parseFloat(values[5]) || 0,
            currentStock: parseInt(values[6]) || 0,
            minimumStock: parseInt(values[8]) || 0,
            maximumStock: parseInt(values[9]) || 0,
            productionDate: values[12] || new Date().toISOString().split('T')[0],
            expiryDate: values[13] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            batchNumber: values[14] || `BATCH-${Date.now()}`,
            storageLocation: values[15] || 'Cold Storage',
            storageTemperature: values[16] || '4°C',
            qualityStatus: values[17] || 'Good',
            notes: values[19] || ''
          }
          
          // Add to local state
          const newItem: FinishedGoodInventoryItem = {
            id: `fg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            outletId: outlet?.id || 'central-kitchen-001',
            outletCode: outlet?.outletCode || '',
            outletName: outlet?.outletName || '',
            productId: productData.productCode,
            productCode: productData.productCode,
            productName: productData.productName,
            category: productData.category,
            unitOfMeasure: productData.unitOfMeasure,
            unitPrice: productData.unitPrice,
            costPrice: productData.costPrice,
            currentStock: productData.currentStock,
            reservedStock: 0,
            availableStock: productData.currentStock,
            minimumStock: productData.minimumStock,
            maximumStock: productData.maximumStock,
            reorderPoint: Math.ceil(productData.minimumStock * 1.5),
            totalValue: productData.currentStock * productData.unitPrice,
            productionDate: productData.productionDate,
            expiryDate: productData.expiryDate,
            batchNumber: productData.batchNumber,
            storageLocation: productData.storageLocation,
            storageTemperature: productData.storageTemperature,
            qualityStatus: productData.qualityStatus,
            qualityNotes: 'Imported from CSV',
            status: 'In Stock',
            transferSource: 'Import',
            lastUpdated: new Date().toISOString(),
            notes: productData.notes,
            isActive: true
          }
          
          setFinishedGoodInventoryItems(prev => [...prev, newItem])
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
  const totalItems = finishedGoodInventoryItems.length
  const totalValue = finishedGoodInventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = finishedGoodInventoryItems.filter(item => item.status === 'Low Stock').length
  const outOfStockItems = finishedGoodInventoryItems.filter(item => item.status === 'Out of Stock').length
  const overstockItems = finishedGoodInventoryItems.filter(item => item.status === 'Overstock').length
  const expiredItems = finishedGoodInventoryItems.filter(item => item.status === 'Expired').length

  // Get unique categories
  const categories = [...new Set(finishedGoodInventoryItems.map(item => item.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Finished Goods...</p>
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
          <div className="p-3 bg-green-100 rounded-lg">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finished Good Inventory</h1>
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
            onClick={() => navigate('/central-kitchen/make-finished-good')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Make Finished Good
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired Items</p>
              <p className="text-2xl font-semibold text-gray-900">{expiredItems}</p>
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
                placeholder="Search finished goods by name, code, or category..."
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
              disabled={finishedGoodInventoryItems.length === 0}
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
              <option value="Expired">Expired</option>
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
                <option value="productName">Product Name</option>
                <option value="currentStock">Current Stock</option>
                <option value="totalValue">Total Value</option>
                <option value="status">Status</option>
                <option value="expiryDate">Expiry Date</option>
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
             Showing {finishedGoodInventoryItems.length} finished good items
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

      {/* Finished Goods Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Finished Goods Inventory</h3>
              <p className="text-sm text-gray-600">Complete finished goods inventory list</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Finished Good</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Available</th>
                <th className="table-header">Min/Max</th>
                <th className="table-header">Status</th>
                <th className="table-header">Value</th>
                <th className="table-header">Production/Expiry</th>
                <th className="table-header">Quality</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finishedGoodInventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900 font-medium">{item.productName}</div>
                      <div className="text-gray-500 text-sm">{item.productCode}</div>
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
                    <div className="text-gray-500 text-sm">{item.costPrice.toFixed(2)} cost / {item.unitPrice.toFixed(2)} sell</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 text-sm">Prod: {new Date(item.productionDate).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-sm">Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-sm">{item.batchNumber}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-900 text-sm">{item.qualityStatus}</div>
                    <div className="text-gray-500 text-sm">{item.storageTemperature}</div>
                    <div className="text-gray-500 text-sm">{item.storageLocation}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/finished-good-inventory/edit/${item.id}`)}
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
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default CentralKitchenFinishedGoods
