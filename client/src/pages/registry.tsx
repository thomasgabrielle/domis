import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, User, Users, ChevronRight, FileText, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";

type HouseholdMember = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string | null;
  relationshipToHead: string;
  disabilityStatus: boolean;
  isHead: boolean;
};

type RegistryEntry = {
  householdId: string;
  applicationId: string;
  householdCode: string;
  status: string;
  registrationDate: string;
  province: string;
  district: string;
  village: string;
  applicant: HouseholdMember;
  members: HouseholdMember[];
};

export function Registry() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<"household" | "member">("household");
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<RegistryEntry | null>(null);

  const { data: allHouseholds = [], isLoading } = useQuery({
    queryKey: ['registry'],
    queryFn: async () => {
      const householdsData = await fetch('/api/households').then(r => r.json());
      const results = await Promise.all(
        householdsData.map(async (h: any) => {
          const response = await fetch(`/api/households/${h.id}`);
          if (!response.ok) return null;
          return response.json();
        })
      );
      return results.filter(Boolean);
    },
  });

  // Helper: unique key for a person (national ID preferred, else name+DOB)
  const personKey = (m: { firstName: string; lastName: string; dateOfBirth: string; nationalId: string | null }) =>
    m.nationalId
      ? `nid:${m.nationalId}`
      : `name:${m.firstName.toLowerCase()}_${m.lastName.toLowerCase()}_${m.dateOfBirth}`;

  // Build index of ALL applications per person (across all statuses)
  type AppSummary = { applicationId: string; householdId: string; status: string; registrationDate: string };
  const allAppsByPerson = new Map<string, AppSummary[]>();
  allHouseholds.forEach((data: any) => {
    if (!data.household || !data.members) return;
    const head = data.members.find((m: any) => m.isHead) || data.members[0];
    if (!head) return;
    const key = personKey(head);
    const entry: AppSummary = {
      applicationId: data.household.applicationId || data.household.householdCode,
      householdId: data.household.id,
      status: data.household.programStatus,
      registrationDate: data.household.registrationDate,
    };
    const existing = allAppsByPerson.get(key) || [];
    existing.push(entry);
    allAppsByPerson.set(key, existing);
  });

  // Build registry: only enrolled households (clients approved by Minister)
  const registryEntries: RegistryEntry[] = allHouseholds
    .filter((data: any) => data.household?.programStatus === 'enrolled')
    .map((data: any) => {
      const head = data.members?.find((m: any) => m.isHead) || data.members?.[0];
      return {
        householdId: data.household.id,
        applicationId: data.household.applicationId || data.household.householdCode,
        householdCode: data.household.householdCode,
        status: data.household.programStatus,
        registrationDate: data.household.registrationDate,
        province: data.household.province,
        district: data.household.district,
        village: data.household.village,
        applicant: head,
        members: (data.members || []).filter((m: any) => !m.isHead),
      };
    }).filter((e: RegistryEntry) => e.applicant);

  // Unique provinces for filter
  const provinces = Array.from(new Set(registryEntries.map(e => e.province))).sort();

  // Helper: get all applications for a given entry's applicant
  const getOtherApps = (entry: RegistryEntry) => {
    const key = personKey(entry.applicant);
    return (allAppsByPerson.get(key) || []).filter(a => a.householdId !== entry.householdId);
  };

  // Build flat member list for member view (all members including heads)
  type MemberRow = HouseholdMember & {
    householdId: string;
    applicationId: string;
    householdCode: string;
    status: string;
    province: string;
    district: string;
    village: string;
  };
  const allMemberRows: MemberRow[] = registryEntries.flatMap((entry) =>
    [entry.applicant, ...entry.members].map((m) => ({
      ...m,
      householdId: entry.householdId,
      applicationId: entry.applicationId,
      householdCode: entry.householdCode,
      status: entry.status,
      province: entry.province,
      district: entry.district,
      village: entry.village,
    }))
  );

  // Apply filters — household view
  const filteredEntries = registryEntries.filter((entry) => {
    const a = entry.applicant;
    const matchesSearch =
      a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nationalId && a.nationalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.applicationId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = provinceFilter === "all" || entry.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  // Apply filters — member view
  const filteredMembers = allMemberRows.filter((m) => {
    const matchesSearch =
      m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.nationalId && m.nationalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.applicationId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = provinceFilter === "all" || m.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  // Stats
  const totalClients = registryEntries.length;
  const totalMembers = allMemberRows.length;
  const multiAppClients = registryEntries.filter(e => getOtherApps(e).length > 0).length;
  const maleHeads = registryEntries.filter(e => e.applicant.gender === 'male').length;

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
            <h1 className="text-3xl font-heading font-bold text-foreground">Client Registry</h1>
            <p className="text-muted-foreground">Enrolled households approved through the assessment workflow.</p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-export-registry">
            <Download className="h-4 w-4" /> Export Registry
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Households</p>
                <p className="text-2xl font-bold text-emerald-600" data-testid="text-total-clients">{totalClients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Individuals</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-total-members">{totalMembers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Male Heads</p>
              <p className="text-2xl font-bold" data-testid="text-male-heads">{maleHeads}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Multiple Apps</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-multi-apps">{multiAppClients}</p>
              </div>
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
                  placeholder="Search by client name, National ID, or Application ID..."
                  className="pl-8 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-registry"
                />
              </div>
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="bg-background" data-testid="select-province">
                  <SelectValue placeholder="Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || provinceFilter !== "all") && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setSearchTerm("");
                    setProvinceFilter("all");
                  }}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                  Clear Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registry Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>
                  {view === "household" ? "Client Households" : "All Individuals"}
                </CardTitle>
                <CardDescription>
                  {view === "household"
                    ? `Showing ${filteredEntries.length} of ${totalClients} clients`
                    : `Showing ${filteredMembers.length} of ${totalMembers} individuals`}
                </CardDescription>
              </div>
              <Tabs value={view} onValueChange={(v) => setView(v as "household" | "member")}>
                <TabsList>
                  <TabsTrigger value="household" className="gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    By Household
                  </TabsTrigger>
                  <TabsTrigger value="member" className="gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    By Member
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading registry...</div>
            ) : view === "household" ? (
              /* Household View */
              filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {totalClients === 0
                    ? "No enrolled clients yet."
                    : "No clients match your search criteria."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Members</TableHead>
                        <TableHead className="text-center">Apps</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow
                          key={entry.householdId}
                          data-testid={`row-applicant-${entry.householdId}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <TableCell>
                            <div>
                              <span className="font-medium">{entry.applicant.firstName} {entry.applicant.lastName}</span>
                              {entry.applicant.nationalId && (
                                <p className="text-xs text-muted-foreground font-mono">{entry.applicant.nationalId}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.applicationId}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{entry.village}, {entry.district}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {entry.members.length + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const others = getOtherApps(entry);
                              const total = others.length + 1;
                              return total > 1 ? (
                                <Badge className="bg-blue-600">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {total}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">1</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(entry.registrationDate)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              /* Member View */
              filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {totalMembers === 0
                    ? "No individuals registered yet."
                    : "No individuals match your search criteria."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>National ID</TableHead>
                        <TableHead>Application ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((m) => (
                        <TableRow
                          key={`${m.householdId}-${m.id}`}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const entry = registryEntries.find(e => e.householdId === m.householdId);
                            if (entry) setSelectedEntry(entry);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{m.firstName} {m.lastName}</span>
                              {m.disabilityStatus && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Disability</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {m.isHead ? (
                              <Badge variant="outline" className="text-primary border-primary/30">Head</Badge>
                            ) : (
                              <span className="text-muted-foreground">{formatRelationship(m.relationshipToHead)}</span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize text-sm">{m.gender}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(m.dateOfBirth)}</TableCell>
                          <TableCell className="font-mono text-sm">{m.nationalId || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{m.applicationId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Applicant Detail Dialog */}
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedEntry?.applicant.firstName} {selectedEntry?.applicant.lastName}
              </DialogTitle>
              <DialogDescription>
                <span className="font-mono">{selectedEntry?.applicationId}</span>
                {selectedEntry?.applicant.nationalId && (
                  <span> &middot; National ID: <span className="font-mono">{selectedEntry.applicant.nationalId}</span></span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Applicant info */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedEntry?.village}, {selectedEntry?.district}, {selectedEntry?.province}
                </div>
                {selectedEntry && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Enrolled</Badge>}
              </div>

              {/* Other Applications */}
              {selectedEntry && (() => {
                const others = getOtherApps(selectedEntry);
                if (others.length === 0) return null;
                const getStatusLabel = (s: string) => {
                  const labels: Record<string, string> = {
                    enrolled: 'Enrolled', rejected: 'Rejected', pending_assessment: 'Pending',
                    pending_coordinator: 'Pending Coord.', pending_director: 'Pending Dir.',
                    pending_ps: 'Pending PS', pending_minister: 'Pending Min.', ineligible: 'Ineligible',
                  };
                  return labels[s] || s.replace(/_/g, ' ');
                };
                return (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Other Applications ({others.length})</h4>
                    <div className="space-y-2">
                      {others.map((app) => (
                        <Card
                          key={app.householdId}
                          className="bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            setSelectedEntry(null);
                            setLocation(`/application/${app.householdId}`);
                          }}
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-medium">{app.applicationId}</span>
                                <Badge variant={app.status === 'enrolled' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                                  {getStatusLabel(app.status)}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDate(app.registrationDate)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Household Members */}
              {selectedEntry && selectedEntry.members.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Household Members ({selectedEntry.members.length})</h4>
                  <div className="space-y-2">
                    {selectedEntry.members.map((member) => (
                      <Card key={member.id} className="bg-muted/30">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">{member.firstName} {member.lastName}</span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{formatRelationship(member.relationshipToHead)}</span>
                                <span className="capitalize">{member.gender}</span>
                                <span>DOB: {formatDate(member.dateOfBirth)}</span>
                              </div>
                            </div>
                            {member.disabilityStatus && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Disability</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* View Application Button */}
              <Button
                className="w-full gap-2"
                onClick={() => {
                  setSelectedEntry(null);
                  setLocation(`/application/${selectedEntry?.householdId}`);
                }}
              >
                View Full Application <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
