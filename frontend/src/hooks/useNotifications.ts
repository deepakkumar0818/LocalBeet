import { useState, useCallback } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  read: boolean
  outlet?: string
}

export const useNotifications = (outletName?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Low Stock Alert',
      message: 'Chicken breast is running low. Current stock: 15 units',
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      outlet: outletName
    },
    {
      id: '2',
      title: 'Transfer Order Completed',
      message: 'Transfer order #TR-2024-001 has been successfully delivered',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      outlet: outletName
    },
    {
      id: '3',
      title: 'New Sales Order',
      message: 'New order #SO-2024-156 received for $125.50',
      type: 'info',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      outlet: outletName
    },
    {
      id: '4',
      title: 'Inventory Update Required',
      message: 'Please update the inventory count for fresh vegetables',
      type: 'warning',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      outlet: outletName
    },
    {
      id: '5',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM',
      type: 'info',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      outlet: outletName
    }
  ])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
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
    addNotification
  }
}
