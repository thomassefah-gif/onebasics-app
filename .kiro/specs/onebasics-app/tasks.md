# Implementation Plan: BASICS International People Data Collection & Analytics System

## Overview

Implementation proceeds in layers: project scaffold → shared infrastructure (Supabase client, types, hooks) → layout shell → Dashboard page → Form wizard → People list page → property-based and unit tests. Each task builds on the previous so no step produces orphaned code.

---

## Tasks

- [~] 1. Scaffold project and install dependencies
  - Initialise a Vite + React + TypeScript project in the workspace root (`npm create vite@latest . -- --template react-ts`)
  - Install all runtime dependencies: `react-router-dom@6`, `@supabase/supabase-js`, `react-hook-form`, `recharts`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`
  - Install dev dependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fast-check`, `jsdom`
  - Configure `tailwind.config.ts` and `postcss.config.js`; add Tailwind directives to `src/index.css`
  - Configure `vite.config.ts` to include `test` block for Vitest with `jsdom` environment and `setupFiles`
  - Create `src/setupTests.ts` that imports `@testing-library/jest-dom`
  - Add `.env` support: ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables are documented in a `.env.example` file
  - _Requirements: 1.5, 1.6_

- [x] 2. Supabase client and database types
  - [x] 2.1 Create Supabase client singleton at `src/lib/supabase.ts`
    - Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`
    - Throw a descriptive `Error` before `createClient` when either variable is missing or empty, satisfying the app-halt requirement
    - Export the `supabase` client instance
    - _Requirements: 1.5, 1.6_
  - [x] 2.2 Create TypeScript database types at `src/types/database.ts`
    - Define `PersonRow`, `StaffProfileRow`, `HedzoleProfileRow`, `VolunteerProfileRow`, `CdlStudentRow`, `StudentCertificateRow`, `CertificateRow`, `CohortRow` interfaces matching the schema in the design
    - Define `EmergencyContact`, `AvailabilitySlot`, `SelectedCertificate` helper interfaces
    - Define `MasterFormSchema` for the form wizard
    - Export a `Tables` map type keying table name to its row type
    - _Requirements: 4, 7, 8, 9, 10_

- [x] 3. Application shell and routing
  - [x] 3.1 Create `AppShell` layout component at `src/components/layout/AppShell.tsx`
    - Render `<Sidebar />` on the left and `<Outlet />` (React Router v6) on the right
    - Apply a full-height flex layout so the sidebar never collapses
    - _Requirements: 1.1, 1.4_
  - [x] 3.2 Create `Sidebar` navigation component at `src/components/layout/Sidebar.tsx`
    - Render the BASICS International brand name with accent color `#5B21B6`
    - Map `NAV_ITEMS` (Dashboard, Register Person, People) to `<NavLink>` elements using React Router's `isActive` prop
    - Apply `bg-purple-700 text-white` for the active link and `text-purple-200 hover:bg-purple-800` for inactive links
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 3.3 Wire up React Router v6 in `src/main.tsx`
    - Create a `<BrowserRouter>` with routes `/` → `Dashboard`, `/form` → `Form`, `/people` → `People`, all wrapped by `AppShell`
    - _Requirements: 1.1_

- [~] 4. Checkpoint — verify shell renders
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Custom data-fetching hooks
  - [x] 5.1 Create `useDashboardKpis` hook at `src/hooks/useDashboardKpis.ts`
    - Fetch from the `dashboard_kpis` view via the Supabase client
    - Return `{ data, isLoading, error, retry, retryCount }` state
    - Track consecutive retry attempts; set a `isRetryDisabled` flag after 3 consecutive failures
    - Coerce any `null` metric value to `0` before returning
    - _Requirements: 2.1, 2.3, 2.4, 2.6, 2.7_
  - [ ]* 5.2 Write unit tests for `useDashboardKpis`
    - Test null coercion: a null metric value must render as `0`
    - Test retry counter: after 3 failures `isRetryDisabled` is `true`; a 4th call makes no network request
    - _Requirements: 2.6, 2.7_
  - [x] 5.3 Create `useChartData` hook at `src/hooks/useChartData.ts`
    - Expose individual named fetchers for each of the 6 charts (CDL by cohort, certificates pie, CDL by computer skill, CDL by how-heard, staff by employment status, volunteers by area of interest)
    - Each fetcher returns independent `{ data, isLoading, error }` state so chart failures are isolated
    - _Requirements: 3.1–3.10_
  - [x] 5.4 Create `usePeople` hook at `src/hooks/usePeople.ts`
    - Fetch the first 50 records from `public.people` ordered by `full_name` ascending; support paginated fetches via `.range(from, to)`
    - Return `{ people, isLoading, error, currentPage, totalCount, retry }`
    - _Requirements: 12.1, 12.6, 12.7, 12.8_
  - [x] 5.5 Create `useLookups` hook at `src/hooks/useLookups.ts`
    - Expose `useCohorts()` and `useCertificates()` that each return `{ data, isLoading, error, retry }`
    - _Requirements: 10.2, 10.3, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 6. Dashboard page
  - [-] 6.1 Create `KpiCard` component at `src/components/dashboard/KpiCard.tsx`
    - Accept `label`, `value`, `isLoading` props
    - Render a skeleton placeholder while loading and `0` for null/undefined values
    - _Requirements: 2.2, 2.3, 2.5, 2.6_
  - [ ]* 6.2 Write property test for `KpiCard` null coercion
    - **Property 10: KPI null coercion**
    - **Validates: Requirements 2.6**
    - Use `fc.record` with nullable numeric fields; assert rendered text is always `"0"` when value is null/undefined
    - Tag: `// Feature: onebasics-app, Property 10: KPI null coercion`
    - _Requirements: 2.6_
  - [-] 6.3 Create `ChartCard` wrapper at `src/components/dashboard/ChartCard.tsx`
    - Accept `title`, `isLoading`, `isEmpty`, `hasError`, `children` props
    - Render spinner/skeleton while loading, "No data available" when empty, error message on failure
    - _Requirements: 3.7, 3.8, 3.9, 3.10_
  - [~] 6.4 Create `Dashboard` page at `src/pages/Dashboard.tsx`
    - Compose 8 `KpiCard` components fed by `useDashboardKpis`
    - Show inline error message and retry button; disable retry after 3 consecutive failures
    - Compose 6 `ChartCard` + Recharts chart components fed by `useChartData`
    - Apply brand color `#5B21B6` as the `fill` for all bars and pie slices; enable `<Tooltip />`
    - _Requirements: 2.1–2.7, 3.1–3.10_
  - [ ]* 6.5 Write property test for retry cap
    - **Property 11: Retry cap disables action**
    - **Validates: Requirements 2.7**
    - Use `fc.integer({ min: 3, max: 10 })` to simulate N consecutive failures; assert retry button is disabled after exactly 3 and no further fetch is made
    - Tag: `// Feature: onebasics-app, Property 11: Retry cap disables action`
    - _Requirements: 2.7_

- [ ] 7. Shared form components
  - [-] 7.1 Create `FileUploadInput` component at `src/components/form/FileUploadInput.tsx`
    - Accept `bucket`, `accept`, `maxSizeMb`, `label`, `onUploadComplete`, `onError` props
    - Validate MIME type against `accept` list on file selection; show adjacent error and block upload if invalid
    - Validate file size ≤ `maxSizeMb * 1024 * 1024`; show adjacent error and block upload if exceeded
    - Show image thumbnail preview or filename for PDFs after validation passes
    - Call `supabase.storage.from(bucket).upload(...)` then `getPublicUrl` and invoke `onUploadComplete`
    - _Requirements: 7.4, 7.5, 7.6, 10.6, 13.1–13.5_
  - [ ]* 7.2 Write property test for file type rejection
    - **Property 5: File type rejection**
    - **Validates: Requirements 13.1, 13.2**
    - Use `fc.constantFrom(...)` over non-allowed MIME types; assert `supabase.storage.upload` is never called and error state is set
    - Tag: `// Feature: onebasics-app, Property 5: File type rejection`
    - _Requirements: 13.1, 13.2_
  - [ ]* 7.3 Write property test for file size rejection
    - **Property 6: File size rejection**
    - **Validates: Requirements 13.4**
    - Use `fc.integer({ min: 5 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 })` for file sizes; assert upload is blocked
    - Tag: `// Feature: onebasics-app, Property 6: File size rejection`
    - _Requirements: 13.4_
  - [-] 7.4 Create `CrossReferenceSearch` component at `src/components/form/CrossReferenceSearch.tsx`
    - Accept `onSelect`, `onRemove`, `selectedLinks`, `maxLinks` (default 20) props
    - Debounce keystrokes by 300 ms; trigger Supabase query when input length ≥ 2
    - Render dropdown with `full_name` and identifier; show "No matching records found" on empty results
    - Show spinner while query is in flight; show error message on failure or timeout >3000 ms
    - Render selected persons as removable tag chips; cap selection at `maxLinks`; ignore selections beyond cap
    - _Requirements: 5.1–5.7_
  - [ ]* 7.5 Write property test for cross-reference search containment
    - **Property 8: Cross-reference search results containment**
    - **Validates: Requirements 5.1, 5.2**
    - Provide arbitrary query string + array of person records; assert every displayed result contains the query (case-insensitive)
    - Tag: `// Feature: onebasics-app, Property 8: Cross-reference search results containment`
    - _Requirements: 5.1, 5.2_
  - [ ]* 7.6 Write property test for cross-reference selection cap
    - **Property 9: Cross-reference selection cap**
    - **Validates: Requirements 5.4**
    - Use `fc.array(fc.uuid(), { minLength: 21, maxLength: 50 })` to attempt >20 selections; assert total selected never exceeds 20
    - Tag: `// Feature: onebasics-app, Property 9: Cross-reference selection cap`
    - _Requirements: 5.4_
  - [ ] 7.7 Create `ProgramSelector` component at `src/components/form/ProgramSelector.tsx`
    - Render checkboxes for Staff, Hedzole, Volunteer, and CDL Student
    - Call `onChange` with updated `programs` object on each toggle
    - _Requirements: 6.1–6.7_
  - [~] 7.8 Create `StepIndicator` component at `src/components/form/StepIndicator.tsx`
    - Accept `steps`, `currentStepIndex` props; render a visual progress indicator
    - _Requirements: 4, 6_

- [ ] 8. Form step components
  - [~] 8.1 Create `Step1Person` at `src/components/form/steps/Step1Person.tsx`
    - Render all 10 person fields using `react-hook-form` `register` and `Controller`
    - Mark Given Name, Family Name, Gender, Date of Birth, Phone, Processed By as required
    - Inline validation errors adjacent to each field on failed submit attempt
    - Email: validate `local-part@domain` pattern
    - Date of Birth: validate not in the future and age ≤ 150 years
    - On validated proceed, call `supabase.from('people').insert(...).select('id').single()` and store `person_id`
    - Show inline error and retain field values on Supabase insert failure; allow retry
    - _Requirements: 4.1–4.9_
  - [ ]* 8.2 Write property test for required field rejection
    - **Property 1: Required field rejection**
    - **Validates: Requirements 4.2, 4.3**
    - Use `fc.record` with arbitrary whitespace/empty strings for each required field combination; assert form stays on Step 1 with errors displayed and no Supabase insert called
    - Tag: `// Feature: onebasics-app, Property 1: Required field rejection`
    - _Requirements: 4.2, 4.3_
  - [ ]* 8.3 Write property test for email format validation
    - **Property 2: Email format validation**
    - **Validates: Requirements 4.7**
    - Use `fc.string()` for arbitrary email inputs; assert only strings matching `local-part@domain` pattern pass validation
    - Tag: `// Feature: onebasics-app, Property 2: Email format validation`
    - _Requirements: 4.7_
  - [ ]* 8.4 Write property test for Date of Birth validity
    - **Property 3: Date of Birth validity**
    - **Validates: Requirements 4.8**
    - Use `fc.date()` for arbitrary dates; assert future dates and dates implying age >150 years are rejected; valid dates in `[today - 150y, today]` are accepted
    - Tag: `// Feature: onebasics-app, Property 3: Date of Birth validity`
    - _Requirements: 4.8_
  - [~] 8.5 Create `Step2Staff` at `src/components/form/steps/Step2Staff.tsx`
    - Render SSNIT Number, National ID Number, Bank Account Number, Marital Status, Employment Status (required), Start Date (required), End Date, Emergency Contact (name + phone + relationship) fields
    - Render three yes/no screening question radio inputs (all required before proceeding)
    - Embed `<FileUploadInput>` for Passport Photo (`passport-photos` bucket, JPEG/PNG/WebP, 5 MB) and National ID Photo (`national-ids` bucket, JPEG/PNG/WebP, 5 MB)
    - On validated proceed, call `supabase.from('staff_profiles').insert(...)` with `person_id`
    - Show inline error and retain field values on insert failure; allow retry
    - _Requirements: 7.1–7.8_
  - [~] 8.6 Create `Step3Hedzole` at `src/components/form/steps/Step3Hedzole.tsx`
    - Render all Hedzole fields; mark School Attendance, Marital Status, Number of Children as required
    - Conditionally hide and clear School Name and Class Level Completed when `attended_school` is false; show them when true
    - On validated proceed, call `supabase.from('hedzole_profiles').insert(...)` with `person_id`
    - Show inline error and retain field values on insert failure; allow retry
    - _Requirements: 8.1–8.5_
  - [ ]* 8.7 Write property test for Hedzole school field conditional visibility
    - **Property 13: Hedzole school field conditional visibility**
    - **Validates: Requirements 8.2**
    - Use `fc.boolean()` for `attended_school` and arbitrary school field values; assert fields are absent from DOM and cleared when false, present and empty when switched to true
    - Tag: `// Feature: onebasics-app, Property 13: Hedzole school field conditional visibility`
    - _Requirements: 8.2_
  - [~] 8.8 Create `Step4Volunteer` at `src/components/form/steps/Step4Volunteer.tsx`
    - Render all volunteer fields with character limits (Occupation ≤ 100, Motivation ≤ 500, Relevant Skills ≤ 500, Certifications ≤ 500)
    - Mark Occupation and at least one Availability Day as required
    - Validate Start Date is a valid calendar date; End Date is a valid calendar date on or after Start Date
    - On validated proceed, call `supabase.from('volunteer_profiles').insert(...)` with `person_id`
    - Show inline error and retain field values on insert failure; allow retry
    - _Requirements: 9.1–9.4_
  - [ ]* 8.9 Write property test for volunteer date ordering
    - **Property 7: Volunteer date ordering**
    - **Validates: Requirements 9.3**
    - Use `fc.tuple(fc.date(), fc.date())`; assert any combination where End Date < Start Date is rejected with a validation error
    - Tag: `// Feature: onebasics-app, Property 7: Volunteer date ordering`
    - _Requirements: 9.3_
  - [~] 8.10 Create `Step5Cdl` at `src/components/form/steps/Step5Cdl.tsx`
    - Render Cohort dropdown (populated from `useLookups`), Current Class, Status, How Heard About the Program, Computer Skills (None/Basic/Intermediate/Advanced), Highest Education, Currently Employed fields
    - Show loading indicator while cohort/certificate lookups are in flight; disable fields and show error on lookup failure per Requirements 10.3, 10.5, 14.3, 14.4
    - Render multi-select Certificates Earned (populated from `useLookups`)
    - For each selected certificate render a `<FileUploadInput>` (PDF/JPEG/PNG, 5 MB, `certificates` bucket) and a Date Earned field (required, ≤ today)
    - Reveal `how_heard_other` free-text input (max 250 chars) when How Heard value is "Other"
    - On validated proceed, call `supabase.from('cdl_students').insert(...).select('id').single()` then insert one row per certificate into `student_certificates`
    - Show inline error identifying which record failed; retain all field values; allow retry
    - _Requirements: 10.1–10.11_
  - [ ]* 8.11 Write property test for CDL certificate per-certificate row
    - **Property 12: CDL certificate file upload per certificate**
    - **Validates: Requirements 10.6, 10.10**
    - Use `fc.array(fc.uuid(), { minLength: 1, maxLength: 16 })` for certificate selections; assert exactly one upload input per selected certificate and exactly one `student_certificates` insert row per certificate
    - Tag: `// Feature: onebasics-app, Property 12: CDL certificate file upload per certificate`
    - _Requirements: 10.6, 10.10_

- [ ] 9. Form wizard orchestrator
  - [~] 9.1 Create `FormWizard` at `src/components/form/FormWizard.tsx`
    - Hold a single `useForm<MasterFormSchema>` instance; manage `WizardState` (`currentStepIndex`, `stepSequence`, `personId`, `isSubmitting`, `submitError`) in `useState`
    - Implement `buildStepSequence(programs)` to derive ordered step array from program checkbox state
    - On program uncheck call `form.resetField` for all fields belonging to that step
    - Advance step only after `form.trigger(stepFields)` returns true
    - Implement the sequential `submitForm` function from the design; catch `SubmitStepError` to display step-attributed error message
    - Disable submit button and show spinner while `isSubmitting` is true; ignore additional submit clicks
    - On successful full submission, display success confirmation and reset the entire form to initial state
    - _Requirements: 4.4, 4.5, 4.9, 6.7, 11.1–11.4_
  - [ ]* 9.2 Write property test for program step inclusion/exclusion
    - **Property 4: Program step inclusion/exclusion round-trip**
    - **Validates: Requirements 6.1–6.7**
    - Use `fc.record({ staff: fc.boolean(), hedzole: fc.boolean(), volunteer: fc.boolean(), cdl: fc.boolean() })`; assert visible steps = `{person} ∪ {checked programs}`; unchecking clears data; re-checking restores empty step
    - Tag: `// Feature: onebasics-app, Property 4: Program step inclusion/exclusion round-trip`
    - _Requirements: 6.1–6.7_
  - [~] 9.3 Create `Form` page at `src/pages/Form.tsx`
    - Render `CrossReferenceSearch`, `ProgramSelector`, `StepIndicator`, and `FormWizard` composed together
    - _Requirements: 4, 5, 6_

