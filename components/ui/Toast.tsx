import React, { useState, useEffect } from 'react';
import { Icon } from './Icon.tsx';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300); // match animation duration
        }, 3700);

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    }

    const typeStyles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
    };

    const iconName = type === 'success' ? 'logo' : 'error';

  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-lg text-white ${typeStyles[type]} ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      role="alert"
    >
      <Icon name={iconName} className="h-5 w-5 mr-3"/>
      <div className="text-sm font-medium">{message}</div>
      <button onClick={handleClose} className="ml-4 -mr-2 p-1.5 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Close notification">
        <Icon name="close" className="h-4 w-4" />
      </button>
    </div>
  );
};