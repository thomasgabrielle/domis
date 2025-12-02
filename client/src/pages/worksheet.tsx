import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Search, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type ApplicantRow = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToHead: string;
  nationalId: string | null;
  region: string;
  district: string;
  status: string;
  householdId: string;
  householdCode: string;
};

export function Worksheet() {
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

  // Flatten all members into applicant rows
  const applicants: ApplicantRow[] = allMembers.flatMap((data: any) => {
    if (!data.members || !data.household) return [];
    return data.members.map((member: any) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      relationshipToHead: member.relationshipToHead,
      nationalId: member.nationalId,
      region: data.household.province,
      district: data.household.district,
      status: data.household.programStatus,
      householdId: data.household.id,
      householdCode: data.household.householdCode,
    }));
  });

  // Apply filters
  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch = 
      applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (applicant.nationalId && applicant.nationalId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || applicant.status === statusFilter;
    const matchesRegion = regionFilter === "all" || applicant.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Get unique regions for filter
  const uniqueRegions = Array.from(new Set(applicants.map(a => a.region)));

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

  const formatRelationship = (rel: string) => {
    const labels: Record<string, string> = {
      head: 'Head of Household',
      spouse: 'Spouse',
      child: 'Child',
      parent: 'Parent',
      sibling: 'Sibling',
      other: 'Other Relative',
    };
    return labels[rel] || rel;
  };

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground">Complete list of all registered applicants across households.</p>
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
                <p className="text-sm font-medium text-muted-foreground">Total Applicants</p>
                <p className="text-2xl font-bold" data-testid="text-total-count">{applicants.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Enrolled</p>
              <p className="text-2xl font-bold text-emerald-600" data-testid="text-enrolled-count">
                {applicants.filter(a => a.status === 'enrolled').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Pending Assessment</p>
              <p className="text-2xl font-bold text-amber-600" data-testid="text-pending-count">
                {applicants.filter(a => a.status === 'pending_assessment').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Ineligible</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-ineligible-count">
                {applicants.filter(a => a.status === 'ineligible').length}
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

        {/* Applicants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Showing {filteredApplicants.length} of {applicants.length} applicants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading applicants...</div>
            ) : filteredApplicants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {applicants.length === 0 
                  ? "No applicants registered yet. Register a household to see applicants here."
                  : "No applicants match your search criteria."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Relationship to Head</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplicants.map((applicant) => (
                      <TableRow key={applicant.id} data-testid={`row-applicant-${applicant.id}`}>
                        <TableCell className="font-medium" data-testid={`text-firstname-${applicant.id}`}>
                          {applicant.firstName}
                        </TableCell>
                        <TableCell data-testid={`text-lastname-${applicant.id}`}>
                          {applicant.lastName}
                        </TableCell>
                        <TableCell data-testid={`text-dob-${applicant.id}`}>
                          {formatDate(applicant.dateOfBirth)}
                        </TableCell>
                        <TableCell className="capitalize" data-testid={`text-gender-${applicant.id}`}>
                          {applicant.gender}
                        </TableCell>
                        <TableCell data-testid={`text-relationship-${applicant.id}`}>
                          {formatRelationship(applicant.relationshipToHead)}
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-nationalid-${applicant.id}`}>
                          {applicant.nationalId || '—'}
                        </TableCell>
                        <TableCell data-testid={`text-region-${applicant.id}`}>
                          {applicant.region}
                        </TableCell>
                        <TableCell data-testid={`text-district-${applicant.id}`}>
                          {applicant.district}
                        </TableCell>
                        <TableCell data-testid={`badge-status-${applicant.id}`}>
                          {getStatusBadge(applicant.status)}
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
