import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { OutputPanel } from './components/OutputPanel';
import { SettingsDrawer } from './components/SettingsDrawer';
import { HelpModal } from './components/HelpModal';
import { Toast } from './components/ui/Toast';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { Button } from './components/ui/Button';
import { Icon } from './components/ui/Icon';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ToastState, ApiConfig, PreHire } from './types';
import { TourProvider } from './contexts/TourContext';
import { RoleProvider } from './contexts/RoleContext';
import { DepartmentProvider } from './contexts/DepartmentContext';
import { PreHireProvider, usePreHires } from './contexts/PreHireContext';
import { TourWelcomeModal } from './components/tour/TourWelcomeModal';
import { useAuth } from './contexts/AuthContext';
import { telemetryService } from './utils/telemetryService';
import { getBrowserContext } from './utils/browserContext';
import { FeedbackButton } from './components/FeedbackButton';
import { useVersionCheck } from './hooks/useVersionCheck';
import { VersionUpdateBanner } from './components/ui/VersionUpdateBanner';
import { PackageProvider, usePackages } from './contexts/PackageContext';
import { ApprovalProvider, useApprovals } from './contexts/ApprovalContext';
import { LicenseProvider, useLicense } from './contexts/LicenseContext';
import { CampaignProvider } from './contexts/CampaignContext';
import { EventProvider } from './contexts/EventContext';
import { VenueProvider } from './contexts/VenueContext';
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
import { PreHireForm } from './components/PreHireForm';
import EmployeeLinkingModal from './components/EmployeeLinkingModal';
import { DEFAULT_API_CONFIG } from './constants';
import { Package, ApprovalRequest, HelixTicket } from './types';
import { CollapsibleNavigation, NavigationSection } from './components/CollapsibleNavigation';
import HardwareInventory from './components/HardwareInventory';
import SoftwareInventory from './components/SoftwareInventory';
import { LicensePoolDashboard } from './components/LicensePoolDashboard';
import { UserLicenseAssignments } from './components/UserLicenseAssignments';
import { UserLicenseAssignModal } from './components/UserLicenseAssignModal';
import { RefreshCalendar } from './components/RefreshCalendar';
import { RefreshFinanceView } from './components/RefreshFinanceView';
import { RefreshNotifications } from './components/RefreshNotifications';
import { FreezePeriodAdmin } from './components/FreezePeriodAdmin';
import { FreezePeriodDashboard } from './components/FreezePeriodDashboard';
import { RoleManagement } from './components/RoleManagement';

// UXP Components
import { CampaignList } from './components/campaign/CampaignList';
import EventCalendar from './components/event/EventCalendar';
import EventMap from './components/event/EventMap';
import EventList from './components/event/EventList';
import { TeamAssignments } from './components/team/TeamAssignments';
import VenueDatabase from './components/venue/VenueDatabase';
import { IntegrationSettings } from './components/integrations/IntegrationSettings';
import { PowerBIDashboard } from './components/analytics/PowerBIDashboard';
import { ReportExport } from './components/analytics/ReportExport';
import { UserManagement } from './components/admin/UserManagement';
import { ClientManagement } from './components/admin/ClientManagement';
import { ProgramManagement } from './components/admin/ProgramManagement';

import {
  mockHardware,
  mockSoftware,
  mockFreezePeriods,
  mockEmployees,
  mockFreezePeriodNotifications,
  mockPreHires,
  mockHelixTickets,
  mockClients,
  mockPrograms,
  mockIntegrationConfig,
  mockUsers,
  mockPeopleAssignments,
  mockEvents,
  mockCampaigns,
} from './utils/mockData';

