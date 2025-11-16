'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { 
  ArrowRight,
  ArrowDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Info
} from 'lucide-react'

// Feature Card Component with Minimalistic Flip Animation
function FeatureCard({ feature, index, isInView }: { feature: any, index: number, isInView: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1 }}
      className="h-64 perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 backface-hidden bg-dark-100/50 border border-primary-500/20 
                     rounded-xl p-6 backdrop-blur-sm hover:border-primary-500/40 transition-all 
                     cursor-pointer overflow-hidden flex flex-col">
          <motion.div
            className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl 
                     flex items-center justify-center mb-4 shadow-lg p-3`}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Image 
              src={feature.icon} 
              alt={feature.title}
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-grow">{feature.description}</p>
          
          {/* Simple Hover Indicator */}
          <div className="mt-4 text-primary-400 text-xs font-semibold flex items-center gap-1">
            <span>Hover to explore</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br 
                     from-primary-500/20 to-blue-500/20 border border-primary-500/40 
                     rounded-xl p-6 backdrop-blur-sm overflow-hidden flex flex-col justify-center">
          <motion.div
            className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-xl 
                     flex items-center justify-center mb-4 mx-auto shadow-xl p-4`}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Image 
              src={feature.icon} 
              alt={feature.title}
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3 text-center">{feature.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed text-center mb-4">
            {feature.description}
          </p>
            <div className="flex items-center justify-center gap-2 text-primary-300 text-xs font-semibold">
              <Image 
                src="/images/3dicons-star-dynamic-color.png" 
                alt="sparkle"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span>Exclusive to Queldo</span>
            </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const testimonialsRef = useRef(null)
  const faqRef = useRef(null)
  const howItWorksRef = useRef(null)
  const featuresRef2 = useRef(null)
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 })
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 })
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 })
  const faqInView = useInView(faqRef, { once: true, amount: 0.2 })
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.2 })
  const features2InView = useInView(featuresRef2, { once: true, amount: 0.2 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  const skillIcons = [
    { icon: '/images/3dicons-computer-dynamic-color.png', color: 'from-blue-500 to-cyan-500', label: 'Code' },
    { icon: '/images/3dicons-painting-kit-dynamic-color.png', color: 'from-pink-500 to-rose-500', label: 'Design' },
    { icon: '/images/3dicons-music-dynamic-color.png', color: 'from-purple-500 to-indigo-500', label: 'Music' },
    { icon: '/images/3dicons-camera-dynamic-color.png', color: 'from-amber-500 to-orange-500', label: 'Photo' },
    { icon: '/images/3dicons-notebook-dynamic-color.png', color: 'from-green-500 to-emerald-500', label: 'Write' },
  ]

  const features = [
    {
      icon: '/images/3dicons-star-dynamic-color.png',
      title: 'Smart Matching',
      description: 'Easily connect with students who have what you need and what you offer',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: '/images/3dicons-chat-bubble-dynamic-color.png',
      title: 'Real-time Learning',
      description: 'Connect through video, voice, or chat for interactive skill sessions',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: '/images/3dicons-medal-dynamic-color.png',
      title: 'Skill Verification',
      description: 'Showcase your portfolio and get verified by the community',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: '/images/3dicons-forward-dynamic-color.png',
      title: 'Track Progress',
      description: 'See how much you have learned and how much you have helped others',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: '/images/3dicons-clock-dynamic-color.png',
      title: 'Flexible Schedule',
      description: 'Learn at your own pace with sessions that fit your schedule',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: '/images/3dicons-boy-dynamic-color.png',
      title: 'Community Support',
      description: 'Join a community of students helping each other succeed',
      color: 'from-pink-500 to-pink-600',
    },
  ]

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Graphic Designer',
      content: 'I learned web development while teaching design. Queldo made it so easy to find the perfect match!',
      rating: 5,
      avatar: 'AC',
    },
    {
      name: 'Sam Johnson',
      role: 'Mathematics Student',
      content: 'Trading math skills for music production was the best decision. The community is amazing!',
      rating: 5,
      avatar: 'SJ',
    },
    {
      name: 'Jordan Lee',
      role: 'Content Creator',
      content: 'Found my video editing partner in days. We\'ve been collaborating ever since!',
      rating: 5,
      avatar: 'JL',
    },
    {
      name: 'Taylor Kim',
      role: 'UI/UX Designer',
      content: 'The skill matching algorithm is incredible. Found my perfect coding partner in hours!',
      rating: 5,
      avatar: 'TK',
    },
  ]

  const faqs = [
    {
      question: 'How does skill matching work?',
      answer: 'Our AI algorithm analyzes your skills, interests, and learning goals to find students with complementary skills. When you post what you can teach and what you want to learn, we match you with others who need what you offer and have what you seek.',
    },
    {
      question: 'Is Queldo free to use?',
      answer: 'Yes! Queldo is completely free for all students. We believe in making skill-sharing accessible to everyone. There are no hidden fees or premium tiers - just pure skill exchange.',
    },
    {
      question: 'How do I verify my skills?',
      answer: 'You can verify your skills by linking your portfolio (GitHub, Behance, Dribbble, etc.) or by getting verified by other community members who have worked with you. Verified skills get a special badge!',
    },
    {
      question: 'What age range is Queldo for?',
      answer: 'Queldo is designed specifically for students aged 13-18. This ensures a safe, age-appropriate learning environment where everyone can feel comfortable sharing and learning.',
    },
    {
      question: 'How do I earn Queldo Credits?',
      answer: 'You earn credits by helping other students learn! Complete skill trades, mentor others, and contribute to the community. The more you help, the more credits you earn and the higher you rank on the leaderboard.',
    },
    {
      question: 'Can I learn multiple skills at once?',
      answer: 'Absolutely! You can have multiple active skill trades going at the same time. Many students learn 2-3 skills simultaneously while teaching their own expertise to others.',
    },
  ]


  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary-500/20 to-blue-500/20 blur-3xl"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            stiffness: 50,
            damping: 30,
          }}
        />
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        {/* Particle Background */}
        <ParticleBackground particleCount={25} />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 pt-28">
        <motion.div
          style={{ opacity, scale, y }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6"
              >
                <span className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-sm font-semibold">
                  Skill Sharing for Students
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
                className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
              >
                Trade Skills,
                <br />
                <span className="gradient-text">Grow Together</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed max-w-xl"
              >
                Connect with students who have what you need. Share what you know. 
                Build skills together through collaborative learning.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <Link
                  href="/register"
                  className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 
                           text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 font-semibold
                           shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105"
                  aria-label="Start Trading Skills - Sign Up"
                >
                  <span>Start Trading Skills</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                <Link
                  href="/marketplace"
                  className="px-8 py-4 bg-dark-100/50 border-2 border-primary-500/30 hover:border-primary-500/50 
                           text-white rounded-xl transition-all duration-300 flex items-center justify-center font-semibold
                           backdrop-blur-sm hover:bg-dark-100/70"
                >
                  Browse Marketplace
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-primary-500/10"
              >
                <div>
                  <div className="text-3xl font-bold text-white mb-1">500+</div>
                  <div className="text-sm text-gray-400">Active Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">1,200+</div>
                  <div className="text-sm text-gray-400">Skill Trades</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">50+</div>
                  <div className="text-sm text-gray-400">Skills Available</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative w-full aspect-square max-w-2xl mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="relative w-64 h-64 bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 
                             rounded-3xl flex items-center justify-center shadow-2xl p-8"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Image 
                      src="/images/3dicons-bulb-dynamic-color.png" 
                      alt="skill matching"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-contain"
                    />
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent" />
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary-400/50 to-blue-400/50 blur-xl" />
                  </motion.div>
                </div>

                {skillIcons.map((skill, i) => {
                  const angle = (i * 360) / skillIcons.length
                  const radius = 180
                  const x = Math.cos((angle * Math.PI) / 180) * radius
                  const y = Math.sin((angle * Math.PI) / 180) * radius

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
                        y: [0, -15, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    >
                      <div className={`w-20 h-20 bg-gradient-to-br ${skill.color} rounded-2xl 
                                     flex items-center justify-center shadow-xl backdrop-blur-sm
                                     border border-white/10 p-2`}>
                        <Image 
                          src={skill.icon} 
                          alt={skill.label}
                          width={40}
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs text-gray-400 font-medium">{skill.label}</span>
                      </div>
                    </motion.div>
                  )
                })}

                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  {skillIcons.map((_, i) => {
                    const angle = (i * 360) / skillIcons.length
                    const radius = 180
                    const x = Math.cos((angle * Math.PI) / 180) * radius
                    const y = Math.sin((angle * Math.PI) / 180) * radius
                    return (
                      <line
                        key={i}
                        x1="50%"
                        y1="50%"
                        x2={`calc(50% + ${x}px)`}
                        y2={`calc(50% + ${y}px)`}
                        stroke="rgba(147, 51, 234, 0.3)"
                        strokeWidth="1"
                      />
                    )
                  })}
                </svg>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-gray-400"
            >
              <span className="text-sm">Scroll to explore</span>
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section - Minimalistic */}
      <section ref={howItWorksRef} className="relative z-10 border-t border-primary-500/10 bg-dark-100/30 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to start trading skills and growing together
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line with Forward Icons */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2 z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500/0 via-primary-500/30 to-primary-500/0 relative"
                initial={{ scaleX: 0 }}
                animate={howItWorksInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.3 }}
                style={{ originX: 0 }}
              >
                {/* Forward Icons along the line */}
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${(i + 1) * 50}%` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={howItWorksInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.8 + i * 0.2 }}
                  >
                    <Image 
                      src="/images/3dicons-forward-dynamic-color.png" 
                      alt="forward"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  number: '01',
                  icon: '/images/3dicons-target-dynamic-color.png',
                  title: 'Post Your Skills',
                  description: 'Share what you can teach and what you want to learn. Create your profile in minutes!',
                  color: 'from-primary-500 to-primary-600',
                  details: ['Add your skills', 'Set your learning goals', 'Upload portfolio links'],
                },
                {
                  number: '02',
                  icon: '/images/3dicons-puzzle-dynamic-color.png',
                  title: 'Find Your Match',
                  description: 'Our smart algorithm analyzes compatibility and connects you with perfect skill partners.',
                  color: 'from-blue-500 to-blue-600',
                  details: ['AI-powered matching', 'Compatibility scoring', 'Instant notifications'],
                },
                {
                  number: '03',
                  icon: '/images/3dicons-forward-dynamic-color.png',
                  title: 'Learn & Grow',
                  description: 'Start collaborating through video, voice, or chat. Track your progress and earn credits!',
                  color: 'from-purple-500 to-purple-600',
                  details: ['Interactive sessions', 'Progress tracking', 'Earn credits'],
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -5 }}
                  className="relative group"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-dark-100 
                               border-2 border-primary-500 rounded-full flex items-center justify-center z-10">
                    <span className="text-primary-400 font-bold text-lg">{step.number}</span>
                  </div>

                  <div className="bg-dark-100/50 border border-primary-500/20 rounded-2xl p-8 
                               backdrop-blur-sm hover:border-primary-500/40 transition-all 
                               cursor-pointer h-full pt-12">
                    <div className="relative z-10">
                      <motion.div
                        className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl 
                                 flex items-center justify-center mb-6 mx-auto shadow-lg p-3`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Image 
                          src={step.icon} 
                          alt={step.title}
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </motion.div>

                      <h3 className="text-2xl font-bold text-white mb-3 text-center">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed mb-6 text-center">{step.description}</p>

                      {/* Simple Details */}
                      <div className="space-y-2">
                        {step.details.map((detail, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2 text-sm text-gray-400"
                          >
                            <Check className="w-4 h-4 text-primary-400 flex-shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - Interactive Flip Cards */}
      <section ref={featuresRef2} className="relative z-10 border-t border-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={features2InView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose Queldo?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to learn, teach, and grow with fellow students
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} isInView={features2InView} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Slider Section */}
      <section ref={testimonialsRef} className="relative z-10 border-t border-primary-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What Students Say</h2>
            <p className="text-xl text-gray-400 mb-4">Real stories from the Queldo community</p>
            
            {/* Disclaimer Alert */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-300/80 text-sm max-w-md mx-auto"
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>These testimonials are examples and not from real users</span>
            </motion.div>
          </motion.div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="bg-dark-100/50 border border-primary-500/20 rounded-2xl p-8 backdrop-blur-sm"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonials[testimonialIndex].rating)].map((_, j) => (
                      <Image 
                        key={j}
                        src="/images/3dicons-star-dynamic-color.png" 
                        alt="star"
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                    "{testimonials[testimonialIndex].content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full 
                                  flex items-center justify-center text-white font-semibold">
                      {testimonials[testimonialIndex].avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonials[testimonialIndex].name}</div>
                      <div className="text-sm text-gray-400">{testimonials[testimonialIndex].role}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="p-3 bg-dark-100/50 border border-primary-500/20 rounded-lg hover:border-primary-500/50 
                         transition-colors text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === testimonialIndex ? 'bg-primary-400 w-8' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
                className="p-3 bg-dark-100/50 border border-primary-500/20 rounded-lg hover:border-primary-500/50 
                         transition-colors text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative z-10 border-t border-primary-500/10 bg-gradient-to-br from-primary-500/5 to-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Join the Community</h2>
            <p className="text-xl text-gray-400">Students are already trading skills and growing together</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Active Students', icon: '/images/3dicons-boy-dynamic-color.png' },
              { value: '1,200+', label: 'Skill Trades', icon: '/images/3dicons-forward-dynamic-color.png' },
              { value: '50+', label: 'Skills Available', icon: '/images/3dicons-tools-dynamic-color.png' },
              { value: '4.9/5', label: 'Average Rating', icon: '/images/3dicons-star-dynamic-color.png' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.1, y: -10 }}
                className="text-center cursor-pointer"
              >
                <motion.div 
                  className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 p-3"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Image 
                    src={stat.icon} 
                    alt={stat.label}
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <motion.div 
                  className="text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0 }}
                  animate={statsInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section ref={faqRef} className="relative z-10 border-t border-primary-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400">Everything you need to know about Queldo</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                className="bg-dark-100/50 border border-primary-500/20 rounded-xl overflow-hidden backdrop-blur-sm"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-dark-100/70 transition-colors"
                >
                  <span className="text-white font-semibold text-lg">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openFAQ === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFAQ === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 text-gray-300 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-primary-500/10 bg-gradient-to-br from-primary-600/10 to-blue-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Trading Skills?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join hundreds of students who are already learning, teaching, and growing together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 
                         text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 font-semibold
                         shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/marketplace"
                className="px-8 py-4 bg-dark-100/50 border-2 border-primary-500/30 hover:border-primary-500/50 
                         text-white rounded-xl transition-all duration-300 flex items-center justify-center font-semibold
                         backdrop-blur-sm hover:bg-dark-100/70"
              >
                Explore Marketplace
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary-500/10 bg-dark-50/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-black gradient-text mb-4">QUELDO</h3>
              <p className="text-gray-400 text-sm">
                The skill-sharing marketplace for students. Learn, teach, and grow together.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-500/10 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 Queldo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
