'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { LeaderboardCardSkeleton } from '@/components/SkeletonLoader'

interface LeaderboardUser {
  rank: number
  id: number
  name: string
  avatar: string
  trades: number
  applications: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFilter])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const data = await api.getLeaderboard()
      setLeaderboard(data.leaderboard || [])
    } catch (error: any) {
      console.error('Failed to fetch leaderboard:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Image src="/images/3dicons-trophy-dynamic-color.png" alt="Trophy" width={24} height={24} className="object-contain" />
    if (rank === 2) return <Image src="/images/3dicons-trophy-dynamic-color.png" alt="Trophy" width={24} height={24} className="object-contain opacity-70" />
    if (rank === 3) return <Image src="/images/3dicons-trophy-dynamic-color.png" alt="Trophy" width={24} height={24} className="object-contain opacity-80" />
    return <span className="text-gray-400 font-bold">#{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { 
      icon: <Image src="/images/3dicons-medal-dynamic-color.png" alt="Medal" width={20} height={20} className="object-contain" />, 
      color: 'from-yellow-400 to-yellow-600', 
      glow: 'shadow-yellow-500/50' 
    }
    if (rank === 2) return { 
      icon: <Image src="/images/3dicons-medal-dynamic-color.png" alt="Medal" width={20} height={20} className="object-contain" />, 
      color: 'from-gray-300 to-gray-500', 
      glow: 'shadow-gray-400/50' 
    }
    if (rank === 3) return { 
      icon: <Image src="/images/3dicons-medal-dynamic-color.png" alt="Medal" width={20} height={20} className="object-contain" />, 
      color: 'from-orange-400 to-orange-600', 
      glow: 'shadow-orange-500/50' 
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="mb-8">
            <div className="h-10 w-48 bg-primary-500/20 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-80 bg-primary-500/10 rounded animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-dark-100 to-dark-200 border border-primary-500/20 rounded-2xl p-6 animate-pulse">
                <div className="h-16 w-16 bg-primary-500/20 rounded-full mx-auto mb-4" />
                <div className="h-6 w-32 bg-primary-500/20 rounded mx-auto mb-4" />
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-primary-500/10 rounded mx-auto" />
                  <div className="h-1 w-full bg-primary-500/10 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-dark-100 border border-primary-500/20 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-primary-500/20">
              <div className="h-6 w-32 bg-primary-500/20 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-primary-500/10">
              {[...Array(5)].map((_, i) => (
                <LeaderboardCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  const maxTrades = Math.max(...leaderboard.map(u => u.trades), 1)

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 left-1/4 w-80 h-80 bg-primary-500/18 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-amber-500/16 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header with Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Image 
                    src="/images/3dicons-trophy-dynamic-color.png" 
                    alt="Trophy" 
                    width={40} 
                    height={40} 
                    className="object-contain"
                  />
                </motion.div>
                Leaderboard
              </h1>
              <p className="text-gray-400">
                Top contributors helping students learn and grow together
              </p>
            </div>
            
            {/* Time Filter */}
            <div className="flex gap-2 bg-dark-100 p-1 rounded-lg border border-primary-500/20">
              {(['all', 'week', 'month'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timeFilter === filter
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {[1, 0, 2].map((index) => {
              if (index >= topThree.length) return null
              const user = topThree[index]
              const rank = index + 1
              const badge = getRankBadge(rank)
              const height = rank === 1 ? 'h-64' : rank === 2 ? 'h-56' : 'h-52'
              
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: rank === 1 ? 0.2 : rank === 2 ? 0 : 0.4,
                    type: 'spring',
                    stiffness: 100
                  }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`relative bg-gradient-to-br from-dark-100 to-dark-200 border-2 ${
                    rank === 1 
                      ? 'border-yellow-500/50 sm:order-2 sm:scale-105 shadow-2xl shadow-yellow-500/20' 
                      : rank === 2 
                      ? 'border-gray-400/50 sm:order-1' 
                      : 'border-orange-500/50 sm:order-3'
                  } rounded-2xl p-6 overflow-hidden`}
                >
                  {/* Animated Background Glow */}
                  {rank === 1 && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent"
                      animate={{ opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                  
                  <div className="relative z-10 text-center">
                    {/* Rank Badge */}
                    <div className="flex justify-center mb-4">
                      {badge && (
                        <motion.div
                          className={`w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-white shadow-lg ${badge.glow}`}
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {badge.icon}
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-blue-500 
                                rounded-full flex items-center justify-center text-2xl font-bold text-white
                                shadow-lg shadow-primary-500/30"
                    >
                      {user.avatar}
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-white mb-3">{user.name}</h3>
                    
                    {/* Stats */}
                    <div className="space-y-3">
                        <div className="bg-dark-200/50 rounded-lg p-3">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Image 
                              src="/images/3dicons-flash-dynamic-color.png" 
                              alt="Trades" 
                              width={16} 
                              height={16} 
                              className="object-contain"
                            />
                            <span className="text-primary-400 font-bold text-lg">{user.trades.toLocaleString()}</span>
                          </div>
                          <p className="text-gray-400 text-xs">Completed Trades</p>
                        {/* Progress Bar */}
                        <div className="mt-2 h-1.5 bg-dark-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(user.trades / maxTrades) * 100}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Image 
                            src="/images/3dicons-flash-dynamic-color.png" 
                            alt="Trades" 
                            width={16} 
                            height={16} 
                            className="object-contain"
                          />
                          <span className="text-white font-semibold">{user.trades}</span>
                          <span className="text-gray-400">trades</span>
                        </div>
                        {/* Removed level pill to simplify user ranking */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Crown for #1 */}
                  {rank === 1 && (
                    <motion.div
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Image 
                        src="/images/3dicons-medal-dynamic-color.png" 
                        alt="crown"
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        {leaderboard.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-100 border border-primary-500/20 rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-primary-500/20 bg-gradient-to-r from-primary-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Image 
                    src="/images/3dicons-fire-dynamic-color.png" 
                    alt="Fire" 
                    width={24} 
                    height={24} 
                    className="object-contain"
                  />
                  All Rankings
                </h2>
                <div className="text-sm text-gray-400">
                  {leaderboard.length} {leaderboard.length === 1 ? 'student' : 'students'}
                </div>
              </div>
            </div>
            <div className="divide-y divide-primary-500/10">
              {leaderboard.map((user, index) => {
                const badge = getRankBadge(user.rank)
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ x: 5, backgroundColor: 'rgba(147, 51, 234, 0.05)' }}
                    className="p-6 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="w-12 flex-shrink-0 flex items-center justify-center">
                        {badge ? (
                          <motion.div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-white shadow-md`}
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            {badge.icon}
                          </motion.div>
                        ) : (
                          <span className="text-gray-400 font-bold text-lg">#{user.rank}</span>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 
                                  rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0
                                  shadow-lg shadow-primary-500/30"
                      >
                        {user.avatar}
                      </motion.div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
                          {user.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Image 
                              src="/images/3dicons-flash-dynamic-color.png" 
                              alt="Trades" 
                              width={16} 
                              height={16} 
                              className="object-contain"
                            />
                            <span className="text-gray-300 font-medium">{user.trades}</span>
                            <span className="text-gray-500">trades</span>
                          </div>
                          {user.applications > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Image 
                                src="/images/3dicons-star-dynamic-color.png" 
                                alt="Star" 
                                width={16} 
                                height={16} 
                                className="object-contain"
                              />
                              <span className="text-gray-300">{user.applications}</span>
                              <span className="text-gray-500">accepted</span>
                            </div>
                          )}
                          {/* Kept compact stats; removed level badge for a cleaner look */}
                        </div>
                        {/* Mini Progress Bar */}
                        <div className="mt-2 h-1 bg-dark-200 rounded-full overflow-hidden max-w-xs">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(user.trades / maxTrades) * 100}%` }}
                            transition={{ delay: index * 0.05 + 0.5, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Award Icon */}
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        className="flex-shrink-0"
                      >
                        <Image 
                          src="/images/3dicons-medal-dynamic-color.png" 
                          alt="Award" 
                          width={24} 
                          height={24} 
                          className="object-contain"
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No users on leaderboard yet. Be the first!</p>
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-primary-500/10 
                     border border-primary-500/20 rounded-xl p-6 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Image 
              src="/images/3dicons-flash-dynamic-color.png" 
              alt="Info" 
              width={20} 
              height={20} 
              className="object-contain"
            />
            How Rankings Work
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Rankings are based on completed skill trades and successful applications. 
            The more trades you complete and applications you get accepted, the higher you rank! 
            Help other students learn and grow together. Climb the leaderboard and earn 
            exclusive badges and rewards.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
