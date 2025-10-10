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
  Package,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { apiService } from '../services/api'

interface Product {
  _id: string
  productCode: string
  productName: string
  category: string
  subCategory?: string
  unitPrice: number
  currentStock: number
  unitOfMeasure: string
  status: string
  isActive: boolean
}

interface Recipe { id?: string; bomCode: string; productName: string; productDescription?: string; totalCost?: number }
type CartKind = 'finished' | 'recipe'
interface CartItem {
  kind: CartKind
  product?: Product
  recipe?: Recipe
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

interface OrderType {
  value: 'Dine-in' | 'Takeaway' | 'Delivery' | 'Drive-thru'
  label: string
  icon: string
}

// Helper function to get outlet name from slug
function getOutletNameFromSlug(slug: string): string {
  // Map URL slug to ACTUAL outlet names stored in DB
  // Use names seen in /outlets list: 'Kuwait City', 'Marina Walk Cafe', 'Mall Food Court', 'Drive-Thru Express'
  const slugMap: Record<string, string> = {
    'kuwait-city': 'Kuwait City',
    'downtown-restaurant': 'Kuwait City',
    '360-mall': 'Marina Walk Cafe',
    'marina-walk-cafe': 'Marina Walk Cafe',
    'vibes-complex': 'Mall Food Court',
    'mall-food-court': 'Mall Food Court',
    'taiba-hospital': 'Drive-Thru Express',
    'drive-thru-express': 'Drive-Thru Express'
  }
  return slugMap[slug.toLowerCase()] || 'Kuwait City'
}

const POSCreateOrder: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get outlet from URL path
  const outletSlug = location.pathname.split('/')[1] // e.g., '360-mall' from '/360-mall/pos-sales/create-order'
  const outletName = getOutletNameFromSlug(outletSlug)
  
