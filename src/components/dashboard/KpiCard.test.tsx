/**
 * Unit tests for KpiCard
 * Requirements: 2.2, 2.3, 2.5, 2.6
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
  // ── Loading state (Requirement 2.3) ────────────────────────────────────────
  describe('loading state', () => {
    it('renders a skeleton placeholder while loading', () => {
      render(<KpiCard label="Total People" value={42} isLoading />);
      expect(screen.getByRole('status', { name: /loading total people/i })).toBeInTheDocument();
    });

    it('does not render the metric value while loading', () => {
      render(<KpiCard label="Total People" value={42} isLoading />);
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });

    it('does not render the label text while loading', () => {
      render(<KpiCard label="Total People" value={42} isLoading />);
      // The aria-label includes the word but the visible text should not appear
      expect(screen.queryByText('Total People')).not.toBeInTheDocument();
    });
  });

  // ── Loaded / success state (Requirements 2.5) ──────────────────────────────
  describe('loaded state', () => {
    it('renders the label when not loading', () => {
      render(<KpiCard label="Total CDL Students" value={10} isLoading={false} />);
      expect(screen.getByText('Total CDL Students')).toBeInTheDocument();
    });

    it('renders the numeric value when not loading', () => {
      render(<KpiCard label="Total Staff" value={7} isLoading={false} />);
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('formats large numbers with locale separators', () => {
      render(<KpiCard label="Total People" value={1234567} isLoading={false} />);
      // toLocaleString produces locale-specific separators; just confirm the digits appear
      const el = screen.getByText(/1.234.567|1,234,567/);
      expect(el).toBeInTheDocument();
    });

    it('does not render a skeleton status element when loaded', () => {
      render(<KpiCard label="Total People" value={5} isLoading={false} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  // ── Null / undefined coercion (Requirement 2.6) ───────────────────────────
  describe('null / undefined coercion', () => {
    it('renders 0 when value is null', () => {
      render(<KpiCard label="Certificates" value={null} isLoading={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders 0 when value is undefined', () => {
      render(<KpiCard label="Certificates" value={undefined} isLoading={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders 0 when value is NaN', () => {
      render(<KpiCard label="Certificates" value={NaN} isLoading={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders 0 when value is explicitly 0', () => {
      render(<KpiCard label="Hedzole Members" value={0} isLoading={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});
