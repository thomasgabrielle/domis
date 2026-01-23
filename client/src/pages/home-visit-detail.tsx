import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Plus, Trash2, Home, User, FileText, ArrowLeft, Save, Loader2, ChevronsUpDown, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type IncomeEntry = {
  type: string;
  monthlyAmount: string;
  justificationProvided: string;
};

type MemberForm = {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToHead: string;
  nationalId: string;
  disabilityStatus: boolean;
  maritalStatus: string;
  educationLevel: string;
  professionalCertifications: string[];
  currentEducationEnrolment: string;
  ongoingCertification: string;
  professionalSituation: string;
  employerDetails: string;
  incomeType: IncomeEntry[];
  physicalDisabilities: string[];
  physicalOther: string;
  physicalProofMedicalReport: string;
  mentalDisabilities: string[];
  mentalOther: string;
  mentalProofMedicalReport: string;
  chronicIllness: string[];
  chronicOther: string;
  chronicProofMedicalReport: string;
  workingAbilityImplications: string;
  inabilityToWorkProof: string;
  narrativeSummary: string;
};

const CERTIFICATION_OPTIONS = [
  { value: "no_certification", label: "No prof. certification" },
  { value: "accommodations", label: "Accommodations (Hotels, Villas, Guest Houses etc.)" },
  { value: "automotive", label: "Automotive (Sales, repairs)" },
  { value: "construction", label: "Construction" },
  { value: "education", label: "Education (Early childhood, daycare, Teacher)" },
  { value: "utilities", label: "Utilities (Electricity and Water)" },
  { value: "financial_insurance", label: "Financial and Insurance Activities" },
  { value: "fisheries_agriculture", label: "Fisheries and Agriculture" },
  { value: "food_services", label: "Food Services (Restaurants, Eateries, Bars etc.)" },
  { value: "health_social_work", label: "Human Health and Social Work" },
  { value: "information_communication", label: "Information and Communication" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "marine", label: "Marine (Charter Yachts, Charter Boats, Ferry etc.)" },
  { value: "mining_quarrying", label: "Mining and Quarrying" },
  { value: "personal_care", label: "Personal Care (Barbershops, Hair Salons, Nail Technicians, Spas)" },
  { value: "professional_admin", label: "Professional and Administrative Services" },
];

const INCOME_TYPE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "main_work_income", label: "Main work income" },
  { value: "additional_work_income", label: "Additional work income" },
  { value: "dominica_gov_pension", label: "Dominica Gov. Pension" },
  { value: "private_pension", label: "Private pension" },
  { value: "dominica_social_security", label: "Dominica Social Security Pension" },
  { value: "foreign_pension", label: "Foreign pension" },
  { value: "investment_income", label: "Monthly income from investments" },
  { value: "rental_income", label: "Monthly rental" },
  { value: "maintenance_alimony", label: "Monthly maintenance, alemonies" },
  { value: "other_sources", label: "Monthly other sources" },
  { value: "family_support", label: "Family support" },
];

const ROOF_TYPE_OPTIONS = [
  { value: "metal", label: "Metal" },
  { value: "tile", label: "Tile" },
  { value: "cement", label: "Cement" },
  { value: "wood", label: "Wood" },
];

const WALL_TYPE_OPTIONS = [
  { value: "wood", label: "Wood" },
  { value: "cement", label: "Cement" },
  { value: "pile", label: "Pile" },
  { value: "metal", label: "Metal" },
  { value: "other", label: "Other" },
];

const HOUSEHOLD_ASSETS_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "television", label: "Television" },
  { value: "refrigerator", label: "Refrigerator" },
  { value: "microwave", label: "Microwave" },
  { value: "air_conditioning", label: "Air Conditioning" },
  { value: "other", label: "Other Household Assets" },
];

const emptyMember: MemberForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  relationshipToHead: "",
  nationalId: "",
  disabilityStatus: false,
  maritalStatus: "",
  educationLevel: "",
  professionalCertifications: [],
  currentEducationEnrolment: "",
  ongoingCertification: "",
  professionalSituation: "",
  employerDetails: "",
  incomeType: [],
  physicalDisabilities: [],
  physicalOther: "",
  physicalProofMedicalReport: "",
  mentalDisabilities: [],
  mentalOther: "",
  mentalProofMedicalReport: "",
  chronicIllness: [],
  chronicOther: "",
  chronicProofMedicalReport: "",
  workingAbilityImplications: "",
  inabilityToWorkProof: "",
  narrativeSummary: "",
};

