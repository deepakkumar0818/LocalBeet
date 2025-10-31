import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, AlertTriangle, Store, Truck, RefreshCw, ShoppingCart, Receipt, CreditCard, Plus, Download, Upload } from 'lucide-react'
import { apiService } from '../services/api'
import NotificationDropdown from '../components/NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'
import * as XLSX from 'xlsx'

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

const DowntownRestaurant: React.FC = () => {
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
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('Kuwait City')
  
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
    loadInventory()
  }, [])

  // Reload inventory when filters change
  useEffect(() => {
    if (!loading) {
      loadInventory()
    }
  }, [loading, searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  // Refresh inventory when notifications change (e.g., when transfer orders are accepted or completed)
  useEffect(() => {
    if (notifications.length > 0) {
      // Check if there are any new transfer notifications
      const hasNewTransferNotifications = notifications.some(notif => 
        !notif.read && notif.type === 'success' && (
          notif.title?.includes('Transfer Order Accepted') ||
          notif.title?.includes('Items Received from Central Kitchen') ||
          notif.title?.includes('Items Received from Ingredient Master')
        )
      )
      
      if (hasNewTransferNotifications) {
        console.log('New transfer notification detected, refreshing inventory...')
        loadInventory()
      }
    }
  }, [notifications])

  const loadOutletData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get Kuwait City outlet
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const downtownRestaurant = outletsResponse.data.find(outlet => outlet.outletName === 'Kuwait City')
        if (downtownRestaurant) {
          setOutlet(downtownRestaurant)
        } else {
          setError('Kuwait City not found')
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
    setSortBy(currentSection === 'finished-goods' ? 'productName' : 'materialName')
    setSortOrder('asc')
    loadInventory()
  }

  const loadInventory = async () => {
    try {
      console.log('Loading Kuwait City inventory from dedicated database')
      
      // Load raw materials from Kuwait City dedicated database
      const rawMaterialsResponse = await apiService.getKuwaitCityRawMaterials({
        limit: 1000,
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'materialName' : sortBy,
        sortOrder
      })

      if (rawMaterialsResponse.success) {
        console.log('Loaded Kuwait City Raw Materials:', rawMaterialsResponse.data)
        
        if (rawMaterialsResponse.data && rawMaterialsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedRawMaterials: OutletInventoryItem[] = rawMaterialsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: 'kuwait-city',
            outletCode: 'OUT-001',
            outletName: 'Kuwait City',
            materialId: item._id,
            materialCode: item.materialCode,
            materialName: item.materialName,
            category: item.subCategory || item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            currentStock: item.currentStock,
            reservedStock: 0,
            availableStock: item.currentStock,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            reorderPoint: item.reorderPoint,
            totalValue: item.currentStock * item.unitPrice,
            location: 'Main Storage',
            batchNumber: `KCBATCH-${item.materialCode}-${Date.now()}`,
            supplier: 'Various Suppliers',
            lastUpdated: item.updatedAt,
            status: item.status,
            notes: item.notes || '',
            isActive: item.isActive
          }))
          
          setInventoryItems(transformedRawMaterials)
        } else {
          console.log('No raw materials inventory found for Kuwait City')
          setInventoryItems([])
          // Do not set page-level error; empty table state will render and user can adjust filters
        }
      } else {
        console.error('Failed to load raw materials inventory:', 'API Error')
        setInventoryItems([])
      }

      // Load finished goods from Kuwait City dedicated database
      const finishedGoodsResponse = await apiService.getKuwaitCityFinishedProducts({
        limit: 1000,
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'productName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded Kuwait City Finished Products:', finishedGoodsResponse.data)
        
        if (finishedGoodsResponse.data && finishedGoodsResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedFinishedGoods: FinishedGoodInventoryItem[] = finishedGoodsResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: 'kuwait-city',
            outletCode: 'OUT-001',
            outletName: 'Kuwait City',
            productId: item._id,
            productCode: item.productCode,
            productName: item.productName,
            category: item.subCategory || item.category,
            unitOfMeasure: item.unitOfMeasure,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            currentStock: item.currentStock,
            reservedStock: 0,
            availableStock: item.currentStock,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            reorderPoint: item.reorderPoint,
            totalValue: item.currentStock * item.unitPrice,
            productionDate: new Date().toISOString(),
            expiryDate: item.shelfLife ? new Date(Date.now() + item.shelfLife * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: `KCFG-${item.productCode}-${Date.now()}`,
            storageLocation: 'Main Storage',
            storageTemperature: item.storageRequirements?.temperature || 'Room Temperature',
            qualityStatus: 'Good',
            qualityNotes: '',
            status: item.status,
            transferSource: 'Production',
            lastUpdated: item.updatedAt,
            notes: item.notes || '',
            isActive: item.isActive
          }))
          
          setFinishedGoodInventoryItems(transformedFinishedGoods)
        } else {
          console.log('No finished goods inventory found for Kuwait City')
          setFinishedGoodInventoryItems([])
        }
      } else {
        console.error('Failed to load finished goods inventory:', 'API Error')
        // Don't set error for finished goods as it's optional
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      console.error('Error loading inventory:', err)
    }
  }




  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setImportLoading(true)
      if (currentSection === 'raw-materials') {
        const lower = file.name.toLowerCase()
        if (!(lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
          alert('Please select an Excel file (.xlsx or .xls) for Raw Materials import')
          return
        }
        const res = await apiService.importKuwaitCityRawMaterialsExcel(file)
        alert(res.message || 'Raw materials import completed')
        await loadInventory()
      } else if (currentSection === 'finished-goods') {
        const lower = file.name.toLowerCase()
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
              unitOfMeasure: values[3] || 'piece',
              unitPrice: parseFloat(values[4]) || 0,
              currentStock: parseFloat(values[5]) || 0
            }
          }).filter(p => p.productCode && p.productName)
        } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
          const data = await file.arrayBuffer()
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          products = rows.map((r) => {
            const get = (keys: string[]) => {
              const key = keys.find(k => Object.keys(r).some(h => h.toString().trim().toLowerCase() === k))
              if (!key) return undefined
              const header = Object.keys(r).find(h => h.toString().trim().toLowerCase() === key) as string
              return r[header]
            }
            const productCode = (get(['product code','sku','code']) || '').toString().trim()
            const productName = (get(['product name','item name','name']) || '').toString().trim()
            // SubCategory comes from "SubCategory Name" in the Excel; DO NOT use Parent Category
            const subCategory = (get(['subcategory name','subcategory','sub category','sub category name']) || 'MAIN COURSES').toString().trim()
            const unitOfMeasure = (get(['unit of measure','unit','uom']) || 'piece').toString().trim()
            const unitPriceRaw = get(['unit price','price'])
            const currentStockRaw = get(['current stock','current quantity','quantity','qty'])
            return {
              productCode,
              productName,
              // Send both for backend; category in DB should equal the SubCategory Name per requirement
              subCategory,
              category: subCategory,
              unitOfMeasure,
              unitPrice: Number.parseFloat(String(unitPriceRaw)) || 0,
              currentStock: Number.parseFloat(String(currentStockRaw)) || 0,
            }
          }).filter(p => p.productCode && p.productName)
        } else {
          alert('Please select an Excel (.xlsx/.xls), CSV or JSON file for Finished Products import')
          return
        }
        const res = await apiService.importKuwaitCityFinishedProducts(products)
        alert(res.message || `Finished products import completed. Success: ${res.data?.successCount || 0}`)
        await loadInventory()
      }
    } catch (err) {
      alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportRawMaterials = async () => {
    try {
      setExportLoading(true)
      console.log('Starting export of Kuwait City raw materials...')
      
      await apiService.exportKuwaitCityRawMaterials({
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus
      })
      
      console.log('Export completed successfully')
    } catch (error) {
      console.error('Error exporting raw materials:', error)
      alert(`Failed to export raw materials: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportFinishedGoods = async () => {
    try {
      setExportLoading(true)
      console.log('Starting export of Kuwait City finished goods...')
      
      await apiService.exportKuwaitCityFinishedProducts({
        search: searchTerm,
        subCategory: filterCategory,
        status: filterStatus
      })
      
      console.log('Export completed successfully')
    } catch (error) {
      console.error('Error exporting finished goods:', error)
      alert(`Failed to export finished goods: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Kuwait City...</p>
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
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center"
                title="Import raw materials from Excel (.xlsx/.xls)"
                disabled={importLoading}
              >
                {importLoading ? (
                  <>
                    <span className="h-4 w-4 mr-2 inline-block border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
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
        </div>
        {/* Search & Filters */}
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
              {/* common categories */}
              <option value="NON FOOD - PACKING">NON FOOD - PACKING</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Dairy">Dairy</option>
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
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center"
                title="Import finished products from CSV/JSON"
                disabled={importLoading}
              >
                {importLoading ? (
                  <>
                    <span className="h-4 w-4 mr-2 inline-block border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
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
        {/* Search & Filters */}
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
              <option value="GATHERING">GATHERING</option>
              <option value="HAPPY ENDINGS">HAPPY ENDINGS</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit of Measure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KWD {item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock}</td>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">POS Sales</h2>
          <button
            onClick={() => navigate('/kuwait-city/pos-sales/create-order', { 
              state: { outletName: 'Kuwait City' } 
            })}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </button>
        </div>
        <p className="text-gray-600 mb-4">Point of Sale system for Kuwait City outlet</p>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div 
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/kuwait-city/pos-sales/create-order', { 
              state: { outletName: 'Kuwait City' } 
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
      {/* Restaurant Info Card */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{outlet?.outletName}</h2>
              <p className="text-gray-600">{outlet?.outletType} • {outlet?.outletCode}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Active
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/kuwait-city/raw-materials')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/kuwait-city/finished-goods')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/kuwait-city/sales-orders')}>
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
                        <div>
            <h1 className="text-2xl font-bold text-gray-900">Kuwait City</h1>
            <p className="text-gray-600">
              {currentSection === 'raw-materials' ? 'Raw Materials Inventory' :
               currentSection === 'finished-goods' ? 'Finished Goods Inventory' :
               currentSection === 'sales-orders' ? 'Sales Orders' :
               'Premium dining restaurant'} - {outlet?.outletName}
            </p>
                        </div>
                        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              loadOutletData()
              loadInventory()
            }}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {currentSection === 'raw-materials' && (
            <button
              onClick={() => navigate('/kuwait-city/request-raw-materials')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Raw Materials
            </button>
          )}
          {currentSection === 'finished-goods' && (
            <button
              onClick={() => navigate('/kuwait-city/request-finished-goods')}
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


      {/* Hidden file input for import */}
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

export default DowntownRestaurant