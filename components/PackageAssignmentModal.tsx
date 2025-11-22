// ============================================================================
// PACKAGE ASSIGNMENT MODAL COMPONENT
// ============================================================================
// Modal for assigning equipment packages to pre-hire candidates

import React, { useState, useMemo } from 'react';
import { PreHire, Package } from '../types';
import { PackageCard } from './PackageCard';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { calculatePackageCost } from '../utils/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageAssignmentModalProps {
  preHire: PreHire;
  packages: Package[];
  onAssign: (preHire: PreHire, selectedPackage: Package) => void;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PackageAssignmentModal: React.FC<PackageAssignmentModalProps> = ({
  preHire,
  packages,
  onAssign,
  onClose,
}) => {
  // State
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(
    preHire.assignedPackage || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showMatchingOnly, setShowMatchingOnly] = useState(true);

  // ============================================================================
  // FILTERING & MATCHING
  // ============================================================================

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Search query
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        pkg.name.toLowerCase().includes(searchLower) ||
        pkg.description.toLowerCase().includes(searchLower);

      // Matching filter (role and department)
      const isMatching =
        pkg.roleTarget.includes(preHire.role) ||
        pkg.departmentTarget.includes(preHire.department);

      const matchingFilter = !showMatchingOnly || isMatching;

      return searchMatch && matchingFilter;
    });
  }, [packages, searchQuery, showMatchingOnly, preHire.role, preHire.department]);

  // Sort packages: matching first, then by name
  const sortedPackages = useMemo(() => {
    return [...filteredPackages].sort((a, b) => {
      const aMatches =
        a.roleTarget.includes(preHire.role) ||
        a.departmentTarget.includes(preHire.department);
      const bMatches =
        b.roleTarget.includes(preHire.role) ||
        b.departmentTarget.includes(preHire.department);

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredPackages, preHire.role, preHire.department]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const matching = packages.filter(
      (pkg) =>
        pkg.roleTarget.includes(preHire.role) ||
        pkg.departmentTarget.includes(preHire.department)
    );

    return {
      total: packages.length,
      matching: matching.length,
      filtered: sortedPackages.length,
    };
  }, [packages, sortedPackages, preHire.role, preHire.department]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAssign = () => {
    if (!selectedPackage) return;
    onAssign(preHire, selectedPackage);
  };

  const isPackageMatching = (pkg: Package): boolean => {
    return (
      pkg.roleTarget.includes(preHire.role) ||
      pkg.departmentTarget.includes(preHire.department)
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Assign Equipment Package
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Icon name="user" className="w-4 h-4" />
                <span>{preHire.candidateName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="briefcase" className="w-4 h-4" />
                <span>{preHire.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="building" className="w-4 h-4" />
                <span>{preHire.department}</span>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={onClose}>
            <Icon name="x" className="w-5 h-5" />
          </Button>
        </div>

        {/* Current Assignment */}
        {preHire.assignedPackage && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Icon name="info" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-300">
                Currently assigned:{' '}
                <strong>{preHire.assignedPackage.name}</strong> ($
                {calculatePackageCost(preHire.assignedPackage).monthlyTotal.toFixed(2)}/mo)
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search packages by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Filter Toggle & Stats */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowMatchingOnly(!showMatchingOnly)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  showMatchingOnly
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              <Icon name="filter" className="w-4 h-4" />
              Show matching packages only ({stats.matching})
            </button>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <strong>{stats.filtered}</strong> of{' '}
              <strong>{stats.total}</strong> packages
            </div>
          </div>
        </div>

        {/* Package List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPackages.map((pkg) => (
                <div key={pkg.id} className="relative">
                  <PackageCard
                    package={pkg}
                    onSelect={() => setSelectedPackage(pkg)}
                    isSelected={selectedPackage?.id === pkg.id}
                    compact={false}
                  />
                  {/* Matching Badge */}
                  {isPackageMatching(pkg) && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full shadow-sm">
                        <Icon name="check" className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon
                name="package"
                className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No packages found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {showMatchingOnly
                  ? 'No packages match this role or department. Try showing all packages.'
                  : 'Try adjusting your search criteria.'}
              </p>
              {showMatchingOnly && (
                <Button
                  variant="outline"
                  onClick={() => setShowMatchingOnly(false)}
                >
                  Show all packages
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm">
            {selectedPackage ? (
              <div className="flex items-center gap-2">
                <Icon name="check-circle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  Selected:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedPackage.name}
                  </strong>{' '}
                  - ${calculatePackageCost(selectedPackage).monthlyTotal.toFixed(2)}/mo
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Icon name="info" className="w-5 h-5" />
                <span>Select a package to assign</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedPackage}
            >
              <Icon name="check" className="w-4 h-4 mr-2" />
              Assign Package
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * <PackageAssignmentModal
 *   preHire={selectedPreHire}
 *   packages={mockPackages}
 *   onAssign={(preHire, pkg) => {
 *     updatePreHire(preHire.id, { assignedPackage: pkg });
 *     addToast(`Package "${pkg.name}" assigned to ${preHire.candidateName}`);
 *     setShowAssignmentModal(false);
 *   }}
 *   onClose={() => setShowAssignmentModal(false)}
 * />
 */
