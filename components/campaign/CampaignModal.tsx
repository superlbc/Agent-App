import React, { useState, useEffect } from 'react';
import { Program } from '../../types-uxp';
import { useCampaigns, CampaignWithClient } from '../../contexts/CampaignContext';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { LoadingModal } from '../ui/LoadingModal';

// ============================================================================
// TYPES
// ============================================================================

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: CampaignWithClient; // If provided, edit mode; otherwise create mode
  onSuccess?: (campaign: Program) => void;
}

interface FormData {
  name: string;
  code: string;
  clientId: string;
  eventType: string;
  region: string;
  status: Program['status'];
  logo?: string;
}

interface FormErrors {
  name?: string;
  code?: string;
  clientId?: string;
  eventType?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EVENT_TYPES = [
  'Sports Activation',
  'Music Festival',
  'Product Sampling',
  'Brand Experience',
  'Retail Activation',
  'Trade Show',
  'Corporate Event',
  'Community Event',
  'Other',
];

const REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'West Coast',
  'Southwest',
  'National',
  'International',
];

// ============================================================================
// CAMPAIGN MODAL COMPONENT
// ============================================================================

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}) => {
  const { clients, createCampaign, updateCampaign, loading } = useCampaigns();
  const isEditMode = Boolean(campaign);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    clientId: '',
    eventType: '',
    region: '',
    status: 'active',
    logo: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isDraft, setIsDraft] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Populate form when editing
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        code: campaign.code,
        clientId: campaign.clientId,
        eventType: campaign.eventType,
        region: campaign.region || '',
        status: campaign.status,
        logo: campaign.logo || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        code: '',
        clientId: '',
        eventType: '',
        region: '',
        status: 'active',
        logo: '',
      });
    }
    setErrors({});
  }, [campaign, isOpen]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Campaign Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    }

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Campaign code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Campaign code must be uppercase letters, numbers, and hyphens only';
    }

    // Client validation
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    // Event Type validation
    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    // Skip validation for draft saves
    if (!saveAsDraft && !validateForm()) {
      return;
    }

    setIsDraft(saveAsDraft);

    try {
      if (isEditMode && campaign) {
        // Update existing campaign
        await updateCampaign(campaign.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          clientId: formData.clientId,
          eventType: formData.eventType,
          region: formData.region || undefined,
          status: saveAsDraft ? 'inactive' : formData.status,
          logo: formData.logo || undefined,
        });

        onSuccess?.({
          ...campaign,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          clientId: formData.clientId,
          eventType: formData.eventType,
          region: formData.region || undefined,
          status: saveAsDraft ? 'inactive' : formData.status,
          logo: formData.logo || undefined,
        });
      } else {
        // Create new campaign
        const newCampaign = await createCampaign({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          clientId: formData.clientId,
          eventType: formData.eventType,
          region: formData.region || undefined,
          status: saveAsDraft ? 'inactive' : formData.status,
          logo: formData.logo || undefined,
          createdBy: 'current-user', // TODO: Get from AuthContext
        });

        onSuccess?.(newCampaign);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      // Error handling - could show a toast notification here
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      code: '',
      clientId: '',
      eventType: '',
      region: '',
      status: 'active',
      logo: '',
    });
    setErrors({});
    onClose();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isEditMode
                  ? 'Update campaign details and settings'
                  : 'Fill in the details to create a new campaign'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(false);
            }}
            className="p-6 space-y-6"
          >
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Verizon 5G Rollout 2025"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Campaign Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., VZ-5G-2025"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Use uppercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={errors.clientId ? 'border-red-500' : ''}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientId}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
                className={errors.eventType ? 'border-red-500' : ''}
              >
                <option value="">Select event type...</option>
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              {errors.eventType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventType}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <Select
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
              >
                <option value="">Select region...</option>
                {REGIONS.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as Program['status'])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </Select>
            </div>

            {/* Logo URL (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo URL (Optional)
              </label>
              <Input
                type="url"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                URL to campaign logo image
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSubmit(true)}
                disabled={loading}
              >
                <Icon name="document" className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update Campaign' : 'Create Campaign'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && <LoadingModal message={isEditMode ? 'Updating campaign...' : 'Creating campaign...'} />}
    </>
  );
};