const AppContent: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [currentSection, setCurrentSection] = useLocalStorage<NavigationSection>(
    'currentSection',
    'campaigns'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { user } = useAuth();
  const {
    preHires,
    loading: preHiresLoading,
    error: preHiresError,
    editingPreHire: contextEditingPreHire,
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
    loading: packagesLoading,
    error: packagesError,
    editingPackage,
    viewingPackage,
    createPackage,
    updatePackage,
    deletePackage,
    startEdit: startEditPackage,
    cancelEdit: cancelEditPackage,
    startView: startViewPackage,
    cancelView: cancelViewPackage,
  } = usePackages();

  // License Pool Management
  const {
    licensePools,
    assignLicenseToPool,
    getPoolUtilization,
    getPoolAvailableSeats,
  } = useLicense();

  // Pre-hire Modal States
  const [viewingPreHire, setViewingPreHire] = useState<PreHire | null>(null);
  const [showPreHireForm, setShowPreHireForm] = useState(false);
  const [editingPreHire, setEditingPreHire] = useState<PreHire | null>(null);

  // Package Modal States
  const [showPackageAssignmentModal, setShowPackageAssignmentModal] = useState(false);
  const [assigningPreHire, setAssigningPreHire] = useState<PreHire | null>(null);
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);
  const [showPackageLibrary, setShowPackageLibrary] = useState(false);
  const [isCloning, setIsCloning] = useState(false); // Track if we're cloning a package

  // License Assignment Modal State
  const [showLicenseAssignModal, setShowLicenseAssignModal] = useState(false);
  const [selectedPoolForAssignment, setSelectedPoolForAssignment] = useState<string | undefined>(undefined);

  // Employee Linking Modal State
  const [linkingPreHire, setLinkingPreHire] = useState<PreHire | null>(null);

  // Approval & Helix Management
  const {
    approvals,
    tickets,
    loading: approvalsLoading,
    error: approvalsError,
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
    updateAvailable,
    currentVersion,
    serverVersion,
    dismissUpdate,
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
      const browserContext = getBrowserContext(isDarkMode);
      telemetryService.trackEvent('userLogin', {
        userName: user.name || 'Unknown',
        userEmail: user.username || 'Unknown',
        ...browserContext,
      });
      sessionStorage.setItem('loginTracked', 'true');
    }
  }, [user, isDarkMode]);

  // Check for first-time user (show welcome modal)
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  }, []);

  // Display error toasts from contexts
  useEffect(() => {
    if (preHiresError) {
      addToast(preHiresError, 'error');
    }
  }, [preHiresError]);

  useEffect(() => {
    if (packagesError) {
      addToast(packagesError, 'error');
    }
  }, [packagesError]);

  useEffect(() => {
    if (approvalsError) {
      addToast(approvalsError, 'error');
    }
  }, [approvalsError]);

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

  const handleSavePreHire = async (preHireData: Partial<PreHire>) => {
    try {
      if (editingPreHire) {
        // Update existing pre-hire
        await updatePreHire(editingPreHire.id, preHireData);
        addToast(`Pre-hire record for ${preHireData.candidateName} updated successfully`, 'success');
      } else {
        // Create new pre-hire
        await createPreHire(preHireData);
        addToast(`Pre-hire record for ${preHireData.candidateName} created successfully`, 'success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pre-hire';
      addToast(errorMessage, 'error');
    }
  };

  const handleEditPreHire = (preHire: PreHire) => {
    setEditingPreHire(preHire);
    setShowPreHireForm(true);
  };

  const handleDeletePreHire = async (preHire: PreHire) => {
    try {
      await deletePreHire(preHire.id);
      addToast(`Pre-hire record for ${preHire.candidateName} deleted successfully`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete pre-hire';
      addToast(errorMessage, 'error');
    }
  };

  const handleViewPreHire = (preHire: PreHire) => {
    setViewingPreHire(preHire);
  };

  const handleCreatePreHire = () => {
    setEditingPreHire(null); // Clear any editing pre-hire
    setShowPreHireForm(true); // Show the form modal
  };

  const handleMergePreHire = (preHire: PreHire) => {
    setLinkingPreHire(preHire);
  };

  const handleLinkEmployee = async (employeeId: string, linkConfidence: 'auto' | 'manual' | 'verified') => {
    if (linkingPreHire) {
      try {
        // Update the pre-hire record with linked employee ID and change status to 'linked'
        await updatePreHire(linkingPreHire.id, {
          linkedEmployeeId: employeeId,
          status: 'linked',
        });

        addToast(
          `Pre-hire ${linkingPreHire.candidateName} linked to employee ${employeeId} successfully`,
          'success'
        );

        // Close the modal
        setLinkingPreHire(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to link employee';
        addToast(errorMessage, 'error');
      }
    }
  };

  const handlePreHireFormSubmit = async (preHireData: Partial<PreHire>) => {
    try {
      if (editingPreHire) {
        // Update existing pre-hire
        await updatePreHire(editingPreHire.id, preHireData);
        addToast(`Pre-hire record for ${preHireData.candidateName} updated successfully`, 'success');
      } else {
        // Create new pre-hire
        await createPreHire(preHireData);
        addToast(`Pre-hire record for ${preHireData.candidateName} created successfully`, 'success');
      }
      setShowPreHireForm(false);
      setEditingPreHire(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save pre-hire';
      addToast(errorMessage, 'error');
      // Don't close the form on error so user can retry
    }
  };

  const handlePreHireFormCancel = () => {
    setShowPreHireForm(false);
    setEditingPreHire(null);
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

  const handlePackageAssignment = async (preHire: PreHire, selectedPackage: Package) => {
    try {
      await updatePreHire(preHire.id, { assignedPackage: selectedPackage });
      addToast(`Package "${selectedPackage.name}" assigned to ${preHire.candidateName} successfully`, 'success');
      setShowPackageAssignmentModal(false);
      setAssigningPreHire(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign package';
      addToast(errorMessage, 'error');
    }
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

  const handleSavePackage = async (packageData: Partial<Package>) => {
    try {
      if (isCloning || !editingPackage) {
        // Cloning or creating new package
        await createPackage(packageData);
        addToast(`Package "${packageData.name}" created successfully`, 'success');
      } else {
        // Updating existing package
        await updatePackage(editingPackage.id, packageData);
        addToast(`Package "${packageData.name}" updated successfully`, 'success');
      }
      setShowPackageBuilder(false);
      setIsCloning(false);
      cancelEditPackage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save package';
      addToast(errorMessage, 'error');
      // Don't close the builder on error so user can retry
    }
  };

  const handleCancelPackageBuilder = () => {
    setShowPackageBuilder(false);
    setIsCloning(false);
    cancelEditPackage();
  };

  const handleDeletePackage = async (pkg: Package) => {
    try {
      await deletePackage(pkg.id);
      addToast(`Package "${pkg.name}" deleted successfully`, 'success');
      if (viewingPackage?.id === pkg.id) {
        cancelViewPackage();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete package';
      addToast(errorMessage, 'error');
    }
  };

  const handleDuplicatePackage = (pkg: Package) => {
    // Prepare package for cloning with modified name
    const packageForCloning: Package = {
      ...pkg,
      name: `${pkg.name} - Copy`,
    };

    // Set up cloning mode
    setIsCloning(true);
    startEditPackage(packageForCloning);
    setShowPackageLibrary(false); // Close Package Library if open
    setShowPackageBuilder(true); // Open PackageBuilder with pre-filled data

    // Don't show toast yet - will show when user saves the cloned package
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

  const handleConfirmApprove = async (notes?: string) => {
    if (approvingRequest) {
      try {
        await approveRequest(approvingRequest.id, undefined, notes);
        addToast(`Request for ${approvingRequest.employeeName} approved successfully`, 'success');
        setApprovingRequest(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to approve request';
        addToast(errorMessage, 'error');
      }
    }
  };

  const handleCancelApprove = () => {
    setApprovingRequest(null);
  };

  const handleStartReject = (approval: ApprovalRequest) => {
    setRejectingRequest(approval);
  };

  const handleConfirmReject = async (reason: string) => {
    if (rejectingRequest) {
      try {
        await rejectRequest(rejectingRequest.id, reason);
        addToast(`Request for ${rejectingRequest.employeeName} rejected successfully`, 'success');
        setRejectingRequest(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
        addToast(errorMessage, 'error');
      }
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
  // INTEGRATION SETTINGS HANDLERS
  // ============================================================================

  const [integrationConfig, setIntegrationConfig] = useState(mockIntegrationConfig);

  const handleSaveIntegrationConfig = async (config: typeof mockIntegrationConfig) => {
    try {
      // In a real app, this would save to backend/database
      setIntegrationConfig(config);
      addToast('Integration settings saved successfully', 'success');
    } catch (error) {
      addToast('Failed to save integration settings', 'error');
      throw error;
    }
  };

  const handleTestConnection = async (integration: 'brandscopic' | 'qrTiger' | 'qualtrics' | 'momoBi') => {
    try {
      // In a real app, this would make an API call to test the connection
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      const isEnabled = integrationConfig[integration].enabled;
      if (!isEnabled) {
        return { success: false, message: `${integration} is currently disabled` };
      }

      return { success: true, message: `Successfully connected to ${integration}` };
    } catch (error) {
      return { success: false, message: `Failed to connect to ${integration}` };
    }
  };

  // ============================================================================
  // PROGRAM MANAGEMENT HANDLERS
  // ============================================================================

  const [programs, setPrograms] = useState(mockPrograms);

  const handleCreateProgram = async (programData: any) => {
    try {
      const newProgram = {
        id: `prog-${Date.now()}`,
        ...programData,
        eventCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.username || 'Unknown',
      };
      setPrograms([...programs, newProgram]);
      addToast(`Program "${programData.name}" created successfully`, 'success');
    } catch (error) {
      addToast('Failed to create program', 'error');
      throw error;
    }
  };

  const handleUpdateProgram = async (programId: string, updates: any) => {
    try {
      setPrograms(programs.map(prog =>
        prog.id === programId ? { ...prog, ...updates, updatedAt: new Date() } : prog
      ));
      addToast('Program updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update program', 'error');
      throw error;
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    try {
      setPrograms(programs.filter(prog => prog.id !== programId));
      addToast('Program deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete program', 'error');
      throw error;
    }
  };

  // ============================================================================
  // POWER BI & REPORTING HANDLERS
  // ============================================================================

  const handleGenerateEmbedToken = async (reportType: string) => {
    try {
      // In a real app, this would call backend to generate Power BI embed token
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      return `embed_token_${reportType}_${Date.now()}`;
    } catch (error) {
      throw new Error('Failed to generate embed token');
    }
  };

  const handleExportReport = async (request: any) => {
    try {
      // In a real app, this would trigger backend report generation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      const downloadUrl = `https://storage.example.com/reports/${request.reportType}_${Date.now()}.${request.format}`;
      addToast(`Report exported successfully`, 'success');
      return downloadUrl;
    } catch (error) {
      addToast('Failed to export report', 'error');
      throw error;
    }
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    telemetryService.trackEvent('userLogout', {
      userName: user?.name || 'Unknown',
      userEmail: user?.username || 'Unknown',
    });
    // Logout handled by AuthContext
  };

  const handleHelpOpen = () => {
    setIsHelpOpen(true);
  };

  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Clear all pre-hires
    preHires.forEach(ph => deletePreHire(ph.id));
    // Clear all packages
    packages.forEach(pkg => deletePackage(pkg.id));
    addToast('All data has been reset', 'success');
  };

  const handleReplayTour = () => {
    // Tour replay would be handled by TourContext
    addToast('Tour replay feature coming soon', 'success');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Version Update Banner */}
      {updateAvailable && currentVersion && serverVersion && (
        <VersionUpdateBanner
          currentVersion={currentVersion.version}
          serverVersion={serverVersion.version}
          onRefresh={() => window.location.reload()}
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

      {/* Mobile Menu Button (Hamburger) - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Open navigation menu"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <CollapsibleNavigation
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Campaigns Section */}
          {currentSection === 'campaigns' && (
            <div className="h-full overflow-auto">
              <CampaignList />
            </div>
          )}

          {/* Event Calendar Section */}
          {currentSection === 'events-calendar' && (
            <div className="h-full overflow-auto">
              <EventCalendar />
            </div>
          )}

          {/* Event Map Section */}
          {currentSection === 'events-map' && (
            <div className="h-full overflow-auto">
              <EventMap />
            </div>
          )}

          {/* Event List Section */}
          {currentSection === 'events-list' && (
            <div className="h-full overflow-auto">
              <EventList />
            </div>
          )}

          {/* Venues Section */}
          {currentSection === 'venues' && (
            <div className="h-full overflow-auto">
              <VenueDatabase />
            </div>
          )}

          {/* Team Assignments Section */}
          {currentSection === 'team-assignments' && (
            <div className="h-full overflow-auto">
              <TeamAssignments
                assignments={mockPeopleAssignments}
                events={mockEvents}
                campaigns={mockCampaigns}
              />
            </div>
          )}

          {/* Integrations Section */}
          {currentSection === 'integrations' && (
            <div className="h-full overflow-auto p-6">
              <IntegrationSettings
                config={integrationConfig}
                onSave={handleSaveIntegrationConfig}
                onTestConnection={handleTestConnection}
              />
            </div>
          )}

          {/* Power BI Dashboard Section */}
          {currentSection === 'analytics-dashboard' && (
            <div className="h-full overflow-auto p-6">
              <PowerBIDashboard
                clients={mockClients}
                programs={programs}
                onGenerateEmbedToken={handleGenerateEmbedToken}
              />
            </div>
          )}

          {/* Report Export Section */}
          {currentSection === 'analytics-export' && (
            <div className="h-full overflow-auto p-6">
              <ReportExport
                clients={mockClients}
                programs={programs}
                onExport={handleExportReport}
              />
            </div>
          )}

          {/* User Management Section */}
          {currentSection === 'admin-users' && (
            <div className="h-full overflow-auto">
              <UserManagement
                initialUsers={mockUsers}
                clients={mockClients}
                currentUser={mockUsers[0]} // Admin user
              />
            </div>
          )}

          {/* Client Management Section */}
          {currentSection === 'admin-clients' && (
            <div className="h-full overflow-auto">
              <ClientManagement />
            </div>
          )}

          {/* Program Management Section */}
          {currentSection === 'admin-programs' && (
            <div className="h-full overflow-auto p-6">
              <ProgramManagement
                initialPrograms={programs}
                clients={mockClients}
                onCreateProgram={handleCreateProgram}
                onUpdateProgram={handleUpdateProgram}
                onDeleteProgram={handleDeleteProgram}
              />
            </div>
          )}

          {/* Settings Section (placeholder for now) */}
          {currentSection === 'settings' && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Application Settings
                </h1>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Settings panel content coming soon. For now, use the settings icon in the header to access agent configuration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        addToast={addToast}
        notesAgentId={notesAgentId}
        setNotesAgentId={setNotesAgentId}
        interrogationAgentId={interrogationAgentId}
        setInterrogationAgentId={setInterrogationAgentId}
        onOpenRoleManagement={() => {
          setCurrentSection('role-management');
          addToast('Opening Role Management Dashboard', 'success');
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {showWelcomeModal && (
        <TourWelcomeModal
          isOpen={showWelcomeModal}
          onStart={() => setShowWelcomeModal(false)}
          onClose={() => setShowWelcomeModal(false)}
        />
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
                isCloning={isCloning}
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

      {/* Pre-hire Create/Edit Form Modal */}
      {showPreHireForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="min-h-screen flex items-center justify-center py-8">
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {editingPreHire ? 'Edit Pre-hire' : 'Create Pre-hire'}
              </h2>
              <PreHireForm
                preHire={editingPreHire || undefined}
                onSubmit={handlePreHireFormSubmit}
                onCancel={handlePreHireFormCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Employee Linking Modal */}
      {linkingPreHire && (
        <EmployeeLinkingModal
          preHire={linkingPreHire}
          onLink={handleLinkEmployee}
          onClose={() => setLinkingPreHire(null)}
        />
      )}

      {/* User License Assignment Modal */}
      {showLicenseAssignModal && (
        <UserLicenseAssignModal
          isOpen={showLicenseAssignModal}
          onClose={() => {
            setShowLicenseAssignModal(false);
            setSelectedPoolForAssignment(undefined);
          }}
          preSelectedEmployeeId={undefined}
          employees={mockEmployees}
          onAssignSuccess={(employeeId, licensePoolId) => {
            addToast('License assigned successfully!', 'success');
            setShowLicenseAssignModal(false);
            setSelectedPoolForAssignment(undefined);
          }}
        />
      )}

      {/* Floating Components */}
      <FeedbackButton />
      <ScrollToTop />

      {/* Tour Controller - commented out for now, needs proper props */}
      {/* <TourController /> */}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="Reset All Data?"
        message="Are you sure you want to reset all data? This will delete all pre-hires and packages. This action cannot be undone."
        confirmText="Reset All Data"
        variant="danger"
      />
    </div>
  );
};

function App() {
  return (
    <TourProvider>
      <RoleProvider>
        <DepartmentProvider>
          <PreHireProvider>
            <PackageProvider>
              <LicenseProvider useMockData={true} employees={mockEmployees}>
                <ApprovalProvider>
                  <CampaignProvider>
                    <EventProvider>
                      <VenueProvider>
                        <AppContent />
                      </VenueProvider>
                    </EventProvider>
                  </CampaignProvider>
                </ApprovalProvider>
              </LicenseProvider>
            </PackageProvider>
          </PreHireProvider>
        </DepartmentProvider>
      </RoleProvider>
    </TourProvider>
  );
}

export default App;
