import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2, ChevronDown, Search } from 'lucide-react'
import { JobOrderItem, BillOfMaterials } from '../types'
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

const EditJobOrder: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [formData, setFormData] = useState({
    jobOrderNumber: '',
    customerName: '',
    customerContact: '',
    customerEmail: '',
    orderDate: '',
    deliveryDate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Draft' as 'Draft' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled',
    totalAmount: 0,
    items: [] as JobOrderItem[],
    notes: '',
    specialInstructions: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [boms, setBoms] = useState<BillOfMaterials[]>([])
  const [loadingBoms, setLoadingBoms] = useState(false)

  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']
  const statusOptions = ['Draft', 'Approved', 'In Progress', 'Completed', 'Cancelled']

  // Mock data removed - not used in the component

  useEffect(() => {
    const loadData = async () => {
      // Load BOMs first
      try {
        setLoadingBoms(true)
        const bomResponse = await apiService.getBillOfMaterials({
          limit: 1000,
          status: 'Active'
        })
        
        if (bomResponse.success) {
          setBoms(bomResponse.data)
        }
      } catch (error) {
        console.error('Error loading BOMs:', error)
      } finally {
        setLoadingBoms(false)
      }

      // Load Job Order
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await apiService.getJobOrder(id)
        
        if (response.success) {
          const jobOrder = response.data
          setFormData({
            jobOrderNumber: jobOrder.jobOrderNumber,
            customerName: jobOrder.customerName,
            customerContact: jobOrder.customerContact || '',
            customerEmail: jobOrder.customerEmail,
            orderDate: new Date(jobOrder.orderDate).toISOString().split('T')[0],
            deliveryDate: new Date(jobOrder.deliveryDate).toISOString().split('T')[0],
            priority: jobOrder.priority,
            status: jobOrder.status,
            totalAmount: jobOrder.totalAmount,
            items: jobOrder.items.map((item: any) => ({
              bomId: item.bomId,
              bomCode: item.bomCode,
              product: item.product,
              outletA: item.outletA,
              outletB: item.outletB,
              outletC: item.outletC,
              totalQuantity: item.totalQuantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            })),
            notes: jobOrder.notes || '',
            specialInstructions: jobOrder.specialInstructions || ''
          })
        } else {
          console.error('Failed to load job order:', 'API Error')
          alert('Failed to load job order: API Error')
        }
      } catch (error) {
        console.error('Error loading job order:', error)
        alert('Error loading job order: ' + (error instanceof Error ? error.message : 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.jobOrderNumber.trim()) {
      newErrors.jobOrderNumber = 'Job order number is required'
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required'
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required'
    }
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = 'Delivery date is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one job order item is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!id) {
      alert('Job Order ID is missing')
      return
    }

    try {
      // Calculate total amount
      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)

      const jobOrderData = {
        jobOrderNumber: formData.jobOrderNumber.trim().toUpperCase(),
        customerId: `CUST-${Date.now()}`,
        customerName: formData.customerName.trim(),
        customerContact: formData.customerContact.trim(),
        customerEmail: formData.customerEmail.trim(),
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority,
        status: formData.status,
        totalAmount,
        items: formData.items.map(item => ({
          bomId: item.bomId,
          bomCode: item.bomCode,
          product: item.product.trim(),
          outletA: parseFloat(item.outletA.toString()) || 0,
          outletB: parseFloat(item.outletB.toString()) || 0,
          outletC: parseFloat(item.outletC.toString()) || 0,
          totalQuantity: item.totalQuantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          totalPrice: item.totalPrice
        })),
        notes: formData.notes.trim(),
        specialInstructions: formData.specialInstructions.trim(),
        updatedBy: 'admin'
      }

      console.log('Updating Job Order:', jobOrderData)
      
      const response = await apiService.updateJobOrder(id, jobOrderData)
      
      if (response.success) {
        console.log('Job Order updated successfully:', response.data)
        navigate('/job-orders')
      } else {
        alert('Failed to update Job Order: ' + response.message)
      }
    } catch (error) {
      console.error('Error updating Job Order:', error)
      alert('Error updating Job Order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addJobOrderItem = () => {
    const newItem: JobOrderItem = {
      bomId: '',
      bomCode: '',
      product: '',
      outletA: 0,
      outletB: 0,
      outletC: 0,
      totalQuantity: 0,
      unitPrice: 0,
      totalPrice: 0
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const handleBOMSelection = (index: number, bomId: string) => {
    const selectedBOM = boms.find(bom => bom.id === bomId)
    if (selectedBOM) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i === index) {
            const updatedItem = {
              ...item,
              bomId: selectedBOM.id,
              bomCode: selectedBOM.bomCode,
              product: selectedBOM.productName,
              unitPrice: parseFloat((selectedBOM.totalCost / selectedBOM.items.length).toFixed(2)) // Average cost per item, rounded to 2 decimals
            }
            
            // Recalculate totals
            updatedItem.totalQuantity = updatedItem.outletA + updatedItem.outletB + updatedItem.outletC
            updatedItem.totalPrice = parseFloat((updatedItem.totalQuantity * updatedItem.unitPrice).toFixed(2))
            
            return updatedItem
          }
          return item
        })
      }))
    }
  }

  const updateJobOrderItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          
          // Auto-calculate totalQuantity when outletA, outletB, or outletC changes
          if (field === 'outletA' || field === 'outletB' || field === 'outletC') {
            updatedItem.totalQuantity = updatedItem.outletA + updatedItem.outletB + updatedItem.outletC
          }
          
          // Auto-calculate totalPrice when totalQuantity or unitPrice changes
          if (field === 'totalQuantity' || field === 'unitPrice' || field === 'outletA' || field === 'outletB' || field === 'outletC') {
            updatedItem.totalPrice = parseFloat((updatedItem.totalQuantity * updatedItem.unitPrice).toFixed(2))
          }
          
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeJobOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job Order</h1>
          <p className="text-gray-600">Update job order information</p>
        </div>
        <button
          onClick={() => navigate('/job-orders')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Orders
        </button>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Order Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.jobOrderNumber ? 'border-red-500' : ''}`}
                  value={formData.jobOrderNumber}
                  onChange={(e) => handleInputChange('jobOrderNumber', e.target.value)}
                  placeholder="JO-2024-001"
                />
                {errors.jobOrderNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobOrderNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="ABC Manufacturing Ltd."
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Contact
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.customerContact}
                  onChange={(e) => handleInputChange('customerContact', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.customerEmail ? 'border-red-500' : ''}`}
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="john@abcmfg.com"
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.orderDate ? 'border-red-500' : ''}`}
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
                />
                {errors.orderDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.deliveryDate ? 'border-red-500' : ''}`}
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                />
                {errors.deliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
                )}
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
            </div>
          </div>

          {/* Job Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Job Order Items</h3>
              <button
                type="button"
                onClick={addJobOrderItem}
                className="btn-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {errors.items && (
              <p className="mb-4 text-sm text-red-600">{errors.items}</p>
            )}

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-8 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Recipe (BOM)</label>
                    <SearchableDropdown
                      value={item.bomId || ''}
                      onChange={(value) => handleBOMSelection(index, value)}
                      placeholder="Select Recipe"
                      disabled={loadingBoms}
                      options={loadingBoms ? [] : boms.map(bom => ({
                        value: bom.id,
                        label: `${bom.bomCode} - ${bom.productName}`
                      }))}
                    />
                    {loadingBoms && (
                      <p className="text-xs text-gray-500 mt-1">Loading recipes...</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                    <input
                      type="text"
                      className="input-field text-sm bg-gray-100"
                      value={item.product}
                      readOnly
                      placeholder="Auto-filled from BOM"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field text-sm bg-gray-100"
                      value={item.unitPrice}
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Outlet A</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.outletA}
                      onChange={(e) => updateJobOrderItem(index, 'outletA', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Outlet B</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.outletB}
                      onChange={(e) => updateJobOrderItem(index, 'outletB', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Outlet C</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.outletC}
                      onChange={(e) => updateJobOrderItem(index, 'outletC', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total Quantity</label>
                    <input
                      type="number"
                      className="input-field text-sm bg-gray-100"
                      value={item.totalQuantity}
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeJobOrderItem(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="col-span-8">
                    <div className="text-sm text-gray-600">
                      Total Amount: {item.totalPrice.toFixed(2)} KWD
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Order Amount: {formData.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)} KWD
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
                  placeholder="Additional notes or comments"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Special manufacturing instructions or requirements"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/job-orders')}
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
              Update Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditJobOrder
