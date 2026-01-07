// ============================================================================
// MOMENTUM KNOWLEDGE ASSISTANT - MOCK DATA
// ============================================================================
// Mock data for testing chat functionality

import { ChatbotPersonnelData } from '../types';

/**
 * Mock personnel data for department lookup testing
 * Used to test department-based access control
 */
export const mockPersonnelData: ChatbotPersonnelData[] = [
  {
    emailAddress: 'steve.sanderson@momentumww.com',
    name: 'Steve Sanderson',
    department: 'Production: Global Technology',
    departmentGroup: 'Global Technology',
    role: 'SVP, Global Technology',
    managerName: null,
    managerEmail: null,
  },
  {
    emailAddress: 'luis.bustos@ipgdxtra.com',
    name: 'Luis Bustos',
    department: 'IP & CT',
    departmentGroup: 'IP & CT',
    role: 'Senior Developer',
    managerName: 'Steve Sanderson',
    managerEmail: 'steve.sanderson@momentumww.com',
  },
  {
    emailAddress: 'test.user@momentumww.com',
    name: 'Test User',
    department: 'General',
    departmentGroup: 'General',
    role: 'Employee',
    managerName: null,
    managerEmail: null,
  },
];