  // Debug logging
  console.log('POSCreateOrder - URL Path:', location.pathname)
  console.log('POSCreateOrder - Outlet Slug:', outletSlug)
  console.log('POSCreateOrder - Outlet Name:', outletName)
  
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<'finished'|'recipe'>('finished')
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    email: ''
  })
  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | 'Delivery' | 'Drive-thru'>('Dine-in')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Digital Wallet' | 'Credit' | 'Mixed'>('Cash')
  const [discount, setDiscount] = useState(0)
  const [tax] = useState(15) // 15% tax
  const [loading, setLoading] = useState(false)
  const [outlet, setOutlet] = useState<any>(null)
  const [existingOrders, setExistingOrders] = useState<any[]>([])

  // Order type options
  const orderTypes: OrderType[] = [
    { value: 'Dine-in', label: 'Dine-in', icon: '🍽️' },
    { value: 'Takeaway', label: 'Takeaway', icon: '🥡' },
    { value: 'Delivery', label: 'Delivery', icon: '🚚' },
    { value: 'Drive-thru', label: 'Drive-thru', icon: '🚗' }
  ]

  // Load outlet data, products, and existing orders
  useEffect(() => {
    console.log('useEffect triggered - outletName changed to:', outletName)
    console.log('useEffect - location.pathname:', location.pathname)
    console.log('useEffect - outletSlug:', outletSlug)
    
    // Reset states when outlet changes
    setExistingOrders([])
    setProducts([])
    setOutlet(null)
    
    loadOutletData()
    loadProducts()
    loadRecipes()
    loadExistingOrders()
  }, [outletName, location.pathname])

  const loadOutletData = async () => {
    try {
      console.log('loadOutletData - Looking for outlet:', outletName)
      const outletsResponse = await apiService.getOutlets({ limit: 1000 })
      if (outletsResponse.success && Array.isArray(outletsResponse.data)) {
        console.log('loadOutletData - Available outlets:', outletsResponse.data.map(o => o.outletName))
        const match = outletsResponse.data.find((o: any) => o.outletName === outletName)
        if (match) {
          console.log('loadOutletData - Found outlet match:', match)
          setOutlet(match)
        } else {
          console.log('loadOutletData - No outlet match found for:', outletName)
        }
      }
    } catch (error) {
      console.error('Error loading outlet data:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      let response
      
      console.log('loadProducts - Loading products for outlet:', outletName)
      
      // Load outlet-specific finished products
      if (outletName === 'Kuwait City') {
        console.log('loadProducts - Calling getKuwaitCityFinishedProducts')
        response = await apiService.getKuwaitCityFinishedProducts({ limit: 1000 })
      } else if (outletName === 'Marina Walk Cafe') {
        console.log('loadProducts - Calling get360MallFinishedProducts')
        response = await apiService.get360MallFinishedProducts({ limit: 1000 })
      } else if (outletName === 'Mall Food Court') {
        console.log('loadProducts - Calling getVibeComplexFinishedProducts')
        response = await apiService.getVibeComplexFinishedProducts({ limit: 1000 })
      } else if (outletName === 'Drive-Thru Express') {
        console.log('loadProducts - Calling getTaibaKitchenFinishedProducts')
        response = await apiService.getTaibaKitchenFinishedProducts({ limit: 1000 })
      } else {
        console.log('loadProducts - Fallback to getFinishedGoods')
        // Fallback to general finished goods
        response = await apiService.getFinishedGoods({ limit: 1000 })
      }

      if (response.success && Array.isArray(response.data)) {
        console.log('loadProducts - Raw response data:', response.data.length, 'products')
        // Filter only active products with stock
        const availableProducts = response.data.filter((product: Product) => 
          product.isActive && product.currentStock > 0 && product.status !== 'Out of Stock'
        )
        console.log('loadProducts - Filtered available products:', availableProducts.length, 'products')
        console.log('loadProducts - First few products:', availableProducts.slice(0, 3).map(p => ({ name: p.productName, stock: p.currentStock })))
        setProducts(availableProducts)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadRecipes = async () => {
    try {
      // Show all recipes regardless of status (Draft/Active) so POS can test/use them
      const res = await apiService.getBillOfMaterials({ limit: 1000, sortBy: 'productName', sortOrder: 'asc' })
      if (res.success && Array.isArray(res.data)) {
        const mapped: Recipe[] = res.data.map((r:any)=>({ id: r.id||r._id, bomCode: r.bomCode, productName: r.productName, productDescription: r.productDescription, totalCost: r.totalCost }))
        setRecipes(mapped)
      } else {
        setRecipes([])
      }
    } catch (e) {
      console.error('Error loading recipes:', e)
      setRecipes([])
    }
  }

  const loadExistingOrders = async () => {
    try {
      console.log('loadExistingOrders - Loading orders for outlet:', outletName)
      const response = await apiService.getSalesOrders({
        outletName: outletName,
        limit: 10, // Show only last 10 orders
        sortBy: 'orderTiming.orderDate',
        sortOrder: 'desc'
      })
      
      if (response.success && Array.isArray(response.data)) {
        console.log('loadExistingOrders - Found orders:', response.data.length)
        setExistingOrders(response.data)
      }
    } catch (error) {
      console.error('Error loading existing orders:', error)
      setExistingOrders([])
    }
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory && product.isActive && product.currentStock > 0
  })

  const addToCart = (product: Product) => {
    // Check if product has enough stock
    const existingItem = cart.find(item => item.kind==='finished' && item.product && item.product._id === product._id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    
    if (currentQuantity >= product.currentStock) {
      alert(`Only ${product.currentStock} ${product.unitOfMeasure} available in stock`)
      return
    }
    
    if (existingItem) {
      setCart(cart.map(item =>
        (item.kind==='finished' && item.product && item.product._id === product._id)
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.unitPrice }
          : item
      ))
    } else {
      setCart([...cart, { kind:'finished', product, quantity: 1, subtotal: product.unitPrice }])
    }
  }

  const addRecipeToCart = (recipe: Recipe) => {
    const existing = cart.find(ci => ci.kind==='recipe' && ci.recipe && ci.recipe.bomCode === recipe.bomCode)
    if (existing) {
      setCart(prev => prev.map(ci => (ci.kind==='recipe' && ci.recipe && ci.recipe.bomCode===recipe.bomCode) ? { ...ci, quantity: ci.quantity+1, subtotal: (ci.quantity+1) * (ci.recipe.totalCost||0) } : ci))
    } else {
      setCart(prev => [...prev, { kind:'recipe', recipe, quantity:1, subtotal: recipe.totalCost||0 }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(ci => !(ci.kind==='finished' && ci.product && ci.product._id===productId)))
      return
    }
    
    // Check stock availability
    const cartItem = cart.find(item => item.kind==='finished' && item.product && item.product._id === productId)
    if (cartItem && newQuantity > cartItem.product.currentStock) {
      alert(`Only ${cartItem.product.currentStock} ${cartItem.product.unitOfMeasure} available in stock`)
      return
    }
    
    setCart(cart.map(item =>
      (item.kind==='finished' && item.product && item.product._id === productId)
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.product.unitPrice }
        : item
    ))
  }

  const removeRecipeFromCart = (bomCode: string) => {
    setCart(prev => prev.filter(ci => !(ci.kind==='recipe' && ci.recipe && ci.recipe.bomCode === bomCode)))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId))
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

    if (!customer.name.trim()) {
      alert('Please enter customer name')
      return
    }

    // Ensure outlet is resolved. If not, try once more.
    if (!outlet) {
      await loadOutletData()
    }
    if (!outlet) {
      alert('Unable to resolve outlet for this order. Please reload the page and try again.')
      return
    }

    setLoading(true)
    
    try {
      // Prepare order items for API (finished goods)
      const finishedCartItems = cart.filter(ci => ci.kind==='finished' && ci.product)
      const orderItems = finishedCartItems.map(item => ({
        productId: item.product!._id,
        productCode: item.product!.productCode,
        productName: item.product!.productName,
        category: item.product!.category,
        quantity: item.quantity,
        unitPrice: item.product!.unitPrice,
        totalPrice: item.subtotal
      }))

      // Prepare recipe items for API
      const recipeCartItems = cart.filter(ci => ci.kind==='recipe' && ci.recipe)
      const recipeItems = recipeCartItems.map(item => ({
        bomCode: item.recipe!.bomCode,
        productName: item.recipe!.productName,
        quantity: item.quantity,
        unitPrice: item.recipe!.totalCost || 0
      }))

      // Prepare sales order data
      const salesOrderData = {
        outletId: outlet?._id || outlet?.id,
        outletCode: outlet?.outletCode,
        outletName: outletName,
        outletSlug: outletSlug,
        customerInfo: {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          orderType: orderType
        },
        orderItems: orderItems,
        recipeItems: recipeItems,
        orderSummary: {
          subtotal: getSubtotal(),
          taxAmount: getTaxAmount(),
          discountAmount: getDiscountAmount(),
          totalAmount: getTotal(),
          paymentMethod: paymentMethod,
          paymentStatus: 'Paid'
        },
        orderStatus: 'Completed',
        orderTiming: {
          orderDate: new Date().toISOString(),
          estimatedPrepTime: 15
        },
        notes: `POS Order - ${orderType}`,
        createdBy: 'pos-user',
        updatedBy: 'pos-user'
      }

      console.log('Creating Sales Order:', salesOrderData)
      console.log('Outlet object:', outlet)
      console.log('Outlet slug:', outletSlug)
      
      // Create the sales order (this will automatically sync inventory)
      const response = await apiService.createSalesOrder(salesOrderData)
      
        if (response.success) {
          const orderNumber = response.data.orderNumber
          alert(`Order ${orderNumber} created successfully!\nTotal: $${getTotal().toFixed(2)}\n\nPlease refresh the sales orders page to see the new order.`)
          
          // Clear cart and reset form
          setCart([])
          setCustomer({ name: '', phone: '', email: '' })
          setDiscount(0)
          
          // Reload products to reflect updated stock
          await loadProducts()
          
          // Reload existing orders to show the new order
          await loadExistingOrders()
          
          // Small delay before navigation to ensure order is processed
          setTimeout(() => {
            // Navigate back to sales orders page
            const outletPathMap: Record<string, string> = {
              'Kuwait City': 'kuwait-city',
              '360 Mall': '360-mall', 
              'Vibes Complex': 'vibes-complex',
              'Taiba Hospital': 'taiba-hospital'
            }
            const outletPath = outletPathMap[outletName] || outletSlug
            navigate(`/${outletPath}/sales-orders`)
          }, 1000)
        } else {
          alert('Failed to create order: ' + response.message)
        }
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error creating order: ' + (error instanceof Error ? error.message : 'Unknown error'))
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

        {/* Tab Switcher */}
        <div className="mb-4">
          <div className="inline-flex rounded-md shadow-sm overflow-hidden" role="group">
            <button onClick={() => setActiveTab('finished')} className={`px-4 py-2 text-sm font-medium border ${activeTab==='finished' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>Finished Goods</button>
            <button onClick={() => setActiveTab('recipe')} className={`px-4 py-2 text-sm font-medium border -ml-px ${activeTab==='recipe' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>Recipes</button>
          </div>
        </div>

        {/* Recent Orders Section removed per requirement - orders are shown on outer page */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products / Recipes Section */}
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
                {activeTab==='finished' && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                )}
              </div>
            </div>

            {/* Products/Recipes Grid */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">{activeTab==='finished' ? 'Available Products' : 'Available Recipes'}</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : activeTab==='finished' ? (
                filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No products available</p>
                  <p className="text-sm">Check back later or contact admin</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                  <div
                    key={product._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                    onKeyDown={(e) => e.key === 'Enter' && addToCart(product)}
                    role="button"
                    tabIndex={0}
                  >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <span className="text-green-600 font-semibold">${product.unitPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Code: {product.productCode}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {product.category}
                        </span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Stock: {product.currentStock} {product.unitOfMeasure}
                        </span>
                      </div>
                      <button className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )
              ) : (
                recipes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recipes available</p>
                    <p className="text-sm">Add recipes in Recipe Master (BOM)</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {recipes.filter(r => r.productName.toLowerCase().includes(searchTerm.toLowerCase()) || r.bomCode.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                      <div key={r.bomCode} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => addRecipeToCart(r)}
                        onKeyDown={(e)=> e.key==='Enter' && addRecipeToCart(r)} role="button" tabIndex={0}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{r.productName}</h4>
                          <span className="text-green-600 font-semibold">{r.totalCost ? `$${r.totalCost.toFixed(2)}` : 'Recipe'}</span>
                        </div>
                        <div className="text-sm text-gray-500">Code: {r.bomCode}</div>
                        {r.productDescription && <div className="text-xs text-gray-400 mt-1">{r.productDescription}</div>}
                        <div className="mt-3">
                          <button className="text-indigo-600 text-sm font-medium">Add to Cart</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
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
                    item.kind === 'finished' && item.product ? (
                      <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.productName}</h4>
                          <p className="text-xs text-gray-600">${item.product.unitPrice.toFixed(2)} each</p>
                          <p className="text-xs text-gray-500">Stock: {item.product.currentStock} {item.product.unitOfMeasure}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(item.product!._id, item.quantity - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus className="h-3 w-3" /></button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product!._id, item.quantity + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => removeFromCart(item.product!._id)} className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"><Trash2 className="h-3 w-3" /></button>
                        </div>
                        <div className="text-right ml-4"><p className="font-medium text-sm">${item.subtotal.toFixed(2)}</p></div>
                      </div>
                    ) : item.kind === 'recipe' && item.recipe ? (
                      <div key={`recipe-${item.recipe.bomCode}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.recipe.productName} <span className="text-xs text-gray-500">(Recipe)</span></h4>
                          <p className="text-xs text-gray-600">{item.recipe.totalCost ? `$${item.recipe.totalCost.toFixed(2)} each` : 'Cost not set'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateRecipeQuantity(`recipe-${item.recipe!.bomCode}`, item.quantity - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus className="h-3 w-3" /></button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateRecipeQuantity(`recipe-${item.recipe!.bomCode}`, item.quantity + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus className="h-3 w-3" /></button>
                          <button onClick={() => removeRecipeFromCart(item.recipe!.bomCode)} className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"><Trash2 className="h-3 w-3" /></button>
                        </div>
                        <div className="text-right ml-4"><p className="font-medium text-sm">${item.subtotal.toFixed(2)}</p></div>
                      </div>
                    ) : null
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
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax ({tax}%):</span>
                    <span>${getTaxAmount().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Discount ({discount}%):</span>
                    <span className="text-red-600">-${getDiscountAmount().toFixed(2)}</span>
                  </div>
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Order Type */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Order Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {orderTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setOrderType(type.value)}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          orderType === type.value
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-1">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Customer Info</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Customer name *"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={customer.email || ''}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Credit">Credit</option>
                    <option value="Mixed">Mixed</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      Complete Order - ${getTotal().toFixed(2)}
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

