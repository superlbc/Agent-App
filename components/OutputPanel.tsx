import React, { useState } from 'react';
import { AgentResponse, Controls, CoachInsights, CoachFlags, FormState, ApiConfig, NextStep } from '../types';
import { Card } from './ui/Card';
import { SkeletonLoader } from './ui/SkeletonLoader';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { exportToCsv } from '../utils/export';
import { Chip } from './ui/Chip';
import { markdownToHtml } from '../utils/formatting';
import { InterrogateTranscriptModal } from './InterrogateTranscriptModal';

interface OutputPanelProps {
  output: AgentResponse | null;
  isLoading: boolean;
  error: string | null;
  controls: Controls;
  addToast: (message: string, type?: 'success' | 'error') => void;
  formState: FormState;
  apiConfig: ApiConfig;
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

const NextStepsTable: React.FC<{ nextSteps: NextStep[]; useIcons: boolean }> = ({ nextSteps, useIcons }) => {
    const headers = ['Department', 'Owner', 'Task', 'Due Date', 'Status', 'Status Notes'];

    const renderStatus = (status: NextStep['status']): React.ReactNode => {
        if (useIcons) {
            switch (status) {
                case 'GREEN': return <span className="h-4 w-4 rounded-sm inline-block bg-green-500" aria-label="Green status"></span>;
                case 'AMBER': return <span className="h-4 w-4 rounded-sm inline-block bg-amber-500" aria-label="Amber status"></span>;
                case 'RED': return <span className="h-4 w-4 rounded-sm inline-block bg-red-500" aria-label="Red status"></span>;
                default: return '—';
            }
        }
        return status;
    };

    return (
        <div id="next-steps-table" className="overflow-x-auto my-6">
            <table className="min-w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
                <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} scope="col" className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 tracking-wider uppercase border-b border-slate-200 dark:border-slate-700">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                    {nextSteps.length === 0 ? (
                        <tr>
                            <td colSpan={headers.length} className="px-4 py-3 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">—</td>
                        </tr>
                    ) : (
                        nextSteps.map((row, i) => (
                            <tr key={i} className={i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.department}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.owner}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.task}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.due_date}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{renderStatus(row.status)}</td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap align-top border-b border-slate-200 dark:border-slate-700">{row.status_notes}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
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
            elements.push(<ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-2 my-3">{listItems}</ul>);
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
            elements.push(<h2 key={key} id={`${id}-section`} className="text-2xl font-semibold mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-3 text-slate-800 dark:text-slate-200">{renderWithBold(titleText)}</h2>);
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
            elements.push(<h4 key={key} className="text-base font-semibold mt-4 mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">{icon} {renderWithBold(title)}</h4>);
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
            listItems.push(<li key={key}>{renderWithBold(content)}</li>);
        } else if (trimmed.length > 0) {
            flushList();
            elements.push(<p key={key} className="my-3">{renderWithBold(trimmed)}</p>);
        }
    }
    
    flushList();
    flushTable();

    return <div className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{elements}</div>;
};


const ExportBar: React.FC<{ output: AgentResponse, title: string, addToast: OutputPanelProps['addToast'], onInterrogate: () => void }> = ({ output, title, addToast, onInterrogate }) => {
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
            addToast('Formatted notes copied to clipboard.', 'success');
        } catch (err) {
            console.error('Failed to copy rich text, falling back to plain text:', err);
            await navigator.clipboard.writeText(markdownContent);
            addToast('Notes copied to clipboard (plain text).', 'success');
        }
    };

    const handleDownloadPdf = () => {
        const printWindow = window.open('', '_blank');
        if(!printWindow) {
            addToast('Could not open print window. Please disable popup blockers.', 'error');
            return;
        }
        
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
        const fullMarkdown = intro + markdownContent;
        const htmlBody = markdownToHtml(fullMarkdown);

        try {
            const blobHtml = new Blob([htmlBody], { type: 'text/html' });
            const blobText = new Blob([fullMarkdown], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText,
            });
            await navigator.clipboard.write([clipboardItem]);
            addToast('Email content copied. Paste into your email client.', 'success');
        } catch (err) {
            console.error('Failed to copy rich text, falling back to plain text:', err);
            await navigator.clipboard.writeText(fullMarkdown);
            addToast('Email content copied (plain text). Paste into your email client.', 'success');
        }

        const subject = encodeURIComponent(`Meeting Notes: ${title}`);
        const body = encodeURIComponent("Meeting notes have been copied to your clipboard. Please paste them here.");
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDownloadCsv = () => {
        if (!nextSteps || nextSteps.length === 0) {
            addToast('No action items to export.', 'error');
            return;
        }
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        exportToCsv(nextSteps, `next_steps_${safeTitle}.csv`);
        addToast('CSV downloaded successfully.', 'success');
    };

    return (
        <div id="export-bar" className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}><Icon name="copy" className="h-4 w-4 mr-2"/> Copy to Clipboard</Button>
                <Button size="sm" variant="outline" onClick={handleDownloadPdf}><Icon name="pdf" className="h-4 w-4 mr-2"/> Download PDF</Button>
                <Button size="sm" variant="outline" onClick={handleDownloadCsv}><Icon name="csv" className="h-4 w-4 mr-2"/> Download CSV Actions</Button>
                <Button size="sm" variant="outline" onClick={handleDraftEmail}><Icon name="email" className="h-4 w-4 mr-2"/> Draft Email</Button>
            </div>
            <div>
                 <Button id="interrogate-transcript-button" size="sm" variant="primary" onClick={onInterrogate}>
                    <Icon name="interrogate" className="h-4 w-4 mr-2"/> Interrogate Transcript
                </Button>
            </div>
        </div>
    );
};

