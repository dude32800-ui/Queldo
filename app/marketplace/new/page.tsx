'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { 
  Plus, X, ArrowLeft, Save, Eye, Type
} from 'lucide-react'
import MarkdownEditor from '@/components/MarkdownEditor'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type FontFamily = 'sans' | 'serif' | 'mono'
type FontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl'

export default function NewListingPage() {
  const router = useRouter()
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillsOffering: [] as string[],
    skillsSeeking: [] as string[],
  })
  const [newSkillOffering, setNewSkillOffering] = useState('')
  const [newSkillSeeking, setNewSkillSeeking] = useState('')
  const [loading, setLoading] = useState(false)
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans')
  const [fontSize, setFontSize] = useState('base')
  const [images, setImages] = useState<string[]>([])
  const [editorContent, setEditorContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const addSkillOffering = () => {
    if (newSkillOffering.trim() && !formData.skillsOffering.includes(newSkillOffering.trim())) {
      setFormData({
        ...formData,
        skillsOffering: [...formData.skillsOffering, newSkillOffering.trim()],
      })
      setNewSkillOffering('')
    }
  }

  const removeSkillOffering = (skill: string) => {
    setFormData({
      ...formData,
      skillsOffering: formData.skillsOffering.filter(s => s !== skill),
    })
  }

  const addSkillSeeking = () => {
    if (newSkillSeeking.trim() && !formData.skillsSeeking.includes(newSkillSeeking.trim())) {
      setFormData({
        ...formData,
        skillsSeeking: [...formData.skillsSeeking, newSkillSeeking.trim()],
      })
      setNewSkillSeeking('')
    }
  }

  const removeSkillSeeking = (skill: string) => {
    setFormData({
      ...formData,
      skillsSeeking: formData.skillsSeeking.filter(s => s !== skill),
    })
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.skillsOffering.length === 0 || formData.skillsSeeking.length === 0) {
      toast.error('Please add at least one skill offering and one skill seeking')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please sign in to create a listing')
        router.push('/login')
        return
      }

      await api.createListing({
        ...formData,
        description: editorContent,
        images: images,
      })
      toast.success('Listing created successfully!', { duration: 3000 })
      setTimeout(() => {
        router.push('/marketplace')
      }, 500)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-dark-50 flex flex-col relative overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 left-1/3 w-80 h-80 bg-primary-500/18 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
      </div>
      {/* Topography */}
      <div className="inner-topography-overlay" />

      <Navbar />
      
      <div className="relative flex-1 flex flex-col overflow-hidden pt-20">
        {/* Header Bar */}
        <div className="border-b border-primary-500/20 bg-dark-100/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-primary-500/20" />
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Listing</h1>
              <p className="text-xs text-gray-500 mt-0.5">Share your skills and find learning partners</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e)
              }}
              disabled={loading || formData.skillsOffering.length === 0 || formData.skillsSeeking.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 
                       hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg 
                       text-white font-semibold transition-all flex items-center gap-2 shadow-lg 
                       shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Publishing...' : 'Publish'}
            </motion.button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Skills & Metadata */}
          <div className="w-80 border-r border-primary-500/20 bg-dark-100/30 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Title <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Looking for a coding partner"
                maxLength={100}
                className="w-full px-4 py-2.5 bg-dark-200 border border-primary-500/20 rounded-lg 
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-primary-500 focus:border-primary-500/50 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Skills Offering */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Skills I'm Offering *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkillOffering}
                  onChange={(e) => setNewSkillOffering(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffering())}
                  placeholder="e.g., Graphic Design"
                  className="flex-1 px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                           focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={addSkillOffering}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg 
                           text-white transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skillsOffering.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full 
                             flex items-center gap-2 text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkillOffering(skill)}
                      className="hover:text-primary-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills Seeking */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Skills I'm Seeking *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkillSeeking}
                  onChange={(e) => setNewSkillSeeking(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillSeeking())}
                  placeholder="e.g., Web Development"
                  className="flex-1 px-4 py-2 bg-dark-200 border border-primary-500/20 rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                           focus:ring-primary-500 focus:border-primary-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={addSkillSeeking}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg 
                           text-white transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skillsSeeking.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full 
                             flex items-center gap-2 text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkillSeeking(skill)}
                      className="hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Uploaded Images */}
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Uploaded Images
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-20 object-cover rounded-lg" loading="lazy" />
                      <button
                        onClick={() => {
                          setImages(images.filter((_, idx) => idx !== i))
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const files = Array.from(e.dataTransfer.files)
                files.forEach(file => {
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      const imageUrl = reader.result as string
                      setImages([...images, imageUrl])
                    }
                    reader.readAsDataURL(file)
                  }
                })
              }}
              className={`mt-4 p-6 border-2 border-dashed rounded-lg transition-colors ${
                isDragging 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-primary-500/30 hover:border-primary-500/50'
              }`}
            >
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Drag & drop images here</p>
                <p className="text-xs text-gray-500">or click to upload</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    files.forEach(file => {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const imageUrl = reader.result as string
                        setImages(prev => [...prev, imageUrl])
                      }
                      reader.readAsDataURL(file)
                    })
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="mt-2 inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm cursor-pointer transition-colors"
                >
                  Select Images
                </label>
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <MarkdownEditor
              content={editorContent}
              onChange={setEditorContent}
              placeholder="Start writing your listing description here... You can use markdown, add images, format text, and more!"
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
