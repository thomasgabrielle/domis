import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { households, householdMembers } from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle({ client: pool });

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
  
  let totalMembers = 0;
  let householdCount = 0;
  
  // We want approximately 100 applicants, so we'll create ~25-30 households with 3-4 members each
  const targetApplicants = 100;
  
  while (totalMembers < targetApplicants) {
    householdCount++;
    const year = 2024;
    const householdCode = `HH-${year}-${String(householdCount).padStart(3, '0')}`;
    
    const province = randomElement(provinces);
    const district = randomElement(districts[province]);
    const village = randomElement(villages);
    const status = randomElement(statuses);
    
    // Create household
    const [household] = await db.insert(households).values({
      householdCode,
      province,
      district,
      village,
      gpsCoordinates: generateGPS(province),
      programStatus: status,
      registrationDate: randomDate(new Date(2024, 0, 1), new Date()),
      enrollmentDate: status === "enrolled" ? randomDate(new Date(2024, 3, 1), new Date()) : null,
    }).returning();
    
    console.log(`Created household: ${householdCode}`);
    
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
      });
      
      totalMembers++;
    }
  }
  
  console.log(`\nSeed complete!`);
  console.log(`Created ${householdCount} households with ${totalMembers} total applicants.`);
  
  await pool.end();
  process.exit(0);
}

seedData().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
