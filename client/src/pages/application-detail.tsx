import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Pencil, AlertCircle, FileText, Home } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";

export function ApplicationDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const householdId = params.id;

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

  const currentIndex = allHouseholds.findIndex((h: any) => h.id === householdId);
  const totalApplications = allHouseholds.length;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalApplications - 1;

  const goToPrevious = () => {
    if (hasPrevious) setLocation(`/application/${allHouseholds[currentIndex - 1].id}`);
  };

  const goToNext = () => {
    if (hasNext) setLocation(`/application/${allHouseholds[currentIndex + 1].id}`);
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

        {/* Related Applications */}
        {relatedApplications.length > 0 && (() => {
          const enrolledApps = relatedApplications.filter((r: any) => r.household.programStatus === 'enrolled');
          const otherApps = relatedApplications.filter((r: any) => r.household.programStatus !== 'enrolled');
          return (
            <>
              {enrolledApps.length > 0 && (
                <Alert variant="default" className="border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950">
                  <AlertCircle className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800 dark:text-emerald-200">
                    Applicant is Already an Enrolled Client
                  </AlertTitle>
                  <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                    <p className="mb-3">
                      This applicant is currently enrolled under {enrolledApps.length === 1 ? 'another application' : `${enrolledApps.length} other applications`}.
                      Review the existing enrollment(s) before proceeding.
                    </p>
                    <div className="space-y-2">
                      {enrolledApps.map((related: any) => (
                        <div key={related.household.id} className="flex items-center gap-3 p-2 bg-white/60 dark:bg-black/20 rounded border border-emerald-200 dark:border-emerald-800">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0">Enrolled</Badge>
                          <button
                            className="font-mono text-sm font-medium text-emerald-800 dark:text-emerald-200 hover:underline cursor-pointer"
                            onClick={() => setLocation(`/application/${related.household.id}`)}
                          >
                            {related.household.applicationId || related.household.householdCode}
                          </button>
                          <span className="text-sm">
                            {formatRequestPurpose(related.household.requestPurpose)}
                          </span>
                          <span className="text-xs text-emerald-600 ml-auto shrink-0">
                            {related.matchingMembers.map((m: any) => `${m.firstName} ${m.lastName}`).join(', ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {otherApps.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-base text-amber-900 dark:text-amber-200">Other Applications by This Applicant</CardTitle>
                    </div>
                    <CardDescription className="text-amber-700 dark:text-amber-400">
                      {otherApps.length === 1
                        ? 'This applicant has 1 other application on file'
                        : `This applicant has ${otherApps.length} other applications on file`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {otherApps.map((related: any) => (
                        <div key={related.household.id} className="flex items-center gap-3 p-2 bg-white/60 dark:bg-black/20 rounded border border-amber-200 dark:border-amber-800">
                          {getStatusBadge(related.household.programStatus)}
                          <button
                            className="font-mono text-sm font-medium text-foreground hover:underline cursor-pointer"
                            onClick={() => setLocation(`/application/${related.household.id}`)}
                          >
                            {related.household.applicationId || related.household.householdCode}
                          </button>
                          <span className="text-sm text-muted-foreground">
                            {formatRequestPurpose(related.household.requestPurpose)}
                          </span>
                          {related.household.intakeDate && (
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">
                              {formatDate(related.household.intakeDate)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}

        {/* Intake Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Intake Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Proxy Information */}
            {!household.isOnOwnBehalf && household.proxyFirstName && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Proxy Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            ))}
          </CardContent>
        </Card>

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

        {/* Home Visit Information */}
        {household.homeVisitStatus === 'completed' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <CardTitle>Home Visit Information</CardTitle>
              </div>
              <CardDescription>
                Data collected during the home visit{household.homeVisitDate ? ` on ${formatDate(household.homeVisitDate)}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Household Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Household Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {household.homeVisitNotes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Home Visit Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{household.homeVisitNotes}</p>
                </div>
              )}

              <Separator />

              {/* Member Education, Employment & Income */}
              {members?.map((member: any, index: number) => (
                <div key={member.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-4">
                    {member.firstName} {member.lastName}
                    {member.relationshipToHead === 'head' ? ' (Head of Household)' : ''}
                  </h3>

                  {/* Education */}
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
                  <div>
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
        )}

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
