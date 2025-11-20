// ============================================================================
// HARDWARE CREATE MODAL
// ============================================================================
// Modal component for creating hardware items without requiring a package
// Supports all hardware types with dynamic specification fields

import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Hardware } from '../types';

interface HardwareCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHardware: (hardware: Omit<Hardware, 'id'>) => void;
}

const HardwareCreateModal: React.FC<HardwareCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateHardware,
}) => {
  // Form state
  const [type, setType] = useState<Hardware['type']>('computer');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [status, setStatus] = useState<Hardware['status']>('available');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [cost, setCost] = useState('');

  // Dynamic specification fields
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [screenSize, setScreenSize] = useState('');
  const [connectivity, setConnectivity] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hardware type options
  const hardwareTypes: Array<{ value: Hardware['type']; label: string; icon: string }> = [
    { value: 'computer', label: 'Computer', icon: 'monitor' },
    { value: 'monitor', label: 'Monitor', icon: 'monitor' },
    { value: 'keyboard', label: 'Keyboard', icon: 'keyboard' },
    { value: 'mouse', label: 'Mouse', icon: 'mouse' },
    { value: 'dock', label: 'Dock/Hub', icon: 'link' },
    { value: 'headset', label: 'Headset', icon: 'headphones' },
    { value: 'accessory', label: 'Accessory', icon: 'package' },
  ];

  // Status options
  const statusOptions: Array<{ value: Hardware['status']; label: string; color: string }> = [
    { value: 'available', label: 'Available', color: 'text-green-600 dark:text-green-400' },
    { value: 'assigned', label: 'Assigned', color: 'text-blue-600 dark:text-blue-400' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-orange-600 dark:text-orange-400' },
    { value: 'retired', label: 'Retired', color: 'text-gray-600 dark:text-gray-400' },
  ];

  // Reset form
  const resetForm = () => {
    setType('computer');
    setModel('');
    setManufacturer('');
    setStatus('available');
    setSerialNumber('');
    setPurchaseDate('');
    setCost('');
    setProcessor('');
    setRam('');
    setStorage('');
    setScreenSize('');
    setConnectivity('');
    setErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    if (cost && isNaN(parseFloat(cost))) {
      newErrors.cost = 'Cost must be a valid number';
    }

    if (cost && parseFloat(cost) < 0) {
      newErrors.cost = 'Cost must be a positive number';
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

    // Build specifications object based on hardware type
    const specifications: Hardware['specifications'] = {};

    if (type === 'computer') {
      if (processor) specifications.processor = processor;
      if (ram) specifications.ram = ram;
      if (storage) specifications.storage = storage;
    } else if (type === 'monitor') {
      if (screenSize) specifications.screenSize = screenSize;
    } else {
      if (connectivity) specifications.connectivity = connectivity;
    }

    // Build hardware object
    const hardware: Omit<Hardware, 'id'> = {
      type,
      model: model.trim(),
      manufacturer: manufacturer.trim(),
      specifications,
      status,
      serialNumber: serialNumber.trim() || undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
    };

    onCreateHardware(hardware);
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="plus" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Create Hardware Item
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new hardware item to the inventory
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
          {/* Hardware Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hardware Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {hardwareTypes.map((hwType) => (
                <button
                  key={hwType.value}
                  type="button"
                  onClick={() => setType(hwType.value)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                    ${
                      type === hwType.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <Icon
                    name={hwType.icon}
                    className={`w-4 h-4 ${
                      type === hwType.value
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      type === hwType.value
                        ? 'text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {hwType.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model and Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Model *"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., MacBook Pro 16"
              error={errors.model}
            />
            <Input
              label="Manufacturer *"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g., Apple"
              error={errors.manufacturer}
            />
          </div>

          {/* Dynamic Specifications */}
          {type === 'computer' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Computer Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Processor"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="e.g., M3 Max"
                />
                <Input
                  label="RAM"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="e.g., 64GB"
                />
                <Input
                  label="Storage"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="e.g., 2TB SSD"
                />
              </div>
            </div>
          )}

          {type === 'monitor' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monitor Specifications
              </h3>
              <Input
                label="Screen Size"
                value={screenSize}
                onChange={(e) => setScreenSize(e.target.value)}
                placeholder='e.g., 27" 4K'
              />
            </div>
          )}

          {type !== 'computer' && type !== 'monitor' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {hardwareTypes.find((t) => t.value === type)?.label} Specifications
              </h3>
              <Input
                label="Connectivity"
                value={connectivity}
                onChange={(e) => setConnectivity(e.target.value)}
                placeholder="e.g., USB-C, Bluetooth, Wireless"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((statusOption) => (
                <button
                  key={statusOption.value}
                  type="button"
                  onClick={() => setStatus(statusOption.value)}
                  className={`
                    px-3 py-2 rounded-lg border transition-all text-sm font-medium
                    ${
                      status === statusOption.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {statusOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Optional Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., ABC123456789"
              />
              <Input
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
              <Input
                label="Cost (USD)"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g., 4299.00"
                error={errors.cost}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Icon name="plus" className="w-4 h-4" />
              Create Hardware
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HardwareCreateModal;
