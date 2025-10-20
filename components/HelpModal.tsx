
import React from 'react';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Help & Guidance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tips for getting the best results.</p>
            </div>
            <button
              onClick={onClose}
              className="-mt-2 -mr-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close help"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-6 space-y-6 text-sm">
            <section>
              <h3 className="font-semibold mb-2">How to Paste Inputs</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li><strong>Meeting Title:</strong> Keep it concise and descriptive.</li>
                <li><strong>Agenda:</strong> Enter one main topic or workstream per line. The order matters.</li>
                <li><strong>Transcript:</strong> Paste the raw, unedited transcript for best results. The agent can handle conversational text.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">Understanding the Controls</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li><strong>Department Focus:</strong> Nudges the agent to pay closer attention to topics relevant to the selected department.</li>
                <li><strong>Actions Only View:</strong> Hides the narrative summary and discussion points, showing only the "Next Steps" table.</li>
                <li><strong>Critical Lens:</strong> Adds a special section analyzing potential gaps, risks, and unassigned action items.</li>
                <li><strong>Redaction:</strong> Automatically masks personal information like emails and phone numbers.</li>
              </ul>
            </section>
            
            <p className="text-center text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
              For more detailed information, please refer to the <a href="#" className="text-primary hover:underline">internal guidance document</a>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
