import React from 'react';
import { Event } from './EventCard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface EventDashboardProps {
  events: Event[];
  onCreateEvent: () => void;
  onSubmitRecap: () => void;
  onViewApprovals: () => void;
}

interface DashboardStats {
  totalEvents: number;
  confirmedEvents: number;
  pendingRecaps: number;
  completedRecaps: number;
}

interface RecentActivity {
  id: string;
  type: 'created' | 'updated' | 'confirmed' | 'recap_submitted' | 'recap_approved';
  eventName: string;
  user: string;
  timestamp: Date;
}

export const EventDashboard: React.FC<EventDashboardProps> = ({
  events = [],
  onCreateEvent,
  onSubmitRecap,
  onViewApprovals
}) => {
  // Calculate statistics
  const stats: DashboardStats = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthEvents = events.filter(e => {
      const eventDate = new Date(e.eventDate);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    return {
      totalEvents: thisMonthEvents.length,
      confirmedEvents: thisMonthEvents.filter(e => e.status === 'confirmed').length,
      pendingRecaps: events.filter(e => e.status === 'completed' && !e.brandscopicSyncStatus).length,
      completedRecaps: events.filter(e => e.status === 'completed' && e.brandscopicSyncStatus === 'synced').length
    };
  }, [events]);

  // Mock recent activity (would come from API in real app)
  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'created',
      eventName: 'Verizon 5G Activation',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '2',
      type: 'confirmed',
      eventName: 'AMEX US Open',
      user: 'Jane Smith',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      id: '3',
      type: 'recap_submitted',
      eventName: 'Coca-Cola Sampling',
      user: 'Mike Johnson',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  // Get upcoming events (next 7 days)
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return events
      .filter(e => {
        const eventDate = new Date(e.eventDate);
        return eventDate >= now && eventDate <= nextWeek && e.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);
  }, [events]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    const icons = {
      created: 'plus',
      updated: 'edit',
      confirmed: 'check-circle',
      recap_submitted: 'clipboard-list',
      recap_approved: 'check'
    };
    return icons[type];
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    const colors = {
      created: 'text-blue-500',
      updated: 'text-yellow-500',
      confirmed: 'text-green-500',
      recap_submitted: 'text-purple-500',
      recap_approved: 'text-green-600'
    };
    return colors[type];
  };

  const formatActivityTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your event management activities
          </p>
        </div>
        <Button variant="primary" onClick={onCreateEvent}>
          <Icon name="plus" className="w-5 h-5 mr-2" />
          New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalEvents}
              </p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Icon name="calendar" className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confirmed Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.confirmedEvents}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ready to go</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Icon name="check-circle" className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Recaps</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pendingRecaps}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting submission</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
              <Icon name="clock" className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Recaps</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completedRecaps}
              </p>
              <p className="text-xs text-gray-500 mt-1">All set</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <Icon name="clipboard-list" className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Widget (Simple month view) */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
            <Button variant="ghost" size="sm">
              <Icon name="calendar" className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(event.eventDate).getDate()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{event.eventName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.venueName}, {event.city}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    event.status === 'confirmed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="calendar" className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No upcoming events</p>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${getActivityColor(activity.type)}`}>
                  <Icon name={getActivityIcon(activity.type)} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {activity.eventName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.type.replace('_', ' ')} by {activity.user}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="primary" onClick={onCreateEvent} className="justify-start">
            <Icon name="plus" className="w-5 h-5 mr-3" />
            Create New Event
          </Button>
          <Button variant="outline" onClick={onSubmitRecap} className="justify-start">
            <Icon name="clipboard-list" className="w-5 h-5 mr-3" />
            Submit Recap
          </Button>
          <Button variant="outline" onClick={onViewApprovals} className="justify-start">
            <Icon name="inbox" className="w-5 h-5 mr-3" />
            Approval Queue
          </Button>
        </div>
      </Card>
    </div>
  );
};
