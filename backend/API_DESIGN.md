# Employee Onboarding System - REST API Design

## Overview

This document defines the RESTful API endpoints for the Employee Onboarding System. All endpoints require Azure AD authentication and appropriate RBAC permissions.

---

## Authentication & Authorization

**Authentication**: Azure AD Bearer Token
**Authorization**: Role-Based Access Control (RBAC) with 8 roles and 64+ permissions

**Required Headers**:
```
Authorization: Bearer {Azure AD Token}
Content-Type: application/json
```

**Permission Checking**: Backend validates permissions using JWT token claims and RBAC system

---

## API Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://note-crafter-backend-xxx.run.app/api`

---

## 1. Pre-Hire Endpoints

### 1.1 Get All Pre-Hires
```
GET /api/pre-hires
```

**Permission Required**: `PREHIRE_READ`

**Query Parameters**:
- `status` (optional): Filter by status (candidate, offered, accepted, linked, cancelled)
- `department` (optional): Filter by department
- `startDate_from` (optional): Filter by start date range (ISO 8601)
- `startDate_to` (optional): Filter by start date range (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "pre-2025-001",
      "candidateName": "Jane Smith",
      "email": "jane.smith@momentumww.com",
      "role": "XD Designer",
      "department": "Creative",
      "startDate": "2025-12-01T00:00:00Z",
      "hiringManager": "John Doe",
      "status": "accepted",
      "assignedPackage": {
        "id": "pkg-xd-std-001",
        "name": "XD Designer Standard"
      },
      "linkedEmployeeId": null,
      "createdBy": "hr@momentumww.com",
      "createdDate": "2025-11-01T14:30:00Z",
      "lastModified": "2025-11-10T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 23,
    "totalPages": 1
  }
}
```

---

### 1.2 Get Pre-Hire by ID
```
GET /api/pre-hires/:id
```

**Permission Required**: `PREHIRE_READ`

**Response**: `200 OK`
```json
{
  "id": "pre-2025-001",
  "candidateName": "Jane Smith",
  "email": "jane.smith@momentumww.com",
  "role": "XD Designer",
  "department": "Creative",
  "startDate": "2025-12-01T00:00:00Z",
  "hiringManager": "John Doe",
  "status": "accepted",
  "assignedPackage": { /* full package object */ },
  "customizations": {
    "addedSoftware": [
      { "id": "sw-c4d-001", "name": "Cinema 4D Studio" }
    ],
    "reason": "Requested during negotiation"
  },
  "linkedEmployeeId": null,
  "createdBy": "hr@momentumww.com",
  "createdDate": "2025-11-01T14:30:00Z",
  "lastModified": "2025-11-10T09:15:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Pre-hire record not found
- `403 Forbidden`: Insufficient permissions

---

### 1.3 Create Pre-Hire
```
POST /api/pre-hires
```

**Permission Required**: `PREHIRE_CREATE`

**Request Body**:
```json
{
  "candidateName": "Jane Smith",
  "email": "jane.smith@momentumww.com",
  "role": "XD Designer",
  "department": "Creative",
  "startDate": "2025-12-01",
  "hiringManager": "John Doe",
  "status": "candidate"
}
```

**Response**: `201 Created`
```json
{
  "id": "pre-2025-024",
  "candidateName": "Jane Smith",
  "email": "jane.smith@momentumww.com",
  "role": "XD Designer",
  "department": "Creative",
  "startDate": "2025-12-01T00:00:00Z",
  "hiringManager": "John Doe",
  "status": "candidate",
  "assignedPackage": null,
  "linkedEmployeeId": null,
  "createdBy": "hr@momentumww.com",
  "createdDate": "2025-11-21T10:00:00Z",
  "lastModified": "2025-11-21T10:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data (validation errors)
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Duplicate email address

---

### 1.4 Update Pre-Hire
```
PUT /api/pre-hires/:id
```

**Permission Required**: `PREHIRE_UPDATE`

**Request Body** (partial update supported):
```json
{
  "status": "accepted",
  "assignedPackage": {
    "id": "pkg-xd-std-001"
  },
  "customizations": {
    "addedSoftware": [
      { "id": "sw-c4d-001", "name": "Cinema 4D Studio" }
    ],
    "reason": "Requested during negotiation"
  }
}
```

**Response**: `200 OK` (returns updated pre-hire object)

**Error Responses**:
- `404 Not Found`: Pre-hire record not found
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Insufficient permissions

---

### 1.5 Delete Pre-Hire
```
DELETE /api/pre-hires/:id
```

**Permission Required**: `PREHIRE_DELETE`

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Pre-hire record not found
- `403 Forbidden`: Insufficient permissions

---

## 2. Package Endpoints

### 2.1 Get All Packages
```
GET /api/packages
```

**Permission Required**: `PACKAGE_READ`

**Query Parameters**:
- `type` (optional): Filter by type (standard, exception)
- `roleTarget` (optional): Filter by target role
- `departmentTarget` (optional): Filter by target department
- `page`, `limit`: Pagination

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "pkg-xd-std-001",
      "name": "XD Designer Standard",
      "description": "Standard equipment package for Experience Designers",
      "roleTarget": ["XD Designer", "Senior XD Designer"],
      "departmentTarget": ["Creative", "IPTC"],
      "hardware": [
        {
          "id": "hw-001",
          "type": "computer",
          "model": "MacBook Pro 16\" M3 Max",
          "manufacturer": "Apple"
        }
      ],
      "software": [
        {
          "id": "sw-adobe-001",
          "name": "Adobe Creative Cloud"
        }
      ],
      "isStandard": true,
      "createdBy": "admin@momentumww.com",
      "createdDate": "2025-01-15T10:00:00Z",
      "lastModified": "2025-03-20T14:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 2.2 Get Package by ID
```
GET /api/packages/:id
```

**Permission Required**: `PACKAGE_READ`

**Response**: `200 OK` (full package object with all hardware and software details)

---

### 2.3 Create Package
```
POST /api/packages
```

**Permission Required**:
- `PACKAGE_CREATE_STANDARD` (for standard packages)
- `PACKAGE_CREATE_EXCEPTION` (for exception packages)

**Request Body**:
```json
{
  "name": "XD Designer Standard",
  "description": "Standard equipment package for Experience Designers",
  "roleTarget": ["XD Designer"],
  "departmentTarget": ["Creative"],
  "hardware": [
    { "id": "hw-001" },
    { "id": "hw-002" }
  ],
  "software": [
    { "id": "sw-adobe-001" }
  ],
  "isStandard": true
}
```

**Response**: `201 Created`

**Error Responses**:
- `403 Forbidden`: Insufficient permissions for package type
- `400 Bad Request`: Invalid data

---

### 2.4 Update Package
```
PUT /api/packages/:id
```

**Permission Required**: `PACKAGE_UPDATE`

**Request Body**: Partial update supported

**Response**: `200 OK`

---

### 2.5 Delete Package
```
DELETE /api/packages/:id
```

**Permission Required**: `PACKAGE_DELETE`

**Response**: `204 No Content`

---

## 3. Hardware Endpoints

### 3.1 Get All Hardware
```
GET /api/hardware
```

**Permission Required**: `HARDWARE_READ`

**Query Parameters**:
- `type` (optional): Filter by type (computer, monitor, keyboard, mouse, dock, headset, accessory)
- `status` (optional): Filter by status (available, assigned, maintenance, retired)
- `manufacturer` (optional): Filter by manufacturer
- `page`, `limit`: Pagination

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "hw-001",
      "type": "computer",
      "model": "MacBook Pro 16\" M3 Max",
      "manufacturer": "Apple",
      "specifications": {
        "processor": "M3 Max",
        "ram": "64GB",
        "storage": "2TB SSD"
      },
      "status": "available",
      "serialNumber": "C02ABC123456",
      "purchaseDate": "2025-01-15T00:00:00Z",
      "cost": 4299.00
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 3.2 Get Hardware by ID
```
GET /api/hardware/:id
```

**Permission Required**: `HARDWARE_READ`

**Response**: `200 OK`

---

### 3.3 Create Hardware
```
POST /api/hardware
```

**Permission Required**: `HARDWARE_CREATE`

**Request Body**:
```json
{
  "type": "computer",
  "model": "MacBook Pro 16\" M3 Max",
  "manufacturer": "Apple",
  "specifications": {
    "processor": "M3 Max",
    "ram": "64GB",
    "storage": "2TB SSD"
  },
  "status": "available",
  "serialNumber": "C02ABC123456",
  "purchaseDate": "2025-01-15",
  "cost": 4299.00
}
```

**Response**: `201 Created`

---

### 3.4 Bulk Import Hardware
```
POST /api/hardware/bulk
```

**Permission Required**: `HARDWARE_CREATE`

**Request Body**:
```json
{
  "items": [
    { /* hardware object 1 */ },
    { /* hardware object 2 */ },
    { /* hardware object 3 */ }
  ]
}
```

**Response**: `200 OK`
```json
{
  "success": 23,
  "failed": 2,
  "errors": [
    {
      "row": 15,
      "error": "Duplicate serial number"
    }
  ]
}
```

---

### 3.5 Update Hardware
```
PUT /api/hardware/:id
```

**Permission Required**: `HARDWARE_UPDATE`

**Response**: `200 OK`

---

### 3.6 Delete Hardware
```
DELETE /api/hardware/:id
```

**Permission Required**: `HARDWARE_DELETE`

**Response**: `204 No Content`

---

## 4. Software/License Endpoints

### 4.1 Get All Software
```
GET /api/software
```

**Permission Required**: `SOFTWARE_READ`

**Query Parameters**:
- `licenseType` (optional): Filter by type (perpetual, subscription, concurrent)
- `vendor` (optional): Filter by vendor
- `page`, `limit`: Pagination

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "sw-c4d-001",
      "name": "Cinema 4D Studio",
      "vendor": "Maxon",
      "licenseType": "subscription",
      "seatCount": 10,
      "assignedSeats": 8,
      "availableSeats": 2,
      "requiresApproval": true,
      "approver": "Steve Sanderson",
      "cost": 94.99,
      "renewalFrequency": "monthly"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 4.2 Create Software/License Pool
```
POST /api/software
```

**Permission Required**: `SOFTWARE_CREATE`

**Request Body**:
```json
{
  "name": "Cinema 4D Studio",
  "vendor": "Maxon",
  "licenseType": "subscription",
  "seatCount": 10,
  "requiresApproval": true,
  "approver": "Steve Sanderson",
  "cost": 94.99,
  "renewalFrequency": "monthly"
}
```

**Response**: `201 Created`

---

### 4.3 Assign License
```
POST /api/software/:id/assignments
```

**Permission Required**: `SOFTWARE_ASSIGN`

**Request Body**:
```json
{
  "employeeId": "emp-001",
  "employeeName": "Jane Smith",
  "employeeEmail": "jane.smith@momentumww.com",
  "expirationDate": "2026-12-31",
  "notes": "Temporary assignment for Q4 project"
}
```

**Response**: `201 Created`
```json
{
  "assignmentId": "assign-001",
  "licenseId": "sw-c4d-001",
  "employeeId": "emp-001",
  "assignedDate": "2025-11-21T10:00:00Z",
  "expirationDate": "2026-12-31T00:00:00Z",
  "status": "active"
}
```

---

### 4.4 Reclaim License
```
DELETE /api/software/:id/assignments/:assignmentId
```

**Permission Required**: `SOFTWARE_RECLAIM`

**Response**: `204 No Content`

---

## 5. Approval Endpoints

### 5.1 Get All Approval Requests
```
GET /api/approvals
```

**Permission Required**: `APPROVAL_READ`

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected)
- `requestType` (optional): Filter by type (equipment, software, exception)
- `page`, `limit`: Pagination

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "apr-2025-001",
      "employeeId": "emp-001",
      "employeeName": "Jane Smith",
      "requestType": "exception",
      "items": [
        {
          "type": "software",
          "id": "sw-c4d-001",
          "name": "Cinema 4D Studio",
          "cost": 94.99
        }
      ],
      "requester": "John Doe",
      "requestDate": "2025-11-12T14:00:00Z",
      "approver": "Steve Sanderson",
      "status": "pending",
      "automatedDecision": false
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 5.2 Create Approval Request
```
POST /api/approvals
```

**Permission Required**: `APPROVAL_CREATE`

**Request Body**:
```json
{
  "employeeId": "emp-001",
  "employeeName": "Jane Smith",
  "requestType": "exception",
  "items": [
    {
      "type": "software",
      "id": "sw-c4d-001"
    }
  ],
  "packageId": "pkg-xd-std-001",
  "notes": "Requested during candidate negotiation"
}
```

**Response**: `201 Created`

---

### 5.3 Approve Request
```
PATCH /api/approvals/:id/approve
```

**Permission Required**: `APPROVAL_APPROVE`

**Request Body**:
```json
{
  "notes": "Approved for Q4 project"
}
```

**Response**: `200 OK`

**Side Effects**: Creates Helix ticket for IT provisioning

---

### 5.4 Reject Request
```
PATCH /api/approvals/:id/reject
```

**Permission Required**: `APPROVAL_REJECT`

**Request Body**:
```json
{
  "rejectionReason": "Budget constraints for Q4"
}
```

**Response**: `200 OK`

---

## 6. Role Management Endpoints (Admin Only)

### 6.1 Get All Role Assignments
```
GET /api/roles/assignments
```

**Permission Required**: `ADMIN_ROLE_MANAGE`

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "assignment-001",
      "userId": "user-123",
      "userEmail": "jane.smith@momentumww.com",
      "userName": "Jane Smith",
      "roleId": "role-hr",
      "roleName": "HR",
      "assignedBy": "admin@momentumww.com",
      "assignedDate": "2025-01-15T10:00:00Z",
      "isActive": true
    }
  ]
}
```

---

### 6.2 Assign Role to User
```
POST /api/roles/assignments
```

**Permission Required**: `ADMIN_ROLE_MANAGE`

**Request Body**:
```json
{
  "userEmail": "jane.smith@momentumww.com",
  "roleName": "HR"
}
```

**Response**: `201 Created`

---

### 6.3 Revoke Role from User
```
DELETE /api/roles/assignments/:id
```

**Permission Required**: `ADMIN_ROLE_MANAGE`

**Response**: `204 No Content`

---

## 7. Error Responses

All endpoints follow standard HTTP status codes and return consistent error format:

**400 Bad Request**:
```json
{
  "error": "validation_error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized**:
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing Azure AD token"
}
```

**403 Forbidden**:
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions",
  "requiredPermission": "PREHIRE_CREATE"
}
```

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "requestId": "req-123abc"
}
```

---

## 8. Database Schema

**Technology**: PostgreSQL (recommended) or MongoDB

**Tables/Collections**:
- `pre_hires` - Pre-hire candidate records
- `packages` - Equipment package definitions
- `hardware` - Hardware inventory
- `software` - Software/license pools
- `license_assignments` - License assignment tracking
- `approvals` - Approval request tracking
- `helix_tickets` - Helix ticket integration
- `role_assignments` - RBAC user role assignments

---

## 9. Next Steps

1. ✅ Design REST API structure (this document)
2. ⏳ Set up database (PostgreSQL or MongoDB)
3. ⏳ Implement backend endpoints in server.js
4. ⏳ Create frontend service layer (preHireService.ts, etc.)
5. ⏳ Update React contexts to use API calls
6. ⏳ Add loading states and error handling
7. ⏳ End-to-end testing

---

**Version**: 1.0
**Last Updated**: 2025-11-21
**Author**: Claude Code
