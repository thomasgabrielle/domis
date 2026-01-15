import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Search, Users, ChevronRight } from "lucide-react";
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
  registrationDate: string | null;
};

export function Worksheet() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

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

  // Filter out households that have been moved to Recommendations module
  // (those with assessmentStep set)
  const applicationsInModule = allMembers.filter((data: any) => 
    data.household && !data.household.assessmentStep
  );

  // Create one row per application (household), not per member
  const applications: ApplicationRow[] = applicationsInModule.map((data: any) => {
    if (!data.household) return null;
    const head = data.members?.find((m: any) => m.isHead) || data.members?.[0];
    return {
      id: data.household.id,
      applicationId: data.household.applicationId || data.household.householdCode,
      householdCode: data.household.householdCode,
      headFirstName: head?.firstName || '—',
      headLastName: head?.lastName || '—',
      headNationalId: head?.nationalId || null,
      memberCount: data.members?.length || 0,
      region: data.household.province,
      district: data.household.district,
      village: data.household.village,
      status: data.household.programStatus,
      registrationDate: data.household.registrationDate,
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
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Get unique regions for filter
  const uniqueRegions = Array.from(new Set(applications.map(a => a.region)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrolled</Badge>;
      case 'pending_assessment':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Assessment</Badge>;
      case 'ineligible':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Ineligible</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <Download className="h-4 w-4" /> Export to CSV
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold" data-testid="text-total-count">{applications.length}</p>
              </div>
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
              <p className="text-sm font-medium text-muted-foreground">Ineligible</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-ineligible-count">
                {applications.filter(a => a.status === 'ineligible').length}
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
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="pending_assessment">Pending Assessment</SelectItem>
                  <SelectItem value="ineligible">Ineligible</SelectItem>
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
                          {app.headFirstName} {app.headLastName}
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
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
