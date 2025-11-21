// ============================================================================
// LICENSE POOL EDIT MODAL COMPONENT
// ============================================================================
// Modal for editing existing license pools

import React, { useState, useEffect } from 'react';
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

interface LicensePoolEditModalProps {
  license: Software;
  onClose: () => void;
  onSubmit: (license: Software) => void;
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

export const LicensePoolEditModal: React.FC<LicensePoolEditModalProps> = ({
  license,
  onClose,
  onSubmit,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    name: license.name || '',
    vendor: license.vendor || '',
    licenseType: license.licenseType || 'subscription',
    cost: license.cost?.toString() || '',
    costFrequency: license.costFrequency || 'monthly',
    renewalFrequency: license.renewalFrequency || 'monthly',
    seatCount: license.seatCount?.toString() || '',
    description: license.description || '',
    requiresApproval: license.requiresApproval || false,
    approver: license.approver || 'Auto',
    vendorContact: license.vendorContact || '',
    internalContact: license.internalContact || '',
    autoRenew: license.autoRenew || false,
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

    // Create updated license object
    const updatedLicense: Software = {
      ...license,
      name: formData.name,
      vendor: formData.vendor,
      licenseType: formData.licenseType,
      cost: parseFloat(formData.cost),
      costFrequency: formData.costFrequency,
      renewalFrequency: formData.licenseType === 'subscription' ? formData.renewalFrequency : undefined,
      seatCount: parseInt(formData.seatCount),
      description: formData.description || undefined,
      requiresApproval: formData.requiresApproval,
      approver: formData.requiresApproval ? formData.approver : 'Auto',
      vendorContact: formData.vendorContact || undefined,
      internalContact: formData.internalContact || undefined,
      autoRenew: formData.licenseType === 'subscription' ? formData.autoRenew : undefined,
    };

    onSubmit(updatedLicense);
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
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="edit" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit License Pool
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update license pool configuration
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
          {/* Current Assignment Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="info" className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Assignment
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total Seats:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {license.seatCount || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {license.assignedSeats || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Available:</span>
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                  {(license.seatCount || 0) - (license.assignedSeats || 0)}
                </span>
              </div>
            </div>
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Total Seat Count *"
                type="number"
                value={formData.seatCount}
                onChange={(e) => handleChange('seatCount', e.target.value)}
                placeholder="e.g., 10"
                min={(license.assignedSeats || 0).toString()}
                error={errors.seatCount}
                helperText={`Cannot be less than ${license.assignedSeats || 0} (currently assigned)`}
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

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor Contact"
                value={formData.vendorContact}
                onChange={(e) => handleChange('vendorContact', e.target.value)}
                placeholder="support@vendor.com"
              />
              <Input
                label="Internal Contact"
                value={formData.internalContact}
                onChange={(e) => handleChange('internalContact', e.target.value)}
                placeholder="admin@company.com"
              />
            </div>
          </div>

          {/* Subscription Settings */}
          {formData.licenseType === 'subscription' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Subscription Settings
              </h3>

              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={formData.autoRenew}
                  onChange={(checked) => handleChange('autoRenew', checked)}
                  label="Auto-Renew"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Icon name="save" className="w-4 h-4 mr-2" />
              Update License Pool
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicensePoolEditModal;
