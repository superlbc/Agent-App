// ============================================================================
// PACKAGE DETAIL VIEW COMPONENT
// ============================================================================
// Detailed view of a single equipment package with all contents

import React, { useMemo } from 'react';
import { Package } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { calculatePackageCost } from '../utils/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageDetailViewProps {
  package: Package;
  onClose?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PackageDetailView: React.FC<PackageDetailViewProps> = ({
  package: pkg,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  className = '',
}) => {
  // ============================================================================
  // COST CALCULATIONS
  // ============================================================================

  const costs = useMemo(() => {
    const hardwareCost = pkg.hardware.reduce((sum, item) => sum + (item.cost || 0), 0);
    const softwareCost = pkg.software.reduce((sum, item) => {
      if (item.renewalFrequency === 'monthly') {
        return sum + (item.cost || 0);
      } else if (item.renewalFrequency === 'annual') {
        return sum + (item.cost || 0) / 12;
      }
      return sum;
    }, 0);
    const licensesCost = pkg.licenses?.reduce((sum, item) => {
      if (item.renewalFrequency === 'monthly') {
        return sum + (item.cost || 0);
      } else if (item.renewalFrequency === 'annual') {
        return sum + (item.cost || 0) / 12;
      }
      return sum;
    }, 0) || 0;

    return {
      hardware: hardwareCost,
      software: softwareCost,
      licenses: licensesCost,
      monthlyTotal: softwareCost + licensesCost,
      annualTotal: (softwareCost + licensesCost) * 12,
      total: calculatePackageCost(pkg),
    };
  }, [pkg]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {pkg.name}
            </h2>
            {pkg.isStandard ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                <Icon name="check" className="w-4 h-4" />
                Standard
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-full">
                <Icon name="alert-circle" className="w-4 h-4" />
                Exception
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {pkg.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-6">
          {onEdit && (
            <Button variant="outline" onClick={onEdit} title="Edit package">
              <Icon name="edit" className="w-4 h-4" />
            </Button>
          )}
          {onDuplicate && (
            <Button variant="outline" onClick={onDuplicate} title="Duplicate package">
              <Icon name="copy" className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              title="Delete package"
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <Icon name="trash" className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose} title="Close">
              <Icon name="x" className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Target Audience */}
      <Card className="mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Target Audience
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="briefcase" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h4 className="font-medium text-gray-900 dark:text-white">Roles</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {pkg.roleTarget.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="building" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <h4 className="font-medium text-gray-900 dark:text-white">Departments</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {pkg.departmentTarget.map((dept) => (
                <span
                  key={dept}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Hardware */}
      {pkg.hardware.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hardware ({pkg.hardware.length})
            </h3>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ${costs.hardware.toFixed(2)}
            </span>
          </div>
          <div className="space-y-3">
            {pkg.hardware.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="monitor" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.model}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.manufacturer}
                  </p>
                  {item.specifications && Object.keys(item.specifications).length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {Object.entries(item.specifications).map(([key, value]) =>
                        value ? (
                          <span key={key}>
                            <span className="font-medium">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>{' '}
                            {value}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
                {item.cost !== undefined && (
                  <div className="text-right ml-4">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Software */}
      {pkg.software.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Software ({pkg.software.length})
            </h3>
            <div className="text-right">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ${costs.software.toFixed(2)}/mo
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ${(costs.software * 12).toFixed(2)}/yr
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pkg.software.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="package" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </h4>
                    {item.requiresApproval && (
                      <Icon
                        name="alert-circle"
                        className="w-4 h-4 text-orange-600 dark:text-orange-400"
                        title="Requires approval"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {item.vendor}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      <span className="font-medium">License:</span>{' '}
                      {item.licenseType.charAt(0).toUpperCase() + item.licenseType.slice(1)}
                    </span>
                    {item.renewalFrequency && (
                      <span>
                        <span className="font-medium">Renewal:</span>{' '}
                        {item.renewalFrequency.charAt(0).toUpperCase() + item.renewalFrequency.slice(1)}
                      </span>
                    )}
                    {item.seatCount !== undefined && (
                      <span>
                        <span className="font-medium">Seats:</span> {item.seatCount}
                      </span>
                    )}
                    {item.requiresApproval && item.approver && (
                      <span>
                        <span className="font-medium">Approver:</span> {item.approver}
                      </span>
                    )}
                  </div>
                </div>
                {item.cost !== undefined && (
                  <div className="text-right ml-4">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                    </span>
                    {item.renewalFrequency && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        /{item.renewalFrequency === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Licenses */}
      {pkg.licenses && pkg.licenses.length > 0 && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Additional Licenses ({pkg.licenses.length})
            </h3>
            <div className="text-right">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                ${costs.licenses.toFixed(2)}/mo
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ${(costs.licenses * 12).toFixed(2)}/yr
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pkg.licenses.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="key" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.vendor}
                  </p>
                </div>
                {item.cost !== undefined && (
                  <div className="text-right ml-4">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                    </span>
                    {item.renewalFrequency && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        /{item.renewalFrequency === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cost Summary */}
      <Card className="mb-6 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cost Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Hardware (one-time)</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${costs.hardware.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Software (monthly)</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${costs.software.toFixed(2)}/mo
            </span>
          </div>
          {pkg.licenses && pkg.licenses.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Licenses (monthly)</span>
              <span className="font-medium text-gray-900 dark:text-white">
                ${costs.licenses.toFixed(2)}/mo
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                Total Monthly Cost
              </span>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                ${costs.total.toFixed(2)}/mo
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Annual (software only)</span>
              <span className="text-gray-700 dark:text-gray-300">
                ${costs.annualTotal.toFixed(2)}/yr
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Package Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created by:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {pkg.createdBy}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Created:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {new Date(pkg.createdDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last modified:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {new Date(pkg.lastModified).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Package ID:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium font-mono text-xs">
              {pkg.id}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Full management mode:
 * <PackageDetailView
 *   package={selectedPackage}
 *   onClose={() => setViewingPackage(null)}
 *   onEdit={() => setEditingPackage(selectedPackage)}
 *   onDuplicate={() => handleDuplicatePackage(selectedPackage)}
 *   onDelete={() => handleDeletePackage(selectedPackage.id)}
 * />
 *
 * View-only mode:
 * <PackageDetailView
 *   package={selectedPackage}
 *   onClose={() => setViewingPackage(null)}
 * />
 */
