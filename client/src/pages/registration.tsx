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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Trash2, MapPin, User, FileText, Upload, Calendar, UserCheck, Loader2, ChevronsUpDown, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

type IncomeEntry = {
  type: string;
  monthlyAmount: string;
  justificationProvided: string;
};

type MemberForm = {
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
  { value: "foreign_pension", label: "Foreign pension (in respect of public service with another Government, or an International Organization)" },
  { value: "investment_income", label: "Monthly income from investments (ex: dividends)" },
  { value: "rental_income", label: "Monthly rental" },
  { value: "maintenance_alimony", label: "Monthly maintenance, alemonies" },
  { value: "other_sources", label: "Monthly other sources (ex: insurance pay-out)" },
  { value: "family_support", label: "Family support" },
];

const PHYSICAL_DISABILITY_OPTIONS = [
  { value: "none", label: "No physical disabilities" },
  { value: "some_vision", label: "Some vision impairment (includes difficulty seeing even with glasses, partially blind)" },
  { value: "total_vision", label: "Total vision impairment (legally blind, totally blind)" },
  { value: "some_hearing", label: "Some hearing impairment (includes difficulty hearing even with hearing aids, partially deaf)" },
  { value: "total_hearing", label: "Total hearing impairment" },
  { value: "mobility_limb", label: "Mobility/Moving (due to absent or impaired limb)" },
  { value: "mobility_paralysis", label: "Mobility/Moving (due to paralysis, quadriplegic)" },
  { value: "gripping", label: "Gripping (unable to use fingers to grip or handle objects)" },
  { value: "other", label: "Other" },
];

const MENTAL_DISABILITY_OPTIONS = [
  { value: "none", label: "No mental health problems" },
  { value: "learning_challenges", label: "Learning challenges (autism etc)" },
  { value: "personality_disorders", label: "Personality disorders (bipolar, schizophrenia, paranoia etc)" },
  { value: "anxiety", label: "Anxiety" },
  { value: "ptsd", label: "PTSD" },
  { value: "depression", label: "Depression" },
  { value: "other", label: "Other" },
];

const CHRONIC_ILLNESS_OPTIONS = [
  { value: "none", label: "No chronic health problems" },
  { value: "asthma", label: "Asthma" },
  { value: "arthritis", label: "Arthritis" },
  { value: "cancer", label: "Cancer" },
  { value: "dementia", label: "Dementia" },
  { value: "diabetes", label: "Diabetes" },
  { value: "epilepsy", label: "Epilepsy" },
  { value: "hypertension", label: "Hypertension" },
  { value: "kidney_disease", label: "Kidney disease" },
  { value: "other", label: "Other" },
];

const PROOF_MEDICAL_REPORT_OPTIONS = [
  { value: "self_declared", label: "Self-declared" },
  { value: "medical_report", label: "Medical report provided" },
  { value: "sw_checkin", label: "SW check-in with medical professional or SS" },
];

const WORKING_ABILITY_OPTIONS = [
  { value: "unknown", label: "Unknown" },
  { value: "fully_able", label: "Fully able to work" },
  { value: "unable", label: "Unable to work" },
  { value: "part_time", label: "Can work part-time" },
];

const INABILITY_PROOF_OPTIONS = [
  { value: "medical_report_supports", label: "Medical report supports" },
  { value: "not_proved", label: "Not proved (self declared)" },
];

type HouseholdForm = {
  province: string;
  district: string;
  village: string;
  gpsCoordinates: string;
  housingType: string;
  incomeSource: string;
  notes: string;
};

type DuplicateMember = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string | null;
  relationshipToHead: string;
  disabilityStatus: boolean;
  isHead: boolean;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  professionalCertifications?: string | null;
  currentEducationEnrolment?: string | null;
  ongoingCertification?: string | null;
  professionalSituation?: string | null;
  employerDetails?: string | null;
  incomeType?: string | null;
};

type DuplicateResult = {
  found: boolean;
  member?: DuplicateMember;
  household?: {
    id: string;
    applicationId: string;
    province: string;
    district: string;
    village: string;
    gpsCoordinates: string | null;
  };
  allMembers?: DuplicateMember[];
};

type LocationForm = {
  province: string;
  district: string;
  village: string;
  gpsCoordinates: string;
};

export function Registration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [hasProxy, setHasProxy] = useState(false);
  const [members, setMembers] = useState<MemberForm[]>([
    {
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
    }
  ]);
  
  const [locationData, setLocationData] = useState<LocationForm>({
    province: "",
    district: "",
    village: "",
    gpsCoordinates: "",
  });
  
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateResult | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateBlocked, setDuplicateBlocked] = useState<Record<number, boolean>>({});

  const createHouseholdMutation = useMutation({
    mutationFn: async (data: { household: any; members: any[] }) => {
      const response = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register household");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Intake Successful",
        description: "Household has been added and queued for assessment.",
      });
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const hasDuplicateBlocked = Object.values(duplicateBlocked).some(blocked => blocked);
    if (hasDuplicateBlocked) {
      toast({
        title: "Cannot Submit",
        description: "Please resolve duplicate National ID issues before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    const household = {
      province: locationData.province || formData.get("province") as string,
      district: locationData.district || formData.get("district") as string,
      village: locationData.village || formData.get("village") as string,
      gpsCoordinates: locationData.gpsCoordinates || formData.get("gps") as string || null,
      intakeDate: formData.get("intakeDate") as string || new Date().toISOString(),
      outreachType: formData.get("outreachType") as string || null,
      outreachMethod: formData.get("outreachMethod") as string || null,
      isOnOwnBehalf: formData.get("isOnOwnBehalf") === "yes",
      requestPurpose: formData.get("requestPurpose") as string || null,
      actionTaken: formData.get("actionTaken") as string || null,
      followUpNotes: formData.get("followUpNotes") as string || null,
      proxyFirstName: formData.get("proxyFirstName") as string || null,
      proxyLastName: formData.get("proxyLastName") as string || null,
      proxyAlias: formData.get("proxyAlias") as string || null,
      proxyGender: formData.get("proxyGender") as string || null,
      proxyDateOfBirth: formData.get("proxyDateOfBirth") as string || null,
      proxyAddress: formData.get("proxyAddress") as string || null,
      proxyPhone: formData.get("proxyPhone") as string || null,
      proxyNationalId: formData.get("proxyNationalId") as string || null,
      proxyReason: formData.get("proxyReason") as string || null,
      proxyRelationship: formData.get("proxyRelationship") as string || null,
      proxyRole: formData.get("proxyRole") as string || null,
      programStatus: "pending_assessment",
    };

    const formattedMembers = members.map((member, index) => ({
      firstName: formData.get(`firstName-${index}`) as string,
      lastName: formData.get(`lastName-${index}`) as string,
      dateOfBirth: new Date(formData.get(`dateOfBirth-${index}`) as string),
      gender: formData.get(`gender-${index}`) as string,
      relationshipToHead: formData.get(`relationship-${index}`) as string,
      nationalId: formData.get(`nationalId-${index}`) as string || null,
      disabilityStatus: formData.get(`disability-${index}`) === "on",
      isHead: index === 0,
      maritalStatus: member.maritalStatus || null,
      educationLevel: member.educationLevel || null,
      professionalCertifications: member.professionalCertifications.length > 0 ? member.professionalCertifications.join(",") : null,
      currentEducationEnrolment: member.currentEducationEnrolment || null,
      ongoingCertification: member.ongoingCertification || null,
      professionalSituation: member.professionalSituation || null,
      employerDetails: member.employerDetails || null,
      incomeType: member.incomeType.length > 0 ? JSON.stringify(member.incomeType) : null,
    }));

    createHouseholdMutation.mutate({
      household,
      members: formattedMembers,
    });
  };

  const addMember = () => {
    setMembers([...members, {
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
    }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
  };

  const checkDuplicateNationalId = async (nationalId: string, memberIndex: number) => {
    if (!nationalId || nationalId.trim().length < 3) return;
    
    setCheckingDuplicate(true);
    try {
      const response = await fetch(`/api/registry/check-national-id/${encodeURIComponent(nationalId.trim())}`);
      
      if (!response.ok) {
        throw new Error("Failed to check for duplicates");
      }
      
      const result: DuplicateResult = await response.json();
      
      if (result.found) {
        setDuplicateResult({ ...result, memberIndex } as any);
        setDuplicateDialogOpen(true);
      } else {
        setDuplicateBlocked(prev => ({ ...prev, [memberIndex]: false }));
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      toast({
        title: "Check Failed",
        description: "Could not verify National ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleDuplicateConfirm = () => {
    if (!duplicateResult?.member) return;
    
    const memberIndex = (duplicateResult as any).memberIndex || 0;
    const household = duplicateResult.household;
    const allMembers = duplicateResult.allMembers || [];
    
    if (household) {
      setLocationData({
        province: household.province || "",
        district: household.district || "",
        village: household.village || "",
        gpsCoordinates: household.gpsCoordinates || "",
      });
    }
    
    if (allMembers.length > 0) {
      const sortedMembers = [...allMembers].sort((a, b) => {
        if (a.isHead) return -1;
        if (b.isHead) return 1;
        return 0;
      });
      
      const newMembers: MemberForm[] = sortedMembers.map((m, index) => ({
        firstName: m.firstName || "",
        lastName: m.lastName || "",
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : "",
        gender: m.gender || "",
        relationshipToHead: m.isHead ? "head" : (m.relationshipToHead || ""),
        nationalId: m.nationalId || "",
        disabilityStatus: m.disabilityStatus || false,
        maritalStatus: m.maritalStatus || "",
        educationLevel: m.educationLevel || "",
        professionalCertifications: m.professionalCertifications ? m.professionalCertifications.split(",") : [],
        currentEducationEnrolment: m.currentEducationEnrolment || "",
        ongoingCertification: m.ongoingCertification || "",
        professionalSituation: m.professionalSituation || "",
        employerDetails: m.employerDetails || "",
        incomeType: m.incomeType ? (typeof m.incomeType === 'string' ? JSON.parse(m.incomeType) : m.incomeType) : [],
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
      }));
      
      setMembers(newMembers);
      setDuplicateBlocked({});
      
      const headMember = allMembers.find(m => m.isHead) || duplicateResult.member;
      toast({
        title: "Client Information Loaded",
        description: `Form pre-filled with existing client: ${headMember.firstName} ${headMember.lastName} and ${allMembers.length} member(s)`,
      });
    } else {
      const member = duplicateResult.member;
      const newMembers = [...members];
      newMembers[memberIndex] = {
        ...newMembers[memberIndex],
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : "",
        gender: member.gender || "",
        nationalId: member.nationalId || "",
        disabilityStatus: member.disabilityStatus || false,
        maritalStatus: member.maritalStatus || "",
        educationLevel: member.educationLevel || "",
        professionalCertifications: member.professionalCertifications ? member.professionalCertifications.split(",") : [],
        currentEducationEnrolment: member.currentEducationEnrolment || "",
        ongoingCertification: member.ongoingCertification || "",
        professionalSituation: member.professionalSituation || "",
        employerDetails: member.employerDetails || "",
        incomeType: member.incomeType ? (typeof member.incomeType === 'string' ? JSON.parse(member.incomeType) : member.incomeType) : [],
      };
      setMembers(newMembers);
      setDuplicateBlocked(prev => ({ ...prev, [memberIndex]: false }));
      
      toast({
        title: "Client Information Loaded",
        description: `Form pre-filled with existing client: ${member.firstName} ${member.lastName}`,
      });
    }
    
    setDuplicateDialogOpen(false);
    setDuplicateResult(null);
  };

  const handleDuplicateReject = () => {
    const memberIndex = (duplicateResult as any)?.memberIndex || 0;
    
    const newMembers = [...members];
    newMembers[memberIndex] = {
      ...newMembers[memberIndex],
      nationalId: "",
    };
    setMembers(newMembers);
    
    setDuplicateBlocked(prev => ({ ...prev, [memberIndex]: true }));
    setDuplicateDialogOpen(false);
    setDuplicateResult(null);
    
    toast({
      title: "Duplicate ID Blocked",
      description: "Please enter a unique National ID.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Intake</h1>
          <p className="text-muted-foreground">Create a new application for the Public Assistance Program.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Intake Information Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Intake Information</CardTitle>
                </div>
                <CardDescription>Capture how this applicant reached the program.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="intakeDate">Date of Intake</Label>
                  <Input 
                    id="intakeDate" 
                    name="intakeDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required 
                    data-testid="input-intake-date" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outreachType">Type of Outreach</Label>
                  <Select name="outreachType" required>
                    <SelectTrigger id="outreachType" data-testid="select-outreach-type">
                      <SelectValue placeholder="Select outreach type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proactive_dss">Proactive Outreach to DSS</SelectItem>
                      <SelectItem value="proactive_vcc">Proactive Outreach to VCC</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outreachMethod">Outreach Method</Label>
                  <Select name="outreachMethod" required>
                    <SelectTrigger id="outreachMethod" data-testid="select-outreach-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isOnOwnBehalf">Is this person here on their own behalf?</Label>
                  <Select 
                    name="isOnOwnBehalf" 
                    required
                    onValueChange={(value) => setHasProxy(value === "no")}
                  >
                    <SelectTrigger id="isOnOwnBehalf" data-testid="select-own-behalf">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No (Proxy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requestPurpose">Purpose of Request</Label>
                  <Select name="requestPurpose" required>
                    <SelectTrigger id="requestPurpose" data-testid="select-request-purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_question">General Question</SelectItem>
                      <SelectItem value="social_welfare">Request for Social Welfare Service</SelectItem>
                      <SelectItem value="bureau_gender">Request for Bureau of Gender Affairs</SelectItem>
                      <SelectItem value="probation_services">Request for Probation Services</SelectItem>
                      <SelectItem value="child_protection">Request for Child Protection Matters</SelectItem>
                      <SelectItem value="undefined">Undefined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="actionTaken">Action Taken</Label>
                  <Select name="actionTaken" required>
                    <SelectTrigger id="actionTaken" data-testid="select-action-taken">
                      <SelectValue placeholder="Select action taken" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referred_sws_seaman">Referred to SWS: S. Seaman</SelectItem>
                      <SelectItem value="referred_sws_alexander">Referred to SWS: J. Alexander</SelectItem>
                      <SelectItem value="referred_sws_paquette">Referred to SWS: G. Paquette</SelectItem>
                      <SelectItem value="referred_sws_other">Referred to other SWS Officer</SelectItem>
                      <SelectItem value="referred_gender">Referred to Gender</SelectItem>
                      <SelectItem value="referred_probation">Referred to Probation</SelectItem>
                      <SelectItem value="referred_child_protection">Referred to Child Protection</SelectItem>
                      <SelectItem value="general_question_answered">Answer to general question provided</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="followUpNotes">Additional Information on Follow Up</Label>
                  <Textarea 
                    id="followUpNotes" 
                    name="followUpNotes" 
                    placeholder="Enter any additional notes regarding follow-up actions..."
                    rows={3}
                    data-testid="textarea-follow-up-notes"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fileUpload">Upload Additional Files (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="fileUpload" 
                      name="fileUpload" 
                      type="file" 
                      className="flex-1"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      data-testid="input-file-upload" 
                    />
                    <Button type="button" variant="outline" size="icon" title="Upload File">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX, JPG, PNG</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Address</CardTitle>
                </div>
                <CardDescription>Geographic location of the household dwelling.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="province">Province/Region</Label>
                  <Select 
                    name="province" 
                    required
                    value={locationData.province}
                    onValueChange={(value) => setLocationData(prev => ({ ...prev, province: value }))}
                  >
                    <SelectTrigger id="province" data-testid="select-province">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Central Province">Central Province</SelectItem>
                      <SelectItem value="Eastern Province">Eastern Province</SelectItem>
                      <SelectItem value="Western Province">Western Province</SelectItem>
                      <SelectItem value="Northern Province">Northern Province</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select 
                    name="district" 
                    required
                    value={locationData.district}
                    onValueChange={(value) => setLocationData(prev => ({ ...prev, district: value }))}
                  >
                    <SelectTrigger id="district" data-testid="select-district">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Capital District">Capital District</SelectItem>
                      <SelectItem value="River District">River District</SelectItem>
                      <SelectItem value="Mountain District">Mountain District</SelectItem>
                      <SelectItem value="Lake District">Lake District</SelectItem>
                      <SelectItem value="Coastal District">Coastal District</SelectItem>
                      <SelectItem value="Highland District">Highland District</SelectItem>
                      <SelectItem value="Valley District">Valley District</SelectItem>
                      <SelectItem value="Border District">Border District</SelectItem>
                      <SelectItem value="Desert District">Desert District</SelectItem>
                      <SelectItem value="Plains District">Plains District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village / Community</Label>
                  <Input 
                    id="village" 
                    name="village" 
                    placeholder="Enter village name" 
                    required 
                    data-testid="input-village"
                    value={locationData.village}
                    onChange={(e) => setLocationData(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gps">GPS Coordinates (Optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="gps" 
                      name="gps" 
                      placeholder="Lat, Long" 
                      data-testid="input-gps"
                      value={locationData.gpsCoordinates}
                      onChange={(e) => setLocationData(prev => ({ ...prev, gpsCoordinates: e.target.value }))}
                    />
                    <Button type="button" variant="outline" size="icon" title="Get Current Location" data-testid="button-gps">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proxy Information - Only shown when proxy is selected */}
            {hasProxy && (
            <Card className="animate-in fade-in slide-in-from-top-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Proxy Information</CardTitle>
                </div>
                <CardDescription>Enter the details of the person applying on behalf of the applicant.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="proxyFirstName">Proxy First Name</Label>
                  <Input 
                    id="proxyFirstName" 
                    name="proxyFirstName" 
                    placeholder="First name"
                    data-testid="input-proxy-first-name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyLastName">Proxy Last Name</Label>
                  <Input 
                    id="proxyLastName" 
                    name="proxyLastName" 
                    placeholder="Last name"
                    data-testid="input-proxy-last-name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyAlias">Proxy Alias</Label>
                  <Input 
                    id="proxyAlias" 
                    name="proxyAlias" 
                    placeholder="Alias / Nickname"
                    data-testid="input-proxy-alias" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyGender">Proxy Gender</Label>
                  <Select name="proxyGender">
                    <SelectTrigger id="proxyGender" data-testid="select-proxy-gender">
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
                  <Label htmlFor="proxyDateOfBirth">Proxy Date of Birth</Label>
                  <Input 
                    id="proxyDateOfBirth" 
                    name="proxyDateOfBirth" 
                    type="date"
                    data-testid="input-proxy-dob" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyNationalId">Proxy National ID</Label>
                  <Input 
                    id="proxyNationalId" 
                    name="proxyNationalId" 
                    placeholder="ID Number"
                    data-testid="input-proxy-national-id" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="proxyAddress">Proxy Address</Label>
                  <Input 
                    id="proxyAddress" 
                    name="proxyAddress" 
                    placeholder="Full address"
                    data-testid="input-proxy-address" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyPhone">Proxy Phone</Label>
                  <Input 
                    id="proxyPhone" 
                    name="proxyPhone" 
                    type="tel"
                    placeholder="Phone number"
                    data-testid="input-proxy-phone" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyRelationship">Proxy Relationship to Applicant</Label>
                  <Select name="proxyRelationship">
                    <SelectTrigger id="proxyRelationship" data-testid="select-proxy-relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxyRole">Proxy Role</Label>
                  <Input 
                    id="proxyRole" 
                    name="proxyRole" 
                    placeholder="e.g., Caregiver, Legal Guardian"
                    data-testid="input-proxy-role" 
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="proxyReason">Reason for Proxy</Label>
                  <Textarea 
                    id="proxyReason" 
                    name="proxyReason" 
                    placeholder="Explain why a proxy is needed..."
                    rows={2}
                    data-testid="textarea-proxy-reason" 
                  />
                </div>
              </CardContent>
            </Card>
            )}

            {/* Applicant Information */}
            <Card>
              <CardHeader>
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Applicant Information</CardTitle>
                  </div>
                  <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2" data-testid="button-add-member">
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                </div>
                <CardDescription>Enter details for the applicant and all household members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {members.map((member, index) => (
                  <div key={index} className="relative animate-in fade-in slide-in-from-bottom-2">
                    {index > 0 && <Separator className="my-6" />}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                        {`Member #${index + 1}`}
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
                          name={`firstName-${index}`} 
                          placeholder="Given Name" 
                          required 
                          data-testid={`input-firstname-${index}`}
                          value={member.firstName}
                          onChange={(e) => {
                            const newMembers = [...members];
                            newMembers[index].firstName = e.target.value;
                            setMembers(newMembers);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input 
                          name={`lastName-${index}`} 
                          placeholder="Surname" 
                          required 
                          data-testid={`input-lastname-${index}`}
                          value={member.lastName}
                          onChange={(e) => {
                            const newMembers = [...members];
                            newMembers[index].lastName = e.target.value;
                            setMembers(newMembers);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input 
                          name={`dateOfBirth-${index}`} 
                          type="date" 
                          required 
                          data-testid={`input-dob-${index}`}
                          value={member.dateOfBirth}
                          onChange={(e) => {
                            const newMembers = [...members];
                            newMembers[index].dateOfBirth = e.target.value;
                            setMembers(newMembers);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select 
                          name={`gender-${index}`} 
                          required
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
                        <Select name={`relationship-${index}`} defaultValue={index === 0 ? "head" : undefined} disabled={index === 0}>
                          <SelectTrigger data-testid={`select-relationship-${index}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Self (Head)</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="other">Other Relative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>National ID / Ref #</Label>
                        <div className="relative">
                          <Input 
                            name={`nationalId-${index}`} 
                            placeholder="ID Number" 
                            data-testid={`input-nationalid-${index}`}
                            value={member.nationalId}
                            onChange={(e) => {
                              const newMembers = [...members];
                              newMembers[index].nationalId = e.target.value;
                              setMembers(newMembers);
                              if (duplicateBlocked[index]) {
                                setDuplicateBlocked(prev => ({ ...prev, [index]: false }));
                              }
                            }}
                            onBlur={(e) => checkDuplicateNationalId(e.target.value, index)}
                            className={duplicateBlocked[index] ? "border-destructive" : ""}
                          />
                          {checkingDuplicate && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {duplicateBlocked[index] && (
                          <p className="text-xs text-destructive">This ID is already in use. Enter a unique ID.</p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor={`nationalIdPhoto-${index}`}>Photo of National ID</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id={`nationalIdPhoto-${index}`}
                            name={`nationalIdPhoto-${index}`}
                            type="file" 
                            className="flex-1"
                            accept=".jpg,.jpeg,.png,.pdf"
                            data-testid={`input-national-id-photo-${index}`} 
                          />
                          <Button type="button" variant="outline" size="icon" title="Upload ID Photo">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Upload a photo or scan of the National ID</p>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-muted-foreground">Education & Employment Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`maritalStatus-${index}`}>Marital Status</Label>
                          <Select
                            value={member.maritalStatus}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].maritalStatus = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`maritalStatus-${index}`} data-testid={`select-marital-status-${index}`}>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="cohabitating">Cohabitating (with companion)</SelectItem>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="widow_widower">Widow/Widower</SelectItem>
                              <SelectItem value="separated">Separated</SelectItem>
                              <SelectItem value="child_under_18">Child (under 18)</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`educationLevel-${index}`}>Completed Education Level</Label>
                          <Select
                            value={member.educationLevel}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].educationLevel = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`educationLevel-${index}`} data-testid={`select-education-level-${index}`}>
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no_education">No education</SelectItem>
                              <SelectItem value="primary">Primary</SelectItem>
                              <SelectItem value="secondary">Secondary</SelectItem>
                              <SelectItem value="hs_grad_ged">HS Grad/ GED/ Alternative program</SelectItem>
                              <SelectItem value="college_associates">College: Associate's</SelectItem>
                              <SelectItem value="college_bachelors">College: Bachelor's</SelectItem>
                              <SelectItem value="college_masters">College: Masters</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`currentEducationEnrolment-${index}`}>Current Education Enrolment</Label>
                          <Select
                            value={member.currentEducationEnrolment}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].currentEducationEnrolment = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`currentEducationEnrolment-${index}`} data-testid={`select-current-education-${index}`}>
                              <SelectValue placeholder="Select enrolment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_5_not_formal">Under 5 - not in formal child-care</SelectItem>
                              <SelectItem value="attending_childcare">Attending child-care</SelectItem>
                              <SelectItem value="attending_school">Attending school</SelectItem>
                              <SelectItem value="not_attending_school_age">Not attending school despite being school age</SelectItem>
                              <SelectItem value="attending_college">Attending college - Attending professional certification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`professionalCertifications-${index}`}>Professional Certifications Completed</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                data-testid={`select-prof-certs-${index}`}
                              >
                                {member.professionalCertifications.length > 0
                                  ? `${member.professionalCertifications.length} selected`
                                  : "Select certifications..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <ScrollArea className="h-[300px] p-4">
                                <div className="space-y-2">
                                  {CERTIFICATION_OPTIONS.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`cert-${index}-${option.value}`}
                                        checked={member.professionalCertifications.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                          const newMembers = [...members];
                                          if (checked) {
                                            if (option.value === "no_certification") {
                                              newMembers[index].professionalCertifications = ["no_certification"];
                                            } else {
                                              const filtered = newMembers[index].professionalCertifications.filter(v => v !== "no_certification");
                                              newMembers[index].professionalCertifications = [...filtered, option.value];
                                            }
                                          } else {
                                            newMembers[index].professionalCertifications = 
                                              newMembers[index].professionalCertifications.filter(v => v !== option.value);
                                          }
                                          setMembers(newMembers);
                                        }}
                                      />
                                      <Label
                                        htmlFor={`cert-${index}-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                          {member.professionalCertifications.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {member.professionalCertifications.map((certValue) => {
                                const cert = CERTIFICATION_OPTIONS.find(o => o.value === certValue);
                                return (
                                  <span
                                    key={certValue}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-md"
                                  >
                                    {cert?.label || certValue}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMembers = [...members];
                                        newMembers[index].professionalCertifications = 
                                          newMembers[index].professionalCertifications.filter(v => v !== certValue);
                                        setMembers(newMembers);
                                      }}
                                      className="hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`ongoingCertification-${index}`}>Ongoing Professional Certification</Label>
                          <Select
                            value={member.ongoingCertification}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].ongoingCertification = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`ongoingCertification-${index}`} data-testid={`select-ongoing-cert-${index}`}>
                              <SelectValue placeholder="Select ongoing certification" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no_certification">No prof. certification</SelectItem>
                              <SelectItem value="accommodations">Accommodations (Hotels, Villas, Guest Houses etc.)</SelectItem>
                              <SelectItem value="automotive">Automotive (Sales, repairs)</SelectItem>
                              <SelectItem value="construction">Construction</SelectItem>
                              <SelectItem value="education">Education (Early childhood, daycare, Teacher)</SelectItem>
                              <SelectItem value="utilities">Utilities (Electricity and Water)</SelectItem>
                              <SelectItem value="financial_insurance">Financial and Insurance Activities</SelectItem>
                              <SelectItem value="fisheries_agriculture">Fisheries and Agriculture</SelectItem>
                              <SelectItem value="food_services">Food Services (Restaurants, Eateries, Bars etc.)</SelectItem>
                              <SelectItem value="health_social_work">Human Health and Social Work</SelectItem>
                              <SelectItem value="information_communication">Information and Communication</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="marine">Marine (Charter Yachts, Charter Boats, Ferry etc.)</SelectItem>
                              <SelectItem value="mining_quarrying">Mining and Quarrying</SelectItem>
                              <SelectItem value="personal_care">Personal Care (Barbershops, Hair Salons, Nail Technicians, Spas)</SelectItem>
                              <SelectItem value="professional_admin">Professional and Administrative Services</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`professionalSituation-${index}`}>Professional Situation</Label>
                          <Select
                            value={member.professionalSituation}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].professionalSituation = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`professionalSituation-${index}`} data-testid={`select-prof-situation-${index}`}>
                              <SelectValue placeholder="Select professional situation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="working_full_time">Working FULL time (35 hours or more per week)</SelectItem>
                              <SelectItem value="working_part_time">Working PART time (less than 35 hours per week)</SelectItem>
                              <SelectItem value="self_employed">Self employed</SelectItem>
                              <SelectItem value="informal_worker">Informal Worker (casual jobs/jobs of limited duration)</SelectItem>
                              <SelectItem value="unemployed">Unemployed (despite being of working age)</SelectItem>
                              <SelectItem value="retired_age_pension">Retired (receiving ONLY an Age Pension benefit from Social Security)</SelectItem>
                              <SelectItem value="retired_pension_employment">Retired with pension (pension ONLY payable from employment, 401k)</SelectItem>
                              <SelectItem value="retired_pension_both">Retired with pension (receiving pension from BOTH employment, 401k and Social Security)</SelectItem>
                              <SelectItem value="retired_no_pension">Retired without pension</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`employerDetails-${index}`}>Employer's Name, Employment History and Details</Label>
                        <Textarea
                          id={`employerDetails-${index}`}
                          value={member.employerDetails}
                          onChange={(e) => {
                            const newMembers = [...members];
                            newMembers[index].employerDetails = e.target.value;
                            setMembers(newMembers);
                          }}
                          placeholder="Enter employer name, employment history, and other relevant details..."
                          className="min-h-[80px]"
                          data-testid={`input-employer-details-${index}`}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-muted-foreground">Income</h4>
                      
                      <div className="space-y-2">
                        <Label>Income Type</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between font-normal"
                              data-testid={`select-income-type-${index}`}
                            >
                              {member.incomeType.length > 0
                                ? `${member.incomeType.length} income source(s) selected`
                                : "Select income types..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <ScrollArea className="h-[300px] p-4">
                              <div className="space-y-2">
                                {INCOME_TYPE_OPTIONS.map((option) => {
                                  const isSelected = member.incomeType.some(inc => inc.type === option.value);
                                  return (
                                    <div key={option.value} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`income-${index}-${option.value}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => {
                                          const newMembers = [...members];
                                          if (checked) {
                                            if (option.value === "none") {
                                              newMembers[index].incomeType = [{ type: "none", monthlyAmount: "", justificationProvided: "" }];
                                            } else {
                                              const filtered = newMembers[index].incomeType.filter(inc => inc.type !== "none");
                                              newMembers[index].incomeType = [...filtered, { type: option.value, monthlyAmount: "", justificationProvided: "" }];
                                            }
                                          } else {
                                            newMembers[index].incomeType = newMembers[index].incomeType.filter(inc => inc.type !== option.value);
                                          }
                                          setMembers(newMembers);
                                        }}
                                      />
                                      <Label
                                        htmlFor={`income-${index}-${option.value}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      {member.incomeType.length > 0 && (
                        <div className="space-y-4 mt-4">
                          {member.incomeType.map((incomeEntry, incIdx) => {
                            const incomeOption = INCOME_TYPE_OPTIONS.find(o => o.value === incomeEntry.type);
                            return (
                              <div key={incomeEntry.type} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{incomeOption?.label || incomeEntry.type}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMembers = [...members];
                                      newMembers[index].incomeType = newMembers[index].incomeType.filter(inc => inc.type !== incomeEntry.type);
                                      setMembers(newMembers);
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label htmlFor={`monthlyAmount-${index}-${incIdx}`} className="text-xs">Monthly Amount</Label>
                                    <Input
                                      id={`monthlyAmount-${index}-${incIdx}`}
                                      type="number"
                                      placeholder="0.00"
                                      value={incomeEntry.monthlyAmount}
                                      onChange={(e) => {
                                        const newMembers = [...members];
                                        newMembers[index].incomeType[incIdx].monthlyAmount = e.target.value;
                                        setMembers(newMembers);
                                      }}
                                      data-testid={`input-monthly-amount-${index}-${incIdx}`}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor={`justification-${index}-${incIdx}`} className="text-xs">Justification Provided</Label>
                                    <Select
                                      value={incomeEntry.justificationProvided}
                                      onValueChange={(value) => {
                                        const newMembers = [...members];
                                        newMembers[index].incomeType[incIdx].justificationProvided = value;
                                        setMembers(newMembers);
                                      }}
                                    >
                                      <SelectTrigger id={`justification-${index}-${incIdx}`} data-testid={`select-justification-${index}-${incIdx}`}>
                                        <SelectValue placeholder="Select..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="no">No</SelectItem>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="n/a">N/A</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Overall Income of Member</Label>
                              <span className="text-lg font-semibold" data-testid={`text-overall-income-${index}`}>
                                {member.incomeType.reduce((sum, inc) => sum + (parseFloat(inc.monthlyAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-muted-foreground">Member Health Information</h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label>Known Physical Disabilities</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                data-testid={`select-physical-disabilities-${index}`}
                              >
                                {member.physicalDisabilities.length > 0
                                  ? `${member.physicalDisabilities.length} selected`
                                  : "Select..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <ScrollArea className="h-[250px] p-4">
                                <div className="space-y-2">
                                  {PHYSICAL_DISABILITY_OPTIONS.map((option) => {
                                    const isSelected = member.physicalDisabilities.includes(option.value);
                                    return (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`physical-${index}-${option.value}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            const newMembers = [...members];
                                            if (checked) {
                                              if (option.value === "none") {
                                                newMembers[index].physicalDisabilities = ["none"];
                                              } else {
                                                const filtered = newMembers[index].physicalDisabilities.filter(v => v !== "none");
                                                newMembers[index].physicalDisabilities = [...filtered, option.value];
                                              }
                                            } else {
                                              newMembers[index].physicalDisabilities = newMembers[index].physicalDisabilities.filter(v => v !== option.value);
                                            }
                                            setMembers(newMembers);
                                          }}
                                        />
                                        <Label htmlFor={`physical-${index}-${option.value}`} className="text-sm font-normal cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                          {member.physicalDisabilities.includes("other") && (
                            <Input
                              placeholder="Specify other physical disability..."
                              value={member.physicalOther}
                              onChange={(e) => {
                                const newMembers = [...members];
                                newMembers[index].physicalOther = e.target.value;
                                setMembers(newMembers);
                              }}
                              data-testid={`input-physical-other-${index}`}
                            />
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">Proof/Medical Report</Label>
                            <Select
                              value={member.physicalProofMedicalReport}
                              onValueChange={(value) => {
                                const newMembers = [...members];
                                newMembers[index].physicalProofMedicalReport = value;
                                setMembers(newMembers);
                              }}
                            >
                              <SelectTrigger data-testid={`select-physical-proof-${index}`}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {PROOF_MEDICAL_REPORT_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Known Mental Disabilities</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                data-testid={`select-mental-disabilities-${index}`}
                              >
                                {member.mentalDisabilities.length > 0
                                  ? `${member.mentalDisabilities.length} selected`
                                  : "Select..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <ScrollArea className="h-[200px] p-4">
                                <div className="space-y-2">
                                  {MENTAL_DISABILITY_OPTIONS.map((option) => {
                                    const isSelected = member.mentalDisabilities.includes(option.value);
                                    return (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`mental-${index}-${option.value}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            const newMembers = [...members];
                                            if (checked) {
                                              if (option.value === "none") {
                                                newMembers[index].mentalDisabilities = ["none"];
                                              } else {
                                                const filtered = newMembers[index].mentalDisabilities.filter(v => v !== "none");
                                                newMembers[index].mentalDisabilities = [...filtered, option.value];
                                              }
                                            } else {
                                              newMembers[index].mentalDisabilities = newMembers[index].mentalDisabilities.filter(v => v !== option.value);
                                            }
                                            setMembers(newMembers);
                                          }}
                                        />
                                        <Label htmlFor={`mental-${index}-${option.value}`} className="text-sm font-normal cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                          {member.mentalDisabilities.includes("other") && (
                            <Input
                              placeholder="Specify other mental health condition..."
                              value={member.mentalOther}
                              onChange={(e) => {
                                const newMembers = [...members];
                                newMembers[index].mentalOther = e.target.value;
                                setMembers(newMembers);
                              }}
                              data-testid={`input-mental-other-${index}`}
                            />
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">Proof/Medical Report</Label>
                            <Select
                              value={member.mentalProofMedicalReport}
                              onValueChange={(value) => {
                                const newMembers = [...members];
                                newMembers[index].mentalProofMedicalReport = value;
                                setMembers(newMembers);
                              }}
                            >
                              <SelectTrigger data-testid={`select-mental-proof-${index}`}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {PROOF_MEDICAL_REPORT_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label>Known Chronic Illness</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal"
                                data-testid={`select-chronic-illness-${index}`}
                              >
                                {member.chronicIllness.length > 0
                                  ? `${member.chronicIllness.length} selected`
                                  : "Select..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <ScrollArea className="h-[250px] p-4">
                                <div className="space-y-2">
                                  {CHRONIC_ILLNESS_OPTIONS.map((option) => {
                                    const isSelected = member.chronicIllness.includes(option.value);
                                    return (
                                      <div key={option.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`chronic-${index}-${option.value}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            const newMembers = [...members];
                                            if (checked) {
                                              if (option.value === "none") {
                                                newMembers[index].chronicIllness = ["none"];
                                              } else {
                                                const filtered = newMembers[index].chronicIllness.filter(v => v !== "none");
                                                newMembers[index].chronicIllness = [...filtered, option.value];
                                              }
                                            } else {
                                              newMembers[index].chronicIllness = newMembers[index].chronicIllness.filter(v => v !== option.value);
                                            }
                                            setMembers(newMembers);
                                          }}
                                        />
                                        <Label htmlFor={`chronic-${index}-${option.value}`} className="text-sm font-normal cursor-pointer">
                                          {option.label}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                          {member.chronicIllness.includes("other") && (
                            <Input
                              placeholder="Specify other chronic illness..."
                              value={member.chronicOther}
                              onChange={(e) => {
                                const newMembers = [...members];
                                newMembers[index].chronicOther = e.target.value;
                                setMembers(newMembers);
                              }}
                              data-testid={`input-chronic-other-${index}`}
                            />
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">Proof/Medical Report</Label>
                            <Select
                              value={member.chronicProofMedicalReport}
                              onValueChange={(value) => {
                                const newMembers = [...members];
                                newMembers[index].chronicProofMedicalReport = value;
                                setMembers(newMembers);
                              }}
                            >
                              <SelectTrigger data-testid={`select-chronic-proof-${index}`}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {PROOF_MEDICAL_REPORT_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Implications on Working Abilities</Label>
                          <Select
                            value={member.workingAbilityImplications}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].workingAbilityImplications = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger data-testid={`select-working-ability-${index}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {WORKING_ABILITY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {member.workingAbilityImplications === "unable" && (
                          <div className="space-y-2">
                            <Label>Inability to Work Supported by Medical Proof</Label>
                            <Select
                              value={member.inabilityToWorkProof}
                              onValueChange={(value) => {
                                const newMembers = [...members];
                                newMembers[index].inabilityToWorkProof = value;
                                setMembers(newMembers);
                              }}
                            >
                              <SelectTrigger data-testid={`select-inability-proof-${index}`}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {INABILITY_PROOF_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardFooter className="bg-muted/50 flex justify-end gap-4 p-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  disabled={createHouseholdMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[150px]"
                  disabled={createHouseholdMutation.isPending}
                  data-testid="button-submit"
                >
                  {createHouseholdMutation.isPending ? "Submitting..." : "Submit Intake"}
                </Button>
              </CardFooter>
            </Card>

          </div>
        </form>

        <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplicate ID Found</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This National ID is already registered in the system.</p>
                {duplicateResult?.member && (
                  <div className="bg-muted p-3 rounded-md mt-2">
                    <p className="font-medium">{duplicateResult.member.firstName} {duplicateResult.member.lastName}</p>
                    {duplicateResult.household?.applicationId && (
                      <p className="text-sm text-muted-foreground">Application: {duplicateResult.household.applicationId}</p>
                    )}
                  </div>
                )}
                <p className="mt-2">Would you like to add a new application for this existing client?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDuplicateReject}>
                No, Enter Different ID
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDuplicateConfirm}>
                Yes, Use Existing Client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
