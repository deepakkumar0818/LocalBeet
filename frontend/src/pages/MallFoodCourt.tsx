import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, Truck, RefreshCw, ShoppingBag, ShoppingCart, Search, Download, Upload } from 'lucide-react'
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

const MallFoodCourt: React.FC = () => {
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
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importLoading, setImportLoading] = useState(false)
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('360 Mall')

  // Filter notifications based on current section
  const getFilteredNotifications = () => {
    const currentSection = getCurrentSection()
    
    console.log(`🔔 360 Mall: Current section: ${currentSection}`)
    console.log(`🔔 360 Mall: All notifications:`, notifications)
    
    let filtered = []
    if (currentSection === 'raw-materials') {
      // Show only Raw Material notifications
      filtered = notifications.filter(notification => 
        notification.isTransferOrder && 
        (notification.itemType === 'Raw Material' || notification.itemType === 'Mixed')
      )
    } else if (currentSection === 'finished-goods') {
      // Show only Finished Goods notifications
      filtered = notifications.filter(notification => 
        notification.isTransferOrder && 
        (notification.itemType === 'Finished Goods' || notification.itemType === 'Mixed')
      )
    } else {
      // Show all notifications for other sections
      filtered = notifications
    }
    
    console.log(`🔔 360 Mall: Filtered notifications for ${currentSection}:`, filtered)
    return filtered
  }

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

  // Debug notifications when they change
  useEffect(() => {
    console.log(`🔔 360 Mall: Notifications updated:`, notifications)
    console.log(`🔔 360 Mall: Number of notifications: ${notifications.length}`)
    if (notifications.length > 0) {
      console.log(`🔔 360 Mall: First notification:`, notifications[0])
    }
  }, [notifications])

  // Debug when component mounts
  useEffect(() => {
    console.log(`🔔 360 Mall: Component mounted, loading notifications for: "360 Mall"`)
  }, [])

  // Reload inventory when filters change
  useEffect(() => {
    if (!loading) {
      loadInventory()
    }
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  // Refresh inventory when notifications change (e.g., when transfer orders are received from Central Kitchen)
  useEffect(() => {
    if (notifications.length > 0) {
      // Check if there are any new transfer notifications from Central Kitchen
      const hasNewTransferNotifications = notifications.some(notif => 
        !notif.read && (
          notif.title?.includes('Items Received from Central Kitchen') ||
          notif.title?.includes('Transfer from Central Kitchen') ||
          notif.title?.includes('Items Received from Ingredient Master')
        )
      )
      
      if (hasNewTransferNotifications) {
        console.log('New transfer notification detected for 360 Mall, refreshing inventory...')
        loadInventory()
      }
    }
  }, [notifications])

  // Auto-refresh notifications every 5 seconds to catch new approvals
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 360 Mall: Auto-refreshing notifications...')
      refreshNotifications()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [refreshNotifications])

  const loadOutletData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get 360 Mall outlet
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const mall360 = outletsResponse.data.find(outlet => outlet.outletName === '360 Mall')
        if (mall360) {
          setOutlet(mall360)
          await loadInventory()
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
      await apiService.exportMall360RawMaterials({
        search: searchTerm,
        subCategory: filterCategory,
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
      await apiService.exportMall360FinishedProducts({
        search: searchTerm,
        subCategory: filterCategory,
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
      console.log('🔍 Loading 360 Mall inventory from dedicated database')
      console.log('   Search params:', { searchTerm, filterCategory, filterStatus, sortBy, sortOrder })
      
      // Load raw materials from 360 Mall dedicated database
      const rawMaterialsResponse = await apiService.get360MallRawMaterials({
        limit: 1000,
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'materialName' : sortBy,
        sortOrder
      })

      console.log('📦 Raw Materials API Response:', {
        success: rawMaterialsResponse.success,
        dataLength: rawMaterialsResponse.data?.length || 0
      })

      if (rawMaterialsResponse.success) {
        console.log('✅ Loaded 360 Mall Raw Materials:', rawMaterialsResponse.data?.length || 0, 'items')
        console.log('   First few items:', rawMaterialsResponse.data?.slice(0, 3))
        
        if (rawMaterialsResponse.data && rawMaterialsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedRawMaterials: OutletInventoryItem[] = rawMaterialsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: outlet?._id || outlet?.id || '',
            outletCode: outlet?.outletCode || 'OUT-003',
            outletName: outlet?.outletName || '360 Mall',
            materialId: item._id,
            materialCode: item.materialCode,
            materialName: item.materialName,
            category: item.subCategory || item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice || 0,
            currentStock: item.currentStock || 0,
            reservedStock: 0, // Default to 0 since it's not in the API response
            availableStock: item.currentStock || 0, // Use currentStock as availableStock
            minimumStock: item.minimumStock || 0,
            maximumStock: item.maximumStock || 0,
            reorderPoint: item.reorderPoint || 0,
            totalValue: (item.currentStock || 0) * (item.unitPrice || 0), // Calculate total value
            location: item.storageRequirements?.location || 'Main Storage',
            batchNumber: item.batchNumber || '',
            supplier: item.supplierName || '',
            lastUpdated: item.lastUpdated || item.updatedAt,
            status: item.status,
            notes: item.notes || '',
            isActive: item.isActive
          }))
          
          setInventoryItems(transformedRawMaterials)
        } else {
          console.log('No raw materials inventory found for 360 Mall')
          setInventoryItems([])
          // Do not set page-level error; let empty state render under the table with actions
        }
      } else {
        console.error('Failed to load raw materials inventory:', (rawMaterialsResponse as any).error || 'API Error')
        setInventoryItems([])
      }

      // Load finished goods from 360 Mall dedicated database
      const finishedGoodsResponse = await apiService.get360MallFinishedProducts({
        limit: 1000,
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'productName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded 360 Mall Finished Products:', finishedGoodsResponse.data)
        
        if (finishedGoodsResponse.data && finishedGoodsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedFinishedGoods: FinishedGoodInventoryItem[] = finishedGoodsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: outlet?._id || outlet?.id || '',
            outletCode: outlet?.outletCode || 'OUT-003',
            outletName: outlet?.outletName || '360 Mall',
            productId: item._id,
            productCode: item.productCode,
            productName: item.productName,
            category: item.subCategory || item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice || 0,
            costPrice: item.costPrice || 0,
            currentStock: item.currentStock || 0,
            reservedStock: 0, // Default to 0 since it's not in the API response
            availableStock: item.currentStock || 0, // Use currentStock as availableStock
            minimumStock: item.minimumStock || 0,
            maximumStock: item.maximumStock || 0,
            reorderPoint: item.reorderPoint || 0,
            totalValue: (item.currentStock || 0) * (item.unitPrice || 0), // Calculate total value
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
          console.log('No finished goods inventory found for 360 Mall')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
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




  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setImportLoading(true)
      const lower = file.name.toLowerCase()
      const section = getCurrentSection()
      if (section === 'raw-materials') {
        if (!(lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
          alert('Please select an Excel file (.xlsx/.xls) for Raw Materials import')
          return
        }
        const res = await apiService.importMall360RawMaterialsExcel(file)
        alert(res.message || 'Raw materials import completed')
        await loadInventory()
      } else if (section === 'finished-goods') {
        // Accept CSV/JSON/XLSX same as Kuwait City
        let products: any[] = []
        if (lower.endsWith('.json')) {
          const text = await file.text()
          const parsed = JSON.parse(text)
          products = Array.isArray(parsed) ? parsed : parsed.products || []
        } else if (lower.endsWith('.csv')) {
          const text = await file.text()
          const lines = text.split('\n').filter(line => line.trim())
          const dataRows = lines.slice(1)
          products = dataRows.map(row => {
            const values = row.split(',').map(v => v.replace(/\"/g, '').trim())
            return {
              productCode: values[0] || values[1],
              productName: values[1] || values[2],
              subCategory: values[2] || 'MAIN COURSES',
              category: values[2] || 'MAIN COURSES',
              unitOfMeasure: values[3] || 'piece',
              unitPrice: parseFloat(values[4]) || 0,
              currentStock: parseFloat(values[5]) || 0
            }
          }).filter(p => p.productCode && p.productName)
        } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
          const data = await file.arrayBuffer()
          const XLSXmod = await import('xlsx')
          const workbook = XLSXmod.read(data, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows: any[] = XLSXmod.utils.sheet_to_json(sheet, { defval: '' })
          products = rows.map((r) => {
            const norm = (s: string) => s.toString().trim().toLowerCase()
            const get = (keys: string[]) => {
              const header = Object.keys(r).find(h => keys.includes(norm(h))) as string
              return header ? r[header] : undefined
            }
            const subCat = (get(['subcategory name','subcategory','sub category','sub category name']) || 'MAIN COURSES').toString().trim()
            return {
              productCode: (get(['product code','sku','code']) || '').toString().trim(),
              productName: (get(['product name','item name','name']) || '').toString().trim(),
              subCategory: subCat,
              category: subCat,
              unitOfMeasure: (get(['unit of measure','unit','uom']) || 'piece').toString().trim(),
              unitPrice: Number.parseFloat(String(get(['unit price','price']))) || 0,
              currentStock: Number.parseFloat(String(get(['current stock','current quantity','quantity','qty']))) || 0
            }
          }).filter(p => p.productCode && p.productName)
        } else {
          alert('Please select CSV/JSON/Excel for Finished Products import')
          return
        }
        const res = await apiService.importMall360FinishedProducts(products)
        alert(res.message || `Finished products import completed. Success: ${res.data?.successCount || 0}`)
        await loadInventory()
      }
    } catch (err) {
      console.error('Error importing file:', err)
      alert('Error importing file. Please check the file format.')
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const renderRawMaterialsSection = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Raw Materials Inventory</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="btn-secondary flex items-center"
              title="Import raw materials from Excel"
            >
              {importLoading ? <span className="h-4 w-4 mr-2 inline-block border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {importLoading ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={handleExportRawMaterials}
              disabled={exportLoading || importLoading}
              className="btn-primary flex items-center"
              title="Export raw materials to Excel"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
        
        {/* (Removed duplicate top search bar) */}

        {/* Hidden file input moved to page root to be available on all tabs */}

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="btn-secondary flex items-center"
                title="Import finished products from CSV/JSON/Excel"
              >
                {importLoading ? <span className="h-4 w-4 mr-2 inline-block border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {importLoading ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={handleExportFinishedGoods}
                disabled={exportLoading || importLoading}
                className="btn-primary flex items-center"
                title="Export finished goods to Excel"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
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
      {/* Food Court Info Card */}
      <div className="card p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingBag className="h-8 w-8 text-orange-600" />
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/mall-food-court/raw-materials')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/mall-food-court/finished-goods')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/mall-food-court/sales-orders')}>
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
          <div className="p-3 bg-orange-100 rounded-lg">
            <ShoppingBag className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{outlet?.outletName || '360 Mall'}</h1>
            <p className="text-gray-600">
              {currentSection === 'raw-materials' ? 'Raw Materials Inventory' :
               currentSection === 'finished-goods' ? 'Finished Goods Inventory' :
               currentSection === 'sales-orders' ? 'Sales Orders' :
               'Fast-service food court outlet'} - {outlet?.outletName}
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
              onClick={() => navigate('/360-mall/request-raw-materials')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Raw Materials
            </button>
          )}
          {currentSection === 'finished-goods' && (
            <button
              onClick={() => navigate('/360-mall/request-finished-goods')}
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

      {/* Hidden file input for import (available for both sections) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={currentSection === 'raw-materials' ? '.xlsx,.xls' : '.csv,.json,.xlsx,.xls'}
        onChange={handleFileUpload}
        className="hidden"
        disabled={importLoading}
      />
    </div>
  )
}

export default MallFoodCourt