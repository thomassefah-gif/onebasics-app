import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onComplete?: () => void;
}

export default function Form({ onComplete }: Props) {
  // ===== SECTION 1: ALL PEOPLE =====
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [processedBy, setProcessedBy] = useState('');

  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [relatedPersonId, setRelatedPersonId] = useState('');

  // Program flags
  const [isStaff, setIsStaff] = useState(false);
  const [isHedzole, setIsHedzole] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isCDL, setIsCDL] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);

  // Staff (keep minimal - same as before)
  const [workEmail, setWorkEmail] = useState('');
  const [ssnitNumber, setSsnitNumber] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [staffMaritalStatus, setStaffMaritalStatus] = useState('Single');
  const [employmentStatus, setEmploymentStatus] = useState('Contract');
  const [startDate, setStartDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Hedzole
  const [attendedSchoolH, setAttendedSchoolH] = useState(true);
  const [schoolNameH, setSchoolNameH] = useState('');
  const [examType, setExamType] = useState('WASSCE');
  const [childrenCount, setChildrenCount] = useState(0);
  const [programExpectations, setProgramExpectations] = useState('');

  // Volunteer
  const [occupation, setOccupation] = useState('');
  const [motivation, setMotivation] = useState('');
  const [areaOfInterest, setAreaOfInterest] = useState('tech/digital lab');
  const [availability, setAvailability] = useState('');

  // CDL
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [cdlStatus, setCdlStatus] = useState('Active');
  const [computerSkills, setComputerSkills] = useState('Basic');
  const [highestEducation, setHighestEducation] = useState('Certificate');
  const [howHeard, setHowHeard] = useState('Referral');
  const [allCertificates, setAllCertificates] = useState<any[]>([]);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);

  // ===== SPONSORSHIP (matches your paper form) =====
  const [sp, setSp] = useState({
    application_date: '',
    processed_by: '',
    // Child info
    age_at_application: '',
    current_class: '',
    school_attending: '',
    id_card: '',
    insurance_card: '',
    // Living
    lives_with: '',
    relation_to_child: '',
    how_long_lived_with: '',
    emergency_contact_other: '',
    // Identification
    identified_how: '',
    identified_how_other: '',
    // Appearance
    appearance_healthy: false,
    appearance_disabled: false,
    appearance_unhealthy: false,
    appearance_abuse: false,
    appearance_hungry: false,
    // Temperament
    temp_calm: false,
    temp_uncalm: false,
    temp_hyper: false,
    temp_scared: false,
    temp_worried: false,
    temp_resistant: false,
    // Work
    child_works: false,
    child_work_explain: '',
    child_work_compensation: '',
    child_work_amount: '',
    // Education
    attends_school_now: false,
    ever_attended_school: false,
    school_name: '',
    last_class_completed: '',
    last_attended_when: '',
    class_stopped: '',
    date_stopped: '',
    reason_not_in_school: '',
    has_report_card: false,
    // Health
    has_medical_problems: false,
    medical_problems_list: '',
    has_birth_certificate: false,
    has_weighing_card: false,
    // Household
    household_size: '',
    single_parent_guardian: false,
    own_or_rent: '',
    res_wooden: false,
    res_container: false,
    res_single_room: false,
    res_chamber_hall: false,
    res_no_toilet: false,
    res_no_electricity: false,
    residence_description: '',
    // Mother
    mother_name: '',
    mother_age: '',
    mother_status: '',
    mother_location: '',
    mother_occupation: '',
    mother_salary: '',
    mother_education: '',
    mother_medical_problems: '',
    mother_children_count: '',
    mother_marital_status: '',
    // Father
    father_name: '',
    father_age: '',
    father_status: '',
    father_location: '',
    father_occupation: '',
    father_salary: '',
    father_education: '',
    father_medical_problems: '',
    father_children_count: '',
    father_marital_status: '',
    // Assessment
    why_sponsorship: '',
    facilitator_assessment: '',
    parents_feedback: '',
    other_commitments: '',
    // Agreements
    agree_no_child_labor: false,
    agree_attend_meetings: false,
    agree_school_on_time: false,
    agree_upkeep_uniforms: false,
    agree_pay_dues: false,
    agree_protect_rights: false,
    agree_co_guardian: false,
    guardian_signature: '',
    guardian_relationship: '',
  });

  const set = (field: string, value: any) => setSp((p) => ({ ...p, [field]: value }));

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('people').select('id, full_name, phone, email').order('full_name');
      if (p) setAllPeople(p);
      const { data: c } = await supabase.from('cohorts').select('id, name').order('name');
      if (c) {
        setCohorts(c);
        if (c[0]) setSelectedCohortId(c[0].id);
      }
      const { data: certs } = await supabase.from('certificates').select('id, name').order('name');
      if (certs) setAllCertificates(certs);
    })();
  }, []);

  function toggleCert(id: string) {
    setSelectedCertIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: person, error } = await supabase
        .from('people')
        .insert({
          given_name: givenName,
          family_name: familyName,
          other_names: otherNames || null,
          gender,
          date_of_birth: dob || null,
          place_of_birth: placeOfBirth || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          processed_by: processedBy || sp.processed_by || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (relatedPersonId) {
        await supabase.from('person_relationships').insert({
          person_id: person.id,
          related_person_id: relatedPersonId,
          relationship_type: 'Related to BASICS person',
        });
      }

      if (isStaff) {
        await supabase.from('staff_profiles').insert({
          person_id: person.id,
          work_email: workEmail || null,
          ssnit_number: ssnitNumber || null,
          national_id_number: nationalIdNumber || null,
          bank_account_number: bankAccount || null,
          marital_status: staffMaritalStatus,
          employment_status: employmentStatus,
          start_date: startDate || null,
          emergency_contact: emergencyContact || null,
        });
      }

      if (isHedzole) {
        await supabase.from('hedzole_profiles').insert({
          person_id: person.id,
          attended_school: attendedSchoolH,
          school_name: schoolNameH || null,
          exam_type: examType,
          number_of_children: childrenCount,
          program_expectations: programExpectations || null,
        });
      }

      if (isVolunteer) {
        await supabase.from('volunteer_profiles').insert({
          person_id: person.id,
          occupation: occupation || null,
          motivation: motivation || null,
          area_of_interest: areaOfInterest,
          availability_days_times: availability || null,
        });
      }

      if (isCDL) {
        const cohort = cohorts.find((c) => c.id === selectedCohortId);
        const { data: student } = await supabase
          .from('cdl_students')
          .insert({
            person_id: person.id,
            cohort_id: selectedCohortId || null,
            current_class: cohort?.name || null,
            status: cdlStatus,
            computer_skills: computerSkills,
            highest_education: highestEducation,
            how_heard_about: howHeard,
          })
          .select()
          .single();
        if (student && selectedCertIds.length) {
          await supabase.from('student_certificates').insert(
            selectedCertIds.map((cid) => ({ student_id: student.id, certificate_id: cid }))
          );
        }
      }

      if (isSponsor) {
        await supabase.from('sponsorship_profiles').insert({
          person_id: person.id,
          application_date: sp.application_date || null,
          processed_by: sp.processed_by || processedBy || null,
          age_at_application: sp.age_at_application ? Number(sp.age_at_application) : null,
          current_class: sp.current_class || null,
          school_attending: sp.school_attending || null,
          id_card: sp.id_card || null,
          insurance_card: sp.insurance_card || null,
          lives_with: sp.lives_with || null,
          relation_to_child: sp.relation_to_child || null,
          how_long_lived_with: sp.how_long_lived_with || null,
          emergency_contact_other: sp.emergency_contact_other || null,
          identified_how: sp.identified_how || null,
          identified_how_other: sp.identified_how_other || null,
          appearance_healthy: sp.appearance_healthy,
          appearance_disabled: sp.appearance_disabled,
          appearance_unhealthy: sp.appearance_unhealthy,
          appearance_abuse: sp.appearance_abuse,
          appearance_hungry: sp.appearance_hungry,
          temp_calm: sp.temp_calm,
          temp_uncalm: sp.temp_uncalm,
          temp_hyper: sp.temp_hyper,
          temp_scared: sp.temp_scared,
          temp_worried: sp.temp_worried,
          temp_resistant: sp.temp_resistant,
          child_works: sp.child_works,
          child_work_explain: sp.child_work_explain || null,
          child_work_compensation: sp.child_work_compensation || null,
          child_work_amount: sp.child_work_amount || null,
          attends_school_now: sp.attends_school_now,
          ever_attended_school: sp.ever_attended_school,
          school_name: sp.school_name || null,
          last_class_completed: sp.last_class_completed || null,
          last_attended_when: sp.last_attended_when || null,
          class_stopped: sp.class_stopped || null,
          date_stopped: sp.date_stopped || null,
          reason_not_in_school: sp.reason_not_in_school || null,
          has_report_card: sp.has_report_card,
          has_medical_problems: sp.has_medical_problems,
          medical_problems_list: sp.medical_problems_list || null,
          has_birth_certificate: sp.has_birth_certificate,
          has_weighing_card: sp.has_weighing_card,
          household_size: sp.household_size ? Number(sp.household_size) : null,
          single_parent_guardian: sp.single_parent_guardian,
          own_or_rent: sp.own_or_rent || null,
          res_wooden: sp.res_wooden,
          res_container: sp.res_container,
          res_single_room: sp.res_single_room,
          res_chamber_hall: sp.res_chamber_hall,
          res_no_toilet: sp.res_no_toilet,
          res_no_electricity: sp.res_no_electricity,
          residence_description: sp.residence_description || null,
          mother_name: sp.mother_name || null,
          mother_age: sp.mother_age ? Number(sp.mother_age) : null,
          mother_status: sp.mother_status || null,
          mother_location: sp.mother_location || null,
          mother_occupation: sp.mother_occupation || null,
          mother_salary: sp.mother_salary || null,
          mother_education: sp.mother_education || null,
          mother_medical_problems: sp.mother_medical_problems || null,
          mother_children_count: sp.mother_children_count ? Number(sp.mother_children_count) : null,
          mother_marital_status: sp.mother_marital_status || null,
          father_name: sp.father_name || null,
          father_age: sp.father_age ? Number(sp.father_age) : null,
          father_status: sp.father_status || null,
          father_location: sp.father_location || null,
          father_occupation: sp.father_occupation || null,
          father_salary: sp.father_salary || null,
          father_education: sp.father_education || null,
          father_medical_problems: sp.father_medical_problems || null,
          father_children_count: sp.father_children_count ? Number(sp.father_children_count) : null,
          father_marital_status: sp.father_marital_status || null,
          why_sponsorship: sp.why_sponsorship || null,
          facilitator_assessment: sp.facilitator_assessment || null,
          parents_feedback: sp.parents_feedback || null,
          other_commitments: sp.other_commitments || null,
          agree_no_child_labor: sp.agree_no_child_labor,
          agree_attend_meetings: sp.agree_attend_meetings,
          agree_school_on_time: sp.agree_school_on_time,
          agree_upkeep_uniforms: sp.agree_upkeep_uniforms,
          agree_pay_dues: sp.agree_pay_dues,
          agree_protect_rights: sp.agree_protect_rights,
          agree_co_guardian: sp.agree_co_guardian,
          guardian_signature: sp.guardian_signature || null,
          guardian_relationship: sp.guardian_relationship || null,
        });
      }

      setSuccessMessage(true);
      setTimeout(() => onComplete?.(), 1500);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto my-16 bg-white rounded-2xl shadow-xl border border-emerald-100">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-emerald-950">Record Saved!</h2>
        <p className="text-slate-600 text-sm mt-2">Linked to personal info + selected programs.</p>
      </div>
    );
  }

  const input = 'w-full p-2.5 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600';
  const label = 'block text-xs font-bold text-slate-700 uppercase mb-1';
  const check = 'flex items-center gap-2 text-sm font-semibold cursor-pointer';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-black text-emerald-950">B.A.S.I.C.S. Data Collection</h1>
        <p className="text-slate-600 text-sm">Section 1 for everyone. Tick programs below for extra sections only.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ========== SECTION 1 ========== */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-emerald-950 border-b pb-2">Section 1: Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={label}>Given Name *</label>
              <input required className={input} value={givenName} onChange={(e) => setGivenName(e.target.value)} />
            </div>
            <div>
              <label className={label}>Family Name *</label>
              <input required className={input} value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
            </div>
            <div>
              <label className={label}>Other Name(s)</label>
              <input className={input} value={otherNames} onChange={(e) => setOtherNames(e.target.value)} />
            </div>
            <div>
              <label className={label}>Gender</label>
              <select className={input} value={gender} onChange={(e: any) => setGender(e.target.value)}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className={label}>Date of Birth</label>
              <input type="date" className={input} value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label className={label}>Place of Birth</label>
              <input className={input} value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={label}>Processed By</label>
              <input className={input} value={processedBy} onChange={(e) => setProcessedBy(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Address</label>
            <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className={label}>Cross-Reference (existing BASICS person)</label>
            <select className={input} value={relatedPersonId} onChange={(e) => setRelatedPersonId(e.target.value)}>
              <option value="">— None / Select person —</option>
              {allPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} {p.phone ? `(${p.phone})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ========== PROGRAM TOGGLES ========== */}
        <div className="bg-emerald-950 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="font-extrabold text-sm uppercase text-emerald-200 mb-3">Select Programs</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l: 'Staff', s: isStaff, f: setIsStaff },
              { l: 'Hedzole', s: isHedzole, f: setIsHedzole },
              { l: 'Volunteer', s: isVolunteer, f: setIsVolunteer },
              { l: 'CDL Student', s: isCDL, f: setIsCDL },
              { l: 'Sponsorship', s: isSponsor, f: setIsSponsor },
            ].map((x) => (
              <label
                key={x.l}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 ${
                  x.s ? 'bg-emerald-600 border-white' : 'bg-emerald-900/50 border-emerald-800'
                }`}
              >
                <input type="checkbox" checked={x.s} onChange={(e) => x.f(e.target.checked)} />
                <span className="font-bold text-xs">{x.l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Staff / Hedzole / Volunteer / CDL — keep your existing blocks if you want; abbreviated here */}
        {isStaff && (
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 space-y-4">
            <h2 className="font-extrabold text-blue-900">Section 2: Staff</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className={label}>Work Email</label><input className={input} value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} /></div>
              <div><label className={label}>SSNIT</label><input className={input} value={ssnitNumber} onChange={(e) => setSsnitNumber(e.target.value)} /></div>
              <div><label className={label}>National ID</label><input className={input} value={nationalIdNumber} onChange={(e) => setNationalIdNumber(e.target.value)} /></div>
              <div><label className={label}>Employment</label>
                <select className={input} value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                  <option>Contract</option><option>Permanent</option><option>Ambassador</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {isCDL && (
          <div className="bg-white p-6 rounded-2xl border-2 border-emerald-200 space-y-4">
            <h2 className="font-extrabold text-emerald-900">Section 5: CDL Student</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={label}>Cohort</label>
                <select className={input} value={selectedCohortId} onChange={(e) => setSelectedCohortId(e.target.value)}>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Computer Skills</label>
                <select className={input} value={computerSkills} onChange={(e) => setComputerSkills(e.target.value)}>
                  <option>No computer skills</option><option>Basic</option><option>Intermediate</option><option>Very advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Certificates</label>
              <div className="grid md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded-xl bg-slate-50">
                {allCertificates.map((c) => (
                  <label key={c.id} className={check}>
                    <input type="checkbox" checked={selectedCertIds.includes(c.id)} onChange={() => toggleCert(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== SECTION 6: REAL SPONSORSHIP FORM ========== */}
        {isSponsor && (
          <div className="bg-white p-6 rounded-2xl border-2 border-pink-300 shadow-sm space-y-8">
            <h2 className="text-xl font-black text-pink-900 border-b border-pink-200 pb-2">
              B.A.S.I.C.S School Sponsorship Application
            </h2>

            {/* Meta */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Application Date</label>
                <input type="date" className={input} value={sp.application_date} onChange={(e) => set('application_date', e.target.value)} />
              </div>
              <div>
                <label className={label}>Application processed by</label>
                <input className={input} value={sp.processed_by} onChange={(e) => set('processed_by', e.target.value)} />
              </div>
            </div>

            {/* Child's Information */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Child's Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className={label}>Age</label><input type="number" className={input} value={sp.age_at_application} onChange={(e) => set('age_at_application', e.target.value)} /></div>
                <div><label className={label}>Class you are in</label><input className={input} value={sp.current_class} onChange={(e) => set('current_class', e.target.value)} /></div>
                <div><label className={label}>School attending</label><input className={input} value={sp.school_attending} onChange={(e) => set('school_attending', e.target.value)} /></div>
                <div><label className={label}>ID Card</label><input className={input} value={sp.id_card} onChange={(e) => set('id_card', e.target.value)} /></div>
                <div><label className={label}>Insurance Card</label><input className={input} value={sp.insurance_card} onChange={(e) => set('insurance_card', e.target.value)} /></div>
              </div>
            </div>

            {/* Living Situation */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Living Situation</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className={label}>Who does the child live with?</label><input className={input} value={sp.lives_with} onChange={(e) => set('lives_with', e.target.value)} /></div>
                <div><label className={label}>Relation to the child?</label><input className={input} value={sp.relation_to_child} onChange={(e) => set('relation_to_child', e.target.value)} /></div>
                <div><label className={label}>How long has the child lived with?</label><input className={input} value={sp.how_long_lived_with} onChange={(e) => set('how_long_lived_with', e.target.value)} /></div>
                <div><label className={label}>Emergency contact other than guardian</label><input className={input} value={sp.emergency_contact_other} onChange={(e) => set('emergency_contact_other', e.target.value)} /></div>
              </div>
            </div>

            {/* Current Situation */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Current Situation</h3>
              <div>
                <label className={label}>How was this child identified / referred to BASICS?</label>
                <select className={input} value={sp.identified_how} onChange={(e) => set('identified_how', e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="at_beach">At beach</option>
                  <option value="working">Working (hawking, selling, trading, etc)</option>
                  <option value="home_loitering">At home / in community loitering</option>
                  <option value="school_referral">School referral</option>
                  <option value="park_football">Park – playing football</option>
                  <option value="other">Other</option>
                </select>
                {sp.identified_how === 'other' && (
                  <input className={`${input} mt-2`} placeholder="Please indicate" value={sp.identified_how_other} onChange={(e) => set('identified_how_other', e.target.value)} />
                )}
              </div>

              <div>
                <label className={label}>Appearance of child (check all that apply)</label>
                <div className="grid md:grid-cols-2 gap-2 mt-2">
                  {[
                    ['appearance_healthy', 'Healthy – no signs of neglect, undernourishment'],
                    ['appearance_disabled', 'Disabled – show signs / clear of disability'],
                    ['appearance_unhealthy', 'Unhealthy – lack of nourishment, kwashiorkor'],
                    ['appearance_abuse', 'Abuse – scars, sores, bruises'],
                    ['appearance_hungry', 'Hungry'],
                  ].map(([k, lab]) => (
                    <label key={k} className={check}>
                      <input type="checkbox" checked={(sp as any)[k]} onChange={(e) => set(k, e.target.checked)} />
                      {lab}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={label}>Temperament</label>
                <div className="grid md:grid-cols-3 gap-2 mt-2">
                  {[
                    ['temp_calm', 'Calm – easily engaged'],
                    ['temp_uncalm', 'Uncalm – not engaging with ease'],
                    ['temp_hyper', 'Hyper'],
                    ['temp_scared', 'Scared'],
                    ['temp_worried', 'Worried'],
                    ['temp_resistant', 'Resistant'],
                  ].map(([k, lab]) => (
                    <label key={k} className={check}>
                      <input type="checkbox" checked={(sp as any)[k]} onChange={(e) => set(k, e.target.checked)} />
                      {lab}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Child work */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Child Work</h3>
              <label className={check}>
                <input type="checkbox" checked={sp.child_works} onChange={(e) => set('child_works', e.target.checked)} />
                Does the child engage in any work?
              </label>
              {sp.child_works && (
                <div className="grid md:grid-cols-2 gap-4 pl-4">
                  <div><label className={label}>If yes, explain</label><textarea className={input} rows={2} value={sp.child_work_explain} onChange={(e) => set('child_work_explain', e.target.value)} /></div>
                  <div><label className={label}>How compensated?</label><input className={input} value={sp.child_work_compensation} onChange={(e) => set('child_work_compensation', e.target.value)} /></div>
                  <div><label className={label}>Amount earned</label><input className={input} value={sp.child_work_amount} onChange={(e) => set('child_work_amount', e.target.value)} /></div>
                </div>
              )}
            </div>

            {/* Education Background */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Education Background</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <label className={check}><input type="checkbox" checked={sp.attends_school_now} onChange={(e) => set('attends_school_now', e.target.checked)} /> Do you attend school now?</label>
                <label className={check}><input type="checkbox" checked={sp.ever_attended_school} onChange={(e) => set('ever_attended_school', e.target.checked)} /> Have you ever attended school?</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className={label}>What school do you attend?</label><input className={input} value={sp.school_name} onChange={(e) => set('school_name', e.target.value)} /></div>
                <div><label className={label}>Last class completed</label><input className={input} value={sp.last_class_completed} onChange={(e) => set('last_class_completed', e.target.value)} /></div>
                <div><label className={label}>Last time attended school</label><input className={input} value={sp.last_attended_when} onChange={(e) => set('last_attended_when', e.target.value)} /></div>
                <div><label className={label}>Class stopped (if applicable)</label><input className={input} value={sp.class_stopped} onChange={(e) => set('class_stopped', e.target.value)} /></div>
                <div><label className={label}>Date stopped</label><input type="date" className={input} value={sp.date_stopped} onChange={(e) => set('date_stopped', e.target.value)} /></div>
              </div>
              <div>
                <label className={label}>Why did the child stop / has not gone to school?</label>
                <textarea className={input} rows={2} value={sp.reason_not_in_school} onChange={(e) => set('reason_not_in_school', e.target.value)} />
              </div>
              <label className={check}>
                <input type="checkbox" checked={sp.has_report_card} onChange={(e) => set('has_report_card', e.target.checked)} />
                Has a copy of last report card? (Social worker should scan and upload)
              </label>
            </div>

            {/* Health */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Health Information</h3>
              <label className={check}>
                <input type="checkbox" checked={sp.has_medical_problems} onChange={(e) => set('has_medical_problems', e.target.checked)} />
                Does the child have any medical problems?
              </label>
              {sp.has_medical_problems && (
                <input className={input} placeholder="List problems" value={sp.medical_problems_list} onChange={(e) => set('medical_problems_list', e.target.value)} />
              )}
              <div className="grid md:grid-cols-2 gap-3">
                <label className={check}><input type="checkbox" checked={sp.has_birth_certificate} onChange={(e) => set('has_birth_certificate', e.target.checked)} /> Birth certificate? Yes</label>
                <label className={check}><input type="checkbox" checked={sp.has_weighing_card} onChange={(e) => set('has_weighing_card', e.target.checked)} /> Weighing card? Yes</label>
              </div>
            </div>

            {/* Household */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-1">Household Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div><label className={label}>How many people live in household?</label><input type="number" className={input} value={sp.household_size} onChange={(e) => set('household_size', e.target.value)} /></div>
                <div>
                  <label className={label}>Own or rent home?</label>
                  <select className={input} value={sp.own_or_rent} onChange={(e) => set('own_or_rent', e.target.value)}>
                    <option value="">—</option>
                    <option value="Own">Own</option>
                    <option value="Rent">Rent</option>
                  </select>
                </div>
                <label className={`${check} mt-6`}>
                  <input type="checkbox" checked={sp.single_parent_guardian} onChange={(e) => set('single_parent_guardian', e.target.checked)} />
                  Single parent / guardian household?
                </label>
              </div>
              <label className={label}>Residence (tick all that apply)</label>
              <div className="grid md:grid-cols-3 gap-2">
                {[
                  ['res_wooden', 'Wooden Structure'],
                  ['res_container', 'Container'],
                  ['res_single_room', 'Single Room'],
                  ['res_chamber_hall', 'Chamber and Hall'],
                  ['res_no_toilet', 'No toilet'],
                  ['res_no_electricity', 'No electricity'],
                ].map(([k, lab]) => (
                  <label key={k} className={check}>
                    <input type="checkbox" checked={(sp as any)[k]} onChange={(e) => set(k, e.target.checked)} />
                    {lab}
                  </label>
                ))}
              </div>
              <div>
                <label className={label}>Describe environment of residence</label>
                <textarea className={input} rows={2} value={sp.residence_description} onChange={(e) => set('residence_description', e.target.value)} />
              </div>
            </div>

            {/* Parents Background */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-1">Parents Background</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <p className="font-bold text-sm text-pink-900">Mother</p>
                  <div><label className={label}>Name</label><input className={input} value={sp.mother_name} onChange={(e) => set('mother_name', e.target.value)} /></div>
                  <div><label className={label}>Age</label><input type="number" className={input} value={sp.mother_age} onChange={(e) => set('mother_age', e.target.value)} /></div>
                  <div>
                    <label className={label}>Status</label>
                    <select className={input} value={sp.mother_status} onChange={(e) => set('mother_status', e.target.value)}>
                      <option value="">—</option>
                      <option>Living</option>
                      <option>Deceased</option>
                      <option>Whereabout unknown</option>
                      <option>Living elsewhere</option>
                    </select>
                  </div>
                  <div><label className={label}>Location of residence</label><input className={input} value={sp.mother_location} onChange={(e) => set('mother_location', e.target.value)} /></div>
                  <div><label className={label}>Occupation</label><input className={input} value={sp.mother_occupation} onChange={(e) => set('mother_occupation', e.target.value)} /></div>
                  <div><label className={label}>Monthly Salary</label><input className={input} value={sp.mother_salary} onChange={(e) => set('mother_salary', e.target.value)} /></div>
                  <div><label className={label}>Highest school completed</label><input className={input} value={sp.mother_education} onChange={(e) => set('mother_education', e.target.value)} /></div>
                  <div><label className={label}>Medical problems?</label><input className={input} value={sp.mother_medical_problems} onChange={(e) => set('mother_medical_problems', e.target.value)} /></div>
                  <div><label className={label}>How many children does mother have?</label><input type="number" className={input} value={sp.mother_children_count} onChange={(e) => set('mother_children_count', e.target.value)} /></div>
                  <div>
                    <label className={label}>Marital status</label>
                    <select className={input} value={sp.mother_marital_status} onChange={(e) => set('mother_marital_status', e.target.value)}>
                      <option value="">—</option>
                      <option>Married to child father</option>
                      <option>Married to other</option>
                      <option>Single</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                  <p className="font-bold text-sm text-pink-900">Father</p>
                  <div><label className={label}>Name</label><input className={input} value={sp.father_name} onChange={(e) => set('father_name', e.target.value)} /></div>
                  <div><label className={label}>Age</label><input type="number" className={input} value={sp.father_age} onChange={(e) => set('father_age', e.target.value)} /></div>
                  <div>
                    <label className={label}>Status</label>
                    <select className={input} value={sp.father_status} onChange={(e) => set('father_status', e.target.value)}>
                      <option value="">—</option>
                      <option>Living</option>
                      <option>Deceased</option>
                      <option>Whereabout unknown</option>
                      <option>Living elsewhere</option>
                    </select>
                  </div>
                  <div><label className={label}>Location of residence</label><input className={input} value={sp.father_location} onChange={(e) => set('father_location', e.target.value)} /></div>
                  <div><label className={label}>Occupation</label><input className={input} value={sp.father_occupation} onChange={(e) => set('father_occupation', e.target.value)} /></div>
                  <div><label className={label}>Monthly Salary</label><input className={input} value={sp.father_salary} onChange={(e) => set('father_salary', e.target.value)} /></div>
                  <div><label className={label}>Highest school completed</label><input className={input} value={sp.father_education} onChange={(e) => set('father_education', e.target.value)} /></div>
                  <div><label className={label}>Medical problems?</label><input className={input} value={sp.father_medical_problems} onChange={(e) => set('father_medical_problems', e.target.value)} /></div>
                  <div><label className={label}>How many children does father have?</label><input type="number" className={input} value={sp.father_children_count} onChange={(e) => set('father_children_count', e.target.value)} /></div>
                  <div>
                    <label className={label}>Marital status</label>
                    <select className={input} value={sp.father_marital_status} onChange={(e) => set('father_marital_status', e.target.value)}>
                      <option value="">—</option>
                      <option>Married to child mother</option>
                      <option>Married to other</option>
                      <option>Single</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Why + Facilitator */}
            <div className="space-y-3">
              <div>
                <label className={label}>Why is sponsorship being requested for this child?</label>
                <textarea className={input} rows={3} value={sp.why_sponsorship} onChange={(e) => set('why_sponsorship', e.target.value)} />
              </div>
              <div>
                <label className={label}>Facilitator – assessment</label>
                <textarea className={input} rows={2} value={sp.facilitator_assessment} onChange={(e) => set('facilitator_assessment', e.target.value)} />
              </div>
              <div>
                <label className={label}>Parents feedback</label>
                <textarea className={input} rows={2} value={sp.parents_feedback} onChange={(e) => set('parents_feedback', e.target.value)} />
              </div>
              <div>
                <label className={label}>Other Commitments</label>
                <textarea className={input} rows={2} value={sp.other_commitments} onChange={(e) => set('other_commitments', e.target.value)} />
              </div>
            </div>

            {/* Parent agreements */}
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl space-y-3">
              <h3 className="font-bold text-pink-900">Parent / Guardian Agreements</h3>
              {[
                ['agree_no_child_labor', 'Stop child from child labor, trafficking, or any act against welfare'],
                ['agree_attend_meetings', 'Attend all meetings'],
                ['agree_school_on_time', 'Send child to school on time, every day, and clean'],
                ['agree_upkeep_uniforms', 'Upkeep the uniforms provided'],
                ['agree_pay_dues', 'Pay dues of 5.00 GHC per month'],
                ['agree_protect_rights', 'Allow BASICS to protect the human rights of the child'],
                ['agree_co_guardian', 'Allow BASICS to act as co-guardian in school and well-being'],
              ].map(([k, lab]) => (
                <label key={k} className={check}>
                  <input type="checkbox" checked={(sp as any)[k]} onChange={(e) => set(k, e.target.checked)} />
                  {lab}
                </label>
              ))}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={label}>Signature (type name)</label>
                  <input className={input} value={sp.guardian_signature} onChange={(e) => set('guardian_signature', e.target.value)} />
                </div>
                <div>
                  <label className={label}>Relationship</label>
                  <input className={input} value={sp.guardian_relationship} onChange={(e) => set('guardian_relationship', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !givenName || !familyName}
            className="bg-emerald-900 hover:bg-emerald-950 disabled:opacity-50 text-white font-extrabold px-10 py-4 rounded-xl shadow-lg"
          >
            {submitting ? 'Saving...' : 'Submit Full Record'}
          </button>
        </div>
      </form>
    </div>
  );
}