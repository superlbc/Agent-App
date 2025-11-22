// ============================================================================
// VENUE MODAL
// ============================================================================
// Create and edit venue form with validation
// Supports address input, geolocation, categorization, and tags

import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Chip } from '../ui/Chip';
import { Venue } from '../../types';
import { useVenue } from '../../contexts/VenueContext';

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue?: Venue; // If provided, edit mode; otherwise create mode
}

const VenueModal: React.FC<VenueModalProps> = ({ isOpen, onClose, venue }) => {
  const { createVenue, updateVenue } = useVenue();

  // Form state
  const [name, setName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [country, setCountry] = useState('');
  const [postCode, setPostCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [category, setCategory] = useState<Venue['category']>('Stadium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Venue['status']>('active');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!venue;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (venue) {
      // Edit mode - populate form with existing venue data
      setName(venue.name);
      setFullAddress(venue.fullAddress);
      setAddress(venue.address);
      setNumber(venue.number || '');
      setCity(venue.city);
      setState(venue.state || '');
      setStateCode(venue.stateCode || '');
      setCountry(venue.country);
      setPostCode(venue.postCode || '');
      setLatitude(venue.latitude.toString());
      setLongitude(venue.longitude.toString());
      setCategory(venue.category || 'Stadium');
      setTags(venue.tags || []);
      setUrl(venue.url || '');
      setStatus(venue.status);
    } else {
      // Create mode - reset form
      handleReset();
    }
  }, [venue, isOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleReset = () => {
    setName('');
    setFullAddress('');
    setAddress('');
    setNumber('');
    setCity('');
    setState('');
    setStateCode('');
    setCountry('');
    setPostCode('');
    setLatitude('');
    setLongitude('');
    setCategory('Stadium');
    setTags([]);
    setTagInput('');
    setUrl('');
    setStatus('active');
    setErrors({});
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!name.trim()) {
      newErrors.name = 'Venue name is required';
    }

    if (!fullAddress.trim()) {
      newErrors.fullAddress = 'Full address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Latitude and longitude validation
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!latitude.trim() || isNaN(lat)) {
      newErrors.latitude = 'Valid latitude is required';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (!longitude.trim() || isNaN(lng)) {
      newErrors.longitude = 'Valid longitude is required';
    } else if (lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const venueData: Partial<Venue> = {
        name: name.trim(),
        fullAddress: fullAddress.trim(),
        formattedAddress: fullAddress.trim(),
        address: address.trim(),
        number: number.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        stateCode: stateCode.trim() || undefined,
        country: country.trim(),
        postCode: postCode.trim() || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category,
        tags: tags.length > 0 ? tags : undefined,
        url: url.trim() || undefined,
        status,
        platform: 'Google Maps',
      };

      if (isEditMode && venue) {
        await updateVenue(venue.id, venueData);
      } else {
        await createVenue(venueData);
      }

      onClose();
      handleReset();
    } catch (err) {
      console.error('Failed to save venue:', err);
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save venue' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      handleReset();
      onClose();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Venue' : 'Create Venue'}
              </h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <Icon name="x" size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Venue Identity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Venue Information
              </h3>
              <div className="space-y-4">
                {/* Venue Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., MetLife Stadium"
                    error={errors.name}
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="e.g., 1 MetLife Stadium Dr, East Rutherford, NJ 07073, USA"
                    rows={2}
                    error={errors.fullAddress}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Complete mailing address including street, city, state, and country
                  </p>
                </div>
              </div>
            </div>

            {/* Address Components */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Address Components
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Address
                  </label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 1 MetLife Stadium Dr"
                  />
                </div>

                {/* Street Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Street Number
                  </label>
                  <Input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="e.g., 1"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., East Rutherford"
                    error={errors.city}
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State/Province
                  </label>
                  <Input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g., New Jersey"
                  />
                </div>

                {/* State Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State Code
                  </label>
                  <Input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="e.g., NJ"
                    maxLength={2}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., USA"
                    error={errors.country}
                  />
                </div>

                {/* Post Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <Input
                    type="text"
                    value={postCode}
                    onChange={(e) => setPostCode(e.target.value)}
                    placeholder="e.g., 07073"
                  />
                </div>
              </div>
            </div>

            {/* Geolocation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Geolocation <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Latitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude
                  </label>
                  <Input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 40.8128"
                    error={errors.latitude}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Decimal degrees (-90 to 90)
                  </p>
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitude
                  </label>
                  <Input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., -74.0742"
                    error={errors.longitude}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Decimal degrees (-180 to 180)
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <Icon name="info" size={16} className="inline mr-2" />
                  Future enhancement: Automatic geocoding from address will be implemented with Google Maps API integration.
                </p>
              </div>
            </div>

            {/* Categorization */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categorization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <Select value={category || ''} onChange={(e) => setCategory(e.target.value as Venue['category'])}>
                    <option value="Stadium">Stadium</option>
                    <option value="Arena">Arena</option>
                    <option value="Convention Center">Convention Center</option>
                    <option value="Park">Park</option>
                    <option value="Street">Street</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value as Venue['status'])}>
                    <option value="active">Active</option>
                    <option value="verified">Verified</option>
                    <option value="archived">Archived</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add a tag (press Enter)"
                  className="flex-1"
                />
                <Button type="button" variant="secondary" onClick={handleAddTag} leftIcon="plus">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onRemove={() => handleRemoveTag(tag)}
                      color="blue"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Venue URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Venue Website URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://www.metlifestadium.com"
              />
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Venue'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VenueModal;
