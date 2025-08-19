/**
 * Client-Only Components Wrapper
 * 
 * Ensures analytics and client-specific components only render after hydration
 * Prevents SSR issues with browser APIs
 */

'use client'

import React, { useEffect, useState } from 'react'
import FingerprintAnalytics from './analytics/FingerprintAnalytics'
import PerformanceOptimizer from './performance/PerformanceOptimizer'
import ConsentManager from './analytics/ConsentManager'

export function ClientOnlyComponents() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only render analytics components after hydration
  if (!isClient) {
    return null
  }

  return (
    <>
      <FingerprintAnalytics />
      <PerformanceOptimizer 
        showDebugPanel={process.env.NODE_ENV === 'development'}
        enableAutoOptimizations={true}
      />
      <ConsentManager 
        showBanner={true}
        position="bottom"
      />
    </>
  )
}