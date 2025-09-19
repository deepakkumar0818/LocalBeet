import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RawMaterial } from '../../types'

interface InventoryState {
  rawMaterials: RawMaterial[]
  loading: boolean
  error: string | null
}

const initialState: InventoryState = {
  rawMaterials: [],
  loading: false,
  error: null,
}

// Load initial data from localStorage
const loadFromStorage = (): RawMaterial[] => {
  try {
    const stored = localStorage.getItem('rawMaterials')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  
  // Return default sample data if nothing in storage
  return [
    {
      id: 'rm-001',
      materialCode: '10001',
      materialName: 'Bhujia',
      description: 'Traditional Indian snack',
      category: 'Bakery',
      unitOfMeasure: 'kg',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      supplierId: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rm-002',
      materialCode: '10002',
      materialName: 'Bran Flakes',
      description: 'Healthy breakfast cereal',
      category: 'Bakery',
      unitOfMeasure: 'kg',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      supplierId: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rm-003',
      materialCode: '10003',
      materialName: 'Bread Improver',
      description: 'Baking ingredient for better bread',
      category: 'Bakery',
      unitOfMeasure: 'kg',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      supplierId: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rm-004',
      materialCode: '10004',
      materialName: 'Caramel Syrup',
      description: 'Sweet syrup for beverages',
      category: 'Bakery',
      unitOfMeasure: 'kg',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      supplierId: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rm-005',
      materialCode: '10005',
      materialName: 'Cocoa Powder',
      description: 'Chocolate powder for baking',
      category: 'Bakery',
      unitOfMeasure: 'kg',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      supplierId: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

// Initialize with data from localStorage
const initialRawMaterials = loadFromStorage()

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    ...initialState,
    rawMaterials: initialRawMaterials,
  },
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setRawMaterials: (state, action: PayloadAction<RawMaterial[]>) => {
      state.rawMaterials = action.payload
      // Save to localStorage
      try {
        localStorage.setItem('rawMaterials', JSON.stringify(action.payload))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    addRawMaterial: (state, action: PayloadAction<RawMaterial>) => {
      state.rawMaterials.push(action.payload)
      // Save to localStorage
      try {
        localStorage.setItem('rawMaterials', JSON.stringify(state.rawMaterials))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    updateRawMaterial: (state, action: PayloadAction<RawMaterial>) => {
      const index = state.rawMaterials.findIndex(material => material.id === action.payload.id)
      if (index !== -1) {
        state.rawMaterials[index] = action.payload
        // Save to localStorage
        try {
          localStorage.setItem('rawMaterials', JSON.stringify(state.rawMaterials))
        } catch (error) {
          console.error('Error saving to localStorage:', error)
        }
      }
    },
    deleteRawMaterial: (state, action: PayloadAction<string>) => {
      state.rawMaterials = state.rawMaterials.filter(material => material.id !== action.payload)
      // Save to localStorage
      try {
        localStorage.setItem('rawMaterials', JSON.stringify(state.rawMaterials))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    importRawMaterials: (state, action: PayloadAction<RawMaterial[]>) => {
      const newMaterials = action.payload
      const existingMaterials = state.rawMaterials
      
      // Merge new materials with existing ones
      const mergedMaterials = [...existingMaterials]
      
      newMaterials.forEach(newMaterial => {
        const existingIndex = mergedMaterials.findIndex(
          material => material.materialCode === newMaterial.materialCode
        )
        
        if (existingIndex !== -1) {
          // Update existing material
          mergedMaterials[existingIndex] = {
            ...mergedMaterials[existingIndex],
            materialName: newMaterial.materialName,
            description: newMaterial.description,
            category: newMaterial.category,
            unitOfMeasure: newMaterial.unitOfMeasure,
            updatedAt: new Date().toISOString()
          }
        } else {
          // Add new material
          mergedMaterials.push(newMaterial)
        }
      })
      
      state.rawMaterials = mergedMaterials
      
      // Save to localStorage
      try {
        localStorage.setItem('rawMaterials', JSON.stringify(state.rawMaterials))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    clearRawMaterials: (state) => {
      state.rawMaterials = []
      // Clear localStorage
      try {
        localStorage.removeItem('rawMaterials')
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    }
  },
})

export const {
  setLoading,
  setError,
  setRawMaterials,
  addRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  importRawMaterials,
  clearRawMaterials
} = inventorySlice.actions

export default inventorySlice.reducer
