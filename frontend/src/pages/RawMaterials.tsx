import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Filter, Download, Upload, RotateCcw, Truck } from 'lucide-react'
import { apiService } from '../services/api'
import { useConfirmation } from '../hooks/useConfirmation'

interface RawMaterialItem {
  _id: string
  materialCode: string
  materialName: string
  parentCategory: string
  subCategory: string
  unitOfMeasure: string
  description: string
  unitPrice: number
  currentStock: number
  locationStocks?: {
    centralKitchen: number
    kuwaitCity: number
    mall360: number
    vibesComplex: number
    taibaKitchen: number
  }
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  supplierId: string
  supplierName: string
  storageRequirements?: {
    temperature?: string
    humidity?: string
    specialConditions?: string
  }
  shelfLife: number
  status: string
  isActive: boolean
  createdBy: string
  updatedBy: string
  zohoItemId?: string
  lastSyncedAt?: Date
  zohoSyncStatus?: string
  createdAt: string
  updatedAt: string
}

const RawMaterials: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showAlert } = useConfirmation()
  
  const [materials, setMaterials] = useState<RawMaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStockStatus, setFilterStockStatus] = useState('')

  // Load materials on component mount only
  useEffect(() => {
    loadRawMaterials()
  }, [])

  // Handle search and filter changes without reloading the page
  useEffect(() => {
    // Apply filters to already loaded materials instead of reloading
    // This prevents page reload on every keystroke
  }, [searchTerm, filterCategory, filterStatus])

  const loadRawMaterials = async () => {
    try {
      setLoading(true)
      console.log('📦 Loading Ingredient Master from main database')
      
      // Load all materials without filters - filtering will be done on frontend
      const response = await apiService.getRawMaterials({
        limit: 1000
        // Removed search, category, and status filters to prevent API calls on every keystroke
      })

      if (response.success && response.data) {
        console.log('✅ Loaded Ingredient Master:', response.data.length, 'items')
        setMaterials(response.data)
      } else {
        console.log('⚠️  No materials found')
        setMaterials([])
      }
    } catch (err) {
      console.error('❌ Error loading materials:', err)
      showAlert('Error', `Failed to load materials: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncWithZoho = async () => {
    setSyncing(true)
    try {
      console.log('🔄 Starting Zoho Inventory Sync...')
      const response = await apiService.syncWithZohoRawMaterials()
      
      console.log('📊 ZOHO SYNC API RESPONSE:')
      console.log('='.repeat(60))
      console.log('Full Response:', response)
      console.log('='.repeat(60))
      console.log('Success:', response.success)
      console.log('Message:', response.message)
      console.log('Data:', response.data)
      console.log('='.repeat(60))
      
      if (response.success) {
        console.log('✅ Sync Details:')
        console.log('   • Total items processed:', response.data.totalItems)
        console.log('   • Items with SKU:', response.data.itemsWithSKU)
        console.log('   • Items without SKU (skipped):', response.data.itemsWithoutSKU)
        console.log('   • New items added:', response.data.addedItems)
        console.log('   • Items updated:', response.data.updatedItems)
        console.log('   • Errors:', response.data.errorItems)
        console.log('   • Sync timestamp:', response.data.syncTimestamp)
        console.log('='.repeat(60))
        
        showAlert(
          'Sync Completed Successfully!',
          `📊 Sync Results:\n• Total items processed: ${response.data.totalItems}\n• Items with SKU: ${response.data.itemsWithSKU}\n• Items without SKU (skipped): ${response.data.itemsWithoutSKU}\n• New items added: ${response.data.addedItems}\n• Items updated: ${response.data.updatedItems}\n• Errors: ${response.data.errorItems}\n\n🕒 Sync completed at: ${new Date(response.data.syncTimestamp).toLocaleString()}`,
          'success'
        )
        await loadRawMaterials() // Refresh inventory
      } else {
        console.error('❌ Sync failed:', response.message)
        showAlert('Sync Failed', response.message || 'Unknown error occurred during sync', 'error')
      }
    } catch (error) {
      console.error('💥 Sync Error:', error)
      showAlert(
        'Sync Failed',
        `Failed to sync with Zoho: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setSyncing(false)
      console.log('🏁 Sync process completed')
    }
  }

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum) return { status: 'Low', color: 'text-red-600 bg-red-100' }
    if (current <= minimum * 1.5) return { status: 'Medium', color: 'text-yellow-600 bg-yellow-100' }
    return { status: 'Good', color: 'text-green-600 bg-green-100' }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = filterCategory === '' || material.subCategory === filterCategory
    
    const matchesStatus = filterStatus === '' || 
                         (filterStatus === 'active' && material.isActive) ||
                         (filterStatus === 'inactive' && !material.isActive)
    
    const stockStatus = getStockStatus(material.currentStock, material.minimumStock)
    const matchesStockStatus = filterStockStatus === '' || stockStatus.status.toLowerCase() === filterStockStatus.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStockStatus
  })

  const categories = [...new Set(materials.map(m => m.subCategory))]

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await apiService.deleteRawMaterial(id)
        if (response.success) {
          showAlert('Success', 'Material deleted successfully', 'success')
          await loadRawMaterials()
        } else {
          showAlert('Error', 'Failed to delete material', 'error')
        }
      } catch (err) {
        showAlert('Error', `Error deleting material: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
        console.error('Error deleting material:', err)
      }
    }
  }

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvData = filteredMaterials.map(material => ({
        'SKU': material.materialCode,
        'Item Name': material.materialName,
        'Parent Category': material.parentCategory || 'Raw Materials',
        'SubCategory Name': material.subCategory,
        'Unit': material.unitOfMeasure,
        'Unit Price (KWD)': material.unitPrice?.toFixed(3) || '0.000',
        'Current Stock': material.currentStock,
        'Minimum Stock': material.minimumStock,
        'Status': material.status,
        'Supplier': material.supplierName || '',
        'Last Synced': material.lastSyncedAt ? new Date(material.lastSyncedAt).toLocaleString() : 'Never'
      }))

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `ingredient-master-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showAlert('Success', `Exported ${filteredMaterials.length} materials to CSV`, 'success')
    } catch (err) {
      showAlert('Error', `Failed to export: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
      console.error('Export failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ingredients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredient Master</h1>
          <p className="text-gray-600">Manage your restaurant ingredients and raw material inventory</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncWithZoho}
            disabled={syncing}
            className={`flex items-center ${syncing ? 'btn-disabled' : 'btn-primary'}`}
            title="Sync inventory with Zoho"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Inventory'}
          </button>
          <button
            onClick={() => navigate('/raw-materials/create-transfer')}
            className="btn-secondary flex items-center"
            title="Create transfer order"
          >
            <Truck className="h-4 w-4 mr-2" />
            Create Transfer
          </button>
          <button
            onClick={() => navigate('/raw-materials/add')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials by name, code, or description..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExport}
                disabled={filteredMaterials.length === 0}
                className={filteredMaterials.length === 0 ? "btn-disabled flex items-center" : "btn-secondary flex items-center"}
                title="Export to CSV"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
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

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                className="input-field"
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
              >
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="medium">Medium Stock</option>
                <option value="good">Good Stock</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredMaterials.length} of {materials.length} materials
              {(searchTerm || filterCategory || filterStatus || filterStockStatus) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">Central Kitchen</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Kuwait City</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">360 Mall</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-orange-50">Vibes Complex</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-pink-50">Taiba Kitchen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="text-gray-400">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No ingredients found</h3>
                        <p className="text-gray-600 mb-4">
                          {materials.length === 0 
                            ? 'Get started by syncing with Zoho Inventory or adding ingredients manually.' 
                            : 'Try adjusting your filters or search criteria.'}
                        </p>
                        {materials.length === 0 && (
                          <button
                            onClick={handleSyncWithZoho}
                            disabled={syncing}
                            className={`${syncing ? 'btn-disabled' : 'btn-primary'} inline-flex items-center`}
                          >
                            <RotateCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Inventory'}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                  const stockStatus = getStockStatus(material.currentStock, material.minimumStock)
                  return (
                    <tr key={material._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.materialCode}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{material.materialName}</div>
                        {material.description && (
                          <div className="text-xs text-gray-500">{material.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {material.subCategory}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{material.unitOfMeasure}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        KWD {material.unitPrice ? Number(material.unitPrice).toFixed(3) : '0.000'}
                      </td>
                      {/* Location Stocks */}
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-purple-900 bg-purple-50">
                        {material.locationStocks?.centralKitchen || 0}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-900 bg-blue-50">
                        {material.locationStocks?.kuwaitCity || 0}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-900 bg-green-50">
                        {material.locationStocks?.mall360 || 0}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-orange-900 bg-orange-50">
                        {material.locationStocks?.vibesComplex || 0}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-semibold text-pink-900 bg-pink-50">
                        {material.locationStocks?.taibaKitchen || 0}
                      </td>
                      {/* Total Stock */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {material.currentStock}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          material.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {material.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/raw-materials/edit/${material._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(material._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RawMaterials
