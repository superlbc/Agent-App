// ============================================================================
// SOFTWARE CREATE MODAL
// ============================================================================
// Modal component for creating software items
// Supports all license types with dynamic fields

import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Software } from '../types';

interface SoftwareCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSoftware: (software: Omit<Software, 'id'>) => void;
}

const SoftwareCreateModal: React.FC<SoftwareCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateSoftware,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [licenseType, setLicenseType] = useState<Software['licenseType']>('subscription');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approver, setApprover] = useState('');
  const [cost, setCost] = useState('');
  const [costFrequency, setCostFrequency] = useState<'one-time' | 'monthly' | 'annual'>('monthly');
  const [renewalFrequency, setRenewalFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [seatCount, setSeatCount] = useState('');
  const [description, setDescription] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [internalContact, setInternalContact] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // License type options
  const licenseTypes: Array<{ value: Software['licenseType']; label: string; icon: string; description: string }> = [
    {
      value: 'perpetual',
      label: 'Perpetual',
      icon: 'check',
      description: 'One-time purchase, no recurring cost'
    },
    {
      value: 'subscription',
      label: 'Subscription',
      icon: 'refresh',
      description: 'Monthly or annual recurring cost'
    },
    {
      value: 'concurrent',
      label: 'Concurrent',
      icon: 'users',
      description: 'Seat-based with usage limits'
    },
  ];

  // Reset form
  const resetForm = () => {
    setName('');
    setVendor('');
    setLicenseType('subscription');
    setRequiresApproval(false);
    setApprover('');
    setCost('');
    setCostFrequency('monthly');
    setRenewalFrequency('monthly');
    setSeatCount('');
    setDescription('');
    setRenewalDate('');
    setPurchaseDate('');
    setVendorContact('');
    setInternalContact('');
    setAutoRenew(false);
    setErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Software name is required';
    }

    if (!vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!cost) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(parseFloat(cost))) {
      newErrors.cost = 'Cost must be a valid number';
    } else if (parseFloat(cost) < 0) {
      newErrors.cost = 'Cost must be a positive number';
    }

    if ((licenseType === 'concurrent' || licenseType === 'subscription') && !seatCount) {
      newErrors.seatCount = 'Seat count is required for concurrent and subscription licenses';
    }

    if (seatCount && isNaN(parseInt(seatCount))) {
      newErrors.seatCount = 'Seat count must be a valid number';
    }

    if (seatCount && parseInt(seatCount) < 1) {
      newErrors.seatCount = 'Seat count must be at least 1';
    }

    if (requiresApproval && !approver.trim()) {
      newErrors.approver = 'Approver is required when approval is needed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Build software object
    const software: Omit<Software, 'id'> = {
      name: name.trim(),
      vendor: vendor.trim(),
      licenseType,
      requiresApproval,
      approver: requiresApproval && approver.trim() ? approver.trim() : undefined,
      cost: parseFloat(cost),
      costFrequency,
      renewalFrequency: licenseType !== 'perpetual' ? renewalFrequency : undefined,
      seatCount: seatCount ? parseInt(seatCount) : undefined,
      description: description.trim() || undefined,
      renewalDate: renewalDate ? new Date(renewalDate) : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      vendorContact: vendorContact.trim() || undefined,
      internalContact: internalContact.trim() || undefined,
      autoRenew: licenseType !== 'perpetual' ? autoRenew : undefined,
      assignedSeats: 0, // Start with 0 assigned seats
      assignments: [], // Empty assignments array
    };

    onCreateSoftware(software);
    resetForm();
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="plus" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create Software Item
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new software application to the inventory
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Software Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Software Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Adobe Creative Cloud"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor *
                </label>
                <Input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g., Adobe"
                  className={errors.vendor ? 'border-red-500' : ''}
                />
                {errors.vendor && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.vendor}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the software"
                rows={2}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            </div>
          </div>

          {/* License Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              License Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {licenseTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLicenseType(type.value)}
                  className={`
                    flex flex-col items-start gap-2 p-4 rounded-lg border transition-all
                    ${
                      licenseType === type.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={type.icon}
                      className={`w-5 h-5 ${
                        licenseType === type.value
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {type.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-left">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Cost & Frequency */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cost Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost * ($)
                </label>
                <Input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className={errors.cost ? 'border-red-500' : ''}
                />
                {errors.cost && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.cost}</p>
                )}
              </div>

              {/* Cost Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cost Frequency
                </label>
                <select
                  value={costFrequency}
                  onChange={(e) => setCostFrequency(e.target.value as 'one-time' | 'monthly' | 'annual')}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  disabled={licenseType === 'perpetual'}
                >
                  {licenseType === 'perpetual' && <option value="one-time">One-time</option>}
                  {licenseType !== 'perpetual' && (
                    <>
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual</option>
                    </>
                  )}
                </select>
              </div>

              {/* Renewal Frequency (only for non-perpetual) */}
              {licenseType !== 'perpetual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renewal Frequency
                  </label>
                  <select
                    value={renewalFrequency}
                    onChange={(e) => setRenewalFrequency(e.target.value as 'monthly' | 'annual')}
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Seat Count (for concurrent and subscription) */}
          {(licenseType === 'concurrent' || licenseType === 'subscription') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Seats *
              </label>
              <Input
                type="text"
                value={seatCount}
                onChange={(e) => setSeatCount(e.target.value)}
                placeholder="e.g., 10"
                className={errors.seatCount ? 'border-red-500' : ''}
              />
              {errors.seatCount && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.seatCount}</p>
              )}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Number of available seats for this license
              </p>
            </div>
          )}

          {/* Approval Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Approval Settings
            </h3>

            {/* Requires Approval */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresApproval"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label
                htmlFor="requiresApproval"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Requires approval for assignment
              </label>
            </div>

            {/* Approver (only if requires approval) */}
            {requiresApproval && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Approver *
                </label>
                <Input
                  type="text"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder="e.g., Steve Sanderson, Patricia"
                  className={errors.approver ? 'border-red-500' : ''}
                />
                {errors.approver && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.approver}</p>
                )}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Additional Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Date
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              {/* Renewal Date (only for non-perpetual) */}
              {licenseType !== 'perpetual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Next Renewal Date
                  </label>
                  <Input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                  />
                </div>
              )}

              {/* Vendor Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor Contact
                </label>
                <Input
                  type="text"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                  placeholder="vendor@email.com or sales rep name"
                />
              </div>

              {/* Internal Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Internal License Admin
                </label>
                <Input
                  type="text"
                  value={internalContact}
                  onChange={(e) => setInternalContact(e.target.value)}
                  placeholder="IT team member responsible"
                />
              </div>
            </div>

            {/* Auto-renewal (only for non-perpetual) */}
            {licenseType !== 'perpetual' && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <label
                  htmlFor="autoRenew"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Auto-renewal enabled
                </label>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <Icon name="check" className="w-4 h-4 mr-2" />
              Create Software
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SoftwareCreateModal;
