# Quick Start Guide

## 🎯 Project Overview

A **Society/Apartment Management System** with three user roles:
- **Super Admin** - Manages all societies (Web)
- **Board Member** - Manages one society (Web)
- **Member** - Normal residents (Mobile)

## 📋 Core Features

1. 💰 **Online Maintenance Payment** - Monthly bills & payment tracking
2. 🚪 **Visitor Entry Management** - Digital visitor passes
3. 📢 **Notices & Announcements** - Board posts, members view
4. 🛠 **Complaints/Issue Tracking** - Raise & track complaints

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install

# Web Frontend
cd ../frontend-web && npm install

# Mobile Frontend
cd ../frontend-mobile && npm install
```

### 2. Setup Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run SQL from `docs/database-schema.sql` in Supabase SQL Editor
4. Copy Project URL and API keys

### 3. Configure Environment

```bash
# Backend - Copy env.example.txt to .env
cd backend
# Windows: Copy-Item env.example.txt .env
# Linux/Mac: cp env.example.txt .env

# Edit .env with your Supabase credentials
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Web App
cd frontend-web
npm run dev

# Terminal 3 - Mobile App
cd frontend-mobile
npm start
```

## 📚 Documentation

- **[DESIGN.md](./DESIGN.md)** - Complete system design & architecture
- **[API.md](./docs/API.md)** - API endpoint documentation
- **[SETUP.md](./docs/SETUP.md)** - Detailed setup instructions
- **[database-schema.sql](./docs/database-schema.sql)** - Database schema

## 📁 Project Structure

```
├── backend/          # Node.js + Express API
├── frontend-web/     # React web app (Admin/Board)
├── frontend-mobile/  # React Native app (Members)
└── docs/             # Documentation
```

## 🛠 Tech Stack

- **Backend:** Node.js, Express, Supabase
- **Web:** React, Vite
- **Mobile:** React Native, Expo
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth

## ✅ Implementation Checklist

### Phase 1: Foundation ✅
- [x] Project structure setup
- [x] Database schema design
- [x] API documentation
- [x] Authentication middleware

### Phase 2: Core Features (Next Steps)
- [ ] Authentication (Login/Register)
- [ ] Maintenance Payment System
- [ ] Visitor Entry Management
- [ ] Notices & Announcements
- [ ] Complaints Tracking

### Phase 3: UI Development
- [ ] Admin Dashboard (Web)
- [ ] Board Member Dashboard (Web)
- [ ] Member Mobile App Screens

## 🎓 For Students

This is a **semester project (50% weightage)**. Focus on:

1. **Clean Code** - Well-structured, readable code
2. **Documentation** - Clear comments and docs
3. **Testing** - Basic functionality testing
4. **Presentation** - Working demo with all features

**Don't over-engineer!** Keep it simple but functional.

## 📞 Need Help?

1. Check `DESIGN.md` for system architecture
2. Check `docs/API.md` for API details
3. Check `docs/SETUP.md` for troubleshooting
4. Review Supabase documentation

---

**Happy Coding! 🚀**
