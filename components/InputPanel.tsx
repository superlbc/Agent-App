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
}

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
}) => {
  const { t } = useTranslation(['forms', 'common', 'constants']);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
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

  const handleTagToggle = (tag: ContextTag) => {
    const newTags = formState.tags.includes(tag)
      ? formState.tags.filter(t => t !== tag)
      : [...formState.tags, tag];
    // Also set meetingPreset to 'custom' when tags are manually changed
    setControls(prev => ({...prev, meetingPreset: 'custom'}));
    handleFormChange('tags', newTags);
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
      </div>
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
    </Card>
  );
};
