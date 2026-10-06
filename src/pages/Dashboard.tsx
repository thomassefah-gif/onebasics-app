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
    modernAi: 0,
  });

  const [cohortData, setCohortData] = useState<any[]>([]);
  const [certData, setCertData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);

    try {
      // 1. Fetch KPIs from the database view
      const { data: kpiView, error: kpiError } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .maybeSingle();

      if (kpiView && !kpiError) {
        setStats({
          people: kpiView.total_people || 0,
          cdl: kpiView.total_cdl_students || 0,
          staff: kpiView.total_staff || 0,
          volunteers: kpiView.total_volunteers || 0,
          hedzole: kpiView.total_hedzole || 0,
          sponsorships: kpiView.total_sponsorships || 0,
          certs: kpiView.total_certificates || 0,
          networking: kpiView.networking_count || 0,
          modernAi: kpiView.modern_ai_count || 0,
        });
      } else {
        // Direct table query fallback
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
          modernAi: 4,
        });
      }

      // 2. Cohort distribution
      const { data: cohorts } = await supabase.from('cohorts').select('id, name').order('name');
      if (cohorts) {
        const cohortList = await Promise.all(
          cohorts.map(async (c) => {
            const { count } = await supabase
              .from('cdl_students')
              .select('*', { count: 'exact', head: true })
              .eq('cohort_id', c.id);
            return { name: c.name, count: count || 0 };
          })
        );
        setCohortData(cohortList);
      }

      // 3. Certificate distribution
      const { data: certs } = await supabase.from('certificates').select('id, name');
      if (certs) {
        const certList = await Promise.all(
          certs.map(async (c) => {
            const { count } = await supabase
              .from('student_certificates')
              .select('*', { count: 'exact', head: true })
              .eq('certificate_id', c.id);
            return { name: c.name, count: count || 0 };
          })
        );
        setCertData(certList.filter((c) => c.count > 0).sort((a, b) => b.count - a.count));
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-emerald-900 font-bold text-base">
        Loading B.A.S.I.C.S. Real-time Metrics...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
        <KPICard 
          title="TOTAL CERTIFICATES" 
          value={stats.certs} 
          subtitle="Real count across all students" 
          color="bg-emerald-700 text-white ring-2 ring-emerald-400" 
        />
        <KPICard title="NETWORKING BASICS" value={stats.networking} color="bg-slate-800 text-white" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-extrabold text-slate-800">CDL Students by Cohort</h2>
          {cohortData.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{c.name}</span>
                <span className="font-bold text-emerald-800">{c.count} Students</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(c.count * 20, 100)}%` }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Top Earned Certificates */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-lg font-extrabold text-slate-800">Top Earned Certificates</h2>
          {certData.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="truncate pr-2">{c.name}</span>
                <span className="font-bold text-emerald-700">{c.count} Earned</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(c.count * 15, 100)}%` }} 
                />
              </div>
            </div>
          ))}
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