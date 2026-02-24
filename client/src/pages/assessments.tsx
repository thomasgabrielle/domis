/**
 * Assessments and Recommendations Page
 *
 * Central hub for the multi-step approval workflow. After a home visit is
 * completed, an application moves here to be assessed by a social worker,
 * then reviewed by progressively senior officials:
 *
 *   Social Worker → Coordinator → Director → Permanent Secretary → Minister
 *
 * Each reviewer can:
 *   - **Agree** — advance the application to the next step
 *   - **Disagree** — reject but still advance to the next step
 *   - **Requires Further Info** — return the application to the Social Worker
 *
 * Only the Minister's "Agree" decision enrols the applicant as a client.
 *
 * The page has two dialogs:
 *   1. **Review Assessment Dialog** — where the current reviewer fills in their
 *      decision. For the Social Worker step this is a full assessment form
 *      (notes, recommendation, amount, duration, etc.). For all other steps
 *      it is a read-only summary of the assessment plus a decision selector.
 *   2. **Full Application Popup** — read-only view of the complete application
 *      (intake info, applicant details, location, and home visit data).
 */
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

/* ────────────────────────────────────────────────────────────────────────────
 * WORKFLOW CONFIGURATION
 *
 * Linear chain of approval steps. Each entry maps to a tab on the page.
 * `nextStep` determines where the application goes when the reviewer agrees.
 * "Requires further info" always sends it back to 'social_worker'.
 * ──────────────────────────────────────────────────────────────────────────── */
const WORKFLOW_STEPS = [
  { id: 'social_worker', label: 'Social Worker', nextStep: 'coordinator' },
  { id: 'coordinator', label: 'Coordinator', nextStep: 'director' },
  { id: 'director', label: 'Director', nextStep: 'permanent_secretary' },
  { id: 'permanent_secretary', label: 'Permanent Secretary', nextStep: 'minister' },
  { id: 'minister', label: 'Minister', nextStep: 'completed' },
] as const;

/** Union type of all valid step IDs (e.g. 'social_worker' | 'coordinator' | ...) */
type WorkflowStep = typeof WORKFLOW_STEPS[number]['id'];

export function Assessments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /* ── Dialog & selection state ─────────────────────────────────────────── */
  /** The household (application) currently being reviewed / viewed */
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  /** Controls visibility of the Review Assessment dialog */
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  /** Which workflow step the selected application is at */
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('social_worker');

  /* ── Reviewer decision state (Coordinator / Director / PS / Minister) ── */
  const [decision, setDecision] = useState<'agree' | 'disagree' | 'requires_further_info'>('agree');
  const [comments, setComments] = useState('');
  /** Controls visibility of the Full Application read-only popup */
  const [fullApplicationOpen, setFullApplicationOpen] = useState(false);

  /* ── Social Worker assessment form state ───────────────────────────────
   * These fields are only editable at the 'social_worker' step.
   * They map to columns on the `households` table and are persisted via
   * PUT /api/households/:id (save only) or POST /api/workflow-resubmit/:id
   * (save and advance to Coordinator).
   * ───────────────────────────────────────────────────────────────────── */
  const [swAssessmentNotes, setSwAssessmentNotes] = useState('');
  const [swHouseholdAssets, setSwHouseholdAssets] = useState('');
  const [swRecommendation, setSwRecommendation] = useState('');
  const [swAmountAllocation, setSwAmountAllocation] = useState('');
  const [swDurationMonths, setSwDurationMonths] = useState('');
  const [swTransferModality, setSwTransferModality] = useState('');
  const [swComplementaryActivities, setSwComplementaryActivities] = useState('');
  const [swRecommendationComments, setSwRecommendationComments] = useState('');

  /* ── Data fetching ─────────────────────────────────────────────────────
   * Loads every household together with its members in a single query.
   * The API returns `{ household, members }[]`.
   * ───────────────────────────────────────────────────────────────────── */
  const { data: householdsData = [], isLoading } = useQuery({
    queryKey: ['/api/households-with-members'],
    queryFn: async () => {
      const response = await fetch('/api/households-with-members');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  /** Flatten API shape so each household object has a `.members` array */
  const households = householdsData.map((item: any) => ({
    ...item.household,
    members: item.members,
  }));

  /* ── Per-step application lists ───────────────────────────────────────
   * Each tab shows only the applications currently at that workflow step.
   * The Social Worker list also catches legacy records that have
   * programStatus='pending_assessment' but no assessmentStep set yet.
   * ───────────────────────────────────────────────────────────────────── */
  const getApplicationsByStep = (step: WorkflowStep) => {
    return households.filter((h: any) => h.assessmentStep === step);
  };

  const socialWorkerApps = households.filter((h: any) =>
    h.assessmentStep === 'social_worker' ||
    (h.programStatus === 'pending_assessment' && !h.assessmentStep)
  );
  const coordinatorApps = getApplicationsByStep('coordinator');
  const directorApps = getApplicationsByStep('director');
  const permanentSecretaryApps = getApplicationsByStep('permanent_secretary');
  const ministerApps = getApplicationsByStep('minister');
  const completedApps = households.filter((h: any) => h.assessmentStep === 'completed');

  /* ────────────────────────────────────────────────────────────────────────
   * MUTATIONS
   *
   * Three mutation paths depending on who is acting:
   *
   *   1. progressAssessmentMutation — Coordinator/Director/PS/Minister
   *      submits a decision AND advances the application to the next step
   *      (or returns it to Social Worker).
   *
   *   2. saveOnlyMutation — same reviewers save their decision/comments
   *      WITHOUT advancing the application (draft save).
   *
   *   3. swSubmitMutation / swSaveOnlyMutation — Social Worker saves or
   *      submits the assessment form (notes, recommendation, amounts, etc.).
   * ──────────────────────────────────────────────────────────────────────── */

  /**
   * Advance application to next workflow step (Coordinator → Director → … → Completed).
   * Uses the atomic POST /api/workflow-progress/:id endpoint which creates a
   * workflow_history record and updates the household in a single transaction.
   *
   * Special cases:
   *   - "requires_further_info" always redirects back to 'social_worker'
   *   - Minister's "agree" sets programStatus to 'enrolled' (applicant becomes client)
   *   - Minister's "disagree" sets programStatus to 'rejected'
   */
  const progressAssessmentMutation = useMutation({
    mutationFn: async ({ householdId, decision, comments, currentStep, householdData }: {
      householdId: string;
      decision: 'agree' | 'disagree' | 'requires_further_info';
      comments: string;
      currentStep: WorkflowStep;
      householdData: any;
    }) => {
      const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
      const nextStep = decision === 'requires_further_info' ? 'social_worker' : stepConfig?.nextStep;

      const householdUpdate: Record<string, any> = {};

      if (decision === 'requires_further_info') {
        householdUpdate.programStatus = 'pending_additional_info';
      }

      // Persist the decision + comments under the step-specific columns
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
        // Minister is the final gate — set terminal program status
        if (decision !== 'requires_further_info') {
          householdUpdate.programStatus = decision === 'agree' ? 'enrolled' : 'rejected';
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      
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

  /**
   * Draft save — stores the reviewer's decision and comments on the household
   * record without moving the application to the next workflow step.
   * Uses PUT /api/households/:id with an empty members array.
   */
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

  /**
   * Social Worker: Save the full assessment form AND advance the application
   * to the Coordinator step. Uses POST /api/workflow-resubmit/:id which
   * persists the assessment fields on the household and moves assessmentStep
   * to 'coordinator'.
   */
  const swSubmitMutation = useMutation({
    mutationFn: async ({ householdId }: { householdId: string }) => {
      return apiRequest("POST", `/api/workflow-resubmit/${householdId}`, {
        householdData: {
          assessmentNotes: swAssessmentNotes,
          householdAssets: swHouseholdAssets,
          recommendation: swRecommendation,
          amountAllocation: swAmountAllocation ? parseFloat(swAmountAllocation) : null,
          durationMonths: swDurationMonths ? parseInt(swDurationMonths) : null,
          transferModality: swTransferModality,
          complementaryActivities: swComplementaryActivities,
          recommendationComments: swRecommendationComments,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      toast({
        title: "Sent to Coordinator",
        description: "Assessment saved and application sent to Coordinator for review.",
      });
      setReviewDialogOpen(false);
      setSelectedHousehold(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  /**
   * Social Worker: Draft save — persist assessment fields on the household
   * without moving the application to the next step. Allows the social worker
   * to save work-in-progress and come back later.
   */
  const swSaveOnlyMutation = useMutation({
    mutationFn: async ({ householdId }: { householdId: string }) => {
      return apiRequest("PUT", `/api/households/${householdId}`, {
        household: {
          assessmentNotes: swAssessmentNotes,
          householdAssets: swHouseholdAssets,
          recommendation: swRecommendation,
          amountAllocation: swAmountAllocation ? parseFloat(swAmountAllocation) : null,
          durationMonths: swDurationMonths ? parseInt(swDurationMonths) : null,
          transferModality: swTransferModality,
          complementaryActivities: swComplementaryActivities,
          recommendationComments: swRecommendationComments,
        },
        members: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/households-with-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households'] });
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['all-members'] });
      toast({ title: "Saved", description: "Assessment changes saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  /* ── Event handlers ─────────────────────────────────────────────────── */

  /** Save current form state without advancing the workflow */
  const handleSaveOnly = () => {
    if (!selectedHousehold) return;
    if (currentStep === 'social_worker') {
      swSaveOnlyMutation.mutate({ householdId: selectedHousehold.id });
      return;
    }
    saveOnlyMutation.mutate({
      householdId: selectedHousehold.id,
      decision,
      comments,
      currentStep,
    });
  };

  /**
   * Open the Review Assessment dialog for a given household at a given step.
   * Pre-populates either the SW assessment form or the reviewer decision fields
   * from the household's existing data.
   */
  const handleOpenReview = (household: any, step: WorkflowStep) => {
    setSelectedHousehold(household);
    setCurrentStep(step);
    if (step === 'social_worker') {
      // Hydrate SW form fields from household record
      setSwAssessmentNotes(household.assessmentNotes || '');
      setSwHouseholdAssets(household.householdAssets || '');
      setSwRecommendation(household.recommendation || '');
      setSwAmountAllocation(household.amountAllocation?.toString() || '');
      setSwDurationMonths(household.durationMonths?.toString() || '');
      setSwTransferModality(household.transferModality || '');
      setSwComplementaryActivities(household.complementaryActivities || '');
      setSwRecommendationComments(household.recommendationComments || '');
    } else {
      // Reset reviewer decision to defaults
      setDecision('agree');
      setComments('');
    }
    setReviewDialogOpen(true);
  };

  /** Save AND advance: submit form then move to next workflow step */
  const handleSubmitReview = () => {
    if (!selectedHousehold) return;
    if (currentStep === 'social_worker') {
      swSubmitMutation.mutate({ householdId: selectedHousehold.id });
      return;
    }
    progressAssessmentMutation.mutate({
      householdId: selectedHousehold.id,
      decision,
      comments,
      currentStep,
      householdData: selectedHousehold,
    });
  };

  /* ── Helpers ────────────────────────────────────────────────────────── */

  /** Return a colour-coded Badge for agree / disagree / requires_further_info */
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

  /**
   * Collect all decisions that have been recorded so far for a household.
   * Used in the reviewer dialog to show a trail of prior approvals/rejections.
   */
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

  /** Find the head-of-household member, falling back to the first member */
  const getPrimaryApplicant = (household: any) => {
    return household.members?.find((m: any) => m.isHead) || household.members?.[0];
  };

  /* ── Render helpers ─────────────────────────────────────────────────── */

  /** Render a single application row within a tab (shows ID, applicant name, location, review button) */
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
            {step === 'social_worker' ? 'Assess Application' : 'Review Assessment'}
          </Button>
        </div>
      </div>
    );
  };

  /** Render the content of a workflow tab — either an empty state or a list of application cards */
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

  /* ────────────────────────────────────────────────────────────────────────
   * RENDER
   * ──────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Assessments and Recommendations</h1>
            <p className="text-muted-foreground">Assess applications and review them through the approval workflow.</p>
          </div>
        </div>

        {/* ── Step count summary cards ────────────────────────────────────
         * One card per workflow step showing how many applications are
         * currently waiting at that step. Gives a quick at-a-glance overview.
         * ──────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-teal-50 border-teal-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-teal-700">Social Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700" data-testid="count-social-worker">{socialWorkerApps.length}</div>
            </CardContent>
          </Card>
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

        {/* ── Workflow tabs ────────────────────────────────────────────────
         * Five tabs, one per approval step. Each tab lists the applications
         * currently at that step with a "Review" / "Assess" button.
         * ──────────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment and Recommendation Workflow</CardTitle>
            <CardDescription>Applications are assessed by a social worker then progress through each approval level.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="social_worker" className="w-full">
              <TabsList className="mb-4 grid grid-cols-5 w-full">
                <TabsTrigger value="social_worker" data-testid="tab-social-worker" className="gap-2">
                  <span className="hidden sm:inline">Social Worker</span>
                  <span className="sm:hidden">S.W.</span>
                  <Badge variant="secondary" className="ml-1">{socialWorkerApps.length}</Badge>
                </TabsTrigger>
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
              
              <TabsContent value="social_worker">
                {renderStepContent('social_worker', socialWorkerApps)}
              </TabsContent>

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

        {/* ────────────────────────────────────────────────────────────────
         * DIALOG 1: Review Assessment
         *
         * Opened when a reviewer clicks "Assess Application" or "Review
         * Assessment" on a card. Content varies by step:
         *
         *   Social Worker step:
         *     - Household demographics table
         *     - Summary stats (member count, total income, vulnerability)
         *     - Editable assessment form (notes, recommendation, amounts)
         *     - Buttons: Save (draft) | Save and Send to Coordinator
         *
         *   All other steps (Coordinator / Director / PS / Minister):
         *     - Household demographics table
         *     - Summary stats
         *     - Read-only SW assessment & recommendation
         *     - Trail of prior step decisions
         *     - Decision selector (Agree / Disagree / More Info) + comments
         *     - Buttons: Save (draft) | Save and Send to Next Step
         * ──────────────────────────────────────────────────────────────── */}
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
                    {currentStep === 'social_worker' ? 'Social Worker Assessment' : `${getCurrentStepLabel()} Review`}
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
                {/* Household Demographics — compact table of all members (name, sex, age, relationship) */}
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
                
                {/* Summary Section — key metrics for the reviewer's quick reference */}
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
                        ${(selectedHousehold.members?.reduce((total: number, m: any) => {
                          if (m.incomeType) {
                            try {
                              const entries = typeof m.incomeType === 'string' ? JSON.parse(m.incomeType) : m.incomeType;
                              if (Array.isArray(entries)) {
                                return total + entries.reduce((sum: number, e: any) => sum + (parseFloat(e.monthlyAmount) || 0), 0);
                              }
                            } catch { /* fall through */ }
                          }
                          return total + (parseFloat(m.monthlyIncome) || 0);
                        }, 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                
                {/* ── Conditional content: SW form vs Reviewer decision ────── */}
                {currentStep === 'social_worker' ? (
                  <>
                    {/* Alert banner — visible when a reviewer returned the application for more info */}
                    {selectedHousehold.programStatus === 'pending_additional_info' && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold">
                          <AlertCircle className="h-4 w-4" />
                          Additional Information Requested
                        </div>
                        <p className="text-sm text-amber-700">This application was returned by a reviewer. Please review the comments and update the assessment.</p>
                        <div className="space-y-2 mt-2 p-3 bg-white/60 rounded border border-amber-200">
                          {selectedHousehold.coordinatorComments && (
                            <div><p className="text-xs font-semibold uppercase text-amber-600">Coordinator:</p><p className="text-sm">{selectedHousehold.coordinatorComments}</p></div>
                          )}
                          {selectedHousehold.directorComments && (
                            <div><p className="text-xs font-semibold uppercase text-amber-600">Director:</p><p className="text-sm">{selectedHousehold.directorComments}</p></div>
                          )}
                          {selectedHousehold.permanentSecretaryComments && (
                            <div><p className="text-xs font-semibold uppercase text-amber-600">Permanent Secretary:</p><p className="text-sm">{selectedHousehold.permanentSecretaryComments}</p></div>
                          )}
                          {selectedHousehold.ministerComments && (
                            <div><p className="text-xs font-semibold uppercase text-amber-600">Minister:</p><p className="text-sm">{selectedHousehold.ministerComments}</p></div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Assessment Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="sw-assessment-notes">Assessment Notes</Label>
                      <Textarea
                        id="sw-assessment-notes"
                        placeholder="Enter your assessment, observations, and recommendations..."
                        value={swAssessmentNotes}
                        onChange={(e) => setSwAssessmentNotes(e.target.value)}
                        rows={5}
                        className="resize-y"
                      />
                    </div>

                    {/* Additional Assets Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="sw-household-assets">Additional Assets Notes</Label>
                      <Textarea
                        id="sw-household-assets"
                        placeholder="Notes about additional household assets (property, vehicles, livestock, savings...)"
                        value={swHouseholdAssets}
                        onChange={(e) => setSwHouseholdAssets(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    {/* Recommendation Form */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Recommendation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Recommendation</Label>
                          <Select value={swRecommendation} onValueChange={setSwRecommendation}>
                            <SelectTrigger>
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
                          <Label>Amount Allocation ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
                            value={swAmountAllocation}
                            onChange={(e) => setSwAmountAllocation(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (Months)</Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Enter duration"
                            value={swDurationMonths}
                            onChange={(e) => setSwDurationMonths(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Financial Transfer Modality</Label>
                          <Select value={swTransferModality} onValueChange={setSwTransferModality}>
                            <SelectTrigger>
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
                          <Label>Complementary Activities</Label>
                          <Textarea
                            placeholder="Describe any complementary activities recommended..."
                            value={swComplementaryActivities}
                            onChange={(e) => setSwComplementaryActivities(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <Label>Comments</Label>
                          <Textarea
                            placeholder="Additional comments or notes..."
                            value={swRecommendationComments}
                            onChange={(e) => setSwRecommendationComments(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ── Read-only view for non-SW reviewers ───────────────── */}
                    {/* Assessment Notes (from Social Worker) — read only */}
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

                    {/* Social Worker Recommendation — read only summary card */}
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

                    {/* Trail of prior approval decisions from earlier steps */}
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

                    {/* Current reviewer's decision form (Agree / Disagree / More Info + comments) */}
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
                                <span>Requires More Information - Return to Social Worker</span>
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
                          This will return the application to the Social Worker for additional information.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Dialog footer with Save / Submit buttons ─────────────
             * Social Worker: "Save" (draft) + "Save and Send to Coordinator"
             * Other steps:   "Save" (draft) + "Save and Send to {Next Step}"
             * Button colour reflects the selected decision (green/red/amber).
             * ──────────────────────────────────────────────────────────── */}
            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setReviewDialogOpen(false);
                setSelectedHousehold(null);
              }}>
                Cancel
              </Button>
              {currentStep === 'social_worker' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSaveOnly}
                    disabled={swSaveOnlyMutation.isPending || swSubmitMutation.isPending}
                    data-testid="button-save-only"
                    className="gap-2"
                  >
                    {swSaveOnlyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={swSaveOnlyMutation.isPending || swSubmitMutation.isPending}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    data-testid="button-submit-review"
                  >
                    {swSubmitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Save and Send to Coordinator
                  </Button>
                </>
              ) : (
                <>
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
                      if (decision === 'requires_further_info') return 'Save and Return to Social Worker';
                      const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
                      const nextStepConfig = WORKFLOW_STEPS.find(s => s.id === stepConfig?.nextStep);
                      return nextStepConfig ? `Save and Send to ${nextStepConfig.label}` : 'Save and Complete';
                    })()}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ────────────────────────────────────────────────────────────────
         * DIALOG 2: Full Application Popup
         *
         * Read-only overlay showing the complete application data. Opened
         * from the "View Full Application" button inside the Review dialog.
         *
         * Card order mirrors the application detail page:
         *   1. Intake Information (with proxy sub-section if applicable)
         *   2. Applicant Information — personal details per member
         *   3. Location & Address
         *   4. Home Visit Information (conditional on homeVisitStatus === 'completed')
         *      — household details (roof, walls, assets) + per-member education,
         *        employment & income
         * ──────────────────────────────────────────────────────────────── */}
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

                  {/* Proxy Information (merged into Intake) */}
                  {!selectedHousehold.isOnOwnBehalf && selectedHousehold.proxyFirstName && (
                    <>
                      <Separator />
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Proxy Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Proxy Name:</span>
                          <p className="font-medium">{selectedHousehold.proxyFirstName} {selectedHousehold.proxyLastName}</p>
                        </div>
                        {selectedHousehold.proxyAlias && (
                          <div>
                            <span className="text-muted-foreground">Alias:</span>
                            <p className="font-medium">{selectedHousehold.proxyAlias}</p>
                          </div>
                        )}
                        {selectedHousehold.proxyGender && (
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <p className="font-medium capitalize">{selectedHousehold.proxyGender}</p>
                          </div>
                        )}
                        {selectedHousehold.proxyDateOfBirth && (
                          <div>
                            <span className="text-muted-foreground">Date of Birth:</span>
                            <p className="font-medium">{new Date(selectedHousehold.proxyDateOfBirth).toLocaleDateString()}</p>
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
                        {selectedHousehold.proxyAddress && (
                          <div className="md:col-span-3">
                            <span className="text-muted-foreground">Address:</span>
                            <p className="font-medium">{selectedHousehold.proxyAddress}</p>
                          </div>
                        )}
                        {selectedHousehold.proxyRelationship && (
                          <div>
                            <span className="text-muted-foreground">Relationship:</span>
                            <p className="font-medium capitalize">{selectedHousehold.proxyRelationship}</p>
                          </div>
                        )}
                        {selectedHousehold.proxyRole && (
                          <div>
                            <span className="text-muted-foreground">Role:</span>
                            <p className="font-medium">{selectedHousehold.proxyRole}</p>
                          </div>
                        )}
                        {selectedHousehold.proxyReason && (
                          <div className="md:col-span-3">
                            <span className="text-muted-foreground">Reason for Proxy:</span>
                            <p className="font-medium">{selectedHousehold.proxyReason}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>


                {/* Applicant Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Applicant Information ({selectedHousehold.members?.length || 0} members)</h3>
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

                          {/* Personal Details */}
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Personal Details</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
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
                              <p className="font-medium">{member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '—'}</p>
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
                    {selectedHousehold.gpsCoordinates && (
                      <div>
                        <span className="text-muted-foreground">GPS Coordinates:</span>
                        <p className="font-medium font-mono">{selectedHousehold.gpsCoordinates}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Home Visit Information */}
                {selectedHousehold.homeVisitStatus === 'completed' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Home Visit Information</h3>

                    {/* Household Details */}
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Household Details</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Roof Type:</span>
                        <p className="font-medium capitalize">{selectedHousehold.roofType || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wall Type:</span>
                        <p className="font-medium capitalize">{selectedHousehold.wallType || '—'}</p>
                      </div>
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

                    {selectedHousehold.homeVisitNotes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Home Visit Notes:</span>
                        <p className="font-medium mt-1 whitespace-pre-wrap">{selectedHousehold.homeVisitNotes}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Member Education, Employment & Income */}
                    {selectedHousehold.members?.map((member: any, idx: number) => (
                      <div key={member.id} className="p-4 border rounded-lg bg-muted/20">
                        <p className="font-semibold mb-3">{member.firstName} {member.lastName}</p>

                        {/* Education */}
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Education</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                          <div>
                            <span className="text-muted-foreground">Education Level:</span>
                            <p className="font-medium capitalize">{member.educationLevel?.replace(/_/g, ' ') || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Enrolment:</span>
                            <p className="font-medium capitalize">{member.currentEducationEnrolment?.replace(/_/g, ' ') || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Certifications:</span>
                            <p className="font-medium">{member.professionalCertifications?.replace(/_/g, ' ') || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ongoing Certification:</span>
                            <p className="font-medium">{member.ongoingCertification || '—'}</p>
                          </div>
                        </div>

                        {/* Employment & Income */}
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Employment & Income</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Professional Situation:</span>
                            <p className="font-medium capitalize">{member.professionalSituation?.replace(/_/g, ' ') || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Employer Details:</span>
                            <p className="font-medium">{member.employerDetails || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Income Sources:</span>
                            <p className="font-medium">
                              {member.incomeType
                                ? (() => {
                                    try {
                                      const incomes = typeof member.incomeType === 'string' ? JSON.parse(member.incomeType) : member.incomeType;
                                      if (Array.isArray(incomes) && incomes.length > 0) {
                                        return incomes.map((inc: any) =>
                                          `${inc.type?.replace(/_/g, ' ')} ($${inc.monthlyAmount || 0})`
                                        ).join(', ');
                                      }
                                      return member.incomeType.replace(/_/g, ' ');
                                    } catch {
                                      return String(member.incomeType).replace(/_/g, ' ');
                                    }
                                  })()
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Income:</span>
                            <p className="font-medium">{member.monthlyIncome ? `$${parseFloat(member.monthlyIncome).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
