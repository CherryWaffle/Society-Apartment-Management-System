# Society/Apartment Management System - Design Document

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)

---

## 🎯 System Overview

A centralized platform for managing apartment societies with three distinct user roles. The system handles maintenance payments, visitor management, notices, and complaint tracking.

**Key Principles:**
- Simple, clean architecture
- Role-based access control
- Mobile-first for residents
- Web-based for admin/board management

---

## 👥 User Roles & Permissions

### 1. Super Admin
**Access:** Web Application Only

**Permissions:**
- Create new societies
- Assign board members to societies
- View all societies and their status
- Manage platform-level settings

**Cannot:**
- Access society-specific data (maintenance, complaints, etc.)
- Post notices or approve visitors

---

### 2. Society Board Member
**Access:** Web Application Only

**Permissions:**
- Manage their assigned society
- Generate monthly maintenance bills
- Approve/reject visitor entry requests
- Post notices and announcements
- Update complaint status
- View payment history and financial reports
- Add/remove society members

**Cannot:**
- Create new societies
- Access other societies' data

---

### 3. Society Member
**Access:** Mobile Application Only

**Permissions:**
- View and pay maintenance bills
- Raise complaints/issues
- Request visitor entry passes
- View notices and announcements
- View payment history
- View complaint status

**Cannot:**
- Post notices
- Approve visitors
- Generate maintenance bills
- Access other members' data

---

## 🚀 Core Features

### 1. 💰 Online Maintenance Payment

**Who can access:**
- **Generate bills:** Board Members (web)
- **View & Pay:** Society Members (mobile)
- **View history:** Both Board Members and Members

**User Flow:**
1. Board Member generates monthly maintenance for all units
2. System calculates amount based on unit size/type
3. Member receives notification (mobile app)
4. Member views bill details and pays online
5. Payment is simulated (no real payment gateway)
6. Payment status updated: Pending → Paid
7. Both parties can view payment history

**Data Stored:**
```
MaintenanceBill:
- id (UUID)
- society_id (FK)
- unit_number (string)
- member_id (FK)
- month (date)
- year (integer)
- amount (decimal)
- status (enum: PENDING, PAID, OVERDUE)
- due_date (date)
- paid_date (date, nullable)
- created_at (timestamp)
- updated_at (timestamp)

PaymentTransaction:
- id (UUID)
- bill_id (FK)
- amount (decimal)
- payment_method (string: "ONLINE", "CASH", "CHEQUE")
- transaction_id (string, nullable)
- status (enum: SUCCESS, FAILED, PENDING)
- payment_date (timestamp)
- created_at (timestamp)
```

**Assumptions:**
- Maintenance amount is fixed per unit type (1BHK, 2BHK, 3BHK)
- Bills generated monthly on a fixed date (e.g., 1st of each month)
- Payment simulation: Always succeeds after 2-3 seconds
- Overdue bills marked after due_date + 7 days

---

### 2. 🚪 Visitor Entry Management

**Who can access:**
- **Request pass:** Society Members (mobile)
- **Approve/Reject:** Board Members (web)
- **View logs:** Board Members (web)

**User Flow:**
1. Member requests visitor entry pass (mobile)
2. Enters visitor details (name, phone, purpose, expected date/time)
3. Request sent to board members
4. Board member reviews and approves/rejects (web)
5. Member receives notification
6. On visitor arrival, guard/board member logs entry
7. Entry logged with timestamp

**Data Stored:**
```
VisitorPass:
- id (UUID)
- society_id (FK)
- requested_by (FK to member)
- visitor_name (string)
- visitor_phone (string)
- visitor_email (string, nullable)
- purpose (string)
- expected_date (date)
- expected_time (time)
- status (enum: PENDING, APPROVED, REJECTED, EXPIRED)
- approved_by (FK to board_member, nullable)
- approved_at (timestamp, nullable)
- entry_logged_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**Assumptions:**
- Visitor passes valid for single day only
- Auto-expire after expected_date
- Board members can approve/reject within 24 hours
- Entry logging happens at gate/security desk

---

### 3. 📢 Notices & Announcements

**Who can access:**
- **Post notices:** Board Members (web)
- **View notices:** All Members (mobile)

**User Flow:**
1. Board member creates notice (web)
2. Enters title, content, category, priority
3. Notice published immediately
4. All members receive notification
5. Members view notices in mobile app
6. Notices sorted by date (newest first)

**Data Stored:**
```
Notice:
- id (UUID)
- society_id (FK)
- posted_by (FK to board_member)
- title (string)
- content (text)
- category (enum: GENERAL, MAINTENANCE, EVENT, EMERGENCY)
- priority (enum: LOW, MEDIUM, HIGH)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**Assumptions:**
- Notices are permanent (no auto-delete)
- Board members can edit/delete their own notices
- Members can only view, not comment

---

