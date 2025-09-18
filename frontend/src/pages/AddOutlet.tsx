import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, X } from 'lucide-react'
import { apiService } from '../services/api'

const AddOutlet: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    outletCode: '',
    outletName: '',
    outletType: 'Restaurant' as 'Restaurant' | 'Cafe' | 'Food Court' | 'Drive-Thru' | 'Takeaway',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kuwait'
    },
    contactInfo: {
      phone: '',
      email: '',
      managerName: '',
      managerPhone: '',
      managerEmail: ''
    },
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '22:00', isOpen: true },
      saturday: { open: '09:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '22:00', isOpen: true }
    },
    capacity: {
      seatingCapacity: 0,
      kitchenCapacity: 0,
      storageCapacity: 0,
      capacityUnit: 'SQM' as 'SQM' | 'CBM' | 'KG' | 'TON'
    },
    status: 'Active' as 'Active' | 'Inactive' | 'Maintenance' | 'Closed',
    isCentralKitchen: false,
    features: [] as string[],
    timezone: 'Asia/Kuwait',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const outletTypeOptions = ['Restaurant', 'Cafe', 'Food Court', 'Drive-Thru', 'Takeaway']
  const statusOptions = ['Active', 'Inactive', 'Maintenance', 'Closed']
  const capacityUnitOptions = ['SQM', 'CBM', 'KG', 'TON']
  const featureOptions = ['Delivery', 'Takeaway', 'Dine-in', 'Drive-thru', 'Online Ordering', 'Catering']

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.outletCode.trim()) {
      newErrors.outletCode = 'Outlet code is required'
    }
    if (!formData.outletName.trim()) {
      newErrors.outletName = 'Outlet name is required'
    }
    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required'
    }
    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.contactInfo.email.trim()) {
      newErrors.email = 'Email is required'
    }
    if (!formData.contactInfo.managerName.trim()) {
      newErrors.managerName = 'Manager name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await apiService.createOutlet(formData)
      if (response.success) {
        alert('Outlet created successfully!')
        navigate('/outlets')
      } else {
        alert('Failed to create outlet')
      }
    } catch (error) {
      alert('Error creating outlet: ' + (error instanceof Error ? error.message : 'Unknown error'))
      console.error('Error creating outlet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/outlets')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Outlets
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Outlet</h1>
            <p className="text-gray-600">Create a new restaurant outlet or central kitchen</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Code *</label>
              <input
                type="text"
                className={`input-field ${errors.outletCode ? 'border-red-500' : ''}`}
                value={formData.outletCode}
                onChange={(e) => handleInputChange('outletCode', e.target.value.toUpperCase())}
                placeholder="OUTLET-001"
              />
              {errors.outletCode && <p className="text-red-500 text-sm mt-1">{errors.outletCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name *</label>
              <input
                type="text"
                className={`input-field ${errors.outletName ? 'border-red-500' : ''}`}
                value={formData.outletName}
                onChange={(e) => handleInputChange('outletName', e.target.value)}
                placeholder="Downtown Restaurant"
              />
              {errors.outletName && <p className="text-red-500 text-sm mt-1">{errors.outletName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Type</label>
              <select
                className="input-field"
                value={formData.outletType}
                onChange={(e) => handleInputChange('outletType', e.target.value)}
              >
                {outletTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the outlet..."
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCentralKitchen"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.isCentralKitchen}
                  onChange={(e) => handleInputChange('isCentralKitchen', e.target.checked)}
                />
                <label htmlFor="isCentralKitchen" className="ml-2 block text-sm text-gray-900">
                  This is a Central Kitchen
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                className={`input-field ${errors.street ? 'border-red-500' : ''}`}
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                placeholder="123 Main Street"
              />
              {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                placeholder="Kuwait City"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                className="input-field"
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                placeholder="Kuwait"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                className="input-field"
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                className="input-field"
                value={formData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                placeholder="Kuwait"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Phone *</label>
              <input
                type="tel"
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                value={formData.contactInfo.phone}
                onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                placeholder="+965 1234 5678"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Email *</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                value={formData.contactInfo.email}
                onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                placeholder="outlet@restaurant.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name *</label>
              <input
                type="text"
                className={`input-field ${errors.managerName ? 'border-red-500' : ''}`}
                value={formData.contactInfo.managerName}
                onChange={(e) => handleInputChange('contactInfo.managerName', e.target.value)}
                placeholder="John Smith"
              />
              {errors.managerName && <p className="text-red-500 text-sm mt-1">{errors.managerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
              <input
                type="tel"
                className="input-field"
                value={formData.contactInfo.managerPhone}
                onChange={(e) => handleInputChange('contactInfo.managerPhone', e.target.value)}
                placeholder="+965 9876 5432"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.contactInfo.managerEmail}
                onChange={(e) => handleInputChange('contactInfo.managerEmail', e.target.value)}
                placeholder="manager@restaurant.com"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
              <input
                type="number"
                className="input-field"
                value={formData.capacity.seatingCapacity}
                onChange={(e) => handleInputChange('capacity.seatingCapacity', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kitchen Capacity</label>
              <input
                type="number"
                className="input-field"
                value={formData.capacity.kitchenCapacity}
                onChange={(e) => handleInputChange('capacity.kitchenCapacity', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Capacity</label>
              <input
                type="number"
                className="input-field"
                value={formData.capacity.storageCapacity}
                onChange={(e) => handleInputChange('capacity.storageCapacity', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Unit</label>
              <select
                className="input-field"
                value={formData.capacity.capacityUnit}
                onChange={(e) => handleInputChange('capacity.capacityUnit', e.target.value)}
              >
                {capacityUnitOptions.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
              <div className="flex flex-wrap gap-2">
                {featureOptions.map(feature => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                    />
                    <span className="ml-2 text-sm text-gray-900">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input
                type="text"
                className="input-field"
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                placeholder="Asia/Kuwait"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the outlet..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/outlets')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Outlet
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddOutlet
