export type Beneficiary = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: "Spouse" | "Child" | "Sibling" | "Parent" | "Friend" | "Charity" | "Other";
  allocation: number;
  email: string;
  status: 'Active' | 'Pending';
  avatar?: string;
};

export const mockBeneficiaries: Beneficiary[] = [
  {
    id: '1',
    firstName: 'Eleanor',
    lastName: 'Rigby',
    relationship: 'Spouse',
    allocation: 50,
    email: 'eleanor.r@example.com',
    status: 'Active'
  },
  {
    id: '2',
    firstName: 'Jude',
    lastName: 'Harrison',
    relationship: 'Child',
    allocation: 25,
    email: 'jude.h@example.com',
    status: 'Active'
  },
  {
    id: '3',
    firstName: 'Prudence',
    lastName: 'Vance',
    relationship: 'Child',
    allocation: 15,
    email: 'prudence.v@example.com',
    status: 'Pending'
  }
];

export const assetTotal = 1250000; // $1.25M
