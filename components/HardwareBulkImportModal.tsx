// ============================================================================
// HARDWARE BULK IMPORT MODAL
// ============================================================================
// Modal component for importing hardware items from CSV file
// Supports validation, preview, and import summary reporting

import React, { useState, useRef } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Hardware } from '../types';

interface ParsedHardwareRow {
  rowNumber: number;
  data: Partial<Hardware>;
  errors: string[];
  warnings: string[];
}

interface ImportSummary {
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  errors: Array<{ row: number; message: string }>;
}

interface HardwareBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportHardware: (hardware: Array<Omit<Hardware, 'id'>>) => void;
}

const HardwareBulkImportModal: React.FC<HardwareBulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportHardware,
}) => {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedHardwareRow[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV template columns
  const CSV_COLUMNS = [
    'type',
    'model',
    'manufacturer',
    'status',
    'serialNumber',
    'purchaseDate',
    'cost',
    'processor',
    'ram',
    'storage',
    'screenSize',
    'connectivity',
  ];

  // Valid hardware types
  const VALID_TYPES: Hardware['type'][] = [
    'computer',
    'monitor',
    'keyboard',
    'mouse',
    'dock',
    'headset',
    'accessory',
  ];

  // Valid status values
  const VALID_STATUS: Hardware['status'][] = ['available', 'assigned', 'maintenance', 'retired'];

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvContent = [
      CSV_COLUMNS.join(','),
      'computer,MacBook Pro 16",Apple,available,ABC123,2024-01-15,4299.00,M3 Max,64GB,2TB SSD,,',
      'monitor,UltraSharp 27",Dell,available,DEF456,2024-01-20,799.00,,,,27" 4K,',
      'keyboard,Magic Keyboard,Apple,available,GHI789,2024-01-20,149.00,,,,,USB-C',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hardware_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line) => {
      // Simple CSV parsing (doesn't handle quoted commas)
      return line.split(',').map((cell) => cell.trim());
    });
  };

  // Validate hardware row
  const validateRow = (row: string[], rowNumber: number): ParsedHardwareRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract values
    const [
      type,
      model,
      manufacturer,
      status,
      serialNumber,
      purchaseDate,
      cost,
      processor,
      ram,
      storage,
      screenSize,
      connectivity,
    ] = row;

    // Validate required fields
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type as Hardware['type'])) {
      errors.push(`Invalid type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (!model) {
      errors.push('Model is required');
    }

    if (!manufacturer) {
      errors.push('Manufacturer is required');
    }

    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUS.includes(status as Hardware['status'])) {
      errors.push(`Invalid status: ${status}. Must be one of: ${VALID_STATUS.join(', ')}`);
    }

    // Validate optional fields
    if (cost && isNaN(parseFloat(cost))) {
      errors.push('Cost must be a valid number');
    }

    if (purchaseDate && isNaN(Date.parse(purchaseDate))) {
      errors.push('Purchase date must be a valid date (YYYY-MM-DD)');
    }

    // Warnings for missing optional fields
    if (!serialNumber) {
      warnings.push('Serial number not provided');
    }

    if (!cost) {
      warnings.push('Cost not provided');
    }

    // Build specifications
    const specifications: Hardware['specifications'] = {};

    if (type === 'computer') {
      if (processor) specifications.processor = processor;
      if (ram) specifications.ram = ram;
      if (storage) specifications.storage = storage;

      if (!processor && !ram && !storage) {
        warnings.push('No computer specifications provided');
      }
    } else if (type === 'monitor') {
      if (screenSize) specifications.screenSize = screenSize;

      if (!screenSize) {
        warnings.push('Screen size not provided for monitor');
      }
    } else {
      if (connectivity) specifications.connectivity = connectivity;
    }

    // Build hardware object (partial)
    const data: Partial<Hardware> = {
      type: type as Hardware['type'],
      model,
      manufacturer,
      status: status as Hardware['status'],
      specifications,
      serialNumber: serialNumber || undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
    };

    return {
      rowNumber,
      data,
      errors,
      warnings,
    };
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle file upload and parsing
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);

      // Skip header row
      const dataRows = rows.slice(1);

      // Parse and validate each row
      const parsed = dataRows.map((row, index) => validateRow(row, index + 2)); // +2 because: 1-indexed + skip header

      setParsedData(parsed);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse CSV file. Please check the file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle import
  const handleImport = () => {
    // Filter out rows with errors
    const validRows = parsedData.filter((row) => row.errors.length === 0);

    if (validRows.length === 0) {
      alert('No valid rows to import. Please fix errors and try again.');
      return;
    }

    // Extract hardware data
    const hardware = validRows.map((row) => row.data as Omit<Hardware, 'id'>);

    // Call import callback
    onImportHardware(hardware);

    // Generate summary
    const summary: ImportSummary = {
      totalRows: parsedData.length,
      successCount: validRows.length,
      errorCount: parsedData.filter((row) => row.errors.length > 0).length,
      warningCount: parsedData.filter((row) => row.warnings.length > 0).length,
      errors: parsedData
        .filter((row) => row.errors.length > 0)
        .map((row) => ({
          row: row.rowNumber,
          message: row.errors.join(', '),
        })),
    };

    setImportSummary(summary);
    setStep('complete');
  };

  // Handle reset
  const handleReset = () => {
    setSelectedFile(null);
    setParsedData([]);
    setImportSummary(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Icon name="upload" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Bulk Hardware Import
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step === 'upload' && 'Upload CSV file with hardware data'}
                {step === 'preview' && 'Review and validate import data'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Icon name="download" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Download CSV Template
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Use this template to ensure your CSV file has the correct format and column headers.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="mt-2"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* CSV Format Instructions */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CSV Format Requirements
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• First row must contain column headers</li>
                  <li>• Required columns: type, model, manufacturer, status</li>
                  <li>• Optional columns: serialNumber, purchaseDate, cost, specifications</li>
                  <li>• Valid types: computer, monitor, keyboard, mouse, dock, headset, accessory</li>
                  <li>• Valid status: available, assigned, maintenance, retired</li>
                  <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Icon name="loader" className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon name="upload" className="w-4 h-4" />
                      Upload & Validate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {parsedData.length}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-700 dark:text-green-300">Valid Rows</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {parsedData.filter((row) => row.errors.length === 0).length}
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {parsedData.filter((row) => row.errors.length > 0).length}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm text-orange-700 dark:text-orange-300">Warnings</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                    {parsedData.filter((row) => row.warnings.length > 0).length}
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Row
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Model
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Manufacturer
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          Validation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {parsedData.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={
                            row.errors.length > 0
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : row.warnings.length > 0
                              ? 'bg-orange-50 dark:bg-orange-900/10'
                              : 'bg-white dark:bg-gray-800'
                          }
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {row.rowNumber}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {row.data.type}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {row.data.model}
                          </td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                            {row.data.manufacturer}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                row.data.status === 'available'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : row.data.status === 'assigned'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : row.data.status === 'maintenance'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {row.data.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {row.errors.length > 0 ? (
                              <div className="text-xs text-red-700 dark:text-red-300">
                                <div className="font-medium">Errors:</div>
                                <ul className="list-disc list-inside">
                                  {row.errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : row.warnings.length > 0 ? (
                              <div className="text-xs text-orange-700 dark:text-orange-300">
                                <div className="font-medium">Warnings:</div>
                                <ul className="list-disc list-inside">
                                  {row.warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                                ✓ Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={handleReset}>
                  <Icon name="chevron-left" className="w-4 h-4" />
                  Start Over
                </Button>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={parsedData.filter((row) => row.errors.length === 0).length === 0}
                  >
                    <Icon name="check" className="w-4 h-4" />
                    Import {parsedData.filter((row) => row.errors.length === 0).length} Items
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && importSummary && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Icon name="check" className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                      Import Complete!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Successfully imported {importSummary.successCount} of {importSummary.totalRows}{' '}
                      hardware items.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {importSummary.totalRows}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-700 dark:text-green-300">Imported</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {importSummary.successCount}
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {importSummary.errorCount}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm text-orange-700 dark:text-orange-300">Warnings</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                    {importSummary.warningCount}
                  </div>
                </div>
              </div>

              {/* Error Details */}
              {importSummary.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                    Rows with Errors (Not Imported)
                  </h3>
                  <div className="space-y-2">
                    {importSummary.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700 dark:text-red-300">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={handleReset}>
                  Import More
                </Button>
                <Button variant="primary" onClick={handleClose}>
                  <Icon name="check" className="w-4 h-4" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HardwareBulkImportModal;
