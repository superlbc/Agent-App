// ============================================================================
// USER ROLE API SERVICE
// ============================================================================
// API service for user role management operations
// Handles all CRUD operations for users and their role assignments

import { UserRole } from '../types';
import { UserWithRoles } from '../components/admin/UserRoleTable';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AddUserRequest {
  email: string;
  displayName: string;
  photoUrl?: string;
  jobTitle?: string;
  department?: string;
  roles: UserRole[];
  expirationDate?: Date;
  notes?: string;
}

export interface BulkAddUsersRequest {
  users: {
    email: string;
    displayName: string;
    photoUrl?: string;
    jobTitle?: string;
    department?: string;
    roles: UserRole[];
  }[];
}

export interface ImportUsersRequest {
  users: {
    email: string;
    displayName?: string;
    roles: UserRole[];
  }[];
}

export interface UpdateUserRolesRequest {
  roles: {
    roleName: UserRole;
    isActive: boolean;
    expirationDate?: Date;
    isNew?: boolean;
    isModified?: boolean;
  }[];
}

export interface BulkRoleRequest {
  userIds: string[];
  role: UserRole;
}

export interface BulkDeleteRequest {
  userIds: string[];
}

// ============================================================================
// API SERVICE
// ============================================================================

const API_BASE = '/api/users/roles';

class UserRoleApiService {
  /**
   * Get all users with their role assignments
   */
  async getAllUsers(): Promise<UserWithRoles[]> {
    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch users`);
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('[UserRoleApi] getAllUsers error:', error);
      throw error;
    }
  }

  /**
   * Add a single user with role assignments
   */
  async addUser(userData: AddUserRequest): Promise<UserWithRoles> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to add user`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('[UserRoleApi] addUser error:', error);
      throw error;
    }
  }

  /**
   * Add multiple users at once
   */
  async bulkAddUsers(request: BulkAddUsersRequest): Promise<{
    users: UserWithRoles[];
    successCount: number;
    failureCount: number;
    errors?: { email: string; error: string }[];
  }> {
    try {
      const response = await fetch(`${API_BASE}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to bulk add users`);
      }

      return response.json();
    } catch (error) {
      console.error('[UserRoleApi] bulkAddUsers error:', error);
      throw error;
    }
  }

  /**
   * Import users from CSV data
   */
  async importUsers(request: ImportUsersRequest): Promise<{
    users: UserWithRoles[];
    importedCount: number;
    skippedCount: number;
    errors?: { email: string; error: string }[];
  }> {
    try {
      const response = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to import users`);
      }

      return response.json();
    } catch (error) {
      console.error('[UserRoleApi] importUsers error:', error);
      throw error;
    }
  }

  /**
   * Update an existing user's role assignments
   */
  async updateUserRoles(userId: string, request: UpdateUserRolesRequest): Promise<UserWithRoles> {
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update user roles`);
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('[UserRoleApi] updateUserRoles error:', error);
      throw error;
    }
  }

  /**
   * Delete a user and all their role assignments
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete user`);
      }
    } catch (error) {
      console.error('[UserRoleApi] deleteUser error:', error);
      throw error;
    }
  }

  /**
   * Assign a role to multiple users at once
   */
  async bulkAssignRole(request: BulkRoleRequest): Promise<{
    updatedCount: number;
    skippedCount: number;
    errors?: { userId: string; error: string }[];
  }> {
    try {
      const response = await fetch(`${API_BASE}/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to bulk assign role`);
      }

      return response.json();
    } catch (error) {
      console.error('[UserRoleApi] bulkAssignRole error:', error);
      throw error;
    }
  }

  /**
   * Remove a role from multiple users at once
   */
  async bulkRemoveRole(request: BulkRoleRequest): Promise<{
    updatedCount: number;
    skippedCount: number;
    errors?: { userId: string; error: string }[];
  }> {
    try {
      const response = await fetch(`${API_BASE}/bulk-remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to bulk remove role`);
      }

      return response.json();
    } catch (error) {
      console.error('[UserRoleApi] bulkRemoveRole error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple users at once
   */
  async bulkDeleteUsers(request: BulkDeleteRequest): Promise<{
    deletedCount: number;
    failedCount: number;
    errors?: { userId: string; error: string }[];
  }> {
    try {
      const response = await fetch(`${API_BASE}/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to bulk delete users`);
      }

      return response.json();
    } catch (error) {
      console.error('[UserRoleApi] bulkDeleteUsers error:', error);
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const userRoleApi = new UserRoleApiService();

export default userRoleApi;