- [~] 10. Checkpoint — verify form wizard end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. People list page
  - [~] 11.1 Create `RoleBadge` component at `src/components/people/RoleBadge.tsx`
    - Accept a `role` string prop; render a styled badge chip for CDL, Staff, Volunteer, or Hedzole
    - Render nothing when no sub-profile exists for a Person
    - _Requirements: 12.2, 12.3_
  - [~] 11.2 Create `SearchBar` component at `src/components/people/SearchBar.tsx`
    - Accept `value`, `onChange` props; debounce `onChange` by 300 ms
    - _Requirements: 12.4, 12.5_
  - [~] 11.3 Create `PeopleTable` component at `src/components/people/PeopleTable.tsx`
    - Accept `people`, `isLoading`, `error`, `onRetry` props
    - Render table columns: Full Name, Gender, Phone, Email, Role Badges
    - Show loading skeleton rows while `isLoading` is true
    - Show human-readable error message and retry button on `error`
    - Apply client-side filter via `useMemo`: match `full_name` or `phone` against debounced query (case-insensitive) within 300 ms; reset to page 1 on new query
    - Render pagination controls; each page boundary fetches next `.range(from, to)` from Supabase via `usePeople`
    - _Requirements: 12.1–12.8_
  - [ ]* 11.4 Write property test for People list search filter correctness
    - **Property 14: People list search filter correctness**
    - **Validates: Requirements 12.4, 12.5**
    - Use `fc.string()` for query and `fc.array` of person records; assert every displayed record matches by `full_name` or `phone`, and no non-matching record appears
    - Tag: `// Feature: onebasics-app, Property 14: People list search filter correctness`
    - _Requirements: 12.4, 12.5_
  - [~] 11.5 Create `People` page at `src/pages/People.tsx`
    - Compose `SearchBar` and `PeopleTable` fed by `usePeople`
    - _Requirements: 12.1–12.8_

- [~] 12. Checkpoint — verify full application
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Final wiring and integration validation
  - [~] 13.1 Verify route configuration in `src/main.tsx`
    - Confirm all three routes render within `AppShell` without layout breaks at 768 px and 1024 px viewports
    - _Requirements: 1.1, 1.4_
  - [ ]* 13.2 Write integration test: end-to-end form submission
    - Mock the Supabase client; simulate a full form submission with Person + Staff + CDL profiles + 2 certificates
    - Assert insert calls are made in order: `people` → `staff_profiles` → `cdl_students` → `student_certificates` (×2)
    - Assert success message displayed and form resets to initial state
    - _Requirements: 11.1–11.4_
  - [ ]* 13.3 Write integration test: Dashboard KPI view shape
    - Mock the Supabase client returning a `dashboard_kpis` row with all 8 columns; assert all 8 `KpiCard` components display correct values
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ]* 13.4 Write integration test: People List pagination
    - Simulate 60 person records across two pages; assert page 1 renders 50 records, page 2 renders 10 records, pagination controls are visible
    - _Requirements: 12.1, 12.8_

- [~] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use fast-check with `numRuns: 100` minimum and the traceability tag format `// Feature: onebasics-app, Property {N}: {property_text}`
- Each task references specific requirements for full traceability back to the requirements document
- Supabase client is mocked in all unit and property tests; integration tests use a locally-running Supabase instance (`supabase start`)
- File uploads use `supabase.storage.from(bucket).upload(path, file)` followed by `getPublicUrl`; all tests that exercise upload paths must mock both calls
- The form wizard uses a single `useForm<MasterFormSchema>` instance; per-step validation uses `form.trigger(stepFields)` to avoid premature full-form validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "3.2", "3.3", "5.1", "5.3", "5.4", "5.5"] },
    { "id": 2, "tasks": ["5.2", "5.3", "6.1", "6.3", "7.1", "7.4", "7.7", "7.8", "11.1", "11.2"] },
    { "id": 3, "tasks": ["5.4", "6.2", "6.4", "6.5", "7.2", "7.3", "7.5", "7.6", "8.1", "8.5", "8.6", "8.8", "8.10", "11.3"] },
    { "id": 4, "tasks": ["8.2", "8.3", "8.4", "8.7", "8.9", "8.11", "9.1", "11.4", "11.5"] },
    { "id": 5, "tasks": ["9.2", "9.3"] },
    { "id": 6, "tasks": ["13.1"] },
    { "id": 7, "tasks": ["13.2", "13.3", "13.4"] }
  ]
}
```
