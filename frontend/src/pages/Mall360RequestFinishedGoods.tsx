import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2, Package, ChevronDown, Search } from 'lucide-react'
import { TransferOrderItem } from '../types'
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

const Mall360RequestFinishedGoods: React.FC = () => {
  const navigate = useNavigate()
  const [finishedGoods, setFinishedGoods] = useState<any[]>([])
  const [formData, setFormData] = useState({
    transferNumber: '',
    fromWarehouseId: '360 Mall',
    fromWarehouseName: '360 Mall',
    toWarehouseId: 'Central Kitchen',
    toWarehouseName: 'Central Kitchen',
    transferDate: '',
    expectedDeliveryDate: '',
    status: 'Pending' as 'Draft' | 'Pending' | 'Approved' | 'In Transit' | 'Delivered' | 'Cancelled',
    priority: 'Normal' as 'Low' | 'Medium' | 'High' | 'Urgent' | 'Normal',
    totalAmount: 0,
    items: [] as TransferOrderItem[],
    transferType: 'Internal' as 'Internal' | 'External' | 'Emergency',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Set dates
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const transferNumber = `TR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      setFormData(prev => ({
        ...prev,
        transferNumber: transferNumber,
        transferDate: today,
        expectedDeliveryDate: tomorrow
      }))

      // Load 360 Mall finished goods
      const finishedGoodsResponse = await apiService.get360MallFinishedProducts({
        limit: 1000
      })

      if (finishedGoodsResponse.success && finishedGoodsResponse.data) {
        setFinishedGoods(finishedGoodsResponse.data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTransferOrderItem = () => {
    const newItem: TransferOrderItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
      itemType: 'finished-good',
      quantity: 0,
      unitOfMeasure: '',
      unitPrice: 0,
      totalPrice: 0,
      remarks: ''
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const updateTransferOrderItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const handleProductCodeChange = (index: number, productCode: string) => {
    const item = formData.items[index]
    if (!item) return

    const selectedProduct = finishedGoods.find(fg => fg.productCode === productCode)

    if (selectedProduct) {
      updateTransferOrderItem(index, 'materialId', selectedProduct.id || selectedProduct._id)
      updateTransferOrderItem(index, 'materialCode', productCode)
      updateTransferOrderItem(index, 'materialName', selectedProduct.productName)
      updateTransferOrderItem(index, 'unitOfMeasure', selectedProduct.unitOfMeasure)
      updateTransferOrderItem(index, 'unitPrice', selectedProduct.unitPrice)
    } else {
      updateTransferOrderItem(index, 'materialId', '')
      updateTransferOrderItem(index, 'materialCode', productCode)
      updateTransferOrderItem(index, 'materialName', '')
      updateTransferOrderItem(index, 'unitOfMeasure', '')
      updateTransferOrderItem(index, 'unitPrice', 0)
    }
  }

  const removeTransferOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.transferNumber.trim()) {
      newErrors.transferNumber = 'Transfer number is required'
    }
    if (!formData.transferDate) {
      newErrors.transferDate = 'Transfer date is required'
    }
    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one transfer item is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const transferOrderData = {
        fromOutlet: '360 Mall',
        toOutlet: 'Central Kitchen',
        transferDate: formData.transferDate,
        priority: formData.priority,
        items: formData.items.map(item => ({
          itemType: 'Finished Goods',
          itemCode: item.materialCode || '',
          itemName: item.materialName || '',
          category: '',
          subCategory: '',
          unitOfMeasure: item.unitOfMeasure,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.remarks
        })),
        notes: formData.notes,
        requestedBy: '360 Mall Manager'
      }

      const response = await apiService.createTransferOrder(transferOrderData)

      if (response.success) {
        // Send notification to Central Kitchen
        try {
          const itemTypes = formData.items.map(() => 'Finished Goods')
          const uniqueItemTypes = [...new Set(itemTypes)]
          const itemType = uniqueItemTypes.length === 1 ? uniqueItemTypes[0] : 'Mixed'
          
          const itemDetails = formData.items.map(item => 
            `${item.materialName} (${item.quantity} ${item.unitOfMeasure})`
          ).join(', ')
          
          const notificationData = {
            title: `Transfer Request from 360 Mall - ${itemType}`,
            message: `Transfer order #${transferOrderData.fromOutlet}-${Date.now()} from 360 Mall. Items: ${itemDetails}`,
            type: 'transfer_request',
            targetOutlet: 'Central Kitchen',
            sourceOutlet: '360 Mall',
            transferOrderId: response.data._id || response.data.id || response.data.transferId || null,
            itemType: itemType,
            priority: formData.priority === 'Urgent' ? 'high' : 'normal'
          }
          
          const notificationResponse = await apiService.createNotification(notificationData)
          console.log('Notification sent to Central Kitchen:', notificationResponse)
          
        } catch (notificationError) {
          console.error('Failed to send notification to Central Kitchen:', notificationError)
        }
        
        alert('Transfer order created successfully!')
        navigate('/360-mall/finished-goods')
      } else {
        throw new Error(response.message || 'Failed to create transfer order')
      }
    } catch (error) {
      console.error('Error creating transfer order:', error)
      alert('Error creating transfer order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const statusOptions = ['Draft', 'Approved', 'In Transit', 'Delivered', 'Cancelled']
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent', 'Normal']
  const transferTypeOptions = ['Internal', 'External', 'Emergency']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transfer order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/360-mall/finished-goods')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Finished Goods
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Request Finished Goods</h1>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.transferNumber ? 'border-red-500' : ''}`}
                  value={formData.transferNumber}
                  onChange={(e) => handleInputChange('transferNumber', e.target.value)}
                  placeholder="TO-2024-001"
                />
                {errors.transferNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.transferNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Type
                </label>
                <select
                  className="input-field"
                  value={formData.transferType}
                  onChange={(e) => handleInputChange('transferType', e.target.value)}
                >
                  {transferTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  className="input-field"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.transferDate ? 'border-red-500' : ''}`}
                  value={formData.transferDate}
                  onChange={(e) => handleInputChange('transferDate', e.target.value)}
                />
                {errors.transferDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.transferDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.expectedDeliveryDate ? 'border-red-500' : ''}`}
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                />
                {errors.expectedDeliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedDeliveryDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Finished Goods Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Finished Goods ({finishedGoods.length} available)
              </h3>
              <button
                type="button"
                onClick={addTransferOrderItem}
                className="btn-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Finished Good
              </button>
            </div>
            
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No finished goods added yet</p>
                <p className="text-sm">Click "Add Finished Good" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-8 gap-3 p-4 border border-gray-200 rounded-lg bg-green-50">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product Code</label>
                      <SearchableDropdown
                        value={item.materialCode}
                        onChange={(value) => handleProductCodeChange(index, value)}
                        placeholder="Select Finished Good"
                        options={finishedGoods.map(fg => ({
                          value: fg.productCode,
                          label: `${fg.productCode} - ${fg.productName}`
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        className="input-field text-sm bg-gray-100"
                        value={item.materialName}
                        placeholder="Product Name"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        className="input-field text-sm w-24"
                        value={item.quantity}
                        onChange={(e) => updateTransferOrderItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        className="input-field text-sm bg-gray-100"
                        value={item.unitOfMeasure}
                        placeholder="Unit"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field text-sm bg-gray-100"
                        value={item.unitPrice}
                        placeholder="0.00"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={item.remarks || ''}
                        onChange={(e) => updateTransferOrderItem(index, 'remarks', e.target.value)}
                        placeholder="Notes"
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeTransferOrderItem(index)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="col-span-8">
                      <div className="text-sm text-gray-600">
                        Total Price: {item.totalPrice.toFixed(2)} KWD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Transfer Amount: {formData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} KWD
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or special instructions"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/360-mall/finished-goods')}
              className="btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Transfer Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Mall360RequestFinishedGoods
