// ============================================================================
// RECAP FORM COMPONENT
// ============================================================================
// Mobile-optimized post-event recap submission form for Field Managers
// Features: Collapsible sections, photo upload, client-specific fields, validation

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Toast } from '../ui/Toast';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EventRecap {
  id: string;
  eventId: string;
  submittedById: string;
  submittedAt: Date;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedById?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  footprintDescription: string;
  qrScans: number;
  surveysCollected: number;
  clientMetrics: Record<string, any>;
  eventFeedback: {
    baPerformance?: string;
    salesTeam?: string;
    customerComments?: string;
    trafficFlow?: string;
    attendeeDemographics?: string;
    wouldReturn: boolean;
  };
  photos: EventPhoto[];
  additionalComments?: string;
}

interface EventPhoto {
  id: string;
  url: string;
  filename: string;
  uploadedAt: Date;
}

interface PremiumDistribution {
  id: string;
  premiumType: string;
  quantityDistributed: number;
  quantityRemaining?: number;
}

interface EventDetails {
  id: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  clientName: string;
  programName: string;
}

interface RecapFormProps {
  eventDetails: EventDetails;
  clientType?: 'verizon' | 'amex' | 'cocacola' | 'general';
  initialData?: Partial<EventRecap>;
  onSaveDraft: (data: Partial<EventRecap>) => Promise<void>;
  onSubmit: (data: Partial<EventRecap>) => Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RecapForm: React.FC<RecapFormProps> = ({
  eventDetails,
  clientType = 'general',
  initialData,
  onSaveDraft,
  onSubmit,
  onCancel,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    clientMetrics: false,
    feedback: false,
    photos: false,
    comments: false,
  });

  const [formData, setFormData] = useState<Partial<EventRecap>>({
    indoorOutdoor: initialData?.indoorOutdoor || 'outdoor',
    footprintDescription: initialData?.footprintDescription || '',
    qrScans: initialData?.qrScans || 0,
    surveysCollected: initialData?.surveysCollected || 0,
    clientMetrics: initialData?.clientMetrics || {},
    eventFeedback: initialData?.eventFeedback || {
      wouldReturn: true,
    },
    photos: initialData?.photos || [],
    additionalComments: initialData?.additionalComments || '',
  });

