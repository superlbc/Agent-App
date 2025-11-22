import React, { useState } from 'react';
import { Event } from './EventCard';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onSubmitRecap?: (event: Event) => void;
  onSyncBrandscopic?: (event: Event) => void;
  recapData?: any;
  qrCodes?: Array<{ id: string; name: string; url: string; scansCount: number; }>;
  survey?: { id: string; name: string; url: string; };
}

type Tab = 'overview' | 'recap' | 'qr-codes' | 'survey' | 'brandscopic';

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
  onSubmitRecap,
  onSyncBrandscopic,
  recapData,
  qrCodes = [],
  survey
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: Array<{ id: Tab; label: string; icon: string; }> = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'recap', label: 'Recap', icon: 'clipboard-list' },
    { id: 'qr-codes', label: 'QR Codes', icon: 'external' },
    { id: 'survey', label: 'Survey', icon: 'chat-bubble' },
    { id: 'brandscopic', label: 'Brandscopic', icon: 'refresh' }
  ];

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: Event['status']): string => {
    const colors = {
      planned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      tentative: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || colors.planned;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {event.eventName}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                {event.clientName && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {event.clientName} • {event.programName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Icon name="edit" className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icon name="x" className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(event.eventDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Business Leader</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {event.businessLeaderName || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Venue
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                      <p className="text-gray-900 dark:text-white font-medium">{event.venueName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {event.city}, {event.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Event Created</span>
                    <span className="text-sm text-gray-500 dark:text-gray-500 ml-auto">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  {event.status === 'confirmed' && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
                      <span className="text-sm text-gray-500 dark:text-gray-500 ml-auto">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recap Tab */}
          {activeTab === 'recap' && (
            <div>
              {recapData ? (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Recap Submitted</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recap data would be displayed here...
                    </p>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="clipboard-list" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Recap Submitted
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Submit event recap data after the event is completed
                  </p>
                  {onSubmitRecap && (
                    <Button variant="primary" onClick={() => onSubmitRecap(event)}>
                      <Icon name="plus" className="w-4 h-4 mr-2" />
                      Submit Recap
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR Codes Tab */}
          {activeTab === 'qr-codes' && (
            <div>
              {qrCodes.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {qrCodes.map(qr => (
                    <Card key={qr.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{qr.name}</h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{qr.scansCount} scans</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{qr.url}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="external" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No QR Codes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Associate QR codes with this event for tracking
                  </p>
                  <Button variant="primary">
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Add QR Code
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Survey Tab */}
          {activeTab === 'survey' && (
            <div>
              {survey ? (
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">{survey.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{survey.url}</p>
                  <Button variant="outline">
                    <Icon name="external-link" className="w-4 h-4 mr-2" />
                    Open Survey
                  </Button>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <Icon name="chat-bubble" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Survey Linked
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Link a Qualtrics survey to this event
                  </p>
                  <Button variant="primary">
                    <Icon name="plus" className="w-4 h-4 mr-2" />
                    Link Survey
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Brandscopic Tab */}
          {activeTab === 'brandscopic' && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Sync Status</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.brandscopicSyncStatus === 'synced'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : event.brandscopicSyncStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {event.brandscopicSyncStatus || 'Not Synced'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Project ID</span>
                    <p className="text-gray-900 dark:text-white font-medium">BS-12345</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Sync</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
                {onSyncBrandscopic && (
                  <Button variant="primary" onClick={() => onSyncBrandscopic(event)} className="mt-4">
                    <Icon name="refresh" className="w-4 h-4 mr-2" />
                    Sync Now
                  </Button>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Button variant="danger" onClick={() => onDelete(event)}>
            <Icon name="trash" className="w-4 h-4 mr-2" />
            Delete Event
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onSubmitRecap && (event.status === 'active' || event.status === 'completed') && (
              <Button variant="primary" onClick={() => onSubmitRecap(event)}>
                <Icon name="clipboard-list" className="w-4 h-4 mr-2" />
                Submit Recap
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
