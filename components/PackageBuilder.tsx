// ============================================================================
// PACKAGE BUILDER COMPONENT
// ============================================================================
// Create and edit equipment packages with hardware/software selection

import React, { useState, useMemo, useEffect } from 'react';
import { Package, Hardware, Software } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { HardwareCatalog } from './HardwareCatalog';
import { SoftwareCatalog } from './SoftwareCatalog';
import { HierarchicalRoleSelector, RoleSelection } from './ui/HierarchicalRoleSelector';
import { getHierarchicalData } from '../services/departmentDataService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PackageBuilderProps {
  package?: Package; // For editing
  hardware: Hardware[]; // Available hardware
  software: Software[]; // Available software
  isCloning?: boolean; // Flag to indicate cloning mode
  onSave: (pkg: Partial<Package>) => void;
  onCancel: () => void;
  className?: string;
}

type Tab = 'details' | 'hardware' | 'software' | 'review';

// ============================================================================
// COMPONENT
// ============================================================================

export const PackageBuilder: React.FC<PackageBuilderProps> = ({
  package: existingPackage,
  hardware,
  software,
  isCloning = false,
  onSave,
  onCancel,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [name, setName] = useState(existingPackage?.name || '');
  const [description, setDescription] = useState(existingPackage?.description || '');
  const [isStandard, setIsStandard] = useState(existingPackage?.isStandard ?? true);
  const [roleSelections, setRoleSelections] = useState<RoleSelection[]>(() => {
    // Convert existing package data to RoleSelection format
    if (existingPackage?.roleTarget && existingPackage?.departmentTarget) {
      return existingPackage.roleTarget.map((role, index) => {
        const deptGroup = existingPackage.departmentTarget[index] || '';
        return {
          departmentGroup: deptGroup,
          role: role,
          fullDisplay: `${deptGroup} > ${role}`,
        };
      });
    }
    return [];
  });
  const [currentRoleSelection, setCurrentRoleSelection] = useState<RoleSelection | null>(null);
  const [hierarchicalData, setHierarchicalData] = useState<any[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<Hardware[]>(
    existingPackage?.hardware || []
  );
  const [selectedSoftware, setSelectedSoftware] = useState<Software[]>(() => {
    // Merge software and licenses from existing package
    const software = existingPackage?.software || [];
    const licenses = existingPackage?.licenses || [];
    return [...software, ...licenses];
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load hierarchical department/role data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getHierarchicalData();
        setHierarchicalData(data);
      } catch (error) {
        console.error('Error loading hierarchical data:', error);
      }
    };

    loadData();
  }, []);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('Package name is required');
    if (name.trim().length < 3) errors.push('Package name must be at least 3 characters');
    if (!description.trim()) errors.push('Description is required');
    if (roleSelections.length === 0) errors.push('At least one role and department must be selected');
    if (selectedHardware.length === 0 && selectedSoftware.length === 0) {
      errors.push('At least one hardware or software item must be selected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [name, description, roleSelections, selectedHardware, selectedSoftware]);

  // ============================================================================
  // COST CALCULATIONS
  // ============================================================================

  const costs = useMemo(() => {
    const hardwareCost = selectedHardware.reduce((sum, item) => sum + (item.cost || 0), 0);
    const softwareCost = selectedSoftware.reduce((sum, item) => {
      if (item.renewalFrequency === 'monthly') {
        return sum + (item.cost || 0);
      } else if (item.renewalFrequency === 'annual') {
        return sum + (item.cost || 0) / 12;
      }
      return sum;
    }, 0);

    return {
      hardware: hardwareCost,
      software: softwareCost,
      monthlyTotal: softwareCost,
      total: hardwareCost + softwareCost,
    };
  }, [selectedHardware, selectedSoftware]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddRoleSelection = () => {
    if (currentRoleSelection && currentRoleSelection.role) {
      // Check if this combination already exists
      const exists = roleSelections.some(
        (sel) =>
          sel.departmentGroup === currentRoleSelection.departmentGroup &&
          sel.role === currentRoleSelection.role
      );

      if (!exists) {
        setRoleSelections((prev) => [...prev, currentRoleSelection]);
        setCurrentRoleSelection(null);
      }
    }
  };

  const handleRemoveRoleSelection = (index: number) => {
    setRoleSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!validation.isValid) return;

    // Flatten roleSelections into separate arrays
    const roleTarget = roleSelections.map((sel) => sel.role);
    const departmentTarget = roleSelections.map((sel) => sel.departmentGroup);

    const packageData: Partial<Package> = {
      id: existingPackage?.id || `pkg-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      isStandard,
      roleTarget,
      departmentTarget,
      hardware: selectedHardware,
      software: selectedSoftware,
      createdBy: existingPackage?.createdBy || 'Current User',
      createdDate: existingPackage?.createdDate || new Date(),
      lastModified: new Date(),
    };

    onSave(packageData);
  };

  // ============================================================================
  // TAB CONTENT RENDERERS
  // ============================================================================

  const renderDetailsTab = () => (
    <div className="space-y-5">
      {/* Basic Information */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <Input
              label="Package Name *"
              id="packageName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., XD Designer Standard"
            />
            {name && name.trim().length < 3 && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">Name must be at least 3 characters</p>
            )}
          </div>

          <Textarea
            label="Description *"
            id="packageDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this equipment package and who it's designed for..."
            rows={3}
          />

          {/* Package Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Package Type *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsStandard(true)}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all
                  ${
                    isStandard
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    name="check"
                    className={`w-5 h-5 ${
                      isStandard
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Standard</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                  Auto-approved, standard equipment configuration
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsStandard(false)}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all
                  ${
                    !isStandard
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    name="alert-circle"
                    className={`w-5 h-5 ${
                      !isStandard
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">Exception</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                  Requires SVP approval, non-standard configuration
                </p>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Target Roles & Departments */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="briefcase" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Target Roles & Departments * ({roleSelections.length} selected)
          </h3>
        </div>

        {/* Selected Role/Department Combinations */}
        {roleSelections.length > 0 && (
          <div className="mb-4 space-y-2">
            {roleSelections.map((selection, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selection.role}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selection.departmentGroup}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveRoleSelection(index)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Role/Department Combination */}
        <div className="space-y-3">
          <HierarchicalRoleSelector
            data={hierarchicalData}
            value={currentRoleSelection}
            onChange={setCurrentRoleSelection}
          />
          <Button
            variant="outline"
            onClick={handleAddRoleSelection}
            disabled={!currentRoleSelection || !currentRoleSelection.role}
            className="w-full"
          >
            <Icon name="add" className="w-4 h-4 mr-2" />
            Add Role & Department
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderHardwareTab = () => (
    <div className="space-y-6">
      {/* Selected Hardware */}
      {selectedHardware.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selected Hardware ({selectedHardware.length})
          </h3>
          <div className="space-y-2">
            {selectedHardware.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {item.model}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.manufacturer}
                  </p>
                </div>
                {item.cost !== undefined && (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white mx-4">
                    ${item.cost.toFixed(2)}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedHardware((prev) => prev.filter((h) => h.id !== item.id))
                  }
                  className="text-red-600 dark:text-red-400"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hardware Catalog */}
      <HardwareCatalog
        hardware={hardware}
        selectedItems={selectedHardware}
        onSelect={(item) => setSelectedHardware((prev) => [...prev, item])}
        onDeselect={(item) =>
          setSelectedHardware((prev) => prev.filter((h) => h.id !== item.id))
        }
        multiSelect={true}
        showCost={true}
      />
    </div>
  );

  const renderSoftwareTab = () => (
    <div className="space-y-6">
      {/* Selected Software */}
      {selectedSoftware.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selected Software ({selectedSoftware.length})
          </h3>
          <div className="space-y-2">
            {selectedSoftware.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.name}
                    </p>
                    {item.requiresApproval && (
                      <Icon
                        name="alert-circle"
                        className="w-4 h-4 text-orange-600 dark:text-orange-400"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.vendor}</p>
                </div>
                {item.cost !== undefined && (
                  <div className="text-right mx-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${item.cost.toFixed(2)}
                    </span>
                    {item.renewalFrequency && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        /{item.renewalFrequency === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedSoftware((prev) => prev.filter((s) => s.id !== item.id))
                  }
                  className="text-red-600 dark:text-red-400"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Software Catalog */}
      <SoftwareCatalog
        software={software}
        selectedItems={selectedSoftware}
        onSelect={(item) => setSelectedSoftware((prev) => [...prev, item])}
        onDeselect={(item) =>
          setSelectedSoftware((prev) => prev.filter((s) => s.id !== item.id))
        }
        multiSelect={true}
        showCost={true}
      />
    </div>
  );

  const renderReviewTab = () => (
    <div className="space-y-5">
      {/* Package Summary */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Package Summary
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Name</label>
            <p className="text-base font-medium text-gray-900 dark:text-white">{name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
            <p className="text-base text-gray-900 dark:text-white">{description}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Type</label>
            <p className="text-base text-gray-900 dark:text-white">
              {isStandard ? 'Standard (Auto-approve)' : 'Exception (SVP Approval)'}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Target Roles & Departments</label>
            <div className="space-y-1 mt-1">
              {roleSelections.map((selection, index) => (
                <p key={index} className="text-base text-gray-900 dark:text-white">
                  {selection.role} <span className="text-sm text-gray-500 dark:text-gray-400">({selection.departmentGroup})</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Contents Summary */}
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Package Contents
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="monitor" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Hardware</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedHardware.length}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="package" className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Software</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedSoftware.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Cost Summary */}
      <Card className="p-5">
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
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                Total Monthly Cost
              </span>
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                ${costs.total.toFixed(2)}/mo
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Errors */}
      {!validation.isValid && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <Icon name="alert-circle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // ============================================================================
  // TAB CONFIGURATION
  // ============================================================================

  const tabs: Array<{ id: Tab; label: string; icon: string; count?: number }> = [
    { id: 'details', label: 'Details', icon: 'info' },
    {
      id: 'hardware',
      label: 'Hardware',
      icon: 'monitor',
      count: selectedHardware.length,
    },
    {
      id: 'software',
      label: 'Software & Licenses',
      icon: 'package',
      count: selectedSoftware.length,
    },
    { id: 'review', label: 'Review', icon: 'eye' },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingPackage ? 'Edit Package' : 'Create Package'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Build a custom equipment package for pre-hire assignment
          </p>
        </div>

        {/* Cost Display */}
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Monthly Cost</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${costs.total.toFixed(2)}/mo
          </p>
        </div>
      </div>

      {/* Cloning Banner */}
      {isCloning && existingPackage && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="copy" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Cloning Package
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                You are creating a new package based on: <span className="font-semibold">{existingPackage.name.replace(' - Copy', '')}</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                All settings and items have been pre-filled. You can modify them before saving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon name={tab.icon as any} className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'hardware' && renderHardwareTab()}
        {activeTab === 'software' && renderSoftwareTab()}
        {activeTab === 'review' && renderReviewTab()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 -mx-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          {activeTab !== 'details' && (
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1].id);
                }
              }}
            >
              <Icon name="chevron-left" className="w-4 h-4 mr-1" />
              Previous
            </Button>
          )}

          {activeTab !== 'review' ? (
            <Button
              variant="primary"
              onClick={() => {
                const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id);
                }
              }}
            >
              Next
              <Icon name="chevron-right" className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!validation.isValid}
            >
              <Icon name="save" className="w-4 h-4 mr-2" />
              {existingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Create mode:
 * <PackageBuilder
 *   hardware={mockHardware}
 *   software={mockSoftware}
 *   onSave={(pkg) => handleCreatePackage(pkg)}
 *   onCancel={() => setCreating(false)}
 * />
 *
 * Edit mode:
 * <PackageBuilder
 *   package={existingPackage}
 *   hardware={mockHardware}
 *   software={mockSoftware}
 *   onSave={(pkg) => handleUpdatePackage(existingPackage.id, pkg)}
 *   onCancel={() => setEditingPackage(null)}
 * />
 */