### 4. 🛠 Complaints / Issue Tracking

**Who can access:**
- **Raise complaint:** Society Members (mobile)
- **Update status:** Board Members (web)
- **View progress:** Both Members and Board Members

**User Flow:**
1. Member raises complaint (mobile)
2. Enters title, description, category, photos (optional)
3. Complaint status: OPEN
4. Board member views complaint (web)
5. Board member updates status: IN_PROGRESS → RESOLVED
6. Member receives status update notifications
7. Member can view progress in mobile app

**Data Stored:**
```
Complaint:
- id (UUID)
- society_id (FK)
- raised_by (FK to member)
- title (string)
- description (text)
- category (enum: PLUMBING, ELECTRICAL, CLEANING, SECURITY, OTHER)
- status (enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- assigned_to (FK to board_member, nullable)
- resolution_notes (text, nullable)
- resolved_at (timestamp, nullable)
- photos (array of URLs, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**Assumptions:**
- Photos stored in cloud storage (Supabase Storage)
- Complaints cannot be deleted, only closed
- Board members can assign complaints to themselves
- Status updates trigger notifications

---

## 🗄 Database Schema

### Core Tables

```sql
-- Users (Supabase Auth handles this, but we need profile table)
users (handled by Supabase Auth)
  - id (UUID, PK)
  - email (string)
  - password_hash (handled by Supabase)

-- User Profiles
user_profiles
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users, UNIQUE)
  - full_name (string)
  - phone (string)
  - role (enum: SUPER_ADMIN, BOARD_MEMBER, MEMBER)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Societies
societies
  - id (UUID, PK)
  - name (string)
  - address (text)
  - city (string)
  - pincode (string)
  - total_units (integer)
  - created_by (UUID, FK to user_profiles)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Society Units
society_units
  - id (UUID, PK)
  - society_id (UUID, FK)
  - unit_number (string)
  - unit_type (enum: 1BHK, 2BHK, 3BHK, 4BHK)
  - floor_number (integer)
  - member_id (UUID, FK to user_profiles, nullable)
  - is_occupied (boolean)
  - created_at (timestamp)

-- Society Board Members (junction table)
society_board_members
  - id (UUID, PK)
  - society_id (UUID, FK)
  - board_member_id (UUID, FK to user_profiles)
  - designation (string: "PRESIDENT", "SECRETARY", "TREASURER", "MEMBER")
  - assigned_at (timestamp)
  - created_at (timestamp)

