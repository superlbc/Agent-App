// ============================================================================
// QRTIGER SERVICE
// ============================================================================
// Integration with QRtiger for QR code generation and scan tracking

import { Event } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QRTigerConfig {
  apiKey: string;
  baseUrl: string;
  useMockData?: boolean;
}

export interface QRTigerCode {
  id: string;
  qrCodeUrl: string; // URL to QR code image
  shortUrl: string; // Shortened tracking URL
  destinationUrl: string; // Target URL
  name: string;
  status: 'active' | 'paused' | 'archived';
  type: 'url' | 'text' | 'vcard' | 'event';
  createdAt: string;
  updatedAt: string;
  totalScans?: number;
}

export interface QRTigerStats {
  qrCodeId: string;
  totalScans: number;
  uniqueScans: number;
  scansByDate: { date: string; scans: number }[];
  scansByDevice: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  scansByLocation: {
    country: string;
    city?: string;
    scans: number;
  }[];
  lastScannedAt?: string;
}

export interface QRCodeGenerateOptions {
  name: string;
  destinationUrl: string;
  type?: 'url' | 'text' | 'vcard' | 'event';
  customization?: {
    foregroundColor?: string;
    backgroundColor?: string;
    logoUrl?: string;
    frameText?: string;
  };
}

export interface QRCodeUpdateOptions {
  name?: string;
  destinationUrl?: string;
  status?: 'active' | 'paused' | 'archived';
}

// ============================================================================
// QRTIGER CLIENT
// ============================================================================

class QRTigerClient {
  private config: QRTigerConfig;
  private useMock: boolean;

  constructor(config: QRTigerConfig) {
    this.config = config;
    this.useMock = config.useMockData || !config.apiKey || config.apiKey === 'your-qrtiger-api-key';
  }

  /**
   * Make API request to QRtiger
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useMock) {
      console.log('[QRTigerService] Using mock data for:', endpoint);
      return this.getMockResponse<T>(endpoint, options);
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || 'QRtiger API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('[QRTigerService] API Error:', error);
      throw error;
    }
  }

  /**
   * Mock response generator for MVP testing
   */
  private getMockResponse<T>(endpoint: string, options: RequestInit): T {
    const method = options.method || 'GET';

    // Mock QR code generation
    if (endpoint.includes('/qrcodes') && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const qrId = `qr_${Date.now()}`;
      return {
        id: qrId,
        qrCodeUrl: `https://api.qrtiger.com/qr/${qrId}.png`,
        shortUrl: `https://qr.page/${qrId}`,
        destinationUrl: body.destinationUrl || 'https://example.com',
        name: body.name || 'Mock QR Code',
        status: 'active',
        type: body.type || 'url',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalScans: 0,
      } as T;
    }

    // Mock QR code stats
    if (endpoint.includes('/stats') || endpoint.includes('/analytics')) {
      const qrId = endpoint.split('/')[2];
      return {
        qrCodeId: qrId,
        totalScans: Math.floor(Math.random() * 1000) + 100,
        uniqueScans: Math.floor(Math.random() * 800) + 80,
        scansByDate: this.generateMockScansByDate(),
        scansByDevice: {
          mobile: 75,
          tablet: 15,
          desktop: 10,
        },
        scansByLocation: [
          { country: 'United States', city: 'New York', scans: 120 },
          { country: 'United States', city: 'Los Angeles', scans: 95 },
          { country: 'United Kingdom', city: 'London', scans: 45 },
        ],
        lastScannedAt: new Date().toISOString(),
      } as T;
    }

    // Mock QR code update
    if (endpoint.includes('/qrcodes/') && method === 'PUT') {
      const qrId = endpoint.split('/')[2];
      return {
        id: qrId,
        status: 'active',
        updatedAt: new Date().toISOString(),
      } as T;
    }

    // Mock QR code retrieval
    if (endpoint.includes('/qrcodes/') && method === 'GET') {
      const qrId = endpoint.split('/')[2];
      return {
        id: qrId,
        qrCodeUrl: `https://api.qrtiger.com/qr/${qrId}.png`,
        shortUrl: `https://qr.page/${qrId}`,
        destinationUrl: 'https://example.com',
        name: 'Mock QR Code',
        status: 'active',
        type: 'url',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalScans: 234,
      } as T;
    }

    return { success: true } as T;
  }

  /**
   * Generate mock scans by date
   */
  private generateMockScansByDate(): { date: string; scans: number }[] {
    const days = 7;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      result.push({
        date: date.toISOString().split('T')[0],
        scans: Math.floor(Math.random() * 100) + 10,
      });
    }

    return result;
  }

  /**
   * Generate QR code
   */
  async generateQRCode(options: QRCodeGenerateOptions): Promise<QRTigerCode> {
    const qrData = {
      name: options.name,
      qr_type: options.type || 'url',
      destination_url: options.destinationUrl,
      customization: options.customization,
    };

    const response = await this.request<QRTigerCode>('/qrcodes', {
      method: 'POST',
      body: JSON.stringify(qrData),
    });

    return response;
  }

  /**
   * Generate QR code for event
   */
  async generateEventQRCode(event: Event, surveyUrl?: string): Promise<QRTigerCode> {
    const destinationUrl = surveyUrl || `https://uxp.momentum.com/events/${event.id}`;

    return this.generateQRCode({
      name: `${event.eventName} - QR Code`,
      destinationUrl,
      type: 'url',
      customization: {
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        frameText: event.eventName,
      },
    });
  }

  /**
   * Get QR code by ID
   */
  async getQRCode(qrCodeId: string): Promise<QRTigerCode> {
    return this.request<QRTigerCode>(`/qrcodes/${qrCodeId}`);
  }

  /**
   * Get scan statistics
   */
  async getScanStats(qrCodeId: string): Promise<QRTigerStats> {
    return this.request<QRTigerStats>(`/qrcodes/${qrCodeId}/analytics`);
  }

  /**
   * Update QR code
   */
  async updateQRCode(qrCodeId: string, options: QRCodeUpdateOptions): Promise<QRTigerCode> {
    const updateData: any = {};

    if (options.name) updateData.name = options.name;
    if (options.destinationUrl) updateData.destination_url = options.destinationUrl;
    if (options.status) updateData.status = options.status;

    return this.request<QRTigerCode>(`/qrcodes/${qrCodeId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Pause QR code (stops tracking but keeps data)
   */
  async pauseQRCode(qrCodeId: string): Promise<QRTigerCode> {
    return this.updateQRCode(qrCodeId, { status: 'paused' });
  }

  /**
   * Resume QR code (restart tracking)
   */
  async resumeQRCode(qrCodeId: string): Promise<QRTigerCode> {
    return this.updateQRCode(qrCodeId, { status: 'active' });
  }

  /**
   * Archive QR code (soft delete)
   */
  async archiveQRCode(qrCodeId: string): Promise<QRTigerCode> {
    return this.updateQRCode(qrCodeId, { status: 'archived' });
  }

  /**
   * Get all QR codes
   */
  async getAllQRCodes(filters?: {
    status?: 'active' | 'paused' | 'archived';
    type?: 'url' | 'text' | 'vcard' | 'event';
  }): Promise<QRTigerCode[]> {
    let endpoint = '/qrcodes';

    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      endpoint += `?${params.toString()}`;
    }

    const response = await this.request<{ data: QRTigerCode[] }>(endpoint);
    return response.data || [];
  }

  /**
   * Bulk generate QR codes for multiple events
   */
  async bulkGenerateEventQRCodes(events: Event[], surveyBaseUrl?: string): Promise<{
    success: QRTigerCode[];
    failed: { event: Event; error: string }[];
  }> {
    const success: QRTigerCode[] = [];
    const failed: { event: Event; error: string }[] = [];

    for (const event of events) {
      try {
        const surveyUrl = surveyBaseUrl
          ? `${surveyBaseUrl}?eventId=${event.id}`
          : undefined;

        const qrCode = await this.generateEventQRCode(event, surveyUrl);
        success.push(qrCode);
      } catch (error) {
        failed.push({
          event,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, failed };
  }

  /**
   * Test connection to QRtiger API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (this.useMock) {
      return {
        success: true,
        message: 'Mock mode: Connection test simulated successfully',
      };
    }

    try {
      await this.request('/account');
      return {
        success: true,
        message: 'Connection to QRtiger API successful',
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

let qrTigerClient: QRTigerClient | null = null;

/**
 * Initialize QRtiger service with configuration
 */
export function initializeQRTigerService(config: QRTigerConfig): void {
  qrTigerClient = new QRTigerClient(config);
}

/**
 * Get QRtiger client instance
 */
function getClient(): QRTigerClient {
  if (!qrTigerClient) {
    const config: QRTigerConfig = {
      apiKey: import.meta.env.VITE_QRTIGER_API_KEY || 'your-qrtiger-api-key',
      baseUrl: import.meta.env.VITE_QRTIGER_API_URL || 'https://api.qrtiger.com/v1',
      useMockData: true, // Default to mock for MVP
    };
    qrTigerClient = new QRTigerClient(config);
  }
  return qrTigerClient;
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function createQRCode(options: QRCodeGenerateOptions): Promise<QRTigerCode> {
  return getClient().generateQRCode(options);
}

export async function createEventQRCode(event: Event, surveyUrl?: string): Promise<QRTigerCode> {
  return getClient().generateEventQRCode(event, surveyUrl);
}

export async function getQRCodeById(qrCodeId: string): Promise<QRTigerCode> {
  return getClient().getQRCode(qrCodeId);
}

export async function getQRCodeStats(qrCodeId: string): Promise<QRTigerStats> {
  return getClient().getScanStats(qrCodeId);
}

export async function updateQRCodeStatus(
  qrCodeId: string,
  status: 'active' | 'paused' | 'archived'
): Promise<QRTigerCode> {
  return getClient().updateQRCode(qrCodeId, { status });
}

export async function pauseQRCode(qrCodeId: string): Promise<QRTigerCode> {
  return getClient().pauseQRCode(qrCodeId);
}

export async function resumeQRCode(qrCodeId: string): Promise<QRTigerCode> {
  return getClient().resumeQRCode(qrCodeId);
}

export async function archiveQRCode(qrCodeId: string): Promise<QRTigerCode> {
  return getClient().archiveQRCode(qrCodeId);
}

export async function getAllQRCodes(filters?: {
  status?: 'active' | 'paused' | 'archived';
  type?: 'url' | 'text' | 'vcard' | 'event';
}): Promise<QRTigerCode[]> {
  return getClient().getAllQRCodes(filters);
}

export async function bulkCreateEventQRCodes(events: Event[], surveyBaseUrl?: string) {
  return getClient().bulkGenerateEventQRCodes(events, surveyBaseUrl);
}

export async function testQRTigerConnection(): Promise<{ success: boolean; message: string }> {
  return getClient().testConnection();
}
