/**
 * Dashboard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../../src/pages/Dashboard/Dashboard';

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Дашборд')).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    render(<Dashboard />);
    
    // Check for metric titles
    expect(screen.getByText('Всего меток')).toBeInTheDocument();
    expect(screen.getByText('Активные')).toBeInTheDocument();
    expect(screen.getByText('Заблокированные')).toBeInTheDocument();
    expect(screen.getByText('Истекшие')).toBeInTheDocument();
  });

  it('displays mock metric values', () => {
    render(<Dashboard />);
    
    // These are mock values from the component
    expect(screen.getByText('45230')).toBeInTheDocument();
    expect(screen.getByText('38920')).toBeInTheDocument();
  });
});

