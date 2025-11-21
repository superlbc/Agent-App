// ============================================================================
// LICENSE POOL CREATE MODAL COMPONENT
// ============================================================================
// Modal for creating new license pools

import React, { useState } from 'react';
import { Software } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { ToggleSwitch } from './ui/ToggleSwitch';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicensePoolCreateModalProps {
  onClose: () => void;
  onSubmit: (license: Partial<Software>) => void;
  className?: string;
}

interface FormData {
  name: string;
  vendor: string;
  licenseType: 'perpetual' | 'subscription' | 'concurrent';
  cost: string;
  costFrequency: 'one-time' | 'monthly' | 'annual';
  renewalFrequency: 'monthly' | 'annual';
  seatCount: string;
  description: string;
  requiresApproval: boolean;
  approver: string;
  vendorContact: string;
  internalContact: string;
  autoRenew: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LicensePoolCreateModal: React.FC<LicensePoolCreateModalProps> = ({
  onClose,
  onSubmit,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    name: '',
    vendor: '',
    licenseType: 'subscription',
    cost: '',
    costFrequency: 'monthly',
    renewalFrequency: 'monthly',
    seatCount: '',
    description: '',
    requiresApproval: false,
    approver: '',
    vendorContact: '',
    internalContact: '',
    autoRenew: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'License name is required';
    }
    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'Valid cost is required';
    }
    if (!formData.seatCount || parseInt(formData.seatCount) <= 0) {
      newErrors.seatCount = 'Valid seat count is required';
    }
    if (formData.requiresApproval && !formData.approver.trim()) {
      newErrors.approver = 'Approver is required when approval is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Create license object
    const newLicense: Partial<Software> = {
      id: `sw-${Date.now()}`,
      name: formData.name,
      vendor: formData.vendor,
      licenseType: formData.licenseType,
      cost: parseFloat(formData.cost),
      costFrequency: formData.costFrequency,
      renewalFrequency: formData.licenseType === 'subscription' ? formData.renewalFrequency : undefined,
      seatCount: parseInt(formData.seatCount),
      assignedSeats: 0,
      description: formData.description || undefined,
      requiresApproval: formData.requiresApproval,
      approver: formData.requiresApproval ? formData.approver : 'Auto',
      vendorContact: formData.vendorContact || undefined,
      internalContact: formData.internalContact || undefined,
      autoRenew: formData.licenseType === 'subscription' ? formData.autoRenew : undefined,
      assignments: [],
    };

    onSubmit(newLicense);
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${className}`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Icon name="plus" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create License Pool
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new software license pool
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            title="Close"
            className="!p-2"
          >
            <Icon name="x" className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="License Name *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Adobe Creative Cloud"
                error={errors.name}
              />
              <Input
                label="Vendor *"
                value={formData.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
                placeholder="e.g., Adobe"
                error={errors.vendor}
              />
            </div>

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the software and its purpose"
              rows={3}
            />
          </div>

          {/* License Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              License Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="License Type *"
                value={formData.licenseType}
                onChange={(e) => handleChange('licenseType', e.target.value as FormData['licenseType'])}
                options={[
                  { value: 'perpetual', label: 'Perpetual' },
                  { value: 'subscription', label: 'Subscription' },
                  { value: 'concurrent', label: 'Concurrent' },
                ]}
              />
              <Input
                label="Seat Count *"
                type="number"
                value={formData.seatCount}
                onChange={(e) => handleChange('seatCount', e.target.value)}
                placeholder="e.g., 10"
                min="1"
                error={errors.seatCount}
              />
            </div>
          </div>

          {/* Cost Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cost Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cost per Seat *"
                type="number"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="e.g., 59.99"
                min="0"
                step="0.01"
                error={errors.cost}
              />
              <Select
                label="Cost Frequency *"
                value={formData.costFrequency}
                onChange={(e) => handleChange('costFrequency', e.target.value as FormData['costFrequency'])}
                options={[
                  { value: 'one-time', label: 'One-time' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'annual', label: 'Annual' },
                ]}
              />
              {formData.licenseType === 'subscription' && (
                <Select
                  label="Renewal Frequency"
                  value={formData.renewalFrequency}
                  onChange={(e) => handleChange('renewalFrequency', e.target.value as FormData['renewalFrequency'])}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'annual', label: 'Annual' },
                  ]}
                />
              )}
            </div>
          </div>

          {/* Approval Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Approval Settings
            </h3>

            <div className="flex items-center gap-3">
              <ToggleSwitch
                checked={formData.requiresApproval}
                onChange={(checked) => handleChange('requiresApproval', checked)}
                label="Requires Approval"
              />
            </div>

            {formData.requiresApproval && (
              <Input
                label="Approver *"
                value={formData.approver}
                onChange={(e) => handleChange('approver', e.target.value)}
                placeholder="e.g., Steve Sanderson"
                error={errors.approver}
              />
            )}
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contacts & Administration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor Contact"
                value={formData.vendorContact}
                onChange={(e) => handleChange('vendorContact', e.target.value)}
                placeholder="Vendor sales/support contact"
              />
              <Input
                label="Internal Administrator"
                value={formData.internalContact}
                onChange={(e) => handleChange('internalContact', e.target.value)}
                placeholder="Internal license admin"
              />
            </div>

            {formData.licenseType === 'subscription' && (
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={formData.autoRenew}
                  onChange={(checked) => handleChange('autoRenew', checked)}
                  label="Auto-renew"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Create License Pool
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
