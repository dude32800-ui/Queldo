'use client'

import { motion } from 'framer-motion'

export function MarketplaceCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-primary-500/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-500/20 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-primary-500/20 rounded" />
            <div className="h-3 w-16 bg-primary-500/10 rounded" />
          </div>
        </div>
        <div className="h-6 w-12 bg-primary-500/20 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-primary-500/20 rounded mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-3 w-16 bg-primary-500/10 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-primary-500/20 rounded-full" />
          <div className="h-6 w-24 bg-primary-500/20 rounded-full" />
          <div className="h-6 w-16 bg-primary-500/20 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-16 bg-blue-500/10 rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-blue-500/20 rounded-full" />
          <div className="h-6 w-24 bg-blue-500/20 rounded-full" />
        </div>
      </div>
      <div className="h-10 w-full bg-primary-500/20 rounded-xl" />
    </div>
  )
}

export function LeaderboardCardSkeleton() {
  return (
    <div className="bg-dark-100 border border-primary-500/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-primary-500/20 rounded-full" />
        <div className="w-12 h-12 bg-primary-500/20 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-primary-500/20 rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-16 bg-primary-500/10 rounded" />
            <div className="h-4 w-16 bg-primary-500/10 rounded" />
          </div>
          <div className="h-1 w-48 bg-primary-500/10 rounded" />
        </div>
        <div className="w-6 h-6 bg-primary-500/20 rounded" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-dark-100 border border-primary-500/20 rounded-2xl p-8">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-primary-500/20 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 bg-primary-500/20 rounded" />
            <div className="h-4 w-32 bg-primary-500/10 rounded" />
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-dark-100 border border-primary-500/20 rounded-2xl p-6">
          <div className="h-6 w-24 bg-primary-500/20 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-primary-500/10 rounded" />
            <div className="h-4 w-3/4 bg-primary-500/10 rounded" />
          </div>
        </div>
        <div className="bg-dark-100 border border-primary-500/20 rounded-2xl p-6">
          <div className="h-6 w-24 bg-primary-500/20 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-primary-500/10 rounded" />
            <div className="h-4 w-2/3 bg-primary-500/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

