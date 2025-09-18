import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X } from 'lucide-react'
import { RawMaterial } from '../types'
import { apiService } from '../services/api'

const AddMaterial: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    materialCode: '',
    materialName: '',
    description: '',
    category: '',
    unitOfMeasure: '',
    unitPrice: '',
    minimumStock: '',
    maximumStock: '',
    currentStock: '',
    supplierId: '',
    isActive: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = ['Fresh Produce', 'Pantry', 'Dairy Alternatives', 'Sweeteners', 'Beverages', 'Supplements', 'Superfoods', 'Dairy', 'Bakery', 'Spices', 'Other']
  const units = ['PC', 'TBSP', 'CUP', 'TSP', 'PINCH', 'SCOOP', 'HANDFUL', 'SLICE', 'OZ', 'LB', 'KG', 'LTR', 'Other']

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.materialCode.trim()) {
      newErrors.materialCode = 'Material code is required'
    }
    if (!formData.materialName.trim()) {
      newErrors.materialName = 'Material name is required'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.unitOfMeasure) {
      newErrors.unitOfMeasure = 'Unit of measure is required'
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Valid unit price is required'
    }
    if (!formData.minimumStock || parseInt(formData.minimumStock) < 0) {
      newErrors.minimumStock = 'Valid minimum stock is required'
    }
    if (!formData.maximumStock || parseInt(formData.maximumStock) < 0) {
      newErrors.maximumStock = 'Valid maximum stock is required'
    }
    if (!formData.currentStock || parseInt(formData.currentStock) < 0) {
      newErrors.currentStock = 'Valid current stock is required'
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
      const response = await apiService.createRawMaterial(formData)
      if (response.success) {
        // Navigate back to the materials list
        navigate('/raw-materials')
      } else {
        alert('Failed to create material: ' + response.message)
      }
    } catch (err) {
      alert('Error creating material: ' + (err instanceof Error ? err.message : 'Unknown error'))
      console.error('Error creating material:', err)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Material</h1>
          <p className="text-gray-600">Create a new raw material entry</p>
        </div>
        <button
          onClick={() => navigate('/raw-materials')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Raw Materials
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
                  Material Code *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.materialCode ? 'border-red-500' : ''}`}
                  value={formData.materialCode}
                  onChange={(e) => handleInputChange('materialCode', e.target.value)}
                  placeholder="RM-001"
                />
                {errors.materialCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.materialCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.materialName ? 'border-red-500' : ''}`}
                  value={formData.materialName}
                  onChange={(e) => handleInputChange('materialName', e.target.value)}
                  placeholder="Steel Rod 12mm"
                />
                {errors.materialName && (
                  <p className="mt-1 text-sm text-red-600">{errors.materialName}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Material description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit of Measure *
                </label>
                <select
                  className={`input-field ${errors.unitOfMeasure ? 'border-red-500' : ''}`}
                  value={formData.unitOfMeasure}
                  onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                >
                  <option value="">Select Unit</option>
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unitOfMeasure && (
                  <p className="mt-1 text-sm text-red-600">{errors.unitOfMeasure}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Stock Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className={`input-field pl-8 ${errors.unitPrice ? 'border-red-500' : ''}`}
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {errors.unitPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock *
                </label>
                <input
                  type="number"
                  className={`input-field ${errors.currentStock ? 'border-red-500' : ''}`}
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange('currentStock', e.target.value)}
                  placeholder="0"
                />
                {errors.currentStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentStock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  className={`input-field ${errors.minimumStock ? 'border-red-500' : ''}`}
                  value={formData.minimumStock}
                  onChange={(e) => handleInputChange('minimumStock', e.target.value)}
                  placeholder="0"
                />
                {errors.minimumStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.minimumStock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock *
                </label>
                <input
                  type="number"
                  className={`input-field ${errors.maximumStock ? 'border-red-500' : ''}`}
                  value={formData.maximumStock}
                  onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                  placeholder="0"
                />
                {errors.maximumStock && (
                  <p className="mt-1 text-sm text-red-600">{errors.maximumStock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.supplierId}
                  onChange={(e) => handleInputChange('supplierId', e.target.value)}
                  placeholder="SUP-001"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active Material
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/raw-materials')}
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
              Save Material
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMaterial
