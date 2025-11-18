import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, AlertTriangle, Store, Truck, RefreshCw, ShoppingCart, Receipt, CreditCard, Plus, Download, Upload } from 'lucide-react'
import { apiService } from '../services/api'
import TransferOrderModal, { TransferOrder } from '../components/TransferOrderModal'
import NotificationDropdown from '../components/NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'
import { useDebounce } from '../hooks/useDebounce'
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

interface StockChangeIndicator {
  amount: number
  type: 'increase' | 'decrease'
}

const INDICATOR_DURATION = 20000

const isRawMaterialItem = (item: any, fallbackType?: string) => {
  const type = (item?.itemType || fallbackType || '').toString().toLowerCase()
  return type.includes('raw')
}

const isFinishedGoodItem = (item: any, fallbackType?: string) => {
  const type = (item?.itemType || fallbackType || '').toString().toLowerCase()
  return type.includes('finished')
}

const matchesOutletName = (outletValue: any, targetName: string) => {
  if (!outletValue || !targetName) return false
  const normalizedTarget = targetName.toLowerCase()
  const normalize = (value: string) => value?.toLowerCase() ?? ''

  if (typeof outletValue === 'string') {
    const normalizedValue = outletValue.toLowerCase()
    return (
      normalizedValue === normalizedTarget ||
      normalizedValue.includes(normalizedTarget)
    )
  }

  const possibleNames = [
    outletValue.outletName,
    outletValue.name,
    outletValue.kitchenName,
    outletValue.toOutletName,
    outletValue.fromOutletName
  ]

  return possibleNames.some(name => {
    if (typeof name !== 'string') return false
    const normalizedName = normalize(name)
    return (
      normalizedName === normalizedTarget ||
      normalizedName.includes(normalizedTarget)
    )
  })
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
  const [showTransferOrderModal, setShowTransferOrderModal] = useState(false)
  const [selectedTransferOrder, setSelectedTransferOrder] = useState<TransferOrder | null>(null)
  const [transferOrderLoading, setTransferOrderLoading] = useState(false)
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('Kuwait City')
  // Pagination state for raw materials
  const [rmCurrentPage, setRmCurrentPage] = useState(1)
  const [rmItemsPerPage, setRmItemsPerPage] = useState(20)
  const [rmTotalPages, setRmTotalPages] = useState(1)
  const [rmTotalItems, setRmTotalItems] = useState(0)
  // Pagination state for finished goods
  const [fgCurrentPage, setFgCurrentPage] = useState(1)
  const [fgItemsPerPage, setFgItemsPerPage] = useState(20)
  const [fgTotalPages, setFgTotalPages] = useState(1)
  const [fgTotalItems, setFgTotalItems] = useState(0)
  // Debounced search term - API will only be called after user stops typing for 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [stockChangeIndicators, setStockChangeIndicators] = useState<Record<string, StockChangeIndicator>>({})
  const indicatorTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

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
    
    console.log(`🔔 Kuwait City: Current section: ${currentSection}`)
    console.log(`🔔 Kuwait City: All notifications:`, notifications)
    
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
    
    console.log(`🔔 Kuwait City: Filtered notifications for ${currentSection}:`, filtered)
    return filtered
  }

  // Debug notifications when they change
  useEffect(() => {
    console.log(`🔔 Kuwait City: Notifications updated:`, notifications)
    console.log(`🔔 Kuwait City: Number of notifications: ${notifications.length}`)
    if (notifications.length > 0) {
      console.log(`🔔 Kuwait City: First notification:`, notifications[0])
    }
  }, [notifications])

  useEffect(() => {
    return () => {
      Object.values(indicatorTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    }
  }, [])

  // Handler for viewing transfer orders (defined early so it can be used in useEffect)
  const handleViewTransferOrder = React.useCallback(async (transferOrderId: string) => {
    try {
      console.log('🔍 Kuwait City: handleViewTransferOrder called with transferOrderId:', transferOrderId)
      setTransferOrderLoading(true)
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (response.success) {
        setSelectedTransferOrder(response.data)
        setShowTransferOrderModal(true)
        console.log('✅ Kuwait City: Transfer order modal opened successfully')
      } else {
        throw new Error(response.message || 'Failed to load transfer order')
      }
    } catch (error) {
      console.error('Error loading transfer order:', error)
      alert('Failed to load transfer order details')
    } finally {
      setTransferOrderLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOutletData()
    loadInventory()
    
    // Listen for transfer order view requests from Layout notifications
    const handleLayoutViewRequest = (event: CustomEvent) => {
      const { transferOrderId } = event.detail
      if (transferOrderId) {
        handleViewTransferOrder(transferOrderId)
      }
    }
    
    window.addEventListener('viewTransferOrder', handleLayoutViewRequest as EventListener)
    
    // Also check localStorage on mount
    const pendingView = localStorage.getItem('pendingTransferOrderView')
    if (pendingView) {
      localStorage.removeItem('pendingTransferOrderView')
      handleViewTransferOrder(pendingView)
    }
    
    return () => {
      window.removeEventListener('viewTransferOrder', handleLayoutViewRequest as EventListener)
    }
  }, [handleViewTransferOrder])

  // Reload inventory when filters change
  // Use debouncedSearchTerm instead of searchTerm to avoid API calls on every keystroke
  useEffect(() => {
    if (!loading) {
      // Reset to first page when filters change
      setRmCurrentPage(1)
      setFgCurrentPage(1)
      loadInventory()
    }
  }, [loading, debouncedSearchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  // Reload inventory when pagination changes
  useEffect(() => {
    if (!loading && outlet) {
      loadInventory()
    }
  }, [rmCurrentPage, rmItemsPerPage, fgCurrentPage, fgItemsPerPage])

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
    setRmCurrentPage(1) // Reset to first page when clearing filters
    setFgCurrentPage(1)
    loadInventory()
  }

  const triggerStockChangeIndicators = (
    items: Array<{ materialCode?: string; materialId?: string; itemCode?: string; quantity?: number }>,
    type: 'increase' | 'decrease'
  ) => {
    if (!items || items.length === 0) return

    setStockChangeIndicators(prev => {
      const next = { ...prev }
      items.forEach(item => {
        const indicatorKey = item.materialCode || item.materialId || item.itemCode
        const amount = Number(item.quantity)
        if (!indicatorKey || !amount) return

        next[indicatorKey] = {
          amount: Math.abs(amount),
          type
        }

        if (indicatorTimeoutsRef.current[indicatorKey]) {
          clearTimeout(indicatorTimeoutsRef.current[indicatorKey])
        }

        indicatorTimeoutsRef.current[indicatorKey] = setTimeout(() => {
          setStockChangeIndicators(current => {
            const copy = { ...current }
            delete copy[indicatorKey]
            return copy
          })
          delete indicatorTimeoutsRef.current[indicatorKey]
        }, INDICATOR_DURATION)
      })
      return next
    })
  }


  const handleAcceptTransferOrder = async (transferOrderId: string, editedItems?: any[], notes?: string) => {
    try {
      setTransferOrderLoading(true)
      console.log('Starting acceptance process for transfer order:', transferOrderId)
      console.log('Edited items:', editedItems)
      console.log('Transfer notes:', notes)
      
      // Get transfer order details
      console.log('Fetching transfer order details...')
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transfer order')
      }
      const transferOrder = response.data
      console.log('Transfer order details:', transferOrder)
      
      // Prepare approval data
      const approvalData: any = {
        approvedBy: 'Kuwait City Manager',
        notes: notes || 'Transfer order approved by Kuwait City'
      }
      
      // Include edited items if provided
      if (editedItems && editedItems.length > 0) {
        approvalData.editedItems = editedItems
        console.log('Including edited items in approval request:', editedItems)
      }
      
      // Approve transfer order (handles inventory updates and notifications automatically)
      console.log('Approving transfer order...')
      const approvalResponse = await apiService.approveTransferOrder(transferOrderId, approvalData)
      console.log('Approval response:', approvalResponse)

      if (approvalResponse.success) {
        // Backend automatically handles inventory updates and notifications
        const hasModifications = editedItems && editedItems.some((item, index) => 
          item.quantity !== transferOrder.items[index]?.quantity
        )
        alert(`Transfer order accepted successfully!${hasModifications ? ' (Quantities modified)' : ''}`)
        setShowTransferOrderModal(false)
        setSelectedTransferOrder(null)
        
        // Refresh inventory
        await loadInventory()

        const targetOutletName = outlet?.outletName || 'Kuwait City'
        if (matchesOutletName(transferOrder.toOutlet, targetOutletName)) {
          // Handle raw materials
          const rawMaterialItems = (transferOrder.items || [])
            .map((item, index) => {
              const quantity = editedItems && editedItems[index] ? editedItems[index].quantity : item.quantity
              return {
                materialCode: item.itemCode || item.materialCode,
                materialId: item.materialId,
                itemCode: item.itemCode,
                quantity,
                itemType: item.itemType
              }
            })
            .filter(item => isRawMaterialItem(item, transferOrder.itemType))

          if (rawMaterialItems.length > 0) {
            triggerStockChangeIndicators(rawMaterialItems, 'increase')
          }

          // Handle finished goods
          const finishedGoodItems = (transferOrder.items || [])
            .map((item, index) => {
              const quantity = editedItems && editedItems[index] ? editedItems[index].quantity : item.quantity
              // For finished goods, use productCode/productId as the key to match inventory items
              return {
                materialCode: item.productCode || item.itemCode, // productCode first for finished goods
                materialId: item.productId || item.materialId,
                itemCode: item.productCode || item.itemCode,
                quantity,
                itemType: item.itemType
              }
            })
            .filter(item => isFinishedGoodItem(item, transferOrder.itemType))

          if (finishedGoodItems.length > 0) {
            triggerStockChangeIndicators(finishedGoodItems, 'increase')
          }
        }
        
        // Refresh notifications
        refreshNotifications()
      } else {
        throw new Error(`Failed to approve transfer order: ${approvalResponse.message}`)
      }
      
    } catch (error) {
      console.error('Error accepting transfer order:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      alert(`Failed to accept transfer order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTransferOrderLoading(false)
    }
  }

  const handleRejectTransferOrder = async (transferOrderId: string) => {
    try {
      setTransferOrderLoading(true)
      console.log('Starting rejection process for transfer order:', transferOrderId)
      
      // Get transfer order details
      console.log('Fetching transfer order details...')
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transfer order')
      }
      const transferOrder = response.data
      console.log('Transfer order details:', transferOrder)
      
      // Reject transfer order
      console.log('Rejecting transfer order...')
      const rejectionResponse = await apiService.rejectTransferOrder(transferOrderId, {
        approvedBy: 'Kuwait City Manager',
        notes: 'Transfer order rejected by Kuwait City'
      })
      console.log('Rejection response:', rejectionResponse)

      if (rejectionResponse.success) {
        alert(`Transfer order rejected successfully!`)
        setShowTransferOrderModal(false)
        setSelectedTransferOrder(null)
        
        // Refresh notifications
        refreshNotifications()
      } else {
        throw new Error(`Failed to reject transfer order: ${rejectionResponse.message}`)
      }
      
    } catch (error) {
      console.error('Error rejecting transfer order:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      alert(`Failed to reject transfer order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTransferOrderLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      console.log('Loading Kuwait City inventory from dedicated database')
      
      // Load raw materials from Kuwait City dedicated database with pagination
      // Use debouncedSearchTerm to avoid API calls on every keystroke
      const rawMaterialsResponse = await apiService.getKuwaitCityRawMaterials({
        page: rmCurrentPage,
        limit: rmItemsPerPage,
        search: debouncedSearchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'materialName' : sortBy,
        sortOrder
      })

      if (rawMaterialsResponse.success) {
        console.log('Loaded Kuwait City Raw Materials:', rawMaterialsResponse.data)
        console.log('Raw Materials Pagination info:', rawMaterialsResponse.pagination)
        
        // Update pagination state for raw materials
        if (rawMaterialsResponse.pagination) {
          setRmTotalPages(rawMaterialsResponse.pagination.totalPages)
          setRmTotalItems(rawMaterialsResponse.pagination.totalItems)
        }
        
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

      // Load finished goods from Kuwait City dedicated database with pagination
      // Use debouncedSearchTerm to avoid API calls on every keystroke
      const finishedGoodsResponse = await apiService.getKuwaitCityFinishedProducts({
        page: fgCurrentPage,
        limit: fgItemsPerPage,
        search: debouncedSearchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'productName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded Kuwait City Finished Products:', finishedGoodsResponse.data)
        console.log('Finished Goods Pagination info:', finishedGoodsResponse.pagination)
        
        // Update pagination state for finished goods
        if (finishedGoodsResponse.pagination) {
          setFgTotalPages(finishedGoodsResponse.pagination.totalPages)
          setFgTotalItems(finishedGoodsResponse.pagination.totalItems)
        }
        
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
        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {rmTotalItems > 0 ? ((rmCurrentPage - 1) * rmItemsPerPage + 1) : 0} - {Math.min(rmCurrentPage * rmItemsPerPage, rmTotalItems)} of {rmTotalItems} raw material items
            {(searchTerm || filterCategory || filterStatus) && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Items per page:</label>
            <select
              value={rmItemsPerPage}
              onChange={(e) => {
                setRmItemsPerPage(Number(e.target.value))
                setRmCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{item.currentStock}</span>
                      {(stockChangeIndicators[item.materialCode] ||
                        stockChangeIndicators[item.materialId] ||
                        stockChangeIndicators[item.id]) && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            (stockChangeIndicators[item.materialCode] ||
                              stockChangeIndicators[item.materialId] ||
                              stockChangeIndicators[item.id])?.type === 'increase'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(stockChangeIndicators[item.materialCode] ||
                            stockChangeIndicators[item.materialId] ||
                            stockChangeIndicators[item.id])?.type === 'increase'
                            ? '+'
                            : '-'}
                          {(stockChangeIndicators[item.materialCode] ||
                            stockChangeIndicators[item.materialId] ||
                            stockChangeIndicators[item.id])?.amount}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {/* Pagination Controls for Raw Materials */}
        {rmTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {rmCurrentPage} of {rmTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRmCurrentPage(1)}
                  disabled={rmCurrentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  ««
                </button>
                <button
                  onClick={() => setRmCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={rmCurrentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ‹ Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, rmTotalPages) }, (_, i) => {
                    let pageNum: number
                    if (rmTotalPages <= 5) {
                      pageNum = i + 1
                    } else if (rmCurrentPage <= 3) {
                      pageNum = i + 1
                    } else if (rmCurrentPage >= rmTotalPages - 2) {
                      pageNum = rmTotalPages - 4 + i
                    } else {
                      pageNum = rmCurrentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setRmCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          rmCurrentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setRmCurrentPage(prev => Math.min(rmTotalPages, prev + 1))}
                  disabled={rmCurrentPage === rmTotalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setRmCurrentPage(rmTotalPages)}
                  disabled={rmCurrentPage === rmTotalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  »»
                </button>
              </div>
            </div>
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
        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {fgTotalItems > 0 ? ((fgCurrentPage - 1) * fgItemsPerPage + 1) : 0} - {Math.min(fgCurrentPage * fgItemsPerPage, fgTotalItems)} of {fgTotalItems} finished goods items
            {(searchTerm || filterCategory || filterStatus) && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Items per page:</label>
            <select
              value={fgItemsPerPage}
              onChange={(e) => {
                setFgItemsPerPage(Number(e.target.value))
                setFgCurrentPage(1)
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
                    <div className="flex items-center gap-2">
                      <span>{item.currentStock}</span>
                      {(stockChangeIndicators[item.productCode] ||
                        stockChangeIndicators[item.productId] ||
                        stockChangeIndicators[item.id]) && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            (stockChangeIndicators[item.productCode] ||
                              stockChangeIndicators[item.productId] ||
                              stockChangeIndicators[item.id])?.type === 'increase'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(stockChangeIndicators[item.productCode] ||
                            stockChangeIndicators[item.productId] ||
                            stockChangeIndicators[item.id])?.type === 'increase'
                            ? '+'
                            : '-'}
                          {(stockChangeIndicators[item.productCode] ||
                            stockChangeIndicators[item.productId] ||
                            stockChangeIndicators[item.id])?.amount}
                        </span>
                      )}
                    </div>
                  </td>
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
        {/* Pagination Controls for Finished Goods */}
        {fgTotalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {fgCurrentPage} of {fgTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFgCurrentPage(1)}
                  disabled={fgCurrentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  ««
                </button>
                <button
                  onClick={() => setFgCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={fgCurrentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ‹ Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, fgTotalPages) }, (_, i) => {
                    let pageNum: number
                    if (fgTotalPages <= 5) {
                      pageNum = i + 1
                    } else if (fgCurrentPage <= 3) {
                      pageNum = i + 1
                    } else if (fgCurrentPage >= fgTotalPages - 2) {
                      pageNum = fgTotalPages - 4 + i
                    } else {
                      pageNum = fgCurrentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setFgCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          fgCurrentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setFgCurrentPage(prev => Math.min(fgTotalPages, prev + 1))}
                  disabled={fgCurrentPage === fgTotalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setFgCurrentPage(fgTotalPages)}
                  disabled={fgCurrentPage === fgTotalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  »»
                </button>
              </div>
            </div>
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
            onViewTransferOrder={handleViewTransferOrder}
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

      {/* Transfer Order Modal */}
      <TransferOrderModal
        isOpen={showTransferOrderModal}
        onClose={() => {
          setShowTransferOrderModal(false)
          setSelectedTransferOrder(null)
        }}
        transferOrder={selectedTransferOrder}
        onAccept={handleAcceptTransferOrder}
        onReject={handleRejectTransferOrder}
        loading={transferOrderLoading}
      />
    </div>
  )
}

export default DowntownRestaurant