import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { JobOrderItem, BillOfMaterials } from '../types'
import { apiService } from '../services/api'

const AddJobOrder: React.FC = () => {
  const navigate = useNavigate()
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
  const [boms, setBoms] = useState<BillOfMaterials[]>([])
  const [loadingBoms, setLoadingBoms] = useState(false)

  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']
  const statusOptions = ['Draft', 'Approved', 'In Progress', 'Completed', 'Cancelled']

  useEffect(() => {
    loadBOMs()
  }, [])

  const loadBOMs = async () => {
    try {
      setLoadingBoms(true)
      const response = await apiService.getBillOfMaterials({
        limit: 1000,
        status: 'Active'
      })
      
      if (response.success) {
        setBoms(response.data)
      }
    } catch (error) {
      console.error('Error loading BOMs:', error)
    } finally {
      setLoadingBoms(false)
    }
  }

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
        createdBy: 'admin',
        updatedBy: 'admin'
      }

      console.log('Creating Job Order:', jobOrderData)
      
      const response = await apiService.createJobOrder(jobOrderData)
      
      if (response.success) {
        console.log('Job Order created successfully:', response.data)
        navigate('/job-orders')
      } else {
        alert('Failed to create Job Order: ' + response.message)
      }
    } catch (error) {
      console.error('Error creating Job Order:', error)
      alert('Error creating Job Order: ' + (error instanceof Error ? error.message : 'Unknown error'))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Job Order</h1>
          <p className="text-gray-600">Create a new job order for production</p>
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
                    <select
                      className="input-field text-sm"
                      value={item.bomId || ''}
                      onChange={(e) => handleBOMSelection(index, e.target.value)}
                    >
                      <option value="">Select Recipe</option>
                      {loadingBoms ? (
                        <option disabled>Loading recipes...</option>
                      ) : (
                        boms.map(bom => (
                          <option key={bom.id} value={bom.id}>
                            {bom.bomCode} - {bom.productName}
                          </option>
                        ))
                      )}
                    </select>
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
              Create Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddJobOrder
