'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Plus, Link as LinkIcon, Clock, TrendingUp, Loader2, 
         X, Edit2, Trash2, ExternalLink, FileText, BarChart3, 
         LogOut, AlertTriangle, Settings } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'skills' | 'portfolio' | 'activity' | 'edit' | 'stats' | 'settings'>('skills')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillType, setNewSkillType] = useState<'offering' | 'seeking'>('offering')
  const [newSkillLevel, setNewSkillLevel] = useState('Beginner')
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('')
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('')
  const [newPortfolioPlatform, setNewPortfolioPlatform] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const userIdParam = searchParams?.get('id')
    
    if (!token && !userIdParam) {
      router.push('/login')
      return
    }
    
    fetchUser(userIdParam)
  }, [searchParams])

  useEffect(() => {
    if (user && activeTab === 'edit') {
      setEditName(user.name || '')
      setEditAvatar(user.avatar || '')
    }
  }, [user, activeTab])

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
      toast.success('Logged out successfully')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    if (!confirm('This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?')) {
      return
    }

    setDeleting(true)
    try {
      await api.deleteAccount()
      toast.success('Account deleted successfully')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  const fetchUser = async (userIdParam: string | null = null) => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      let userId: string
      let isOwn = false
      
      if (userIdParam) {
        // Viewing another user's profile
        userId = userIdParam
        setIsOwnProfile(false)
      } else {
        // Viewing own profile
        if (!token) {
          router.push('/login')
          return
        }
        const data = await api.getCurrentUser()
        userId = data.user.id.toString()
        setIsOwnProfile(true)
        isOwn = true
      }
      
      // Fetch full user profile
      const profileData = await api.getUser(userId)
      setUser(profileData.user)
      
      // Only fetch stats for own profile
      if (isOwn) {
        try {
          const statsData = await api.getAnalytics()
          setStats(statsData)
        } catch (err) {
          // Stats are optional
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      toast.error('Failed to load profile')
      if (error.message?.includes('token') || error.message?.includes('401')) {
        if (!userIdParam) {
          router.push('/login')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/18 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/12 rounded-full blur-3xl" />
        </div>
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4 z-10" />
        <p className="text-gray-400 text-sm z-10">Loading your profile...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const skillsOffering = (Array.isArray(user.skills) ? user.skills.filter((s: any) => s?.skill_type === 'offering') : []) || []
  const skillsSeeking = (Array.isArray(user.skills) ? user.skills.filter((s: any) => s?.skill_type === 'seeking') : []) || []
  const portfolio = Array.isArray(user.portfolio) ? user.portfolio : []
  const badges = Array.isArray(user.badges) ? user.badges : []

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 left-0 w-80 h-80 bg-primary-500/16 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-500/12 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-100 border border-primary-500/20 rounded-2xl p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full 
                          flex items-center justify-center text-3xl font-bold text-white">
              {user.avatar || user.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              </div>
              <p className="text-gray-400 mb-4">{user.email} • Age {user.age}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  <span className="text-white font-semibold">{skillsOffering.length + skillsSeeking.length}</span>
                  <span className="text-gray-400 text-sm">Total Skills</span>
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('edit')}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                         hover:to-primary-800 rounded-lg text-white transition-all font-semibold shadow-lg 
                         shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
              >
                Edit Profile
              </motion.button>
            )}
            {!isOwnProfile && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                    if (!token) {
                      toast.error('Please sign in to start a conversation')
                      router.push('/login')
                      return
                    }
                    const response = await api.getConversation(user.id.toString())
                    router.push(`/chat?conversation=${response.conversationId}`)
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to start conversation')
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                         hover:to-primary-800 rounded-lg text-white transition-all font-semibold flex items-center 
                         gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
              >
                  <Image 
                    src="/images/3dicons-chat-bubble-dynamic-color.png" 
                    alt="Chat" 
                    width={16} 
                    height={16} 
                    className="object-contain"
                  />
                  Start Chat
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-primary-500/20 overflow-x-auto">
          {[
            { id: 'skills', label: 'Skills' },
            { id: 'portfolio', label: 'Portfolio' },
            ...(isOwnProfile ? [
              { id: 'stats', label: 'Statistics' },
              { id: 'activity', label: 'Activity' },
              { id: 'edit', label: 'Edit Profile' },
              { id: 'settings', label: 'Settings' },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'skills' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Skills Offering */}
                <div className="bg-dark-100 border border-primary-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Skills I'm Offering</h2>
                    {isOwnProfile && (
                      <button 
                        onClick={() => {
                          setNewSkillType('offering')
                          setShowAddSkill(true)
                        }}
                        className="p-2 hover:bg-dark-200 rounded-lg transition-colors hover:scale-110"
                        title="Add skill"
                      >
                        <Plus className="w-5 h-5 text-primary-400" />
                      </button>
                    )}
                  </div>
                  {skillsOffering.length > 0 ? (
                    <div className="space-y-3">
                      {skillsOffering.map((skill: any, i: number) => (
                        <div
                          key={skill.id || i}
                          className="flex items-center justify-between p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Image 
                              src="/images/3dicons-star-dynamic-color.png" 
                              alt="Skill" 
                              width={20} 
                              height={20} 
                              className="object-contain"
                            />
                            <div>
                              <p className="text-white font-semibold">{skill.name}</p>
                              {skill.level && (
                                <p className="text-sm text-gray-400">{skill.level}</p>
                              )}
                            </div>
                          </div>
                          {isOwnProfile && skill.id && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to remove this skill?')) {
                                  try {
                                    await api.deleteSkill(skill.id.toString())
                                    toast.success('Skill removed')
                                    fetchUser()
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to remove skill')
                                  }
                                }
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Remove skill"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">No skills offering yet</p>
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setNewSkillType('offering')
                            setShowAddSkill(true)
                          }}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm"
                        >
                          Add Your First Skill
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Skills Seeking */}
                <div className="bg-dark-100 border border-primary-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Skills I'm Seeking</h2>
                    {isOwnProfile && (
                      <button 
                        onClick={() => {
                          setNewSkillType('seeking')
                          setShowAddSkill(true)
                        }}
                        className="p-2 hover:bg-dark-200 rounded-lg transition-colors hover:scale-110"
                        title="Add skill"
                      >
                        <Plus className="w-5 h-5 text-primary-400" />
                      </button>
                    )}
                  </div>
                  {skillsSeeking.length > 0 ? (
                    <div className="space-y-3">
                      {skillsSeeking.map((skill: any, i: number) => (
                        <div
                          key={skill.id || i}
                          className="flex items-center justify-between p-3 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Image 
                              src="/images/3dicons-star-dynamic-color.png" 
                              alt="Skill" 
                              width={20} 
                              height={20} 
                              className="object-contain"
                            />
                            <div>
                              <p className="text-white font-semibold">{skill.name}</p>
                              {skill.level && (
                                <p className="text-sm text-gray-400">{skill.level}</p>
                              )}
                            </div>
                          </div>
                          {isOwnProfile && skill.id && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to remove this skill?')) {
                                  try {
                                    await api.deleteSkill(skill.id.toString())
                                    toast.success('Skill removed')
                                    fetchUser()
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to remove skill')
                                  }
                                }
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Remove skill"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">No skills seeking yet</p>
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            setNewSkillType('seeking')
                            setShowAddSkill(true)
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
                        >
                          Add Your First Skill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'portfolio' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-dark-100 border border-primary-500/20 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Portfolio Links</h2>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setShowAddPortfolio(true)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg 
                               text-white transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  )}
                </div>
                {portfolio && portfolio.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <LinkIcon className="w-5 h-5 text-primary-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{item.title}</p>
                            <p className="text-sm text-gray-400">{item.platform || 'Portfolio'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-primary-500/20 rounded-lg transition-colors"
                            title="Visit link"
                          >
                            <ExternalLink className="w-4 h-4 text-primary-400" />
                          </a>
                          {isOwnProfile && (
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to remove this portfolio link?')) {
                                  try {
                                    await api.deletePortfolioLink(item.id.toString())
                                    toast.success('Portfolio link removed')
                                    fetchUser()
                                  } catch (error: any) {
                                    toast.error(error.message || 'Failed to remove link')
                                  }
                                }
                              }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Remove link"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LinkIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No portfolio links yet</p>
                    <button
                      onClick={() => setShowAddPortfolio(true)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm"
                    >
                      Add Portfolio Link
                    </button>
                  </div>
                )}

                {/* Add Portfolio Modal */}
                {showAddPortfolio && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowAddPortfolio(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-dark-100 border border-primary-500/20 rounded-xl p-6 max-w-md w-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Add Portfolio Link</h3>
                        <button
                          onClick={() => setShowAddPortfolio(false)}
                          className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newPortfolioTitle}
                            onChange={(e) => setNewPortfolioTitle(e.target.value)}
                            placeholder="e.g., My GitHub Profile"
                            className="w-full px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                                     text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                     focus:ring-primary-500"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            URL
                          </label>
                          <input
                            type="url"
                            value={newPortfolioUrl}
                            onChange={(e) => setNewPortfolioUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                                     text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                     focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Platform (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPortfolioPlatform}
                            onChange={(e) => setNewPortfolioPlatform(e.target.value)}
                            placeholder="e.g., GitHub, Behance, Dribbble"
                            className="w-full px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                                     text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                     focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!newPortfolioTitle.trim() || !newPortfolioUrl.trim()) {
                                toast.error('Please fill in title and URL')
                                return
                              }
                              try {
                                await api.addPortfolioLink({
                                  title: newPortfolioTitle.trim(),
                                  url: newPortfolioUrl.trim(),
                                  platform: newPortfolioPlatform.trim() || undefined,
                                })
                                toast.success('Portfolio link added successfully!')
                                setNewPortfolioTitle('')
                                setNewPortfolioUrl('')
                                setNewPortfolioPlatform('')
                                setShowAddPortfolio(false)
                                fetchUser()
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to add portfolio link')
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg 
                                     text-white font-semibold transition-colors"
                          >
                            Add Link
                          </button>
                          <button
                            onClick={() => {
                              setShowAddPortfolio(false)
                              setNewPortfolioTitle('')
                              setNewPortfolioUrl('')
                              setNewPortfolioPlatform('')
                            }}
                            className="px-4 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg 
                                     text-white font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-dark-100 border border-primary-500/20 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                {stats?.recentActivity && Array.isArray(stats.recentActivity) && stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity: any, idx: number) => (
                      <div
                        key={activity.id || idx}
                        className="flex items-start gap-3 p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors"
                      >
                        <div className="p-2 bg-primary-500/10 rounded-lg">
                          {activity.type === 'trade' && (
                            <Image 
                              src="/images/3dicons-tools-dynamic-color.png" 
                              alt="Trade" 
                              width={20} 
                              height={20} 
                              className="object-contain"
                            />
                          )}
                          {activity.type === 'application' && (
                            <Image 
                              src="/images/3dicons-chat-bubble-dynamic-color.png" 
                              alt="Application" 
                              width={20} 
                              height={20} 
                              className="object-contain"
                            />
                          )}
                          {activity.type === 'skill' && (
                            <Image 
                              src="/images/3dicons-medal-dynamic-color.png" 
                              alt="Skill" 
                              width={20} 
                              height={20} 
                              className="object-contain"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white">{activity.description}</p>
                          <p className="text-sm text-gray-400 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {stats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-dark-200 border border-primary-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Image 
                            src="/images/3dicons-tools-dynamic-color.png" 
                            alt="Trades" 
                            width={24} 
                            height={24} 
                            className="object-contain"
                          />
                          <h3 className="text-lg font-semibold text-white">Trades</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total</span>
                            <span className="text-white font-bold">{stats?.totalTrades || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Completed</span>
                            <span className="text-primary-400 font-semibold">{stats?.completedTrades || 0}</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-primary-500/20">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Completion Rate</span>
                              <span className="text-white font-bold">
                                {stats?.totalTrades && stats.totalTrades > 0 
                                  ? (((stats.completedTrades || 0) / stats.totalTrades) * 100).toFixed(0)
                                  : 0}%
                              </span>
                            </div>
                            <div className="mt-2 h-2 bg-dark-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                                style={{ 
                                  width: `${stats?.totalTrades && stats.totalTrades > 0 
                                    ? ((stats.completedTrades || 0) / stats.totalTrades) * 100 
                                    : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-dark-200 border border-primary-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Image 
                          src="/images/3dicons-chat-bubble-dynamic-color.png" 
                          alt="Applications" 
                          width={24} 
                          height={24} 
                          className="object-contain"
                        />
                        <h3 className="text-lg font-semibold text-white">Applications</h3>
                      </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Accepted</span>
                            <span className="text-green-400 font-bold">{stats?.acceptedApplications || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pending</span>
                            <span className="text-yellow-400 font-semibold">{stats?.pendingApplications || 0}</span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-primary-500/20">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Acceptance Rate</span>
                              <span className="text-white font-bold">
                                {stats?.acceptedApplications && stats?.pendingApplications && (stats.acceptedApplications + stats.pendingApplications) > 0
                                  ? ((stats.acceptedApplications / (stats.acceptedApplications + stats.pendingApplications)) * 100).toFixed(0)
                                  : 0}%
                              </span>
                            </div>
                            <div className="mt-2 h-2 bg-dark-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                style={{ 
                                  width: `${stats?.acceptedApplications && stats?.pendingApplications && (stats.acceptedApplications + stats.pendingApplications) > 0
                                    ? (stats.acceptedApplications / (stats.acceptedApplications + stats.pendingApplications)) * 100 
                                    : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-200 border border-primary-500/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Performance</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Avg Response Time</p>
                          <p className="text-white text-2xl font-bold">
                            {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(1)}h` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Skills Offered</p>
                          <p className="text-white text-2xl font-bold">{stats?.skillsOffered || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Skills Seeking</p>
                          <p className="text-white text-2xl font-bold">{stats?.skillsSeeking || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Total Skills</p>
                          <p className="text-white text-2xl font-bold">
                            {(stats?.skillsOffered || 0) + (stats?.skillsSeeking || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No statistics available yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Account Settings */}
                <div className="bg-dark-100 border border-primary-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Image 
                      src="/images/3dicons-tools-dynamic-color.png" 
                      alt="Settings" 
                      width={24} 
                      height={24} 
                      className="object-contain"
                    />
                    <h2 className="text-xl font-bold text-white">Account Settings</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Logout */}
                    <div className="p-4 bg-dark-200 rounded-lg border border-primary-500/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold mb-1">Log Out</h3>
                          <p className="text-sm text-gray-400">Sign out of your account</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg 
                                   text-white font-semibold transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-dark-100 border border-red-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                  </div>

                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-2">Delete Account</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Once you delete your account, there is no going back. This will permanently delete:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-4">
                        <li>All your listings and applications</li>
                        <li>Your profile, skills, and portfolio</li>
                        <li>All your messages and conversations</li>
                        <li>Your statistics and activity history</li>
                      </ul>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg 
                                 text-white font-semibold transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-4 py-2.5 bg-dark-200 border border-red-500/30 rounded-lg 
                                     text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                                     focus:ring-red-500 focus:border-red-500/50 transition-all"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting || deleteConfirmText !== 'DELETE'}
                            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 
                                     disabled:cursor-not-allowed rounded-lg text-white font-semibold 
                                     transition-colors flex items-center gap-2"
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Permanently Delete Account
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            disabled={deleting}
                            className="px-6 py-2.5 bg-dark-200 hover:bg-dark-300 rounded-lg 
                                     text-white font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'edit' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-dark-100 border border-primary-500/20 rounded-xl p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName || user.name || ''}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                               text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Avatar (2 characters)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editAvatar || user.avatar || ''}
                      onChange={(e) => setEditAvatar(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                               text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500/50"
                      placeholder="e.g., JD"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await api.updateProfile({
                            name: editName || user.name,
                            avatar: editAvatar || user.avatar,
                          })
                          toast.success('Profile updated successfully!')
                          fetchUser()
                          setActiveTab('skills')
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to update profile')
                        }
                      }}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg 
                               text-white font-semibold transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditName('')
                        setEditAvatar('')
                        setActiveTab('skills')
                      }}
                      className="px-6 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg 
                               text-white font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="bg-dark-100 border border-primary-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Badges</h3>
              {badges && badges.length > 0 ? (
                <div className="space-y-3">
                  {badges.map((badge: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-dark-200 rounded-lg"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-gray-400">Earned {new Date(badge.earned_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">No badges yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
