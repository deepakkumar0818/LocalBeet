import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ClipboardList, 
  ShoppingCart, 
  Receipt, 
  Warehouse, 
  Truck,
  BarChart3,
  TrendingUp,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  Store,
  Layers,
  Coffee,
  ShoppingBag,
  Car,
  ChevronDown,
  ChevronRight,
  Utensils,
  Database
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recipe Master', href: '/bill-of-materials', icon: FileText },
  // { name: 'Job Orders', href: '/job-orders', icon: ClipboardList },
  // { name: 'Ingredient Forecast', href: '/raw-material-forecast', icon: TrendingUp },
  // { name: 'Good Receipt Notes', href: '/good-receipt-notes', icon: Receipt },
  { 
    name: 'Central Kitchen', 
    icon: Store, 
    hasDropdown: true,
    children: [
      { name: 'Raw Material Inventory', href: '/central-kitchen/raw-materials', icon: Package },
      { name: 'Finished Good Inventory', href: '/central-kitchen/finished-goods', icon: Layers },
      { name: 'Make Finished Good', href: '/central-kitchen/make-finished-good', icon: Utensils },
      { name: 'Create Transfer', href: '/central-kitchen/create-transfer', icon: Truck },
    ]
  },
  { 
    name: 'Outlets', 
    icon: Store, 
    hasDropdown: true,
    children: [
      { 
        name: 'Kuwait City', 
        icon: Store, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/downtown-restaurant/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/downtown-restaurant/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/downtown-restaurant/finished-goods', icon: Layers },
        ]
      },
      { 
        name: '360 Mall', 
        icon: Coffee, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/marina-walk-cafe/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/marina-walk-cafe/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/marina-walk-cafe/finished-goods', icon: Layers },
        ]
      },
      { 
        name: 'Vibes Complex', 
        icon: ShoppingBag, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/mall-food-court/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/mall-food-court/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/mall-food-court/finished-goods', icon: Layers },
        ]
      },
      { 
        name: 'Taiba Hospital', 
        icon: Car, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/drive-thru-express/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/drive-thru-express/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/drive-thru-express/finished-goods', icon: Layers },
        ]
      },
    ]
  },
  { name: 'Transfer Orders', href: '/transfer-orders', icon: Truck },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { 
    name: 'Master', 
    icon: Database, 
    hasDropdown: true,
    children: [
      { name: 'Raw Material Master', href: '/raw-materials', icon: Package },
      { name: 'Finished Good Master', href: '/finished-goods-master', icon: Layers },
      { name: 'Outlet Master', href: '/outlets', icon: Store },
    ]
  },
  { name: 'Inventory', href: '/inventory', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const location = useLocation()

  const toggleDropdown = (itemName: string) => {
    const newOpenDropdowns = new Set(openDropdowns)
    if (newOpenDropdowns.has(itemName)) {
      newOpenDropdowns.delete(itemName)
    } else {
      newOpenDropdowns.add(itemName)
    }
    setOpenDropdowns(newOpenDropdowns)
  }

  return (
    <>
      <style>{`
        /* Custom scrollbar styling for sidebar */
        .sidebar-nav::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 4px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">localbeet</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto sidebar-nav min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              const hasDropdown = item.hasDropdown
              const isDropdownOpen = openDropdowns.has(item.name)
              
              if (hasDropdown) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </div>
                      {isDropdownOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isDropdownOpen && item.children && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = location.pathname === child.href
                          const hasChildDropdown = child.hasDropdown
                          const isChildDropdownOpen = openDropdowns.has(child.name)
                          
                          if (hasChildDropdown) {
                            return (
                              <div key={child.name}>
                                <button
                                  onClick={() => toggleDropdown(child.name)}
                                  className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                    {child.name}
                                  </div>
                                  {isChildDropdownOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                {isChildDropdownOpen && child.children && (
                                  <div className="ml-6 mt-1 space-y-1">
                                    {child.children.map((grandChild) => {
                                      const GrandChildIcon = grandChild.icon
                                      const isGrandChildActive = location.pathname === grandChild.href
                                      return (
                                        <Link
                                          key={grandChild.name}
                                          to={grandChild.href}
                                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isGrandChildActive
                                              ? 'bg-primary-100 text-primary-700'
                                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                          }`}
                                        >
                                          <GrandChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                          {grandChild.name}
                                        </Link>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isChildActive
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href || '#'}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 flex-shrink-0">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">localbeet</h1>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto sidebar-nav min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              const hasDropdown = item.hasDropdown
              const isDropdownOpen = openDropdowns.has(item.name)
              
              if (hasDropdown) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </div>
                      {isDropdownOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isDropdownOpen && item.children && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = location.pathname === child.href
                          const hasChildDropdown = child.hasDropdown
                          const isChildDropdownOpen = openDropdowns.has(child.name)
                          
                          if (hasChildDropdown) {
                            return (
                              <div key={child.name}>
                                <button
                                  onClick={() => toggleDropdown(child.name)}
                                  className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                    {child.name}
                                  </div>
                                  {isChildDropdownOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                {isChildDropdownOpen && child.children && (
                                  <div className="ml-6 mt-1 space-y-1">
                                    {child.children.map((grandChild) => {
                                      const GrandChildIcon = grandChild.icon
                                      const isGrandChildActive = location.pathname === grandChild.href
                                      return (
                                        <Link
                                          key={grandChild.name}
                                          to={grandChild.href}
                                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isGrandChildActive
                                              ? 'bg-primary-100 text-primary-700'
                                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                          }`}
                                        >
                                          <GrandChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                          {grandChild.name}
                                        </Link>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          return (
                            <Link
                              key={child.name}
                              to={child.href}
                              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isChildActive
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href || '#'}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">admin@locbeat.com</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full">
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </button>
              <button className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full">
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-gray-700">Welcome back, Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  )
}

export default Layout
