import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Filter, Download, MapPin, User } from 'lucide-react'
import { Warehouse } from '../types'

const WarehouseMaster: React.FC = () => {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    {
      id: '1',
      warehouseCode: 'WH-001',
      warehouseName: 'Main Warehouse',
      description: 'Primary storage facility',
      address: {
        street: '123 Industrial Ave',
        city: 'Industrial City',
        state: 'State',
        zipCode: '12345',
        country: 'Country'
      },
      capacity: 10000,
      currentCapacity: 7500,
      managerId: 'MGR-001',
      managerName: 'John Smith',
      isActive: true,
      storageTypes: ['Dry Storage', 'Cold Storage'],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin'
    },
    {
      id: '2',
      warehouseCode: 'WH-002',
      warehouseName: 'Secondary Warehouse',
      description: 'Secondary storage facility',
      address: {
        street: '456 Storage St',
        city: 'Storage City',
        state: 'State',
        zipCode: '67890',
        country: 'Country'
      },
      capacity: 5000,
      currentCapacity: 2000,
      managerId: 'MGR-002',
      managerName: 'Jane Doe',
      isActive: true,
      storageTypes: ['Dry Storage'],
      createdAt: new Date('2024-01-16').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  // Unused state variables removed

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.warehouseCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCapacityPercentage = (current: number, total: number) => {
    return (current / total) * 100
  }

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      setWarehouses(warehouses.filter(w => w.id !== id))
    }
  }

  // Unused component removed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Master</h1>
          <p className="text-gray-600">Manage warehouse locations and capacity</p>
        </div>
        <button
          onClick={() => navigate('/warehouse-master/add')}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
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
                placeholder="Search warehouses..."
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
            <button className="btn-secondary flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredWarehouses.map((warehouse) => {
          const capacityPercentage = getCapacityPercentage(warehouse.currentCapacity, warehouse.capacity)
          return (
            <div key={warehouse.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{warehouse.warehouseName}</h3>
                  <p className="text-sm text-gray-600">{warehouse.warehouseCode}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  warehouse.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {warehouse.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{warehouse.address.city}, {warehouse.address.state}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{warehouse.managerName}</span>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Capacity Usage</span>
                    <span>{capacityPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCapacityColor(capacityPercentage)}`}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {warehouse.currentCapacity.toLocaleString()} / {warehouse.capacity.toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Storage Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {warehouse.storageTypes.map((type, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => navigate(`/warehouse-master/edit/${warehouse.id}`)}
                  className="text-green-600 hover:text-green-900"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(warehouse.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default WarehouseMaster
