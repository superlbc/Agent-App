import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentResponse, Controls, CoachInsights, CoachFlags, FormState, ApiConfig, NextStep, Participant } from '../types';
import { Card } from './ui/Card';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { exportToCsv } from '../utils/export';
import { Chip } from './ui/Chip';
import { markdownToHtml } from '../utils/formatting';
import { InterrogateTranscriptModal } from './InterrogateTranscriptModal';
import { telemetryService } from '../utils/telemetryService';
import { formatDate } from '../utils/dateFormatting';
import { useLanguage } from '../hooks/useLanguage';
import { StructuredNotesView } from './StructuredNotesView';
import { useTableSort } from '../hooks/useTableSort';
import { useTableFilter } from '../hooks/useTableFilter';
import { TableFilters } from './TableFilters';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip } from './ui/Tooltip';

interface OutputPanelProps {
  output: AgentResponse | null;
  isLoading: boolean;
  error: string | null;
  controls: Controls;
  addToast: (message: string, type?: 'success' | 'error') => void;
  formState: FormState;
  apiConfig: ApiConfig;
  participants: Participant[];
}

const renderWithBold = (text: string): React.ReactNode => {
    const regex = /(\*\*|__)(.*?)\1/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={key++} className="font-semibold text-slate-900 dark:text-slate-100">{match[2]}</strong>);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    return parts.length > 1 ? parts : text;
};

