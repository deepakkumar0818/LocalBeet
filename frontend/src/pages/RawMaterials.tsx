import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Upload } from 'lucide-react'
import { RawMaterial } from '../types'
import { apiService } from '../services/api'

const RawMaterials: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStockStatus, setFilterStockStatus] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [sortBy, setSortBy] = useState('materialCode')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load materials from API
  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getRawMaterials({
        limit: 1000 // Get all materials for now
      })
      
      if (response.success) {
        setMaterials(response.data)
      } else {
        setError('Failed to load materials')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials')
      console.error('Error loading materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum) return { status: 'Low', color: 'text-red-600 bg-red-100' }
    if (current <= minimum * 1.5) return { status: 'Medium', color: 'text-yellow-600 bg-yellow-100' }
    return { status: 'Good', color: 'text-green-600 bg-green-100' }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === '' || material.category === filterCategory
    
    const matchesStatus = filterStatus === '' || 
                         (filterStatus === 'active' && material.isActive) ||
                         (filterStatus === 'inactive' && !material.isActive)
    
    const stockStatus = getStockStatus(material.currentStock, material.minimumStock)
    const matchesStockStatus = filterStockStatus === '' || stockStatus.status.toLowerCase() === filterStockStatus.toLowerCase()
    
    const matchesSupplier = filterSupplier === '' || material.supplierId === filterSupplier
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStockStatus && matchesSupplier
  }).sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'materialCode':
        aValue = a.materialCode
        bValue = b.materialCode
        break
      case 'materialName':
        aValue = a.materialName
        bValue = b.materialName
        break
      case 'category':
        aValue = a.category
        bValue = b.category
        break
      case 'unitPrice':
        aValue = a.unitPrice
        bValue = b.unitPrice
        break
      case 'currentStock':
        aValue = a.currentStock
        bValue = b.currentStock
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        aValue = a.materialCode
        bValue = b.materialCode
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const categories = [...new Set(materials.map(m => m.category))]
  const suppliers = [
    { id: 'SUP-FP-001', name: 'Fresh Produce Co' },
    { id: 'SUP-PT-001', name: 'Pantry Essentials' },
    { id: 'SUP-DA-001', name: 'Dairy Alternatives Inc' },
    { id: 'SUP-SW-001', name: 'Sweeteners & Syrups' },
    { id: 'SUP-BV-001', name: 'Beverage Solutions' },
    { id: 'SUP-SP-001', name: 'Supplements Plus' },
    { id: 'SUP-SF-001', name: 'Superfoods Direct' },
    { id: 'SUP-DY-001', name: 'Dairy Farm Fresh' },
    { id: 'SUP-BK-001', name: 'Artisan Bakery' }
  ]

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterStatus('')
    setFilterStockStatus('')
    setFilterSupplier('')
    setSortBy('materialCode')
    setSortOrder('asc')
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await apiService.deleteRawMaterial(id)
        if (response.success) {
          // Reload materials from API
          await loadMaterials()
        } else {
          alert('Failed to delete material')
        }
      } catch (err) {
        alert('Error deleting material: ' + (err instanceof Error ? err.message : 'Unknown error'))
        console.error('Error deleting material:', err)
      }
    }
  }

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvData = filteredMaterials.map(material => ({
        'Material Code': material.materialCode,
        'Material Name': material.materialName,
        'Description': material.description,
        'Category': material.category,
        'Unit of Measure': material.unitOfMeasure,
        'Unit Price': material.unitPrice,
        'Current Stock': material.currentStock,
        'Minimum Stock': material.minimumStock,
        'Maximum Stock': material.maximumStock,
        'Supplier ID': material.supplierId,
        'Status': material.isActive ? 'Active' : 'Inactive',
        'Created At': new Date(material.createdAt).toLocaleDateString()
      }))

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `raw-materials-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Export completed successfully')
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = () => {
    console.log('Import button clicked')
    if (fileInputRef.current) {
      console.log('File input ref found, clicking...')
      fileInputRef.current.click()
    } else {
      console.error('File input ref not found')
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        'Material Code': 'MAT-001',
        'Material Name': 'Sample Material',
        'Description': 'This is a sample material for import',
        'Category': 'Fresh Produce',
        'Unit of Measure': 'KG',
        'Unit Price': '5.50',
        'Current Stock': '100',
        'Minimum Stock': '10',
        'Maximum Stock': '500',
        'Supplier ID': 'SUP-001',
        'Status': 'Active'
      },
      {
        'Material Code': 'MAT-002',
        'Material Name': 'Another Sample',
        'Description': 'Another sample material',
        'Category': 'Pantry',
        'Unit of Measure': 'PC',
        'Unit Price': '2.25',
        'Current Stock': '50',
        'Minimum Stock': '5',
        'Maximum Stock': '200',
        'Supplier ID': 'SUP-002',
        'Status': 'Active'
      }
    ]

    const headers = Object.keys(sampleData[0])
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row]
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample-raw-materials-import.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    try {
      setImporting(true)
      console.log('Starting import process...')
      
      const text = await file.text()
      console.log('File content length:', text.length)
      
      const lines = text.split('\n').filter(line => line.trim())
      console.log('Number of lines:', lines.length)
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row')
        return
      }

      // Better CSV parsing to handle quoted fields with commas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              // Escaped quote
              current += '"'
              i++ // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        
        // Add the last field
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0])
      console.log('Headers:', headers)
      
      const data = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line)
        const row: any = {}
        headers.forEach((header, headerIndex) => {
          row[header] = values[headerIndex] || ''
        })
        console.log(`Row ${index + 1}:`, row)
        return row
      })

      // Validate required fields
      const requiredFields = ['Material Code', 'Material Name', 'Category', 'Unit of Measure', 'Unit Price']
      const missingFields = requiredFields.filter(field => !headers.includes(field))
      
      if (missingFields.length > 0) {
        alert(`Missing required columns: ${missingFields.join(', ')}\n\nRequired columns: ${requiredFields.join(', ')}\n\nFound columns: ${headers.join(', ')}`)
        return
      }

      console.log('Starting to process', data.length, 'rows...')

      // Process import data
      let successCount = 0
      let errorCount = 0
      let stockUpdatedCount = 0
      const errors: string[] = []
      const processedMaterials = new Set<string>() // Track processed material codes

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          console.log(`Processing row ${i + 1}:`, row)
          
          const materialCode = row['Material Code']
          const stockToAdd = parseFloat(row['Current Stock']) || 0
          
          // Check if we've already processed this material code in this import
          if (processedMaterials.has(materialCode)) {
            console.log(`Material ${materialCode} already processed in this import, adding stock...`)
            
            // Find existing material
            const existingMaterial = materials.find(m => m.materialCode === materialCode)
            if (existingMaterial) {
              // Add stock to existing material
              const updatedStock = existingMaterial.currentStock + stockToAdd
              const materialData = {
                ...existingMaterial,
                currentStock: updatedStock
              }
              
              console.log(`Adding ${stockToAdd} stock to ${materialCode}. New total: ${updatedStock}`)
              const response = await apiService.updateRawMaterial(existingMaterial.id, materialData)
              
              if (response.success) {
                stockUpdatedCount++
                console.log(`Successfully added stock to ${materialCode}`)
              } else {
                errorCount++
                const errorMsg = `Failed to add stock to ${materialCode}: ${response.message || 'Unknown error'}`
                errors.push(errorMsg)
                console.error(errorMsg)
              }
            } else {
              errorCount++
              const errorMsg = `Material ${materialCode} not found for stock addition`
              errors.push(errorMsg)
              console.error(errorMsg)
            }
            continue
          }
          
          const materialData = {
            materialCode: materialCode,
            materialName: row['Material Name'],
            description: row['Description'] || '',
            category: row['Category'],
            unitOfMeasure: row['Unit of Measure'],
            unitPrice: parseFloat(row['Unit Price']) || 0,
            currentStock: stockToAdd,
            minimumStock: parseFloat(row['Minimum Stock']) || 0,
            maximumStock: parseFloat(row['Maximum Stock']) || 0,
            supplierId: row['Supplier ID'] || '',
            isActive: row['Status']?.toLowerCase() === 'active' || true
          }

          console.log('Processed material data:', materialData)

          // Check if material already exists
          const existingMaterial = materials.find(m => m.materialCode === materialData.materialCode)
          
          if (existingMaterial) {
            console.log('Material exists, adding stock to existing material:', existingMaterial.id)
            // Add stock to existing material instead of updating
            const updatedStock = existingMaterial.currentStock + stockToAdd
            const updatedMaterialData = {
              ...existingMaterial,
              currentStock: updatedStock
            }
            
            console.log(`Adding ${stockToAdd} stock to existing ${materialCode}. Previous: ${existingMaterial.currentStock}, New: ${updatedStock}`)
            const response = await apiService.updateRawMaterial(existingMaterial.id, updatedMaterialData)
            console.log('Update response:', response)
            if (response.success) {
              stockUpdatedCount++
              console.log(`Successfully added stock to ${materialData.materialCode}`)
            } else {
              errorCount++
              const errorMsg = `Failed to add stock to ${materialData.materialCode}: ${response.message || 'Unknown error'}`
              errors.push(errorMsg)
              console.error(errorMsg)
            }
          } else {
            console.log('Creating new material:', materialData.materialCode)
            // Create new material
            const response = await apiService.createRawMaterial(materialData)
            console.log('Create response:', response)
            if (response.success) {
              successCount++
              console.log(`Successfully created ${materialData.materialCode}`)
            } else {
              errorCount++
              const errorMsg = `Failed to create ${materialData.materialCode}: ${response.message || 'Unknown error'}`
              errors.push(errorMsg)
              console.error(errorMsg)
            }
          }
          
          // Mark this material code as processed
          processedMaterials.add(materialCode)
          
        } catch (err) {
          errorCount++
          const errorMsg = `Error processing row ${i + 1} (${row['Material Code'] || 'Unknown'}): ${err instanceof Error ? err.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(errorMsg, err)
        }
      }

      console.log('Import processing complete. Created:', successCount, 'Stock Updated:', stockUpdatedCount, 'Errors:', errorCount)

      // Reload materials
      await loadMaterials()

      // Show results
      if (errorCount > 0) {
        alert(`Import completed with errors:\n\nNew Materials Created: ${successCount}\nStock Added to Existing: ${stockUpdatedCount}\nErrors: ${errorCount}\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
      } else {
        alert(`Import completed successfully!\n\nNew Materials Created: ${successCount}\nStock Added to Existing: ${stockUpdatedCount}`)
      }

    } catch (err) {
      console.error('Import failed:', err)
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}\n\nPlease check your CSV file format and try again.`)
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading materials...</p>
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
            onClick={loadMaterials}
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
          <h1 className="text-2xl font-bold text-gray-900">Ingredient Master</h1>
          <p className="text-gray-600">Manage your restaurant ingredients and raw material inventory</p>
        </div>
        <button
          onClick={() => navigate('/raw-materials/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
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
                  placeholder="Search materials by name, code, or description..."
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
                title="Export materials to CSV"
                disabled={filteredMaterials.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={handleImport}
                className="btn-secondary flex items-center"
                title="Import materials from CSV"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="input-field"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                className="input-field"
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
              >
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="medium">Medium Stock</option>
                <option value="good">Good Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                className="input-field"
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
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
                  <option value="materialCode">Material Code</option>
                  <option value="materialName">Name</option>
                  <option value="category">Category</option>
                  <option value="unitPrice">Unit Price</option>
                  <option value="currentStock">Current Stock</option>
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
              Showing {filteredMaterials.length} of {materials.length} materials
              {(searchTerm || filterCategory || filterStatus || filterStockStatus || filterSupplier) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {filteredMaterials.length !== materials.length && (
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

      {/* Materials Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Material Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Unit Price</th>
                <th className="table-header">Current Stock</th>
                <th className="table-header">Stock Status</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => {
                const stockStatus = getStockStatus(material.currentStock, material.minimumStock)
                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{material.materialCode}</td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{material.materialName}</div>
                        <div className="text-gray-500 text-sm">{material.description}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {material.category}
                      </span>
                    </td>
                    <td className="table-cell">{material.unitOfMeasure}</td>
                    <td className="table-cell">{material.unitPrice.toFixed(2)} KWD</td>
                    <td className="table-cell">{material.currentStock}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        material.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {material.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/raw-materials/edit/${material.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

    </div>
  )
}

export default RawMaterials
