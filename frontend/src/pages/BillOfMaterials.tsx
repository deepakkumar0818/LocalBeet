import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Upload, X } from 'lucide-react'
import { BillOfMaterials } from '../types'
import { apiService } from '../services/api'

const BillOfMaterialsPage: React.FC = () => {
  const navigate = useNavigate()
  const [boms, setBoms] = useState<BillOfMaterials[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load BOMs from API
  useEffect(() => {
    loadBOMs()
  }, [])

  const loadBOMs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getBillOfMaterials({
        limit: 1000, // Get all BOMs for now
        search: searchTerm,
        status: filterStatus,
        sortBy,
        sortOrder
      })
      
      if (response.success) {
        console.log('Loaded BOMs:', response.data)
        setBoms(response.data)
      } else {
        setError('Failed to load BOMs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load BOMs')
      console.error('Error loading BOMs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadBOMs()
    }
  }, [searchTerm, filterStatus, sortBy, sortOrder])

  const filteredBOMs = boms.filter(bom => {
    const matchesSearch = bom.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.bomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bom.productDescription.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === '' || bom.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const clearFilters = () => {
    setSearchTerm('')
    setFilterStatus('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const handleView = (bom: BillOfMaterials) => {
    setSelectedBOM(bom)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    console.log('Deleting BOM with ID:', id)
    if (!id) {
      alert('Error: BOM ID is missing')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this BOM?')) {
      try {
        const response = await apiService.deleteBillOfMaterial(id)
        if (response.success) {
          // Reload BOMs from API
          await loadBOMs()
        } else {
          alert('Failed to delete BOM')
        }
      } catch (err) {
        alert('Error deleting BOM: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting BOM:', err)
      }
    }
  }

  const handleExport = () => {
    if (filteredBOMs.length === 0) {
      alert('No BOMs to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'BOM Code',
        'Product Name',
        'Product Description',
        'Status',
        'Version',
        'Created At',
        'Updated At',
        'Notes'
      ].join(','),
      // Data rows
      ...filteredBOMs.map(bom => [
        bom.bomCode,
        bom.productName,
        bom.productDescription,
        bom.status,
        bom.version,
        new Date(bom.createdAt).toLocaleDateString(),
        new Date(bom.updatedAt).toLocaleDateString(),
        bom.notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `bom-recipes-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    try {
      setImporting(true)
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          const bomData = {
            bomCode: values[0] || '',
            productName: values[1] || '',
            productDescription: values[2] || '',
            status: values[3] || 'Draft',
            version: values[4] || '1.0',
            notes: values[7] || ''
          }

          // Create BOM via API
          const response = await apiService.createBillOfMaterial(bomData)
          if (response.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (err) {
          errorCount++
        }
      }

      alert(`Import completed!\n\nSuccessfully imported: ${successCount} BOMs\nErrors: ${errorCount}`)
      
      // Reload BOMs
      await loadBOMs()
    } catch (err) {
      alert('Error importing file: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['BOM Code', 'Product Name', 'Product Description', 'Status', 'Version', 'Created At', 'Updated At', 'Notes'],
      ['BOM-001', 'Fresh Green Smoothie', 'Healthy smoothie with spinach and fruits', 'Active', '1.0', '2024-01-15', '2024-01-15', 'Popular breakfast item'],
      ['BOM-002', 'Protein Power Bowl', 'High protein meal bowl', 'Active', '1.0', '2024-01-15', '2024-01-15', 'Post-workout meal']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'bom-sample-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BOMs...</p>
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
            onClick={loadBOMs}
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
          <h1 className="text-2xl font-bold text-gray-900">Recipes (BOM)</h1>
          <p className="text-gray-600">Manage your restaurant recipes and product formulations</p>
        </div>
        <button
          onClick={() => navigate('/bill-of-materials/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Recipe
        </button>
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
                  placeholder="Search recipes by name, code, or description..."
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
              <button 
                onClick={handleExport}
                className="btn-secondary flex items-center"
                title="Export BOMs to CSV"
                disabled={filteredBOMs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={handleImport}
                className="btn-secondary flex items-center"
                title="Import BOMs from CSV"
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button 
                onClick={downloadSampleCSV}
                className="btn-secondary flex items-center"
                title="Download sample CSV template"
              >
                <Download className="h-4 w-4 mr-2" />
                Sample CSV
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <option value="Inactive">Inactive</option>
                <option value="Obsolete">Obsolete</option>
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
                  <option value="bomCode">BOM Code</option>
                  <option value="productName">Product Name</option>
                  <option value="totalCost">Total Cost</option>
                  <option value="status">Status</option>
                  <option value="createdAt">Date Created</option>
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
              Showing {filteredBOMs.length} of {boms.length} recipes
              {(searchTerm || filterStatus) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {filteredBOMs.length !== boms.length && (
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

      {/* BOMs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">BOM Code</th>
                <th className="table-header">Product Name</th>
                <th className="table-header">Description</th>
                <th className="table-header">Version</th>
                <th className="table-header">Total Cost</th>
                <th className="table-header">Status</th>
                <th className="table-header">Items</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBOMs.map((bom) => (
                <tr key={bom.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{bom.bomCode}</td>
                  <td className="table-cell">
                    <div className="text-gray-900">{bom.productName}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-gray-600 text-sm max-w-xs truncate">
                      {bom.productDescription}
                    </div>
                  </td>
                  <td className="table-cell">{bom.version}</td>
                  <td className="table-cell">{bom.totalCost.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bom.status === 'Active' ? 'bg-green-100 text-green-800' :
                      bom.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      bom.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bom.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-600">
                      {bom.items.length} ingredients
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(bom)}
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/bill-of-materials/edit/${bom.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bom.id)}
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

      {/* Count Display */}
      <div className="text-center text-sm text-gray-600">
        Total Recipes: <span className="font-semibold text-blue-600">{boms.length}</span>
      </div>

      {/* View Modal */}
      {showViewModal && selectedBOM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">BOM Details</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">BOM Code</label>
                  <p className="text-gray-900 font-mono">{selectedBOM.bomCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <p className="text-gray-900">{selectedBOM.productName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <p className="text-gray-900">{selectedBOM.version}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedBOM.status === 'Active' ? 'bg-green-100 text-green-800' :
                    selectedBOM.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBOM.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedBOM.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <p className="text-gray-900 font-semibold">{selectedBOM.totalCost.toFixed(2)} KWD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <p className="text-gray-900">{new Date(selectedBOM.effectiveDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{selectedBOM.productDescription}</p>
              </div>

              {/* BOM Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Ingredients ({selectedBOM.items.length} items)</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedBOM.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">{item.materialCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.materialName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitOfMeasure}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.unitCost.toFixed(2)} KWD</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.totalCost.toFixed(2)} KWD</td>
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
                  <p className="text-gray-900">{selectedBOM.createdBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900">{new Date(selectedBOM.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
                  <p className="text-gray-900">{selectedBOM.updatedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Updated Date</label>
                  <p className="text-gray-900">{new Date(selectedBOM.updatedAt).toLocaleString()}</p>
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
                  navigate(`/bill-of-materials/edit/${selectedBOM.id}`)
                }}
                className="btn-primary"
              >
                Edit BOM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default BillOfMaterialsPage
