import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileCheck, Clock, ArrowRight, AlertCircle, User, Users, Save, Loader2 } from "lucide-react";
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
    mutationFn: async ({ householdId, decision, comments, currentStep }: { 
      householdId: string; 
      decision: 'agree' | 'disagree' | 'requires_further_info';
      comments: string;
      currentStep: WorkflowStep;
    }) => {
      const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
      const nextStep = decision === 'requires_further_info' ? null : stepConfig?.nextStep;
      
      // Build the household update object
      const householdUpdate: Record<string, any> = {
        assessmentStep: nextStep,
      };
      
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
          householdUpdate.programStatus = decision === 'agree' ? 'enrolled' : 'ineligible';
        }
      }
      
      return apiRequest("PUT", `/api/households/${householdId}`, {
        household: householdUpdate,
        members: [],
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      
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
    });
  };

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;
    switch (decision) {
      case 'agree':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Agreed</Badge>;
      case 'disagree':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Disagreed</Badge>;
      case 'requires_further_info':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">More Info Needed</Badge>;
      default:
        return null;
    }
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
        
        <div className="w-full lg:w-64 space-y-3 flex flex-col justify-center">
          <Link href={`/application/${household.id}`}>
            <Button variant="outline" className="w-full" data-testid={`button-view-${household.id}`}>
              View Details
            </Button>
          </Link>
          <Button 
            className="w-full gap-2"
            onClick={() => handleOpenReview(household, step)}
            disabled={progressAssessmentMutation.isPending}
            data-testid={`button-review-${household.id}`}
          >
            Review & Decide
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

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setReviewDialogOpen(false);
            setSelectedHousehold(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getCurrentStepLabel()} Review
              </DialogTitle>
              <DialogDescription>
                Review application {selectedHousehold?.applicationId || selectedHousehold?.householdCode} and make your decision.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {selectedHousehold && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {getPrimaryApplicant(selectedHousehold)?.firstName} {getPrimaryApplicant(selectedHousehold)?.lastName}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedHousehold.village}, {selectedHousehold.district}, {selectedHousehold.province}
                  </div>
                  {selectedHousehold.recommendation && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Initial Recommendation: </span>
                      <span className="font-medium capitalize">{selectedHousehold.recommendation}</span>
                    </div>
                  )}
                  {selectedHousehold.amountAllocation && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">${selectedHousehold.amountAllocation}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Your Decision</Label>
                <Select value={decision} onValueChange={(v: 'agree' | 'disagree' | 'requires_further_info') => setDecision(v)}>
                  <SelectTrigger data-testid="select-decision">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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

      </main>
    </div>
  );
}
