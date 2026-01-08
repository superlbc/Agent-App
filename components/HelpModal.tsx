
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
                  Everything you need to know about Momentum Knowledge Assistant
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
                Need more help? Contact IT support or use the{' '}
                <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Feedback
                </button>{' '}
                button to report issues
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
        🎯 System Overview
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-3">
        Momentum Knowledge Assistant is an AI-powered knowledge base that helps Momentum employees
        access information through natural conversation with Microsoft Copilot Studio integration.
      </p>
      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Multi-Tab Conversations:</strong> Organize your questions across multiple conversation tabs
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Department-Based Access:</strong> Get relevant information based on your role and department
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Adaptive Card Responses:</strong> Rich, interactive responses from the AI assistant
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Persistent Conversations:</strong> Your chat history is saved and synced across sessions
        </div>
      </div>
    </section>

    {/* How to Get Started */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-green-500" />
        How to Get Started
      </h3>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">1️⃣ Sign In</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Authenticate with your Momentum account through Azure Active Directory.
            You must be a member of the "MOM WW All Users 1 SG" group to access the app.
          </p>
        </div>

        {/* Step 2 */}
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">2️⃣ Department Detection</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Your department is automatically detected from personnel data (962 Momentum users).
            This ensures SharePoint content is filtered to show only what's relevant to your role.
          </p>
        </div>

        {/* Step 3 */}
        <div className="border-l-4 border-purple-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">3️⃣ Start Asking Questions</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Type your questions in the chat interface using natural language.
            The AI assistant will search SharePoint documents and provide relevant answers.
          </p>
        </div>

        {/* Step 4 */}
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">4️⃣ Organize with Tabs</h4>
          <p className="text-gray-600 dark:text-gray-400">
            Create multiple chat tabs to organize different topics or projects.
            Each tab maintains its own conversation history and context.
          </p>
        </div>
      </div>
    </section>

    {/* Key Systems */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-green-500" />
        Key System Integrations
      </h3>
      <div className="space-y-2 text-gray-600 dark:text-gray-400">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <div>
            <strong>Microsoft Copilot Studio:</strong> AI agent powering natural language Q&A with Direct Line API integration
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          <div>
            <strong>SharePoint:</strong> Document repository with department-based content filtering (962 users)
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-purple-500 font-bold">•</span>
          <div>
            <strong>Azure Active Directory:</strong> Authentication, group membership (MOM WW All Users 1 SG), and user profiles
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-500 font-bold">•</span>
          <div>
            <strong>Power Automate:</strong> Personnel data lookup with 24-hour caching and circuit breaker resilience
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-red-500 font-bold">•</span>
          <div>
            <strong>Microsoft Graph API:</strong> Fallback department lookup when Power Automate is unavailable
          </div>
        </div>
      </div>
    </section>
  </div>
);

// Features Tab Content
const FeaturesTab: React.FC = () => (
  <div className="space-y-6 text-sm">
    {/* Core Features */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-blue-500" />
        ⚡ Core Features
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-3">
        AI-powered knowledge access with natural conversation
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🤖 AI-Powered Q&A</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Ask questions in natural language and get answers from Microsoft Copilot Studio integrated with SharePoint
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📑 Multi-Tab Conversations</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Organize different topics across multiple chat tabs with independent conversation histories
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🎯 Department Filtering</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            SharePoint content automatically filtered based on your department for relevant results
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🎴 Adaptive Cards</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Rich, interactive responses with buttons, images, and formatted content from the AI
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">⚡ Smart Caching</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            24-hour personnel data cache (962 users) with circuit breaker for fast, resilient performance
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🌙 Dark Mode</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Automatic theme switching based on your browser preference for comfortable reading
          </p>
        </div>
      </div>
    </section>

    {/* How to Ask Effective Questions */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="settings" className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        💬 How to Ask Effective Questions
      </h3>
      <div className="space-y-3">
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium mb-1">🎯 Be Specific</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            "What is the PTO policy?" is better than "Tell me about time off". Specific questions get specific answers.
          </p>
        </div>
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium mb-1">📝 Provide Context</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            "I'm in the Creative department, what design tools do I have access to?" helps the AI understand your needs.
          </p>
        </div>
        <div className="border-l-4 border-purple-400 pl-4">
          <h4 className="font-medium mb-1">🔄 Ask Follow-ups</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Continue the conversation! Ask clarifying questions or dive deeper into topics for better understanding.
          </p>
        </div>
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium mb-1">💬 Use Natural Language</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Talk to the AI as you would a colleague. No need for special commands or formal syntax.
          </p>
        </div>
      </div>
    </section>

    {/* Department-Based Access */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="upload" className="h-5 w-5 text-green-500" />
        🏢 Department-Based Access
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Icon name="settings" className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <div className="font-medium">Automatic Detection</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Department pulled from personnel data (962 Momentum users)</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="document" className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <div className="font-medium">SharePoint Filtering</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Only see content relevant to your role and department</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="sparkles" className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <div className="font-medium">24-Hour Caching</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Fast lookups with 5-minute circuit breaker for resilience</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="info" className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <div className="font-medium">Fallback Mechanism</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Graph API fallback when Power Automate unavailable</p>
          </div>
        </div>
      </div>
    </section>

    {/* Conversation Management */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-purple-500" />
        💬 Conversation Management
      </h3>
      <div className="space-y-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1 flex items-center gap-2">
            <Icon name="upload" className="h-4 w-4" />
            Create Tabs
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
            Organize different topics or projects across unlimited chat tabs
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Click the "+" button to create a new tab</li>
            <li>• Each tab has independent conversation history</li>
            <li>• Switch between tabs instantly</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">✏️ Rename & Organize</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Give your tabs meaningful names like "Benefits Questions" or "IT Support" to stay organized and find conversations quickly.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">💾 Persistent History</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            All conversations are saved automatically. Come back anytime and your chat history will be waiting for you.
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
        💡 Best Practices
      </h3>

      <div className="space-y-4">
        {/* DO's */}
        <div>
          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            ✅ DO: Effective Knowledge Search
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Ask specific questions about Momentum policies, processes, or resources
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Use natural language as you would when talking to a colleague
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Create separate tabs for different topics to keep conversations organized
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Provide context about your department or role when asking department-specific questions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Ask follow-up questions to clarify answers or dive deeper into topics
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Reference specific documents or policies if you know their names
            </li>
          </ul>
        </div>

        {/* DON'Ts */}
        <div>
          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            ❌ DON'T: Limitations to Keep in Mind
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't share sensitive personal information, passwords, or confidential data in chats
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't expect the AI to access real-time system data or external tools
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't ask about confidential employee records, client data, or financial information
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't expect information outside Momentum's SharePoint knowledge base
            </li>
          </ul>
        </div>

        {/* Quality Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 Tips for Better Results
          </h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
            <li>📝 Start broad, then narrow down with follow-up questions</li>
            <li>🏢 Mention your department for role-specific information</li>
            <li>💬 Ask "Can you provide more details?" if answers are too high-level</li>
            <li>📑 Use tabs to separate topics like "HR Policies", "IT Resources", etc.</li>
            <li>🔄 Rephrase your question if the answer isn't what you expected</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Common Use Cases */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="info" className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        📋 Common Use Cases
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📄 Policy Questions</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Ask about HR policies, benefits, time off, expense reporting
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 italic">
            "What is the remote work policy?" or "How do I request PTO?"
          </p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🔄 Process Guidance</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Learn how to complete common workflows and procedures
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 italic">
            "How do I submit an expense report?" or "What's the client onboarding process?"
          </p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📍 Resource Location</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Find templates, guidelines, contacts, and tools
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 italic">
            "Where can I find brand guidelines?" or "Who do I contact for IT support?"
          </p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🏢 Department Information</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Get role-specific tools, processes, and deliverables
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 italic">
            "What tools does the Creative team use?" or "What are Strategy deliverables?"
          </p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📚 Training Materials</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Access onboarding guides, methodology docs, skill development
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 italic">
            "Where is the new hire training?" or "How do I learn about our methodology?"
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🔧 Technical Support</div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Find IT documentation, troubleshooting guides, software access
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            "How do I reset my VPN password?" or "What software does my role include?"
          </p>
        </div>
      </div>
    </section>

    {/* Example Questions */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-green-500" />
        💬 Example Questions
      </h3>
      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">🌐 General Information</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Example:</strong> "What employee benefits does Momentum offer?"
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Get high-level overviews of company-wide policies, benefits, and resources available to all employees.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">🎨 Department-Specific</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Example:</strong> "As a Creative, what design tools do I have access to?"
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Include your department in the question to get role-specific software, tools, and resources filtered to your needs.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">📍 Location & Facilities</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Example:</strong> "How do I book a conference room at the NYC office?"
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Find information about office locations, room bookings, parking, building access, and facilities.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">📄 Templates & Documents</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Example:</strong> "Where can I find client presentation templates?"
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Locate templates, brand assets, document guidelines, and standardized formats for client deliverables.
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">👥 Contacts & Teams</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Example:</strong> "Who should I contact about payroll questions?"
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Find the right people or teams to contact for specific issues, from HR to IT to department leads.
          </p>
        </div>
      </div>
    </section>

    {/* Quick Reference */}
    <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">🚀 Quick Reference</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="font-medium mb-1">Data Source:</div>
          <div className="text-gray-600 dark:text-gray-400">962 Momentum employees from Power Automate flow</div>
        </div>
        <div>
          <div className="font-medium mb-1">Cache Duration:</div>
          <div className="text-gray-600 dark:text-gray-400">24 hours for personnel data with circuit breaker</div>
        </div>
        <div>
          <div className="font-medium mb-1">Access Control:</div>
          <div className="text-gray-600 dark:text-gray-400">MOM WW All Users 1 SG group (886 members)</div>
        </div>
        <div>
          <div className="font-medium mb-1">Support:</div>
          <div className="text-gray-600 dark:text-gray-400">Contact IT for access issues or technical problems</div>
        </div>
      </div>
    </section>
  </div>
);
