// ============================================================================
// EMPLOYEE ONBOARDING SYSTEM - MOCK DATA
// ============================================================================
// Sample data for development and testing
// Includes: Hardware, Software, Packages, PreHires, Employees, Approvals

import {
  Hardware,
  Software,
  Package,
  PackageVersion,
  PackageAssignment,
  PackageCostBreakdown,
  PreHire,
  Employee,
  ApprovalRequest,
  HelixTicket,
  OnboardingTask,
  OnboardingProgress,
  FreezePeriod,
  FreezePeriodNotification,
} from '../types';

// ============================================================================
// HARDWARE CATALOG
// ============================================================================

export const mockHardware: Hardware[] = [
  // Computers - Superseding Chain Example: M3 → M4
  {
    id: 'hw-comp-001',
    type: 'computer',
    model: 'MacBook Pro 16" M3 Max',
    manufacturer: 'Apple',
    specifications: {
      processor: 'M3 Max',
      ram: '64GB',
      storage: '2TB SSD',
    },
    supersededById: 'hw-comp-005', // Superseded by M4 Max
    purchaseDate: new Date('2024-01-15'),
    cost: 4299.00,
    costFrequency: 'one-time',
  },
  {
    id: 'hw-comp-002',
    type: 'computer',
    model: 'MacBook Pro 14" M3 Pro',
    manufacturer: 'Apple',
    specifications: {
      processor: 'M3 Pro',
      ram: '32GB',
      storage: '1TB SSD',
    },
    // No supersededById - still current for this form factor
    purchaseDate: new Date('2024-02-01'),
    cost: 2899.00,
    costFrequency: 'one-time',
  },
  {
    id: 'hw-comp-003',
    type: 'computer',
    model: 'Dell XPS 15',
    manufacturer: 'Dell',
    specifications: {
      processor: 'Intel Core i9',
      ram: '32GB',
      storage: '1TB SSD',
    },
    // No supersededById - still current
    purchaseDate: new Date('2024-03-10'),
    cost: 2499.00,
    costFrequency: 'one-time',
  },
  {
    id: 'hw-comp-004',
    type: 'computer',
    model: 'Surface Laptop Studio 2',
    manufacturer: 'Microsoft',
    specifications: {
      processor: 'Intel Core i7',
      ram: '32GB',
      storage: '1TB SSD',
    },
    // No supersededById - still current
    purchaseDate: new Date('2024-04-05'),
    cost: 2799.00,
  },
  {
    id: 'hw-comp-005',
    type: 'computer',
    model: 'MacBook Pro 16" M4 Max',
    manufacturer: 'Apple',
    specifications: {
      processor: 'M4 Max',
      ram: '64GB',
      storage: '2TB SSD',
    },
    // Latest - no supersededById
    purchaseDate: new Date('2025-11-01'),
    cost: 4499.00,
  },

  // Monitors
  {
    id: 'hw-mon-001',
    type: 'monitor',
    model: 'Dell UltraSharp 27" 4K',
    manufacturer: 'Dell',
    specifications: {
      screenSize: '27"',
      connectivity: 'USB-C, HDMI, DisplayPort',
    },
    cost: 649.00,
  },
  {
    id: 'hw-mon-002',
    type: 'monitor',
    model: 'LG UltraFine 32" 4K',
    manufacturer: 'LG',
    specifications: {
      screenSize: '32"',
      connectivity: 'USB-C, Thunderbolt 3',
    },
    cost: 899.00,
  },
  {
    id: 'hw-mon-003',
    type: 'monitor',
    model: 'BenQ PD3220U 32" 4K',
    manufacturer: 'BenQ',
    specifications: {
      screenSize: '32"',
      connectivity: 'USB-C, HDMI, DisplayPort',
    },
    cost: 1099.00,
  },

  // Keyboards & Mice
  {
    id: 'hw-key-001',
    type: 'keyboard',
    model: 'Magic Keyboard with Touch ID',
    manufacturer: 'Apple',
    specifications: {
      connectivity: 'Bluetooth, USB-C',
    },
    cost: 149.00,
  },
  {
    id: 'hw-key-002',
    type: 'keyboard',
    model: 'MX Keys',
    manufacturer: 'Logitech',
    specifications: {
      connectivity: 'Bluetooth, USB Receiver',
    },
    cost: 99.99,
  },
  {
    id: 'hw-mou-001',
    type: 'mouse',
    model: 'MX Master 3S',
    manufacturer: 'Logitech',
    specifications: {
      connectivity: 'Bluetooth, USB Receiver',
    },
    cost: 99.99,
  },
  {
    id: 'hw-mou-002',
    type: 'mouse',
    model: 'Magic Mouse',
    manufacturer: 'Apple',
    specifications: {
      connectivity: 'Bluetooth',
    },
    cost: 79.00,
  },

  // Docks
  {
    id: 'hw-dock-001',
    type: 'dock',
    model: 'CalDigit TS4 Thunderbolt 4',
    manufacturer: 'CalDigit',
    specifications: {
      connectivity: 'Thunderbolt 4, 18 ports',
    },
    cost: 399.99,
  },
  {
    id: 'hw-dock-002',
    type: 'dock',
    model: 'Dell WD19TB Thunderbolt Dock',
    manufacturer: 'Dell',
    specifications: {
      connectivity: 'Thunderbolt 3, USB-C',
    },
    cost: 299.00,
  },

  // Headsets
  {
    id: 'hw-head-001',
    type: 'headset',
    model: 'AirPods Pro (2nd Gen)',
    manufacturer: 'Apple',
    specifications: {
      connectivity: 'Bluetooth',
    },
    cost: 249.00,
  },
  {
    id: 'hw-head-002',
    type: 'headset',
    model: 'Jabra Evolve2 85',
    manufacturer: 'Jabra',
    specifications: {
      connectivity: 'Bluetooth, USB-C',
    },
    cost: 449.00,
  },
  {
    id: 'hw-head-003',
    type: 'headset',
    model: 'Sony WH-1000XM5',
    manufacturer: 'Sony',
    specifications: {
      connectivity: 'Bluetooth, 3.5mm',
    },
    cost: 399.99,
  },

  // Accessories
  {
    id: 'hw-acc-001',
    type: 'accessory',
    model: 'Laptop Stand',
    manufacturer: 'Rain Design',
    specifications: {},
    cost: 59.99,
  },
  {
    id: 'hw-acc-002',
    type: 'accessory',
    model: 'USB-C Hub 7-in-1',
    manufacturer: 'Anker',
    specifications: {
      connectivity: 'USB-C, HDMI, USB 3.0',
    },
    cost: 49.99,
  },
  {
    id: 'hw-acc-003',
    type: 'accessory',
    model: 'Ergonomic Mouse Pad',
    manufacturer: '3M',
    specifications: {},
    cost: 24.99,
  },
];

