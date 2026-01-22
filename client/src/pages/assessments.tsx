import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileCheck, Clock, ArrowRight, AlertCircle, User, Users, Save, Loader2, MapPin, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const WORKFLOW_STEPS = [
  { id: 'coordinator', label: 'Coordinator', nextStep: 'director' },
  { id: 'director', label: 'Director', nextStep: 'permanent_secretary' },
  { id: 'permanent_secretary', label: 'Permanent Secretary', nextStep: 'minister' },
  { id: 'minister', label: 'Minister', nextStep: 'completed' },
] as const;

type WorkflowStep = typeof WORKFLOW_STEPS[number]['id'];

export function Assessments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('coordinator');
  
  const [decision, setDecision] = useState<'agree' | 'disagree' | 'requires_further_info'>('agree');
  const [comments, setComments] = useState('');
  const [fullApplicationOpen, setFullApplicationOpen] = useState(false);

  const { data: householdsData = [], isLoading } = useQuery({
    queryKey: ['/api/households-with-members'],
    queryFn: async () => {
      const response = await fetch('/api/households-with-members');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  // Transform data to include members with each household for display
  const households = householdsData.map((item: any) => ({
    ...item.household,
    members: item.members,
  }));

  const getApplicationsByStep = (step: WorkflowStep) => {
    return households.filter((h: any) => h.assessmentStep === step);
  };

  const coordinatorApps = getApplicationsByStep('coordinator');
  const directorApps = getApplicationsByStep('director');
  const permanentSecretaryApps = getApplicationsByStep('permanent_secretary');
  const ministerApps = getApplicationsByStep('minister');
  const completedApps = households.filter((h: any) => h.assessmentStep === 'completed');

  const progressAssessmentMutation = useMutation({
    mutationFn: async ({ householdId, decision, comments, currentStep, householdData }: { 
      householdId: string; 
      decision: 'agree' | 'disagree' | 'requires_further_info';
      comments: string;
      currentStep: WorkflowStep;
      householdData: any;
    }) => {
      const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
      const nextStep = decision === 'requires_further_info' ? null : stepConfig?.nextStep;
      
      // Build the household update object
      const householdUpdate: Record<string, any> = {};
      
      // If requires further info, set the programStatus to track this
      if (decision === 'requires_further_info') {
        householdUpdate.programStatus = 'pending_additional_info';
      }
      
      // Set step-specific decision and comments using the correct field names
      if (currentStep === 'coordinator') {
        householdUpdate.coordinatorDecision = decision;
        householdUpdate.coordinatorComments = comments;
      } else if (currentStep === 'director') {
        householdUpdate.directorDecision = decision;
        householdUpdate.directorComments = comments;
      } else if (currentStep === 'permanent_secretary') {
        householdUpdate.permanentSecretaryDecision = decision;
        householdUpdate.permanentSecretaryComments = comments;
      } else if (currentStep === 'minister') {
        householdUpdate.ministerDecision = decision;
        householdUpdate.ministerComments = comments;
        // When Minister completes, set final program status
        if (decision !== 'requires_further_info') {
          householdUpdate.programStatus = decision === 'agree' ? 'enrolled' : 'rejected';
        }
      }
      
      // Use atomic endpoint that creates history and updates household together
      return apiRequest("POST", `/api/workflow-progress/${householdId}`, {
        step: currentStep,
        decision,
        comments,
        nextStep,
        householdUpdate,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      
      if (variables.decision === 'requires_further_info') {
        toast({
          title: "Returned to Applications",
          description: "Application has been returned to the Applications module for more information.",
        });
      } else {
        const stepConfig = WORKFLOW_STEPS.find(s => s.id === variables.currentStep);
        const nextStepConfig = WORKFLOW_STEPS.find(s => s.id === stepConfig?.nextStep);
        toast({
          title: "Assessment Saved",
          description: nextStepConfig 
            ? `Application moved to ${nextStepConfig.label} for review.`
            : "Recommendation workflow completed.",
        });
      }
      
      setReviewDialogOpen(false);
      setSelectedHousehold(null);
      setComments('');
      setDecision('agree');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save only - stores decision/comments without progressing to next step
  const saveOnlyMutation = useMutation({
    mutationFn: async ({ householdId, decision, comments, currentStep }: { 
      householdId: string; 
      decision: 'agree' | 'disagree' | 'requires_further_info';
      comments: string;
      currentStep: WorkflowStep;
    }) => {
      // Build the household update object - no assessmentStep change
      const householdUpdate: Record<string, any> = {};
      
      // Set step-specific decision and comments
      if (currentStep === 'coordinator') {
        householdUpdate.coordinatorDecision = decision;
        householdUpdate.coordinatorComments = comments;
      } else if (currentStep === 'director') {
        householdUpdate.directorDecision = decision;
        householdUpdate.directorComments = comments;
      } else if (currentStep === 'permanent_secretary') {
        householdUpdate.permanentSecretaryDecision = decision;
        householdUpdate.permanentSecretaryComments = comments;
      } else if (currentStep === 'minister') {
        householdUpdate.ministerDecision = decision;
        householdUpdate.ministerComments = comments;
      }
      
      return apiRequest("PUT", `/api/households/${householdId}`, {
        household: householdUpdate,
        members: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      toast({
        title: "Saved",
        description: "Your changes have been saved.",
      });
      setReviewDialogOpen(false);
      setSelectedHousehold(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveOnly = () => {
    if (!selectedHousehold) return;
    saveOnlyMutation.mutate({
      householdId: selectedHousehold.id,
      decision,
      comments,
      currentStep,
    });
  };

  const handleOpenReview = (household: any, step: WorkflowStep) => {
    setSelectedHousehold(household);
    setCurrentStep(step);
    setDecision('agree');
    setComments('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedHousehold) return;
    
    progressAssessmentMutation.mutate({
      householdId: selectedHousehold.id,
      decision,
      comments,
      currentStep,
      householdData: selectedHousehold,
    });
  };

  const getDecisionBadge = (decision: string | null, stepLabel?: string) => {
    if (!decision) return null;
    const label = stepLabel ? `${stepLabel}: ` : '';
    switch (decision) {
      case 'agree':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{label}Agreed</Badge>;
      case 'disagree':
        return <Badge className="bg-red-100 text-red-800 border-red-200">{label}Disagreed</Badge>;
      case 'requires_further_info':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">{label}More Info</Badge>;
      default:
        return null;
    }
  };

  const getStepDecisions = (household: any) => {
    const decisions = [];
    if (household.coordinatorDecision) {
      decisions.push({ step: 'Coordinator', decision: household.coordinatorDecision, comments: household.coordinatorComments });
    }
    if (household.directorDecision) {
      decisions.push({ step: 'Director', decision: household.directorDecision, comments: household.directorComments });
    }
    if (household.permanentSecretaryDecision) {
      decisions.push({ step: 'Perm. Secretary', decision: household.permanentSecretaryDecision, comments: household.permanentSecretaryComments });
    }
    if (household.ministerDecision) {
      decisions.push({ step: 'Minister', decision: household.ministerDecision, comments: household.ministerComments });
    }
    return decisions;
  };

  const getPrimaryApplicant = (household: any) => {
    return household.members?.find((m: any) => m.isHead) || household.members?.[0];
  };

  const renderApplicationCard = (household: any, step: WorkflowStep) => {
    const primaryApplicant = getPrimaryApplicant(household);
    
    return (
      <div 
        key={household.id} 
        className="flex flex-col lg:flex-row gap-6 p-6 border border-border rounded-xl bg-card hover:shadow-md transition-all"
        data-testid={`card-assessment-${household.id}`}
      >
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">{household.applicationId || household.householdCode}</Badge>
            {household.recommendation && getDecisionBadge(household.recommendation)}
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {primaryApplicant 
                ? `${primaryApplicant.firstName} ${primaryApplicant.lastName}`
                : 'No primary applicant'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
            <span>Location: {household.village}, {household.district}</span>
            <span>Province: {household.province}</span>
            {household.recommendation && (
              <span>Recommendation: {household.recommendation}</span>
            )}
            {household.amountAllocation && (
              <span>Amount: ${household.amountAllocation}</span>
            )}
          </div>
        </div>
        
        <div className="w-full lg:w-48 flex flex-col justify-center">
          <Button 
            className="w-full gap-2"
            onClick={() => handleOpenReview(household, step)}
            disabled={progressAssessmentMutation.isPending}
            data-testid={`button-review-${household.id}`}
          >
            Review Assessment
          </Button>
        </div>
      </div>
    );
  };

  const renderStepContent = (step: WorkflowStep, applications: any[]) => {
    if (isLoading) {
      return <div className="text-center py-12 text-muted-foreground">Loading applications...</div>;
    }
    
    if (applications.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No applications at this step.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {applications.map((hh: any) => renderApplicationCard(hh, step))}
      </div>
    );
  };

  const getCurrentStepLabel = () => {
    const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
    return stepConfig?.label || currentStep;
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Recommendations</h1>
            <p className="text-muted-foreground">Review applications through the approval workflow.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Coordinator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700" data-testid="count-coordinator">{coordinatorApps.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Director</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700" data-testid="count-director">{directorApps.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Perm. Secretary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700" data-testid="count-ps">{permanentSecretaryApps.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-rose-50 border-rose-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-700">Minister</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700" data-testid="count-minister">{ministerApps.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700" data-testid="count-completed">{completedApps.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recommendation Workflow</CardTitle>
            <CardDescription>Applications progress through each approval level sequentially.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="coordinator" className="w-full">
              <TabsList className="mb-4 grid grid-cols-4 w-full">
                <TabsTrigger value="coordinator" data-testid="tab-coordinator" className="gap-2">
                  <span className="hidden sm:inline">Coordinator</span>
                  <span className="sm:hidden">Coord.</span>
                  <Badge variant="secondary" className="ml-1">{coordinatorApps.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="director" data-testid="tab-director" className="gap-2">
                  <span className="hidden sm:inline">Director</span>
                  <span className="sm:hidden">Dir.</span>
                  <Badge variant="secondary" className="ml-1">{directorApps.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="permanent_secretary" data-testid="tab-ps" className="gap-2">
                  <span className="hidden sm:inline">Perm. Secretary</span>
                  <span className="sm:hidden">P.S.</span>
                  <Badge variant="secondary" className="ml-1">{permanentSecretaryApps.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="minister" data-testid="tab-minister" className="gap-2">
                  <span className="hidden sm:inline">Minister</span>
                  <span className="sm:hidden">Min.</span>
                  <Badge variant="secondary" className="ml-1">{ministerApps.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="coordinator">
                {renderStepContent('coordinator', coordinatorApps)}
              </TabsContent>
              
              <TabsContent value="director">
                {renderStepContent('director', directorApps)}
              </TabsContent>
              
              <TabsContent value="permanent_secretary">
                {renderStepContent('permanent_secretary', permanentSecretaryApps)}
              </TabsContent>
              
              <TabsContent value="minister">
                {renderStepContent('minister', ministerApps)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Review Assessment Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setReviewDialogOpen(false);
            setSelectedHousehold(null);
            setFullApplicationOpen(false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    {getCurrentStepLabel()} Review
                  </DialogTitle>
                  <DialogDescription>
                    Application {selectedHousehold?.applicationId || selectedHousehold?.householdCode}
                  </DialogDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFullApplicationOpen(true)}
                  data-testid="button-view-full-application"
                >
                  View Full Application
                </Button>
              </div>
            </DialogHeader>
            
            {selectedHousehold && (
              <div className="space-y-6 py-4">
                {/* Household Demographics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Household Demographics</h3>
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
                        {selectedHousehold.members?.map((member: any) => {
                          const age = member.dateOfBirth 
                            ? Math.floor((new Date().getTime() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                            : '—';
                          return (
                            <tr key={member.id} className="hover:bg-muted/30">
                              <td className="border px-3 py-2">
                                {member.firstName} {member.lastName}
                                {member.isHead && <Badge variant="outline" className="ml-2 text-xs">Head</Badge>}
                              </td>
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
                
                {/* Summary Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Number of Household Members</p>
                      <p className="text-2xl font-bold text-primary">{selectedHousehold.members?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Household Income</p>
                      <p className="text-2xl font-bold text-primary">
                        ${(selectedHousehold.members?.reduce((total: number, m: any) => total + (parseFloat(m.monthlyIncome) || 0), 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">per month</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vulnerability Score</p>
                      <p className="text-2xl font-bold text-primary">{selectedHousehold.vulnerabilityScore || 0}</p>
                    </div>
                  </div>
                  
                  {/* Household Assets from Intake */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Household Assets (from Intake)</p>
                      <p className="font-medium">
                        {selectedHousehold.householdAssetsList 
                          ? (() => {
                              try {
                                const assets = JSON.parse(selectedHousehold.householdAssetsList);
                                if (Array.isArray(assets) && assets.length > 0) {
                                  return assets.map((a: string) => 
                                    a.replace(/_/g, ' ').charAt(0).toUpperCase() + a.replace(/_/g, ' ').slice(1)
                                  ).join(', ');
                                }
                                return 'None listed';
                              } catch {
                                return selectedHousehold.householdAssetsList;
                              }
                            })()
                          : 'None listed'}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Disability / Chronic Illness</p>
                      <p className="font-medium">
                        {(() => {
                          const disabledMembers = selectedHousehold.members?.filter((m: any) => m.disabilityStatus) || [];
                          if (disabledMembers.length > 0) {
                            return <span className="text-amber-600">Yes - {disabledMembers.length} member(s) with disability</span>;
                          }
                          return <span className="text-green-600">No members with disability reported</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Additional Assets Notes */}
                  {selectedHousehold.householdAssets && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-medium text-sm text-slate-700 mb-2">Additional Assets Notes</h4>
                      <p className="text-sm text-slate-900 whitespace-pre-wrap">{selectedHousehold.householdAssets}</p>
                    </div>
                  )}
                </div>
                
                {/* Assessment Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Assessment Notes</h3>
                  {selectedHousehold.assessmentNotes ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedHousehold.assessmentNotes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No assessment notes recorded</p>
                  )}
                </div>
                
                {/* Social Worker Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Social Worker Recommendation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Recommendation</p>
                      <div className="mt-1">{selectedHousehold.recommendation ? getDecisionBadge(selectedHousehold.recommendation) : <span className="text-muted-foreground italic">Not set</span>}</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Amount Allocation</p>
                      <p className="font-medium text-lg">{selectedHousehold.amountAllocation ? `$${parseFloat(selectedHousehold.amountAllocation).toLocaleString()}` : '—'}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{selectedHousehold.durationMonths ? `${selectedHousehold.durationMonths} months` : '—'}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Transfer Modality</p>
                      <p className="font-medium capitalize">{selectedHousehold.transferModality?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                  </div>
                  
                  {selectedHousehold.complementaryActivities && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <h4 className="font-medium text-sm text-teal-700 mb-2">Complementary Activities</h4>
                      <p className="text-sm text-teal-900 whitespace-pre-wrap">{selectedHousehold.complementaryActivities}</p>
                    </div>
                  )}
                  
                  {selectedHousehold.recommendationComments && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-sm text-purple-700 mb-2">Recommendation Comments</h4>
                      <p className="text-sm text-purple-900 whitespace-pre-wrap">{selectedHousehold.recommendationComments}</p>
                    </div>
                  )}
                </div>
                
                {/* Previous Workflow Decisions */}
                {getStepDecisions(selectedHousehold).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Previous Recommendations in Workflow</h3>
                    <div className="space-y-3">
                      {getStepDecisions(selectedHousehold).map((stepDecision, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{stepDecision.step}</span>
                            {getDecisionBadge(stepDecision.decision)}
                          </div>
                          {stepDecision.comments && (
                            <p className="text-sm text-muted-foreground mt-2">{stepDecision.comments}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Your Decision Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Decision</h3>
                  
                  <div className="space-y-2">
                    <Label>Decision</Label>
                    <Select value={decision} onValueChange={(v: 'agree' | 'disagree' | 'requires_further_info') => setDecision(v)}>
                      <SelectTrigger data-testid="select-decision">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentStep === 'minister' ? (
                          <>
                            <SelectItem value="agree">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span>Approve Application</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="disagree">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>Reject Application</span>
                              </div>
                            </SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="agree">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span>Agree - Approve and move to next step</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="disagree">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>Disagree - Reject but move to next step</span>
                              </div>
                            </SelectItem>
                          </>
                        )}
                        <SelectItem value="requires_further_info">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span>Requires More Information - Return to Applications</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Comments</Label>
                    <Textarea 
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Add your review comments..."
                      rows={4}
                      data-testid="textarea-comments"
                    />
                  </div>
                  
                  {decision === 'requires_further_info' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      This will return the application to the Applications module for additional information.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setReviewDialogOpen(false);
                setSelectedHousehold(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={handleSaveOnly}
                disabled={saveOnlyMutation.isPending || progressAssessmentMutation.isPending}
                data-testid="button-save-only"
                className="gap-2"
              >
                {saveOnlyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
              <Button 
                onClick={handleSubmitReview}
                disabled={saveOnlyMutation.isPending || progressAssessmentMutation.isPending}
                className={`gap-2 ${
                  decision === 'agree' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  decision === 'disagree' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
                data-testid="button-submit-review"
              >
                {progressAssessmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {(() => {
                  if (decision === 'requires_further_info') return 'Save and Return to Applications';
                  const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
                  const nextStepConfig = WORKFLOW_STEPS.find(s => s.id === stepConfig?.nextStep);
                  return nextStepConfig ? `Save and Send to ${nextStepConfig.label}` : 'Save and Complete';
                })()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Application Popup */}
        <Dialog open={fullApplicationOpen} onOpenChange={setFullApplicationOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Full Application Details</DialogTitle>
              <DialogDescription>
                Complete intake and application information for {selectedHousehold?.applicationId || selectedHousehold?.householdCode}
              </DialogDescription>
            </DialogHeader>
            
            {selectedHousehold && (
              <div className="space-y-6 py-4">
                {/* Intake Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Intake Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Application ID:</span>
                      <p className="font-medium font-mono">{selectedHousehold.applicationId}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Household Code:</span>
                      <p className="font-medium font-mono">{selectedHousehold.householdCode}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium capitalize">{selectedHousehold.programStatus?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Intake:</span>
                      <p className="font-medium">{selectedHousehold.intakeDate || selectedHousehold.registrationDate || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type of Outreach:</span>
                      <p className="font-medium capitalize">{selectedHousehold.outreachType?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Outreach Method:</span>
                      <p className="font-medium capitalize">{selectedHousehold.outreachMethod?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">On Own Behalf:</span>
                      <p className="font-medium">{selectedHousehold.isOnOwnBehalf ? 'Yes' : 'No (Proxy)'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">Purpose of Request:</span>
                      <p className="font-medium capitalize">{selectedHousehold.requestPurpose?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-muted-foreground">Action Taken:</span>
                      <p className="font-medium capitalize">{selectedHousehold.actionTaken?.replace(/_/g, ' ') || '—'}</p>
                    </div>
                    {selectedHousehold.followUpNotes && (
                      <div className="md:col-span-3">
                        <span className="text-muted-foreground">Follow Up Notes:</span>
                        <p className="font-medium">{selectedHousehold.followUpNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Proxy Information */}
                {!selectedHousehold.isOnOwnBehalf && selectedHousehold.proxyFirstName && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Proxy Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Proxy Name:</span>
                        <p className="font-medium">{selectedHousehold.proxyFirstName} {selectedHousehold.proxyLastName}</p>
                      </div>
                      {selectedHousehold.proxyGender && (
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <p className="font-medium capitalize">{selectedHousehold.proxyGender}</p>
                        </div>
                      )}
                      {selectedHousehold.proxyPhone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{selectedHousehold.proxyPhone}</p>
                        </div>
                      )}
                      {selectedHousehold.proxyNationalId && (
                        <div>
                          <span className="text-muted-foreground">National ID:</span>
                          <p className="font-medium font-mono">{selectedHousehold.proxyNationalId}</p>
                        </div>
                      )}
                      {selectedHousehold.proxyRelationship && (
                        <div>
                          <span className="text-muted-foreground">Relationship:</span>
                          <p className="font-medium capitalize">{selectedHousehold.proxyRelationship}</p>
                        </div>
                      )}
                      {selectedHousehold.proxyReason && (
                        <div className="md:col-span-3">
                          <span className="text-muted-foreground">Reason for Proxy:</span>
                          <p className="font-medium">{selectedHousehold.proxyReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Location & Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Location & Address</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Province/Region:</span>
                      <p className="font-medium">{selectedHousehold.province}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">District:</span>
                      <p className="font-medium">{selectedHousehold.district}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Village/Community:</span>
                      <p className="font-medium">{selectedHousehold.village}</p>
                    </div>
                    {selectedHousehold.address && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Address:</span>
                        <p className="font-medium">{selectedHousehold.address}</p>
                      </div>
                    )}
                    {selectedHousehold.gpsCoordinates && (
                      <div>
                        <span className="text-muted-foreground">GPS Coordinates:</span>
                        <p className="font-medium font-mono">{selectedHousehold.gpsCoordinates}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Household Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Household Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {selectedHousehold.roofType && (
                      <div>
                        <span className="text-muted-foreground">Roof Type:</span>
                        <p className="font-medium capitalize">{selectedHousehold.roofType}</p>
                      </div>
                    )}
                    {selectedHousehold.wallType && (
                      <div>
                        <span className="text-muted-foreground">Wall Type:</span>
                        <p className="font-medium capitalize">{selectedHousehold.wallType}</p>
                      </div>
                    )}
                    <div className="md:col-span-3">
                      <span className="text-muted-foreground">Household Assets:</span>
                      <p className="font-medium">
                        {selectedHousehold.householdAssetsList 
                          ? (() => {
                              try {
                                const assets = JSON.parse(selectedHousehold.householdAssetsList);
                                if (Array.isArray(assets) && assets.length > 0) {
                                  return assets.map((a: string) => 
                                    a.replace(/_/g, ' ').charAt(0).toUpperCase() + a.replace(/_/g, ' ').slice(1)
                                  ).join(', ');
                                }
                                return 'None listed';
                              } catch {
                                return selectedHousehold.householdAssetsList;
                              }
                            })()
                          : 'None listed'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* All Household Members - Detailed */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Household Members ({selectedHousehold.members?.length || 0})</h3>
                  <div className="space-y-4">
                    {selectedHousehold.members?.map((member: any, idx: number) => {
                      const age = member.dateOfBirth 
                        ? Math.floor((new Date().getTime() - new Date(member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : null;
                      return (
                        <div key={member.id} className="p-4 border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-lg">{member.firstName} {member.lastName}</span>
                            {member.isHead && <Badge className="bg-primary text-primary-foreground">Head of Household</Badge>}
                            {member.disabilityStatus && <Badge variant="outline" className="border-amber-500 text-amber-600">Has Disability</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Relationship:</span>
                              <p className="font-medium capitalize">{member.relationshipToHead?.replace(/_/g, ' ') || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gender:</span>
                              <p className="font-medium capitalize">{member.gender}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Age:</span>
                              <p className="font-medium">{age || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date of Birth:</span>
                              <p className="font-medium">{member.dateOfBirth || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">National ID:</span>
                              <p className="font-medium font-mono">{member.nationalId || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Marital Status:</span>
                              <p className="font-medium capitalize">{member.maritalStatus || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Employment:</span>
                              <p className="font-medium capitalize">{member.employmentStatus?.replace(/_/g, ' ') || '—'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Monthly Income:</span>
                              <p className="font-medium">{member.monthlyIncome ? `$${parseFloat(member.monthlyIncome).toLocaleString()}` : '—'}</p>
                            </div>
                            {member.educationLevel && (
                              <div>
                                <span className="text-muted-foreground">Education:</span>
                                <p className="font-medium capitalize">{member.educationLevel.replace(/_/g, ' ')}</p>
                              </div>
                            )}
                            {member.isEnrolledInSchool !== null && member.isEnrolledInSchool !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Enrolled in School:</span>
                                <p className="font-medium">{member.isEnrolledInSchool ? 'Yes' : 'No'}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Disability/Chronic Illness:</span>
                              <p className={`font-medium ${member.disabilityStatus ? 'text-amber-600' : 'text-green-600'}`}>
                                {member.disabilityStatus ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setFullApplicationOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
