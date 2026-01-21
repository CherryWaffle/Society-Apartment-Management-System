# API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication
All endpoints (except auth endpoints) require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <supabase_access_token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "token",
    "refresh_token": "token"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "MEMBER"
}
```

---

## 👑 Super Admin Endpoints

### List All Societies
```http
GET /api/admin/societies
Authorization: Bearer <token>
```

**Response:**
```json
{
  "societies": [
    {
      "id": "uuid",
      "name": "Green Valley Apartments",
      "address": "123 Main St",
      "city": "Mumbai",
      "pincode": "400001",
      "totalUnits": 50,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Society
```http
POST /api/admin/societies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Green Valley Apartments",
  "address": "123 Main St",
  "city": "Mumbai",
  "pincode": "400001",
  "totalUnits": 50
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Green Valley Apartments",
  ...
}
```

### Assign Board Member
```http
POST /api/admin/societies/:societyId/board-members
Authorization: Bearer <token>
Content-Type: application/json

{
  "boardMemberId": "uuid",
  "designation": "PRESIDENT"
}
```

**Response:**
```json
{
  "id": "uuid",
  "societyId": "uuid",
  "boardMemberId": "uuid",
  "designation": "PRESIDENT",
  "assignedAt": "2024-01-01T00:00:00Z"
}
```

---

## 🏢 Board Member Endpoints

### Get Own Society Details
```http
GET /api/board/society
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Green Valley Apartments",
  "address": "123 Main St",
  "city": "Mumbai",
  "pincode": "400001",
  "totalUnits": 50,
  "boardMembers": [...],
  "totalMembers": 45
}
```

### List Society Members
```http
GET /api/board/members
Authorization: Bearer <token>
```

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "unitNumber": "101",
      "unitType": "2BHK"
    }
  ]
}
```

### Add Society Member
```http
POST /api/board/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "uuid",
  "unitNumber": "102",
  "unitType": "2BHK",
  "floorNumber": 1
}
```

### Generate Monthly Maintenance
```http
POST /api/board/maintenance/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": 1,
  "year": 2024,
  "dueDate": "2024-01-15"
}
```

**Response:**
```json
{
  "message": "Maintenance bills generated successfully",
  "billsGenerated": 50
}
```

### List All Maintenance Bills
```http
GET /api/board/maintenance
Authorization: Bearer <token>
Query Parameters:
  - status: PENDING | PAID | OVERDUE (optional)
  - month: 1-12 (optional)
  - year: 2024 (optional)
```

**Response:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "unitNumber": "101",
      "memberName": "John Doe",
      "month": 1,
      "year": 2024,
      "amount": 5000.00,
      "status": "PENDING",
      "dueDate": "2024-01-15"
    }
  ]
}
```

### List Visitor Pass Requests
```http
GET /api/board/visitors
Authorization: Bearer <token>
Query Parameters:
  - status: PENDING | APPROVED | REJECTED | EXPIRED (optional)
```

**Response:**
```json
{
  "visitors": [
    {
      "id": "uuid",
      "visitorName": "Jane Smith",
      "visitorPhone": "+9876543210",
      "purpose": "Delivery",
      "expectedDate": "2024-01-10",
      "expectedTime": "14:00:00",
      "status": "PENDING",
      "requestedBy": {
        "name": "John Doe",
        "unitNumber": "101"
      }
    }
  ]
}
```

### Approve Visitor Pass
```http
PUT /api/board/visitors/:visitorId/approve
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "approvedAt": "2024-01-09T10:00:00Z"
}
```

### Reject Visitor Pass
```http
PUT /api/board/visitors/:visitorId/reject
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "updatedAt": "2024-01-09T10:00:00Z"
}
```

### Log Visitor Entry
```http
POST /api/board/visitors/:visitorId/log-entry
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "entryLoggedAt": "2024-01-10T14:30:00Z"
}
```

### Create Notice
```http
POST /api/board/notices
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Monthly Meeting",
  "content": "Monthly society meeting on 15th January",
  "category": "EVENT",
  "priority": "HIGH"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Monthly Meeting",
  "content": "Monthly society meeting on 15th January",
  "category": "EVENT",
  "priority": "HIGH",
  "isActive": true,
  "createdAt": "2024-01-09T10:00:00Z"
}
```

### List Notices
```http
GET /api/board/notices
Authorization: Bearer <token>
Query Parameters:
  - category: GENERAL | MAINTENANCE | EVENT | EMERGENCY (optional)
  - isActive: true | false (optional)
```

**Response:**
```json
{
  "notices": [
    {
      "id": "uuid",
      "title": "Monthly Meeting",
      "content": "...",
      "category": "EVENT",
      "priority": "HIGH",
      "isActive": true,
      "postedBy": "John Doe",
      "createdAt": "2024-01-09T10:00:00Z"
    }
  ]
}
```

### Update Notice
```http
PUT /api/board/notices/:noticeId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "isActive": false
}
```

### Delete Notice
```http
DELETE /api/board/notices/:noticeId
Authorization: Bearer <token>
```

### List All Complaints
```http
GET /api/board/complaints
Authorization: Bearer <token>
Query Parameters:
  - status: OPEN | IN_PROGRESS | RESOLVED | CLOSED (optional)
  - category: PLUMBING | ELECTRICAL | CLEANING | SECURITY | OTHER (optional)
```

