import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function Assessments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [assessmentDecision, setAssessmentDecision] = useState<'eligible' | 'ineligible'>('eligible');

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const pendingAssessments = households.filter((h: any) => h.programStatus === 'pending_assessment');
  const enrolledHouseholds = households.filter((h: any) => h.programStatus === 'enrolled');

  const conductAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create assessment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      toast({
        title: "Assessment Completed",
        description: "Household eligibility has been determined.",
      });
      setAssessmentFormOpen(false);
      setSelectedHousehold(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenAssessment = (household: any, decision: 'eligible' | 'ineligible') => {
    setSelectedHousehold(household);
    setAssessmentDecision(decision);
    setAssessmentFormOpen(true);
  };

  const handleSubmitAssessment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string;

    conductAssessmentMutation.mutate({
      householdId: selectedHousehold.id,
      assessmentType: 'manual',
      rawScore: assessmentDecision === 'eligible' ? 100 : 0,
      adjustedScore: assessmentDecision === 'eligible' ? 100 : 0,
      decision: assessmentDecision,
      justification: notes || (assessmentDecision === 'eligible' ? 'Approved for enrollment' : 'Does not meet eligibility criteria'),
      notes,
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Assessments & Eligibility</h1>
            <p className="text-muted-foreground">Review households and determine program eligibility.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary" data-testid="text-pending-count">{pendingAssessments.length}</div>
              <p className="text-sm text-muted-foreground">Households awaiting decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600" data-testid="text-enrolled-count">{enrolledHouseholds.length}</div>
              <p className="text-sm text-muted-foreground">Approved and active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Ineligible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground" data-testid="text-ineligible-count">
                {households.filter((h: any) => h.programStatus === 'ineligible').length}
              </div>
              <p className="text-sm text-muted-foreground">Did not qualify</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Queue</CardTitle>
            <CardDescription>Households requiring eligibility determination.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingAssessments.length})</TabsTrigger>
                <TabsTrigger value="flagged" data-testid="tab-flagged">Flagged for Review</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading assessments...</div>
                ) : pendingAssessments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No households pending assessment.</p>
                  </div>
                ) : (
                  pendingAssessments.map((hh: any) => (
                    <div key={hh.id} className="flex flex-col lg:flex-row gap-6 p-6 border border-border rounded-xl bg-card hover:shadow-md transition-all" data-testid={`card-assessment-${hh.id}`}>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold font-heading" data-testid={`text-household-${hh.id}`}>Household {hh.householdCode}</h3>
                          <Badge variant="outline" className="font-mono text-xs">{hh.householdCode}</Badge>
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Needs Review</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                          <span>Location: {hh.village}, {hh.district}</span>
                          <span>Registered: {new Date(hh.registrationDate).toLocaleDateString()}</span>
                          <span>Province: {hh.province}</span>
                        </div>
                      </div>
                      
                      <div className="w-full lg:w-64 space-y-3">
                        <div className="flex gap-2 pt-2">
                          <Button 
                            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleOpenAssessment(hh, 'eligible')}
                            disabled={conductAssessmentMutation.isPending}
                            data-testid={`button-approve-${hh.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenAssessment(hh, 'ineligible')}
                            disabled={conductAssessmentMutation.isPending}
                            data-testid={`button-reject-${hh.id}`}
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="flagged" className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No flagged assessments at this time.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Assessment Dialog */}
        <Dialog open={assessmentFormOpen} onOpenChange={(open) => {
          if (!open) {
            setAssessmentFormOpen(false);
            setSelectedHousehold(null);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {assessmentDecision === 'eligible' ? 'Approve Household' : 'Reject Household'}
              </DialogTitle>
              <DialogDescription>
                {assessmentDecision === 'eligible' 
                  ? `Approve ${selectedHousehold?.householdCode} for program enrollment.`
                  : `Reject ${selectedHousehold?.householdCode} from program enrollment.`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAssessment}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Decision</Label>
                  <Select value={assessmentDecision} onValueChange={(v: 'eligible' | 'ineligible') => setAssessmentDecision(v)}>
                    <SelectTrigger data-testid="select-decision">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible">Eligible - Approve for Enrollment</SelectItem>
                      <SelectItem value="ineligible">Ineligible - Reject Application</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Justification / Notes</Label>
                  <Textarea 
                    name="notes" 
                    placeholder="Provide a reason for this decision..."
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setAssessmentFormOpen(false);
                  setSelectedHousehold(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={conductAssessmentMutation.isPending}
                  className={assessmentDecision === 'eligible' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'}
                  data-testid="button-submit-assessment"
                >
                  {conductAssessmentMutation.isPending ? "Submitting..." : (assessmentDecision === 'eligible' ? 'Approve' : 'Reject')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
