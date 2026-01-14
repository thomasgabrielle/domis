import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Pencil, ClipboardCheck, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ApplicationDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const householdId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [householdAssets, setHouseholdAssets] = useState("");

  const { data: allHouseholds = [] } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['household', householdId],
    queryFn: async () => {
      const response = await fetch(`/api/households/${householdId}`);
      if (!response.ok) throw new Error('Failed to fetch application');
      return response.json();
    },
    enabled: !!householdId,
  });

  const { data: relatedApplications = [] } = useQuery({
    queryKey: ['related-applications', householdId],
    queryFn: async () => {
      const response = await fetch(`/api/households/${householdId}/related-applications`);
      if (!response.ok) throw new Error('Failed to fetch related applications');
      return response.json();
    },
    enabled: !!householdId,
  });

  useEffect(() => {
    if (data?.household) {
      setAssessmentNotes(data.household.assessmentNotes || "");
      setHouseholdAssets(data.household.householdAssets || "");
    }
  }, [data]);

  const saveAssessmentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/households/${householdId}`, {
        household: {
          assessmentNotes,
          householdAssets,
        },
        members: data?.members || [],
      });
    },
    onSuccess: () => {
      toast({ title: "Assessment saved", description: "Your assessment notes have been saved." });
      queryClient.invalidateQueries({ queryKey: ['household', householdId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const currentIndex = allHouseholds.findIndex((h: any) => h.id === householdId);
  const totalApplications = allHouseholds.length;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalApplications - 1;

  const calculateTotalIncome = () => {
    if (!data?.members) return 0;
    return data.members.reduce((total: number, member: any) => {
      const income = parseFloat(member.monthlyIncome) || 0;
      return total + income;
    }, 0);
  };

  const goToPrevious = () => {
    if (hasPrevious) {
      setLocation(`/application/${allHouseholds[currentIndex - 1].id}`);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setLocation(`/application/${allHouseholds[currentIndex + 1].id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrolled</Badge>;
      case 'pending_assessment':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Assessment</Badge>;
      case 'ineligible':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Ineligible</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatRelationship = (rel: string) => {
    const labels: Record<string, string> = {
      head: 'Head of Household',
      spouse: 'Spouse',
      child: 'Child',
      parent: 'Parent',
      sibling: 'Sibling',
      other: 'Other Relative',
    };
    return labels[rel] || rel;
  };

  const formatOutreachType = (type: string | null) => {
    if (!type) return '—';
    const labels: Record<string, string> = {
      proactive_dss: 'Proactive Outreach to DSS',
      proactive_vcc: 'Proactive Outreach to VCC',
      referral: 'Referral',
    };
    return labels[type] || type;
  };

  const formatOutreachMethod = (method: string | null) => {
    if (!method) return '—';
    const labels: Record<string, string> = {
      phone: 'Phone',
      email: 'Email',
      walk_in: 'Walk-in',
    };
    return labels[method] || method;
  };

  const formatRequestPurpose = (purpose: string | null) => {
    if (!purpose) return '—';
    const labels: Record<string, string> = {
      general_question: 'General Question',
      social_welfare: 'Request for Social Welfare Service',
      bureau_gender: 'Request for Bureau of Gender Affairs',
      probation_services: 'Request for Probation Services',
      child_protection: 'Request for Child Protection Matters',
      undefined: 'Undefined',
    };
    return labels[purpose] || purpose;
  };

  const formatActionTaken = (action: string | null) => {
    if (!action) return '—';
    const labels: Record<string, string> = {
      referred_sws_seaman: 'Referred to SWS: S. Seaman',
      referred_sws_alexander: 'Referred to SWS: J. Alexander',
      referred_sws_paquette: 'Referred to SWS: G. Paquette',
      referred_sws_other: 'Referred to other SWS Officer',
      referred_gender: 'Referred to Gender',
      referred_probation: 'Referred to Probation',
      referred_child_protection: 'Referred to Child Protection',
      general_question_answered: 'Answer to general question provided',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">Loading application...</div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">
            Application not found or failed to load.
            <Button variant="link" onClick={() => setLocation('/worksheet')}>
              Return to Applications
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { household, members } = data;

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="cursor-pointer"
            onClick={() => setLocation('/worksheet')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Application Details
              </h1>
              {getStatusBadge(household.programStatus)}
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 cursor-pointer"
                onClick={() => setLocation(`/application/${householdId}/edit`)}
                data-testid="button-edit"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </div>
            <p className="text-muted-foreground">
              Application ID: <span className="font-mono">{household.applicationId || household.householdCode}</span>
              {' '}&bull;{' '}
              Household Code: <span className="font-mono">{household.householdCode}</span>
            </p>
          </div>
          {totalApplications > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Viewing {currentIndex + 1} of {totalApplications}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={!hasPrevious}
                  className="cursor-pointer"
                  data-testid="button-previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={!hasNext}
                  className="cursor-pointer"
                  data-testid="button-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Related Applications Navigation */}
        {relatedApplications.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Linked Applications</CardTitle>
              </div>
              <CardDescription>
                {relatedApplications.length === 1 
                  ? 'This household member also appears in another application'
                  : `Household members appear in ${relatedApplications.length} other applications`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {relatedApplications.map((related: any) => (
                  <Button
                    key={related.household.id}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-background hover:bg-primary/10"
                    onClick={() => setLocation(`/application/${related.household.id}`)}
                    data-testid={`related-app-${related.household.id}`}
                  >
                    <span className="font-mono text-xs">
                      {related.household.applicationId || related.household.householdCode}
                    </span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-xs text-muted-foreground">
                      {related.matchingMembers.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {related.household.programStatus?.replace(/_/g, ' ')}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intake Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Intake Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date of Intake</p>
              <p className="font-medium">{formatDate(household.intakeDate || household.registrationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type of Outreach</p>
              <p className="font-medium">{formatOutreachType(household.outreachType)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outreach Method</p>
              <p className="font-medium">{formatOutreachMethod(household.outreachMethod)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">On Own Behalf</p>
              <p className="font-medium">{household.isOnOwnBehalf ? 'Yes' : 'No (Proxy)'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Purpose of Request</p>
              <p className="font-medium">{formatRequestPurpose(household.requestPurpose)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Action Taken</p>
              <p className="font-medium">{formatActionTaken(household.actionTaken)}</p>
            </div>
            {household.followUpNotes && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Follow Up Notes</p>
                <p className="font-medium">{household.followUpNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proxy Information */}
        {!household.isOnOwnBehalf && household.proxyFirstName && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Proxy Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Proxy Name</p>
                <p className="font-medium">{household.proxyFirstName} {household.proxyLastName}</p>
              </div>
              {household.proxyAlias && (
                <div>
                  <p className="text-sm text-muted-foreground">Alias</p>
                  <p className="font-medium">{household.proxyAlias}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{household.proxyGender || '—'}</p>
              </div>
              {household.proxyDateOfBirth && (
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{formatDate(household.proxyDateOfBirth)}</p>
                </div>
              )}
              {household.proxyPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{household.proxyPhone}</p>
                </div>
              )}
              {household.proxyNationalId && (
                <div>
                  <p className="text-sm text-muted-foreground">National ID</p>
                  <p className="font-medium font-mono">{household.proxyNationalId}</p>
                </div>
              )}
              {household.proxyAddress && (
                <div className="md:col-span-3">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{household.proxyAddress}</p>
                </div>
              )}
              {household.proxyRelationship && (
                <div>
                  <p className="text-sm text-muted-foreground">Relationship to Applicant</p>
                  <p className="font-medium capitalize">{household.proxyRelationship}</p>
                </div>
              )}
              {household.proxyRole && (
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{household.proxyRole}</p>
                </div>
              )}
              {household.proxyReason && (
                <div className="md:col-span-3">
                  <p className="text-sm text-muted-foreground">Reason for Proxy</p>
                  <p className="font-medium">{household.proxyReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Location & Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Province/Region</p>
              <p className="font-medium">{household.province}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{household.district}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Village/Community</p>
              <p className="font-medium">{household.village}</p>
            </div>
            {household.gpsCoordinates && (
              <div>
                <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                <p className="font-medium font-mono">{household.gpsCoordinates}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Household Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Household Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Roof Type</p>
              <p className="font-medium capitalize">{household.roofType || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wall Type</p>
              <p className="font-medium capitalize">{household.wallType || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Household Assets</p>
              <p className="font-medium">
                {household.householdAssetsList 
                  ? (() => {
                      try {
                        const assets = JSON.parse(household.householdAssetsList);
                        return assets.map((a: string) => a.replace(/_/g, ' ')).map((a: string) => 
                          a.charAt(0).toUpperCase() + a.slice(1)
                        ).join(', ');
                      } catch {
                        return household.householdAssetsList;
                      }
                    })()
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Applicant Information</CardTitle>
            </div>
            <CardDescription>
              {members?.length || 0} member(s) in this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {members?.map((member: any, index: number) => (
              <div key={member.id}>
                {index > 0 && <Separator className="my-6" />}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                    {member.relationshipToHead === 'head' ? 'Head of Household' : `Member #${index + 1}`}
                  </h3>
                </div>
                
                {/* Basic Information */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Personal Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatDate(member.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{member.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship to Head</p>
                      <p className="font-medium">{formatRelationship(member.relationshipToHead)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">National ID</p>
                      <p className="font-medium font-mono">{member.nationalId || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Marital Status</p>
                      <p className="font-medium capitalize">{member.maritalStatus || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Disability Status</p>
                      <p className="font-medium">{member.disabilityStatus ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Education Information */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Education</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Education Level</p>
                      <p className="font-medium capitalize">{member.educationLevel?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Enrollment</p>
                      <p className="font-medium capitalize">{member.currentEducationEnrolment?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Professional Certifications</p>
                      <p className="font-medium">{member.professionalCertifications?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ongoing Certification</p>
                      <p className="font-medium">{member.ongoingCertification || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Employment & Income */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Employment & Income</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Professional Situation</p>
                      <p className="font-medium capitalize">{member.professionalSituation?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employer Details</p>
                      <p className="font-medium">{member.employerDetails || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Income Type</p>
                      <p className="font-medium">
                        {member.incomeType 
                          ? (() => {
                              try {
                                const incomes = JSON.parse(member.incomeType);
                                if (Array.isArray(incomes) && incomes.length > 0) {
                                  return incomes.map((inc: any) => 
                                    `${inc.type?.replace(/_/g, ' ')} ($${inc.monthlyAmount || 0})`
                                  ).join(', ');
                                }
                                return member.incomeType.replace(/_/g, ' ');
                              } catch {
                                return member.incomeType.replace(/_/g, ' ');
                              }
                            })()
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="font-medium">
                        {member.monthlyIncome ? `$${parseFloat(member.monthlyIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assessment Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <CardTitle>Assessment</CardTitle>
              </div>
              <Button
                onClick={() => saveAssessmentMutation.mutate()}
                disabled={saveAssessmentMutation.isPending}
                className="gap-2"
                data-testid="button-save-assessment"
              >
                {saveAssessmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Assessment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Sub-section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Number of Household Members</p>
                  <p className="text-2xl font-bold text-primary">{members?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Household Income</p>
                  <p className="text-2xl font-bold text-primary">
                    ${calculateTotalIncome().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vulnerability Score</p>
                  <p className="text-2xl font-bold text-primary">{household.vulnerabilityScore || 0}</p>
                </div>
              </div>

              {/* Household Assets from Intake */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Household Assets (from Intake)</p>
                  <p className="font-medium">
                    {household.householdAssetsList 
                      ? (() => {
                          try {
                            const assets = JSON.parse(household.householdAssetsList);
                            if (Array.isArray(assets) && assets.length > 0) {
                              return assets.map((a: string) => 
                                a.replace(/_/g, ' ').charAt(0).toUpperCase() + a.replace(/_/g, ' ').slice(1)
                              ).join(', ');
                            }
                            return 'None listed';
                          } catch {
                            return household.householdAssetsList;
                          }
                        })()
                      : 'None listed'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Disability / Chronic Illness</p>
                  <p className="font-medium">
                    {(() => {
                      const disabledMembers = members?.filter((m: any) => m.disabilityStatus) || [];
                      if (disabledMembers.length > 0) {
                        return (
                          <span className="text-amber-600">
                            Yes - {disabledMembers.length} member(s) with disability
                          </span>
                        );
                      }
                      return <span className="text-green-600">No members with disability reported</span>;
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="householdAssets">Additional Assets Notes</Label>
                <Textarea
                  id="householdAssets"
                  placeholder="Add notes about additional household assets (e.g., property, vehicles, livestock, savings...)"
                  value={householdAssets}
                  onChange={(e) => setHouseholdAssets(e.target.value)}
                  rows={3}
                  data-testid="input-household-assets"
                />
              </div>
            </div>

            <Separator />

            {/* Assessment Notes Sub-section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Assessment Notes</h3>
              <div className="space-y-2">
                <Label htmlFor="assessmentNotes">Write your assessment of this application</Label>
                <Textarea
                  id="assessmentNotes"
                  placeholder="Enter your assessment, observations, and recommendations for this application..."
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  rows={6}
                  className="resize-y"
                  data-testid="input-assessment-notes"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={!hasPrevious}
              className="gap-2 cursor-pointer"
              data-testid="button-previous-bottom"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNext}
              disabled={!hasNext}
              className="gap-2 cursor-pointer"
              data-testid="button-next-bottom"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setLocation('/worksheet')} className="cursor-pointer" data-testid="button-back-to-list">
            Back to Applications
          </Button>
        </div>

      </main>
    </div>
  );
}
