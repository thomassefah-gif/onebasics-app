# Requirements Document

## Introduction

The BASICS International People Data Collection & Analytics System is a web application built for BASICS International to collect, manage, and analyze data on individuals who participate in one or more of the organization's programs: CDL Students, Staff, Hedzole Members, and Volunteers. The system provides a multi-step data collection form for intake officers, a searchable directory of all registered people, and an analytics dashboard surfacing key program metrics. The application is built with React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React, react-hook-form, and Supabase as the backend.

---

## Glossary

- **App**: The BASICS International People Data Collection & Analytics System web application.
- **Dashboard**: The analytics page displaying KPI cards and data visualization charts.
- **Form**: The multi-step intake form used to register a person and associate them with one or more programs.
- **People List**: The searchable, filterable table of all registered individuals.
- **Person**: A record in the `public.people` master table representing a real individual.
- **Staff_Profile**: A sub-profile record in `staff_profiles` linked to a Person by `person_id`.
- **Hedzole_Profile**: A sub-profile record in `hedzole_profiles` linked to a Person by `person_id`.
- **Volunteer_Profile**: A sub-profile record in `volunteer_profiles` linked to a Person by `person_id`.
- **CDL_Student**: A sub-profile record in `cdl_students` linked to a Person by `person_id`.
- **Supabase**: The backend-as-a-service platform providing the PostgreSQL database, storage buckets, and authentication.
- **Supabase_Client**: The initialized Supabase JS client located at `src/lib/supabase.ts`.
- **Storage_Bucket**: A Supabase storage container. Buckets used: `passport-photos`, `national-ids`, `certificates`, `documents`.
- **KPI_Card**: A dashboard UI component displaying a single aggregated metric sourced from the `dashboard_kpis` view.
- **Sidebar**: The persistent left-side navigation component present on all pages.
- **Intake_Officer**: A staff user who operates the Form to register individuals.
- **Cross_Reference**: The live auto-suggest search bar on the Form used to identify existing Person records.
- **Cohort**: A named group in the `cohorts` lookup table to which CDL Students are assigned.
- **Certificate**: A credential item in the `certificates` lookup table that can be earned by CDL Students.
- **Role_Badge**: A UI badge on the People List indicating which programs a Person is active in (CDL, Staff, Volunteer, Hedzole).
- **Dashboard_KPIs_View**: The `public.dashboard_kpis` database view returning aggregated top-level statistics.

---

## Requirements

### Requirement 1: Application Shell and Navigation

**User Story:** As an Intake Officer, I want a persistent navigation sidebar so that I can move between the Dashboard, Form, and People List pages without losing context.

#### Acceptance Criteria

1. THE App SHALL render a Sidebar on every page containing navigation links to the Dashboard page, the Form page, and the People List page.
2. THE Sidebar SHALL display the BASICS International brand name and apply the primary brand color `#5B21B6` as its accent.
3. WHEN a user navigates to a page, THE Sidebar SHALL visually distinguish the active navigation link from inactive links by applying a distinct background or text style.
4. THE App SHALL be responsive and render all Sidebar navigation links and page content without horizontal scrolling or content overflow on desktop viewports (minimum 1024px wide) and tablet viewports (minimum 768px wide).
5. IF the Supabase_Client credentials are missing or invalid in the environment configuration, THEN THE App SHALL halt initialization and display an error message indicating the configuration failure before any data operation is performed.
6. WHEN the App initializes, THE App SHALL complete Supabase_Client initialization within 5 seconds before any data operation is performed.

---

### Requirement 2: Dashboard — KPI Cards

**User Story:** As an Intake Officer, I want to see key program metrics at a glance so that I can quickly understand the current state of enrollment and participation.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Dashboard SHALL fetch aggregated metrics from the `dashboard_kpis` view via the Supabase_Client within 5 seconds.
2. THE Dashboard SHALL render a KPI_Card for each of the following metrics: Total People, Total CDL Students, Total Staff, Total Volunteers, Total Hedzole Members, Total Certificates Earned, Networking Basics Count, and Modern AI Count.
3. WHILE the Dashboard is fetching data from the Supabase_Client, THE Dashboard SHALL display a loading indicator in place of each KPI_Card.
4. IF the Supabase_Client returns an error when fetching the `dashboard_kpis` view, THEN THE Dashboard SHALL display an error message indicating the failure and a retry action that re-triggers the fetch.
5. WHEN data is successfully loaded, THE Dashboard SHALL display each KPI_Card with its metric label and the corresponding non-negative integer value.
6. IF the `dashboard_kpis` view returns a null or missing value for any metric, THEN THE Dashboard SHALL display zero (0) for that KPI_Card's numeric value.
7. IF the retry action is triggered more than 3 consecutive times without a successful response, THEN THE Dashboard SHALL disable the retry action and display a message indicating that the data cannot be retrieved at this time.

---

### Requirement 3: Dashboard — Analytics Charts

**User Story:** As an Intake Officer, I want visual charts of program data so that I can identify trends across cohorts, certificate distribution, skills, and staff composition.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL render a Bar Chart showing the count of CDL Students grouped by Cohort, with each bar labeled by cohort name and its corresponding student count.
2. WHEN the Dashboard loads, THE Dashboard SHALL render a Pie Chart showing the distribution of earned certificates, with each slice labeled by certificate name and its percentage of the total.
3. WHEN the Dashboard loads, THE Dashboard SHALL render a Bar Chart showing the count of CDL Students grouped by computer skill level, with each bar labeled by skill level and its corresponding student count.
4. WHEN the Dashboard loads, THE Dashboard SHALL render a Pie Chart showing the count of CDL Students grouped by how they heard about the program, with each slice labeled by referral source and its percentage of the total.
5. WHEN the Dashboard loads, THE Dashboard SHALL render a Bar Chart showing the count of Staff Profiles grouped by employment status (Contract, Permanent, Ambassador), with each bar labeled by status and its corresponding staff count.
6. WHEN the Dashboard loads, THE Dashboard SHALL render a Bar Chart showing the count of Volunteer Profiles grouped by area of interest, with each bar labeled by interest area and its corresponding volunteer count.
7. THE Dashboard SHALL render all charts using the Recharts library and apply the primary brand color `#5B21B6` as the base chart fill, with a tooltip visible on hover displaying the exact count or percentage for that segment.
8. WHILE chart data is loading, THE Dashboard SHALL display a loading placeholder (skeleton or spinner) in place of each chart until the data fetch completes or fails.
9. IF a chart data query returns zero records, THEN THE Dashboard SHALL display a "No data available" message centered within that chart's container and render no chart axes or segments.
10. IF a chart data query fails due to a network or server error, THEN THE Dashboard SHALL display an error message within that chart's container indicating the data could not be loaded, and the remaining charts SHALL continue rendering independently.

---

### Requirement 4: Data Collection Form — Step 1 (Mandatory Person Data)

**User Story:** As an Intake Officer, I want to capture core identifying information for every individual so that a complete Person record is created in the system.

#### Acceptance Criteria

1. THE Form SHALL present Step 1 as the first and always-visible step, collecting: Given Name, Family Name, Other Names, Gender, Date of Birth, Place of Birth, Email, Phone, Address, and Processed By.
2. THE Form SHALL mark Given Name, Family Name, Gender, Date of Birth, Phone, and Processed By as required fields, and treat all remaining fields as optional.
3. WHEN an Intake Officer submits Step 1 without completing a required field, THE Form SHALL display a validation error message adjacent to each missing required field and keep the form on Step 1 without proceeding.
4. THE Form SHALL use react-hook-form to manage all form state and validation.
5. WHEN Step 1 data passes validation and the Intake Officer proceeds, THE Form SHALL insert a new record into the `public.people` table via the Supabase_Client and store the returned `person_id` in the form session state.
6. IF the Supabase_Client returns an error during the `public.people` insert, THEN THE Form SHALL display a user-facing error message indicating the save failed, retain all previously entered Step 1 field values, and allow the Intake Officer to retry the submission.
7. WHEN the Intake Officer enters a value in the Email field, THE Form SHALL validate that the value conforms to the format `local-part@domain` and display a validation error adjacent to the Email field if it does not.
8. WHEN the Intake Officer enters a value in the Date of Birth field, THE Form SHALL validate that the date is not in the future and that the resulting age does not exceed 150 years, and display a validation error adjacent to the Date of Birth field if either condition is violated.
9. IF Step 1 is submitted and the `public.people` insert succeeds, THEN THE Form SHALL transition to Step 2 and the stored `person_id` SHALL be available for all subsequent steps within the same form session.

---

### Requirement 5: Data Collection Form — Cross-Reference Search

**User Story:** As an Intake Officer, I want to search for existing Person records so that I can link related individuals and avoid duplicate entries.

#### Acceptance Criteria

1. THE Form SHALL render a Cross_Reference search bar component on the Form page that queries the `public.people` table by `full_name`.
2. WHEN an Intake Officer types at least 2 characters into the Cross_Reference search bar, THE Form SHALL query the Supabase_Client and display a dropdown of matching Person records within 500ms of the last keystroke, showing each match's full name and a unique identifier (e.g., phone number or ID).
3. WHEN an Intake Officer selects a Person from the Cross_Reference dropdown, THE Form SHALL record the selected `person_id` as a relationship link and display the selected person as a visible, removable tag beneath the search bar.
4. THE Cross_Reference component SHALL allow the Intake Officer to select up to 20 existing Person records as relationship links.
5. IF the Cross_Reference query returns no results, THEN THE Form SHALL display a "No matching records found" message in the dropdown.
6. IF the Supabase_Client returns an error or does not respond within 3000ms during a Cross_Reference query, THEN THE Form SHALL display an error message in the dropdown and preserve any previously selected relationship links.
7. WHEN an Intake Officer removes a selected person tag, THE Form SHALL remove the corresponding `person_id` from the relationship links.

---

### Requirement 6: Data Collection Form — Program Selection

**User Story:** As an Intake Officer, I want to select which programs apply to the individual so that only relevant data collection steps are shown.

#### Acceptance Criteria

1. THE Form SHALL render a program selection component containing checkboxes for: Staff, Hedzole, Volunteer, and CDL Student.
2. WHEN an Intake Officer checks the Staff checkbox, THE Form SHALL include the Staff data step in the form sequence.
3. WHEN an Intake Officer checks the Hedzole checkbox, THE Form SHALL include the Hedzole data step in the form sequence.
4. WHEN an Intake Officer checks the Volunteer checkbox, THE Form SHALL include the Volunteer data step in the form sequence.
5. WHEN an Intake Officer checks the CDL Student checkbox, THE Form SHALL include the CDL Student data step in the form sequence.
6. WHEN no program checkboxes are selected, THE Form SHALL allow submission of Step 1 data alone to create a Person record without any sub-profile.
7. WHEN an Intake Officer unchecks a program checkbox, THE Form SHALL remove that program's step from the form sequence and discard any data entered in that step.

---

### Requirement 7: Data Collection Form — Step 2 (Staff Data)

**User Story:** As an Intake Officer, I want to collect staff-specific information so that a complete Staff_Profile is created and linked to the Person record.

#### Acceptance Criteria

1. WHEN the Staff checkbox is selected, THE Form SHALL present Step 2 collecting: SSNIT Number, National ID Number, Bank Account Number, Marital Status, Employment Status, Start Date, End Date, and Emergency Contact (name, phone number, and relationship).
2. THE Form SHALL mark Employment Status and Start Date as required fields in Step 2.
3. THE Form SHALL present three yes/no screening questions as radio inputs within Step 2, where each question requires a selection before proceeding.
4. THE Form SHALL present file upload inputs for Passport Photo (targeting the `passport-photos` bucket) accepting JPEG and PNG files up to 5MB, and National ID Photo (targeting the `national-ids` bucket) accepting JPEG and PNG files up to 5MB.
5. WHEN an Intake Officer uploads a file, THE Form SHALL upload the file to the corresponding Storage_Bucket via the Supabase_Client and store the returned public URL in the form state.
6. IF a file upload to a Storage_Bucket fails, THEN THE Form SHALL display an upload error message adjacent to the relevant file input, retain all other Step 2 field values, and allow the Intake Officer to retry that upload.
7. WHEN Step 2 data passes validation, THE Form SHALL insert a record into `staff_profiles` with the corresponding `person_id` and all collected staff fields, including uploaded file URLs.
8. IF the Supabase_Client returns an error during the `staff_profiles` insert, THEN THE Form SHALL display a user-facing error message indicating the save failed, retain all previously entered Step 2 field values, and allow the Intake Officer to retry the insert.

---

### Requirement 8: Data Collection Form — Step 3 (Hedzole Data)

**User Story:** As an Intake Officer, I want to collect Hedzole-specific information so that a complete Hedzole_Profile is created and linked to the Person record.

#### Acceptance Criteria

1. WHEN the Hedzole checkbox is selected, THE Form SHALL present Step 3 collecting: School Attendance (boolean), School Name, Class Level Completed, Exam Type, Marital Status, Number of Children (non-negative integer), Children Age Range, Program Expectations, Bank Account Number, Bank Name, and Expected Monthly Earning (positive numeric value).
2. WHEN the School Attendance field is set to false, THE Form SHALL hide the School Name and Class Level Completed fields and clear any values entered in those fields.
3. THE Form SHALL mark School Attendance, Marital Status, and Number of Children as required fields in Step 3.
4. WHEN Step 3 data passes validation, THE Form SHALL insert a record into `hedzole_profiles` with the corresponding `person_id` and all collected Hedzole fields.
5. IF the Supabase_Client returns an error during the `hedzole_profiles` insert, THEN THE Form SHALL display a user-facing error message indicating the save failed, retain all previously entered Step 3 field values, and allow the Intake Officer to retry without re-entering data.

---

### Requirement 9: Data Collection Form — Step 4 (Volunteer Data)

**User Story:** As an Intake Officer, I want to collect volunteer-specific information so that a complete Volunteer_Profile is created and linked to the Person record.

#### Acceptance Criteria

1. WHEN the Volunteer checkbox is selected, THE Form SHALL present Step 4 collecting: Occupation (max 100 characters), Motivation (max 500 characters), Area of Interest, Relevant Skills (max 500 characters), Availability Days (one or more days of the week), Availability Times (start time and end time per selected day), Preferred Duration, Start Date, End Date, Education Level, Certifications (max 500 characters), and Languages Spoken.
2. THE Form SHALL mark Occupation and at least one Availability Day as required fields in Step 4.
3. WHEN Step 4 data passes validation, THE Form SHALL insert a record into `volunteer_profiles` with the corresponding `person_id` and all collected volunteer fields, where validation requires: Occupation is non-empty, Start Date is a valid calendar date, End Date is a valid calendar date on or after Start Date, and at least one Availability Day is selected.
4. IF the Supabase_Client returns an error during the `volunteer_profiles` insert, THEN THE Form SHALL display an error message indicating the save failed, retain all previously entered Step 4 field values, and allow the Intake Officer to retry the insert without re-entering data.

---

### Requirement 10: Data Collection Form — Step 5 (CDL Student Data)

**User Story:** As an Intake Officer, I want to collect CDL Student-specific information so that a complete CDL_Student record is created and linked to the Person record.

#### Acceptance Criteria

1. WHEN the CDL Student checkbox is selected, THE Form SHALL present Step 5 collecting: Cohort (dropdown), Current Class, Status, How Heard About the Program, Computer Skills (one of: None, Basic, Intermediate, Advanced), Highest Education, and Currently Employed status.
2. THE Form SHALL populate the Cohort dropdown by fetching records from the `cohorts` lookup table via the Supabase_Client when Step 5 is first rendered.
3. IF the Supabase_Client returns an error when fetching the `cohorts` lookup table, THEN THE Form SHALL display an error message indicating the Cohort options could not be loaded and render the Cohort field in a disabled state until a successful retry is performed.
4. THE Form SHALL render a multi-select input for Certificates Earned, populated from the `certificates` lookup table via the Supabase_Client.
5. IF the Supabase_Client returns an error when fetching the `certificates` lookup table, THEN THE Form SHALL display an error message indicating the Certificate options could not be loaded and render the Certificates Earned field in a disabled state until a successful retry is performed.
6. THE Form SHALL render a file upload input for each selected certificate, accepting files of type PDF, JPG, or PNG with a maximum size of 5 MB per file, uploading each file to the `certificates` Storage_Bucket via the Supabase_Client and storing the returned public URL.
7. IF the Supabase_Client returns an error during a certificate file upload, THEN THE Form SHALL display an error message indicating which certificate file failed to upload and allow the Intake Officer to retry that upload without re-entering other form data.
8. WHEN the How Heard About the Program field value is "Other", THE Form SHALL reveal a free-text input field for additional details mapped to `how_heard_other`, where this field is optional and accepts a maximum of 250 characters.
9. WHEN Step 5 data passes validation, THE Form SHALL insert a record into `cdl_students` with the corresponding `person_id` and all collected CDL fields, where validation requires: Cohort is selected, Current Class is non-empty, Status is selected, Computer Skills is one of the four defined levels, and Highest Education is selected.
10. WHEN a CDL Student record is successfully created, THE Form SHALL insert one record per selected Certificate into `student_certificates`, including the `student_id`, `certificate_id`, uploaded file URL, and the date earned as entered by the Intake Officer (required field, must be a valid calendar date on or before the submission date).
11. IF the Supabase_Client returns an error during any `cdl_students` or `student_certificates` insert, THEN THE Form SHALL display an error message indicating which record failed to save, retain all previously entered Step 5 field values, and allow the Intake Officer to retry without re-entering data.

