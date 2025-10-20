import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex space-x-2">
        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
       <div className="space-y-3 pt-4">
        <div className="h-5 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
         <div className="h-24 w-full bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
      {/* New skeleton for coach panel */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-5 gap-4 pt-4">
             <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
             <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
             <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
             <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
             <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};