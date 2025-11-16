'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProgressIndicatorProps {
  message?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressIndicator({ 
  message = 'Loading...', 
  fullScreen = false,
  size = 'md'
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
      {message && (
        <p className="text-gray-400 text-sm">{message}</p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-50/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

