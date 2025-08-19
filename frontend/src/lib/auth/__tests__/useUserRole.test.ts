/**
 * Tests for useUserRole hook
 */

import { renderHook } from '@testing-library/react'
import { useUserRole } from '../useUserRole'
import { UserRole } from '../better-auth-client'
import { getRoleLevel, roleHasPermission } from '../roleConfig'

// Mock the better-auth-client
jest.mock('../better-auth-client', () => ({
  useSession: jest.fn(),
  UserRole: {
    CUSTOMER: 'CUSTOMER',
    TECHNICIAN: 'TECHNICIAN',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN'
  }
}))

describe('useUserRole', () => {
  const mockUseSession = require('../better-auth-client').useSession

  beforeEach(() => {
    mockUseSession.mockClear()
  })

  it('should return null for no session', () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false })
    
    const { result } = renderHook(() => useUserRole())
    
    expect(result.current.currentRole).toBeNull()
    expect(result.current.roleLevel).toBe(0)
    expect(result.current.permissions).toEqual([])
    expect(result.current.roleInfo).toBeNull()
  })

  it('should return admin role data correctly', () => {
    const mockSession = {
      user: {
        id: '123',
        role: UserRole.ADMIN,
        name: 'Test User',
        email: 'test@example.com'
      }
    }
    mockUseSession.mockReturnValue({ data: mockSession, isPending: false })
    
    const { result } = renderHook(() => useUserRole())
    
    expect(result.current.currentRole).toBe(UserRole.ADMIN)
    expect(result.current.roleLevel).toBe(getRoleLevel(UserRole.ADMIN))
    expect(result.current.roleInfo?.name).toBe('Administrator')
    expect(result.current.hasRole(UserRole.CUSTOMER)).toBe(true)
    expect(result.current.hasRole(UserRole.TECHNICIAN)).toBe(true)
    expect(result.current.hasRole(UserRole.ADMIN)).toBe(true)
    expect(result.current.hasRole(UserRole.SUPER_ADMIN)).toBe(false)
  })

  it('should check permissions correctly', () => {
    const mockSession = {
      user: {
        id: '123',
        role: UserRole.TECHNICIAN,
        name: 'Test Technician',
        email: 'tech@example.com'
      }
    }
    mockUseSession.mockReturnValue({ data: mockSession, isPending: false })
    
    const { result } = renderHook(() => useUserRole())
    
    expect(result.current.hasPermission('repairs:read')).toBe(true)
    expect(result.current.canAccess('repairs', 'update')).toBe(true)
    expect(result.current.canAccess('users', 'create')).toBe(false)
  })

  it('should handle role comparison correctly', () => {
    const mockSession = {
      user: {
        id: '123',
        role: UserRole.ADMIN,
        name: 'Test Admin',
        email: 'admin@example.com'
      }
    }
    mockUseSession.mockReturnValue({ data: mockSession, isPending: false })
    
    const { result } = renderHook(() => useUserRole())
    
    expect(result.current.isHigherThan(UserRole.CUSTOMER)).toBe(true)
    expect(result.current.isHigherThan(UserRole.TECHNICIAN)).toBe(true)
    expect(result.current.isHigherThan(UserRole.ADMIN)).toBe(false)
    expect(result.current.isHigherThan(UserRole.SUPER_ADMIN)).toBe(false)
  })

  it('should handle hasAnyRole correctly', () => {
    const mockSession = {
      user: {
        id: '123',
        role: UserRole.TECHNICIAN,
        name: 'Test Technician',
        email: 'tech@example.com'
      }
    }
    mockUseSession.mockReturnValue({ data: mockSession, isPending: false })
    
    const { result } = renderHook(() => useUserRole())
    
    expect(result.current.hasAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])).toBe(false)
    expect(result.current.hasAnyRole([UserRole.CUSTOMER, UserRole.TECHNICIAN])).toBe(true)
    expect(result.current.hasAnyRole([UserRole.TECHNICIAN, UserRole.ADMIN])).toBe(true)
  })
})