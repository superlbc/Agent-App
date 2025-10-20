import React, { useState, useRef } from 'react';
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
} from '../types';
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

interface InputPanelProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  controls: Controls;
  setControls: React.Dispatch<React.SetStateAction<Controls>>;
  addToast: (message: string, type?: 'success' | 'error') => void;
  onClearForm: () => void;
  onUseSampleData: () => void;
  isTourActive: boolean;
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
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // When a preset is selected, update the relevant controls and tags.
  const handlePresetChange = (preset: Exclude<MeetingPreset, 'custom'>) => {
    const config = PRESET_CONFIGS[preset];
    setControls(prev => ({
        ...prev,
        ...config,
        meetingPreset: preset,
    }));
    setFormState(prev => ({...prev, tags: config.tags}));
    if (!isTourActive) {
      addToast(`Applied '${MEETING_PRESET_OPTIONS.find(p => p.value === preset)?.label}' preset`, 'success');
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
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFormState(prev => ({ ...prev, transcript: text }));
        addToast(`Loaded transcript from ${file.name}`, 'success');
      };
      reader.onerror = () => addToast(`Error reading file ${file.name}`, 'error');
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      // @ts-ignore - mammoth is loaded from CDN
      if (typeof window.mammoth === 'undefined') {
        addToast('Could not read the .docx file or parsing library is not available.', 'error');
        return;
      }
      addToast(`Processing .docx file...`, 'success');
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // @ts-ignore
        window.mammoth.extractRawText({ arrayBuffer })
          .then((result: { value: string; }) => {
            setFormState(prev => ({ ...prev, transcript: result.value }));
            addToast(`Loaded transcript from ${file.name}`, 'success');
          })
          .catch((err: Error) => {
            console.error(err);
            addToast('Could not read the .docx file.', 'error');
          });
      };
      reader.onerror = () => addToast(`Error reading file ${file.name}`, 'error');
      reader.readAsArrayBuffer(file);
    } else {
      addToast('Unsupported file type. Please upload a .txt or .docx file.', 'error');
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
            label="Meeting Title"
            value={formState.title}
            onChange={e => handleFormChange('title', e.target.value)}
          />
           <Textarea
            id="agenda"
            label="Agenda"
            value={formState.agenda}
            onChange={e => handleFormChange('agenda', e.target.value)}
            rows={3}
            helperText="One topic per line."
          />
          <div>
            <Textarea
              id="transcript"
              label="Transcript"
              value={formState.transcript}
              onChange={e => handleFormChange('transcript', e.target.value)}
              rows={8}
              placeholder="Paste transcript here, or drag & drop a file..."
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
              <span>{charCount.toLocaleString()} characters / {wordCount.toLocaleString()} words</span>
              <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label="Upload transcript file"
              >
                  <Icon name="upload" className="h-3.5 w-3.5 mr-1" />
                  Upload .txt or .docx
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div id="meeting-presets-section">
            <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Meeting Preset
              <Tooltip content="Select a preset to quickly apply common settings for different meeting types.">
                  <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
              </Tooltip>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEETING_PRESET_OPTIONS.map(({ value, label }) => (
                  <Button 
                      key={value}
                      id={`preset-button-${value}`}
                      variant={controls.meetingPreset === value ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetChange(value)}
                  >
                      {label}
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
                  {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Settings
                  <Icon name={isAdvancedOpen ? 'chevron-up' : 'chevron-down'} className="h-4 w-4 ml-2"/>
              </Button>
          </div>
          
          {isAdvancedOpen && (
              <div id="advanced-settings-panel" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div id="context-tags-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Context Tags
                         <Tooltip content="Apply tags to help the AI understand the context and sensitivity of the meeting.">
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="flex flex-wrap gap-2">
                          {CONTEXT_TAG_OPTIONS.map(tag => (
                              <Chip key={tag} selected={formState.tags.includes(tag)} onClick={() => handleTagToggle(tag)}>
                                  {tag}
                              </Chip>
                          ))}
                      </div>
                  </div>

                   <div id="department-focus-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Department Focus
                         <Tooltip content="Highlight specific departments to have the AI focus on their action items and discussions.">
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENT_OPTIONS.map(dept => (
                              <Tooltip key={dept} content={DEPARTMENT_LEGEND[dept]}>
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
                      Audience
                      <Tooltip content="Tailor the summary's level of detail for a specific audience.">
                          <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                      </Tooltip>
                    </label>
                     <div className="grid grid-cols-3 gap-2">
                          {AUDIENCE_BUTTON_OPTIONS.map(({ value, label }) => (
                              <Button 
                                  key={value}
                                  variant={controls.audience === value ? 'primary' : 'outline'}
                                  size="sm"
                                  onClick={() => handleControlChange('audience', value)}
                              >
                                  {label}
                              </Button>
                          ))}
                      </div>
                  </div>
                   <div id="tone-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tone
                        <Tooltip content="Choose the writing style for the generated notes.">
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                          {TONE_OPTIONS.map(({ value, label }) => (
                              <Button key={value} variant={controls.tone === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('tone', value)}>
                                  {label}
                              </Button>
                          ))}
                      </div>
                  </div>
                   <div id="view-mode-section">
                      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        View Mode
                         <Tooltip content="Select 'Full minutes' for a complete summary or 'Actions only' to focus on the next steps.">
                            <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                          {VIEW_MODE_OPTIONS.map(({ value, label }) => (
                              <Button key={value} variant={controls.view === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('view', value)}>
                                  {label}
                              </Button>
                          ))}
                      </div>
                  </div>
                  
                  <div id="format-toggles-section" className="grid grid-cols-2 gap-4 pt-2">
                      <ToggleSwitch
                        id="critical-lens"
                        label="Critical Lens"
                        checked={controls.critical_lens}
                        onChange={checked => handleControlChange('critical_lens', checked)}
                        tooltip="Analyze for gaps, risks, and unassigned actions."
                      />
                       <ToggleSwitch
                        id="redact"
                        label="Redact PII"
                        checked={controls.redact}
                        onChange={checked => handleControlChange('redact', checked)}
                        tooltip="Mask personal info like emails and phone numbers."
                      />
                       <ToggleSwitch
                        id="use-icons"
                        label="Use Icons"
                        checked={controls.use_icons}
                        onChange={checked => handleControlChange('use_icons', checked)}
                        tooltip="Add icons to section headers for visual clarity."
                      />
                      <ToggleSwitch
                        id="bold-words"
                        label="Bold Keywords"
                        checked={controls.bold_important_words}
                        onChange={checked => handleControlChange('bold_important_words', checked)}
                        tooltip="Emphasize important terms and entities in the summary."
                      />
                  </div>
                  <div id="meeting-coach-section">
                   <ToggleSwitch
                      id="meeting-coach"
                      label="Meeting Coach"
                      checked={controls.meeting_coach}
                      onChange={checked => handleControlChange('meeting_coach', checked)}
                      tooltip="Provide feedback on meeting facilitation and effectiveness."
                  />
                  {controls.meeting_coach && (
                      <div className="pl-6 mt-2">
                           <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Coaching Style
                              <Tooltip content="'Gentle' provides supportive feedback. 'Direct' provides more blunt, actionable advice.">
                                  <Icon name="info" className="h-4 w-4 ml-1.5 text-slate-400 cursor-help" />
                              </Tooltip>
                           </label>
                          <div className="grid grid-cols-2 gap-2">
                              {COACHING_STYLE_OPTIONS.map(({ value, label }) => (
                                  <Button key={value} variant={controls.coaching_style === value ? 'primary' : 'outline'} size="sm" onClick={() => handleControlChange('coaching_style', value)}>
                                      {label}
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
                  Use Sample Data
              </button>
              <Button onClick={onClearForm} variant="secondary" size="sm">Clear Form</Button>
          </div>
      </div>
    </Card>
  );
};