**Response:**
```json
{
  "complaints": [
    {
      "id": "uuid",
      "title": "Water Leakage",
      "description": "Water leaking from ceiling",
      "category": "PLUMBING",
      "status": "OPEN",
      "raisedBy": {
        "name": "John Doe",
        "unitNumber": "101"
      },
      "createdAt": "2024-01-09T10:00:00Z"
    }
  ]
}
```

### Update Complaint Status
```http
PUT /api/board/complaints/:complaintId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "assignedTo": "uuid",
  "resolutionNotes": "Plumber assigned"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  "assignedTo": "uuid",
  "resolutionNotes": "Plumber assigned",
  "updatedAt": "2024-01-09T11:00:00Z"
}
```

---

## 👤 Member Endpoints (Mobile)

### Get Own Maintenance Bills
```http
GET /api/member/bills
Authorization: Bearer <token>
Query Parameters:
  - status: PENDING | PAID | OVERDUE (optional)
```

**Response:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "month": 1,
      "year": 2024,
      "amount": 5000.00,
      "status": "PENDING",
      "dueDate": "2024-01-15",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Bill Details
```http
GET /api/member/bills/:billId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "month": 1,
  "year": 2024,
  "amount": 5000.00,
  "status": "PENDING",
  "dueDate": "2024-01-15",
  "unitNumber": "101",
  "unitType": "2BHK",
  "paymentTransaction": null
}
```

### Pay Maintenance Bill
```http
POST /api/member/bills/:billId/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "ONLINE"
}
```

**Response:**
```json
{
  "transactionId": "uuid",
  "billId": "uuid",
  "amount": 5000.00,
  "status": "SUCCESS",
  "paymentDate": "2024-01-10T10:00:00Z"
}
```

### Get Payment History
```http
GET /api/member/payment-history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "billId": "uuid",
      "month": 12,
      "year": 2023,
      "amount": 5000.00,
      "paymentMethod": "ONLINE",
      "status": "SUCCESS",
      "paymentDate": "2023-12-10T10:00:00Z"
    }
  ]
}
```

### Request Visitor Pass
```http
POST /api/member/visitors
Authorization: Bearer <token>
Content-Type: application/json

{
  "visitorName": "Jane Smith",
  "visitorPhone": "+9876543210",
  "visitorEmail": "jane@example.com",
  "purpose": "Delivery",
  "expectedDate": "2024-01-10",
  "expectedTime": "14:00:00"
}
```

**Response:**
```json
{
  "id": "uuid",
  "visitorName": "Jane Smith",
  "visitorPhone": "+9876543210",
  "purpose": "Delivery",
  "expectedDate": "2024-01-10",
  "expectedTime": "14:00:00",
  "status": "PENDING",
  "createdAt": "2024-01-09T10:00:00Z"
}
```

### List Own Visitor Passes
```http
GET /api/member/visitors
Authorization: Bearer <token>
Query Parameters:
  - status: PENDING | APPROVED | REJECTED | EXPIRED (optional)
```

**Response:**
```json
{
  "visitors": [
    {
      "id": "uuid",
      "visitorName": "Jane Smith",
      "visitorPhone": "+9876543210",
      "purpose": "Delivery",
      "expectedDate": "2024-01-10",
      "expectedTime": "14:00:00",
      "status": "APPROVED",
      "approvedAt": "2024-01-09T11:00:00Z"
    }
  ]
}
```

### List Notices
```http
GET /api/member/notices
Authorization: Bearer <token>
Query Parameters:
  - category: GENERAL | MAINTENANCE | EVENT | EMERGENCY (optional)
```

**Response:**
```json
{
  "notices": [
    {
      "id": "uuid",
      "title": "Monthly Meeting",
      "content": "Monthly society meeting on 15th January",
      "category": "EVENT",
      "priority": "HIGH",
      "createdAt": "2024-01-09T10:00:00Z"
    }
  ]
}
```

### Get Notice Details
```http
GET /api/member/notices/:noticeId
Authorization: Bearer <token>
```

### Raise Complaint
```http
POST /api/member/complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Water Leakage",
  "description": "Water leaking from ceiling in bedroom",
  "category": "PLUMBING",
  "photos": [File, File] // Optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Water Leakage",
  "description": "Water leaking from ceiling in bedroom",
  "category": "PLUMBING",
  "status": "OPEN",
  "photos": [
    "https://storage.supabase.co/.../photo1.jpg",
    "https://storage.supabase.co/.../photo2.jpg"
  ],
  "createdAt": "2024-01-09T10:00:00Z"
}
```

### List Own Complaints
```http
GET /api/member/complaints
Authorization: Bearer <token>
Query Parameters:
  - status: OPEN | IN_PROGRESS | RESOLVED | CLOSED (optional)
```

**Response:**
```json
{
  "complaints": [
    {
      "id": "uuid",
      "title": "Water Leakage",
      "description": "Water leaking from ceiling",
      "category": "PLUMBING",
      "status": "OPEN",
      "createdAt": "2024-01-09T10:00:00Z"
    }
  ]
}
```

### Get Complaint Details
```http
GET /api/member/complaints/:complaintId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Water Leakage",
  "description": "Water leaking from ceiling",
  "category": "PLUMBING",
  "status": "IN_PROGRESS",
  "assignedTo": {
    "name": "Board Member Name"
  },
  "resolutionNotes": "Plumber assigned",
  "photos": [...],
  "createdAt": "2024-01-09T10:00:00Z",
  "updatedAt": "2024-01-09T11:00:00Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "field": "error message"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per user

---

## Pagination
For list endpoints, use query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
