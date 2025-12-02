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
import { Plus, Trash2, MapPin, User, Upload, Calendar, UserCheck, ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type MemberForm = {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToHead: string;
  nationalId: string;
  disabilityStatus: boolean;
};

export function ApplicationEdit() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const householdId = params.id;
  const queryClient = useQueryClient();
  
  const [hasProxy, setHasProxy] = useState(false);
  const [members, setMembers] = useState<MemberForm[]>([]);
  const [householdData, setHouseholdData] = useState<any>(null);

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
      setMembers(data.members.map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split('T')[0] : '',
        gender: m.gender,
        relationshipToHead: m.relationshipToHead,
        nationalId: m.nationalId || '',
        disabilityStatus: m.disabilityStatus || false,
      })));
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            
            {/* Intake Information Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Intake Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Proxy Information - Only shown when proxy is selected */}
            {hasProxy && (
            <Card className="animate-in fade-in slide-in-from-top-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Proxy Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <CardDescription>Edit details for the applicant and all household members.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {members.map((member, index) => (
                  <div key={member.id || index} className="relative">
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
                        <Input name={`nationalId-${index}`} defaultValue={member.nationalId} placeholder="ID Number" data-testid={`input-nationalid-${index}`} />
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
                  </div>
                ))}
              </CardContent>
            </Card>

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
