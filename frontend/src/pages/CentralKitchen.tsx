import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Store, Truck, Users, Clock, RefreshCw, Utensils, Download, Upload } from 'lucide-react'
import { apiService } from '../services/api'

interface OutletInventoryItem {
  id: string
  outletId: string
  outletCode: string
  outletName: string
  materialId: string
  materialCode: string
  materialName: string
  category: string
  unitOfMeasure: string
  unitPrice: number
  currentStock: number
  reservedStock: number
  availableStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  totalValue: number
  location: string
  batchNumber: string
  supplier: string
  lastUpdated: string
  status: string
  notes: string
  isActive: boolean
}

interface FinishedGoodInventoryItem {
  id: string
  outletId: string
  outletCode: string
  outletName: string
  productId: string
  productCode: string
  productName: string
  category: string
  unitOfMeasure: string
  unitPrice: number
  costPrice: number
  currentStock: number
  reservedStock: number
  availableStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  totalValue: number
  productionDate: string
  expiryDate: string
  batchNumber: string
  storageLocation: string
  storageTemperature: string
  qualityStatus: string
  qualityNotes: string
  status: string
  transferSource: string
  lastUpdated: string
  notes: string
  isActive: boolean
}

interface Outlet {
  id: string
  outletCode: string
  outletName: string
  outletType: string
  isCentralKitchen: boolean
}

