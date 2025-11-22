// ============================================================================
// PROGRAM MANAGEMENT COMPONENT
// ============================================================================
// Admin interface for managing programs (Master Programs)
//
// Features:
// - Program table with client filter
// - Create/edit/delete programs
// - Client association (searchable dropdown)
// - Program code, region, event type
// - Logo upload (optional)
// - Status management (Active, Inactive, Archived)
// - Validation: Cannot delete if events exist

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Pagination } from '../ui/Pagination';

// ============================================================================
// TYPES
// ============================================================================

interface Program {
  id: string;
  clientId: string;
  name: string;
  code: string;
  region?: string;
  eventType: string;
  status: 'active' | 'inactive' | 'archived';
  logo?: string;
  eventCount?: number; // For validation
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface Client {
  id: string;
  name: string;
  code: string;
}

interface ProgramManagementProps {
  initialPrograms?: Program[];
  clients: Client[];
  onCreateProgram?: (program: Partial<Program>) => Promise<void>;
  onUpdateProgram?: (programId: string, updates: Partial<Program>) => Promise<void>;
  onDeleteProgram?: (programId: string) => Promise<void>;
}

// ============================================================================
// PROGRAM FORM MODAL
// ============================================================================

interface ProgramFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (program: Partial<Program>) => void;
  program?: Program | null;
  clients: Client[];
}

