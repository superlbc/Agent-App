import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { Chip } from './ui/Chip';
import { Icon } from './ui/Icon';
import { Tooltip } from './ui/Tooltip';
import {
  Controls,
  FormState,
  Department,
  MeetingPreset,
  ContextTag,
  Participant,
  GraphData,
} from '../types';
import { ParticipantsPanel } from './participants/ParticipantsPanel';
import { ParsedContact } from '../utils/emailListParser';
import { BatchAddResult, BatchAddProgress } from '../hooks/useParticipantExtraction';
import { MeetingSelectionPanel } from './meeting/MeetingSelectionPanel';
import { MeetingWithTranscript } from '../services/meetingService';
import { UserNotesModal } from './UserNotesModal';
import { GraphService } from '../services/graphService';
import { TranscriptViewer } from './transcript/TranscriptViewer';
import {
  DEPARTMENT_OPTIONS,
  CONTEXT_TAG_OPTIONS,
  MEETING_PRESET_OPTIONS,
  PRESET_CONFIGS,
  AUDIENCE_BUTTON_OPTIONS,
  TONE_OPTIONS,
  VIEW_MODE_OPTIONS,
  COACHING_STYLE_OPTIONS,
  DEPARTMENT_LEGEND,
} from '../constants';
import { telemetryService } from '../utils/telemetryService';
import { searchUserByEmail } from '../utils/graphSearchService';
import { extractSpeakerStatsFromVTT, hasSpeakerInfo } from '../utils/vttSpeakerExtraction';
import { matchSpeakersToParticipants } from '../utils/speakerMatching';

interface InputPanelProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  controls: Controls;
  setControls: React.Dispatch<React.SetStateAction<Controls>>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  onClearForm: () => void;
  onUseSampleData: () => void;
  isTourActive: boolean;
  onTriggerFileUpload?: () => void;
  // Participant management
  participants: Participant[];
  isExtracting: boolean;
  onExtractAndMatch: (transcript: string) => Promise<void>;
  onAddParticipant: (graphData: GraphData) => void;
  onBatchAddParticipants?: (
    contacts: ParsedContact[],
    source: 'emailList' | 'csv',
    onProgress?: (progress: BatchAddProgress) => void
  ) => Promise<BatchAddResult>;
  onRemoveParticipant: (id: string) => void;
  onSearchAndMatch: (participantId: string, searchQuery: string) => Promise<GraphData[]>;
  onConfirmMatch: (participantId: string, graphData: GraphData) => void;
  onMarkAsExternal: (participantId: string, email: string) => void;
  onUpdateParticipant: (participantId: string, updates: Partial<Participant>) => void;
}

type InputMode = 'selectMeeting' | 'pasteTranscript';

