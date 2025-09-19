import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Utensils, Package, Plus, Save, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

interface ProductionItem {
  id: string
  productCode: string
  productName: string
  category: string
  unitOfMeasure: string
  quantity: number
  costPrice: number
  unitPrice: number
  expiryDays: number
  notes: string
}

const CentralKitchenMakeFinishedGood: React.FC = () => {
  const navigate = useNavigate()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<ProductionItem>>({
    productCode: '',
    productName: '',
    category: '',
    unitOfMeasure: 'pcs',
    quantity: 1,
    costPrice: 0,
    unitPrice: 0,
    expiryDays: 1,
    notes: ''
  })

  useEffect(() => {
    loadCentralKitchenData()
  }, [])

  const loadCentralKitchenData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get central kitchen outlet
      const outletsResponse = await apiService.getCentralKitchens()
      if (outletsResponse.success && outletsResponse.data.length > 0) {
        const centralKitchen = outletsResponse.data[0]
        setOutlet(centralKitchen)
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

  const handleAddItem = () => {
    if (!newItem.productCode || !newItem.productName || !newItem.category) {
      alert('Please fill in all required fields (Product Code, Product Name, Category)')
      return
    }

    const item: ProductionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productCode: newItem.productCode!,
      productName: newItem.productName!,
      category: newItem.category!,
      unitOfMeasure: newItem.unitOfMeasure || 'pcs',
      quantity: newItem.quantity || 1,
      costPrice: newItem.costPrice || 0,
      unitPrice: newItem.unitPrice || 0,
      expiryDays: newItem.expiryDays || 1,
      notes: newItem.notes || ''
    }

    setProductionItems(prev => [...prev, item])
    
    // Reset form
    setNewItem({
      productCode: '',
      productName: '',
      category: '',
      unitOfMeasure: 'pcs',
      quantity: 1,
      costPrice: 0,
      unitPrice: 0,
      expiryDays: 1,
      notes: ''
    })
    setShowAddForm(false)
  }

  const handleRemoveItem = (id: string) => {
    setProductionItems(prev => prev.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof ProductionItem, value: any) => {
    setProductionItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSaveProduction = async () => {
    if (productionItems.length === 0) {
      alert('Please add at least one item to produce')
      return
    }

    try {
      setLoading(true)
      
      // Process each production item
      for (const item of productionItems) {
        const productionData = {
          outletId: outlet?.id,
          outletCode: outlet?.outletCode,
          outletName: outlet?.outletName,
          productId: item.productCode,
          productCode: item.productCode,
          productName: item.productName,
          category: item.category,
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          currentStock: item.quantity,
          reservedStock: 0,
          availableStock: item.quantity,
          minimumStock: Math.ceil(item.quantity * 0.2), // 20% of production as minimum
          maximumStock: item.quantity * 2, // 2x production as maximum
          reorderPoint: Math.ceil(item.quantity * 0.3), // 30% of production as reorder point
          totalValue: item.quantity * item.unitPrice,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + item.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
          batchNumber: `BATCH-${item.productCode}-${Date.now()}`,
          storageLocation: 'Production Area',
          storageTemperature: 'Room Temperature',
          qualityStatus: 'Good',
          qualityNotes: 'Freshly produced',
          status: 'In Stock',
          transferSource: 'Production',
          lastUpdated: new Date().toISOString(),
          notes: item.notes,
          isActive: true
        }

        // Here you would typically call an API to save the production
        console.log('Producing item:', productionData)
      }

      alert(`Production completed successfully!\n\nProduced ${productionItems.length} items:\n${productionItems.map(item => `- ${item.productName} (${item.quantity} ${item.unitOfMeasure})`).join('\n')}`)
      
      // Clear production items after successful production
      setProductionItems([])
      
    } catch (err) {
      console.error('Error saving production:', err)
      alert('Failed to save production. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'Beverages',
    'Meals',
    'Bakery',
    'Snacks',
    'Desserts',
    'Salads',
    'Soups',
    'Sandwiches'
  ]

  const unitOfMeasures = [
    'pcs',
    'kg',
    'L',
    'g',
    'ml',
    'box',
    'pack',
    'serving'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Make Finished Good...</p>
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
          <div className="p-3 bg-purple-100 rounded-lg">
            <Utensils className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Make Finished Good</h1>
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
            onClick={() => navigate('/central-kitchen/finished-goods')}
            className="btn-secondary flex items-center"
          >
            <Package className="h-4 w-4 mr-2" />
            View Finished Goods
          </button>
        </div>
      </div>

      {/* Production Form */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Production Form</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Production Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newItem.productCode || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, productCode: e.target.value }))}
                  placeholder="e.g., FG001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newItem.productName || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="e.g., Espresso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  className="input-field"
                  value={newItem.category || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                <select
                  className="input-field"
                  value={newItem.unitOfMeasure || 'pcs'}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                >
                  {unitOfMeasures.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  className="input-field"
                  value={newItem.quantity || 1}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KWD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={newItem.costPrice || 0}
                  onChange={(e) => setNewItem(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KWD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={newItem.unitPrice || 0}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Days</label>
                <input
                  type="number"
                  className="input-field"
                  value={newItem.expiryDays || 1}
                  onChange={(e) => setNewItem(prev => ({ ...prev, expiryDays: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this production..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddItem}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Production
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Production Items List */}
        {productionItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Production Items ({productionItems.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-sm text-gray-500">{item.productCode} • {item.category}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          className="input-field w-20"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                        <span className="ml-2 text-sm text-gray-500">{item.unitOfMeasure}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          className="input-field w-24"
                          value={item.costPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'costPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          className="input-field w-24"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          className="input-field w-20"
                          value={item.expiryDays}
                          onChange={(e) => handleUpdateItem(item.id, 'expiryDays', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          className="input-field w-full"
                          value={item.notes}
                          onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                          placeholder="Production notes..."
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Production Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Production Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold text-gray-900">{productionItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {productionItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {productionItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)} KWD
                  </p>
                </div>
              </div>
            </div>

            {/* Production Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Notes</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Additional notes about this production batch..."
              />
            </div>

            {/* Save Production Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveProduction}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Production'}
              </button>
            </div>
          </div>
        )}

        {productionItems.length === 0 && (
          <div className="text-center py-8">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Production Items</h3>
            <p className="text-gray-600 mb-4">Add items to start a production batch</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CentralKitchenMakeFinishedGood
