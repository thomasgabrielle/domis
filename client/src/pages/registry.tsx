import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Search, User, FileText, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";

type ApplicationInfo = {
  householdId: string;
  applicationId: string;
  householdCode: string;
  status: string;
  registrationDate: string;
  province: string;
  district: string;
  village: string;
  relationshipToHead: string;
};

type RegistryPerson = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string | null;
  disabilityStatus: boolean;
  applications: ApplicationInfo[];
};

export function Registry() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<RegistryPerson | null>(null);

  const { data: allMembers = [], isLoading } = useQuery({
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

  // Build registry of unique individuals with their applications
  const registryMap = new Map<string, RegistryPerson>();

  allMembers.forEach((data: any) => {
    if (!data.members || !data.household) return;
    
    data.members.forEach((member: any) => {
      // Create a unique key for each person - use National ID if available, otherwise combine name + DOB
      const uniqueKey = member.nationalId 
        ? `nid:${member.nationalId}` 
        : `name:${member.firstName.toLowerCase()}_${member.lastName.toLowerCase()}_${member.dateOfBirth}`;
      
      const applicationInfo: ApplicationInfo = {
        householdId: data.household.id,
        applicationId: data.household.applicationId || data.household.householdCode,
        householdCode: data.household.householdCode,
        status: data.household.programStatus,
        registrationDate: data.household.registrationDate,
        province: data.household.province,
        district: data.household.district,
        village: data.household.village,
        relationshipToHead: member.relationshipToHead,
      };

      if (registryMap.has(uniqueKey)) {
        // Person already exists, add this application
        const existing = registryMap.get(uniqueKey)!;
        existing.applications.push(applicationInfo);
      } else {
        // New person
        registryMap.set(uniqueKey, {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
          nationalId: member.nationalId,
          disabilityStatus: member.disabilityStatus,
          applications: [applicationInfo],
        });
      }
    });
  });

  const registryPersons = Array.from(registryMap.values());

  // Apply filters
  const filteredPersons = registryPersons.filter((person) => {
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.nationalId && person.nationalId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = genderFilter === "all" || person.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  // Stats
  const totalPersons = registryPersons.length;
  const personsWithMultipleApps = registryPersons.filter(p => p.applications.length > 1).length;
  const maleCount = registryPersons.filter(p => p.gender === 'male').length;
  const femaleCount = registryPersons.filter(p => p.gender === 'female').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrolled</Badge>;
      case 'pending_assessment':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case 'pending_additional_info':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Pending Info</Badge>;
      case 'pending_coordinator':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending Coord.</Badge>;
      case 'pending_director':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Pending Dir.</Badge>;
      case 'pending_ps':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pending PS</Badge>;
      case 'pending_minister':
        return <Badge className="bg-violet-100 text-violet-800 border-violet-200">Pending Min.</Badge>;
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
            <h1 className="text-3xl font-heading font-bold text-foreground">Single Registry</h1>
            <p className="text-muted-foreground">Unified view of all registered individuals and their applications.</p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export-registry">
            <Download className="h-4 w-4" /> Export Registry
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Individuals</p>
                <p className="text-2xl font-bold" data-testid="text-total-persons">{totalPersons}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Multiple Applications</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-multiple-apps">
                {personsWithMultipleApps}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Male</p>
              <p className="text-2xl font-bold" data-testid="text-male-count">
                {maleCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Female</p>
              <p className="text-2xl font-bold" data-testid="text-female-count">
                {femaleCount}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or National ID..." 
                  className="pl-8 bg-background" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-registry"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="bg-background" data-testid="select-gender">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registry Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Individuals</CardTitle>
            <CardDescription>
              Showing {filteredPersons.length} of {totalPersons} individuals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading registry...</div>
            ) : filteredPersons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {totalPersons === 0 
                  ? "No individuals registered yet."
                  : "No individuals match your search criteria."}
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
                      <TableHead>National ID</TableHead>
                      <TableHead>Disability</TableHead>
                      <TableHead className="text-center">Applications</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersons.map((person) => (
                      <TableRow 
                        key={person.id} 
                        data-testid={`row-person-${person.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedPerson(person)}
                      >
                        <TableCell className="font-medium" data-testid={`text-firstname-${person.id}`}>
                          {person.firstName}
                        </TableCell>
                        <TableCell data-testid={`text-lastname-${person.id}`}>
                          {person.lastName}
                        </TableCell>
                        <TableCell data-testid={`text-dob-${person.id}`}>
                          {formatDate(person.dateOfBirth)}
                        </TableCell>
                        <TableCell className="capitalize" data-testid={`text-gender-${person.id}`}>
                          {person.gender}
                        </TableCell>
                        <TableCell className="font-mono text-sm" data-testid={`text-nationalid-${person.id}`}>
                          {person.nationalId || '—'}
                        </TableCell>
                        <TableCell data-testid={`text-disability-${person.id}`}>
                          {person.disabilityStatus ? 
                            <Badge variant="outline" className="text-amber-600 border-amber-300">Yes</Badge> : 
                            <span className="text-muted-foreground">No</span>
                          }
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={person.applications.length > 1 ? "default" : "secondary"}
                            className={person.applications.length > 1 ? "bg-blue-600" : ""}
                            data-testid={`badge-apps-${person.id}`}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {person.applications.length}
                          </Badge>
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

        {/* Applications Dialog */}
        <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Applications for {selectedPerson?.firstName} {selectedPerson?.lastName}
              </DialogTitle>
              <DialogDescription>
                {selectedPerson?.nationalId && (
                  <span>National ID: <span className="font-mono">{selectedPerson.nationalId}</span></span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedPerson?.applications.map((app, index) => (
                <Card 
                  key={app.householdId} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedPerson(null);
                    setLocation(`/application/${app.householdId}`);
                  }}
                  data-testid={`card-application-${index}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{app.applicationId}</span>
                          {getStatusBadge(app.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Household: {app.householdCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Role: {formatRelationship(app.relationshipToHead)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Location: {app.village}, {app.district}, {app.province}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Registered: {formatDate(app.registrationDate)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
