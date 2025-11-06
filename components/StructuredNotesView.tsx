import React, { useState, useEffect } from 'react';
import { EmphasisText } from './EmphasisText';
import { Icon } from './ui/Icon';
import { SummaryCard } from './SummaryCard';
import { CriticalReview, RiskAssessment, UnassignedTask, CriticalThinkingAnalysis, CriticalThinkingRequest } from '../types';

interface EmphasisMarker {
  type: 'person' | 'date' | 'status' | 'task' | 'department' | 'monetary' | 'deadline' | 'risk' | 'general';
  value: string;
}

interface EmphasisedText {
  text: string;
  emphasis?: EmphasisMarker[];
}

interface WorkstreamNote {
  workstream_name: string;
  key_discussion_points?: EmphasisedText[];
  decisions_made?: EmphasisedText[];
  risks_or_open_questions?: (EmphasisedText & { risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' })[];
}

interface StructuredNotesData {
  meeting_title: string;
  meeting_purpose: string;
  workstream_notes: WorkstreamNote[];
}

interface StructuredNotesViewProps {
  data: StructuredNotesData;
  executiveSummary?: string[];  // Optional executive summary bullets
  criticalReview?: CriticalReview;  // Critical lens analysis
  className?: string;
  showEmphasis: boolean; // Whether to show emphasis styling (true by default)
  groupingMode: 'by-topic' | 'by-type';  // How to organize workstream notes
  // Critical thinking props
  onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
  transcript?: string;  // Full transcript for critical thinking context
  meetingTitle?: string;
  meetingPurpose?: string;
}

/**
 * Modern, clean view for structured meeting notes with emphasis rendering.
 * Inspired by Notion and Linear's design principles: centered titles, generous
 * spacing, clean typography, and subtle visual hierarchy.
 */
export const StructuredNotesView: React.FC<StructuredNotesViewProps> = ({
  data,
  executiveSummary,
  criticalReview,
  className = '',
  showEmphasis,
  groupingMode,
  onRequestCriticalThinking,
  transcript,
  meetingTitle,
  meetingPurpose
}) => {
  const { meeting_title, meeting_purpose, workstream_notes } = data;

  // Use props or fallback to data fields
  const finalMeetingTitle = meetingTitle || meeting_title;
  const finalMeetingPurpose = meetingPurpose || meeting_purpose;

  // Load collapsed state from sessionStorage
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem('expandedWorkstreams');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save collapsed state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('expandedWorkstreams', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleSection = (name: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <>
      <div className={`space-y-8 ${className}`}>
        {/* Hero Section - Centered Title & Purpose */}
      <div className="text-center py-8 px-6 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/20 dark:to-transparent rounded-xl">
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-50 mb-4 leading-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
          {meeting_title}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          {meeting_purpose}
        </p>
      </div>

      {/* Executive Summary */}
      {executiveSummary && executiveSummary.length > 0 && (
        <SummaryCard bullets={executiveSummary} />
      )}

      {/* Workstreams - Conditional rendering based on grouping mode */}
      <div className="space-y-8">
        {workstream_notes && workstream_notes.length > 0 ? (
          groupingMode === 'by-topic' ? (
            // BY TOPIC: Current behavior - group by workstream
            workstream_notes.map((workstream, idx) => {
              const isExpanded = expandedSections[workstream.workstream_name] !== false;
              return (
                <WorkstreamSection
                  key={idx}
                  workstream={workstream}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSection(workstream.workstream_name)}
                  showEmphasis={showEmphasis}
                  onRequestCriticalThinking={onRequestCriticalThinking}
                  transcript={transcript}
                  meetingTitle={finalMeetingTitle}
                  meetingPurpose={finalMeetingPurpose}
                />
              );
            })
          ) : (
            // BY TYPE: New behavior - group by content type
            <ContentTypeView
              workstreams={workstream_notes}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              showEmphasis={showEmphasis}
              onRequestCriticalThinking={onRequestCriticalThinking}
              transcript={transcript}
              meetingTitle={finalMeetingTitle}
              meetingPurpose={finalMeetingPurpose}
            />
          )
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>No workstream notes available</p>
          </div>
        )}
      </div>

      {/* Critical Review Section */}
      {criticalReview && (
        <CriticalReviewSection review={criticalReview} showEmphasis={showEmphasis} />
      )}
      </div>
    </>
  );
};

/**
 * Individual workstream section with collapsible functionality
 */
const WorkstreamSection: React.FC<{
  workstream: WorkstreamNote;
  isExpanded: boolean;
  onToggle: () => void;
  showEmphasis: boolean;
  onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
  transcript?: string;
  meetingTitle?: string;
  meetingPurpose?: string;
}> = ({ workstream, isExpanded, onToggle, showEmphasis, onRequestCriticalThinking, transcript, meetingTitle, meetingPurpose }) => {
  const { workstream_name, key_discussion_points, decisions_made, risks_or_open_questions } = workstream;

  const hasContent = (key_discussion_points && key_discussion_points.length > 0) ||
    (decisions_made && decisions_made.length > 0) ||
    (risks_or_open_questions && risks_or_open_questions.length > 0);

  return (
    <section className="scroll-mt-24">
      {/* Workstream Title - Collapsible */}
      <div
        className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors mb-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon
            name={isExpanded ? "chevron-down" : "chevron-right"}
            className="h-4 w-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
          />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
            {workstream_name}
          </h2>
        </div>
        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-slate-700 dark:via-slate-600 dark:to-transparent mt-2" />
      </div>

      {/* Content - Collapsible with animation */}
      {isExpanded && (
        <div className="overflow-hidden transition-all duration-300 ease-in-out">
          {hasContent ? (
            <div className="space-y-6 pl-4">
              {/* Key Discussion Points */}
              {key_discussion_points && key_discussion_points.length > 0 && (
                <Subsection
                  icon="💬"
                  title="Key Discussion Points"
                  items={key_discussion_points}
                  color="blue"
                  showEmphasis={showEmphasis}
                  workstreamName={workstream_name}
                  sectionContext="key_discussion_points"
                  onRequestCriticalThinking={onRequestCriticalThinking}
                  transcript={transcript}
                  meetingTitle={meetingTitle}
                  meetingPurpose={meetingPurpose}
                />
              )}

              {/* Decisions Made */}
              {decisions_made && decisions_made.length > 0 && (
                <Subsection
                  icon="✅"
                  title="Decisions Made"
                  items={decisions_made}
                  color="green"
                  showEmphasis={showEmphasis}
                  workstreamName={workstream_name}
                  sectionContext="decisions_made"
                  onRequestCriticalThinking={onRequestCriticalThinking}
                  transcript={transcript}
                  meetingTitle={meetingTitle}
                  meetingPurpose={meetingPurpose}
                />
              )}

              {/* Risks or Open Questions */}
              {risks_or_open_questions && risks_or_open_questions.length > 0 && (
                <Subsection
                  icon="❓"
                  title="Risks or Open Questions"
                  items={risks_or_open_questions}
                  color="amber"
                  showRiskLevel
                  showEmphasis={showEmphasis}
                  workstreamName={workstream_name}
                  sectionContext="risks_or_open_questions"
                  onRequestCriticalThinking={onRequestCriticalThinking}
                  transcript={transcript}
                  meetingTitle={meetingTitle}
                  meetingPurpose={meetingPurpose}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic pl-4">
              No notes for this workstream
            </p>
          )}
        </div>
      )}
    </section>
  );
};

/**
 * Subsection within a workstream (discussion points, decisions, risks)
 */
const Subsection: React.FC<{
  icon: string;
  title: string;
  items: (EmphasisedText & { risk_level?: string })[];
  color: 'blue' | 'green' | 'amber';
  showRiskLevel?: boolean;
  showEmphasis: boolean;
  workstreamName?: string;
  sectionContext?: string;
  onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
  transcript?: string;
  meetingTitle?: string;
  meetingPurpose?: string;
}> = ({ icon, title, items, color, showRiskLevel = false, showEmphasis, workstreamName, sectionContext, onRequestCriticalThinking, transcript, meetingTitle, meetingPurpose }) => {

  // State to track fetched critical thinking analyses (persistent)
  const [fetchedAnalyses, setFetchedAnalyses] = useState<Record<number, CriticalThinkingAnalysis>>({});
  // State to track which items are currently expanded (toggle)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [loadingCriticalThinking, setLoadingCriticalThinking] = useState<Record<number, boolean>>({});
  const [errorCriticalThinking, setErrorCriticalThinking] = useState<Record<number, string>>({});
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleCriticalThinkingClick = async (itemIndex: number, itemText: string) => {
    // If already fetched, just toggle expansion
    if (fetchedAnalyses[itemIndex]) {
      setExpandedItems(prev => ({
        ...prev,
        [itemIndex]: !prev[itemIndex]
      }));
      return;
    }

    // Check if we have the required data
    if (!onRequestCriticalThinking || !transcript || !meetingTitle || !meetingPurpose || !workstreamName || !sectionContext) {
      console.error('Missing required data for critical thinking request');
      setErrorCriticalThinking(prev => ({
        ...prev,
        [itemIndex]: 'Critical thinking is not available for this item.'
      }));
      return;
    }

    // Set loading state
    setLoadingCriticalThinking(prev => ({ ...prev, [itemIndex]: true }));
    setErrorCriticalThinking(prev => {
      const newState = { ...prev };
      delete newState[itemIndex];
      return newState;
    });

    try {
      const request: CriticalThinkingRequest = {
        line_text: itemText,
        line_context: sectionContext,
        workstream_name: workstreamName,
        full_transcript: transcript,
        meeting_title: meetingTitle,
        meeting_purpose: meetingPurpose,
      };

      const analysis = await onRequestCriticalThinking(request);

      // Store in persistent cache
      setFetchedAnalyses(prev => ({
        ...prev,
        [itemIndex]: analysis
      }));

      // Expand by default
      setExpandedItems(prev => ({
        ...prev,
        [itemIndex]: true
      }));
    } catch (error) {
      console.error('Error fetching critical thinking analysis:', error);
      setErrorCriticalThinking(prev => ({
        ...prev,
        [itemIndex]: error instanceof Error ? error.message : 'Failed to load critical thinking analysis.'
      }));
    } finally {
      setLoadingCriticalThinking(prev => {
        const newState = { ...prev };
        delete newState[itemIndex];
        return newState;
      });
    }
  };

  const borderColorClasses = {
    blue: 'border-blue-200 dark:border-blue-800',
    green: 'border-green-200 dark:border-green-800',
    amber: 'border-amber-200 dark:border-amber-800',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50/30 dark:bg-blue-900/10',
    green: 'bg-green-50/30 dark:bg-green-900/10',
    amber: 'bg-amber-50/30 dark:bg-amber-900/10',
  };

  const showCriticalThinkingButton = onRequestCriticalThinking && transcript && meetingTitle && meetingPurpose;

  return (
    <div className={`${bgColorClasses[color]} rounded-lg p-5 border-l-2 ${borderColorClasses[color]}`}>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
        <span className="text-base">{icon}</span>
        <span>{title}</span>
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 group"
            onMouseEnter={() => setHoveredItem(idx)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className="text-slate-400 dark:text-slate-600 mt-0.5 select-none" style={{ fontSize: '0.75rem' }}>
              •
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <EmphasisText
                    text={item.text}
                    emphasis={item.emphasis}
                    className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed"
                    showEmphasis={showEmphasis}
                  />
                  {showRiskLevel && item.risk_level && (
                    <RiskLevelBadge level={item.risk_level} />
                  )}
                </div>
                {/* Critical Thinking Button - Shows on hover, when loading, or when analysis is fetched */}
                {showCriticalThinkingButton && (
                  <button
                    onClick={() => handleCriticalThinkingClick(idx, item.text)}
                    className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-200 ${
                      hoveredItem === idx || fetchedAnalyses[idx] || loadingCriticalThinking[idx]
                        ? 'opacity-100 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Critical Thinking (C)"
                    aria-label="Get critical thinking analysis"
                  >
                    {loadingCriticalThinking[idx] ? (
                      <Icon name="loader" className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                    ) : (
                      <span className="text-base leading-none">💭</span>
                    )}
                  </button>
                )}
              </div>

              {/* Critical Thinking Panel - Only show if expanded AND fetched */}
              {expandedItems[idx] && fetchedAnalyses[idx] && (
                <CriticalThinkingPanel
                  analysis={fetchedAnalyses[idx]}
                  onClose={() => handleCriticalThinkingClick(idx, item.text)}
                />
              )}

              {/* Error Message */}
              {errorCriticalThinking[idx] && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300">{errorCriticalThinking[idx]}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Critical Thinking Panel - Displays AI-generated critical analysis
 */
const CriticalThinkingPanel: React.FC<{
  analysis: CriticalThinkingAnalysis;
  onClose: () => void;
}> = ({ analysis, onClose }) => {
  return (
    <div className="mt-3 p-4 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💭</span>
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">Critical Thinking</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded transition-colors"
          aria-label="Close critical thinking"
        >
          <Icon name="x" className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 text-sm">
        {/* Strategic Context */}
        {analysis.strategic_context && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>🎯</span>
              <span>Strategic Context</span>
            </h5>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">{analysis.strategic_context}</p>
          </div>
        )}

        {/* Alternative Perspectives */}
        {analysis.alternative_perspectives && analysis.alternative_perspectives.length > 0 && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>🔄</span>
              <span>Alternative Perspectives</span>
            </h5>
            <ul className="space-y-1 pl-5">
              {analysis.alternative_perspectives.map((perspective, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-400 dark:text-purple-600 mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{perspective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Probing Questions */}
        {analysis.probing_questions && analysis.probing_questions.length > 0 && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>❓</span>
              <span>Probing Questions</span>
            </h5>
            <ul className="space-y-1 pl-5">
              {analysis.probing_questions.map((question, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-400 dark:text-purple-600 mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Analysis */}
        {analysis.risk_analysis && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>Risk Analysis</span>
            </h5>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">{analysis.risk_analysis}</p>
          </div>
        )}

        {/* Connections */}
        {analysis.connections && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>🔗</span>
              <span>Connections</span>
            </h5>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">{analysis.connections}</p>
          </div>
        )}

        {/* Actionable Insights */}
        {analysis.actionable_insights && analysis.actionable_insights.length > 0 && (
          <div>
            <h5 className="font-semibold text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
              <span>💡</span>
              <span>Actionable Insights</span>
            </h5>
            <ul className="space-y-1 pl-5">
              {analysis.actionable_insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-400 dark:text-purple-600 mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Risk level badge
 */
const RiskLevelBadge: React.FC<{ level: string }> = ({ level }) => {
  const styles = {
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700/50',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700/50',
  };

  const styleClass = styles[level as keyof typeof styles] || styles.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-2 ${styleClass}`}>
      Risk: {level}
    </span>
  );
};

/**
 * Critical Review Section - Displayed when critical_lens=true
 */
const CriticalReviewSection: React.FC<{ review: CriticalReview; showEmphasis: boolean }> = ({ review, showEmphasis }) => {
  const { gaps_missing_topics, risk_assessment, unassigned_ambiguous_tasks } = review;

  const hasContent = (gaps_missing_topics && gaps_missing_topics.length > 0) ||
    (risk_assessment && risk_assessment.length > 0) ||
    (unassigned_ambiguous_tasks && unassigned_ambiguous_tasks.length > 0);

  if (!hasContent) return null;

  return (
    <section className="scroll-mt-24 mt-12 border-t-2 border-slate-200 dark:border-slate-700 pt-8">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
          <span className="text-2xl">🔍</span>
          <span>Critical Review</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Gaps, risks, and items requiring attention
        </p>
      </div>

      <div className="space-y-6">
        {/* Gaps & Missing Topics */}
        {gaps_missing_topics && gaps_missing_topics.length > 0 && (
          <div className="bg-orange-50/30 dark:bg-orange-900/10 rounded-lg p-5 border-l-2 border-orange-200 dark:border-orange-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
              <span className="text-base">⚠️</span>
              <span>Gaps & Missing Topics</span>
            </h3>
            <ul className="space-y-3">
              {gaps_missing_topics.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5 select-none" style={{ fontSize: '0.75rem' }}>
                    •
                  </span>
                  <div className="flex-1 min-w-0">
                    <EmphasisText
                      text={item.text}
                      emphasis={item.emphasis}
                      className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed"
                      showEmphasis={showEmphasis}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Assessment */}
        {risk_assessment && risk_assessment.length > 0 && (
          <div className="bg-red-50/30 dark:bg-red-900/10 rounded-lg p-5 border-l-2 border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
              <span className="text-base">🚨</span>
              <span>Risk Assessment</span>
            </h3>
            <ul className="space-y-3">
              {risk_assessment.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5 select-none" style={{ fontSize: '0.75rem' }}>
                    •
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-2 ${
                      item.level === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700/50' :
                      item.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700/50' :
                      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700/50'
                    }`}>
                      Risk: {item.level}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unassigned & Ambiguous Tasks */}
        {unassigned_ambiguous_tasks && unassigned_ambiguous_tasks.length > 0 && (
          <div className="bg-purple-50/30 dark:bg-purple-900/10 rounded-lg p-5 border-l-2 border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
              <span className="text-base">👤</span>
              <span>Unassigned & Ambiguous Tasks</span>
            </h3>
            <ul className="space-y-3">
              {unassigned_ambiguous_tasks.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-slate-400 dark:text-slate-600 mt-0.5 select-none" style={{ fontSize: '0.75rem' }}>
                    •
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.task}
                    </p>
                    {item.suggested_department && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border mt-2 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700/50">
                        Suggested: {item.suggested_department}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

/**
 * Content Type View - Groups notes by content type (discussions, decisions, risks) instead of workstream
 */
const ContentTypeView: React.FC<{
  workstreams: WorkstreamNote[];
  expandedSections: Record<string, boolean>;
  toggleSection: (name: string) => void;
  showEmphasis: boolean;
  onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
  transcript?: string;
  meetingTitle?: string;
  meetingPurpose?: string;
}> = ({ workstreams, expandedSections, toggleSection, showEmphasis, onRequestCriticalThinking, transcript, meetingTitle, meetingPurpose }) => {
  // Reorganize data by content type
  interface ContentByType {
    workstream_name: string;
    items: EmphasisedText[];
  }

  interface RisksByType {
    workstream_name: string;
    items: (EmphasisedText & { risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' })[];
  }

  const discussionsByWorkstream: ContentByType[] = [];
  const decisionsByWorkstream: ContentByType[] = [];
  const risksByWorkstream: RisksByType[] = [];

  // Extract content from each workstream
  workstreams.forEach((ws) => {
    if (ws.key_discussion_points && ws.key_discussion_points.length > 0) {
      discussionsByWorkstream.push({
        workstream_name: ws.workstream_name,
        items: ws.key_discussion_points
      });
    }
    if (ws.decisions_made && ws.decisions_made.length > 0) {
      decisionsByWorkstream.push({
        workstream_name: ws.workstream_name,
        items: ws.decisions_made
      });
    }
    if (ws.risks_or_open_questions && ws.risks_or_open_questions.length > 0) {
      risksByWorkstream.push({
        workstream_name: ws.workstream_name,
        items: ws.risks_or_open_questions
      });
    }
  });

  const hasAnyContent = discussionsByWorkstream.length > 0 || decisionsByWorkstream.length > 0 || risksByWorkstream.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <>
      {/* Key Discussion Points Section */}
      {discussionsByWorkstream.length > 0 && (
        <ContentTypeSection
          title="Key Discussion Points"
          icon="💬"
          color="blue"
          contentByWorkstream={discussionsByWorkstream}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          showEmphasis={showEmphasis}
          sectionContext="key_discussion_points"
          onRequestCriticalThinking={onRequestCriticalThinking}
          transcript={transcript}
          meetingTitle={meetingTitle}
          meetingPurpose={meetingPurpose}
        />
      )}

      {/* Decisions Made Section */}
      {decisionsByWorkstream.length > 0 && (
        <ContentTypeSection
          title="Decisions Made"
          icon="✅"
          color="green"
          contentByWorkstream={decisionsByWorkstream}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          showEmphasis={showEmphasis}
          sectionContext="decisions_made"
          onRequestCriticalThinking={onRequestCriticalThinking}
          transcript={transcript}
          meetingTitle={meetingTitle}
          meetingPurpose={meetingPurpose}
        />
      )}

      {/* Risks or Open Questions Section */}
      {risksByWorkstream.length > 0 && (
        <ContentTypeSection
          title="Risks or Open Questions"
          icon="❓"
          color="amber"
          contentByWorkstream={risksByWorkstream}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          showRiskLevel
          showEmphasis={showEmphasis}
          sectionContext="risks_or_open_questions"
          onRequestCriticalThinking={onRequestCriticalThinking}
          transcript={transcript}
          meetingTitle={meetingTitle}
          meetingPurpose={meetingPurpose}
        />
      )}
    </>
  );
};

/**
 * Content Type Section - Renders a single content type with workstreams as sub-sections
 */
const ContentTypeSection: React.FC<{
  title: string;
  icon: string;
  color: 'blue' | 'green' | 'amber';
  contentByWorkstream: { workstream_name: string; items: any[] }[];
  expandedSections: Record<string, boolean>;
  toggleSection: (name: string) => void;
  showRiskLevel?: boolean;
  showEmphasis: boolean;
  sectionContext?: string;
  onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
  transcript?: string;
  meetingTitle?: string;
  meetingPurpose?: string;
}> = ({ title, icon, color, contentByWorkstream, expandedSections, toggleSection, showRiskLevel = false, showEmphasis, sectionContext, onRequestCriticalThinking, transcript, meetingTitle, meetingPurpose }) => {

  // State to track fetched critical thinking analyses (persistent, using "workstream-itemIdx" as key)
  const [fetchedAnalyses, setFetchedAnalyses] = useState<Record<string, CriticalThinkingAnalysis>>({});
  // State to track which items are currently expanded (toggle)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [loadingCriticalThinking, setLoadingCriticalThinking] = useState<Record<string, boolean>>({});
  const [errorCriticalThinking, setErrorCriticalThinking] = useState<Record<string, string>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleCriticalThinkingClick = async (workstreamName: string, itemIndex: number, itemText: string) => {
    const key = `${workstreamName}-${itemIndex}`;

    // If already fetched, just toggle expansion
    if (fetchedAnalyses[key]) {
      setExpandedItems(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
      return;
    }

    // Check if we have the required data
    if (!onRequestCriticalThinking || !transcript || !meetingTitle || !meetingPurpose || !sectionContext) {
      console.error('Missing required data for critical thinking request');
      setErrorCriticalThinking(prev => ({
        ...prev,
        [key]: 'Critical thinking is not available for this item.'
      }));
      return;
    }

    // Set loading state
    setLoadingCriticalThinking(prev => ({ ...prev, [key]: true }));
    setErrorCriticalThinking(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });

    try {
      const request: CriticalThinkingRequest = {
        line_text: itemText,
        line_context: sectionContext,
        workstream_name: workstreamName,
        full_transcript: transcript,
        meeting_title: meetingTitle,
        meeting_purpose: meetingPurpose,
      };

      const analysis = await onRequestCriticalThinking(request);

      // Store in persistent cache
      setFetchedAnalyses(prev => ({
        ...prev,
        [key]: analysis
      }));

      // Expand by default
      setExpandedItems(prev => ({
        ...prev,
        [key]: true
      }));
    } catch (error) {
      console.error('Error fetching critical thinking analysis:', error);
      setErrorCriticalThinking(prev => ({
        ...prev,
        [key]: error instanceof Error ? error.message : 'Failed to load critical thinking analysis.'
      }));
    } finally {
      setLoadingCriticalThinking(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  const sectionKey = title; // Use title as the key for expansion state
  const isExpanded = expandedSections[sectionKey] !== false; // Default to expanded

  const borderColorClasses = {
    blue: 'border-blue-200 dark:border-blue-800',
    green: 'border-green-200 dark:border-green-800',
    amber: 'border-amber-200 dark:border-amber-800',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50/30 dark:bg-blue-900/10',
    green: 'bg-green-50/30 dark:bg-green-900/10',
    amber: 'bg-amber-50/30 dark:bg-amber-900/10',
  };

  const showCriticalThinkingButton = onRequestCriticalThinking && transcript && meetingTitle && meetingPurpose;

  return (
    <section className="scroll-mt-24">
      {/* Section Title - Collapsible */}
      <div
        className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors mb-4"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          <Icon
            name={isExpanded ? "chevron-down" : "chevron-right"}
            className="h-4 w-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
          />
          <span className="text-base">{icon}</span>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
            {title}
          </h2>
        </div>
        <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-slate-700 dark:via-slate-600 dark:to-transparent mt-2" />
      </div>

      {/* Content - Collapsible with animation */}
      {isExpanded && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${bgColorClasses[color]} rounded-lg p-5 border-l-2 ${borderColorClasses[color]}`}>
          <div className="space-y-6">
            {contentByWorkstream.map((ws, idx) => (
              <div key={idx}>
                {/* Workstream name as sub-header */}
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                  {ws.workstream_name}
                </h3>
                {/* Items */}
                <ul className="space-y-3">
                  {ws.items.map((item: any, itemIdx: number) => {
                    const itemKey = `${ws.workstream_name}-${itemIdx}`;
                    return (
                      <li
                        key={itemIdx}
                        className="flex items-start gap-3 group"
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <span className="text-slate-400 dark:text-slate-600 mt-0.5 select-none" style={{ fontSize: '0.75rem' }}>
                          •
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <EmphasisText
                                text={item.text}
                                emphasis={item.emphasis}
                                className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed"
                                showEmphasis={showEmphasis}
                              />
                              {showRiskLevel && item.risk_level && (
                                <RiskLevelBadge level={item.risk_level} />
                              )}
                            </div>
                            {/* Critical Thinking Button - Shows on hover, when loading, or when analysis is fetched */}
                            {showCriticalThinkingButton && (
                              <button
                                onClick={() => handleCriticalThinkingClick(ws.workstream_name, itemIdx, item.text)}
                                className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-200 ${
                                  hoveredItem === itemKey || fetchedAnalyses[itemKey] || loadingCriticalThinking[itemKey]
                                    ? 'opacity-100 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50'
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                                title="Critical Thinking (C)"
                                aria-label="Get critical thinking analysis"
                              >
                                {loadingCriticalThinking[itemKey] ? (
                                  <Icon name="loader" className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                                ) : (
                                  <span className="text-base leading-none">💭</span>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Critical Thinking Panel - Only show if expanded AND fetched */}
                          {expandedItems[itemKey] && fetchedAnalyses[itemKey] && (
                            <CriticalThinkingPanel
                              analysis={fetchedAnalyses[itemKey]}
                              onClose={() => handleCriticalThinkingClick(ws.workstream_name, itemIdx, item.text)}
                            />
                          )}

                          {/* Error Message */}
                          {errorCriticalThinking[itemKey] && (
                            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                              <p className="text-sm text-red-700 dark:text-red-300">{errorCriticalThinking[itemKey]}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
