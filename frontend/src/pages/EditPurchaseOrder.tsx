import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { PurchaseOrder, PurchaseOrderItem } from '../types'

const EditPurchaseOrder: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [formData, setFormData] = useState({
    purchaseOrderNumber: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    supplierAddress: '',
    orderDate: '',
    expectedDeliveryDate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Draft' as 'Draft' | 'Approved' | 'Sent' | 'Received' | 'Cancelled',
    paymentTerms: 'Net 30',
    shippingMethod: 'Standard',
    totalAmount: 0,
    items: [] as PurchaseOrderItem[],
    notes: '',
    specialInstructions: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']
  const statusOptions = ['Draft', 'Approved', 'Sent', 'Received', 'Cancelled']
  const paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid']
  const shippingMethodOptions = ['Standard', 'Express', 'Overnight', 'Pickup']

  // Mock data - in real app, fetch from API
  const mockPurchaseOrder: PurchaseOrder = {
    id: '1',
    purchaseOrderNumber: 'PO-2024-001',
    supplierName: 'ABC Steel Suppliers',
    supplierContact: 'John Smith',
    supplierEmail: 'john@abcsteel.com',
    supplierAddress: '123 Industrial Street, Manufacturing District, City, State 12345',
    orderDate: new Date('2024-01-15'),
    expectedDeliveryDate: new Date('2024-02-15'),
    priority: 'High',
    status: 'Confirmed',
    paymentTerms: 'Net 30',
    shippingMethod: 'Express',
    totalAmount: 15750.00,
    items: [
      {
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        quantity: 100,
        unitPrice: 45.50,
        totalPrice: 4550.00,
        // specifications: 'Grade A, 12mm diameter',
        // deliveryDate: '2024-02-10'
      },
      {
        materialId: 'RM-002',
        materialCode: 'RM-002',
        materialName: 'Aluminum Sheet 2mm',
        quantity: 50,
        unitPrice: 125.00,
        totalPrice: 6250.00,
        // specifications: 'Anodized finish, Grade 6061',
        // deliveryDate: '2024-02-15'
      },
      {
        materialId: 'RM-003',
        materialCode: 'RM-003',
        materialName: 'Copper Wire 10 AWG',
        quantity: 200,
        unitPrice: 23.75,
        totalPrice: 4750.00,
        // specifications: 'Insulated, 10 AWG',
        // deliveryDate: '2024-02-12'
      }
    ],
    notes: 'Supplier requires advance payment for expedited delivery.',
    specialInstructions: 'All materials must be certified and include material certificates. Delivery to loading dock only.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFormData({
        purchaseOrderNumber: mockPurchaseOrder.poNumber,
        supplierName: mockPurchaseOrder.supplierName,
        supplierContact: 'John Smith',
        supplierEmail: 'john@abcsteel.com',
        supplierAddress: '123 Industrial Street',
        orderDate: mockPurchaseOrder.orderDate.toISOString().split('T')[0],
        expectedDeliveryDate: mockPurchaseOrder.expectedDeliveryDate.toISOString().split('T')[0],
        priority: 'High',
        status: 'Approved',
        paymentTerms: 'Net 30',
        shippingMethod: 'Express',
        totalAmount: mockPurchaseOrder.totalAmount,
        items: mockPurchaseOrder.items.map(item => ({
          ...item,
          totalAmount: item.totalPrice
        })),
        notes: mockPurchaseOrder.notes || '',
        specialInstructions: 'Special handling required'
      })
      setLoading(false)
    }, 500)
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.purchaseOrderNumber.trim()) {
      newErrors.purchaseOrderNumber = 'Purchase order number is required'
    }
    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required'
    }
    if (!formData.supplierEmail.trim()) {
      newErrors.supplierEmail = 'Supplier email is required'
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required'
    }
    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one purchase order item is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Calculate total amount
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

    const updatedPurchaseOrder: PurchaseOrder = {
      ...mockPurchaseOrder,
      poNumber: formData.purchaseOrderNumber,
      supplierName: formData.supplierName,
      // supplierContact: formData.supplierContact,
      supplierEmail: formData.supplierEmail,
      supplierAddress: formData.supplierAddress,
      orderDate: new Date(formData.orderDate),
      expectedDeliveryDate: new Date(formData.expectedDeliveryDate),
      priority: formData.priority,
      status: formData.status as 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled',
      paymentTerms: formData.paymentTerms,
      shippingMethod: formData.shippingMethod,
      totalAmount,
      items: formData.items,
      notes: formData.notes,
      specialInstructions: formData.specialInstructions,
      updatedAt: new Date(),
      updatedBy: 'admin'
    }

    console.log('Updating Purchase Order:', updatedPurchaseOrder)
    navigate('/purchase-orders')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addPurchaseOrderItem = () => {
    const newItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      totalAmount: 0
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const updatePurchaseOrderItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice
            // updatedItem.totalAmount = updatedItem.totalPrice
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const removePurchaseOrderItem = (index: number) => {
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
          <p className="mt-4 text-gray-600">Loading purchase order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Purchase Order</h1>
          <p className="text-gray-600">Update purchase order information</p>
        </div>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Purchase Orders
        </button>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Supplier Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Order Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.purchaseOrderNumber ? 'border-red-500' : ''}`}
                  value={formData.purchaseOrderNumber}
                  onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
                  placeholder="PO-2024-001"
                />
                {errors.purchaseOrderNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchaseOrderNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.supplierName ? 'border-red-500' : ''}`}
                  value={formData.supplierName}
                  onChange={(e) => handleInputChange('supplierName', e.target.value)}
                  placeholder="ABC Steel Suppliers"
                />
                {errors.supplierName && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Contact
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.supplierContact}
                  onChange={(e) => handleInputChange('supplierContact', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Email *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.supplierEmail ? 'border-red-500' : ''}`}
                  value={formData.supplierEmail}
                  onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                  placeholder="john@abcsteel.com"
                />
                {errors.supplierEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierEmail}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Address
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.supplierAddress}
                  onChange={(e) => handleInputChange('supplierAddress', e.target.value)}
                  placeholder="123 Industrial Street, Manufacturing District, City, State 12345"
                />
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
                  Payment Terms
                </label>
                <select
                  className="input-field"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                >
                  {paymentTermsOptions.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Method
                </label>
                <select
                  className="input-field"
                  value={formData.shippingMethod}
                  onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                >
                  {shippingMethodOptions.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Purchase Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Purchase Order Items</h3>
              <button
                type="button"
                onClick={addPurchaseOrderItem}
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
                <div key={index} className="grid grid-cols-7 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Code</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialCode}
                      onChange={(e) => updatePurchaseOrderItem(index, 'materialCode', e.target.value)}
                      placeholder="RM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialName}
                      onChange={(e) => updatePurchaseOrderItem(index, 'materialName', e.target.value)}
                      placeholder="Steel Rod"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.quantity}
                      onChange={(e) => updatePurchaseOrderItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field text-sm"
                      value={item.unitPrice}
                      onChange={(e) => updatePurchaseOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      className="input-field text-sm"
                      value=""
                      onChange={(e) => updatePurchaseOrderItem(index, 'deliveryDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Specifications</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value=""
                      onChange={(e) => updatePurchaseOrderItem(index, 'specifications', e.target.value)}
                      placeholder="Grade A, 12mm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removePurchaseOrderItem(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="col-span-7">
                    <div className="text-sm text-gray-600">
                      Total Amount: {(item.totalPrice || 0).toFixed(2)} KWD
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Order Amount: {formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)} KWD
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
                  placeholder="Special delivery instructions or quality requirements"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/purchase-orders')}
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
              Update Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPurchaseOrder
