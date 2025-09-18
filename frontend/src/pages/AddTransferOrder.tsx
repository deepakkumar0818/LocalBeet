import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { TransferOrder, TransferOrderItem } from '../types'
import { apiService } from '../services/api'

const AddTransferOrder: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isFromCentralKitchen, setIsFromCentralKitchen] = useState(false)
  const [outlets, setOutlets] = useState<any[]>([])
  const [centralKitchen, setCentralKitchen] = useState<any>(null)
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
    transferType: 'Internal' as 'Internal' | 'External' | 'Emergency',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if coming from Central Kitchen
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const fromParam = urlParams.get('from')
    
    if (fromParam === 'central-kitchen') {
      setIsFromCentralKitchen(true)
      loadCentralKitchenData()
    }
  }, [location.search])

  const loadCentralKitchenData = async () => {
    try {
      // Load Central Kitchen and outlets
      const [centralKitchenResponse, outletsResponse] = await Promise.all([
        apiService.getCentralKitchens(),
        apiService.getOutlets({ limit: 1000 })
      ])

      if (centralKitchenResponse.success && centralKitchenResponse.data.length > 0) {
        const centralKitchenData = centralKitchenResponse.data[0]
        setCentralKitchen(centralKitchenData)
        
        // Pre-select Central Kitchen as From location
        setFormData(prev => ({
          ...prev,
          fromWarehouseId: centralKitchenData._id || centralKitchenData.id,
          fromWarehouseName: centralKitchenData.outletName
        }))
        
        console.log('Central Kitchen data loaded:', centralKitchenData)
      }

      if (outletsResponse.success) {
        // Filter out Central Kitchen from outlets list for To field
        const regularOutlets = outletsResponse.data.filter(outlet => !outlet.isCentralKitchen)
        setOutlets(regularOutlets)
      }
    } catch (err) {
      console.error('Error loading Central Kitchen data:', err)
    }
  }

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

    const newTransferOrder: TransferOrder = {
      id: Date.now().toString(),
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
      transferType: formData.transferType,
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      updatedBy: 'admin',
      requestedBy: 'admin',
      reason: 'Transfer request'
    }

    console.log('Creating Transfer Order:', newTransferOrder)
    navigate('/transfer-orders')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleWarehouseChange = (field: 'fromWarehouseId' | 'toWarehouseId', locationId: string) => {
    let locationName = ''
    
    if (isFromCentralKitchen && field === 'toWarehouseId') {
      // Handle outlet selection
      const outlet = outlets.find(o => o._id === locationId)
      locationName = outlet ? outlet.outletName : ''
    } else {
      // Handle warehouse selection
      const warehouse = warehouses.find(w => w.id === locationId)
      locationName = warehouse ? warehouse.name : ''
    }
    
    if (field === 'fromWarehouseId') {
      setFormData(prev => ({ 
        ...prev, 
        fromWarehouseId: locationId,
        fromWarehouseName: locationName
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        toWarehouseId: locationId,
        toWarehouseName: locationName
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Transfer Order</h1>
          <p className="text-gray-600">Create a new material transfer order</p>
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

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isFromCentralKitchen ? 'Transfer Information' : 'Warehouse Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From {isFromCentralKitchen ? 'Location' : 'Warehouse'} *
                </label>
                <select
                  className={`input-field ${errors.fromWarehouseId ? 'border-red-500' : ''} ${isFromCentralKitchen ? 'bg-gray-100' : ''}`}
                  value={formData.fromWarehouseId}
                  onChange={(e) => handleWarehouseChange('fromWarehouseId', e.target.value)}
                  disabled={isFromCentralKitchen}
                >
                  {isFromCentralKitchen ? (
                    <>
                      <option value="">Select From Location</option>
                      {centralKitchen && (
                        <option key={centralKitchen._id || centralKitchen.id} value={centralKitchen._id || centralKitchen.id}>
                          {centralKitchen.outletName} (Central Kitchen)
                        </option>
                      )}
                    </>
                  ) : (
                    <>
                      <option value="">Select From Warehouse</option>
                      {warehouses.map(warehouse => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </>
                  )}
                </select>
                {errors.fromWarehouseId && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromWarehouseId}</p>
                )}
                {isFromCentralKitchen && (
                  <p className="mt-1 text-sm text-gray-500">Central Kitchen is pre-selected as the source location</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To {isFromCentralKitchen ? 'Outlet' : 'Warehouse'} *
                </label>
                <select
                  className={`input-field ${errors.toWarehouseId ? 'border-red-500' : ''}`}
                  value={formData.toWarehouseId}
                  onChange={(e) => handleWarehouseChange('toWarehouseId', e.target.value)}
                >
                  <option value="">Select To {isFromCentralKitchen ? 'Outlet' : 'Warehouse'}</option>
                  {isFromCentralKitchen ? (
                    outlets.map(outlet => (
                      <option key={outlet._id} value={outlet._id}>{outlet.outletName}</option>
                    ))
                  ) : (
                    warehouses.filter(w => w.id !== formData.fromWarehouseId).map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))
                  )}
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
              Create Transfer Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTransferOrder
