import { useState, useEffect } from 'react';
import { PreHire } from '../types';
import { searchEmployees, getEmployeeById, PersonnelRecord, MatchResult } from '../services/personnelService';

interface EmployeeLinkingModalProps {
  preHire: PreHire;
  onLink: (employeeId: string, linkConfidence: 'auto' | 'manual' | 'verified') => void;
  onClose: () => void;
}

export default function EmployeeLinkingModal({ preHire, onLink, onClose }: EmployeeLinkingModalProps) {
  const [searchResults, setSearchResults] = useState<MatchResult[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PersonnelRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');

  // Auto-search on mount
  useEffect(() => {
    performSearch(preHire.candidateName, preHire.email);
  }, [preHire]);

  const performSearch = async (name: string, email?: string) => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchEmployees(name, email);
      setSearchResults(results);

      // If exact match (100% confidence), show suggestion
      if (results.length > 0 && results[0].confidence === 100) {
        setSelectedEmployee(results[0].record);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search employees');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (manualSearchQuery.trim()) {
      performSearch(manualSearchQuery.trim());
    }
  };

  const handleLinkEmployee = (linkConfidence: 'auto' | 'manual' | 'verified') => {
    if (selectedEmployee) {
      onLink(selectedEmployee.employeeId, linkConfidence);
    }
  };

  const getConfidenceBadge = (confidence: number, matchType: string) => {
    const colors: Record<string, string> = {
      exact: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      high: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[matchType] || colors.low}`}>
        {confidence}% {matchType}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Link Pre-hire to Employee Record
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Pre-hire Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pre-hire Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{preHire.candidateName}</span>
              </div>
              {preHire.email && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{preHire.email}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-gray-400">Role:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{preHire.role}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Department:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-white">{preHire.department}</span>
              </div>
            </div>
          </div>

          {/* Manual Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manual Search (if auto-search didn't find the right match)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                placeholder="Enter employee name to search..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleManualSearch}
                disabled={!manualSearchQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Searching employees...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {!loading && !error && searchResults.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">No matching employees found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try a manual search above</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Found {searchResults.length} potential match(es):
              </h3>

              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={result.record.employeeId}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedEmployee?.employeeId === result.record.employeeId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedEmployee(result.record)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">
                            {result.record.fullName}
                          </h4>
                          {getConfidenceBadge(result.confidence, result.matchType)}
                          {index === 0 && result.confidence === 100 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-medium">
                              Suggested Match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.record.email}
                        </p>
                      </div>
                      <div className="ml-4">
                        {selectedEmployee?.employeeId === result.record.employeeId && (
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-3">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{result.record.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>{' '}
                        <span className={`font-medium ${
                          result.record.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {result.record.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Department Group:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{result.record.departmentGroup}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Department:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{result.record.department}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Role/Grade:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{result.record.grade}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Manager:</span>{' '}
                        <span className="text-gray-900 dark:text-white">{result.record.managerName}</span>
                      </div>
                    </div>

                    {result.matchReasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Match reasons: {result.matchReasons.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            {selectedEmployee && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee.fullName}</span> ({selectedEmployee.employeeId})
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleLinkEmployee('manual')}
              disabled={!selectedEmployee}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Link Employee
            </button>
            {selectedEmployee && searchResults[0]?.confidence === 100 && searchResults[0].record.employeeId === selectedEmployee.employeeId && (
              <button
                onClick={() => handleLinkEmployee('auto')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Auto-Link (100% Match)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
