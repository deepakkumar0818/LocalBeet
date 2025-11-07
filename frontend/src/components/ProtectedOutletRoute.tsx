import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedOutletRouteProps {
  children: React.ReactElement
  allowedOutletCodes: string[]
}

/**
 * Route protection component that ensures only users with specific assignedOutletCode
 * (or admins) can access the route
 */
const ProtectedOutletRoute: React.FC<ProtectedOutletRouteProps> = ({ 
  children, 
  allowedOutletCodes 
}) => {
  const location = useLocation()
  
  const authUser = (() => {
    try { 
      return JSON.parse(localStorage.getItem('auth_user') || 'null') 
    } catch { 
      return null 
    }
  })()

  const isAdmin = Boolean(authUser?.isAdmin)
  const assignedOutletCode = String(authUser?.assignedOutletCode || '')

  // Admin can access all routes
  if (isAdmin) {
    return children
  }

  // Check if user's assigned outlet is in the allowed list
  if (allowedOutletCodes.includes(assignedOutletCode)) {
    return children
  }

  // Redirect to dashboard if not authorized
  return <Navigate to="/dashboard" replace state={{ from: location }} />
}

export default ProtectedOutletRoute

