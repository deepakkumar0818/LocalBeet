import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, TrendingUp, X } from 'lucide-react'
import { RawMaterialForecast } from '../types'
import { apiService } from '../services/api'

const RawMaterialForecastPage: React.FC = () => {
  const navigate = useNavigate()
  const [forecasts, setForecasts] = useState<RawMaterialForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForecast, setSelectedForecast] = useState<RawMaterialForecast | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadForecasts()
  }, [])

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      loadForecasts()
    }
  }, [searchTerm, filterStatus, filterPeriod, sortBy, sortOrder])

  const loadForecasts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getRawMaterialForecasts({
        limit: 1000,
        search: searchTerm,
        status: filterStatus,
        forecastPeriod: filterPeriod,
        sortBy,
        sortOrder
      })

      if (response.success) {
        console.log('Loaded Raw Material Forecasts:', response.data)
        setForecasts(response.data)
      } else {
        setError('Failed to load forecasts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecasts')
      console.error('Error loading forecasts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Data is already filtered and sorted by the backend API
  const displayedForecasts = forecasts

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('')
    setFilterPeriod('')
    setSortBy('createdAt')
    setSortOrder('desc')
    loadForecasts() // Reload data with cleared filters
  }

  const handleView = (forecast: RawMaterialForecast) => {
    setSelectedForecast(forecast)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this forecast?')) {
      try {
        const response = await apiService.deleteRawMaterialForecast(id)
        if (response.success) {
          await loadForecasts() // Reload the list
        } else {
          alert('Failed to delete forecast')
        }
      } catch (err) {
        alert('Error deleting forecast: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting forecast:', err)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forecasts...</p>
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
            onClick={loadForecasts}
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
          <h1 className="text-2xl font-bold text-gray-900">Ingredient Forecast</h1>
          <p className="text-gray-600">Plan and predict your ingredient requirements based on Job Orders</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadForecasts}
            className="btn-secondary flex items-center"
            title="Refresh forecasts"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/raw-material-forecast/add')}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Forecast
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
                  placeholder="Search forecasts by name, number, or description..."
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                className="input-field"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="">All Periods</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
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
                  <option value="forecastNumber">Forecast Number</option>
                  <option value="forecastName">Forecast Name</option>
                  <option value="totalValue">Total Value</option>
                  <option value="forecastStartDate">Start Date</option>
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
              Showing {displayedForecasts.length} forecasts
              {(searchTerm || filterStatus || filterPeriod) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {(searchTerm || filterStatus || filterPeriod) && (
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

      {/* Forecasts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Forecast #</th>
                <th className="table-header">Name</th>
                <th className="table-header">Period</th>
                <th className="table-header">Start Date</th>
                <th className="table-header">End Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Confidence</th>
                <th className="table-header">Total Value</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedForecasts.map((forecast) => (
                <tr key={forecast.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{forecast.forecastNumber}</td>
                  <td className="table-cell">
                    <div>
                      <div className="text-gray-900 font-medium">{forecast.forecastName}</div>
                      <div className="text-gray-500 text-sm max-w-xs truncate">
                        {forecast.forecastDescription}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{forecast.forecastPeriod}</td>
                  <td className="table-cell">{new Date(forecast.forecastStartDate).toLocaleDateString()}</td>
                  <td className="table-cell">{new Date(forecast.forecastEndDate).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(forecast.status)}`}>
                      {forecast.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(forecast.confidenceLevel)}`}>
                      {forecast.confidenceLevel}
                    </span>
                  </td>
                  <td className="table-cell font-semibold">{forecast.totalValue.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(forecast)}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/raw-material-forecast/edit/${forecast.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(forecast.id)}
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

      {/* View Modal */}
      {showViewModal && selectedForecast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Forecast Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Number</label>
                  <p className="text-gray-900 font-mono">{selectedForecast.forecastNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Name</label>
                  <p className="text-gray-900">{selectedForecast.forecastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <p className="text-gray-900">{selectedForecast.forecastPeriod}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedForecast.status)}`}>
                    {selectedForecast.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-gray-900">{new Date(selectedForecast.forecastStartDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <p className="text-gray-900">{new Date(selectedForecast.forecastEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(selectedForecast.confidenceLevel)}`}>
                    {selectedForecast.confidenceLevel}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
                  <p className="text-gray-900 font-semibold">{selectedForecast.totalValue.toFixed(2)} KWD</p>
                </div>
              </div>

              {/* Description */}
              {selectedForecast.forecastDescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedForecast.forecastDescription}</p>
                </div>
              )}

              {/* Forecast Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Forecast Items ({selectedForecast.items.length} items)</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortfall</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedForecast.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.materialCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.materialName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.requiredQuantity.toFixed(2)} {item.unitOfMeasure}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.availableQuantity.toFixed(2)} {item.unitOfMeasure}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.shortfall > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.shortfall.toFixed(2)} {item.unitOfMeasure}
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
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <p className="text-gray-900">{selectedForecast.createdBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900">{new Date(selectedForecast.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
                  <p className="text-gray-900">{selectedForecast.updatedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <p className="text-gray-900">{new Date(selectedForecast.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  navigate(`/raw-material-forecast/edit/${selectedForecast.id}`)
                }}
                className="btn-primary"
              >
                Edit Forecast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RawMaterialForecastPage
