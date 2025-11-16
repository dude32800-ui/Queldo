'use client'

import { motion } from 'framer-motion'
import { useMemo, useState, useEffect } from 'react'

interface ParticleBackgroundProps {
  particleCount?: number
  className?: string
}

export function ParticleBackground({ particleCount = 20, className = '' }: ParticleBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const particles = useMemo(() => {
    if (!mounted) return []
    
    const colors = [
      'rgba(147, 51, 234, 0.4)',
      'rgba(59, 130, 246, 0.4)',
      'rgba(96, 165, 250, 0.4)',
      'rgba(168, 85, 247, 0.4)',
      'rgba(236, 72, 153, 0.4)',
    ]

    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }))
  }, [particleCount, mounted])

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle particle-float"
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

