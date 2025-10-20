
import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

export const Chip: React.FC<ChipProps> = ({ children, selected, onClick }) => {
  const baseStyles = 'px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const selectedStyles = 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300';
  const unselectedStyles = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600';

  return (
    <button
      type="button"
      className={`${baseStyles} ${selected ? selectedStyles : unselectedStyles}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
