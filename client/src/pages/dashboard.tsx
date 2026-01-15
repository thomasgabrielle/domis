import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Wallet, TrendingUp, ArrowUpRight, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function Dashboard() {
  const { data: households = [], isLoading: householdsLoading } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await fetch('/api/households');
      if (!response.ok) throw new Error('Failed to fetch households');
      return response.json();
    },
  });

  const { data: grievances = [] } = useQuery({
    queryKey: ['grievances'],
    queryFn: async () => {
      const response = await fetch('/api/grievances');
      if (!response.ok) throw new Error('Failed to fetch grievances');
      return response.json();
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const totalHouseholds = households.length;
  const enrolledHouseholds = households.filter((h: any) => h.programStatus === 'enrolled').length;
  const pendingAssessments = households.filter((h: any) => h.programStatus === 'pending_assessment').length;
  const openGrievances = grievances.filter((g: any) => g.status === 'open').length;
  
  const totalDisbursements = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const chartData = [
    { name: 'Jan', enrolled: 120, pending: 20 },
    { name: 'Feb', enrolled: 132, pending: 25 },
    { name: 'Mar', enrolled: 145, pending: 15 },
    { name: 'Apr', enrolled: 160, pending: 30 },
    { name: 'May', enrolled: 178, pending: 45 },
    { name: 'Jun', enrolled: enrolledHouseholds, pending: pendingAssessments },
  ];

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Program Overview</h1>
            <p className="text-muted-foreground">Public Assistance Program Monitoring Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Link href="/registration">
              <Button className="gap-2 shadow-md" data-testid="button-register-household">
                <Users className="h-4 w-4" /> New Intake
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="gap-2" data-testid="button-export-report">
                <TrendingUp className="h-4 w-4" /> Export Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Households" 
            value={householdsLoading ? "..." : totalHouseholds.toString()} 
            icon={Users} 
            description="Registered in system"
            trend="+12% this month"
          />
          <StatsCard 
            title="Pending Assessment" 
            value={householdsLoading ? "..." : pendingAssessments.toString()} 
            icon={ClipboardList} 
            description="Awaiting verification"
            trendClassName="text-amber-600"
          />
           <StatsCard 
            title="Disbursements YTD" 
            value={`$${(totalDisbursements / 1000).toFixed(1)}K`} 
            icon={Wallet} 
            description="Total funds distributed"
            trend="+5% vs last year"
          />
          <StatsCard 
            title="Open Grievances" 
            value={openGrievances.toString()} 
            icon={AlertCircle} 
            description="Requires attention"
            trendClassName="text-destructive"
            trend={openGrievances > 0 ? `${openGrievances} high priority` : "All resolved"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
              <CardDescription>New enrollments vs pending applications over last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)' 
                    }}
                  />
                  <Bar dataKey="enrolled" name="Enrolled" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity / Alerts */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Tasks requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {openGrievances > 0 && (
                <div className="flex gap-4 items-start p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Grievances Escalated</h4>
                    <p className="text-sm text-muted-foreground">There are {openGrievances} open grievances that require attention.</p>
                    <Link href="/grievances">
                      <Button variant="link" className="p-0 h-auto text-destructive font-semibold mt-1">View Details</Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {pendingAssessments > 0 && (
                <div className="flex gap-4 items-start p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <ClipboardList className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Assessments Due</h4>
                    <p className="text-sm text-muted-foreground">{pendingAssessments} households are ready for vulnerability assessment.</p>
                    <Link href="/assessments">
                      <Button variant="link" className="p-0 h-auto text-accent font-semibold mt-1">Assign Worker</Button>
                    </Link>
                  </div>
                </div>
              )}
              
              {openGrievances === 0 && pendingAssessments === 0 && (
                <div className="flex gap-4 items-start p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <h4 className="font-medium text-foreground">All Clear</h4>
                    <p className="text-sm text-muted-foreground">No immediate action items at this time.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Households Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>Latest households added to the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">View All <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            {householdsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading households...</div>
            ) : households.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No households registered yet. <Link href="/registration"><span className="text-primary underline">Register your first household</span></Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vuln. Score</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {households.slice(0, 5).map((hh: any) => (
                    <TableRow key={hh.id} data-testid={`row-household-${hh.id}`}>
                      <TableCell className="font-medium" data-testid={`text-code-${hh.id}`}>{hh.householdCode}</TableCell>
                      <TableCell>{hh.district}, {hh.village}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={hh.programStatus === 'enrolled' ? 'default' : 'secondary'}
                          className={hh.programStatus === 'enrolled' ? 'bg-accent text-accent-foreground' : ''}
                          data-testid={`badge-status-${hh.id}`}
                        >
                          {hh.programStatus === 'enrolled' ? 'Enrolled' : hh.programStatus === 'pending_assessment' ? 'Pending Assessment' : hh.programStatus?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold", (hh.vulnerabilityScore || 0) > 80 ? "text-destructive" : "text-muted-foreground")}>
                            {hh.vulnerabilityScore || 0}
                          </span>
                          <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", (hh.vulnerabilityScore || 0) > 80 ? "bg-destructive" : "bg-primary")} 
                              style={{ width: `${hh.vulnerabilityScore || 0}%` }} 
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(hh.registrationDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/cases?household=${hh.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-manage-${hh.id}`}>Manage</Button>
                        </Link>
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

function StatsCard({ title, value, icon: Icon, description, trend, trendClassName }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-heading">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend && <span className={cn("font-medium mr-1", trendClassName)}>{trend}</span>}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
