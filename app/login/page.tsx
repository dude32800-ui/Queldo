'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, Eye, EyeOff, Copy, Check, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const DEMO_EMAIL = 'demo@queldo.app'
  const DEMO_PASSWORD = 'demo123'

  const copyToClipboard = (text: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(text)
    if (type === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2000)
    }
    toast.success(`${type === 'email' ? 'Email' : 'Password'} copied!`)
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    
    try {
      const data = await api.login(DEMO_EMAIL, DEMO_PASSWORD)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      toast.success('Login successful!')
      router.push('/marketplace')
    } catch (error: any) {
      console.error('Demo login error:', error)
      const errorMessage = error.message || 'Login failed'
      toast.error(errorMessage === 'Invalid credentials' 
        ? 'Invalid credentials. The demo account may not exist. Run: npm run demo-account'
        : errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const data = await api.login(email, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      toast.success('Login successful!')
      router.push('/marketplace')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-dark-50 relative overflow-hidden"
    >
      {/* Subtle global background for auth pages */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 -left-32 w-80 h-80 bg-primary-500/18 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/12 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      <div className="relative flex min-h-[calc(100vh-5rem)] pt-20">
        {/* Left Panel - Branding & Visual */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/" className="text-4xl font-black tracking-tight">
                QUELDO
              </Link>
            </motion.div>

            {/* Tagline & Visual */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  A platform for students,
                  <br />
                  where skills come together
                </h2>
                <p className="text-xl text-white/80 max-w-md">
                  Connect, learn, and grow with fellow students through skill sharing
                </p>
              </motion.div>

              {/* Skill Icons Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative w-64 h-64"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="relative w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Image 
                      src="/images/3dicons-puzzle-dynamic-color.png" 
                      alt="skills"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-contain"
                    />
                  </motion.div>
                </div>

                {/* Floating skill icons around center */}
                {[
                  { icon: '/images/3dicons-painting-kit-dynamic-color.png', angle: 0, delay: 0 },
                  { icon: '/images/3dicons-music-dynamic-color.png', angle: 72, delay: 0.2 },
                  { icon: '/images/3dicons-camera-dynamic-color.png', angle: 144, delay: 0.4 },
                  { icon: '/images/3dicons-notebook-dynamic-color.png', angle: 216, delay: 0.6 },
                  { icon: '/images/3dicons-forward-dynamic-color.png', angle: 288, delay: 0.8 },
                ].map((skill, i) => {
                  const radius = 100
                  const x = Math.cos((skill.angle * Math.PI) / 180) * radius
                  const y = Math.sin((skill.angle * Math.PI) / 180) * radius

                  return (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3 + i * 0.3,
                        repeat: Infinity,
                        delay: skill.delay,
                      }}
                    >
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center p-2 border border-white/20">
                        <Image 
                          src={skill.icon} 
                          alt="skill"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* Bottom decorative text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-white/60 text-sm"
            >
              Join thousands of students trading skills
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-dark-50 relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(147, 51, 234, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(147, 51, 234, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }} />
            <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="text-3xl font-black gradient-text inline-block">
                QUELDO
              </Link>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sign in</h1>
              <p className="text-gray-400 mb-8">Welcome back! Get back to trading skills in just a moment.</p>

              {/* Demo Account Card */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6 p-4 bg-gradient-to-br from-primary-500/10 to-blue-500/10 border border-primary-500/30 rounded-xl backdrop-blur-sm"
              >
                <div className="flex items-start gap-2 mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300/90">
                    <strong>Note:</strong> Make sure to run <code className="bg-dark-200 px-1 rounded">npm run demo-account</code> first to create the demo account.
                  </p>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">🎯 Demo Account</h3>
                    <p className="text-xs text-gray-400">Try out Queldo without signing up</p>
                  </div>
                  <button
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-semibold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                  >
                    {loading ? 'Logging in...' : 'Use Demo'}
                  </button>
                </div>
                
                <div className="space-y-2">
                  {/* Email */}
                  <div className="flex items-center gap-2 p-2 bg-dark-100/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="text-sm font-mono text-white truncate">{DEMO_EMAIL}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(DEMO_EMAIL, 'email')}
                      className="p-1.5 hover:bg-dark-200 rounded transition-colors flex-shrink-0"
                      title="Copy email"
                    >
                      {copiedEmail ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-2 p-2 bg-dark-100/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">Password</p>
                      <p className="text-sm font-mono text-white truncate">{DEMO_PASSWORD}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(DEMO_PASSWORD, 'password')}
                      className="p-1.5 hover:bg-dark-200 rounded transition-colors flex-shrink-0"
                      title="Copy password"
                    >
                      {copiedPassword ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                               hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-dark-100 border-primary-500/30 rounded 
                               focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300">Stay logged in</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 
                           disabled:cursor-not-allowed rounded-xl text-white font-semibold 
                           transition-all flex items-center justify-center space-x-2 shadow-lg
                           shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
                >
                  <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    href="/register"
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
