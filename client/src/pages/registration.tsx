import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useCallback } from "react";
import { MapPin, Upload, Calendar, UserCheck, User, Users, AlertCircle, XCircle, Search, CheckCircle2, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type LocationForm = {
  province: string;
  district: string;
  village: string;
  gpsCoordinates: string;
};

type ApplicantForm = {
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  educationLevel: string;
};

export function Registration() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [hasProxy, setHasProxy] = useState(false);

  // Last name lookup state
  const [lastNameMatches, setLastNameMatches] = useState<any[]>([]);
  const [lastNameSearchDone, setLastNameSearchDone] = useState(false);
  const [lastNameDismissed, setLastNameDismissed] = useState(false);

  // Last name match selection state
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  // Carried-forward household members (non-head members from prior application)
  const [carriedMembers, setCarriedMembers] = useState<any[]>([]);

  // National ID duplicate state
  const [nidDuplicate, setNidDuplicate] = useState<any>(null);
  const [nidChecking, setNidChecking] = useState(false);

  const lookupLastName = useCallback(async (lastName: string) => {
    const trimmed = lastName.trim();
    if (trimmed.length < 2) {
      setLastNameMatches([]);
      setLastNameSearchDone(false);
      return;
    }
    try {
      const res = await fetch(`/api/registry/search-by-lastname/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const matches = await res.json();
        setLastNameMatches(matches);
        setLastNameSearchDone(true);
        setLastNameDismissed(false);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSelectMatch = useCallback(async (match: any) => {
    setSelectedMatch(match);
    setCopyConfirmOpen(true);
  }, []);

  const handleConfirmCopy = useCallback(async () => {
    if (!selectedMatch) return;
    setCopyLoading(true);
    try {
      const res = await fetch(`/api/households/${selectedMatch.householdId}`);
      if (!res.ok) throw new Error("Failed to fetch application data");
      const data = await res.json();
      const household = data.household;
      const head = data.members?.find((m: any) => m.isHead) || data.members?.[0];

      if (head) {
        const dob = head.dateOfBirth
          ? (head.dateOfBirth instanceof Date
              ? head.dateOfBirth.toISOString().split('T')[0]
              : typeof head.dateOfBirth === 'string' && head.dateOfBirth.includes('T')
                ? head.dateOfBirth.split('T')[0]
                : String(head.dateOfBirth))
          : "";
        setApplicant({
          firstName: head.firstName || "",
          lastName: head.lastName || "",
          nationalId: head.nationalId || "",
          dateOfBirth: dob,
          gender: head.gender || "",
          maritalStatus: head.maritalStatus || "",
          educationLevel: head.educationLevel || "",
        });
      }

      if (household) {
        setLocationData({
          province: household.province || "",
          district: household.district || "",
          village: household.village || "",
          gpsCoordinates: household.gpsCoordinates || "",
        });
      }

      // Carry forward non-head household members (strip IDs so new records are created)
      const otherMembers = (data.members || [])
        .filter((m: any) => !m.isHead)
        .map(({ id, householdId, ...rest }: any) => rest);
      setCarriedMembers(otherMembers);

      setLastNameDismissed(true);
      setCopyConfirmOpen(false);
      setSelectedMatch(null);
      const memberCount = otherMembers.length;
      toast({
        title: "Information Copied",
        description: `Applicant and address info copied from ${selectedMatch.applicationId}.${memberCount > 0 ? ` ${memberCount} household member${memberCount > 1 ? 's' : ''} also carried forward.` : ''}`,
      });
    } catch (error: any) {
      toast({
        title: "Copy Failed",
        description: error.message || "Could not fetch application data.",
        variant: "destructive",
      });
    }
    setCopyLoading(false);
  }, [selectedMatch, toast]);

  const checkNationalId = useCallback(async (nid: string) => {
    const trimmed = nid.trim();
    if (trimmed.length < 3) {
      setNidDuplicate(null);
      return;
    }
    setNidChecking(true);
    try {
      const res = await fetch(`/api/registry/check-national-id/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setNidDuplicate(data.found ? data : null);
      }
    } catch { /* ignore */ }
    setNidChecking(false);
  }, []);

  const [locationData, setLocationData] = useState<LocationForm>({
    province: "",
    district: "",
    village: "",
    gpsCoordinates: "",
  });
  
  const [applicant, setApplicant] = useState<ApplicantForm>({
    firstName: "",
    lastName: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    educationLevel: "",
  });

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
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['households-with-members'] });
      toast({
        title: "Intake Successful",
        description: "Application created and awaiting home visit.",
      });
      setTimeout(() => setLocation("/worksheet"), 1500);
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

    if (nidDuplicate) {
      toast({
        title: "Duplicate National ID",
        description: `This National ID is already registered to ${nidDuplicate.member.firstName} ${nidDuplicate.member.lastName}.`,
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
      homeVisitStatus: "pending",
    };

    const applicantMember = {
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      nationalId: applicant.nationalId,
      dateOfBirth: applicant.dateOfBirth ? new Date(applicant.dateOfBirth) : null,
      gender: applicant.gender || null,
      maritalStatus: applicant.maritalStatus || null,
      educationLevel: applicant.educationLevel || null,
      relationshipToHead: "head",
      isHead: true,
      disabilityStatus: false,
    };

    createHouseholdMutation.mutate({
      household,
      members: [applicantMember, ...carriedMembers],
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

            {/* Card 1: Intake Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Intake Details</CardTitle>
                </div>
                <CardDescription>Record when and how the applicant reached the program.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                {/* Proxy Sub-section - Only shown when "No (Proxy)" is selected */}
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
                          <Input id="proxyFirstName" name="proxyFirstName" placeholder="First name" data-testid="input-proxy-first-name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyLastName">Proxy Last Name</Label>
                          <Input id="proxyLastName" name="proxyLastName" placeholder="Last name" data-testid="input-proxy-last-name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyAlias">Proxy Alias</Label>
                          <Input id="proxyAlias" name="proxyAlias" placeholder="Alias / Nickname" data-testid="input-proxy-alias" />
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
                          <Input id="proxyDateOfBirth" name="proxyDateOfBirth" type="date" data-testid="input-proxy-dob" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyNationalId">Proxy National ID</Label>
                          <Input id="proxyNationalId" name="proxyNationalId" placeholder="ID Number" data-testid="input-proxy-national-id" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="proxyAddress">Proxy Address</Label>
                          <Input id="proxyAddress" name="proxyAddress" placeholder="Full address" data-testid="input-proxy-address" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyPhone">Proxy Phone</Label>
                          <Input id="proxyPhone" name="proxyPhone" type="tel" placeholder="Phone number" data-testid="input-proxy-phone" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyRelationship">Relationship to Applicant</Label>
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
                          <Input id="proxyRole" name="proxyRole" placeholder="e.g., Caregiver, Legal Guardian" data-testid="input-proxy-role" />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <Label htmlFor="proxyReason">Reason for Proxy</Label>
                          <Textarea id="proxyReason" name="proxyReason" placeholder="Explain why a proxy is needed..." rows={2} data-testid="textarea-proxy-reason" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Applicant Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Applicant Information</CardTitle>
                </div>
                <CardDescription>Basic information about the person applying for assistance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="applicantFirstName">First Name *</Label>
                    <Input 
                      id="applicantFirstName"
                      placeholder="Given Name"
                      value={applicant.firstName}
                      onChange={(e) => setApplicant(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      data-testid="input-applicant-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantLastName">Last Name *</Label>
                    <div className="relative">
                      <Input
                        id="applicantLastName"
                        placeholder="Surname"
                        value={applicant.lastName}
                        onChange={(e) => {
                          setApplicant(prev => ({ ...prev, lastName: e.target.value }));
                          setLastNameSearchDone(false);
                          setLastNameDismissed(false);
                        }}
                        onBlur={() => lookupLastName(applicant.lastName)}
                        required
                        data-testid="input-applicant-lastname"
                      />
                      {lastNameSearchDone && lastNameMatches.length > 0 && (
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantNationalId">National ID *</Label>
                    <div className="relative">
                      <Input
                        id="applicantNationalId"
                        placeholder="ID Number"
                        value={applicant.nationalId}
                        onChange={(e) => {
                          setApplicant(prev => ({ ...prev, nationalId: e.target.value }));
                          setNidDuplicate(null);
                        }}
                        onBlur={() => checkNationalId(applicant.nationalId)}
                        required
                        className={nidDuplicate ? "border-destructive focus-visible:ring-destructive" : ""}
                        data-testid="input-applicant-nationalid"
                      />
                      {nidChecking && (
                        <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">Checking...</span>
                      )}
                      {nidDuplicate && (
                        <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {nidDuplicate && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        This National ID is already registered to {nidDuplicate.member.firstName} {nidDuplicate.member.lastName} ({nidDuplicate.household.applicationId || nidDuplicate.household.householdCode})
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantDob">Date of Birth</Label>
                    <Input 
                      id="applicantDob"
                      type="date"
                      value={applicant.dateOfBirth}
                      onChange={(e) => setApplicant(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      data-testid="input-applicant-dob"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantGender">Gender</Label>
                    <Select 
                      value={applicant.gender}
                      onValueChange={(value) => setApplicant(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger id="applicantGender" data-testid="select-applicant-gender">
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
                    <Label htmlFor="applicantMarital">Marital Status</Label>
                    <Select 
                      value={applicant.maritalStatus}
                      onValueChange={(value) => setApplicant(prev => ({ ...prev, maritalStatus: value }))}
                    >
                      <SelectTrigger id="applicantMarital" data-testid="select-applicant-marital">
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
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="applicantEducation">Education Level</Label>
                    <Select 
                      value={applicant.educationLevel}
                      onValueChange={(value) => setApplicant(prev => ({ ...prev, educationLevel: value }))}
                    >
                      <SelectTrigger id="applicantEducation" data-testid="select-applicant-education">
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
                </div>

                {/* Last name match alert */}
                {lastNameSearchDone && lastNameMatches.length > 0 && !lastNameDismissed && (
                  <Alert variant="default" className="mt-4 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                      Possible Match Found
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      {!copyConfirmOpen ? (
                        <>
                          <p className="mb-3">
                            {lastNameMatches.length === 1
                              ? 'There is 1 existing person'
                              : `There are ${lastNameMatches.length} existing people`} with the last name "{applicant.lastName}". Select a match to copy their information, or continue if none apply.
                          </p>
                          <div className="space-y-2 mb-3">
                            {lastNameMatches.map((match: any) => (
                              <button
                                type="button"
                                key={`${match.memberId}-${match.householdId}`}
                                className="w-full flex items-center gap-3 p-2 bg-white/60 dark:bg-black/20 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 cursor-pointer transition-colors text-left"
                                onClick={() => handleSelectMatch(match)}
                              >
                                <span className="font-medium text-sm">{match.firstName} {match.lastName}</span>
                                {match.nationalId && (
                                  <span className="text-xs font-mono text-muted-foreground">ID: {match.nationalId}</span>
                                )}
                                {match.dateOfBirth && (
                                  <span className="text-xs text-muted-foreground">DOB: {new Date(match.dateOfBirth).toLocaleDateString()}</span>
                                )}
                                <Badge variant="secondary" className="text-xs ml-auto">
                                  {match.programStatus?.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">{match.applicationId}</span>
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-amber-800 border-amber-300 hover:bg-amber-100"
                              onClick={() => setLastNameDismissed(true)}
                            >
                              Not the same person — continue
                            </Button>
                          </div>
                        </>
                      ) : selectedMatch && (
                        <div className="space-y-3">
                          <p>
                            Copy applicant and address information from <strong>{selectedMatch.firstName} {selectedMatch.lastName}</strong>'s application <strong>{selectedMatch.applicationId}</strong>?
                          </p>
                          <p className="text-xs">This will fill in the Applicant Information and Location & Address fields. Proxy information will not be copied.</p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={handleConfirmCopy}
                              disabled={copyLoading}
                            >
                              {copyLoading ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Copying...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Yes, copy information
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-amber-800 border-amber-300 hover:bg-amber-100"
                              onClick={() => { setCopyConfirmOpen(false); setSelectedMatch(null); }}
                              disabled={copyLoading}
                            >
                              Go back
                            </Button>
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Location & Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Address</CardTitle>
                </div>
                <CardDescription>Geographic location of the household dwelling.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Carried-Forward Household Members */}
            {carriedMembers.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900 dark:text-blue-100">Household Members</CardTitle>
                  </div>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    {carriedMembers.length} member{carriedMembers.length > 1 ? 's' : ''} carried forward from the prior application. Remove anyone who no longer belongs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {carriedMembers.map((member: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-4">
                          <User className="h-4 w-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-medium text-sm">
                              {member.firstName} {member.lastName}
                            </span>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                              {member.relationshipToHead && (
                                <span className="capitalize">{member.relationshipToHead.replace(/_/g, ' ')}</span>
                              )}
                              {member.gender && (
                                <span className="capitalize">{member.gender}</span>
                              )}
                              {member.dateOfBirth && (
                                <span>DOB: {new Date(member.dateOfBirth).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setCarriedMembers(prev => prev.filter((_, i) => i !== index))}
                          title="Remove member"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card 4: Request & Referral */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <CardTitle>Request & Referral</CardTitle>
                </div>
                <CardDescription>Purpose of the request and referral details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label htmlFor="actionTaken">Referred to</Label>
                    <Select name="actionTaken" required>
                      <SelectTrigger id="actionTaken" data-testid="select-action-taken">
                        <SelectValue placeholder="Select referral" />
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
                      <Button type="button" variant="outline" size="icon" title="Upload File" data-testid="button-upload-file">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX, JPG, PNG</p>
                  </div>
                </div>
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
                  disabled={createHouseholdMutation.isPending || !!nidDuplicate}
                  data-testid="button-submit"
                >
                  {createHouseholdMutation.isPending ? "Submitting..." : "Submit Intake"}
                </Button>
              </CardFooter>
            </Card>

          </div>
        </form>
      </main>
    </div>
  );
}

