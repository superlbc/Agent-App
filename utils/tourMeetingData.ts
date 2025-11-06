/**
 * Tour Demo Meeting Data
 *
 * Provides fake meeting data for the tour mode to demonstrate
 * the meeting selection feature without requiring real calendar data.
 *
 * This data is ONLY injected when isTourActive === true
 * and is automatically removed when the tour ends.
 */

import { Meeting, MeetingDetails, Attendee } from '../services/graphService';
import { MeetingWithTranscript } from '../services/meetingService';

// Helper to create a date for today at a specific hour
const setHoursToday = (hour: number, minute: number = 0): Date => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

/**
 * Demo Attendees - Anonymous users with realistic profiles
 */
const DEMO_ATTENDEES: {[key: string]: Attendee} = {
  USER_A: {
    name: 'User A',
    email: 'user.a@demo.local',
    type: 'organizer',
    response: 'organizer'
  },
  USER_B: {
    name: 'User B',
    email: 'user.b@demo.local',
    type: 'required',
    response: 'accepted'
  },
  USER_C: {
    name: 'User C',
    email: 'user.c@demo.local',
    type: 'required',
    response: 'accepted'
  },
  USER_D: {
    name: 'User D',
    email: 'user.d@demo.local',
    type: 'optional',
    response: 'tentative'
  },
  USER_E: {
    name: 'User E',
    email: 'user.e@demo.local',
    type: 'required',
    response: 'accepted'
  },
  USER_F: {
    name: 'User F',
    email: 'user.f@demo.local',
    type: 'required',
    response: 'accepted'
  },
  USER_G: {
    name: 'User G',
    email: 'user.g@demo.local',
    type: 'optional',
    response: 'declined'
  }
};

/**
 * Sample VTT Transcript for Meeting 1
 * Content matches the existing SAMPLE_AGENT_RESPONSE from tourHelper.ts
 */
const MEETING_1_VTT_TRANSCRIPT = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v User A>Good morning everyone. Let's start with our ACL Weekly Team Status review.</v>

00:00:05.500 --> 00:00:12.000
<v User A>We'll cover three main areas today: ACL Nights Show, Main Footprint, and Side Stage.</v>

00:00:12.500 --> 00:00:18.000
<v User B>Great. Starting with ACL Nights Show - Casey will mock up blanket and hat designs.</v>

00:00:18.500 --> 00:00:25.000
<v User C>And Sarah needs to coordinate with the city on permits. We should check with legal before signing anything.</v>

00:00:25.500 --> 00:00:31.000
<v User C>Also, we need to decide on catering options for the VIP area.</v>

00:00:31.500 --> 00:00:37.000
<v User A>Good point. Bob, can you own the decision on catering?</v>

00:00:37.500 --> 00:00:42.000
<v User D>Yes, I'll take that. I think catering for VIP area is a key risk if we don't lock it down soon.</v>

00:00:42.500 --> 00:00:48.000
<v User A>Agreed. Let's move on to Main Footprint.</v>

00:00:48.500 --> 00:00:54.000
<v User E>John reported that talent booking is green and on track. No issues there.</v>

00:00:54.500 --> 00:01:00.000
<v User A>Excellent. And for Side Stage?</v>

00:01:00.500 --> 00:01:07.000
<v User B>The audio vendor needs to be finalized by end of day Friday. That's our main action item.</v>

00:01:07.500 --> 00:01:13.000
<v User A>Okay, let me summarize our action items. Casey - blanket and hat mockups by September 2nd.</v>

00:01:13.500 --> 00:01:19.000
<v User A>Sarah - coordinate permits with the city and check with legal.</v>

00:01:19.500 --> 00:01:25.000
<v User A>Bob - make the catering decision for VIP area.</v>

00:01:25.500 --> 00:01:31.000
<v User A>And we need someone to own the audio vendor finalization by Friday.</v>

00:01:31.500 --> 00:01:36.000
<v User C>I can follow up on the audio vendor if no one else has capacity.</v>