// ============================================================================
// SOFTWARE CATALOG
// ============================================================================

export const mockSoftware: Software[] = [
  {
    id: 'sw-adobe-001',
    name: 'Adobe Creative Cloud All Apps',
    vendor: 'Adobe',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 59.99,
    costFrequency: 'monthly',
    renewalFrequency: 'monthly',
    description: 'Full suite of Adobe creative applications',
  },
  {
    id: 'sw-figma-001',
    name: 'Figma Professional',
    vendor: 'Figma',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 15.00,
    costFrequency: 'monthly',
    renewalFrequency: 'monthly',
    description: 'Collaborative design tool',
  },
  {
    id: 'sw-c4d-001',
    name: 'Cinema 4D Studio',
    vendor: 'Maxon',
    licenseType: 'subscription',
    requiresApproval: true,
    approver: 'Steve Sanderson',
    cost: 94.99,
    costFrequency: 'monthly',
    renewalFrequency: 'monthly',
    description: '3D modeling and animation software',
  },
  {
    id: 'sw-smart-001',
    name: 'Smartsheet Business',
    vendor: 'Smartsheet',
    licenseType: 'subscription',
    requiresApproval: true,
    approver: 'Patricia',
    cost: 25.00,
    renewalFrequency: 'monthly',
    description: 'Project management and collaboration platform',
  },
  {
    id: 'sw-office-001',
    name: 'Microsoft 365 Business Premium',
    vendor: 'Microsoft',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 22.00,
    renewalFrequency: 'monthly',
    description: 'Office suite with Teams, OneDrive, Exchange',
  },
  {
    id: 'sw-slack-001',
    name: 'Slack Pro',
    vendor: 'Slack',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 8.75,
    renewalFrequency: 'monthly',
    description: 'Team communication platform',
  },
  {
    id: 'sw-zoom-001',
    name: 'Zoom Business',
    vendor: 'Zoom',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 19.99,
    renewalFrequency: 'monthly',
    description: 'Video conferencing platform',
  },
  {
    id: 'sw-miro-001',
    name: 'Miro Business',
    vendor: 'Miro',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 10.00,
    renewalFrequency: 'monthly',
    description: 'Online whiteboard for collaboration',
  },
  {
    id: 'sw-notion-001',
    name: 'Notion Plus',
    vendor: 'Notion',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 10.00,
    renewalFrequency: 'monthly',
    description: 'Workspace for notes, docs, and wikis',
  },
  {
    id: 'sw-airtable-001',
    name: 'Airtable Pro',
    vendor: 'Airtable',
    licenseType: 'subscription',
    requiresApproval: false,
    approver: 'Auto',
    cost: 20.00,
    renewalFrequency: 'monthly',
    description: 'Database and project management tool',
  },
];

// ============================================================================
// EQUIPMENT PACKAGES
// ============================================================================