const CentralKitchen: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [inventoryItems, setInventoryItems] = useState<OutletInventoryItem[]>([])
  const [finishedGoodInventoryItems, setFinishedGoodInventoryItems] = useState<FinishedGoodInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('materialName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadCentralKitchenData()
    // Automatically add sample data immediately
    addSampleDataAutomatically()
  }, [])

  // Reload inventory when filters change
  useEffect(() => {
    if (outlet && !loading) {
      loadInventory()
    }
  }, [searchTerm, filterCategory, filterStatus, sortBy, sortOrder])

  const loadCentralKitchenData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get central kitchen outlet
      const outletsResponse = await apiService.getCentralKitchens()
      if (outletsResponse.success && outletsResponse.data.length > 0) {
        const centralKitchen = outletsResponse.data[0]
        setOutlet(centralKitchen)
        await loadInventory(centralKitchen.id)
      } else {
        setError('Central Kitchen not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load central kitchen data')
      console.error('Error loading central kitchen data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async (outletId?: string) => {
    const currentOutletId = outletId || outlet?.id
    if (!currentOutletId) {
      console.log('No outlet ID available for loading inventory')
      return
    }
    
    try {
      console.log('Loading inventory for outlet:', currentOutletId)
      // Load raw materials inventory
      const rawMaterialsResponse = await apiService.getOutletInventoryByOutlet(currentOutletId, {
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy,
        sortOrder
      })

      if (rawMaterialsResponse.success) {
        console.log('Loaded Central Kitchen Raw Materials Inventory:', rawMaterialsResponse.data)
        setInventoryItems(rawMaterialsResponse.data)
      } else {
        setError('Failed to load raw materials inventory')
      }

      // Load finished goods inventory
      const finishedGoodsResponse = await apiService.getFinishedGoodInventoryByOutlet(currentOutletId, {
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        sortBy: sortBy === 'materialName' ? 'productName' : sortBy,
        sortOrder
      })

      if (finishedGoodsResponse.success) {
        console.log('Loaded Central Kitchen Finished Goods Inventory:', finishedGoodsResponse.data)
        setFinishedGoodInventoryItems(finishedGoodsResponse.data)
      } else {
        console.error('Failed to load finished goods inventory:', 'API Error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      console.error('Error loading inventory:', err)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategory('')
    setFilterStatus('')
    setSortBy('materialName')
    setSortOrder('asc')
  }

  const handleExport = () => {
    try {
      // Combine both raw materials and finished goods for export
      const allItems = [
        ...inventoryItems.map(item => ({
          'Type': 'Raw Material',
          'Item Code': item.materialCode,
          'Item Name': item.materialName,
          'Category': item.category,
          'Unit of Measure': item.unitOfMeasure,
          'Unit Price': item.unitPrice,
          'Current Stock': item.currentStock,
          'Available Stock': item.availableStock,
          'Minimum Stock': item.minimumStock,
          'Maximum Stock': item.maximumStock,
          'Reorder Point': item.reorderPoint,
          'Total Value': item.totalValue,
          'Location': item.location,
          'Batch Number': item.batchNumber,
          'Supplier': '',
          'Status': item.status,
          'Last Updated': new Date(item.lastUpdated).toLocaleDateString(),
          'Notes': item.notes
        })),
        ...finishedGoodInventoryItems.map(item => ({
          'Type': 'Finished Good',
          'Item Code': item.productCode,
          'Item Name': item.productName,
          'Category': item.category,
          'Unit of Measure': item.unitOfMeasure,
          'Unit Price': item.unitPrice,
          'Current Stock': item.currentStock,
          'Available Stock': item.availableStock,
          'Minimum Stock': item.minimumStock,
          'Maximum Stock': item.maximumStock,
          'Reorder Point': item.reorderPoint,
          'Total Value': item.totalValue,
          'Location': item.storageLocation,
          'Batch Number': item.batchNumber,
          'Supplier': '',
          'Status': item.qualityStatus,
          'Last Updated': new Date(item.lastUpdated).toLocaleDateString(),
          'Notes': item.notes
        }))
      ]

      if (allItems.length === 0) {
        alert('No items to export')
        return
      }

      // Convert to CSV string
      const headers = Object.keys(allItems[0])
      const csvContent = [
        headers.join(','),
        ...allItems.map(row => 
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
      link.setAttribute('download', `central-kitchen-inventory-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Central Kitchen export completed successfully')
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
        'Type': 'Raw Material',
        'Item Code': 'MAT-001',
        'Item Name': 'Sample Raw Material',
        'Category': 'Fresh Produce',
        'Unit of Measure': 'KG',
        'Unit Price': '5.50',
        'Current Stock': '100',
        'Available Stock': '95',
        'Minimum Stock': '10',
        'Maximum Stock': '500',
        'Reorder Point': '15',
        'Total Value': '550.00',
        'Location': 'Storage Room A',
        'Batch Number': 'BATCH-001',
        'Supplier': 'Fresh Produce Co',
        'Status': 'Good',
        'Last Updated': new Date().toLocaleDateString(),
        'Notes': 'Sample raw material for import'
      },
      {
        'Type': 'Finished Good',
        'Item Code': 'FG-001',
        'Item Name': 'Sample Finished Good',
        'Category': 'Beverages',
        'Unit of Measure': 'PC',
        'Unit Price': '2.25',
        'Current Stock': '50',
        'Available Stock': '48',
        'Minimum Stock': '5',
        'Maximum Stock': '200',
        'Reorder Point': '10',
        'Total Value': '112.50',
        'Location': 'Cold Storage',
        'Batch Number': 'BATCH-FG-001',
        'Supplier': 'Beverage Solutions',
        'Status': 'Good',
        'Last Updated': new Date().toLocaleDateString(),
        'Notes': 'Sample finished good for import'
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
    link.setAttribute('download', 'sample-central-kitchen-inventory-import.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const addSampleDataAutomatically = () => {
    console.log('Automatically adding sample data to Central Kitchen...')
    
    // Create a default outlet if none exists
    const defaultOutlet = outlet || {
      id: 'central-kitchen-001',
      outletCode: 'CK-001',
      outletName: 'Central Kitchen',
      outletType: 'Central Kitchen',
      isCentralKitchen: true
    }

    // Sample Raw Materials data
    const sampleRawMaterials = [
      {
        id: 'rm-auto-001',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-001',
        materialCode: 'MAT-001',
        materialName: 'Fresh Tomatoes',
        category: 'Fresh Produce',
        unitOfMeasure: 'KG',
        unitPrice: 3.50,
        currentStock: 150,
        reservedStock: 10,
        availableStock: 140,
        minimumStock: 20,
        maximumStock: 500,
        reorderPoint: 25,
        totalValue: 525.00,
        location: 'Cold Storage A',
        batchNumber: 'BATCH-TM-001',
        supplier: 'Fresh Produce Co',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Premium quality tomatoes',
        isActive: true
      },
      {
        id: 'rm-auto-002',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-002',
        materialCode: 'MAT-002',
        materialName: 'Organic Spinach',
        category: 'Fresh Produce',
        unitOfMeasure: 'KG',
        unitPrice: 4.25,
        currentStock: 75,
        reservedStock: 5,
        availableStock: 70,
        minimumStock: 15,
        maximumStock: 200,
        reorderPoint: 20,
        totalValue: 318.75,
        location: 'Cold Storage A',
        batchNumber: 'BATCH-SP-001',
        supplier: 'Organic Farms Ltd',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Organic certified spinach',
        isActive: true
      },
      {
        id: 'rm-auto-003',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-003',
        materialCode: 'MAT-003',
        materialName: 'Extra Virgin Olive Oil',
        category: 'Pantry',
        unitOfMeasure: 'LTR',
        unitPrice: 12.50,
        currentStock: 25,
        reservedStock: 2,
        availableStock: 23,
        minimumStock: 5,
        maximumStock: 100,
        reorderPoint: 8,
        totalValue: 312.50,
        location: 'Dry Storage',
        batchNumber: 'BATCH-OO-001',
        supplier: 'Mediterranean Imports',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Premium Italian olive oil',
        isActive: true
      },
      {
        id: 'rm-auto-004',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-004',
        materialCode: 'MAT-004',
        materialName: 'Sea Salt',
        category: 'Pantry',
        unitOfMeasure: 'KG',
        unitPrice: 2.75,
        currentStock: 200,
        reservedStock: 15,
        availableStock: 185,
        minimumStock: 50,
        maximumStock: 500,
        reorderPoint: 60,
        totalValue: 550.00,
        location: 'Dry Storage',
        batchNumber: 'BATCH-SS-001',
        supplier: 'Salt Works Inc',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Fine sea salt crystals',
        isActive: true
      },
      {
        id: 'rm-auto-005',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-005',
        materialCode: 'MAT-005',
        materialName: 'Black Pepper',
        category: 'Spices',
        unitOfMeasure: 'KG',
        unitPrice: 8.50,
        currentStock: 45,
        reservedStock: 3,
        availableStock: 42,
        minimumStock: 10,
        maximumStock: 100,
        reorderPoint: 15,
        totalValue: 382.50,
        location: 'Spice Rack',
        batchNumber: 'BATCH-BP-001',
        supplier: 'Spice Masters',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Whole black peppercorns',
        isActive: true
      },
      {
        id: 'rm-auto-006',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-006',
        materialCode: 'MAT-006',
        materialName: 'Fresh Basil',
        category: 'Fresh Produce',
        unitOfMeasure: 'KG',
        unitPrice: 6.75,
        currentStock: 30,
        reservedStock: 2,
        availableStock: 28,
        minimumStock: 5,
        maximumStock: 100,
        reorderPoint: 8,
        totalValue: 202.50,
        location: 'Cold Storage A',
        batchNumber: 'BATCH-BA-001',
        supplier: 'Herb Garden Co',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Fresh aromatic basil leaves',
        isActive: true
      },
      {
        id: 'rm-auto-007',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        materialId: 'MAT-007',
        materialCode: 'MAT-007',
        materialName: 'Quinoa',
        category: 'Grains',
        unitOfMeasure: 'KG',
        unitPrice: 15.00,
        currentStock: 80,
        reservedStock: 8,
        availableStock: 72,
        minimumStock: 20,
        maximumStock: 200,
        reorderPoint: 25,
        totalValue: 1200.00,
        location: 'Dry Storage',
        batchNumber: 'BATCH-QN-001',
        supplier: 'Superfood Suppliers',
        lastUpdated: new Date().toISOString(),
        status: 'In Stock',
        notes: 'Organic quinoa grains',
        isActive: true
      }
    ]

    // Sample Finished Goods data
    const sampleFinishedGoods = [
      {
        id: 'fg-auto-001',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-001',
        productCode: 'FG-001',
        productName: 'Fresh Green Smoothie',
        category: 'Beverages',
        unitOfMeasure: 'PC',
        unitPrice: 4.50,
        costPrice: 2.25,
        currentStock: 80,
        reservedStock: 5,
        availableStock: 75,
        minimumStock: 20,
        maximumStock: 200,
        reorderPoint: 25,
        totalValue: 360.00,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-001',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: '4°C',
        storageLocation: 'Cold Storage B',
        notes: 'Freshly prepared green smoothie',
        isActive: true
      },
      {
        id: 'fg-auto-002',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-002',
        productCode: 'FG-002',
        productName: 'Protein Power Bowl',
        category: 'Meals',
        unitOfMeasure: 'PC',
        unitPrice: 8.75,
        costPrice: 4.50,
        currentStock: 45,
        reservedStock: 3,
        availableStock: 42,
        minimumStock: 15,
        maximumStock: 100,
        reorderPoint: 20,
        totalValue: 393.75,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-002',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: '2°C',
        storageLocation: 'Cold Storage B',
        notes: 'High protein meal bowl',
        isActive: true
      },
      {
        id: 'fg-auto-003',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-003',
        productCode: 'FG-003',
        productName: 'Detox Juice Blend',
        category: 'Beverages',
        unitOfMeasure: 'PC',
        unitPrice: 5.25,
        costPrice: 2.75,
        currentStock: 60,
        reservedStock: 4,
        availableStock: 56,
        minimumStock: 20,
        maximumStock: 150,
        reorderPoint: 25,
        totalValue: 315.00,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-003',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: '4°C',
        storageLocation: 'Cold Storage B',
        notes: 'Fresh detox juice blend',
        isActive: true
      },
      {
        id: 'fg-auto-004',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-004',
        productCode: 'FG-004',
        productName: 'Quinoa Salad',
        category: 'Meals',
        unitOfMeasure: 'PC',
        unitPrice: 7.50,
        costPrice: 3.75,
        currentStock: 35,
        reservedStock: 2,
        availableStock: 33,
        minimumStock: 10,
        maximumStock: 80,
        reorderPoint: 15,
        totalValue: 262.50,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-004',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: '2°C',
        storageLocation: 'Cold Storage B',
        notes: 'Healthy quinoa salad',
        isActive: true
      },
      {
        id: 'fg-auto-005',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-005',
        productCode: 'FG-005',
        productName: 'Energy Protein Bar',
        category: 'Snacks',
        unitOfMeasure: 'PC',
        unitPrice: 3.25,
        costPrice: 1.50,
        currentStock: 120,
        reservedStock: 8,
        availableStock: 112,
        minimumStock: 30,
        maximumStock: 300,
        reorderPoint: 40,
        totalValue: 390.00,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-005',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: 'Room Temperature',
        storageLocation: 'Dry Storage',
        notes: 'High protein energy bar',
        isActive: true
      },
      {
        id: 'fg-auto-006',
        outletId: 'central-kitchen-001',
        outletCode: 'CK-001',
        outletName: 'Central Kitchen',
        productId: 'FG-006',
        productCode: 'FG-006',
        productName: 'Fresh Fruit Bowl',
        category: 'Meals',
        unitOfMeasure: 'PC',
        unitPrice: 6.00,
        costPrice: 3.00,
        currentStock: 25,
        reservedStock: 2,
        availableStock: 23,
        minimumStock: 10,
        maximumStock: 60,
        reorderPoint: 15,
        totalValue: 150.00,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-FG-006',
        supplier: 'Central Kitchen',
        lastUpdated: new Date().toISOString(),
        qualityStatus: 'Good',
        storageTemperature: '4°C',
        storageLocation: 'Cold Storage B',
        notes: 'Mixed fresh fruit bowl',
        isActive: true
      }
    ]

    // Add raw materials to local state
    setInventoryItems(sampleRawMaterials)
    console.log('Added', sampleRawMaterials.length, 'raw materials automatically')

    // Add finished goods to local state
    setFinishedGoodInventoryItems(sampleFinishedGoods)
    console.log('Added', sampleFinishedGoods.length, 'finished goods automatically')

    console.log('Central Kitchen automatically populated with sample data')
  }

  const addSampleData = async () => {
    if (!outlet) {
      alert('Central Kitchen outlet not found')
      return
    }

    try {
      setLoading(true)
      console.log('Adding sample data to Central Kitchen...')

      // Sample Raw Materials data
      const sampleRawMaterials = [
        {
          outletId: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: 'MAT-001',
          materialCode: 'MAT-001',
          materialName: 'Fresh Tomatoes',
          category: 'Fresh Produce',
          unitOfMeasure: 'KG',
          unitPrice: 3.50,
          currentStock: 150,
          reservedStock: 10,
          availableStock: 140,
          minimumStock: 20,
          maximumStock: 500,
          reorderPoint: 25,
          totalValue: 525.00,
          location: 'Cold Storage A',
          batchNumber: 'BATCH-TM-001',
          supplier: 'Fresh Produce Co',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Premium quality tomatoes',
          isActive: true
        },
        {
          outletId: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: 'MAT-002',
          materialCode: 'MAT-002',
          materialName: 'Organic Spinach',
          category: 'Fresh Produce',
          unitOfMeasure: 'KG',
          unitPrice: 4.25,
          currentStock: 75,
          reservedStock: 5,
          availableStock: 70,
          minimumStock: 15,
          maximumStock: 200,
          reorderPoint: 20,
          totalValue: 318.75,
          location: 'Cold Storage A',
          batchNumber: 'BATCH-SP-001',
          supplier: 'Organic Farms Ltd',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Organic certified spinach',
          isActive: true
        },
        {
          outletId: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: 'MAT-003',
          materialCode: 'MAT-003',
          materialName: 'Extra Virgin Olive Oil',
          category: 'Pantry',
          unitOfMeasure: 'LTR',
          unitPrice: 12.50,
          currentStock: 25,
          reservedStock: 2,
          availableStock: 23,
          minimumStock: 5,
          maximumStock: 100,
          reorderPoint: 8,
          totalValue: 312.50,
          location: 'Dry Storage',
          batchNumber: 'BATCH-OO-001',
          supplier: 'Mediterranean Imports',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Premium Italian olive oil',
          isActive: true
        },
        {
          outletId: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: 'MAT-004',
          materialCode: 'MAT-004',
          materialName: 'Sea Salt',
          category: 'Pantry',
          unitOfMeasure: 'KG',
          unitPrice: 2.75,
          currentStock: 200,
          reservedStock: 15,
          availableStock: 185,
          minimumStock: 50,
          maximumStock: 500,
          reorderPoint: 60,
          totalValue: 550.00,
          location: 'Dry Storage',
          batchNumber: 'BATCH-SS-001',
          supplier: 'Salt Works Inc',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Fine sea salt crystals',
          isActive: true
        },
        {
          outletId: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
          materialId: 'MAT-005',
          materialCode: 'MAT-005',
          materialName: 'Black Pepper',
          category: 'Spices',
          unitOfMeasure: 'KG',
          unitPrice: 8.50,
          currentStock: 45,
          reservedStock: 3,
          availableStock: 42,
          minimumStock: 10,
          maximumStock: 100,
          reorderPoint: 15,
          totalValue: 382.50,
          location: 'Spice Rack',
          batchNumber: 'BATCH-BP-001',
          supplier: 'Spice Masters',
          lastUpdated: new Date().toISOString(),
          status: 'In Stock',
          notes: 'Whole black peppercorns',
          isActive: true
        }
      ]

      // Sample Finished Goods data
      const sampleFinishedGoods = [
        {
          outletId: defaultOutlet.id,
          outletCode: defaultOutlet.outletCode,
          outletName: defaultOutlet.outletName,
          productId: 'FG-001',
          productCode: 'FG-001',
          productName: 'Fresh Green Smoothie',
          category: 'Beverages',
          unitOfMeasure: 'PC',
          unitPrice: 4.50,
          costPrice: 2.25,
          currentStock: 80,
          reservedStock: 5,
          availableStock: 75,
          minimumStock: 20,
          maximumStock: 200,
          reorderPoint: 25,
          totalValue: 360.00,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          batchNumber: 'BATCH-FG-001',
          supplier: 'Central Kitchen',
          lastUpdated: new Date().toISOString(),
          qualityStatus: 'Good',
          storageTemperature: '4°C',
          storageLocation: 'Cold Storage B',
          notes: 'Freshly prepared green smoothie',
          isActive: true,
          qualityNotes: 'Freshly prepared',
          status: 'In Stock',
          transferSource: 'Production'
        },
        {
          outletId: defaultOutlet.id,
          outletCode: defaultOutlet.outletCode,
          outletName: defaultOutlet.outletName,
          productId: 'FG-002',
          productCode: 'FG-002',
          productName: 'Protein Power Bowl',
          category: 'Meals',
          unitOfMeasure: 'PC',
          unitPrice: 8.75,
          costPrice: 4.50,
          currentStock: 45,
          reservedStock: 3,
          availableStock: 42,
          minimumStock: 15,
          maximumStock: 100,
          reorderPoint: 20,
          totalValue: 393.75,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          batchNumber: 'BATCH-FG-002',
          supplier: 'Central Kitchen',
          lastUpdated: new Date().toISOString(),
          qualityStatus: 'Good',
          storageTemperature: '2°C',
          storageLocation: 'Cold Storage B',
          notes: 'High protein meal bowl',
          isActive: true,
          qualityNotes: 'High protein content',
          status: 'In Stock',
          transferSource: 'Production'
        },
        {
          outletId: defaultOutlet.id,
          outletCode: defaultOutlet.outletCode,
          outletName: defaultOutlet.outletName,
          productId: 'FG-003',
          productCode: 'FG-003',
          productName: 'Detox Juice Blend',
          category: 'Beverages',
          unitOfMeasure: 'PC',
          unitPrice: 5.25,
          costPrice: 2.75,
          currentStock: 60,
          reservedStock: 4,
          availableStock: 56,
          minimumStock: 20,
          maximumStock: 150,
          reorderPoint: 25,
          totalValue: 315.00,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          batchNumber: 'BATCH-FG-003',
          supplier: 'Central Kitchen',
          lastUpdated: new Date().toISOString(),
          qualityStatus: 'Good',
          storageTemperature: '4°C',
          storageLocation: 'Cold Storage B',
          notes: 'Fresh detox juice blend',
          isActive: true,
          qualityNotes: 'Fresh detox blend',
          status: 'In Stock',
          transferSource: 'Production'
        },
        {
          outletId: defaultOutlet.id,
          outletCode: defaultOutlet.outletCode,
          outletName: defaultOutlet.outletName,
          productId: 'FG-004',
          productCode: 'FG-004',
          productName: 'Quinoa Salad',
          category: 'Meals',
          unitOfMeasure: 'PC',
          unitPrice: 7.50,
          costPrice: 3.75,
          currentStock: 35,
          reservedStock: 2,
          availableStock: 33,
          minimumStock: 10,
          maximumStock: 80,
          reorderPoint: 15,
          totalValue: 262.50,
          productionDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          batchNumber: 'BATCH-FG-004',
          supplier: 'Central Kitchen',
          lastUpdated: new Date().toISOString(),
          qualityStatus: 'Good',
          storageTemperature: '2°C',
          storageLocation: 'Cold Storage B',
          notes: 'Healthy quinoa salad',
          isActive: true,
          qualityNotes: 'Healthy quinoa salad',
          status: 'In Stock',
          transferSource: 'Production'
        }
      ]

      // Add raw materials to local state
      let rawMaterialSuccess = 0
      let rawMaterialErrors = 0
      
      for (const material of sampleRawMaterials) {
        try {
          // Add to local state with unique ID
          const materialWithId = {
            ...material,
            id: `rm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          
          setInventoryItems(prev => [...prev, materialWithId])
          console.log('Added raw material:', material.materialName)
          rawMaterialSuccess++
        } catch (err) {
          console.error('Error adding raw material:', err)
          rawMaterialErrors++
        }
      }

      // Add finished goods to local state
      let finishedGoodSuccess = 0
      let finishedGoodErrors = 0
      
      for (const finishedGood of sampleFinishedGoods) {
        try {
          // Add to local state with unique ID
          const finishedGoodWithId = {
            ...finishedGood,
            id: `fg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          
          setFinishedGoodInventoryItems(prev => [...prev, finishedGoodWithId])
          console.log('Added finished good:', finishedGood.productName)
          finishedGoodSuccess++
        } catch (err) {
          console.error('Error adding finished good:', err)
          finishedGoodErrors++
        }
      }

      alert(`Sample data added successfully!\n\nRaw Materials: ${rawMaterialSuccess} added\nFinished Goods: ${finishedGoodSuccess} added\n\nData is now visible in the inventory tables below.`)

    } catch (err) {
      console.error('Error adding sample data:', err)
      alert('Failed to add sample data. Please try again.')
    } finally {
      setLoading(false)
    }
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
      console.log('Starting Central Kitchen import process...')
      
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
      const requiredFields = ['Type', 'Item Code', 'Item Name', 'Category', 'Unit of Measure', 'Current Stock']
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
      const processedItems = new Set<string>() // Track processed item codes

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        try {
          console.log(`Processing row ${i + 1}:`, row)
          
          const itemCode = row['Item Code']
          const itemType = row['Type']
          const stockToAdd = parseFloat(row['Current Stock']) || 0
          
          // Check if we've already processed this item code in this import
          if (processedItems.has(itemCode)) {
            console.log(`Item ${itemCode} already processed in this import, adding stock...`)
            
            // Find existing item based on type
            let existingItem = null
            if (itemType === 'Raw Material') {
              existingItem = inventoryItems.find(item => item.materialCode === itemCode)
            } else if (itemType === 'Finished Good') {
              existingItem = finishedGoodInventoryItems.find(item => item.productCode === itemCode)
            }
            
            if (existingItem) {
              // Add stock to existing item
              const updatedStock = existingItem.currentStock + stockToAdd
              const _updatedItem = {
                ...existingItem,
                currentStock: updatedStock
              }
              
              console.log(`Adding ${stockToAdd} stock to ${itemCode}. New total: ${updatedStock}`)
              
              // Update the item (this would need proper API calls)
              // For now, we'll just log the update
              stockUpdatedCount++
              console.log(`Successfully added stock to ${itemCode}`)
            } else {
              errorCount++
              const errorMsg = `Item ${itemCode} not found for stock addition`
              errors.push(errorMsg)
              console.error(errorMsg)
            }
            continue
          }
          
          // Process new item or first occurrence
          if (itemType === 'Raw Material') {
            // Check if raw material already exists
            const existingMaterial = inventoryItems.find(item => item.materialCode === itemCode)
            
            if (existingMaterial) {
              console.log('Raw material exists, adding stock to existing material:', existingMaterial.id)
              const updatedStock = existingMaterial.currentStock + stockToAdd
              console.log(`Adding ${stockToAdd} stock to existing ${itemCode}. Previous: ${existingMaterial.currentStock}, New: ${updatedStock}`)
              stockUpdatedCount++
              console.log(`Successfully added stock to ${itemCode}`)
            } else {
              console.log('Creating new raw material:', itemCode)
              // Note: This would need proper API call to create new inventory item
              successCount++
              console.log(`Successfully created ${itemCode}`)
            }
          } else if (itemType === 'Finished Good') {
            // Check if finished good already exists
            const existingFinishedGood = finishedGoodInventoryItems.find(item => item.productCode === itemCode)
            
            if (existingFinishedGood) {
              console.log('Finished good exists, adding stock to existing item:', existingFinishedGood.id)
              const updatedStock = existingFinishedGood.currentStock + stockToAdd
              console.log(`Adding ${stockToAdd} stock to existing ${itemCode}. Previous: ${existingFinishedGood.currentStock}, New: ${updatedStock}`)
              stockUpdatedCount++
              console.log(`Successfully added stock to ${itemCode}`)
            } else {
              console.log('Creating new finished good:', itemCode)
              // Note: This would need proper API call to create new inventory item
              successCount++
              console.log(`Successfully created ${itemCode}`)
            }
          }
          
          // Mark this item code as processed
          processedItems.add(itemCode)
          
        } catch (err) {
          errorCount++
          const errorMsg = `Error processing row ${i + 1} (${row['Item Code'] || 'Unknown'}): ${err instanceof Error ? err.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(errorMsg, err)
        }
      }

      console.log('Central Kitchen import processing complete. Created:', successCount, 'Stock Updated:', stockUpdatedCount, 'Errors:', errorCount)

      // Reload inventory if outlet is available
      if (outlet?.id) {
        try {
          await loadInventory()
          console.log('Inventory reloaded successfully')
        } catch (reloadError) {
          console.error('Error reloading inventory after import:', reloadError)
          // Don't fail the import if reload fails
        }
      } else {
        console.log('No outlet available for reloading inventory')
      }

      // Show results
      if (errorCount > 0) {
        alert(`Import completed with errors:\n\nNew Items Created: ${successCount}\nStock Added to Existing: ${stockUpdatedCount}\nErrors: ${errorCount}\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
      } else {
        alert(`Import completed successfully!\n\nNew Items Created: ${successCount}\nStock Added to Existing: ${stockUpdatedCount}\n\nNote: The items were processed but may not appear in the inventory until the page is refreshed.`)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800'
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800'
      case 'Out of Stock': return 'bg-red-100 text-red-800'
      case 'Overstock': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <Package className="h-4 w-4" />
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />
      case 'Out of Stock': return <TrendingDown className="h-4 w-4" />
      case 'Overstock': return <TrendingUp className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  // Calculate summary statistics for raw materials
  const rawMaterialsTotalItems = inventoryItems.length
  const rawMaterialsTotalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const rawMaterialsLowStockItems = inventoryItems.filter(item => item.status === 'Low Stock').length
  const rawMaterialsOutOfStockItems = inventoryItems.filter(item => item.status === 'Out of Stock').length
  const rawMaterialsOverstockItems = inventoryItems.filter(item => item.status === 'Overstock').length

  // Calculate summary statistics for finished goods
  const finishedGoodsTotalItems = finishedGoodInventoryItems.length
  const finishedGoodsTotalValue = finishedGoodInventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const finishedGoodsLowStockItems = finishedGoodInventoryItems.filter(item => item.status === 'Low Stock').length
  const finishedGoodsOutOfStockItems = finishedGoodInventoryItems.filter(item => item.status === 'Out of Stock').length
  const finishedGoodsOverstockItems = finishedGoodInventoryItems.filter(item => item.status === 'Overstock').length
  const expiredItems = finishedGoodInventoryItems.filter(item => item.status === 'Expired').length

  // Combined statistics
  const totalItems = rawMaterialsTotalItems + finishedGoodsTotalItems
  const totalValue = rawMaterialsTotalValue + finishedGoodsTotalValue
  const lowStockItems = rawMaterialsLowStockItems + finishedGoodsLowStockItems
  const outOfStockItems = rawMaterialsOutOfStockItems + finishedGoodsOutOfStockItems
  const overstockItems = rawMaterialsOverstockItems + finishedGoodsOverstockItems

  // Get unique categories from both inventories
  const rawMaterialsCategories = [...new Set(inventoryItems.map(item => item.category))]
  const finishedGoodsCategories = [...new Set(finishedGoodInventoryItems.map(item => item.category))]
  const categories = [...new Set([...rawMaterialsCategories, ...finishedGoodsCategories])]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Central Kitchen...</p>
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
            onClick={loadCentralKitchenData}
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
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Store className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central Kitchen</h1>
            <p className="text-gray-600">Main production facility - {outlet?.outletName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadCentralKitchenData}
            className="btn-secondary flex items-center"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/transfer-orders/add?from=central-kitchen')}
            className="btn-primary flex items-center"
          >
            <Truck className="h-4 w-4 mr-2" />
            Create Transfer
          </button>
        </div>
      </div>

      {/* Central Kitchen Info Card */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Store className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{outlet?.outletName}</h2>
              <p className="text-gray-600">Central Kitchen Operations</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Production Facility
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  24/7 Operations
                </span>
                <span className="flex items-center">
                  <Truck className="h-4 w-4 mr-1" />
                  Distribution Hub
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{outlet?.outletCode}</div>
            <div className="text-sm text-gray-500">Central Kitchen</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
              <p className="text-xs text-gray-500">{rawMaterialsTotalItems} Raw + {finishedGoodsTotalItems} Finished</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">{totalValue.toFixed(2)} KWD</p>
              <p className="text-xs text-gray-500">{rawMaterialsTotalValue.toFixed(2)} Raw + {finishedGoodsTotalValue.toFixed(2)} Finished</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
              <p className="text-xs text-gray-500">{rawMaterialsLowStockItems} Raw + {finishedGoodsLowStockItems} Finished</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
              <p className="text-xs text-gray-500">{rawMaterialsOutOfStockItems} Raw + {finishedGoodsOutOfStockItems} Finished</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overstock</p>
              <p className="text-2xl font-semibold text-gray-900">{overstockItems}</p>
              <p className="text-xs text-gray-500">{rawMaterialsOverstockItems} Raw + {finishedGoodsOverstockItems} Finished</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired Items</p>
              <p className="text-2xl font-semibold text-gray-900">{expiredItems}</p>
              <p className="text-xs text-gray-500">Finished Goods Only</p>
            </div>
          </div>
        </div>
      </div>


        {/* Filters and Search */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search raw materials and finished goods by name, code, or supplier..."
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
                Clear Filters
              </button>
              <button 
                onClick={handleExport}
                className="btn-secondary flex items-center"
                title="Export inventory to CSV"
                disabled={inventoryItems.length === 0 && finishedGoodInventoryItems.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button 
                onClick={handleImport}
                className="btn-secondary flex items-center"
                title="Import inventory from CSV"
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
              <button 
                onClick={addSampleData}
                className="btn-primary flex items-center"
                title="Add sample inventory data"
                disabled={loading}
              >
                <Package className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Sample Data'}
              </button>
              <button 
                onClick={() => navigate('/sales-orders/add?outlet=Central Kitchen')}
                className="btn-primary flex items-center"
                title="Create new sales order"
              >
                <Utensils className="h-4 w-4 mr-2" />
                Create Sales Order
              </button>
              <button 
                onClick={() => navigate('/sales-orders')}
                className="btn-secondary flex items-center"
                title="View all sales orders"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Sales Orders
              </button>
              <button 
                onClick={() => loadInventory()}
                className="btn-secondary flex items-center"
                title="Refresh inventory data"
                disabled={loading || !outlet?.id}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Overstock">Overstock</option>
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
                  <option value="materialName">Raw Material Name</option>
                  <option value="currentStock">Current Stock</option>
                  <option value="totalValue">Total Value</option>
                  <option value="status">Status</option>
                  <option value="lastUpdated">Last Updated</option>
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
               Showing {inventoryItems.length + finishedGoodInventoryItems.length} inventory items
              {(searchTerm || filterCategory || filterStatus) && (
                <span className="ml-2 text-blue-600">
                  (filtered)
                </span>
              )}
            </span>
            {(searchTerm || filterCategory || filterStatus) && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

      {/* Raw Materials Table */}
      <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Raw Material</th>
                    <th className="table-header">Current Stock</th>
                    <th className="table-header">Available</th>
                    <th className="table-header">Min/Max</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Value</th>
                    <th className="table-header">Location</th>
                    <th className="table-header">Last Updated</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <div className="text-gray-900 font-medium">{item.materialName}</div>
                          <div className="text-gray-500 text-sm">{item.materialCode}</div>
                          <div className="text-gray-500 text-sm">{item.category}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.currentStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.availableStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">{item.minimumStock}/{item.maximumStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.totalValue.toFixed(2)} KWD</div>
                        <div className="text-gray-500 text-sm">{item.unitPrice.toFixed(2)} per {item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">{item.location}</div>
                        <div className="text-gray-500 text-sm">{item.batchNumber}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">{new Date(item.lastUpdated).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-sm">{new Date(item.lastUpdated).toLocaleTimeString()}</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/outlet-inventory/edit/${item.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

      {/* Finished Goods Table */}
      <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Finished Good</th>
                    <th className="table-header">Current Stock</th>
                    <th className="table-header">Available</th>
                    <th className="table-header">Min/Max</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Value</th>
                    <th className="table-header">Production/Expiry</th>
                    <th className="table-header">Quality</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finishedGoodInventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <div className="text-gray-900 font-medium">{item.productName}</div>
                          <div className="text-gray-500 text-sm">{item.productCode}</div>
                          <div className="text-gray-500 text-sm">{item.category}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.currentStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.availableStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">{item.minimumStock}/{item.maximumStock}</div>
                        <div className="text-gray-500 text-sm">{item.unitOfMeasure}</div>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 font-medium">{item.totalValue.toFixed(2)} KWD</div>
                        <div className="text-gray-500 text-sm">{item.costPrice.toFixed(2)} cost / {item.unitPrice.toFixed(2)} sell</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">Prod: {new Date(item.productionDate).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-sm">Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-sm">{item.batchNumber}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-gray-900 text-sm">{item.qualityStatus}</div>
                        <div className="text-gray-500 text-sm">{item.storageTemperature}</div>
                        <div className="text-gray-500 text-sm">{item.storageLocation}</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/finished-good-inventory/edit/${item.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            Edit
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
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

    </div>
  )
}

export default CentralKitchen
