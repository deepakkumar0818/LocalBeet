import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, AlertTriangle, Store, Truck, RefreshCw, ShoppingCart } from 'lucide-react'
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

const DowntownRestaurant: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [finishedGoodInventoryItems, setFinishedGoodInventoryItems] = useState<FinishedGoodInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm] = useState('')
  const [filterCategory] = useState('')
  const [filterStatus] = useState('')
  const [sortBy] = useState('materialName')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const loadOutletData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get Kuwait City outlet
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success) {
        const downtownRestaurant = outletsResponse.data.find(outlet => outlet.outletCode === 'OUT-001')
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
          setError('No raw materials inventory found. Please add some raw materials to Kuwait City.')
        }
      } else {
        console.error('Failed to load raw materials inventory:', rawMaterialsResponse.message || 'API Error')
        setError(`Failed to load inventory from server: ${rawMaterialsResponse.message || 'Unknown error'}`)
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
            availableStock: item.currentStock,
            minimumStock: item.minimumStock,
            maximumStock: item.maximumStock,
            reorderPoint: item.reorderPoint,
            totalValue: item.currentStock * item.unitPrice,
            productionDate: new Date(),
            expiryDate: item.shelfLife ? new Date(Date.now() + item.shelfLife * 24 * 60 * 60 * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        console.error('Failed to load finished goods inventory:', finishedGoodsResponse.message || 'API Error')
        // Don't set error for finished goods as it's optional
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      console.error('Error loading inventory:', err)
    }
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
      const updateData = {
        currentStock: parseFloat(editFormData.currentStock),
        minimumStock: parseFloat(editFormData.minimumStock),
        maximumStock: parseFloat(editFormData.maximumStock),
        reorderPoint: parseFloat(editFormData.reorderPoint),
        unitPrice: parseFloat(editFormData.unitPrice),
        notes: editFormData.notes
      }

      const response = await apiService.updateOutletInventoryItem(editingItem.id, updateData)
      
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
        alert(`Failed to update inventory item: ${response.message}`)
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

      const response = await apiService.updateFinishedGoodInventoryItem(editingFinishedGood.id, updateData)
      
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
        alert(`Failed to update finished good inventory item: ${response.message}`)
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

      // const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
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
              outletId: 'downtown-restaurant-001',
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
              outletId: 'downtown-restaurant-001',
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
          </div>
        </div>
        {/* Raw Materials Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitOfMeasure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditItem(item)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditFinishedGood(item)}
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

  const renderSalesOrdersSection = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">POS Sales</h2>
          <button
            onClick={() => navigate('/downtown-restaurant/pos-sales/create-order', { 
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
            onClick={() => navigate('/downtown-restaurant/pos-sales/create-order', { 
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/downtown-restaurant/raw-materials')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/downtown-restaurant/finished-goods')}>
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
        <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/downtown-restaurant/sales-orders')}>
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
            onClick={loadOutletData}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          {currentSection === 'raw-materials' && (
            <button
              onClick={() => navigate('/transfer-orders/add?from=kuwait-city&section=raw-materials')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Raw Materials
            </button>
          )}
          {currentSection === 'finished-goods' && (
            <button
              onClick={() => navigate('/transfer-orders/add?from=kuwait-city&section=finished-goods')}
              className="btn-primary flex items-center"
            >
              <Truck className="h-4 w-4 mr-2" />
              Request Finished Goods
            </button>
          )}
          {currentSection !== 'sales-orders' && currentSection !== 'raw-materials' && currentSection !== 'finished-goods' && (
            <button
              onClick={() => navigate('/transfer-orders/add?from=kuwait-city')}
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

export default DowntownRestaurant