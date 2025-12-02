import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileCheck, Calculator } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const pendingAssessments = households.filter((h: any) => h.programStatus === 'pending_assessment');
  const eligibleHouseholds = households.filter((h: any) => (h.vulnerabilityScore || 0) >= 80);

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

  const handleApprove = (household: any) => {
    setSelectedHousehold(household);
    setAssessmentFormOpen(true);
  };

  const handleReject = (household: any) => {
    const rawScore = 45;
    const adjustedScore = 45;

    conductAssessmentMutation.mutate({
      householdId: household.id,
      assessmentType: 'pmt',
      rawScore,
      adjustedScore,
      decision: 'ineligible',
      justification: 'Does not meet minimum PMT threshold for program eligibility.',
    });
  };

  const handleSubmitAssessment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedHousehold) return;

    const formData = new FormData(e.currentTarget);
    const rawScore = parseInt(formData.get('rawScore') as string);
    const adjustedScore = parseInt(formData.get('adjustedScore') as string);
    const housingType = formData.get('housingType') as string;
    const incomeSource = formData.get('incomeSource') as string;
    const notes = formData.get('notes') as string;

    conductAssessmentMutation.mutate({
      householdId: selectedHousehold.id,
      assessmentType: 'pmt',
      rawScore,
      adjustedScore,
      decision: adjustedScore >= 80 ? 'eligible' : 'ineligible',
      justification: adjustedScore >= 80 ? 'Meets PMT threshold for eligibility' : 'Below PMT threshold',
      housingType,
      incomeSource,
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
            <p className="text-muted-foreground">Process household vulnerability scores and determine program eligibility.</p>
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
              <CardTitle className="text-lg font-medium">Auto-Eligible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600" data-testid="text-eligible-count">{eligibleHouseholds.length}</div>
              <p className="text-sm text-muted-foreground">Score &gt; 80 (PMT Threshold)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Enrolled (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground" data-testid="text-enrolled-count">
                {households.filter((h: any) => h.programStatus === 'enrolled').length}
              </div>
              <p className="text-sm text-muted-foreground">Approved and active</p>
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
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-medium">PMT Score</span>
                          <span className="text-2xl font-bold text-foreground">{hh.vulnerabilityScore || 0}/100</span>
                        </div>
                        <Progress value={hh.vulnerabilityScore || 0} className="h-2" />
                        <div className="flex gap-2 pt-2">
                          <Dialog open={assessmentFormOpen && selectedHousehold?.id === hh.id} onOpenChange={(open) => {
                            if (!open) {
                              setAssessmentFormOpen(false);
                              setSelectedHousehold(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleApprove(hh)}
                                data-testid={`button-approve-${hh.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4" /> Assess
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Conduct Assessment</DialogTitle>
                                <DialogDescription>
                                  Complete the vulnerability assessment for {hh.householdCode}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitAssessment}>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Raw PMT Score</Label>
                                      <Input 
                                        name="rawScore" 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        defaultValue="75" 
                                        required 
                                        data-testid="input-raw-score"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Adjusted Score</Label>
                                      <Input 
                                        name="adjustedScore" 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        defaultValue="82" 
                                        required 
                                        data-testid="input-adjusted-score"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Housing Type</Label>
                                    <Select name="housingType" defaultValue="semi">
                                      <SelectTrigger data-testid="select-housing">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="permanent">Permanent (Concrete/Brick)</SelectItem>
                                        <SelectItem value="semi">Semi-Permanent (Mud/Wood)</SelectItem>
                                        <SelectItem value="temporary">Temporary (Makeshift)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Income Source</Label>
                                    <Select name="incomeSource" defaultValue="agriculture">
                                      <SelectTrigger data-testid="select-income">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="agriculture">Subsistence Agriculture</SelectItem>
                                        <SelectItem value="labor">Casual Labor</SelectItem>
                                        <SelectItem value="trading">Small Trading</SelectItem>
                                        <SelectItem value="none">No Income Source</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Assessment Notes</Label>
                                    <Textarea 
                                      name="notes" 
                                      placeholder="Document any observations or special circumstances..."
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
                                    data-testid="button-submit-assessment"
                                  >
                                    {conductAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleReject(hh)}
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

        {/* Info Card */}
        <Card className="bg-muted/10 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Eligibility Criteria</CardTitle>
            </div>
            <CardDescription>Households with an adjusted PMT score of 80 or higher are automatically eligible for enrollment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
              <div className="text-sm text-muted-foreground">
                The Proxy Means Test (PMT) score is calculated based on dwelling type, income sources, household composition, and other socio-economic indicators collected during registration.
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
