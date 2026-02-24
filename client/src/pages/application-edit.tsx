import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, User, Calendar, UserCheck, ArrowLeft, Home } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type IncomeEntry = {
  type: string;
  monthlyAmount: string;
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
  currentEducationEnrolment: string;
  professionalCertifications: string;
  ongoingCertification: string;
  professionalSituation: string;
  employerDetails: string;
  incomeType: IncomeEntry[];
  narrativeSummary: string;
};

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

export function ApplicationEdit() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const householdId = params.id;
  const queryClient = useQueryClient();

  const [hasProxy, setHasProxy] = useState(false);
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [householdData, setHouseholdData] = useState<any>(null);
  const [roofType, setRoofType] = useState("");
  const [wallType, setWallType] = useState("");
  const [householdAssetsList, setHouseholdAssetsList] = useState<string[]>([]);
  const [homeVisitNotes, setHomeVisitNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['household', householdId],
    queryFn: async () => {
      const response = await fetch(`/api/households/${householdId}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    enabled: !!householdId,
  });

  useEffect(() => {
    if (data) {
      setHouseholdData(data.household);
      setHasProxy(!data.household.isOnOwnBehalf);
      setRoofType(data.household.roofType || "");
      setWallType(data.household.wallType || "");
      setHomeVisitNotes(data.household.homeVisitNotes || "");
      try {
        const assets = data.household.householdAssetsList ? JSON.parse(data.household.householdAssetsList) : [];
        setHouseholdAssetsList(Array.isArray(assets) ? assets : []);
      } catch { setHouseholdAssetsList([]); }
      setMembers(data.members.map((m: any) => {
        let incomeEntries: IncomeEntry[] = [];
        if (m.incomeType) {
          try {
            const parsed = typeof m.incomeType === 'string' ? JSON.parse(m.incomeType) : m.incomeType;
            if (Array.isArray(parsed)) incomeEntries = parsed.map((e: any) => ({ type: e.type || '', monthlyAmount: e.monthlyAmount?.toString() || '' }));
          } catch { /* ignore */ }
        }
        return {
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : '',
          gender: m.gender,
          relationshipToHead: m.relationshipToHead,
          nationalId: m.nationalId || '',
          disabilityStatus: m.disabilityStatus || false,
          maritalStatus: m.maritalStatus || '',
          educationLevel: m.educationLevel || '',
          currentEducationEnrolment: m.currentEducationEnrolment || '',
          professionalCertifications: m.professionalCertifications || '',
          ongoingCertification: m.ongoingCertification || '',
          professionalSituation: m.professionalSituation || '',
          employerDetails: m.employerDetails || '',
          incomeType: incomeEntries,
          narrativeSummary: m.narrativeSummary || '',
        };
      }));
    }
  }, [data]);

  const updateHouseholdMutation = useMutation({
    mutationFn: async (updateData: { household: any; members: any[] }) => {
      const response = await fetch(`/api/households/${householdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update application");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', householdId] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast({
        title: "Application Updated",
        description: "The application has been successfully updated.",
      });
      setLocation(`/application/${householdId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const household = {
      province: formData.get("province") as string,
      district: formData.get("district") as string,
      village: formData.get("village") as string,
      gpsCoordinates: formData.get("gps") as string || null,
      intakeDate: formData.get("intakeDate") as string || null,
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
      roofType: roofType || null,
      wallType: wallType || null,
      householdAssetsList: householdAssetsList.length > 0 ? JSON.stringify(householdAssetsList) : null,
      homeVisitNotes: homeVisitNotes || null,
    };

    const formattedMembers = members.map((member, index) => ({
      id: member.id,
      firstName: formData.get(`firstName-${index}`) as string,
      lastName: formData.get(`lastName-${index}`) as string,
      dateOfBirth: new Date(formData.get(`dateOfBirth-${index}`) as string),
      gender: formData.get(`gender-${index}`) as string,
      relationshipToHead: index === 0 ? "head" : (formData.get(`relationship-${index}`) as string),
      nationalId: formData.get(`nationalId-${index}`) as string || null,
      disabilityStatus: member.disabilityStatus,
      isHead: index === 0,
      maritalStatus: member.maritalStatus || null,
      educationLevel: member.educationLevel || null,
      currentEducationEnrolment: member.currentEducationEnrolment || null,
      professionalCertifications: member.professionalCertifications || null,
      ongoingCertification: member.ongoingCertification || null,
      professionalSituation: member.professionalSituation || null,
      employerDetails: member.employerDetails || null,
      incomeType: member.incomeType.length > 0 ? JSON.stringify(member.incomeType) : null,
      narrativeSummary: member.narrativeSummary || null,
    }));

    updateHouseholdMutation.mutate({
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
      currentEducationEnrolment: "",
      professionalCertifications: "",
      ongoingCertification: "",
      professionalSituation: "",
      employerDetails: "",
      incomeType: [],
      narrativeSummary: "",
    }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
  };

  if (isLoading || !householdData) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">Loading application...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setLocation(`/application/${householdId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Edit Application</h1>
            <p className="text-muted-foreground">
              Application ID: <span className="font-mono">{householdData.applicationId || householdData.householdCode}</span>
              {' '}&bull;{' '}
              Household Code: <span className="font-mono">{householdData.householdCode}</span>
            </p>
          </div>
        </div>

        {/* Primary Applicant Highlight */}
        {(() => {
          const headOfHousehold = members?.find((m) => m.relationshipToHead === 'head');
          if (!headOfHousehold) return null;
          const age = headOfHousehold.dateOfBirth
            ? Math.floor((new Date().getTime() - new Date(headOfHousehold.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;
          return (
            <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                    {headOfHousehold.firstName?.charAt(0)}{headOfHousehold.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-primary text-primary-foreground mb-1">Primary Applicant</Badge>
                    <h2 className="text-2xl font-bold text-foreground">
                      {headOfHousehold.firstName} {headOfHousehold.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Age:</span> {age || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Sex:</span> <span className="capitalize">{headOfHousehold.gender}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">National ID:</span>
                        <span className="font-mono">{headOfHousehold.nationalId || '—'}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Location:</span> {householdData.village}, {householdData.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Household Size:</span> {members?.length || 0} member(s)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">

            {/* Intake Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Intake Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="intakeDate">Date of Intake</Label>
                    <Input
                      id="intakeDate"
                      name="intakeDate"
                      type="date"
                      defaultValue={householdData.intakeDate ? new Date(householdData.intakeDate).toISOString().split('T')[0] : ''}
                      required
                      data-testid="input-intake-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outreachType">Type of Outreach</Label>
                    <Select name="outreachType" defaultValue={householdData.outreachType || undefined}>
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
                    <Select name="outreachMethod" defaultValue={householdData.outreachMethod || undefined}>
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
                      defaultValue={householdData.isOnOwnBehalf ? "yes" : "no"}
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
                    <Select name="requestPurpose" defaultValue={householdData.requestPurpose || undefined}>
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
                    <Select name="actionTaken" defaultValue={householdData.actionTaken || undefined}>
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
                      defaultValue={householdData.followUpNotes || ''}
                      placeholder="Enter any additional notes regarding follow-up actions..."
                      rows={3}
                      data-testid="textarea-follow-up-notes"
                    />
                  </div>
                </div>

                {/* Proxy Information */}
                {hasProxy && (
                  <>
                    <Separator />
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 mb-4">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Proxy Information</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Enter the details of the person applying on behalf of the applicant.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="proxyFirstName">Proxy First Name</Label>
                          <Input
                            id="proxyFirstName"
                            name="proxyFirstName"
                            defaultValue={householdData.proxyFirstName || ''}
                            placeholder="First name"
                            data-testid="input-proxy-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyLastName">Proxy Last Name</Label>
                          <Input
                            id="proxyLastName"
                            name="proxyLastName"
                            defaultValue={householdData.proxyLastName || ''}
                            placeholder="Last name"
                            data-testid="input-proxy-last-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyAlias">Proxy Alias</Label>
                          <Input
                            id="proxyAlias"
                            name="proxyAlias"
                            defaultValue={householdData.proxyAlias || ''}
                            placeholder="Alias / Nickname"
                            data-testid="input-proxy-alias"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyGender">Proxy Gender</Label>
                          <Select name="proxyGender" defaultValue={householdData.proxyGender || undefined}>
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
                            defaultValue={householdData.proxyDateOfBirth ? new Date(householdData.proxyDateOfBirth).toISOString().split('T')[0] : ''}
                            data-testid="input-proxy-dob"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyNationalId">Proxy National ID</Label>
                          <Input
                            id="proxyNationalId"
                            name="proxyNationalId"
                            defaultValue={householdData.proxyNationalId || ''}
                            placeholder="ID Number"
                            data-testid="input-proxy-national-id"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="proxyAddress">Proxy Address</Label>
                          <Input
                            id="proxyAddress"
                            name="proxyAddress"
                            defaultValue={householdData.proxyAddress || ''}
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
                            defaultValue={householdData.proxyPhone || ''}
                            placeholder="Phone number"
                            data-testid="input-proxy-phone"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyRelationship">Proxy Relationship to Applicant</Label>
                          <Select name="proxyRelationship" defaultValue={householdData.proxyRelationship || undefined}>
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
                            defaultValue={householdData.proxyRole || ''}
                            placeholder="e.g., Caregiver, Legal Guardian"
                            data-testid="input-proxy-role"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="proxyReason">Reason for Proxy</Label>
                          <Textarea
                            id="proxyReason"
                            name="proxyReason"
                            defaultValue={householdData.proxyReason || ''}
                            placeholder="Explain why a proxy is needed..."
                            rows={2}
                            data-testid="textarea-proxy-reason"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Applicant Information</CardTitle>
                </div>
                <CardDescription>Edit details for the applicant and all household members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {members.map((member, index) => (
                  <div key={member.id || index} className="relative">
                    {index > 0 && <Separator className="my-6" />}
                    <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-4">
                      {index === 0 ? "Head of Household" : `Member #${index + 1}`}
                    </h3>

                    {/* Personal Details */}
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Personal Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input name={`firstName-${index}`} defaultValue={member.firstName} placeholder="Given Name" required data-testid={`input-firstname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input name={`lastName-${index}`} defaultValue={member.lastName} placeholder="Surname" required data-testid={`input-lastname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input name={`dateOfBirth-${index}`} defaultValue={member.dateOfBirth} type="date" required data-testid={`input-dob-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select name={`gender-${index}`} defaultValue={member.gender} required>
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
                        <Select name={`relationship-${index}`} defaultValue={member.relationshipToHead} disabled={index === 0}>
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
                        <Label>National ID / Ref #</Label>
                        <Input name={`nationalId-${index}`} defaultValue={member.nationalId} placeholder="ID Number" data-testid={`input-nationalid-${index}`} />
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
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Location Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Address</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="province">Province/Region</Label>
                  <Select name="province" defaultValue={householdData.province} required>
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
                  <Select name="district" defaultValue={householdData.district} required>
                    <SelectTrigger id="district" data-testid="select-district">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Capital District">Capital District</SelectItem>
                      <SelectItem value="River District">River District</SelectItem>
                      <SelectItem value="Mountain District">Mountain District</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village / Community</Label>
                  <Input id="village" name="village" defaultValue={householdData.village} placeholder="Enter village name" required data-testid="input-village" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gps">GPS Coordinates (Optional)</Label>
                  <Input id="gps" name="gps" defaultValue={householdData.gpsCoordinates || ''} placeholder="Lat, Long" data-testid="input-gps" />
                </div>
              </CardContent>
            </Card>

            {/* Home Visit Information */}
            {householdData.homeVisitStatus === 'completed' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      <CardTitle>Home Visit Information</CardTitle>
                    </div>
                    <Button type="button" onClick={addMember} variant="outline" size="sm" className="gap-2" data-testid="button-add-member">
                      <Plus className="h-4 w-4" /> Add Member
                    </Button>
                  </div>
                  <CardDescription>Data collected during the home visit. Edit household details and member education, employment & income.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Household Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="roofType">Roof Type</Label>
                      <Select value={roofType} onValueChange={setRoofType}>
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
                      <Select value={wallType} onValueChange={setWallType}>
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
                              checked={householdAssetsList.includes(option.value)}
                              onCheckedChange={(checked) => {
                                setHouseholdAssetsList(prev =>
                                  checked
                                    ? [...prev, option.value]
                                    : prev.filter(v => v !== option.value)
                                );
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
                        value={homeVisitNotes}
                        onChange={(e) => setHomeVisitNotes(e.target.value)}
                        placeholder="Notes from the home visit..."
                        rows={3}
                        data-testid="textarea-home-visit-notes"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Per-Member Education, Employment & Income */}
                  {members.map((member, index) => (
                    <div key={member.id || `hv-${index}`}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                          {member.firstName} {member.lastName}
                          {index === 0 ? ' (Head of Household)' : ''}
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

                      {/* Education */}
                      <p className="text-xs font-semibold text-muted-foreground mt-2 mb-2">Education</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <Label>Current Enrolment</Label>
                          <Input
                            value={member.currentEducationEnrolment}
                            onChange={(e) => {
                              const newMembers = [...members];
                              newMembers[index].currentEducationEnrolment = e.target.value;
                              setMembers(newMembers);
                            }}
                            placeholder="Current education enrolment"
                            data-testid={`input-enrolment-${index}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Professional Certifications</Label>
                          <Input
                            value={member.professionalCertifications}
                            onChange={(e) => {
                              const newMembers = [...members];
                              newMembers[index].professionalCertifications = e.target.value;
                              setMembers(newMembers);
                            }}
                            placeholder="Certifications"
                            data-testid={`input-certifications-${index}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ongoing Certification</Label>
                          <Input
                            value={member.ongoingCertification}
                            onChange={(e) => {
                              const newMembers = [...members];
                              newMembers[index].ongoingCertification = e.target.value;
                              setMembers(newMembers);
                            }}
                            placeholder="Ongoing certification"
                            data-testid={`input-ongoing-cert-${index}`}
                          />
                        </div>
                      </div>

                      {/* Employment & Income */}
                      <p className="text-xs font-semibold text-muted-foreground mt-6 mb-2">Employment & Income</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="space-y-2 md:col-span-2">
                          <Label>Employer Details</Label>
                          <Input
                            value={member.employerDetails}
                            onChange={(e) => {
                              const newMembers = [...members];
                              newMembers[index].employerDetails = e.target.value;
                              setMembers(newMembers);
                            }}
                            placeholder="Employer name / details"
                            data-testid={`input-employer-${index}`}
                          />
                        </div>
                      </div>

                      {/* Income Entries */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Income Sources</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              const newMembers = [...members];
                              newMembers[index].incomeType = [...newMembers[index].incomeType, { type: '', monthlyAmount: '' }];
                              setMembers(newMembers);
                            }}
                          >
                            <Plus className="h-3 w-3" /> Add Income
                          </Button>
                        </div>
                        {member.incomeType.length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No income sources recorded.</p>
                        )}
                        {member.incomeType.map((income, incIdx) => (
                          <div key={incIdx} className="flex items-end gap-2 mb-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={income.type}
                                onValueChange={(value) => {
                                  const newMembers = [...members];
                                  newMembers[index].incomeType[incIdx].type = value;
                                  setMembers(newMembers);
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {INCOME_TYPE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 space-y-1">
                              <Label className="text-xs">Monthly ($)</Label>
                              <Input
                                className="h-9"
                                type="number"
                                value={income.monthlyAmount}
                                onChange={(e) => {
                                  const newMembers = [...members];
                                  newMembers[index].incomeType[incIdx].monthlyAmount = e.target.value;
                                  setMembers(newMembers);
                                }}
                                placeholder="0.00"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                const newMembers = [...members];
                                newMembers[index].incomeType.splice(incIdx, 1);
                                setMembers(newMembers);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Narrative Summary */}
                      <div className="mt-4 space-y-2">
                        <Label>Notes / Narrative Summary</Label>
                        <Textarea
                          value={member.narrativeSummary}
                          onChange={(e) => {
                            const newMembers = [...members];
                            newMembers[index].narrativeSummary = e.target.value;
                            setMembers(newMembers);
                          }}
                          placeholder="Additional notes about this member..."
                          rows={2}
                          data-testid={`textarea-narrative-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardFooter className="bg-muted/50 flex justify-between gap-4 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/application/${householdId}`)}
                  disabled={updateHouseholdMutation.isPending}
                  className="cursor-pointer"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="min-w-[150px] cursor-pointer"
                  disabled={updateHouseholdMutation.isPending}
                  data-testid="button-save"
                >
                  {updateHouseholdMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>

          </div>
        </form>
      </main>
    </div>
  );
}
