// ============================================================================
// USER MANAGEMENT COMPONENT
// ============================================================================
// Admin interface for managing users, roles, and client access
//
// Features:
// - User list with search and role filtering
// - Create/edit/delete users
// - Role assignment (Admin, Business Leader, Project Manager, Field Manager, BA)
// - Client access control (multi-select or "all clients")
// - Active/inactive status toggle
// - Pagination

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { Pagination } from '../ui/Pagination';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  azureAdId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'business_leader' | 'project_manager' | 'field_manager' | 'brand_ambassador';
  clientIds: string[];
  isActive: boolean;
}

interface Client {
  id: string;
  name: string;
  code: string;
}

interface UserManagementProps {
  initialUsers?: User[];
  clients: Client[];
  currentUser: User;
  onCreateUser?: (user: Partial<User>) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
}

// ============================================================================
// USER FORM MODAL
// ============================================================================

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  user?: User | null;
  clients: Client[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, clients }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'brand_ambassador',
    clientIds: user?.clientIds || [],
    isActive: user?.isActive ?? true,
  });

  const [selectedClients, setSelectedClients] = useState<string[]>(user?.clientIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      clientIds: selectedClients,
    });
    onClose();
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {user ? 'Edit User' : 'New User'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                id="lastName"
                label="Last Name"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            {/* Email */}
            <Input
              id="email"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@momentumww.com"
            />

            {/* Role */}
            <Select
              id="role"
              label="Role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'business_leader', label: 'Business Leader' },
                { value: 'project_manager', label: 'Project Manager' },
                { value: 'field_manager', label: 'Field Manager' },
                { value: 'brand_ambassador', label: 'Brand Ambassador' },
              ]}
            />

            {/* Client Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Access {selectedClients.length === 0 && <span className="text-green-600 dark:text-green-400 text-xs">(All Clients)</span>}
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {clients.map(client => (
                  <label
                    key={client.id}
                    className="flex items-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {client.name} ({client.code})
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to grant access to all clients
              </p>
            </div>

            {/* Active Status */}
            <ToggleSwitch
              id="isActive"
              label="Active"
              checked={formData.isActive ?? true}
              onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              tooltip="Inactive users cannot log in"
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {user ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UserManagement: React.FC<UserManagementProps> = ({
  initialUsers = [],
  clients,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  // State
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter.length === 0 || roleFilter.includes(user.role);

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handlers
  const handleCreateUser = async (userData: Partial<User>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      azureAdId: '',
      ...userData,
    } as User;

    setUsers([...users, newUser]);
    if (onCreateUser) await onCreateUser(userData);
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;

    const updatedUsers = users.map(user =>
      user.id === editingUser.id ? { ...user, ...userData } : user
    );
    setUsers(updatedUsers);
    if (onUpdateUser) await onUpdateUser(editingUser.id, userData);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setUsers(users.filter(user => user.id !== userToDelete.id));
    if (onDeleteUser) await onDeleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  const getRoleLabel = (role: User['role']) => {
    const labels = {
      admin: 'Admin',
      business_leader: 'Business Leader',
      project_manager: 'Project Manager',
      field_manager: 'Field Manager',
      brand_ambassador: 'Brand Ambassador',
    };
    return labels[role];
  };

  const getRoleBadgeColor = (role: User['role']) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      business_leader: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      project_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      field_manager: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      brand_ambassador: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[role];
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilter(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage user accounts, roles, and client access
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setShowUserForm(true);
          }}
        >
          <Icon name="add" className="w-5 h-5 mr-2" />
          New User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Users
            </label>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Role Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Role
            </label>
            <div className="flex flex-wrap gap-2">
              {['admin', 'business_leader', 'project_manager', 'field_manager', 'brand_ambassador'].map(role => (
                <button
                  key={role}
                  onClick={() => toggleRoleFilter(role)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    roleFilter.includes(role)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {getRoleLabel(role as User['role'])}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.clientIds.length === 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">All Clients</span>
                      ) : (
                        <span>
                          {user.clientIds
                            .map(id => clients.find(c => c.id === id)?.code)
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserForm(true);
                          }}
                          title="Edit user"
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === currentUser.id}
                          title={user.id === currentUser.id ? 'Cannot delete yourself' : 'Delete user'}
                        >
                          <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </Card>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }}
        onSave={editingUser ? handleUpdateUser : handleCreateUser}
        user={editingUser}
        clients={clients}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User?"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This will set their account to inactive.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * const mockClients = [
 *   { id: 'vz', name: 'Verizon', code: 'VZ' },
 *   { id: 'amex', name: 'American Express', code: 'AMEX' },
 * ];
 *
 * <UserManagement
 *   initialUsers={mockUsers}
 *   clients={mockClients}
 *   currentUser={currentUser}
 *   onCreateUser={async (user) => {
 *     await fetch('/api/users', { method: 'POST', body: JSON.stringify(user) });
 *   }}
 *   onUpdateUser={async (userId, updates) => {
 *     await fetch(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) });
 *   }}
 *   onDeleteUser={async (userId) => {
 *     await fetch(`/api/users/${userId}`, { method: 'DELETE' });
 *   }}
 * />
 */
