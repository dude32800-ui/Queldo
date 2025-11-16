'use client'

import { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import { Filter, Loader2, ArrowUpDown, TrendingUp, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { MarketplaceCardSkeleton } from '@/components/SkeletonLoader'

interface SkillListing {
  id: string
  user_id: string
  user_name: string
  user_avatar: string
  skills_offering: string[]
  skills_seeking: string[]
  compatibility?: number
  description: string
  created_at: string
  title?: string
}

type SortOption = 'newest' | 'oldest' | 'compatibility' | 'most-skills'

export default function MarketplacePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<SkillListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (!loadingMore && hasMore && !loading) {
          loadMoreListings()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore, loading])

  const fetchListings = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      const data = await api.getListings()
      
      // Transform the data to match our interface
      const transformedListings = (data.listings || []).map((listing: any) => {
        // Handle skills - backend returns array of strings or objects
        const offering = listing.skills_offering || []
        const seeking = listing.skills_seeking || []
        
        return {
          id: listing.id.toString(),
          user_id: listing.user_id.toString(),
          user_name: listing.user_name,
          user_avatar: listing.user_avatar || listing.user_name?.substring(0, 2).toUpperCase() || 'U',
          skills_offering: offering,
          skills_seeking: seeking,
          description: listing.description || '',
          created_at: listing.created_at,
          title: listing.title,
        }
      })

      // Fetch compatibility scores for logged-in users
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      let finalListings = transformedListings
      if (token) {
        finalListings = await Promise.all(
          transformedListings.map(async (listing: SkillListing) => {
            try {
              const compatData = await api.getCompatibility(listing.id)
              return { ...listing, compatibility: compatData.compatibility }
            } catch {
              return listing
            }
          })
        )
      }

      if (reset) {
        setListings(finalListings)
        setHasMore(finalListings.length >= 20) // Assuming 20 per page
      } else {
        setListings(prev => [...prev, ...finalListings])
        setHasMore(finalListings.length >= 20)
        setPage(prev => prev + 1)
      }
    } catch (err: any) {
      console.error('Failed to fetch listings:', err)
      setError(err.message || 'Failed to load listings')
      toast.error('Failed to load marketplace')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreListings = () => {
    fetchListings(false)
  }

  // Get all unique skills for filter
  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    listings.forEach(listing => {
      // Handle both string arrays and object arrays
      const offering = listing.skills_offering || []
      const seeking = listing.skills_seeking || []
      
      offering.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name
        if (skillName) skills.add(skillName)
      })
      
      seeking.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name
        if (skillName) skills.add(skillName)
      })
    })
    return Array.from(skills).sort()
  }, [listings])

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const offering = listing.skills_offering || []
        const seeking = listing.skills_seeking || []
        const allSkills = [
          ...offering.map((s: any) => typeof s === 'string' ? s : s.name || s.skill_name),
          ...seeking.map((s: any) => typeof s === 'string' ? s : s.name || s.skill_name)
        ].filter(Boolean)
        
        const matchesSearch = (
          allSkills.some((skill: string) => skill.toLowerCase().includes(query)) ||
          listing.description?.toLowerCase().includes(query) ||
          listing.title?.toLowerCase().includes(query) ||
          listing.user_name?.toLowerCase().includes(query)
        )
        if (!matchesSearch) return false
      }
      
      // Skill filter
      if (selectedSkills.length > 0) {
        const offering = listing.skills_offering || []
        const seeking = listing.skills_seeking || []
        const allListingSkills = [
          ...offering.map((s: any) => typeof s === 'string' ? s : s.name || s.skill_name),
          ...seeking.map((s: any) => typeof s === 'string' ? s : s.name || s.skill_name)
        ].filter(Boolean)
        
        const hasSelectedSkill = selectedSkills.some(skill =>
          allListingSkills.includes(skill)
        )
        if (!hasSelectedSkill) return false
      }
      
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'compatibility':
          return (b.compatibility || 0) - (a.compatibility || 0)
        case 'most-skills':
          return (b.skills_offering?.length || 0) + (b.skills_seeking?.length || 0) - 
                 ((a.skills_offering?.length || 0) + (a.skills_seeking?.length || 0))
        default:
          return 0
      }
    })

    return filtered
  }, [listings, searchQuery, selectedSkills, sortBy])

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="mb-8">
            <div className="h-10 w-64 bg-primary-500/20 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-96 bg-primary-500/10 rounded animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <MarketplaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      {/* Topography overlay */}
      <div className="inner-topography-overlay" />

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">
            Find students to share skills with and start collaborating
          </p>
        </motion.div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Image 
              src="/images/3dicons-zoom-dynamic-color.png" 
              alt="Search" 
              width={20} 
              height={20} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 object-contain opacity-60"
            />
            <input
              type="text"
              placeholder="Search skills, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-100 border border-primary-500/20 rounded-xl 
                       text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                       focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/marketplace/new"
              className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                       hover:to-primary-800 rounded-xl text-white transition-all flex items-center 
                       justify-center space-x-2 shadow-lg shadow-primary-500/20 hover:shadow-xl 
                       hover:shadow-primary-500/30 font-semibold"
            >
              <Image 
                src="/images/3dicons-plus-dynamic-color.png" 
                alt="Add" 
                width={20} 
                height={20} 
                className="object-contain"
              />
              <span>Post Listing</span>
            </Link>
          </motion.div>
        </div>

        {/* Sort and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Sort */}
          <div className="flex items-center gap-2 bg-dark-100 p-1 rounded-xl border border-primary-500/20">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer px-2 py-1"
            >
              <option value="newest" className="bg-dark-100">Newest First</option>
              <option value="oldest" className="bg-dark-100">Oldest First</option>
              <option value="compatibility" className="bg-dark-100">Best Match</option>
              <option value="most-skills" className="bg-dark-100">Most Skills</option>
            </select>
          </div>

          {/* Active Filters */}
          {selectedSkills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Filters:</span>
              {selectedSkills.map(skill => (
                <motion.button
                  key={skill}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => toggleSkillFilter(skill)}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium 
                           flex items-center gap-2 hover:bg-primary-700 transition-colors"
                >
                  {skill}
                  <span className="text-xs">×</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Skill Filter Chips */}
        {allSkills.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Filter by skills:</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.slice(0, 12).map((skill) => (
                <motion.button
                  key={skill}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSkillFilter(skill)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-dark-100 text-gray-300 border border-primary-500/20 hover:border-primary-500/50'
                  }`}
                >
                  {skill}
                </motion.button>
              ))}
              {allSkills.length > 12 && (
                <span className="px-4 py-2 text-sm text-gray-400">
                  +{allSkills.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">Failed to load listings</p>
                <p className="text-red-300/80 text-sm mb-3">{error}</p>
                <button
                  onClick={() => fetchListings(true)}
                  className="text-sm text-red-300 hover:text-red-200 underline font-semibold"
                >
                  Try again →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Listings Grid */}
        <AnimatePresence mode="wait">
          {filteredAndSortedListings.length > 0 ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            >
              {filteredAndSortedListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-dark-100 to-dark-200 border border-primary-500/20 
                           rounded-2xl p-6 hover:border-primary-500/50 transition-all cursor-pointer 
                           overflow-hidden shadow-lg hover:shadow-xl hover:shadow-primary-500/20"
                >
                  {/* Gradient Overlay on Hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />

                  <Link href={`/marketplace/${listing.id}`} className="relative z-10 block">
                    {/* User Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full 
                                   flex items-center justify-center text-white font-semibold shadow-lg 
                                   shadow-primary-500/30"
                        >
                          {listing.user_avatar}
                        </motion.div>
                        <div>
                          <p className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                            {listing.user_name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Image 
                              src="/images/3dicons-clock-dynamic-color.png" 
                              alt="Time" 
                              width={12} 
                              height={12} 
                              className="object-contain opacity-60"
                            />
                            {formatDate(listing.created_at)}
                          </div>
                        </div>
                      </div>
                      {/* Compatibility Score */}
                      {listing.compatibility !== undefined && (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-500/20 rounded-lg 
                                   border border-primary-500/30"
                        >
                          <Image 
                            src="/images/3dicons-star-dynamic-color.png" 
                            alt="Match" 
                            width={16} 
                            height={16} 
                            className="object-contain"
                          />
                          <span className="text-primary-400 font-bold">
                            {listing.compatibility}%
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Title */}
                    {listing.title && (
                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-primary-300 transition-colors">
                        {listing.title}
                      </h3>
                    )}

                    {/* Skills Offering */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Offering</p>
                      <div className="flex flex-wrap gap-2">
                        {(listing.skills_offering || []).slice(0, 3).map((skill: any, i: number) => {
                          const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name || 'Unknown'
                          return (
                            <motion.span
                              key={i}
                              whileHover={{ scale: 1.1 }}
                              className="px-3 py-1 bg-gradient-to-r from-primary-500/20 to-primary-600/20 
                                       text-primary-300 rounded-full text-xs font-medium border border-primary-500/30"
                            >
                              {skillName}
                            </motion.span>
                          )
                        })}
                        {(listing.skills_offering || []).length > 3 && (
                          <span className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs">
                            +{(listing.skills_offering || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills Seeking */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Seeking</p>
                      <div className="flex flex-wrap gap-2">
                        {(listing.skills_seeking || []).slice(0, 3).map((skill: any, i: number) => {
                          const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name || 'Unknown'
                          return (
                            <motion.span
                              key={i}
                              whileHover={{ scale: 1.1 }}
                              className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 
                                       text-blue-300 rounded-full text-xs font-medium border border-blue-500/30"
                            >
                              {skillName}
                            </motion.span>
                          )
                        })}
                        {(listing.skills_seeking || []).length > 3 && (
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs">
                            +{(listing.skills_seeking || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/marketplace/${listing.id}`} className="flex-1">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                                   hover:to-primary-800 rounded-xl text-white transition-all flex items-center justify-center 
                                   gap-2 font-semibold shadow-lg shadow-primary-500/20"
                        >
                          <span>View Details</span>
                          <TrendingUp className="w-4 h-4" />
                        </motion.div>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          try {
                            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                            if (!token) {
                              toast.error('Please sign in to start a conversation')
                              router.push('/login')
                              return
                            }
                            const response = await api.getConversation(listing.user_id.toString())
                            router.push(`/chat?conversation=${response.conversationId}`)
                          } catch (error: any) {
                            toast.error(error.message || 'Failed to start conversation')
                          }
                        }}
                        className="px-4 py-2.5 bg-dark-200 hover:bg-dark-300 border border-primary-500/20 
                                 rounded-xl text-white transition-all flex items-center justify-center gap-2"
                        title="Start Chat"
                      >
                        <Image 
                          src="/images/3dicons-chat-bubble-dynamic-color.png" 
                          alt="Chat" 
                          width={16} 
                          height={16} 
                          className="object-contain"
                        />
                      </motion.button>
                      <Link href={`/profile?id=${listing.user_id}`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 py-2.5 bg-dark-200 hover:bg-dark-300 border border-primary-500/20 
                                   rounded-xl text-white transition-all flex items-center justify-center gap-2"
                          title="View Profile"
                        >
                          <Image 
                            src="/images/3dicons-boy-dynamic-color.png" 
                            alt="Profile" 
                            width={16} 
                            height={16} 
                            className="object-contain"
                          />
                        </motion.button>
                      </Link>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more listings...</span>
              </div>
            </div>
          )}

          {/* End of Results */}
          {!hasMore && filteredAndSortedListings.length > 0 && (
            <div className="mt-6 text-center text-gray-400 text-sm">
              You've reached the end of the listings
            </div>
          )}

          {filteredAndSortedListings.length === 0 && !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-400 mb-4 text-lg">
                {searchQuery || selectedSkills.length > 0 
                  ? 'No listings match your filters.' 
                  : 'No listings yet. Be the first to post!'}
              </p>
              {!searchQuery && selectedSkills.length === 0 && (
                <Link
                  href="/marketplace/new"
                  className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl 
                           text-white transition-colors font-semibold"
                >
                  Create First Listing
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
