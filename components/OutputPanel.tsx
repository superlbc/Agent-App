import React from 'react';
import { PreHire } from '../types';
import { PreHireList } from './PreHireList';
import { PreHireDashboard } from './PreHireDashboard';

interface OutputPanelProps {
  preHires: PreHire[];
  onEdit: (preHire: PreHire) => void;
  onDelete: (preHire: PreHire) => void;
  onView: (preHire: PreHire) => void;
  onAssignPackage: (preHire: PreHire) => void;
  onCreate: () => void;
  loading?: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  preHires,
  onEdit,
  onDelete,
  onView,
  onAssignPackage,
  onCreate,
  loading = false,
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Compact Dashboard - Sticky Header */}
      <PreHireDashboard preHires={preHires} onCreate={onCreate} loading={loading} />

      {/* Pre-hire List - Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <PreHireList
          preHires={preHires}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onAssignPackage={onAssignPackage}
          onCreate={onCreate}
          loading={loading}
        />
      </div>
    </div>
  );
};
