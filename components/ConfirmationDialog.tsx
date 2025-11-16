'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/10',
      icon: 'text-red-400',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      icon: 'text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      iconBg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const styles = variantStyles[variant]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-dark-100 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-4 mb-4">
                <div className={`${styles.iconBg} rounded-full p-3 flex-shrink-0`}>
                  <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400">{message}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-white font-semibold transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className={`px-4 py-2 ${styles.button} rounded-lg text-white font-semibold transition-colors`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

