
import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ children, selected, onClick, className }) => {
  const baseStyles = 'px-3 py-1 text-xs font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const selectedStyles = 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300';
  const unselectedStyles = 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';

  // If custom className is provided, use it; otherwise use selected/unselected styles
  const styles = className
    ? `${baseStyles} ${className}`
    : `${baseStyles} ${selected ? selectedStyles : unselectedStyles}`;

  // Only make it a button if onClick is provided
  const isInteractive = !!onClick;

  return isInteractive ? (
    <button
      type="button"
      className={`${styles} cursor-pointer`}
      onClick={onClick}
    >
      {children}
    </button>
  ) : (
    <span className={styles}>
      {children}
    </span>
  );
};
