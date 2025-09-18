import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { GoodReceiptNote, GRNItem } from '../types'

const AddGRN: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    grnNumber: '',
    purchaseOrderNumber: '',
    supplierName: '',
    supplierContact: '',
    supplierEmail: '',
    receiptDate: '',
    receivedBy: '',
    inspectedBy: '',
    status: 'Draft' as 'Draft' | 'Received' | 'Inspected' | 'Approved' | 'Rejected',
    warehouseLocation: '',
    totalAmount: 0,
    items: [] as GRNItem[],
    notes: '',
    qualityRemarks: '',
    deliveryChallanNumber: '',
    transporterName: '',
    vehicleNumber: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const statusOptions = ['Draft', 'Received', 'Inspected', 'Approved', 'Rejected']

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.grnNumber.trim()) {
      newErrors.grnNumber = 'GRN number is required'
    }
    if (!formData.purchaseOrderNumber.trim()) {
      newErrors.purchaseOrderNumber = 'Purchase order number is required'
    }
    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required'
    }
    if (!formData.receiptDate) {
      newErrors.receiptDate = 'Receipt date is required'
    }
    if (!formData.receivedBy.trim()) {
      newErrors.receivedBy = 'Received by is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one GRN item is required'
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

    const newGRN: GoodReceiptNote = {
      id: Date.now().toString(),
      grnNumber: formData.grnNumber,
      purchaseOrderNumber: formData.purchaseOrderNumber,
      supplierName: formData.supplierName,
      supplierContact: formData.supplierContact,
      supplierEmail: formData.supplierEmail,
      receiptDate: new Date(formData.receiptDate),
      receivedBy: formData.receivedBy,
      inspectedBy: formData.inspectedBy,
      status: formData.status as 'Draft' | 'Rejected' | 'Approved',
      warehouseLocation: formData.warehouseLocation,
      totalAmount,
      items: formData.items,
      notes: formData.notes,
      qualityRemarks: formData.qualityRemarks,
      deliveryChallanNumber: formData.deliveryChallanNumber,
      transporterName: formData.transporterName,
      vehicleNumber: formData.vehicleNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      updatedBy: 'admin'
    }

    console.log('Creating GRN:', newGRN)
    navigate('/good-receipt-notes')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addGRNItem = () => {
    const newItem: GRNItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
      orderedQuantity: 0,
      receivedQuantity: 0,
      acceptedQuantity: 0,
      rejectedQuantity: 0,
      unitPrice: 0,
      totalAmount: 0,
      specifications: '',
      batchNumber: '',
      expiryDate: '',
      qualityStatus: 'Partial' as 'Partial' | 'Accepted' | 'Rejected'
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const updateGRNItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'receivedQuantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.receivedQuantity * updatedItem.unitPrice
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeGRNItem = (index: number) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Create New GRN</h1>
          <p className="text-gray-600">Create a new good receipt note</p>
        </div>
        <button
          onClick={() => navigate('/good-receipt-notes')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to GRNs
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
                  GRN Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.grnNumber ? 'border-red-500' : ''}`}
                  value={formData.grnNumber}
                  onChange={(e) => handleInputChange('grnNumber', e.target.value)}
                  placeholder="GRN-2024-001"
                />
                {errors.grnNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.grnNumber}</p>
                )}
              </div>

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
                  Supplier Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.supplierEmail}
                  onChange={(e) => handleInputChange('supplierEmail', e.target.value)}
                  placeholder="john@abcsteel.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.receiptDate ? 'border-red-500' : ''}`}
                  value={formData.receiptDate}
                  onChange={(e) => handleInputChange('receiptDate', e.target.value)}
                />
                {errors.receiptDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.receiptDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.receivedBy ? 'border-red-500' : ''}`}
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                  placeholder="Warehouse Manager"
                />
                {errors.receivedBy && (
                  <p className="mt-1 text-sm text-red-600">{errors.receivedBy}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspected By
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.inspectedBy}
                  onChange={(e) => handleInputChange('inspectedBy', e.target.value)}
                  placeholder="Quality Inspector"
                />
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
                  Warehouse Location
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.warehouseLocation}
                  onChange={(e) => handleInputChange('warehouseLocation', e.target.value)}
                  placeholder="Main Warehouse - Zone A"
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Challan Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.deliveryChallanNumber}
                  onChange={(e) => handleInputChange('deliveryChallanNumber', e.target.value)}
                  placeholder="DC-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transporter Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.transporterName}
                  onChange={(e) => handleInputChange('transporterName', e.target.value)}
                  placeholder="ABC Logistics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.vehicleNumber}
                  onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                  placeholder="MH-12-AB-1234"
                />
              </div>
            </div>
          </div>

          {/* GRN Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">GRN Items</h3>
              <button
                type="button"
                onClick={addGRNItem}
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Code</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialCode}
                      onChange={(e) => updateGRNItem(index, 'materialCode', e.target.value)}
                      placeholder="RM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialName}
                      onChange={(e) => updateGRNItem(index, 'materialName', e.target.value)}
                      placeholder="Steel Rod"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ordered Qty</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.orderedQuantity}
                      onChange={(e) => updateGRNItem(index, 'orderedQuantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Received Qty</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.receivedQuantity}
                      onChange={(e) => updateGRNItem(index, 'receivedQuantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Accepted Qty</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.receivedQuantity}
                      onChange={(e) => updateGRNItem(index, 'receivedQuantity', parseFloat(e.target.value) || 0)}
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
                      onChange={(e) => updateGRNItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.batchNumber || ''}
                      onChange={(e) => updateGRNItem(index, 'batchNumber', e.target.value)}
                      placeholder="B001"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeGRNItem(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="col-span-8">
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Specifications</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          value={item.specifications || ''}
                          onChange={(e) => updateGRNItem(index, 'specifications', e.target.value)}
                          placeholder="Grade A, 12mm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          className="input-field text-sm"
                          value={item.expiryDate || ''}
                          onChange={(e) => updateGRNItem(index, 'expiryDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quality Status</label>
                        <select
                          className="input-field text-sm"
                          value={item.qualityStatus}
                          onChange={(e) => updateGRNItem(index, 'qualityStatus', e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
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
                    Total GRN Amount: {formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)} KWD
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
                  Quality Remarks
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.qualityRemarks}
                  onChange={(e) => handleInputChange('qualityRemarks', e.target.value)}
                  placeholder="Quality inspection remarks and observations"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/good-receipt-notes')}
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
              Create GRN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddGRN
