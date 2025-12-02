import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockHouseholds } from "@/lib/mockData";
import { Search, FileText, Calendar, AlertTriangle, CheckCircle, Clock, UserPlus, FolderOpen, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function CaseManagement() {
  // Filter only enrolled households for case management context
  const activeCases = mockHouseholds.filter(h => h.programStatus.pap === 'Enrolled');

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Case Management</h1>
            <p className="text-muted-foreground">Social worker dashboard for household follow-ups and support.</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Create New Case
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar / Case List */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">My Caseload</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search cases..." className="pl-8 h-9" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {activeCases.map((hh) => (
                <div key={hh.id} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors border border-transparent hover:border-border/50">
                  <Avatar className="h-10 w-10 border border-border bg-background">
                    <AvatarFallback className="text-xs font-bold text-primary">
                      {hh.headOfHousehold.firstName[0]}{hh.headOfHousehold.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{hh.headOfHousehold.firstName} {hh.headOfHousehold.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{hh.id} • {hh.address.village}</div>
                  </div>
                  {hh.vulnerabilityScore > 90 && (
                    <div className="h-2 w-2 rounded-full bg-destructive" title="High Priority" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Main Case View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Case Header */}
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                     <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                      <AvatarFallback className="text-xl font-heading bg-primary text-primary-foreground">
                        SM
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold font-heading">Sarah Mbezi</h2>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Badge variant="outline">HH-2024-001</Badge>
                        <span>•</span>
                        <span>Sector 4, Capital District</span>
                        <span>•</span>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Active Enrollment</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-2" /> Contact</Button>
                    <Button size="sm"><FolderOpen className="h-4 w-4 mr-2" /> Full Profile</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="activity" className="w-full">
              <TabsList>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="notes">Case Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-6 border-l border-border space-y-8">
                      
                      {/* Timeline Item */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-5 w-5 rounded-full border-2 border-background bg-emerald-500" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Payment Disbursed</span>
                            <span className="text-xs text-muted-foreground">Today, 10:00 AM</span>
                          </div>
                          <p className="text-sm text-muted-foreground">January 2025 Cycle cash transfer of $50.00 was successfully processed.</p>
                        </div>
                      </div>

                      {/* Timeline Item */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-5 w-5 rounded-full border-2 border-background bg-blue-500" />
                         <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Home Visit Completed</span>
                            <span className="text-xs text-muted-foreground">Jan 15, 2025</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Routine monitoring visit. Household reports improved food security. Children attending school.</p>
                          <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border text-xs font-mono flex items-center gap-2 w-fit">
                             <FileText className="h-3 w-3" /> visit_report_jan15.pdf
                          </div>
                        </div>
                      </div>

                       {/* Timeline Item */}
                      <div className="relative">
                        <div className="absolute -left-[29px] top-0 h-5 w-5 rounded-full border-2 border-background bg-amber-500" />
                         <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Grievance Filed</span>
                            <span className="text-xs text-muted-foreground">Dec 20, 2024</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Beneficiary reported issue with mobile money PIN reset.</p>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground py-8">
                      No additional notes found.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

      </main>
    </div>
  );
}
