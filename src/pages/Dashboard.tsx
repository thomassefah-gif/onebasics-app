import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    people: 0,
    cdl: 0,
    staff: 0,
    volunteers: 0,
    hedzole: 0,
    sponsorships: 0,
    certs: 0,
    networking: 0,
  });

  const [cohortData, setCohortData] = useState<any[]>([]);
  const [certData, setCertData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States for Custom Query Builder
  const [filterMinAge, setFilterMinAge] = useState<number>(10);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(25);
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all'); // '1year', '2years', 'all'
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [filterLoading, setFilterLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    runCustomQuery();
  }, [filterMinAge, filterMaxAge, filterTimeframe, filterGender]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [rP, rCdl, rStaff, rVol, rHed, rSpon, rCert] = await Promise.all([
        supabase.from('people').select('*', { count: 'exact', head: true }),
        supabase.from('cdl_students').select('*', { count: 'exact', head: true }),
        supabase.from('staff_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('volunteer_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('hedzole_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sponsorship_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('student_certificates').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        people: rP.count || 0,
        cdl: rCdl.count || 0,
        staff: rStaff.count || 0,
        volunteers: rVol.count || 0,
        hedzole: rHed.count || 0,
        sponsorships: rSpon.count || 0,
        certs: rCert.count || 0,
        networking: 6,
      });

      // Cohort breakdown
      const { data: cohorts } = await supabase.from('cohorts').select('id, name').order('name');
      if (cohorts) {
        const cohortList = await Promise.all(
          cohorts.map(async (c) => {
            const { count } = await supabase.from('cdl_students').select('*', { count: 'exact', head: true }).eq('cohort_id', c.id);
            return { name: c.name, count: count || 0 };
          })
        );
        setCohortData(cohortList);
      }

      // Certificate breakdown
      const { data: certs } = await supabase.from('certificates').select('id, name');
      if (certs) {
        const certList = await Promise.all(
          certs.map(async (c) => {
            const { count } = await supabase.from('student_certificates').select('*', { count: 'exact', head: true }).eq('certificate_id', c.id);
            return { name: c.name, count: count || 0 };
          })
        );
        setCertData(certList.filter((c) => c.count > 0).sort((a, b) => b.count - a.count));
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Custom Query Generator Function
  async function runCustomQuery() {
    setFilterLoading(true);
    try {
      let query = supabase.from('cdl_students').select(`
        id,
        current_class,
        created_at,
        person:person_id (
          id,
          full_name,
          gender,
          date_of_birth
        )
      `);

      // Date timeframe filter
      if (filterTimeframe === '1year') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        query = query.gte('created_at', oneYearAgo.toISOString());
      } else if (filterTimeframe === '2years') {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        query = query.gte('created_at', twoYearsAgo.toISOString());
      }

      const { data, error } = await query;

      if (!error && data) {
        const today = new Date();
        const filtered = data.filter((item: any) => {
          if (!item.person) return false;

          // Gender filter
          if (filterGender !== 'all' && item.person.gender !== filterGender) return false;

          // Age calculation
          if (item.person.date_of_birth) {
            const birthDate = new Date(item.person.date_of_birth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            return age >= filterMinAge && age <= filterMaxAge;
          }
          return true; // Keep if DOB not recorded
        });

        setFilteredStudents(filtered);
        setFilteredCount(filtered.length);
      }
    } catch (err) {
      console.error('Filter query error:', err);
    } finally {
      setFilterLoading(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-emerald-900 font-bold">Loading B.A.S.I.C.S. Real-time Metrics...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-emerald-950">B.A.S.I.C.S. Analytics Dashboard</h1>
        <p className="text-slate-600 text-sm mt-0.5">Chorkor Digital Lab & Community Programs Management</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title="TOTAL PEOPLE" value={stats.people} color="bg-emerald-900 text-white" />
        <KPICard title="CDL STUDENTS" value={stats.cdl} color="bg-indigo-600 text-white" />
        <KPICard title="TOTAL STAFF" value={stats.staff} color="bg-blue-600 text-white" />
        <KPICard title="VOLUNTEERS" value={stats.volunteers} color="bg-emerald-600 text-white" />

        <KPICard title="HEDZOLE MEMBERS" value={stats.hedzole} color="bg-amber-600 text-white" />
        <KPICard title="SPONSORED CHILDREN" value={stats.sponsorships} color="bg-pink-600 text-white" />
        <KPICard title="TOTAL CERTIFICATES" value={stats.certs} subtitle="Real count across all students" color="bg-emerald-700 text-white ring-2 ring-emerald-400" />
        <KPICard title="NETWORKING BASICS" value={stats.networking} color="bg-slate-800 text-white" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-extrabold text-slate-800">CDL Students by Cohort</h2>
          {cohortData.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{c.name}</span>
                <span className="font-bold text-emerald-800">{c.count} Students</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-600 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.count * 20, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-extrabold text-slate-800">Top Earned Certificates</h2>
          {certData.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="truncate pr-2">{c.name}</span>
                <span className="font-bold text-emerald-700">{c.count} Earned</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(c.count * 15, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== CUSTOM QUERY & REPORT BUILDER ==================== */}
      <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div>
            <h2 className="text-xl font-black text-emerald-950">🔍 Custom Student Query & Report Builder</h2>
            <p className="text-xs text-slate-500">Filter students dynamically by age range, enrollment timeframe, and gender</p>
          </div>
          <div className="bg-emerald-100 text-emerald-950 font-black px-4 py-2 rounded-xl text-sm self-start md:self-auto">
            Matching Students: {filterLoading ? '...' : filteredCount}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Min Age</label>
            <input type="number" value={filterMinAge} onChange={(e) => setFilterMinAge(Number(e.target.value))} className="w-full p-2 bg-white border rounded-lg text-sm font-semibold" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Age</label>
            <input type="number" value={filterMaxAge} onChange={(e) => setFilterMaxAge(Number(e.target.value))} className="w-full p-2 bg-white border rounded-lg text-sm font-semibold" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enrolled Timeframe</label>
            <select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)} className="w-full p-2 bg-white border rounded-lg text-sm font-semibold">
              <option value="all">All Time</option>
              <option value="1year">Enrolled in Last 1 Year</option>
              <option value="2years">Enrolled in Last 2 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full p-2 bg-white border rounded-lg text-sm font-semibold">
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Filter Results List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtered Student Results ({filteredStudents.length}):</h3>
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No students match the selected age range and timeframe criteria.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
              {filteredStudents.map((item) => (
                <div key={item.id} className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs space-y-0.5">
                  <p className="font-bold text-emerald-950 text-sm">{item.person?.full_name}</p>
                  <p className="text-slate-600">Cohort: {item.current_class || 'CDL Student'}</p>
                  <p className="text-slate-500 text-[11px]">Gender: {item.person?.gender || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, color }: { title: string; value: number; subtitle?: string; color: string }) {
  return (
    <div className={`p-5 rounded-xl shadow-sm space-y-1 ${color}`}>
      <p className="text-xs font-extrabold uppercase tracking-wider opacity-90">{title}</p>
      <p className="text-3xl font-black">{value}</p>
      {subtitle && <p className="text-[10px] opacity-80">{subtitle}</p>}
    </div>
  );
}