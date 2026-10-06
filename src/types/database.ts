// =============================================================================
// Helper / nested types
// =============================================================================

/** Emergency contact information stored as JSONB in staff_profiles. */
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

/** A single day-time availability slot stored as JSONB in volunteer_profiles. */
export interface AvailabilitySlot {
  day: string;
  start_time: string;
  end_time: string;
}

/**
 * A certificate selection made during CDL step 5.
 * `file_url` is set after the upload completes; `date_earned` is required.
 */
export interface SelectedCertificate {
  certificate_id: string;
  file_url?: string;
  date_earned: string;
}

// =============================================================================
// Database row types (mirrors public schema)
// =============================================================================

export interface PersonRow {
  id: string;
  given_name: string;
  family_name: string;
  other_names: string | null;
  full_name: string;
  gender: string;
  date_of_birth: string;
  age: number | null;
  place_of_birth: string | null;
  email: string | null;
  phone: string;
  address: string | null;
  processed_by: string;
  created_at: string;
}

export interface StaffProfileRow {
  id: string;
  person_id: string;
  work_email: string | null;
  passport_photo_url: string | null;
  ssnit_number: string | null;
  national_id_number: string | null;
  national_id_photo_url: string | null;
  bank_account_number: string | null;
  marital_status: string | null;
  employment_status: string | null;
  start_date: string | null;
  end_date: string | null;
  emergency_contact: EmergencyContact | null;
  screening_q1: boolean | null;
  screening_q2: boolean | null;
  screening_q3: boolean | null;
}

export interface HedzoleProfileRow {
  id: string;
  person_id: string;
  attended_school: boolean | null;
  school_name: string | null;
  class_level_completed: string | null;
  exam_type: string | null;
  marital_status: string | null;
  number_of_children: number | null;
  children_age_range: string | null;
  program_expectations: string | null;
  bank_account_details: string | null;
  expected_monthly_earning: number | null;
}

export interface VolunteerProfileRow {
  id: string;
  person_id: string;
  occupation: string | null;
  motivation: string | null;
  area_of_interest: string | null;
  relevant_skills: string | null;
  availability_days_times: AvailabilitySlot[] | null;
  preferred_duration: string | null;
  start_date: string | null;
  end_date: string | null;
  education_level: string | null;
  certifications: string | null;
  languages_spoken: string[] | null;
}

export interface CdlStudentRow {
  id: string;
  person_id: string;
  cohort_id: string | null;
  current_class: string | null;
  status: string | null;
  how_heard_about: string | null;
  how_heard_other: string | null;
  national_id_url: string | null;
  educational_background: string | null;
  computer_skills: 'None' | 'Basic' | 'Intermediate' | 'Advanced' | null;
  highest_education: string | null;
  currently_employed: boolean | null;
  current_occupation: string | null;
}

export interface StudentCertificateRow {
  id: string;
  student_id: string;
  certificate_id: string;
  file_url: string | null;
  date_earned: string;
}

export interface CertificateRow {
  id: string;
  name: string;
}

export interface CohortRow {
  id: string;
  name: string;
}

// =============================================================================
// Tables map — keys table names to their row type for generic Supabase helpers
// =============================================================================

export interface Tables {
  people: PersonRow;
  staff_profiles: StaffProfileRow;
  hedzole_profiles: HedzoleProfileRow;
  volunteer_profiles: VolunteerProfileRow;
  cdl_students: CdlStudentRow;
  student_certificates: StudentCertificateRow;
  certificates: CertificateRow;
  cohorts: CohortRow;
}

// =============================================================================
// MasterFormSchema — single react-hook-form schema for the entire wizard
// =============================================================================

export interface MasterFormSchema {
  // ── Step 1: Person (always required) ───────────────────────────────────────
  given_name: string;
  family_name: string;
  other_names?: string;
  gender: 'Male' | 'Female' | 'Other';
  date_of_birth: string; // ISO date string YYYY-MM-DD
  place_of_birth?: string;
  email?: string;
  phone: string;
  address?: string;
  processed_by: string;

  // Programs selected (drives which subsequent steps are shown)
  programs: {
    staff: boolean;
    hedzole: boolean;
    volunteer: boolean;
    cdl: boolean;
  };

  // ── Step 2: Staff ───────────────────────────────────────────────────────────
  ssnit_number?: string;
  national_id_number?: string;
  bank_account_number?: string;
  marital_status_staff?: string;
  /** Required when programs.staff is true */
  employment_status?: string;
  /** Required when programs.staff is true */
  start_date_staff?: string;
  end_date_staff?: string;
  emergency_contact?: EmergencyContact;
  screening_q1?: boolean;
  screening_q2?: boolean;
  screening_q3?: boolean;
  /** Set to the public URL after successful upload to passport-photos bucket */
  passport_photo_url?: string;
  /** Set to the public URL after successful upload to national-ids bucket */
  national_id_photo_url?: string;

  // ── Step 3: Hedzole ─────────────────────────────────────────────────────────
  /** Required when programs.hedzole is true */
  attended_school?: boolean;
  /** Visible and collected only when attended_school is true */
  school_name?: string;
  /** Visible and collected only when attended_school is true */
  class_level_completed?: string;
  exam_type?: string;
  /** Required when programs.hedzole is true */
  marital_status_hedzole?: string;
  /** Required when programs.hedzole is true */
  number_of_children?: number;
  children_age_range?: string;
  program_expectations?: string;
  bank_account_details_hedzole?: string;
  expected_monthly_earning?: number;

  // ── Step 4: Volunteer ────────────────────────────────────────────────────────
  /** Required when programs.volunteer is true; max 100 characters */
  occupation?: string;
  /** Max 500 characters */
  motivation?: string;
  area_of_interest?: string;
  /** Max 500 characters */
  relevant_skills?: string;
  /** At least one slot required when programs.volunteer is true */
  availability_days_times?: AvailabilitySlot[];
  preferred_duration?: string;
  start_date_volunteer?: string;
  end_date_volunteer?: string;
  education_level?: string;
  /** Max 500 characters */
  certifications_volunteer?: string;
  languages_spoken?: string[];

  // ── Step 5: CDL Student ──────────────────────────────────────────────────────
  /** Required when programs.cdl is true */
  cohort_id?: string;
  /** Required when programs.cdl is true */
  current_class?: string;
  /** Required when programs.cdl is true */
  cdl_status?: string;
  /** Required when programs.cdl is true */
  how_heard_about?: string;
  /** Visible and collected only when how_heard_about === 'Other'; max 250 chars */
  how_heard_other?: string;
  computer_skills?: 'None' | 'Basic' | 'Intermediate' | 'Advanced';
  /** Required when programs.cdl is true */
  highest_education?: string;
  currently_employed?: boolean;
  selected_certificates?: SelectedCertificate[];
}
