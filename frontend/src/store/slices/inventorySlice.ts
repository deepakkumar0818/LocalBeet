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
    // Clear localStorage to ensure fresh start
    localStorage.removeItem('rawMaterials')
    console.log('🧹 Cleared rawMaterials from localStorage')
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
  
  // Return empty array - no default sample data
  return []
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
