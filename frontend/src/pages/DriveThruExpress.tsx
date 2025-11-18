import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, Truck, RefreshCw, Car, ShoppingCart, Search, Download, Upload } from 'lucide-react'
import { apiService } from '../services/api'
import TransferOrderModal, { TransferOrder } from '../components/TransferOrderModal'
import NotificationDropdown from '../components/NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'
import { useDebounce } from '../hooks/useDebounce'

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
  const [importLoading, setImporting] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stockChangeIndicators, setStockChangeIndicators] = useState<Record<string, StockChangeIndicator>>({})
  const indicatorTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('Taiba Hospital')
  const [showTransferOrderModal, setShowTransferOrderModal] = useState(false)
  const [selectedTransferOrder, setSelectedTransferOrder] = useState<TransferOrder | null>(null)
  const [transferOrderLoading, setTransferOrderLoading] = useState(false)
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

  // Open transfer order from notification (defined early so it can be used in useEffect)
  const handleViewTransferOrder = React.useCallback(async (transferOrderId: string) => {
    try {
      console.log('🔍 Taiba Hospital: handleViewTransferOrder called with transferOrderId:', transferOrderId)
      setTransferOrderLoading(true)
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (response.success) {
        setSelectedTransferOrder(response.data)
        setShowTransferOrderModal(true)
        console.log('✅ Taiba Hospital: Transfer order modal opened successfully')
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

  // Reload inventory when filters or pagination change
  useEffect(() => {
    if (outlet && !loading) {
      loadInventory()
    }
  }, [debouncedSearchTerm, filterCategory, filterStatus, sortBy, sortOrder, rmCurrentPage, rmItemsPerPage, fgCurrentPage, fgItemsPerPage])

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
    setRmCurrentPage(1)
    setFgCurrentPage(1)
    loadInventory()
  }

  useEffect(() => {
    return () => {
      Object.values(indicatorTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    }
  }, [])

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

  // Approve transfer order (supports edited quantities)
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
        approvedBy: 'Taiba Hospital Manager',
        notes: notes || 'Transfer order approved by Taiba Hospital'
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

        const targetOutletName = outlet?.outletName || 'Taiba Hospital'
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

  // Reject transfer order
  const handleRejectTransferOrder = async (transferOrderId: string) => {
    try {
      setTransferOrderLoading(true)
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transfer order')
      }
      const rejectionResponse = await apiService.rejectTransferOrder(transferOrderId, {
        approvedBy: 'Taiba Hospital Manager',
        notes: 'Transfer order rejected by Taiba Hospital'
      })
      if (rejectionResponse.success) {
        alert('Transfer order rejected successfully!')
        setShowTransferOrderModal(false)
        setSelectedTransferOrder(null)
        refreshNotifications()
      } else {
        throw new Error(`Failed to reject transfer order: ${rejectionResponse.message}`)
      }
    } catch (error) {
      console.error('Error rejecting transfer order:', error)
      alert(`Failed to reject transfer order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTransferOrderLoading(false)
    }
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
      console.log('   Search params:', { debouncedSearchTerm, filterCategory, filterStatus, sortBy, sortOrder })
      
      // Load raw materials inventory from Taiba Kitchen dedicated API
      const rawMaterialsResponse = await apiService.getTaibaKitchenRawMaterials({
        page: rmCurrentPage,
        limit: rmItemsPerPage,
        search: debouncedSearchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'materialName' : sortBy,
        sortOrder
      })

      console.log('📦 Raw Materials API Response:', {
        success: rawMaterialsResponse.success,
        dataLength: rawMaterialsResponse.data?.length || 0,
        pagination: rawMaterialsResponse.pagination
      })

      if (rawMaterialsResponse.success) {
        console.log('✅ Loaded Taiba Kitchen Raw Materials:', rawMaterialsResponse.data?.length || 0, 'items')
        
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
          
          // Update pagination state
          if (rawMaterialsResponse.pagination) {
            setRmTotalPages(rawMaterialsResponse.pagination.totalPages)
            setRmTotalItems(rawMaterialsResponse.pagination.totalItems)
          }
        } else {
          console.log('No raw materials inventory found for Taiba Kitchen')
          setInventoryItems([])
          setRmTotalPages(1)
          setRmTotalItems(0)
        }
      } else {
        console.error('Failed to load raw materials inventory:', (rawMaterialsResponse as any).error || 'API Error')
        setInventoryItems([])
        setRmTotalPages(1)
        setRmTotalItems(0)
      }

      // Load finished goods inventory from Taiba Kitchen dedicated API
      const finishedGoodsResponse = await apiService.getTaibaKitchenFinishedProducts({
        page: fgCurrentPage,
        limit: fgItemsPerPage,
        search: debouncedSearchTerm,
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
          
          // Update pagination state
          if (finishedGoodsResponse.pagination) {
            setFgTotalPages(finishedGoodsResponse.pagination.totalPages)
            setFgTotalItems(finishedGoodsResponse.pagination.totalItems)
          }
        } else {
          console.log('No finished goods inventory found for this outlet')
          setFinishedGoodInventoryItems([])
          setFgTotalPages(1)
          setFgTotalItems(0)
        }
      } else {
        console.error('Failed to load finished goods inventory:', (finishedGoodsResponse as any).error || 'API Error')
        setFinishedGoodInventoryItems([])
        setFgTotalPages(1)
        setFgTotalItems(0)
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
    try {
      setImporting(true)
      const lower = file.name.toLowerCase()
      const section = getCurrentSection()
      if (section === 'raw-materials') {
        if (!(lower.endsWith('.xlsx') || lower.endsWith('.xls'))) {
          alert('Please select an Excel file (.xlsx/.xls) for Raw Materials import')
          return
        }
        const res = await apiService.importTaibaKitchenRawMaterialsExcel(file)
        alert(res.message || 'Raw materials import completed')
        await loadInventory()
      } else if (section === 'finished-goods') {
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
        const res = await apiService.importTaibaKitchenFinishedProducts(products)
        alert(res.message || `Finished products import completed. Success: ${res.data?.successCount || 0}`)
        await loadInventory()
      }
    } catch (err) {
      console.error('Error importing file:', err)
      alert('Error importing file. Please check the file format.')
    } finally {
      setImporting(false)
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

        {/* Hidden file input for import now handled at page root */}

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
        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {rmTotalItems > 0 ? ((rmCurrentPage - 1) * rmItemsPerPage + 1) : 0} - {Math.min(rmCurrentPage * rmItemsPerPage, rmTotalItems)} of {rmTotalItems} raw material items
            {(debouncedSearchTerm || filterCategory || filterStatus) && (
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
        {/* Results Summary */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {fgTotalItems > 0 ? ((fgCurrentPage - 1) * fgItemsPerPage + 1) : 0} - {Math.min(fgCurrentPage * fgItemsPerPage, fgTotalItems)} of {fgTotalItems} finished goods items
            {(debouncedSearchTerm || filterCategory || filterStatus) && (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
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
          onViewTransferOrder={handleViewTransferOrder}
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