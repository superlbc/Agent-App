# User Role Management - API Integration Guide

## Overview

This guide documents the API endpoints needed to integrate the UserRoleManagement system with a backend. Currently, the system uses mock data and local state management. This guide will help you replace those with real API calls.

---

## Required Backend Endpoints

### 1. Get All Users with Roles

**Endpoint**: `GET /api/users/roles`

**Description**: Fetch all users with their assigned roles

**Response**:
```typescript
{
  users: UserWithRoles[];
}

interface UserWithRoles {
  userId: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  jobTitle?: string;
  department?: string;
  roles: {
    roleName: UserRole;
    assignedDate: Date;
    expirationDate?: Date;
    isActive: boolean;
  }[];
  createdDate: Date;
  lastModified: Date;
}
```

**Usage**: Called on component mount to populate the table

---

### 2. Add Single User

**Endpoint**: `POST /api/users/roles`

**Description**: Add a new user with role assignments

**Request Body**:
```typescript
{
  email: string;
  displayName: string;
  photoUrl?: string;
  jobTitle?: string;
  department?: string;
  roles: UserRole[];
  expirationDate?: Date;
  notes?: string;
}
```

**Response**:
```typescript
{
  user: UserWithRoles;
  success: boolean;
  message?: string;
}
```

**Usage**: Called from AddUserModal when user clicks "Add User"

---

### 3. Bulk Add Users

**Endpoint**: `POST /api/users/roles/bulk`

**Description**: Add multiple users at once

**Request Body**:
```typescript
{
  users: {
    email: string;
    displayName: string;
    photoUrl?: string;
    jobTitle?: string;
    department?: string;
    roles: UserRole[];
  }[];
}
```

**Response**:
```typescript
{
  users: UserWithRoles[];
  success: boolean;
  successCount: number;
  failureCount: number;
  errors?: {
    email: string;
    error: string;
  }[];
}
```

**Usage**: Called from BulkAddUsersModal when user clicks "Add All Users"

---

### 4. Import Users from CSV

**Endpoint**: `POST /api/users/roles/import`

**Description**: Import users from validated CSV data

**Request Body**:
```typescript
{
  users: {
    email: string;
    displayName?: string;
    roles: UserRole[];
  }[];
}
```

**Response**:
```typescript
{
  users: UserWithRoles[];
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors?: {
    email: string;
    error: string;
  }[];
}
```

**Usage**: Called from ImportUsersCSVModal after CSV validation

**Note**: The backend should fetch user details from Graph API if displayName is not provided

---

### 5. Update User Roles

**Endpoint**: `PUT /api/users/:userId/roles`

**Description**: Update an existing user's role assignments

**Request Body**:
```typescript
{
  roles: {
    roleName: UserRole;
    isActive: boolean;
    expirationDate?: Date;
    isNew?: boolean;
    isModified?: boolean;
  }[];
}
```

**Response**:
```typescript
{
  user: UserWithRoles;
  success: boolean;
  message?: string;
}
```

**Usage**: Called from EditUserRolesModal when user clicks "Save Changes"

---

### 6. Delete User

**Endpoint**: `DELETE /api/users/:userId/roles`

**Description**: Remove a user and all their role assignments

**Response**:
```typescript
{
  success: boolean;
  message?: string;
}
```

**Usage**: Called after user confirms deletion in ConfirmModal

---

### 7. Bulk Assign Role

**Endpoint**: `POST /api/users/roles/bulk-assign`

**Description**: Assign a role to multiple users at once

**Request Body**:
```typescript
{
  userIds: string[];
  role: UserRole;
}
```

**Response**:
```typescript
{
  success: boolean;
  updatedCount: number;
  skippedCount: number;
  errors?: {
    userId: string;
    error: string;
  }[];
}
```

**Usage**: Called from UserRoleTable bulk operations menu

---

### 8. Bulk Remove Role

**Endpoint**: `POST /api/users/roles/bulk-remove`

