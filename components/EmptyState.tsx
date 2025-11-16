import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface EmptyStateProps {
  icon?: LucideIcon
  icon3d?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({ 
  icon: Icon, 
  icon3d,
  title, 
  description, 
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mb-6 relative"
      >
        {icon3d ? (
          <Image
            src={icon3d}
            alt={title}
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
        ) : Icon ? (
          <Icon className="w-8 h-8 text-primary-400" />
        ) : null}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-500/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">{description}</p>
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={action.onClick}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-primary-500/20"
          aria-label={action.label}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

