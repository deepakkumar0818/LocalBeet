import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ShoppingCart, 
  Truck,
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
  Bell,
} from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'
import { useNotifications } from '../hooks/useNotifications'
// Removed unused imports

interface LayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  hasDropdown?: boolean;
  children?: NavigationItem[];
}

const baseNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recipe Master', href: '/bill-of-materials', icon: FileText },
  // Hidden per requirement: keep routes functional but remove from navigation
  // { name: 'Items List', href: '/items-list', icon: Package },
  // { name: 'All Locations', href: '/locations-list', icon: Store },
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
          { name: 'POS Sales', href: '/kuwait-city/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/kuwait-city/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/kuwait-city/finished-goods', icon: Layers },
        ]
      },
      { 
        name: '360 Mall', 
        icon: ShoppingBag, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/360-mall/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/360-mall/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/360-mall/finished-goods', icon: Layers },
        ]
      },
      { 
        name: 'Vibes Complex', 
        icon: Coffee, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/vibes-complex/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/vibes-complex/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/vibes-complex/finished-goods', icon: Layers },
        ]
      },
      { 
        name: 'Taiba Hospital', 
        icon: Car, 
        hasDropdown: true,
        children: [
          { name: 'POS Sales', href: '/taiba-hospital/sales-orders', icon: ShoppingCart },
          { name: 'Raw Material Inventory', href: '/taiba-hospital/raw-materials', icon: Package },
          { name: 'Finished Goods Inventory', href: '/taiba-hospital/finished-goods', icon: Layers },
        ]
      },
    ]
  },
  { name: 'Transfer Orders', href: '/transfer-orders', icon: Truck },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  // { 
  //   name: 'Master', 
  //   icon: Database, 
  //   hasDropdown: true,
  //   children: [
  //     { name: 'Raw Material Master', href: '/raw-materials', icon: Package },
  //     { name: 'Finished Good Master', href: '/finished-goods-master', icon: Layers },
  //     { name: 'Outlet Master', href: '/outlets', icon: Store },
  //   ]
  // },
  // Inventory removed per requirement
]

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const location = useLocation()
  const navigate = useNavigate()

  const authUser = (() => {
    try { return JSON.parse(localStorage.getItem('auth_user') || 'null') } catch { return null }
  })()

  const isAdmin = Boolean(authUser?.isAdmin)
  const assignedOutlet: string = String(authUser?.assignedOutletCode || '')

  // Determine outlet name for notifications based on current route
  // This ensures that when viewing a specific outlet page, notifications are fetched for that outlet
  const outletNameForNotifications = React.useMemo(() => {
    const pathname = location.pathname
    console.log('🔔 Layout: Determining outlet name for notifications', { isAdmin, assignedOutlet, pathname })
    
    // First, check the current route to determine which outlet page is being viewed
    if (pathname.includes('/kuwait-city') || pathname.includes('/downtown-restaurant')) {
      console.log('🔔 Layout: On Kuwait City page, using "Kuwait City"')
      return 'Kuwait City'
    }
    if (pathname.includes('/mall-360') || pathname.includes('/mall-food-court')) {
      console.log('🔔 Layout: On 360 Mall page, using "360 Mall"')
      return '360 Mall'
    }
    if (pathname.includes('/vibes-complex') || pathname.includes('/marina-walk-cafe')) {
      console.log('🔔 Layout: On Vibes Complex page, using "Vibes Complex"')
      return 'Vibes Complex'
    }
    if (pathname.includes('/taiba-hospital') || pathname.includes('/drive-thru-express')) {
      console.log('🔔 Layout: On Taiba Hospital page, using "Taiba Hospital"')
      return 'Taiba Hospital'
    }
    if (pathname.includes('/central-kitchen') || pathname.includes('/central-kitchen-raw-materials') || pathname.includes('/central-kitchen-finished-goods') || pathname.includes('/create-transfer')) {
      console.log('🔔 Layout: On Central Kitchen page, using "Central Kitchen"')
      return 'Central Kitchen'
    }
    
    // Fallback: If not on a specific outlet page, check user role
    if (isAdmin) {
      // Admin sees notifications for "Central Kitchen" by default
      console.log('🔔 Layout: User is admin and not on specific outlet page, using "Central Kitchen"')
      return 'Central Kitchen'
    }
    
    // Map outlet codes to outlet names for non-admin users
    if (assignedOutlet === 'KUWAIT_CITY') {
      console.log('🔔 Layout: Assigned outlet is KUWAIT_CITY, using "Kuwait City"')
      return 'Kuwait City'
    }
    if (assignedOutlet === 'MALL_360') {
      console.log('🔔 Layout: Assigned outlet is MALL_360, using "360 Mall"')
      return '360 Mall'
    }
    if (assignedOutlet === 'VIBE_COMPLEX') {
      console.log('🔔 Layout: Assigned outlet is VIBE_COMPLEX, using "Vibes Complex"')
      return 'Vibes Complex'
    }
    if (assignedOutlet === 'TAIBA_HOSPITAL') {
      console.log('🔔 Layout: Assigned outlet is TAIBA_HOSPITAL, using "Taiba Hospital"')
      return 'Taiba Hospital'
    }
    console.warn('🔔 Layout: Unknown assignedOutlet or route, returning undefined', { assignedOutlet, pathname })
    return undefined
  }, [isAdmin, assignedOutlet, location.pathname])

  // Get notifications for the current outlet
  const { notifications, markAsRead, markAllAsRead, clearAll, refreshNotifications } = useNotifications(outletNameForNotifications)

  // Listen for refresh requests from pages
  React.useEffect(() => {
    const handleRefreshRequest = () => {
      refreshNotifications()
    }
    window.addEventListener('refreshNotifications', handleRefreshRequest)
    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshRequest)
    }
  }, [refreshNotifications])

  // Determine current module (raw-materials or finished-goods) from route
  const currentModule = React.useMemo(() => {
    const pathname = location.pathname
    if (pathname.includes('/raw-materials')) return 'Raw Material'
    if (pathname.includes('/finished-goods')) return 'Finished Goods'
    return null // Not on a specific module page
  }, [location.pathname])

  // Filter notifications to show only transfer-related notifications:
  // - Transfer requests (for Central Kitchen to approve outlet requests, or for outlets to approve Central Kitchen transfers)
  // - Accepted/Rejected notifications
  // - Filter by itemType if on a specific module page (raw-materials or finished-goods)
  // - Exclude notifications that are already read (for transfer requests that were accepted/rejected)
  const filteredNotifications = React.useMemo(() => {
    console.log('🔔 Layout: All notifications:', notifications)
    console.log('🔔 Layout: Outlet for notifications:', outletNameForNotifications)
    console.log('🔔 Layout: Current module:', currentModule)
    
    // Filter by notification type (more reliable than title matching)
    // Show all transfer-related notifications (both read and unread)
    let filtered = notifications.filter(notif => {
      // Check if it's a transfer-related notification
      const isTransferRelated = notif.isTransferOrder || 
        notif.title?.includes('Transfer Request') ||
        notif.title?.includes('Transfer') ||
        notif.transferOrderId;
      
      return isTransferRelated;
    })
    
    // If on a specific module page, filter by itemType
    if (currentModule) {
      filtered = filtered.filter(notif => {
        // Show notification if:
        // 1. itemType matches current module
        // 2. itemType is 'Mixed' (show on both pages)
        // 3. itemType is not set (fallback - show on both)
        const itemType = notif.itemType
        const shouldShow = !itemType || 
          itemType === currentModule || 
          itemType === 'Mixed'
        
        console.log('🔔 Layout: Filtering notification by itemType:', {
          id: notif.id,
          title: notif.title,
          itemType: itemType,
          currentModule: currentModule,
          shouldShow: shouldShow
        })
        
        return shouldShow
      })
    }
    
    console.log('🔔 Layout: Filtered notifications count:', filtered.length)
    return filtered
  }, [notifications, outletNameForNotifications, currentModule])

  // Handler for viewing transfer orders from Layout notifications
  // Store transfer order ID in localStorage so pages can pick it up
  const handleViewTransferOrder = (transferOrderId: string) => {
    console.log('Layout: View transfer order:', transferOrderId)
    // Store in localStorage so pages can detect and open modal
    localStorage.setItem('pendingTransferOrderView', transferOrderId)
    // Dispatch custom event for pages to listen to
    window.dispatchEvent(new CustomEvent('viewTransferOrder', { detail: { transferOrderId } }))
  }

  const navigation: NavigationItem[] = React.useMemo(() => {
    if (isAdmin) return baseNavigation

    const allowedOutletName = assignedOutlet === 'KUWAIT_CITY' ? 'Kuwait City'
      : assignedOutlet === 'MALL_360' ? '360 Mall'
      : assignedOutlet === 'VIBE_COMPLEX' ? 'Vibes Complex'
      : assignedOutlet === 'TAIBA_HOSPITAL' ? 'Taiba Hospital'
      : ''

    const filtered: NavigationItem[] = []
    // Always allow Dashboard
    filtered.push(baseNavigation[0])
    // Hide Central Kitchen for outlet managers
    // Keep Outlets -> only assigned outlet
    const outlets = baseNavigation.find(n => n.name === 'Outlets')
    if (outlets && outlets.children && allowedOutletName) {
      const onlyAssigned = outlets.children.filter(c => c.name === allowedOutletName)
      if (onlyAssigned.length) {
        filtered.push({ ...outlets, children: onlyAssigned })
      }
    }
    // For managers: do not show Transfer Orders or Inventory
    return filtered
  }, [isAdmin, assignedOutlet])

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
        /* Enhanced scrollbar styling for sidebar */
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        
        /* Smooth scrolling behavior */
        .sidebar-nav {
          scroll-behavior: smooth;
        }
        
        /* Ensure proper height constraints */
        .sidebar-container {
          height: calc(100vh - 4rem); /* Subtract header height */
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-nav-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }
        
        /* Mobile sidebar height fix */
        .mobile-sidebar-nav {
          height: calc(100vh - 4rem);
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white sidebar-container">
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
          <div className="sidebar-nav-container">
            <nav className="px-4 py-4 space-y-1 sidebar-nav mobile-sidebar-nav">
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
                          const isChildActive = child.href ? location.pathname === child.href : false
                          const hasChildDropdown = child.hasDropdown || false
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
                                    {child.children.map((grandChild: NavigationItem) => {
                                      const GrandChildIcon = grandChild.icon
                                      const isGrandChildActive = grandChild.href ? location.pathname === grandChild.href : false
                                      return (
                                        <Link
                                          key={grandChild.name}
                                          to={grandChild.href || '#'}
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
                              to={child.href || '#'}
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
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 sidebar-container">
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
          <div className="sidebar-nav-container">
            <nav className="px-4 py-4 space-y-1 sidebar-nav">
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
                          const isChildActive = child.href ? location.pathname === child.href : false
                          const hasChildDropdown = child.hasDropdown || false
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
                                    {child.children.map((grandChild: NavigationItem) => {
                                      const GrandChildIcon = grandChild.icon
                                      const isGrandChildActive = grandChild.href ? location.pathname === grandChild.href : false
                                      return (
                                        <Link
                                          key={grandChild.name}
                                          to={grandChild.href || '#'}
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
                              to={child.href || '#'}
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
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{authUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{authUser?.email || ''}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {isAdmin && (
                <Link
                  to="/settings"
                  className={`flex items-center px-3 py-2 text-sm rounded-lg w-full ${
                    location.pathname === '/settings'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Link>
              )}
              <button onClick={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); navigate('/login', { replace: true }) }} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full">
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
                <span className="text-sm text-gray-700">Welcome back, {authUser?.name || 'Admin'}</span>
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
