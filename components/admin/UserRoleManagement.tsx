// ============================================================================
// USER ROLE MANAGEMENT COMPONENT
// ============================================================================
// Complete user role management system with table-based UI
// This component integrates UserRoleTable with all CRUD modals

import React, { useState } from 'react';
import { UserWithRoles, UserRoleTable } from './UserRoleTable';
import { AddUserModal, AddUserData } from './AddUserModal';
import { BulkAddUsersModal, BulkUserData } from './BulkAddUsersModal';
import { ImportUsersCSVModal, CSVUserData } from './ImportUsersCSVModal';
import { EditUserRolesModal, UpdatedRoleData } from './EditUserRolesModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { UserRole } from '../../types';
import { GraphService } from '../../services/graphService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserRoleManagementProps {
  availableRoles: UserRole[];
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({
  availableRoles,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  // Users data
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  // TODO: Add loading and error states when implementing API integration
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithRoles | null>(null);

  // Confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [userIdsToDelete, setUserIdsToDelete] = useState<string[]>([]);

  // Graph service
  const graphService = GraphService.getInstance();

  // ============================================================================
  // EFFECTS - FETCH USERS ON MOUNT
  // ============================================================================

  // TODO: Uncomment when backend is ready
  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     setIsLoading(true);
  //     try {
  //       const fetchedUsers = await userRoleApi.getAllUsers();
  //       setUsers(fetchedUsers);
  //     } catch (error) {
  //       console.error('[UserRoleManagement] Failed to fetch users:', error);
  //       setError('Failed to load users. Please try again.');
  //       // TODO: Show error toast
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //
  //   fetchUsers();
  // }, []);

  // ============================================================================
  // HANDLERS - ADD USER
  // ============================================================================

  const handleAddUser = async (userData: AddUserData) => {
    try {
      // TODO: Replace mock implementation with API call when backend is ready
      // const newUser = await userRoleApi.addUser({
      //   email: userData.user.email,
      //   displayName: userData.user.displayName,
      //   photoUrl: userData.user.photoUrl,
      //   jobTitle: userData.user.jobTitle,
      //   department: userData.user.department,
      //   roles: userData.roles,
      //   expirationDate: userData.expirationDate,
      //   notes: userData.notes,
      // });
      // setUsers([...users, newUser]);
      // TODO: Show success toast

      // MOCK IMPLEMENTATION (remove when API is ready)
      // This creates a local user object for testing without a backend

      const newUser: UserWithRoles = {
        userId: `user-${Date.now()}`,
        displayName: userData.user.displayName,
        email: userData.user.email,
        photoUrl: userData.user.photoUrl,
        jobTitle: userData.user.jobTitle,
        department: userData.user.department,
        roles: userData.roles.map(role => ({
          roleName: role,
          assignedDate: new Date(),
          expirationDate: userData.expirationDate,
          isActive: true,
        })),
        createdDate: new Date(),
        lastModified: new Date(),
      };

      setUsers([...users, newUser]);
      console.log('[UserRoleManagement] User added (MOCK):', newUser);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to add user:', error);
      // TODO: Show error toast when API is integrated
    }
  };

  // ============================================================================
  // HANDLERS - BULK ADD USERS
  // ============================================================================

  const handleBulkAddUsers = async (usersData: BulkUserData[]) => {
    try {
      // TODO: Replace mock implementation with API call when backend is ready
      // const result = await userRoleApi.bulkAddUsers({ users: usersData.map(...) });
      // setUsers([...users, ...result.users]);
      // TODO: Show success toast with count: `${result.successCount} users added`

      // MOCK IMPLEMENTATION (remove when API is ready)
      const newUsers: UserWithRoles[] = usersData.map(userData => ({
        userId: `user-${Date.now()}-${userData.user.email}`,
        displayName: userData.user.displayName,
        email: userData.user.email,
        photoUrl: userData.user.photoUrl,
        jobTitle: userData.user.jobTitle,
        department: userData.user.department,
        roles: userData.roles.map(role => ({
          roleName: role,
          assignedDate: new Date(),
          expirationDate: undefined,
          isActive: true,
        })),
        createdDate: new Date(),
        lastModified: new Date(),
      }));

      setUsers([...users, ...newUsers]);
      console.log('[UserRoleManagement] Bulk users added:', newUsers.length);

      // TODO: Replace with actual API call
      // await api.createUsersWithRoles(newUsers);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to bulk add users:', error);
      // TODO: Show error toast/notification
    }
  };

  // ============================================================================
  // HANDLERS - IMPORT CSV
  // ============================================================================

  const handleImportUsers = async (csvData: CSVUserData[]) => {
    try {
      // Fetch user details from Graph API for users without display name
      const newUsers: UserWithRoles[] = await Promise.all(
        csvData.map(async (csvUser) => {
          let displayName = csvUser.displayName || csvUser.email;
          let photoUrl: string | undefined;
          let jobTitle: string | undefined;
          let department: string | undefined;

          // Fetch user details from Graph API if display name not provided
          if (!csvUser.displayName) {
            try {
              const graphUsers = await graphService.searchUsers(csvUser.email);
              if (graphUsers.length > 0) {
                const graphUser = graphUsers[0];
                displayName = graphUser.displayName || csvUser.email;
                jobTitle = graphUser.jobTitle;
                department = graphUser.department;

                try {
                  photoUrl = await graphService.getUserPhoto(csvUser.email);
                } catch {
                  // Photo not available
                }
              }
            } catch (error) {
              console.warn('[UserRoleManagement] Failed to fetch user from Graph:', csvUser.email);
            }
          }

          return {
            userId: `user-${Date.now()}-${csvUser.email}`,
            displayName,
            email: csvUser.email,
            photoUrl,
            jobTitle,
            department,
            roles: csvUser.roles.map(role => ({
              roleName: role,
              assignedDate: new Date(),
              expirationDate: undefined,
              isActive: true,
            })),
            createdDate: new Date(),
            lastModified: new Date(),
          };
        })
      );

      setUsers([...users, ...newUsers]);
      console.log('[UserRoleManagement] CSV users imported:', newUsers.length);

      // TODO: Replace with actual API call
      // await api.createUsersWithRoles(newUsers);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to import CSV:', error);
      // TODO: Show error toast/notification
    }
  };

  // ============================================================================
  // HANDLERS - EDIT USER
  // ============================================================================

  const handleEditUser = (user: UserWithRoles) => {
    setUserToEdit(user);
    setShowEditModal(true);
  };

  const handleSaveUserRoles = async (userId: string, updatedRoles: UpdatedRoleData[]) => {
    try {
      // TODO: Replace mock implementation with API call when backend is ready
      // const updatedUser = await userRoleApi.updateUserRoles(userId, { roles: updatedRoles });
      // setUsers(users.map(u => u.userId === userId ? updatedUser : u));
      // TODO: Show success toast

      // MOCK IMPLEMENTATION (remove when API is ready)
      setUsers(users.map(user => {
        if (user.userId === userId) {
          return {
            ...user,
            roles: updatedRoles
              .filter(r => r.isActive) // Only include active roles
              .map(r => ({
                roleName: r.roleName,
                assignedDate: r.isNew ? new Date() : (user.roles.find(ur => ur.roleName === r.roleName)?.assignedDate || new Date()),
                expirationDate: r.expirationDate,
                isActive: r.isActive,
              })),
            lastModified: new Date(),
          };
        }
        return user;
      }));

      console.log('[UserRoleManagement] User roles updated:', userId);

      // TODO: Replace with actual API call
      // await api.updateUserRoles(userId, updatedRoles);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to update user roles:', error);
      // TODO: Show error toast/notification
    }
  };

  // ============================================================================
  // HANDLERS - DELETE USER
  // ============================================================================

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // TODO: Replace mock implementation with API call when backend is ready
      // await userRoleApi.deleteUser(userToDelete);
      // setUsers(users.filter(user => user.userId !== userToDelete));
      // TODO: Show success toast

      // MOCK IMPLEMENTATION (remove when API is ready)
      setUsers(users.filter(user => user.userId !== userToDelete));
      console.log('[UserRoleManagement] User deleted (MOCK):', userToDelete);

      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to delete user:', error);
      // TODO: Show error toast when API is integrated
    }
  };

  // ============================================================================
  // HANDLERS - BULK OPERATIONS
  // ============================================================================

  const handleBulkAssignRole = async (userIds: string[], role: UserRole) => {
    try {
      setUsers(users.map(user => {
        if (userIds.includes(user.userId)) {
          // Check if user already has this role
          const hasRole = user.roles.some(r => r.roleName === role);

          if (!hasRole) {
            return {
              ...user,
              roles: [
                ...user.roles,
                {
                  roleName: role,
                  assignedDate: new Date(),
                  expirationDate: undefined,
                  isActive: true,
                },
              ],
              lastModified: new Date(),
            };
          }
        }
        return user;
      }));

      console.log('[UserRoleManagement] Bulk role assigned:', role, 'to', userIds.length, 'users');

      // TODO: Replace with actual API call
      // await api.bulkAssignRole(userIds, role);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to bulk assign role:', error);
      // TODO: Show error toast/notification
    }
  };

  const handleBulkRemoveRole = async (userIds: string[], role: UserRole) => {
    try {
      setUsers(users.map(user => {
        if (userIds.includes(user.userId)) {
          return {
            ...user,
            roles: user.roles.filter(r => r.roleName !== role),
            lastModified: new Date(),
          };
        }
        return user;
      }));

      console.log('[UserRoleManagement] Bulk role removed:', role, 'from', userIds.length, 'users');

      // TODO: Replace with actual API call
      // await api.bulkRemoveRole(userIds, role);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to bulk remove role:', error);
      // TODO: Show error toast/notification
    }
  };

  const handleBulkDelete = (userIds: string[]) => {
    setUserIdsToDelete(userIds);
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setUsers(users.filter(user => !userIdsToDelete.includes(user.userId)));
      console.log('[UserRoleManagement] Bulk users deleted:', userIdsToDelete.length);

      // TODO: Replace with actual API call
      // await api.bulkDeleteUsers(userIdsToDelete);

      setShowBulkDeleteConfirm(false);
      setUserIdsToDelete([]);
    } catch (error) {
      console.error('[UserRoleManagement] Failed to bulk delete users:', error);
      // TODO: Show error toast/notification
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {/* User Role Table */}
      <UserRoleTable
        users={users}
        availableRoles={availableRoles}
        onAddUser={() => setShowAddModal(true)}
        onAddBulk={() => setShowBulkModal(true)}
        onImportCSV={() => setShowImportModal(true)}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onBulkAssignRole={handleBulkAssignRole}
        onBulkRemoveRole={handleBulkRemoveRole}
        onBulkDelete={handleBulkDelete}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        availableRoles={availableRoles}
        onAddUser={handleAddUser}
        onClose={() => setShowAddModal(false)}
      />

      {/* Bulk Add Users Modal */}
      <BulkAddUsersModal
        isOpen={showBulkModal}
        availableRoles={availableRoles}
        onAddUsers={handleBulkAddUsers}
        onClose={() => setShowBulkModal(false)}
      />

      {/* Import CSV Modal */}
      <ImportUsersCSVModal
        isOpen={showImportModal}
        availableRoles={availableRoles}
        onImportUsers={handleImportUsers}
        onClose={() => setShowImportModal(false)}
      />

      {/* Edit User Roles Modal */}
      <EditUserRolesModal
        isOpen={showEditModal}
        user={userToEdit}
        availableRoles={availableRoles}
        onSave={handleSaveUserRoles}
        onClose={() => {
          setShowEditModal(false);
          setUserToEdit(null);
        }}
      />

      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to remove this user and all their role assignments? This action cannot be undone.`}
        confirmText="Delete User"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setUserToDelete(null);
        }}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title="Delete Multiple Users"
        message={`Are you sure you want to delete ${userIdsToDelete.length} user${userIdsToDelete.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${userIdsToDelete.length} User${userIdsToDelete.length !== 1 ? 's' : ''}`}
        confirmVariant="danger"
        onConfirm={confirmBulkDelete}
        onCancel={() => {
          setShowBulkDeleteConfirm(false);
          setUserIdsToDelete([]);
        }}
      />
    </div>
  );
};

export default UserRoleManagement;
