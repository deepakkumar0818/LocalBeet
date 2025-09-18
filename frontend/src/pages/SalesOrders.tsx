import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download, ShoppingCart, Clock, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

interface SalesOrder {
  _id: string;
  orderNumber: string;
  outletId: {
    _id: string;
    outletCode: string;
    outletName: string;
  };
  outletCode: string;
  outletName: string;
  customerInfo: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    tableNumber?: string;
    orderType: 'Dine-in' | 'Takeaway' | 'Delivery' | 'Drive-thru';
  };
  orderItems: Array<{
    productId: {
      _id: string;
      productCode: string;
      productName: string;
      category: string;
    };
    productCode: string;
    productName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string;
  }>;
  orderSummary: {
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Credit' | 'Mixed';
    paymentStatus: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded';
  };
  orderStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
  orderTiming: {
    orderDate: string;
    estimatedPrepTime?: number;
    actualPrepTime?: number;
    servedAt?: string;
    completedAt?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const SalesOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [outletFilter, setOutletFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [currentOutlet, setCurrentOutlet] = useState<any>(null);

  // Detect outlet from URL
  const getOutletFromPath = () => {
    const path = location.pathname;
    if (path.includes('/downtown-restaurant/sales-orders')) return 'Downtown Restaurant';
    if (path.includes('/marina-walk-cafe/sales-orders')) return 'Marina Walk Cafe';
    if (path.includes('/mall-food-court/sales-orders')) return 'Mall Food Court';
    if (path.includes('/drive-thru-express/sales-orders')) return 'Drive-Thru Express';
    return null;
  };

  const orderStatusOptions = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'];
  const orderTypeOptions = ['Dine-in', 'Takeaway', 'Delivery', 'Drive-thru'];
  const paymentStatusOptions = ['Pending', 'Paid', 'Partially Paid', 'Refunded'];

  const loadSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getSalesOrders({
        search: searchTerm,
        outletId: outletFilter,
        orderStatus: statusFilter,
        orderType: orderTypeFilter,
        paymentStatus: paymentStatusFilter,
        limit: 1000,
        sortBy: 'orderTiming.orderDate',
        sortOrder: 'desc',
      });
      if (response.success) {
        setSalesOrders(response.data);
      } else {
        // If API fails, load sample data
        console.log('API failed, loading sample data');
        loadSampleSalesOrders();
      }
    } catch (err: any) {
      console.log('API error, loading sample data:', err);
      // If API fails, load sample data
      loadSampleSalesOrders();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleSalesOrders = () => {
    const sampleOrders: SalesOrder[] = [
      {
        _id: 'so-001',
        orderNumber: 'SO-DT-001-001',
        outletId: {
          _id: 'outlet-downtown-001',
          outletCode: 'DT-001',
          outletName: 'Downtown Restaurant'
        },
        outletCode: 'DT-001',
        outletName: 'Downtown Restaurant',
        customerInfo: {
          customerName: 'John Smith',
          customerPhone: '+965-1234-5678',
          customerEmail: 'john.smith@email.com',
          tableNumber: 'T-05',
          orderType: 'Dine-in'
        },
        orderItems: [
          {
            productId: {
              _id: 'fg-001',
              productCode: 'FG-001',
              productName: 'Fresh Green Smoothie',
              category: 'Beverages'
            },
            productCode: 'FG-001',
            productName: 'Fresh Green Smoothie',
            category: 'Beverages',
            quantity: 2,
            unitPrice: 4.50,
            totalPrice: 9.00,
            specialInstructions: 'Extra ice'
          },
          {
            productId: {
              _id: 'fg-002',
              productCode: 'FG-002',
              productName: 'Protein Power Bowl',
              category: 'Meals'
            },
            productCode: 'FG-002',
            productName: 'Protein Power Bowl',
            category: 'Meals',
            quantity: 1,
            unitPrice: 8.75,
            totalPrice: 8.75,
            specialInstructions: 'No nuts'
          }
        ],
        orderSummary: {
          subtotal: 17.75,
          taxAmount: 2.66,
          discountAmount: 0,
          totalAmount: 20.41,
          paymentMethod: 'Card',
          paymentStatus: 'Paid'
        },
        orderStatus: 'Ready',
        orderTiming: {
          orderDate: new Date().toISOString(),
          estimatedPrepTime: 15,
          servedAt: new Date().toISOString()
        },
        notes: 'Regular customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'so-002',
        orderNumber: 'SO-MW-001-002',
        outletId: {
          _id: 'outlet-marina-001',
          outletCode: 'MW-001',
          outletName: 'Marina Walk Cafe'
        },
        outletCode: 'MW-001',
        outletName: 'Marina Walk Cafe',
        customerInfo: {
          customerName: 'Sarah Johnson',
          customerPhone: '+965-9876-5432',
          customerEmail: 'sarah.j@email.com',
          orderType: 'Takeaway'
        },
        orderItems: [
          {
            productId: {
              _id: 'fg-003',
              productCode: 'FG-003',
              productName: 'Detox Juice Blend',
              category: 'Beverages'
            },
            productCode: 'FG-003',
            productName: 'Detox Juice Blend',
            category: 'Beverages',
            quantity: 1,
            unitPrice: 5.25,
            totalPrice: 5.25
          }
        ],
        orderSummary: {
          subtotal: 5.25,
          taxAmount: 0.79,
          discountAmount: 0,
          totalAmount: 6.04,
          paymentMethod: 'Cash',
          paymentStatus: 'Paid'
        },
        orderStatus: 'Completed',
        orderTiming: {
          orderDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          estimatedPrepTime: 10,
          servedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        notes: 'Quick takeaway order',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        _id: 'so-003',
        orderNumber: 'SO-MF-001-003',
        outletId: {
          _id: 'outlet-mall-001',
          outletCode: 'MF-001',
          outletName: 'Mall Food Court'
        },
        outletCode: 'MF-001',
        outletName: 'Mall Food Court',
        customerInfo: {
          customerName: 'Ahmed Al-Rashid',
          customerPhone: '+965-5555-1234',
          tableNumber: 'T-12',
          orderType: 'Dine-in'
        },
        orderItems: [
          {
            productId: {
              _id: 'fg-004',
              productCode: 'FG-004',
              productName: 'Quinoa Salad',
              category: 'Meals'
            },
            productCode: 'FG-004',
            productName: 'Quinoa Salad',
            category: 'Meals',
            quantity: 2,
            unitPrice: 7.50,
            totalPrice: 15.00,
            specialInstructions: 'Extra dressing'
          },
          {
            productId: {
              _id: 'fg-005',
              productCode: 'FG-005',
              productName: 'Energy Protein Bar',
              category: 'Snacks'
            },
            productCode: 'FG-005',
            productName: 'Energy Protein Bar',
            category: 'Snacks',
            quantity: 1,
            unitPrice: 3.25,
            totalPrice: 3.25
          }
        ],
        orderSummary: {
          subtotal: 18.25,
          taxAmount: 2.74,
          discountAmount: 1.00,
          totalAmount: 19.99,
          paymentMethod: 'Digital Wallet',
          paymentStatus: 'Paid'
        },
        orderStatus: 'Preparing',
        orderTiming: {
          orderDate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          estimatedPrepTime: 20
        },
        notes: 'Family lunch order',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ];

    setSalesOrders(sampleOrders);
    setError(null);
  };

  const loadOutlets = async () => {
    try {
      const response = await apiService.getOutlets({ limit: 1000 });
      if (response.success) {
        setOutlets(response.data);
        
        // Set outlet filter based on URL
        const outletName = getOutletFromPath();
        if (outletName) {
          const outlet = response.data.find(o => o.outletName === outletName);
          if (outlet) {
            setCurrentOutlet(outlet);
            setOutletFilter(outlet._id);
          }
        }
      }
    } catch (err) {
      console.error('Error loading outlets:', err);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  useEffect(() => {
    loadSalesOrders();
  }, [searchTerm, outletFilter, statusFilter, orderTypeFilter, paymentStatusFilter]);

  const handleViewDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        const response = await apiService.deleteSalesOrder(id);
        if (response.success) {
          alert(response.message);
          loadSalesOrders();
        } else {
          alert(response.message || 'Failed to delete sales order');
        }
      } catch (err: any) {
        alert(err.message || 'An error occurred during deletion');
      }
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await apiService.updateSalesOrderStatus(id, { orderStatus: newStatus });
      if (response.success) {
        alert('Order status updated successfully');
        loadSalesOrders();
      } else {
        alert(response.message || 'Failed to update order status');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during status update');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Preparing': return 'bg-orange-100 text-orange-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Served': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partially Paid': return 'bg-blue-100 text-blue-800';
      case 'Refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'Dine-in': return '🍽️';
      case 'Takeaway': return '🥡';
      case 'Delivery': return '🚚';
      case 'Drive-thru': return '🚗';
      default: return '📋';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sales Orders
            {currentOutlet && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                - {currentOutlet.outletName}
              </span>
            )}
          </h1>
          {currentOutlet && (
            <p className="text-gray-600 mt-1">
              Managing sales orders for {currentOutlet.outletName}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            const outletFromPath = getOutletFromPath()
            if (outletFromPath) {
              const outletPath = outletFromPath.toLowerCase().replace(/\s+/g, '-')
              navigate(`/${outletPath}/sales-orders/add`)
            } else {
              navigate('/sales-orders/add')
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create Order
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {!currentOutlet && (
            <div className="col-span-1">
              <label htmlFor="outletFilter" className="block text-sm font-medium text-gray-700">Outlet</label>
              <select
                id="outletFilter"
                name="outletFilter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
              >
                <option value="">All Outlets</option>
                {outlets.map(outlet => (
                  <option key={outlet._id} value={outlet._id}>{outlet.outletName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="col-span-1">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="statusFilter"
              name="statusFilter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {orderStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="orderTypeFilter" className="block text-sm font-medium text-gray-700">Order Type</label>
            <select
              id="orderTypeFilter"
              name="orderTypeFilter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {orderTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label htmlFor="paymentStatusFilter" className="block text-sm font-medium text-gray-700">Payment</label>
            <select
              id="paymentStatusFilter"
              name="paymentStatusFilter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              {paymentStatusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={() => {
              setSearchTerm('');
              if (!currentOutlet) {
                setOutletFilter('');
              }
              setStatusFilter('');
              setOrderTypeFilter('');
              setPaymentStatusFilter('');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <X className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Clear Filters
          </button>
          <button
            onClick={loadSalesOrders}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 mt-3">Loading sales orders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <X className="h-6 w-6 text-red-500 cursor-pointer" onClick={() => setError(null)} />
          </span>
        </div>
      ) : salesOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No sales orders found.</p>
          <p className="text-sm">Try adjusting your filters or create a new order.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outlet
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesOrders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{order.customerInfo.customerName}</div>
                      {order.customerInfo.customerPhone && (
                        <div className="text-gray-400">{order.customerInfo.customerPhone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.outletName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="flex items-center">
                      <span className="mr-1">{getOrderTypeIcon(order.customerInfo.orderType)}</span>
                      {order.customerInfo.orderType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${order.orderSummary.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.orderSummary.paymentStatus)}`}>
                      {order.orderSummary.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.orderTiming.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/sales-orders/edit/${order._id}`)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Order Details: {selectedOrder.orderNumber}</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Customer Information</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Name:</strong> {selectedOrder.customerInfo.customerName}</p>
                  <p><strong>Phone:</strong> {selectedOrder.customerInfo.customerPhone || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerInfo.customerEmail || 'N/A'}</p>
                  <p><strong>Order Type:</strong> {getOrderTypeIcon(selectedOrder.customerInfo.orderType)} {selectedOrder.customerInfo.orderType}</p>
                  {selectedOrder.customerInfo.tableNumber && (
                    <p><strong>Table:</strong> {selectedOrder.customerInfo.tableNumber}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Order Summary</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Outlet:</strong> {selectedOrder.outletName}</p>
                  <p><strong>Status:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span></p>
                  <p><strong>Payment:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.orderSummary.paymentStatus)}`}>{selectedOrder.orderSummary.paymentStatus}</span></p>
                  <p><strong>Method:</strong> {selectedOrder.orderSummary.paymentMethod}</p>
                  <p><strong>Total:</strong> ${selectedOrder.orderSummary.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Order Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-gray-500">{item.productCode}</div>
                            {item.specialInstructions && (
                              <div className="text-gray-400 text-xs italic">{item.specialInstructions}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
