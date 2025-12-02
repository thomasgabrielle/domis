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
import { useLocation } from "wouter";
import { useState } from "react";
import { Plus, Trash2, MapPin, User, FileText, Upload, Calendar, UserCheck } from "lucide-react";
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
    }
  ]);

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
    const formData = new FormData(e.currentTarget);
    
    const household = {
      province: formData.get("province") as string,
      district: formData.get("district") as string,
      village: formData.get("village") as string,
      gpsCoordinates: formData.get("gps") as string || null,
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
    }]);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      const newMembers = [...members];
      newMembers.splice(index, 1);
      setMembers(newMembers);
    }
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
                  <Select name="province" required>
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
                  <Select name="district" required>
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
                  <Input id="village" name="village" placeholder="Enter village name" required data-testid="input-village" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gps">GPS Coordinates (Optional)</Label>
                  <div className="flex gap-2">
                    <Input id="gps" name="gps" placeholder="Lat, Long" data-testid="input-gps" />
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
                        <Input name={`firstName-${index}`} placeholder="Given Name" required data-testid={`input-firstname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input name={`lastName-${index}`} placeholder="Surname" required data-testid={`input-lastname-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input name={`dateOfBirth-${index}`} type="date" required data-testid={`input-dob-${index}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select name={`gender-${index}`} required>
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
                        <Input name={`nationalId-${index}`} placeholder="ID Number" data-testid={`input-nationalid-${index}`} />
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
      </main>
    </div>
  );
}
