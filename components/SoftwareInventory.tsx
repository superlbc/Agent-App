// ============================================================================
// SOFTWARE INVENTORY
// ============================================================================
// View and manage software applications in inventory (separate from license pools)

import React, { useState } from 'react';
import { Software } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import SoftwareCreateModal from './SoftwareCreateModal';

interface SoftwareInventoryProps {
  initialSoftware?: Software[];
  onSoftwareChange?: (software: Software[]) => void;
}

const SoftwareInventory: React.FC<SoftwareInventoryProps> = ({
  initialSoftware = [],
  onSoftwareChange,
}) => {
  // State
  const [software, setSoftware] = useState<Software[]>(initialSoftware);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<Software['licenseType'] | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Handler to create new software
  const handleCreateSoftware = (newSoftware: Omit<Software, 'id'>) => {
    const softwareWithId: Software = {
      ...newSoftware,
      id: `sw-${Date.now()}`, // Generate unique ID
    };

    const updatedSoftware = [...software, softwareWithId];
    setSoftware(updatedSoftware);

    if (onSoftwareChange) {
      onSoftwareChange(updatedSoftware);
    }
  };

  // Filtering logic
  const filteredSoftware = software.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchLower) ||
      item.vendor.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower);

    const typeMatch = filterType === 'all' || item.licenseType === filterType;

    return searchMatch && typeMatch;
  });

  // Stats
  const stats = {
    total: filteredSoftware.length,
    perpetual: filteredSoftware.filter((s) => s.licenseType === 'perpetual').length,
    subscription: filteredSoftware.filter((s) => s.licenseType === 'subscription').length,
    concurrent: filteredSoftware.filter((s) => s.licenseType === 'concurrent').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Software Inventory</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage software applications and tools
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          <Icon name="add" className="w-4 h-4 mr-2" />
          Add Software
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search software by name, vendor, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* License Type Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as Software['licenseType'] | 'all')}
            className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All License Types</option>
            <option value="perpetual">Perpetual</option>
            <option value="subscription">Subscription</option>
            <option value="concurrent">Concurrent</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Icon name="disc" className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Software</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Icon name="check" className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Perpetual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.perpetual}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Icon name="refresh" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Subscription</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.subscription}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Icon name="users" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Concurrent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.concurrent}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Software Grid */}
      {filteredSoftware.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSoftware.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Icon name="disc" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{item.vendor}</p>
                  </div>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-medium
                      ${
                        item.licenseType === 'perpetual'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : item.licenseType === 'subscription'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      }
                    `}
                  >
                    {item.licenseType}
                  </span>
                  {item.cost && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                      {item.renewalFrequency === 'monthly' && '/mo'}
                      {item.renewalFrequency === 'annual' && '/yr'}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Icon name="disc" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No software items found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Add software to get started'}
          </p>
        </Card>
      )}

      {/* Create Software Modal */}
      <SoftwareCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateSoftware={handleCreateSoftware}
      />
    </div>
  );
};

export default SoftwareInventory;
