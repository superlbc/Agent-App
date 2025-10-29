import React, { useState, useEffect } from 'react';
import { EmphasisText } from './EmphasisText';
import { Icon } from './ui/Icon';
import { SummaryCard } from './SummaryCard';
import { CriticalReview, RiskAssessment, UnassignedTask } from '../types';

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
}

/**
 * Modern, clean view for structured meeting notes with emphasis rendering.
 * Inspired by Notion and Linear's design principles: centered titles, generous
 * spacing, clean typography, and subtle visual hierarchy.
 */
export const StructuredNotesView: React.FC<StructuredNotesViewProps> = ({ data, executiveSummary, criticalReview, className = '', showEmphasis, groupingMode }) => {
  const { meeting_title, meeting_purpose, workstream_notes } = data;

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
}> = ({ workstream, isExpanded, onToggle, showEmphasis }) => {
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
}> = ({ icon, title, items, color, showRiskLevel = false, showEmphasis }) => {
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

  return (
    <div className={`${bgColorClasses[color]} rounded-lg p-5 border-l-2 ${borderColorClasses[color]}`}>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
        <span className="text-base">{icon}</span>
        <span>{title}</span>
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
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
              {showRiskLevel && item.risk_level && (
                <RiskLevelBadge level={item.risk_level} />
              )}
            </div>
          </li>
        ))}
      </ul>
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
}> = ({ workstreams, expandedSections, toggleSection, showEmphasis }) => {
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
}> = ({ title, icon, color, contentByWorkstream, expandedSections, toggleSection, showRiskLevel = false, showEmphasis }) => {
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
                  {ws.items.map((item: any, itemIdx: number) => (
                    <li key={itemIdx} className="flex items-start gap-3">
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
                        {showRiskLevel && item.risk_level && (
                          <RiskLevelBadge level={item.risk_level} />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