const ProgramFormModal: React.FC<ProgramFormModalProps> = ({ isOpen, onClose, onSave, program, clients }) => {
  const [formData, setFormData] = useState<Partial<Program>>({
    clientId: program?.clientId || '',
    name: program?.name || '',
    code: program?.code || '',
    region: program?.region || '',
    eventType: program?.eventType || '',
    status: program?.status || 'active',
    logo: program?.logo || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      code: formData.code?.toUpperCase(), // Ensure uppercase
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, upload to Azure Blob Storage
      // For now, create a data URL for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
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
              {program ? 'Edit Program' : 'New Program'}
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
            {/* Client Selection */}
            <Select
              id="clientId"
              label="Client"
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              options={[
                { value: '', label: '-- Select Client --' },
                ...clients.map(client => ({ value: client.id, label: `${client.name} (${client.code})` })),
              ]}
            />

            {/* Program Name */}
            <Input
              id="name"
              label="Program Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Verizon Hyperlocal, AMEX US Open"
            />

            {/* Program Code */}
            <Input
              id="code"
              label="Program Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., VZ_HYPERLOCAL, AMEX_USOPEN"
              className="uppercase"
            />

            {/* Region */}
            <Select
              id="region"
              label="Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              options={[
                { value: '', label: '-- Select Region --' },
                { value: 'Northeast', label: 'Northeast' },
                { value: 'Southeast', label: 'Southeast' },
                { value: 'Midwest', label: 'Midwest' },
                { value: 'Southwest', label: 'Southwest' },
                { value: 'West', label: 'West' },
                { value: 'National', label: 'National' },
              ]}
            />

            {/* Event Type */}
            <Select
              id="eventType"
              label="Event Type"
              required
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              options={[
                { value: '', label: '-- Select Event Type --' },
                { value: 'Sampling', label: 'Sampling' },
                { value: 'Sponsorship', label: 'Sponsorship' },
                { value: 'Pop-Up', label: 'Pop-Up' },
                { value: 'Concert', label: 'Concert' },
                { value: 'Festival', label: 'Festival' },
                { value: 'Sports', label: 'Sports' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            {/* Status */}
            <Select
              id="status"
              label="Status"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Program['status'] })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'archived', label: 'Archived' },
              ]}
            />

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo (Optional)
              </label>
              <div className="flex items-center gap-4">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt="Program logo"
                    className="w-16 h-16 object-contain rounded border border-gray-300 dark:border-gray-600"
                  />
                )}
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
                  <Icon name="upload" className="w-4 h-4" />
                  {formData.logo ? 'Change Logo' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {program ? 'Save Changes' : 'Create Program'}
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

export const ProgramManagement: React.FC<ProgramManagementProps> = ({
  initialPrograms = [],
  clients,
  onCreateProgram,
  onUpdateProgram,
  onDeleteProgram,
}) => {
  // State
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  // Filtered and paginated programs
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClient = !clientFilter || program.clientId === clientFilter;

      return matchesSearch && matchesClient;
    });
  }, [programs, searchQuery, clientFilter]);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(start, start + itemsPerPage);
  }, [filteredPrograms, currentPage, itemsPerPage]);

  // Handlers
  const handleCreateProgram = async (programData: Partial<Program>) => {
    const newProgram: Program = {
      id: `program-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'currentUser',
      eventCount: 0,
      ...programData,
    } as Program;

    setPrograms([...programs, newProgram]);
    if (onCreateProgram) await onCreateProgram(programData);
  };

  const handleUpdateProgram = async (programData: Partial<Program>) => {
    if (!editingProgram) return;

    const updatedPrograms = programs.map(program =>
      program.id === editingProgram.id
        ? { ...program, ...programData, updatedAt: new Date() }
        : program
    );
    setPrograms(updatedPrograms);
    if (onUpdateProgram) await onUpdateProgram(editingProgram.id, programData);
    setEditingProgram(null);
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;

    setPrograms(programs.filter(program => program.id !== programToDelete.id));
    if (onDeleteProgram) await onDeleteProgram(programToDelete.id);
    setProgramToDelete(null);
  };

  const getStatusBadgeColor = (status: Program['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      archived: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Program['status']) => {
    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      archived: 'Archived',
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Program Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage programs, event types, and regional assignments
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingProgram(null);
            setShowProgramForm(true);
          }}
        >
          <Icon name="add" className="w-5 h-5 mr-2" />
          New Program
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Programs
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
                placeholder="Search by program name or code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Client Filter */}
          <div>
            <label htmlFor="clientFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Client
            </label>
            <select
              id="clientFilter"
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Program Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Program Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Region
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event Type
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
              {paginatedPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No programs found
                  </td>
                </tr>
              ) : (
                paginatedPrograms.map(program => {
                  const client = clients.find(c => c.id === program.clientId);
                  return (
                    <tr key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {program.logo && (
                            <img
                              src={program.logo}
                              alt={program.name}
                              className="w-8 h-8 object-contain rounded"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {program.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {client ? `${client.name} (${client.code})` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                        {program.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {program.region || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {program.eventType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(program.status)}`}>
                          {getStatusLabel(program.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProgram(program);
                              setShowProgramForm(true);
                            }}
                            title="Edit program"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProgramToDelete(program)}
                            disabled={!!program.eventCount && program.eventCount > 0}
                            title={
                              program.eventCount
                                ? `Cannot delete: ${program.eventCount} events exist`
                                : 'Delete program'
                            }
                          >
                            <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredPrograms.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPrograms.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </Card>

      {/* Program Form Modal */}
      <ProgramFormModal
        isOpen={showProgramForm}
        onClose={() => {
          setShowProgramForm(false);
          setEditingProgram(null);
        }}
        onSave={editingProgram ? handleUpdateProgram : handleCreateProgram}
        program={editingProgram}
        clients={clients}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={handleDeleteProgram}
        title="Delete Program?"
        message={
          programToDelete?.eventCount && programToDelete.eventCount > 0
            ? `Cannot delete ${programToDelete.name} because it has ${programToDelete.eventCount} events. Please delete or reassign those events first.`
            : `Are you sure you want to delete ${programToDelete?.name}? This action cannot be undone.`
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
 * const mockClients = [
 *   { id: 'vz', name: 'Verizon', code: 'VZ' },
 *   { id: 'amex', name: 'American Express', code: 'AMEX' },
 * ];
 *
 * <ProgramManagement
 *   initialPrograms={mockPrograms}
 *   clients={mockClients}
 *   onCreateProgram={async (program) => {
 *     await fetch('/api/programs', { method: 'POST', body: JSON.stringify(program) });
 *   }}
 *   onUpdateProgram={async (programId, updates) => {
 *     await fetch(`/api/programs/${programId}`, { method: 'PUT', body: JSON.stringify(updates) });
 *   }}
 *   onDeleteProgram={async (programId) => {
 *     await fetch(`/api/programs/${programId}`, { method: 'DELETE' });
 *   }}
 * />
 */
