export type HouseholdMember = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  relationshipToHead: 'Head' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  disabilityStatus: boolean;
  nationalId?: string;
};

export type Household = {
  id: string;
  registrationDate: string;
  headOfHousehold: HouseholdMember;
  members: HouseholdMember[];
  address: {
    province: string;
    district: string;
    village: string;
    gpsCoordinates?: string;
  };
  vulnerabilityScore: number; // 0-100
  programStatus: {
    pap: 'Enrolled' | 'Eligible' | 'Pending Assessment' | 'Ineligible' | 'Suspended';
    emergencySupport?: 'Active' | 'Inactive';
  };
  lastAssessmentDate: string;
  assignedSocialWorker?: string;
};

export type Grievance = {
  id: string;
  householdId: string;
  dateFiled: string;
  category: 'Exclusion' | 'Payment Issue' | 'Service Quality' | 'Corruption' | 'Other';
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  description: string;
  resolution?: string;
};

export type Payment = {
  id: string;
  householdId: string;
  amount: number;
  cycle: string; // e.g., "Jan 2025"
  status: 'Paid' | 'Pending' | 'Failed';
  disbursementDate?: string;
  provider: 'Mobile Money' | 'Bank Transfer' | 'Cash';
};

// Helper function to generate mock data
function generateMockHouseholds(): Household[] {
  const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
  ];

  const provinces = ["Central", "Eastern", "Western", "Northern"];
  const districts: Record<string, string[]> = {
    "Central": ["Capital", "Highland", "River"],
    "Eastern": ["Coastal", "Valley", "Lake"],
    "Western": ["Mountain", "Plains", "Forest"],
    "Northern": ["Border", "Savanna", "Desert"]
  };
  const villages = [
    "Riverside", "Greenfield", "Hillcrest", "Meadowbrook", "Lakeside", "Sunnyvale",
    "Pinewood", "Oakdale", "Maplewood", "Cedarview", "Fairview", "Springdale",
    "Brookside", "Clearwater", "Silverdale", "Woodlands", "Stonebridge", "Willowbrook",
    "Northgate", "Southpoint", "Eastwood", "Westfield", "Harmony", "Unity", "Prosperity",
    "New Hope", "Freedom", "Victory", "Sunrise", "Sunset", "Horizon", "Parkside",
    "Fieldview", "Milestone", "Crossroad", "Hillfarm", "Orchard", "Willowcrest",
    "Sunnyfield", "Meadowside", "Creekside", "Windfield", "Stonecrest", "Riverpoint",
    "Blackacre", "Wheatfield", "Wildflower", "Oakridge", "Pinecraft"
  ];

  const statuses: Array<'Enrolled' | 'Eligible' | 'Pending Assessment' | 'Ineligible' | 'Suspended'> = ['Enrolled', 'Eligible', 'Pending Assessment', 'Ineligible'];
  const genders: Array<'Male' | 'Female'> = ['Male', 'Female'];
  const relationships: Array<'Head' | 'Spouse' | 'Child' | 'Parent' | 'Other'> = ['Spouse', 'Child', 'Parent', 'Other'];
  const workers = ["David K.", "Alice M.", "Robert S.", "Catherine P.", "James L.", "Maria G.", "Peter W.", "Susan T."];

  function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomDate(start: Date, end: Date): string {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  function generateNationalId(): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `ID-${prefix}${number}`;
  }

  const households: Household[] = [];

  for (let h = 1; h <= 50; h++) {
    const year = 2024;
    const householdId = `HH-${year}-${String(h).padStart(3, '0')}`;
    
    const province = randomElement(provinces);
    const district = randomElement(districts[province]);
    const village = randomElement(villages);
    const status = randomElement(statuses);
    const registrationDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));
    
    // Create household head
    const headGender = randomElement(genders);
    const familyLastName = randomElement(lastNames);
    const headBirthYear = new Date().getFullYear() - Math.floor(Math.random() * 40 + 25);
    const headDateOfBirth = new Date(headBirthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];

    const headOfHousehold: HouseholdMember = {
      id: `MEM-${h * 10}`,
      firstName: randomElement(firstNames),
      lastName: familyLastName,
      dateOfBirth: headDateOfBirth,
      gender: headGender,
      relationshipToHead: 'Head',
      disabilityStatus: Math.random() < 0.15,
      nationalId: Math.random() > 0.2 ? generateNationalId() : undefined
    };

    // Create family members (2-5 per household)
    const memberCount = Math.floor(Math.random() * 4) + 2;
    const members: HouseholdMember[] = [];

    for (let m = 0; m < memberCount; m++) {
      const memberGender = randomElement(genders);
      let relationship = randomElement(relationships);
      let birthYear = new Date().getFullYear() - 30;

      if (relationship === 'Child') {
        birthYear = new Date().getFullYear() - Math.floor(Math.random() * 25);
      } else if (relationship === 'Parent') {
        birthYear = new Date().getFullYear() - Math.floor(Math.random() * 35 + 50);
      } else {
        birthYear = new Date().getFullYear() - Math.floor(Math.random() * 45 + 18);
      }

      const memberDateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];

      members.push({
        id: `MEM-${h * 10 + m + 1}`,
        firstName: randomElement(firstNames),
        lastName: familyLastName,
        dateOfBirth: memberDateOfBirth,
        gender: memberGender,
        relationshipToHead: relationship,
        disabilityStatus: Math.random() < 0.1,
        nationalId: Math.random() > 0.3 ? generateNationalId() : undefined
      });
    }

    const vulnerabilityScore = Math.floor(Math.random() * 100);

    households.push({
      id: householdId,
      registrationDate,
      headOfHousehold,
      members,
      address: {
        province,
        district,
        village,
        gpsCoordinates: `${(-1.5 + Math.random() * 3).toFixed(4)}, ${(29.5 + Math.random() * 3).toFixed(4)}`
      },
      vulnerabilityScore,
      programStatus: {
        pap: status,
        emergencySupport: Math.random() > 0.7 ? 'Active' : undefined
      },
      lastAssessmentDate: status !== 'Ineligible' ? randomDate(new Date(2024, 6, 1), new Date(2024, 11, 31)) : undefined,
      assignedSocialWorker: status === 'Enrolled' ? randomElement(workers) : undefined
    });
  }

  return households;
}

