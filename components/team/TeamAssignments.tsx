// ============================================================================
// TEAM ASSIGNMENTS COMPONENT
// ============================================================================
// View and manage team member assignments to events
// Shows who's working on which events, their roles, and travel requirements

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import type { PeopleAssignment, Event, Campaign } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface TeamAssignmentsProps {
  assignments: PeopleAssignment[];
  events: Event[];
  campaigns?: Campaign[];
  onAddAssignment?: () => void;
  onEditAssignment?: (assignment: PeopleAssignment) => void;
  onRemoveAssignment?: (assignmentId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TeamAssignments: React.FC<TeamAssignmentsProps> = ({
  assignments,
  events,
  campaigns = [],
  onAddAssignment,
  onEditAssignment,
  onRemoveAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOnSite, setFilterOnSite] = useState<string>('all');

  // Get unique roles from assignments
  const uniqueRoles = useMemo(() => {
    const roles = new Set(assignments.map(a => a.userRole).filter(Boolean));
    return Array.from(roles).sort();
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = assignment.userName.toLowerCase().includes(search);
        const matchesEmail = assignment.userEmail.toLowerCase().includes(search);
        const event = events.find(e => e.id === assignment.eventId);
        const matchesEvent = event?.eventName.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail && !matchesEvent) {
          return false;
        }
      }

      // Role filter
      if (filterRole !== 'all' && assignment.userRole !== filterRole) {
        return false;
      }

      // On-site filter
      if (filterOnSite === 'onsite' && !assignment.onSite) {
        return false;
      }
      if (filterOnSite === 'remote' && assignment.onSite) {
        return false;
      }

      return true;
    });
  }, [assignments, searchTerm, filterRole, filterOnSite, events]);

  // Group assignments by event
  const assignmentsByEvent = useMemo(() => {
    const grouped = new Map<string, PeopleAssignment[]>();
    filteredAssignments.forEach(assignment => {
      if (!grouped.has(assignment.eventId)) {
        grouped.set(assignment.eventId, []);
      }
      grouped.get(assignment.eventId)!.push(assignment);
    });
    return grouped;
  }, [filteredAssignments]);

  // Get event details
  const getEvent = (eventId: string) => events.find(e => e.id === eventId);

  const getCampaign = (campaignId: string) => campaigns.find(c => c.id === campaignId);

  // Role badge color
  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'Event Manager':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'Field Manager':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'Brand Ambassador':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'Logistics Coordinator':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Assignments
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage who's assigned to which events
              </p>
            </div>
            {onAddAssignment && (
              <Button onClick={onAddAssignment}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by name, email, or event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon="search"
            />
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Select>
            <Select
              value={filterOnSite}
              onChange={(e) => setFilterOnSite(e.target.value)}
            >
              <option value="all">All Locations</option>
              <option value="onsite">On-Site Only</option>
              <option value="remote">Remote Only</option>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Assignments</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAssignments.length}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Events Covered</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignmentsByEvent.size}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">On-Site</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAssignments.filter(a => a.onSite).length}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">Remote</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAssignments.filter(a => !a.onSite).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {assignmentsByEvent.size === 0 ? (
            <Card className="p-12 text-center">
              <Icon name="users" className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No assignments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterRole !== 'all' || filterOnSite !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add team members to events to get started'}
              </p>
            </Card>
          ) : (
            Array.from(assignmentsByEvent.entries()).map(([eventId, eventAssignments]) => {
              const event = getEvent(eventId);
              if (!event) return null;

              const campaign = event.campaignId ? getCampaign(event.campaignId) : null;

              return (
                <Card key={eventId} className="overflow-hidden">
                  {/* Event Header */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {event.eventName}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Icon name="calendar" className="w-4 h-4" />
                            {event.eventStartDate
                              ? new Date(event.eventStartDate).toLocaleDateString()
                              : 'Date TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="map-pin" className="w-4 h-4" />
                            {event.city}, {event.state}
                          </div>
                          {campaign && (
                            <div className="flex items-center gap-1">
                              <Icon name="briefcase" className="w-4 h-4" />
                              {campaign.client}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Team Size</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {eventAssignments.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {eventAssignments.map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">
                              {assignment.userName.split(' ').map(n => n[0]).join('')}
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {assignment.userName}
                                </span>
                                {assignment.userRole && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(assignment.userRole)}`}>
                                    {assignment.userRole}
                                  </span>
                                )}
                                {assignment.onSite ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                    On-Site
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    Remote
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span>{assignment.userEmail}</span>
                                {assignment.userDepartment && (
                                  <>
                                    <span>•</span>
                                    <span>{assignment.userDepartment}</span>
                                  </>
                                )}
                                {assignment.distanceFromOfficeMi && (
                                  <>
                                    <span>•</span>
                                    <span>{assignment.distanceFromOfficeMi} mi from office</span>
                                  </>
                                )}
                              </div>
                              {assignment.managerName && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Reports to: {assignment.managerName}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {onEditAssignment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditAssignment(assignment)}
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </Button>
                            )}
                            {onRemoveAssignment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveAssignment(assignment.id)}
                              >
                                <Icon name="trash-2" className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
