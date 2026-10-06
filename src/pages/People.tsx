import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onAddPerson?: () => void;
}

export default function People({ onAddPerson }: Props) {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personDetails, setPersonDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    setLoading(true);
    try {
      // Primary fetch with relations
      const { data, error } = await supabase
        .from('people')
        .select(`
          id,
          full_name,
          given_name,
          family_name,
          email,
          phone,
          gender,
          address,
          created_at,
          cdl_students(id, current_class, status),
          staff_profiles(id, employment_status),
          volunteer_profiles(id, area_of_interest),
          hedzole_profiles(id, exam_type),
          sponsorship_profiles(id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Nested query failed, falling back to simple people query:', error);
        // Fallback: Query people table directly so table NEVER stays empty
        const { data: fallbackData } = await supabase
          .from('people')
          .select('*')
          .order('created_at', { ascending: false });
        setPeople(fallbackData || []);
      } else {
        setPeople(data || []);
      }
    } catch (err) {
      console.error('Error in fetchPeople:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch full questionnaire details when a person row is clicked
  async function handlePersonClick(person: any) {
    setSelectedPerson(person);
    setLoadingDetails(true);

    try {
      const [
        { data: pData },
        { data: relData },
        { data: staffData },
        { data: hedzoleData },
        { data: volunteerData },
        { data: cdlData },
        { data: sponsorData },
      ] = await Promise.all([
        supabase.from('people').select('*').eq('id', person.id).single(),
        supabase.from('person_relationships').select('*, related_person:related_person_id(full_name, phone)').eq('person_id', person.id),
        supabase.from('staff_profiles').select('*').eq('person_id', person.id).maybeSingle(),
        supabase.from('hedzole_profiles').select('*').eq('person_id', person.id).maybeSingle(),
        supabase.from('volunteer_profiles').select('*').eq('person_id', person.id).maybeSingle(),
        supabase.from('cdl_students').select('*, cohort:cohort_id(name)').eq('person_id', person.id).maybeSingle(),
        supabase.from('sponsorship_profiles').select('*').eq('person_id', person.id).maybeSingle(),
      ]);

      let certList: any[] = [];
      if (cdlData) {
        const { data: certs } = await supabase
          .from('student_certificates')
          .select('*, certificate:certificate_id(name)')
          .eq('student_id', cdlData.id);
        if (certs) certList = certs;
      }

      setPersonDetails({
        personal: pData,
        relationships: relData || [],
        staff: staffData,
        hedzole: hedzoleData,
        volunteer: volunteerData,
        cdl: cdlData,
        certificates: certList,
        sponsorship: sponsorData,
      });
    } catch (err) {
      console.error('Error fetching questionnaire details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  const filteredPeople = people.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-950">People Directory</h1>
          <p className="text-slate-600 text-sm">
            Click on any individual to view their full Questionnaire Record
          </p>
        </div>

        <button
          onClick={onAddPerson}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-5 py-3 rounded-xl text-sm shadow-md transition-all self-start md:self-auto cursor-pointer"
        >
          + Add New Questionnaire Record
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone number..."
          className="w-full p-3 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold">Loading Directory...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No records found. Click "+ Add New Questionnaire Record" above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-950 text-white font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Full Name (Click to View Record)</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Program Badges</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPeople.map((person) => (
                  <tr
                    key={person.id}
                    onClick={() => handlePersonClick(person)}
                    className="hover:bg-emerald-50/60 cursor-pointer transition-all group"
                  >
                    <td className="p-4 font-bold text-emerald-950 text-sm group-hover:underline">
                      {person.full_name}
                    </td>
                    <td className="p-4 text-slate-600">{person.gender || '—'}</td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-slate-800">{person.phone || 'No phone'}</p>
                      <p className="text-slate-400 text-[11px]">{person.email || 'No email'}</p>
                    </td>
                    <td className="p-4 space-x-1.5 space-y-1">
                      {person.cdl_students?.length > 0 && (
                        <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          CDL ({person.cdl_students[0].current_class || 'Student'})
                        </span>
                      )}
                      {person.staff_profiles?.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          Staff
                        </span>
                      )}
                      {person.volunteer_profiles?.length > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          Volunteer
                        </span>
                      )}
                      {person.hedzole_profiles?.length > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          Hedzole
                        </span>
                      )}
                      {person.sponsorship_profiles?.length > 0 && (
                        <span className="bg-pink-100 text-pink-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          Sponsored
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button className="bg-emerald-100 text-emerald-900 font-bold px-3 py-1.5 rounded-lg text-[11px] group-hover:bg-emerald-800 group-hover:text-white transition-all cursor-pointer">
                        View Intake Form 📄
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INTAKE QUESTIONNAIRE MODAL */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-100 space-y-6 p-8 relative animate-in fade-in">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase">
                  Intake Questionnaire Record
                </span>
                <h2 className="text-2xl font-black text-emerald-950">
                  {selectedPerson.full_name}
                </h2>
                <p className="text-xs text-slate-500">
                  Registered: {new Date(selectedPerson.created_at).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPerson(null);
                  setPersonDetails(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold w-9 h-9 rounded-full flex items-center justify-center text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingDetails || !personDetails ? (
              <div className="p-12 text-center text-emerald-900 font-bold">
                Loading Full Intake Questionnaire Data...
              </div>
            ) : (
              <div className="space-y-6">
                {/* SECTION 1: PERSONAL INFORMATION */}
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-3">
                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider border-b border-emerald-200 pb-1">
                    Section 1: All People Personal Data
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Given Name</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.given_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Family Name</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.family_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Other Names</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.other_names || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Gender</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Date of Birth</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.date_of_birth || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Place of Birth</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.place_of_birth || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Email</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Phone</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium text-[10px] uppercase">Processed By</p>
                      <p className="font-bold text-slate-800">{personDetails.personal?.processed_by || '—'}</p>
                    </div>
                  </div>

                  {/* Cross References */}
                  {personDetails.relationships?.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-[10px] font-bold text-emerald-900 uppercase">Cross-Reference Links:</p>
                      {personDetails.relationships.map((rel: any) => (
                        <p key={rel.id} className="text-xs font-semibold text-emerald-800">
                          🔗 Linked to: {rel.related_person?.full_name} ({rel.relationship_type})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 2: STAFF PROFILE */}
                {personDetails.staff && (
                  <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-3">
                    <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider border-b border-blue-200 pb-1">
                      Section 2: Staff Employment Profile
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Employment Status</p>
                        <p className="font-bold text-blue-900">{personDetails.staff.employment_status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">SSNIT Number</p>
                        <p className="font-bold text-slate-800">{personDetails.staff.ssnit_number || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">National ID Number</p>
                        <p className="font-bold text-slate-800">{personDetails.staff.national_id_number || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3: HEDZOLE PROFILE */}
                {personDetails.hedzole && (
                  <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 space-y-3">
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider border-b border-amber-200 pb-1">
                      Section 3: Hedzole Member Profile
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Attended School</p>
                        <p className="font-bold text-slate-800">{personDetails.hedzole.attended_school ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Exam Type</p>
                        <p className="font-bold text-slate-800">{personDetails.hedzole.exam_type || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 4: VOLUNTEER PROFILE */}
                {personDetails.volunteer && (
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-3">
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider border-b border-emerald-200 pb-1">
                      Section 4: Volunteer Profile
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Area of Interest</p>
                        <p className="font-bold text-emerald-900">{personDetails.volunteer.area_of_interest || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Availability</p>
                        <p className="font-bold text-slate-800">{personDetails.volunteer.availability_days_times || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 5: CDL STUDENT PROFILE & CERTIFICATES */}
                {personDetails.cdl && (
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-3">
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider border-b border-emerald-200 pb-1">
                      Section 5: Chorkor Digital Lab (CDL) Student Record
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Cohort / Class</p>
                        <p className="font-black text-emerald-900 text-sm">{personDetails.cdl.current_class || personDetails.cdl.cohort?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Status</p>
                        <p className="font-bold text-slate-800">{personDetails.cdl.status || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Computer Skills</p>
                        <p className="font-bold text-slate-800">{personDetails.cdl.computer_skills || '—'}</p>
                      </div>
                    </div>

                    {/* Earned Certificates List */}
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-[10px] font-bold text-emerald-900 uppercase mb-1">
                        Certificates Earned ({personDetails.certificates.length}):
                      </p>
                      {personDetails.certificates.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No certificates assigned yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {personDetails.certificates.map((sc: any) => (
                            <span
                              key={sc.id}
                              className="bg-emerald-900 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                            >
                              📜 {sc.certificate?.name || 'Certificate'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 6: SCHOOL SPONSORSHIP PROFILE */}
                {personDetails.sponsorship && (
                  <div className="bg-pink-50/70 p-5 rounded-2xl border border-pink-200 space-y-3">
                    <h3 className="text-xs font-black text-pink-950 uppercase tracking-wider border-b border-pink-200 pb-1">
                      Section 6: School Sponsorship Record
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">School Name</p>
                        <p className="font-bold text-pink-900">{personDetails.sponsorship.school_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Ethnicity</p>
                        <p className="font-bold text-slate-800">{personDetails.sponsorship.ethnicity || '—'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium text-[10px] uppercase">Lives With</p>
                        <p className="font-bold text-slate-800">{personDetails.sponsorship.lives_with || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => {
                  setSelectedPerson(null);
                  setPersonDetails(null);
                }}
                className="bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Close Questionnaire Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}