00:01:36.500 --> 00:01:40.000
<v User A>Perfect. Thanks everyone, that's all for today.</v>
`;

/**
 * Demo Meeting 1: Product Strategy Review (PRIMARY - has transcript)
 * This is the main meeting the tour will interact with
 */
const DEMO_MEETING_1: Meeting = {
  id: 'tour-demo-meeting-1',
  subject: 'Product Strategy Review',
  start: setHoursToday(9, 0),
  end: setHoursToday(10, 0),
  organizer: {
    name: DEMO_ATTENDEES.USER_A.name,
    email: DEMO_ATTENDEES.USER_A.email
  },
  attendees: [
    DEMO_ATTENDEES.USER_A,
    DEMO_ATTENDEES.USER_B,
    DEMO_ATTENDEES.USER_C,
    DEMO_ATTENDEES.USER_D,
    DEMO_ATTENDEES.USER_E
  ],
  isOrganizer: false,
  hasOnlineMeeting: true,
  joinUrl: 'https://teams.microsoft.com/l/meetup-join/demo1',
  onlineMeetingId: 'tour-demo-meeting-id-1',
  transcriptStatus: 'available',
  transcriptCount: 1
};

/**
 * Demo Meeting 2: Q4 Planning Session (processing)
 */
const DEMO_MEETING_2: Meeting = {
  id: 'tour-demo-meeting-2',
  subject: 'Q4 Planning Session',
  start: setHoursToday(14, 0),
  end: setHoursToday(15, 0),
  organizer: {
    name: DEMO_ATTENDEES.USER_B.name,
    email: DEMO_ATTENDEES.USER_B.email
  },
  attendees: [
    DEMO_ATTENDEES.USER_B,
    DEMO_ATTENDEES.USER_C,
    DEMO_ATTENDEES.USER_D,
    DEMO_ATTENDEES.USER_F
  ],
  isOrganizer: false,
  hasOnlineMeeting: true,
  joinUrl: 'https://teams.microsoft.com/l/meetup-join/demo2',
  onlineMeetingId: 'tour-demo-meeting-id-2',
  transcriptStatus: 'checking',
  transcriptCount: 0
};

/**
 * Demo Meeting 3: Team Standup (no transcript)
 */
const DEMO_MEETING_3: Meeting = {
  id: 'tour-demo-meeting-3',
  subject: 'Team Standup',
  start: setHoursToday(16, 0),
  end: setHoursToday(17, 0),
  organizer: {
    name: DEMO_ATTENDEES.USER_C.name,
    email: DEMO_ATTENDEES.USER_C.email
  },
  attendees: [
    DEMO_ATTENDEES.USER_C,
    DEMO_ATTENDEES.USER_E,
    DEMO_ATTENDEES.USER_F,
    DEMO_ATTENDEES.USER_G
  ],
  isOrganizer: false,
  hasOnlineMeeting: true,
  joinUrl: 'https://teams.microsoft.com/l/meetup-join/demo3',
  onlineMeetingId: 'tour-demo-meeting-id-3',
  transcriptStatus: 'unavailable',
  transcriptCount: 0
};

/**
 * Get all demo meetings for the tour
 * These are scheduled for "today" to always work regardless of when tour is run
 */
export const getTourDemoMeetings = (): Meeting[] => {
  return [
    DEMO_MEETING_1,
    DEMO_MEETING_2,
    DEMO_MEETING_3
  ];
};

/**
 * Check if a meeting ID is a tour demo meeting
 */
export const isTourDemoMeeting = (meetingId: string): boolean => {
  return meetingId.startsWith('tour-demo-meeting-');
};

/**
 * Get detailed meeting data with transcript for a demo meeting
 * Returns null if not a demo meeting
 */
export const getTourDemoMeetingDetails = (meetingId: string): MeetingWithTranscript | null => {
  if (!isTourDemoMeeting(meetingId)) {
    return null;
  }

  // Only Meeting 1 has a full transcript
  if (meetingId === 'tour-demo-meeting-1') {
    const meetingDetails: MeetingWithTranscript = {
      ...DEMO_MEETING_1,
      agenda: `Agenda:
1. ACL Nights Show update
   - Design mockups
   - Permit coordination
   - Catering decisions
2. Main Footprint status
   - Talent booking progress
3. Side Stage logistics
   - Audio vendor finalization`,
      location: 'Microsoft Teams Meeting',
      body: 'Weekly status update for the ACL event components. Please come prepared with updates from your workstream.',
      transcript: {
        available: true,
        content: MEETING_1_VTT_TRANSCRIPT,
        source: 'teams',
        iterations: [
          {
            id: 'tour-transcript-1',
            content: MEETING_1_VTT_TRANSCRIPT,
            createdDateTime: new Date().toISOString(),
            meetingDate: DEMO_MEETING_1.start
          }
        ],
        currentIterationIndex: 0,
        onlineMeetingId: DEMO_MEETING_1.onlineMeetingId,
        joinWebUrl: DEMO_MEETING_1.joinUrl
      }
    };
    return meetingDetails;
  }

  // Meeting 2 - processing, no transcript yet
  if (meetingId === 'tour-demo-meeting-2') {
    const meetingDetails: MeetingWithTranscript = {
      ...DEMO_MEETING_2,
      agenda: 'Quarterly planning and goal setting',
      location: 'Microsoft Teams Meeting',
      body: 'Let\'s align on Q4 priorities and set team goals.',
      transcript: {
        available: false,
        error: 'Transcript is still being processed. Please check back in a few minutes.'
      }
    };
    return meetingDetails;
  }

  // Meeting 3 - no transcript available
  if (meetingId === 'tour-demo-meeting-3') {
    const meetingDetails: MeetingWithTranscript = {
      ...DEMO_MEETING_3,
      agenda: 'Daily team standup',
      location: 'Microsoft Teams Meeting',
      body: 'Quick 15-minute sync on progress and blockers.',
      transcript: {
        available: false,
        error: 'No transcript available for this meeting. Recording may not have been enabled.'
      }
    };
    return meetingDetails;
  }

  return null;
};

/**
 * Get demo participants for form population
 * These are the participants from Meeting 1 formatted for the participants panel
 */
export const getTourDemoParticipants = () => {
  return [
    {
      name: 'User A',
      email: 'user.a@demo.local',
      role: 'Organizer'
    },
    {
      name: 'User B',
      email: 'user.b@demo.local',
      role: 'Required Attendee'
    },
    {
      name: 'User C',
      email: 'user.c@demo.local',
      role: 'Required Attendee'
    },
    {
      name: 'User D',
      email: 'user.d@demo.local',
      role: 'Optional Attendee'
    },
    {
      name: 'User E',
      email: 'user.e@demo.local',
      role: 'Required Attendee'
    }
  ];
};
