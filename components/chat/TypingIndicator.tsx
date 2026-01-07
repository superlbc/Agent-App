import React from 'react';
import { Icon } from '../ui/Icon';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 justify-start mb-4">
      {/* Robot Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Icon name="robot" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
      </div>

      {/* Typing Animation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
