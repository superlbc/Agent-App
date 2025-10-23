
import { NextStep } from '../types.ts';
import i18n from './i18n';

export const exportToCsv = (data: NextStep[], filename: string) => {
  if (!data.length) return;

  const headers = ['Department', 'Owner', 'Task', 'Due Date', 'Status', 'Status Notes'];
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      [
        `"${row.department.replace(/"/g, '""')}"`,
        `"${row.owner.replace(/"/g, '""')}"`,
        `"${row.task.replace(/"/g, '""')}"`,
        `"${row.due_date.replace(/"/g, '""')}"`,
        `"${(row.status || '').replace(/"/g, '""')}"`,
        `"${(row.status_notes || '').replace(/"/g, '""')}"`
      ].join(',')
    )
  ];

  let csvString = csvRows.join('\r\n');

  // Add UTF-8 BOM for Japanese to ensure proper encoding in Excel on Windows
  if (i18n.language === 'ja') {
    csvString = '\uFEFF' + csvString;
  }

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};