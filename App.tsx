import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { HelpModal } from './components/HelpModal';
import { Toast } from './components/ui/Toast';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { Button } from './components/ui/Button';
import { Icon } from './components/ui/Icon';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ToastState, ApiConfig, PreHire } from './types';
import { TourProvider } from './contexts/TourContext';
import { DepartmentProvider } from './contexts/DepartmentContext';
import { PreHireProvider, usePreHires } from './contexts/PreHireContext';
import { TourController } from './components/tour/TourController';
import { TourWelcomeModal } from './components/tour/TourWelcomeModal';
import { useAuth } from './contexts/AuthContext';
import { telemetryService } from './utils/telemetryService';
import { getBrowserContext } from './utils/browserContext';
import { FeedbackButton } from './components/FeedbackButton';
import { useVersionCheck } from './hooks/useVersionCheck';
import { VersionUpdateBanner } from './components/ui/VersionUpdateBanner';
import { PackageProvider, usePackages } from './contexts/PackageContext';
import { ApprovalProvider, useApprovals } from './contexts/ApprovalContext';
import { PackageAssignmentModal } from './components/PackageAssignmentModal';
import { PackageBuilder } from './components/PackageBuilder';
import { PackageDetailView } from './components/PackageDetailView';
import { PackageLibrary } from './components/PackageLibrary';
import { ApprovalQueue } from './components/ApprovalQueue';
import { HelixTicketList } from './components/HelixTicketList';
import { ApprovalDetailModal } from './components/ApprovalDetailModal';
import { HelixTicketDetailModal } from './components/HelixTicketDetailModal';
import { ApproveConfirmModal } from './components/ApproveConfirmModal';
import { RejectConfirmModal } from './components/RejectConfirmModal';
import { PreHireDetailModal } from './components/PreHireDetailModal';
import { DEFAULT_API_CONFIG } from './constants';
import { Package, ApprovalRequest, HelixTicket } from './types';
import { Navigation, NavigationSection } from './components/Navigation';
import HardwareInventory from './components/HardwareInventory';
import { LicensePoolDashboard } from './components/LicensePoolDashboard';
import { FreezePeriodAdmin } from './components/FreezePeriodAdmin';
import { FreezePeriodDashboard } from './components/FreezePeriodDashboard';
import {
  mockHardware,
  mockSoftware,
  mockFreezePeriods,
  mockEmployees,
  mockFreezePeriodNotifications,
  mockPreHires,
} from './utils/mockData';

const AppContent: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [currentSection, setCurrentSection] = useLocalStorage<NavigationSection>(
    'currentSection',
    'pre-hires'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { user } = useAuth();
  const {
    preHires,
    editingPreHire,
    createPreHire,
    updatePreHire,
    deletePreHire,
    startEdit,
    cancelEdit,
  } = usePreHires();

  // Package Management
  const {
    packages,
    hardware,
    software,
    editingPackage,
    viewingPackage,
    createPackage,
    updatePackage,
    deletePackage,
    duplicatePackage,
    startEdit: startEditPackage,
    cancelEdit: cancelEditPackage,
    startView: startViewPackage,
    cancelView: cancelViewPackage,
  } = usePackages();

  // Pre-hire Modal States
  const [viewingPreHire, setViewingPreHire] = useState<PreHire | null>(null);
  const [triggerFormOpen, setTriggerFormOpen] = useState<number>(0);

  // Package Modal States
  const [showPackageAssignmentModal, setShowPackageAssignmentModal] = useState(false);
  const [assigningPreHire, setAssigningPreHire] = useState<PreHire | null>(null);
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);
  const [showPackageLibrary, setShowPackageLibrary] = useState(false);

  // Approval & Helix Management
  const {
    approvals,
    tickets,
    statistics: approvalStatistics,
    viewingApproval,
    viewingTicket,
    approveRequest,
    rejectRequest,
    resolveTicket,
    closeTicket,
    startViewApproval,
    cancelViewApproval,
    startViewTicket,
    cancelViewTicket,
    getTicketById,
    getApprovalById,
  } = useApprovals();

  // Approval Modal States
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showHelixTicketList, setShowHelixTicketList] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<ApprovalRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<ApprovalRequest | null>(null);

  // API Configuration (preserved for potential future AI integration)
  const [notesAgentId, setNotesAgentId] = useLocalStorage<string>(
    'notesAgentId',
    DEFAULT_API_CONFIG.notesAgentId
  );
  const [interrogationAgentId, setInterrogationAgentId] = useLocalStorage<string>(
    'interrogationAgentId',
    DEFAULT_API_CONFIG.interrogationAgentId
  );

  const apiConfig: ApiConfig = {
    hostname: DEFAULT_API_CONFIG.hostname,
    clientId: DEFAULT_API_CONFIG.clientId,
    clientSecret: DEFAULT_API_CONFIG.clientSecret,
    notesAgentId: notesAgentId,
    interrogationAgentId: interrogationAgentId,
  };

  // Version check for automatic update detection
  const {
    hasUpdate,
    currentVersion,
    serverVersion,
    dismissUpdate,
    refreshForUpdate
  } = useVersionCheck();

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Track user login (once per session)
  useEffect(() => {
    if (user && !sessionStorage.getItem('loginTracked')) {
      const browserContext = getBrowserContext();
      telemetryService.trackEvent('userLogin', {
        userName: user.displayName || 'Unknown',
        userEmail: user.email || 'Unknown',
        ...browserContext,
      });
      sessionStorage.setItem('loginTracked', 'true');
    }
  }, [user]);

  // Check for first-time user (show welcome modal)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // ============================================================================
  // PRE-HIRE HANDLERS
  // ============================================================================

  const handleSavePreHire = (preHireData: Partial<PreHire>) => {
    if (editingPreHire) {
      // Update existing pre-hire
      updatePreHire(editingPreHire.id, preHireData);
    } else {
      // Create new pre-hire
      createPreHire(preHireData);
    }
  };

  const handleEditPreHire = (preHire: PreHire) => {
    startEdit(preHire);
  };

  const handleDeletePreHire = (preHire: PreHire) => {
    deletePreHire(preHire.id);
    addToast(`Pre-hire record for ${preHire.candidateName} deleted`, 'success');
  };

  const handleViewPreHire = (preHire: PreHire) => {
    setViewingPreHire(preHire);
  };

  const handleCreatePreHire = () => {
    // Trigger form opening in InputPanel
    cancelEdit(); // Make sure we're not in edit mode
    setTriggerFormOpen(Date.now()); // Trigger form open via timestamp change
  };

  const handleCancelEdit = () => {
    cancelEdit();
  };

  // ============================================================================
  // PACKAGE HANDLERS
  // ============================================================================

  const handleAssignPackage = (preHire: PreHire) => {
    setAssigningPreHire(preHire);
    setShowPackageAssignmentModal(true);
  };

  const handlePackageAssignment = (preHire: PreHire, selectedPackage: Package) => {
    updatePreHire(preHire.id, { assignedPackage: selectedPackage });
    addToast(`Package "${selectedPackage.name}" assigned to ${preHire.candidateName}`, 'success');
    setShowPackageAssignmentModal(false);
    setAssigningPreHire(null);
  };

  const handleCreatePackage = () => {
    cancelEditPackage(); // Ensure we're in create mode
    setShowPackageBuilder(true);
  };

  const handleEditPackage = (pkg: Package) => {
    startEditPackage(pkg);
    setShowPackageLibrary(false); // Close Package Library modal first
    setShowPackageBuilder(true);
  };

  const handleSavePackage = (packageData: Partial<Package>) => {
    if (editingPackage) {
      updatePackage(editingPackage.id, packageData);
      addToast(`Package "${packageData.name}" updated successfully`, 'success');
    } else {
      createPackage(packageData);
      addToast(`Package "${packageData.name}" created successfully`, 'success');
    }
    setShowPackageBuilder(false);
    cancelEditPackage();
  };

  const handleCancelPackageBuilder = () => {
    setShowPackageBuilder(false);
    cancelEditPackage();
  };

  const handleDeletePackage = (pkg: Package) => {
    deletePackage(pkg.id);
    addToast(`Package "${pkg.name}" deleted successfully`, 'success');
    if (viewingPackage?.id === pkg.id) {
      cancelViewPackage();
    }
  };

  const handleDuplicatePackage = (pkg: Package) => {
    duplicatePackage(pkg.id);
    addToast(`Package "${pkg.name}" duplicated successfully`, 'success');
  };

  const handleViewPackage = (pkg: Package) => {
    startViewPackage(pkg);
  };

  const handleManagePackages = () => {
    setShowPackageLibrary(true);
  };

  // ============================================================================
  // APPROVAL HANDLERS
  // ============================================================================

  const handleViewApprovalQueue = () => {
    setShowApprovalQueue(true);
  };

  const handleViewHelixTickets = () => {
    setShowHelixTicketList(true);
  };

  const handleViewApprovalDetail = (approval: ApprovalRequest) => {
    startViewApproval(approval);
  };

  const handleStartApprove = (approval: ApprovalRequest) => {
    setApprovingRequest(approval);
  };

  const handleConfirmApprove = (notes?: string) => {
    if (approvingRequest) {
      approveRequest(approvingRequest.id, notes);
      addToast(`Request for ${approvingRequest.employeeName} approved successfully`, 'success');
      setApprovingRequest(null);
    }
  };

  const handleCancelApprove = () => {
    setApprovingRequest(null);
  };

  const handleStartReject = (approval: ApprovalRequest) => {
    setRejectingRequest(approval);
  };

  const handleConfirmReject = (reason: string) => {
    if (rejectingRequest) {
      rejectRequest(rejectingRequest.id, reason);
      addToast(`Request for ${rejectingRequest.employeeName} rejected`, 'error');
      setRejectingRequest(null);
    }
  };

  const handleCancelReject = () => {
    setRejectingRequest(null);
  };

  const handleViewTicketDetail = (ticket: HelixTicket) => {
    startViewTicket(ticket);
  };

  const handleViewTicketById = (ticketId: string) => {
    const ticket = getTicketById(ticketId);
    if (ticket) {
      startViewTicket(ticket);
    } else {
      addToast(`Ticket ${ticketId} not found`, 'error');
    }
  };

  const handleViewApprovalById = (approvalId: string) => {
    const approval = getApprovalById(approvalId);
    if (approval) {
      startViewApproval(approval);
    } else {
      addToast(`Approval ${approvalId} not found`, 'error');
    }
  };

  const handleResolveTicket = (ticket: HelixTicket) => {
    resolveTicket(ticket.id);
    addToast(`Ticket ${ticket.id} marked as resolved`, 'success');
  };

  const handleCloseTicket = (ticket: HelixTicket) => {
    closeTicket(ticket.id);
    addToast(`Ticket ${ticket.id} closed`, 'success');
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    telemetryService.trackEvent('userLogout', {
      userName: user?.displayName || 'Unknown',
      userEmail: user?.email || 'Unknown',
    });
    // Logout handled by AuthContext
  };

  const handleHelpOpen = () => {
    setIsHelpOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      // Clear all pre-hires
      preHires.forEach(ph => deletePreHire(ph.id));
      // Clear all packages
      packages.forEach(pkg => deletePackage(pkg.id));
      addToast('All data has been reset', 'success');
    }
  };

  const handleReplayTour = () => {
    // Tour replay would be handled by TourContext
    addToast('Tour replay feature coming soon', 'success');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Version Update Banner */}
      {hasUpdate && (
        <VersionUpdateBanner
          currentVersion={currentVersion}
          serverVersion={serverVersion}
          onRefresh={refreshForUpdate}
          onDismiss={dismissUpdate}
        />
      )}

      {/* Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleDarkModeToggle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={handleHelpOpen}
        onReplayTour={handleReplayTour}
        onReset={handleResetData}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Navigation
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Pre-hires & Packages Section */}
          {currentSection === 'pre-hires' && (
            <div className="h-full flex overflow-hidden">
              {/* Input Panel */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                <InputPanel
                  editingPreHire={editingPreHire}
                  onSavePreHire={handleSavePreHire}
                  onCancelEdit={handleCancelEdit}
                  onCreate={handleCreatePreHire}
                  triggerFormOpen={triggerFormOpen}
                  onCreatePackage={handleCreatePackage}
                  onManagePackages={handleManagePackages}
                  onViewApprovalQueue={handleViewApprovalQueue}
                  onViewHelixTickets={handleViewHelixTickets}
                  addToast={addToast}
                />
              </div>

              {/* Output Panel */}
              <div className="w-2/3 overflow-hidden">
                <OutputPanel
                  preHires={preHires}
                  onEdit={handleEditPreHire}
                  onDelete={handleDeletePreHire}
                  onView={handleViewPreHire}
                  onAssignPackage={handleAssignPackage}
                  onCreate={handleCreatePreHire}
                />
              </div>
            </div>
          )}

          {/* Hardware Inventory Section */}
          {currentSection === 'hardware-inventory' && (
            <div className="h-full overflow-auto p-6">
              <HardwareInventory
                initialHardware={mockHardware}
                onHardwareChange={(updatedHardware) => {
                  console.log('Hardware updated:', updatedHardware);
                  addToast('Hardware inventory updated', 'success');
                }}
              />
            </div>
          )}

          {/* License Pool Dashboard Section */}
          {currentSection === 'license-pools' && (
            <div className="h-full overflow-auto p-6">
              <LicensePoolDashboard
                licenses={mockSoftware}
                onAssignLicense={(license) => {
                  console.log('Assign license:', license);
                  addToast(`Assigning ${license.name}...`, 'success');
                }}
                onViewAssignments={(license) => {
                  console.log('View assignments for:', license);
                  addToast(`Viewing assignments for ${license.name}`, 'success');
                }}
                onEditLicense={(license) => {
                  console.log('Edit license:', license);
                  addToast(`Editing ${license.name}...`, 'success');
                }}
              />
            </div>
          )}

          {/* Freeze Period Admin Section */}
          {currentSection === 'freeze-period-admin' && (
            <div className="h-full overflow-auto p-6">
              <FreezePeriodAdmin
                freezePeriods={mockFreezePeriods}
                currentUser={{
                  name: user?.displayName || 'Unknown User',
                  email: user?.email || 'unknown@momentumww.com',
                }}
                onCreateFreezePeriod={(period) => {
                  console.log('Create freeze period:', period);
                  addToast('Freeze period created successfully', 'success');
                }}
                onUpdateFreezePeriod={(period) => {
                  console.log('Update freeze period:', period);
                  addToast('Freeze period updated successfully', 'success');
                }}
                onDeleteFreezePeriod={(periodId) => {
                  console.log('Delete freeze period:', periodId);
                  addToast('Freeze period deleted', 'success');
                }}
                onClose={() => {
                  // No-op - not needed for navigation-based UI
                }}
              />
            </div>
          )}

          {/* Freeze Period Dashboard Section */}
          {currentSection === 'freeze-period-dashboard' && (
            <div className="h-full overflow-auto p-6">
              <FreezePeriodDashboard
                freezePeriods={mockFreezePeriods}
                preHires={mockPreHires}
                employees={mockEmployees}
                notifications={mockFreezePeriodNotifications}
                onGenerateEmail={(notification) => {
                  console.log('Generate email:', notification);
                  addToast(`Email generated for ${notification.employeeName}`, 'success');
                }}
                onGenerateBulkEmails={(notifications) => {
                  console.log('Generate bulk emails:', notifications);
                  addToast(`Generated ${notifications.length} emails`, 'success');
                }}
                onMarkEmailSent={(notificationId) => {
                  console.log('Mark email sent:', notificationId);
                  addToast('Email marked as sent', 'success');
                }}
                onClose={() => {
                  // No-op - not needed for navigation-based UI
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals and Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        notesAgentId={notesAgentId}
        onNotesAgentIdChange={setNotesAgentId}
        interrogationAgentId={interrogationAgentId}
        onInterrogationAgentIdChange={setInterrogationAgentId}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {showWelcomeModal && (
        <TourWelcomeModal onClose={() => setShowWelcomeModal(false)} />
      )}

      {/* Package Assignment Modal */}
      {showPackageAssignmentModal && assigningPreHire && (
        <PackageAssignmentModal
          preHire={assigningPreHire}
          packages={packages}
          onAssign={handlePackageAssignment}
          onClose={() => {
            setShowPackageAssignmentModal(false);
            setAssigningPreHire(null);
          }}
        />
      )}

      {/* Package Builder Modal */}
      {showPackageBuilder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <PackageBuilder
                package={editingPackage || undefined}
                hardware={hardware}
                software={software}
                onSave={handleSavePackage}
                onCancel={handleCancelPackageBuilder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Package Detail View Modal */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <PackageDetailView
                package={viewingPackage}
                onClose={cancelViewPackage}
                onEdit={() => handleEditPackage(viewingPackage)}
                onDuplicate={() => handleDuplicatePackage(viewingPackage)}
                onDelete={() => handleDeletePackage(viewingPackage)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Package Library Modal */}
      {showPackageLibrary && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center py-8">
            <div className="relative w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              {/* Close button positioned absolutely in top-right corner */}
              <button
                onClick={() => setShowPackageLibrary(false)}
                className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
              {/* PackageLibrary component already has its own header - no duplicate needed */}
              <PackageLibrary
                packages={packages}
                selectedPackage={null}
                onView={handleViewPackage}
                onEdit={handleEditPackage}
                onDelete={handleDeletePackage}
                onDuplicate={handleDuplicatePackage}
                onCreate={handleCreatePackage}
              />
            </div>
          </div>
        </div>
      )}

      {/* Approval Queue Modal */}
      {showApprovalQueue && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center py-8">
            <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Approval Queue
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Review and approve equipment and software requests
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowApprovalQueue(false)}>
                  <Icon name="x" className="w-5 h-5" />
                </Button>
              </div>
              <ApprovalQueue
                approvals={approvals}
                statistics={approvalStatistics}
                onView={handleViewApprovalDetail}
                onApprove={handleStartApprove}
                onReject={handleStartReject}
                onViewTicket={handleViewTicketById}
              />
            </div>
          </div>
        </div>
      )}

      {/* Helix Ticket List Modal */}
      {showHelixTicketList && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center py-8">
            <div className="w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Helix Tickets
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    IT provisioning and ticketing system
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowHelixTicketList(false)}>
                  <Icon name="x" className="w-5 h-5" />
                </Button>
              </div>
              <HelixTicketList
                tickets={tickets}
                statistics={approvalStatistics}
                onView={handleViewTicketDetail}
                onResolve={handleResolveTicket}
                onClose={handleCloseTicket}
              />
            </div>
          </div>
        </div>
      )}

      {/* Approval Detail Modal */}
      {viewingApproval && (
        <ApprovalDetailModal
          approval={viewingApproval}
          onApprove={handleStartApprove}
          onReject={handleStartReject}
          onViewTicket={handleViewTicketById}
          onClose={cancelViewApproval}
        />
      )}

      {/* Helix Ticket Detail Modal */}
      {viewingTicket && (
        <HelixTicketDetailModal
          ticket={viewingTicket}
          onResolve={handleResolveTicket}
          onClose={handleCloseTicket}
          onViewApproval={handleViewApprovalById}
          onCloseModal={cancelViewTicket}
        />
      )}

      {/* Approve Confirmation Modal */}
      {approvingRequest && (
        <ApproveConfirmModal
          approval={approvingRequest}
          onConfirm={handleConfirmApprove}
          onCancel={handleCancelApprove}
        />
      )}

      {/* Reject Confirmation Modal */}
      {rejectingRequest && (
        <RejectConfirmModal
          approval={rejectingRequest}
          onConfirm={handleConfirmReject}
          onCancel={handleCancelReject}
        />
      )}

      {/* Pre-hire Detail Modal */}
      {viewingPreHire && (
        <PreHireDetailModal
          preHire={viewingPreHire}
          onEdit={handleEditPreHire}
          onDelete={handleDeletePreHire}
          onClose={() => setViewingPreHire(null)}
        />
      )}

      {/* Floating Components */}
      <FeedbackButton apiConfig={apiConfig} />
      <ScrollToTop />

      {/* Tour Controller */}
      <TourController />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <TourProvider>
      <DepartmentProvider>
        <PreHireProvider>
          <PackageProvider>
            <ApprovalProvider>
              <AppContent />
            </ApprovalProvider>
          </PackageProvider>
        </PreHireProvider>
      </DepartmentProvider>
    </TourProvider>
  );
}

export default App;
