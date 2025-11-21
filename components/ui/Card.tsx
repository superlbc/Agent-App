
import React from 'react';

// FIX: Updated CardProps to extend React.HTMLAttributes<HTMLDivElement> which includes the 'id' property and other standard attributes.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// FIX: The component now accepts and spreads any additional props (...props) to the underlying div element. This passes down attributes like 'id' and 'onClick'.
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
