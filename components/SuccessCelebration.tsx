'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

interface SuccessCelebrationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export function SuccessCelebration({ show, message = 'Success!', onComplete }: SuccessCelebrationProps) {
  useEffect(() => {
    if (show) {
      // Create confetti particles
      const colors = ['#9333ea', '#3b82f6', '#60a5fa', '#a855f7', '#ec4899']
      const confettiCount = 50

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div')
        confetti.className = 'confetti'
        confetti.style.left = Math.random() * 100 + '%'
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)]
        confetti.style.animationDelay = Math.random() * 0.5 + 's'
        confetti.style.width = Math.random() * 10 + 5 + 'px'
        confetti.style.height = confetti.style.width
        document.body.appendChild(confetti)

        setTimeout(() => {
          confetti.remove()
        }, 3000)
      }

      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            className="bg-dark-100 border border-primary-500/30 rounded-xl p-8 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-10 h-10 text-green-400" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-white text-center"
            >
              {message}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-4"
            >
              <Sparkles className="w-5 h-5 text-primary-400" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

