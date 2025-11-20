// ============================================================================
// HARDWARE EDIT MODAL
// ============================================================================
// Modal component for editing hardware items with status updates and maintenance tracking

import React, { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Hardware } from '../types';

interface MaintenanceRecord {
  id: string;
  date: Date;
  description: string;
  performedBy: string;
  cost?: number;
}

interface HardwareEditModalProps {
  isOpen: boolean;
  hardware: Hardware | null;
  onClose: () => void;
  onUpdateHardware: (hardware: Hardware) => void;
}

const HardwareEditModal: React.FC<HardwareEditModalProps> = ({
  isOpen,
  hardware,
  onClose,
  onUpdateHardware,
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

  // Assignment tracking
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedDate, setAssignedDate] = useState('');

  // Maintenance tracking
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newMaintenanceDescription, setNewMaintenanceDescription] = useState('');
  const [newMaintenanceCost, setNewMaintenanceCost] = useState('');
  const [newMaintenancePerformedBy, setNewMaintenancePerformedBy] = useState('');

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
  const statusOptions: Array<{ value: Hardware['status']; label: string; color: string; icon: string }> = [
    { value: 'available', label: 'Available', color: 'text-green-600 dark:text-green-400', icon: 'check' },
    { value: 'assigned', label: 'Assigned', color: 'text-blue-600 dark:text-blue-400', icon: 'user' },
    { value: 'maintenance', label: 'Maintenance', color: 'text-orange-600 dark:text-orange-400', icon: 'alert' },
    { value: 'retired', label: 'Retired', color: 'text-gray-600 dark:text-gray-400', icon: 'x' },
  ];

  // Load hardware data when modal opens or hardware changes
  useEffect(() => {
    if (hardware) {
      setType(hardware.type);
      setModel(hardware.model);
      setManufacturer(hardware.manufacturer);
      setStatus(hardware.status);
      setSerialNumber(hardware.serialNumber || '');
      setPurchaseDate(hardware.purchaseDate ? new Date(hardware.purchaseDate).toISOString().split('T')[0] : '');
      setCost(hardware.cost ? hardware.cost.toString() : '');

      // Load specifications
      if (hardware.specifications) {
        setProcessor(hardware.specifications.processor || '');
        setRam(hardware.specifications.ram || '');
        setStorage(hardware.specifications.storage || '');
        setScreenSize(hardware.specifications.screenSize || '');
        setConnectivity(hardware.specifications.connectivity || '');
      }

      // In a real app, these would come from the hardware object or a separate API call
      // For now, using placeholder data
      setAssignedTo('');
      setAssignedDate('');
      setMaintenanceRecords([]);
    }
  }, [hardware]);

  // Reset form
  const resetForm = () => {
    setErrors({});
    setShowAddMaintenance(false);
    setNewMaintenanceDescription('');
    setNewMaintenanceCost('');
    setNewMaintenancePerformedBy('');
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

    if (status === 'assigned' && !assignedTo.trim()) {
      newErrors.assignedTo = 'Assigned to is required when status is Assigned';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle add maintenance record
  const handleAddMaintenance = () => {
    if (!newMaintenanceDescription.trim()) {
      setErrors({ ...errors, maintenance: 'Description is required' });
      return;
    }

    if (!newMaintenancePerformedBy.trim()) {
      setErrors({ ...errors, maintenancePerformedBy: 'Performed by is required' });
      return;
    }

    const newRecord: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      date: new Date(),
      description: newMaintenanceDescription.trim(),
      performedBy: newMaintenancePerformedBy.trim(),
      cost: newMaintenanceCost ? parseFloat(newMaintenanceCost) : undefined,
    };

    setMaintenanceRecords([newRecord, ...maintenanceRecords]);
    setNewMaintenanceDescription('');
    setNewMaintenanceCost('');
    setNewMaintenancePerformedBy('');
    setShowAddMaintenance(false);
    setErrors({ ...errors, maintenance: '', maintenancePerformedBy: '' });
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !hardware) {
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

    // Build updated hardware object
    const updatedHardware: Hardware = {
      ...hardware,
      type,
      model: model.trim(),
      manufacturer: manufacturer.trim(),
      specifications,
      status,
      serialNumber: serialNumber.trim() || undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
    };

    onUpdateHardware(updatedHardware);
    resetForm();
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !hardware) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="edit" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Edit Hardware Item
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hardware.manufacturer} {hardware.model}
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
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                    ${
                      status === statusOption.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <Icon
                    name={statusOption.icon}
                    className={`w-4 h-4 ${
                      status === statusOption.value
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      status === statusOption.value
                        ? 'text-indigo-900 dark:text-indigo-100'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {statusOption.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Assignment Information (if status is assigned) */}
          {status === 'assigned' && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Icon name="user" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Assignment Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Assigned To *"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Employee name or ID"
                  error={errors.assignedTo}
                />
                <Input
                  label="Assignment Date"
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Maintenance Tracking */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="alert" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maintenance History ({maintenanceRecords.length})
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                type="button"
              >
                <Icon name="plus" className="w-4 h-4" />
                Add Record
              </Button>
            </div>

            {/* Add Maintenance Form */}
            {showAddMaintenance && (
              <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <Input
                  label="Description *"
                  value={newMaintenanceDescription}
                  onChange={(e) => setNewMaintenanceDescription(e.target.value)}
                  placeholder="e.g., Replaced hard drive"
                  error={errors.maintenance}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Performed By *"
                    value={newMaintenancePerformedBy}
                    onChange={(e) => setNewMaintenancePerformedBy(e.target.value)}
                    placeholder="e.g., IT Team"
                    error={errors.maintenancePerformedBy}
                  />
                  <Input
                    label="Cost (USD)"
                    type="number"
                    step="0.01"
                    value={newMaintenanceCost}
                    onChange={(e) => setNewMaintenanceCost(e.target.value)}
                    placeholder="e.g., 299.00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleAddMaintenance} type="button">
                    <Icon name="save" className="w-4 h-4" />
                    Save Record
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddMaintenance(false);
                      setNewMaintenanceDescription('');
                      setNewMaintenanceCost('');
                      setNewMaintenancePerformedBy('');
                    }}
                    type="button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Maintenance Records List */}
            {maintenanceRecords.length > 0 ? (
              <div className="space-y-2">
                {maintenanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                          <span>By: {record.performedBy}</span>
                          {record.cost && <span>Cost: ${record.cost.toFixed(2)}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMaintenanceRecords(maintenanceRecords.filter((r) => r.id !== record.id));
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Delete maintenance record"
                      >
                        <Icon name="trash" className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                No maintenance records yet
              </p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Information
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
              <Icon name="save" className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HardwareEditModal;
