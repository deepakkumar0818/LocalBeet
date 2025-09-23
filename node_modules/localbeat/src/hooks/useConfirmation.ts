import { useState, useCallback } from 'react'

interface ConfirmationState {
  isOpen: boolean
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  confirmText: string
  cancelText: string
  showCancel: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  })

  const showAlert = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(undefined)
        }
      })
    })
  }, [])

  const showConfirm = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'warning'
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const showDeleteConfirm = useCallback(async (
    itemName: string
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmation({
        isOpen: true,
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        type: 'error',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        showCancel: true,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }, [])

  const showSuccess = useCallback(async (
    title: string,
    message: string
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        type: 'success',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(undefined)
        }
      })
    })
  }, [])

  const showError = useCallback(async (
    title: string,
    message: string
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        type: 'error',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(undefined)
        }
      })
    })
  }, [])

  const showWarning = useCallback(async (
    title: string,
    message: string
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        type: 'warning',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
        onConfirm: () => {
          setConfirmation(prev => ({ ...prev, isOpen: false }))
          resolve(undefined)
        }
      })
    })
  }, [])

  const closeConfirmation = useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    confirmation,
    showAlert,
    showConfirm,
    showDeleteConfirm,
    showSuccess,
    showError,
    showWarning,
    closeConfirmation
  }
}