import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { MapPin, Upload, Calendar, UserCheck, User } from "lucide-react";
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
      nationalId: applicant.nationalId || null,
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
      members: [applicantMember],
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
            
            {/* Card 1: Intake Information (includes Intake, Location, and Proxy) */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Intake Information</CardTitle>
                </div>
                <CardDescription>Capture how this applicant reached the program, location details, and proxy information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Intake Details Sub-section */}
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
                    <Button type="button" variant="outline" size="icon" title="Upload File" data-testid="button-upload-file">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Supported: PDF, DOC, DOCX, JPG, PNG</p>
                </div>
                </div>

                {/* Location Sub-section */}
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Location & Address</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Geographic location of the household dwelling.</p>
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

                {/* Proxy Sub-section - Only shown when proxy is selected */}
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
                  </div>
                </div>
                </>
                )}
                </div>
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
                    <Input 
                      id="applicantLastName"
                      placeholder="Surname"
                      value={applicant.lastName}
                      onChange={(e) => setApplicant(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      data-testid="input-applicant-lastname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicantNationalId">National ID</Label>
                    <Input 
                      id="applicantNationalId"
                      placeholder="ID Number"
                      value={applicant.nationalId}
                      onChange={(e) => setApplicant(prev => ({ ...prev, nationalId: e.target.value }))}
                      data-testid="input-applicant-nationalid"
                    />
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
      </main>
    </div>
  );
}

