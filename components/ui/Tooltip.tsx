import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in milliseconds before showing tooltip
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-sm px-3 py-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-md shadow-lg z-[9999] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        role="tooltip"
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-900"></div>
      </div>
    </div>
  );
};
