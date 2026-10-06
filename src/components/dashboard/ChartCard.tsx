/**
 * ChartCard — a uniform wrapper for every Recharts chart on the Dashboard.
 *
 * Priority of states (first match wins):
 *   1. isLoading  → spinner / skeleton
 *   2. hasError   → error message
 *   3. isEmpty    → "No data available" message
 *   4. default    → renders children (the chart)
 *
 * Each chart is rendered in an independent container so a single chart
 * failure never blocks the others (Requirement 3.10).
 *
 * Requirements: 3.7, 3.8, 3.9, 3.10
 */

import { Loader2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  hasError: boolean;
  children: React.ReactNode;
}

export default function ChartCard({
  title,
  isLoading,
  isEmpty,
  hasError,
  children,
}: ChartCardProps) {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
      {/* Card title */}
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>

      {/* State-driven body — minimum height ensures consistent card sizing */}
      <div className="flex min-h-56 items-center justify-center">
        {isLoading ? (
          // Loading state — spinner (Requirement 3.8)
          <div
            role="status"
            aria-label={`Loading ${title}`}
            className="flex flex-col items-center gap-2 text-purple-800"
          >
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="text-xs text-gray-400">Loading…</span>
          </div>
        ) : hasError ? (
          // Error state (Requirement 3.10)
          <p
            role="alert"
            className="text-center text-sm text-red-600"
          >
            Data could not be loaded. Please try again later.
          </p>
        ) : isEmpty ? (
          // Empty state (Requirement 3.9)
          <p className="text-center text-sm text-gray-400">No data available</p>
        ) : (
          // Happy path — render the Recharts chart
          <div className="w-full">{children}</div>
        )}
      </div>
    </div>
  );
}
