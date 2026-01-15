import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { 
  users, households, householdMembers, assessments, grievances, 
  payments, programs, caseActivities, roles, permissions, rolePermissions,
  type User, type InsertUser,
  type Household, type InsertHousehold,
  type HouseholdMember, type InsertHouseholdMember,
  type Assessment, type InsertAssessment,
  type Grievance, type InsertGrievance,
  type Payment, type InsertPayment,
  type Program, type InsertProgram,
  type CaseActivity, type InsertCaseActivity,
  type Role, type InsertRole,
  type Permission, type InsertPermission,
  type RolePermission, type InsertRolePermission,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle({ client: pool });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsersWithRoles(): Promise<(User & { roleData?: Role })[]>;
  
  // Households
  createHousehold(household: InsertHousehold, members: InsertHouseholdMember[]): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdWithMembers(id: string): Promise<{ household: Household; members: HouseholdMember[] } | undefined>;
  getAllHouseholds(): Promise<Household[]>;
  updateHouseholdStatus(id: string, status: string): Promise<void>;
  updateHouseholdVulnerabilityScore(id: string, score: number): Promise<void>;
  updateHousehold(id: string, householdData: Partial<InsertHousehold>, membersData: any[]): Promise<{ household: Household; members: HouseholdMember[] }>;
  
  // Household Members
  getHouseholdMembers(householdId: string): Promise<HouseholdMember[]>;
  createHouseholdMember(member: InsertHouseholdMember): Promise<HouseholdMember>;
  
  // Assessments
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessmentsForHousehold(householdId: string): Promise<Assessment[]>;
  getLatestAssessment(householdId: string): Promise<Assessment | undefined>;
  
  // Grievances
  createGrievance(grievance: InsertGrievance): Promise<Grievance>;
  getGrievance(id: string): Promise<Grievance | undefined>;
  getAllGrievances(): Promise<Grievance[]>;
  updateGrievanceStatus(id: string, status: string, resolution?: string): Promise<void>;
  
  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsForHousehold(householdId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string, disbursementDate?: Date): Promise<void>;
  
  // Programs
  createProgram(program: InsertProgram): Promise<Program>;
  getAllPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  
  // Case Activities
  createCaseActivity(activity: InsertCaseActivity): Promise<CaseActivity>;
  getCaseActivitiesForHousehold(householdId: string): Promise<CaseActivity[]>;
  
  // Registry lookup
  findMemberByNationalId(nationalId: string): Promise<{ member: HouseholdMember; household: Household; allMembers: HouseholdMember[] } | undefined>;
  findRelatedApplicationsByNationalIds(excludeHouseholdId: string, nationalIds: string[]): Promise<any[]>;
  
  // Roles
  createRole(role: InsertRole): Promise<Role>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  
  // Permissions
  createPermission(permission: InsertPermission): Promise<Permission>;
  getPermission(id: string): Promise<Permission | undefined>;
  getAllPermissions(): Promise<Permission[]>;
  getPermissionsByModule(module: string): Promise<Permission[]>;
  
  // Role Permissions
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  
  // Seed data
  seedRolesAndPermissions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersWithRoles(): Promise<(User & { roleData?: Role })[]> {
    const result = await db.select({
      user: users,
      role: roles
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id));
    
    return result.map(r => ({
      ...r.user,
      roleData: r.role || undefined
    }));
  }

  // Households
  async createHousehold(insertHousehold: InsertHousehold, members: InsertHouseholdMember[]): Promise<Household> {
    const householdResult = await db.insert(households).values(insertHousehold).returning();
    const household = householdResult[0];
    
    if (members.length > 0) {
      await db.insert(householdMembers).values(
        members.map(m => ({ ...m, householdId: household.id }))
      );
    }
    
    return household;
  }

  async getHousehold(id: string): Promise<Household | undefined> {
    const result = await db.select().from(households).where(eq(households.id, id));
    return result[0];
  }

  async getHouseholdWithMembers(id: string): Promise<{ household: Household; members: HouseholdMember[] } | undefined> {
    const household = await this.getHousehold(id);
    if (!household) return undefined;
    
    const members = await this.getHouseholdMembers(id);
    return { household, members };
  }

  async getAllHouseholds(): Promise<Household[]> {
    return await db.select().from(households).orderBy(desc(households.createdAt));
  }

  async updateHouseholdStatus(id: string, status: string): Promise<void> {
    await db.update(households)
      .set({ 
        programStatus: status,
        enrollmentDate: status === 'enrolled' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(households.id, id));
  }

  async updateHouseholdVulnerabilityScore(id: string, score: number): Promise<void> {
    await db.update(households)
      .set({ 
        vulnerabilityScore: score,
        lastAssessmentDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(households.id, id));
  }

  async updateHousehold(id: string, householdData: Partial<InsertHousehold>, membersData: any[]): Promise<{ household: Household; members: HouseholdMember[] }> {
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (householdData.province !== undefined) updateData.province = householdData.province;
    if (householdData.district !== undefined) updateData.district = householdData.district;
    if (householdData.village !== undefined) updateData.village = householdData.village;
    if (householdData.gpsCoordinates !== undefined) updateData.gpsCoordinates = householdData.gpsCoordinates || null;
    if (householdData.outreachType !== undefined) updateData.outreachType = householdData.outreachType || null;
    if (householdData.outreachMethod !== undefined) updateData.outreachMethod = householdData.outreachMethod || null;
    if (householdData.isOnOwnBehalf !== undefined) updateData.isOnOwnBehalf = householdData.isOnOwnBehalf;
    if (householdData.requestPurpose !== undefined) updateData.requestPurpose = householdData.requestPurpose || null;
    if (householdData.actionTaken !== undefined) updateData.actionTaken = householdData.actionTaken || null;
    if (householdData.followUpNotes !== undefined) updateData.followUpNotes = householdData.followUpNotes || null;
    if (householdData.assessmentNotes !== undefined) updateData.assessmentNotes = householdData.assessmentNotes || null;
    if (householdData.householdAssets !== undefined) updateData.householdAssets = householdData.householdAssets || null;
    if (householdData.roofType !== undefined) updateData.roofType = householdData.roofType || null;
    if (householdData.wallType !== undefined) updateData.wallType = householdData.wallType || null;
    if (householdData.householdAssetsList !== undefined) updateData.householdAssetsList = householdData.householdAssetsList || null;
    
    if (householdData.proxyFirstName !== undefined) updateData.proxyFirstName = householdData.proxyFirstName || null;
    if (householdData.proxyLastName !== undefined) updateData.proxyLastName = householdData.proxyLastName || null;
    if (householdData.proxyAlias !== undefined) updateData.proxyAlias = householdData.proxyAlias || null;
    if (householdData.proxyGender !== undefined) updateData.proxyGender = householdData.proxyGender || null;
    if (householdData.proxyAddress !== undefined) updateData.proxyAddress = householdData.proxyAddress || null;
    if (householdData.proxyPhone !== undefined) updateData.proxyPhone = householdData.proxyPhone || null;
    if (householdData.proxyNationalId !== undefined) updateData.proxyNationalId = householdData.proxyNationalId || null;
    if (householdData.proxyReason !== undefined) updateData.proxyReason = householdData.proxyReason || null;
    if (householdData.proxyRelationship !== undefined) updateData.proxyRelationship = householdData.proxyRelationship || null;
    if (householdData.proxyRole !== undefined) updateData.proxyRole = householdData.proxyRole || null;
    
    if (householdData.intakeDate) {
      updateData.intakeDate = typeof householdData.intakeDate === 'string' 
        ? new Date(householdData.intakeDate) 
        : householdData.intakeDate;
    }
    if (householdData.proxyDateOfBirth) {
      updateData.proxyDateOfBirth = typeof householdData.proxyDateOfBirth === 'string' 
        ? new Date(householdData.proxyDateOfBirth) 
        : householdData.proxyDateOfBirth;
    } else if (householdData.proxyDateOfBirth === null || householdData.proxyDateOfBirth === '') {
      updateData.proxyDateOfBirth = null;
    }
    
    await db.update(households)
      .set(updateData)
      .where(eq(households.id, id));

    for (const member of membersData) {
      const memberDateOfBirth = typeof member.dateOfBirth === 'string' 
        ? new Date(member.dateOfBirth) 
        : member.dateOfBirth;
        
      if (member.id) {
        await db.update(householdMembers)
          .set({
            firstName: member.firstName,
            lastName: member.lastName,
            dateOfBirth: memberDateOfBirth,
            gender: member.gender,
            relationshipToHead: member.relationshipToHead,
            nationalId: member.nationalId || null,
            disabilityStatus: member.disabilityStatus,
            isHead: member.isHead,
          })
          .where(eq(householdMembers.id, member.id));
      } else {
        await db.insert(householdMembers).values({
          householdId: id,
          firstName: member.firstName,
          lastName: member.lastName,
          dateOfBirth: memberDateOfBirth,
          gender: member.gender,
          relationshipToHead: member.relationshipToHead,
          nationalId: member.nationalId || null,
          disabilityStatus: member.disabilityStatus,
          isHead: member.isHead,
        });
      }
    }

    const result = await this.getHouseholdWithMembers(id);
    return result!;
  }

  // Household Members
  async getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    return await db.select().from(householdMembers).where(eq(householdMembers.householdId, householdId));
  }

  async createHouseholdMember(member: InsertHouseholdMember): Promise<HouseholdMember> {
    const result = await db.insert(householdMembers).values(member).returning();
    return result[0];
  }

  // Assessments
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const result = await db.insert(assessments).values(insertAssessment).returning();
    return result[0];
  }

  async getAssessmentsForHousehold(householdId: string): Promise<Assessment[]> {
    return await db.select().from(assessments)
      .where(eq(assessments.householdId, householdId))
      .orderBy(desc(assessments.assessmentDate));
  }

  async getLatestAssessment(householdId: string): Promise<Assessment | undefined> {
    const result = await db.select().from(assessments)
      .where(eq(assessments.householdId, householdId))
      .orderBy(desc(assessments.assessmentDate))
      .limit(1);
    return result[0];
  }

  // Grievances
  async createGrievance(insertGrievance: InsertGrievance): Promise<Grievance> {
    const result = await db.insert(grievances).values(insertGrievance).returning();
    return result[0];
  }

  async getGrievance(id: string): Promise<Grievance | undefined> {
    const result = await db.select().from(grievances).where(eq(grievances.id, id));
    return result[0];
  }

  async getAllGrievances(): Promise<Grievance[]> {
    return await db.select().from(grievances).orderBy(desc(grievances.dateFiled));
  }

  async updateGrievanceStatus(id: string, status: string, resolution?: string): Promise<void> {
    await db.update(grievances)
      .set({ 
        status,
        resolution: resolution || null,
        resolvedDate: status === 'resolved' || status === 'closed' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(grievances.id, id));
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }

  async getPaymentsForHousehold(householdId: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.householdId, householdId))
      .orderBy(desc(payments.createdAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: string, disbursementDate?: Date): Promise<void> {
    await db.update(payments)
      .set({ 
        status,
        disbursementDate: disbursementDate || null,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id));
  }

  // Programs
  async createProgram(insertProgram: InsertProgram): Promise<Program> {
    const result = await db.insert(programs).values(insertProgram).returning();
    return result[0];
  }

  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const result = await db.select().from(programs).where(eq(programs.id, id));
    return result[0];
  }

  // Case Activities
  async createCaseActivity(insertActivity: InsertCaseActivity): Promise<CaseActivity> {
    const result = await db.insert(caseActivities).values(insertActivity).returning();
    return result[0];
  }

  async getCaseActivitiesForHousehold(householdId: string): Promise<CaseActivity[]> {
    return await db.select().from(caseActivities)
      .where(eq(caseActivities.householdId, householdId))
      .orderBy(desc(caseActivities.activityDate));
  }

  // Registry lookup
  async findMemberByNationalId(nationalId: string): Promise<{ member: HouseholdMember; household: Household; allMembers: HouseholdMember[] } | undefined> {
    const normalizedId = nationalId.trim().toUpperCase();
    const result = await db.select({
      member: householdMembers,
      household: households
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(sql`UPPER(TRIM(${householdMembers.nationalId})) = ${normalizedId}`)
    .limit(1);
    
    if (!result[0]) return undefined;
    
    const allMembers = await db.select()
      .from(householdMembers)
      .where(eq(householdMembers.householdId, result[0].household.id));
    
    return {
      member: result[0].member,
      household: result[0].household,
      allMembers
    };
  }

  async findRelatedApplicationsByNationalIds(excludeHouseholdId: string, nationalIds: string[]): Promise<any[]> {
    if (nationalIds.length === 0) return [];
    
    // Single query to find all members with matching national IDs (excluding current household)
    const matchingMembers = await db.select({
      member: householdMembers,
      household: households
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(
      and(
        ne(householdMembers.householdId, excludeHouseholdId),
        sql`UPPER(TRIM(${householdMembers.nationalId})) = ANY(${nationalIds})`
      )
    );
    
    // Group by household
    const householdMap = new Map<string, { household: any; matchingMembers: any[] }>();
    
    for (const row of matchingMembers) {
      const hId = row.household.id;
      if (!householdMap.has(hId)) {
        householdMap.set(hId, { 
          household: row.household, 
          matchingMembers: [] 
        });
      }
      householdMap.get(hId)!.matchingMembers.push({
        id: row.member.id,
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        nationalId: row.member.nationalId,
        relationshipToHead: row.member.relationshipToHead,
      });
    }
    
    return Array.from(householdMap.values());
  }

  // Roles
  async createRole(insertRole: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values(insertRole).returning();
    return result[0];
  }

  async getRole(id: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id));
    return result[0];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.name, name));
    return result[0];
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.displayName);
  }

  async updateRole(id: string, roleData: Partial<InsertRole>): Promise<Role> {
    const result = await db.update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return result[0];
  }

  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Permissions
  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const result = await db.insert(permissions).values(insertPermission).returning();
    return result[0];
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id));
    return result[0];
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.module, permissions.displayName);
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return await db.select().from(permissions)
      .where(eq(permissions.module, module))
      .orderBy(permissions.displayName);
  }

  // Role Permissions
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const result = await db.insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return result[0];
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db.select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return result.map(r => r.permission);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions)
        .values(permissionIds.map(permissionId => ({ roleId, permissionId })));
    }
  }

  // Seed roles and permissions
  async seedRolesAndPermissions(): Promise<void> {
    const existingRoles = await this.getAllRoles();
    if (existingRoles.length > 0) return;

    const defaultRoles: InsertRole[] = [
      { name: "system_admin", displayName: "System Administrator", description: "Full system access, user management, system configuration", isSystemRole: true },
      { name: "program_manager", displayName: "Program Manager", description: "Oversee programs, view reports, approve assessments, manage case workers", isSystemRole: true },
      { name: "case_worker", displayName: "Case Worker / Social Worker", description: "Register applications, conduct assessments, manage cases, record payments", isSystemRole: true },
      { name: "data_entry", displayName: "Data Entry Clerk", description: "Limited to data entry for intake and basic updates", isSystemRole: true },
      { name: "viewer", displayName: "Viewer / Auditor", description: "Read-only access for monitoring and auditing", isSystemRole: true },
    ];

    const defaultPermissions: InsertPermission[] = [
      { name: "dashboard.view", displayName: "View Dashboard", description: "Access to view the dashboard", module: "Dashboard" },
      { name: "intake.view", displayName: "View Intake", description: "Access to view intake forms", module: "Intake" },
      { name: "intake.create", displayName: "Create Intake", description: "Create new applications", module: "Intake" },
      { name: "intake.edit", displayName: "Edit Intake", description: "Edit existing applications", module: "Intake" },
      { name: "assessments.view", displayName: "View Assessments", description: "View assessments", module: "Assessments" },
      { name: "assessments.create", displayName: "Create Assessments", description: "Create new assessments", module: "Assessments" },
      { name: "assessments.approve", displayName: "Approve Assessments", description: "Approve/reject assessments", module: "Assessments" },
      { name: "applications.view", displayName: "View Applications", description: "View applications list", module: "Applications" },
      { name: "applications.edit", displayName: "Edit Applications", description: "Edit application details", module: "Applications" },
      { name: "registry.view", displayName: "View Registry", description: "View single registry", module: "Registry" },
      { name: "registry.export", displayName: "Export Registry", description: "Export registry data", module: "Registry" },
      { name: "cases.view", displayName: "View Cases", description: "View case management", module: "Case Management" },
      { name: "cases.create", displayName: "Create Case Activities", description: "Log case activities", module: "Case Management" },
      { name: "cases.assign", displayName: "Assign Cases", description: "Assign cases to workers", module: "Case Management" },
      { name: "payments.view", displayName: "View Payments", description: "View payment records", module: "Payments" },
      { name: "payments.create", displayName: "Create Payments", description: "Create payment records", module: "Payments" },
      { name: "payments.approve", displayName: "Approve Payments", description: "Approve payment disbursements", module: "Payments" },
      { name: "grievances.view", displayName: "View Grievances", description: "View grievance records", module: "Grievances" },
      { name: "grievances.create", displayName: "Create Grievances", description: "Submit grievances", module: "Grievances" },
      { name: "grievances.resolve", displayName: "Resolve Grievances", description: "Resolve grievance cases", module: "Grievances" },
      { name: "reports.view", displayName: "View Reports", description: "Access M&E reports", module: "M&E Reports" },
      { name: "reports.export", displayName: "Export Reports", description: "Export report data", module: "M&E Reports" },
      { name: "admin.users", displayName: "Manage Users", description: "Create, edit, delete users", module: "Administration" },
      { name: "admin.roles", displayName: "Manage Roles", description: "Create, edit roles and permissions", module: "Administration" },
      { name: "admin.programs", displayName: "Manage Programs", description: "Create, edit assistance programs", module: "Administration" },
      { name: "admin.settings", displayName: "System Settings", description: "Configure system settings", module: "Administration" },
    ];

    const createdRoles: Role[] = [];
    for (const role of defaultRoles) {
      const created = await this.createRole(role);
      createdRoles.push(created);
    }

    const createdPermissions: Permission[] = [];
    for (const permission of defaultPermissions) {
      const created = await this.createPermission(permission);
      createdPermissions.push(created);
    }

    const allPermissionIds = createdPermissions.map(p => p.id);
    const viewOnlyPermissions = createdPermissions.filter(p => p.name.endsWith(".view")).map(p => p.id);
    const caseWorkerPermissions = createdPermissions.filter(p => 
      !p.name.startsWith("admin.") && 
      !p.name.endsWith(".approve") &&
      !p.name.includes("assign")
    ).map(p => p.id);
    const dataEntryPermissions = createdPermissions.filter(p =>
      p.name === "dashboard.view" ||
      p.name.startsWith("intake.") ||
      p.name === "applications.view"
    ).map(p => p.id);
    const managerPermissions = createdPermissions.filter(p =>
      !p.name.startsWith("admin.users") &&
      !p.name.startsWith("admin.roles") &&
      !p.name.startsWith("admin.settings")
    ).map(p => p.id);

    for (const role of createdRoles) {
      let permissionIds: string[] = [];
      switch (role.name) {
        case "system_admin":
          permissionIds = allPermissionIds;
          break;
        case "program_manager":
          permissionIds = managerPermissions;
          break;
        case "case_worker":
          permissionIds = caseWorkerPermissions;
          break;
        case "data_entry":
          permissionIds = dataEntryPermissions;
          break;
        case "viewer":
          permissionIds = viewOnlyPermissions;
          break;
      }
      await this.setRolePermissions(role.id, permissionIds);
    }
  }
}

export const storage = new DatabaseStorage();
