import React from 'react';
import { Tooltip } from './Tooltip.tsx';
import { Icon } from './Icon.tsx';

interface ToggleSwitchProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tooltip?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, id, checked, onChange, tooltip }) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <button
          type="button"
          id={id}
          className={`${
            checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
          } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-offset-slate-900`}
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
        >
          <span
            aria-hidden="true"
            className={`${
              checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
          />
        </button>
      </div>
      <div className="ml-3 text-sm">
        <div className="flex items-center">
            <label htmlFor={id} className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => onChange(!checked)}>
              {label}
            </label>
            {tooltip && (
                <Tooltip content={tooltip}>
                    <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                </Tooltip>
            )}
        </div>
      </div>
    </div>
  );
};