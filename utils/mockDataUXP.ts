// Mock data for UXP Event Management components
import { Event } from '../components/events/EventCard';

export const mockClients = [
  { id: 'client-1', name: 'Verizon' },
  { id: 'client-2', name: 'American Express' },
  { id: 'client-3', name: 'Coca-Cola' },
  { id: 'client-4', name: 'Constellation Brands' }
];

export const mockPrograms = [
  { id: 'prog-1', name: 'Verizon Hyperlocal', clientId: 'client-1' },
  { id: 'prog-2', name: 'Verizon 5G Rollout', clientId: 'client-1' },
  { id: 'prog-3', name: 'AMEX US Open', clientId: 'client-2' },
  { id: 'prog-4', name: 'AMEX Card Member Events', clientId: 'client-2' },
  { id: 'prog-5', name: 'Coca-Cola Sampling Tour', clientId: 'client-3' },
  { id: 'prog-6', name: 'Corona Extra Beach Series', clientId: 'client-4' }
];

export const mockUsers = [
  { id: 'user-1', name: 'Patricia Williams', email: 'patricia@momentumww.com' },
  { id: 'user-2', name: 'Steve Sanderson', email: 'steve@momentumww.com' },
  { id: 'user-3', name: 'John Martinez', email: 'john.m@momentumww.com' },
  { id: 'user-4', name: 'Sarah Johnson', email: 'sarah.j@momentumww.com' },
  { id: 'user-5', name: 'Mike Chen', email: 'mike.c@momentumww.com' }
];

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    masterProgramId: 'prog-1',
    programName: 'Verizon Hyperlocal',
    clientName: 'Verizon',
    eventName: 'Verizon 5G Experience NYC',
    eventDate: new Date('2025-12-15'),
    startTime: '10:00',
    endTime: '18:00',
    venueName: 'Times Square',
    city: 'New York',
    state: 'NY',
    status: 'confirmed',
    businessLeaderName: 'Patricia Williams',
    brandscopicSyncStatus: 'synced'
  },
  {
    id: 'event-2',
    masterProgramId: 'prog-3',
    programName: 'AMEX US Open',
    clientName: 'American Express',
    eventName: 'AMEX Fan Experience Lounge',
    eventDate: new Date('2025-12-20'),
    startTime: '09:00',
    endTime: '21:00',
    venueName: 'Arthur Ashe Stadium',
    city: 'Flushing',
    state: 'NY',
    status: 'confirmed',
    businessLeaderName: 'Steve Sanderson',
    brandscopicSyncStatus: 'synced'
  },
  {
    id: 'event-3',
    masterProgramId: 'prog-5',
    programName: 'Coca-Cola Sampling Tour',
    clientName: 'Coca-Cola',
    eventName: 'Coke Zero Sugar Sampling',
    eventDate: new Date('2025-11-28'),
    startTime: '11:00',
    endTime: '19:00',
    venueName: 'Santa Monica Pier',
    city: 'Santa Monica',
    state: 'CA',
    status: 'active',
    businessLeaderName: 'John Martinez',
    brandscopicSyncStatus: 'pending'
  },
  {
    id: 'event-4',
    masterProgramId: 'prog-2',
    programName: 'Verizon 5G Rollout',
    clientName: 'Verizon',
    eventName: '5G Demo at Tech Conference',
    eventDate: new Date('2025-12-01'),
    startTime: '08:00',
    endTime: '17:00',
    venueName: 'Moscone Center',
    city: 'San Francisco',
    state: 'CA',
    status: 'tentative',
    businessLeaderName: 'Sarah Johnson',
    brandscopicSyncStatus: 'pending'
  },
  {
    id: 'event-5',
    masterProgramId: 'prog-6',
    programName: 'Corona Extra Beach Series',
    clientName: 'Constellation Brands',
    eventName: 'Corona Sunset Beach Party',
    eventDate: new Date('2025-12-10'),
    startTime: '16:00',
    endTime: '22:00',
    venueName: 'Venice Beach',
    city: 'Los Angeles',
    state: 'CA',
    status: 'planned',
    businessLeaderName: 'Mike Chen',
    brandscopicSyncStatus: 'pending'
  },
  {
    id: 'event-6',
    masterProgramId: 'prog-4',
    programName: 'AMEX Card Member Events',
    clientName: 'American Express',
    eventName: 'Platinum Card Member Dinner',
    eventDate: new Date('2025-11-25'),
    startTime: '19:00',
    endTime: '23:00',
    venueName: 'The French Laundry',
    city: 'Yountville',
    state: 'CA',
    status: 'completed',
    businessLeaderName: 'Patricia Williams',
    brandscopicSyncStatus: 'synced'
  }
];

export const mockQRCodes = [
  {
    id: 'qr-1',
    name: 'Verizon Survey QR',
    url: 'https://survey.verizon.com/5g-experience',
    scansCount: 245
  },
  {
    id: 'qr-2',
    name: 'AMEX Signup QR',
    url: 'https://amex.com/signup',
    scansCount: 189
  }
];

export const mockSurvey = {
  id: 'survey-1',
  name: 'Post-Event Satisfaction Survey',
  url: 'https://qualtrics.com/survey/12345'
};