// Mock Data
export const mockHouseholds: Household[] = generateMockHouseholds();

export const mockGrievances: Grievance[] = (() => {
  const grievances: Grievance[] = [];
  const categories: Array<'Exclusion' | 'Payment Issue' | 'Service Quality' | 'Corruption' | 'Other'> = ['Exclusion', 'Payment Issue', 'Service Quality', 'Corruption', 'Other'];
  const statuses: Array<'Open' | 'Investigating' | 'Resolved' | 'Closed'> = ['Open', 'Investigating', 'Resolved', 'Closed'];
  const descriptions = [
    'Household claims vulnerability score was calculated incorrectly.',
    'Delayed payment processing affecting household welfare.',
    'Inadequate case worker support and follow-up.',
    'Data entry errors affecting household status.',
    'Unfair exclusion from assistance program.',
    'Mobile money transfer failed for current cycle.',
    'Household excluded despite meeting eligibility criteria.',
    'Inconsistent application of program policies.',
    'Lack of transparency in assessment process.',
    'Delayed home visit affecting enrollment timeline.'
  ];

  for (let i = 1; i <= 50; i++) {
    const householdNum = i % 50 === 0 ? 50 : i % 50;
    grievances.push({
      id: `GR-2025-${String(i).padStart(3, '0')}`,
      householdId: `HH-2024-${String(householdNum).padStart(3, '0')}`,
      dateFiled: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      resolution: Math.random() > 0.6 ? 'Issue was resolved satisfactorily with household.' : undefined
    });
  }
  return grievances;
})();

export const mockPayments: Payment[] = (() => {
  const payments: Payment[] = [];
  const statuses: Array<'Paid' | 'Pending' | 'Failed'> = ['Paid', 'Pending', 'Failed'];
  const providers: Array<'Mobile Money' | 'Bank Transfer' | 'Cash'> = ['Mobile Money', 'Bank Transfer', 'Cash'];
  const cycles = ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025'];

  for (let i = 1; i <= 50; i++) {
    const householdNum = i % 50 === 0 ? 50 : i % 50;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    payments.push({
      id: `PAY-${String(i).padStart(3, '0')}`,
      householdId: `HH-2024-${String(householdNum).padStart(3, '0')}`,
      amount: Math.floor(Math.random() * 200000) + 50000,
      cycle: cycles[Math.floor(Math.random() * cycles.length)],
      status,
      disbursementDate: status === 'Paid' ? new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : undefined,
      provider: providers[Math.floor(Math.random() * providers.length)]
    });
  }
  return payments;
})();
