# Queldo Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**📖 For detailed PostgreSQL setup instructions, see [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)**

#### Quick Setup (Recommended)

1. **Install PostgreSQL** (if not installed):
   - Download: https://www.postgresql.org/download/windows/
   - During installation, **remember the password** you set for `postgres` user

2. **Create `.env` file** with your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=queldo
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password_here
   ```

3. **Run the automatic setup script**:
   ```bash
   npm run setup-db
   ```

   This will automatically:
   - Create the `queldo` database if it doesn't exist
   - Run the schema to create all tables
   - Verify the setup

4. **Verify setup**:
   ```bash
   npm run check-db
   ```

#### Manual Setup

See [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) for manual setup instructions using psql or pgAdmin.

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=queldo
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Also create `.env.local` for Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start Development Servers

You'll need two terminal windows:

**Terminal 1 - Frontend (Next.js):**
```bash
npm run dev
```
This will start the frontend on http://localhost:3000

**Terminal 2 - Backend (Express):**
```bash
npm run server
```
This will start the backend API on http://localhost:3001

### 5. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

```
queldo/
├── app/                    # Next.js app directory (pages)
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── marketplace/       # Marketplace pages
│   ├── profile/           # User profile
│   └── leaderboard/       # Leaderboard page
├── components/            # React components
│   ├── Navbar.tsx
│   └── NotificationCenter.tsx
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── server/               # Backend server
│   ├── index.js         # Express server entry
│   ├── routes/          # API routes
│   ├── database/        # Database files
│   │   ├── connection.js
│   │   └── schema.sql
└── public/              # Static assets
```

## Features Implemented

✅ **Landing Page** - Modern dark theme with interactive elements
✅ **Authentication** - Login/Register with JWT
✅ **Marketplace** - Browse, search, and create skill listings
✅ **Skill Matching** - Compatibility scoring algorithm
✅ **Profile Pages** - Skills, portfolio, badges
✅ **Leaderboard** - Top contributors ranking
✅ **Notifications** - Real-time notifications with Socket.io
✅ **Learning Sessions** - UI for video/voice/text sessions
✅ **Responsive Design** - Mobile-friendly interface

## Next Steps

1. **Connect Frontend to Backend**: Update API calls in components to use the actual backend
2. **Add Real-time Features**: Complete Socket.io integration for notifications
3. **Implement Video/Voice**: Integrate WebRTC or third-party services for learning sessions
4. **Add Search/Filter**: Implement advanced filtering in marketplace
5. **Add Reviews**: Complete review/rating system
6. **Add Ads/Donations**: Add placeholder sections for monetization

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Change `PORT` in `.env` for backend
- Change port in `package.json` scripts for frontend

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- These should resolve after installation

## Development Tips

- Use the API client in `lib/api.ts` for all backend calls
- Check browser console and server logs for debugging
- Socket.io events are set up but need user authentication integration
- All mock data can be replaced with actual API calls

