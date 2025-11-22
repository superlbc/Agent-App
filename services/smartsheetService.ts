// ============================================================================
// SMARTSHEET SERVICE
// ============================================================================
// Integration with Smartsheet for campaign/event tracking and project management

import { Campaign, Event } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SmartsheetConfig {
  accessToken: string;
  baseUrl: string;
  useMockData?: boolean;
}

export interface SmartsheetSheet {
  id: string;
  name: string;
  permalink: string;
  columns: SmartsheetColumn[];
  rows?: SmartsheetRow[];
  createdAt: string;
  modifiedAt: string;
}

export interface SmartsheetColumn {
  id: string;
  title: string;
  type: 'TEXT_NUMBER' | 'DATE' | 'CONTACT_LIST' | 'PICKLIST' | 'CHECKBOX';
  primary?: boolean;
  index: number;
}

export interface SmartsheetRow {
  id: string;
  rowNumber: number;
  cells: SmartsheetCell[];
  createdAt: string;
  modifiedAt: string;
}

export interface SmartsheetCell {
  columnId: string;
  value?: string | number | boolean;
  displayValue?: string;
}

export interface SmartsheetTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'campaign' | 'event' | 'custom';
}

export interface CreateSheetResult {
  success: boolean;
  sheet?: SmartsheetSheet;
  error?: string;
}

export interface UpdateRowResult {
  success: boolean;
  row?: SmartsheetRow;
  error?: string;
}

// ============================================================================
// SMARTSHEET CLIENT
// ============================================================================

class SmartsheetClient {
  private config: SmartsheetConfig;
  private useMock: boolean;

  constructor(config: SmartsheetConfig) {
    this.config = config;
    this.useMock = config.useMockData || !config.accessToken || config.accessToken === 'your-smartsheet-token';
  }

  /**
   * Make API request to Smartsheet
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useMock) {
      console.log('[SmartsheetService] Using mock data for:', endpoint);
      return this.getMockResponse<T>(endpoint, options);
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'Smartsheet API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('[SmartsheetService] API Error:', error);
      throw error;
    }
  }

  /**
   * Mock response generator for MVP testing
   */
  private getMockResponse<T>(endpoint: string, options: RequestInit): T {
    const method = options.method || 'GET';

    // Mock sheet creation
    if (endpoint.includes('/sheets') && method === 'POST') {
      const sheetId = `ss_${Date.now()}`;
      return {
        result: {
          id: sheetId,
          name: 'Mock Campaign Tracker',
          permalink: `https://app.smartsheet.com/sheets/${sheetId}`,
          columns: this.getMockColumns(),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        },
      } as T;
    }

    // Mock row update
    if (endpoint.includes('/rows') && method === 'PUT') {
      return {
        result: {
          id: `row_${Date.now()}`,
          rowNumber: 1,
          cells: [],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        },
      } as T;
    }

    // Mock sheet data retrieval
    if (endpoint.includes('/sheets/') && method === 'GET') {
      return {
        id: endpoint.split('/')[2],
        name: 'Campaign Tracker',
        columns: this.getMockColumns(),
        rows: this.getMockRows(),
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      } as T;
    }

    return { success: true } as T;
  }

  /**
   * Get mock columns for testing
   */
  private getMockColumns(): SmartsheetColumn[] {
    return [
      { id: 'col1', title: 'Event Name', type: 'TEXT_NUMBER', primary: true, index: 0 },
      { id: 'col2', title: 'Start Date', type: 'DATE', index: 1 },
      { id: 'col3', title: 'End Date', type: 'DATE', index: 2 },
      { id: 'col4', title: 'Venue', type: 'TEXT_NUMBER', index: 3 },
      { id: 'col5', title: 'City', type: 'TEXT_NUMBER', index: 4 },
      { id: 'col6', title: 'Status', type: 'PICKLIST', index: 5 },
      { id: 'col7', title: 'Owner', type: 'CONTACT_LIST', index: 6 },
    ];
  }

