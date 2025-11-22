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
import { Pagination } from './ui/Pagination';
import HardwareCreateModal from './HardwareCreateModal';
import HardwareEditModal from './HardwareEditModal';
import HardwareBulkImportModal from './HardwareBulkImportModal';
import { Hardware } from '../types';
import { useRole } from '../contexts/RoleContext';
import { ConfirmModal } from './ui/ConfirmModal';

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
  const [sortBy, setSortBy] = useState<'model' | 'manufacturer' | 'type' | 'cost' | 'purchaseDate'>('model');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hardwareToDelete, setHardwareToDelete] = useState<Hardware | null>(null);

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
    const hw = hardware.find((h) => h.id === hardwareId);
    if (hw) {
      setHardwareToDelete(hw);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (hardwareToDelete) {
      const updatedHardware = hardware.filter((hw) => hw.id !== hardwareToDelete.id);
      setHardware(updatedHardware);
      onHardwareChange?.(updatedHardware);
      setHardwareToDelete(null);
    }
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
        case 'type':
          compareValue = a.type.localeCompare(b.type);
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

  // Pagination
  const totalFilteredItems = filteredAndSortedHardware.length;
  const paginatedHardware = filteredAndSortedHardware.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handler for column sort
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, itemsPerPage]);

  // Refresh data
  const handleRefresh = () => {
    setHardware([...initialHardware]);
    onHardwareChange?.(initialHardware);
  };

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
            onClick={handleRefresh}
            title="Refresh hardware list"
          >
            <Icon name="refresh" className="w-4 h-4" />
          </Button>
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

      {/* Search and View Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by model, manufacturer, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon="search"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'card'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Card view"
          >
            <Icon name="grid" className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="List view"
          >
            <Icon name="list" className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Toggle Button */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-gray-100 dark:bg-gray-800' : ''}
        >
          <Icon name="filter" className="w-4 h-4 mr-2" />
          Filters
          {filterType !== 'all' && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
              1
            </span>
          )}
        </Button>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <Card className="p-4">
          <div>
            {/* Type Filter */}
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
                    ${
                      filterType === type.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
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
        </Card>
      )}

      {/* Hardware List */}
      {totalFilteredItems > 0 ? (
        viewMode === 'card' ? (
          <>
            {/* Card View - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {paginatedHardware.map((hw) => (
              <Card key={hw.id} className="p-3 hover:shadow-md transition-all group">
                {/* Header with Icon and Model */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                    <Icon
                      name={
                        hw.type === 'computer' ? 'monitor' :
                        hw.type === 'keyboard' ? 'keyboard' :
                        hw.type === 'mouse' ? 'mouse' :
                        hw.type === 'dock' ? 'link' :
                        hw.type === 'headset' ? 'headphones' : 'package'
                      }
                      className="w-4 h-4 text-gray-600 dark:text-gray-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate" title={hw.model}>
                      {hw.model}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{hw.manufacturer}</p>
                  </div>
                </div>

                {/* Key Specs (Inline) */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mb-2">
                  {hw.specifications?.processor && (
                    <div className="truncate" title={hw.specifications.processor}>{hw.specifications.processor}</div>
                  )}
                  {hw.specifications?.ram && hw.specifications?.storage && (
                    <div>{hw.specifications.ram} • {hw.specifications.storage}</div>
                  )}
                  {hw.specifications?.screenSize && (
                    <div>{hw.specifications.screenSize}</div>
                  )}
                  {hw.cost && (
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      ${hw.cost.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(hw)}
                    className="flex-1 text-xs h-7"
                    disabled={!canUpdate}
                    title={!canUpdate ? 'No permission to edit' : 'Edit hardware'}
                  >
                    <Icon name="edit" className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHardware(hw.id)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2"
                    disabled={!canDelete}
                    title={!canDelete ? 'No permission to delete' : `Delete ${hw.model}`}
                    aria-label={`Delete ${hw.model}`}
                  >
                    <Icon name="trash" className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination for card view */}
          {totalFilteredItems > itemsPerPage && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalItems={totalFilteredItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </>
      ) : (
          // List View - Table
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {/* Sortable Hardware Column */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('model')}
                    >
                      <div className="flex items-center gap-1">
                        Hardware
                        {sortBy === 'model' && (
                          <Icon
                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                            className="w-3 h-3"
                          />
                        )}
                      </div>
                    </th>

                    {/* Sortable Type Column */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortBy === 'type' && (
                          <Icon
                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                            className="w-3 h-3"
                          />
                        )}
                      </div>
                    </th>

                    {/* Sortable Manufacturer Column */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('manufacturer')}
                    >
                      <div className="flex items-center gap-1">
                        Manufacturer
                        {sortBy === 'manufacturer' && (
                          <Icon
                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                            className="w-3 h-3"
                          />
                        )}
                      </div>
                    </th>

                    {/* Sortable Cost Column */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSort('cost')}
                    >
                      <div className="flex items-center gap-1">
                        Cost
                        {sortBy === 'cost' && (
                          <Icon
                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                            className="w-3 h-3"
                          />
                        )}
                      </div>
                    </th>

                    {/* Non-sortable Actions Column */}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedHardware.map((hw) => (
                    <tr
                      key={hw.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {/* Hardware (Model) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                            <Icon
                              name={
                                hw.type === 'computer' ? 'monitor' :
                                hw.type === 'keyboard' ? 'keyboard' :
                                hw.type === 'mouse' ? 'mouse' :
                                hw.type === 'dock' ? 'link' :
                                hw.type === 'headset' ? 'headphones' : 'package'
                              }
                              className="w-4 h-4 text-gray-600 dark:text-gray-400"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {hw.model}
                            </div>
                            {hw.serialNumber && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                {hw.serialNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                          {hw.type}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {hw.manufacturer}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 mt-1">
                          {hw.specifications?.processor && (
                            <div className="truncate text-xs">{hw.specifications.processor}</div>
                          )}
                          {hw.specifications?.ram && hw.specifications?.storage && (
                            <div className="text-xs">{hw.specifications.ram} • {hw.specifications.storage}</div>
                          )}
                          {hw.specifications?.screenSize && (
                            <div className="text-xs">{hw.specifications.screenSize}</div>
                          )}
                          {hw.specifications?.connectivity && (
                            <div className="text-xs">{hw.specifications.connectivity}</div>
                          )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3">
                        {hw.cost ? (
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            ${hw.cost.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        )}
                        {hw.purchaseDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(hw.purchaseDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(hw)}
                            disabled={!canUpdate}
                            title={!canUpdate ? 'No permission to edit' : 'Edit hardware'}
                            className="h-8"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHardware(hw.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8"
                            disabled={!canDelete}
                            title={!canDelete ? 'No permission to delete' : `Delete ${hw.model}`}
                            aria-label={`Delete ${hw.model}`}
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for table view */}
            {totalFilteredItems > itemsPerPage && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalFilteredItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
          </Card>
        )
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
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first hardware item'}
              </p>
            </div>
            {!searchQuery && filterType === 'all' && (
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setHardwareToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Hardware Item?"
        message={`Are you sure you want to delete ${hardwareToDelete?.model}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default HardwareInventory;
