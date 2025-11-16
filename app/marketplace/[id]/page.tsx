'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Sparkles, Send, Video, Phone, MessageCircle, User, Check, X, Clock, Palette } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import VideoCall from '@/components/VideoCall'
import VoiceCall from '@/components/VoiceCall'
import Whiteboard from '@/components/Whiteboard'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [compatibility, setCompatibility] = useState<number | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  useEffect(() => {
    // Get current user
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }

    // Fetch listing details
    fetchListing()
    fetchCompatibility()
  }, [params.id])

  useEffect(() => {
    if (listing && currentUser) {
      const ownsListing = listing.user_id === currentUser.id || listing.user_id?.toString() === currentUser.id?.toString()
      setIsOwner(ownsListing)
      if (ownsListing) {
        fetchApplications()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing, currentUser])

  const fetchListing = async () => {
    try {
      const data = await api.getListing(params.id as string)
      setListing(data.listing)
    } catch (error: any) {
      console.error('Failed to fetch listing:', error)
      toast.error(error.message || 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompatibility = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const data = await api.getCompatibility(params.id as string)
      setCompatibility(data.compatibility)
    } catch (error) {
      console.error('Failed to fetch compatibility:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications(params.id as string)
      setApplications(data.applications || [])
    } catch (error: any) {
      console.error('Failed to fetch applications:', error)
      // Silently fail if not owner
    }
  }

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updateApplicationStatus(applicationId, status)
      toast.success(`Application ${status} successfully! The applicant has been notified.`, { duration: 4000 })
      fetchApplications()
      
      // If accepted, create conversation automatically
      if (status === 'accepted') {
        const application = applications.find(a => a.id.toString() === applicationId)
        if (application) {
          try {
            const response = await api.getConversation(application.applicant_id.toString())
            toast.success('Conversation created! You can now chat with the applicant.', { duration: 3000 })
          } catch (error) {
            // Conversation might already exist, that's fine
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update application')
    }
  }

  const handleApply = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please sign in to apply')
        router.push('/login')
        return
      }

      await api.submitApplication(listing.id, applicationMessage)
      toast.success('Application submitted successfully! The listing owner will be notified.', { duration: 4000 })
      setTimeout(() => {
        router.push('/marketplace')
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        </div>
        <div className="inner-topography-overlay" />
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4 z-10" />
        <p className="text-gray-400 text-sm z-10">Loading listing details...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-dark-50 relative overflow-hidden">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        </div>
        {/* Topography */}
        <div className="inner-topography-overlay" />

        <Navbar />
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] pt-28">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
            <p className="text-gray-400 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg text-white font-semibold transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/12 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Marketplace</span>
        </button>

        {/* Listing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-100 border border-primary-500/20 rounded-2xl p-8 mb-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-500 
                            rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {listing.user_avatar || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">{listing.user_name}</h1>
                  <Link 
                    href={`/profile?id=${listing.user_id}`}
                    className="p-1.5 hover:bg-dark-200 rounded-lg transition-colors"
                    title="View Profile"
                  >
                    <User className="w-4 h-4 text-gray-400 hover:text-primary-400" />
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                        if (!token) {
                          toast.error('Please sign in to start a conversation')
                          return
                        }
                        const response = await api.getConversation(listing.user_id.toString())
                        window.location.href = `/chat?conversation=${response.conversationId}`
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to start conversation')
                      }
                    }}
                    className="p-1.5 hover:bg-dark-200 rounded-lg transition-colors"
                    title="Start Chat"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-400 hover:text-primary-400" />
                  </button>
                </div>
              </div>
            </div>
            {compatibility !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary-400" />
                <span className="text-primary-400 font-semibold">{compatibility}% Match</span>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">About</h2>
              <p className="text-gray-300">{listing.description}</p>
            </div>
          )}

          {/* Skills Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Skills Offering */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Skills Offering</h3>
              <div className="flex flex-wrap gap-2">
                {(listing.skills_offering || []).map((skill: any, i: number) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name || 'Unknown'
                  return (
                    <span
                      key={i}
                      className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-full"
                    >
                      {skillName}
                    </span>
                  )
                })}
                {(!listing.skills_offering || listing.skills_offering.length === 0) && (
                  <span className="text-gray-500 text-sm">No skills listed</span>
                )}
              </div>
            </div>

            {/* Skills Seeking */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Skills Seeking</h3>
              <div className="flex flex-wrap gap-2">
                {(listing.skills_seeking || []).map((skill: any, i: number) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill_name || 'Unknown'
                  return (
                    <span
                      key={i}
                      className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full"
                    >
                      {skillName}
                    </span>
                  )
                })}
                {(!listing.skills_seeking || listing.skills_seeking.length === 0) && (
                  <span className="text-gray-500 text-sm">No skills listed</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Applications Section - Show for owner, Application Form for others */}
        {isOwner ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-100 border border-primary-500/20 rounded-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Applications</h2>
              <div className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-semibold">
                {applications.length} {applications.length === 1 ? 'application' : 'applications'}
              </div>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application: any) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-200 border border-primary-500/20 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full 
                                      flex items-center justify-center text-white font-semibold">
                          {application.applicant_avatar || application.applicant_name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{application.applicant_name}</h3>
                            <Link
                              href={`/profile?id=${application.applicant_id}`}
                              className="p-1 hover:bg-dark-300 rounded transition-colors"
                              title="View Profile"
                            >
                              <User className="w-4 h-4 text-gray-400 hover:text-primary-400" />
                            </Link>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await api.getConversation(application.applicant_id.toString())
                                  router.push(`/chat?conversation=${response.conversationId}`)
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to start conversation')
                                }
                              }}
                              className="p-1 hover:bg-dark-300 rounded transition-colors"
                              title="Start Chat"
                            >
                              <MessageCircle className="w-4 h-4 text-gray-400 hover:text-primary-400" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>{new Date(application.created_at).toLocaleDateString()}</span>
                            {application.compatibility_score && (
                              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded">
                                {application.compatibility_score}% Match
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        application.status === 'accepted' 
                          ? 'bg-green-500/20 text-green-300'
                          : application.status === 'rejected'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {application.status}
                      </div>
                    </div>

                    {application.message && (
                      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{application.message}</p>
                    )}

                    {application.status === 'pending' && (
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApplicationStatus(application.id.toString(), 'accepted')}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 
                                   hover:to-green-800 rounded-lg text-white font-semibold transition-all flex items-center 
                                   justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApplicationStatus(application.id.toString(), 'rejected')}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 
                                   hover:to-red-800 rounded-lg text-white font-semibold transition-all flex items-center 
                                   justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No applications yet</p>
                <p className="text-sm text-gray-500">Applications will appear here when students apply to your listing</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-100 border border-primary-500/20 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">Apply for Skill Trade</h2>
              {compatibility !== null && (
                <div className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm font-semibold">
                  {compatibility}% Match
                </div>
              )}
            </div>
            
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Tip:</strong> A personalized message increases your chances of being accepted. 
                Mention specific skills you can offer and what you hope to learn.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message <span className="text-gray-500 text-xs">(Optional but recommended)</span>
              </label>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="Hi! I'm interested in trading skills. I can help you with [your skills] and I'm looking forward to learning [their skills]. Let's connect!"
                className="w-full px-4 py-3 bg-dark-200 border border-primary-500/20 rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 
                         transition-colors resize-none"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                {applicationMessage.length} characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                         hover:to-primary-800 rounded-lg text-white font-semibold transition-all flex items-center 
                         justify-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
              >
                <Send className="w-5 h-5" />
                Submit Application
              </motion.button>
            </div>

            {/* Learning Session Options */}
            <div className="mt-6 pt-6 border-t border-primary-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Learning Session Options</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      toast.error('Please sign in to start a video call')
                      router.push('/login')
                      return
                    }
                    setShowVideoCall(true)
                  }}
                  className="p-4 bg-dark-200 hover:bg-dark-300 rounded-lg transition-all 
                           border border-primary-500/20 flex flex-col items-center gap-2 hover:border-primary-500/50"
                >
                  <Video className="w-6 h-6 text-primary-400" />
                  <span className="text-white text-sm font-semibold">Video Call</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      toast.error('Please sign in to start a voice call')
                      router.push('/login')
                      return
                    }
                    setShowVoiceCall(true)
                  }}
                  className="p-4 bg-dark-200 hover:bg-dark-300 rounded-lg transition-all 
                           border border-primary-500/20 flex flex-col items-center gap-2 hover:border-primary-500/50"
                >
                  <Phone className="w-6 h-6 text-primary-400" />
                  <span className="text-white text-sm font-semibold">Voice Call</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const token = localStorage.getItem('token')
                    if (!token) {
                      toast.error('Please sign in to open whiteboard')
                      router.push('/login')
                      return
                    }
                    setShowWhiteboard(true)
                  }}
                  className="p-4 bg-dark-200 hover:bg-dark-300 rounded-lg transition-all 
                           border border-primary-500/20 flex flex-col items-center gap-2 hover:border-primary-500/50"
                >
                  <Palette className="w-6 h-6 text-primary-400" />
                  <span className="text-white text-sm font-semibold">Whiteboard</span>
                </motion.button>
              </div>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Start interactive learning sessions with video, voice, or collaborative whiteboard
              </p>
            </div>
          </motion.div>
        )}

        {/* Video Call */}
        {listing && (
          <VideoCall
            isOpen={showVideoCall}
            onClose={() => setShowVideoCall(false)}
            otherUserId={listing.user_id}
            otherUserName={listing.user_name}
          />
        )}

        {/* Voice Call */}
        {listing && (
          <VoiceCall
            isOpen={showVoiceCall}
            onClose={() => setShowVoiceCall(false)}
            otherUserId={listing.user_id}
            otherUserName={listing.user_name}
          />
        )}

        {/* Whiteboard */}
        {listing && (
          <Whiteboard
            isOpen={showWhiteboard}
            onClose={() => setShowWhiteboard(false)}
            otherUserId={listing.user_id}
            otherUserName={listing.user_name}
          />
        )}
      </div>
    </div>
  )
}

