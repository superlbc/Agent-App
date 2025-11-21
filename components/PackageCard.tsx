// ============================================================================
// PACKAGE CARD COMPONENT
// ============================================================================
// Summary card for displaying equipment package information

import React from 'react';
import { Package } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { calculatePackageCost } from '../utils/mockData';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageCardProps {
  package: Package;
  onView?: (pkg: Package) => void;
  onEdit?: (pkg: Package) => void;
  onDelete?: (pkg: Package) => void;
  onDuplicate?: (pkg: Package) => void;
  onSelect?: (pkg: Package) => void;
  isSelected?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get an icon name for a given role
 */
function getRoleIcon(role: string): string {
  const roleLower = role.toLowerCase();

  // Designer roles
  if (roleLower.includes('designer') || roleLower.includes('xd') || roleLower.includes('ux')) {
    return 'design';
  }
  // Developer roles
  if (roleLower.includes('developer') || roleLower.includes('engineer') || roleLower.includes('code')) {
    return 'code';
  }
  // Manager/Leadership roles
  if (roleLower.includes('manager') || roleLower.includes('director') || roleLower.includes('lead')) {
    return 'users';
  }
  // Analyst roles
  if (roleLower.includes('analyst') || roleLower.includes('data')) {
    return 'chart';
  }
  // Creative roles
  if (roleLower.includes('creative') || roleLower.includes('art') || roleLower.includes('motion')) {
    return 'image';
  }
  // Strategy roles
  if (roleLower.includes('strategy') || roleLower.includes('consultant')) {
    return 'lightbulb';
  }
  // Default
  return 'briefcase';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PackageCard: React.FC<PackageCardProps> = ({
  package: pkg,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onSelect,
  isSelected = false,
  compact = false,
  className = '',
}) => {
  const costBreakdown = calculatePackageCost(pkg);

  const handleClick = () => {
    if (onSelect) {
      onSelect(pkg);
    } else if (onView) {
      onView(pkg);
    }
  };

  return (
    <Card
      className={`
        ${onSelect ? 'cursor-pointer hover:shadow-lg transition-all' : ''}
        ${isSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
        ${className}
      `}
      onClick={onSelect ? handleClick : undefined}
    >
      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {pkg.name}
              </h3>
              {pkg.isStandard ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full"
                  title="Standard packages are auto-approved"
                >
                  <Icon name="check" className="w-3 h-3" />
                  Standard
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full"
                  title="Exception packages require SVP approval"
                >
                  <Icon name="alert-circle" className="w-3 h-3" />
                  Exception
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {pkg.description}
            </p>
          </div>

          {/* Action Buttons (if not selectable) */}
          {!onSelect && (onEdit || onDelete || onDuplicate) && (
            <div className="flex items-center gap-1 ml-3">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(pkg)}
                  title="View details"
                >
                  <Icon name="eye" className="w-4 h-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(pkg)}
                  title="Edit package"
                >
                  <Icon name="edit" className="w-4 h-4" />
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(pkg)}
                  title="Duplicate package"
                >
                  <Icon name="copy" className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(pkg)}
                  title="Delete package"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Selected Indicator */}
          {isSelected && (
            <div className="ml-3">
              <Icon
                name="check-circle"
                className="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
            </div>
          )}
        </div>

        {/* Target Roles & Departments */}
        {!compact && (
          <div className="mb-4 space-y-3">
            {/* Roles with Icons */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  name="briefcase"
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Target Roles
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pkg.roleTarget.slice(0, 4).map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md"
                  >
                    <Icon name={getRoleIcon(role) as any} className="w-3.5 h-3.5" />
                    {role}
                  </span>
                ))}
                {pkg.roleTarget.length > 4 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-md">
                    +{pkg.roleTarget.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Departments */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  name="building"
                  className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Departments
                </span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                {pkg.departmentTarget.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Package Contents */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Icon
              name="monitor"
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{pkg.hardware.length}</strong> Hardware
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icon
              name="package"
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <strong>{pkg.software.length}</strong> Software
            </span>
          </div>
          {pkg.licenses.length > 0 && (
            <div className="flex items-center gap-2">
              <Icon
                name="key"
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>{pkg.licenses.length}</strong> Licenses
              </span>
            </div>
          )}
        </div>

        {/* Footer: Cost Breakdown & Date */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Created</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(pkg.createdDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-1 text-sm">
            {costBreakdown.oneTimeTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">One-time hardware</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${costBreakdown.oneTimeTotal.toFixed(2)}
                </span>
              </div>
            )}
            {costBreakdown.monthlyTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly software</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${costBreakdown.monthlyTotal.toFixed(2)}/mo
                </span>
              </div>
            )}
            {costBreakdown.annualTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Annual software</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${costBreakdown.annualTotal.toFixed(2)}/yr
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-900 dark:text-white font-medium">First year total</span>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                ${costBreakdown.firstYearTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* View Details Button (for selectable cards) */}
        {onSelect && onView && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(pkg);
              }}
              className="w-full"
            >
              <Icon name="eye" className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// COMPACT VARIANT
// ============================================================================

/**
 * Simplified package card for use in lists or small spaces
 */
export const PackageCardCompact: React.FC<PackageCardProps> = (props) => {
  return <PackageCard {...props} compact />;
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Display mode:
 * <PackageCard
 *   package={pkg}
 *   onView={(pkg) => console.log('View:', pkg)}
 *   onEdit={(pkg) => console.log('Edit:', pkg)}
 *   onDelete={(pkg) => console.log('Delete:', pkg)}
 * />
 *
 * Selection mode:
 * <PackageCard
 *   package={pkg}
 *   onSelect={(pkg) => setSelectedPackage(pkg)}
 *   isSelected={selectedPackage?.id === pkg.id}
 *   onView={(pkg) => console.log('View details:', pkg)}
 * />
 *
 * Compact mode:
 * <PackageCardCompact package={pkg} />
 */