export function HomeVisitDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [householdDetails, setHouseholdDetails] = useState({
    roofType: "",
    wallType: "",
    householdAssetsList: [] as string[],
    homeVisitNotes: "",
  });
  
  const [members, setMembers] = useState<MemberForm[]>([{ ...emptyMember }]);

  const { data: household, isLoading } = useQuery({
    queryKey: ['household', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/households/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch household');
      return response.json();
    },
    enabled: !!params.id,
  });

  useEffect(() => {
    if (household) {
      const parseAssetsList = (assets: unknown): string[] => {
        if (!assets) return [];
        if (Array.isArray(assets)) return assets;
        if (typeof assets === 'string') {
          try {
            const parsed = JSON.parse(assets);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      };
      
      setHouseholdDetails({
        roofType: household.roofType || "",
        wallType: household.wallType || "",
        householdAssetsList: parseAssetsList(household.householdAssetsList),
        homeVisitNotes: household.homeVisitNotes || "",
      });
      
      if (household.members && household.members.length > 0) {
        setMembers(household.members.map((m: any) => ({
          id: m.id,
          firstName: m.firstName || "",
          lastName: m.lastName || "",
          dateOfBirth: m.dateOfBirth ? format(new Date(m.dateOfBirth), 'yyyy-MM-dd') : "",
          gender: m.gender || "",
          relationshipToHead: m.relationshipToHead || "",
          nationalId: m.nationalId || "",
          disabilityStatus: m.disabilityStatus || false,
          maritalStatus: m.maritalStatus || "",
          educationLevel: m.educationLevel || "",
          professionalCertifications: m.professionalCertifications ? m.professionalCertifications.split(",") : [],
          currentEducationEnrolment: m.currentEducationEnrolment || "",
          ongoingCertification: m.ongoingCertification || "",
          professionalSituation: m.professionalSituation || "",
          employerDetails: m.employerDetails || "",
          incomeType: m.incomeType ? JSON.parse(m.incomeType) : [],
          physicalDisabilities: [],
          physicalOther: "",
          physicalProofMedicalReport: "",
          mentalDisabilities: [],
          mentalOther: "",
          mentalProofMedicalReport: "",
          chronicIllness: [],
          chronicOther: "",
          chronicProofMedicalReport: "",
          workingAbilityImplications: "",
          inabilityToWorkProof: "",
          narrativeSummary: m.narrativeSummary || "",
        })));
      }
    }
  }, [household]);

  const saveHomeVisitMutation = useMutation({
    mutationFn: async (data: { householdDetails: any; members: any[]; complete: boolean }) => {
      const response = await fetch(`/api/households/${params.id}/home-visit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save home visit");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['household', params.id] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast({
        title: variables.complete ? "Home Visit Completed" : "Progress Saved",
        description: variables.complete 
          ? "Home visit has been completed successfully."
          : "Your progress has been saved.",
      });
      if (variables.complete) {
        setLocation("/home-visits");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMember = () => {
    setMembers([...members, { ...emptyMember }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleSave = (complete: boolean) => {
    const formattedMembers = members.map((member, index) => ({
      ...member,
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
      isHead: index === 0,
      professionalCertifications: member.professionalCertifications.join(","),
      incomeType: JSON.stringify(member.incomeType),
    }));

    saveHomeVisitMutation.mutate({
      householdDetails,
      members: formattedMembers,
      complete,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Household not found.</p>
            <Button onClick={() => setLocation("/home-visits")} className="mt-4" data-testid="button-back-not-found">
              Back to Home Visits
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/home-visits")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home Visits
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Home className="h-8 w-8 text-primary" />
                Home Visit
              </h1>
              <p className="text-muted-foreground mt-1">
                Application: <span className="font-medium">{household.applicationId}</span> | 
                Location: <span className="font-medium">{household.village}, {household.district}</span>
              </p>
            </div>
            <Badge variant={household.homeVisitStatus === 'completed' ? 'default' : 'outline'}>
              {household.homeVisitStatus === 'completed' ? 'Completed' : 'Pending'}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Applicant/Proxy Information Card */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Applicant Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Applicant (Head of Household)</h4>
                  {members.length > 0 && members[0].firstName ? (
                    <div className="space-y-1">
                      <p className="font-medium text-lg">{members[0].firstName} {members[0].lastName}</p>
                      {members[0].nationalId && (
                        <p className="text-sm text-muted-foreground">National ID: {members[0].nationalId}</p>
                      )}
                      {members[0].gender && (
                        <p className="text-sm text-muted-foreground">
                          {members[0].gender === 'male' ? 'Male' : members[0].gender === 'female' ? 'Female' : 'Other'}
                          {members[0].dateOfBirth && ` • DOB: ${members[0].dateOfBirth}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Not yet recorded</p>
                  )}
                </div>
                {(household.proxyFirstName || household.proxyLastName) && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Proxy Representative</h4>
                    <div className="space-y-1">
                      <p className="font-medium text-lg">{household.proxyFirstName} {household.proxyLastName}</p>
                      {household.proxyNationalId && (
                        <p className="text-sm text-muted-foreground">National ID: {household.proxyNationalId}</p>
                      )}
                      {household.proxyRelationship && (
                        <p className="text-sm text-muted-foreground">Relationship: {household.proxyRelationship}</p>
                      )}
                      {household.proxyPhone && (
                        <p className="text-sm text-muted-foreground">Phone: {household.proxyPhone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Household Details</CardTitle>
              </div>
              <CardDescription>Information about the dwelling structure and assets.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roofType">Roof Type</Label>
                <Select 
                  value={householdDetails.roofType}
                  onValueChange={(value) => setHouseholdDetails(prev => ({ ...prev, roofType: value }))}
                >
                  <SelectTrigger id="roofType" data-testid="select-roof-type">
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallType">Wall Type</Label>
                <Select 
                  value={householdDetails.wallType}
                  onValueChange={(value) => setHouseholdDetails(prev => ({ ...prev, wallType: value }))}
                >
                  <SelectTrigger id="wallType" data-testid="select-wall-type">
                    <SelectValue placeholder="Select wall type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WALL_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label>Household Assets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {HOUSEHOLD_ASSETS_OPTIONS.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`asset-${option.value}`}
                        checked={householdDetails.householdAssetsList.includes(option.value)}
                        onCheckedChange={(checked) => {
                          setHouseholdDetails(prev => ({
                            ...prev,
                            householdAssetsList: checked 
                              ? [...prev.householdAssetsList, option.value]
                              : prev.householdAssetsList.filter(v => v !== option.value)
                          }));
                        }}
                        data-testid={`checkbox-asset-${option.value}`}
                      />
                      <Label 
                        htmlFor={`asset-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="homeVisitNotes">Home Visit Notes</Label>
                <Textarea
                  id="homeVisitNotes"
                  value={householdDetails.homeVisitNotes}
                  onChange={(e) => setHouseholdDetails(prev => ({ ...prev, homeVisitNotes: e.target.value }))}
                  placeholder="Enter observations and notes from the home visit..."
                  rows={3}
                  data-testid="textarea-home-visit-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Household Members</CardTitle>
                </div>
                <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2" data-testid="button-add-member">
                  <Plus className="h-4 w-4" /> Add Member
                </Button>
              </div>
              <CardDescription>Enter details for the applicant and all household members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {members.map((member, index) => (
                <div key={index} className="relative">
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      {index === 0 ? "Head of Household" : `Member #${index + 1}`}
                    </h3>
                    {index > 0 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMember(index)} 
                        className="text-destructive hover:bg-destructive/10"
                        data-testid={`button-remove-member-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input 
                        placeholder="Given Name" 
                        value={member.firstName}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].firstName = e.target.value;
                          setMembers(newMembers);
                        }}
                        data-testid={`input-firstname-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input 
                        placeholder="Surname" 
                        value={member.lastName}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].lastName = e.target.value;
                          setMembers(newMembers);
                        }}
                        data-testid={`input-lastname-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>National ID</Label>
                      <Input 
                        placeholder="ID Number" 
                        value={member.nationalId}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].nationalId = e.target.value;
                          setMembers(newMembers);
                        }}
                        data-testid={`input-nationalid-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input 
                        type="date"
                        value={member.dateOfBirth}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].dateOfBirth = e.target.value;
                          setMembers(newMembers);
                        }}
                        data-testid={`input-dob-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select 
                        value={member.gender}
                        onValueChange={(value) => {
                          const newMembers = [...members];
                          newMembers[index].gender = value;
                          setMembers(newMembers);
                        }}
                      >
                        <SelectTrigger data-testid={`select-gender-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship to Head</Label>
                      <Select 
                        value={member.relationshipToHead}
                        onValueChange={(value) => {
                          const newMembers = [...members];
                          newMembers[index].relationshipToHead = value;
                          setMembers(newMembers);
                        }}
                      >
                        <SelectTrigger data-testid={`select-relationship-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">Head of Household</SelectItem>
                          <SelectItem value="spouse">Spouse/Partner</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="grandparent">Grandparent</SelectItem>
                          <SelectItem value="grandchild">Grandchild</SelectItem>
                          <SelectItem value="other_relative">Other Relative</SelectItem>
                          <SelectItem value="non_relative">Non-Relative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marital Status</Label>
                      <Select 
                        value={member.maritalStatus}
                        onValueChange={(value) => {
                          const newMembers = [...members];
                          newMembers[index].maritalStatus = value;
                          setMembers(newMembers);
                        }}
                      >
                        <SelectTrigger data-testid={`select-marital-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="common_law">Common Law</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                          <SelectItem value="separated">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Education Level</Label>
                      <Select 
                        value={member.educationLevel}
                        onValueChange={(value) => {
                          const newMembers = [...members];
                          newMembers[index].educationLevel = value;
                          setMembers(newMembers);
                        }}
                      >
                        <SelectTrigger data-testid={`select-education-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Formal Education</SelectItem>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="vocational">Vocational Training</SelectItem>
                          <SelectItem value="tertiary">Tertiary/University</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Professional Situation</Label>
                      <Select 
                        value={member.professionalSituation}
                        onValueChange={(value) => {
                          const newMembers = [...members];
                          newMembers[index].professionalSituation = value;
                          setMembers(newMembers);
                        }}
                      >
                        <SelectTrigger data-testid={`select-profession-${index}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed_full">Employed Full-time</SelectItem>
                          <SelectItem value="employed_part">Employed Part-time</SelectItem>
                          <SelectItem value="self_employed">Self-employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="homemaker">Homemaker</SelectItem>
                          <SelectItem value="unable_to_work">Unable to Work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-3">
                      <Checkbox
                        id={`disability-${index}`}
                        checked={member.disabilityStatus}
                        onCheckedChange={(checked) => {
                          const newMembers = [...members];
                          newMembers[index].disabilityStatus = checked === true;
                          setMembers(newMembers);
                        }}
                        data-testid={`checkbox-disability-${index}`}
                      />
                      <Label htmlFor={`disability-${index}`} className="cursor-pointer">
                        Has disability or chronic health condition
                      </Label>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Notes / Narrative Summary</Label>
                      <Textarea
                        value={member.narrativeSummary}
                        onChange={(e) => {
                          const newMembers = [...members];
                          newMembers[index].narrativeSummary = e.target.value;
                          setMembers(newMembers);
                        }}
                        placeholder="Enter any additional notes about this member..."
                        rows={2}
                        data-testid={`textarea-notes-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardFooter className="bg-muted/50 flex justify-end gap-4 p-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/home-visits")}
                disabled={saveHomeVisitMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={saveHomeVisitMutation.isPending}
                data-testid="button-save-progress"
              >
                {saveHomeVisitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Progress
              </Button>
              <Button 
                type="button"
                onClick={() => handleSave(true)}
                disabled={saveHomeVisitMutation.isPending}
                data-testid="button-complete"
              >
                {saveHomeVisitMutation.isPending ? "Saving..." : "Complete Home Visit"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
