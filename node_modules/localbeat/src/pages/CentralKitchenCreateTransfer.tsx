import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, Plus, Save, RefreshCw, ArrowRight } from 'lucide-react'
import { apiService } from '../services/api'

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

interface TransferItem {
  id: string
  itemCode: string
  itemName: string
  category: string
  unitOfMeasure: string
  quantity: number
  unitPrice: number
  totalValue: number
  notes: string
}

const CentralKitchenCreateTransfer: React.FC = () => {
  const navigate = useNavigate()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<TransferItem>>({
    itemCode: '',
    itemName: '',
    category: '',
    unitOfMeasure: 'pcs',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  })
  const [transferData, setTransferData] = useState({
    toOutlet: '',
    transferDate: new Date().toISOString().split('T')[0],
    priority: 'Normal',
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
    if (!newItem.itemCode || !newItem.itemName || !newItem.category) {
      alert('Please fill in all required fields (Item Code, Item Name, Category)')
      return
    }

    const item: TransferItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemCode: newItem.itemCode!,
      itemName: newItem.itemName!,
      category: newItem.category!,
      unitOfMeasure: newItem.unitOfMeasure || 'pcs',
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
      totalValue: (newItem.quantity || 1) * (newItem.unitPrice || 0),
      notes: newItem.notes || ''
    }

    setTransferItems(prev => [...prev, item])
    
    // Reset form
    setNewItem({
      itemCode: '',
      itemName: '',
      category: '',
      unitOfMeasure: 'pcs',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    })
    setShowAddForm(false)
  }

  const handleRemoveItem = (id: string) => {
    setTransferItems(prev => prev.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof TransferItem, value: any) => {
    setTransferItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalValue = updatedItem.quantity * updatedItem.unitPrice
        }
        return updatedItem
      }
      return item
    }))
  }

  const handleCreateTransfer = async () => {
    if (transferItems.length === 0) {
      alert('Please add at least one item to transfer')
      return
    }

    if (!transferData.toOutlet) {
      alert('Please select a destination outlet')
      return
    }

    try {
      setLoading(true)
      
      const transferOrder = {
        fromOutletId: outlet?.id,
        fromOutletCode: outlet?.outletCode,
        fromOutletName: outlet?.outletName,
        toOutlet: transferData.toOutlet,
        transferDate: transferData.transferDate,
        priority: transferData.priority,
        status: 'Pending',
        items: transferItems,
        totalValue: transferItems.reduce((sum, item) => sum + item.totalValue, 0),
        notes: transferData.notes,
        createdDate: new Date().toISOString(),
        createdBy: 'Central Kitchen User'
      }

      // Here you would typically call an API to create the transfer order
      console.log('Creating transfer order:', transferOrder)

      alert(`Transfer order created successfully!\n\nTransfer Details:\nFrom: ${outlet?.outletName}\nTo: ${transferData.toOutlet}\nItems: ${transferItems.length}\nTotal Value: ${transferOrder.totalValue.toFixed(2)} KWD\n\nTransfer ID: TR-${Date.now()}`)
      
      // Clear transfer data after successful creation
      setTransferItems([])
      setTransferData({
        toOutlet: '',
        transferDate: new Date().toISOString().split('T')[0],
        priority: 'Normal',
        notes: ''
      })
      
    } catch (err) {
      console.error('Error creating transfer:', err)
      alert('Failed to create transfer order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'Raw Materials',
    'Finished Goods',
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

  const destinationOutlets = [
    'Kuwait City',
    '360 Mall',
    'Vibes Complex',
    'Taiba Hospital'
  ]

  const priorities = [
    'Low',
    'Normal',
    'High',
    'Urgent'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Create Transfer...</p>
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Transfer</h1>
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
            onClick={() => navigate('/transfer-orders')}
            className="btn-secondary flex items-center"
          >
            <Truck className="h-4 w-4 mr-2" />
            View All Transfers
          </button>
        </div>
      </div>

      {/* Transfer Details */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Transfer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Outlet</label>
            <input
              type="text"
              className="input-field"
              value={outlet?.outletName || 'Central Kitchen'}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Outlet *</label>
            <select
              className="input-field"
              value={transferData.toOutlet}
              onChange={(e) => setTransferData(prev => ({ ...prev, toOutlet: e.target.value }))}
            >
              <option value="">Select Destination</option>
              {destinationOutlets.map(outlet => (
                <option key={outlet} value={outlet}>{outlet}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
            <input
              type="date"
              className="input-field"
              value={transferData.transferDate}
              onChange={(e) => setTransferData(prev => ({ ...prev, transferDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="input-field"
              value={transferData.priority}
              onChange={(e) => setTransferData(prev => ({ ...prev, priority: e.target.value }))}
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Notes</label>
          <textarea
            className="input-field"
            rows={2}
            value={transferData.notes}
            onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about this transfer..."
          />
        </div>
      </div>

      {/* Transfer Items */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Transfer Items</h2>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Transfer Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newItem.itemCode || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, itemCode: e.target.value }))}
                  placeholder="e.g., RM001 or FG001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newItem.itemName || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                  placeholder="e.g., Flour or Espresso"
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
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this item..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddItem}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Transfer
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

        {/* Transfer Items List */}
        {transferItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Transfer Items ({transferItems.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transferItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">{item.itemCode} • {item.category}</div>
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
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {item.totalValue.toFixed(2)} KWD
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          className="input-field w-full"
                          value={item.notes}
                          onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                          placeholder="Item notes..."
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

            {/* Transfer Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Transfer Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold text-gray-900">{transferItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {transferItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {transferItems.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)} KWD
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="text-xl font-semibold text-gray-900">{transferData.priority}</p>
                </div>
              </div>
            </div>

            {/* Create Transfer Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCreateTransfer}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </div>
        )}

        {transferItems.length === 0 && (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transfer Items</h3>
            <p className="text-gray-600 mb-4">Add items to create a transfer order</p>
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

export default CentralKitchenCreateTransfer
