import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// RBAC (Role-Based Access Control)
// ============================================================================

/**
 * roles — System roles that control what users can do.
 * Roles are assigned to users and linked to permissions via the rolePermissions junction table.
 * System roles (isSystemRole=true) cannot be deleted.
 */
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),           // machine key, e.g. "intake_clerk", "social_worker"
  displayName: text("display_name").notNull(),      // human-readable label
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * permissions — Granular capabilities (e.g. "create_household", "approve_assessment").
 * Grouped by module for UI organisation.
 */
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),            // machine key, e.g. "view_applications"
  displayName: text("display_name").notNull(),
  description: text("description"),
  module: text("module").notNull(),                 // grouping: "applications", "assessments", "admin", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * rolePermissions — Junction table: which permissions belong to which role.
 * Cascade-deletes when the parent role or permission is removed.
 */
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: varchar("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Users
// ============================================================================

/**
 * users — Staff accounts (intake clerks, social workers, coordinators, directors, etc.).
 * Each user has a legacy `role` text column AND a `roleId` FK to the RBAC roles table.
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),             // bcrypt hash
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  roleId: varchar("role_id").references(() => roles.id), // FK to RBAC roles table
  role: text("role").notNull().default("case_worker"),   // legacy text role kept for backward compat
  department: text("department"),
  status: text("status").notNull().default("active"),    // active | inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Households (Applications)
// ============================================================================

/**
 * households — The core table. Each row represents one APPLICATION for social assistance.
 *
 * Key domain concepts:
 * - One person (identified by national ID or name+DOB) can have multiple applications
 *   (rows in this table), e.g. re-applying after rejection or for a different programme.
 * - The head of household (isHead=true in householdMembers) is the applicant.
 * - A proxy can apply on behalf of an applicant (proxy fields below).
 * - "requestPurpose" = which service they are applying for.
 * - "actionTaken" = the social worker referred to for follow-up (effectively their assigned worker).
 *
 * Lifecycle / workflow:
 *   Intake → Home Visit → Social Worker Assessment → Coordinator → Director
 *   → Permanent Secretary → Minister → Enrolled
 *
 * programStatus tracks the current position in that lifecycle.
 */
export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdCode: text("household_code").notNull().unique(),   // auto-generated display code, e.g. "HH-2024-001"
  applicationId: text("application_id").notNull().unique(),   // auto-generated, e.g. "APP-2024-001-1234"
  registrationDate: timestamp("registration_date").defaultNow().notNull(),

  // ── Intake Information ──────────────────────────────────────────────────
  intakeDate: timestamp("intake_date").defaultNow().notNull(),
  outreachType: text("outreach_type"),          // how the applicant was reached: walk_in, referral, outreach, etc.
  outreachMethod: text("outreach_method"),      // sub-detail of outreach type
  isOnOwnBehalf: boolean("is_on_own_behalf").default(true), // false = proxy is filing on behalf of applicant
  requestPurpose: text("request_purpose"),      // service applied for: social_welfare, gender_affairs, probation, child_protection, etc.
  actionTaken: text("action_taken"),            // social worker assigned to follow up / conduct home visit
  followUpNotes: text("follow_up_notes"),
  attachmentUrl: text("attachment_url"),         // optional supporting document

  // ── Proxy Information (populated when isOnOwnBehalf = false) ───────────
  proxyFirstName: text("proxy_first_name"),
  proxyLastName: text("proxy_last_name"),
  proxyAlias: text("proxy_alias"),
  proxyGender: text("proxy_gender"),
  proxyDateOfBirth: timestamp("proxy_date_of_birth"),
  proxyAddress: text("proxy_address"),
  proxyPhone: text("proxy_phone"),
  proxyNationalId: text("proxy_national_id"),
  proxyReason: text("proxy_reason"),             // why a proxy is applying instead
  proxyRelationship: text("proxy_relationship"), // relationship to the applicant
  proxyRole: text("proxy_role"),                 // proxy's role, e.g. caregiver, legal guardian

  // ── Location / Address ─────────────────────────────────────────────────
  province: text("province").notNull(),
  district: text("district").notNull(),
  village: text("village").notNull(),
  gpsCoordinates: text("gps_coordinates"),       // "lat,lng" string captured from device

  // ── Home Visit ─────────────────────────────────────────────────────────
  // Filled during the social worker's home visit. Data is about the applicant's
  // real-world living situation and carries forward across applications.
  homeVisitStatus: text("home_visit_status").default("pending"), // pending | completed
  homeVisitDate: timestamp("home_visit_date"),
  homeVisitNotes: text("home_visit_notes"),       // narrative notes from the visit

  // ── Household Details (collected during home visit) ────────────────────
  roofType: text("roof_type"),                    // metal | tile | cement | wood
  wallType: text("wall_type"),                    // concrete | wood | mixed | other
  householdAssetsList: text("household_assets_list"), // JSON array string, e.g. '["television","refrigerator"]'

  // ── Social Worker Assessment ───────────────────────────────────────────
  // Written by the social worker after the home visit, before the workflow begins.
  vulnerabilityScore: integer("vulnerability_score").default(0),
  lastAssessmentDate: timestamp("last_assessment_date"),
  assessmentNotes: text("assessment_notes"),       // social worker's narrative assessment
  householdAssets: text("household_assets"),        // legacy/summary field for assets

  // ── Recommendations (set by social worker, reviewed by approval chain) ─
  recommendation: text("recommendation"),          // agree | disagree | requires_further_info
  amountAllocation: numeric("amount_allocation", { precision: 10, scale: 2 }), // recommended monthly benefit
  durationMonths: integer("duration_months"),      // recommended benefit duration
  transferModality: text("transfer_modality"),     // cash | phone | vcc (virtual credit card)
  complementaryActivities: text("complementary_activities"), // additional support activities
  recommendationComments: text("recommendation_comments"),

  // ── Approval Workflow ──────────────────────────────────────────────────
  // assessmentStep tracks position in the approval chain:
  //   null          → still in Applications (pre-assessment)
  //   "coordinator" → awaiting Coordinator review
  //   "director"    → awaiting Director review
  //   "permanent_secretary" → awaiting Permanent Secretary review
  //   "minister"    → awaiting Minister review
  //   "completed"   → fully approved (enrolled)
  assessmentStep: text("assessment_step"),
  currentCycleNumber: integer("current_cycle_number").default(1), // increments when sent back for revision

  // Each step's decision is recorded here for quick access (full history in workflowHistory).
  coordinatorDecision: text("coordinator_decision"),       // agree | disagree | requires_further_info
  coordinatorComments: text("coordinator_comments"),
  directorDecision: text("director_decision"),
  directorComments: text("director_comments"),
  permanentSecretaryDecision: text("permanent_secretary_decision"),
  permanentSecretaryComments: text("permanent_secretary_comments"),
  ministerDecision: text("minister_decision"),
  ministerComments: text("minister_comments"),

  // ── Status / Enrolment ─────────────────────────────────────────────────
  // programStatus tracks the overall lifecycle:
  //   pending_assessment → home_visit_in_progress → assessment_in_progress
  //   → under_review → enrolled | rejected
  programStatus: text("program_status").notNull().default("pending_assessment"),
  enrollmentDate: timestamp("enrollment_date"),    // set when Minister approves → enrolled

  // ── Case Management ────────────────────────────────────────────────────
  assignedSocialWorkerId: varchar("assigned_social_worker_id").references(() => users.id),

  // ── Metadata ───────────────────────────────────────────────────────────
  createdBy: varchar("created_by").references(() => users.id), // intake clerk who created the application
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Workflow History
// ============================================================================

/**
 * workflowHistory — Immutable audit trail for the approval workflow.
 *
 * Every time a reviewer (Coordinator, Director, Permanent Secretary, or Minister)
 * makes a decision, a row is inserted here. This preserves the full history even
 * when an application is sent back and re-reviewed (tracked by cycleNumber).
 *
 * A snapshot of the recommendation at the time of the decision is stored so that
 * later reviewers can see what was recommended when each prior decision was made.
 */
export const workflowHistory = pgTable("workflow_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),

  step: text("step").notNull(),                    // coordinator | director | permanent_secretary | minister
  cycleNumber: integer("cycle_number").notNull().default(1),

  decision: text("decision").notNull(),            // agree | disagree | requires_further_info
  comments: text("comments"),

  // Recommendation snapshot at time of decision
  recommendation: text("recommendation"),
  amountAllocation: numeric("amount_allocation", { precision: 10, scale: 2 }),
  durationMonths: integer("duration_months"),
  transferModality: text("transfer_modality"),
  complementaryActivities: text("complementary_activities"),

  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Household Members
// ============================================================================

/**
 * householdMembers — People belonging to a household application.
 *
 * - The member with isHead=true is the applicant (head of household).
 * - Other members are dependants / family members identified during intake or home visit.
 * - Personal details are collected at intake; education, employment, and income fields
 *   are filled during the home visit / application edit.
 * - When a new application is created for someone who already applied before,
 *   members can be carried forward (IDs stripped so new records are created).
 * - incomeType is stored as a JSON string array of objects:
 *   e.g. '[{"type":"main_work_income","monthlyAmount":"500"},{"type":"government_assistance","monthlyAmount":"200"}]'
 */
export const householdMembers = pgTable("household_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),

  // ── Personal Details (collected at intake) ─────────────────────────────
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").notNull(),                 // male | female
  relationshipToHead: text("relationship_to_head").notNull(), // self | spouse | child | parent | sibling | other
  nationalId: text("national_id"),
  disabilityStatus: boolean("disability_status").default(false),
  isHead: boolean("is_head").default(false),        // true = this member is the applicant

  // ── Education (collected during home visit / edit) ─────────────────────
  maritalStatus: text("marital_status"),             // single | married | divorced | widowed | separated
  educationLevel: text("education_level"),           // none | primary | secondary | tertiary | vocational
  professionalCertifications: text("professional_certifications"), // free-text list of certifications held
  currentEducationEnrolment: text("current_education_enrolment"), // currently enrolled programme, if any
  ongoingCertification: text("ongoing_certification"),            // certification currently being pursued

  // ── Employment & Income (collected during home visit / edit) ───────────
  professionalSituation: text("professional_situation"), // employed | self_employed | unemployed | retired | student
  employerDetails: text("employer_details"),              // employer name / description
  incomeType: text("income_type"),                        // JSON string — array of {type, monthlyAmount} objects
  monthlyIncome: numeric("monthly_income", { precision: 10, scale: 2 }), // total monthly income

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Assessments
// ============================================================================

/**
 * assessments — Formal scored assessment records.
 * Created when the social worker completes a scored evaluation of the household.
 * Separate from the narrative assessment fields on the households table.
 */
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),

  assessmentType: text("assessment_type").notNull().default("manual"), // manual | automated
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  assessedBy: varchar("assessed_by").references(() => users.id),

  rawScore: integer("raw_score").notNull(),
  adjustedScore: integer("adjusted_score").notNull(),

  decision: text("decision").notNull(),             // eligible | ineligible | pending_review
  justification: text("justification"),

  housingType: text("housing_type"),
  incomeSource: text("income_source"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Grievances
// ============================================================================

/**
 * grievances — Complaints or issues filed by or on behalf of applicants/clients.
 * Tracked from filing through resolution with priority and assignment.
 */
export const grievances = pgTable("grievances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grievanceCode: text("grievance_code").notNull().unique(), // auto-generated display code
  householdId: varchar("household_id").references(() => households.id),

  dateFiled: timestamp("date_filed").defaultNow().notNull(),
  category: text("category").notNull(),             // service_delivery | eligibility | payment | staff_conduct | other
  description: text("description").notNull(),

  status: text("status").notNull().default("open"), // open | in_progress | resolved | closed
  priority: text("priority").default("medium"),     // low | medium | high | critical

  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedDate: timestamp("resolved_date"),

  filedBy: text("filed_by"),                        // name of person who filed
  contactInfo: text("contact_info"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Payments
// ============================================================================

/**
 * payments — Benefit disbursement records for enrolled clients.
 * Each row is one payment in a payment cycle, linked to a programme and household.
 */
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentCode: text("payment_code").notNull().unique(), // auto-generated, e.g. "PAY-2024-001"
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  cycle: text("cycle").notNull(),                   // payment cycle identifier, e.g. "2024-Q1"
  programId: varchar("program_id").references(() => programs.id),

  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  provider: text("provider").notNull(),                // disbursement channel: bank | mobile_money | cash
  disbursementDate: timestamp("disbursement_date"),

  transactionRef: text("transaction_ref"),          // external reference from payment provider
  failureReason: text("failure_reason"),            // populated when status = failed

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Programs
// ============================================================================

/**
 * programs — Social assistance programmes that households can be enrolled in.
 * Defines eligibility criteria and benefit amounts.
 */
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active | inactive | completed

  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),

  eligibilityCriteria: jsonb("eligibility_criteria"), // flexible JSON criteria for programme eligibility
  benefitAmount: numeric("benefit_amount", { precision: 10, scale: 2 }), // standard monthly benefit

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Case Activities
// ============================================================================

/**
 * caseActivities — Activity log for case management.
 * Records every significant action on a case (home visits, calls, document uploads, etc.).
 */
export const caseActivities = pgTable("case_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),

  activityType: text("activity_type").notNull(),    // home_visit | phone_call | document_upload | note | referral
  activityDate: timestamp("activity_date").defaultNow().notNull(),
  description: text("description").notNull(),

  performedBy: varchar("performed_by").references(() => users.id),
  attachmentUrl: text("attachment_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Insert Schemas (Zod validation for API input)
// ============================================================================

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHouseholdSchema = createInsertSchema(households, {
  intakeDate: z.coerce.date().optional(),
  proxyDateOfBirth: z.coerce.date().optional().nullable(),
  registrationDate: z.coerce.date().optional(),
  enrollmentDate: z.coerce.date().optional().nullable(),
  lastAssessmentDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  householdCode: true,
  applicationId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHouseholdMemberSchema = createInsertSchema(householdMembers, {
  dateOfBirth: z.coerce.date(),
}).omit({
  id: true,
  householdId: true,
  createdAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const insertGrievanceSchema = createInsertSchema(grievances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCaseActivitySchema = createInsertSchema(caseActivities).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowHistorySchema = createInsertSchema(workflowHistory).omit({
  id: true,
  reviewedAt: true,
  createdAt: true,
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Household = typeof households.$inferSelect;

export type InsertHouseholdMember = z.infer<typeof insertHouseholdMemberSchema>;
export type HouseholdMember = typeof householdMembers.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export type InsertGrievance = z.infer<typeof insertGrievanceSchema>;
export type Grievance = typeof grievances.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programs.$inferSelect;

export type InsertCaseActivity = z.infer<typeof insertCaseActivitySchema>;
export type CaseActivity = typeof caseActivities.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export type InsertWorkflowHistory = z.infer<typeof insertWorkflowHistorySchema>;
export type WorkflowHistory = typeof workflowHistory.$inferSelect;
