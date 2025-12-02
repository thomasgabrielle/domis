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

// Mock Data
export const mockHouseholds: Household[] = [
  {
    id: 'HH-2024-001',
    registrationDate: '2024-11-15',
    headOfHousehold: {
      id: 'MEM-001',
      firstName: 'Sarah',
      lastName: 'Mbezi',
      dateOfBirth: '1985-03-12',
      gender: 'Female',
      relationshipToHead: 'Head',
      disabilityStatus: false,
      nationalId: 'ID-9928382'
    },
    members: [
      { id: 'MEM-002', firstName: 'John', lastName: 'Mbezi', dateOfBirth: '2010-05-20', gender: 'Male', relationshipToHead: 'Child', disabilityStatus: false },
      { id: 'MEM-003', firstName: 'Grace', lastName: 'Mbezi', dateOfBirth: '2012-08-14', gender: 'Female', relationshipToHead: 'Child', disabilityStatus: true }
    ],
    address: { province: 'Central', district: 'Capital', village: 'Sector 4' },
    vulnerabilityScore: 85,
    programStatus: { pap: 'Enrolled' },
    lastAssessmentDate: '2024-11-15',
    assignedSocialWorker: 'David K.'
  },
  {
    id: 'HH-2024-002',
    registrationDate: '2024-12-02',
    headOfHousehold: {
      id: 'MEM-004',
      firstName: 'Samuel',
      lastName: 'Okafor',
      dateOfBirth: '1960-01-30',
      gender: 'Male',
      relationshipToHead: 'Head',
      disabilityStatus: true,
      nationalId: 'ID-1122334'
    },
    members: [],
    address: { province: 'Eastern', district: 'River', village: 'Settlement B' },
    vulnerabilityScore: 92,
    programStatus: { pap: 'Pending Assessment' },
    lastAssessmentDate: '2024-12-02'
  },
  {
    id: 'HH-2024-003',
    registrationDate: '2024-10-10',
    headOfHousehold: {
      id: 'MEM-005',
      firstName: 'Maria',
      lastName: 'Santos',
      dateOfBirth: '1990-11-11',
      gender: 'Female',
      relationshipToHead: 'Head',
      disabilityStatus: false
    },
    members: [
       { id: 'MEM-006', firstName: 'Luis', lastName: 'Santos', dateOfBirth: '2018-02-01', gender: 'Male', relationshipToHead: 'Child', disabilityStatus: false }
    ],
    address: { province: 'Western', district: 'Coast', village: 'Village 9' },
    vulnerabilityScore: 45,
    programStatus: { pap: 'Ineligible' },
    lastAssessmentDate: '2024-10-12'
  }
];

export const mockGrievances: Grievance[] = [
  {
    id: 'GR-2025-001',
    householdId: 'HH-2024-003',
    dateFiled: '2024-10-15',
    category: 'Exclusion',
    status: 'Open',
    description: 'Household claims vulnerability score was calculated incorrectly due to missing medical records.'
  },
  {
    id: 'GR-2025-002',
    householdId: 'HH-2024-001',
    dateFiled: '2025-01-05',
    category: 'Payment Issue',
    status: 'Resolved',
    description: 'Mobile money transfer failed for Dec cycle.',
    resolution: 'Resent manually on Jan 6th.'
  }
];

export const mockPayments: Payment[] = [
  { id: 'PAY-001', householdId: 'HH-2024-001', amount: 50, cycle: 'Jan 2025', status: 'Paid', disbursementDate: '2025-01-01', provider: 'Mobile Money' },
  { id: 'PAY-002', householdId: 'HH-2024-001', amount: 50, cycle: 'Feb 2025', status: 'Pending', provider: 'Mobile Money' }
];