export const mockPackages: Package[] = [
  // XD Designer Standard Package
  {
    id: 'pkg-xd-std-001',
    name: 'XD Designer Standard',
    description: 'Standard equipment package for Experience Designers and Motion Designers',
    // Phase 6: Role-based targeting
    roleTargets: [
      { departmentGroup: 'Creative Services', role: 'XD Designer' },
      { departmentGroup: 'Creative Services', role: 'Senior XD Designer', grade: 'Senior' },
      { departmentGroup: 'Creative Services', role: 'Motion Designer' },
    ],
    osPreference: 'Mac',
    // Legacy fields (backward compatibility)
    roleTarget: ['XD Designer', 'Senior XD Designer', 'Motion Designer'],
    departmentTarget: ['Creative', 'IPTC'],
    hardware: [
      mockHardware[0], // MacBook Pro 16" M3 Max (superseded by M4, but still used in v1)
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[7], // Magic Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[11], // CalDigit TS4 Dock
      mockHardware[13], // AirPods Pro
      mockHardware[16], // Laptop Stand
    ],
    software: [
      mockSoftware[0], // Adobe CC
      mockSoftware[1], // Figma
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[7], // Miro
    ],
    licenses: [],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    lastModified: new Date('2025-01-15'),
  },

  // XD Designer Premium Package (with Cinema 4D - requires approval)
  {
    id: 'pkg-xd-prem-001',
    name: 'XD Designer Premium',
    description: 'Premium package for Senior XD Designers requiring 3D capabilities',
    // Phase 6: Role-based targeting
    roleTargets: [
      { departmentGroup: 'Creative Services', role: 'Senior XD Designer', grade: 'Senior' },
      { departmentGroup: 'Creative Services', role: 'Lead XD Designer', grade: 'Lead' },
      { departmentGroup: 'Creative Services', role: 'Motion Designer', grade: 'Lead' },
    ],
    osPreference: 'Mac',
    // Legacy fields (backward compatibility)
    roleTarget: ['Senior XD Designer', 'Lead XD Designer', 'Motion Designer'],
    departmentTarget: ['Creative', 'IPTC'],
    hardware: [
      mockHardware[0], // MacBook Pro 16" M3 Max
      mockHardware[5], // LG UltraFine 32" 4K
      mockHardware[7], // Magic Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[11], // CalDigit TS4 Dock
      mockHardware[14], // Jabra Evolve2 85
      mockHardware[16], // Laptop Stand
    ],
    software: [
      mockSoftware[0], // Adobe CC
      mockSoftware[1], // Figma
      mockSoftware[2], // Cinema 4D (requires approval!)
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[7], // Miro
    ],
    licenses: [],
    isStandard: false, // Exception package - requires SVP approval
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    lastModified: new Date('2025-01-15'),
  },

  // Project Manager Standard Package
  {
    id: 'pkg-pm-std-001',
    name: 'Project Manager Standard',
    description: 'Standard equipment for Project Managers and Program Managers',
    // Phase 6: Role-based targeting
    roleTargets: [
      { departmentGroup: 'IP & CT', role: 'Project Manager' },
      { departmentGroup: 'IP & CT', role: 'Senior Project Manager', grade: 'Senior' },
      { departmentGroup: 'IP & CT', role: 'Program Manager', gradeGroup: 'Management' },
      { departmentGroup: 'STR', role: 'Project Manager' },
    ],
    osPreference: 'Either',
    // Legacy fields (backward compatibility)
    roleTarget: ['Project Manager', 'Senior Project Manager', 'Program Manager'],
    departmentTarget: ['STR', 'PM', 'Operations'],
    hardware: [
      mockHardware[1], // MacBook Pro 14" M3 Pro
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[12], // Dell Thunderbolt Dock
      mockHardware[13], // AirPods Pro
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[8], // Notion
      mockSoftware[9], // Airtable
    ],
    licenses: [],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    lastModified: new Date('2025-01-15'),
  },

  // Developer Standard Package
  {
    id: 'pkg-dev-std-001',
    name: 'Developer Standard',
    description: 'Standard package for Software Developers and Engineers',
    // Phase 6: Role-based targeting
    roleTargets: [
      { departmentGroup: 'Global Technology', role: 'Developer' },
      { departmentGroup: 'Global Technology', role: 'Senior Developer', grade: 'Senior' },
      { departmentGroup: 'Global Technology', role: 'Software Engineer' },
      { departmentGroup: 'Global Technology', role: 'Full Stack Developer' },
      { departmentGroup: 'IP & CT', role: 'Developer' },
    ],
    osPreference: 'Windows',
    // Legacy fields (backward compatibility)
    roleTarget: ['Developer', 'Senior Developer', 'Software Engineer', 'Full Stack Developer'],
    departmentTarget: ['IPCT', 'Global Technology'],
    hardware: [
      mockHardware[2], // Dell XPS 15
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[12], // Dell Thunderbolt Dock
      mockHardware[15], // Sony WH-1000XM5
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[1], // Figma (for UI work)
    ],
    licenses: [],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    lastModified: new Date('2025-01-15'),
  },

  // Business Analyst Standard Package
  {
    id: 'pkg-ba-std-001',
    name: 'Business Analyst Standard',
    description: 'Standard package for Business Analysts and Data Analysts',
    // Phase 6: Role-based targeting
    roleTargets: [
      { departmentGroup: 'STR', role: 'Business Analyst' },
      { departmentGroup: 'STR', role: 'Data Analyst' },
      { departmentGroup: 'STR', role: 'Senior Business Analyst', grade: 'Senior' },
    ],
    osPreference: 'Windows',
    // Legacy fields (backward compatibility)
    roleTarget: ['Business Analyst', 'Data Analyst', 'Senior Business Analyst'],
    departmentTarget: ['STR', 'Operations', 'Finance'],
    hardware: [
      mockHardware[3], // Surface Laptop Studio 2
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[13], // AirPods Pro
      mockHardware[17], // USB-C Hub
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[9], // Airtable
    ],
    licenses: [],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    lastModified: new Date('2025-01-15'),
  },
];

// ============================================================================
// PACKAGE VERSIONS (Phase 3: Versioning System)
// ============================================================================
// Immutable snapshots of package configurations
// Each package gets v1 on creation, v2+ when modified

export const mockPackageVersions: PackageVersion[] = [
  // XD Designer Standard - Version 1 (Initial)
  {
    id: 'pkgver-xd-std-001-v1',
    packageId: 'pkg-xd-std-001',
    versionNumber: 1,
    snapshotDate: new Date('2025-01-15'),
    hardware: [
      mockHardware[0], // MacBook Pro 16" M3 Max
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[7], // Magic Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[11], // CalDigit TS4 Dock
      mockHardware[13], // AirPods Pro
      mockHardware[16], // Laptop Stand
    ],
    software: [
      mockSoftware[0], // Adobe CC
      mockSoftware[1], // Figma
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[7], // Miro
    ],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    notes: 'Initial version',
  },

  // XD Designer Premium - Version 1 (Initial)
  {
    id: 'pkgver-xd-prem-001-v1',
    packageId: 'pkg-xd-prem-001',
    versionNumber: 1,
    snapshotDate: new Date('2025-01-15'),
    hardware: [
      mockHardware[0], // MacBook Pro 16" M3 Max
      mockHardware[5], // LG UltraFine 32" 4K
      mockHardware[7], // Magic Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[11], // CalDigit TS4 Dock
      mockHardware[14], // Jabra Evolve2 85
      mockHardware[16], // Laptop Stand
    ],
    software: [
      mockSoftware[0], // Adobe CC
      mockSoftware[1], // Figma
      mockSoftware[2], // Cinema 4D
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[7], // Miro
    ],
    isStandard: false,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    notes: 'Initial version with Cinema 4D (requires approval)',
  },

  // Project Manager Standard - Version 1 (Initial)
  {
    id: 'pkgver-pm-std-001-v1',
    packageId: 'pkg-pm-std-001',
    versionNumber: 1,
    snapshotDate: new Date('2025-01-15'),
    hardware: [
      mockHardware[1], // MacBook Pro 14" M3 Pro
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[12], // Dell Thunderbolt Dock
      mockHardware[13], // AirPods Pro
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[8], // Notion
      mockSoftware[9], // Airtable
    ],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    notes: 'Initial version',
  },

  // Developer Standard - Version 1 (Initial)
  {
    id: 'pkgver-dev-std-001-v1',
    packageId: 'pkg-dev-std-001',
    versionNumber: 1,
    snapshotDate: new Date('2025-01-15'),
    hardware: [
      mockHardware[2], // Dell XPS 15
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[12], // Dell Thunderbolt Dock
      mockHardware[15], // Sony WH-1000XM5
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[1], // Figma
    ],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    notes: 'Initial version',
  },

  // Business Analyst Standard - Version 1 (Initial)
  {
    id: 'pkgver-ba-std-001-v1',
    packageId: 'pkg-ba-std-001',
    versionNumber: 1,
    snapshotDate: new Date('2025-01-15'),
    hardware: [
      mockHardware[3], // Surface Laptop Studio 2
      mockHardware[4], // Dell UltraSharp 27" 4K
      mockHardware[8], // MX Keys Keyboard
      mockHardware[9], // MX Master 3S
      mockHardware[13], // AirPods Pro
      mockHardware[17], // USB-C Hub
    ],
    software: [
      mockSoftware[4], // Microsoft 365
      mockSoftware[5], // Slack
      mockSoftware[6], // Zoom
      mockSoftware[9], // Airtable
    ],
    isStandard: true,
    createdBy: 'IT Admin',
    createdDate: new Date('2025-01-15'),
    notes: 'Initial version',
  },
];

