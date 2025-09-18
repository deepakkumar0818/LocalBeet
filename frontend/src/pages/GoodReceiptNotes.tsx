import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, Upload } from 'lucide-react'
import { GoodReceiptNote } from '../types'

const GoodReceiptNotes: React.FC = () => {
  const navigate = useNavigate()
  const [grns, setGRNs] = useState<GoodReceiptNote[]>([
    {
      id: '1',
      grnNumber: 'GRN-2024-001',
      poNumber: 'PO-2024-001',
      supplierId: 'SUP-001',
      supplierName: 'Steel Suppliers Ltd.',
      receiptDate: new Date('2024-01-20'),
      status: 'Approved',
      totalAmount: 4550.00,
      items: [
        {
          poItemId: 'PO-ITEM-001',
          materialId: 'RM-001',
          materialCode: 'RM-001',
          materialName: 'Steel Rod 12mm',
          orderedQuantity: 100,
          receivedQuantity: 100,
          unitPrice: 45.50,
          totalPrice: 4550.00,
          qualityStatus: 'Accepted',
          remarks: 'Good quality'
        }
      ],
      warehouseId: 'WH-001',
      warehouseName: 'Main Warehouse',
      receivedBy: 'John Doe',
      notes: 'All items received in good condition',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin',
      updatedBy: 'admin'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [_selectedGRN, setSelectedGRN] = useState<GoodReceiptNote | null>(null)
  const [_showDetailsModal, setShowDetailsModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredGRNs = grns.filter(grn =>
    grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Function removed - not used in the component

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this GRN?')) {
      setGRNs(grns.filter(g => g.id !== id))
    }
  }

  const handleExport = () => {
    if (filteredGRNs.length === 0) {
      alert('No GRNs to export')
      return
    }

    const csvContent = [
      // Header row
      [
        'GRN Number',
        'PO Number',
        'Supplier Name',
        'Receipt Date',
        'Status',
        'Total Amount',
        'Created By',
        'Updated By'
      ].join(','),
      // Data rows
      ...filteredGRNs.map(grn => [
        grn.grnNumber,
        grn.poNumber,
        grn.supplierName,
        grn.receiptDate.toLocaleDateString(),
        grn.status,
        grn.totalAmount.toFixed(2),
        grn.createdBy,
        grn.updatedBy
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `grn-receipts-${new Date().toISOString().split('T')[0]}.csv`)
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

      // const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const dataRows = lines.slice(1)

      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        try {
          const values = row.split(',').map(v => v.replace(/"/g, '').trim())
          const grnData: GoodReceiptNote = {
            id: `grn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            grnNumber: values[0] || '',
            poNumber: values[1] || '',
            supplierId: 'SUP-001',
            supplierName: values[2] || '',
            warehouseId: 'WH-001',
            warehouseName: 'Main Warehouse',
            receiptDate: new Date(values[3] || new Date().toISOString().split('T')[0]),
            status: (values[4] || 'Draft') as 'Draft' | 'Approved' | 'Rejected',
            totalAmount: parseFloat(values[5]) || 0,
            items: [],
            receivedBy: values[6] || 'admin',
            createdBy: values[6] || 'admin',
            updatedBy: values[7] || 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          }

          setGRNs(prev => [...prev, grnData])
          successCount++
        } catch (err) {
          errorCount++
        }
      }

      alert(`Import completed!\n\nSuccessfully imported: ${successCount} GRNs\nErrors: ${errorCount}`)
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
      ['GRN Number', 'PO Number', 'Supplier Name', 'Receipt Date', 'Status', 'Total Amount', 'Created By', 'Updated By'],
      ['GRN-2024-003', 'PO-2024-003', 'Fresh Foods Ltd', '2024-01-22', 'Approved', '1200.00', 'admin', 'admin'],
      ['GRN-2024-004', 'PO-2024-004', 'Kitchen Supplies Co', '2024-01-23', 'Draft', '850.00', 'admin', 'admin']
    ]

    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'grn-sample-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good Receipt Notes</h1>
          <p className="text-gray-600">Manage incoming material receipts</p>
        </div>
        <button
          onClick={() => navigate('/good-receipt-notes/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create GRN
        </button>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search GRNs..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center"
              title="Export GRNs to CSV"
              disabled={filteredGRNs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button 
              onClick={handleImport}
              className="btn-secondary flex items-center"
              title="Import GRNs from CSV"
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
      </div>

      {/* GRNs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">GRN Number</th>
                <th className="table-header">PO Number</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Receipt Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Warehouse</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGRNs.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{grn.grnNumber}</td>
                  <td className="table-cell">{grn.poNumber}</td>
                  <td className="table-cell">{grn.supplierName}</td>
                  <td className="table-cell">{grn.receiptDate.toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grn.status)}`}>
                      {grn.status}
                    </span>
                  </td>
                  <td className="table-cell">{grn.warehouseName}</td>
                  <td className="table-cell font-medium">{grn.totalAmount.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGRN(grn)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/good-receipt-notes/edit/${grn.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(grn.id)}
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

export default GoodReceiptNotes
