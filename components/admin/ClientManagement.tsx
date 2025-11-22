// ============================================================================
// CLIENT MANAGEMENT COMPONENT
// ============================================================================
// Admin interface for managing clients and integration settings
//
// Features:
// - Client list (cards or table view)
// - Create/edit/delete clients
// - Integration toggles (Brandscopic, QR Tiger, Qualtrics)
// - Active/inactive status
// - Validation: Cannot delete client if events exist

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { ToggleSwitch } from '../ui/ToggleSwitch';

// ============================================================================
// TYPES
// ============================================================================

interface Client {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  brandscopicEnabled: boolean;
  qrTigerEnabled: boolean;
  qualtricsEnabled: boolean;
  tenantId?: string;
  eventCount?: number; // For validation
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ClientManagementProps {
  initialClients?: Client[];
  onCreateClient?: (client: Partial<Client>) => Promise<void>;
  onUpdateClient?: (clientId: string, updates: Partial<Client>) => Promise<void>;
  onDeleteClient?: (clientId: string) => Promise<void>;
}

// ============================================================================
// CLIENT FORM MODAL
// ============================================================================

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  client?: Client | null;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: client?.name || '',
    code: client?.code || '',
    tenantId: client?.tenantId || '',
    isActive: client?.isActive ?? true,
    brandscopicEnabled: client?.brandscopicEnabled ?? false,
    qrTigerEnabled: client?.qrTigerEnabled ?? false,
    qualtricsEnabled: client?.qualtricsEnabled ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      code: formData.code?.toUpperCase(), // Ensure uppercase
    });
    onClose();
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
              {client ? 'Edit Client' : 'New Client'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Client Information
              </h3>

              <Input
                id="name"
                label="Client Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Verizon, American Express"
              />

              <Input
                id="code"
                label="Client Code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., VZ, AMEX"
                className="uppercase"
              />

              <Input
                id="tenantId"
                label="Tenant ID (Optional)"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                placeholder="For multi-tenant data separation"
              />
            </div>

            {/* Integrations */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Integrations
              </h3>

              <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                <ToggleSwitch
                  id="brandscopicEnabled"
                  label="Enable Brandscopic Integration"
                  checked={formData.brandscopicEnabled ?? false}
                  onChange={(checked) => setFormData({ ...formData, brandscopicEnabled: checked })}
                  tooltip="Sync events to Brandscopic for field management"
                />

                <ToggleSwitch
                  id="qrTigerEnabled"
                  label="Enable QR Tiger Integration"
                  checked={formData.qrTigerEnabled ?? false}
                  onChange={(checked) => setFormData({ ...formData, qrTigerEnabled: checked })}
                  tooltip="Generate and track QR codes for events"
                />

                <ToggleSwitch
                  id="qualtricsEnabled"
                  label="Enable Qualtrics Integration"
                  checked={formData.qualtricsEnabled ?? false}
                  onChange={(checked) => setFormData({ ...formData, qualtricsEnabled: checked })}
                  tooltip="Link surveys to events for data collection"
                />
              </div>
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <ToggleSwitch
                id="isActive"
                label="Active"
                checked={formData.isActive ?? true}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                tooltip="Inactive clients are hidden from most views"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {client ? 'Save Changes' : 'Create Client'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// CLIENT CARD
// ============================================================================

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete }) => {
  const integrations = [
    { name: 'Brandscopic', enabled: client.brandscopicEnabled, icon: 'building' },
    { name: 'QR Tiger', enabled: client.qrTigerEnabled, icon: 'link' },
    { name: 'Qualtrics', enabled: client.qualtricsEnabled, icon: 'chart' },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {client.name}
              </h3>
              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {client.code}
              </span>
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  client.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit client">
              <Icon name="edit" className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={!!client.eventCount && client.eventCount > 0}
              title={client.eventCount ? `Cannot delete: ${client.eventCount} events exist` : 'Delete client'}
            >
              <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Integrations
          </h4>
          <div className="flex flex-wrap gap-2">
            {integrations.map(integration => (
              <div
                key={integration.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                  integration.enabled
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                }`}
              >
                <Icon
                  name={integration.icon as any}
                  className={`w-4 h-4 ${integration.enabled ? '' : 'opacity-50'}`}
                />
                <span>{integration.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event Count */}
        {client.eventCount !== undefined && client.eventCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="calendar" className="w-4 h-4" />
              <span>{client.eventCount} events</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ClientManagement: React.FC<ClientManagementProps> = ({
  initialClients = [],
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  // State
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.code.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [clients, searchQuery]);

  // Handlers
  const handleCreateClient = async (clientData: Partial<Client>) => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'currentUser',
      eventCount: 0,
      ...clientData,
    } as Client;

    setClients([...clients, newClient]);
    if (onCreateClient) await onCreateClient(clientData);
  };

  const handleUpdateClient = async (clientData: Partial<Client>) => {
    if (!editingClient) return;

    const updatedClients = clients.map(client =>
      client.id === editingClient.id
        ? { ...client, ...clientData, updatedAt: new Date() }
        : client
    );
    setClients(updatedClients);
    if (onUpdateClient) await onUpdateClient(editingClient.id, clientData);
    setEditingClient(null);
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    setClients(clients.filter(client => client.id !== clientToDelete.id));
    if (onDeleteClient) await onDeleteClient(clientToDelete.id);
    setClientToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Client Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage clients and integration settings
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingClient(null);
            setShowClientForm(true);
          }}
        >
          <Icon name="add" className="w-5 h-5 mr-2" />
          New Client
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              <Icon name="grid" className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <Icon name="list" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Client List */}
      {viewMode === 'cards' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              No clients found
            </div>
          ) : (
            filteredClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={() => {
                  setEditingClient(client);
                  setShowClientForm(true);
                }}
                onDelete={() => setClientToDelete(client)}
              />
            ))
          )}
        </div>
      ) : (
        // Table View
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Integrations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {client.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {client.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {client.brandscopicEnabled && (
                            <Icon name="building" className="w-4 h-4 text-blue-600 dark:text-blue-400" title="Brandscopic" />
                          )}
                          {client.qrTigerEnabled && (
                            <Icon name="link" className="w-4 h-4 text-green-600 dark:text-green-400" title="QR Tiger" />
                          )}
                          {client.qualtricsEnabled && (
                            <Icon name="chart" className="w-4 h-4 text-purple-600 dark:text-purple-400" title="Qualtrics" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            client.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingClient(client);
                              setShowClientForm(true);
                            }}
                            title="Edit client"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setClientToDelete(client)}
                            disabled={!!client.eventCount && client.eventCount > 0}
                            title={
                              client.eventCount
                                ? `Cannot delete: ${client.eventCount} events exist`
                                : 'Delete client'
                            }
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
        </Card>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={showClientForm}
        onClose={() => {
          setShowClientForm(false);
          setEditingClient(null);
        }}
        onSave={editingClient ? handleUpdateClient : handleCreateClient}
        client={editingClient}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleDeleteClient}
        title="Delete Client?"
        message={
          clientToDelete?.eventCount && clientToDelete.eventCount > 0
            ? `Cannot delete ${clientToDelete.name} because it has ${clientToDelete.eventCount} events. Please delete or reassign those events first.`
            : `Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone.`
        }
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
 * <ClientManagement
 *   initialClients={mockClients}
 *   onCreateClient={async (client) => {
 *     await fetch('/api/clients', { method: 'POST', body: JSON.stringify(client) });
 *   }}
 *   onUpdateClient={async (clientId, updates) => {
 *     await fetch(`/api/clients/${clientId}`, { method: 'PUT', body: JSON.stringify(updates) });
 *   }}
 *   onDeleteClient={async (clientId) => {
 *     await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
 *   }}
 * />
 */
