'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import NotificationCenter from './NotificationCenter'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const { scrollY } = useScroll()
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setIsAuthenticated(!!token)
  }, [pathname])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const current = latest
    const previous = lastScrollY
    
    if (current < previous || current < 100) {
      // Scrolling up or at top - show navbar
      setIsVisible(true)
    } else if (current > previous && !isHovered) {
      // Scrolling down and not hovering - hide navbar
      setIsVisible(false)
    }
    
    setLastScrollY(current)
    setScrolled(current > 20)
  })

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/chat', label: 'Chat', requiresAuth: true },
    { href: '/profile', label: 'Profile', requiresAuth: true },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  const visibleNavLinks = navLinks.filter(link => !link.requiresAuth || isAuthenticated)

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible || isHovered ? 0 : -100,
        opacity: isVisible || isHovered ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-50/95 backdrop-blur-xl border-b border-primary-500/20 shadow-lg shadow-primary-500/5'
          : 'bg-dark-50/80 backdrop-blur-xl border-b border-primary-500/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-3xl font-black gradient-text tracking-tight hover:scale-105 transition-transform"
            aria-label="Queldo Home"
          >
            QUELDO
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 rounded-lg transition-all duration-200"
              >
                <span
                  className={`relative z-10 font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </span>
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-primary-500/20 rounded-lg border border-primary-500/30"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <button 
                  className="hidden md:block p-2 text-gray-300 hover:text-white hover:bg-primary-500/10 
                             rounded-lg transition-all"
                  aria-label="Search"
                >
                  <Image 
                    src="/images/3dicons-zoom-dynamic-color.png" 
                    alt="Search" 
                    width={20} 
                    height={20} 
                    className="object-contain"
                  />
                </button>
                <Link
                  href="/profile"
                  className="p-2 text-gray-300 hover:text-white hover:bg-primary-500/10 
                           rounded-lg transition-all"
                  aria-label="Profile"
                >
                  <Image 
                    src="/images/3dicons-boy-dynamic-color.png" 
                    alt="Profile" 
                    width={20} 
                    height={20} 
                    className="object-contain"
                  />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 
                           text-white rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-primary-500/20"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-primary-500/20 bg-dark-100/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary-500/20 text-white border border-primary-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-primary-500/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-primary-500/10 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg bg-primary-600 text-white text-center font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
