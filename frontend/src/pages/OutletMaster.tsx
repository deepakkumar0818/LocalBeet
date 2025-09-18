import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, RefreshCw, MapPin, Clock, Users, Store } from 'lucide-react'
import { apiService } from '../services/api'

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  description: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  contactInfo: {
    phone: string
    email: string
    managerName: string
    managerPhone?: string
    managerEmail?: string
  }
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean }
    tuesday: { open: string; close: string; isOpen: boolean }
    wednesday: { open: string; close: string; isOpen: boolean }
    thursday: { open: string; close: string; isOpen: boolean }
    friday: { open: string; close: string; isOpen: boolean }
    saturday: { open: string; close: string; isOpen: boolean }
    sunday: { open: string; close: string; isOpen: boolean }
  }
  capacity: {
    seatingCapacity: number
    kitchenCapacity: number
    storageCapacity: number
    capacityUnit: string
  }
  status: string
  isCentralKitchen: boolean
  parentOutletId?: string
  features: string[]
  timezone: string
  notes: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

const OutletMaster: React.FC = () => {
  const navigate = useNavigate()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCentralKitchen, setFilterCentralKitchen] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadOutlets()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadOutlets()
    }
  }, [searchTerm, filterType, filterStatus, filterCentralKitchen, sortBy, sortOrder])

  const loadOutlets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getOutlets({
        limit: 1000,
        search: searchTerm,
        outletType: filterType,
        status: filterStatus,
        isCentralKitchen: filterCentralKitchen,
        sortBy,
        sortOrder
      })

      if (response.success) {
        console.log('Loaded Outlets:', response.data)
        setOutlets(response.data)
      } else {
        setError('Failed to load outlets')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlets')
      console.error('Error loading outlets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      try {
        const response = await apiService.deleteOutlet(id)
        if (response.success) {
          await loadOutlets() // Reload the list
        } else {
          alert('Failed to delete outlet')
        }
      } catch (err) {
        alert('Error deleting outlet: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting outlet:', err)
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterType('')
    setFilterStatus('')
    setFilterCentralKitchen('')
    setSortBy('createdAt')
    setSortOrder('desc')
    loadOutlets() // Reload data with cleared filters
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'Closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Restaurant': return 'bg-blue-100 text-blue-800'
      case 'Cafe': return 'bg-purple-100 text-purple-800'
      case 'Food Court': return 'bg-orange-100 text-orange-800'
      case 'Drive-Thru': return 'bg-green-100 text-green-800'
      case 'Takeaway': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading outlets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadOutlets}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlet Master</h1>
          <p className="text-gray-600">Manage restaurant outlets and central kitchen operations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadOutlets}
            className="btn-secondary flex items-center"
            title="Refresh outlets"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/outlets/add')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search outlets by name, code, city, or manager..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center"
                title="Clear all filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
              <button className="btn-secondary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Type</label>
              <select
                className="input-field"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Food Court">Food Court</option>
                <option value="Drive-Thru">Drive-Thru</option>
                <option value="Takeaway">Takeaway</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Type</label>
              <select
                className="input-field"
                value={filterCentralKitchen}
                onChange={(e) => setFilterCentralKitchen(e.target.value)}
              >
                <option value="">All Kitchens</option>
                <option value="true">Central Kitchen</option>
                <option value="false">Regular Outlet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-1">
                <select
                  className="input-field flex-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Date Created</option>
                  <option value="outletName">Outlet Name</option>
                  <option value="outletCode">Outlet Code</option>
                  <option value="outletType">Outlet Type</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn-secondary px-3"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {outlets.length} outlets
              {(searchTerm || filterType || filterStatus || filterCentralKitchen) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {(searchTerm || filterType || filterStatus || filterCentralKitchen) && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Outlets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Outlet Code</th>
                <th className="table-header">Outlet Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Location</th>
                <th className="table-header">Manager</th>
                <th className="table-header">Status</th>
                <th className="table-header">Kitchen Type</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outlets.map((outlet) => (
                <tr key={outlet.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{outlet.outletCode}</td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900 font-medium">{outlet.outletName}</div>
                      <div className="text-gray-500 text-sm max-w-xs truncate">
                        {outlet.description}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(outlet.outletType)}`}>
                      {outlet.outletType}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{outlet.address.city}, {outlet.address.state}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900 font-medium">{outlet.contactInfo.managerName}</div>
                      <div className="text-gray-500 text-sm">{outlet.contactInfo.phone}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(outlet.status)}`}>
                      {outlet.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {outlet.isCentralKitchen ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        🏭 Central Kitchen
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        🏪 Regular Outlet
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOutlet(outlet)
                          setShowDetailsModal(true)
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/outlets/edit/${outlet.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(outlet.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOutlet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Outlet Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Code</label>
                  <p className="text-gray-900 font-mono">{selectedOutlet.outletCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
                  <p className="text-gray-900">{selectedOutlet.outletName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Type</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(selectedOutlet.outletType)}`}>
                    {selectedOutlet.outletType}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOutlet.status)}`}>
                    {selectedOutlet.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Type</label>
                  {selectedOutlet.isCentralKitchen ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      🏭 Central Kitchen
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      🏪 Regular Outlet
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <p className="text-gray-900">{selectedOutlet.timezone}</p>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">
                  {selectedOutlet.address.street}<br />
                  {selectedOutlet.address.city}, {selectedOutlet.address.state} {selectedOutlet.address.zipCode}<br />
                  {selectedOutlet.address.country}
                </p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Phone</label>
                  <p className="text-gray-900">{selectedOutlet.contactInfo.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Email</label>
                  <p className="text-gray-900">{selectedOutlet.contactInfo.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <p className="text-gray-900">{selectedOutlet.contactInfo.managerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                  <p className="text-gray-900">{selectedOutlet.contactInfo.managerPhone || 'N/A'}</p>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Seating</p>
                    <p className="text-lg font-semibold text-blue-600">{selectedOutlet.capacity.seatingCapacity}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Store className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Kitchen</p>
                    <p className="text-lg font-semibold text-green-600">{selectedOutlet.capacity.kitchenCapacity}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Storage</p>
                    <p className="text-lg font-semibold text-purple-600">{selectedOutlet.capacity.storageCapacity}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              {selectedOutlet.features.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutlet.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOutlet.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900">{selectedOutlet.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  navigate(`/outlets/edit/${selectedOutlet.id}`)
                }}
                className="btn-primary"
              >
                Edit Outlet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OutletMaster
