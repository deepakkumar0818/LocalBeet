import { useState, useCallback, useEffect } from 'react'
import { apiService } from '../services/api'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  read: boolean
  outlet?: string
  transferOrderId?: string
  isTransferOrder?: boolean
  itemType?: string
  priority?: string
}

export const useNotifications = (outletName?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    if (!outletName) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log(`🔔 useNotifications: Loading notifications for outlet: "${outletName}"`)
      const response = await apiService.getNotifications(outletName, undefined, 20)
      console.log(`🔔 useNotifications: API response:`, response)
      
      if (response.success) {
        const apiNotifications: Notification[] = response.data.map((notif: any) => {
          return {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type === 'transfer_rejection' ? 'error' : 
                  notif.type === 'transfer_acceptance' ? 'success' : 
                  notif.type === 'transfer_completed' ? 'success' :
                  (notif.priority === 'high' ? 'warning' : 'info'),
            timestamp: new Date(notif.timestamp),
            read: notif.read,
            outlet: outletName,
            transferOrderId: notif.transferOrderId,
            isTransferOrder: notif.type === 'transfer_completed' || notif.type === 'transfer_request' || notif.type === 'transfer_acceptance' || notif.type === 'transfer_rejection' || notif.isTransferOrder || false,
            itemType: notif.itemType,
            priority: notif.priority
          }
        })
        
        setNotifications(apiNotifications)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Fallback to empty array if API fails
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [outletName])

  // Load notifications on mount and when outletName changes
  useEffect(() => {
    loadNotifications()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!outletName) return
    
    try {
      await apiService.markAllNotificationsAsRead(outletName)
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [outletName])

  const clearAll = useCallback(async () => {
    if (!outletName) return
    
    try {
      await apiService.clearAllNotifications(outletName)
      setNotifications([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }, [outletName])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    loading,
    refreshNotifications: loadNotifications
  }
}