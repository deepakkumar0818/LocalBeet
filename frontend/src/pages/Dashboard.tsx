import React, { useEffect, useMemo, useState } from 'react'
import { 
  ShoppingCart, 
  TrendingUp,
  Store,
  Coffee,
  ShoppingBag,
  Car,
  BarChart3
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import NotificationDropdown from '../components/NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'
import { apiService } from '../services/api'

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overall')
  // Dashboard filter: all | finished | recipe
  const [productFilter, setProductFilter] = useState<'all' | 'finished' | 'recipe'>('all')
  const [liveByTab, setLiveByTab] = useState<Record<string, any>>({})
  const [overallLive, setOverallLive] = useState<any | null>(null)
  const [liveLoading, setLiveLoading] = useState<boolean>(false)
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications('System')

  // Tab configuration
  const tabs = [
    { id: 'overall', name: 'Overall Sales', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'kuwait-city', name: 'Kuwait City', icon: Store, color: 'text-blue-600' },
    { id: '360-mall', name: '360 Mall', icon: Coffee, color: 'text-green-600' },
    { id: 'vibes-complex', name: 'Vibes Complex', icon: ShoppingBag, color: 'text-orange-600' },
    { id: 'taiba-hospital', name: 'Taiba Hospital', icon: Car, color: 'text-purple-600' }
  ]

  // Mock sales data for each outlet
  const outletSalesData = {
    'kuwait-city': {
      name: 'Kuwait City',
      totalSales: 125000,
      totalOrders: 156,
      avgOrderValue: 801,
      topProducts: [
        { name: 'Caesar Salad', sales: 12500, orders: 45, category: 'Recipe' },
        { name: 'Grilled Chicken', sales: 9800, orders: 38, category: 'Recipe' },
        { name: 'Pasta Carbonara', sales: 8700, orders: 32, category: 'Recipe' },
        { name: 'Heartbeet', sales: 11250, orders: 40, category: 'Finished Good' }
      ],
      dailySales: [
        { day: 'Mon', sales: 8500 },
        { day: 'Tue', sales: 9200 },
        { day: 'Wed', sales: 7800 },
        { day: 'Thu', sales: 10500 },
        { day: 'Fri', sales: 12800 },
        { day: 'Sat', sales: 15200 },
        { day: 'Sun', sales: 11800 }
      ],
      dailySalesFinished: [
        { day: 'Mon', sales: 4200 }, { day: 'Tue', sales: 5100 }, { day: 'Wed', sales: 3600 },
        { day: 'Thu', sales: 5600 }, { day: 'Fri', sales: 6900 }, { day: 'Sat', sales: 7800 }, { day: 'Sun', sales: 6000 }
      ],
      dailySalesRecipe: [
        { day: 'Mon', sales: 4300 }, { day: 'Tue', sales: 4100 }, { day: 'Wed', sales: 4200 },
        { day: 'Thu', sales: 4900 }, { day: 'Fri', sales: 5900 }, { day: 'Sat', sales: 7400 }, { day: 'Sun', sales: 5800 }
      ]
    },
    '360-mall': {
      name: '360 Mall',
      totalSales: 89000,
      totalOrders: 134,
      avgOrderValue: 664,
      topProducts: [
        { name: 'Cappuccino', sales: 9800, orders: 65, category: 'Recipe' },
        { name: 'Latte', sales: 7200, orders: 48, category: 'Recipe' },
        { name: 'Croissant', sales: 5400, orders: 36, category: 'Finished Good' }
      ],
      dailySales: [
        { day: 'Mon', sales: 6200 },
        { day: 'Tue', sales: 6800 },
        { day: 'Wed', sales: 5900 },
        { day: 'Thu', sales: 7500 },
        { day: 'Fri', sales: 9200 },
        { day: 'Sat', sales: 10800 },
        { day: 'Sun', sales: 8200 }
      ],
      dailySalesFinished: [
        { day: 'Mon', sales: 2000 }, { day: 'Tue', sales: 2100 }, { day: 'Wed', sales: 1800 },
        { day: 'Thu', sales: 2400 }, { day: 'Fri', sales: 3000 }, { day: 'Sat', sales: 3500 }, { day: 'Sun', sales: 2900 }
      ],
      dailySalesRecipe: [
        { day: 'Mon', sales: 4200 }, { day: 'Tue', sales: 4700 }, { day: 'Wed', sales: 4100 },
        { day: 'Thu', sales: 5100 }, { day: 'Fri', sales: 6200 }, { day: 'Sat', sales: 7300 }, { day: 'Sun', sales: 5300 }
      ]
    },
    'vibes-complex': {
      name: 'Vibes Complex',
      totalSales: 67000,
      totalOrders: 98,
      avgOrderValue: 684,
      topProducts: [
        { name: 'Burger Deluxe', sales: 8200, orders: 28, category: 'Finished Good' },
        { name: 'Chicken Wrap', sales: 6500, orders: 25, category: 'Finished Good' },
        { name: 'French Fries', sales: 4800, orders: 32, category: 'Finished Good' }
      ],
      dailySales: [
        { day: 'Mon', sales: 4800 },
        { day: 'Tue', sales: 5200 },
        { day: 'Wed', sales: 4500 },
        { day: 'Thu', sales: 5800 },
        { day: 'Fri', sales: 7200 },
        { day: 'Sat', sales: 8500 },
        { day: 'Sun', sales: 6200 }
      ],
      dailySalesFinished: [
        { day: 'Mon', sales: 4800 }, { day: 'Tue', sales: 5200 }, { day: 'Wed', sales: 4500 },
        { day: 'Thu', sales: 5800 }, { day: 'Fri', sales: 7200 }, { day: 'Sat', sales: 8500 }, { day: 'Sun', sales: 6200 }
      ],
      dailySalesRecipe: [
        { day: 'Mon', sales: 0 }, { day: 'Tue', sales: 0 }, { day: 'Wed', sales: 0 },
        { day: 'Thu', sales: 0 }, { day: 'Fri', sales: 0 }, { day: 'Sat', sales: 0 }, { day: 'Sun', sales: 0 }
      ]
    },
    'taiba-hospital': {
      name: 'Taiba Hospital',
      totalSales: 45000,
      totalOrders: 67,
      avgOrderValue: 672,
      topProducts: [
        { name: 'Quick Sandwich', sales: 6800, orders: 22, category: 'Finished Good' },
        { name: 'Coffee', sales: 4200, orders: 35, category: 'Recipe' },
        { name: 'Energy Bar', sales: 3200, orders: 18, category: 'Finished Good' }
      ],
      dailySales: [
        { day: 'Mon', sales: 3200 },
        { day: 'Tue', sales: 3500 },
        { day: 'Wed', sales: 2800 },
        { day: 'Thu', sales: 4200 },
        { day: 'Fri', sales: 4800 },
        { day: 'Sat', sales: 5200 },
        { day: 'Sun', sales: 3800 }
      ],
      dailySalesFinished: [
        { day: 'Mon', sales: 1800 }, { day: 'Tue', sales: 1900 }, { day: 'Wed', sales: 1500 },
        { day: 'Thu', sales: 2200 }, { day: 'Fri', sales: 2600 }, { day: 'Sat', sales: 2800 }, { day: 'Sun', sales: 2000 }
      ],
      dailySalesRecipe: [
        { day: 'Mon', sales: 1400 }, { day: 'Tue', sales: 1600 }, { day: 'Wed', sales: 1300 },
        { day: 'Thu', sales: 2000 }, { day: 'Fri', sales: 2200 }, { day: 'Sat', sales: 2400 }, { day: 'Sun', sales: 1800 }
      ]
    }
  }

  // Load live data for the active outlet tab
  useEffect(() => {
    const loadLive = async () => {
      if (activeTab === 'overall') return
      try {
        setLiveLoading(true)
        // Determine outlet display name from tab id
        const outletNameMap: Record<string, string> = {
          'kuwait-city': 'Kuwait City',
          '360-mall': '360 Mall',
          'vibes-complex': 'Vibes Complex',
          'taiba-hospital': 'Taiba Hospital'
        }
        const outletName = outletNameMap[activeTab] || 'Kuwait City'
        // Last 30 days sales orders for the outlet
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)
        const res = await apiService.getSalesOrders({
          outletName,
          limit: 1000,
          sortBy: 'orderTiming.orderDate',
          sortOrder: 'desc',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        if (!res.success || !Array.isArray(res.data)) {
          setLiveByTab(prev => ({ ...prev, [activeTab]: null }))
          setLiveLoading(false)
          return
        }

        const orders = res.data

        // Totals
        const totalSales = orders.reduce((s: number, o: any) => s + Number(o?.orderSummary?.totalAmount || 0), 0)
        const totalOrders = orders.length
        const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0

        // Top products (combine finished + recipe display lines)
        const productMap: Record<string, { name: string; sales: number; orders: number; category: string }> = {}
        for (const o of orders) {
          for (const it of o.orderItems || []) {
            const name = it.productName || it.productCode
            const key = `${name}__${it.category || 'Finished Good'}`
            const category = it.category === 'Recipe' ? 'Recipe' : 'Finished Good'
            const lineSales = Number(it.totalPrice || (Number(it.unitPrice || 0) * Number(it.quantity || 0)))
            const lineQty = Number(it.quantity || 1)
            if (!productMap[key]) productMap[key] = { name, sales: 0, orders: 0, category }
            productMap[key].sales += lineSales
            productMap[key].orders += lineQty
          }
        }
        const topProducts = Object.values(productMap)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10)

        // Daily sales by day-of-week for ALL, and split series for finished/recipe
        const initWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
        const weekIndex: Record<string, number> = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 }
        const toDay = (dt: string) => {
          const d = new Date(dt)
          return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
        }
        const allArr = Array.from({length:7}, (_,i)=>({ day:initWeek[i], sales:0 }))
        const finArr = Array.from({length:7}, (_,i)=>({ day:initWeek[i], sales:0 }))
        const recArr = Array.from({length:7}, (_,i)=>({ day:initWeek[i], sales:0 }))
        for (const o of orders) {
          const day = toDay(o?.orderTiming?.orderDate || o?.createdAt || new Date().toISOString())
          const idx = weekIndex[day === 'Sun' ? 'Sun' : day]
          const orderItems = Array.isArray(o.orderItems) ? o.orderItems : []
          let orderFinished = 0
          let orderRecipe = 0
          for (const it of orderItems) {
            const line = Number(it.totalPrice || (Number(it.unitPrice || 0) * Number(it.quantity || 0)))
            if (it.category === 'Recipe') orderRecipe += line; else orderFinished += line
          }
          allArr[idx].sales += (orderFinished + orderRecipe)
          finArr[idx].sales += orderFinished
          recArr[idx].sales += orderRecipe
        }

        setLiveByTab(prev => ({
          ...prev,
          [activeTab]: {
          name: outletName,
          totalSales,
          totalOrders,
          avgOrderValue,
          topProducts,
          dailySales: allArr,
          dailySalesFinished: finArr,
          dailySalesRecipe: recArr
        }}))
      } catch (e) {
        setLiveByTab(prev => ({ ...prev, [activeTab]: null }))
      } finally {
        setLiveLoading(false)
      }
    }
    loadLive()
  }, [activeTab])

  // Load dynamic overall view across all outlets
  useEffect(() => {
    const loadOverall = async () => {
      try {
        // Last 30 days across all outlets
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)
        const res = await apiService.getSalesOrders({
          limit: 3000,
          sortBy: 'orderTiming.orderDate',
          sortOrder: 'desc',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        if (!res.success || !Array.isArray(res.data)) {
          setOverallLive(null)
          return
        }
        const orders = res.data
        const totalSales = orders.reduce((s: number, o: any) => s + Number(o?.orderSummary?.totalAmount || 0), 0)
        const totalOrders = orders.length
        const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0

        // Breakdown by outlet (seed with all known outlets so zeros are shown)
        const breakdownMap: Record<string, { name: string; sales: number; orders: number }> = {
          'Kuwait City': { name: 'Kuwait City', sales: 0, orders: 0 },
          '360 Mall': { name: '360 Mall', sales: 0, orders: 0 },
          'Vibes Complex': { name: 'Vibes Complex', sales: 0, orders: 0 },
          'Taiba Hospital': { name: 'Taiba Hospital', sales: 0, orders: 0 }
        }
        for (const o of orders) {
          const name = o?.outletName || 'Unknown'
          if (!breakdownMap[name]) breakdownMap[name] = { name, sales: 0, orders: 0 }
          breakdownMap[name].sales += Number(o?.orderSummary?.totalAmount || 0)
          breakdownMap[name].orders += 1
        }
        const outletBreakdown = Object.values(breakdownMap)
        outletBreakdown.forEach(ob => {
          ;(ob as any).percentage = totalSales > 0 ? Math.round((ob.sales / totalSales) * 100) : 0
        })

        // Top products overall with outlet tag
        const productMap: Record<string, { name: string; sales: number; orders: number; outlet: string }> = {}
        for (const o of orders) {
          for (const it of o.orderItems || []) {
            const name = it.productName || it.productCode
            const key = `${name}__${o.outletName || 'Unknown'}`
            const outlet = o.outletName || 'Unknown'
            const lineSales = Number(it.totalPrice || (Number(it.unitPrice || 0) * Number(it.quantity || 0)))
            const lineQty = Number(it.quantity || 1)
            if (!productMap[key]) productMap[key] = { name, sales: 0, orders: 0, outlet }
            productMap[key].sales += lineSales
            productMap[key].orders += lineQty
          }
        }
        const topProductsOverall = Object.values(productMap)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 10)

        // Overall sales trend (day-of-week)
        const initWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
        const toDay = (dt: string) => {
          const d = new Date(dt)
          return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
        }
        const weekIndex: Record<string, number> = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 }
        const overallTrend = Array.from({length:7}, (_,i)=>({ day:initWeek[i], sales:0 }))
        for (const o of orders) {
          const day = toDay(o?.orderTiming?.orderDate || o?.createdAt || new Date().toISOString())
          const idx = weekIndex[day === 'Sun' ? 'Sun' : day]
          overallTrend[idx].sales += Number(o?.orderSummary?.totalAmount || 0)
        }

        setOverallLive({ totalSales, totalOrders, avgOrderValue, outletBreakdown, overallTrend, topProductsOverall })
      } catch (e) {
        setOverallLive(null)
      }
    }
    loadOverall()
  }, [])

  // Calculate overall data
  const overallData = {
    totalSales: Object.values(outletSalesData).reduce((sum, outlet) => sum + outlet.totalSales, 0),
    totalOrders: Object.values(outletSalesData).reduce((sum, outlet) => sum + outlet.totalOrders, 0),
    avgOrderValue: 0, // Will be calculated
    outletBreakdown: Object.entries(outletSalesData).map(([, outlet]) => ({
      name: outlet.name,
      sales: outlet.totalSales,
      orders: outlet.totalOrders,
      percentage: 0 // Will be calculated
    }))
  }

  // Calculate averages and percentages
  overallData.avgOrderValue = Math.round(overallData.totalSales / overallData.totalOrders)
  overallData.outletBreakdown.forEach(outlet => {
    outlet.percentage = Math.round((outlet.sales / overallData.totalSales) * 100)
  })


  // Derive filtered view based on productFilter
  const getFilteredTopProducts = (list: any[]) => {
    if (productFilter === 'all') return list
    const label = productFilter === 'finished' ? 'Finished Good' : 'Recipe'
    return list.filter(p => (p.category || '').toLowerCase() === label.toLowerCase())
  }

  const getFilteredDailySales = (outlet: any) => {
    if (productFilter === 'finished') return outlet.dailySalesFinished || outlet.dailySales
    if (productFilter === 'recipe') return outlet.dailySalesRecipe || outlet.dailySales
    return outlet.dailySales
  }

  // Render outlet sales content
  const renderOutletContent = (outletId: string) => {
    if (outletId === 'overall') {
      if (overallLive) {
        return (
          <div className="space-y-6">
            {/* Overall Stats (dynamic) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-500">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-semibold text-gray-900">KWD {overallLive.totalSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">{overallLive.totalOrders}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-500">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-semibold text-gray-900">KWD {overallLive.avgOrderValue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales by Outlet */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Sales by Outlet</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {overallLive.outletBreakdown.map((outlet:any, index:number) => (
                  <div key={outlet.name} className="flex flex-col items-center p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className={`p-4 rounded-full mb-4 ${index % 2 === 0 ? 'bg-blue-100' : 'bg-green-100'}`}>
                      <Store className={`${index % 2 === 0 ? 'text-blue-600' : 'text-green-600'} h-8 w-8`} />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-semibold text-gray-900">{outlet.name}</p>
                      <p className="text-sm text-gray-600">{outlet.orders} orders</p>
                      <p className="font-bold text-gray-900">KWD {outlet.sales.toLocaleString()}</p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {outlet.percentage}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Charts dynamic */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Sales Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overallLive.overallTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`KWD ${value}`, 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products Overall</h3>
                <div className="space-y-4">
                  {overallLive.topProductsOverall.map((product:any, index:number) => (
                    <div key={`${product.name}-${product.outlet}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.outlet} • {product.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">KWD {product.sales.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      // Show loading state when overallLive is not available
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading overall sales data...</p>
          </div>
        </div>
      )
    }

    const outlet = outletSalesData[outletId as keyof typeof outletSalesData]
    if (!outlet) return null

    return (
      <div className="space-y-6">
        {/* Outlet Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-semibold text-gray-900">KWD {outlet.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{outlet.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-semibold text-gray-900">KWD {outlet.avgOrderValue}</p>
              </div>
            </div>
        </div>
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Filters */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setProductFilter('all')} className={`px-3 py-1 text-sm rounded border ${productFilter==='all'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>ALL</button>
              <button onClick={() => setProductFilter('finished')} className={`px-3 py-1 text-sm rounded border ${productFilter==='finished'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Finished Goods</button>
              <button onClick={() => setProductFilter('recipe')} className={`px-3 py-1 text-sm rounded border ${productFilter==='recipe'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Recipe Master</button>
            </div>
          </div>

          {/* Daily Sales Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getFilteredDailySales(outlet)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`KWD ${value}`, 'Sales']} />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
      <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
        <div className="space-y-4">
              {getFilteredTopProducts(outlet.topProducts).map((product) => (
                <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{product.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">KWD {product.sales.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-gray-600">Monitor sales performance across all outlets</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : ''}`} />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab !== 'overall' && liveByTab[activeTab] ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-indigo-500">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">KWD {liveByTab[activeTab].totalSales.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-semibold text-gray-900">{liveByTab[activeTab].totalOrders}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-semibold text-gray-900">KWD {liveByTab[activeTab].avgOrderValue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button onClick={() => setProductFilter('all')} className={`px-3 py-1 text-sm rounded border ${productFilter==='all'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>ALL</button>
            <button onClick={() => setProductFilter('finished')} className={`px-3 py-1 text-sm rounded border ${productFilter==='finished'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Finished Goods</button>
            <button onClick={() => setProductFilter('recipe')} className={`px-3 py-1 text-sm rounded border ${productFilter==='recipe'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-300'}`}>Recipe Master</button>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Sales Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFilteredDailySales(liveByTab[activeTab])}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`KWD ${value}`, 'Sales']} />
                  <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
              <div className="space-y-4">
                {getFilteredTopProducts(liveByTab[activeTab].topProducts).map((product:any) => (
                  <div key={`${product.name}-${product.category}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                      <p className="text-sm text-gray-600">{product.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">KWD {product.sales.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        renderOutletContent(activeTab)
      )}
    </div>
  )
}

export default Dashboard
