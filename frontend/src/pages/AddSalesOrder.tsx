import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, User, Phone, Mail, MapPin, Clock, Package } from 'lucide-react'
import { apiService } from '../services/api'

interface SalesOrderItem {
  productId: string
  productCode: string
  productName: string
  category: string
  quantity: number
  unitPrice: number
  totalPrice: number
  specialInstructions?: string
}

interface SalesOrder {
  orderNumber: string
  outletId: string
  outletCode: string
  outletName: string
  customerInfo: {
    customerName: string
    customerPhone?: string
    customerEmail?: string
    tableNumber?: string
    orderType: 'Dine-in' | 'Takeaway' | 'Delivery' | 'Drive-thru'
  }
  orderItems: SalesOrderItem[]
  orderSummary: {
    subtotal: number
    taxAmount: number
    discountAmount: number
    totalAmount: number
    paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Credit' | 'Mixed'
    paymentStatus: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded'
  }
  orderStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled'
  orderTiming: {
    orderDate: string
    estimatedPrepTime?: number
  }
  notes?: string
}

const AddSalesOrder: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [outlet, setOutlet] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    outletId: '',
    outletCode: '',
    outletName: '',
    customerInfo: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tableNumber: '',
      orderType: 'Dine-in' as 'Dine-in' | 'Takeaway' | 'Delivery' | 'Drive-thru'
    },
    orderItems: [] as SalesOrderItem[],
    orderSummary: {
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: 'Cash' as 'Cash' | 'Card' | 'Digital Wallet' | 'Credit' | 'Mixed',
      paymentStatus: 'Pending' as 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded'
    },
    orderStatus: 'Pending' as 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled',
    orderTiming: {
      orderDate: new Date().toISOString().split('T')[0],
      estimatedPrepTime: 15
    },
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [searchTerm] = useState('')

  // Detect outlet from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const outletParam = urlParams.get('outlet')
    
    if (outletParam) {
      loadOutletData(outletParam)
    } else {
      // Default to first available outlet
      loadDefaultOutlet()
    }
  }, [location.search])

  const loadOutletData = async (outletSlug: string) => {
    try {
      setLoading(true)
      
      // Resolve real outlet from API instead of hardcoded ids
      const slugToName: Record<string, string> = {
        'kuwait-city': 'Kuwait City',
        '360-mall': '360 Mall',
        'marina-walk-cafe': '360 Mall',
        'vibes-complex': 'Vibes Complex',
        'mall-food-court': 'Vibes Complex',
        'taiba-hospital': 'Taiba Hospital',
        'drive-thru-express': 'Taiba Hospital',
      }
      const targetName = slugToName[outletSlug] || outletSlug

      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success && Array.isArray(outletsResponse.data)) {
        const match = outletsResponse.data.find((o: any) => o.outletName === targetName)
        if (match) {
          setOutlet(match)
          setFormData(prev => ({
            ...prev,
            outletId: match._id || match.id,
            outletCode: match.outletCode,
            outletName: match.outletName,
            orderNumber: `SO-${match.outletCode}-${Date.now().toString().slice(-6)}`
          }))
        }
      }
      
      await loadProducts()
    } catch (err) {
      console.error('Error loading outlet data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDefaultOutlet = async () => {
    try {
      setLoading(true)
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      
      if (outletsResponse.success && outletsResponse.data.length > 0) {
        const defaultOutlet = outletsResponse.data[0]
        setOutlet(defaultOutlet)
        setFormData(prev => ({
          ...prev,
          outletId: defaultOutlet._id || defaultOutlet.id,
          outletCode: defaultOutlet.outletCode,
          outletName: defaultOutlet.outletName,
          orderNumber: `SO-${defaultOutlet.outletCode}-${Date.now().toString().slice(-6)}`
        }))
      }
      
      await loadProducts()
    } catch (err) {
      console.error('Error loading default outlet:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      // Fetch finished goods for current outlet to ensure only available items are shown
      const outletName = (outlet?.outletName as string) || formData.outletName
      let response: any
      if (outletName) {
        response = await apiService.getOutletFinishedGoods(outletName, { limit: 1000 })
      } else {
        response = await apiService.getOutletFinishedGoods('Kuwait City', { limit: 1000 })
      }
      if (response.success) {
        setProducts(response.data)
      } else {
        // If API fails, load sample products
        console.log('API failed, loading sample products')
        loadSampleProducts()
      }
    } catch (err) {
      console.error('Error loading products:', err)
      // If API fails, load sample products
      loadSampleProducts()
    }
  }

  const loadSampleProducts = () => {
    const sampleProducts = [
      {
        _id: 'fg-001',
        id: 'fg-001',
        productCode: 'FG-001',
        productName: 'Fresh Green Smoothie',
        category: 'Beverages',
        unitPrice: 4.50,
        description: 'Fresh green smoothie with spinach, banana, and apple'
      },
      {
        _id: 'fg-002',
        id: 'fg-002',
        productCode: 'FG-002',
        productName: 'Protein Power Bowl',
        category: 'Meals',
        unitPrice: 8.75,
        description: 'High protein meal bowl with quinoa and vegetables'
      },
      {
        _id: 'fg-003',
        id: 'fg-003',
        productCode: 'FG-003',
        productName: 'Detox Juice Blend',
        category: 'Beverages',
        unitPrice: 5.25,
        description: 'Fresh detox juice blend with celery and cucumber'
      },
      {
        _id: 'fg-004',
        id: 'fg-004',
        productCode: 'FG-004',
        productName: 'Quinoa Salad',
        category: 'Meals',
        unitPrice: 7.50,
        description: 'Healthy quinoa salad with mixed vegetables'
      },
      {
        _id: 'fg-005',
        id: 'fg-005',
        productCode: 'FG-005',
        productName: 'Energy Protein Bar',
        category: 'Snacks',
        unitPrice: 3.25,
        description: 'High protein energy bar for quick nutrition'
      },
      {
        _id: 'fg-006',
        id: 'fg-006',
        productCode: 'FG-006',
        productName: 'Fresh Fruit Bowl',
        category: 'Meals',
        unitPrice: 6.00,
        description: 'Mixed fresh fruit bowl with seasonal fruits'
      },
      {
        _id: 'fg-007',
        id: 'fg-007',
        productCode: 'FG-007',
        productName: 'Acai Bowl',
        category: 'Meals',
        unitPrice: 9.50,
        description: 'Nutritious acai bowl with granola and berries'
      },
      {
        _id: 'fg-008',
        id: 'fg-008',
        productCode: 'FG-008',
        productName: 'Cold Brew Coffee',
        category: 'Beverages',
        unitPrice: 3.75,
        description: 'Smooth cold brew coffee with natural sweetness'
      }
    ]
    setProducts(sampleProducts)
  }

  const orderTypeOptions = ['Dine-in', 'Takeaway', 'Delivery', 'Drive-thru']
  const paymentMethodOptions = ['Cash', 'Card', 'Digital Wallet', 'Credit', 'Mixed']
  const paymentStatusOptions = ['Pending', 'Paid', 'Partially Paid', 'Refunded']
  const orderStatusOptions = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled']

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required'
    }
    if (!formData.customerInfo.customerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }
    if (!formData.customerInfo.orderType) {
      newErrors.orderType = 'Order type is required'
    }
    if (formData.orderItems.length === 0) {
      newErrors.orderItems = 'At least one item is required'
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
      // Calculate totals
      const subtotal = formData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const taxAmount = subtotal * 0.15 // 15% tax
      const totalAmount = subtotal + taxAmount - formData.orderSummary.discountAmount

      const salesOrderData: SalesOrder = {
        orderNumber: formData.orderNumber,
        outletId: formData.outletId,
        outletCode: formData.outletCode,
        outletName: formData.outletName,
        customerInfo: formData.customerInfo,
        orderItems: formData.orderItems,
        orderSummary: {
          ...formData.orderSummary,
          subtotal,
          taxAmount,
          totalAmount
        },
        orderStatus: formData.orderStatus,
        orderTiming: formData.orderTiming,
        notes: formData.notes
      }

      console.log('Creating Sales Order:', salesOrderData)
      
      const response = await apiService.createSalesOrder(salesOrderData)
      
      if (response.success) {
        alert('Sales Order created successfully!')
        // Navigate back to the appropriate sales orders page
        const outletFromPath = new URLSearchParams(location.search).get('outlet')
        if (outletFromPath) {
          if (outletFromPath === 'Central Kitchen') {
            navigate('/central-kitchen')
          } else {
            const outletPath = outletFromPath.toLowerCase().replace(/\s+/g, '-')
            navigate(`/${outletPath}/sales-orders`)
          }
        } else {
          navigate('/sales-orders')
        }
      } else {
        alert('Failed to create Sales Order: ' + response.message)
      }
    } catch (error) {
      console.error('Error creating Sales Order:', error)
      alert('Error creating Sales Order: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addOrderItem = () => {
    const newItem: SalesOrderItem = {
      productId: '',
      productCode: '',
      productName: '',
      category: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      specialInstructions: ''
    }
    setFormData(prev => ({ ...prev, orderItems: [...prev.orderItems, newItem] }))
  }

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.orderItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity
      const unitPrice = field === 'unitPrice' ? Number(value) : updatedItems[index].unitPrice
      updatedItems[index].totalPrice = quantity * unitPrice
    }
    
    // Update product details when product is selected
    if (field === 'productId' && typeof value === 'string') {
      const product = products.find(p => p._id === value || p.id === value)
      if (product) {
        updatedItems[index].productCode = product.productCode
        updatedItems[index].productName = product.productName
        updatedItems[index].category = product.category
        updatedItems[index].unitPrice = product.unitPrice
        updatedItems[index].totalPrice = updatedItems[index].quantity * product.unitPrice
      }
    }
    
    setFormData(prev => ({ ...prev, orderItems: updatedItems }))
  }

  const removeOrderItem = (index: number) => {
    const updatedItems = formData.orderItems.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, orderItems: updatedItems }))
  }

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales order form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
          <p className="text-gray-600">
            {outlet ? `${outlet.outletName} (${outlet.outletCode})` : 'Select an outlet'}
          </p>
        </div>
        <button
          onClick={() => navigate('/sales-orders')}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales Orders
        </button>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Order Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.orderNumber ? 'border-red-500' : ''}`}
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                  placeholder="Enter order number"
                />
                {errors.orderNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.orderNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Date *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.orderDate ? 'border-red-500' : ''}`}
                  value={formData.orderTiming.orderDate}
                  onChange={(e) => handleInputChange('orderTiming.orderDate', e.target.value)}
                />
                {errors.orderDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.customerName ? 'border-red-500' : ''}`}
                  value={formData.customerInfo.customerName}
                  onChange={(e) => handleInputChange('customerInfo.customerName', e.target.value)}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type *
                </label>
                <select
                  className={`input-field ${errors.orderType ? 'border-red-500' : ''}`}
                  value={formData.customerInfo.orderType}
                  onChange={(e) => handleInputChange('customerInfo.orderType', e.target.value)}
                >
                  {orderTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.orderType && (
                  <p className="mt-1 text-sm text-red-600">{errors.orderType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.customerInfo.customerPhone}
                  onChange={(e) => handleInputChange('customerInfo.customerPhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.customerInfo.customerEmail}
                  onChange={(e) => handleInputChange('customerInfo.customerEmail', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              {formData.customerInfo.orderType === 'Dine-in' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Table Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.customerInfo.tableNumber}
                    onChange={(e) => handleInputChange('customerInfo.tableNumber', e.target.value)}
                    placeholder="Enter table number"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Order Items
              </h3>
              <button
                type="button"
                onClick={addOrderItem}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {formData.orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No items added yet. Click "Add Item" to start building the order.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.orderItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product *
                        </label>
                        <select
                          className="input-field"
                          value={item.productId}
                          onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map(product => (
                            <option key={product._id || product.id} value={product._id || product.id}>
                              {product.productName} - {product.unitPrice.toFixed(2)} KWD
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="input-field"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Price (KWD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="input-field"
                          value={item.unitPrice}
                          onChange={(e) => updateOrderItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Price (KWD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="input-field bg-gray-50"
                          value={item.totalPrice.toFixed(2)}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        className="input-field"
                        rows={2}
                        value={item.specialInstructions}
                        onChange={(e) => updateOrderItem(index, 'specialInstructions', e.target.value)}
                        placeholder="Any special instructions for this item..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.orderItems && (
              <p className="mt-2 text-sm text-red-600">{errors.orderItems}</p>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtotal (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field bg-gray-50"
                    value={formData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.orderSummary.discountAmount}
                    onChange={(e) => handleInputChange('orderSummary.discountAmount', (parseFloat(e.target.value) || 0).toString())}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Amount (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field bg-gray-50"
                    value={(formData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.15).toFixed(2)}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (KWD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field bg-blue-50 font-semibold"
                    value={(
                      formData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0) +
                      (formData.orderItems.reduce((sum, item) => sum + item.totalPrice, 0) * 0.15) -
                      formData.orderSummary.discountAmount
                    ).toFixed(2)}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    className="input-field"
                    value={formData.orderSummary.paymentMethod}
                    onChange={(e) => handleInputChange('orderSummary.paymentMethod', e.target.value)}
                  >
                    {paymentMethodOptions.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    className="input-field"
                    value={formData.orderSummary.paymentStatus}
                    onChange={(e) => handleInputChange('orderSummary.paymentStatus', e.target.value)}
                  >
                    {paymentStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status
                  </label>
                  <select
                    className="input-field"
                    value={formData.orderStatus}
                    onChange={(e) => handleInputChange('orderStatus', e.target.value)}
                  >
                    {orderStatusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Estimated Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={formData.orderTiming.estimatedPrepTime}
                    onChange={(e) => handleInputChange('orderTiming.estimatedPrepTime', (parseInt(e.target.value) || 15).toString())}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Notes
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes for this order..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/sales-orders')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSalesOrder
