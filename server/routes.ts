import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHouseholdSchema, 
  insertHouseholdMemberSchema,
  insertAssessmentSchema,
  insertGrievanceSchema,
  insertPaymentSchema,
  insertCaseActivitySchema,
  insertRoleSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== HOUSEHOLDS =====
  
  // Create household with members
  app.post("/api/households", async (req, res) => {
    const MAX_RETRIES = 3;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const householdData = insertHouseholdSchema.parse(req.body.household);
        const membersData = z.array(insertHouseholdMemberSchema).parse(req.body.members || []);
        
        // Generate household code (HH-YYYY-XXX format) and application ID (APP-YYYY-XXX format)
        // Use MAX-based approach to handle deletions and ensure uniqueness
        const year = new Date().getFullYear();
        const allHouseholds = await storage.getAllHouseholds();
        
        // Extract the highest number from existing codes for the current year
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
        
        // Add attempt offset to handle concurrent creation collisions
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
        // Check if this is a unique constraint violation (retry)
        const isUniqueViolation = error.message?.includes('unique') || 
                                   error.message?.includes('duplicate') ||
                                   error.code === '23505';
        
        if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
          continue; // Retry with incremented attempt offset
        }
        
        return res.status(400).json({ error: error.message });
      }
    }
  });

  // Get all households
  app.get("/api/households", async (req, res) => {
    try {
      const households = await storage.getAllHouseholds();
      res.json(households);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single household with members
  app.get("/api/households/:id", async (req, res) => {
    try {
      const household = await storage.getHouseholdWithMembers(req.params.id);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json(household);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update household status
  app.patch("/api/households/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateHouseholdStatus(req.params.id, status);
      const household = await storage.getHousehold(req.params.id);
      res.json(household);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update household with members
  app.put("/api/households/:id", async (req, res) => {
    try {
      const householdId = req.params.id;
      const householdData = req.body.household;
      const membersData = req.body.members || [];
      
      const updatedHousehold = await storage.updateHousehold(householdId, householdData, membersData);
      res.json(updatedHousehold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== REGISTRY LOOKUP =====
  
  // Check for duplicate National ID
  app.get("/api/registry/check-national-id/:nationalId", async (req, res) => {
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

  // ===== ASSESSMENTS =====
  
  // Create assessment
  app.post("/api/assessments", async (req, res) => {
    try {
      const assessmentData = insertAssessmentSchema.parse(req.body);
      
      const assessment = await storage.createAssessment(assessmentData);
      
      // Update household status based on decision
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
  app.get("/api/households/:householdId/assessments", async (req, res) => {
    try {
      const assessments = await storage.getAssessmentsForHousehold(req.params.householdId);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== GRIEVANCES =====
  
  // Create grievance
  app.post("/api/grievances", async (req, res) => {
    try {
      const grievanceData = insertGrievanceSchema.parse(req.body);
      
      // Generate grievance code (GR-YYYY-XXX format)
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
  app.get("/api/grievances", async (req, res) => {
    try {
      const grievances = await storage.getAllGrievances();
      res.json(grievances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update grievance status
  app.patch("/api/grievances/:id/status", async (req, res) => {
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
  app.post("/api/payments", async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      
      // Generate payment code (PAY-YYYY-XXX format)
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
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get payments for household
  app.get("/api/households/:householdId/payments", async (req, res) => {
    try {
      const payments = await storage.getPaymentsForHousehold(req.params.householdId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update payment status
  app.patch("/api/payments/:id/status", async (req, res) => {
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
  app.post("/api/case-activities", async (req, res) => {
    try {
      const activityData = insertCaseActivitySchema.parse(req.body);
      const activity = await storage.createCaseActivity(activityData);
      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get case activities for household
  app.get("/api/households/:householdId/activities", async (req, res) => {
    try {
      const activities = await storage.getCaseActivitiesForHousehold(req.params.householdId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== USERS =====
  
  // Get all users with roles
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsersWithRoles();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single user
  app.get("/api/users/:id", async (req, res) => {
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
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
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
  app.delete("/api/users/:id", async (req, res) => {
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

  // ===== ROLES & PERMISSIONS =====
  
  // Seed roles and permissions (call once to initialize)
  app.post("/api/admin/seed-roles", async (req, res) => {
    try {
      await storage.seedRolesAndPermissions();
      const roles = await storage.getAllRoles();
      res.json({ message: "Roles and permissions seeded successfully", roles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single role with permissions
  app.get("/api/roles/:id", async (req, res) => {
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
  app.post("/api/roles", async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update role
  app.patch("/api/roles/:id", async (req, res) => {
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
  app.delete("/api/roles/:id", async (req, res) => {
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
  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getAllPermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set role permissions
  app.put("/api/roles/:id/permissions", async (req, res) => {
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
  app.get("/api/roles/:id/permissions", async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
