import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Plus, Save, RefreshCw, X } from 'lucide-react'
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
  itemType: 'Raw Material'
  category: string
  subCategory?: string
  unitOfMeasure: string
  quantity: number
  unitPrice: number
  totalValue: number
  notes: string
}

const RawMaterialsCreateTransfer: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemForms, setItemForms] = useState<Array<{id: string, data: Partial<TransferItem>}>>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [transferData, setTransferData] = useState({
    toOutlet: '', // Not needed for auto-distribution
    transferDate: new Date().toISOString().split('T')[0],
    priority: 'Normal',
    notes: ''
  })
  const [autoDistributeMode, setAutoDistributeMode] = useState(true)
  const [outlets, setOutlets] = useState<Outlet[]>([])

  useEffect(() => {
    loadRawMaterialsData()
    loadOutlets()
  }, [])

  // Auto-distribute items based on location quantities
  const autoDistributeItems = () => {
    const itemsToDistribute: Array<{id: string, data: Partial<TransferItem>}> = []
    
    rawMaterials.forEach(material => {
      if (material.locationStocks) {
        // Check each location and add items that have stock
        Object.entries(material.locationStocks).forEach(([location, quantity]) => {
          const qty = quantity as number
          if (qty > 0) {
            const outletName = getOutletNameFromLocation(location)
            if (outletName) {
              itemsToDistribute.push({
                id: `${material.materialCode}-${location}-${Date.now()}`,
                data: {
                  itemCode: material.materialCode,
                  itemName: material.materialName,
                  itemType: 'Raw Material',
                  category: material.parentCategory,
                  subCategory: material.subCategory,
                  unitOfMeasure: material.unitOfMeasure,
                  quantity: qty,
                  unitPrice: material.unitPrice,
                  totalValue: qty * material.unitPrice,
                  notes: `Auto-distributed from Ingredient Master to ${outletName}`
                }
              })
            }
          }
        })
      }
    })
    
    setItemForms(itemsToDistribute)
  }

  const getOutletNameFromLocation = (location: string): string | null => {
    const locationMap: {[key: string]: string} = {
      'centralKitchen': 'Central Kitchen',
      'kuwaitCity': 'Kuwait City',
      'mall360': '360 Mall',
      'vibesComplex': 'Vibe Complex',
      'taibaKitchen': 'Taiba Hospital'
    }
    return locationMap[location] || null
  }

  const loadRawMaterialsData = async () => {
    try {
      setLoading(true)
      console.log('📦 Loading Ingredient Master for transfer creation')
      
      const response = await apiService.getRawMaterials({
        limit: 1000
      })

      if (response.success && response.data) {
        console.log('✅ Loaded materials for transfer:', response.data.length, 'items')
        setRawMaterials(response.data)
        
        // Auto-distribute items if in auto mode
        if (autoDistributeMode) {
          autoDistributeItems()
        }
      } else {
        console.log('⚠️  No materials found')
        setRawMaterials([])
      }
    } catch (err) {
      console.error('❌ Error loading materials:', err)
      setError(`Failed to load materials: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadOutlets = async () => {
    try {
      // Define the specific outlets we want to show
      const allowedOutlets = [
        { id: 'central-kitchen', outletCode: 'CK001', outletName: 'Central Kitchen', outletType: 'Central Kitchen', isCentralKitchen: true },
        { id: 'kuwait-city', outletCode: 'OUT-001', outletName: 'Kuwait City', outletType: 'Restaurant', isCentralKitchen: false },
        { id: '360-mall', outletCode: 'OUT-003', outletName: '360 Mall', outletType: 'Food Court', isCentralKitchen: false },
        { id: 'vibes-complex', outletCode: 'OUT-002', outletName: 'Vibes Complex', outletType: 'Cafe', isCentralKitchen: false },
        { id: 'taiba-hospital', outletCode: 'OUT-004', outletName: 'Taiba Hospital', outletType: 'Drive Thru', isCentralKitchen: false }
      ]
      
      setOutlets(allowedOutlets)
    } catch (err) {
      console.error('Error loading outlets:', err)
      setError(`Failed to load outlets: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const addItemForm = () => {
    const newId = Date.now().toString()
    setItemForms(prev => [...prev, {
      id: newId,
      data: {
        itemCode: '',
        itemName: '',
        itemType: 'Raw Material',
        category: '',
        unitOfMeasure: '',
        quantity: 0,
        unitPrice: 0,
        totalValue: 0,
        notes: ''
      }
    }])
  }

  const removeItemForm = (id: string) => {
    setItemForms(prev => prev.filter(form => form.id !== id))
  }

  const updateItemForm = (id: string, field: keyof TransferItem, value: any) => {
    setItemForms(prev => prev.map(form => {
      if (form.id === id) {
        const updatedData = { ...form.data, [field]: value }
        
        // Auto-calculate total value
        if (field === 'quantity' || field === 'unitPrice') {
          const quantity = field === 'quantity' ? value : form.data.quantity || 0
          const unitPrice = field === 'unitPrice' ? value : form.data.unitPrice || 0
          updatedData.totalValue = quantity * unitPrice
        }

        // Auto-fill item details when itemCode is selected
        if (field === 'itemCode') {
          const selectedMaterial = rawMaterials.find(material => material.materialCode === value)
          if (selectedMaterial) {
            updatedData.itemName = selectedMaterial.materialName
            updatedData.category = selectedMaterial.subCategory || selectedMaterial.parentCategory
            updatedData.unitOfMeasure = selectedMaterial.unitOfMeasure
            updatedData.unitPrice = selectedMaterial.unitPrice || 0
            updatedData.totalValue = (form.data.quantity || 0) * (selectedMaterial.unitPrice || 0)
          }
        }

        return { ...form, data: updatedData }
      }
      return form
    }))
  }

  const handleSubmit = async () => {
    try {
      setLoadingMaterials(true)
      
      if (itemForms.length === 0) {
        alert('No items to transfer')
        return
      }

      const validItems = itemForms.filter(form => 
        form.data.itemCode && 
        form.data.quantity && 
        form.data.quantity > 0
      )

      if (validItems.length === 0) {
        alert('Please ensure all items have valid codes and quantities')
        return
      }

      console.log('🚚 Starting auto-distribution transfer from Ingredient Master')
      console.log(`📦 Processing ${validItems.length} items`)

      // Group items by destination outlet
      const itemsByOutlet: {[outlet: string]: any[]} = {}
      
      validItems.forEach(form => {
        // Extract outlet from notes (format: "Auto-distributed from Ingredient Master to {Outlet}")
        const outletMatch = form.data.notes?.match(/to (\w+(?:\s+\w+)*)$/)
        const outlet = outletMatch ? outletMatch[1] : 'Central Kitchen'
        
        if (!itemsByOutlet[outlet]) {
          itemsByOutlet[outlet] = []
        }
        
        itemsByOutlet[outlet].push({
          itemCode: form.data.itemCode,
          itemName: form.data.itemName,
          itemType: 'Raw Material',
          category: form.data.category,
          subCategory: form.data.subCategory,
          unitOfMeasure: form.data.unitOfMeasure,
          quantity: form.data.quantity,
          unitPrice: form.data.unitPrice,
          totalValue: form.data.totalValue,
          notes: form.data.notes || ''
        })
      })

      console.log(`📍 Distributing to ${Object.keys(itemsByOutlet).length} outlets:`, Object.keys(itemsByOutlet))

      // Create transfer orders for each outlet
      const transferPromises = Object.entries(itemsByOutlet).map(async ([outlet, items]) => {
        const transferOrderData = {
          fromOutlet: 'Ingredient Master',
          toOutlet: outlet,
          transferDate: transferData.transferDate,
          priority: transferData.priority,
          notes: `Auto-distribution from Ingredient Master to ${outlet}`,
          items: items
        }

        console.log(`🚚 Creating transfer to ${outlet}:`, items.length, 'items')
        
        try {
          const response = await apiService.createTransferOrder(transferOrderData)
          
          if (response.success) {
            console.log(`✅ Transfer to ${outlet} created successfully:`, response.data.transferOrderId)
            return { outlet, success: true, transferId: response.data.transferOrderId }
          } else {
            console.error(`❌ Transfer to ${outlet} failed:`, response.message)
            return { outlet, success: false, error: response.message }
          }
        } catch (error) {
          console.error(`❌ Error creating transfer to ${outlet}:`, error)
          return { outlet, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      // Wait for all transfers to complete
      const results = await Promise.all(transferPromises)
      
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)
      
      console.log(`📊 Transfer Results: ${successful.length} successful, ${failed.length} failed`)
      
      if (successful.length > 0) {
        let message = `✅ Auto-distribution completed!\n\n`
        message += `📦 Successfully transferred to ${successful.length} outlets:\n`
        successful.forEach(result => {
          message += `• ${result.outlet}\n`
        })
        
        if (failed.length > 0) {
          message += `\n❌ Failed transfers:\n`
          failed.forEach(result => {
            message += `• ${result.outlet}: ${result.error}\n`
          })
        }
        
        alert(message)
        navigate('/raw-materials')
      } else {
        alert(`❌ All transfers failed. Please check the console for details.`)
      }

    } catch (err) {
      console.error('Error creating transfer order:', err)
      alert(`Error creating transfer order: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoadingMaterials(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transfer form...</p>
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
            onClick={() => window.location.reload()}
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Transfer Order</h1>
          <p className="text-gray-600">Transfer ingredients from Ingredient Master to outlet</p>
        </div>
        <button
          onClick={() => navigate('/raw-materials')}
          className="btn-secondary flex items-center"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </button>
      </div>

      {/* Transfer Details */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Transfer Details</h2>
        
        {/* Auto-Distribution Mode Toggle */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoDistribute"
              checked={autoDistributeMode}
              onChange={(e) => {
                setAutoDistributeMode(e.target.checked)
                if (e.target.checked) {
                  autoDistributeItems()
                } else {
                  setItemForms([])
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoDistribute" className="ml-2 text-sm font-medium text-gray-700">
              Auto-Distribute to All Outlets Based on Location Quantities
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            When enabled, items will be automatically distributed to outlets based on their current location quantities in Ingredient Master.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Outlet</label>
            <input
              type="text"
              value="Ingredient Master"
              disabled
              className="input-field bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Outlet {autoDistributeMode ? '(Auto-Distributed)' : '*'}
            </label>
            {autoDistributeMode ? (
              <input
                type="text"
                value="Multiple Outlets (Auto-Distributed)"
                disabled
                className="input-field bg-blue-100"
              />
            ) : (
              <select
                className="input-field"
                value={transferData.toOutlet}
                onChange={(e) => setTransferData(prev => ({ ...prev, toOutlet: e.target.value }))}
                required
              >
                <option value="">Select Destination</option>
                {outlets.map(outlet => (
                  <option key={outlet.id} value={outlet.outletName}>
                    {outlet.outletName}
                  </option>
                ))}
              </select>
            )}
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
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="input-field"
            rows={3}
            value={transferData.notes}
            onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes for this transfer..."
          />
        </div>
      </div>

      {/* Transfer Items */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transfer Items</h2>
          <button
            onClick={addItemForm}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>

        {itemForms.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Truck className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">No items added yet</p>
            <button
              onClick={addItemForm}
              className="btn-primary flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {itemForms.map((form, index) => (
              <div key={form.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                  <button
                    onClick={() => removeItemForm(form.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
                    <select
                      className="input-field"
                      value={form.data.itemCode || ''}
                      onChange={(e) => updateItemForm(form.id, 'itemCode', e.target.value)}
                      required
                    >
                      <option value="">Select Item</option>
                      {rawMaterials.map(material => (
                        <option key={material._id} value={material.materialCode}>
                          {material.materialCode} - {material.materialName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      className="input-field bg-gray-100"
                      value={form.data.itemName || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      className="input-field bg-gray-100"
                      value={form.data.unitOfMeasure || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KWD)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="input-field bg-gray-100"
                      value={form.data.unitPrice || ''}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      value={form.data.quantity || ''}
                      onChange={(e) => updateItemForm(form.id, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Value (KWD)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="input-field bg-gray-100"
                      value={form.data.totalValue || ''}
                      disabled
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.data.notes || ''}
                      onChange={(e) => updateItemForm(form.id, 'notes', e.target.value)}
                      placeholder="Item-specific notes..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary and Actions */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transfer Summary</h3>
            <p className="text-gray-600">
              {itemForms.length} item(s) • Total Value: KWD {itemForms.reduce((sum, item) => sum + (item.data.totalValue || 0), 0).toFixed(3)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/raw-materials')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loadingMaterials || itemForms.length === 0 || (!autoDistributeMode && !transferData.toOutlet)}
              className={`${loadingMaterials || itemForms.length === 0 || (!autoDistributeMode && !transferData.toOutlet) ? 'btn-disabled' : 'btn-primary'} flex items-center`}
            >
              {loadingMaterials ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Transfer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RawMaterialsCreateTransfer