  const [premiums, setPremiums] = useState<PremiumDistribution[]>([
    { id: '1', premiumType: '', quantityDistributed: 0, quantityRemaining: 0 },
  ]);

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateFeedback = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      eventFeedback: {
        ...prev.eventFeedback,
        [field]: value,
      },
    }));
  };

  const updateClientMetric = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      clientMetrics: {
        ...prev.clientMetrics,
        [field]: value,
      },
    }));
  };

  const addPremium = () => {
    setPremiums([
      ...premiums,
      {
        id: Date.now().toString(),
        premiumType: '',
        quantityDistributed: 0,
        quantityRemaining: 0,
      },
    ]);
  };

  const removePremium = (id: string) => {
    setPremiums(premiums.filter((p) => p.id !== id));
  };

  const updatePremium = (id: string, field: string, value: any) => {
    setPremiums(
      premiums.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Photo upload handlers
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      addPhotos(Array.from(files));
    }
  };

  const handlePhotoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingPhoto(false);
    const files = event.dataTransfer.files;
    if (files) {
      addPhotos(Array.from(files));
    }
  };

  const addPhotos = (newFiles: File[]) => {
    // Validate file size (max 20MB per file)
    const validFiles = newFiles.filter((file) => {
      if (file.size > 20 * 1024 * 1024) {
        setToastMessage({
          type: 'error',
          message: `${file.name} exceeds 20MB limit`,
        });
        return false;
      }
      return true;
    });

    setPhotos([...photos, ...validFiles]);

    // Generate preview URLs
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviewUrls((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.indoorOutdoor) {
      newErrors.indoorOutdoor = 'Please select indoor/outdoor';
    }

    if (!formData.footprintDescription?.trim()) {
      newErrors.footprintDescription = 'Footprint description is required';
    }

    if (photos.length === 0 && !formData.photos?.length) {
      newErrors.photos = 'At least one photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handlers
  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await onSaveDraft({
        ...formData,
        status: 'draft',
      });
      setToastMessage({ type: 'success', message: 'Draft saved successfully' });
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to save draft' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setToastMessage({ type: 'error', message: 'Please fix validation errors' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        status: 'pending',
      });
      setToastMessage({
        type: 'success',
        message: 'Recap submitted for approval',
      });
    } catch (error) {
      setToastMessage({ type: 'error', message: 'Failed to submit recap' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER SECTIONS
  // ============================================================================

  const renderSection = (
    key: string,
    title: string,
    icon: any,
    content: React.ReactNode
  ) => (
    <Card className="mb-4">
      <button
        type="button"
        onClick={() => toggleSection(key)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon name={icon} className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <Icon
          name={expandedSections[key] ? 'chevron-up' : 'chevron-down'}
          className="w-5 h-5 text-gray-500"
        />
      </button>
      {expandedSections[key] && <div className="p-4 pt-0 space-y-4">{content}</div>}
    </Card>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Event Details Header (Read-Only) */}
      <Card className="mb-6 p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Event Recap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Event:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.eventName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Date:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.eventDate}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Time:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.startTime} - {eventDetails.endTime}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Venue:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.venueName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Client:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.clientName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Program:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {eventDetails.programName}
            </span>
          </div>
        </div>
      </Card>

      {/* Basic Info Section */}
      {renderSection(
        'basic',
        'Basic Information',
        'info',
        <>
          {/* Indoor/Outdoor Radio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indoor/Outdoor <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {['indoor', 'outdoor', 'both'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="indoorOutdoor"
                    value={type}
                    checked={formData.indoorOutdoor === type}
                    onChange={(e) => updateFormData('indoorOutdoor', e.target.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm capitalize text-gray-900 dark:text-gray-100">
                    {type}
                  </span>
                </label>
              ))}
            </div>
            {errors.indoorOutdoor && (
              <p className="text-red-500 text-sm mt-1">{errors.indoorOutdoor}</p>
            )}
          </div>

          {/* Footprint Description */}
          <Textarea
            label="Footprint Description"
            id="footprintDescription"
            required
            rows={4}
            value={formData.footprintDescription}
            onChange={(e) => updateFormData('footprintDescription', e.target.value)}
            placeholder="Describe the event setup, booth size, layout, traffic flow..."
            helperText={errors.footprintDescription}
          />

          {/* QR Scans */}
          <Input
            label="QR Scans"
            id="qrScans"
            type="number"
            min="0"
            value={formData.qrScans}
            onChange={(e) => updateFormData('qrScans', parseInt(e.target.value) || 0)}
          />

          {/* Surveys Collected */}
          <Input
            label="Surveys Collected"
            id="surveysCollected"
            type="number"
            min="0"
            value={formData.surveysCollected}
            onChange={(e) => updateFormData('surveysCollected', parseInt(e.target.value) || 0)}
          />
        </>
      )}

      {/* Client Metrics Section (Dynamic based on client) */}
      {renderSection(
        'clientMetrics',
        'Client Metrics',
        'trending-up',
        <>
          {clientType === 'verizon' && (
            <>
              <Input
                label="# Sales Reps On-Site"
                id="salesReps"
                type="number"
                min="0"
                value={formData.clientMetrics?.salesReps || 0}
                onChange={(e) =>
                  updateClientMetric('salesReps', parseInt(e.target.value) || 0)
                }
              />
              <Input
                label="# Sales Made"
                id="salesMade"
                type="number"
                min="0"
                value={formData.clientMetrics?.salesMade || 0}
                onChange={(e) =>
                  updateClientMetric('salesMade', parseInt(e.target.value) || 0)
                }
              />

              {/* Premiums Distributed (Repeatable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Premiums Distributed
                </label>
                {premiums.map((premium, index) => (
                  <div key={premium.id} className="flex gap-2 mb-2">
                    <select
                      value={premium.premiumType}
                      onChange={(e) =>
                        updatePremium(premium.id, 'premiumType', e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    >
                      <option value="">Select type...</option>
                      <option value="popsocket">Popsocket</option>
                      <option value="waterbottle">Water Bottle</option>
                      <option value="coolingtowel">Cooling Towel</option>
                      <option value="giftcard">Starbucks Gift Card</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      placeholder="Distributed"
                      value={premium.quantityDistributed}
                      onChange={(e) =>
                        updatePremium(
                          premium.id,
                          'quantityDistributed',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Remaining"
                      value={premium.quantityRemaining}
                      onChange={(e) =>
                        updatePremium(
                          premium.id,
                          'quantityRemaining',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    />
                    {premiums.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePremium(premium.id)}
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPremium}>
                  <Icon name="plus" className="w-4 h-4 mr-2" />
                  Add Premium
                </Button>
              </div>
            </>
          )}

          {clientType === 'amex' && (
            <>
              <Input
                label="Attendance"
                id="attendance"
                type="number"
                min="0"
                value={formData.clientMetrics?.attendance || 0}
                onChange={(e) =>
                  updateClientMetric('attendance', parseInt(e.target.value) || 0)
                }
              />
              <Input
                label="Talent Signings"
                id="talentSignings"
                type="number"
                min="0"
                value={formData.clientMetrics?.talentSignings || 0}
                onChange={(e) =>
                  updateClientMetric('talentSignings', parseInt(e.target.value) || 0)
                }
              />
              <Input
                label="Game Participants"
                id="gameParticipants"
                type="number"
                min="0"
                value={formData.clientMetrics?.gameParticipants || 0}
                onChange={(e) =>
                  updateClientMetric('gameParticipants', parseInt(e.target.value) || 0)
                }
              />
            </>
          )}

          {clientType === 'general' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No client-specific metrics configured for this event.
            </p>
          )}
        </>
      )}

      {/* Feedback Section */}
      {renderSection(
        'feedback',
        'Event Feedback',
        'message-square',
        <>
          <Textarea
            label="BA Performance"
            id="baPerformance"
            rows={3}
            value={formData.eventFeedback?.baPerformance || ''}
            onChange={(e) => updateFeedback('baPerformance', e.target.value)}
            placeholder="How did the Brand Ambassadors perform?"
          />
          <Textarea
            label="Sales Team"
            id="salesTeam"
            rows={3}
            value={formData.eventFeedback?.salesTeam || ''}
            onChange={(e) => updateFeedback('salesTeam', e.target.value)}
            placeholder="Feedback on sales team performance..."
          />
          <Textarea
            label="Customer Comments"
            id="customerComments"
            rows={3}
            value={formData.eventFeedback?.customerComments || ''}
            onChange={(e) => updateFeedback('customerComments', e.target.value)}
            placeholder="Notable customer feedback or reactions..."
          />
          <Textarea
            label="Traffic Flow"
            id="trafficFlow"
            rows={3}
            value={formData.eventFeedback?.trafficFlow || ''}
            onChange={(e) => updateFeedback('trafficFlow', e.target.value)}
            placeholder="How was foot traffic? Peak times? Bottlenecks?"
          />
          <Textarea
            label="Attendee Demographics"
            id="attendeeDemographics"
            rows={3}
            value={formData.eventFeedback?.attendeeDemographics || ''}
            onChange={(e) => updateFeedback('attendeeDemographics', e.target.value)}
            placeholder="Age range, interests, general observations..."
          />

          {/* Would Return */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Would you return to this event/location?
            </label>
            <div className="flex gap-4">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map((option) => (
                <label key={option.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="wouldReturn"
                    checked={formData.eventFeedback?.wouldReturn === option.value}
                    onChange={() => updateFeedback('wouldReturn', option.value)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Photos Section */}
      {renderSection(
        'photos',
        'Event Photos',
        'camera',
        <>
          {/* Drag-and-drop upload area */}
          <div
            onDrop={handlePhotoDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingPhoto(true);
            }}
            onDragLeave={() => setIsDraggingPhoto(false)}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${
                isDraggingPhoto
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }
            `}
          >
            <Icon name="upload" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop photos here, or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
              id="photoUpload"
            />
            <label htmlFor="photoUpload">
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('photoUpload')?.click()}>
                <Icon name="folder" className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Maximum 20MB per file. JPG, PNG, HEIC supported.
            </p>
          </div>

          {errors.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}

          {/* Photo Previews */}
          {photoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="x" className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                    {photos[index]?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Additional Comments Section */}
      {renderSection(
        'comments',
        'Additional Comments',
        'file-text',
        <Textarea
          label="Additional Comments"
          id="additionalComments"
          rows={5}
          value={formData.additionalComments || ''}
          onChange={(e) => updateFormData('additionalComments', e.target.value)}
          placeholder="Any additional notes, issues, or observations..."
        />
      )}

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto flex gap-3 justify-end">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button variant="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    </div>
  );
};
