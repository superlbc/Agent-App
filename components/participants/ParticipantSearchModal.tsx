import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { GraphData } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { ParsedContact, parseEmailListFormat, parseCSVAttendance, extractEmailsFromFile, countDetectedContacts } from '../../utils/emailListParser';
import { BatchAddResult, BatchAddProgress } from '../../hooks/useParticipantExtraction';

type TabType = 'search' | 'paste' | 'upload';

interface ParticipantSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (graphData: GraphData) => void;
    onBatchAdd?: (
        contacts: ParsedContact[],
        source: 'emailList' | 'csv',
        onProgress?: (progress: BatchAddProgress) => void
    ) => Promise<BatchAddResult>;
    initialQuery?: string;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export const ParticipantSearchModal: React.FC<ParticipantSearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    onBatchAdd,
    initialQuery = ''
}) => {
    const { t } = useTranslation(['common']);
    const [activeTab, setActiveTab] = useState<TabType>('search');

    // Search tab state
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<GraphData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const debouncedQuery = useDebounce(searchQuery, 500);
    const inputRef = useRef<HTMLInputElement>(null);

    // Paste tab state
    const [pasteText, setPasteText] = useState('');
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Upload tab state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContacts, setFileContacts] = useState<ParsedContact[]>([]);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [isParsingFile, setIsParsingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Batch result state
    const [batchResult, setBatchResult] = useState<BatchAddResult | null>(null);
    const [batchProgress, setBatchProgress] = useState<BatchAddProgress | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSearchQuery(initialQuery);
            setActiveTab('search');
        } else {
            // Reset all state when modal closes
            setSearchQuery('');
            setSearchResults([]);
            setHasSearched(false);
            setPasteText('');
            setParsedContacts([]);
            setShowPreview(false);
            setSelectedFile(null);
            setFileContacts([]);
            setShowFilePreview(false);
            setBatchResult(null);
        }
    }, [isOpen, initialQuery]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && activeTab === 'search' && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (isOpen && activeTab === 'paste' && pasteTextareaRef.current) {
            setTimeout(() => pasteTextareaRef.current?.focus(), 100);
        }
    }, [isOpen, activeTab]);

    // Perform search when debounced query changes
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 2) {
                setSearchResults([]);
                setHasSearched(false);
                return;
            }

            setIsSearching(true);
            setHasSearched(false);

            try {
                const { searchUsersMultiField } = await import('../../utils/graphSearchService');
                const results = await searchUsersMultiField(debouncedQuery);
                setSearchResults(results);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
                setHasSearched(true);
            }
        };

        if (activeTab === 'search') {
            performSearch();
        }
    }, [debouncedQuery, activeTab]);

    // Keyboard navigation for search tab
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || activeTab !== 'search') return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (searchResults.length > 0 && searchResults[selectedIndex]) {
                        handleSelect(searchResults[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeTab, searchResults, selectedIndex, onClose]);

    const handleSelect = (graphData: GraphData) => {
        onSelect(graphData);
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    // Paste tab handlers
    const handleProcessPaste = () => {
        setShowPreview(true);
        const contacts = parseEmailListFormat(pasteText);
        setParsedContacts(contacts);
    };

    const handleAddPastedContacts = async () => {
        if (!onBatchAdd || parsedContacts.length === 0) return;

        setIsProcessing(true);
        setBatchProgress({ current: 0, total: parsedContacts.length, currentEmail: '' });

        try {
            const result = await onBatchAdd(parsedContacts, 'emailList', (progress) => {
                setBatchProgress(progress);
            });
            setBatchResult(result);
            setBatchProgress(null);

            // Close after 2 seconds to show success message
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error adding contacts:', error);
            setBatchProgress(null);
        } finally {
            setIsProcessing(false);
        }
    };

    // Upload tab handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setShowFilePreview(false);
            setFileContacts([]);
        }
    };

    const handleParseFile = async () => {
        if (!selectedFile) return;

        setIsParsingFile(true);
        try {
            const fileType = selectedFile.name.toLowerCase();

            if (fileType.endsWith('.csv')) {
                // Parse CSV
                const text = await selectedFile.text();
                const contacts = parseCSVAttendance(text);
                setFileContacts(contacts);
                setShowFilePreview(true);
            } else if (fileType.endsWith('.txt')) {
                // Parse TXT
                const text = await selectedFile.text();
                const contacts = extractEmailsFromFile(text);
                setFileContacts(contacts);
                setShowFilePreview(true);
            } else if (fileType.endsWith('.docx')) {
                // Parse DOCX using mammoth
                // @ts-ignore - mammoth loaded from CDN
                if (typeof window.mammoth === 'undefined') {
                    console.error('Mammoth library not loaded');
                    return;
                }

                const arrayBuffer = await selectedFile.arrayBuffer();
                // @ts-ignore
                const result = await window.mammoth.extractRawText({ arrayBuffer });
                const contacts = extractEmailsFromFile(result.value);
                setFileContacts(contacts);
                setShowFilePreview(true);
            }
        } catch (error) {
            console.error('Error parsing file:', error);
        } finally {
            setIsParsingFile(false);
        }
    };

    const handleAddFileContacts = async () => {
        if (!onBatchAdd || fileContacts.length === 0) return;

        setIsProcessing(true);
        setBatchProgress({ current: 0, total: fileContacts.length, currentEmail: '' });

        try {
            const source = selectedFile?.name.endsWith('.csv') ? 'csv' : 'emailList';
            const result = await onBatchAdd(fileContacts, source, (progress) => {
                setBatchProgress(progress);
            });
            setBatchResult(result);
            setBatchProgress(null);

            // Close after 2 seconds to show success message
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error adding contacts:', error);
            setBatchProgress(null);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const detectedCount = pasteText ? countDetectedContacts(pasteText) : 0;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-start justify-center p-4 pt-20"
            onClick={handleClose}
        >
            <Card
                className="w-full max-w-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Add Participants
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                            aria-label="Close"
                        >
                            <Icon name="close" className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'search'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon name="search" className="h-4 w-4 inline-block mr-1.5" />
                            Search
                        </button>
                        <button
                            onClick={() => setActiveTab('paste')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'paste'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon name="content-paste" className="h-4 w-4 inline-block mr-1.5" />
                            Paste Emails
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'upload'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon name="upload" className="h-4 w-4 inline-block mr-1.5" />
                            Upload File
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {/* Search Tab */}
                        {activeTab === 'search' && (
                            <div>
                                {/* Search Input */}
                                <div className="mb-4">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Type at least 2 characters to search
                                    </p>
                                </div>

                                {/* Search Results */}
                                <div className="max-h-96 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="space-y-2">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                                                        <div className="flex-1">
                                                            <div className="h-4 w-32 mb-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                                            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : hasSearched && searchResults.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Icon name="search" className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="text-slate-600 dark:text-slate-400">No users found</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Try a different search term</p>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchResults.map((result, index) => (
                                                <button
                                                    key={`${result.mail}-${index}`}
                                                    onClick={() => handleSelect(result)}
                                                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                                                        selectedIndex === index
                                                            ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {result.photoUrl ? (
                                                            <img
                                                                src={result.photoUrl}
                                                                alt={result.displayName}
                                                                className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                                                                {getInitials(result.displayName)}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                                {result.displayName}
                                                            </h4>
                                                            {result.jobTitle && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                                                    {result.jobTitle}
                                                                </p>
                                                            )}
                                                            {result.mail && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">
                                                                    {result.mail}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Icon
                                                            name="check"
                                                            className={`h-5 w-5 flex-shrink-0 ${
                                                                selectedIndex === index
                                                                    ? 'text-primary'
                                                                    : 'text-slate-300 dark:text-slate-600'
                                                            }`}
                                                        />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Icon name="search" className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="text-slate-600 dark:text-slate-400">Start typing to search for users</p>
                                        </div>
                                    )}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                            Use ↑↓ to navigate, Enter to select, Esc to close
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Paste Emails Tab */}
                        {activeTab === 'paste' && (
                            <div>
                                {batchResult ? (
                                    <div className="text-center py-12">
                                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                            <Icon name="check" className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                            Successfully Added {batchResult.added} Participants!
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {batchResult.matched} matched, {batchResult.external} external
                                            {batchResult.skipped > 0 && `, ${batchResult.skipped} skipped (duplicates)`}
                                        </p>
                                    </div>
                                ) : !showPreview ? (
                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Paste Email List
                                            </label>
                                            <textarea
                                                ref={pasteTextareaRef}
                                                value={pasteText}
                                                onChange={e => setPasteText(e.target.value)}
                                                rows={10}
                                                placeholder={`Paste email list here, e.g.:\n"Name (CODE)" <email@domain.com>; "Name2" <email2@domain.com>\n\nor:\n\nemail@domain.com\nemail2@domain.com`}
                                                className="block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-mono"
                                            />
                                            {detectedCount > 0 && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                    Detected {detectedCount} email{detectedCount !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleProcessPaste}
                                                disabled={!pasteText || detectedCount === 0}
                                                variant="primary"
                                            >
                                                Process & Preview
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Preview ({parsedContacts.length} contacts)
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        setShowPreview(false);
                                                        setParsedContacts([]);
                                                    }}
                                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Name</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Email</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {parsedContacts.map((contact, index) => (
                                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                <td className="px-3 py-2 text-slate-900 dark:text-white">{contact.name || '—'}</td>
                                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{contact.email}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {batchProgress && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                    <span>Processing {batchProgress.current} of {batchProgress.total}</span>
                                                    <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-300 ease-out"
                                                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                    {batchProgress.currentEmail}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleAddPastedContacts}
                                                disabled={isProcessing}
                                                variant="primary"
                                            >
                                                {isProcessing ? `Processing...` : `Add All ${parsedContacts.length} Participants`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload File Tab */}
                        {activeTab === 'upload' && (
                            <div>
                                {batchResult ? (
                                    <div className="text-center py-12">
                                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                            <Icon name="check" className="h-8 w-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                            Successfully Added {batchResult.added} Participants!
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {batchResult.matched} matched, {batchResult.external} external
                                            {batchResult.skipped > 0 && `, ${batchResult.skipped} skipped (duplicates)`}
                                        </p>
                                    </div>
                                ) : !showFilePreview ? (
                                    <div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Upload File
                                            </label>

                                            {!selectedFile ? (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                >
                                                    <Icon name="upload" className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-500">
                                                        CSV, TXT, or DOCX files
                                                    </p>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".csv,.txt,.docx"
                                                        onChange={handleFileSelect}
                                                        className="hidden"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                            <Icon name="description" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                {selectedFile.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFile(null);
                                                                if (fileInputRef.current) {
                                                                    fileInputRef.current.value = '';
                                                                }
                                                            }}
                                                            className="flex-shrink-0 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                                        >
                                                            <Icon name="close" className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedFile && (
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleParseFile}
                                                    disabled={isParsingFile}
                                                    variant="primary"
                                                >
                                                    {isParsingFile ? 'Processing...' : 'Process & Preview'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Preview ({fileContacts.length} contacts)
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        setShowFilePreview(false);
                                                        setFileContacts([]);
                                                    }}
                                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                                >
                                                    Back
                                                </button>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Name</th>
                                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Email</th>
                                                            {fileContacts.some(c => c.attendanceType) && (
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Attendance</th>
                                                            )}
                                                            {fileContacts.some(c => c.acceptanceStatus) && (
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Response</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        {fileContacts.map((contact, index) => (
                                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                <td className="px-3 py-2 text-slate-900 dark:text-white">{contact.name || '—'}</td>
                                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{contact.email}</td>
                                                                {fileContacts.some(c => c.attendanceType) && (
                                                                    <td className="px-3 py-2">
                                                                        {contact.attendanceType && (
                                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                                                contact.attendanceType === 'required'
                                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                            }`}>
                                                                                {contact.attendanceType}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                {fileContacts.some(c => c.acceptanceStatus) && (
                                                                    <td className="px-3 py-2">
                                                                        {contact.acceptanceStatus && (
                                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                                                contact.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                                                contact.acceptanceStatus === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                                                contact.acceptanceStatus === 'tentative' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                            }`}>
                                                                                {contact.acceptanceStatus}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {batchProgress && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                    <span>Processing {batchProgress.current} of {batchProgress.total}</span>
                                                    <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-300 ease-out"
                                                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                    {batchProgress.currentEmail}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleAddFileContacts}
                                                disabled={isProcessing}
                                                variant="primary"
                                            >
                                                {isProcessing ? `Processing...` : `Add All ${fileContacts.length} Participants`}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
