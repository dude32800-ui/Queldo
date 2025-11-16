'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, User, Calendar, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 13 || age > 18) {
      toast.error('You must be between 13-18 years old')
      return
    }

    setLoading(true)
    
    try {
      const data = await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: age,
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Account created successfully!')
      router.push('/marketplace')
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
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
                  Join the community,
                  <br />
                  start sharing skills today
                </h2>
                <p className="text-xl text-white/80 max-w-md">
                  Connect with students, learn new skills, and grow together through skill sharing
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
                      src="/images/3dicons-bulb-dynamic-color.png" 
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
                  { icon: '/images/3dicons-tools-dynamic-color.png', angle: 288, delay: 0.8 },
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

        {/* Right Panel - Registration Form */}
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
              <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
              <p className="text-gray-400 mb-8">Join Queldo and start trading skills with fellow students.</p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      required
                      min="13"
                      max="18"
                      className="w-full pl-12 pr-4 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="15"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Must be between 13-18 years old</p>
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-12 py-3 bg-dark-100 border border-primary-500/20 
                               rounded-xl text-white placeholder-gray-500 focus:outline-none 
                               focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 
                               transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                               hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-4 h-4 text-primary-600 bg-dark-100 border-primary-500/30 rounded 
                             focus:ring-primary-500 focus:ring-2"
                  />
                  <label className="ml-2 text-sm text-gray-300">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-400 hover:text-primary-300">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-400 hover:text-primary-300">
                      Privacy Policy
                    </Link>
                  </label>
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
                  <span>{loading ? 'Creating account...' : 'Create account'}</span>
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                  >
                    Sign in
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
