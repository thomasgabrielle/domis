import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockGrievances } from "@/lib/mockData";
import { Search, Filter, AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function Grievances() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Accountability & Grievances</h1>
            <p className="text-muted-foreground">Manage complaints, appeals, and feedback.</p>
          </div>
          <Button className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <AlertCircle className="h-4 w-4" /> Log New Grievance
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Grievances</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">4.5 Days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved (YTD)</p>
                <p className="text-2xl font-bold">148</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Case List</CardTitle>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID or Keyword..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {mockGrievances.map((g) => (
                  <div key={g.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{g.id}</span>
                        <Badge variant="outline">{g.category}</Badge>
                        <Badge className={
                          g.status === 'Open' ? 'bg-destructive hover:bg-destructive' :
                          g.status === 'Resolved' ? 'bg-accent hover:bg-accent text-accent-foreground' : 
                          'bg-secondary hover:bg-secondary'
                        }>
                          {g.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground">{g.description}</h3>
                      <p className="text-sm text-muted-foreground">Filed on {g.dateFiled} • Household: {g.householdId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      {g.status === 'Open' && <Button size="sm">Resolve</Button>}
                    </div>
                  </div>
                ))}
                 {/* Mock items to fill list if mockData is short */}
                <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">GR-2024-099</span>
                        <Badge variant="outline">Service Quality</Badge>
                        <Badge className="bg-accent hover:bg-accent text-accent-foreground">Resolved</Badge>
                      </div>
                      <h3 className="font-medium text-foreground">Social worker missed scheduled assessment appointment.</h3>
                      <p className="text-sm text-muted-foreground">Filed on 2024-12-10 • Household: HH-2024-005</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
