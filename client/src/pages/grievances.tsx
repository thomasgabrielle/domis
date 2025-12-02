import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function Grievances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: grievances = [], isLoading } = useQuery({
    queryKey: ['grievances'],
    queryFn: async () => {
      const response = await fetch('/api/grievances');
      if (!response.ok) throw new Error('Failed to fetch grievances');
      return response.json();
    },
  });

  const { data: households = [] } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const createGrievanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create grievance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      toast({
        title: "Grievance Logged",
        description: "The grievance has been recorded and assigned for review.",
      });
      setDialogOpen(false);
    },
  });

  const resolveGrievanceMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      const response = await fetch(`/api/grievances/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved', resolution }),
      });
      if (!response.ok) throw new Error('Failed to resolve grievance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      toast({
        title: "Grievance Resolved",
        description: "The grievance has been marked as resolved.",
      });
    },
  });

  const openGrievances = grievances.filter((g: any) => g.status === 'open');
  const resolvedGrievances = grievances.filter((g: any) => g.status === 'resolved' || g.status === 'closed');

  const handleSubmitGrievance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createGrievanceMutation.mutate({
      householdId: formData.get('householdId') as string || null,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string,
      filedBy: formData.get('filedBy') as string,
      contactInfo: formData.get('contactInfo') as string,
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Accountability & Grievances</h1>
            <p className="text-muted-foreground">Manage complaints, appeals, and feedback.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-log-grievance">
                <AlertCircle className="h-4 w-4" /> Log New Grievance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Log New Grievance</DialogTitle>
                <DialogDescription>Record a new complaint or appeal from a beneficiary.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitGrievance}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Household (Optional)</Label>
                    <Select name="householdId">
                      <SelectTrigger data-testid="select-household">
                        <SelectValue placeholder="Select household..." />
                      </SelectTrigger>
                      <SelectContent>
                        {households.map((h: any) => (
                          <SelectItem key={h.id} value={h.id}>{h.householdCode} - {h.village}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="category" defaultValue="service_quality" required>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eligibility_dispute">Eligibility Dispute</SelectItem>
                        <SelectItem value="payment_issue">Payment Issue</SelectItem>
                        <SelectItem value="service_quality">Service Quality</SelectItem>
                        <SelectItem value="data_privacy">Data Privacy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      name="description" 
                      placeholder="Describe the issue or complaint..." 
                      required 
                      data-testid="textarea-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Filed By</Label>
                      <Input name="filedBy" placeholder="Name" required data-testid="input-filed-by" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Info</Label>
                      <Input name="contactInfo" placeholder="Phone/Email" data-testid="input-contact" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createGrievanceMutation.isPending} data-testid="button-submit-grievance">
                    {createGrievanceMutation.isPending ? "Submitting..." : "Log Grievance"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Grievances</p>
                <p className="text-2xl font-bold" data-testid="text-open-count">{openGrievances.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Resolved (Total)</p>
                <p className="text-2xl font-bold" data-testid="text-resolved-count">{resolvedGrievances.length}</p>
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
                  <Input placeholder="Search by ID or Keyword..." className="pl-8" data-testid="input-search" />
                </div>
                <Button variant="outline" size="icon" data-testid="button-filter">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all">All Cases</TabsTrigger>
                <TabsTrigger value="open" data-testid="tab-open">Open ({openGrievances.length})</TabsTrigger>
                <TabsTrigger value="resolved" data-testid="tab-resolved">Resolved ({resolvedGrievances.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading grievances...</div>
                ) : grievances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No grievances logged yet.</div>
                ) : (
                  grievances.map((g: any) => (
                    <div key={g.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors" data-testid={`card-grievance-${g.id}`}>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{g.grievanceCode}</span>
                          <Badge variant="outline">{g.category}</Badge>
                          <Badge className={
                            g.status === 'open' ? 'bg-destructive hover:bg-destructive' :
                            g.status === 'resolved' || g.status === 'closed' ? 'bg-accent hover:bg-accent text-accent-foreground' : 
                            'bg-secondary hover:bg-secondary'
                          }>
                            {g.status}
                          </Badge>
                          {g.priority === 'high' && <Badge variant="destructive">High Priority</Badge>}
                        </div>
                        <h3 className="font-medium text-foreground">{g.description}</h3>
                        <p className="text-sm text-muted-foreground">Filed on {new Date(g.dateFiled).toLocaleDateString()} • By: {g.filedBy}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {g.status === 'open' && (
                          <Button 
                            size="sm" 
                            onClick={() => resolveGrievanceMutation.mutate({ 
                              id: g.id, 
                              resolution: 'Issue has been addressed and resolved.' 
                            })}
                            disabled={resolveGrievanceMutation.isPending}
                            data-testid={`button-resolve-${g.id}`}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="open" className="space-y-4">
                {openGrievances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No open grievances.</div>
                ) : (
                  openGrievances.map((g: any) => (
                    <div key={g.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{g.grievanceCode}</span>
                          <Badge variant="outline">{g.category}</Badge>
                        </div>
                        <h3 className="font-medium text-foreground">{g.description}</h3>
                        <p className="text-sm text-muted-foreground">Filed on {new Date(g.dateFiled).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => resolveGrievanceMutation.mutate({ 
                            id: g.id, 
                            resolution: 'Issue has been addressed and resolved.' 
                          })}
                          disabled={resolveGrievanceMutation.isPending}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="resolved" className="space-y-4">
                {resolvedGrievances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No resolved grievances yet.</div>
                ) : (
                  resolvedGrievances.map((g: any) => (
                    <div key={g.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{g.grievanceCode}</span>
                          <Badge variant="outline">{g.category}</Badge>
                        </div>
                        <h3 className="font-medium text-foreground">{g.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Resolved on {new Date(g.resolvedDate).toLocaleDateString()}
                        </p>
                        {g.resolution && (
                          <p className="text-sm text-muted-foreground italic">Resolution: {g.resolution}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
