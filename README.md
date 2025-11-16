# Queldo - Skill Share Marketplace

A modern skill-sharing platform for students aged 13-18 to connect, learn, and collaborate.

## About This Project

Queldo is a peer-to-peer skill exchange platform designed specifically for students aged 13-18. The platform addresses a critical gap in traditional education by enabling students to learn from each other through direct skill trading, rather than relying solely on formal instruction or expensive tutoring services.

**Why Queldo Matters:**

In today's rapidly evolving educational landscape, students often find themselves needing to learn skills that aren't covered in their standard curriculum—whether it's coding, graphic design, music production, or even study techniques. Traditional learning resources can be expensive, time-consuming, or simply not tailored to a student's learning style. Queldo bridges this gap by creating a community where students can teach what they know and learn what they need, all within a safe, age-appropriate environment.

The platform operates on a skill-trading model where students can post listings for skills they're willing to teach and browse opportunities to learn from peers. An intelligent matching algorithm connects students with complementary skills—someone who wants to learn web development might be matched with a peer who can teach it and wants to learn graphic design in return. This creates a sustainable learning ecosystem where knowledge flows freely between students.

Beyond simple skill exchange, Queldo incorporates gamification elements like leaderboards and badges to recognize active contributors, fostering a sense of community and encouraging continued participation. Real-time features including video calls, voice chat, and collaborative whiteboards enable interactive learning sessions that go beyond text-based communication.

The platform prioritizes safety and age-appropriateness, with built-in verification systems, portfolio showcases, and a review system that helps students make informed decisions about their learning partners. By empowering students to take control of their education and learn from each other, Queldo not only facilitates skill acquisition but also builds confidence, communication skills, and a collaborative mindset that will serve them well beyond their school years.

## Features

- 🎯 **Skill Matching Algorithm** - AI-powered matching based on complementary skills
- ✅ **Skill Verification & Portfolio** - Showcase your work and verify your skills
- 🏆 **Time Banking & Leaderboard** - Track contributions and see top contributors
- 💬 **Interactive Learning Sessions** - Real-time skill sharing with video/voice
- 🔔 **Smart Notifications** - Get notified about matches and opportunities

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Authentication**: Custom JWT-based system

## Getting Started

See [SETUP.md](./SETUP.md) for detailed installation instructions.

### Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database and run the schema:
```bash
psql -U postgres -d queldo -f server/database/schema.sql
```

3. Create `.env` file (see `.env.example` for template)

4. Run both servers:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
npm run server
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
queldo/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                # Utilities and helpers
├── server/             # Backend server
│   ├── index.js       # Express server
│   ├── routes/        # API routes
│   ├── models/        # Database models
│   └── database/      # Database schema and migrations
└── public/            # Static assets
```

