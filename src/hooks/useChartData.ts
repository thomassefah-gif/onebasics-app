/**
 * useChartData — individual named chart-data hooks for the Dashboard.
 *
 * Each hook is independent: it manages its own { data, isLoading, error }
 * state so that a failure in one chart does not affect the others
 * (Requirements 3.7, 3.10).
 *
 * All hooks return data in the shape Array<{ name: string; value: number }>
 * which is the canonical format expected by every Recharts chart on the
 * Dashboard (Requirements 3.1–3.6).
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/** Common return type for every chart-data hook. */
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ChartDataResult {
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// 1. CDL students count grouped by cohort name
//    Requirements: 3.1
// ---------------------------------------------------------------------------

/**
 * Fetches CDL student counts per cohort by joining `cdl_students` and
 * `cohorts`.  Each point is `{ name: cohortName, value: studentCount }`.
 */
export function useCdlByCohortsChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('cdl_students')
        .select('cohort_id, cohorts(name)');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // Aggregate counts by cohort name
      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        // row.cohorts may be a single object or null depending on the join
        const cohortRecord = row.cohorts as { name: string } | null;
        const cohortName = cohortRecord?.name ?? 'Unknown';
        counts.set(cohortName, (counts.get(cohortName) ?? 0) + 1);
      }

      setData(
        Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      );
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

// ---------------------------------------------------------------------------
// 2. Certificates earned distribution
//    Requirements: 3.2
// ---------------------------------------------------------------------------

/**
 * Fetches the count of each certificate earned by joining
 * `student_certificates` and `certificates`.
 * Each point is `{ name: certificateName, value: count }`.
 */
export function useCertificatesDistributionChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('student_certificates')
        .select('certificate_id, certificates(name)');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // Aggregate counts by certificate name
      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        const certRecord = row.certificates as { name: string } | null;
        const certName = certRecord?.name ?? 'Unknown';
        counts.set(certName, (counts.get(certName) ?? 0) + 1);
      }

      setData(
        Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      );
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

// ---------------------------------------------------------------------------
// 3. CDL students count by computer skill level
//    Requirements: 3.3
// ---------------------------------------------------------------------------

/**
 * Fetches CDL student counts grouped by `computer_skills` level.
 * Each point is `{ name: skillLevel, value: studentCount }`.
 */
export function useCdlByComputerSkillChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('cdl_students')
        .select('computer_skills');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      // Aggregate counts by skill level; treat null as 'Unknown'
      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        const level = row.computer_skills ?? 'Unknown';
        counts.set(level, (counts.get(level) ?? 0) + 1);
      }

      // Preserve the canonical skill order where present
      const ORDER = ['None', 'Basic', 'Intermediate', 'Advanced'];
      const sorted: ChartDataPoint[] = [];
      for (const level of ORDER) {
        if (counts.has(level)) {
          sorted.push({ name: level, value: counts.get(level)! });
          counts.delete(level);
        }
      }
      // Append any remaining keys (e.g., 'Unknown') at the end
      for (const [name, value] of counts.entries()) {
        sorted.push({ name, value });
      }

      setData(sorted);
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

// ---------------------------------------------------------------------------
// 4. CDL students count by how they heard about the program
//    Requirements: 3.4
// ---------------------------------------------------------------------------

/**
 * Fetches CDL student counts grouped by `how_heard_about`.
 * Each point is `{ name: referralSource, value: studentCount }`.
 */
export function useCdlByHowHeardChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('cdl_students')
        .select('how_heard_about');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        const source = row.how_heard_about ?? 'Unknown';
        counts.set(source, (counts.get(source) ?? 0) + 1);
      }

      setData(
        Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      );
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

// ---------------------------------------------------------------------------
// 5. Staff count by employment status
//    Requirements: 3.5
// ---------------------------------------------------------------------------

/**
 * Fetches staff counts grouped by `employment_status`.
 * Each point is `{ name: employmentStatus, value: staffCount }`.
 */
export function useStaffByEmploymentStatusChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('staff_profiles')
        .select('employment_status');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        const status = row.employment_status ?? 'Unknown';
        counts.set(status, (counts.get(status) ?? 0) + 1);
      }

      setData(
        Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      );
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

// ---------------------------------------------------------------------------
// 6. Volunteers count by area of interest
//    Requirements: 3.6
// ---------------------------------------------------------------------------

/**
 * Fetches volunteer counts grouped by `area_of_interest`.
 * Each point is `{ name: areaOfInterest, value: volunteerCount }`.
 */
export function useVolunteersByAreaOfInterestChart(): ChartDataResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const { data: rows, error: fetchError } = await supabase
        .from('volunteer_profiles')
        .select('area_of_interest');

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoading(false);
        return;
      }

      const counts = new Map<string, number>();
      for (const row of rows ?? []) {
        const area = row.area_of_interest ?? 'Unknown';
        counts.set(area, (counts.get(area) ?? 0) + 1);
      }

      setData(
        Array.from(counts.entries()).map(([name, value]) => ({ name, value })),
      );
      setIsLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
