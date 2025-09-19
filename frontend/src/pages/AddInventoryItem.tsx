import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Package, Plus } from 'lucide-react'

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

const AddInventoryItem: React.FC = () => {
  const navigate = useNavigate()
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    itemType: 'raw-material',
    sku: '',
    itemName: '',
    parentCategory: '',
    subCategoryName: '',
    unitName: '',
    defaultPurchaseUnitName: '',
    unitPrice: '',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    supplier: '',
    notes: ''
  })

  useEffect(() => {
    loadCentralKitchenData()
  }, [])

  const loadCentralKitchenData = async () => {
    try {
      // Set default central kitchen outlet
      setOutlet({
        id: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        outletType: 'Central Kitchen',
        isCentralKitchen: true
      })
    } catch (err) {
      console.error('Error loading central kitchen data:', err)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!outlet) {
      alert('Central Kitchen outlet not found')
      return
    }

    try {
      setLoading(true)
      
      const newItem = {
        outletId: outlet.id,
        outletCode: outlet.outletCode,
        outletName: outlet.outletName,
        materialId: formData.sku,
        materialCode: formData.sku,
        materialName: formData.itemName,
        category: formData.parentCategory,
        subCategory: formData.subCategoryName,
        unitOfMeasure: formData.unitName,
        purchaseUnit: formData.defaultPurchaseUnitName,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        currentStock: parseFloat(formData.currentStock) || 0,
        reservedStock: 0,
        availableStock: parseFloat(formData.currentStock) || 0,
        minimumStock: parseFloat(formData.minimumStock) || 0,
        maximumStock: parseFloat(formData.maximumStock) || 0,
        reorderPoint: parseFloat(formData.minimumStock) || 0,
        totalValue: (parseFloat(formData.unitPrice) || 0) * (parseFloat(formData.currentStock) || 0),
        location: 'Central Kitchen Storage',
        batchNumber: `BATCH-${formData.sku}-${Date.now()}`,
        supplier: formData.supplier,
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: formData.notes,
        isActive: true
      }

      // Here you would typically make an API call to save the item
      console.log('Creating new item:', newItem)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`${formData.itemType === 'raw-material' ? 'Raw Material' : 'Finished Good'} created successfully!`)
      
      // Navigate back to Central Kitchen
      navigate('/central-kitchen')

    } catch (err) {
      console.error('Error creating item:', err)
      alert('Failed to create item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      itemType: 'raw-material',
      sku: '',
      itemName: '',
      parentCategory: '',
      subCategoryName: '',
      unitName: '',
      defaultPurchaseUnitName: '',
      unitPrice: '',
      currentStock: '',
      minimumStock: '',
      maximumStock: '',
      supplier: '',
      notes: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/central-kitchen')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Central Kitchen"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Plus className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Inventory Item</h1>
            <p className="text-gray-600">Create new raw material or finished good for Central Kitchen</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Type Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Type</h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="raw-material"
                    checked={formData.itemType === 'raw-material'}
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Raw Material</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="itemType"
                    value="finished-good"
                    checked={formData.itemType === 'finished-good'}
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Finished Good</span>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter SKU (e.g., RM025, FG011)"
                    required
                  />
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category *</label>
                  <select
                    className="input-field"
                    value={formData.parentCategory}
                    onChange={(e) => handleInputChange('parentCategory', e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Raw Material">Raw Material</option>
                    <option value="Protein">Protein</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                {/* SubCategory Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SubCategory Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.subCategoryName}
                    onChange={(e) => handleInputChange('subCategoryName', e.target.value)}
                    placeholder="Enter subcategory (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Unit Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unit Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name *</label>
                  <select
                    className="input-field"
                    value={formData.unitName}
                    onChange={(e) => handleInputChange('unitName', e.target.value)}
                    required
                  >
                    <option value="">Select Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="L">Liter (L)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="g">Gram (g)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>

                {/* Default Purchase Unit Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Purchase Unit Name</label>
                  <select
                    className="input-field"
                    value={formData.defaultPurchaseUnitName}
                    onChange={(e) => handleInputChange('defaultPurchaseUnitName', e.target.value)}
                  >
                    <option value="">Same as Unit Name</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="L">Liter (L)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="g">Gram (g)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing and Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (KWD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.currentStock}
                    onChange={(e) => handleInputChange('currentStock', e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Minimum Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.minimumStock}
                    onChange={(e) => handleInputChange('minimumStock', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Maximum Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.maximumStock}
                    onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                    placeholder="0"
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>

                {/* Total Value (Calculated) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Value (Calculated)</label>
                  <div className="input-field bg-gray-100 text-gray-600">
                    {formData.unitPrice && formData.currentStock 
                      ? (parseFloat(formData.unitPrice) * parseFloat(formData.currentStock)).toFixed(2) + ' KWD'
                      : '0.00 KWD'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/central-kitchen')}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary flex items-center"
              >
                <Package className="h-4 w-4 mr-2" />
                Reset Form
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddInventoryItem
