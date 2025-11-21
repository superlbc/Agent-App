// ============================================================================
// HARDWARE INVENTORY
// ============================================================================
// Main container for hardware inventory management with CRUD operations
// Integrates Create, Edit, and Bulk Import modals with search/filter capabilities

import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import HardwareCreateModal from './HardwareCreateModal';
import HardwareEditModal from './HardwareEditModal';
import HardwareBulkImportModal from './HardwareBulkImportModal';
import { Hardware } from '../types';
import { useRole } from '../contexts/RoleContext';

interface HardwareInventoryProps {
  // Optional: pass in hardware data from parent
  initialHardware?: Hardware[];
  onHardwareChange?: (hardware: Hardware[]) => void;
}

const HardwareInventory: React.FC<HardwareInventoryProps> = ({
  initialHardware = [],
  onHardwareChange,
}) => {
  const { hasPermission } = useRole();

  // Permission checks
  const canCreate = hasPermission('HARDWARE_CREATE');
  const canUpdate = hasPermission('HARDWARE_UPDATE');
  const canDelete = hasPermission('HARDWARE_DELETE');
  const canRead = hasPermission('HARDWARE_READ');

  // State
  const [hardware, setHardware] = useState<Hardware[]>(initialHardware);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<Hardware['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Hardware['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'model' | 'manufacturer' | 'cost' | 'purchaseDate'>('model');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);

  // Hardware types for filtering
  const hardwareTypes: Array<{ value: Hardware['type'] | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All Types', icon: 'package' },
    { value: 'computer', label: 'Computers', icon: 'monitor' },
    { value: 'monitor', label: 'Monitors', icon: 'monitor' },
    { value: 'keyboard', label: 'Keyboards', icon: 'keyboard' },
    { value: 'mouse', label: 'Mice', icon: 'mouse' },
    { value: 'dock', label: 'Docks', icon: 'link' },
    { value: 'headset', label: 'Headsets', icon: 'headphones' },
    { value: 'accessory', label: 'Accessories', icon: 'package' },
  ];

  // Status options for filtering
  const statusOptions: Array<{ value: Hardware['status'] | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'All Status', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'available', label: 'Available', color: 'text-green-600 dark:text-green-400' },
    { value: 'assigned', label: 'Assigned', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-orange-600 dark:text-orange-400' },
    { value: 'retired', label: 'Retired', color: 'text-gray-600 dark:text-gray-400' },
  ];

  // Create hardware
  const handleCreateHardware = (newHardware: Omit<Hardware, 'id'>) => {
    const hardwareWithId: Hardware = {
      ...newHardware,
      id: `hw-${Date.now()}`,
    };

    const updatedHardware = [...hardware, hardwareWithId];
    setHardware(updatedHardware);
    onHardwareChange?.(updatedHardware);
  };

  // Update hardware
  const handleUpdateHardware = (updatedHardware: Hardware) => {
    const updatedList = hardware.map((hw) => (hw.id === updatedHardware.id ? updatedHardware : hw));
    setHardware(updatedList);
    onHardwareChange?.(updatedList);
  };

  // Delete hardware
  const handleDeleteHardware = (hardwareId: string) => {
    if (!confirm('Are you sure you want to delete this hardware item?')) {
      return;
    }

    const updatedHardware = hardware.filter((hw) => hw.id !== hardwareId);
    setHardware(updatedHardware);
    onHardwareChange?.(updatedHardware);
  };

  // Bulk import hardware
  const handleImportHardware = (importedHardware: Array<Omit<Hardware, 'id'>>) => {
    const hardwareWithIds: Hardware[] = importedHardware.map((hw, index) => ({
      ...hw,
      id: `hw-${Date.now()}-${index}`,
    }));

    const updatedHardware = [...hardware, ...hardwareWithIds];
    setHardware(updatedHardware);
    onHardwareChange?.(updatedHardware);
  };

  // Open edit modal
  const handleEdit = (hw: Hardware) => {
    setSelectedHardware(hw);
    setShowEditModal(true);
  };

  // Filter and sort hardware
  const filteredAndSortedHardware = hardware
    .filter((hw) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        hw.model.toLowerCase().includes(searchLower) ||
        hw.manufacturer.toLowerCase().includes(searchLower) ||
        hw.serialNumber?.toLowerCase().includes(searchLower) ||
        false;

      if (searchQuery && !matchesSearch) return false;

      // Type filter
      if (filterType !== 'all' && hw.type !== filterType) return false;

      // Status filter
      if (filterStatus !== 'all' && hw.status !== filterStatus) return false;

      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'model':
          compareValue = a.model.localeCompare(b.model);
          break;
        case 'manufacturer':
          compareValue = a.manufacturer.localeCompare(b.manufacturer);
          break;
        case 'cost':
          compareValue = (a.cost || 0) - (b.cost || 0);
          break;
        case 'purchaseDate':
          const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
          const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
          compareValue = dateA - dateB;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  // Calculate statistics
  const stats = {
    total: hardware.length,
    byType: hardwareTypes
      .filter((t) => t.value !== 'all')
      .map((type) => ({
        type: type.value as Hardware['type'],
        label: type.label,
        count: hardware.filter((hw) => hw.type === type.value).length,
      })),
    byStatus: statusOptions
      .filter((s) => s.value !== 'all')
      .map((status) => ({
        status: status.value as Hardware['status'],
        label: status.label,
        count: hardware.filter((hw) => hw.status === status.value).length,
        color: status.color,
      })),
    totalCost: hardware.reduce((sum, hw) => sum + (hw.cost || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hardware Inventory
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all hardware assets from creation to retirement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowBulkImportModal(true)}
            disabled={!canCreate}
            title={!canCreate ? 'You do not have permission to import hardware' : undefined}
          >
            <Icon name="upload" className="w-4 h-4" />
            Bulk Import
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreate}
            title={!canCreate ? 'You do not have permission to create hardware' : undefined}
          >
            <Icon name="plus" className="w-4 h-4" />
            Add Hardware
          </Button>
        </div>
      </div>

      {/* Permission Check Alert */}
      {!canRead && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <Icon name="alert-triangle" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
              Insufficient Permissions
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              You do not have permission to view hardware inventory. Required permission: HARDWARE_READ
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              Contact your administrator if you need access to this feature.
            </p>
          </div>
        </div>
      )}

      {(!canCreate && canRead) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
              Read-Only Access
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              You have view-only access to hardware inventory. You cannot create, edit, or delete hardware items.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="package" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Hardware</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.byStatus.find((s) => s.status === 'available')?.count || 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icon name="user" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assigned</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.byStatus.find((s) => s.status === 'assigned')?.count || 0}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Icon name="alert" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Maintenance</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.byStatus.find((s) => s.status === 'maintenance')?.count || 0}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search by model, manufacturer, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon="search"
          />

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Type
            </label>
            <div className="flex flex-wrap gap-2">
              {hardwareTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                    ${
                      filterType === type.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  aria-pressed={filterType === type.value}
                >
                  <Icon name={type.icon} className="w-4 h-4" />
                  {type.label}
                  {type.value !== 'all' && (
                    <span className="text-xs opacity-70">
                      ({stats.byType.find((t) => t.type === type.value)?.count || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`
                    px-3 py-1.5 rounded-lg border text-sm transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
                    ${
                      filterStatus === status.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  aria-pressed={filterStatus === status.value}
                >
                  {status.label}
                  {status.value !== 'all' && (
                    <span className="text-xs opacity-70 ml-1">
                      ({stats.byStatus.find((s) => s.status === status.value)?.count || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="model">Model</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="cost">Cost</option>
                <option value="purchaseDate">Purchase Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon
                  name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
                  className="w-5 h-5 text-gray-600 dark:text-gray-400"
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Hardware List */}
      {filteredAndSortedHardware.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedHardware.map((hw) => (
            <Card key={hw.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon
                        name={
                          hw.type === 'computer'
                            ? 'monitor'
                            : hw.type === 'keyboard'
                            ? 'keyboard'
                            : hw.type === 'mouse'
                            ? 'mouse'
                            : hw.type === 'dock'
                            ? 'link'
                            : hw.type === 'headset'
                            ? 'headphones'
                            : 'package'
                        }
                        className="w-5 h-5 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {hw.model}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hw.manufacturer}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      hw.status === 'available'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : hw.status === 'assigned'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : hw.status === 'maintenance'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {hw.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="text-gray-900 dark:text-gray-100 capitalize">{hw.type}</span>
                  </div>
                  {hw.serialNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Serial:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                        {hw.serialNumber}
                      </span>
                    </div>
                  )}
                  {hw.cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">
                        ${hw.cost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {hw.purchaseDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Purchased:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(hw.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specifications */}
                {hw.specifications && Object.keys(hw.specifications).length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {hw.specifications.processor && (
                        <div>CPU: {hw.specifications.processor}</div>
                      )}
                      {hw.specifications.ram && <div>RAM: {hw.specifications.ram}</div>}
                      {hw.specifications.storage && <div>Storage: {hw.specifications.storage}</div>}
                      {hw.specifications.screenSize && <div>Size: {hw.specifications.screenSize}</div>}
                      {hw.specifications.connectivity && (
                        <div>Connectivity: {hw.specifications.connectivity}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(hw)}
                    className="flex-1"
                    disabled={!canUpdate}
                    title={!canUpdate ? 'You do not have permission to edit hardware' : undefined}
                  >
                    <Icon name="edit" className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHardware(hw.id)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={!canDelete}
                    title={!canDelete ? 'You do not have permission to delete hardware' : `Delete ${hw.model}`}
                    aria-label={`Delete ${hw.model}`}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Icon name="package" className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No hardware found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first hardware item'}
              </p>
            </div>
            {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                disabled={!canCreate}
                title={!canCreate ? 'You do not have permission to create hardware' : undefined}
              >
                <Icon name="plus" className="w-4 h-4" />
                Add Hardware
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <HardwareCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateHardware={handleCreateHardware}
      />

      <HardwareEditModal
        isOpen={showEditModal}
        hardware={selectedHardware}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHardware(null);
        }}
        onUpdateHardware={handleUpdateHardware}
      />

      <HardwareBulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportHardware={handleImportHardware}
      />
    </div>
  );
};

export default HardwareInventory;
