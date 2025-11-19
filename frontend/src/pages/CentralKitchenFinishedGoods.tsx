import React, { useState, useEffect, useRef } from 'react'
import { Package, TrendingDown, AlertTriangle, RefreshCw, Upload, Download } from 'lucide-react'
import { apiService } from '../services/api'
import { useConfirmation } from '../hooks/useConfirmation'
import ConfirmationModal from '../components/ConfirmationModal'
import NotificationDropdown from '../components/NotificationDropdown'
import TransferOrderModal, { TransferOrder } from '../components/TransferOrderModal'
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
}

interface StockChangeIndicator {
  amount: number
  type: 'increase' | 'decrease'
}

const INDICATOR_DURATION = 20000

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

const CentralKitchenFinishedGoods: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { confirmation, closeConfirmation } = useConfirmation()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('materialName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
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
  const [showTransferOrderModal, setShowTransferOrderModal] = useState(false)
  const [selectedTransferOrder, setSelectedTransferOrder] = useState<TransferOrder | null>(null)
  const [transferOrderLoading, setTransferOrderLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [stockChangeIndicators, setStockChangeIndicators] = useState<Record<string, StockChangeIndicator>>({})
  const indicatorTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const processedNotificationsRef = useRef<Set<string>>(new Set())
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications('Central Kitchen')
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  // Debounced search term - API will only be called after user stops typing for 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // Filter notifications to show Finished Goods transfer requests only
  const finishedGoodsNotifications = notifications.filter(notification => 
    (notification.isTransferOrder && 
     (notification.itemType === 'Finished Goods' || notification.itemType === 'Mixed') &&
     (notification.title?.includes('Transfer Request from Kuwait City') || 
      notification.title?.includes('Transfer Request from 360 Mall') ||
      notification.title?.includes('Transfer Request from Vibes Complex') ||
      notification.title?.includes('Transfer Request from Taiba Hospital'))) ||
    (notification.title?.includes('Items Received from Ingredient Master') &&
     notification.type === 'success')  // Fixed: frontend maps transfer_completed to success
  )

  // Debug logging for notifications
  useEffect(() => {
    console.log('🔔 Central Kitchen Finished Goods: All notifications:', notifications)
    console.log('🔔 Central Kitchen Finished Goods: Filtered notifications:', finishedGoodsNotifications)
    console.log('🔔 Central Kitchen Finished Goods: Number of all notifications:', notifications.length)
    console.log('🔔 Central Kitchen Finished Goods: Number of filtered notifications:', finishedGoodsNotifications.length)
  }, [notifications, finishedGoodsNotifications])

  // Auto-refresh notifications every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Central Kitchen Finished Goods: Auto-refreshing notifications...')
      refreshNotifications()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [refreshNotifications])

  // Detect when outlet manager accepts transfer and show indicator with final quantities
  useEffect(() => {
    const checkForOutletAcceptance = async () => {
      const now = Date.now()
      const MAX_NOTIFICATION_AGE = 30000 // Only process notifications from last 30 seconds
      
      // Find notifications about transfer completion/final approval
      const acceptanceNotifications = notifications.filter(notif => {
        if (!notif.transferOrderId) return false
        if (processedNotificationsRef.current.has(notif.id)) return false
        
        // Only process recent notifications (within last 30 seconds)
        const notificationAge = now - notif.timestamp.getTime()
        if (notificationAge > MAX_NOTIFICATION_AGE) return false
        
        const isAcceptanceNotification = (
          notif.title?.includes('Transfer Request Completed') ||
          notif.title?.includes('Transfer Request Approved by Outlet')
        )
        
        const isFinishedGood = (notif.itemType === 'Finished Goods' || notif.itemType === 'Mixed')
        const isSuccessType = notif.type === 'success' // transfer_acceptance maps to 'success'
        
        return isAcceptanceNotification && isFinishedGood && isSuccessType
      })

      for (const notification of acceptanceNotifications) {
        console.log('🔔 Central Kitchen Finished Goods: Detected outlet acceptance notification:', notification)
        processedNotificationsRef.current.add(notification.id)

        try {
          // Add a small delay to ensure backend has saved the updated transfer order
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Fetch the transfer order to get final accepted quantities
          const response = await apiService.getTransferOrderById(notification.transferOrderId!)
          if (response.success && response.data) {
            const transferOrder = response.data
            console.log('📦 Central Kitchen Finished Goods: Fetched transfer order after outlet acceptance:', transferOrder)
            console.log('📦 Transfer order items quantities:', transferOrder.items?.map((item: any) => ({
              itemCode: item.itemCode,
              productCode: item.productCode,
              quantity: item.quantity
            })))

            // Check transfer direction and show appropriate indicator
            const isFromCentralKitchen = matchesOutletName(transferOrder.fromOutlet, 'Central Kitchen')
            const isToCentralKitchen = matchesOutletName(transferOrder.toOutlet, 'Central Kitchen')
            
            console.log('🔍 Central Kitchen Finished Goods: Checking transfer order:', {
              status: transferOrder.status,
              itemType: transferOrder.itemType,
              firstItemType: transferOrder.items?.[0]?.itemType,
              isFromCentralKitchen,
              isToCentralKitchen,
              itemsCount: transferOrder.items?.length
            })
            
            // Check if this is a finished goods transfer (either by itemType or by checking items)
            const hasFinishedGoods = transferOrder.items?.some((item: any) => isFinishedGoodItem(item, transferOrder.itemType))
            const isFinishedGoodTransfer = transferOrder.itemType === 'Finished Goods' || transferOrder.itemType === 'Mixed' || hasFinishedGoods
            
            console.log('🔍 Central Kitchen Finished Goods: Transfer check:', {
              status: transferOrder.status === 'Approved',
              isFinishedGoodTransfer,
              hasFinishedGoods,
              itemType: transferOrder.itemType
            })
            
            if (transferOrder.status === 'Approved' && isFinishedGoodTransfer) {
              // Use final accepted quantities from transfer order items
              // For finished goods, itemCode in transfer order IS the productCode (since schema doesn't have productCode field)
              // So we use itemCode directly to match with inventory's productCode (stored as materialCode)
              const indicatorItems = (transferOrder.items || [])
                .filter((item: any) => isFinishedGoodItem(item, transferOrder.itemType))
                .map((item: any) => ({
                  materialCode: item.itemCode, // itemCode IS productCode for finished goods in transfer orders
                  materialId: item.materialId || item.productId,
                  itemCode: item.itemCode,
                  quantity: item.quantity, // This should be the final accepted quantity
                  itemType: item.itemType
                }))

              console.log('🔍 Central Kitchen Finished Goods: Indicator items after filtering:', indicatorItems)

              if (indicatorItems.length > 0) {
                // Central Kitchen → Outlet: show decrease (items going out)
                // Outlet → Central Kitchen: show increase (items coming in)
                const indicatorType = isFromCentralKitchen ? 'decrease' : 'increase'
                console.log(`📊 Central Kitchen Finished Goods: Showing ${indicatorType} indicator from notification (${isFromCentralKitchen ? 'CK → Outlet' : 'Outlet → CK'}):`, indicatorItems)
                console.log(`📊 Quantities being shown:`, indicatorItems.map(item => ({ code: item.materialCode, qty: item.quantity })))
                triggerStockChangeIndicators(indicatorItems, indicatorType)
                await loadInventory()
              } else {
                console.warn('⚠️ Central Kitchen Finished Goods: No indicator items found after filtering')
              }
            } else {
              console.log('⚠️ Central Kitchen Finished Goods: Transfer order not processed:', {
                status: transferOrder.status,
                isFinishedGoodTransfer,
                reason: transferOrder.status !== 'Approved' ? 'Status not Approved' : 'Not a finished goods transfer'
              })
            }
          }
        } catch (error) {
          console.error('Error fetching transfer order for indicator:', error)
        }
      }
    }

    checkForOutletAcceptance()
  }, [notifications])

  // Clear all indicators on component mount
  useEffect(() => {
    // Clear any existing indicators when component mounts
    setStockChangeIndicators({})
    // Clear all timeouts
    Object.values(indicatorTimeoutsRef.current).forEach(timeoutId => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    })
    indicatorTimeoutsRef.current = {}
    
    return () => {
      Object.values(indicatorTimeoutsRef.current).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    }
  }, [])

  useEffect(() => {
    loadCentralKitchenData()
  }, [])

  // Reload inventory when filters or pagination change
  // Use debouncedSearchTerm instead of searchTerm to avoid API calls on every keystroke
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1) // Reset to first page when filters change
      loadInventory()
    }
  }, [debouncedSearchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  // Reload inventory when page changes
  useEffect(() => {
    if (!loading && outlet) {
      loadInventory()
    }
  }, [currentPage, itemsPerPage])

  const loadCentralKitchenData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get central kitchen outlet from backend
      const outletsResponse = await apiService.getCentralKitchens()
      if (outletsResponse.success && outletsResponse.data && Array.isArray(outletsResponse.data) && outletsResponse.data.length > 0) {
        const centralKitchen = outletsResponse.data[0]
        setOutlet({
          id: centralKitchen._id,
          outletCode: centralKitchen.kitchenCode,
          outletName: centralKitchen.kitchenName,
          outletType: 'Central Kitchen',
          isCentralKitchen: true
        })
        await loadInventory()
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

  const loadInventory = async () => {
    try {
      console.log('Loading finished goods from Central Kitchen dedicated database')
      
      // Load finished goods from Central Kitchen dedicated database with pagination
      // Use debouncedSearchTerm to avoid API calls on every keystroke
      const inventoryResponse = await apiService.getCentralKitchenFinishedProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        subCategory: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'productName' : sortBy,
        sortOrder
      })

      if (inventoryResponse.success) {
        console.log('Loaded Central Kitchen Finished Goods:', inventoryResponse.data)
        console.log('Pagination info:', inventoryResponse.pagination)
        
        // Update pagination state
        if (inventoryResponse.pagination) {
          setTotalPages(inventoryResponse.pagination.totalPages)
          setTotalItems(inventoryResponse.pagination.totalItems)
        }
        
        if (inventoryResponse.data && Array.isArray(inventoryResponse.data) && inventoryResponse.data.length > 0) {
          // Transform the data to match the expected interface
          const transformedItems: OutletInventoryItem[] = inventoryResponse.data.map((item: any) => ({
            id: item._id || item.id,
            outletId: 'central-kitchen',
            outletCode: 'CK001',
            outletName: 'Central Kitchen',
            materialId: item._id,
            materialCode: item.productCode, // Finished goods use productCode
            materialName: item.productName, // Finished goods use productName
            category: item.subCategory,
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
            batchNumber: '',
            supplier: '',
            lastUpdated: item.lastStockUpdate || item.updatedAt,
            status: item.status,
            notes: item.notes || '',
            isActive: true
          }))
          
          setInventoryItems(transformedItems)
        } else {
          console.log('No finished goods inventory found for this central kitchen')
          setInventoryItems([])
          // Don't set error for empty inventory - show normal UI with empty state
        }
      } else {
        console.error('Failed to load finished goods inventory:', (inventoryResponse as any).error || 'API Error')
        setError(`Failed to load inventory from server: ${(inventoryResponse as any).error || 'Unknown error'}`)
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
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  const handleEditItem = (item: OutletInventoryItem) => {
    setEditingItem(item)
    setEditFormData({
      currentStock: item.currentStock.toString(),
      minimumStock: item.minimumStock.toString(),
      maximumStock: item.maximumStock.toString(),
      reorderPoint: item.reorderPoint.toString(),
      unitPrice: item.unitPrice.toString(),
      notes: item.notes || ''
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      setLoading(true)
      
      // Update the inventory item
      const updateData = {
        currentStock: Number.parseFloat(editFormData.currentStock) || 0,
        minimumStock: Number.parseFloat(editFormData.minimumStock) || 0,
        maximumStock: Number.parseFloat(editFormData.maximumStock) || 0,
        reorderPoint: Number.parseFloat(editFormData.reorderPoint) || 0,
        unitPrice: Number.parseFloat(editFormData.unitPrice) || 0,
        notes: editFormData.notes,
        updatedBy: 'user'
      }

      const response = await apiService.updateCentralKitchenFinishedProduct(editingItem.id, updateData)
      
      if (response.success) {
        alert('Finished product updated successfully!')
        setShowEditModal(false)
        setEditingItem(null)
        // Reload the inventory data
        await loadInventory()
      } else {
        throw new Error(response.message || 'Failed to update finished product')
      }
    } catch (err) {
      console.error('Error updating finished product:', err)
      alert(`Failed to update finished product: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
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

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadTemplate = async () => {
    try {
      // Create sample data for template
      const templateData = [
        {
          'SKU': 'psk-001',
          'Product Name': 'Sample Finished Good',
          'Sales Description': 'Sample finished good description',
          'Parent Category': 'Finish Product',
          'SubCategory Name': 'MAIN COURSES',
          'Unit': 'piece',
          'Unit Price': 10.50,
          'Cost Price': 7.25,
          'Current Quantity': 100,
          'Minimum Stock': 10,
          'Maximum Stock': 500,
          'Reorder Point': 25,
          'Status': 'Active',
          'Description': 'Sample product description',
          'Notes': 'Sample notes'
        }
      ]

      // Create workbook
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // SKU
        { wch: 25 }, // Product Name
        { wch: 30 }, // Sales Description
        { wch: 20 }, // Parent Category
        { wch: 20 }, // SubCategory Name
        { wch: 15 }, // Unit
        { wch: 12 }, // Unit Price
        { wch: 12 }, // Cost Price
        { wch: 12 }, // Current Quantity
        { wch: 12 }, // Minimum Stock
        { wch: 12 }, // Maximum Stock
        { wch: 12 }, // Reorder Point
        { wch: 10 }, // Status
        { wch: 30 }, // Description
        { wch: 30 }  // Notes
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Finished Goods Template')

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Download file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Central_Kitchen_Finished_Goods_Template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading template:', error)
      alert('Error downloading template: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please select an Excel file (.xlsx, .xls) or CSV file')
      return
    }

    try {
      setImportLoading(true)
      let products: any[] = []
      let parseErrors: string[] = []

      if (fileExtension === '.csv') {
        // Handle CSV files
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      const dataRows = lines.slice(1)
        products = dataRows.map((row, index) => {
        try {
            // Skip empty rows
            if (!row || row.trim() === '') {
              return null
            }
            
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          
            // Validate required fields
            if (!values[0] || !values[1] || values[0] === '' || values[1] === '') {
              parseErrors.push(`Row ${index + 2}: Missing product code or name`)
              return null
            }

            return {
              productCode: String(values[0] || '').trim(),
              productName: String(values[1] || '').trim(),
              salesDescription: String(values[2] || values[1] || '').trim(),
              subCategory: String(values[3] || 'MAIN COURSES').trim(), // Assuming SubCategory Name is in column 3
              unitOfMeasure: String(values[4] || 'piece').trim(),
              unitPrice: Number.parseFloat(values[5] || '0') || 0,
              costPrice: Number.parseFloat(values[6] || '0') || 0,
              currentStock: Number.parseFloat(values[7] || '0') || 0,
              minimumStock: Number.parseFloat(values[8] || '5') || 5,
              maximumStock: Number.parseFloat(values[9] || '100') || 100,
              reorderPoint: Number.parseFloat(values[10] || '10') || 10,
              status: String(values[11] || 'Active').trim(),
              description: String(values[12] || '').trim(),
              notes: String(values[13] || '').trim()
            }
          } catch (error) {
            parseErrors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`)
            return null
          }
        }).filter(Boolean)
      } else {
        // Handle Excel files
        const XLSX = await import('xlsx')
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          alert('Excel file must contain at least a header row and one data row')
          return
        }

        const headers = jsonData[0] as string[]
        const dataRows = jsonData.slice(1)
        
        products = (dataRows as any[]).map((row: any[], index) => {
          try {
            // Skip empty rows
            if (!row || row.every(cell => !cell || cell === '')) {
              return null
            }
            
            const getValue = (headerName: string) => {
              const headerIndex = headers.findIndex(h => 
                h && h.toLowerCase().includes(headerName.toLowerCase())
              )
              return headerIndex >= 0 ? String(row[headerIndex] || '') : ''
            }

            const productCode = getValue('sku') || getValue('product code') || ''
            const productName = getValue('product name') || getValue('item name') || getValue('sales description') || ''

            // Validate required fields
            if (!productCode || !productName || productCode === '' || productName === '') {
              parseErrors.push(`Row ${index + 2}: Missing product code or name`)
              return null
            }

            return {
              productCode: String(productCode || '').trim(),
              productName: String(productName || '').trim(),
              salesDescription: String(getValue('sales description') || productName || getValue('description') || '').trim(),
              subCategory: String(getValue('subcategory name') || getValue('subcategory') || getValue('category') || 'MAIN COURSES').trim(),
              unitOfMeasure: String(getValue('unit') || getValue('unit of measure') || 'piece').trim(),
              unitPrice: Number.parseFloat(getValue('unit price') || getValue('price') || '0') || 0,
              costPrice: Number.parseFloat(getValue('cost price') || getValue('cost') || '0') || 0,
              currentStock: Number.parseFloat(getValue('current quantity') || getValue('current stock') || getValue('quantity') || '0') || 0,
              minimumStock: Number.parseFloat(getValue('minimum stock') || '5') || 5,
              maximumStock: Number.parseFloat(getValue('maximum stock') || '100') || 100,
              reorderPoint: Number.parseFloat(getValue('reorder point') || '10') || 10,
              status: String(getValue('status') || 'Active').trim(),
              description: String(getValue('description') || '').trim(),
              notes: String(getValue('notes') || '').trim()
            }
          } catch (error) {
            parseErrors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`)
            return null
          }
        }).filter(Boolean)
      }

      // Show parse errors if any
      if (parseErrors.length > 0) {
        console.warn('Parse errors:', parseErrors)
        const errorMessage = `Found ${parseErrors.length} parsing errors:\n\n${parseErrors.slice(0, 10).join('\n')}${parseErrors.length > 10 ? `\n... and ${parseErrors.length - 10} more errors` : ''}`
        alert(errorMessage)
      }

      if (products.length === 0) {
        alert('No valid products found in the file. Please check that your file has the required columns: Product Code, Product Name')
        return
      }

      console.log(`Parsed ${products.length} products for import`)

      // Send to backend for import
      const response = await apiService.importCentralKitchenFinishedProducts(products)
      
      if (response.success) {
        const responseData = response.data as { successCount: number; errorCount: number; errors: string[] }
        const successCount = responseData?.successCount || 0
        const errorCount = responseData?.errorCount || 0
        
        let message = `Import completed!\n\nSuccessfully imported: ${successCount} items\nErrors: ${errorCount}`
        
        if (responseData?.errors && responseData.errors.length > 0) {
          console.warn('Import errors:', responseData.errors)
          message += `\n\nFirst few errors:\n${responseData.errors.slice(0, 5).join('\n')}`
        }
        
        alert(message)
        
        // Reload inventory to show imported items
        await loadInventory()
      } else {
        throw new Error(response.message || 'Import failed')
      }
    } catch (err) {
      console.error('Error importing file:', err)
      alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }



  const handleViewTransferOrder = async (transferOrderId: string) => {
    try {
      console.log('🔍 Central Kitchen Raw Materials: handleViewTransferOrder called with transferOrderId:', transferOrderId)
      setTransferOrderLoading(true)
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (response.success) {
        setSelectedTransferOrder(response.data as unknown as TransferOrder)
        setShowTransferOrderModal(true)
        console.log('✅ Central Kitchen Raw Materials: Transfer order modal opened successfully')
      } else {
        throw new Error(response.message || 'Failed to load transfer order')
      }
    } catch (error) {
      console.error('Error loading transfer order:', error)
      alert('Failed to load transfer order details')
    } finally {
      setTransferOrderLoading(false)
    }
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
      
      // Get transfer order details to determine item type and create notification
      console.log('Fetching transfer order details...')
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transfer order')
      }
      const transferOrder = response.data
      console.log('Transfer order details:', transferOrder)
      
      // Prepare approval data
      const approvalData: any = {
        approvedBy: 'Central Kitchen Manager',
        notes: notes || 'Transfer order approved by Central Kitchen'
      }
      
      // Include edited items if provided
      if (editedItems && editedItems.length > 0) {
        approvalData.editedItems = editedItems
        console.log('Including edited items in approval request:', editedItems)
      }
      
      // Approve transfer order (handles inventory updates and notifications automatically)
      console.log('Approving transfer order...')
      let approvalResponse
      
      try {
        approvalResponse = await apiService.approveTransferOrder(transferOrderId, approvalData)
        console.log('Approval response:', approvalResponse)
      } catch (error) {
        console.error('Approval failed:', error)
        throw new Error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      if (approvalResponse.success) {
        // Backend automatically handles inventory updates and notifications
        const hasModifications = editedItems && editedItems.some((item, index) => 
          item.quantity !== transferOrder.items[index]?.quantity
        )
        await loadInventory()

        // DO NOT show indicator here for Outlet → Central Kitchen transfers
        // The indicator will be shown when outlet accepts (via notification handler)
        // Only show indicator for Central Kitchen → Outlet transfers (which are immediate)

        alert(`Transfer order accepted successfully!${hasModifications ? ' (Quantities modified)' : ''}`)
        setShowTransferOrderModal(false)
        setSelectedTransferOrder(null)
        
        // Mark notification as read
        markAsRead(transferOrderId)
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
      
      // Get transfer order details first
      console.log('Fetching transfer order details...')
      const response = await apiService.getTransferOrderById(transferOrderId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch transfer order')
      }
      const transferOrder = response.data
      console.log('Transfer order details:', transferOrder)
      
      // Reject transfer order (handles notifications automatically)
      console.log('Rejecting transfer order...')
      let rejectionResponse
      
      try {
        rejectionResponse = await apiService.rejectTransferOrder(transferOrderId, {
          approvedBy: 'Central Kitchen Manager',
          notes: 'Transfer order rejected by Central Kitchen'
        })
        console.log('Rejection response:', rejectionResponse)
      } catch (error) {
        console.error('Rejection failed:', error)
        throw new Error(`Rejection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      if (rejectionResponse.success) {
        // Backend automatically handles notifications
        alert(`Transfer order rejected successfully!`)
        setShowTransferOrderModal(false)
        setSelectedTransferOrder(null)
        
        // Mark notification as read
        markAsRead(transferOrderId)
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

  const handleExport = async () => {
    try {
      setExportLoading(true)
      console.log('Starting export of finished goods...')
      
      await apiService.exportCentralKitchenFinishedProducts({
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

  // Calculate summary statistics (for current page only, as we're using pagination)
  // Note: For accurate totals across all pages, we'd need separate summary API endpoints
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventoryItems.filter(item => item.status === 'Low Stock').length
  const outOfStockItems = inventoryItems.filter(item => item.status === 'Out of Stock').length

  // Get unique categories
  const categories = [...new Set(inventoryItems.map(item => item.category))]




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
    <div className="space-y-6 relative">
      {/* Import Loading Overlay */}
      {importLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Importing Finished Goods</h3>
            <p className="text-gray-600">Please wait while we process your file...</p>
            <div className="mt-4 text-sm text-gray-500">
              This may take a few moments for large files
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finished Goods Inventory</h1>
            <p className="text-gray-600">Central Kitchen - {outlet?.outletName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-primary flex items-center"
            title="Export finished goods to Excel"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>
          <button
            onClick={loadCentralKitchenData}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <NotificationDropdown
            notifications={finishedGoodsNotifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            onViewTransferOrder={handleViewTransferOrder}
            onRefresh={refreshNotifications}
          />
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
              <p className="text-xs text-gray-500 mt-1">(across all pages)</p>
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
                placeholder="Search finished goods by name, code, or supplier..."
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
              onClick={handleDownloadTemplate}
              className="btn-secondary flex items-center"
              title="Download Excel template"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </button>
            <button 
              onClick={handleImport}
              disabled={importLoading}
              className="btn-secondary flex items-center disabled:opacity-50"
              title="Import finished goods from Excel/CSV"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importLoading ? 'Importing...' : 'Import'}
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
                <option value="materialName">Product Name</option>
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
            Showing {totalItems > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} finished goods items
            {(searchTerm || filterCategory || filterStatus) && (
              <span className="ml-2 text-blue-600">
                (filtered)
              </span>
            )}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
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

      {/* Finished Goods Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Finished Goods Inventory</h3>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No finished goods found</p>
                      <p className="text-gray-600 mb-4">Finished goods inventory is empty</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.materialCode}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.materialName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unitOfMeasure}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      KWD {item.unitPrice ? Number(item.unitPrice).toFixed(3) : '0.000'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 relative">
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  ‹ Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
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

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Raw Material: {editingItem.materialName}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock ({editingItem.unitOfMeasure})
                </label>
                <input
                  type="number"
                  value={editFormData.currentStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock ({editingItem.unitOfMeasure})
                </label>
                <input
                  type="number"
                  value={editFormData.minimumStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, minimumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock ({editingItem.unitOfMeasure})
                </label>
                <input
                  type="number"
                  value={editFormData.maximumStock}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maximumStock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Point ({editingItem.unitOfMeasure})
                </label>
                <input
                  type="number"
                  value={editFormData.reorderPoint}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, reorderPoint: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (KWD)
                </label>
                <input
                  type="number"
                  value={editFormData.unitPrice}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        onCancel={confirmation.onCancel}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        showCancel={confirmation.showCancel}
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

export default CentralKitchenFinishedGoods
