/**
 * EventViewSelector - View Toggle Component
 *
 * Provides toggle buttons to switch between Calendar | Map | List views
 * Persists selection to localStorage
 */

import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';

export type EventView = 'calendar' | 'map' | 'list';

interface EventViewSelectorProps {
  currentView: EventView;
  onViewChange: (view: EventView) => void;
  className?: string;
}

const EventViewSelector: React.FC<EventViewSelectorProps> = ({ currentView, onViewChange, className = '' }) => {
  const views: { value: EventView; label: string; icon: string }[] = [
    { value: 'calendar', label: 'Calendar', icon: 'calendar' },
    { value: 'map', label: 'Map', icon: 'location' },
    { value: 'list', label: 'List', icon: 'list-bullets' },
  ];

  const handleViewChange = (view: EventView) => {
    onViewChange(view);
    // Persist to localStorage
    localStorage.setItem('uxp_event_view', view);
  };

  return (
    <div className={`inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`} role="group">
      {views.map((view) => {
        const isActive = currentView === view.value;
        return (
          <button
            key={view.value}
            onClick={() => handleViewChange(view.value)}
            className={`
              inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all
              ${
                isActive
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
            aria-pressed={isActive}
            aria-label={`Switch to ${view.label} view`}
          >
            <Icon name={view.icon} className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            <span>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EventViewSelector;

/**
 * Hook to manage event view state with localStorage persistence
 */
export function useEventView(defaultView: EventView = 'calendar'): [EventView, (view: EventView) => void] {
  const [view, setView] = useState<EventView>(() => {
    // Load from localStorage on mount
    const savedView = localStorage.getItem('uxp_event_view');
    return (savedView as EventView) || defaultView;
  });

  return [view, setView];
}
