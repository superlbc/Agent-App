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
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  preHires,
  onEdit,
  onDelete,
  onView,
  onAssignPackage,
  onCreate,
}) => {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Dashboard Overview */}
        <PreHireDashboard preHires={preHires} />

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

        {/* Pre-hire List */}
        <PreHireList
          preHires={preHires}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onAssignPackage={onAssignPackage}
          onCreate={onCreate}
        />
      </div>
    </div>
  );
};