**Description**: Remove a role from multiple users at once

**Request Body**:
```typescript
{
  userIds: string[];
  role: UserRole;
}
```

**Response**:
```typescript
{
  success: boolean;
  updatedCount: number;
  skippedCount: number;
  errors?: {
    userId: string;
    error: string;
  }[];
}
```

**Usage**: Called from UserRoleTable bulk operations menu

---

### 9. Bulk Delete Users

**Endpoint**: `DELETE /api/users/roles/bulk`

**Description**: Delete multiple users at once

**Request Body**:
```typescript
{
  userIds: string[];
}
```

**Response**:
```typescript
{
  success: boolean;
  deletedCount: number;
  failedCount: number;
  errors?: {
    userId: string;
    error: string;
  }[];
}
```

**Usage**: Called after user confirms bulk deletion in ConfirmModal

---

## Integration Steps

### Step 1: Create API Service

Create a new file `services/userRoleApi.ts`:

```typescript
import { UserWithRoles, UserRole } from '../types';

const API_BASE = '/api/users/roles';

export const userRoleApi = {
  // Get all users with roles
  async getAllUsers(): Promise<UserWithRoles[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users;
  },

  // Add single user
  async addUser(userData: {
    email: string;
    displayName: string;
    photoUrl?: string;
    jobTitle?: string;
    department?: string;
    roles: UserRole[];
    expirationDate?: Date;
    notes?: string;
  }): Promise<UserWithRoles> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to add user');
    const data = await response.json();
    return data.user;
  },

  // Bulk add users
  async bulkAddUsers(users: {
    email: string;
    displayName: string;
    roles: UserRole[];
  }[]): Promise<{
    users: UserWithRoles[];
    successCount: number;
    failureCount: number;
  }> {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    if (!response.ok) throw new Error('Failed to bulk add users');
    return response.json();
  },

  // Import from CSV
  async importUsers(users: {
    email: string;
    displayName?: string;
    roles: UserRole[];
  }[]): Promise<{
    users: UserWithRoles[];
    importedCount: number;
    skippedCount: number;
  }> {
    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    if (!response.ok) throw new Error('Failed to import users');
    return response.json();
  },

  // Update user roles
  async updateUserRoles(userId: string, roles: {
    roleName: UserRole;
    isActive: boolean;
    expirationDate?: Date;
  }[]): Promise<UserWithRoles> {
    const response = await fetch(`/api/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    if (!response.ok) throw new Error('Failed to update user roles');
    const data = await response.json();
    return data.user;
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/roles`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  // Bulk assign role
  async bulkAssignRole(userIds: string[], role: UserRole): Promise<{
    updatedCount: number;
    skippedCount: number;
  }> {
    const response = await fetch(`${API_BASE}/bulk-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, role }),
    });
    if (!response.ok) throw new Error('Failed to bulk assign role');
    return response.json();
  },

  // Bulk remove role
  async bulkRemoveRole(userIds: string[], role: UserRole): Promise<{
    updatedCount: number;
    skippedCount: number;
  }> {
    const response = await fetch(`${API_BASE}/bulk-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds, role }),
    });
    if (!response.ok) throw new Error('Failed to bulk remove role');
    return response.json();
  },

  // Bulk delete users
  async bulkDeleteUsers(userIds: string[]): Promise<{
    deletedCount: number;
    failedCount: number;
  }> {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to bulk delete users');
    return response.json();
  },
};
```

### Step 2: Update UserRoleManagement Component

Replace the mock data handlers with API calls:

```typescript
// In UserRoleManagement.tsx

import { userRoleApi } from '../../services/userRoleApi';

// Add loading state
const [isLoading, setIsLoading] = useState(false);

// Fetch users on mount
useEffect(() => {
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await userRoleApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to fetch users:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  fetchUsers();
}, []);

// Update handleAddUser
const handleAddUser = async (userData: AddUserData) => {
  try {
    const newUser = await userRoleApi.addUser({
      email: userData.user.email,
      displayName: userData.user.displayName,
      photoUrl: userData.user.photoUrl,
      jobTitle: userData.user.jobTitle,
      department: userData.user.department,
      roles: userData.roles,
      expirationDate: userData.expirationDate,
      notes: userData.notes,
    });

    setUsers([...users, newUser]);
    // TODO: Show success toast
  } catch (error) {
    console.error('[UserRoleManagement] Failed to add user:', error);
    // TODO: Show error toast
  }
};

// Update other handlers similarly...
```

### Step 3: Add Error Handling & Loading States

Add toast notifications or error modals:

```typescript
// Example with toast notifications
import { useToast } from '../../contexts/ToastContext';

const { addToast } = useToast();

const handleAddUser = async (userData: AddUserData) => {
  try {
    const newUser = await userRoleApi.addUser({ ... });
    setUsers([...users, newUser]);
    addToast('User added successfully', 'success');
  } catch (error) {
    console.error('[UserRoleManagement] Failed to add user:', error);
    addToast('Failed to add user. Please try again.', 'error');
  }
};
```

Add loading spinner to UserRoleTable while fetching:

```typescript
{isLoading ? (
  <div className="flex items-center justify-center p-12">
    <Icon name="refresh" className="w-8 h-8 animate-spin text-blue-600" />
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading users...</span>
  </div>
) : (
  <UserRoleTable ... />
)}
```

---

## Database Schema Recommendations

### users_roles Table

```sql
CREATE TABLE users_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  photo_url TEXT,
  job_title VARCHAR(255),
  department VARCHAR(255),
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_email UNIQUE (email)
);

CREATE INDEX idx_users_roles_email ON users_roles(email);
CREATE INDEX idx_users_roles_department ON users_roles(department);
```

### role_assignments Table

```sql
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users_roles(user_id) ON DELETE CASCADE,
  role_name VARCHAR(50) NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiration_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by VARCHAR(255),
  notes TEXT,
  CONSTRAINT unique_user_role UNIQUE (user_id, role_name)
);

CREATE INDEX idx_role_assignments_user_id ON role_assignments(user_id);
CREATE INDEX idx_role_assignments_role_name ON role_assignments(role_name);
CREATE INDEX idx_role_assignments_expiration ON role_assignments(expiration_date) WHERE expiration_date IS NOT NULL;
```

---

## Testing Checklist

- [ ] GET /api/users/roles returns all users
- [ ] POST /api/users/roles creates new user
- [ ] POST /api/users/roles/bulk creates multiple users
- [ ] POST /api/users/roles/import imports CSV data
- [ ] PUT /api/users/:userId/roles updates user roles
- [ ] DELETE /api/users/:userId/roles deletes user
- [ ] POST /api/users/roles/bulk-assign assigns role to multiple users
- [ ] POST /api/users/roles/bulk-remove removes role from multiple users
- [ ] DELETE /api/users/roles/bulk deletes multiple users
- [ ] Error handling works for all endpoints
- [ ] Loading states display correctly
- [ ] Toast notifications show success/error messages
- [ ] Graph API integration works for user enrichment

---

## Security Considerations

1. **Authentication**: All endpoints must require authentication
2. **Authorization**: Verify user has `ADMIN_USER_MANAGE` permission
3. **Input Validation**: Validate all incoming data on the backend
4. **SQL Injection Prevention**: Use parameterized queries
5. **Rate Limiting**: Prevent abuse of bulk operations
6. **Audit Logging**: Log all user role changes for compliance

---

## Next Steps

1. Implement backend API endpoints
2. Create `services/userRoleApi.ts` service
3. Update `UserRoleManagement.tsx` to use API calls
4. Add toast notification system
5. Add loading states to UI
6. Implement error handling
7. Test all CRUD operations
8. Add audit logging
9. Deploy to production

---

**Last Updated**: 2025-11-22
**Component Version**: 1.0.0
**Status**: Ready for Backend Integration