export const InputPanel: React.FC<InputPanelProps> = ({
  formState,
  setFormState,
  controls,
  setControls,
  addToast,
  onClearForm,
  onUseSampleData,
  isTourActive,
  onTriggerFileUpload,
  participants,
  isExtracting,
  onExtractAndMatch,
  onAddParticipant,
  onBatchAddParticipants,
  onRemoveParticipant,
  onSearchAndMatch,
  onConfirmMatch,
  onMarkAsExternal,
  onUpdateParticipant,
}) => {
  const { t } = useTranslation(['forms', 'common', 'constants']);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('selectMeeting');
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [pendingMeetingData, setPendingMeetingData] = useState<MeetingWithTranscript | null>(null);
  const [showUserNotesModal, setShowUserNotesModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose file upload trigger to parent via callback
  useEffect(() => {
    if (onTriggerFileUpload && fileInputRef.current) {
      onTriggerFileUpload();
    }
  }, []);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Call parent callback with our trigger function when it's provided
  useEffect(() => {
    if (onTriggerFileUpload) {
      // Store the trigger function reference in the parent
      (window as any).__fileUploadTrigger = triggerFileUpload;
    }
  }, []);
  
  // When a preset is selected, update the relevant controls and tags.
  const handlePresetChange = (preset: Exclude<MeetingPreset, 'custom'>) => {
    const config = PRESET_CONFIGS[preset];

    // Telemetry: Track preset selection
    telemetryService.trackEvent('presetSelected', {
      preset: preset,
      audience: config.audience,
      tone: config.tone,
      viewMode: config.view,
      coachingEnabled: config.meeting_coach
    });

    setControls(prev => ({
        ...prev,
        ...config,
        meetingPreset: preset,
    }));
    setFormState(prev => ({...prev, tags: config.tags}));
    if (!isTourActive) {
      const presetOption = MEETING_PRESET_OPTIONS.find(p => p.value === preset);
      const presetName = presetOption ? t(presetOption.labelKey) : preset;
      addToast(t('common:toasts.presetApplied', { presetName }), 'success');
    }
  };

  const handleControlChange = <K extends keyof Controls>(key: K, value: Controls[K]) => {
    setControls(prev => ({ ...prev, [key]: value, meetingPreset: 'custom' }));
  };

  const handleFormChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveUserNotes = (notes: string) => {
    setFormState(prev => ({ ...prev, userNotes: notes }));
    if (notes) {
      addToast(t('common:toasts.userNotesSaved', 'User notes saved successfully'), 'success');
    } else {
      addToast(t('common:toasts.userNotesCleared', 'User notes cleared'), 'success');
    }
  };

  const handleTagToggle = (tag: ContextTag) => {
    const newTags = formState.tags.includes(tag)
      ? formState.tags.filter(t => t !== tag)
      : [...formState.tags, tag];
    // Also set meetingPreset to 'custom' when tags are manually changed
    setControls(prev => ({...prev, meetingPreset: 'custom'}));
    handleFormChange('tags', newTags);
  };

  const handleMeetingSelected = async (meetingData: MeetingWithTranscript) => {
    console.log('[InputPanel] Meeting data received:', meetingData);
    console.log('[InputPanel] Transcript length:', meetingData.transcript?.content?.length || 0);
    console.log('[InputPanel] Attendees count:', meetingData.attendees?.length || 0);

    // Clear existing participants before adding new ones from the meeting
    console.log('[InputPanel] Clearing existing participants...');
    participants.forEach(participant => {
      onRemoveParticipant(participant.id);
    });
    console.log('[InputPanel] Participants cleared');

    // Filter out boilerplate Microsoft Teams agenda
    const isBoilerplateAgenda = (agenda: string): boolean => {
      if (!agenda || agenda.trim().length === 0) return false;

      const boilerplateKeywords = [
        'microsoft teams need help',
        'join the meeting now',
        'meeting id:',
        'passcode:',
        'dial in by phone',
        'find a local number',
        'reset dial-in pin',
        'learn more about teams',
        'meeting options'
      ];

      const lowerAgenda = agenda.toLowerCase();
      const matchCount = boilerplateKeywords.filter(keyword => lowerAgenda.includes(keyword)).length;

      // If more than 3 boilerplate keywords found, consider it boilerplate
      return matchCount >= 3;
    };

    const cleanAgenda = meetingData.agenda && !isBoilerplateAgenda(meetingData.agenda)
      ? meetingData.agenda
      : '';

    const transcriptContent = meetingData.transcript?.content || '';

    console.log('[InputPanel] Setting form state with:');
    console.log('[InputPanel]   - Title:', meetingData.subject);
    console.log('[InputPanel]   - Agenda:', cleanAgenda ? 'Yes' : 'No (boilerplate filtered)');
    console.log('[InputPanel]   - Transcript:', transcriptContent.length, 'characters');

    // Auto-populate form fields
    setFormState(prev => ({
      ...prev,
      title: meetingData.subject || '',
      agenda: cleanAgenda,
      transcript: transcriptContent,
      transcriptSource: 'imported',           // Mark as imported transcript
      importedMeetingName: meetingData.subject, // Store meeting name for display
      importedMeetingDate: meetingData.start,   // Store meeting date for display
      userNotes: undefined  // Clear user notes when switching meetings
    }));

    // Try to fetch actual attendance report (who actually attended vs who was invited)
    // This uses OnlineMeetings.ReadWrite permission (read-only usage)
    let actualAttendees = meetingData.attendees; // Default to invited attendees
    let attendanceSource = 'invited'; // Track where attendees came from
    const attendanceDataMap = new Map<string, { attended: boolean; durationMinutes: number }>(); // Map email -> attendance data

    try {
      console.log('[InputPanel] Attempting to fetch attendance report...');
      const graphService = GraphService.getInstance();
      const attendanceReport = await graphService.getAttendanceReport(
        meetingData.onlineMeetingId || '',
        meetingData.joinUrl
      );

      if (attendanceReport && attendanceReport.attendees.length > 0) {
        console.log('[InputPanel] ✅ Attendance report found! Using actual attendees.');
        console.log(`[InputPanel] Actual attendees: ${attendanceReport.attendees.length}`);
        console.log(`[InputPanel] Invited attendees: ${meetingData.attendees.length}`);

        // Store attendance data in Map for quick lookup
        attendanceReport.attendees.forEach(record => {
          const minutes = Math.floor(record.totalAttendanceInSeconds / 60);
          attendanceDataMap.set(record.email.toLowerCase(), {
            attended: true,
            durationMinutes: minutes
          });
          console.log(`[InputPanel]   - ${record.name}: ${minutes} minutes`);
        });

        // Merge attendance records with original invited attendees to preserve response status
        // We need the response status from calendar invites, which attendance report doesn't have
        actualAttendees = attendanceReport.attendees.map(record => {
          // Find matching invited attendee to get their response status
          const invitedAttendee = meetingData.attendees.find(
            a => a.email.toLowerCase() === record.email.toLowerCase()
          );

          return {
            name: record.name,
            email: record.email,
            type: invitedAttendee?.type || (record.role as 'required' | 'optional' | 'organizer'),
            response: invitedAttendee?.response || 'notResponded'
          };
        });

        console.log(`[InputPanel] Merged attendance with calendar data. Sample:`, actualAttendees[0]);
        attendanceSource = 'attendance_report';
      } else {
        console.log('[InputPanel] ⚠️ No attendance report available, using invited attendees');
        console.log('[InputPanel] This might mean:');
        console.log('[InputPanel]   - Meeting hasn\'t ended yet');
        console.log('[InputPanel]   - Attendance tracking wasn\'t enabled');
        console.log('[InputPanel]   - You\'re not the meeting organizer');
      }
    } catch (error) {
      console.error('[InputPanel] Error fetching attendance report:', error);
      console.log('[InputPanel] Falling back to invited attendees');
    }

    // Auto-populate participants from attendees - use proper Graph API lookup
    // Mark them with source: 'meeting' to prevent auto-extract dialog
    // IMPORTANT: Wait for ALL participants to be added before continuing
    if (actualAttendees && actualAttendees.length > 0) {
      console.log(`[InputPanel] Adding ${actualAttendees.length} participants from ${attendanceSource}...`);
      console.log(`[InputPanel] Sample attendee data:`, actualAttendees[0]);

      // Use Promise.all to wait for all participant lookups to complete
      await Promise.all(
        actualAttendees.map(async (attendee) => {
          // Get attendance data from map (if available)
          const attendanceData = attendanceDataMap.get(attendee.email.toLowerCase());

          // Map attendee type to attendanceType
          const attendanceType = attendee.type === 'organizer' ? 'required' : attendee.type as 'required' | 'optional';

          // Map attendee response to acceptanceStatus
          // Graph API returns: 'none', 'accepted', 'declined', 'tentativelyaccepted', 'organizer', 'notResponded'
          // We need: 'noResponse', 'accepted', 'declined', 'tentative', 'organizer'
          const acceptanceStatus =
            attendee.response === 'organizer' ? 'organizer' :
            attendee.response === 'none' ? 'noResponse' :
            attendee.response === 'notResponded' ? 'noResponse' :
            attendee.response === 'tentativelyaccepted' ? 'tentative' :
            attendee.response === 'tentative' ? 'tentative' :
            attendee.response === 'accepted' ? 'accepted' :
            attendee.response === 'declined' ? 'declined' :
            'noResponse' as 'accepted' | 'declined' | 'tentative' | 'noResponse' | 'organizer';

          console.log(`[InputPanel] Attendee ${attendee.email} - Type: ${attendanceType}, Response: ${acceptanceStatus}, Attended: ${attendanceData?.attended}`);

          try {
            // Look up the user by exact email to get complete profile
            console.log(`[InputPanel] Looking up attendee: ${attendee.email}`);
            const graphData = await searchUserByEmail(attendee.email);

            if (graphData) {
              // Add participant with full Graph data, meeting source, and attendance data
              console.log(`[InputPanel] Found Graph data for ${attendee.email}:`, graphData.displayName);

              const participantData = {
                ...graphData,
                source: 'meeting',
                attendanceType: attendanceType,
                acceptanceStatus: acceptanceStatus,
                attended: attendanceData?.attended,
                attendanceDurationMinutes: attendanceData?.durationMinutes
              };

              console.log(`[InputPanel] Adding participant with data:`, {
                email: attendee.email,
                attendanceType,
                acceptanceStatus,
                attended: attendanceData?.attended,
                duration: attendanceData?.durationMinutes
              });

              onAddParticipant(participantData as any);
            } else {
              // User not found in directory - add as basic data with attendance
              console.warn(`[InputPanel] User not found in directory: ${attendee.email}`);
              onAddParticipant({
                id: attendee.email,
                displayName: attendee.name,
                mail: attendee.email,
                userPrincipalName: attendee.email,
                jobTitle: '',
                department: '',
                companyName: '',
                officeLocation: '',
                presence: { availability: 'Unknown', activity: 'Unknown' },
                photoUrl: null,
                source: 'meeting',
                attendanceType: attendanceType,
                acceptanceStatus: acceptanceStatus,
                attended: attendanceData?.attended,
                attendanceDurationMinutes: attendanceData?.durationMinutes
              } as any);
            }
          } catch (error) {
            console.error(`[InputPanel] Error looking up ${attendee.email}:`, error);
            // Fallback to basic data on error with attendance
            const attendanceData = attendanceDataMap.get(attendee.email.toLowerCase());
            onAddParticipant({
              id: attendee.email,
              displayName: attendee.name,
              mail: attendee.email,
              userPrincipalName: attendee.email,
              jobTitle: '',
              department: '',
              companyName: '',
              officeLocation: '',
              presence: { availability: 'Unknown', activity: 'Unknown' },
              photoUrl: null,
              source: 'meeting',
              attendanceType: attendanceType,
              acceptanceStatus: acceptanceStatus,
              attended: attendanceData?.attended,
              attendanceDurationMinutes: attendanceData?.durationMinutes
            } as any);
          }
        })
      );

      console.log('[InputPanel] All participants added successfully');
    }

    // Extract speakers from VTT transcript and match to participants
    // This happens silently in the background to enrich participant data
    if (transcriptContent && transcriptContent.trim().length > 0 && hasSpeakerInfo(transcriptContent)) {
      console.log('[InputPanel] ============================================');
      console.log('[InputPanel] Starting speaker identification from transcript');
      console.log('[InputPanel] ============================================');

      try {
        // Extract speakers with mention counts from VTT transcript
        const speakerStats = extractSpeakerStatsFromVTT(transcriptContent);
        console.log(`[InputPanel] Extracted ${speakerStats.length} unique speakers from transcript`);

        if (speakerStats.length > 0) {
          // Log speaker stats for debugging
          speakerStats.forEach(stat => {
            console.log(`[InputPanel]   - ${stat.name}: ${stat.mentionCount} times`);
          });

          // Match speakers to current participants
          const speakerMatches = matchSpeakersToParticipants(
            speakerStats.map(s => s.name),
            participants
          );

          console.log(`[InputPanel] Matched ${speakerMatches.size} speakers to participants`);

          // Update participants with speaking status
          let updatedCount = 0;
          speakerMatches.forEach((matchResult, participantId) => {
            // Find the speaker stats for this match
            const stats = speakerStats.find(s => s.name === matchResult.speakerName);

            onUpdateParticipant(participantId, {
              spokeInMeeting: true,
              speakerMentionCount: stats?.mentionCount
            });

            console.log(`[InputPanel] ✅ Marked participant ${participantId} as speaker (${stats?.mentionCount} mentions)`);
            updatedCount++;
          });

          console.log('[InputPanel] ============================================');
          console.log(`[InputPanel] ✅ Speaker identification complete: ${updatedCount}/${participants.length} participants spoke`);
          console.log('[InputPanel] ============================================');
        } else {
          console.log('[InputPanel] ⚠️ No speakers found in transcript');
        }
      } catch (error) {
        console.error('[InputPanel] ❌ Error during speaker identification:', error);
        // Non-critical error - continue without speaker data
      }
    } else if (transcriptContent && transcriptContent.trim().length > 0) {
      console.log('[InputPanel] ⚠️ Transcript has no speaker information (not VTT format or no <v> tags)');
    }

    // Check if transcript is available
    if (!transcriptContent || transcriptContent.trim().length === 0) {
      // Show dialog asking if user wants to continue without transcript
      setPendingMeetingData(meetingData);
      setShowTranscriptDialog(true);
      return;
    }

    // Switch to paste transcript tab
    setInputMode('pasteTranscript');

    // Show success toast with attendance info
    const successMessage = attendanceSource === 'attendance_report'
      ? `Meeting loaded! Using actual attendees (${actualAttendees.length} attended vs ${meetingData.attendees.length} invited)`
      : 'Meeting data and transcript loaded successfully!';
    addToast(successMessage, 'success');

    // Telemetry: Track meeting selection
    telemetryService.trackEvent('meetingSelected', {
      hasTranscript: true,
      hasAgenda: !!cleanAgenda,
      attendeeCount: actualAttendees.length,
      invitedCount: meetingData.attendees?.length || 0,
      attendanceSource: attendanceSource
    });
  };

  const handleContinueWithoutTranscript = () => {
    // User confirmed to continue without transcript
    setShowTranscriptDialog(false);
    setInputMode('pasteTranscript');
    addToast('Meeting data loaded. You can paste the transcript manually.', 'success');

    // Telemetry: Track meeting selection without transcript
    if (pendingMeetingData) {
      telemetryService.trackEvent('meetingSelected', {
        hasTranscript: false,
        hasAgenda: !!pendingMeetingData.agenda,
        attendeeCount: pendingMeetingData.attendees?.length || 0
      });
    }

    setPendingMeetingData(null);
  };

  const handleCancelMeetingSelection = () => {
    // User cancelled - stay on meeting selection tab
    setShowTranscriptDialog(false);
    setPendingMeetingData(null);

    // Clear form data
    setFormState(prev => ({
      ...prev,
      title: '',
      agenda: '',
      transcript: ''
    }));

    // Clear participants - remove all participants
    participants.forEach(participant => {
      onRemoveParticipant(participant.id);
    });
  };

  const handleSwitchToManualMode = () => {
    // Confirm with user before switching
    if (window.confirm(t('forms:confirmSwitchToManual', 'Switch to manual edit mode? The transcript will become editable as plain text.'))) {
      setFormState(prev => ({
        ...prev,
        transcriptSource: 'manual',
        importedMeetingName: undefined,
        importedMeetingDate: undefined
      }));
      addToast(t('common:toasts.switchedToManual', 'Switched to manual edit mode'), 'success');

      // Telemetry: Track switch to manual mode
      telemetryService.trackEvent('switchedToManualMode', {
        transcriptLength: formState.transcript.length
      });
    }
  };

  const processTranscriptFile = (file: File) => {
    const reader = new FileReader();

    if (file.type === 'text/plain') {
      // Telemetry: Track TXT file upload
      telemetryService.trackEvent('transcriptFileUploaded', {
        fileType: 'txt',
        fileSize: file.size,
        fileName: file.name.substring(file.name.lastIndexOf('.'))
      });

      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFormState(prev => ({ ...prev, transcript: text }));
        addToast(t('common:toasts.fileLoaded', { fileName: file.name }), 'success');
      };
      reader.onerror = () => addToast(t('common:toasts.fileError', { fileName: file.name }), 'error');
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      // @ts-ignore - mammoth is loaded from CDN
      if (typeof window.mammoth === 'undefined') {
        addToast(t('common:toasts.docxLibraryError'), 'error');
        return;
      }

      // Telemetry: Track DOCX file upload
      telemetryService.trackEvent('docxFileUploaded', {
        fileSize: file.size,
        fileName: file.name.substring(file.name.lastIndexOf('.'))
      });

      addToast(t('common:toasts.fileProcessing'), 'success');
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // @ts-ignore
        window.mammoth.extractRawText({ arrayBuffer })
          .then((result: { value: string; }) => {
            setFormState(prev => ({ ...prev, transcript: result.value }));
            addToast(t('common:toasts.fileLoaded', { fileName: file.name }), 'success');
          })
          .catch((err: Error) => {
            console.error(err);
            addToast(t('common:toasts.docxReadError'), 'error');
          });
      };
      reader.onerror = () => addToast(t('common:toasts.fileError', { fileName: file.name }), 'error');
      reader.readAsArrayBuffer(file);
    } else {
      addToast(t('common:toasts.unsupportedFileType'), 'error');
    }
  };

  const handleFileDrop = (file: File) => {
    processTranscriptFile(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processTranscriptFile(file);
    }
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };
  
  const wordCount = formState.transcript ? formState.transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = formState.transcript.length;


  return (
    <Card className="p-4 sm:p-6" id="input-panel">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setInputMode('selectMeeting')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              inputMode === 'selectMeeting'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon name="calendar" className="w-4 h-4 inline-block mr-2" />
            {t('forms:tabs.selectMeeting')}
          </button>
          <button
            onClick={() => setInputMode('pasteTranscript')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              inputMode === 'pasteTranscript'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon name="edit" className="w-4 h-4 inline-block mr-2" />
            {t('forms:tabs.pasteTranscript')}
          </button>
        </div>

        {/* Meeting Selection Panel */}
        {inputMode === 'selectMeeting' && (
          <MeetingSelectionPanel
            onMeetingSelected={handleMeetingSelected}
            onError={(error) => addToast(error, 'error')}
          />
        )}

        {/* Tab Content - Title, Agenda, Transcript, Participants */}
        {inputMode === 'pasteTranscript' && (
          <>
            <div className="space-y-4" id="transcript-input-section">
          <Input
            id="title"
            label={t('forms:input.title.label')}
            value={formState.title}
            onChange={e => handleFormChange('title', e.target.value)}
          />
           <Textarea
            id="agenda"
            label={t('forms:input.agenda.label')}
            value={formState.agenda}
            onChange={e => handleFormChange('agenda', e.target.value)}
            rows={3}
            helperText={t('forms:helperText.agendaHelper')}
          />
          {/* Transcript Section - Conditional based on source */}
          <div>
            {formState.transcriptSource === 'imported' ? (
              // NEW: Card-based viewer for imported transcripts
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('forms:input.transcript.label')}
                </label>
                <TranscriptViewer
                  transcript={formState.transcript}
                  participants={participants}
                  meetingName={formState.importedMeetingName}
                  meetingDate={formState.importedMeetingDate}
                />
                {/* Switch to manual mode button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleSwitchToManualMode}
                >
                  <Icon name="edit" className="w-4 h-4 mr-2" />
                  {t('forms:actions.switchToManualEdit', 'Switch to Manual Edit')}
                </Button>
              </div>
            ) : (
              // EXISTING: Textarea for manual entry
              <div>
                <Textarea
                  id="transcript"
                  label={t('forms:input.transcript.label')}
                  value={formState.transcript}
                  onChange={e => handleFormChange('transcript', e.target.value)}
                  rows={8}
                  placeholder={t('forms:helperText.transcriptPlaceholder')}
                  onFileDrop={handleFileDrop}
                  required
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  title="Upload transcript file input"
                />
                <div className="mt-1.5 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>{t('forms:helperText.characterCount', { count: charCount, words: wordCount })}</span>
                  <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                      aria-label="Upload transcript file"
                  >
                      <Icon name="upload" className="h-3.5 w-3.5 mr-1" />
                      {t('forms:actions.uploadFile')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Notes Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowUserNotesModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Icon name="file-text" className="h-4 w-4" />
              <span>{t('forms:userNotes.addButton', 'Add User Notes')}</span>
              {formState.userNotes && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-200 dark:bg-teal-800 rounded">
                  {formState.userNotes.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Participants Panel */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <ParticipantsPanel
            transcript={formState.transcript}
            participants={participants}
            isExtracting={isExtracting}
            onExtractAndMatch={onExtractAndMatch}
            onAddParticipant={onAddParticipant}
            onBatchAddParticipants={onBatchAddParticipants}
            onRemoveParticipant={onRemoveParticipant}
            onSearchAndMatch={onSearchAndMatch}
            onConfirmMatch={onConfirmMatch}
            onMarkAsExternal={onMarkAsExternal}
          />
        </div>
          </>
        )}

        {/* Meeting Presets & Advanced Settings - Always visible outside tabs */}
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div id="meeting-presets-section">
            <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('forms:controls.preset.label')}
              <Tooltip content={t('forms:tooltips.meetingPreset')}>
                  <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
              </Tooltip>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEETING_PRESET_OPTIONS.map(({ value, labelKey }) => (
                  <Button
                      key={value}
                      id={`preset-button-${value}`}
                      variant={controls.meetingPreset === value ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetChange(value)}
                  >
                      {t(labelKey)}
                  </Button>
              ))}
            </div>
          </div>
          
          <div>
              <Button
                  id="advanced-settings-button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                  {isAdvancedOpen ? t('forms:actions.hideAdvancedSettings') : t('forms:actions.showAdvancedSettings')}
                  <Icon name={isAdvancedOpen ? 'chevron-up' : 'chevron-down'} className="h-4 w-4 ml-2"/>
              </Button>
          </div>
          
          {isAdvancedOpen && (
              <div id="advanced-settings-panel" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div id="context-tags-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('forms:input.tags.label')}
                         <Tooltip content={t('forms:tooltips.contextTags')}>
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="flex flex-wrap gap-2">
                          {CONTEXT_TAG_OPTIONS.map(({ value, labelKey }) => (
                              <Chip key={value} selected={formState.tags.includes(value)} onClick={() => handleTagToggle(value)}>
                                  {t(labelKey)}
                              </Chip>
                          ))}
                      </div>
                  </div>

                   <div id="department-focus-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('forms:controls.department.label')}
                         <Tooltip content={t('forms:tooltips.departmentFocus')}>
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENT_OPTIONS.map(dept => (
                              <Tooltip key={dept} content={t(`constants:departmentDescriptions.${dept}`)}>
                                  <Chip
                                      selected={controls.focus_department.includes(dept)}
                                      onClick={() => {
                                          const newDepts = controls.focus_department.includes(dept)
                                              ? controls.focus_department.filter(d => d !== dept)
                                              : [...controls.focus_department, dept];
                                          handleControlChange('focus_department', newDepts as Department[]);
                                      }}
                                  >
                                      {dept}
                                  </Chip>
                              </Tooltip>
                          ))}
                      </div>
                  </div>

                  <div id="audience-section">
                    <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('forms:controls.audience.label')}
                      <Tooltip content={t('forms:tooltips.audience')}>
                          <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                      </Tooltip>
                    </label>
                     <div className="grid grid-cols-3 gap-2">
                          {AUDIENCE_BUTTON_OPTIONS.map(({ value, labelKey }) => (
                              <Button
                                  key={value}
                                  variant={controls.audience === value ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => handleControlChange('audience', value)}
                              >
                                  {t(labelKey)}
                              </Button>
                          ))}
                      </div>
                  </div>
                   <div id="tone-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('forms:controls.tone.label')}
                        <Tooltip content={t('forms:tooltips.tone')}>
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                          {TONE_OPTIONS.map(({ value, labelKey }) => (
                              <Button key={value} variant={controls.tone === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('tone', value)}>
                                  {t(labelKey)}
                              </Button>
                          ))}
                      </div>
                  </div>
                   <div id="view-mode-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {t('forms:controls.view.label')}
                         <Tooltip content={t('forms:tooltips.viewMode')}>
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                          {VIEW_MODE_OPTIONS.map(({ value, labelKey }) => (
                              <Button key={value} variant={controls.view === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('view', value)}>
                                  {t(labelKey)}
                              </Button>
                          ))}
                      </div>
                  </div>
                  
                  <div id="format-toggles-section" className="grid grid-cols-2 gap-4 pt-2">
                      <ToggleSwitch
                        id="critical-lens"
                        label={t('forms:controls.criticalLens.label')}
                        checked={controls.critical_lens}
                        onChange={checked => handleControlChange('critical_lens', checked)}
                        tooltip={t('forms:tooltips.criticalLens')}
                      />
                       <ToggleSwitch
                        id="redact"
                        label={t('forms:controls.redact.label')}
                        checked={controls.redact}
                        onChange={checked => handleControlChange('redact', checked)}
                        tooltip={t('forms:tooltips.redact')}
                      />
                       <ToggleSwitch
                        id="use-icons"
                        label={t('forms:controls.useIcons.label')}
                        checked={controls.use_icons}
                        onChange={checked => handleControlChange('use_icons', checked)}
                        tooltip={t('forms:tooltips.useIcons')}
                      />
                      <ToggleSwitch
                        id="bold-words"
                        label={t('forms:controls.boldKeywords.label')}
                        checked={controls.bold_important_words}
                        onChange={checked => handleControlChange('bold_important_words', checked)}
                        tooltip={t('forms:tooltips.boldKeywords')}
                      />
                  </div>
                  <div id="meeting-coach-section">
                   <ToggleSwitch
                      id="meeting-coach"
                      label={t('forms:controls.meetingCoach.label')}
                      checked={controls.meeting_coach}
                      onChange={checked => handleControlChange('meeting_coach', checked)}
                      tooltip={t('forms:tooltips.meetingCoach')}
                  />
                  {controls.meeting_coach && (
                      <div className="pl-6 mt-2">
                           <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              {t('forms:controls.coachingStyle.label')}
                              <Tooltip content={t('forms:tooltips.coachingStyle')}>
                                  <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                              </Tooltip>
                           </label>
                          <div className="grid grid-cols-2 gap-2">
                              {COACHING_STYLE_OPTIONS.map(({ value, labelKey }) => (
                                  <Button key={value} variant={controls.coaching_style === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('coaching_style', value)}>
                                      {t(labelKey)}
                                  </Button>
                              ))}
                          </div>
                      </div>
                  )}
                  </div>
              </div>
          )}
        </div>

        {/* Bottom Actions - Always visible */}
        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <button
              id="use-sample-data-button"
              type="button"
              onClick={onUseSampleData}
              className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              {t('forms:actions.useSampleData')}
            </button>
            <Button onClick={onClearForm} variant="secondary" size="sm">{t('forms:actions.clearForm')}</Button>
          </div>
        </div>
      </div>

      {/* Transcript Unavailable Dialog */}
      {showTranscriptDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Icon name="error" className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Transcript Not Available
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  The transcript for this meeting is not available. This could be because:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1 mb-4">
                  <li>The meeting recording wasn't enabled</li>
                  <li>The transcript is still being processed (takes 5-10 minutes)</li>
                  <li>You don't have permission to access it</li>
                </ul>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Would you like to continue and enter the transcript manually?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelMeetingSelection}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleContinueWithoutTranscript}
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* User Notes Modal */}
      <UserNotesModal
        isOpen={showUserNotesModal}
        onClose={() => setShowUserNotesModal(false)}
        currentNotes={formState.userNotes || ''}
        onSave={handleSaveUserNotes}
      />
    </Card>
  );
};