const renderStatus = (status: string): React.ReactNode => {
    const statusUpper = status?.toUpperCase();

    const statusStyles: Record<string, string> = {
        'GREEN': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
        'AMBER': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        'RED': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
        'NA': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600',
    };

    const styleClass = statusStyles[statusUpper] || statusStyles['NA'];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styleClass}`}>
            {status || 'N/A'}
        </span>
    );
};

const NextStepsTable: React.FC<{ nextSteps: NextStep[] }> = ({ nextSteps }) => {
    const { t } = useTranslation(['common']);
    const { currentLanguage } = useLanguage();
    const [showFilters, setShowFilters] = useState(false);

    // Get unique values for filters
    const uniqueDepartments = useMemo(() => Array.from(new Set(nextSteps.map(s => s.department))).sort(), [nextSteps]);
    const uniqueOwners = useMemo(() => Array.from(new Set(nextSteps.map(s => s.owner).filter(Boolean))).sort(), [nextSteps]);
    const uniqueStatuses = useMemo(() => ['RED', 'AMBER', 'GREEN', 'NA'], []);

    // Initialize sorting
    const { sortedData: sortedSteps, requestSort, getSortIndicator } = useTableSort<NextStep>(nextSteps);

    // Initialize filtering
    const {
        filteredData: filteredSteps,
        filters,
        setFilter,
        clearAllFilters,
        setSearchQuery,
        searchQuery,
        activeFilterCount
    } = useTableFilter<NextStep>(
        sortedSteps,
        ['department', 'owner', 'task', 'due_date', 'status', 'status_notes'],
        'nextStepsTable'
    );

    const columns: { key: keyof NextStep; label: string; sortable: boolean }[] = [
        { key: 'department', label: t('common:nextSteps.headers.department'), sortable: true },
        { key: 'owner', label: t('common:nextSteps.headers.owner'), sortable: true },
        { key: 'task', label: t('common:nextSteps.headers.task'), sortable: true },
        { key: 'due_date', label: t('common:nextSteps.headers.dueDate'), sortable: true },
        { key: 'status', label: t('common:nextSteps.headers.status'), sortable: true },
        { key: 'status_notes', label: t('common:nextSteps.headers.statusNotes'), sortable: false },
    ];

    return (
        <div id="next-steps-table" className="my-6 space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center justify-between">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Icon name="filter" className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                    {filteredSteps.length} of {nextSteps.length} action{nextSteps.length === 1 ? '' : 's'}
                </span>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <TableFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    departments={uniqueDepartments}
                    selectedDepartments={filters.department || []}
                    onDepartmentsChange={(depts) => setFilter('department', depts.length > 0 ? depts : undefined)}
                    owners={uniqueOwners}
                    selectedOwners={filters.owner || []}
                    onOwnersChange={(owners) => setFilter('owner', owners.length > 0 ? owners : undefined)}
                    statuses={uniqueStatuses}
                    selectedStatuses={filters.status || []}
                    onStatusesChange={(statuses) => setFilter('status', statuses.length > 0 ? statuses : undefined)}
                    onClearAll={clearAllFilters}
                    activeFilterCount={activeFilterCount}
                />
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    scope="col"
                                    className={`px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 tracking-wider uppercase border-b border-slate-200 dark:border-slate-700 ${
                                        col.sortable ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none' : ''
                                    }`}
                                    onClick={() => col.sortable && requestSort(col.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{col.label}</span>
                                        {col.sortable && (
                                            <span className="text-slate-400 dark:text-slate-500">
                                                {getSortIndicator(col.key)}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                        {filteredSteps.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                    {nextSteps.length === 0 ? 'No action items' : 'No action items match your filters'}
                                </td>
                            </tr>
                        ) : (
                            filteredSteps.map((row, i) => (
                                <tr key={i} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.department}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.owner}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.task}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{formatDate(row.due_date, currentLanguage)}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{renderStatus(row.status)}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.status_notes}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const MarkdownRenderer: React.FC<{ content: string, nextStepsReplacement?: React.ReactNode }> = ({ content, nextStepsReplacement }) => {
    const elements: React.ReactNode[] = [];
    const lines = content.split('\n');

    let listItems: React.ReactNode[] = [];
    let inList = false;
    let skippingNextStepsTable = false;

    let inTable = false;
    let tableRows: React.ReactNode[] = [];
    let tableHeaders: React.ReactNode[] = [];
    let hasRenderedFirstWorkstream = false;

    const flushList = () => {
        if (inList && listItems.length > 0) {
            elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-8 space-y-3 my-4 text-slate-700 dark:text-slate-300">{listItems}</ul>);
            listItems = [];
        }
        inList = false;
    };
    
    const flushTable = () => {
        if (inTable) {
            elements.push(
                <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
                    <table className="min-w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                        {tableHeaders.length > 0 && (
                            <thead className="bg-slate-100 dark:bg-slate-800">
                                <tr>{tableHeaders}</tr>
                            </thead>
                        )}
                        <tbody className="bg-white dark:bg-slate-900">
                            {tableRows}
                        </tbody>
                    </table>
                </div>
            );
        }
        inTable = false;
        tableRows = [];
        tableHeaders = [];
    };
    
    // FIX: Updated regex to match headers that start with markdown hashes OR diamond symbols.
    const MAJOR_HEADER_REGEX = /^(?:#{2,3}\s*|([🔷◆]+\s*))([A-Z\s\/]+)(\s*[🔷◆]+)?\s*$/;
    const SUBSECTION_HEADERS_PLAIN = ["KEY DISCUSSION POINTS", "DECISIONS MADE", "RISKS OR OPEN QUESTIONS", "Gaps / Missing Topics", "Risk Assessment", "Unassigned / Ambiguous Tasks"];
    
    // Create a more specific regex for subsections to avoid accidentally matching list items.
    const subSectionTitlesForRegex = SUBSECTION_HEADERS_PLAIN.map(t => t.replace(/(\/)/g, '\\$1')).join('|');
    const subSectionRegex = new RegExp(`^(?:###\\s*)?([🎯✅❓])?\\s*(${subSectionTitlesForRegex})\\s*$`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const key = `line-${i}`;

        const majorHeaderMatch = trimmed.match(MAJOR_HEADER_REGEX);
        // The title is always in group 2 with the updated regex.
        const isNextStepsHeader = majorHeaderMatch && majorHeaderMatch[2].trim() === 'NEXT STEPS';

        if (skippingNextStepsTable) {
            if (majorHeaderMatch && !isNextStepsHeader) {
                skippingNextStepsTable = false;
                // Fall through to process the new header
            } else {
                continue; // Skip lines of the markdown table
            }
        }
        
        if (trimmed === '') {
            flushList();
            flushTable();
            continue;
        }

        if (trimmed.startsWith('|')) {
            flushList();
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            
            if (cells.every(c => /^-+$/.test(c))) {
                continue;
            }

            if (!inTable) {
                inTable = true;
                tableHeaders = cells.map((cell, cellIndex) => (
                    <th key={cellIndex} scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 tracking-wider uppercase border-b border-slate-200 dark:border-slate-700">
                        {renderWithBold(cell)}
                    </th>
                ));
            } else {
                const isEven = tableRows.length % 2 === 1;
                tableRows.push(
                    <tr key={`row-${i}`} className={isEven ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                        {cells.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">
                                {renderWithBold(cell)}
                            </td>
                        ))}
                    </tr>
                );
            }
            continue;
        } else if (inTable) {
            flushTable();
        }

        // Handle H1 (Title) - assumed to be the very first non-empty line
        if (elements.length === 0 && !trimmed.startsWith('Meeting Purpose:')) {
            elements.push(<h1 key={key} className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">{renderWithBold(trimmed)}</h1>);
            continue;
        }
        
        if (isNextStepsHeader && nextStepsReplacement) {
            flushList();
            const titleText = 'NEXT STEPS';
            const id = titleText.toLowerCase().replace(/\s+/g, '-');
            elements.push(<h2 key={key} id={`${id}-section`} className="text-2xl font-semibold mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-3 text-slate-800 dark:text-slate-200">{renderWithBold(titleText)}</h2>);
            elements.push(nextStepsReplacement);
            skippingNextStepsTable = true;
            continue;
        }

        if (majorHeaderMatch) {
            flushList();
            const titleText = majorHeaderMatch[2].trim();
            const id = titleText.toLowerCase().replace(/\s+/g, '-');
            elements.push(<h2 key={key} id={`${id}-section`} className="text-2xl font-semibold mt-10 mb-5 border-b-2 border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-3 text-slate-800 dark:text-slate-200">{renderWithBold(titleText)}</h2>);
            continue;
        }
        
        if (trimmed.startsWith('🔸') || trimmed.startsWith('#### 🔸') || trimmed.startsWith('◆')) {
            flushList();
            const titleText = trimmed.replace(/#/g, '').replace(/[🔸◆]/g, '').trim();
            let id = `${titleText.toLowerCase().replace(/\s+/g, '-')}-section`;
            if (!hasRenderedFirstWorkstream) {
                id = 'first-workstream-section';
                hasRenderedFirstWorkstream = true;
            }
            elements.push(<h3 key={key} id={id} className="text-xl font-semibold mt-6 mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="text-sm text-primary">◆</span> {renderWithBold(titleText)}</h3>);
            continue;
        }
        
        const subSectionMatch = trimmed.match(subSectionRegex);
        if (subSectionMatch) {
            flushList();
            const icon = subSectionMatch[1] || '';
            const title = subSectionMatch[2].trim();
            elements.push(<h4 key={key} className="text-base font-semibold mt-6 mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">{icon} {renderWithBold(title)}</h4>);
            inList = true; // Any non-empty, non-header line after this is a list item
            continue;
        }
        
        if (trimmed.startsWith('---')) {
            flushList();
            elements.push(<hr key={key} className="my-6 border-slate-200 dark:border-slate-700" />);
            continue;
        }

        if (trimmed.startsWith('Meeting Purpose:')) {
            flushList();
            elements.push(<p key={key} className="text-slate-600 dark:text-slate-400 mb-8">{renderWithBold(trimmed.substring('Meeting Purpose:'.length).trim())}</p>);
            continue;
        }
        
        if (inList || trimmed.startsWith('- ')) {
            if (!inList) { inList = true; } // Start a new list if we encounter a list item
            if (trimmed.toLowerCase().includes('no notes for this section')) {
                 if(inList) { // If we were expecting a list, flush it before showing this message.
                    flushList();
                 }
                 elements.push(<p key={key} className="italic text-slate-500 dark:text-slate-400 my-3">{trimmed}</p>);
                 inList = false; // This note ends the list for this section.
                 continue;
            }
            const content = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed;
            listItems.push(<li key={key} className="leading-relaxed">{renderWithBold(content)}</li>);
        } else if (trimmed.length > 0) {
            flushList();
            elements.push(<p key={key} className="my-3">{renderWithBold(trimmed)}</p>);
        }
    }
    
    flushList();
    flushTable();

    return <div className="text-base leading-loose text-slate-700 dark:text-slate-300">{elements}</div>;
};


const ExportBar: React.FC<{ output: AgentResponse, title: string, addToast: OutputPanelProps['addToast'], onInterrogate: () => void, participants: Participant[], showEmphasis: boolean, toggleEmphasis: () => void, groupingMode: 'by-topic' | 'by-type', setGroupingMode: (mode: 'by-topic' | 'by-type') => void }> = ({ output, title, addToast, onInterrogate, participants, showEmphasis, toggleEmphasis, groupingMode, setGroupingMode }) => {
    const { t } = useTranslation(['common']);
    const { graphData } = useAuth();
    const markdownContent = output.markdown || '';
    const nextSteps = output.next_steps || [];

    const handleCopy = async () => {
        const htmlBody = markdownToHtml(markdownContent);

        try {
            const blobHtml = new Blob([htmlBody], { type: 'text/html' });
            const blobText = new Blob([markdownContent], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText,
            });
            await navigator.clipboard.write([clipboardItem]);

            // Telemetry: Track clipboard copy
            telemetryService.trackEvent('copiedToClipboard', {
                contentLength: markdownContent.length,
                format: 'richText'
            });

            addToast(t('common:toasts.notesCopied'), 'success');
        } catch (err) {
            console.error('Failed to copy rich text, falling back to plain text:', err);
            await navigator.clipboard.writeText(markdownContent);

            // Telemetry: Track fallback copy
            telemetryService.trackEvent('copiedToClipboard', {
                contentLength: markdownContent.length,
                format: 'plainText'
            });

            addToast(t('common:toasts.notesCopiedPlain'), 'success');
        }
    };

    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if(!printWindow) {
            addToast(t('common:toasts.printWindowBlocked'), 'error');
            return;
        }

        // Telemetry: Track PDF export
        telemetryService.trackEvent('exportedToPDF', {
            contentLength: markdownContent.length,
            title: title
        });

        const htmlContent = markdownToHtml(markdownContent);
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: letter; margin: 1in; }
                        body { font-family: -apple-system, BlinkMacFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #333; }
                        h1, h2, h3, h4, h5, h6 { color: #111; page-break-after: avoid; }
                        h1 { font-size: 22pt; font-weight: bold; margin-bottom: 0.5em; }
                        h2 { font-size: 16pt; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 1em; }
                        h3 { font-size: 13pt; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
                        p, ul { margin-bottom: 1em; }
                        ul { padding-left: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 8pt; page-break-inside: auto; margin-top: 1em; }
                        thead { display: table-header-group; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top; word-wrap: break-word; }
                        th { background-color: #f7f7f7; font-weight: bold; }
                        tbody tr:nth-child(even) { background-color: #f7f7f7; }
                        hr { border: 0; border-top: 1px solid #eee; margin: 2em 0; }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleDraftEmail = async () => {
        const intro = `Hi Team,\n\nPlease find the notes and action items from our recent meeting below.\n\n---\n\n`;

        // Strip out the NEXT STEPS section from markdownContent to avoid duplication
        // We'll add our own programmatic table instead
        let cleanedMarkdown = markdownContent;
        const nextStepsHeaderRegex = /^(?:#{2,3}\s*)?(?:[🔷◆]+\s*)?NEXT STEPS(?:\s*[🔷◆]+)?\s*$/im;
        const nextStepsIndex = cleanedMarkdown.search(nextStepsHeaderRegex);

        if (nextStepsIndex !== -1) {
            // Find the next major section header or end of content
            const afterNextSteps = cleanedMarkdown.substring(nextStepsIndex);
            const nextSectionRegex = /\n(?:#{2,3}\s*)?(?:[🔷◆]+\s*)?[A-Z\s\/]+(?:\s*[🔷◆]+)?\s*\n/;
            const nextSectionMatch = afterNextSteps.substring(1).search(nextSectionRegex);

            if (nextSectionMatch !== -1) {
                // Remove from NEXT STEPS to the next section
                cleanedMarkdown = cleanedMarkdown.substring(0, nextStepsIndex) +
                                 afterNextSteps.substring(nextSectionMatch + 1);
            } else {
                // Remove from NEXT STEPS to end of document
                cleanedMarkdown = cleanedMarkdown.substring(0, nextStepsIndex);
            }
        }

        // Build Next Steps table in markdown
        let nextStepsTable = '';
        if (nextSteps && nextSteps.length > 0) {
            nextStepsTable = '\n\n## Next Steps\n\n';
            nextStepsTable += '| Department | Owner | Task | Due Date | Status | Notes |\n';
            nextStepsTable += '|------------|-------|------|----------|--------|-------|\n';
            nextSteps.forEach(step => {
                const dept = step.department || 'General';
                const owner = step.owner || 'Unassigned';
                const task = (step.task || '').replace(/\|/g, '\\|'); // Escape pipes
                const dueDate = step.due_date || 'Not specified';
                const status = step.status || 'NA';
                const notes = (step.status_notes || '').replace(/\|/g, '\\|'); // Escape pipes
                nextStepsTable += `| ${dept} | ${owner} | ${task} | ${dueDate} | ${status} | ${notes} |\n`;
            });
        }

        const fullMarkdown = intro + cleanedMarkdown + nextStepsTable;
        const htmlBody = markdownToHtml(fullMarkdown);

        // Get matched participant emails
        const participantEmails = participants
            .filter(p => p.matched && p.email)
            .map(p => p.email)
            .filter((email): email is string => email !== undefined);

        // Telemetry: Track email draft export with participant count
        telemetryService.trackEvent('exportedToEmail', {
            contentLength: fullMarkdown.length,
            actionItemCount: nextSteps.length,
            participantCount: participantEmails.length
        });

        try {
            const blobHtml = new Blob([htmlBody], { type: 'text/html' });
            const blobText = new Blob([fullMarkdown], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText,
            });
            await navigator.clipboard.write([clipboardItem]);
            addToast(t('common:toasts.emailCopied'), 'success');
        } catch (err) {
            console.error('Failed to copy rich text, falling back to plain text:', err);
            await navigator.clipboard.writeText(fullMarkdown);
            addToast(t('common:toasts.emailCopiedPlain'), 'success');
        }

        const subject = encodeURIComponent(`Meeting Notes: ${title}`);
        const body = encodeURIComponent("Meeting notes have been copied to your clipboard. Please paste them here.");

        // Separate logged user from participants
        const loggedUserEmail = graphData?.mail?.toLowerCase();

        // To field: participants only (excluding logged user if they're in the list)
        const toEmails = participantEmails.filter(
            email => email.toLowerCase() !== loggedUserEmail
        );

        // CC field: logged user only
        const ccEmails = loggedUserEmail ? [graphData!.mail!] : [];

        // Build mailto link with To and CC fields
        const emailTo = toEmails.length > 0 ? toEmails.join(';') : '';
        const emailCc = ccEmails.length > 0 ? ccEmails.join(';') : '';
        const mailtoLink = `mailto:${emailTo}?subject=${subject}&body=${body}${emailCc ? `&cc=${emailCc}` : ''}`;

        const a = document.createElement('a');
        a.href = mailtoLink;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadCsv = () => {
        if (!nextSteps || nextSteps.length === 0) {
            addToast(t('common:toasts.noActionsToExport'), 'error');
            return;
        }

        // Telemetry: Track CSV export
        telemetryService.trackEvent('exportedToCSV', {
            actionItemCount: nextSteps.length,
            fileName: `next_steps_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`
        });

        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        exportToCsv(nextSteps, `next_steps_${safeTitle}.csv`);
        addToast(t('common:toasts.csvDownloaded'), 'success');
    };

    return (
        <div id="export-bar" className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}><Icon name="copy" className="h-4 w-4 mr-2"/> {t('common:actions.copyToClipboard')}</Button>
                <Button size="sm" variant="outline" onClick={handleDownloadPdf}><Icon name="pdf" className="h-4 w-4 mr-2"/> {t('common:actions.downloadPDF')}</Button>
                <Button size="sm" variant="outline" onClick={handleDownloadCsv}><Icon name="csv" className="h-4 w-4 mr-2"/> {t('common:actions.downloadCSVActions')}</Button>
                <Button size="sm" variant="outline" onClick={handleDraftEmail}><Icon name="email" className="h-4 w-4 mr-2"/> {t('common:actions.draftEmail')}</Button>
            </div>
            <div className="flex items-center gap-2">
                {/* Grouping Mode Toggle - Segmented Control */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
                  <Tooltip content={
                    <div className="text-center">
                      <div className="font-semibold">Group by Topic</div>
                      <div className="text-xs mt-1 opacity-90">Organize notes by workstream/topic</div>
                    </div>
                  }>
                    <button
                      onClick={() => setGroupingMode('by-topic')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        groupingMode === 'by-topic'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      aria-label="Group by Topic"
                    >
                      <span>📊</span>
                      <span>By Topic</span>
                    </button>
                  </Tooltip>
                  <Tooltip content={
                    <div className="text-center">
                      <div className="font-semibold">Group by Type</div>
                      <div className="text-xs mt-1 opacity-90">Organize by content type (discussions, decisions, risks)</div>
                    </div>
                  }>
                    <button
                      onClick={() => setGroupingMode('by-type')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        groupingMode === 'by-type'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      aria-label="Group by Type"
                    >
                      <span>📝</span>
                      <span>By Type</span>
                    </button>
                  </Tooltip>
                </div>

                {/* Emphasis Toggle - Icon Only */}
                <Tooltip content={
                  <div className="text-center">
                    <div className="font-semibold">Toggle Emphasis</div>
                    <div className="text-xs mt-1 opacity-90">{showEmphasis ? 'Hide emphasis styling' : 'Show emphasis styling'}</div>
                    <div className="text-xs mt-1 opacity-75">Press <kbd className="px-1 py-0.5 bg-slate-700 rounded">F</kbd> to toggle</div>
                  </div>
                }>
                  <button
                    onClick={toggleEmphasis}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      showEmphasis
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500 dark:ring-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    aria-label="Toggle Emphasis Styling"
                  >
                    <Icon name={showEmphasis ? "highlight" : "text"} className="h-4 w-4" />
                  </button>
                </Tooltip>

                <Button id="interrogate-transcript-button" size="sm" variant="primary" onClick={onInterrogate}>
                    <Icon name="interrogate" className="h-4 w-4 mr-2"/> {t('common:actions.interrogateTranscript')}
                </Button>
            </div>
        </div>
    );
};

const MeetingCoachPanel: React.FC<{ insights: CoachInsights }> = ({ insights }) => {
    const { t } = useTranslation(['common']);
    const { strengths, improvements, facilitation_tips, metrics, flags } = insights;

    const flagEntries = Object.entries(flags).filter(([, value]) => value === true);

    // Telemetry: Track coach panel viewed (on mount)
    useEffect(() => {
        telemetryService.trackEvent('meetingCoachViewed', {
            hasStrengths: (strengths?.length || 0) > 0,
            hasImprovements: (improvements?.length || 0) > 0,
            hasFacilitationTips: (facilitation_tips?.length || 0) > 0,
            flagCount: flagEntries.length,
            agendaCoveragePct: metrics.agenda_coverage_pct,
            decisionCount: metrics.decision_count
        });
    }, []); // Run once on mount

    const flagLabels: Record<keyof CoachFlags, string> = {
        participation_imbalance: t('common:meetingCoach.flags.participationImbalance'),
        many_unassigned_actions: t('common:meetingCoach.flags.manyUnassignedActions'),
        few_decisions: t('common:meetingCoach.flags.fewDecisions'),
        light_agenda_coverage: t('common:meetingCoach.flags.lightAgendaCoverage'),
        low_participation_rate: t('common:meetingCoach.flags.lowParticipationRate', { defaultValue: 'Low Participation Rate' }),
        silent_required_attendees: t('common:meetingCoach.flags.silentRequiredAttendees', { defaultValue: 'Silent Required Attendees' }),
    };

    return (
        <>
            {/* Centered Section Title */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                    {t('common:meetingCoach.title')}
                </h2>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent mx-auto max-w-xs" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {strengths && strengths.length > 0 && (
                    <Card className="p-5 bg-green-50/50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/30">
                        <h3 className="text-base font-semibold text-green-800 dark:text-green-200 mb-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                            {t('common:meetingCoach.sections.whatWorkedWell')}
                        </h3>
                        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                            {strengths.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5 select-none">•</span>
                                    <span className="flex-1">{renderWithBold(item)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
                {improvements && improvements.length > 0 && (
                    <Card className="p-5 bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30">
                        <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                            {t('common:meetingCoach.sections.nextTimeTry')}
                        </h3>
                        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                            {improvements.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 mt-0.5 select-none">•</span>
                                    <span className="flex-1">{renderWithBold(item)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
                {facilitation_tips && facilitation_tips.length > 0 && (
                     <Card className="p-5 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30">
                        <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                            {t('common:meetingCoach.sections.facilitationTips')}
                        </h3>
                        <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                            {facilitation_tips.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5 select-none">•</span>
                                    <span className="flex-1">{renderWithBold(item)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                    {t('common:meetingCoach.healthSnapshot.title')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.agenda_coverage_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.metrics.agendaCoverage')}</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.decision_count}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.metrics.decisionsMade')}</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.actions_with_owner_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.metrics.actionsWithOwner')}</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.actions_with_due_date_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.metrics.actionsWithDueDate')}</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.top_speaker_share_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.metrics.topSpeakerShare')}</div>
                    </div>
                </div>
                 {flagEntries.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('common:meetingCoach.healthSnapshot.flagsLabel')}</span>
                        {flagEntries.map(([key]) => (
                            <Chip key={key} selected>{flagLabels[key as keyof CoachFlags]}</Chip>
                        ))}
                    </div>
                 )}
            </div>
            
            <div className="mt-6 text-right">
                <a
                    href="https://interpublic.sharepoint.com/sites/MomentumIntranet/SitePages/Best%20Practices.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                    {t('common:meetingCoach.meetingExcellenceLink')}
                </a>
            </div>
        </>
    );
};

export const OutputPanel: React.FC<OutputPanelProps> = ({ output, isLoading, error, controls, addToast, formState, apiConfig, participants }) => {
  const { t } = useTranslation(['common']);
  const [isInterrogateModalOpen, setIsInterrogateModalOpen] = useState(false);

  // Emphasis Toggle state with sessionStorage persistence
  // By default, emphasis is shown (true)
  const [showEmphasis, setShowEmphasis] = useState(() => {
    try {
      const stored = sessionStorage.getItem('showEmphasis');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  // Save emphasis toggle state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('showEmphasis', showEmphasis.toString());
  }, [showEmphasis]);

  // Grouping Mode state with localStorage persistence (user preference)
  const [groupingMode, setGroupingMode] = useState<'by-topic' | 'by-type'>(() => {
    try {
      const stored = localStorage.getItem('groupingMode');
      return (stored === 'by-type' ? 'by-type' : 'by-topic') as 'by-topic' | 'by-type';
    } catch {
      return 'by-topic';
    }
  });

  // Save grouping mode state to localStorage
  useEffect(() => {
    localStorage.setItem('groupingMode', groupingMode);
  }, [groupingMode]);

  // Keyboard shortcut for Emphasis Toggle (F key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if F key is pressed (not in an input/textarea)
      if (e.key === 'f' || e.key === 'F') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setShowEmphasis(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-scroll to top and reset emphasis toggle when new notes are generated
  useEffect(() => {
    if (output && output.markdown) {
      // Reset emphasis (show emphasis by default when new notes arrive)
      setShowEmphasis(true);

      // Scroll to the top of the generated notes
      setTimeout(() => {
        const notesContent = document.getElementById('generated-notes-content');
        if (notesContent) {
          notesContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [output?.markdown]); // Run when output changes

  const toggleEmphasis = () => {
    setShowEmphasis(prev => !prev);
  };

  const handleInterrogateOpen = () => {
    // Telemetry: Track transcript interrogation
    telemetryService.trackEvent('transcriptInterrogated', {
      transcriptLength: formState.transcript.length
    });
    setIsInterrogateModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <Card>
        <SkeletonLoader />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
            <Icon name="error" className="h-12 w-12 mx-auto mb-4 text-red-400"/>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Generation Failed</h3>
            <p className="mt-2 text-sm text-red-500 dark:text-red-400/80">{error}</p>
        </div>
      </Card>
    );
  }

  if (!output || !output.markdown) {
    return (
      <Card className="p-12 text-center" id="output-placeholder">
        <Icon name="document" className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600"/>
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">{t('common:output.emptyState.title')}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('common:output.emptyState.description')}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 relative">
        {/* Sticky Export Bar */}
        <div className="sticky top-24 z-20 -mx-6 -mt-6 mb-6">
          <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
             <ExportBar
                output={output}
                title={output.markdown.split('\n')[0].replace('# ', '')}
                addToast={addToast}
                onInterrogate={handleInterrogateOpen}
                participants={participants}
                showEmphasis={showEmphasis}
                toggleEmphasis={toggleEmphasis}
                groupingMode={groupingMode}
                setGroupingMode={setGroupingMode}
              />
          </div>
        </div>
         <div id="generated-notes-content">
          <div className="flex justify-end gap-2 mb-4">
              {/* Focus Department (if selected) */}
              {controls.focus_department.length > 0 && (
                  <Chip className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800">
                    {controls.focus_department.join(', ')}
                  </Chip>
              )}

              {/* Tone */}
              <Chip className="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800">
                {t(`constants:tone.${controls.tone === 'client-ready' ? 'clientReady' : controls.tone}`)}
              </Chip>

              {/* Audience */}
              <Chip className="bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800">
                {t(`constants:audienceShort.${controls.audience === 'department-specific' ? 'departmentSpecific' : controls.audience === 'cross-functional' ? 'crossFunctional' : controls.audience}`)}
              </Chip>

              {/* Meeting Preset */}
              <Chip className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                {controls.meetingPreset === 'custom'
                  ? 'Custom'
                  : t(`constants:presets.${controls.meetingPreset === 'client-update' ? 'clientUpdate' : controls.meetingPreset === 'internal-sync' ? 'internalSync' : controls.meetingPreset === 'executive-briefing' ? 'executiveBriefing' : controls.meetingPreset}.name`)}
              </Chip>
          </div>
          {output.structured_data ? (
            <>
              <StructuredNotesView
                key={output.markdown?.substring(0, 50)} // Force remount on new output
                data={output.structured_data}
                executiveSummary={output.executive_summary}
                criticalReview={output.critical_review}
                showEmphasis={showEmphasis}
                groupingMode={groupingMode}
              />
              {output.next_steps && output.next_steps.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    NEXT STEPS
                  </h2>
                  <NextStepsTable nextSteps={output.next_steps} />
                </div>
              )}
            </>
          ) : (
            <MarkdownRenderer
              content={output.markdown}
              nextStepsReplacement={
                <NextStepsTable nextSteps={output.next_steps} />
              }
            />
          )}
          {output.coach_insights && (
              <div id="meeting-coach-panel" className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-center text-xs italic text-slate-500 dark:text-slate-400 mb-4 px-4">
                  {t('common:meetingCoach.disclaimer')}
                </p>
                <MeetingCoachPanel insights={output.coach_insights} />
              </div>
          )}
        </div>
      </Card>
      <InterrogateTranscriptModal
        isOpen={isInterrogateModalOpen}
        onClose={() => setIsInterrogateModalOpen(false)}
        formState={formState}
        apiConfig={apiConfig}
        addToast={addToast}
        suggestedQuestions={output.suggested_questions}
        participants={participants}
        controls={controls}
      />
    </>
  );
};