// ============================================================================
// PACKAGE ASSIGNMENTS (Phase 3: Versioning System)
// ============================================================================
// Links pre-hires and employees to specific package versions
// Assignments are immutable - changing the package doesn't affect existing assignments

export const mockPackageAssignments: PackageAssignment[] = [
  // Jane Smith - Assigned XD Designer Standard v1
  {
    id: 'pkgasgn-001',
    preHireId: 'pre-2025-001',
    packageVersionId: 'pkgver-xd-std-001-v1',
    assignedDate: new Date('2025-11-01'),
    assignedBy: 'Camille (HR)',
    notes: 'Standard package for XD Designer role',
  },

  // Michael Chen - Assigned XD Designer Premium v1 (requires approval)
  {
    id: 'pkgasgn-002',
    preHireId: 'pre-2025-002',
    packageVersionId: 'pkgver-xd-prem-001-v1',
    assignedDate: new Date('2025-11-05'),
    assignedBy: 'Camille (HR)',
    notes: 'Premium package approved by hiring manager - includes Cinema 4D',
  },

  // Emily Rodriguez - Assigned Project Manager Standard v1
  {
    id: 'pkgasgn-003',
    preHireId: 'pre-2025-003',
    packageVersionId: 'pkgver-pm-std-001-v1',
    assignedDate: new Date('2025-11-10'),
    assignedBy: 'Payton (HR)',
    notes: 'Standard PM package',
  },
];

// ============================================================================
// PRE-HIRE RECORDS
// ============================================================================

