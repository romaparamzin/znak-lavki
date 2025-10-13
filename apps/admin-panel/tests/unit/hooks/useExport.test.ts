/**
 * useExport Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExport } from '../../../src/hooks/useExport';
import type { QualityMark } from '../../../src/types/mark.types';

describe('useExport', () => {
  const mockMarks: QualityMark[] = [
    {
      id: '1',
      markCode: '99LAV0460717796408966LAV1234567890ABCDEF',
      gtin: '04607177964089',
      status: 'active' as any,
      productionDate: '2025-10-10',
      expiryDate: '2026-10-10',
      validationCount: 5,
      createdAt: '2025-10-10T12:00:00Z',
      updatedAt: '2025-10-10T12:00:00Z',
    },
  ];

  it('should initialize with isExporting false', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.isExporting).toBe(false);
  });

  it('should have export functions', () => {
    const { result } = renderHook(() => useExport());
    
    expect(typeof result.current.exportToCSV).toBe('function');
    expect(typeof result.current.exportToExcel).toBe('function');
    expect(typeof result.current.exportToPDF).toBe('function');
    expect(typeof result.current.exportData).toBe('function');
  });
});




