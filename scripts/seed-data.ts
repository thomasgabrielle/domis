import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { 
  households, 
  householdMembers, 
  users, 
  assessments, 
  grievances, 
  payments, 
  programs,
  caseActivities,
  workflowHistory 
} from "../shared/schema";

// Create pool using the same driver as the server
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false } // Allow mismatched certificates
});

const db = drizzle(pool);

// Random data arrays
const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
  "Timothy", "Deborah", "Ronald", "Stephanie", "Edward", "Rebecca", "Jason", "Sharon",
  "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
  "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
];

const provinces = ["Central Province", "Eastern Province", "Western Province", "Northern Province"];

const districts: Record<string, string[]> = {
  "Central Province": ["Capital District", "River District", "Highland District"],
  "Eastern Province": ["Coastal District", "Valley District", "Lake District"],
  "Western Province": ["Mountain District", "Plains District", "Forest District"],
  "Northern Province": ["Border District", "Savanna District", "Desert District"]
};

const villages = [
  "Riverside", "Greenfield", "Hillcrest", "Meadowbrook", "Lakeside", "Sunnyvale",
  "Pinewood", "Oakdale", "Maplewood", "Cedarview", "Fairview", "Springdale",
  "Brookside", "Clearwater", "Silverdale", "Woodlands", "Stonebridge", "Willowbrook",
  "Northgate", "Southpoint", "Eastwood", "Westfield", "Harmony", "Unity", "Progress",
  "New Hope", "Freedom", "Victory", "Prosperity", "Sunrise", "Sunset", "Horizon"
];

const statuses = ["pending_assessment", "enrolled", "ineligible"];
const genders = ["male", "female"];
const relationships = ["spouse", "child", "parent", "sibling", "other"];

// Additional random data arrays for forms
const housingTypes = ["brick_cement", "mud_brick", "timber", "mixed"];
const roofTypes = ["corrugated_iron", "tiles", "thatch", "asbestos"];
const wallTypes = ["cement_block", "brick", "timber", "mud"];
const incomeSources = ["farming", "business", "employment", "casual_labor", "pension", "remittances"];
const assessmentDecisions = ["eligible", "ineligible", "requires_further_assessment"];
const grievanceCategories = ["payment_issue", "procedural_error", "data_error", "service_quality", "other"];
const grievancePriorities = ["low", "medium", "high", "critical"];
const grievanceStatuses = ["open", "in_progress", "resolved", "closed"];
const paymentStatuses = ["pending", "disbursed", "failed", "cancelled"];
const paymentProviders = ["airtel_money", "mtn_mobile_money", "vodafone_cash", "bank_transfer"];
const programNames = [
  "Social Cash Transfer", "Food Assistance Program", "Education Support", 
  "Health & Nutrition", "Livelihood Development", "Emergency Relief", "Community Support"
];
const activityTypes = ["assessment", "home_visit", "case_review", "follow_up", "referral", "documentation"];
const departments = ["Social Development", "Case Management", "Finance", "Administration", "Field Operations"];

// Additional data for household details
const outreachTypes = ["self_referral", "community_health_worker", "social_worker", "local_government", "ngos"];
const outreachMethods = ["door_to_door", "community_meeting", "telephone", "email", "walk_in"];
const requestPurposes = ["food_assistance", "household_support", "education", "health", "emergency_relief", "livelihood"];
const householdAssets = [
  "Television, Radio",
  "Mobile phone, Bicycle",
  "Goat, Chicken",
  "Small shop equipment",
  "None",
  "Land plot 0.5 hectare",
  "Motorcycle, Mobile phone",
  "Refrigerator, Solar panels",
  "Farming tools, Seeds",
  "Bicycle, Cooking utensils"
];
const complementaryProgramsList = [
  "Financial literacy training",
  "Business development training",
  "Health and nutrition education",
  "Education support program",
  "Agricultural training",
  "Psychosocial support services",
  "Skills development program"
];
const proxyReasons = [
  "Beneficiary ill and unable to respond",
  "Beneficiary traveling for work",
  "Beneficiary elderly with mobility issues",
  "Beneficiary disabled",
  "Cultural practice"
];
const proxyRoles = ["spouse", "adult_child", "parent", "sibling", "caregiver"];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateNationalId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}${number}`;
}

function generateGPS(province: string): string {
  let baseLat = -1.5;
  let baseLng = 29.5;
  
  if (province === "Eastern Province") { baseLng += 1; }
  if (province === "Western Province") { baseLng -= 1; }
  if (province === "Northern Province") { baseLat += 1; }
  
  const lat = baseLat + (Math.random() - 0.5) * 2;
  const lng = baseLng + (Math.random() - 0.5) * 2;
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

async function seedData() {
  console.log("Starting seed process...");
  
  try {
    // Step 1: Create users (case workers, assessors, coordinators)
    console.log("\n📝 Creating users...");
    const userIds: string[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < 10; i++) {
      try {
        const [user] = await db.insert(users).values({
          username: `user_${i + 1}_${timestamp}`,
          password: "hashed_password",
          fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
          email: `user${i + 1}_${timestamp}@domsis.gov`,
          role: Math.random() > 0.5 ? "case_worker" : "assessor",
          department: randomElement(departments),
          status: "active",
        }).returning();
        userIds.push(user.id);
      } catch (e) {
        // Skip if user already exists
        console.log(`  Skipping duplicate user...`);
      }
    }
    console.log(`✅ Created ${userIds.length} users`);

    // Step 2: Create programs
    console.log("\n📝 Creating programs...");
    const programIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const [program] = await db.insert(programs).values({
        name: programNames[i],
        description: `Program for ${programNames[i].toLowerCase()}`,
        status: "active",
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2025, 11, 31),
        benefitAmount: (Math.floor(Math.random() * 100) + 50) * 1000,
      }).returning();
      programIds.push(program.id);
    }
    console.log(`✅ Created ${programIds.length} programs`);

    // Step 3: Create households and members
    console.log("\n📝 Creating households and members...");
    let totalMembers = 0;
    let householdCount = 0;
    const householdIds: string[] = [];
    
    const targetHouseholds = 50;
    const seedTimestamp = Date.now();
    
    for (let h = 0; h < targetHouseholds; h++) {
      householdCount++;
      const year = 2024;
      const householdCode = `HH-${year}-${String(householdCount).padStart(3, '0')}-${seedTimestamp.toString().slice(-4)}`;
      
      const province = randomElement(provinces);
      const district = randomElement(districts[province]);
      const village = randomElement(villages);
      const status = randomElement(statuses);
      
      // Randomize workflow progress
      const homeVisitProgress = Math.random();
      let homeVisitStatus: string;
      let homeVisitDate: Date | null = null;
      let homeVisitNotes: string | null = null;
      let assessmentStep: string | null = null;
      let coordinatorDecision: string | null = null;
      let directorDecision: string | null = null;
      
      if (homeVisitProgress < 0.3) {
        // Pending home visit (30%)
        homeVisitStatus = "pending";
      } else if (homeVisitProgress < 0.6) {
        // Completed home visit (30%)
        homeVisitStatus = "completed";
        homeVisitDate = randomDate(new Date(2024, 3, 1), new Date());
        homeVisitNotes = "Home visit completed. Household conditions assessed. Family cooperative during assessment.";
      } else if (homeVisitProgress < 0.8) {
        // In assessment phase (20%)
        homeVisitStatus = "completed";
        homeVisitDate = randomDate(new Date(2024, 1, 1), new Date(2024, 9, 30));
        homeVisitNotes = "Home visit completed. All members present and interviewed.";
        assessmentStep = "coordinator";
        coordinatorDecision = Math.random() > 0.5 ? "agree" : "requires_further_info";
      } else {
        // Advanced workflow (20%)
        homeVisitStatus = "completed";
        homeVisitDate = randomDate(new Date(2023, 6, 1), new Date(2024, 9, 30));
        homeVisitNotes = "Comprehensive home assessment conducted. Recommendations documented.";
        assessmentStep = Math.random() > 0.6 ? "director" : "coordinator";
        coordinatorDecision = "agree";
        directorDecision = Math.random() > 0.5 ? "agree" : "disagree";
      }
      
      // Randomize proxy data (only for ~35% of households)
      const hasProxy = Math.random() < 0.35;
      let proxyFirstName: string | null = null;
      let proxyLastName: string | null = null;
      let proxyGender: string | null = null;
      let proxyAddress: string | null = null;
      let proxyPhone: string | null = null;
      let proxyReason: string | null = null;
      let proxyRelationship: string | null = null;
      
      if (hasProxy) {
        proxyFirstName = randomElement(firstNames);
        proxyLastName = randomElement(lastNames);
        proxyGender = randomElement(genders);
        proxyAddress = `${randomElement(villages)}, ${district}`;
        proxyPhone = `+1${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`;
        proxyReason = randomElement(proxyReasons);
        proxyRelationship = randomElement(proxyRoles);
      }
      
      // Household assets and details
      const intakeDate = randomDate(new Date(2024, 0, 1), new Date());
      const vulnerabilityScore = Math.floor(Math.random() * 100);
      const hasRecommendation = homeVisitStatus === "completed" && Math.random() > 0.3;
      
      // Create household
      const [household] = await db.insert(households).values({
        householdCode,        applicationId: `APP-${householdCode}`,        province,
        district,
        village,
        gpsCoordinates: generateGPS(province),
        programStatus: status,
        registrationDate: randomDate(new Date(2024, 0, 1), new Date()),
        enrollmentDate: status === "enrolled" ? randomDate(new Date(2024, 3, 1), new Date()) : null,
        assignedSocialWorkerId: randomElement(userIds),
        createdBy: randomElement(userIds),
        // Intake information
        intakeDate,
        outreachType: randomElement(outreachTypes),
        outreachMethod: randomElement(outreachMethods),
        isOnOwnBehalf: !hasProxy,
        requestPurpose: randomElement(requestPurposes),
        actionTaken: "Application processed and registered in system",
        followUpNotes: Math.random() > 0.5 ? "Follow-up required after home visit" : null,
        // Proxy information
        proxyFirstName,
        proxyLastName,
        proxyGender,
        proxyAddress,
        proxyPhone,
        proxyNationalId: proxyFirstName ? generateNationalId() : null,
        proxyReason,
        proxyRelationship,
        proxyRole: proxyRelationship ? "informant" : null,
        // Household details
        roofType: randomElement(roofTypes),
        wallType: randomElement(wallTypes),
        householdAssetsList: randomElement(householdAssets),
        householdAssets: randomElement(householdAssets),
        // Assessment
        vulnerabilityScore,
        lastAssessmentDate: homeVisitStatus === "completed" ? homeVisitDate : null,
        assessmentNotes: homeVisitStatus === "completed" ? "Household assessed for vulnerability indicators including income, assets, and access to services." : null,
        // Recommendations
        recommendation: hasRecommendation ? randomElement(["agree", "disagree", "requires_further_info"]) : null,
        amountAllocation: hasRecommendation ? (Math.random() * 200000 + 50000).toString() : null,
        durationMonths: hasRecommendation ? Math.floor(Math.random() * 6) + 3 : null,
        transferModality: hasRecommendation ? randomElement(["cash", "phone", "vcc"]) : null,
        complementaryActivities: hasRecommendation ? randomElement(complementaryProgramsList) : null,
        recommendationComments: hasRecommendation ? "Household meets eligibility criteria for support program" : null,
        // Workflow fields
        homeVisitStatus,
        homeVisitDate,
        homeVisitNotes,
        assessmentStep,
        coordinatorDecision,
        coordinatorComments: coordinatorDecision ? `Assessment review completed. Decision: ${coordinatorDecision}.` : null,
        directorDecision,
        directorComments: directorDecision ? `Reviewed by director. Decision: ${directorDecision}.` : null,
      }).returning();
      
      householdIds.push(household.id);
      
      // Create 2-5 members per household
      const memberCount = Math.floor(Math.random() * 4) + 2;
      const familyLastName = randomElement(lastNames);
      
      for (let i = 0; i < memberCount; i++) {
        const isHead = i === 0;
        const gender = randomElement(genders);
        
        let relationship = "head";
        let ageRange = { min: 25, max: 65 };
        
        if (!isHead) {
          relationship = randomElement(relationships);
          if (relationship === "child") {
            ageRange = { min: 1, max: 25 };
          } else if (relationship === "parent") {
            ageRange = { min: 50, max: 85 };
          } else {
            ageRange = { min: 18, max: 70 };
          }
        }
        
        const birthYear = new Date().getFullYear() - Math.floor(Math.random() * (ageRange.max - ageRange.min) + ageRange.min);
        const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        await db.insert(householdMembers).values({
          householdId: household.id,
          firstName: randomElement(firstNames),
          lastName: familyLastName,
          dateOfBirth,
          gender,
          relationshipToHead: relationship,
          nationalId: Math.random() > 0.3 ? generateNationalId() : null,
          disabilityStatus: Math.random() < 0.1,
          isHead,
          maritalStatus: Math.random() > 0.5 ? "married" : "single",
          educationLevel: Math.random() > 0.7 ? "primary" : "secondary",
          monthlyIncome: Math.random() > 0.6 ? ((Math.random() * 500000) + 50000).toString() : null,
        });
        
        totalMembers++;
      }
    }
    console.log(`✅ Created ${householdCount} households with ${totalMembers} members`);

    // Step 4: Create 50 assessments linked to households
    console.log("\n📝 Creating 50 assessments...");
    for (let i = 0; i < Math.min(50, householdIds.length); i++) {
      const householdId = householdIds[i % householdIds.length];
      const rawScore = Math.floor(Math.random() * 100);
      const adjustedScore = Math.max(0, Math.min(100, rawScore + Math.floor((Math.random() - 0.5) * 20)));
      
      await db.insert(assessments).values({
        householdId,
        assessmentType: Math.random() > 0.5 ? "manual" : "automated",
        assessmentDate: randomDate(new Date(2024, 0, 1), new Date()),
        assessedBy: randomElement(userIds),
        rawScore,
        adjustedScore,
        decision: adjustedScore >= 60 ? "eligible" : adjustedScore >= 40 ? "requires_further_assessment" : "ineligible",
        justification: `Assessment conducted based on household vulnerability indicators and asset evaluation.`,
        housingType: randomElement(housingTypes),
        incomeSource: randomElement(incomeSources),
        notes: `Household assessed for program eligibility.`,
      });
    }
    console.log(`✅ Created 50 assessments`);

    // Step 5: Create 50 grievances linked to households
    console.log("\n📝 Creating 50 grievances...");
    const grievanceTimestamp = Date.now();
    for (let i = 0; i < Math.min(50, householdIds.length); i++) {
      const householdId = householdIds[i % householdIds.length];
      const grievanceCode = `GRV-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}-${grievanceTimestamp.toString().slice(-4)}`;
      const status = Math.random() > 0.6 ? "resolved" : Math.random() > 0.3 ? "in_progress" : "open";
      
      await db.insert(grievances).values({
        grievanceCode,
        householdId,
        dateFiled: randomDate(new Date(2024, 0, 1), new Date()),
        category: randomElement(grievanceCategories),
        description: `Grievance regarding program delivery and support services.`,
        status,
        priority: randomElement(grievancePriorities),
        assignedTo: randomElement(userIds),
        resolution: status === "resolved" ? "Issue was resolved satisfactorily." : null,
        resolvedDate: status === "resolved" ? randomDate(new Date(2024, 6, 1), new Date()) : null,
        filedBy: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        contactInfo: `+1${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
      });
    }
    console.log(`✅ Created 50 grievances`);

    // Step 6: Create 50 payments linked to households and programs
    console.log("\n📝 Creating 50 payments...");
    const paymentTimestamp = Date.now();
    for (let i = 0; i < Math.min(50, householdIds.length); i++) {
      const householdId = householdIds[i % householdIds.length];
      const paymentCode = `PAY-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}-${paymentTimestamp.toString().slice(-4)}`;
      const amount = Math.floor(Math.random() * 500000) + 50000;
      const paymentStatus = Math.random() > 0.2 ? "disbursed" : Math.random() > 0.5 ? "pending" : "failed";
      
      await db.insert(payments).values({
        paymentCode,
        householdId,
        amount: amount.toString(),
        cycle: `Cycle ${Math.floor(Math.random() * 4) + 1}`,
        programId: randomElement(programIds),
        status: paymentStatus,
        provider: randomElement(paymentProviders),
        disbursementDate: paymentStatus === "disbursed" ? randomDate(new Date(2024, 3, 1), new Date()) : null,
        transactionRef: paymentStatus === "disbursed" ? `TXN${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}` : null,
        failureReason: paymentStatus === "failed" ? "Mobile money service temporarily unavailable" : null,
      });
    }
    console.log(`✅ Created 50 payments`);

    // Step 7: Create 50 case activities linked to households
    console.log("\n📝 Creating 50 case activities...");
    for (let i = 0; i < Math.min(50, householdIds.length); i++) {
      const householdId = householdIds[i % householdIds.length];
      
      await db.insert(caseActivities).values({
        householdId,
        activityType: randomElement(activityTypes),
        activityDate: randomDate(new Date(2024, 0, 1), new Date()),
        description: `Comprehensive case activity documenting household progress and service delivery.`,
        performedBy: randomElement(userIds),
      });
    }
    console.log(`✅ Created 50 case activities`);

    // Step 8: Create workflow history entries for advanced cases
    console.log("\n📝 Creating workflow history entries...");
    const workflowHouseholds = householdIds.slice(0, Math.min(30, householdIds.length));
    for (let i = 0; i < workflowHouseholds.length; i++) {
      const householdId = workflowHouseholds[i];
      
      // Create coordinator-level decision
      if (Math.random() > 0.3) {
        await db.insert(workflowHistory).values({
          householdId,
          step: "coordinator",
          cycleNumber: 1,
          decision: Math.random() > 0.3 ? "agree" : "requires_further_info",
          comments: "Initial coordinator review completed.",
          recommendation: "eligible",
          amountAllocation: (Math.random() * 200000 + 50000).toString(),
          durationMonths: Math.floor(Math.random() * 6) + 3,
          transferModality: "cash",
          complementaryActivities: "Financial literacy training provided",
          reviewedBy: randomElement(userIds),
        });
      }
      
      // Create director-level decision for some
      if (Math.random() > 0.6) {
        await db.insert(workflowHistory).values({
          householdId,
          step: "director",
          cycleNumber: 1,
          decision: Math.random() > 0.4 ? "agree" : "disagree",
          comments: "Director-level review completed with recommendations.",
          recommendation: "eligible",
          amountAllocation: (Math.random() * 200000 + 50000).toString(),
          durationMonths: Math.floor(Math.random() * 6) + 3,
          transferModality: "phone",
          complementaryActivities: "Business training and support group participation",
          reviewedBy: randomElement(userIds),
        });
      }
    }
    console.log(`✅ Created workflow history entries`);

    console.log(`\n✨ Seed complete!`);
    console.log(`\nSummary:`);
    console.log(`  - ${userIds.length} Users`);
    console.log(`  - ${programIds.length} Programs`);
    console.log(`  - ${householdCount} Households with ${totalMembers} Members`);
    console.log(`  - 50 Assessments`);
    console.log(`  - 50 Grievances`);
    console.log(`  - 50 Payments`);
    console.log(`  - 50 Case Activities`);
    console.log(`  - Workflow history entries for progression tracking`);
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedData().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
