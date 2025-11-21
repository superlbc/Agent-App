
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'getting-started' | 'features' | 'tips';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('getting-started');

  if (!isOpen) return null;

  const tabs = [
    { id: 'getting-started' as Tab, label: '🚀 Getting Started', icon: 'sparkles' },
    { id: 'features' as Tab, label: '⚙️ Features', icon: 'settings' },
    { id: 'tips' as Tab, label: '💡 Tips & Shortcuts', icon: 'info' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <Card className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
          <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Guidance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Everything you need to know about the Meeting Notes Generator
                </p>
              </div>
              <button
                onClick={onClose}
                className="-mt-2 -mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                aria-label="Close help"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="flex space-x-1" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {activeTab === 'getting-started' && <GettingStartedTab />}
              {activeTab === 'features' && <FeaturesTab />}
              {activeTab === 'tips' && <TipsTab />}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need more help? Use the{' '}
                <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Feedback
                </button>{' '}
                button to ask questions or report issues
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Getting Started Tab Content
const GettingStartedTab: React.FC = () => (
  <div className="space-y-6 text-sm">
    {/* Quick Start */}
    <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        🎯 Quick Start in 3 Steps
      </h3>
      <ol className="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
        <li className="pl-2">
          <strong>Paste your meeting details</strong>
          <p className="ml-6 mt-1 text-gray-600 dark:text-gray-400">
            Add meeting title, agenda items (one per line), and raw transcript
          </p>
        </li>
        <li className="pl-2">
          <strong>Choose a preset or customize settings</strong>
          <p className="ml-6 mt-1 text-gray-600 dark:text-gray-400">
            Select from Client Update, Internal Sync, Brainstorm, or Executive Briefing
          </p>
        </li>
        <li className="pl-2">
          <strong>Generate and export your notes</strong>
          <p className="ml-6 mt-1 text-gray-600 dark:text-gray-400">
            Click "Generate Notes" and export to PDF, CSV, or copy to clipboard
          </p>
        </li>
      </ol>
      <div className="mt-4 flex gap-2">
        <button className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
          Try Sample Data
        </button>
      </div>
    </section>

    {/* Input Your Meeting Data */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-blue-500" />
        Input Your Meeting Data
      </h3>

      <div className="space-y-4">
        {/* Meeting Title */}
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">📋 Meeting Title</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Keep it concise and descriptive
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
            Example: "Weekly Team Sync - Jan 15" or "Q1 Planning Session"
          </p>
        </div>

        {/* Agenda */}
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">📝 Agenda</h4>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Enter one topic per line</li>
            <li>• Order matters - topics analyzed in sequence</li>
            <li>• Be specific for better results</li>
          </ul>
          <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono">
            <div>Project status update</div>
            <div>Q1 planning discussion</div>
            <div>Action items review</div>
          </div>
        </div>

        {/* Transcript */}
        <div className="border-l-4 border-purple-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">💬 Transcript</h4>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Paste raw, unedited transcript for best results</li>
            <li>• AI handles conversational text automatically</li>
            <li>• Supports drag-and-drop for .txt and .docx files</li>
            <li>• Speaker labels help but aren't required</li>
            <li>• Longer transcripts = better quality notes</li>
          </ul>
        </div>

        {/* Context Tags */}
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">🏷️ Context Tags</h4>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Client facing:</span> External stakeholder meetings
            </div>
            <div>
              <span className="font-medium">Internal only:</span> Internal team discussions
            </div>
            <div>
              <span className="font-medium">Sensitive:</span> Confidential information
            </div>
            <div>
              <span className="font-medium">Executive review:</span> For leadership review
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Understanding the Output */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-green-500" />
        Understanding the Output
      </h3>
      <div className="space-y-2 text-gray-600 dark:text-gray-400">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <div>
            <strong>Narrative Summary:</strong> Organized discussion points by agenda item
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          <div>
            <strong>Next Steps Table:</strong> Action items with owners, due dates, and status
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-purple-500 font-bold">•</span>
          <div>
            <strong>Meeting Coach:</strong> Quality metrics and improvement suggestions
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-500 font-bold">•</span>
          <div>
            <strong>Critical Lens:</strong> Gap analysis and risk identification (if enabled)
          </div>
        </div>
      </div>
    </section>
  </div>
);

// Features Tab Content
const FeaturesTab: React.FC = () => (
  <div className="space-y-6 text-sm">
    {/* Meeting Presets */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-blue-500" />
        ⚡ Meeting Presets
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-3">
        Quick configurations for common meeting types
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🤝 Client Update</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Professional tone, redaction enabled, gentle coaching
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">💼 Internal Sync</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Balanced tone, critical lens, direct coaching
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">💡 Brainstorm</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Concise format, captures all ideas, bold keywords
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📊 Executive Briefing</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            High-level summary, sensitive tag, redaction
          </p>
        </div>
      </div>
    </section>

    {/* Core Controls */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="settings" className="h-5 w-5 text-gray-500" />
        🎛️ Core Controls
      </h3>
      <div className="space-y-3">
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium mb-1">📂 Department Focus</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Guide AI to focus on specific department topics. Select multiple for cross-functional meetings.
          </p>
        </div>
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium mb-1">👁️ View Mode</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            <strong>Full:</strong> Complete notes with summary + actions <br />
            <strong>Actions Only:</strong> Just the next steps table
          </p>
        </div>
        <div className="border-l-4 border-red-400 pl-4">
          <h4 className="font-medium mb-1">🔍 Critical Lens</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Analyzes gaps, risks, and unassigned actions. Provides constructive meeting effectiveness feedback.
          </p>
        </div>
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium mb-1">🔒 Redaction</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Automatically masks emails and phone numbers for sensitive documents.
          </p>
        </div>
      </div>
    </section>

    {/* Export Features */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="upload" className="h-5 w-5 text-green-500" />
        📤 Export Options
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Icon name="copy" className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <div className="font-medium">Copy to Clipboard</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Rich text format, ready to paste</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="pdf" className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-medium">PDF Export</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Professional document format</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="csv" className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <div className="font-medium">CSV Download</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Import actions to project tools</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="email" className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <div className="font-medium">Email Draft</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pre-formatted email template</p>
          </div>
        </div>
      </div>
    </section>

    {/* Advanced Features */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-purple-500" />
        🔬 Advanced Features
      </h3>
      <div className="space-y-3">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1 flex items-center gap-2">
            <Icon name="interrogate" className="h-4 w-4" />
            Interrogate Transcript
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
            Ask questions about your meeting and get AI-powered answers
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• "What decisions were made?"</li>
            <li>• "Who owns each action item?"</li>
            <li>• "What is the top priority?"</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">🎓 Meeting Coach</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Get intelligent feedback on meeting effectiveness with metrics on agenda coverage, decisions made, action items, and participation balance.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">🌍 Language Support</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Available in English, Spanish, and Japanese. Auto-detects your browser language.
          </p>
        </div>
      </div>
    </section>
  </div>
);

// Tips Tab Content
const TipsTab: React.FC = () => (
  <div className="space-y-6 text-sm">
    {/* Best Practices */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-amber-500" />
        💡 Pro Tips
      </h3>

      <div className="space-y-4">
        {/* DO's */}
        <div>
          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            ✅ Best Practices
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Use complete sentences in agenda for clarity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Include speaker names in transcript when possible
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Select relevant department focus for better results
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Review and edit generated notes before sharing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Enable Critical Lens for important meetings
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Use Meeting Coach to improve future meetings
            </li>
          </ul>
        </div>

        {/* DON'Ts */}
        <div>
          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            ❌ Common Mistakes to Avoid
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't submit meetings without transcripts
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't use unexplained acronyms (first time)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't forget to select appropriate preset
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't skip reviewing notes before exporting
            </li>
          </ul>
        </div>

        {/* Quality Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 For Best Quality Results
          </h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
            <li>📝 Longer transcripts = better quality notes</li>
            <li>⚡ Use meeting presets to save time</li>
            <li>🔍 Enable Critical Lens for strategic meetings</li>
            <li>📄 Export to PDF for formal documentation</li>
            <li>💬 Use Interrogate to extract specific details</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Keyboard Shortcuts */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="info" className="h-5 w-5 text-gray-500" />
        ⌨️ Keyboard Shortcuts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Generate Notes</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + G
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Clear Form</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + K
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Open File Upload</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + O
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Open Help</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + H
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Copy to Clipboard</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + C
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Export PDF</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + P
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Download CSV</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + S
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Interrogate Transcript</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + I
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Close Modal</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Esc
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Open Settings</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + ,
          </kbd>
        </div>
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="text-gray-700 dark:text-gray-300">Replay Tour</span>
          <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
            Alt + T
          </kbd>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
        Note: These shortcuts use the Alt key to avoid conflicts with browser defaults. Shortcuts won't work while typing in text fields.
      </p>
    </section>

    {/* Sample Use Cases */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-green-500" />
        📚 Sample Use Cases
      </h3>
      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">Weekly Team Standup</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Preset:</strong> Internal Sync | <strong>View:</strong> Actions Only
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Perfect for quick status updates focused on action items
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">Client Presentation Review</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Preset:</strong> Client Update | <strong>Tags:</strong> Client facing, Sensitive
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Professional output with automatic redaction for external sharing
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">Strategic Planning Session</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Preset:</strong> Executive Briefing | <strong>Lens:</strong> Critical | <strong>Coach:</strong> Enabled
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Comprehensive analysis with gap identification and improvement suggestions
          </p>
        </div>
      </div>
    </section>

    {/* Quick Reference */}
    <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">🚀 Quick Reference</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="font-medium mb-1">For Quick Meetings:</div>
          <div className="text-gray-600 dark:text-gray-400">Use Actions Only view + Internal Sync preset</div>
        </div>
        <div>
          <div className="font-medium mb-1">For Client Meetings:</div>
          <div className="text-gray-600 dark:text-gray-400">Use Client Update preset + Enable redaction</div>
        </div>
        <div>
          <div className="font-medium mb-1">For Strategic Sessions:</div>
          <div className="text-gray-600 dark:text-gray-400">Enable Critical Lens + Meeting Coach</div>
        </div>
        <div>
          <div className="font-medium mb-1">For Brainstorms:</div>
          <div className="text-gray-600 dark:text-gray-400">Use Brainstorm preset + Bold keywords</div>
        </div>
      </div>
    </section>
  </div>
);
