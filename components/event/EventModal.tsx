/**
 * EventModal - Create/Edit Event Multi-Step Form
 *
 * 3-Step Form:
 * 1. Event Basics (name, campaign, dates, details)
 * 2. Venue & Location (venue, address, city, country, lat/long)
 * 3. Team Assignments (optional - add team members with roles)
 */

import React, { useState, useEffect } from 'react';
import { useEvents } from '../../contexts/EventContext';
import type { Event, Campaign, PeopleAssignment } from '../../types';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Select } from '../ui/Select';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null; // If provided, edit mode; otherwise create mode
  campaigns?: Campaign[];
  currentUser?: { name: string; email: string };
}

type FormStep = 1 | 2 | 3;

interface EventFormData {
  eventName: string;
  campaignId: string;
  eventStartDate: string;
  eventEndDate: string;
  eventDetails: string;
  eventVenue: string;
  address: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  owner: string;
  ownerName: string;
  status: Event['status'];
}

const initialFormData: EventFormData = {
  eventName: '',
  campaignId: '',
  eventStartDate: '',
  eventEndDate: '',
  eventDetails: '',
  eventVenue: '',
  address: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  owner: '',
  ownerName: '',
  status: 'planning',
};

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  campaigns = [],
  currentUser = { name: 'Unknown User', email: 'unknown@example.com' },
}) => {
  const { createEvent, updateEvent } = useEvents();

  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [teamAssignments, setTeamAssignments] = useState<Partial<PeopleAssignment>[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName,
        campaignId: event.campaignId,
        eventStartDate: new Date(event.eventStartDate).toISOString().split('T')[0],
        eventEndDate: new Date(event.eventEndDate).toISOString().split('T')[0],
        eventDetails: event.eventDetails || '',
        eventVenue: event.eventVenue,
        address: event.address || '',
        city: event.city,
        country: event.country,
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
        owner: event.owner,
        ownerName: event.ownerName || '',
        status: event.status,
      });
      setTeamAssignments(event.peopleAssignments || []);
    } else {
      setFormData({ ...initialFormData, owner: currentUser.email, ownerName: currentUser.name });
      setTeamAssignments([]);
    }
  }, [event, currentUser]);

  // Handle form field changes
  const handleChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate step 1
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    if (!formData.campaignId) {
      newErrors.campaignId = 'Campaign is required';
    }
    if (!formData.eventStartDate) {
      newErrors.eventStartDate = 'Start date is required';
    }
    if (!formData.eventEndDate) {
      newErrors.eventEndDate = 'End date is required';
    }
    if (formData.eventStartDate && formData.eventEndDate && formData.eventEndDate < formData.eventStartDate) {
      newErrors.eventEndDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 2
  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.eventVenue.trim()) {
      newErrors.eventVenue = 'Venue name is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Optional lat/long validation
    if (formData.latitude && isNaN(Number(formData.latitude))) {
      newErrors.latitude = 'Latitude must be a valid number';
    }
    if (formData.longitude && isNaN(Number(formData.longitude))) {
      newErrors.longitude = 'Longitude must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as FormStep);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const eventData = {
        eventName: formData.eventName,
        campaignId: formData.campaignId,
        eventStartDate: new Date(formData.eventStartDate),
        eventEndDate: new Date(formData.eventEndDate),
        eventDetails: formData.eventDetails || undefined,
        eventVenue: formData.eventVenue,
        address: formData.address || undefined,
        city: formData.city,
        country: formData.country,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        owner: formData.owner,
        ownerName: formData.ownerName || undefined,
        status: formData.status,
        peopleAssignments: teamAssignments as PeopleAssignment[],
      };

      if (event) {
        // Update existing event
        await updateEvent(event.id, eventData);
      } else {
        // Create new event
        await createEvent(eventData);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save event:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ ...initialFormData, owner: currentUser.email, ownerName: currentUser.name });
    setTeamAssignments([]);
    setCurrentStep(1);
    setErrors({});
  };

  // Handle close
  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Add team member
  const handleAddTeamMember = () => {
    setTeamAssignments((prev) => [
      ...prev,
      {
        userId: '',
        userName: '',
        userEmail: '',
        userRole: '',
        onSite: false,
      },
    ]);
  };

  // Remove team member
  const handleRemoveTeamMember = (index: number) => {
    setTeamAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  // Update team member
  const handleTeamMemberChange = (index: number, field: keyof PeopleAssignment, value: any) => {
    setTeamAssignments((prev) =>
      prev.map((member, i) => (i === index ? { ...member, [field]: value } : member))
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon name="x-mark" className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span>Event Basics</span>
            <span>Venue & Location</span>
            <span>Team Assignments</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Event Basics */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleChange('eventName', e.target.value)}
                  placeholder="e.g., Nike Air Max Launch - Los Angeles"
                  error={errors.eventName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.campaignId}
                  onChange={(e) => handleChange('campaignId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.campaignId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select a campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.campaignName}
                    </option>
                  ))}
                </select>
                {errors.campaignId && <p className="mt-1 text-sm text-red-500">{errors.campaignId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.eventStartDate}
                    onChange={(e) => handleChange('eventStartDate', e.target.value)}
                    error={errors.eventStartDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.eventEndDate}
                    onChange={(e) => handleChange('eventEndDate', e.target.value)}
                    error={errors.eventEndDate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Details
                </label>
                <Textarea
                  value={formData.eventDetails}
                  onChange={(e) => handleChange('eventDetails', e.target.value)}
                  placeholder="Optional event description..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as Event['status'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Venue & Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.eventVenue}
                  onChange={(e) => handleChange('eventVenue', e.target.value)}
                  placeholder="e.g., Staples Center"
                  error={errors.eventVenue}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g., 1111 S Figueroa St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g., Los Angeles"
                    error={errors.city}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="e.g., USA"
                    error={errors.country}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="e.g., 34.0430"
                    error={errors.latitude}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="e.g., -118.2673"
                    error={errors.longitude}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <Icon name="information-circle" className="w-4 h-4 inline mr-2" />
                  Latitude and longitude are optional but enable map features. You can find coordinates using Google
                  Maps.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Team Assignments */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Team Assignments (Optional)</h3>
                <Button variant="secondary" onClick={handleAddTeamMember} leftIcon="plus">
                  Add Team Member
                </Button>
              </div>

              {teamAssignments.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Icon name="users" className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                  <p>No team members assigned yet.</p>
                  <p className="text-sm">You can add team members now or later.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamAssignments.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Team Member {index + 1}</h4>
                        <button
                          onClick={() => handleRemoveTeamMember(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="Name"
                          value={member.userName || ''}
                          onChange={(e) => handleTeamMemberChange(index, 'userName', e.target.value)}
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={member.userEmail || ''}
                          onChange={(e) => handleTeamMemberChange(index, 'userEmail', e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="Role (e.g., Event Manager)"
                          value={member.userRole || ''}
                          onChange={(e) => handleTeamMemberChange(index, 'userRole', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={member.onSite || false}
                            onChange={(e) => handleTeamMemberChange(index, 'onSite', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700 dark:text-gray-300">On-site</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={currentStep === 1 ? handleClose : handlePrevious}>
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          {currentStep < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
