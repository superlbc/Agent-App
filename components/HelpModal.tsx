
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
                  Everything you need to know about the Employee Onboarding System
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
        🎯 System Overview
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-3">
        The Employee Onboarding System streamlines the complete onboarding lifecycle from pre-hire candidate tracking
        through equipment provisioning and system access setup.
      </p>
      <div className="space-y-2 text-gray-700 dark:text-gray-300">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Pre-hire Management:</strong> Track candidates from offer acceptance through start date
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Equipment Packages:</strong> Automate hardware and software assignment based on role
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Approval Workflow:</strong> Standard packages auto-approve, exceptions route to SVP
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-500 font-bold">•</span>
          <strong>Freeze Period Handling:</strong> Automate Nov-Jan 5 Workday freeze with password reset emails
        </div>
      </div>
    </section>

    {/* Onboarding Workflow */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-blue-500" />
        Onboarding Process Flow
      </h3>

      <div className="space-y-4">
        {/* Phase 1 */}
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">📋 Phase 1: Pre-hire Setup</h4>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Create pre-hire record with candidate details</li>
            <li>• Assign equipment package based on role (e.g., "XD Designer Standard")</li>
            <li>• Customize packages during negotiations if needed</li>
            <li>• Track start date and hiring manager</li>
          </ul>
        </div>

        {/* Phase 2 */}
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">🔑 Phase 2: System Access</h4>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Workday record created (Nov onwards)</li>
            <li>• Active Directory account provisioned</li>
            <li>• Vantage record created manually by Laurie Walker</li>
            <li>• During freeze period: Users pre-loaded with scrubbed passwords</li>
          </ul>
        </div>

        {/* Phase 3 */}
        <div className="border-l-4 border-purple-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">📦 Phase 3: Equipment Provisioning</h4>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Standard packages: Auto-approve → Helix ticket</li>
            <li>• Exception requests: Route to SVP (Patricia/Steve) for approval</li>
            <li>• IT provisions equipment via Weenus</li>
            <li>• Employee receives equipment before start date</li>
          </ul>
        </div>

        {/* Freeze Period */}
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">❄️ Freeze Period (Nov - Jan 5)</h4>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">Start Date:</span> HR sends password reset email to IT
            </div>
            <div>
              <span className="font-medium">End Date:</span> HR sends account deactivation email to IT
            </div>
            <div>
              <span className="font-medium">Automation:</span> System monitors dates and generates emails
            </div>
          </div>
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
            <strong>Workday:</strong> HR system of record (starts Nov, with freeze period Nov-Jan 5)
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-bold">•</span>
          <div>
            <strong>Active Directory:</strong> User authentication and access control
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-purple-500 font-bold">•</span>
          <div>
            <strong>Helix:</strong> IT ticketing and approval system (contact: Chris Kumar)
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-500 font-bold">•</span>
          <div>
            <strong>Weenus:</strong> IT request system for equipment and software
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-red-500 font-bold">•</span>
          <div>
            <strong>Vantage:</strong> Internal employee records (manual entry by Laurie Walker)
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
        Comprehensive onboarding management tools
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📋 Pre-hire Tracking</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Track candidates from offer acceptance through start date with package assignment
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">📦 Equipment Packages</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Role-based packages with hardware, software, and licenses (e.g., "XD Designer Standard")
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">✅ Approval Workflow</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Standard packages auto-approve, exceptions route to SVP via Helix
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">❄️ Freeze Period Admin</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Automate Nov-Jan 5 Workday freeze with password reset and termination emails
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🖥️ Hardware Inventory</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Manage computers, monitors, keyboards, and accessories with status tracking
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="font-medium text-gray-900 dark:text-white mb-1">🔑 License Pool Management</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Track software licenses, assignments, and renewals with utilization monitoring
          </p>
        </div>
      </div>
    </section>

    {/* Package Management */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="settings" className="h-5 w-5 text-gray-500" />
        📦 Package Management
      </h3>
      <div className="space-y-3">
        <div className="border-l-4 border-blue-400 pl-4">
          <h4 className="font-medium mb-1">🎯 Role-Based Assignment</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Packages automatically recommended based on role and department (e.g., "XD Designer Standard Package")
          </p>
        </div>
        <div className="border-l-4 border-green-400 pl-4">
          <h4 className="font-medium mb-1">🔧 Package Builder</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Create custom packages with hardware (computers, monitors), software (Adobe CC, Cinema 4D), and licenses
          </p>
        </div>
        <div className="border-l-4 border-purple-400 pl-4">
          <h4 className="font-medium mb-1">✅ Approval Types</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            <strong>Standard:</strong> Auto-approve → Direct to IT <br />
            <strong>Exception:</strong> Route to SVP (Patricia/Steve) via Helix
          </p>
        </div>
        <div className="border-l-4 border-amber-400 pl-4">
          <h4 className="font-medium mb-1">🔄 Customization Support</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Modify packages during candidate negotiations with audit trail of changes
          </p>
        </div>
      </div>
    </section>

    {/* Freeze Period Features */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="upload" className="h-5 w-5 text-green-500" />
        ❄️ Freeze Period Administration
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Icon name="settings" className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <div className="font-medium">Configurable Periods</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Define custom freeze periods with date ranges</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="email" className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <div className="font-medium">Email Templates</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Customize password reset and termination emails</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="sparkles" className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <div className="font-medium">Automated Notifications</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Auto-generate emails based on start/end dates</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Icon name="document" className="h-5 w-5 text-purple-500 mt-0.5" />
          <div>
            <div className="font-medium">Dashboard Monitoring</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Track affected employees and pending actions</p>
          </div>
        </div>
      </div>
    </section>

    {/* Data Management */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="sparkles" className="h-5 w-5 text-purple-500" />
        📊 Data Management
      </h3>
      <div className="space-y-3">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1 flex items-center gap-2">
            <Icon name="upload" className="h-4 w-4" />
            Bulk Hardware Import
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
            Import hundreds of hardware items via CSV with comprehensive validation
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Download CSV template with sample data</li>
            <li>• Real-time validation preview before import</li>
            <li>• Selective import (skip invalid rows)</li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">🔧 Maintenance Tracking</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Record repairs, upgrades, and service history for all hardware with cost tracking and warranty management.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <h4 className="font-medium mb-1">📈 License Utilization</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Monitor license pool usage with color-coded alerts for capacity, over-allocation, and expiration warnings.
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
            ✅ Onboarding Best Practices
          </h4>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Create pre-hire records as soon as candidate accepts offer
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Assign equipment packages early to allow time for customization
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Link pre-hire records to employee records once Vantage/AD created
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Monitor freeze period dashboard for upcoming start/end dates
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Track hardware status changes (available → assigned → maintenance)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">•</span>
              Document equipment customizations with clear reasons
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
              Don't forget to update pre-hire records during negotiations
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't assign exception packages without SVP approval
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't skip linking pre-hire to employee records
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              Don't miss freeze period email deadlines (start/end dates)
            </li>
          </ul>
        </div>

        {/* Quality Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 For Smooth Onboarding
          </h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-xs">
            <li>📦 Use standard packages whenever possible (auto-approve)</li>
            <li>⚡ Create pre-hire records 2+ weeks before start date</li>
            <li>🔍 Monitor license pool utilization before assigning</li>
            <li>📄 Track all package customizations for audit trail</li>
            <li>💬 Coordinate with IT (Chris Kumar) for Helix approvals</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Key Contacts */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="info" className="h-5 w-5 text-gray-500" />
        👥 Key Stakeholders
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">HR Team</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Camille, Payton:</strong> Pre-hire tracking, start date management, freeze period coordination
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">IT Team</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Equipment provisioning, Helix ticket management, system access setup
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">Laurie Walker</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Vantage Records:</strong> Manual employee record creation and management
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">Chris Kumar (McCarthy)</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Helix Configuration:</strong> IT ticketing and approval system coordination
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">Leadership (Patricia, Steve)</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>SVP Approval:</strong> Exception requests for non-standard equipment/software
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="font-medium text-gray-900 dark:text-white mb-1">Hiring Managers</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Package selection and equipment customization requests
          </p>
        </div>
      </div>
    </section>

    {/* Sample Use Cases */}
    <section>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <Icon name="document" className="h-5 w-5 text-green-500" />
        📚 Common Scenarios
      </h3>
      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">New XD Designer Hire</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Package:</strong> XD Designer Standard | <strong>Approval:</strong> Auto
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            MacBook Pro, 27" monitor, Adobe CC, Figma, Cinema 4D → Auto-approved → Helix ticket
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">Custom Equipment Request</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Package:</strong> Exception (High-End Workstation) | <strong>Approval:</strong> SVP Required
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Non-standard hardware → Routes to Patricia/Steve → Helix ticket after approval
          </p>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-medium mb-1">Freeze Period Start Date (Dec 15)</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Status:</strong> Pre-loaded Account | <strong>Action:</strong> Password Reset Email
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            System auto-generates email to IT → User credentials reset → MFA activated
          </p>
        </div>
      </div>
    </section>

    {/* Quick Reference */}
    <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">🚀 Quick Reference</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="font-medium mb-1">Standard Hires:</div>
          <div className="text-gray-600 dark:text-gray-400">Use pre-defined packages → Auto-approve → Fast provisioning</div>
        </div>
        <div>
          <div className="font-medium mb-1">Executive Hires:</div>
          <div className="text-gray-600 dark:text-gray-400">Exception package → SVP approval → Custom equipment</div>
        </div>
        <div>
          <div className="font-medium mb-1">During Freeze Period:</div>
          <div className="text-gray-600 dark:text-gray-400">Monitor dashboard → Auto-email IT → Track notifications</div>
        </div>
        <div>
          <div className="font-medium mb-1">Hardware Management:</div>
          <div className="text-gray-600 dark:text-gray-400">Track status → Log maintenance → Monitor availability</div>
        </div>
      </div>
    </section>
  </div>
);
