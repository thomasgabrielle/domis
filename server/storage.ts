import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  users, households, householdMembers, assessments, grievances, 
  payments, programs, caseActivities,
  type User, type InsertUser,
  type Household, type InsertHousehold,
  type HouseholdMember, type InsertHouseholdMember,
  type Assessment, type InsertAssessment,
  type Grievance, type InsertGrievance,
  type Payment, type InsertPayment,
  type Program, type InsertProgram,
  type CaseActivity, type InsertCaseActivity,
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
  
  // Households
  createHousehold(household: InsertHousehold, members: InsertHouseholdMember[]): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdWithMembers(id: string): Promise<{ household: Household; members: HouseholdMember[] } | undefined>;
  getAllHouseholds(): Promise<Household[]>;
  updateHouseholdStatus(id: string, status: string): Promise<void>;
  updateHouseholdVulnerabilityScore(id: string, score: number): Promise<void>;
  
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
}

export const storage = new DatabaseStorage();
