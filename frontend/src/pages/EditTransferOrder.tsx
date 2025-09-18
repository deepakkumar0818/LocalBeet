import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { TransferOrder, TransferOrderItem } from '../types'

const EditTransferOrder: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [formData, setFormData] = useState({
    transferNumber: '',
    fromWarehouseId: '',
    fromWarehouseName: '',
    toWarehouseId: '',
    toWarehouseName: '',
    transferDate: '',
    expectedDeliveryDate: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'In Transit' | 'Delivered' | 'Cancelled',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    totalAmount: 0,
    items: [] as TransferOrderItem[],
    requestedBy: '',
    approvedBy: '',
    receivedBy: '',
    transferType: 'Internal' as 'Internal' | 'External' | 'Emergency',
    reason: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const statusOptions = ['Draft', 'Approved', 'In Transit', 'Delivered', 'Cancelled']
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']
  const transferTypeOptions = ['Internal', 'External', 'Emergency']

  // Mock warehouse data - in real app, fetch from API
  const warehouses = [
    { id: 'WH-001', name: 'Main Warehouse' },
    { id: 'WH-002', name: 'Secondary Warehouse' },
    { id: 'WH-003', name: 'Cold Storage' },
    { id: 'WH-004', name: 'Hazardous Storage' }
  ]

  // Mock data - in real app, fetch from API
  const mockTransferOrder: TransferOrder = {
    id: '1',
    transferNumber: 'TO-2024-001',
    fromWarehouseId: 'WH-001',
    fromWarehouseName: 'Main Warehouse',
    toWarehouseId: 'WH-002',
    toWarehouseName: 'Secondary Warehouse',
    transferDate: new Date('2024-01-20'),
    expectedDeliveryDate: new Date('2024-01-22'),
    status: 'In Transit',
    priority: 'High',
    totalAmount: 15750.00,
    items: [
      {
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        quantity: 100,
        unitOfMeasure: 'KG',
        unitPrice: 45.50,
        totalPrice: 4550.00,
        remarks: 'High priority transfer'
      },
      {
        materialId: 'RM-002',
        materialCode: 'RM-002',
        materialName: 'Aluminum Sheet 2mm',
        quantity: 50,
        unitOfMeasure: 'SQM',
        unitPrice: 125.00,
        totalPrice: 6250.00,
        remarks: 'Handle with care'
      },
      {
        materialId: 'RM-003',
        materialCode: 'RM-003',
        materialName: 'Copper Wire 10 AWG',
        quantity: 200,
        unitOfMeasure: 'M',
        unitPrice: 23.75,
        totalPrice: 4750.00,
        remarks: 'Standard transfer'
      }
    ],
    requestedBy: 'John Smith',
    approvedBy: 'Manager Name',
    receivedBy: 'Warehouse Staff',
    transferType: 'Internal',
    reason: 'Inventory rebalancing between warehouses for better distribution',
    notes: 'Transfer approved for inventory optimization. Ensure proper handling of aluminum sheets.',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFormData({
        transferNumber: mockTransferOrder.transferNumber,
        fromWarehouseId: mockTransferOrder.fromWarehouseId,
        fromWarehouseName: mockTransferOrder.fromWarehouseName,
        toWarehouseId: mockTransferOrder.toWarehouseId,
        toWarehouseName: mockTransferOrder.toWarehouseName,
        transferDate: mockTransferOrder.transferDate.toISOString().split('T')[0],
        expectedDeliveryDate: mockTransferOrder.expectedDeliveryDate.toISOString().split('T')[0],
        status: mockTransferOrder.status,
        priority: mockTransferOrder.priority,
        totalAmount: mockTransferOrder.totalAmount,
        items: mockTransferOrder.items,
        requestedBy: mockTransferOrder.requestedBy,
        approvedBy: mockTransferOrder.approvedBy,
        receivedBy: mockTransferOrder.receivedBy,
        transferType: mockTransferOrder.transferType,
        reason: mockTransferOrder.reason,
        notes: mockTransferOrder.notes
      })
      setLoading(false)
    }, 500)
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.transferNumber.trim()) {
      newErrors.transferNumber = 'Transfer number is required'
    }
    if (!formData.fromWarehouseId) {
      newErrors.fromWarehouseId = 'From warehouse is required'
    }
    if (!formData.toWarehouseId) {
      newErrors.toWarehouseId = 'To warehouse is required'
    }
    if (!formData.transferDate) {
      newErrors.transferDate = 'Transfer date is required'
    }
    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required'
    }
    if (!formData.requestedBy.trim()) {
      newErrors.requestedBy = 'Requested by is required'
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one transfer item is required'
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
    const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)

    const updatedTransferOrder: TransferOrder = {
      ...mockTransferOrder,
      transferNumber: formData.transferNumber,
      fromWarehouseId: formData.fromWarehouseId,
      fromWarehouseName: formData.fromWarehouseName,
      toWarehouseId: formData.toWarehouseId,
      toWarehouseName: formData.toWarehouseName,
      transferDate: new Date(formData.transferDate),
      expectedDeliveryDate: new Date(formData.expectedDeliveryDate),
      status: formData.status,
      priority: formData.priority,
      totalAmount,
      items: formData.items,
      requestedBy: formData.requestedBy,
      approvedBy: formData.approvedBy,
      receivedBy: formData.receivedBy,
      transferType: formData.transferType,
      reason: formData.reason,
      notes: formData.notes,
      updatedAt: new Date(),
      updatedBy: 'admin'
    }

    console.log('Updating Transfer Order:', updatedTransferOrder)
    navigate('/transfer-orders')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleWarehouseChange = (field: 'fromWarehouseId' | 'toWarehouseId', warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId)
    const warehouseName = warehouse ? warehouse.name : ''
    
    if (field === 'fromWarehouseId') {
      setFormData(prev => ({ 
        ...prev, 
        fromWarehouseId: warehouseId,
        fromWarehouseName: warehouseName
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        toWarehouseId: warehouseId,
        toWarehouseName: warehouseName
      }))
    }
  }

  const addTransferOrderItem = () => {
    const newItem: TransferOrderItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
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

  const removeTransferOrderItem = (index: number) => {
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
          <p className="mt-4 text-gray-600">Loading transfer order data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Transfer Order</h1>
          <p className="text-gray-600">Update transfer order information</p>
        </div>
        <button
          onClick={() => navigate('/transfer-orders')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transfer Orders
        </button>
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
            </div>
          </div>

          {/* Warehouse Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Warehouse Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Warehouse *
                </label>
                <select
                  className={`input-field ${errors.fromWarehouseId ? 'border-red-500' : ''}`}
                  value={formData.fromWarehouseId}
                  onChange={(e) => handleWarehouseChange('fromWarehouseId', e.target.value)}
                >
                  <option value="">Select From Warehouse</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                {errors.fromWarehouseId && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Warehouse *
                </label>
                <select
                  className={`input-field ${errors.toWarehouseId ? 'border-red-500' : ''}`}
                  value={formData.toWarehouseId}
                  onChange={(e) => handleWarehouseChange('toWarehouseId', e.target.value)}
                >
                  <option value="">Select To Warehouse</option>
                  {warehouses.filter(w => w.id !== formData.fromWarehouseId).map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                {errors.toWarehouseId && (
                  <p className="mt-1 text-sm text-red-600">{errors.toWarehouseId}</p>
                )}
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

          {/* Personnel Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personnel Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested By *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.requestedBy ? 'border-red-500' : ''}`}
                  value={formData.requestedBy}
                  onChange={(e) => handleInputChange('requestedBy', e.target.value)}
                  placeholder="John Smith"
                />
                {errors.requestedBy && (
                  <p className="mt-1 text-sm text-red-600">{errors.requestedBy}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved By
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.approvedBy}
                  onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                  placeholder="Manager Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                  placeholder="Warehouse Staff"
                />
              </div>
            </div>
          </div>

          {/* Transfer Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transfer Items</h3>
              <button
                type="button"
                onClick={addTransferOrderItem}
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
                      onChange={(e) => updateTransferOrderItem(index, 'materialCode', e.target.value)}
                      placeholder="RM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialName}
                      onChange={(e) => updateTransferOrderItem(index, 'materialName', e.target.value)}
                      placeholder="Steel Rod"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.quantity}
                      onChange={(e) => updateTransferOrderItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.unitOfMeasure}
                      onChange={(e) => updateTransferOrderItem(index, 'unitOfMeasure', e.target.value)}
                      placeholder="KG"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field text-sm"
                      value={item.unitPrice}
                      onChange={(e) => updateTransferOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.remarks}
                      onChange={(e) => updateTransferOrderItem(index, 'remarks', e.target.value)}
                      placeholder="Notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTransferOrderItem(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="col-span-7">
                    <div className="text-sm text-gray-600">
                      Total Price: {item.totalPrice.toFixed(2)} KWD
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
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
                  Reason for Transfer *
                </label>
                <textarea
                  className={`input-field ${errors.reason ? 'border-red-500' : ''}`}
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Reason for material transfer"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                )}
              </div>

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
              onClick={() => navigate('/transfer-orders')}
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
              Update Transfer Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTransferOrder
