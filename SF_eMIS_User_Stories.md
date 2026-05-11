# Jamaica School Feeding eMIS Module — User Stories

**Derived from Business Requirements Document v1.0**

SDG Joint Programme on Digital Transformation for Education
World Food Programme / Ministry of Education, Youth and Information
March 2026

---

## 1. School Profile — School Feeding Data

### US-SP-01: Configure School Feeding profile

**As a** School Administrator, **I want** to select School Feeding Service Types (School Meals, Education, Garden, Other) for my school, **so that** the SF Unit knows which services my school participates in.

**Acceptance Criteria:**

- Multi-select enumeration field
- Updated annually
- Only School Administrators and above can edit

*BRD Traceability: SP-01*

---

### US-SP-02: Designate SF Coordinator(s)

**As a** School Administrator, **I want** to designate one or more School Feeding Coordinators from personnel records (name and title/role), **so that** the SF Unit knows who manages the programme at my school.

**Acceptance Criteria:**

- Selection from existing personnel records
- Supports multiple coordinators
- Updated annually
- Only School Administrators and above can edit

*BRD Traceability: SP-02*

---

### US-SP-03: Record School Nurse

**As a** School Administrator, **I want** to record the School Nurse name from personnel records, **so that** the health contact for the school is on file.

**Acceptance Criteria:**

- Optional field (if applicable)
- Selection from personnel records
- Updated annually
- Only School Administrators and above can edit

*BRD Traceability: SP-03*

---

### US-SP-04: Record NPL status

**As a** School Administrator, **I want** to indicate whether my school is an NPL (Nutrition Products Limited) school, **so that** the SF Unit can track NPL coverage.

**Acceptance Criteria:**

- Boolean yes/no
- Updated annually
- Only School Administrators and above can edit

*BRD Traceability: SP-04*

---

### US-SP-05: Configure meal types

**As a** School Administrator, **I want** to select which meal types my school offers (breakfast, snack, lunch), **so that** the SF Unit knows what meals are being provided.

**Acceptance Criteria:**

- Multi-select enumeration
- Updated termly
- Only School Administrators and above can edit

*BRD Traceability: SP-05*

---

### US-SP-06: Record school garden status

**As a** School Administrator, **I want** to indicate whether a school garden is established, **so that** the SF Unit can track garden programme participation.

**Acceptance Criteria:**

- Boolean yes/no
- Updated annually
- Only School Administrators and above can edit

*BRD Traceability: SP-06*

---

### US-SP-07: Record meal sources

**As a** School Administrator, **I want** to select meal sources (hypermarket, local market, farmer, service provider, school garden, other), **so that** the SF Unit can monitor food sourcing patterns.

**Acceptance Criteria:**

- Multi-select enumeration
- Updated termly
- Only School Administrators and above can edit

*BRD Traceability: SP-07*

---

## 2. Student Registry — PATH, Welfare, and Wards of the State

### US-SR-01: Assign SF programme type to student

**As a** SF School Coordinator, **I want** to assign a School Feeding Programme type (PATH, Wards of the State, Welfare, Other) to each student, **so that** every student's eligibility category is recorded.

**Acceptance Criteria:**

- Single-select enumeration per student
- Updated as needed when programme status changes
- Editable by SF Coordinator and above
- Programme type is required for all SF-enrolled students

*BRD Traceability: SR-01*

---

### US-SR-02: Capture PATH Household ID

**As a** SF School Coordinator, **I want** to record the PATH Household ID for PATH students under their family/guardian information, **so that** the student can be linked to the MLSS PATH programme.

**Acceptance Criteria:**

- Alphanumeric text field
- Stored under student family/guardian data
- Updated as needed when PATH household changes
- Editable by SF Coordinator and above
- PATH student IDs must be unique; duplicates flagged (VR-05)

*BRD Traceability: SR-02, VR-05*

---

### US-SR-03: Capture PATH benefit dates

**As a** SF School Coordinator, **I want** to record PATH benefit start and end dates per student, **so that** the system knows when a student is actively receiving PATH benefits.

**Acceptance Criteria:**

- Date range fields (yyyy-mm-dd)
- Updated as needed when benefit period changes
- Editable by SF Coordinator and above
- Start date must be before end date (VR-06)

*BRD Traceability: SR-03, VR-06*

---

### US-SR-04: Bulk import PATH beneficiary lists

**As a** MLSS Regional Social Worker, **I want** to upload PATH beneficiary lists via CSV/Excel, **so that** student programme attributions can be updated in batch.

**Acceptance Criteria:**

- CSV and Excel formats supported
- Updated termly or as needed when MLSS provides new lists
- Only MLSS Regional Social Workers and SF Unit Data Managers can import
- Validation checks on import (invalid IDs, mismatched school codes)
- Error reporting with details of rejected records
- All imports logged with timestamp, source, and user

*BRD Traceability: SR-04, Section 9.3*

---

### US-SR-05: Flag PATH list discrepancies

**As a** SF School Coordinator, **I want** the system to flag discrepancies between the imported PATH list and school enrollment, **so that** I can investigate and resolve mismatches.

**Acceptance Criteria:**

- Flag students on PATH list not enrolled at school
- Flag enrolled students not on PATH list
- Discrepancy list viewable after each import
- Auto-generated after each PATH list import
- Viewable by SF Coordinator, SF Unit Data Manager, and above

*BRD Traceability: SR-05*

---

### US-SR-06: View programme attribution history

**As a** SF Unit Data Manager, **I want** the system to maintain a historical log of changes to programme attribution with date and user, **so that** I can audit eligibility changes.

**Acceptance Criteria:**

- Log fields: change type, old value, new value, date, user
- Auto-generated on every programme attribution change
- Accessible to HQ-level users (read-only)

*BRD Traceability: SR-06*

---

### US-SR-07: Search and filter student registry

**As a** SF Unit Director, **I want** to filter and search the student registry by programme type, school, region, and parish, **so that** I can find specific student populations quickly.

**Acceptance Criteria:**

- Filter by programme type (single-select enumeration)
- Filter by school, region, parish (single-select enumeration each)
- Search by student name or ID (text search)
- Available to all SF roles; results scoped by user's access level

*BRD Traceability: SR-07*

---

### US-SR-08: Include Welfare and Wards in registry

**As a** SF School Coordinator, **I want** to register Welfare students and Wards of the State in the SF registry, **so that** they can be cross-referenced with MLSS for PATH eligibility verification.

**Acceptance Criteria:**

- Same registration workflow as PATH students
- Programme type clearly distinguished (single-select enumeration)
- Updated as needed when student status changes
- Editable by SF Coordinator and above

*BRD Traceability: SR-08*

---

## 3. Student Attendance and PATH Compliance

### US-AT-01: Enter daily student attendance

**As a** School Administrator / SF Coordinator, **I want** to enter daily student attendance (or draw from existing eMIS attendance data), **so that** attendance is captured without duplicate entry.

**Acceptance Criteria:**

- Boolean present/absent per student per day
- Class-by-class or whole-school entry
- Bulk mark support (mark all present)
- Updated daily during school term
- Editable by School Administrator, SF Coordinator, and above
- Responsive for up to 2,000 students (NF-03)
- Must work offline with auto-sync (NF-09)

*BRD Traceability: AT-01, NF-03, NF-09*

---

### US-AT-02: Calculate attendance rates

**As a** SF School Coordinator, **I want** the system to calculate student attendance rates monthly and bi-monthly, **so that** compliance can be monitored regularly.

**Acceptance Criteria:**

- Numeric percentage field (auto-calculated, read-only)
- Formula: (days attended / total school days) × 100 (VR-08)
- Auto-calculated monthly and bi-monthly from attendance records
- Viewable by SF Coordinator, MLSS users, and above

*BRD Traceability: AT-02, VR-08*

---

### US-AT-03: Auto-flag non-compliant PATH students

**As a** MLSS Director, **I want** the system to automatically identify PATH students below 85% attendance, **so that** benefit adjustments can be applied.

**Acceptance Criteria:**

- Auto-generated flag (boolean compliant/non-compliant per student)
- Calculated bi-monthly
- Viewable by SF Coordinator, MLSS users, and above
- PATH students aged 6–18 (BR-01)
- Vacation months Jul–Aug = auto-compliant (BR-02)
- Illness code 6 not penalized (BR-03)
- Chronic illness = special case with medical report (BR-04)
- Disability in special institutions = exempt (BR-05)
- Violence/disaster absences = compliant with written notice (BR-06)

*BRD Traceability: AT-03, BR-01 to BR-06*

---

### US-AT-04: Generate Attendance Verification Record

**As a** MLSS Associate Officer, **I want** the system to generate an Attendance Verification Record per school bi-monthly, **so that** MLSS receives compliance data without manual submission.

**Acceptance Criteria:**

- Auto-generated report (read-only)
- Generated bi-monthly
- Extractable as PDF/CSV
- Available to MLSS users and SF Unit staff

*BRD Traceability: AT-04*

---

### US-AT-05: View attendance compliance dashboard

**As a** Regional SF Officer, **I want** a dashboard of attendance compliance rates by school, region, and nationally, **so that** I can monitor compliance across my region.

**Acceptance Criteria:**

- Numeric percentages and visual indicators (charts/tables)
- Updated in real-time from attendance data
- Filterable by school, region, national
- Visual indicators for compliant vs non-compliant
- Results scoped by user's access level (school, regional, national)

*BRD Traceability: AT-05*

---

### US-AT-06: MLSS read access to attendance data

**As a** MLSS Director, **I want** read access to PATH student attendance and compliance status, **so that** I can view compliance without manual reports.

**Acceptance Criteria:**

- Read-only access for MLSS users
- No manual submission required
- Accessible in real-time from attendance and compliance data
- Scoped to PATH students only

*BRD Traceability: AT-06*

---

### US-AT-07: Flag schools with missing attendance

**As a** SF Unit Data Manager, **I want** the system to flag schools that have not submitted attendance data on time, **so that** I can follow up with non-reporting schools.

**Acceptance Criteria:**

- Auto-generated flag (boolean per school per day/week)
- Automatic flagging based on expected submission dates
- Alert visible on dashboard (DR-06)
- Viewable by SF Unit Data Manager, Regional SF Officer, and above

*BRD Traceability: AT-07, DR-06*

---

## 4. Meal Management — Lunch List and Meal Receipt

### US-ML-01: Create daily lunch list

**As a** SF School Coordinator, **I want** to create a daily lunch list marking which students will receive a meal (yes/no), **so that** the canteen knows how many meals to prepare.

**Acceptance Criteria:**

- Boolean yes/no per student (checkbox-based bulk entry)
- Auto-filter by programme type
- Updated daily during school term
- Editable by SF Coordinator and above
- Count cannot exceed students present (VR-03)
- Must work offline with auto-sync (NF-09)

*BRD Traceability: ML-01, VR-03, NF-09*

---

### US-ML-02: Record menu selection per student

**As a** SF School Coordinator, **I want** to record each student's menu selection where multiple options are offered, **so that** meal preferences are tracked.

**Acceptance Criteria:**

- Single-select from school menu options per student
- Updated daily (only where school offers multiple options)
- Editable by SF Coordinator and above
- Must work offline with auto-sync (NF-09)

*BRD Traceability: ML-02*

---

### US-ML-03: Capture non-PATH meal payment

**As a** SF School Coordinator, **I want** to record payment amount per day for non-PATH/Welfare/Wards students who pay, **so that** co-pay revenue is tracked.

**Acceptance Criteria:**

- Numeric currency field per student per day
- Updated daily during school term
- Editable by SF Coordinator and above
- Only applicable to non-programme students
- Amount must be positive

*BRD Traceability: ML-03*

---

### US-ML-04: View meal turnout statistics

**As a** SF Unit Director, **I want** to see daily, weekly, termly meal turnout (signed up vs. received, by programme type), **so that** I can assess programme reach.

**Acceptance Criteria:**

- Numeric counts and percentages (auto-calculated, read-only)
- Breakdown by PATH, Welfare, Wards, Other
- Daily, weekly, termly aggregation
- School, regional, national level
- Results scoped by user's access level

*BRD Traceability: ML-04*

---

### US-ML-05: Track meals per PATH student per week

**As a** SF School Coordinator, **I want** the system to calculate meals per PATH student per week, **so that** I can ensure students eat on all available days.

**Acceptance Criteria:**

- Numeric count per student per week (auto-calculated, read-only)
- Compared against available school days
- Updated weekly from meal receipt data
- Viewable by SF Coordinator and above

*BRD Traceability: ML-05*

---

### US-ML-06: Flag PATH students not receiving meals

**As a** SF Unit Data Manager, **I want** the system to flag PATH students consistently not signing up for or receiving meals, **so that** follow-up action can be taken.

**Acceptance Criteria:**

- Auto-generated flag (boolean per student)
- Configurable threshold (numeric, set by SF Unit)
- Updated weekly from meal receipt data
- Alert on dashboard (DR-06)
- Viewable by SF Coordinator, SF Unit Data Manager, and above

*BRD Traceability: ML-06, DR-06*

---

## 5. Canteen and Tuck Shop Registry and Validation

### US-CT-01: Enter school menu

**As a** Canteen Supervisor / SF Coordinator, **I want** to enter the school menu from a standardized enumeration list, **so that** menus are consistent and reportable.

**Acceptance Criteria:**

- Single-select from standardized enumeration list per menu item
- Updated termly
- Editable by Canteen Supervisor, SF Coordinator, and above

*BRD Traceability: CT-01*

---

### US-CT-02: Record menu week of use

**As a** Canteen Supervisor, **I want** to record which weeks each menu is used within a term, **so that** menu rotation can be tracked.

**Acceptance Criteria:**

- Week-of-year selection per menu item (multi-select enumeration)
- Updated termly
- Editable by Canteen Supervisor, SF Coordinator, and above

*BRD Traceability: CT-02*

---

### US-CT-03: Confirm meal receipt per student

**As a** Canteen Supervisor, **I want** to confirm whether each student on the lunch list actually received their meal (yes/no), **so that** there is canteen-level validation of meal distribution.

**Acceptance Criteria:**

- Boolean yes/no per student on lunch list
- Updated daily during school term
- Editable by Canteen Supervisor and above
- Cannot exceed meals on lunch list (VR-04)
- Distinct from lunch list sign-up
- Must work offline with auto-sync (NF-09)
- Fully functional on tablets with touch-friendly controls (NF-18)

*BRD Traceability: CT-03, VR-04, NF-09, NF-18*

---

### US-CT-04: Record estimated meal cost

**As a** Canteen Supervisor / SF Coordinator, **I want** to record the estimated cost per menu item, **so that** meal costing data is available for planning.

**Acceptance Criteria:**

- Numeric currency field per menu item
- Updated termly
- Editable by Canteen Supervisor, SF Coordinator, and above
- Amount must be positive

*BRD Traceability: CT-04*

---

### US-CT-05: Record canteen metadata

**As a** School Administrator, **I want** to record canteen/tuck shop metadata (type, capacity, conditions), **so that** the SF Unit has a profile of canteen facilities.

**Acceptance Criteria:**

- Fields TBD based on school visit form (enumeration/multi-select expected)
- Updated as needed
- Editable by School Administrator and above

*BRD Traceability: CT-05*

---

## 6. ME260 Financial Returns

### US-ME-01: Complete digital ME260 form

**As a** SF School Coordinator / School Bursar, **I want** to complete the ME260 Nutritional Subsidy Termly Report digitally, **so that** I no longer submit paper forms.

**Acceptance Criteria:**

- Multi-section form: School Info, Meals, Financial Summary, Expenditure, Documents, Signatures
- Mirrors all data points of paper form (Appendix B)
- Updated termly
- Editable by SF Coordinator, School Bursar, and above

*BRD Traceability: ME-01*

---

### US-ME-02: Pre-populated school metadata

**As a** SF School Coordinator, **I want** the ME260 form pre-populated with school metadata, **so that** I avoid re-entering known information.

**Acceptance Criteria:**

- Auto-populated fields from school profile and registry (read-only)
- Pre-populated at form creation time
- Reduces manual entry errors
- Viewable by SF Coordinator and above

*BRD Traceability: ME-02*

---

### US-ME-03: Enter meals provided and financial summary

**As a** SF School Coordinator, **I want** to enter days served per grade, children served, co-pay, contributions, balances, expenditure, **so that** the full financial picture is captured.

**Acceptance Criteria:**

- Numeric fields for all financial data
- Updated termly as part of ME260 submission
- Editable by SF Coordinator, School Bursar, and above
- Closing balance = brought forward + subsidy + contributions − expenditure (VR-01)
- Children served cannot exceed enrollment (VR-02)
- System auto-calculates and validates

*BRD Traceability: ME-03, VR-01, VR-02*

---

### US-ME-04: Enter Statement of Expenditure

**As a** SF School Coordinator / School Bursar, **I want** to enter line-item expenditures (date, source, receipt number, amount), **so that** all spending is accounted for.

**Acceptance Criteria:**

- Line-item fields: date, source (text), receipt number (text), amount (numeric currency)
- Add/remove line items dynamically
- Updated termly as part of ME260 submission
- Editable by SF Coordinator, School Bursar, and above
- Amounts must be positive (VR-07)
- Auto-calculated total

*BRD Traceability: ME-04, VR-07*

---

### US-ME-05: Upload receipts and invoices

**As a** SF School Coordinator, **I want** to upload receipts and invoices (PNG, JPG, PDF), **so that** supporting documentation is attached.

**Acceptance Criteria:**

- File upload: PNG, JPG, PDF supported
- Multiple file upload
- Camera integration on mobile/tablet
- Updated termly as part of ME260 submission
- Editable by SF Coordinator, School Bursar, and above

*BRD Traceability: ME-05*

---

### US-ME-06: Apply digital signatures

**As a** School Principal / Chairman, **I want** to apply a digital signature to the ME260 form, **so that** the submission is authorized without physical signatures.

**Acceptance Criteria:**

- Digital signature fields for: SF Coordinator, Principal, Chairman
- Each signature includes date
- Applied termly as part of ME260 submission
- Only the designated signatory for each role can sign
- Replaces physical signatures

*BRD Traceability: ME-06*

---

### US-ME-07: ME260 submission and review workflow

**As a** SF Unit Reconciliation Officer, **I want** a workflow: school submits, I review, I mark Accepted or Requires Resubmission with comments, **so that** the review cycle is managed digitally.

**Acceptance Criteria:**

- Workflow states: Draft, Submitted, Under Review, Accepted, Requires Resubmission
- Updated termly per ME260 submission cycle
- School submits form (SF Coordinator, School Bursar)
- Officer reviews (SF Unit Reconciliation Officer)
- Mark Accepted or Requires Resubmission with comments (free-text)
- School notified; can resubmit if needed
- Acceptance recorded and school notified

*BRD Traceability: ME-07*

---

### US-ME-08: Track ME260 compliance status

**As a** SF Unit Director, **I want** to see each school's ME260 status per term (Submitted, Under Review, Accepted, Requires Resubmission, Overdue), **so that** I can monitor financial compliance nationally.

**Acceptance Criteria:**

- Single-select status enumeration: five status values
- Per-school, per-term tracking
- Updated in real-time as workflow progresses
- Viewable by SF Unit Reconciliation Officer, SF Unit Director, and above
- Results scoped by user's access level

*BRD Traceability: ME-08*

---

### US-ME-09: Auto-flag overdue ME260

**As a** SF Unit Reconciliation Officer, **I want** the system to flag schools that missed the ME260 deadline, **so that** I can follow up promptly.

**Acceptance Criteria:**

- Auto-generated flag (boolean per school per term)
- Deadline: second month of following term
- Alert on dashboard and reconciliation overview
- Viewable by SF Unit Reconciliation Officer and above

*BRD Traceability: ME-09*

---

### US-ME-10: View reconciliation overview

**As a** SF Unit Reconciliation Officer, **I want** a reconciliation overview of compliance status across all schools by region and term, **so that** I have a single view replacing Google Sheets.

**Acceptance Criteria:**

- Table/grid view showing all schools and their ME260 status
- Filterable by region (single-select) and term (single-select)
- Shows all five status values
- Updated in real-time from ME260 workflow
- Viewable by SF Unit Reconciliation Officer and above
- Replaces Google Sheets tracker

*BRD Traceability: ME-10*

---

### US-ME-11: Track fund balances per school

**As a** SF Unit Reconciliation Officer, **I want** to track fund balances per school (sent vs. disbursed), **so that** I have a single view replacing Excel tracker.

**Acceptance Criteria:**

- Numeric currency fields: subsidy received vs expenditure per school
- Updated termly from ME260 data
- Viewable by SF Unit Reconciliation Officer and above
- Replaces Excel tracker

*BRD Traceability: ME-11*

---

## 7. School Visit Evaluations

### US-SV-01: Pre-populated school visit form

**As a** Regional SF Officer, **I want** a digital school visit form pre-populated with school profile data, **so that** I avoid re-entering known information.

**Acceptance Criteria:**

- Pre-populated fields (read-only): name, code, address, parish, region, principal, SF coordinator
- Pre-populated at form creation time
- Editable by Regional SF Officer and above
- Fully functional on tablets with touch-friendly controls (NF-18)

*BRD Traceability: SV-01, NF-18*

---

### US-SV-02: Complete assessment sections

**As a** Regional SF Officer, **I want** to record visit date, financial management, meal preparation, and canteen quality assessments, **so that** each visit is consistently evaluated.

**Acceptance Criteria:**

- Visit date (date field, yyyy-mm-dd)
- Financial management (fields TBD)
- Meal preparation (enumeration/multi-select)
- Canteen quality (enumeration/multi-select)
- Updated per visit
- Editable by Regional SF Officer and above
- Must work offline with auto-sync (NF-09)

*BRD Traceability: SV-02*

---

### US-SV-03: Assess cook management

**As a** Regional SF Officer, **I want** to capture cook management assessments, **so that** cook certification and performance are evaluated.

**Acceptance Criteria:**

- Fields TBD (enumeration/multi-select expected)
- Includes certification verification (boolean or enumeration)
- Updated per visit
- Editable by Regional SF Officer and above

*BRD Traceability: SV-03*

---

### US-SV-04: Capture PATH student satisfaction

**As a** Regional SF Officer, **I want** to capture PATH student satisfaction survey results, **so that** student feedback is recorded digitally.

**Acceptance Criteria:**

- Survey fields TBD (enumeration/scale expected)
- Linked to school and visit date
- Updated per visit
- Editable by Regional SF Officer and above

*BRD Traceability: SV-04*

---

### US-SV-05: Record food source information

**As a** Regional SF Officer, **I want** to record food sources by percentage type, **so that** sourcing patterns are tracked.

**Acceptance Criteria:**

- Numeric percentage allocation by source type (must total 100%)
- Fields TBD
- Updated per visit
- Editable by Regional SF Officer and above

*BRD Traceability: SV-05*

---

### US-SV-06: Record food wastage

**As a** Regional SF Officer, **I want** to capture food wastage data, **so that** waste levels are monitored.

**Acceptance Criteria:**

- Enumeration/multi-select field
- Updated per visit (reported termly)
- Editable by Regional SF Officer and above

*BRD Traceability: SV-06*

---

### US-SV-07: Upload visit documentation

**As a** Regional SF Officer, **I want** to upload photos and documents during my visit, **so that** visual evidence supports the evaluation.

**Acceptance Criteria:**

- File upload: PNG, JPG, PDF supported
- Camera integration on tablet/mobile
- Multiple file upload
- Updated per visit
- Editable by Regional SF Officer and above

*BRD Traceability: SV-07*

---

### US-SV-08: Add summary feedback

**As a** Regional SF Officer, **I want** to write a summary assessment text, **so that** my overall findings are captured.

**Acceptance Criteria:**

- Free-text field, no character limit
- Updated per visit
- Editable by Regional SF Officer and above

*BRD Traceability: SV-08*

---

### US-SV-09: Submit evaluation

**As a** Regional SF Officer, **I want** to submit the completed evaluation, **so that** it is visible to HQ SF Unit and the assessed school.

**Acceptance Criteria:**

- Workflow states: Draft, Submitted
- Submittable by Regional SF Officer and above
- Visible to HQ SF Unit (read-only) and assessed school (read-only) after submission
- Confirmation prompt before submission

*BRD Traceability: SV-09*

---

### US-SV-10: School visit summary reports

**As a** SF Unit Director, **I want** summary reports from visits aggregated by region and nationally, **so that** I can assess programme quality at scale.

**Acceptance Criteria:**

- Aggregated numeric and enumeration data (auto-generated, read-only)
- Aggregated by region and nationally
- Updated in real-time from submitted evaluations
- Exportable in PDF and Excel/CSV
- Viewable by SF Unit Director and above

*BRD Traceability: SV-10*

---

## 8. Dashboards and Reporting

### US-DR-01: Role-based dashboards

**As a** System Administrator, **I want** role-based dashboards at school, regional, and national levels, **so that** each user sees data relevant to their scope.

**Acceptance Criteria:**

- Dashboard content auto-scoped by user role
- School users see own school
- Regional users see their region
- HQ users see national with drill-down
- Updated in real-time from underlying data
- Read-only for all users

*BRD Traceability: DR-01*

---

### US-DR-02: SF indicators on dashboard

**As a** SF Unit Director, **I want** key SF indicators on dashboards (attendance, children served, feeding days, co-pay, meal size, menu, cost, losses, wastage, sourcing), **so that** I can monitor programme performance.

**Acceptance Criteria:**

- Numeric and enumeration indicators (auto-calculated, read-only)
- All indicators from BRD Section 12.1
- Frequency as specified per indicator
- Charts and tables
- Viewable by SF Unit Director, Regional SF Officer, and above

*BRD Traceability: DR-02, Section 12.1*

---

### US-DR-03: Nutrition indicators on dashboard

**As a** Regional SF Officer, **I want** nutrition indicators (overweight/underweight, nutritional requirements, policy compliance) on dashboards, **so that** nutritional status is visible.

**Acceptance Criteria:**

- Numeric and enumeration indicators (auto-calculated, read-only)
- Aggregated by school and region
- Policy compliance indicators (boolean compliant/non-compliant)
- Viewable by Regional SF Officer and above

*BRD Traceability: DR-03*

---

### US-DR-04: Filter dashboards

**As a** PIOJ Director, **I want** to filter dashboards by school, parish, region, term, and school year, **so that** I can drill into specific areas.

**Acceptance Criteria:**

- Five filter dimensions (single-select enumeration each)
- Filters combinable
- Applied in real-time
- Available to all dashboard users

*BRD Traceability: DR-04*

---

### US-DR-05: Export reports

**As a** SF Unit Data Manager, **I want** to export reports in PDF and Excel/CSV, **so that** I can share data with stakeholders without system access.

**Acceptance Criteria:**

- PDF export
- Excel/CSV export
- All report types exportable
- Available to SF Unit Data Manager and above

*BRD Traceability: DR-05*

---

### US-DR-06: Alerts and notifications

**As a** SF Unit Director, **I want** alerts for overdue ME260, missing attendance, low PATH attendance, low meal turnout, **so that** I am proactively informed of issues.

**Acceptance Criteria:**

- Auto-generated alert flags (boolean per alert type)
- Overdue ME260 alert
- Missing attendance alert
- PATH non-compliance alert
- Low meal turnout alert
- Configurable thresholds where applicable
- Visible on dashboard
- Viewable by SF Unit Director, SF Unit Data Manager, and above

*BRD Traceability: DR-06*

---

## 9. Cross-Cutting / Non-Functional User Stories

### US-RBAC-01: Role-based access control

**As a** System Administrator (ESMS Coordinator), **I want** to assign roles with configurable CRUD permissions per data domain, scoped by level (National, Regional, School), **so that** users only access authorized data.

**Acceptance Criteria:**

- One or more roles per user (multi-select)
- CRUD permissions per data domain (configurable by System Administrator)
- National: all schools/regions
- Regional: assigned region only
- School: own school only
- MLSS: read attendance/compliance, write PATH lists
- Updated as needed by System Administrator
- Audit logging of all permission modifications

*BRD Traceability: Section 3.3*

---

### US-NF-01: Offline data entry

**As a** SF School Coordinator, **I want** to enter attendance, lunch lists, and meal confirmations offline with auto-sync, **so that** schools with poor internet can use the system daily.

**Acceptance Criteria:**

- Offline-capable forms: attendance, lunch list, meal confirmation
- Auto-sync on reconnect
- Secure local storage (encrypted)
- Conflict resolution strategy defined
- Available to all school-level users

*BRD Traceability: NF-08, NF-09, NF-10*

---

### US-NF-02: Audit trail

**As a** SF Unit Data Manager, **I want** a complete audit trail of all data modifications (user, timestamp, previous values), **so that** any change can be traced.

**Acceptance Criteria:**

- Log fields: user, timestamp, old value, new value, data domain
- Every modification logged automatically
- Read-only; accessible to SF Unit Data Manager and above
- Retained per data retention policy

*BRD Traceability: NF-15, Section 3.3*

---

### US-NF-03: Mobile-responsive interface

**As a** Regional SF Officer, **I want** the system responsive on tablets and smartphones with touch-friendly controls, **so that** I can complete evaluations in the field.

**Acceptance Criteria:**

- Responsive layout for tablets and smartphones
- Touch-friendly controls (larger buttons, swipe gestures)
- Camera integration for file upload
- Browser support: Chrome, Firefox, Edge, Safari
- Applicable to all data entry and viewing screens

*BRD Traceability: NF-17, NF-18, Section 11.3*

---

### US-INT-01: Bulk PATH import with validation

**As a** ESMS Coordinator, **I want** to import PATH lists via CSV/Excel with validation and error reporting, **so that** data quality is maintained during batch updates.

**Acceptance Criteria:**

- CSV and Excel file formats supported
- Updated termly or as needed
- Only ESMS Coordinator and SF Unit Data Manager can import
- Validation: invalid IDs, mismatched codes
- Error report after import (downloadable)
- Logged with timestamp, source, user
- RESTful API for future real-time exchange

*BRD Traceability: Section 9.2, 9.3*
