import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  module: text("module").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  permissionId: varchar("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  roleId: varchar("role_id").references(() => roles.id),
  role: text("role").notNull().default("case_worker"),
  department: text("department"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdCode: text("household_code").notNull().unique(),
  applicationId: text("application_id").notNull().unique(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  
  // Intake Information
  intakeDate: timestamp("intake_date").defaultNow().notNull(),
  outreachType: text("outreach_type"),
  outreachMethod: text("outreach_method"),
  isOnOwnBehalf: boolean("is_on_own_behalf").default(true),
  requestPurpose: text("request_purpose"),
  actionTaken: text("action_taken"),
  followUpNotes: text("follow_up_notes"),
  attachmentUrl: text("attachment_url"),
  
  // Proxy Information
  proxyFirstName: text("proxy_first_name"),
  proxyLastName: text("proxy_last_name"),
  proxyAlias: text("proxy_alias"),
  proxyGender: text("proxy_gender"),
  proxyDateOfBirth: timestamp("proxy_date_of_birth"),
  proxyAddress: text("proxy_address"),
  proxyPhone: text("proxy_phone"),
  proxyNationalId: text("proxy_national_id"),
  proxyReason: text("proxy_reason"),
  proxyRelationship: text("proxy_relationship"),
  proxyRole: text("proxy_role"),
  
  // Location
  province: text("province").notNull(),
  district: text("district").notNull(),
  village: text("village").notNull(),
  gpsCoordinates: text("gps_coordinates"),
  
  // Household Details
  roofType: text("roof_type"),
  wallType: text("wall_type"),
  householdAssetsList: text("household_assets_list"),
  
  // Assessment
  vulnerabilityScore: integer("vulnerability_score").default(0),
  lastAssessmentDate: timestamp("last_assessment_date"),
  assessmentNotes: text("assessment_notes"),
  householdAssets: text("household_assets"),
  
  // Recommendations
  recommendation: text("recommendation"), // agree, disagree, requires_further_info
  amountAllocation: numeric("amount_allocation", { precision: 10, scale: 2 }),
  durationMonths: integer("duration_months"),
  transferModality: text("transfer_modality"), // cash, phone, vcc
  complementaryActivities: text("complementary_activities"),
  recommendationComments: text("recommendation_comments"),
  
  // Assessment Workflow Step (for Assessments & Recommendations module)
  assessmentStep: text("assessment_step"), // null = in Applications, coordinator, director, permanent_secretary, minister, completed
  
  // Status
  programStatus: text("program_status").notNull().default("pending_assessment"),
  enrollmentDate: timestamp("enrollment_date"),
  
  // Case Management
  assignedSocialWorkerId: varchar("assigned_social_worker_id").references(() => users.id),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const householdMembers = pgTable("household_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  relationshipToHead: text("relationship_to_head").notNull(),
  nationalId: text("national_id"),
  disabilityStatus: boolean("disability_status").default(false),
  isHead: boolean("is_head").default(false),
  
  maritalStatus: text("marital_status"),
  educationLevel: text("education_level"),
  professionalCertifications: text("professional_certifications"),
  currentEducationEnrolment: text("current_education_enrolment"),
  ongoingCertification: text("ongoing_certification"),
  professionalSituation: text("professional_situation"),
  employerDetails: text("employer_details"),
  incomeType: text("income_type"),
  monthlyIncome: numeric("monthly_income", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  
  // Assessment details
  assessmentType: text("assessment_type").notNull().default("manual"),
  assessmentDate: timestamp("assessment_date").defaultNow().notNull(),
  assessedBy: varchar("assessed_by").references(() => users.id),
  
  // Scores
  rawScore: integer("raw_score").notNull(),
  adjustedScore: integer("adjusted_score").notNull(),
  
  // Decision
  decision: text("decision").notNull(),
  justification: text("justification"),
  
  // Additional data
  housingType: text("housing_type"),
  incomeSource: text("income_source"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grievances = pgTable("grievances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grievanceCode: text("grievance_code").notNull().unique(),
  householdId: varchar("household_id").references(() => households.id),
  
  dateFiled: timestamp("date_filed").defaultNow().notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  
  status: text("status").notNull().default("open"),
  priority: text("priority").default("medium"),
  
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedDate: timestamp("resolved_date"),
  
  filedBy: text("filed_by"),
  contactInfo: text("contact_info"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentCode: text("payment_code").notNull().unique(),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  cycle: text("cycle").notNull(),
  programId: varchar("program_id").references(() => programs.id),
  
  status: text("status").notNull().default("pending"),
  provider: text("provider").notNull(),
  disbursementDate: timestamp("disbursement_date"),
  
  transactionRef: text("transaction_ref"),
  failureReason: text("failure_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  eligibilityCriteria: jsonb("eligibility_criteria"),
  benefitAmount: numeric("benefit_amount", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const caseActivities = pgTable("case_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").references(() => households.id, { onDelete: "cascade" }).notNull(),
  
  activityType: text("activity_type").notNull(),
  activityDate: timestamp("activity_date").defaultNow().notNull(),
  description: text("description").notNull(),
  
  performedBy: varchar("performed_by").references(() => users.id),
  attachmentUrl: text("attachment_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
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

// Types
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
