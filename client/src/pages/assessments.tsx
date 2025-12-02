import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, FileCheck, Calculator, ChevronRight, UserCheck } from "lucide-react";
import { mockHouseholds } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";

export function Assessments() {
  const pendingAssessments = mockHouseholds.filter(h => h.programStatus.pap === 'Pending Assessment');
  const eligibleHouseholds = mockHouseholds.filter(h => h.vulnerabilityScore >= 80);
  
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
              <div className="text-3xl font-bold text-primary">{pendingAssessments.length}</div>
              <p className="text-sm text-muted-foreground">Households awaiting decision</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Auto-Eligible</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{eligibleHouseholds.length}</div>
              <p className="text-sm text-muted-foreground">Score &gt; 80 (PMT Threshold)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Rejections (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">14</div>
              <p className="text-sm text-muted-foreground">Below threshold criteria</p>
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
                <TabsTrigger value="pending">Pending ({pendingAssessments.length})</TabsTrigger>
                <TabsTrigger value="flagged">Flagged for Review</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-4">
                {pendingAssessments.map((hh) => (
                  <div key={hh.id} className="flex flex-col lg:flex-row gap-6 p-6 border border-border rounded-xl bg-card hover:shadow-md transition-all">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold font-heading">{hh.headOfHousehold.firstName} {hh.headOfHousehold.lastName}</h3>
                        <Badge variant="outline" className="font-mono text-xs">{hh.id}</Badge>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Needs Review</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                        <span>Location: {hh.address.village}, {hh.address.district}</span>
                        <span>Household Size: {hh.members.length + 1} Members</span>
                        <span>Registered: {hh.registrationDate}</span>
                        <span>Assigned To: {hh.assignedSocialWorker || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    <div className="w-full lg:w-64 space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-medium">PMT Score</span>
                        <span className="text-2xl font-bold text-foreground">{hh.vulnerabilityScore}/100</span>
                      </div>
                      <Progress value={hh.vulnerabilityScore} className="h-2" />
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                 
                 {/* Empty state if no pending */}
                 {pendingAssessments.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                     <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                     <p>No households pending assessment.</p>
                   </div>
                 )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Simulation Tool */}
        <Card className="bg-muted/10 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Eligibility Simulator</CardTitle>
            </div>
            <CardDescription>Test how changes to PMT criteria affect eligibility rates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
               <div className="flex-1">
                 <p className="font-medium">Adjust Cut-off Threshold</p>
                 <p className="text-sm text-muted-foreground">Current: &gt;80 points</p>
               </div>
               <div className="flex items-center gap-4">
                 <Button variant="outline">Run Simulation</Button>
               </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
