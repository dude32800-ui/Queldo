# Queldo - Skill Share Marketplace

## **CURSOR HAS BEEN USED TO ENHANCE CODE AND GIVE IDEAS, AS WELL AS PROVIDE INLINE DOCUMENTATION COMMENTS.**

A modern skill-sharing platform for students aged 13-18 to connect, learn, and collaborate.

## Features

-  **Skill Matching Algorithm** - AI-powered matching based on complementary skills
-  **Skill Verification & Portfolio** - Showcase your work and verify your skills
-  **Time Banking & Leaderboard** - Track contributions and see top contributors
-  **Interactive Learning Sessions** - Real-time skill sharing with video/voice
-  **Smart Notifications** - Get notified about matches and opportunities

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



