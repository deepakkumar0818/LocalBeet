import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react'
import { BOMItem, RawMaterial } from '../types'
import { apiService } from '../services/api'

const AddBOM: React.FC = () => {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [formData, setFormData] = useState({
    bomCode: '',
    productName: '',
    productDescription: '',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0], // Today's date
    status: 'Draft' as 'Draft' | 'Active' | 'Obsolete',
    items: [] as BOMItem[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const statusOptions = ['Draft', 'Active', 'Obsolete']
  const unitOptions = ['grams', 'kg', 'ml'] as const

  // Load Central Kitchen raw materials for dropdown (full inventory)
  useEffect(() => {
    (async () => {
      try {
        const all: RawMaterial[] = []
        let page = 1
        // Try to fetch up to 10k items in case pagination is enforced
        while (true) {
          const res = await apiService.getCentralKitchenRawMaterials({ page, limit: 1000 })
          if (res?.success && Array.isArray(res.data)) {
            all.push(...(res.data as unknown as RawMaterial[]))
          }
          const hasNext = (res as any)?.pagination?.hasNext || ((res as any)?.pagination?.currentPage || page) < ((res as any)?.pagination?.totalPages || page)
          if (!hasNext) break
          page += 1
          if (page > 20) break // safety cap
        }
        const allowed = ['grams','kg','ml','g','l','liter','milliliter']
        const filtered = all.filter(m => allowed.includes((m.unitOfMeasure || '').toLowerCase()))
          .map(m => ({
            ...m,
            unitOfMeasure: (m.unitOfMeasure || '').toLowerCase() === 'g' ? 'grams' :
                           (m.unitOfMeasure || '').toLowerCase() === 'l' || (m.unitOfMeasure || '').toLowerCase() === 'liter' ? 'ml' :
                           (m.unitOfMeasure || '').toLowerCase() === 'milliliter' ? 'ml' : (m.unitOfMeasure || '')
          }))
        setMaterials(filtered)
      } catch (err) {
        console.error('Failed to load central kitchen raw materials', err)
      }
    })()
  }, [])

  // Auto-generate BOM code on load
  useEffect(() => {
    (async () => {
      if (formData.bomCode && formData.bomCode.trim().length > 0) return
      try {
        const res = await apiService.getBillOfMaterials({ limit: 1, page: 1, sortBy: 'createdAt', sortOrder: 'desc' })
        let nextCode = ''
        const last = (res as any)?.data?.[0]
        const lastCode: string | undefined = last?.bomCode
        if (lastCode) {
          const m = lastCode.match(/^(.*?)(\d+)$/)
          if (m) {
            const prefix = m[1]
            const num = parseInt(m[2], 10)
            const width = m[2].length
            nextCode = `${prefix}${String(num + 1).padStart(width, '0')}`
          }
        }
        if (!nextCode) {
          const ts = new Date()
          const y = ts.getFullYear()
          const mm = String(ts.getMonth() + 1).padStart(2, '0')
          const dd = String(ts.getDate()).padStart(2, '0')
          const hh = String(ts.getHours()).padStart(2, '0')
          const mi = String(ts.getMinutes()).padStart(2, '0')
          nextCode = `BOM-${y}${mm}${dd}-${hh}${mi}`
        }
        setFormData(prev => ({ ...prev, bomCode: nextCode }))
      } catch (err) {
        // Fallback in case API fails
        const ts = new Date()
        const y = ts.getFullYear()
        const mm = String(ts.getMonth() + 1).padStart(2, '0')
        const dd = String(ts.getDate()).padStart(2, '0')
        const hh = String(ts.getHours()).padStart(2, '0')
        const mi = String(ts.getMinutes()).padStart(2, '0')
        const code = `BOM-${y}${mm}${dd}-${hh}${mi}`
        setFormData(prev => ({ ...prev, bomCode: code }))
      }
    })()
  }, [])

  type AllowedUnit = 'grams' | 'kg' | 'ml'

  const findMaterial = (codeOrId: string) => {
    return materials.find(
      (m) => m.materialCode === codeOrId || (m.id && m.id === codeOrId)
    )
  }

  const computeUnitCost = (
    material: RawMaterial | undefined,
    targetUnit: AllowedUnit
  ): number => {
    if (!material) return 0
    const sourceUnit = (material.unitOfMeasure || '').toLowerCase()
    const price = Number(material.unitPrice || 0)

    if (price <= 0) return 0

    // Normalize price per requested unit
    if (sourceUnit === 'kg') {
      if (targetUnit === 'kg') return price
      if (targetUnit === 'grams') return price / 1000
      if (targetUnit === 'ml') return 0 // incompatible
    }
    if (sourceUnit === 'grams') {
      if (targetUnit === 'grams') return price
      if (targetUnit === 'kg') return price * 1000
      if (targetUnit === 'ml') return 0
    }
    if (sourceUnit === 'ml') {
      if (targetUnit === 'ml') return price
      // No cross mass-volume conversion without density
      return 0
    }
    // Fallback: if same text
    if (sourceUnit === targetUnit) return price
    return 0
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bomCode.trim()) {
      newErrors.bomCode = 'BOM code is required'
    } else if (formData.bomCode.trim().length < 3) {
      newErrors.bomCode = 'BOM code must be at least 3 characters'
    }
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required'
    }
    
    // Product description optional
    
    if (!formData.version.trim()) {
      newErrors.version = 'Version is required'
    } else if (!/^\d+\.\d+$/.test(formData.version.trim())) {
      newErrors.version = 'Version must be in format X.X (e.g., 1.0)'
    }
    
    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required'
    } else {
      const date = new Date(formData.effectiveDate)
      if (isNaN(date.getTime()) || date < new Date('2020-01-01')) {
        newErrors.effectiveDate = 'Please select a valid date after 2020'
      }
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'At least one BOM item is required'
    } else {
      // Validate each item
      formData.items.forEach((item, index) => {
        if (!item.materialCode.trim() && !item.materialId) {
          newErrors[`item_${index}_code`] = 'Material is required'
        }
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
        }
        if (!item.unitOfMeasure.trim()) {
          newErrors[`item_${index}_unit`] = 'Unit of measure is required'
        }
        // unitCost may be 0; backend now accepts it (total will be 0)
      })
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
      setSubmitting(true)
      // Auto-calc costs based on selected materials and units
      const itemsWithCosts = formData.items.map((item) => {
        const selectedMaterial = findMaterial(item.materialCode || item.materialId)
        const unit = (item.unitOfMeasure || 'grams') as AllowedUnit
        const unitCost = computeUnitCost(selectedMaterial, unit)
        const totalCost = Math.round((unitCost * (item.quantity || 0)) * 100) / 100

        const materialCode = (item.materialCode || selectedMaterial?.materialCode || '').toString().trim().toUpperCase()
        const materialName = (item.materialName || selectedMaterial?.materialName || '').toString().trim()

        return {
          ...item,
          materialCode,
          materialName,
          unitOfMeasure: unit,
          unitCost,
          totalCost,
        }
      })

      const totalCost = itemsWithCosts.reduce((sum, item) => sum + (item.totalCost || 0), 0)

      // Prepare BOM data with proper formatting
      const bomData = {
        bomCode: formData.bomCode.trim().toUpperCase().replace(/\s+/g, '-'),
        productName: formData.productName.trim(),
        productDescription: formData.productDescription.trim(),
        version: formData.version.trim(),
        effectiveDate: formData.effectiveDate,
        status: formData.status,
        totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
        items: itemsWithCosts.map(item => ({
          materialId: item.materialId || `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          materialCode: (item.materialCode || '').toString().trim().toUpperCase(),
          materialName: (item.materialName || '').toString().trim(),
          quantity: parseFloat(item.quantity.toString()),
          unitOfMeasure: (item.unitOfMeasure || '').toString().trim(),
          unitCost: Number(item.unitCost || 0),
          totalCost: Number(item.totalCost || 0)
        })),
        createdBy: 'admin',
        updatedBy: 'admin'
      }

      console.log('Creating BOM:', bomData)
      
      const response = await apiService.createBillOfMaterial(bomData)
      
      if (response.success) {
        console.log('BOM created successfully:', response.data)
        navigate('/bill-of-materials')
      } else {
        alert('Failed to create BOM: ' + response.message)
      }
    } catch (error) {
      console.error('Error creating BOM:', error)
      alert('Error creating BOM: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
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
      unitOfMeasure: 'grams',
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
          // Recompute costs when quantity, unit, or material changes
          const material = findMaterial(updatedItem.materialCode || updatedItem.materialId)
          const unit = (updatedItem.unitOfMeasure || 'grams') as AllowedUnit
          const unitCost = computeUnitCost(material, unit)
          updatedItem.unitCost = unitCost
          updatedItem.totalCost = (updatedItem.quantity || 0) * unitCost
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Recipe</h1>
          <p className="text-gray-600">Create a new bill of materials</p>
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
                <div key={index} className="grid grid-cols-7 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material code</label>
                    <select
                      className="input-field text-sm"
                      value={item.materialCode}
                      onChange={(e) => {
                        const code = e.target.value
                        const mat = findMaterial(code)
                        updateBOMItem(index, 'materialCode', code)
                        updateBOMItem(index, 'materialName', mat?.materialName || '')
                        updateBOMItem(index, 'materialId', mat?.id || '')
                      }}
                    >
                      <option value="">Select material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.materialCode}>
                          {`${m.materialCode} - ${m.materialName}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                      type="text"
                      className="input-field text-sm bg-gray-100"
                      value={item.materialName}
                      readOnly
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
                    <select
                      className="input-field text-sm"
                      value={item.unitOfMeasure}
                      onChange={(e) => updateBOMItem(index, 'unitOfMeasure', e.target.value)}
                    >
                      {unitOptions.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost</label>
                    <input
                      type="number"
                      step="0.0001"
                      className="input-field text-sm bg-gray-100"
                      value={Number(item.unitCost || 0).toFixed(4) as unknown as number}
                      readOnly
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
                  <div className="col-span-7">
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
              className={`btn-primary flex items-center ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={submitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Creating...' : 'Create BOM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBOM
