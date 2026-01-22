import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, User, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Pencil, ClipboardCheck, Save, Loader2, AlertCircle, MessageSquare, Check, Clock, XCircle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [recommendation, setRecommendation] = useState("");
  const [amountAllocation, setAmountAllocation] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [transferModality, setTransferModality] = useState("");
  const [complementaryActivities, setComplementaryActivities] = useState("");
  const [recommendationComments, setRecommendationComments] = useState("");

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

  const { data: workflowHistory = [] } = useQuery({
    queryKey: ['workflow-history', householdId],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-history/household/${householdId}`);
      if (!response.ok) throw new Error('Failed to fetch workflow history');
      return response.json();
    },
    enabled: !!householdId,
  });

  useEffect(() => {
    if (data?.household) {
      setAssessmentNotes(data.household.assessmentNotes || "");
      setHouseholdAssets(data.household.householdAssets || "");
      setRecommendation(data.household.recommendation || "");
      setAmountAllocation(data.household.amountAllocation || "");
      setDurationMonths(data.household.durationMonths?.toString() || "");
      setTransferModality(data.household.transferModality || "");
      setComplementaryActivities(data.household.complementaryActivities || "");
      setRecommendationComments(data.household.recommendationComments || "");
    }
  }, [data]);

  // Save assessment without sending to Coordinator
  const saveAssessmentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/households/${householdId}`, {
        household: {
          assessmentNotes,
          householdAssets,
          recommendation,
          amountAllocation: amountAllocation ? parseFloat(amountAllocation) : null,
          durationMonths: durationMonths ? parseInt(durationMonths) : null,
          transferModality,
          complementaryActivities,
          recommendationComments,
        },
        members: data?.members || [],
      });
    },
    onSuccess: () => {
      toast({ title: "Assessment saved", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ['household', householdId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Save and send to Coordinator (using atomic server-side resubmission)
  const sendToCoordinatorMutation = useMutation({
    mutationFn: async () => {
      // Use atomic server-side endpoint that handles cycle increment logic
      return apiRequest("POST", `/api/workflow-resubmit/${householdId}`, {
        householdData: {
          assessmentNotes,
          householdAssets,
          recommendation,
          amountAllocation: amountAllocation ? parseFloat(amountAllocation) : null,
          durationMonths: durationMonths ? parseInt(durationMonths) : null,
          transferModality,
          complementaryActivities,
          recommendationComments,
        },
      });
    },
    onSuccess: () => {
      const wasResubmission = data?.household?.programStatus === 'pending_additional_info';
      toast({ 
        title: wasResubmission ? "Resubmitted to Coordinator" : "Sent to Coordinator", 
        description: wasResubmission 
          ? "Application has been resubmitted with additional information for a new review cycle."
          : "Application moved to Recommendations for Coordinator review." 
      });
      queryClient.invalidateQueries({ queryKey: ['household', householdId] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
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
      case 'pending_additional_info':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending Additional Info</Badge>;
      case 'pending_coordinator':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending Coordinator</Badge>;
      case 'pending_director':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Pending Director</Badge>;
      case 'pending_ps':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pending Perm. Secretary</Badge>;
      case 'pending_minister':
        return <Badge className="bg-violet-100 text-violet-800 border-violet-200">Pending Minister</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status?.replace(/_/g, ' ')}</Badge>;
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

  const { household, members: rawMembers } = data;
  
  // Sort members consistently: head of household first, then by id for stable ordering
  const members = rawMembers?.slice().sort((a: any, b: any) => {
    if (a.relationshipToHead === 'head') return -1;
    if (b.relationshipToHead === 'head') return 1;
    return (a.id || '').localeCompare(b.id || '');
  });

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

        {/* Primary Applicant Highlight */}
        {(() => {
          const headOfHousehold = members?.find((m: any) => m.relationshipToHead === 'head' || m.isHead);
          if (!headOfHousehold) return null;
          const age = headOfHousehold.dateOfBirth 
            ? Math.floor((new Date().getTime() - new Date(headOfHousehold.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;
          return (
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10" data-testid="card-primary-applicant">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                    {headOfHousehold.firstName?.charAt(0)}{headOfHousehold.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary text-primary-foreground">Primary Applicant</Badge>
                      {headOfHousehold.disabilityStatus && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600">Has Disability</Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground" data-testid="text-applicant-name">
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
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Marital Status:</span> 
                        <span className="capitalize">{headOfHousehold.maritalStatus || '—'}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Location:</span> {household.village}, {household.district}
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveAssessmentMutation.mutate()}
                  disabled={saveAssessmentMutation.isPending || sendToCoordinatorMutation.isPending}
                  className="gap-2"
                  data-testid="button-save-assessment"
                >
                  {saveAssessmentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  onClick={() => sendToCoordinatorMutation.mutate()}
                  disabled={saveAssessmentMutation.isPending || sendToCoordinatorMutation.isPending}
                  className="gap-2"
                  data-testid="button-send-to-coordinator"
                >
                  {sendToCoordinatorMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Save and Send to Coordinator
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reviewer Feedback Alert - shown when application was returned for additional info */}
            {household.programStatus === 'pending_additional_info' && (
              <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">Additional Information Requested</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <p className="mb-2">This application was returned by a reviewer requesting additional information. Please review the comments below and update the application as needed.</p>
                  <div className="space-y-3 mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border border-amber-200 dark:border-amber-800">
                    {household.coordinatorComments && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-amber-600">Coordinator Comments:</p>
                        <p className="text-sm mt-1">{household.coordinatorComments}</p>
                      </div>
                    )}
                    {household.directorComments && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-amber-600">Director Comments:</p>
                        <p className="text-sm mt-1">{household.directorComments}</p>
                      </div>
                    )}
                    {household.permanentSecretaryComments && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-amber-600">Permanent Secretary Comments:</p>
                        <p className="text-sm mt-1">{household.permanentSecretaryComments}</p>
                      </div>
                    )}
                    {household.ministerComments && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-amber-600">Minister Comments:</p>
                        <p className="text-sm mt-1">{household.ministerComments}</p>
                      </div>
                    )}
                    {!household.coordinatorComments && !household.directorComments && !household.permanentSecretaryComments && !household.ministerComments && (
                      <p className="text-sm italic">No specific comments were provided by the reviewer.</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Visual Workflow Progress Timeline */}
            {(household.assessmentStep || household.programStatus) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Workflow Progress</h3>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  {(() => {
                    const stages = [
                      { id: 'intake', label: 'Intake', icon: FileText },
                      { id: 'coordinator', label: 'Coordinator', icon: User },
                      { id: 'director', label: 'Director', icon: User },
                      { id: 'permanent_secretary', label: 'Perm. Secretary', icon: User },
                      { id: 'minister', label: 'Minister', icon: User },
                      { id: 'completed', label: 'Completed', icon: Check },
                    ];
                    
                    const currentStep = household.assessmentStep;
                    const programStatus = household.programStatus;
                    
                    const getStageStatus = (stageId: string, stageIndex: number) => {
                      const stageOrder = stages.map(s => s.id);
                      
                      // Map assessmentStep to stage index (null/undefined = intake/applications)
                      let currentIndex = 0; // Default to intake
                      if (currentStep === 'coordinator') currentIndex = 1;
                      else if (currentStep === 'director') currentIndex = 2;
                      else if (currentStep === 'permanent_secretary') currentIndex = 3;
                      else if (currentStep === 'minister') currentIndex = 4;
                      else if (currentStep === 'completed') currentIndex = 5;
                      
                      // Handle returned for additional info
                      if (programStatus === 'pending_additional_info') {
                        if (stageId === 'intake') return 'returned';
                        return 'pending';
                      }
                      
                      // Handle completed workflow
                      if (currentStep === 'completed') {
                        if (stageId === 'completed') {
                          return programStatus === 'enrolled' ? 'approved' : 'rejected';
                        }
                        return 'completed';
                      }
                      
                      // Normal workflow progression
                      if (stageIndex < currentIndex) return 'completed';
                      if (stageIndex === currentIndex) return 'current';
                      return 'pending';
                    };
                    
                    const statusStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
                      completed: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white', icon: 'text-emerald-500' },
                      current: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-white', icon: 'text-blue-500' },
                      pending: { bg: 'bg-muted', border: 'border-muted-foreground/30', text: 'text-muted-foreground', icon: 'text-muted-foreground/50' },
                      returned: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-white', icon: 'text-amber-500' },
                      approved: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-white', icon: 'text-emerald-500' },
                      rejected: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-white', icon: 'text-red-500' },
                    };
                    
                    return (
                      <div className="flex items-center justify-between" role="list" aria-label="Workflow progress timeline">
                        {stages.map((stage, index) => {
                          const status = getStageStatus(stage.id, index);
                          const styles = statusStyles[status];
                          const StageIcon = stage.icon;
                          const isLast = index === stages.length - 1;
                          
                          const statusLabels: Record<string, string> = {
                            completed: 'Completed',
                            current: 'In Progress',
                            pending: 'Pending',
                            returned: 'Returned',
                            approved: 'Approved',
                            rejected: 'Rejected'
                          };
                          
                          return (
                            <div key={stage.id} className="flex items-center flex-1" role="listitem">
                              <div className="flex flex-col items-center">
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${styles.bg} ${styles.border} ${styles.text} transition-all duration-300`}
                                  data-testid={`timeline-stage-${stage.id}`}
                                  aria-label={`${stage.label}: ${statusLabels[status]}`}
                                  title={`${stage.label}: ${statusLabels[status]}`}
                                >
                                  {status === 'completed' || status === 'approved' ? (
                                    <Check className="w-5 h-5" />
                                  ) : status === 'rejected' ? (
                                    <XCircle className="w-5 h-5" />
                                  ) : status === 'current' ? (
                                    <Clock className="w-5 h-5 animate-pulse" />
                                  ) : status === 'returned' ? (
                                    <AlertCircle className="w-5 h-5" />
                                  ) : (
                                    <StageIcon className="w-5 h-5" />
                                  )}
                                </div>
                                <span className={`text-xs mt-2 font-medium text-center ${status === 'current' ? 'text-blue-600' : status === 'completed' || status === 'approved' ? 'text-emerald-600' : status === 'returned' ? 'text-amber-600' : status === 'rejected' ? 'text-red-600' : 'text-muted-foreground'}`}>
                                  {stage.label}
                                </span>
                                {status === 'current' && (
                                  <span className="text-[10px] text-blue-500 font-semibold mt-0.5">In Progress</span>
                                )}
                                {status === 'returned' && stage.id === 'intake' && (
                                  <span className="text-[10px] text-amber-500 font-semibold mt-0.5">Returned</span>
                                )}
                              </div>
                              {!isLast && (
                                <div className={`flex-1 h-1 mx-2 rounded ${
                                  getStageStatus(stages[index + 1].id, index + 1) !== 'pending' 
                                    ? 'bg-emerald-400' 
                                    : status === 'completed' || status === 'current' || status === 'approved'
                                      ? 'bg-gradient-to-r from-emerald-400 to-muted'
                                      : 'bg-muted-foreground/20'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  
                  {household.programStatus === 'pending_additional_info' && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Application returned for additional information</span>
                      </div>
                    </div>
                  )}
                  
                  {household.assessmentStep === 'completed' && (
                    <div className={`mt-4 p-3 rounded-lg ${household.programStatus === 'enrolled' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className={`flex items-center gap-2 ${household.programStatus === 'enrolled' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {household.programStatus === 'enrolled' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">
                          {household.programStatus === 'enrolled' ? 'Application approved and enrolled' : 'Application rejected'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow History Timeline - shows all previous review cycles */}
            {workflowHistory.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Review History</h3>
                <div className="space-y-4">
                  {(() => {
                    // Group history by cycle number
                    const groupedByCycle: Record<number, any[]> = {};
                    workflowHistory.forEach((entry: any) => {
                      const cycle = entry.cycleNumber || 1;
                      if (!groupedByCycle[cycle]) groupedByCycle[cycle] = [];
                      groupedByCycle[cycle].push(entry);
                    });
                    
                    const cycles = Object.keys(groupedByCycle).map(Number).sort((a, b) => b - a);
                    
                    return cycles.map((cycleNum) => (
                      <div key={cycleNum} className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="text-sm font-semibold text-primary mb-3">
                          Review Cycle {cycleNum}
                        </h4>
                        <div className="space-y-3">
                          {groupedByCycle[cycleNum]
                            .sort((a: any, b: any) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
                            .map((entry: any) => {
                              const stepLabels: Record<string, string> = {
                                coordinator: 'Coordinator',
                                director: 'Director',
                                permanent_secretary: 'Permanent Secretary',
                                minister: 'Minister'
                              };
                              const decisionColors: Record<string, string> = {
                                agree: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                                disagree: 'text-red-700 bg-red-50 border-red-200',
                                requires_further_info: 'text-amber-700 bg-amber-50 border-amber-200'
                              };
                              const decisionLabels: Record<string, string> = {
                                agree: 'Agreed',
                                disagree: 'Disagreed',
                                requires_further_info: 'Requested More Info'
                              };
                              
                              return (
                                <div key={entry.id} className="flex items-start gap-3 p-3 bg-background rounded border">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">{stepLabels[entry.step] || entry.step}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded border ${decisionColors[entry.decision] || ''}`}>
                                        {decisionLabels[entry.decision] || entry.decision}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(entry.reviewedAt).toLocaleString()}
                                      </span>
                                    </div>
                                    {entry.comments && (
                                      <p className="text-sm text-muted-foreground mt-1">{entry.comments}</p>
                                    )}
                                    {(entry.recommendation || entry.amountAllocation) && (
                                      <div className="text-xs text-muted-foreground mt-2 flex gap-3 flex-wrap">
                                        {entry.recommendation && (
                                          <span>Recommendation: {entry.recommendation}</span>
                                        )}
                                        {entry.amountAllocation && (
                                          <span>Amount: ${entry.amountAllocation}</span>
                                        )}
                                        {entry.durationMonths && (
                                          <span>Duration: {entry.durationMonths} months</span>
                                        )}
                                        {entry.transferModality && (
                                          <span>Modality: {entry.transferModality}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Household Demographics */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Household Demographics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border px-3 py-2 text-left font-semibold">Name</th>
                      <th className="border px-3 py-2 text-left font-semibold">Sex</th>
                      <th className="border px-3 py-2 text-left font-semibold">Age</th>
                      <th className="border px-3 py-2 text-left font-semibold">Relationship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members?.map((member: any) => {
                      const age = member.dateOfBirth 
                        ? Math.floor((new Date().getTime() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : '—';
                      return (
                        <tr key={member.id} className="hover:bg-muted/30">
                          <td className="border px-3 py-2">{member.firstName} {member.lastName}</td>
                          <td className="border px-3 py-2 capitalize">{member.gender}</td>
                          <td className="border px-3 py-2">{age}</td>
                          <td className="border px-3 py-2 capitalize">{member.relationshipToHead?.replace(/_/g, ' ') || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

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

            <Separator />

            {/* Recommendations Sub-section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <Select value={recommendation} onValueChange={setRecommendation}>
                    <SelectTrigger id="recommendation" data-testid="select-recommendation">
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agree">Agree</SelectItem>
                      <SelectItem value="disagree">Disagree</SelectItem>
                      <SelectItem value="requires_further_info">Requires Further Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amountAllocation">Amount Allocation ($)</Label>
                  <Input
                    id="amountAllocation"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amountAllocation}
                    onChange={(e) => setAmountAllocation(e.target.value)}
                    data-testid="input-amount-allocation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="durationMonths">Duration (Months)</Label>
                  <Input
                    id="durationMonths"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter duration in months"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    data-testid="input-duration-months"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transferModality">Financial Transfer Modality</Label>
                  <Select value={transferModality} onValueChange={setTransferModality}>
                    <SelectTrigger id="transferModality" data-testid="select-transfer-modality">
                      <SelectValue placeholder="Select modality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="phone">Phone (Mobile Money)</SelectItem>
                      <SelectItem value="vcc">VCC (Virtual Credit Card)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="complementaryActivities">Complementary Activities</Label>
                  <Textarea
                    id="complementaryActivities"
                    placeholder="Describe any complementary activities recommended for this household..."
                    value={complementaryActivities}
                    onChange={(e) => setComplementaryActivities(e.target.value)}
                    rows={3}
                    data-testid="input-complementary-activities"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="recommendationComments">Comments</Label>
                  <Textarea
                    id="recommendationComments"
                    placeholder="Any additional comments or notes regarding the recommendation..."
                    value={recommendationComments}
                    onChange={(e) => setRecommendationComments(e.target.value)}
                    rows={3}
                    data-testid="input-recommendation-comments"
                  />
                </div>
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
