import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { BillOfMaterials, BOMItem } from '../types'

const EditBOM: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [formData, setFormData] = useState({
    bomCode: '',
    productName: '',
    productDescription: '',
    version: '',
    effectiveDate: '',
    status: 'Draft' as 'Draft' | 'Active' | 'Obsolete',
    items: [] as BOMItem[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const statusOptions = ['Draft', 'Active', 'Obsolete']

  // Mock data - in real app, fetch from API
  const mockBOM: BillOfMaterials = {
    id: '1',
    bomCode: 'BOM-001',
    productName: 'Steel Frame Assembly',
    productDescription: 'Complete steel frame for construction',
    version: '1.0',
    effectiveDate: new Date('2024-01-01').toISOString(),
    status: 'Active',
    totalCost: 1250.75,
    items: [
      {
        materialId: 'RM-001',
        materialCode: 'RM-001',
        materialName: 'Steel Rod 12mm',
        quantity: 10,
        unitOfMeasure: 'KG',
        unitCost: 45.50,
        totalCost: 455.00
      },
      {
        materialId: 'RM-002',
        materialCode: 'RM-002',
        materialName: 'Aluminum Sheet 2mm',
        quantity: 5,
        unitOfMeasure: 'SQM',
        unitCost: 125.00,
        totalCost: 625.00
      }
    ],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin'
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFormData({
        bomCode: mockBOM.bomCode,
        productName: mockBOM.productName,
        productDescription: mockBOM.productDescription,
        version: mockBOM.version,
        effectiveDate: mockBOM.effectiveDate.split('T')[0],
        status: mockBOM.status,
        items: mockBOM.items
      })
      setLoading(false)
    }, 500)
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bomCode.trim()) {
      newErrors.bomCode = 'BOM code is required'
    }
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required'
    }
    if (!formData.version.trim()) {
      newErrors.version = 'Version is required'
    }
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one BOM item is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Calculate total cost
    const totalCost = formData.items.reduce((sum, item) => sum + item.totalCost, 0)

    const updatedBOM: BillOfMaterials = {
      ...mockBOM,
      bomCode: formData.bomCode,
      productName: formData.productName,
      productDescription: formData.productDescription,
      version: formData.version,
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
      status: formData.status,
      totalCost,
      items: formData.items,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    }

    console.log('Updating BOM:', updatedBOM)
    navigate('/bill-of-materials')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addBOMItem = () => {
    const newItem: BOMItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
      quantity: 0,
      unitOfMeasure: '',
      unitCost: 0,
      totalCost: 0
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const updateBOMItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitCost') {
            updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost
          }
          return updatedItem
        }
        return item
      })
    }))
  }

  const removeBOMItem = (index: number) => {
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
          <p className="mt-4 text-gray-600">Loading BOM data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600">Update bill of materials information</p>
        </div>
        <button
          onClick={() => navigate('/bill-of-materials')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recipes
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
                  BOM Code *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.bomCode ? 'border-red-500' : ''}`}
                  value={formData.bomCode}
                  onChange={(e) => handleInputChange('bomCode', e.target.value)}
                   placeholder="SANDWICH-001"
                />
                {errors.bomCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.bomCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.version ? 'border-red-500' : ''}`}
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="1.0"
                />
                {errors.version && (
                  <p className="mt-1 text-sm text-red-600">{errors.version}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.productName ? 'border-red-500' : ''}`}
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                   placeholder="Chicken Club Sandwich"
                />
                {errors.productName && (
                  <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.productDescription}
                  onChange={(e) => handleInputChange('productDescription', e.target.value)}
                   placeholder="Delicious sandwich with grilled chicken, bacon, lettuce, tomato, and mayo on toasted bread"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.effectiveDate ? 'border-red-500' : ''}`}
                  value={formData.effectiveDate}
                  onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                />
                {errors.effectiveDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.effectiveDate}</p>
                )}
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

          {/* BOM Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recipe Items</h3>
              <button
                type="button"
                onClick={addBOMItem}
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
                <div key={index} className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Code</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialCode}
                      onChange={(e) => updateBOMItem(index, 'materialCode', e.target.value)}
                       placeholder="CHICKEN-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.materialName}
                      onChange={(e) => updateBOMItem(index, 'materialName', e.target.value)}
                       placeholder="Chicken Breast"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={item.quantity}
                      onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      className="input-field text-sm"
                      value={item.unitOfMeasure}
                      onChange={(e) => updateBOMItem(index, 'unitOfMeasure', e.target.value)}
                       placeholder="grams"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field text-sm"
                      value={item.unitCost}
                      onChange={(e) => updateBOMItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeBOMItem(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-4 w-4" /> 
                    </button>
                  </div>
                  <div className="col-span-6">
                    <div className="text-sm text-gray-600">
                      Total Cost: {item.totalCost.toFixed(2)} KWD
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total BOM Cost: {formData.items.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)} KWD
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/bill-of-materials')}
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
              Update BOM
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBOM
