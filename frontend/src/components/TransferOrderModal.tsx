import React, { useState, useEffect } from 'react'
import { X, Truck, Store, Calendar, User, AlertCircle, Edit2, Check, XCircle, Plus, Minus } from 'lucide-react'

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
  onAccept: (transferOrderId: string, editedItems?: TransferOrderItem[], notes?: string) => void
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
  // State for edited quantities
  const [editedItems, setEditedItems] = useState<TransferOrderItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState<string>('')
  const [transferNotes, setTransferNotes] = useState<string>('')

  // Initialize edited items when transfer order changes
  useEffect(() => {
    if (transferOrder) {
      setEditedItems(transferOrder.items.map(item => ({ ...item })))
      setTransferNotes(transferOrder.notes || '')
    }
  }, [transferOrder])

  if (!isOpen || !transferOrder) return null

  // Check if transfer order is already processed (Approved or Rejected)
  const isProcessed = transferOrder.status === 'Approved' || transferOrder.status === 'Rejected'

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

  const handleEditQuantity = (index: number) => {
    const item = editedItems[index]
    setEditingIndex(index)
    setEditQuantity(item.quantity.toString())
  }

  const handleSaveQuantity = (index: number) => {
    // Parse as integer (whole number only)
    const newQuantity = parseInt(editQuantity, 10)
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Please enter a valid whole number (must be 0 or greater)')
      return
    }

    // Check if it's a fractional number (has decimal point)
    if (editQuantity.includes('.') || editQuantity.includes(',')) {
      alert('Please enter a whole number only (no decimal values allowed)')
      return
    }

    const updatedItems = [...editedItems]
    const item = updatedItems[index]
    const originalQuantity = transferOrder.items[index].quantity

    // Validate: edited quantity cannot exceed original requested quantity
    if (newQuantity > originalQuantity) {
      alert(`Cannot exceed original requested quantity of ${originalQuantity} ${item.unitOfMeasure}. You can only decrease the quantity.`)
      return
    }

    // Update quantity and recalculate totals
    item.quantity = newQuantity
    item.totalPrice = newQuantity * item.unitPrice
    item.totalValue = newQuantity * item.unitPrice

    setEditedItems(updatedItems)
    setEditingIndex(null)
    setEditQuantity('')
  }

  const handleQuantityInputChange = (value: string) => {
    // Only allow digits (no decimals, no negative signs)
    const numericValue = value.replace(/[^0-9]/g, '')
    setEditQuantity(numericValue)
  }

  const handleIncrement = (index: number) => {
    const originalQuantity = transferOrder.items[index].quantity
    const currentValue = parseInt(editQuantity, 10) || 0
    
    // Cannot exceed original quantity
    if (currentValue < originalQuantity) {
      const newValue = currentValue + 1
      setEditQuantity(newValue.toString())
    }
  }

  const handleDecrement = (index: number) => {
    const currentValue = parseInt(editQuantity, 10) || 0
    
    // Cannot go below 0
    if (currentValue > 0) {
      const newValue = currentValue - 1
      setEditQuantity(newValue.toString())
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditQuantity('')
  }

  // Calculate total from edited items
  const calculateTotal = () => {
    return editedItems.reduce((sum, item) => {
      return sum + (item.totalPrice || item.totalValue || (item.quantity * item.unitPrice))
    }, 0)
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
                <p className="text-xs text-gray-500">{formatDate(transferOrder.requestedAt || transferOrder.transferDate)}</p>
              </div>
            </div>

            {/* Notes Section */}
            <div className="card p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Notes (Optional)
              </label>
              <textarea
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Add any notes or comments about this transfer order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes will be included in the Zoho Inventory transfer order description
              </p>
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
                        Requested Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved Qty
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
                    {transferOrder.items.map((originalItem, index) => {
                      const editedItem = editedItems[index] || originalItem
                      const isEditing = editingIndex === index
                      const hasChanges = editedItem.quantity !== originalItem.quantity
                      
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${hasChanges ? 'bg-yellow-50' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {originalItem.itemCode}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {originalItem.itemName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              originalItem.itemType === 'Raw Material' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {originalItem.itemType === 'Raw Material' ? 'Raw Material' : 'Finished Goods'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {originalItem.category || '-'}
                            {originalItem.subCategory && (
                              <div className="text-xs text-gray-400">{originalItem.subCategory}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {originalItem.quantity} {originalItem.unitOfMeasure}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                {/* Decrement Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDecrement(index)}
                                  disabled={parseInt(editQuantity, 10) <= 0}
                                  className={`p-1 rounded border transition-colors ${
                                    parseInt(editQuantity, 10) <= 0
                                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                      : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400'
                                  }`}
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                
                                {/* Quantity Input */}
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="0"
                                  max={originalItem.quantity}
                                  value={editQuantity}
                                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    // Prevent entering decimal point, minus sign, or 'e' (scientific notation)
                                    if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                      e.preventDefault()
                                      return
                                    }
                                    if (e.key === 'Enter') {
                                      handleSaveQuantity(index)
                                    } else if (e.key === 'Escape') {
                                      handleCancelEdit()
                                    }
                                  }}
                                  onBlur={() => {
                                    // Validate on blur - if empty or invalid, reset to current or clamp to valid range
                                    const parsed = parseInt(editQuantity, 10)
                                    if (isNaN(parsed) || parsed < 0) {
                                      setEditQuantity('0')
                                    } else if (parsed > originalItem.quantity) {
                                      // Clamp to maximum allowed (original quantity)
                                      setEditQuantity(originalItem.quantity.toString())
                                    }
                                  }}
                                  autoFocus
                                  title={`Enter a whole number between 0 and ${originalItem.quantity} (cannot exceed original)`}
                                />
                                
                                {/* Increment Button */}
                                <button
                                  type="button"
                                  onClick={() => handleIncrement(index)}
                                  disabled={parseInt(editQuantity, 10) >= originalItem.quantity}
                                  className={`p-1 rounded border transition-colors ${
                                    parseInt(editQuantity, 10) >= originalItem.quantity
                                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                      : 'bg-green-50 text-green-600 border-green-300 hover:bg-green-100 hover:border-green-400'
                                  }`}
                                  title="Increase quantity (max: original requested quantity)"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                
                                <span className="text-xs text-gray-500 ml-1">{originalItem.unitOfMeasure}</span>
                                
                                {/* Save Button */}
                                <button
                                  onClick={() => handleSaveQuantity(index)}
                                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                
                                {/* Cancel Button */}
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${hasChanges ? 'text-yellow-700' : 'text-gray-900'}`}>
                                  {editedItem.quantity} {originalItem.unitOfMeasure}
                                </span>
                                {hasChanges && (
                                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                                    Modified
                                  </span>
                                )}
                                {!isProcessed && (
                                  <button
                                    onClick={() => handleEditQuantity(index)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit quantity"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(originalItem.unitPrice)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(editedItem.totalPrice || editedItem.totalValue || (editedItem.quantity * editedItem.unitPrice))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {/* Total Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Original Total:</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(transferOrder.totalAmount || transferOrder.totalValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="text-lg font-semibold text-gray-900">Approved Total:</span>
                    <span className={`text-xl font-bold ${
                      calculateTotal() !== (transferOrder.totalAmount || transferOrder.totalValue || 0)
                        ? 'text-yellow-700' 
                        : 'text-gray-900'
                    }`}>
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                  {calculateTotal() !== (transferOrder.totalAmount || transferOrder.totalValue || 0) && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      <strong>Note:</strong> Quantities have been modified. Only the approved quantities will be transferred.
                    </div>
                  )}
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
                console.log('TransferOrderModal: Edited items:', editedItems)
                console.log('TransferOrderModal: Transfer notes:', transferNotes)
                
                // Check if any quantities were modified
                const hasModifications = editedItems.some((item, index) => 
                  item.quantity !== transferOrder.items[index].quantity
                )
                
                if (hasModifications) {
                  // Send edited items with modified quantities and notes
                  onAccept(transferOrderId, editedItems, transferNotes.trim() || undefined)
                } else {
                  // No modifications, send original with notes
                  onAccept(transferOrderId, undefined, transferNotes.trim() || undefined)
                }
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
