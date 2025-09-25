import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  CreditCard, 
  ArrowLeft,
  Clock,
  Package
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  isAvailable: boolean
  image?: string
}

interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

interface Customer {
  id?: string
  name: string
  phone: string
  email?: string
  address?: string
}

const POSCreateOrder: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const outletName = location.state?.outletName || 'Outlet'
  
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [tax] = useState(0)
  const [loading, setLoading] = useState(false)

  // Sample products data
  useEffect(() => {
    const sampleProducts: Product[] = [
      {
        id: 'prod-001',
        name: 'Caesar Salad',
        price: 8.50,
        category: 'Salads',
        description: 'Fresh romaine lettuce with caesar dressing',
        isAvailable: true
      },
      {
        id: 'prod-002',
        name: 'Chicken Burger',
        price: 12.00,
        category: 'Burgers',
        description: 'Grilled chicken breast with fresh vegetables',
        isAvailable: true
      },
      {
        id: 'prod-003',
        name: 'Margherita Pizza',
        price: 15.00,
        category: 'Pizza',
        description: 'Classic tomato and mozzarella pizza',
        isAvailable: true
      },
      {
        id: 'prod-004',
        name: 'Chicken Shawarma',
        price: 10.50,
        category: 'Middle Eastern',
        description: 'Traditional chicken shawarma wrap',
        isAvailable: true
      },
      {
        id: 'prod-005',
        name: 'Fresh Juice',
        price: 4.00,
        category: 'Beverages',
        description: 'Freshly squeezed orange juice',
        isAvailable: true
      },
      {
        id: 'prod-006',
        name: 'Coffee',
        price: 3.50,
        category: 'Beverages',
        description: 'Freshly brewed coffee',
        isAvailable: true
      },
      {
        id: 'prod-007',
        name: 'Chocolate Cake',
        price: 6.00,
        category: 'Desserts',
        description: 'Rich chocolate cake slice',
        isAvailable: true
      },
      {
        id: 'prod-008',
        name: 'Fish & Chips',
        price: 14.00,
        category: 'Main Course',
        description: 'Beer-battered fish with crispy fries',
        isAvailable: true
      }
    ]
    setProducts(sampleProducts)
  }, [])

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.isAvailable
  })

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, subtotal: product.price }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.price }
        : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const getTaxAmount = () => {
    return (getSubtotal() * tax) / 100
  }

  const getDiscountAmount = () => {
    return (getSubtotal() * discount) / 100
  }

  const getTotal = () => {
    return getSubtotal() + getTaxAmount() - getDiscountAmount()
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart before checkout')
      return
    }

    setLoading(true)
    
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const order = {
        id: `ORD-${Date.now()}`,
        outletName,
        customer: customer || { name: 'Walk-in Customer', phone: '', email: '' },
        items: cart,
        subtotal: getSubtotal(),
        tax: getTaxAmount(),
        discount: getDiscountAmount(),
        total: getTotal(),
        paymentMethod,
        status: 'Completed',
        createdAt: new Date().toISOString()
      }

      console.log('Order created:', order)
      
      // Show success message
      alert(`Order ${order.id} created successfully!\nTotal: KD ${order.total.toFixed(2)}`)
      
      // Clear cart and reset form
      setCart([])
      setCustomer(null)
      setDiscount(0)
      
    } catch (error) {
      alert('Error creating order. Please try again.')
      console.error('Error creating order:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Are you sure you want to clear the cart?')) {
      setCart([])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS - Create Order</h1>
              <p className="text-gray-600">{outletName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="card p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <span className="text-green-600 font-semibold">KD {product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {product.category}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-600">KD {item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-sm">KD {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>KD {getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax ({tax}%):</span>
                    <span>KD {getTaxAmount().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Discount ({discount}%):</span>
                    <span className="text-red-600">-KD {getDiscountAmount().toFixed(2)}</span>
                  </div>
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>KD {getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Customer Info (Optional)</label>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={customer?.name || ''}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value, phone: customer?.phone || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customer?.phone || ''}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value, name: customer?.name || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Payment Method */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="knet">KNET</option>
                    <option value="apple_pay">Apple Pay</option>
                    <option value="google_pay">Google Pay</option>
                  </select>
                </div>

                {/* Discount */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading || cart.length === 0}
                  className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Complete Order - KD {getTotal().toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default POSCreateOrder

