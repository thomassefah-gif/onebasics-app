/**
 * KpiCard — displays a single aggregated metric from the dashboard_kpis view.
 *
 * While loading, renders an animated skeleton placeholder so the layout
 * doesn't shift when data arrives.  Null/undefined values are coerced to 0
 * to satisfy Requirement 2.6.
 *
 * Requirements: 2.2, 2.3, 2.5, 2.6
 */

interface KpiCardProps {
  label: string;
  /** The numeric metric value. null/undefined are treated as 0. */
  value: number | null | undefined;
  isLoading: boolean;
}

export default function KpiCard({ label, value, isLoading }: KpiCardProps) {
  // Coerce null / undefined / NaN to 0 (Requirement 2.6)
  const safeValue = value == null || Number.isNaN(value) ? 0 : value;

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={`Loading ${label}`}
        className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm"
      >
        {/* Animated skeleton — two rows mimicking label + value */}
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-2/3 rounded bg-purple-100" />
          <div className="h-7 w-1/3 rounded bg-purple-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
      {/* Left accent bar in brand color */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-full w-1 self-stretch rounded-full bg-purple-800" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {safeValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
