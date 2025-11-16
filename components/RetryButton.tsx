'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface RetryButtonProps {
  onRetry: () => Promise<void>
  className?: string
  children?: React.ReactNode
}

export function RetryButton({ onRetry, className = '', children }: RetryButtonProps) {
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await onRetry()
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setRetrying(false)
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={retrying}
      className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 
                 disabled:cursor-not-allowed rounded-lg text-white font-semibold 
                 flex items-center gap-2 transition-colors ${className}`}
      aria-label="Retry"
    >
      <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
      {children || (retrying ? 'Retrying...' : 'Try Again')}
    </button>
  )
}

