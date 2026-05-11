import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requirePermission } from "./auth";
import {
  insertHouseholdSchema,
  insertHouseholdMemberSchema,
  insertAssessmentSchema,
  insertGrievanceSchema,
  insertPaymentSchema,
  insertCaseActivitySchema,
  insertRoleSchema,
  insertUserSchema,
  insertWorkflowHistorySchema
} from "@shared/schema";
import { z } from "zod";

/**
 * Returns the district to scope queries to, or null if no scoping is needed.
 * Only VCC Clerk users get district-scoped data access.
 */
function getUserDistrictScope(user: Express.User): string | null {
  if (user.role?.name === 'vcc_clerk' && user.district) {
    return user.district;
  }
  return null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== HOUSEHOLDS =====

  // Create household with members (intake)
  app.post("/api/households", requireAuth, requirePermission("intake.create"), async (req, res) => {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const householdData = insertHouseholdSchema.parse(req.body.household);
        const membersData = z.array(insertHouseholdMemberSchema).parse(req.body.members || []);

        // Force district to VCC Clerk's assigned district
        const districtScope = getUserDistrictScope(req.user!);
        if (districtScope) {
          (householdData as any).district = districtScope;
        }

        const year = new Date().getFullYear();
        const allHouseholds = await storage.getAllHouseholds();

        const yearPattern = new RegExp(`^HH-${year}-(\\d+)$`);
        const appPattern = new RegExp(`^APP-${year}-(\\d+)$`);

        let maxHHNum = 0;
        let maxAppNum = 0;

        for (const h of allHouseholds) {
          const hhMatch = h.householdCode?.match(yearPattern);
          if (hhMatch) {
            maxHHNum = Math.max(maxHHNum, parseInt(hhMatch[1], 10));
          }
          const appMatch = h.applicationId?.match(appPattern);
          if (appMatch) {
            maxAppNum = Math.max(maxAppNum, parseInt(appMatch[1], 10));
          }
        }

        const nextNum = Math.max(maxHHNum, maxAppNum) + 1 + attempt;
        const householdCode = `HH-${year}-${String(nextNum).padStart(3, '0')}`;
        const applicationId = `APP-${year}-${String(nextNum).padStart(3, '0')}`;

        const household = await storage.createHousehold(
          { ...householdData, householdCode, applicationId } as any,
          membersData
        );

        const fullHousehold = await storage.getHouseholdWithMembers(household.id);
        return res.json(fullHousehold);
      } catch (error: any) {
        const isUniqueViolation = error.message?.includes('unique') ||
                                   error.message?.includes('duplicate') ||
                                   error.code === '23505';

        if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
          continue;
        }

        return res.status(400).json({ error: error.message });
      }
    }
  });

  // Get all households
  app.get("/api/households", requireAuth, requirePermission("intake.view", "application.view"), async (req, res) => {
    try {
      let households = await storage.getAllHouseholds();
      const districtScope = getUserDistrictScope(req.user!);
      if (districtScope) {
        households = households.filter(h => h.district === districtScope);
      }
      res.json(households);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all households with members (for assessments workflow)
  app.get("/api/households-with-members", requireAuth, requirePermission("intake.view", "application.view", "assessment.view", "recommendation.view"), async (req, res) => {
    try {
      let householdsWithMembers = await storage.getAllHouseholdsWithMembers();
      const districtScope = getUserDistrictScope(req.user!);
      if (districtScope) {
        householdsWithMembers = householdsWithMembers.filter(item => item.household.district === districtScope);
      }
      res.json(householdsWithMembers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single household with members
  app.get("/api/households/:id", requireAuth, requirePermission("intake.view", "application.view", "assessment.view", "recommendation.view", "home_visit.view"), async (req, res) => {
    try {
      const household = await storage.getHouseholdWithMembers(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      const districtScope = getUserDistrictScope(req.user!);
      if (districtScope && household.household.district !== districtScope) {
        return res.status(403).json({ error: "Access denied: outside your assigned district" });
      }
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update household status
  app.patch("/api/households/:id/status", requireAuth, requirePermission("application.edit", "recommendation.create"), async (req, res) => {
    try {
      const districtScope = getUserDistrictScope(req.user!);
      if (districtScope) {
        const existing = await storage.getHousehold(req.params.id);
        if (existing && existing.district !== districtScope) {
          return res.status(403).json({ error: "Access denied: outside your assigned district" });
        }
      }
      const { status } = req.body;
      await storage.updateHouseholdStatus(req.params.id, status);
      const household = await storage.getHousehold(req.params.id);
      res.json(household);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update household with members
  app.put("/api/households/:id", requireAuth, requirePermission("application.edit", "intake.edit"), async (req, res) => {
    try {
      const householdId = req.params.id;
      const districtScope = getUserDistrictScope(req.user!);
      if (districtScope) {
        const existing = await storage.getHousehold(householdId);
        if (existing && existing.district !== districtScope) {
          return res.status(403).json({ error: "Access denied: outside your assigned district" });
        }
      }
      const householdData = req.body.household;
      const membersData = req.body.members || [];

      const updatedHousehold = await storage.updateHousehold(householdId, householdData, membersData);
      res.json(updatedHousehold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update home visit details
  app.put("/api/households/:id/home-visit", requireAuth, requirePermission("home_visit.view", "application.edit"), async (req, res) => {
    try {
      const householdId = req.params.id;

      const homeVisitSchema = z.object({
        householdDetails: z.object({
          roofType: z.string().optional().nullable(),
          wallType: z.string().optional().nullable(),
          householdAssetsList: z.array(z.string()).optional().nullable(),
          homeVisitNotes: z.string().optional().nullable(),
        }),
        members: z.array(insertHouseholdMemberSchema.omit({ householdId: true }).extend({
          id: z.string().optional(),
        })),
        complete: z.boolean().optional().default(false),
      });

      const validatedData = homeVisitSchema.parse(req.body);
      const { householdDetails, members, complete } = validatedData;

      const householdUpdate: any = {
        roofType: householdDetails.roofType || null,
        wallType: householdDetails.wallType || null,
        householdAssetsList: householdDetails.householdAssetsList ? JSON.stringify(householdDetails.householdAssetsList) : null,
        homeVisitNotes: householdDetails.homeVisitNotes || null,
        homeVisitStatus: complete ? 'completed' : 'pending',
        homeVisitDate: complete ? new Date() : null,
      };

      if (complete) {
        householdUpdate.programStatus = 'pending_assessment';
        householdUpdate.assessmentStep = 'social_worker';
      }

      const updatedHousehold = await storage.updateHousehold(householdId, householdUpdate, members);
      res.json(updatedHousehold);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Get related applications for a household
  app.get("/api/households/:id/related-applications", requireAuth, requirePermission("intake.view", "application.view"), async (req, res) => {
    try {
      const householdId = req.params.id;
      const currentHousehold = await storage.getHouseholdWithMembers(householdId);
      if (!currentHousehold) {
        return res.status(404).json({ error: "Household not found" });
      }

      const nationalIds = currentHousehold.members
        .filter(m => m.nationalId)
        .map(m => m.nationalId!.trim().toUpperCase());

      const nameDobPairs = currentHousehold.members
        .filter(m => m.firstName && m.lastName && m.dateOfBirth)
        .map(m => ({
          firstName: m.firstName.trim().toLowerCase(),
          lastName: m.lastName.trim().toLowerCase(),
          dateOfBirth: m.dateOfBirth instanceof Date ? m.dateOfBirth.toISOString().split('T')[0] : String(m.dateOfBirth),
        }));

      if (nationalIds.length === 0 && nameDobPairs.length === 0) {
        return res.json([]);
      }

      const relatedApplications = await storage.findRelatedApplications(householdId, nationalIds, nameDobPairs);
      res.json(relatedApplications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get prior home visit data for the applicant
  app.get("/api/households/:id/prior-home-visit", requireAuth, requirePermission("home_visit.view", "application.view"), async (req, res) => {
    try {
      const householdId = req.params.id;
      const currentHousehold = await storage.getHouseholdWithMembers(householdId);
      if (!currentHousehold) {
        return res.status(404).json({ error: "Household not found" });
      }

      const head = currentHousehold.members.find(m => m.isHead) || currentHousehold.members[0];
      if (!head) {
        return res.json({ found: false });
      }

      const nationalIds = head.nationalId ? [head.nationalId.trim().toUpperCase()] : [];
      const nameDobPairs = (head.firstName && head.lastName && head.dateOfBirth)
        ? [{
            firstName: head.firstName.trim().toLowerCase(),
            lastName: head.lastName.trim().toLowerCase(),
            dateOfBirth: head.dateOfBirth instanceof Date ? head.dateOfBirth.toISOString().split('T')[0] : String(head.dateOfBirth),
          }]
        : [];

      if (nationalIds.length === 0 && nameDobPairs.length === 0) {
        return res.json({ found: false });
      }

      const relatedApps = await storage.findRelatedApplications(householdId, nationalIds, nameDobPairs);

      const completedApps = relatedApps
        .filter(r => r.household.homeVisitStatus === 'completed')
        .sort((a: any, b: any) => {
          const dateA = a.household.homeVisitDate ? new Date(a.household.homeVisitDate).getTime() : 0;
          const dateB = b.household.homeVisitDate ? new Date(b.household.homeVisitDate).getTime() : 0;
          return dateB - dateA;
        });

      if (completedApps.length === 0) {
        return res.json({ found: false });
      }

      const priorHousehold = await storage.getHouseholdWithMembers(completedApps[0].household.id);
      if (!priorHousehold) {
        return res.json({ found: false });
      }

      res.json({
        found: true,
        sourceApplicationId: priorHousehold.household.applicationId || priorHousehold.household.householdCode,
        sourceHouseholdId: priorHousehold.household.id,
        household: priorHousehold.household,
        members: priorHousehold.members,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== REGISTRY LOOKUP =====

  // Check for duplicate National ID
  app.get("/api/registry/check-national-id/:nationalId", requireAuth, requirePermission("intake.create", "intake.view"), async (req, res) => {
    try {
      const nationalId = req.params.nationalId.trim();
      if (!nationalId || nationalId.length < 3) {
        return res.status(400).json({ error: "National ID must be at least 3 characters" });
      }

      const result = await storage.findMemberByNationalId(nationalId);

      if (result) {
        res.json({
          found: true,
          member: result.member,
          household: result.household,
          allMembers: result.allMembers
        });
      } else {
        res.json({ found: false });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search members by last name
  app.get("/api/registry/search-by-lastname/:lastName", requireAuth, requirePermission("intake.create", "intake.view"), async (req, res) => {
    try {
      const lastName = req.params.lastName.trim();
      if (!lastName || lastName.length < 2) {
        return res.status(400).json({ error: "Last name must be at least 2 characters" });
      }
      const results = await storage.findMembersByLastName(lastName);
      const matches = results.map(r => ({
        memberId: r.member.id,
        firstName: r.member.firstName,
        lastName: r.member.lastName,
        nationalId: r.member.nationalId,
        dateOfBirth: r.member.dateOfBirth,
        gender: r.member.gender,
        isHead: r.member.isHead,
        relationshipToHead: r.member.relationshipToHead,
        householdId: r.household.id,
        applicationId: r.household.applicationId || r.household.householdCode,
        programStatus: r.household.programStatus,
        requestPurpose: r.household.requestPurpose,
        district: r.household.district,
        village: r.household.village,
      }));
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== ASSESSMENTS =====

  // Create assessment
  app.post("/api/assessments", requireAuth, requirePermission("assessment.view", "recommendation.create"), async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.parse(req.body);

      const assessment = await storage.createAssessment(assessmentData);

      if (assessmentData.decision === 'eligible') {
        await storage.updateHouseholdStatus(assessmentData.householdId, 'enrolled');
      } else if (assessmentData.decision === 'ineligible') {
        await storage.updateHouseholdStatus(assessmentData.householdId, 'ineligible');
      }

      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get assessments for household
  app.get("/api/households/:householdId/assessments", requireAuth, requirePermission("assessment.view", "recommendation.view"), async (req, res) => {
    try {
      const assessments = await storage.getAssessmentsForHousehold(req.params.householdId);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== GRIEVANCES =====

  // Create grievance
  app.post("/api/grievances", requireAuth, requirePermission("intake.create", "application.create"), async (req, res) => {
    try {
      const grievanceData = insertGrievanceSchema.parse(req.body);

      const year = new Date().getFullYear();
      const allGrievances = await storage.getAllGrievances();
      const count = allGrievances.length + 1;
      const grievanceCode = `GR-${year}-${String(count).padStart(3, '0')}`;

      const grievance = await storage.createGrievance({
        ...grievanceData,
        grievanceCode
      });

      res.json(grievance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all grievances
  app.get("/api/grievances", requireAuth, requirePermission("intake.view", "application.view", "dashboard.view"), async (req, res) => {
    try {
      const grievances = await storage.getAllGrievances();
      res.json(grievances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update grievance status
  app.patch("/api/grievances/:id/status", requireAuth, requirePermission("intake.edit", "application.edit"), async (req, res) => {
    try {
      const { status, resolution } = req.body;
      await storage.updateGrievanceStatus(req.params.id, status, resolution);
      const grievance = await storage.getGrievance(req.params.id);
      res.json(grievance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== PAYMENTS =====

  // Create payment
  app.post("/api/payments", requireAuth, requirePermission("payment.create"), async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);

      const year = new Date().getFullYear();
      const allPayments = await storage.getAllPayments();
      const count = allPayments.length + 1;
      const paymentCode = `PAY-${year}-${String(count).padStart(3, '0')}`;

      const payment = await storage.createPayment({
        ...paymentData,
        paymentCode
      });

      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all payments
  app.get("/api/payments", requireAuth, requirePermission("payment.view", "dashboard.view"), async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get payments for household
  app.get("/api/households/:householdId/payments", requireAuth, requirePermission("payment.view"), async (req, res) => {
    try {
      const payments = await storage.getPaymentsForHousehold(req.params.householdId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update payment status
  app.patch("/api/payments/:id/status", requireAuth, requirePermission("payment.edit"), async (req, res) => {
    try {
      const { status, disbursementDate } = req.body;
      await storage.updatePaymentStatus(
        req.params.id,
        status,
        disbursementDate ? new Date(disbursementDate) : undefined
      );
      const payment = await storage.getAllPayments();
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== CASE ACTIVITIES =====

  // Create case activity
  app.post("/api/case-activities", requireAuth, requirePermission("application.edit", "intake.edit"), async (req, res) => {
    try {
      const activityData = insertCaseActivitySchema.parse(req.body);
      const activity = await storage.createCaseActivity(activityData);
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get case activities for household
  app.get("/api/households/:householdId/activities", requireAuth, requirePermission("application.view", "intake.view"), async (req, res) => {
    try {
      const activities = await storage.getCaseActivitiesForHousehold(req.params.householdId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== USERS =====

  // Get all users with roles
  app.get("/api/users", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const users = await storage.getUsersWithRoles();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single user
  app.get("/api/users/:id", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create user
  app.post("/api/users", requireAuth, requirePermission("admin.create"), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user
  app.patch("/api/users/:id", requireAuth, requirePermission("admin.edit"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAuth, requirePermission("admin.delete"), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== ACTIVE SESSIONS =====

  app.get("/api/admin/active-sessions", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/active-sessions/:sid", requireAuth, requirePermission("admin.delete"), async (req, res) => {
    try {
      await storage.deleteSession(req.params.sid);
      res.json({ message: "Session terminated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== ROLES & PERMISSIONS =====

  // Seed roles and permissions (admin only)
  app.post("/api/admin/seed-roles", requireAuth, requirePermission("admin.create"), async (req, res) => {
    try {
      await storage.seedRolesAndPermissions();
      const roles = await storage.getAllRoles();
      res.json({ message: "Roles and permissions seeded successfully", roles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all roles
  app.get("/api/roles", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single role with permissions
  app.get("/api/roles/:id", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json({ ...role, permissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create role
  app.post("/api/roles", requireAuth, requirePermission("admin.create"), async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update role
  app.patch("/api/roles/:id", requireAuth, requirePermission("admin.edit"), async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      if (role.isSystemRole) {
        return res.status(403).json({ error: "Cannot modify system roles" });
      }
      const updatedRole = await storage.updateRole(req.params.id, req.body);
      res.json(updatedRole);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete role
  app.delete("/api/roles/:id", requireAuth, requirePermission("admin.delete"), async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      if (role.isSystemRole) {
        return res.status(403).json({ error: "Cannot delete system roles" });
      }
      await storage.deleteRole(req.params.id);
      res.json({ message: "Role deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all permissions
  app.get("/api/permissions", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set role permissions
  app.put("/api/roles/:id/permissions", requireAuth, requirePermission("admin.edit"), async (req, res) => {
    try {
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ error: "permissionIds must be an array" });
      }
      await storage.setRolePermissions(req.params.id, permissionIds);
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get role permissions
  app.get("/api/roles/:id/permissions", requireAuth, requirePermission("admin.view"), async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== WORKFLOW HISTORY =====

  // Create workflow history entry
  app.post("/api/workflow-history", requireAuth, requirePermission("recommendation.create"), async (req, res) => {
    try {
      const historyData = insertWorkflowHistorySchema.parse(req.body);
      const history = await storage.createWorkflowHistory(historyData);
      res.status(201).json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get workflow history for a household
  app.get("/api/workflow-history/household/:householdId", requireAuth, requirePermission("assessment.view", "recommendation.view"), async (req, res) => {
    try {
      const history = await storage.getWorkflowHistoryForHousehold(req.params.householdId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current cycle number for a household
  app.get("/api/workflow-history/household/:householdId/cycle", requireAuth, requirePermission("assessment.view", "recommendation.view"), async (req, res) => {
    try {
      const cycleNumber = await storage.getCurrentCycleNumber(req.params.householdId);
      res.json({ cycleNumber });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Atomic workflow progression
  app.post("/api/workflow-progress/:householdId", requireAuth, requirePermission("recommendation.create"), async (req, res) => {
    try {
      const { householdId } = req.params;
      const { step, decision, comments, nextStep, householdUpdate } = req.body;

      const validSteps = ['coordinator', 'director', 'permanent_secretary', 'minister'];
      const validDecisions = ['agree', 'disagree', 'requires_further_info'];

      if (!validSteps.includes(step)) {
        return res.status(400).json({ error: `Invalid step: ${step}. Must be one of: ${validSteps.join(', ')}` });
      }
      if (!validDecisions.includes(decision)) {
        return res.status(400).json({ error: `Invalid decision: ${decision}. Must be one of: ${validDecisions.join(', ')}` });
      }

      const updatedHousehold = await storage.progressWorkflow(
        householdId,
        step,
        decision,
        comments || null,
        nextStep,
        householdUpdate || {}
      );

      res.json(updatedHousehold);
    } catch (error: any) {
      if (error.message === "Household not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Atomic resubmission
  app.post("/api/workflow-resubmit/:householdId", requireAuth, requirePermission("recommendation.create"), async (req, res) => {
    try {
      const { householdId } = req.params;
      const { householdData } = req.body;

      const updatedHousehold = await storage.resubmitToCoordinator(
        householdId,
        householdData || {}
      );

      res.json(updatedHousehold);
    } catch (error: any) {
      if (error.message === "Household not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Health check endpoint (public)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      publicUrl: process.env.PUBLIC_URL || "http://localhost:5000"
    });
  });

  return httpServer;
}
