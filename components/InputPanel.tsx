import React, { useState, useMemo, useEffect } from 'react';
import { PreHire } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { PreHireForm } from './PreHireForm';
import { FreezePeriodBanner } from './ui/FreezePeriodBanner';
import { usePreHires } from '../contexts/PreHireContext';
import { usePackages } from '../contexts/PackageContext';

interface InputPanelProps {
  editingPreHire: PreHire | null;
  onSavePreHire: (preHire: Partial<PreHire>) => void;
  onCancelEdit: () => void;
  onCreate: () => void;
  triggerFormOpen?: number; // Timestamp to trigger form opening from external button
  onCreatePackage?: () => void;
  onManagePackages?: () => void;
  onViewApprovalQueue?: () => void;
  onViewHelixTickets?: () => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  editingPreHire,
  onSavePreHire,
  onCancelEdit,
  onCreate,
  triggerFormOpen,
  onCreatePackage,
  onManagePackages,
  onViewApprovalQueue,
  onViewHelixTickets,
  addToast,
}) => {
  const [showForm, setShowForm] = useState(false);

  // Watch for external trigger to open form (from OutputPanel button)
  useEffect(() => {
    if (triggerFormOpen) {
      setShowForm(true);
    }
  }, [triggerFormOpen]);

  // Get data from contexts
  const { preHires } = usePreHires();
  const { packages } = usePackages();

  // Calculate statistics dynamically
  const statistics = useMemo(() => {
    // Helper: Check if date is in freeze period (Nov 1 - Jan 5)
    const isInFreezePeriod = (date: Date): boolean => {
      const startDate = new Date(date);
      const month = startDate.getMonth(); // 0-indexed: Nov=10, Dec=11, Jan=0
      const day = startDate.getDate();
      // Nov, Dec, or Jan 1-5
      return month === 10 || month === 11 || (month === 0 && day <= 5);
    };

    return {
      totalPreHires: preHires.length,
      acceptedPreHires: preHires.filter(ph => ph.status === 'accepted').length,
      freezePeriodPreHires: preHires.filter(ph => isInFreezePeriod(ph.startDate)).length,
      totalPackages: packages.length,
    };
  }, [preHires, packages]);

  const handleSubmit = (preHire: Partial<PreHire>) => {
    onSavePreHire(preHire);
    setShowForm(false);
    addToast(
      editingPreHire
        ? `Pre-hire record for ${preHire.candidateName} updated successfully`
        : `Pre-hire record for ${preHire.candidateName} created successfully`,
      'success'
    );
  };

  const handleCancel = () => {
    setShowForm(false);
    onCancelEdit();
  };

  const handleCreate = () => {
    setShowForm(true);
    onCreate();
  };

  // Show form if editing or creating
  const shouldShowForm = showForm || editingPreHire;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {shouldShowForm
                ? editingPreHire
                  ? 'Edit Pre-hire'
                  : 'Create Pre-hire'
                : 'Pre-hire Management'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {shouldShowForm
                ? 'Fill in candidate information and package assignment'
                : 'Track candidates from offer acceptance through start date'}
            </p>
          </div>
          {!shouldShowForm && (
            <Button
              variant="primary"
              onClick={handleCreate}
              className="text-sm"
            >
              <Icon name="add" className="w-4 h-4 mr-2" />
              Create Pre-hire
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {shouldShowForm ? (
          /* Show Pre-hire Form */
          <PreHireForm
            preHire={editingPreHire || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          /* Show Dashboard/Overview */
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Pre-hires
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {statistics.totalPreHires}
                    </p>
                  </div>
                  <Icon
                    name="users"
                    className="w-10 h-10 text-primary-600 dark:text-primary-400 opacity-75"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Accepted
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {statistics.acceptedPreHires}
                    </p>
                  </div>
                  <Icon
                    name="check-circle"
                    className="w-10 h-10 text-green-600 dark:text-green-400 opacity-75"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Freeze Period
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                      {statistics.freezePeriodPreHires}
                    </p>
                  </div>
                  <Icon
                    name="snowflake"
                    className="w-10 h-10 text-orange-600 dark:text-orange-400 opacity-75"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Packages
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {statistics.totalPackages}
                    </p>
                  </div>
                  <Icon
                    name="package"
                    className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-75"
                  />
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleCreate}
                    className="flex items-start gap-4 p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <Icon
                      name="add"
                      className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        Create New Pre-hire
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add a new candidate to the onboarding pipeline with equipment package assignment
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={onCreatePackage || (() => addToast('Package management not configured', 'error'))}
                    className="flex items-start gap-4 p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <Icon
                      name="package"
                      className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        Create Equipment Package
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Build a new package template for specific roles and departments
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={onManagePackages || (() => addToast('Package management not configured', 'error'))}
                    className="flex items-start gap-4 p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <Icon
                      name="grid"
                      className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        Manage Packages
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Browse, view, edit, and assign equipment packages
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={onViewApprovalQueue}
                    className="flex items-start gap-4 p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <Icon
                      name="check"
                      className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        View Approval Queue
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Review and approve exception equipment and software requests
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => addToast('Coming soon in Phase 4E!', 'success')}
                    className="flex items-start gap-4 p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <Icon
                      name="snowflake"
                      className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        Freeze Period Dashboard
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage accounts needing password reset or termination during freeze period
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
