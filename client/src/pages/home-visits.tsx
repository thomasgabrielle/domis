import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Home, ChevronRight, Calendar, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";

type HomeVisitRow = {
  id: string;
  applicationId: string;
  householdCode: string;
  province: string;
  district: string;
  village: string;
  intakeDate: string;
  homeVisitStatus: string;
  outreachType: string | null;
};

export function HomeVisits() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [regionFilter, setRegionFilter] = useState("all");

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    }
  });

  const homeVisits: HomeVisitRow[] = households.map((h: any) => ({
    id: h.id,
    applicationId: h.applicationId,
    householdCode: h.householdCode,
    province: h.province,
    district: h.district,
    village: h.village,
    intakeDate: h.intakeDate,
    homeVisitStatus: h.homeVisitStatus || 'pending',
    outreachType: h.outreachType,
  }));

  const filteredVisits = homeVisits.filter(visit => {
    const matchesSearch = 
      visit.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.householdCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.village.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || visit.homeVisitStatus === statusFilter;
    const matchesRegion = regionFilter === "all" || visit.province === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const uniqueRegions = Array.from(new Set(homeVisits.map(v => v.province)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Visit</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = homeVisits.filter(v => v.homeVisitStatus === 'pending').length;
  const completedCount = homeVisits.filter(v => v.homeVisitStatus === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            Home Visits
          </h1>
          <p className="text-muted-foreground mt-2">Manage home visits for intake applications. Complete household details and member registration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Visits</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Visits</CardDescription>
              <CardTitle className="text-3xl text-green-600">{completedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Intakes</CardDescription>
              <CardTitle className="text-3xl">{homeVisits.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search by Application ID, Household Code, or Village..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background w-[180px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Visit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-background w-[180px]" data-testid="select-region">
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

        <Card>
          <CardHeader>
            <CardTitle>Intake Applications</CardTitle>
            <CardDescription>
              Showing {filteredVisits.length} of {homeVisits.length} intakes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No home visits found matching your criteria.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Intake Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id} data-testid={`row-visit-${visit.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{visit.applicationId}</div>
                          <div className="text-xs text-muted-foreground">{visit.householdCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{visit.village}, {visit.district}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{visit.province}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{format(new Date(visit.intakeDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(visit.homeVisitStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/home-visit/${visit.id}`)}
                          data-testid={`button-view-${visit.id}`}
                        >
                          {visit.homeVisitStatus === 'pending' ? 'Start Visit' : 'View Details'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
