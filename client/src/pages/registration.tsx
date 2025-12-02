import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, MapPin, User, FileText, Upload, Calendar, UserCheck, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

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
  professionalCertifications: string;
  currentEducationEnrolment: string;
  ongoingCertification: string;
  professionalSituation: string;
  employerDetails: string;
};

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
      relationshipToHead: "head",
      nationalId: "",
      disabilityStatus: false,
      maritalStatus: "",
      educationLevel: "",
      professionalCertifications: "",
      currentEducationEnrolment: "",
      ongoingCertification: "",
      professionalSituation: "",
      employerDetails: "",
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
      relationshipToHead: index === 0 ? "head" : (formData.get(`relationship-${index}`) as string),
      nationalId: formData.get(`nationalId-${index}`) as string || null,
      disabilityStatus: formData.get(`disability-${index}`) === "on",
      isHead: index === 0,
      maritalStatus: member.maritalStatus || null,
      educationLevel: member.educationLevel || null,
      professionalCertifications: member.professionalCertifications || null,
      currentEducationEnrolment: member.currentEducationEnrolment || null,
      ongoingCertification: member.ongoingCertification || null,
      professionalSituation: member.professionalSituation || null,
      employerDetails: member.employerDetails || null,
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
      professionalCertifications: "",
      currentEducationEnrolment: "",
      ongoingCertification: "",
      professionalSituation: "",
      employerDetails: "",
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
        professionalCertifications: m.professionalCertifications || "",
        currentEducationEnrolment: m.currentEducationEnrolment || "",
        ongoingCertification: m.ongoingCertification || "",
        professionalSituation: m.professionalSituation || "",
        employerDetails: m.employerDetails || "",
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
        professionalCertifications: member.professionalCertifications || "",
        currentEducationEnrolment: member.currentEducationEnrolment || "",
        ongoingCertification: member.ongoingCertification || "",
        professionalSituation: member.professionalSituation || "",
        employerDetails: member.employerDetails || "",
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
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <Checkbox 
                        id={`disability-${index}`} 
                        name={`disability-${index}`} 
                        checked={member.disabilityStatus}
                        onCheckedChange={(checked) => {
                          const newMembers = [...members];
                          newMembers[index].disabilityStatus = checked === true;
                          setMembers(newMembers);
                        }}
                        data-testid={`checkbox-disability-${index}`} 
                      />
                      <Label htmlFor={`disability-${index}`} className="font-normal text-muted-foreground">
                        This member has a documented disability
                      </Label>
                    </div>
                    
                    {member.disabilityStatus && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor={`disabilityDoc-${index}`} className="text-sm font-medium">
                          Upload Disability Documentation
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input 
                            id={`disabilityDoc-${index}`}
                            name={`disabilityDoc-${index}`}
                            type="file" 
                            className="flex-1"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            data-testid={`input-disability-doc-${index}`} 
                          />
                          <Button type="button" variant="outline" size="icon" title="Upload Document">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Upload medical certificate or official documentation</p>
                      </div>
                    )}
                    
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
                          <Select
                            value={member.professionalCertifications}
                            onValueChange={(value) => {
                              const newMembers = [...members];
                              newMembers[index].professionalCertifications = value;
                              setMembers(newMembers);
                            }}
                          >
                            <SelectTrigger id={`professionalCertifications-${index}`} data-testid={`select-prof-certs-${index}`}>
                              <SelectValue placeholder="Select certification" />
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
                        <Select
                          value={member.employerDetails}
                          onValueChange={(value) => {
                            const newMembers = [...members];
                            newMembers[index].employerDetails = value;
                            setMembers(newMembers);
                          }}
                        >
                          <SelectTrigger id={`employerDetails-${index}`} data-testid={`select-employer-details-${index}`}>
                            <SelectValue placeholder="Select industry/sector" />
                          </SelectTrigger>
                          <SelectContent>
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
                            <SelectItem value="public_admin">Public Administration, Defence and Social Security (Government, RVIPF, Statutory Bodies)</SelectItem>
                            <SelectItem value="real_estate">Real Estate</SelectItem>
                            <SelectItem value="retail_grocery">Retail: Groceries, Mini Marts, Supermarkets</SelectItem>
                            <SelectItem value="retail_non_grocery">Retail: Non-Grocery (Clothing, Electronics)</SelectItem>
                            <SelectItem value="transportation_storage">Transportation & Storage (Heavy Equipment, General Truck Services etc.)</SelectItem>
                            <SelectItem value="transportation_passenger">Transportation (Taxi, School Bus etc.)</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                            <SelectItem value="other">Other (Please specify)</SelectItem>
                          </SelectContent>
                        </Select>
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
