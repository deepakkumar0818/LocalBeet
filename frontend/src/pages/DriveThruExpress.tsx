import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, Truck, RefreshCw, Car, ShoppingCart, Search, Download } from 'lucide-react'
import { apiService } from '../services/api'
import NotificationDropdown from '../components/NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'

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
  status?: string
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

const DriveThruExpress: React.FC = () => {
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
  const [, setImporting] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('Taiba Hospital')
  const [editingItem, setEditingItem] = useState<OutletInventoryItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    reorderPoint: '',
    unitPrice: '',
    notes: ''
  })
  const [editingFinishedGood, setEditingFinishedGood] = useState<FinishedGoodInventoryItem | null>(null)
  const [showFinishedGoodEditModal, setShowFinishedGoodEditModal] = useState(false)
  const [finishedGoodEditFormData, setFinishedGoodEditFormData] = useState({
    currentStock: '',
    unitPrice: '',
    costPrice: '',
    minimumStock: '',
    maximumStock: '',
    reorderPoint: '',
    storageLocation: '',
    storageTemperature: '',
    qualityStatus: '',
    qualityNotes: '',
    notes: ''
  })

  // Determine current section based on URL
  const getCurrentSection = () => {
    const path = location.pathname
    if (path.includes('/raw-materials')) return 'raw-materials'
    if (path.includes('/finished-goods')) return 'finished-goods'
    if (path.includes('/sales-orders')) return 'sales-orders'
    return 'overview' // default to overview
  }

  const currentSection = getCurrentSection()

  // Filter notifications based on current section
  const getFilteredNotifications = () => {
    const currentSection = getCurrentSection()
    
    if (currentSection === 'raw-materials') {
      // Show only Raw Material notifications
      return notifications.filter(notification => 
        notification.isTransferOrder && 
        (notification.itemType === 'Raw Material' || notification.itemType === 'Mixed')
      )
    } else if (currentSection === 'finished-goods') {
      // Show only Finished Goods notifications
      return notifications.filter(notification => 
        notification.isTransferOrder && 
        (notification.itemType === 'Finished Goods' || notification.itemType === 'Mixed')
      )
    } else {
      // Show all notifications for other sections
      return notifications
    }
  }

  useEffect(() => {
    loadOutletData()
  }, [])

  // Refresh inventory when notifications change (e.g., when transfer orders are received from Central Kitchen)
  useEffect(() => {
    if (notifications.length > 0) {
      const hasNewTransferNotifications = notifications.some(notif => 
        !notif.read && (
          notif.title?.includes('Items Received from Central Kitchen') ||
          notif.title?.includes('Transfer from Central Kitchen') ||
          notif.title?.includes('Items Received from Ingredient Master')
        )
      )
      
      if (hasNewTransferNotifications) {
        console.log('New transfer notification detected for Taiba Hospital, refreshing inventory...')
        loadInventory()
      }
    }
  }, [notifications])

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
      
      // Get Taiba Hospital outlet (by name to avoid code mismatches)
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const taiba = outletsResponse.data.find(o => o.outletName === 'Taiba Hospital')
        if (taiba) {
          setOutlet(taiba)
          await loadInventory()
        } else {
          setError('Taiba Hospital not found')
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

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterStatus('')
    setSortBy('materialName')
    setSortOrder('asc')
    loadInventory()
  }

  const handleExportRawMaterials = async () => {
    try {
      setExportLoading(true)
      await apiService.exportTaibaHospitalRawMaterials({
        search: searchTerm,
        category: filterCategory,
        status: filterStatus
      })
    } catch (error) {
      console.error('Error exporting raw materials:', error)
      alert('Error exporting raw materials: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportFinishedGoods = async () => {
    try {
      setExportLoading(true)
      await apiService.exportTaibaHospitalFinishedProducts({
        search: searchTerm,
        category: filterCategory,
        status: filterStatus
      })
    } catch (error) {
      console.error('Error exporting finished goods:', error)
      alert('Error exporting finished goods: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setExportLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      console.log('Loading Taiba Kitchen inventory...')
      
      // Load raw materials inventory from Taiba Kitchen dedicated API
      const rawMaterialsResponse = await apiService.getTaibaKitchenRawMaterials({
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'materialName' : sortBy,
        sortOrder
      })

      if (rawMaterialsResponse.success) {
        console.log('Loaded outlet raw materials inventory:', rawMaterialsResponse.data)
        
        if (rawMaterialsResponse.data && rawMaterialsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedRawMaterials: OutletInventoryItem[] = rawMaterialsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: 'taiba-kitchen',
            outletCode: 'OUT-004',
            outletName: 'Taiba Hospital',
            materialId: item._id || item.id,
            materialCode: item.materialCode,
            materialName: item.materialName,
            category: item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            currentStock: item.currentStock,
            reservedStock: 0,
            availableStock: item.currentStock,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            reorderPoint: item.reorderPoint,
            totalValue: item.currentStock * item.unitPrice,
            location: item.storageRequirements?.location || 'Main Storage',
            batchNumber: item.batchNumber || '',
            supplier: item.supplierName || '',
            lastUpdated: item.updatedAt || new Date().toISOString(),
            status: item.status,
            notes: item.notes || '',
            isActive: item.isActive
          }))
          
          setInventoryItems(transformedRawMaterials)
        } else {
          console.log('No raw materials inventory found for Taiba Kitchen')
          setInventoryItems([])
          // Don't set a blocking error; allow graceful empty state rendering
        }
      } else {
        console.error('Failed to load raw materials inventory:', (rawMaterialsResponse as any).error || 'API Error')
        // Show non-blocking error text in empty state instead of page-level error
        setInventoryItems([])
      }

      // Load finished goods inventory from Taiba Kitchen dedicated API
      const finishedGoodsResponse = await apiService.getTaibaKitchenFinishedProducts({
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'productName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded outlet finished goods inventory:', finishedGoodsResponse.data)
        
        if (finishedGoodsResponse.data && finishedGoodsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedFinishedGoods: FinishedGoodInventoryItem[] = finishedGoodsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: 'taiba-kitchen',
            outletCode: 'OUT-004',
            outletName: 'Taiba Hospital',
            productId: item._id || item.id,
            productCode: item.productCode,
            productName: item.productName,
            category: item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice || 0,
            currentStock: item.currentStock,
            reservedStock: 0,
            availableStock: item.currentStock,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            reorderPoint: item.reorderPoint,
            totalValue: item.currentStock * item.unitPrice,
            productionDate: item.productionDate || new Date().toISOString(),
            expiryDate: item.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: item.batchNumber || '',
            storageLocation: item.storageLocation || 'Cold Storage',
            storageTemperature: item.storageTemperature || 'Cold',
            qualityStatus: item.qualityStatus || 'Good',
            qualityNotes: item.qualityNotes || '',
            status: item.status,
            transferSource: 'Transfer',
            lastUpdated: item.lastUpdated || item.updatedAt,
            notes: item.notes || '',
            isActive: item.isActive
          }))
          
          setFinishedGoodInventoryItems(transformedFinishedGoods)
        } else {
          console.log('No finished goods inventory found for this outlet')
          setFinishedGoodInventoryItems([])
        }
      } else {
        console.error('Failed to load finished goods inventory:', (finishedGoodsResponse as any).error || 'API Error')
        // Don't set error for finished goods as it's optional
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      console.error('Error loading inventory:', err)
    }
  }



  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      const updateData = {
        currentStock: parseFloat(editFormData.currentStock),
        minimumStock: parseFloat(editFormData.minimumStock),
        maximumStock: parseFloat(editFormData.maximumStock),
        reorderPoint: parseFloat(editFormData.reorderPoint),
        unitPrice: parseFloat(editFormData.unitPrice),
        notes: editFormData.notes
      }

      const response = await apiService.updateTaibaKitchenRawMaterial(editingItem.id, updateData)
      
      if (response.success) {
        // Update local state
        setInventoryItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...updateData, totalValue: updateData.currentStock * updateData.unitPrice }
            : item
        ))
        setShowEditModal(false)
        setEditingItem(null)
      } else {
        alert(`Failed to update inventory item: ${(response as any).error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating inventory item:', error)
      alert('Failed to update inventory item')
    }
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingItem(null)
    setEditFormData({
      currentStock: '',
      minimumStock: '',
      maximumStock: '',
      reorderPoint: '',
      unitPrice: '',
      notes: ''
    })
  }

  const handleEditFinishedGood = (item: FinishedGoodInventoryItem) => {
    setEditingFinishedGood(item)
    setFinishedGoodEditFormData({
      currentStock: item.currentStock.toString(),
      unitPrice: item.unitPrice.toString(),
      costPrice: item.costPrice.toString(),
      minimumStock: item.minimumStock.toString(),
      maximumStock: item.maximumStock.toString(),
      reorderPoint: item.reorderPoint.toString(),
      storageLocation: item.storageLocation || '',
      storageTemperature: item.storageTemperature || '',
      qualityStatus: item.qualityStatus || '',
      qualityNotes: item.qualityNotes || '',
      notes: item.notes || ''
    })
    setShowFinishedGoodEditModal(true)
  }

  const handleSaveFinishedGoodEdit = async () => {
    if (!editingFinishedGood) return

    try {
      const updateData = {
        currentStock: parseFloat(finishedGoodEditFormData.currentStock),
        unitPrice: parseFloat(finishedGoodEditFormData.unitPrice),
        costPrice: parseFloat(finishedGoodEditFormData.costPrice),
        minimumStock: parseFloat(finishedGoodEditFormData.minimumStock),
        maximumStock: parseFloat(finishedGoodEditFormData.maximumStock),
        reorderPoint: parseFloat(finishedGoodEditFormData.reorderPoint),
        storageLocation: finishedGoodEditFormData.storageLocation,
        storageTemperature: finishedGoodEditFormData.storageTemperature,
        qualityStatus: finishedGoodEditFormData.qualityStatus,
        qualityNotes: finishedGoodEditFormData.qualityNotes,
        notes: finishedGoodEditFormData.notes
      }

      const response = await apiService.updateTaibaKitchenFinishedProduct(editingFinishedGood.id, updateData)
      
      if (response.success) {
        // Update local state
        setFinishedGoodInventoryItems(prev => prev.map(item => 
          item.id === editingFinishedGood.id 
            ? { ...item, ...updateData, totalValue: updateData.currentStock * updateData.unitPrice }
            : item
        ))
        setShowFinishedGoodEditModal(false)
        setEditingFinishedGood(null)
      } else {
        alert(`Failed to update finished good inventory item: ${(response as any).error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating finished good inventory item:', error)
      alert('Failed to update finished good inventory item')
    }
  }

  const handleCancelFinishedGoodEdit = () => {
    setShowFinishedGoodEditModal(false)
    setEditingFinishedGood(null)
    setFinishedGoodEditFormData({
      currentStock: '',
      unitPrice: '',
      costPrice: '',
      minimumStock: '',
      maximumStock: '',
      reorderPoint: '',
      storageLocation: '',
      storageTemperature: '',
      qualityStatus: '',
      qualityNotes: '',
      notes: ''
    })
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Taiba Hospital...</p>
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
            outletId: outlet?.id || 'drive-thru-express-001',
            outletCode: outlet?.outletCode || 'DTE001',
            outletName: outlet?.outletName || 'Taiba Hospital',
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
            reorderPoint: 0,
            totalValue: 0,
            location: 'Main Storage',
            batchNumber: '',
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
          console.error('Error processing row:', err)
        }
      }

      alert(`Import completed!\nSuccessfully imported: ${successCount} items\nErrors: ${errorCount}`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Error importing file:', err)
      alert('Error importing file. Please check the file format.')
    } finally {
      setImporting(false)
    }
  }

  const renderRawMaterialsSection = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Raw Materials Inventory</h2>
          <button
            onClick={handleExportRawMaterials}
            disabled={exportLoading}
            className="btn-primary flex items-center"
            title="Export raw materials to Excel"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
        
        {/* (Removed duplicate top search bar) */}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Search & Filters - Raw Materials */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search raw materials by name, code, or supplier..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Categories</option>
            </select>
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <div className="flex items-center space-x-2">
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg">
                <option value="materialName">Material Name</option>
                <option value="currentStock">Current Quantity</option>
                <option value="unitPrice">Unit Price</option>
              </select>
              <button onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')} className="px-2 py-2 border rounded-lg" title="Toggle sort order">{sortOrder==='asc'?'↑':'↓'}</button>
              <button onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-gray-50">Clear Filters</button>
            </div>
          </div>
        </div>

        {/* Raw Materials Table / Empty State */}
        {inventoryItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p>No raw materials match the selected filters.</p>
            <div className="mt-3 space-x-2">
              <button onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-gray-50">Clear Filters</button>
              <button onClick={loadInventory} className="px-3 py-2 border rounded-lg">Refresh</button>
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems
                .filter(item => item.materialId && item.materialCode && item.materialName)
                .filter(item => 
                  searchTerm === '' || 
                  item.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.materialCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    KWD {item.unitPrice ? Number(item.unitPrice).toFixed(3) : '0.000'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
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
            <button
              onClick={handleExportFinishedGoods}
              disabled={exportLoading}
              className="btn-primary flex items-center"
              title="Export finished goods to Excel"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
        
        {/* Search & Filters - Finished Goods */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search finished goods by name or code..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Categories</option>
            </select>
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <div className="flex items-center space-x-2">
              <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg">
                <option value="productName">Product Name</option>
                <option value="currentStock">Current Stock</option>
                <option value="unitPrice">Unit Price</option>
              </select>
              <button onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')} className="px-2 py-2 border rounded-lg" title="Toggle sort order">{sortOrder==='asc'?'↑':'↓'}</button>
              <button onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-gray-50">Clear Filters</button>
            </div>
          </div>
        </div>

        {/* Finished Goods Table / Empty State */}
        {finishedGoodInventoryItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p>No finished goods match the selected filters.</p>
            <div className="mt-3 space-x-2">
              <button onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-gray-50">Clear Filters</button>
              <button onClick={loadInventory} className="px-3 py-2 border rounded-lg">Refresh</button>
            </div>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finishedGoodInventoryItems
                .filter(item => item.productId && item.productCode && item.productName)
                .filter(item => 
                  searchTerm === '' || 
                  item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">KWD {item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  )

  const renderSalesOrdersSection = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Orders</h2>
        <p className="text-gray-600">Sales orders functionality will be implemented here.</p>
      </div>
    </div>
  )

  const renderOverviewSection = () => (
    <div className="space-y-6">
      {/* Drive-Thru Info Card */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Car className="h-8 w-8 text-purple-600" />
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

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/drive-thru-express/raw-materials')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/drive-thru-express/finished-goods')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/drive-thru-express/sales-orders')}>
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
          <div className="p-3 bg-purple-100 rounded-lg">
            <Car className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Taiba Hospital</h1>
            <p className="text-gray-600">
              {currentSection === 'raw-materials' ? 'Raw Materials Inventory' :
               currentSection === 'finished-goods' ? 'Finished Goods Inventory' :
               currentSection === 'sales-orders' ? 'Sales Orders' :
               'Express drive-thru outlet'} - {outlet?.outletName}
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
          {currentSection === 'raw-materials' && (
            <button
              onClick={() => navigate('/drive-thru-express/request-raw-materials')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Raw Materials
            </button>
          )}
          {currentSection === 'finished-goods' && (
            <button
              onClick={() => navigate('/drive-thru-express/request-finished-goods')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Finished Goods
            </button>
          )}
          <NotificationDropdown
            notifications={getFilteredNotifications()}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            onRefresh={refreshNotifications}
          />
        </div>
      </div>

      {/* Section Content */}
      {renderSectionContent()}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Inventory Item
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {editingItem.materialCode} - {editingItem.materialName}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.currentStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.unitPrice}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.minimumStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, minimumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.maximumStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maximumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.reorderPoint}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, reorderPoint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finished Goods Edit Modal */}
      {showFinishedGoodEditModal && editingFinishedGood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Finished Good Inventory Item
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {editingFinishedGood.productCode} - {editingFinishedGood.productName}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.currentStock}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.unitPrice}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.costPrice}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.minimumStock}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, minimumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.maximumStock}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, maximumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={finishedGoodEditFormData.reorderPoint}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, reorderPoint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={finishedGoodEditFormData.storageLocation}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Temperature
                </label>
                <select
                  value={finishedGoodEditFormData.storageTemperature}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, storageTemperature: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cold">Cold</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Hot">Hot</option>
                  <option value="Room Temperature">Room Temperature</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Status
                </label>
                <select
                  value={finishedGoodEditFormData.qualityStatus}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, qualityStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Good">Good</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Expired">Expired</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Notes
                </label>
                <textarea
                  value={finishedGoodEditFormData.qualityNotes}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, qualityNotes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={finishedGoodEditFormData.notes}
                  onChange={(e) => setFinishedGoodEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelFinishedGoodEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFinishedGoodEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriveThruExpress