import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, X, Plus, Trash2, Package } from 'lucide-react'
import { TransferOrder, TransferOrderItem } from '../types'
import { apiService } from '../services/api'

const AddTransferOrder: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isFromCentralKitchen, setIsFromCentralKitchen] = useState(false)
  const [isFromKuwaitCity, setIsFromKuwaitCity] = useState(false)
  const [kuwaitCitySection, setKuwaitCitySection] = useState<'raw-materials' | 'finished-goods' | 'both'>('both')
  const [outlets, setOutlets] = useState<any[]>([])
  const [centralKitchen, setCentralKitchen] = useState<any>(null)
  const [rawMaterials, setRawMaterials] = useState<any[]>([])
  const [finishedGoods, setFinishedGoods] = useState<any[]>([])
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

  // Check if coming from Central Kitchen or Kuwait City
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const fromParam = urlParams.get('from')
    const sectionParam = urlParams.get('section')
    
    if (fromParam === 'central-kitchen') {
      setIsFromCentralKitchen(true)
      loadCentralKitchenData()
    } else if (fromParam === 'kuwait-city') {
      setIsFromKuwaitCity(true)
      
      // Determine which section to show
      if (sectionParam === 'raw-materials' || sectionParam === 'finished-goods') {
        setKuwaitCitySection(sectionParam as 'raw-materials' | 'finished-goods')
      } else {
        setKuwaitCitySection('both')
      }
      
      loadKuwaitCityData()
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

  const loadKuwaitCityData = async () => {
    try {
      console.log('Loading Kuwait City data for section:', kuwaitCitySection)

      // Set Kuwait City as from outlet and Central Kitchen as to outlet
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Generate transfer number
      const transferNumber = `TR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      setFormData(prev => ({
        ...prev,
        transferNumber: transferNumber,
        fromWarehouseId: 'Kuwait City',
        fromWarehouseName: 'Kuwait City',
        toWarehouseId: 'Central Kitchen',
        toWarehouseName: 'Central Kitchen',
        transferDate: today,
        expectedDeliveryDate: tomorrow,
        status: 'Pending',
        priority: 'Normal'
      }))
      
      // Only load data for the specific section
      if (kuwaitCitySection === 'raw-materials' || kuwaitCitySection === 'both') {
        const rawMaterialsResponse = await fetch('/api/kuwait-city/raw-materials?limit=1000')
        const rawMaterialsData = await rawMaterialsResponse.json()
        
        console.log('Raw Materials API Response:', rawMaterialsData)
        
        if (rawMaterialsData.success && rawMaterialsData.data) {
          const rawMaterials = Array.isArray(rawMaterialsData.data) ? rawMaterialsData.data : []
          setRawMaterials(rawMaterials)
          console.log('Raw Materials loaded for Kuwait City:', rawMaterials.length, 'items')
        } else {
          console.error('Failed to load Raw Materials:', rawMaterialsData)
          setRawMaterials([])
        }
      } else {
        setRawMaterials([])
      }

      if (kuwaitCitySection === 'finished-goods' || kuwaitCitySection === 'both') {
        const finishedGoodsResponse = await fetch('/api/kuwait-city/finished-products?limit=1000')
        const finishedGoodsData = await finishedGoodsResponse.json()
        
        console.log('Finished Goods API Response:', finishedGoodsData)
        
        if (finishedGoodsData.success && finishedGoodsData.data) {
          const finishedGoods = Array.isArray(finishedGoodsData.data) ? finishedGoodsData.data : []
          setFinishedGoods(finishedGoods)
          console.log('Finished Goods loaded for Kuwait City:', finishedGoods.length, 'items')
        } else {
          console.error('Failed to load Finished Goods:', finishedGoodsData)
          setFinishedGoods([])
        }
      } else {
        setFinishedGoods([])
      }
    } catch (error) {
      console.error('Error loading Kuwait City data:', error)
      setRawMaterials([])
      setFinishedGoods([])
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
    if (!isFromKuwaitCity) {
      if (!formData.fromWarehouseId) {
        newErrors.fromWarehouseId = 'From warehouse is required'
      }
      if (!formData.toWarehouseId) {
        newErrors.toWarehouseId = 'To warehouse is required'
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!')
    console.log('Form data:', formData)
    console.log('Is from Kuwait City:', isFromKuwaitCity)

    if (!validateForm()) {
      console.log('Form validation failed')
      console.log('Validation errors:', errors)
      return
    }

    console.log('Form validation passed')

    try {
      // Calculate total amount
      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)

      // Prepare transfer order data for API
      const transferOrderData = {
        fromOutlet: formData.fromWarehouseId || 'Kuwait City',
        toOutlet: formData.toWarehouseId || 'Central Kitchen',
        transferDate: formData.transferDate,
        priority: formData.priority,
        items: formData.items.map(item => ({
          itemType: item.itemType === 'raw-material' ? 'Raw Material' : 'Finished Goods',
          itemCode: item.materialCode,
          itemName: item.materialName,
          category: item.category,
          subCategory: item.subCategory,
          unitOfMeasure: item.unitOfMeasure,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.remarks
        })),
        notes: formData.notes,
        requestedBy: 'Kuwait City Manager'
      }

      console.log('Creating Transfer Order:', transferOrderData)
      console.log('Transfer order data being sent:', JSON.stringify(transferOrderData, null, 2))

      // Call API to create transfer order
      console.log('Calling API...')
      const response = await apiService.createTransferOrder(transferOrderData)
      console.log('API Response:', response)

      if (response.success) {
        alert('Transfer order created successfully!')
        navigate('/transfer-orders')
      } else {
        throw new Error(response.message || 'Failed to create transfer order')
      }
    } catch (error) {
      console.error('Error creating transfer order:', error)
      console.error('Error details:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(`Failed to create transfer order: ${errorMessage}`)
    }
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

  const addTransferOrderItem = (itemType: 'raw-material' | 'finished-good') => {
    const newItem: TransferOrderItem = {
      materialId: '',
      materialCode: '',
      materialName: '',
      itemType: itemType,
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

  const handleMaterialCodeChange = (index: number, materialCode: string) => {
    const item = formData.items[index]
    if (!item || !isFromKuwaitCity) return

    let selectedMaterial = null
    
    // Search in appropriate collection based on item type
    if (item.itemType === 'raw-material') {
      selectedMaterial = rawMaterials.find(rm => rm.materialCode === materialCode)
    } else if (item.itemType === 'finished-good') {
      selectedMaterial = finishedGoods.find(fg => fg.productCode === materialCode)
    }

    if (selectedMaterial) {
      updateTransferOrderItem(index, 'materialId', selectedMaterial.id || selectedMaterial._id)
      updateTransferOrderItem(index, 'materialCode', materialCode)
      updateTransferOrderItem(index, 'materialName', 
        item.itemType === 'raw-material' ? selectedMaterial.materialName : selectedMaterial.productName
      )
      updateTransferOrderItem(index, 'unitOfMeasure', selectedMaterial.unitOfMeasure)
      updateTransferOrderItem(index, 'unitPrice', selectedMaterial.unitPrice)
    } else {
      // Clear fields if no material found
      updateTransferOrderItem(index, 'materialId', '')
      updateTransferOrderItem(index, 'materialCode', materialCode)
      updateTransferOrderItem(index, 'materialName', '')
      updateTransferOrderItem(index, 'unitOfMeasure', '')
      updateTransferOrderItem(index, 'unitPrice', 0)
    }
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
          {!isFromKuwaitCity && (
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
          )}

          {/* Transfer Order Items */}
          <div>
            {isFromKuwaitCity ? (
              <>
                {/* Raw Materials Section - Only show if section is raw-materials or both */}
                {(kuwaitCitySection === 'raw-materials' || kuwaitCitySection === 'both') && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Raw Materials ({rawMaterials.length} available)
                    </h3>
                    <button
                      type="button"
                      onClick={() => addTransferOrderItem('raw-material')}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Raw Material
                    </button>
                  </div>
                  
                  {formData.items.filter(item => item.itemType === 'raw-material').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No raw materials added yet</p>
                      <p className="text-sm">Click "Add Raw Material" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .filter(({ item }) => item.itemType === 'raw-material')
                        .map(({ item, originalIndex }) => (
                        <div key={originalIndex} className="grid grid-cols-7 gap-3 p-4 border border-gray-200 rounded-lg bg-blue-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Material Code</label>
                            <select
                              className="input-field text-sm"
                              value={item.materialCode}
                              onChange={(e) => handleMaterialCodeChange(originalIndex, e.target.value)}
                            >
                              <option value="">Select Raw Material</option>
                              {rawMaterials.map(rm => (
                                <option key={rm.id || rm._id} value={rm.materialCode}>
                                  {rm.materialCode} - {rm.materialName}
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
                              placeholder="Material Name"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              className="input-field text-sm"
                              value={item.quantity}
                              onChange={(e) => updateTransferOrderItem(originalIndex, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                            <input
                              type="text"
                              className="input-field text-sm bg-gray-100"
                              value={item.unitOfMeasure}
                              placeholder="Unit"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field text-sm bg-gray-100"
                              value={item.unitPrice}
                              placeholder="0.00"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                            <input
                              type="text"
                              className="input-field text-sm"
                              value={item.remarks || ''}
                              onChange={(e) => updateTransferOrderItem(originalIndex, 'remarks', e.target.value)}
                              placeholder="Notes"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeTransferOrderItem(originalIndex)}
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
                  )}
                </div>
                )}

                {/* Finished Goods Section - Only show if section is finished-goods or both */}
                {(kuwaitCitySection === 'finished-goods' || kuwaitCitySection === 'both') && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Finished Goods ({finishedGoods.length} available)
                    </h3>
                    <button
                      type="button"
                      onClick={() => addTransferOrderItem('finished-good')}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Finished Good
                    </button>
                  </div>
                  
                  {formData.items.filter(item => item.itemType === 'finished-good').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No finished goods added yet</p>
                      <p className="text-sm">Click "Add Finished Good" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .filter(({ item }) => item.itemType === 'finished-good')
                        .map(({ item, originalIndex }) => (
                        <div key={originalIndex} className="grid grid-cols-7 gap-3 p-4 border border-gray-200 rounded-lg bg-green-50">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Product Code</label>
                            <select
                              className="input-field text-sm"
                              value={item.materialCode}
                              onChange={(e) => handleMaterialCodeChange(originalIndex, e.target.value)}
                            >
                              <option value="">Select Finished Good</option>
                              {finishedGoods.map(fg => (
                                <option key={fg.id || fg._id} value={fg.productCode}>
                                  {fg.productCode} - {fg.productName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                              type="text"
                              className="input-field text-sm bg-gray-100"
                              value={item.materialName}
                              placeholder="Product Name"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              className="input-field text-sm"
                              value={item.quantity}
                              onChange={(e) => updateTransferOrderItem(originalIndex, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                            <input
                              type="text"
                              className="input-field text-sm bg-gray-100"
                              value={item.unitOfMeasure}
                              placeholder="Unit"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field text-sm bg-gray-100"
                              value={item.unitPrice}
                              placeholder="0.00"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                            <input
                              type="text"
                              className="input-field text-sm"
                              value={item.remarks || ''}
                              onChange={(e) => updateTransferOrderItem(originalIndex, 'remarks', e.target.value)}
                              placeholder="Notes"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeTransferOrderItem(originalIndex)}
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
                  )}
                </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transfer Items</h3>
                  <button
                    type="button"
                    onClick={() => addTransferOrderItem('raw-material')}
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
                          value={item.remarks || ''}
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
              </>
            )}

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