export const mockPreHires: PreHire[] = [
  {
    id: 'pre-2025-001',
    candidateName: 'Jane Smith',
    email: 'jane.smith@momentumww.com',
    role: 'XD Designer',
    department: 'Creative',
    startDate: new Date('2025-12-01'), // During freeze period!
    hiringManager: 'Sarah Johnson',
    status: 'linked', // Updated to linked status
    assignedPackage: mockPackages[0], // XD Designer Standard
    // Phase 8: Employee linking example (100% exact match - auto-linked)
    employeeId: 'EMP003', // Linked to Michael Chen from vw_Personnel.csv
    linkedDate: new Date('2025-11-18'),
    linkConfidence: 'auto', // Auto-matched with 100% confidence
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-11-01'),
    lastModified: new Date('2025-11-18'),
  },
  {
    id: 'pre-2025-002',
    candidateName: 'Michael Chen',
    email: 'michael.chen@momentumww.com',
    role: 'Senior XD Designer',
    department: 'Creative',
    startDate: new Date('2025-12-15'), // During freeze period!
    hiringManager: 'Sarah Johnson',
    status: 'accepted',
    assignedPackage: mockPackages[1], // XD Designer Premium (exception - has Cinema 4D)
    customizations: {
      addedSoftware: [mockSoftware[2]], // Cinema 4D
      reason: 'Candidate has extensive 3D experience, will be working on automotive visualization projects',
    },
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-10-25'),
    lastModified: new Date('2025-11-03'),
  },
  {
    id: 'pre-2025-003',
    candidateName: 'Emily Rodriguez',
    email: 'emily.rodriguez@momentumww.com',
    role: 'Project Manager',
    department: 'STR',
    startDate: new Date('2025-11-20'),
    hiringManager: 'John Davis',
    status: 'offered',
    assignedPackage: mockPackages[2], // PM Standard
    createdBy: 'Payton (HR)',
    createdDate: new Date('2025-10-30'),
    lastModified: new Date('2025-11-10'),
  },
  {
    id: 'pre-2025-004',
    candidateName: 'David Kim',
    email: 'david.kim@momentumww.com',
    role: 'Full Stack Developer',
    department: 'IPCT',
    startDate: new Date('2025-11-25'),
    hiringManager: 'Steve Sanderson',
    status: 'linked', // Updated to linked status
    assignedPackage: mockPackages[3], // Developer Standard
    customizations: {
      addedHardware: [mockHardware[5]], // Upgraded to LG UltraFine 32"
      removedHardware: [mockHardware[4]], // Removed Dell 27"
      reason: 'Candidate requested larger screen for multi-window development work',
    },
    // Phase 8: Employee linking example (manually verified by HR)
    employeeId: 'EMP005', // Linked to David Kim from vw_Personnel.csv
    linkedDate: new Date('2025-11-15'),
    linkConfidence: 'verified', // HR verified this is the correct match
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-10-28'),
    lastModified: new Date('2025-11-15'),
  },
  {
    id: 'pre-2025-005',
    candidateName: 'Sarah Williams',
    email: 'sarah.williams@momentumww.com',
    role: 'Business Analyst',
    department: 'STR',
    startDate: new Date('2026-01-15'), // After freeze period
    hiringManager: 'Patricia Martinez',
    status: 'accepted',
    assignedPackage: mockPackages[4], // BA Standard
    customizations: {
      addedSoftware: [mockSoftware[3]], // Smartsheet (requires approval)
      reason: 'Team uses Smartsheet for project tracking, manager requested',
    },
    createdBy: 'Payton (HR)',
    createdDate: new Date('2025-11-05'),
    lastModified: new Date('2025-11-12'),
  },
  {
    id: 'pre-2025-006',
    candidateName: 'Robert Taylor',
    email: 'robert.taylor@momentumww.com',
    role: 'Motion Designer',
    department: 'IPTC',
    startDate: new Date('2025-12-10'), // During freeze period!
    hiringManager: 'Lisa Anderson',
    status: 'accepted',
    assignedPackage: mockPackages[0], // XD Designer Standard
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-11-01'),
    lastModified: new Date('2025-11-01'),
  },
  {
    id: 'pre-2025-007',
    candidateName: 'Amanda Brown',
    email: 'amanda.brown@momentumww.com',
    role: 'Senior Project Manager',
    department: 'PM',
    startDate: new Date('2025-11-22'),
    hiringManager: 'Mark Johnson',
    status: 'candidate',
    assignedPackage: mockPackages[2], // PM Standard
    createdBy: 'Payton (HR)',
    createdDate: new Date('2025-11-10'),
    lastModified: new Date('2025-11-10'),
  },
  {
    id: 'pre-2025-008',
    candidateName: 'James Wilson',
    email: 'james.wilson@momentumww.com',
    role: 'Data Analyst',
    department: 'Operations',
    startDate: new Date('2026-01-20'),
    hiringManager: 'Patricia Martinez',
    status: 'accepted',
    assignedPackage: mockPackages[4], // BA Standard
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-11-08'),
    lastModified: new Date('2025-11-11'),
  },
  {
    id: 'pre-2025-009',
    candidateName: 'Maria Garcia',
    email: 'maria.garcia@momentumww.com',
    role: 'XD Designer',
    department: 'Creative',
    startDate: new Date('2026-01-08'), // Just after freeze period
    hiringManager: 'Sarah Johnson',
    status: 'offered',
    assignedPackage: mockPackages[0], // XD Designer Standard
    createdBy: 'Payton (HR)',
    createdDate: new Date('2025-11-12'),
    lastModified: new Date('2025-11-13'),
  },
  {
    id: 'pre-2025-010',
    candidateName: 'Christopher Lee',
    email: 'christopher.lee@momentumww.com',
    role: 'Software Engineer',
    department: 'Global Technology',
    startDate: new Date('2025-11-28'),
    hiringManager: 'Steve Sanderson',
    status: 'accepted',
    assignedPackage: mockPackages[3], // Developer Standard
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-11-06'),
    lastModified: new Date('2025-11-09'),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pre-hires by status
 */
export function getPreHiresByStatus(status: PreHire['status']): PreHire[] {
  return mockPreHires.filter((ph) => ph.status === status);
}

/**
 * Get pre-hires by department
 */
export function getPreHiresByDepartment(department: string): PreHire[] {
  return mockPreHires.filter((ph) => ph.department === department);
}

/**
 * Get pre-hires starting during freeze period (Nov 1 - Jan 5)
 */
export function getPreHiresDuringFreezePeriod(): PreHire[] {
  return mockPreHires.filter((ph) => {
    const startDate = new Date(ph.startDate);
    const month = startDate.getMonth(); // 0-indexed: Nov=10, Dec=11, Jan=0
    const day = startDate.getDate();

    // Nov, Dec, or Jan 1-5
    return month === 10 || month === 11 || (month === 0 && day <= 5);
  });
}

/**
 * Get packages by role
 */
export function getPackagesByRole(role: string): Package[] {
  return mockPackages.filter((pkg) =>
    pkg.roleTarget.some((r) => r.toLowerCase().includes(role.toLowerCase()))
  );
}

/**
 * Get standard packages (auto-approve)
 */
export function getStandardPackages(): Package[] {
  return mockPackages.filter((pkg) => pkg.isStandard);
}

/**
 * Get exception packages (require SVP approval)
 */
export function getExceptionPackages(): Package[] {
  return mockPackages.filter((pkg) => !pkg.isStandard);
}

/**
 * Get hardware by type
 */
export function getHardwareByType(type: Hardware['type']): Hardware[] {
  return mockHardware.filter((hw) => hw.type === type);
}

/**
 * Get software requiring approval
 */
export function getSoftwareRequiringApproval(): Software[] {
  return mockSoftware.filter((sw) => sw.requiresApproval);
}

/**
 * Calculate total package cost with breakdown
 * Phase 2: Differentiates one-time vs recurring costs
 */
export function calculatePackageCost(pkg: Package): PackageCostBreakdown {
  // Hardware costs (always one-time)
  const oneTimeHardware = pkg.hardware.reduce((sum, hw) => {
    if (!hw.cost) return sum;
    // Hardware is one-time unless explicitly marked as subscription (e.g., leasing)
    return hw.costFrequency === 'subscription' ? sum : sum + hw.cost;
  }, 0);

  // Software costs (can be one-time, monthly, or annual)
  let oneTimeSoftware = 0;
  let monthlySoftware = 0;
  let annualSoftware = 0;

  [...pkg.software, ...pkg.licenses].forEach(sw => {
    if (!sw.cost) return;

    // Determine cost frequency
    const frequency = sw.costFrequency || sw.renewalFrequency || 'one-time';

    if (frequency === 'monthly') {
      monthlySoftware += sw.cost;
    } else if (frequency === 'annual') {
      annualSoftware += sw.cost;
    } else {
      // 'one-time' or perpetual licenses
      oneTimeSoftware += sw.cost;
    }
  });

  // Calculate totals
  const oneTimeTotal = oneTimeHardware + oneTimeSoftware;
  const monthlyTotal = monthlySoftware;
  const annualTotal = annualSoftware;
  const firstYearTotal = oneTimeTotal + (monthlyTotal * 12) + annualTotal;
  const ongoingAnnualTotal = (monthlyTotal * 12) + annualTotal;

  return {
    oneTimeTotal,
    monthlyTotal,
    annualTotal,
    firstYearTotal,
    ongoingAnnualTotal
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export const mockStatistics = {
  totalPreHires: mockPreHires.length,
  acceptedPreHires: getPreHiresByStatus('accepted').length,
  offeredPreHires: getPreHiresByStatus('offered').length,
  candidatePreHires: getPreHiresByStatus('candidate').length,
  linkedPreHires: getPreHiresByStatus('linked').length,
  freezePeriodPreHires: getPreHiresDuringFreezePeriod().length,
  totalPackages: mockPackages.length,
  standardPackages: getStandardPackages().length,
  exceptionPackages: getExceptionPackages().length,
  totalHardwareItems: mockHardware.length,
  totalSoftwareItems: mockSoftware.length,
  softwareRequiringApproval: getSoftwareRequiringApproval().length,
};

// ============================================================================
// APPROVAL REQUESTS
// ============================================================================

export const mockApprovalRequests: ApprovalRequest[] = [
  // Standard package - auto-approved
  {
    id: 'apr-2025-001',
    employeeId: mockPreHires[0].id,
    employeeName: mockPreHires[0].candidateName,
    requestType: 'equipment',
    items: [...mockPackages[0].hardware, ...mockPackages[0].software],
    packageId: mockPackages[0].id,
    requester: 'Camille (HR)',
    requestDate: new Date('2025-11-01T10:30:00'),
    approver: 'Auto',
    status: 'approved',
    helixTicketId: 'hx-2025-001',
    automatedDecision: true,
    approvalDate: new Date('2025-11-01T10:30:05'),
  },

  // Exception package - pending SVP approval (Cinema 4D)
  {
    id: 'apr-2025-002',
    employeeId: mockPreHires[1].id,
    employeeName: mockPreHires[1].candidateName,
    requestType: 'exception',
    items: [mockSoftware[2]], // Cinema 4D
    packageId: mockPackages[1].id,
    requester: 'Camille (HR)',
    requestDate: new Date('2025-11-03T14:15:00'),
    approver: 'Steve Sanderson',
    status: 'pending',
    automatedDecision: false,
    notes: 'Candidate has extensive 3D experience, will be working on automotive visualization projects',
  },

  // Mid-employment software request - pending approval (Smartsheet)
  {
    id: 'apr-2025-003',
    employeeId: mockPreHires[4].id,
    employeeName: mockPreHires[4].candidateName,
    requestType: 'mid-employment',
    items: [mockSoftware[3]], // Smartsheet
    requester: 'Patricia Martinez',
    requestDate: new Date('2025-11-12T09:45:00'),
    approver: 'Patricia',
    status: 'pending',
    automatedDecision: false,
    notes: 'Team uses Smartsheet for project tracking, manager requested',
  },

  // Standard package - approved
  {
    id: 'apr-2025-004',
    employeeId: mockPreHires[2].id,
    employeeName: mockPreHires[2].candidateName,
    requestType: 'equipment',
    items: [...mockPackages[2].hardware, ...mockPackages[2].software],
    packageId: mockPackages[2].id,
    requester: 'Payton (HR)',
    requestDate: new Date('2025-11-10T11:00:00'),
    approver: 'Auto',
    status: 'approved',
    helixTicketId: 'hx-2025-002',
    automatedDecision: true,
    approvalDate: new Date('2025-11-10T11:00:05'),
  },

  // Hardware customization - rejected (upgrade too expensive)
  {
    id: 'apr-2025-005',
    employeeId: mockPreHires[3].id,
    employeeName: mockPreHires[3].candidateName,
    requestType: 'equipment',
    items: [mockHardware[5]], // LG UltraFine 32"
    requester: 'Camille (HR)',
    requestDate: new Date('2025-11-08T16:20:00'),
    approver: 'Steve Sanderson',
    status: 'rejected',
    automatedDecision: false,
    approvalDate: new Date('2025-11-09T09:15:00'),
    rejectionReason: 'Budget constraints - standard 27" monitor sufficient for role',
    notes: 'Candidate requested larger screen for multi-window development work',
  },

  // Standard package with exception software - pending
  {
    id: 'apr-2025-006',
    employeeId: mockPreHires[5].id,
    employeeName: mockPreHires[5].candidateName,
    requestType: 'exception',
    items: [...mockPackages[0].hardware, ...mockPackages[0].software, mockSoftware[2]],
    packageId: mockPackages[0].id,
    requester: 'Camille (HR)',
    requestDate: new Date('2025-11-13T10:00:00'),
    approver: 'Steve Sanderson',
    status: 'pending',
    automatedDecision: false,
    notes: 'Standard XD package + Cinema 4D for specialized 3D work',
  },
];

// ============================================================================
// HELIX TICKETS
// ============================================================================

export const mockHelixTickets: HelixTicket[] = [
  // Equipment ticket for Jane Smith (freeze period)
  {
    id: 'hx-2025-001',
    type: 'new-hire',
    employeeId: mockPreHires[0].id,
    employeeName: mockPreHires[0].candidateName,
    requestedBy: 'Camille (HR)',
    status: 'in-progress',
    priority: 'high',
    createdDate: new Date('2025-11-01T10:30:10'),
    assignedTo: 'Chris Kumar',
    description: `New hire equipment provisioning for ${mockPreHires[0].candidateName} (${mockPreHires[0].role}). Start date: ${mockPreHires[0].startDate.toLocaleDateString()} (during freeze period). Requires password reset on start date.`,
    equipmentItems: [...mockPackages[0].hardware],
    approvalRequestId: 'apr-2025-001',
    scheduledAction: 'activate',
    actionDate: mockPreHires[0].startDate,
  },

  // Equipment ticket for Emily Rodriguez
  {
    id: 'hx-2025-002',
    type: 'equipment',
    employeeId: mockPreHires[2].id,
    employeeName: mockPreHires[2].candidateName,
    requestedBy: 'Payton (HR)',
    status: 'open',
    priority: 'medium',
    createdDate: new Date('2025-11-10T11:00:10'),
    assignedTo: 'IT Team',
    description: `Equipment provisioning for ${mockPreHires[2].candidateName} (${mockPreHires[2].role}). Start date: ${mockPreHires[2].startDate.toLocaleDateString()}.`,
    equipmentItems: [...mockPackages[2].hardware],
    approvalRequestId: 'apr-2025-004',
  },

  // Password reset ticket (freeze period)
  {
    id: 'hx-2025-003',
    type: 'password-reset',
    employeeId: mockPreHires[6].id,
    employeeName: mockPreHires[6].candidateName,
    requestedBy: 'System (Automated)',
    status: 'open',
    priority: 'high',
    createdDate: new Date('2025-12-10T08:00:00'),
    description: `${mockPreHires[6].candidateName} is starting work on ${mockPreHires[6].startDate.toLocaleDateString()}. Please reset their password and MFA and send credentials to ${mockPreHires[6].email || 'employee email'}.`,
    scheduledAction: 'activate',
    actionDate: mockPreHires[6].startDate,
  },

  // Software access request (resolved)
  {
    id: 'hx-2025-004',
    type: 'access-request',
    employeeId: mockPreHires[9].id,
    employeeName: mockPreHires[9].candidateName,
    requestedBy: 'Steve Sanderson',
    status: 'resolved',
    priority: 'low',
    createdDate: new Date('2025-11-09T14:30:00'),
    resolvedDate: new Date('2025-11-11T16:45:00'),
    assignedTo: 'Chris Kumar',
    description: `Software access setup for ${mockPreHires[9].candidateName} (${mockPreHires[9].role}).`,
    equipmentItems: [mockSoftware[4], mockSoftware[5], mockSoftware[6], mockSoftware[1]],
  },

  // Termination ticket (freeze period)
  {
    id: 'hx-2025-005',
    type: 'termination',
    employeeId: 'emp-terminated-001',
    employeeName: 'Former Employee',
    requestedBy: 'System (Automated)',
    status: 'resolved',
    priority: 'urgent',
    createdDate: new Date('2025-12-15T08:00:00'),
    resolvedDate: new Date('2025-12-15T09:30:00'),
    assignedTo: 'Chris Kumar',
    description: 'Former Employee is no longer with the company from Dec 15, 2025. Please reset their password and disable MFA.',
    scheduledAction: 'deactivate',
    actionDate: new Date('2025-12-15'),
  },
];

// ============================================================================
// FREEZE PERIODS
// ============================================================================

export const mockFreezePeriods: FreezePeriod[] = [
  {
    id: 'fp-2025-winter',
    name: 'Winter 2025 Workday Freeze',
    description: 'Annual winter freeze period for Workday system updates and maintenance',
    startDate: new Date('2025-11-20'),
    endDate: new Date('2026-01-05'),
    isActive: true,
    autoEmailEnabled: true,
    startDateSubject: 'Password Reset Required - {employeeName} Starting {startDate}',
    startDateBody: `Dear IT Team,

{employeeName} is starting work on {startDate}. Please reset their password and MFA and send credentials to {employeeEmail}.

Thank you,
HR Team`,
    endDateSubject: 'Account Termination - {employeeName} Ending {endDate}',
    endDateBody: `Dear IT Team,

{employeeName} is no longer with the company from {endDate}. Please reset their password and disable MFA.

Thank you,
HR Team`,
    helixEmail: 'helix@momentumww.com',
    ccRecipients: 'camille@momentumww.com;payton@momentumww.com',
    createdBy: 'Camille (HR)',
    createdDate: new Date('2025-10-01'),
    lastModified: new Date('2025-11-01'),
  },
  {
    id: 'fp-2026-summer',
    name: 'Summer 2026 System Upgrade',
    description: 'Summer freeze for major IT infrastructure upgrades',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-15'),
    isActive: false,
    autoEmailEnabled: false,
    startDateSubject: 'New Hire - {employeeName}',
    startDateBody: 'Standard start date email template',
    endDateSubject: 'Termination - {employeeName}',
    endDateBody: 'Standard end date email template',
    helixEmail: 'helix@momentumww.com',
    ccRecipients: 'hr-team@momentumww.com',
    createdBy: 'Patricia',
    createdDate: new Date('2026-05-01'),
    lastModified: new Date('2026-06-01'),
  },
];

// ============================================================================
// EMPLOYEES
// ============================================================================

export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    activeDirectoryId: 'ad-12345',
    workdayId: 'wd-67890',
    name: 'John Smith',
    email: 'john.smith@momentumww.com',
    department: 'Creative',
    role: 'Senior XD Designer',
    startDate: new Date('2023-03-15'),
    manager: 'Jane Doe',
    assignedPackage: undefined,
    actualHardware: [],
    actualSoftware: [],
    onboardingStatus: 'active',
    onboardingPhases: {
      adCreated: new Date('2023-03-10'),
      vantageCreated: new Date('2023-03-12'),
      workdayCreated: new Date('2023-03-14'),
      equipmentOrdered: new Date('2023-03-15'),
      equipmentReceived: new Date('2023-03-18'),
      onboardingComplete: new Date('2023-03-20'),
    },
    isPreloaded: false,
    needsPasswordReset: false,
    createdBy: 'System',
    createdDate: new Date('2023-03-10'),
    lastModified: new Date('2023-03-20'),
  },
  {
    id: 'emp-002',
    activeDirectoryId: 'ad-23456',
    workdayId: 'wd-78901',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@momentumww.com',
    department: 'Strategy',
    role: 'Account Director',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2025-12-20'),
    manager: 'Michael Chen',
    assignedPackage: undefined,
    actualHardware: [],
    actualSoftware: [],
    onboardingStatus: 'active',
    onboardingPhases: {
      adCreated: new Date('2024-05-25'),
      vantageCreated: new Date('2024-05-28'),
      workdayCreated: new Date('2024-05-30'),
      equipmentOrdered: new Date('2024-06-01'),
      equipmentReceived: new Date('2024-06-03'),
      onboardingComplete: new Date('2024-06-05'),
    },
    isPreloaded: true,
    needsPasswordReset: false,
    createdBy: 'System',
    createdDate: new Date('2024-05-25'),
    lastModified: new Date('2025-12-01'),
  },
];

// ============================================================================
// FREEZE PERIOD NOTIFICATIONS
// ============================================================================

export const mockFreezePeriodNotifications: FreezePeriodNotification[] = [
  {
    id: 'notif-001',
    freezePeriodId: 'fp-2025-winter',
    employeeId: 'pre-2025-004',
    employeeName: 'Emily Rodriguez',
    employeeEmail: 'emily.rodriguez@momentumww.com',
    actionType: 'start',
    actionDate: new Date('2025-12-01'),
    status: 'pending',
    generatedDate: new Date('2025-11-25'),
    emailSubject: 'Password Reset Required - Emily Rodriguez Starting Dec 1, 2025',
    emailBody: `Dear IT Team,

Emily Rodriguez is starting work on Dec 1, 2025. Please reset their password and MFA and send credentials to emily.rodriguez@momentumww.com.

Thank you,
HR Team`,
  },
  {
    id: 'notif-002',
    freezePeriodId: 'fp-2025-winter',
    employeeId: 'emp-002',
    employeeName: 'Sarah Johnson',
    employeeEmail: 'sarah.johnson@momentumww.com',
    actionType: 'end',
    actionDate: new Date('2025-12-20'),
    status: 'pending',
    generatedDate: new Date('2025-12-15'),
    emailSubject: 'Account Termination - Sarah Johnson Ending Dec 20, 2025',
    emailBody: `Dear IT Team,

Sarah Johnson is no longer with the company from Dec 20, 2025. Please reset their password and disable MFA.

Thank you,
HR Team`,
  },
  {
    id: 'notif-003',
    freezePeriodId: 'fp-2025-winter',
    employeeId: 'pre-2025-005',
    employeeName: 'Michael Chen',
    employeeEmail: 'michael.chen@momentumww.com',
    actionType: 'start',
    actionDate: new Date('2025-12-05'),
    status: 'sent',
    generatedDate: new Date('2025-11-30'),
    sentDate: new Date('2025-12-05T09:00:00'),
    sentBy: 'Power Automate',
    emailSubject: 'Password Reset Required - Michael Chen Starting Dec 5, 2025',
    emailBody: `Dear IT Team,

Michael Chen is starting work on Dec 5, 2025. Please reset their password and MFA and send credentials to michael.chen@momentumww.com.

Thank you,
HR Team`,
  },
];

// ============================================================================
// APPROVAL HELPER FUNCTIONS
// ============================================================================

/**
 * Get approvals by status
 */
export function getApprovalsByStatus(status: ApprovalRequest['status']): ApprovalRequest[] {
  return mockApprovalRequests.filter((a) => a.status === status);
}

/**
 * Get pending approvals
 */
export function getPendingApprovals(): ApprovalRequest[] {
  return getApprovalsByStatus('pending');
}

/**
 * Get approved approvals
 */
export function getApprovedApprovals(): ApprovalRequest[] {
  return getApprovalsByStatus('approved');
}

/**
 * Get rejected approvals
 */
export function getRejectedApprovals(): ApprovalRequest[] {
  return getApprovalsByStatus('rejected');
}

/**
 * Get approvals by request type
 */
export function getApprovalsByType(type: ApprovalRequest['requestType']): ApprovalRequest[] {
  return mockApprovalRequests.filter((a) => a.requestType === type);
}

// ============================================================================
// HELIX TICKET HELPER FUNCTIONS
// ============================================================================

/**
 * Get tickets by status
 */
export function getTicketsByStatus(status: HelixTicket['status']): HelixTicket[] {
  return mockHelixTickets.filter((t) => t.status === status);
}

/**
 * Get tickets by type
 */
export function getTicketsByType(type: HelixTicket['type']): HelixTicket[] {
  return mockHelixTickets.filter((t) => t.type === type);
}

/**
 * Get freeze period tickets
 */
export function getFreezePeriodTickets(): HelixTicket[] {
  return mockHelixTickets.filter((t) => t.scheduledAction !== undefined);
}

/**
 * Get open tickets
 */
export function getOpenTickets(): HelixTicket[] {
  return getTicketsByStatus('open');
}

/**
 * Get in-progress tickets
 */
export function getInProgressTickets(): HelixTicket[] {
  return getTicketsByStatus('in-progress');
}

/**
 * Get resolved tickets
 */
export function getResolvedTickets(): HelixTicket[] {
  return [...getTicketsByStatus('resolved'), ...getTicketsByStatus('closed')];
}

// ============================================================================
// APPROVAL STATISTICS
// ============================================================================

export const mockApprovalStatistics = {
  totalPending: getPendingApprovals().length,
  totalApproved: getApprovedApprovals().length,
  totalRejected: getRejectedApprovals().length,
  approvedToday: 2,
  rejectedToday: 1,
  averageApprovalTime: 4.5, // hours
  openTickets: getOpenTickets().length,
  inProgressTickets: getInProgressTickets().length,
  resolvedTickets: getResolvedTickets().length,
  freezePeriodTickets: getFreezePeriodTickets().length,
};