---

### Requirement 11: Data Collection Form — Atomic Submission

**User Story:** As an Intake Officer, I want the form submission to complete fully or not at all so that no incomplete or orphaned records are created in the database.

#### Acceptance Criteria

1. WHEN an Intake Officer initiates final form submission, THE Form SHALL execute all Supabase_Client insert operations in the sequence: `public.people` first, then all selected sub-profile tables (`staff_profiles`, `hedzole_profiles`, `volunteer_profiles`, `cdl_students`), then `student_certificates`.
2. IF any insert operation fails during the submission sequence, THEN THE Form SHALL display an error message identifying which step failed, retain all entered form field values, and allow the Intake Officer to retry the submission.
3. WHEN all insert operations complete successfully, THE Form SHALL display a success confirmation message and reset all form fields, checkboxes, and step visibility to the initial empty state.
4. WHILE form submission is in progress, THE Form SHALL disable the submit button, ignore any additional submit interactions, and display a loading indicator until the submission sequence completes or fails.

---

### Requirement 12: People List Page

**User Story:** As an Intake Officer, I want to browse and search all registered individuals so that I can quickly find and review any Person record.

#### Acceptance Criteria

1. WHEN the People List page loads, THE People_List SHALL fetch the first 50 records from the `public.people` table via the Supabase_Client, ordered by full name ascending.
2. THE People_List SHALL display records in a tabular layout with columns for Full Name, Gender, Phone, Email, and Role Badges.
3. THE People_List SHALL render a Role_Badge for each program sub-profile linked to a Person (CDL, Staff, Volunteer, Hedzole). IF a Person has no linked sub-profiles, THEN THE People_List SHALL display no Role_Badge for that Person.
4. THE People_List SHALL render a search bar that filters the displayed records by full name or phone number.
5. WHEN an Intake Officer enters text into the search bar, THE People_List SHALL filter displayed records within 300ms of the last keystroke without issuing a new network request for each keystroke, and SHALL reset to the first page of results.
6. WHILE the People List data is loading from the Supabase_Client, THE People_List SHALL display a loading skeleton or spinner in the table area.
7. IF the Supabase_Client returns an error when fetching people records, THEN THE People_List SHALL display a human-readable error message and a retry action.
8. WHEN the People List contains more than 50 records, THE People_List SHALL paginate results displaying 50 records per page with pagination controls to navigate between pages.

---

### Requirement 13: File Upload Handling

**User Story:** As an Intake Officer, I want file uploads to be validated before submission so that only appropriate files are stored in the system.

#### Acceptance Criteria

1. THE Form SHALL restrict file upload inputs for Passport Photo and National ID Photo to image file types JPEG, PNG, and WebP only.
2. IF an Intake Officer selects a file of a type not permitted for a given upload input, THEN THE Form SHALL display a validation error message adjacent to that input and prevent the file from being staged for upload.
3. THE Form SHALL restrict file upload inputs for certificates to PDF, JPEG, and PNG file types only.
4. IF an Intake Officer selects a file exceeding 5MB for any upload input, THEN THE Form SHALL display a validation error message adjacent to that input and prevent the file from being uploaded to the Storage_Bucket.
5. WHEN a file passes type and size validation, THE Form SHALL display a preview thumbnail for image files or the filename for PDF files as a confirmation to the Intake Officer before submission.

---

### Requirement 14: Data Integrity and Lookup Population

**User Story:** As an Intake Officer, I want dropdowns and multi-selects to always reflect current database values so that data entry is consistent and accurate.

#### Acceptance Criteria

1. WHEN the CDL Student step is rendered, THE Form SHALL fetch the current list of Cohorts from the `cohorts` lookup table via the Supabase_Client and display a loading indicator in the Cohort dropdown while the fetch is in progress.
2. WHEN the CDL Student step is rendered, THE Form SHALL fetch the current list of Certificates from the `certificates` lookup table via the Supabase_Client and display a loading indicator in the Certificates multi-select while the fetch is in progress.
3. IF a lookup table fetch returns an error, THEN THE Form SHALL display a warning message adjacent to the dependent input and render that input in a disabled state to prevent invalid data entry.
4. IF a lookup table fetch returns an empty result set, THEN THE Form SHALL display a message within the dependent input indicating no options are available and render that input in a disabled state.
5. THE Form SHALL not hardcode Cohort or Certificate values; all values SHALL be sourced dynamically from the Supabase_Client.
