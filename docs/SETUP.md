# Setup Guide

This guide will help you set up the Society/Apartment Management System project.

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Git** (for version control)

## Step 1: Clone and Setup Repository

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd Society-Apartment-Management-System
```

## Step 2: Setup Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Wait for the project to be fully provisioned
4. Go to **Settings** → **API** and note down:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this secure!)

## Step 3: Setup Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `docs/database-schema.sql`
3. Paste and run the SQL script
4. Verify tables are created in **Table Editor**

## Step 4: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
# Copy .env.example and fill in your Supabase credentials
# Windows (PowerShell):
Copy-Item .env.example .env
# Linux/Mac:
cp .env.example .env

# Edit .env file with your Supabase credentials:
# SUPABASE_URL=your_project_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# PORT=3000
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:5173
```

**Start backend server:**
```bash
npm run dev
```

The backend should be running on `http://localhost:3000`

## Step 5: Setup Web Frontend (Admin & Board)

```bash
# Navigate to frontend-web directory
cd ../frontend-web

# Install dependencies
npm install

# Create .env file (if needed for API URL)
# For now, the proxy in vite.config.js handles API calls

# Start development server
npm run dev
```

The web app should be running on `http://localhost:5173`

## Step 6: Setup Mobile Frontend (Members)

```bash
# Navigate to frontend-mobile directory
cd ../frontend-mobile

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Start Expo development server
npm start
```

**For mobile testing:**
- Install **Expo Go** app on your phone (iOS/Android)
- Scan the QR code shown in terminal
- Or use Android/iOS simulators

## Step 7: Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","message":"Society Management API is running"}`

2. **Database:** Check Supabase Dashboard → Table Editor to see all tables

3. **Web App:** Open `http://localhost:5173` - should show "Under Construction" page

4. **Mobile App:** Expo should show QR code and Metro bundler running

## Project Structure

```
Society-Apartment-Management-System/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Supabase configuration
│   │   ├── middleware/  # Auth & role middleware
│   │   ├── routes/      # API routes (to be implemented)
│   │   ├── controllers/ # Route controllers (to be implemented)
│   │   ├── services/    # Business logic (to be implemented)
│   │   └── app.js       # Express app entry point
│   └── package.json
│
├── frontend-web/         # React web app (Admin & Board)
│   ├── src/
│   │   ├── components/  # React components (to be implemented)
│   │   ├── pages/       # Page components (to be implemented)
│   │   ├── services/    # API service functions (to be implemented)
│   │   └── App.jsx      # Main app component
│   └── package.json
│
├── frontend-mobile/      # React Native app (Members)
│   ├── src/             # Source files (to be implemented)
│   ├── App.js           # Main app component
│   └── package.json
│
└── docs/                 # Documentation
    ├── DESIGN.md        # System design document
    ├── API.md           # API documentation
    ├── database-schema.sql
    └── SETUP.md         # This file
```

## Next Steps

1. **Implement Authentication:**
   - Create auth routes in `backend/src/routes/auth.routes.js`
   - Implement login/register controllers
   - Setup Supabase Auth in frontend

2. **Implement Core Features:**
   - Maintenance Payment System
   - Visitor Entry Management
   - Notices & Announcements
   - Complaints/Issue Tracking

3. **Build UI Components:**
   - Admin dashboard (web)
   - Board member dashboard (web)
   - Member mobile screens

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in .env file or kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Supabase connection error:**
- Verify `.env` file has correct Supabase credentials
- Check Supabase project is active
- Verify network connection

### Frontend Issues

**Dependencies not installing:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Expo issues:**
```bash
# Clear Expo cache
expo start -c
```

### Database Issues

**Tables not created:**
- Check SQL script ran without errors
- Verify you have proper permissions in Supabase
- Check Supabase logs for errors

## Environment Variables Reference

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CORS_ORIGIN=http://localhost:5173
```

### Frontend (if needed)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Development Workflow

1. **Start Supabase** (always running in cloud)
2. **Start Backend:** `cd backend && npm run dev`
3. **Start Web Frontend:** `cd frontend-web && npm run dev`
4. **Start Mobile:** `cd frontend-mobile && npm start`

## Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server

# Web Frontend
cd frontend-web
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Mobile
cd frontend-mobile
npm start            # Start Expo
npm run android      # Run on Android
npm run ios          # Run on iOS
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)

---

**Need Help?** Refer to `DESIGN.md` for system architecture and `API.md` for API specifications.