const MeetingCoachPanel: React.FC<{ insights: CoachInsights }> = ({ insights }) => {
    const { strengths, improvements, facilitation_tips, metrics, flags } = insights;
    
    const flagEntries = Object.entries(flags).filter(([, value]) => value === true);

    const flagLabels: Record<keyof CoachFlags, string> = {
        participation_imbalance: 'Participation Imbalance',
        many_unassigned_actions: 'Many Unassigned Actions',
        few_decisions: 'Few Decisions',
        light_agenda_coverage: 'Light Agenda Coverage',
    };

    return (
        <>
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Meeting Coach</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {strengths && strengths.length > 0 && (
                    <Card className="p-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50">
                        <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">What Worked Well</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {strengths.map((item, i) => <li key={i}>{renderWithBold(item)}</li>)}
                        </ul>
                    </Card>
                )}
                {improvements && improvements.length > 0 && (
                    <Card className="p-4 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50">
                        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Next Time, Try</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {improvements.map((item, i) => <li key={i}>{renderWithBold(item)}</li>)}
                        </ul>
                    </Card>
                )}
                {facilitation_tips && facilitation_tips.length > 0 && (
                     <Card className="p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Facilitation Tips</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {facilitation_tips.map((item, i) => <li key={i}>{renderWithBold(item)}</li>)}
                        </ul>
                    </Card>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Health Snapshot</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.agenda_coverage_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Agenda Coverage</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.decision_count}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Decisions Made</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.actions_with_owner_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Actions with Owner</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.actions_with_due_date_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Actions with Due Date</div>
                    </div>
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{metrics.top_speaker_share_pct}%</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Top Speaker Share</div>
                    </div>
                </div>
                 {flagEntries.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Flags:</span>
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
                    In alignment with Momentum's Meeting Excellence
                </a>
            </div>
        </>
    );
};

export const OutputPanel: React.FC<OutputPanelProps> = ({ output, isLoading, error, controls, addToast, formState, apiConfig }) => {
  const [isInterrogateModalOpen, setIsInterrogateModalOpen] = useState(false);
  
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
        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Your notes will appear here</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in the details and click "Generate Notes" to start.</p>
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
                onInterrogate={() => setIsInterrogateModalOpen(true)}
              />
          </div>
        </div>
         <div id="generated-notes-content">
          <div className="flex justify-end gap-2 mb-4">
              <Chip selected>{controls.view === 'full' ? 'Full Minutes' : 'Actions Only'}</Chip>
              {controls.focus_department.length > 0 && (
                  <Chip selected>{controls.focus_department.join(', ') || 'Department-specific'}</Chip>
              )}
          </div>
          <MarkdownRenderer 
            content={output.markdown} 
            nextStepsReplacement={
              <NextStepsTable nextSteps={output.next_steps} useIcons={controls.use_icons} />
            }
          />
          {output.coach_insights && (
              <div id="meeting-coach-panel" className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-center text-xs italic text-slate-500 dark:text-slate-400 mb-4 px-4">
                  The following Meeting Coach analysis is for your information only and will not be included in any exports.
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
      />
    </>
  );
};