-- Maintenance Bills (see feature 1)
maintenance_bills
  - id (UUID, PK)
  - society_id (UUID, FK)
  - unit_id (UUID, FK)
  - member_id (UUID, FK)
  - month (integer, 1-12)
  - year (integer)
  - amount (decimal)
  - status (enum: PENDING, PAID, OVERDUE)
  - due_date (date)
  - paid_date (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Payment Transactions (see feature 1)
payment_transactions
  - id (UUID, PK)
  - bill_id (UUID, FK)
  - amount (decimal)
  - payment_method (string)
  - transaction_id (string, nullable)
  - status (enum: SUCCESS, FAILED, PENDING)
  - payment_date (timestamp)
  - created_at (timestamp)

-- Visitor Passes (see feature 2)
visitor_passes
  - id (UUID, PK)
  - society_id (UUID, FK)
  - requested_by (UUID, FK)
  - visitor_name (string)
  - visitor_phone (string)
  - visitor_email (string, nullable)
  - purpose (string)
  - expected_date (date)
  - expected_time (time)
  - status (enum: PENDING, APPROVED, REJECTED, EXPIRED)
  - approved_by (UUID, FK, nullable)
  - approved_at (timestamp, nullable)
  - entry_logged_at (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Notices (see feature 3)
notices
  - id (UUID, PK)
  - society_id (UUID, FK)
  - posted_by (UUID, FK)
  - title (string)
  - content (text)
  - category (enum: GENERAL, MAINTENANCE, EVENT, EMERGENCY)
  - priority (enum: LOW, MEDIUM, HIGH)
  - is_active (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Complaints (see feature 4)
complaints
  - id (UUID, PK)
  - society_id (UUID, FK)
  - raised_by (UUID, FK)
  - title (string)
  - description (text)
  - category (enum: PLUMBING, ELECTRICAL, CLEANING, SECURITY, OTHER)
  - status (enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED)
  - assigned_to (UUID, FK, nullable)
  - resolution_notes (text, nullable)
  - resolved_at (timestamp, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Complaint Photos (separate table for multiple photos)
complaint_photos
  - id (UUID, PK)
  - complaint_id (UUID, FK)
  - photo_url (string)
  - created_at (timestamp)
```

### Relationships Summary
- One Society has many Units
- One Society has many Board Members
- One Unit belongs to one Member (owner/tenant)
- One Member can raise many Complaints
- One Board Member can approve many Visitor Passes
- One Board Member can post many Notices
- One Bill can have one Payment Transaction

---

## 🔌 API Endpoints

### Authentication (Supabase handles this)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Super Admin
- `GET /api/admin/societies` - List all societies
- `POST /api/admin/societies` - Create new society
- `POST /api/admin/societies/:id/board-members` - Assign board member
- `GET /api/admin/societies/:id` - Get society details

### Society Board Member
- `GET /api/board/society` - Get own society details
- `GET /api/board/members` - List all society members
- `POST /api/board/members` - Add new member
- `POST /api/board/maintenance/generate` - Generate monthly maintenance
- `GET /api/board/maintenance` - List all maintenance bills
- `GET /api/board/visitors` - List visitor pass requests
- `PUT /api/board/visitors/:id/approve` - Approve visitor pass
- `PUT /api/board/visitors/:id/reject` - Reject visitor pass
- `POST /api/board/visitors/:id/log-entry` - Log visitor entry
- `POST /api/board/notices` - Create notice
- `GET /api/board/notices` - List notices
- `PUT /api/board/notices/:id` - Update notice
- `DELETE /api/board/notices/:id` - Delete notice
- `GET /api/board/complaints` - List all complaints
- `PUT /api/board/complaints/:id/status` - Update complaint status

### Society Member (Mobile)
- `GET /api/member/bills` - Get own maintenance bills
- `GET /api/member/bills/:id` - Get bill details
- `POST /api/member/bills/:id/pay` - Pay maintenance bill
- `GET /api/member/payment-history` - Get payment history
- `POST /api/member/visitors` - Request visitor pass
- `GET /api/member/visitors` - List own visitor passes
- `GET /api/member/notices` - List notices
- `GET /api/member/notices/:id` - Get notice details
- `POST /api/member/complaints` - Raise complaint
- `GET /api/member/complaints` - List own complaints
- `GET /api/member/complaints/:id` - Get complaint details

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **ORM:** Supabase Client (or Prisma if needed)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Validation:** Joi or Zod

### Frontend - Web (Admin & Board)
- **Framework:** React (v18+)
- **UI Library:** Material-UI or Tailwind CSS + shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router
- **HTTP Client:** Axios or Fetch
- **Build Tool:** Vite

### Frontend - Mobile (Members)
- **Framework:** React Native (Expo)
- **UI Library:** React Native Paper or NativeBase
- **State Management:** React Query
- **Navigation:** React Navigation
- **HTTP Client:** Axios

### Development Tools
- **Version Control:** Git
- **Package Manager:** npm or yarn
- **Code Formatting:** Prettier
- **Linting:** ESLint

---

## 📁 Project Structure

```
Society-Apartment-Management-System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js
│   │   ├── controllers/
│   │   │   ├── admin.controller.js
│   │   │   ├── board.controller.js
│   │   │   └── member.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── board.routes.js
│   │   │   └── member.routes.js
│   │   ├── services/
│   │   │   ├── maintenance.service.js
│   │   │   ├── visitor.service.js
│   │   │   ├── notice.service.js
│   │   │   └── complaint.service.js
│   │   ├── utils/
│   │   │   └── validators.js
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── frontend-web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── admin/
│   │   │   └── board/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── board/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── frontend-mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.js
│   ├── package.json
│   └── app.json
│
├── docs/
│   └── API.md (detailed API documentation)
│
├── DESIGN.md (this file)
├── README.md
└── .gitignore
```

---

## ✅ Implementation Checklist

### Phase 1: Setup & Authentication
- [ ] Initialize backend project
- [ ] Initialize frontend-web project
- [ ] Initialize frontend-mobile project
- [ ] Setup Supabase project
- [ ] Create database schema
- [ ] Implement authentication (Supabase Auth)
- [ ] Setup role-based access control

### Phase 2: Core Features
- [ ] Maintenance Payment System
- [ ] Visitor Entry Management
- [ ] Notices & Announcements
- [ ] Complaints/Issue Tracking

### Phase 3: UI/UX
- [ ] Admin dashboard (web)
- [ ] Board member dashboard (web)
- [ ] Member mobile app screens
- [ ] Responsive design

### Phase 4: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Deployment setup
- [ ] Documentation

---

## 📝 Notes & Assumptions

1. **Payment Simulation:** No real payment gateway integration. Payment always succeeds after 2-3 seconds delay.

2. **Notifications:** Use Supabase Realtime or push notifications (Firebase) for real-time updates.

3. **File Uploads:** Complaint photos stored in Supabase Storage with public URLs.

4. **Security:** All API endpoints protected by authentication middleware. Role-based access enforced.

5. **Scalability:** Design supports multiple societies. Each society's data is isolated.

6. **Mobile App:** Can be built as Progressive Web App (PWA) initially, then native if needed.

---

**Last Updated:** [Current Date]
**Version:** 1.0.0
