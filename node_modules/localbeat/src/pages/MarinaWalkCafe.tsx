import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Truck, Users, Clock, RefreshCw, ShoppingCart, Coffee, Download, Upload } from 'lucide-react'
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
  _id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

const MarinaWalkCafe: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [finishedGoodInventoryItems, setFinishedGoodInventoryItems] = useState<FinishedGoodInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('materialName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine current section based on URL
  const getCurrentSection = () => {
    const path = location.pathname
    if (path.includes('/raw-materials')) return 'raw-materials'
    if (path.includes('/finished-goods')) return 'finished-goods'
    if (path.includes('/sales-orders')) return 'sales-orders'
    return 'overview' // default to overview
  }

  const currentSection = getCurrentSection()

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
      
      // Get 360 Mall outlet
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const marinaCafe = outletsResponse.data.find(outlet => outlet.outletCode === 'OUT-002')
        if (marinaCafe) {
          setOutlet(marinaCafe)
          await loadInventory(marinaCafe._id)
        } else {
          setError('360 Mall not found')
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
    const currentOutletId = outletId || outlet?._id || 'marina-walk-cafe-001'
    
    try {
      // Use sample data for faster loading
      const sampleRawMaterials: OutletInventoryItem[] = [
        {
          id: 'mwc-rm-001',
          outletId: currentOutletId,
          outletCode: 'MWC001',
          outletName: '360 Mall',
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
          id: 'mwc-rm-002',
          outletId: currentOutletId,
          outletCode: 'MWC001',
          outletName: '360 Mall',
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
        }
      ]

      const sampleFinishedGoods: FinishedGoodInventoryItem[] = [
        {
          id: 'mwc-fg-001',
          outletId: currentOutletId,
          outletCode: 'MWC001',
          outletName: '360 Mall',
          productId: 'FG001',
          productCode: 'FG001',
          productName: 'Caesar Salad',
          category: 'Salads',
          unitOfMeasure: 'PORTION',
          unitPrice: 8.50,
          costPrice: 4.25,
          currentStock: 25,
          reservedStock: 0,
          availableStock: 25,
          minimumStock: 5,
          maximumStock: 50,
          reorderPoint: 10,
          totalValue: 212.50,
          location: 'Cold Storage',
          batchNumber: 'BATCH001',
          supplier: '360 Mall',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Fresh daily',
          isActive: true
        }
      ]

      console.log('Loaded 360 Mall Raw Materials Inventory:', sampleRawMaterials)
      setInventoryItems(sampleRawMaterials)
      
      console.log('Loaded 360 Mall Finished Goods Inventory:', sampleFinishedGoods)
      setFinishedGoodInventoryItems(sampleFinishedGoods)
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
    if (inventoryItems.length === 0 && finishedGoodInventoryItems.length === 0) {
      alert('No inventory to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'Type',
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
      // Raw materials data rows
      ...inventoryItems.map(item => [
        'Raw Material',
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
      ].map(field => `"${field}"`).join(',')),
      // Finished goods data rows
      ...finishedGoodInventoryItems.map(item => [
        'Finished Good',
        item.productCode,
        item.productName,
        item.category,
        item.unitOfMeasure,
        item.unitPrice.toFixed(2),
        item.currentStock.toString(),
        item.availableStock.toString(),
        item.minimumStock.toString(),
        item.maximumStock.toString(),
        item.totalValue.toFixed(2),
        item.status,
        '',
        new Date(item.lastUpdated).toLocaleDateString(),
        item.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `marina-walk-cafe-inventory-${new Date().toISOString().split('T')[0]}.csv`)
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

      const dataRows = lines.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          const type = values[0]
          
          if (type === 'Raw Material') {
            const materialData = {
              materialCode: values[1],
              materialName: values[2],
              category: values[3],
              unitOfMeasure: values[4],
              unitPrice: parseFloat(values[5]) || 0,
              currentStock: parseInt(values[6]) || 0,
              minimumStock: parseInt(values[8]) || 0,
              maximumStock: parseInt(values[9]) || 0,
              supplier: values[12] || '',
              notes: values[14] || ''
            }
            
            // Add to local state
            const newItem: OutletInventoryItem = {
              id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              outletId: 'marina-walk-cafe-001',
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
          } else if (type === 'Finished Good') {
            const productData = {
              productCode: values[1],
              productName: values[2],
              category: values[3],
              unitOfMeasure: values[4],
              unitPrice: parseFloat(values[5]) || 0,
              currentStock: parseInt(values[6]) || 0,
              minimumStock: parseInt(values[8]) || 0,
              maximumStock: parseInt(values[9]) || 0,
              supplier: values[12] || '',
              notes: values[14] || ''
            }
            
            // Add to local state
            const newItem: FinishedGoodInventoryItem = {
              id: `fg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              outletId: 'marina-walk-cafe-001',
              outletCode: outlet?.outletCode || '',
              outletName: outlet?.outletName || '',
              productId: productData.productCode,
              productCode: productData.productCode,
              productName: productData.productName,
              category: productData.category,
              unitOfMeasure: productData.unitOfMeasure,
              unitPrice: productData.unitPrice,
              costPrice: productData.unitPrice * 0.7, // Assume 30% margin
              currentStock: productData.currentStock,
              reservedStock: 0,
              availableStock: productData.currentStock,
              minimumStock: productData.minimumStock,
              maximumStock: productData.maximumStock,
              reorderPoint: Math.ceil(productData.minimumStock * 1.5),
              totalValue: productData.currentStock * productData.unitPrice,
              productionDate: new Date().toISOString().split('T')[0],
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              batchNumber: `BATCH-${Date.now()}`,
              storageLocation: 'Cold Storage',
              storageTemperature: '4°C',
              qualityStatus: 'Good',
              qualityNotes: 'Imported from CSV',
              status: 'In Stock',
              transferSource: 'Import',
              lastUpdated: new Date().toISOString(),
              notes: productData.notes,
              isActive: true
            }
            
            setFinishedGoodInventoryItems(prev => [...prev, newItem])
            successCount++
          }
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
      ['Type', 'Item Code', 'Item Name', 'Category', 'Unit of Measure', 'Unit Price', 'Current Stock', 'Available Stock', 'Minimum Stock', 'Maximum Stock', 'Total Value', 'Status', 'Supplier', 'Last Updated', 'Notes'],
      ['Raw Material', 'RM-001', 'Fresh Tomatoes', 'Vegetables', 'KG', '3.50', '50', '50', '10', '100', '175.00', 'In Stock', 'Fresh Foods Ltd', '2024-01-15', 'Premium quality'],
      ['Finished Good', 'FG-001', 'Cappuccino', 'Coffee', 'CUP', '4.50', '30', '30', '10', '100', '135.00', 'In Stock', '360 Mall', '2024-01-15', 'Fresh daily']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'marina-walk-cafe-sample-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading 360 Mall...</p>
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

  // Render section-specific content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 'raw-materials':
        return renderRawMaterialsSection()
      case 'finished-goods':
        return renderFinishedGoodsSection()
      case 'sales-orders':
        return renderSalesOrdersSection()
      default:
        return renderOverviewSection()
    }
  }

  const renderRawMaterialsSection = () => (
    <div className="space-y-6">
      {/* Raw Materials Section */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Raw Materials Inventory</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadSampleCSV}
                className="btn-secondary flex items-center"
                title="Download sample CSV template (works with Excel too)"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center"
                title="Import inventory from CSV or Excel file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center"
                title="Export current inventory data"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
        {/* Raw Materials Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SubCategory Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Purchase Unit Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems
                .filter(item => item.materialId && item.materialCode && item.materialName)
                .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.materialCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Raw Materials</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
    </div>
  )

  const renderFinishedGoodsSection = () => (
    <div className="space-y-6">
      {/* Finished Goods Section */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Finished Goods Inventory</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadSampleCSV}
                className="btn-secondary flex items-center"
                title="Download sample CSV template (works with Excel too)"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center"
                title="Import inventory from CSV or Excel file"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center"
                title="Export current inventory data"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
        {/* Finished Goods Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit of Measure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maximum Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finishedGoodInventoryItems
                .filter(item => item.productId && item.productCode && item.productName)
                .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.availableStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minimumStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.maximumStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.totalValue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastUpdated}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderSalesOrdersSection = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">POS Sales</h2>
          <button
            onClick={() => navigate('/marina-walk-cafe/pos-sales/create-order', { 
              state: { outletName: '360 Mall' } 
            })}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </button>
        </div>
        <p className="text-gray-600 mb-4">Point of Sale system for 360 Mall outlet</p>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/marina-walk-cafe/pos-sales/create-order', { 
              state: { outletName: '360 Mall' } 
            })}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">New Order</h3>
                <p className="text-sm text-gray-600">Create a new sales order</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order History</h3>
                <p className="text-sm text-gray-600">View past orders</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Payment Reports</h3>
                <p className="text-sm text-gray-600">View payment summaries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Cafe Info Card */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Coffee className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{outlet?.outletName}</h2>
              <p className="text-gray-600">{outlet?.outletType} • {outlet?.outletCode}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {outlet?.status || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Raw Materials</p>
              <p className="text-2xl font-semibold text-gray-900">{inventoryItems.filter(item => item.materialId && item.materialCode && item.materialName).length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Finished Goods</p>
              <p className="text-2xl font-semibold text-gray-900">{finishedGoodInventoryItems.filter(item => item.productId && item.productCode && item.productName).length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${(inventoryItems.reduce((sum, item) => sum + item.totalValue, 0) + 
                   finishedGoodInventoryItems.reduce((sum, item) => sum + item.totalValue, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'Low Stock').length + 
                 finishedGoodInventoryItems.filter(item => item.status === 'Low Stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marina-walk-cafe/raw-materials')}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Raw Materials</h3>
              <p className="text-gray-600">Manage raw material inventory</p>
            </div>
          </div>
        </div>
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marina-walk-cafe/finished-goods')}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Finished Goods</h3>
              <p className="text-gray-600">Manage finished goods inventory</p>
            </div>
          </div>
        </div>
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marina-walk-cafe/sales-orders')}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Orders</h3>
              <p className="text-gray-600">Manage sales orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Coffee className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">360 Mall</h1>
            <p className="text-gray-600">
              {currentSection === 'raw-materials' ? 'Raw Materials Inventory' :
               currentSection === 'finished-goods' ? 'Finished Goods Inventory' :
               currentSection === 'sales-orders' ? 'Sales Orders' :
               'Cozy waterfront cafe'} - {outlet?.outletName}
            </p>
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
          {currentSection !== 'sales-orders' && (
            <button
              onClick={() => navigate('/transfer-orders/add')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Transfer
            </button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {renderSectionContent()}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}

export default MarinaWalkCafe