import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Warehouse } from '../types'

const EditWarehouse: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [formData, setFormData] = useState({
    warehouseCode: '',
    warehouseName: '',
    warehouseType: 'Main' as 'Main' | 'Sub' | 'Transit' | 'Cold Storage' | 'Hazardous',
    location: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    capacity: '',
    capacityUnit: 'SQM' as 'SQM' | 'CBM' | 'KG' | 'TON',
    status: 'Active' as 'Active' | 'Inactive' | 'Maintenance' | 'Closed',
    operatingHours: '',
    timezone: '',
    notes: '',
    specialRequirements: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const warehouseTypeOptions = ['Main', 'Sub', 'Transit', 'Cold Storage', 'Hazardous']
  const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Closed']
  const capacityUnitOptions = ['SQM', 'CBM', 'KG', 'TON']

  // Mock data - in real app, fetch from API
  const mockWarehouse: Warehouse = {
    id: '1',
    warehouseCode: 'WH-001',
    warehouseName: 'Main Warehouse',
    description: 'Primary warehouse for finished goods storage',
    address: {
      street: '123 Industrial Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    capacity: 5000,
    currentCapacity: 3000,
    managerId: 'MGR-001',
    managerName: 'John Smith',
    isActive: true,
    storageTypes: ['Dry Storage', 'Cold Storage'],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin'
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFormData({
        warehouseCode: mockWarehouse.warehouseCode,
        warehouseName: mockWarehouse.warehouseName,
        warehouseType: 'Main',
        location: 'Industrial Zone A',
        address: mockWarehouse.address.street,
        city: mockWarehouse.address.city,
        state: mockWarehouse.address.state,
        country: mockWarehouse.address.country,
        postalCode: mockWarehouse.address.zipCode,
        contactPerson: mockWarehouse.managerName,
        contactPhone: '+91 98765 43210',
        contactEmail: 'john@company.com',
        capacity: mockWarehouse.capacity.toString(),
        capacityUnit: 'SQM',
        status: mockWarehouse.isActive ? 'Active' : 'Inactive',
        operatingHours: '8:00 AM - 6:00 PM',
        timezone: 'IST (UTC+5:30)',
        notes: mockWarehouse.description,
        specialRequirements: 'Temperature controlled environment required'
      })
      setLoading(false)
    }, 500)
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.warehouseCode.trim()) {
      newErrors.warehouseCode = 'Warehouse code is required'
    }
    if (!formData.warehouseName.trim()) {
      newErrors.warehouseName = 'Warehouse name is required'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required'
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const updatedWarehouse: Warehouse = {
      ...mockWarehouse,
      warehouseCode: formData.warehouseCode,
      warehouseName: formData.warehouseName,
      description: formData.notes,
      address: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.postalCode,
        country: formData.country
      },
      capacity: parseFloat(formData.capacity) || 0,
      currentCapacity: parseFloat(formData.capacity) || 0,
      managerId: 'MGR-001',
      managerName: formData.contactPerson,
      isActive: formData.status === 'Active',
      storageTypes: ['Dry Storage', 'Cold Storage'],
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin'
    }

    console.log('Updating Warehouse:', updatedWarehouse)
    navigate('/warehouse-master')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warehouse data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Warehouse</h1>
          <p className="text-gray-600">Update warehouse information</p>
        </div>
        <button
          onClick={() => navigate('/warehouse-master')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Warehouses
        </button>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Code *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.warehouseCode ? 'border-red-500' : ''}`}
                  value={formData.warehouseCode}
                  onChange={(e) => handleInputChange('warehouseCode', e.target.value)}
                  placeholder="WH-001"
                />
                {errors.warehouseCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouseCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.warehouseName ? 'border-red-500' : ''}`}
                  value={formData.warehouseName}
                  onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                  placeholder="Main Warehouse"
                />
                {errors.warehouseName && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouseName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Type
                </label>
                <select
                  className="input-field"
                  value={formData.warehouseType}
                  onChange={(e) => handleInputChange('warehouseType', e.target.value)}
                >
                  {warehouseTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Industrial Zone A"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="input-field"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input-field flex-1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="1000"
                  />
                  <select
                    className="input-field w-24"
                    value={formData.capacityUnit}
                    onChange={(e) => handleInputChange('capacityUnit', e.target.value)}
                  >
                    {capacityUnitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                  rows={3}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Industrial Street, Manufacturing District"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Mumbai"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.state ? 'border-red-500' : ''}`}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Maharashtra"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.country ? 'border-red-500' : ''}`}
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="India"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.contactPerson ? 'border-red-500' : ''}`}
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="John Smith"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  className={`input-field ${errors.contactPhone ? 'border-red-500' : ''}`}
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.contactEmail ? 'border-red-500' : ''}`}
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="john@company.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.operatingHours}
                  onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                  placeholder="8:00 AM - 6:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  placeholder="IST (UTC+5:30)"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or comments about the warehouse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Special storage requirements, security measures, or operational notes"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/warehouse-master')}
              className="btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Update Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditWarehouse
