import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Filter, BarChart3, PieChart, FileDown, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, Cell } from 'recharts';

export function Reports() {
  const enrollmentData = [
    { region: 'Central', enrolled: 450, target: 500 },
    { region: 'Eastern', enrolled: 320, target: 400 },
    { region: 'Western', enrolled: 280, target: 350 },
    { region: 'Northern', enrolled: 190, target: 300 },
  ];

  const disbursementData = [
    { name: 'Mobile Money', value: 65 },
    { name: 'Bank Transfer', value: 25 },
    { name: 'Cash Agent', value: 10 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Monitoring & Evaluation</h1>
            <p className="text-muted-foreground">Program performance reports and data extraction.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> Print Summary
            </Button>
            <Button className="gap-2">
              <FileDown className="h-4 w-4" /> Export All Data (CSV)
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select defaultValue="2025">
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="q1">
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="eastern">Eastern</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" className="gap-2">
                <Filter className="h-4 w-4" /> Update View
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment vs Target */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment vs Target</CardTitle>
              <CardDescription>Regional performance against coverage goals.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="region" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)' 
                    }}
                  />
                  <Legend />
                  <Bar dataKey="enrolled" name="Enrolled" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="target" name="Target" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Disbursement Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Channels</CardTitle>
              <CardDescription>Distribution of funds by provider type.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={disbursementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {disbursementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)' 
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Standard Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileDown className="h-4 w-4 text-primary" /> Beneficiary Master List
              </CardTitle>
              <CardDescription>Full detailed export of all enrolled households.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileDown className="h-4 w-4 text-primary" /> Payment Reconciliation
              </CardTitle>
              <CardDescription>Monthly breakdown of successful transfers.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileDown className="h-4 w-4 text-primary" /> Grievance Summary
              </CardTitle>
              <CardDescription>Resolution times and category analysis.</CardDescription>
            </CardHeader>
          </Card>
        </div>

      </main>
    </div>
  );
}
