import React from 'react'
import { X, Truck, Store, Package, Calendar, User, AlertCircle } from 'lucide-react'

export interface TransferOrderItem {
  _id?: string
  itemType: 'Raw Material' | 'Finished Goods'
  itemCode: string
  itemName: string
  category?: string
  subCategory?: string
  unitOfMeasure: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  totalValue?: number
  notes?: string
}

export interface TransferOrder {
  _id?: string
  id?: string
  transferNumber: string
  fromOutlet: {
    id?: string
    code: string
    name: string
    type: string
    location?: string
  }
  toOutlet: {
    id?: string
    code: string
    name: string
    type: string
    location?: string
  }
  transferDate: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Normal'
  status: 'Pending' | 'Approved' | 'In Transit' | 'Delivered' | 'Cancelled'
  totalAmount?: number
  totalValue?: number
  items: TransferOrderItem[]
  requestedBy: string
  requestedAt?: string
  notes?: string
}

interface TransferOrderModalProps {
  isOpen: boolean
  onClose: () => void
  transferOrder: TransferOrder | null
  onAccept: (transferOrderId: string) => void
  onReject: (transferOrderId: string) => void
  loading?: boolean
}

const TransferOrderModal: React.FC<TransferOrderModalProps> = ({
  isOpen,
  onClose,
  transferOrder,
  onAccept,
  onReject,
  loading = false
}) => {
  if (!isOpen || !transferOrder) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KW', {
      style: 'currency',
      currency: 'KWD'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Transfer Order Details
              </h2>
              <p className="text-sm text-gray-600">
                Order #{transferOrder.transferNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 gap-6">
              {/* From Outlet */}
              <div className="card p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">From Outlet</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Outlet:</span>
                    <span className="ml-2 text-gray-900">{transferOrder.fromOutlet.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Transfer Date</span>
                </div>
                <p className="text-gray-900">{formatDate(transferOrder.transferDate)}</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Priority</span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(transferOrder.priority)}`}>
                  {transferOrder.priority}
                </span>
              </div>
            </div>

            {/* Request Info */}
            <div className="grid grid-cols-1 gap-4">
              <div className="card p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Requested By</span>
                </div>
                <p className="text-gray-900">{transferOrder.requestedBy}</p>
                <p className="text-xs text-gray-500">{formatDate(transferOrder.requestedAt)}</p>
              </div>
            </div>

            {/* Items List */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferOrder.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.itemType === 'Raw Material' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.itemType === 'Raw Material' ? 'Raw Material' : 'Finished Goods'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category || '-'}
                          {item.subCategory && (
                            <div className="text-xs text-gray-400">{item.subCategory}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity} {item.unitOfMeasure}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.totalPrice || item.totalValue || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Total Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(transferOrder.totalAmount || transferOrder.totalValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Review the transfer order details before making a decision
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={loading}
            >
              Close
            </button>
            <button
              onClick={() => {
                const transferOrderId = transferOrder._id || transferOrder.id || ''
                console.log('TransferOrderModal: Reject button clicked')
                console.log('TransferOrderModal: transferOrder._id =', transferOrder._id)
                console.log('TransferOrderModal: transferOrder.id =', transferOrder.id)
                console.log('TransferOrderModal: Using transferOrderId =', transferOrderId)
                onReject(transferOrderId)
              }}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reject Order'}
            </button>
            <button
              onClick={() => {
                const transferOrderId = transferOrder._id || transferOrder.id || ''
                console.log('TransferOrderModal: Accept button clicked')
                console.log('TransferOrderModal: transferOrder._id =', transferOrder._id)
                console.log('TransferOrderModal: transferOrder.id =', transferOrder.id)
                console.log('TransferOrderModal: Using transferOrderId =', transferOrderId)
                onAccept(transferOrderId)
              }}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferOrderModal
