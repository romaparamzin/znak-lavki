/**
 * Export Hook
 * Handles exporting data to CSV, Excel, and PDF
 */

import { useState } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QualityMark } from '../types/mark.types';

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export to CSV
   */
  const exportToCSV = (data: QualityMark[], filename: string = 'marks') => {
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('CSV файл успешно экспортирован');
    } catch (error) {
      message.error('Ошибка экспорта в CSV');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to Excel
   */
  const exportToExcel = (data: QualityMark[], filename: string = 'marks') => {
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marks');
      
      // Set column widths
      const maxWidth = 50;
      const wscols = [
        { wch: 40 }, // markCode
        { wch: 15 }, // gtin
        { wch: 12 }, // status
        { wch: 12 }, // production date
        { wch: 12 }, // expiry date
      ];
      ws['!cols'] = wscols;
      
      XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
      message.success('Excel файл успешно экспортирован');
    } catch (error) {
      message.error('Ошибка экспорта в Excel');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to PDF
   */
  const exportToPDF = (data: QualityMark[], filename: string = 'marks') => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Качественные марки', 14, 15);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 22);
      
      // Prepare table data
      const tableData = data.map(mark => [
        mark.markCode,
        mark.gtin,
        mark.status.toUpperCase(),
        new Date(mark.productionDate).toLocaleDateString('ru-RU'),
        new Date(mark.expiryDate).toLocaleDateString('ru-RU'),
      ]);
      
      // Add table
      autoTable(doc, {
        startY: 28,
        head: [['Код марки', 'GTIN', 'Статус', 'Дата производства', 'Срок годности']],
        body: tableData,
        styles: { 
          font: 'helvetica',
          fontSize: 8,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 30 },
      });
      
      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Страница ${i} из ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`${filename}_${Date.now()}.pdf`);
      message.success('PDF файл успешно экспортирован');
    } catch (error) {
      message.error('Ошибка экспорта в PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export selected data based on format
   */
  const exportData = (
    data: QualityMark[],
    format: 'csv' | 'excel' | 'pdf',
    filename: string = 'marks'
  ) => {
    if (!data || data.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'excel':
        exportToExcel(data, filename);
        break;
      case 'pdf':
        exportToPDF(data, filename);
        break;
    }
  };

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportData,
    isExporting,
  };
};




