import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHouseholdSchema, 
  insertHouseholdMemberSchema,
  insertAssessmentSchema,
  insertGrievanceSchema,
  insertPaymentSchema,
  insertCaseActivitySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== HOUSEHOLDS =====
  
  // Create household with members
  app.post("/api/households", async (req, res) => {
    try {
      const householdData = insertHouseholdSchema.parse(req.body.household);
      const membersData = z.array(insertHouseholdMemberSchema).parse(req.body.members || []);
      
      // Generate household code (HH-YYYY-XXX format)
      const year = new Date().getFullYear();
      const allHouseholds = await storage.getAllHouseholds();
      const count = allHouseholds.length + 1;
      const householdCode = `HH-${year}-${String(count).padStart(3, '0')}`;
      
      const household = await storage.createHousehold(
        { ...householdData, householdCode },
        membersData
      );
      
      const fullHousehold = await storage.getHouseholdWithMembers(household.id);
      res.json(fullHousehold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

  return httpServer;
}
