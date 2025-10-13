import { useCallback } from 'react';
import { ExportOptions, TableColumn } from '../types/table.types';

export function useTableExport<T>() {
  const exportToCSV = useCallback((data: T[], columns: TableColumn<T>[], filename: string) => {
    // Create CSV content
    const headers = columns.map((col) => col.header).join(',');
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value =
            typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor as keyof T];
          // Escape commas and quotes
          const stringValue = String(value ?? '');
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        })
        .join(','),
    );

    const csvContent = [headers, ...rows].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportToJSON = useCallback((data: T[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportToExcel = useCallback(
    async (data: T[], columns: TableColumn<T>[], filename: string) => {
      // This would require a library like xlsx
      // For now, export as CSV
      exportToCSV(data, columns, filename);
    },
    [exportToCSV],
  );

  const exportData = useCallback(
    (data: T[], columns: TableColumn<T>[], options: ExportOptions) => {
      const filename = options.fileName || 'export';

      switch (options.format) {
        case 'csv':
          exportToCSV(data, columns, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
        case 'xlsx':
          exportToExcel(data, columns, filename);
          break;
      }
    },
    [exportToCSV, exportToJSON, exportToExcel],
  );

  return { exportData, exportToCSV, exportToJSON, exportToExcel };
}
