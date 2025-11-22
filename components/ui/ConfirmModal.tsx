// ============================================================================
// CONFIRM MODAL COMPONENT
// ============================================================================
// Reusable confirmation dialog for destructive or important actions
// Replaces browser confirm() popups with a proper modal UI

import React from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmButtonVariant?: 'danger' | 'primary' | 'secondary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  confirmButtonVariant,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Determine icon and colors based on variant
  const variantConfig = {
    danger: {
      icon: 'alert-triangle' as const,
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: 'alert-circle' as const,
      iconBg: 'bg-amber-100 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: 'info' as const,
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];
  const finalButtonVariant = confirmButtonVariant || config.buttonVariant;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        onKeyDown={handleKeyDown}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
              <Icon name={config.icon} className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="flex-1 pt-1">
              <h3
                id="confirm-modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Message */}
          <div className="pl-16">
            <p
              id="confirm-modal-description"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={finalButtonVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              autoFocus
            >
              {isLoading ? (
                <>
                  <Icon name="refresh" className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Delete confirmation (danger variant):
 *
 * const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 *
 * <ConfirmModal
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={() => handleDelete(item)}
 *   title="Delete Item?"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 * />
 */

/**
 * Bulk action confirmation (warning variant):
 *
 * <ConfirmModal
 *   isOpen={showBulkConfirm}
 *   onClose={() => setShowBulkConfirm(false)}
 *   onConfirm={() => handleBulkAction()}
 *   title="Update Multiple Items?"
 *   message={`Are you sure you want to update ${count} items?`}
 *   confirmText="Update All"
 *   variant="warning"
 * />
 */

/**
 * General confirmation (info variant):
 *
 * <ConfirmModal
 *   isOpen={showResetConfirm}
 *   onClose={() => setShowResetConfirm(false)}
 *   onConfirm={() => handleReset()}
 *   title="Reset Settings?"
 *   message="This will reset all settings to their default values."
 *   confirmText="Reset"
 *   variant="info"
 * />
 */
