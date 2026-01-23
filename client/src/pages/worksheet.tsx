import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Filter, Search, Users, ChevronRight, Plus, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";

type ApplicationRow = {
  id: string;
  applicationId: string;
  householdCode: string;
  headFirstName: string;
  headLastName: string;
  headNationalId: string | null;
  memberCount: number;
  region: string;
  district: string;
  village: string;
  status: string;
  homeVisitStatus: string;
  registrationDate: string | null;
  hasProxy: boolean;
  proxyName: string | null;
  proxyNationalId: string | null;
  proxyRelationship: string | null;
  proxyPhone: string | null;
};

export function Worksheet() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [includeEnrolled, setIncludeEnrolled] = useState(false);

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members'],
    queryFn: async () => {
      const householdsData = await fetch('/api/households').then(r => r.json());
      const membersPromises = householdsData.map(async (h: any) => {
        const response = await fetch(`/api/households/${h.id}`);
        if (!response.ok) return { household: h, members: [] };
        const data = await response.json();
        return data;
      });
      return Promise.all(membersPromises);
    },
  });

  // Show ALL applications (including those awaiting home visit)
  const applicationsInModule = allMembers.filter((data: any) => 
    data.household
  );

  // Derive display status based on workflow step and programStatus
  const getDisplayStatus = (household: any) => {
    // Check if home visit is pending - this is the first status after intake
    if (household.homeVisitStatus !== 'completed') {
      return 'awaiting_home_visit';
    }
    // Check if marked as pending additional info
    if (household.programStatus === 'pending_additional_info') {
      return 'pending_additional_info';
    }
    // If no assessment step set, it's pending assessment (just completed intake)
    if (!household.assessmentStep) {
      return 'pending_assessment';
    }
    // Map assessmentStep to display status
    switch (household.assessmentStep) {
      case 'coordinator':
        return 'pending_coordinator';
      case 'director':
        return 'pending_director';
      case 'permanent_secretary':
        return 'pending_ps';
      case 'minister':
        return 'pending_minister';
      case 'completed':
        return household.programStatus === 'rejected' ? 'rejected' : 'enrolled';
      default:
        return household.programStatus || 'pending_assessment';
    }
  };

  // Create one row per application (household), not per member
  const applications: ApplicationRow[] = applicationsInModule.map((data: any) => {
    if (!data.household) return null;
    const head = data.members?.find((m: any) => m.isHead) || data.members?.[0];
    const h = data.household;
    const hasProxy = !!(h.proxyFirstName || h.proxyLastName);
    const proxyName = hasProxy 
      ? `${h.proxyFirstName || ''} ${h.proxyLastName || ''}`.trim() 
      : null;
    return {
      id: h.id,
      applicationId: h.applicationId || h.householdCode,
      householdCode: h.householdCode,
      headFirstName: head?.firstName || '—',
      headLastName: head?.lastName || '—',
      headNationalId: head?.nationalId || null,
      memberCount: data.members?.length || 0,
      region: h.province,
      district: h.district,
      village: h.village,
      status: getDisplayStatus(h),
      registrationDate: h.registrationDate,
      homeVisitStatus: h.homeVisitStatus || 'pending',
      hasProxy,
      proxyName,
      proxyNationalId: h.proxyNationalId || null,
      proxyRelationship: h.proxyRelationship || null,
      proxyPhone: h.proxyPhone || null,
    };
  }).filter(Boolean) as ApplicationRow[];

  // Apply filters
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.headFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.headLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.headNationalId && app.headNationalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.householdCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesRegion = regionFilter === "all" || app.region === regionFilter;
    
    // Exclude enrolled unless explicitly included
    const matchesEnrolledFilter = includeEnrolled || app.status !== 'enrolled';
    
    return matchesSearch && matchesStatus && matchesRegion && matchesEnrolledFilter;
  });

  // Get unique regions for filter
  const uniqueRegions = Array.from(new Set(applications.map(a => a.region)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_home_visit':
        return <Badge className="bg-sky-100 text-sky-800 border-sky-200">Awaiting Home Visit</Badge>;
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
      case 'enrolled':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrolled</Badge>;
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

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">Complete list of all registered applications awaiting assessment.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation('/registration')} className="gap-2" data-testid="button-new-intake">
              <Plus className="h-4 w-4" /> New Intake
            </Button>
            <Button variant="outline" className="gap-2" data-testid="button-export">
              <Download className="h-4 w-4" /> Export to CSV
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold" data-testid="text-total-count">{applications.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Awaiting Visit</p>
              <p className="text-2xl font-bold text-sky-600" data-testid="text-awaiting-count">
                {applications.filter(a => a.status === 'awaiting_home_visit').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Assessment</p>
              <p className="text-2xl font-bold text-amber-600" data-testid="text-pending-count">
                {applications.filter(a => a.status === 'pending_assessment').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">In Workflow</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-workflow-count">
                {applications.filter(a => ['pending_coordinator', 'pending_director', 'pending_ps', 'pending_minister'].includes(a.status)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Enrolled</p>
              <p className="text-2xl font-bold text-emerald-600" data-testid="text-enrolled-count">
                {applications.filter(a => a.status === 'enrolled').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or National ID..." 
                  className="pl-8 bg-background" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="awaiting_home_visit">Awaiting Home Visit</SelectItem>
                  <SelectItem value="pending_assessment">Pending Assessment</SelectItem>
                  <SelectItem value="pending_additional_info">Pending Additional Info</SelectItem>
                  <SelectItem value="pending_coordinator">Pending Coordinator</SelectItem>
                  <SelectItem value="pending_director">Pending Director</SelectItem>
                  <SelectItem value="pending_ps">Pending Perm. Secretary</SelectItem>
                  <SelectItem value="pending_minister">Pending Minister</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-background" data-testid="select-region">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2">
                <Checkbox 
                  id="include-enrolled" 
                  checked={includeEnrolled} 
                  onCheckedChange={(checked) => setIncludeEnrolled(checked === true)}
                  data-testid="checkbox-include-enrolled"
                />
                <Label htmlFor="include-enrolled" className="text-sm cursor-pointer">
                  Include Enrolled
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Showing {filteredApplications.length} of {applications.length} applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {applications.length === 0 
                  ? "No applications registered yet. Register a household to see applications here."
                  : "No applications match your search criteria."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Head of Household</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead>Date Registered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow 
                        key={app.id} 
                        data-testid={`row-application-${app.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setLocation(`/application/${app.id}`)}
                      >
                        <TableCell className="font-mono text-sm" data-testid={`text-applicationid-${app.id}`}>
                          {app.applicationId}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-head-${app.id}`}>
                          <div className="flex items-center gap-1">
                            {app.headFirstName} {app.headLastName}
                            {app.hasProxy && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-amber-600 font-bold cursor-help">*</span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                      <p className="font-semibold">Proxy Representative</p>
                                      <p className="text-sm">{app.proxyName}</p>
                                      {app.proxyRelationship && (
                                        <p className="text-xs text-muted-foreground">Relationship: {app.proxyRelationship}</p>
                                      )}
                                      {app.proxyNationalId && (
                                        <p className="text-xs text-muted-foreground">ID: {app.proxyNationalId}</p>
                                      )}
                                      {app.proxyPhone && (
                                        <p className="text-xs text-muted-foreground">Phone: {app.proxyPhone}</p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-nationalid-${app.id}`}>
                          {app.headNationalId || '—'}
                        </TableCell>
                        <TableCell data-testid={`text-members-${app.id}`}>
                          {app.memberCount}
                        </TableCell>
                        <TableCell data-testid={`text-region-${app.id}`}>
                          {app.region}
                        </TableCell>
                        <TableCell data-testid={`text-district-${app.id}`}>
                          {app.district}
                        </TableCell>
                        <TableCell data-testid={`text-village-${app.id}`}>
                          {app.village}
                        </TableCell>
                        <TableCell data-testid={`text-date-${app.id}`}>
                          {app.registrationDate ? formatDate(app.registrationDate) : '—'}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${app.id}`}>
                          {getStatusBadge(app.status)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {app.status === 'awaiting_home_visit' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => setLocation(`/home-visit/${app.id}`)}
                              data-testid={`button-start-visit-${app.id}`}
                            >
                              <Home className="h-3 w-3" />
                              Start Visit
                            </Button>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
