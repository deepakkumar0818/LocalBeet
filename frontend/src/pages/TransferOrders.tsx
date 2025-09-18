import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, X, ArrowRight } from 'lucide-react'
import { TransferOrder } from '../types'

const TransferOrders: React.FC = () => {
  const navigate = useNavigate()
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([
    {
      id: '1',
      transferNumber: 'TO-2024-001',
      fromWarehouseId: 'WH-001',
      fromWarehouseName: 'Main Warehouse',
      toWarehouseId: 'WH-002',
      toWarehouseName: 'Secondary Warehouse',
      transferDate: new Date('2024-01-20'),
      expectedDeliveryDate: new Date('2024-01-22'),
      status: 'In Transit',
      priority: 'High',
      totalAmount: 1250.75,
      items: [
        {
          materialId: 'RM-001',
          materialCode: 'RM-001',
          materialName: 'Steel Rod 12mm',
          quantity: 25,
          unitOfMeasure: 'KG',
          unitPrice: 45.50,
          totalPrice: 1137.50,
          remarks: 'Urgent transfer for production'
        },
        {
          materialId: 'RM-002',
          materialCode: 'RM-002',
          materialName: 'Aluminum Sheet 2mm',
          quantity: 5,
          unitOfMeasure: 'SQM',
          unitPrice: 125.00,
          totalPrice: 625.00,
          remarks: 'Standard transfer'
        }
      ],
      requestedBy: 'John Smith',
      approvedBy: 'Jane Doe',
      transferType: 'Internal',
      reason: 'Production requirement',
      notes: 'Urgent transfer for ongoing production',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin',
      updatedBy: 'admin'
    },
    {
      id: '2',
      transferNumber: 'TO-2024-002',
      fromWarehouseId: 'WH-002',
      fromWarehouseName: 'Secondary Warehouse',
      toWarehouseId: 'WH-001',
      toWarehouseName: 'Main Warehouse',
      transferDate: new Date('2024-01-21'),
      status: 'Approved',
      priority: 'Medium',
      totalAmount: 850.25,
      items: [
        {
          materialId: 'RM-003',
          materialCode: 'RM-003',
          materialName: 'Plastic Granules',
          quantity: 20,
          unitOfMeasure: 'KG',
          unitPrice: 25.75,
          totalPrice: 515.00,
          remarks: 'Consolidation transfer'
        }
      ],
      requestedBy: 'Mike Johnson',
      transferType: 'Internal',
      reason: 'Stock consolidation',
      notes: 'Consolidating stock for better management',
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
      createdBy: 'admin',
      updatedBy: 'admin'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [editingTransfer, setEditingTransfer] = useState<TransferOrder | null>(null)
  const [_showModal, setShowModal] = useState(false)

  const filteredTransfers = transferOrders.filter(transfer => {
    const matchesSearch = transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.fromWarehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.toWarehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || transfer.status === statusFilter
    const matchesPriority = priorityFilter === '' || transfer.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800'
      case 'In Transit': return 'bg-blue-100 text-blue-800'
      case 'Approved': return 'bg-yellow-100 text-yellow-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransferTypeColor = (type: string) => {
    switch (type) {
      case 'Emergency': return 'bg-red-100 text-red-800'
      case 'External': return 'bg-purple-100 text-purple-800'
      case 'Internal': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transfer order?')) {
      setTransferOrders(transferOrders.filter(t => t.id !== id))
    }
  }

  const _TransferOrderModal: React.FC = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTransfer ? 'Edit Transfer Order' : 'Create New Transfer Order'}
          </h3>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Number</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingTransfer?.transferNumber || ''}
                  placeholder="TO-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Type</label>
                <select className="input-field" defaultValue={editingTransfer?.transferType || 'Internal'}>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
                <select className="input-field">
                  <option value="">Select From Warehouse</option>
                  <option value="WH-001">Main Warehouse</option>
                  <option value="WH-002">Secondary Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
                <select className="input-field">
                  <option value="">Select To Warehouse</option>
                  <option value="WH-001">Main Warehouse</option>
                  <option value="WH-002">Secondary Warehouse</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                <input
                  type="date"
                  className="input-field"
                  defaultValue={editingTransfer?.transferDate.toISOString().split('T')[0] || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                <input
                  type="date"
                  className="input-field"
                  defaultValue={editingTransfer?.expectedDeliveryDate?.toISOString().split('T')[0] || ''}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="input-field" defaultValue={editingTransfer?.status || 'Draft'}>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select className="input-field" defaultValue={editingTransfer?.priority || 'Medium'}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Requested By</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingTransfer?.requestedBy || ''}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={editingTransfer?.reason || ''}
                  placeholder="Production requirement"
                />
              </div>
            </div>

            {/* Transfer Items */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Transfer Items</h4>
              <div className="space-y-3">
                {editingTransfer?.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-3 p-3 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Material Code</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        defaultValue={item.materialCode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Material Name</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        defaultValue={item.materialName}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        className="input-field text-sm"
                        defaultValue={item.quantity}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        defaultValue={item.unitOfMeasure}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Unit Price</label>
                      <input
                        type="number"
                        className="input-field text-sm"
                        defaultValue={item.unitPrice}
                      />
                    </div>
                    <div className="flex items-end">
                      <button type="button" className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-secondary text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="input-field"
                rows={3}
                defaultValue={editingTransfer?.notes || ''}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingTransfer(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingTransfer ? 'Update Transfer Order' : 'Create Transfer Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  const TransferDetailsModal: React.FC = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transfer Order Details</h3>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {selectedTransfer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Number</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.transferNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransferTypeColor(selectedTransfer.transferType)}`}>
                    {selectedTransfer.transferType}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">From Warehouse</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.fromWarehouseName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To Warehouse</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.toWarehouseName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer Date</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.transferDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.expectedDeliveryDate?.toLocaleDateString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransfer.status)}`}>
                    {selectedTransfer.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTransfer.priority)}`}>
                    {selectedTransfer.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested By</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.requestedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.reason}</p>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Transfer Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Material Code</th>
                        <th className="table-header">Material Name</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Unit</th>
                        <th className="table-header">Unit Price</th>
                        <th className="table-header">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index}>
                          <td className="table-cell">{item.materialCode}</td>
                          <td className="table-cell">{item.materialName}</td>
                          <td className="table-cell">{item.quantity}</td>
                          <td className="table-cell">{item.unitOfMeasure}</td>
                          <td className="table-cell">{item.unitPrice.toFixed(2)} KWD</td>
                          <td className="table-cell font-medium">{item.totalPrice.toFixed(2)} KWD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount: {selectedTransfer.totalAmount.toFixed(2)} KWD
                  </span>
                </div>
              </div>

              {selectedTransfer.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedTransfer.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Orders</h1>
          <p className="text-gray-600">Manage material transfers between warehouses</p>
        </div>
        <button
          onClick={() => navigate('/transfer-orders/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Transfer Order
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transfer orders..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              className="input-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <button className="btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="btn-secondary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Transfer Number</th>
                <th className="table-header">From → To</th>
                <th className="table-header">Transfer Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Type</th>
                <th className="table-header">Requested By</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{transfer.transferNumber}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <span className="text-sm">{transfer.fromWarehouseName}</span>
                      <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                      <span className="text-sm">{transfer.toWarehouseName}</span>
                    </div>
                  </td>
                  <td className="table-cell">{transfer.transferDate.toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(transfer.priority)}`}>
                      {transfer.priority}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransferTypeColor(transfer.transferType)}`}>
                      {transfer.transferType}
                    </span>
                  </td>
                  <td className="table-cell">{transfer.requestedBy}</td>
                  <td className="table-cell font-medium">{transfer.totalAmount.toFixed(2)} KWD</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransfer(transfer)
                          setShowDetailsModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/transfer-orders/edit/${transfer.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transfer.id)}
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

      {showDetailsModal && <TransferDetailsModal />}
    </div>
  )
}

export default TransferOrders
