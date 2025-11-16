const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = {
  async request(endpoint: string, options: RequestInit = {}, retries = 2): Promise<any> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        
        // Retry on network errors or 5xx status codes
        if (retries > 0 && (response.status >= 500 || !response.ok)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)))
          return this.request(endpoint, options, retries - 1)
        }
        
        throw new Error(error.error || `Request failed with status ${response.status}`)
      }

      return response.json()
    } catch (error: any) {
      // Retry on network errors
      if (retries > 0 && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)))
        return this.request(endpoint, options, retries - 1)
      }
      throw error
    }
  },

  // Analytics
  async getAnalytics() {
    return this.request('/api/analytics')
  },

  // Auth
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(data: { name: string; email: string; password: string; age: number }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getCurrentUser() {
    return this.request('/api/auth/me')
  },

  // Listings
  async getListings() {
    return this.request('/api/listings')
  },

  async getListing(id: string) {
    return this.request(`/api/listings/${id}`)
  },

  async createListing(data: {
    title?: string
    description?: string
    skillsOffering: string[]
    skillsSeeking: string[]
    images?: string[]
  }) {
    return this.request('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Matches
  async getCompatibility(listingId: string) {
    return this.request(`/api/matches/compatibility/${listingId}`)
  },

  async getRecommendedMatches() {
    return this.request('/api/matches/recommended')
  },

  // Users
  async getUser(id: string) {
    return this.request(`/api/users/${id}`)
  },

  // Notifications
  async getNotifications() {
    return this.request('/api/notifications')
  },

  async markNotificationRead(id: string) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    })
  },

  // Leaderboard
  async getLeaderboard() {
    return this.request('/api/leaderboard')
  },

  // Applications
  async submitApplication(listingId: string, message?: string) {
    return this.request('/api/matches/applications', {
      method: 'POST',
      body: JSON.stringify({ listingId, message }),
    })
  },

  async getApplications(listingId: string) {
    return this.request(`/api/matches/applications/${listingId}`)
  },

  async updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected' | 'pending') {
    return this.request(`/api/matches/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  // User Profile Management
  async updateProfile(data: { name?: string; avatar?: string }) {
    return this.request('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async addSkill(data: { skillName: string; skillType: 'offering' | 'seeking'; level?: string }) {
    return this.request('/api/users/me/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async deleteSkill(skillId: string) {
    return this.request(`/api/users/me/skills/${skillId}`, {
      method: 'DELETE',
    })
  },

  async addPortfolioLink(data: { title: string; url: string; platform?: string }) {
    return this.request('/api/users/me/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async deletePortfolioLink(linkId: string) {
    return this.request(`/api/users/me/portfolio/${linkId}`, {
      method: 'DELETE',
    })
  },

  // Chat
  async getConversation(userId: string) {
    return this.request(`/api/chat/conversation/${userId}`)
  },

  async getConversations() {
    return this.request('/api/chat/conversations')
  },

  async getMessages(conversationId: string) {
    return this.request(`/api/chat/messages/${conversationId}`)
  },

  async sendMessage(conversationId: string, content: string) {
    return this.request('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content }),
    })
  },

  // Account management
  async deleteAccount() {
    return this.request('/api/users/me', {
      method: 'DELETE',
    })
  },
}

