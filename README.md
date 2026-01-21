# Society/Apartment Management System

A comprehensive platform for managing apartment societies with three distinct user roles: Super Admin, Society Board Members, and Society Members.

## 🎯 Features

- 💰 **Online Maintenance Payment** - Monthly bill generation and payment tracking
- 🚪 **Visitor Entry Management** - Digital visitor passes with approval workflow
- 📢 **Notices & Announcements** - Board members can post, members can view
- 🛠 **Complaints/Issue Tracking** - Raise and track complaints with status updates

## 👥 User Roles

1. **Super Admin** - Manages all societies, creates societies, assigns board members
2. **Society Board Member** - Manages one society (finance, notices, complaints, approvals)
3. **Society Member** - Normal residents (payments, complaints, visitor entry)

## 🛠 Tech Stack

- **Backend:** Node.js + Express + Supabase
- **Frontend Web:** React (for Admin & Board Members)
- **Frontend Mobile:** React Native/Flutter (for Society Members)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

## 📚 Documentation

- [System Design Document](./DESIGN.md) - Complete system architecture and specifications
- [Database Schema](./docs/database-schema.sql) - SQL schema definitions
- [API Documentation](./docs/API.md) - Detailed API endpoint documentation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account

### Setup Instructions

1. Clone the repository
2. Setup Supabase project and configure environment variables
3. Run database migrations (see `docs/database-schema.sql`)
4. Install dependencies for each module:
   ```bash
   cd backend && npm install
   cd ../frontend-web && npm install
   cd ../frontend-mobile && npm install
   ```
5. Start development servers

## 📁 Project Structure

```
├── backend/          # Node.js + Express API
├── frontend-web/     # React web app (Admin & Board)
├── frontend-mobile/  # React Native app (Members)
└── docs/             # Documentation
```

## 📝 License

This is a semester project (50% weightage) - Educational Use Only