  /**
   * Get mock rows for testing
   */
  private getMockRows(): SmartsheetRow[] {
    return [
      {
        id: 'row1',
        rowNumber: 1,
        cells: [
          { columnId: 'col1', value: 'Sample Event 1', displayValue: 'Sample Event 1' },
          { columnId: 'col2', value: '2025-06-15', displayValue: '06/15/2025' },
          { columnId: 'col3', value: '2025-06-17', displayValue: '06/17/2025' },
          { columnId: 'col4', value: 'Madison Square Garden', displayValue: 'Madison Square Garden' },
          { columnId: 'col5', value: 'New York', displayValue: 'New York' },
          { columnId: 'col6', value: 'Active', displayValue: 'Active' },
        ],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Create Smartsheet from template
   */
  async createSheet(campaign: Campaign, templateId?: string): Promise<SmartsheetSheet> {
    const sheetData = {
      name: `${campaign.campaignName} - Event Tracker`,
      fromId: templateId, // If provided, create from template
      columns: templateId ? undefined : [
        { title: 'Event Name', type: 'TEXT_NUMBER', primary: true },
        { title: 'Start Date', type: 'DATE' },
        { title: 'End Date', type: 'DATE' },
        { title: 'Venue', type: 'TEXT_NUMBER' },
        { title: 'City', type: 'TEXT_NUMBER' },
        { title: 'Country', type: 'TEXT_NUMBER' },
        { title: 'Status', type: 'PICKLIST', options: ['Planning', 'Active', 'Completed', 'Cancelled'] },
        { title: 'Owner', type: 'CONTACT_LIST' },
        { title: 'Notes', type: 'TEXT_NUMBER' },
      ],
    };

    const response = await this.request<{ result: SmartsheetSheet }>('/sheets', {
      method: 'POST',
      body: JSON.stringify(sheetData),
    });

    return response.result;
  }

  /**
   * Add event as row to Smartsheet
   */
  async addEventRow(sheetId: string, event: Event): Promise<SmartsheetRow> {
    const sheet = await this.getSheet(sheetId);

    const rowData = {
      toTop: true,
      cells: [
        { columnId: this.findColumnId(sheet, 'Event Name'), value: event.eventName },
        { columnId: this.findColumnId(sheet, 'Start Date'), value: event.eventStartDate.toISOString().split('T')[0] },
        { columnId: this.findColumnId(sheet, 'End Date'), value: event.eventEndDate.toISOString().split('T')[0] },
        { columnId: this.findColumnId(sheet, 'Venue'), value: event.eventVenue || '' },
        { columnId: this.findColumnId(sheet, 'City'), value: event.city },
        { columnId: this.findColumnId(sheet, 'Country'), value: event.country },
        { columnId: this.findColumnId(sheet, 'Status'), value: this.capitalizeStatus(event.status) },
        { columnId: this.findColumnId(sheet, 'Owner'), value: event.ownerName },
        { columnId: this.findColumnId(sheet, 'Notes'), value: event.eventNotes || '' },
      ].filter(cell => cell.columnId), // Remove cells without column IDs
    };

    const response = await this.request<{ result: SmartsheetRow[] }>(`/sheets/${sheetId}/rows`, {
      method: 'POST',
      body: JSON.stringify([rowData]),
    });

    return response.result[0];
  }

  /**
   * Update event row in Smartsheet
   */
  async updateEventRow(sheetId: string, rowId: string, event: Partial<Event>): Promise<SmartsheetRow> {
    const sheet = await this.getSheet(sheetId);

    const cells: SmartsheetCell[] = [];

    if (event.eventName) {
      cells.push({ columnId: this.findColumnId(sheet, 'Event Name'), value: event.eventName });
    }
    if (event.eventStartDate) {
      cells.push({ columnId: this.findColumnId(sheet, 'Start Date'), value: event.eventStartDate.toISOString().split('T')[0] });
    }
    if (event.eventEndDate) {
      cells.push({ columnId: this.findColumnId(sheet, 'End Date'), value: event.eventEndDate.toISOString().split('T')[0] });
    }
    if (event.status) {
      cells.push({ columnId: this.findColumnId(sheet, 'Status'), value: this.capitalizeStatus(event.status) });
    }

    const rowData = {
      id: rowId,
      cells: cells.filter(cell => cell.columnId),
    };

    const response = await this.request<{ result: SmartsheetRow[] }>(`/sheets/${sheetId}/rows`, {
      method: 'PUT',
      body: JSON.stringify([rowData]),
    });

    return response.result[0];
  }

  /**
   * Get sheet data
   */
  async getSheet(sheetId: string): Promise<SmartsheetSheet> {
    return this.request<SmartsheetSheet>(`/sheets/${sheetId}`);
  }

  /**
   * Get all sheets
   */
  async getAllSheets(): Promise<SmartsheetSheet[]> {
    const response = await this.request<{ data: SmartsheetSheet[] }>('/sheets');
    return response.data || [];
  }

  /**
   * Find column ID by title
   */
  private findColumnId(sheet: SmartsheetSheet, columnTitle: string): string {
    const column = sheet.columns.find(col => col.title === columnTitle);
    return column?.id || '';
  }

  /**
   * Capitalize status for Smartsheet
   */
  private capitalizeStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Test connection to Smartsheet API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.useMock) {
      return {
        success: true,
        message: 'Mock mode: Connection test simulated successfully',
      };
    }

    try {
      await this.request('/users/me');
      return {
        success: true,
        message: 'Connection to Smartsheet API successful',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

let smartsheetClient: SmartsheetClient | null = null;

/**
 * Initialize Smartsheet service with configuration
 */
export function initializeSmartsheetService(config: SmartsheetConfig): void {
  smartsheetClient = new SmartsheetClient(config);
}

/**
 * Get Smartsheet client instance
 */
function getClient(): SmartsheetClient {
  if (!smartsheetClient) {
    const config: SmartsheetConfig = {
      accessToken: import.meta.env.VITE_SMARTSHEET_ACCESS_TOKEN || 'your-smartsheet-token',
      baseUrl: import.meta.env.VITE_SMARTSHEET_API_URL || 'https://api.smartsheet.com/2.0',
      useMockData: true, // Default to mock for MVP
    };
    smartsheetClient = new SmartsheetClient(config);
  }
  return smartsheetClient;
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function createCampaignSheet(campaign: Campaign, templateId?: string): Promise<SmartsheetSheet> {
  return getClient().createSheet(campaign, templateId);
}

export async function addEventToSheet(sheetId: string, event: Event): Promise<SmartsheetRow> {
  return getClient().addEventRow(sheetId, event);
}

export async function updateEventInSheet(sheetId: string, rowId: string, event: Partial<Event>): Promise<SmartsheetRow> {
  return getClient().updateEventRow(sheetId, rowId, event);
}

export async function getSmartsheet(sheetId: string): Promise<SmartsheetSheet> {
  return getClient().getSheet(sheetId);
}

export async function getAllSmartsheets(): Promise<SmartsheetSheet[]> {
  return getClient().getAllSheets();
}

export async function testSmartsheetConnection(): Promise<{ success: boolean; message: string }> {
  return getClient().testConnection();
}
