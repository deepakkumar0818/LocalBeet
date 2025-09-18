import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X, Package, ChefHat } from 'lucide-react'
import { ForecastItem, JobOrder, BillOfMaterials } from '../types'
import { apiService } from '../services/api'

const AddForecast: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    selectedJobOrderId: '',
    items: [] as ForecastItem[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [boms, setBoms] = useState<BillOfMaterials[]>([])
  const [loadingJobOrders, setLoadingJobOrders] = useState(false)
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadJobOrders()
    loadBOMs()
  }, [])

  const loadJobOrders = async () => {
    try {
      setLoadingJobOrders(true)
      console.log('Loading job orders from backend...')
      
      const response = await apiService.getJobOrders({
        limit: 1000
      })
      
      console.log('Job orders response:', response)
      
      if (response.success && response.data && response.data.length > 0) {
        setJobOrders(response.data)
        console.log('✅ Loaded job orders from backend:', response.data.length)
      } else {
        console.log('⚠️ No job orders found in backend')
        setJobOrders([])
      }
    } catch (error) {
      console.error('❌ Error loading job orders from backend:', error)
      setJobOrders([])
    } finally {
      setLoadingJobOrders(false)
    }
  }


  const loadBOMs = async () => {
    try {
      console.log('Loading BOMs from backend...')
      const response = await apiService.getBillOfMaterials({
        limit: 1000
      })
      
      if (response.success && response.data && response.data.length > 0) {
        setBoms(response.data)
        console.log('✅ Loaded BOMs from backend:', response.data.length)
      } else {
        console.log('⚠️ No BOMs found in backend')
        setBoms([])
      }
    } catch (error) {
      console.error('❌ Error loading BOMs from backend:', error)
      setBoms([])
    }
  }


  const handleJobOrderSelection = (jobOrderId: string) => {
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId)
    if (!jobOrder) return

    setSelectedJobOrder(jobOrder)
    setFormData(prev => ({ ...prev, selectedJobOrderId: jobOrderId }))

    // Generate forecast items
    const materialMap = new Map<string, ForecastItem>()
    
    jobOrder.items.forEach((jobItem) => {
      const bom = boms.find(b => b.id === jobItem.bomId)
      if (!bom) return

      bom.items.forEach(bomItem => {
        const key = bomItem.materialCode
        const totalQuantityNeeded = jobItem.totalQuantity * bomItem.quantity

        if (materialMap.has(key)) {
          const existing = materialMap.get(key)!
          existing.requiredQuantity += totalQuantityNeeded
          existing.forecastQuantity = existing.requiredQuantity
          existing.forecastValue = existing.forecastQuantity * existing.unitPrice
          existing.shortfall = Math.max(0, existing.requiredQuantity - existing.availableQuantity)
        } else {
          const forecastItem: ForecastItem = {
            materialId: bomItem.materialId,
            materialCode: bomItem.materialCode,
            materialName: bomItem.materialName,
            currentStock: 0,
            unitOfMeasure: bomItem.unitOfMeasure,
            unitPrice: bomItem.unitCost,
            forecastQuantity: totalQuantityNeeded,
            forecastValue: totalQuantityNeeded * bomItem.unitCost,
            leadTime: 3,
            requiredQuantity: totalQuantityNeeded,
            availableQuantity: 0,
            shortfall: totalQuantityNeeded,
            jobOrderId: jobOrder.id,
            jobOrderNumber: jobOrder.jobOrderNumber,
            bomId: bom.id,
            bomCode: bom.bomCode,
            notes: `Required for ${jobItem.product} (${jobItem.totalQuantity} units)`
          }
          materialMap.set(key, forecastItem)
        }
      })
    })

    setFormData(prev => ({ ...prev, items: Array.from(materialMap.values()) }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.selectedJobOrderId) {
      newErrors.selectedJobOrderId = 'Please select a Recipe Order'
    }
    if (formData.items.length === 0) {
      newErrors.items = 'No forecast items generated. Please select a Recipe Order with valid BOMs.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const totalValue = formData.items.reduce((sum, item) => sum + item.forecastValue, 0)
      const forecastNumber = `FC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      const forecastData = {
        forecastNumber,
        forecastName: `Forecast for ${selectedJobOrder?.jobOrderNumber}`,
        forecastDescription: `Material forecast based on Job Order ${selectedJobOrder?.jobOrderNumber}`,
        forecastPeriod: 'Monthly',
        forecastStartDate: new Date().toISOString().split('T')[0],
        forecastEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        totalValue: Math.round(totalValue * 100) / 100,
        items: formData.items,
        basedOnJobOrders: true,
        basedOnHistoricalData: false,
        confidenceLevel: 'Medium',
        createdBy: 'admin',
        updatedBy: 'admin'
      }

      console.log('Creating Forecast:', forecastData)
      
      // Save to backend
      const response = await apiService.createRawMaterialForecast(forecastData)
      
      if (response.success) {
        let message = 'Forecast created successfully!'
        
        // Check if Purchase Order was generated
        if (response.data && response.data.generatedPurchaseOrder) {
          const po = response.data.generatedPurchaseOrder
          message += `\n\n📦 Purchase Order Generated:\n` +
                    `PO Number: ${po.poNumber}\n` +
                    `Total Amount: ${po.totalAmount.toFixed(2)} KWD\n` +
                    `Items: ${po.items.length} materials\n` +
                    `Status: ${po.status}`
        }
        
        alert(message)
        navigate('/raw-material-forecast')
      } else {
        alert('Error creating forecast: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating forecast:', error)
      alert('Error creating forecast: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Ingredient Forecast</h1>
          <p className="text-gray-600">Create an ingredient forecast based on Job Orders</p>
        </div>
        <button
          onClick={() => navigate('/raw-material-forecast')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forecasts
        </button>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Recipe Order Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Step 1: Select Recipe Order</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recipe Order *
                </label>
                <select
                  className={`input-field ${errors.selectedJobOrderId ? 'border-red-500' : ''}`}
                  value={formData.selectedJobOrderId}
                  onChange={(e) => handleJobOrderSelection(e.target.value)}
                >
                  <option value="">Select a Recipe Order</option>
                  {loadingJobOrders ? (
                    <option disabled>Loading recipe orders...</option>
                  ) : (
                    jobOrders.map(jobOrder => (
                      <option key={jobOrder.id} value={jobOrder.id}>
                        Recipe Order #{jobOrder.jobOrderNumber} - {jobOrder.customerName} ({jobOrder.items.length} items)
                      </option>
                    ))
                  )}
                </select>
                {errors.selectedJobOrderId && (
                  <p className="mt-1 text-sm text-red-600">{errors.selectedJobOrderId}</p>
                )}
              </div>

              {selectedJobOrder && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Recipe Order Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Order Number:</span> {selectedJobOrder.jobOrderNumber}
                    </div>
                    <div>
                      <span className="font-medium">Customer:</span> {selectedJobOrder.customerName}
                    </div>
                    <div>
                      <span className="font-medium">Total Items:</span> {selectedJobOrder.items.length}
                    </div>
                    <div>
                      <span className="font-medium">Total Amount:</span> {selectedJobOrder.totalAmount.toFixed(2)} KWD
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipe Order Items and Ingredients */}
          {selectedJobOrder && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Step 2: Recipe Order Items & Ingredients</h3>
              <div className="space-y-4">
                {selectedJobOrder.items.map((jobItem, index) => {
                  const bom = boms.find(b => b.id === jobItem.bomId)
                  const itemId = `item-${index}`
                  const isExpanded = expandedItems.has(itemId)
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ChefHat className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">{jobItem.product}</h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {jobItem.totalQuantity} units | 
                              Unit Price: {jobItem.unitPrice.toFixed(2)} KWD | 
                              Total: {jobItem.totalPrice.toFixed(2)} KWD
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleItemExpansion(itemId)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {isExpanded ? 'Hide Ingredients' : 'Show Ingredients'}
                        </button>
                      </div>
                      
                      {isExpanded && bom && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">
                              Recipe: {bom.productName} ({bom.bomCode})
                            </span>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Unit</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Qty</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortfall</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {bom.items.map((bomItem, bomIndex) => {
                                  const requiredQty = jobItem.totalQuantity * bomItem.quantity
                                  const availableQty = 0
                                  const shortfall = Math.max(0, requiredQty - availableQty)
                                  const totalCost = requiredQty * bomItem.unitCost
                                  
                                  return (
                                    <tr key={bomIndex} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{bomItem.materialName}</div>
                                          <div className="text-sm text-gray-500 font-mono">{bomItem.materialCode}</div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{bomItem.unitOfMeasure}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{bomItem.quantity}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 font-semibold">{requiredQty.toFixed(2)}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{availableQty.toFixed(2)}</td>
                                      <td className="px-3 py-2">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          shortfall > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                          {shortfall.toFixed(2)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{bomItem.unitCost.toFixed(2)} KWD</td>
                                      <td className="px-3 py-2 text-sm text-gray-900 font-semibold">{totalCost.toFixed(2)} KWD</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {formData.items.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Step 3: Forecast Summary</h3>
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-red-800 font-semibold text-lg">
                      {formData.items.reduce((sum, item) => sum + item.shortfall, 0).toFixed(2)}
                    </div>
                    <div className="text-red-600 text-sm">Total Shortfall</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-800 font-semibold text-lg">
                      {formData.items.reduce((sum, item) => sum + item.requiredQuantity, 0).toFixed(2)}
                    </div>
                    <div className="text-blue-600 text-sm">Total Required</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-800 font-semibold text-lg">
                      {formData.items.reduce((sum, item) => sum + item.availableQuantity, 0).toFixed(2)}
                    </div>
                    <div className="text-green-600 text-sm">Total Available</div>
                  </div>
                </div>

                {/* Items Summary Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortfall</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.materialName}</div>
                              <div className="text-sm text-gray-500 font-mono">{item.materialCode}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitOfMeasure}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.requiredQuantity.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.availableQuantity.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.shortfall > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.shortfall.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitPrice.toFixed(2)} KWD</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.forecastValue.toFixed(2)} KWD</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div>
                              <div className="font-mono text-xs">{item.jobOrderNumber}</div>
                              <div className="text-xs">{item.bomCode}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        Total Forecast Value: {formData.items.reduce((sum, item) => sum + item.forecastValue, 0).toFixed(2)} KWD
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-red-600">
                        Total Shortfall Value: {formData.items.reduce((sum, item) => sum + (item.shortfall * item.unitPrice), 0).toFixed(2)} KWD
                      </span>
                    </div>
                  </div>
                  
                  {/* Purchase Order Generation Notice */}
                  {formData.items.some(item => item.shortfall > 0) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            📦 Purchase Order will be automatically generated for shortfall quantities
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Total PO Value: {formData.items.reduce((sum, item) => sum + (item.shortfall * item.unitPrice), 0).toFixed(2)} KWD
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          {formData.items.length > 0 && (
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/raw-material-forecast')}
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
                Generate Forecast
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default AddForecast
