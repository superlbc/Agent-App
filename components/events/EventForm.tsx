import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

interface EventFormProps {
  onSubmit: (event: EventFormData) => void;
  onCancel: () => void;
  initialData?: EventFormData;
  programs: Array<{ id: string; name: string; clientId: string; }>;
  users: Array<{ id: string; name: string; email: string; }>;
}

export interface EventFormData {
  masterProgramId: string;
  eventName: string;
  eventDates: string[]; // Array for multi-day support
  startTime: string;
  endTime: string;
  venueName: string;
  venueType: 'indoor' | 'outdoor' | 'virtual';
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  businessLeaderId: string;
  projectLeaderId: string;
  status: 'planned' | 'tentative' | 'confirmed';
}

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  programs = [],
  users = []
}) => {
  const [formData, setFormData] = useState<EventFormData>(initialData || {
    masterProgramId: '',
    eventName: '',
    eventDates: [''],
    startTime: '',
    endTime: '',
    venueName: '',
    venueType: 'outdoor',
    addressLine: '',
    city: '',
    state: '',
    zip: '',
    businessLeaderId: '',
    projectLeaderId: '',
    status: 'planned'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...formData.eventDates];
    newDates[index] = value;
    setFormData(prev => ({ ...prev, eventDates: newDates }));
  };

  const addDate = () => {
    setFormData(prev => ({ ...prev, eventDates: [...prev.eventDates, ''] }));
  };

  const removeDate = (index: number) => {
    const newDates = formData.eventDates.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, eventDates: newDates }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.masterProgramId) newErrors.masterProgramId = 'Program is required';
    if (!formData.eventName) newErrors.eventName = 'Event name is required';
    if (formData.eventDates.length === 0 || !formData.eventDates[0]) {
      newErrors.eventDates = 'At least one date is required';
    }
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (!formData.venueName) newErrors.venueName = 'Venue name is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.businessLeaderId) newErrors.businessLeaderId = 'Business Leader is required';
    if (!formData.projectLeaderId) newErrors.projectLeaderId = 'Project Leader is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const US_STATES = [
    { value: '', label: 'Select State' },
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h2>
          <Icon name="calendar" className="w-8 h-8 text-primary-600" />
        </div>

        {/* Master Program */}
        <Select
          id="masterProgramId"
          label="Master Program"
          required
          value={formData.masterProgramId}
          onChange={(e) => handleChange('masterProgramId', e.target.value)}
          options={[
            { value: '', label: 'Select Program' },
            ...programs.map(p => ({ value: p.id, label: p.name }))
          ]}
        />
        {errors.masterProgramId && (
          <p className="mt-1 text-sm text-red-600">{errors.masterProgramId}</p>
        )}

        {/* Event Name */}
        <Input
          id="eventName"
          label="Event Name"
          required
          value={formData.eventName}
          onChange={(e) => handleChange('eventName', e.target.value)}
          placeholder="e.g., Verizon 5G Activation"
        />
        {errors.eventName && (
          <p className="mt-1 text-sm text-red-600">{errors.eventName}</p>
        )}

        {/* Event Dates (Multi-day support) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Date(s) <span className="text-red-500">*</span>
          </label>
          {formData.eventDates.map((date, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(index, e.target.value)}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
              {formData.eventDates.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => removeDate(index)}
                >
                  <Icon name="x" className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDate}
            className="mt-2"
          >
            <Icon name="plus" className="w-4 h-4 mr-2" />
            Add Another Date
          </Button>
          {errors.eventDates && (
            <p className="mt-1 text-sm text-red-600">{errors.eventDates}</p>
          )}
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startTime"
            label="Start Time"
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
          />
          <Input
            id="endTime"
            label="End Time"
            type="time"
            required
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
          />
        </div>
        {errors.endTime && (
          <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
        )}

        {/* Venue Details */}
        <Input
          id="venueName"
          label="Venue Name"
          required
          value={formData.venueName}
          onChange={(e) => handleChange('venueName', e.target.value)}
          placeholder="e.g., Times Square"
        />

        <Select
          id="venueType"
          label="Venue Type"
          required
          value={formData.venueType}
          onChange={(e) => handleChange('venueType', e.target.value)}
          options={[
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
            { value: 'virtual', label: 'Virtual' }
          ]}
        />

        <Input
          id="addressLine"
          label="Address"
          value={formData.addressLine}
          onChange={(e) => handleChange('addressLine', e.target.value)}
          placeholder="Street address"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            id="city"
            label="City"
            required
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
          <Select
            id="state"
            label="State"
            required
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            options={US_STATES}
          />
          <Input
            id="zip"
            label="ZIP Code"
            value={formData.zip}
            onChange={(e) => handleChange('zip', e.target.value)}
            placeholder="12345"
          />
        </div>

        {/* Business and Project Leaders */}
        <Select
          id="businessLeaderId"
          label="Business Leader"
          required
          value={formData.businessLeaderId}
          onChange={(e) => handleChange('businessLeaderId', e.target.value)}
          options={[
            { value: '', label: 'Select Business Leader' },
            ...users.map(u => ({ value: u.id, label: u.name }))
          ]}
        />

        <Select
          id="projectLeaderId"
          label="Project Leader"
          required
          value={formData.projectLeaderId}
          onChange={(e) => handleChange('projectLeaderId', e.target.value)}
          options={[
            { value: '', label: 'Select Project Leader' },
            ...users.map(u => ({ value: u.id, label: u.name }))
          ]}
        />

        {/* Status */}
        <Select
          id="status"
          label="Status"
          required
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={[
            { value: 'planned', label: 'Planned' },
            { value: 'tentative', label: 'Tentative' },
            { value: 'confirmed', label: 'Confirmed' }
          ]}
        />

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            <Icon name="check" className="w-4 h-4 mr-2" />
            {initialData ? 'Update Event' : 'Create Event'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
