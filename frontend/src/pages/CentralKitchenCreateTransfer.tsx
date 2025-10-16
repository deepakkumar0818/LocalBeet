import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Plus, Save, RefreshCw, ChevronDown, Search } from 'lucide-react'
import { apiService } from '../services/api'

// SearchableDropdown Component
interface SearchableDropdownProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select Item",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredOptions(
        options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">No items found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
  itemType: 'Raw Material' | 'Finished Goods'
  category: string
  subCategory?: string
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
  const [itemForms, setItemForms] = useState<Array<{id: string, data: Partial<TransferItem>}>>([])
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [finishedGoods, setFinishedGoods] = useState<any[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [transferData, setTransferData] = useState({
    toOutlet: '',
    transferDate: new Date().toISOString().split('T')[0],
    priority: 'Normal',
    notes: ''
  })

  useEffect(() => {
    loadCentralKitchenData()
    loadMaterialsData()
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

  const loadMaterialsData = async () => {
    try {
      setLoadingMaterials(true)
      console.log('Loading raw materials and finished goods data...')
      
      // Load raw materials from Central Kitchen dedicated database
      const rawMaterialsResponse = await apiService.getCentralKitchenRawMaterials({ limit: 1000 })
      if (rawMaterialsResponse.success) {
        setRawMaterials(rawMaterialsResponse.data)
        console.log('Loaded raw materials:', rawMaterialsResponse.data.length)
      } else {
        console.error('Failed to load raw materials:', (rawMaterialsResponse as any).error || 'API Error')
      }

      // Load finished goods from Central Kitchen dedicated database
      const finishedGoodsResponse = await apiService.getCentralKitchenFinishedProducts({ limit: 1000 })
      if (finishedGoodsResponse.success) {
        setFinishedGoods(finishedGoodsResponse.data)
        console.log('Loaded finished goods:', finishedGoodsResponse.data.length)
      } else {
        console.error('Failed to load finished goods:', (finishedGoodsResponse as any).error || 'API Error')
      }
    } catch (err) {
      console.error('Error loading materials data:', err)
    } finally {
      setLoadingMaterials(false)
    }
  }

  const handleAddItem = () => {
    console.log('Add Item button clicked!')
    // Add a new empty form
    const newFormId = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('Creating new form with ID:', newFormId)
    setItemForms(prev => {
      const newForms = [...prev, {
        id: newFormId,
        data: {
          itemType: 'Raw Material' as 'Raw Material' | 'Finished Goods',
          itemCode: '',
          itemName: '',
          category: '',
          unitOfMeasure: 'pcs',
          quantity: 1,
          unitPrice: 0,
          notes: ''
        }
      }]
      console.log('Updated forms array:', newForms)
      return newForms
    })
  }

  const handleUpdateForm = (formId: string, field: string, value: any) => {
    setItemForms(prev => prev.map(form => {
      if (form.id === formId) {
        const updatedForm = {
          ...form,
          data: {
            ...form.data,
            [field]: value
          }
        }
        
        // If itemType changes, reset itemCode and itemName
        if (field === 'itemType') {
          updatedForm.data.itemCode = ''
          updatedForm.data.itemName = ''
          updatedForm.data.category = ''
        }
        
        // If itemCode changes, update itemName and category based on selected item
        if (field === 'itemCode' && value) {
          const selectedItem = getSelectedItem(updatedForm.data.itemType || 'Raw Material', value)
          if (selectedItem) {
            updatedForm.data.itemName = selectedItem.materialName || selectedItem.productName || ''
            updatedForm.data.category = selectedItem.category || selectedItem.subCategory || ''
            updatedForm.data.unitOfMeasure = selectedItem.unitOfMeasure || 'pcs'
            updatedForm.data.unitPrice = selectedItem.unitPrice || 0
          }
        }
        
        return updatedForm
      }
      return form
    }))
  }

  const getSelectedItem = (itemType: string, itemCode: string) => {
    if (itemType === 'Raw Material') {
      return rawMaterials.find(item => item.materialCode === itemCode)
    } else if (itemType === 'Finished Goods') {
      return finishedGoods.find(item => item.productCode === itemCode)
    }
    return null
  }

  const handleRemoveForm = (formId: string) => {
    setItemForms(prev => prev.filter(form => form.id !== formId))
  }

  const handleCreateTransfer = async () => {
    if (itemForms.length === 0) {
      alert('Please add at least one item to transfer')
      return
    }

    if (!transferData.toOutlet) {
      alert('Please select a destination outlet')
      return
    }

    // Validate all forms have required fields
    const invalidForms = itemForms.filter(form => 
      !form.data.itemType || !form.data.itemCode || !form.data.itemName
    )

    if (invalidForms.length > 0) {
      alert(`Please fill in all required fields (Item Type, Item Code) for all items`)
      return
    }

    // Validate quantities are positive
    const invalidQuantities = itemForms.filter(form => 
      !form.data.quantity || form.data.quantity <= 0
    )

    if (invalidQuantities.length > 0) {
      alert(`Please enter valid quantities (greater than 0) for all items`)
      return
    }

    try {
      setLoading(true)
      
      // Convert forms to transfer items for API
      const transferItems = itemForms.map(form => ({
        itemType: form.data.itemType!,
        itemCode: form.data.itemCode!,
        itemName: form.data.itemName || form.data.itemCode!, // Include item name
        category: form.data.category || '',
        subCategory: form.data.subCategory || '',
        unitOfMeasure: form.data.unitOfMeasure || 'pcs',
        quantity: form.data.quantity || 1,
        unitPrice: form.data.unitPrice || 0,
        notes: form.data.notes || ''
      }))
      
      const transferPayload = {
        fromOutlet: outlet?.outletName || 'Central Kitchen',
        toOutlet: transferData.toOutlet,
        transferDate: transferData.transferDate,
        priority: transferData.priority,
        items: transferItems,
        totalValue: transferItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        notes: transferData.notes
      }

      console.log('Creating transfer with data:', transferPayload)

      // Call the transfer API
      console.log('🚀 Calling apiService.createTransfer...')
      const response = await apiService.createTransfer(transferPayload)
      console.log('📥 Transfer API response:', response)

      if (response.success) {
        // Notifications are now automatically created by the backend transfer API
        
        alert(`Transfer created successfully!\n\nTransfer Details:\nFrom: ${outlet?.outletName}\nTo: ${transferPayload.toOutlet}\nItems: ${transferItems.length}\nTotal Value: ${transferPayload.totalValue.toFixed(2)} KWD\n\nTransfer ID: ${response.data.transferId}\n\nStock has been updated in both Central Kitchen and destination outlet.${(transferPayload.toOutlet === 'Kuwait City' || transferPayload.toOutlet === '360 Mall' || transferPayload.toOutlet === 'Vibe Complex' || transferPayload.toOutlet === 'Taiba Hospital') ? `\n\nNotification sent to ${transferPayload.toOutlet}.` : ''}`)
        
        // Clear all forms and data after successful creation
        setItemForms([])
        setTransferData({
          toOutlet: '',
          transferDate: new Date().toISOString().split('T')[0],
          priority: 'Normal',
          notes: ''
        })

        // Refresh materials data to show updated stock levels
        await loadMaterialsData()
      } else {
        alert(`Transfer failed: ${response.message}`)
      }
      
    } catch (err) {
      console.error('❌ Error creating transfer:', err)
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        response: (err as any)?.response
      })
      alert(`Failed to create transfer order: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }



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
          <div className="flex gap-3">
            <button
              onClick={loadMaterialsData}
              disabled={loadingMaterials}
              className="btn-secondary flex items-center text-sm"
              title="Refresh materials data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingMaterials ? 'animate-spin' : ''}`} />
              {loadingMaterials ? 'Loading...' : 'Refresh Items'}
            </button>
            <button
              onClick={handleAddItem}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>

        {/* Multiple Item Forms */}
        {itemForms.map((form, index) => (
          <div key={form.id} className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Item #{index + 1}</h3>
              <button
                onClick={() => handleRemoveForm(form.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Remove Item
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type *</label>
                <select
                  className="input-field"
                  value={form.data.itemType || ''}
                  onChange={(e) => handleUpdateForm(form.id, 'itemType', e.target.value)}
                >
                  <option value="">Select Item Type</option>
                  <option value="Raw Material">Raw Material</option>
                  <option value="Finished Goods">Finished Goods</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Code *</label>
                <SearchableDropdown
                  value={form.data.itemCode || ''}
                  onChange={(value) => handleUpdateForm(form.id, 'itemCode', value)}
                  disabled={!form.data.itemType || loadingMaterials}
                  placeholder="Select Item"
                  options={
                    form.data.itemType === 'Raw Material' 
                      ? rawMaterials.map(item => ({
                          value: item.materialCode,
                          label: `${item.materialCode} - ${item.materialName}`
                        }))
                      : form.data.itemType === 'Finished Goods'
                      ? finishedGoods.map(item => ({
                          value: item.productCode,
                          label: `${item.productCode} - ${item.productName}`
                        }))
                      : []
                  }
                />
                {loadingMaterials && (
                  <p className="text-xs text-gray-500 mt-1">Loading items...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.data.itemName || ''}
                  readOnly
                  placeholder="Auto-filled from selection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.data.category || ''}
                  readOnly
                  placeholder="Auto-filled from selection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                <select
                  className="input-field"
                  value={form.data.unitOfMeasure || 'pcs'}
                  onChange={(e) => handleUpdateForm(form.id, 'unitOfMeasure', e.target.value)}
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
                  value={form.data.quantity || 1}
                  onChange={(e) => handleUpdateForm(form.id, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KWD)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={form.data.unitPrice || 0}
                  onChange={(e) => handleUpdateForm(form.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  min="0"
                  placeholder="Auto-filled from selection"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.data.notes || ''}
                  onChange={(e) => handleUpdateForm(form.id, 'notes', e.target.value)}
                  placeholder="Additional notes about this item..."
                />
              </div>
            </div>
          </div>
        ))}

        {/* Transfer Summary and Create Button */}
        {itemForms.length > 0 && (
          <div className="space-y-4">
            {/* Transfer Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Transfer Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold text-gray-900">{itemForms.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {itemForms.reduce((sum, form) => sum + (form.data.quantity || 1), 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {itemForms.reduce((sum, form) => sum + ((form.data.quantity || 1) * (form.data.unitPrice || 0)), 0).toFixed(2)} KWD
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
                {loading ? 'Creating Transfer Order...' : 'Create Transfer Order'}
              </button>
            </div>
          </div>
        )}

        {itemForms.length === 0 && (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Added</h3>
            <p className="text-gray-600 mb-4">Click "Add Item" to start adding items to your transfer order</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CentralKitchenCreateTransfer
