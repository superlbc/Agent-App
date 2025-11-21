// ============================================================================
// PRE-HIRE FORM COMPONENT
// ============================================================================
// Form for creating and editing pre-hire candidate records

import React, { useState, useEffect } from 'react';
import { PreHire, Package } from '../types';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { FreezePeriodAlert, isInFreezePeriod } from './ui/FreezePeriodBanner';
import { HierarchicalRoleSelector, RoleSelection } from './ui/HierarchicalRoleSelector';
import { ManagerSelector, ManagerProfile } from './ManagerSelector';
import {
  PRE_HIRE_STATUSES,
} from '../constants';
import { mockPackages } from '../utils/mockData';
import { getHierarchicalData } from '../services/departmentDataService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PreHireFormProps {
  preHire?: PreHire; // If provided, form is in edit mode
  onSubmit: (preHire: Partial<PreHire>) => void;
  onCancel: () => void;
  className?: string;
}

interface FormData {
  candidateName: string;
  email: string;
  roleSelection: RoleSelection | null;
  startDate: string; // ISO date string
  hiringManager: ManagerProfile | null;
  status: PreHire['status'];
  assignedPackageId?: string;
}

interface FormErrors {
  candidateName?: string;
  email?: string;
  roleSelection?: string;
  startDate?: string;
  hiringManager?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PreHireForm: React.FC<PreHireFormProps> = ({
  preHire,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const isEditMode = !!preHire;

  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    candidateName: preHire?.candidateName || '',
    email: preHire?.email || '',
    roleSelection: preHire
      ? {
          departmentGroup: preHire.department || '',
          role: preHire.role || '',
        }
      : null,
    startDate: preHire?.startDate
      ? new Date(preHire.startDate).toISOString().split('T')[0]
      : '',
    hiringManager: preHire?.hiringManager
      ? {
          displayName: preHire.hiringManager,
          email: '', // We only have the name stored
        }
      : null,
    status: preHire?.status || 'candidate',
    assignedPackageId: preHire?.assignedPackage?.id || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedPackages, setSuggestedPackages] = useState<Package[]>([]);

  // Hierarchical department/role data from CSV
  const [hierarchicalData, setHierarchicalData] = useState<any[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load hierarchical department/role data from CSV on mount
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

  // Auto-suggest packages based on role
  useEffect(() => {
    if (formData.roleSelection?.role) {
      const suggested = mockPackages.filter((pkg) =>
        pkg.roleTarget.some((r) =>
          r.toLowerCase().includes(formData.roleSelection!.role.toLowerCase())
        )
      );
      setSuggestedPackages(suggested);

      // Auto-select first suggested package if none selected
      if (suggested.length > 0 && !formData.assignedPackageId) {
        setFormData((prev) => ({
          ...prev,
          assignedPackageId: suggested[0].id,
        }));
      }
    }
  }, [formData.roleSelection]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Candidate name
    if (!formData.candidateName.trim()) {
      newErrors.candidateName = 'Candidate name is required';
    } else if (formData.candidateName.trim().length < 2) {
      newErrors.candidateName = 'Name must be at least 2 characters';
    }

    // Email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Role and Department
    if (!formData.roleSelection || !formData.roleSelection.role) {
      newErrors.roleSelection = 'Role and department are required';
    }

    // Start date
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const date = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today && !isEditMode) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // Hiring manager
    if (!formData.hiringManager) {
      newErrors.hiringManager = 'Hiring manager is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Find selected package
      const selectedPackage = mockPackages.find(
        (pkg) => pkg.id === formData.assignedPackageId
      );

      // Build pre-hire object
      const preHireData: Partial<PreHire> = {
        id: preHire?.id || `pre-${Date.now()}`,
        candidateName: formData.candidateName.trim(),
        email: formData.email.trim() || undefined,
        role: formData.roleSelection?.role || '',
        department: formData.roleSelection?.departmentGroup || '',
        startDate: new Date(formData.startDate),
        hiringManager: formData.hiringManager?.displayName || '',
        status: formData.status,
        assignedPackage: selectedPackage,
        createdBy: isEditMode
          ? preHire.createdBy
          : 'Current User', // TODO: Get from auth context
        createdDate: preHire?.createdDate || new Date(),
        lastModified: new Date(),
      };

      onSubmit(preHireData);
    } catch (error) {
      console.error('Error submitting pre-hire form:', error);
      alert('Failed to save pre-hire record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const startDate = formData.startDate ? new Date(formData.startDate) : null;
  const isInFreeze = startDate && isInFreezePeriod(startDate);

  return (
    <Card className={`p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Pre-hire Record' : 'Create New Pre-hire'}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 pb-4">
            {isEditMode
              ? 'Update candidate information and package assignment'
              : 'Add a new pre-hire candidate to the onboarding pipeline'}
          </p>
        </div>

        {/* Candidate Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Candidate Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Candidate Name"
              name="candidateName"
              value={formData.candidateName}
              onChange={(e) => handleChange('candidateName', e.target.value)}
              placeholder="Enter full name"
              required
              error={errors.candidateName}
              autoFocus
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="candidate@momentumww.com"
              error={errors.email}
            />
          </div>

          <HierarchicalRoleSelector
            data={hierarchicalData}
            value={formData.roleSelection}
            onChange={(selection) =>
              setFormData((prev) => ({ ...prev, roleSelection: selection }))
            }
            error={errors.roleSelection}
            required
          />
        </div>

        {/* Start Date & Hiring Manager */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Start Date & Manager
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
                error={errors.startDate}
              />
              {isInFreeze && (
                <div className="mt-2">
                  <FreezePeriodAlert date={startDate!} size="sm" />
                </div>
              )}
            </div>

            <ManagerSelector
              label="Hiring Manager"
              value={formData.hiringManager}
              onChange={(manager) =>
                setFormData((prev) => ({ ...prev, hiringManager: manager }))
              }
              placeholder="Search for hiring manager..."
              required
              error={errors.hiringManager}
            />
          </div>
        </div>

        {/* Package Assignment */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Equipment Package
          </h3>

          <Select
            label="Assigned Package"
            name="assignedPackageId"
            value={formData.assignedPackageId}
            onChange={(e) => handleChange('assignedPackageId', e.target.value)}
            options={mockPackages.map((pkg) => ({
              value: pkg.id,
              label: `${pkg.name}${pkg.isStandard ? '' : ' (Exception - Requires Approval)'}`,
            }))}
            placeholder="Select equipment package"
          />

          {suggestedPackages.length > 0 && formData.roleSelection?.role && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Suggested packages for {formData.roleSelection.role}:</strong>{' '}
              {suggestedPackages.map((pkg) => pkg.name).join(', ')}
            </div>
          )}
        </div>

        {/* Status (Edit mode only) */}
        {isEditMode && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              Status
            </h3>

            <Select
              label="Pre-hire Status"
              name="status"
              value={formData.status}
              onChange={(e) =>
                handleChange('status', e.target.value as PreHire['status'])
              }
              options={PRE_HIRE_STATUSES.map((status) => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
              }))}
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isEditMode ? 'Update Pre-hire' : 'Create Pre-hire'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Create mode:
 * <PreHireForm
 *   onSubmit={(preHire) => console.log('Created:', preHire)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 *
 * Edit mode:
 * <PreHireForm
 *   preHire={existingPreHire}
 *   onSubmit={(updated) => console.log('Updated:', updated)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
