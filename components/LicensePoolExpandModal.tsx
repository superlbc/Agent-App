// ============================================================================
// LICENSE POOL EXPAND MODAL COMPONENT
// ============================================================================
// Modal for expanding existing license pools by adding more seats

import React, { useState } from 'react';
import { Software } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LicensePoolExpandModalProps {
  license: Software;
  onClose: () => void;
  onSubmit: (license: Software, additionalSeats: number) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate utilization percentage
 */
const getUtilization = (assigned: number, total: number): number => {
  if (total === 0) return 0;
  return (assigned / total) * 100;
};

/**
 * Get utilization status color
 */
const getUtilizationColor = (utilization: number): string => {
  if (utilization > 100) return 'text-red-600 dark:text-red-400';
  if (utilization >= 90) return 'text-orange-600 dark:text-orange-400';
  if (utilization >= 75) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
};

/**
 * Get utilization bar color
 */
const getUtilizationBarColor = (utilization: number): string => {
  if (utilization > 100) return 'bg-red-500';
  if (utilization >= 90) return 'bg-orange-500';
  if (utilization >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

// ============================================================================
// COMPONENT
// ============================================================================

export const LicensePoolExpandModal: React.FC<LicensePoolExpandModalProps> = ({
  license,
  onClose,
  onSubmit,
  className = '',
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [additionalSeats, setAdditionalSeats] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const currentSeats = license.seatCount || 0;
  const assignedSeats = license.assignedSeats || 0;
  const availableSeats = currentSeats - assignedSeats;
  const currentUtilization = getUtilization(assignedSeats, currentSeats);

  const additionalSeatsNum = parseInt(additionalSeats) || 0;
  const newTotalSeats = currentSeats + additionalSeatsNum;
  const newUtilization = getUtilization(assignedSeats, newTotalSeats);
  const newAvailableSeats = newTotalSeats - assignedSeats;

  const costPerSeat = license.cost || 0;
  const additionalCost = costPerSeat * additionalSeatsNum;
  const costFrequency = license.costFrequency || license.renewalFrequency || 'monthly';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (value: string) => {
    setAdditionalSeats(value);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!additionalSeats || additionalSeatsNum <= 0) {
      setError('Please enter a valid number of seats to add');
      return;
    }

    onSubmit(license, additionalSeatsNum);
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Icon name="trending-up" className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Expand License Pool
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add more seats to {license.name}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current License Info */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">License</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {license.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Vendor</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {license.vendor}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Seats</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentSeats} total
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Assigned</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {assignedSeats} seats
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                <span className={`font-medium ${availableSeats <= 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {availableSeats} seats
                </span>
              </div>
            </div>

            {/* Current Utilization Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Current Utilization</span>
                <span className={`font-semibold ${getUtilizationColor(currentUtilization)}`}>
                  {currentUtilization.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getUtilizationBarColor(currentUtilization)} transition-all`}
                  style={{ width: `${Math.min(currentUtilization, 100)}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Add Seats Input */}
          <div>
            <Input
              label="Additional Seats *"
              type="number"
              value={additionalSeats}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter number of seats to add"
              min="1"
              error={error}
              helpText="How many seats would you like to add to this license pool?"
            />
          </div>

          {/* Cost Calculation */}
          {additionalSeatsNum > 0 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="calculator" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Cost Calculation
                  </h3>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Additional Seats
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {additionalSeatsNum} seats
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cost per Seat
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${costPerSeat.toFixed(2)}/{costFrequency === 'one-time' ? 'seat' : costFrequency === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-t border-blue-200 dark:border-blue-800 pt-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Additional Cost
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${additionalCost.toFixed(2)}/{costFrequency === 'one-time' ? 'one-time' : costFrequency === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* New Stats Preview */}
          {additionalSeatsNum > 0 && (
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="trending-up" className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    After Expansion
                  </h3>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Seats
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {newTotalSeats} seats
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      (+{additionalSeatsNum})
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Available Seats
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {newAvailableSeats} seats
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    New Utilization
                  </span>
                  <span className={`font-semibold ${getUtilizationColor(newUtilization)}`}>
                    {newUtilization.toFixed(0)}%
                  </span>
                </div>

                {/* New Utilization Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getUtilizationBarColor(newUtilization)} transition-all`}
                    style={{ width: `${Math.min(newUtilization, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

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
              disabled={!additionalSeats || additionalSeatsNum <= 0}
            >
              <Icon name="plus" className="w-4 h-4 mr-2" />
              Add {additionalSeatsNum > 0 ? additionalSeatsNum : ''} Seats
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
