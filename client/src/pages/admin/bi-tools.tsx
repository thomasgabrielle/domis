import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, LineChart, Plus, LayoutDashboard } from "lucide-react";

export function AdminBITools() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">BI & Reports</h1>
            <p className="text-muted-foreground">Create custom dashboards and analytics reports.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Template 1 */}
          <Card className="group cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
              <CardDescription>High-level program KPIs.</CardDescription>
            </CardHeader>
            <CardContent className="h-40 bg-muted/10 rounded-md m-6 mt-0 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-2 w-full p-4 opacity-50 group-hover:opacity-80 transition-opacity">
                <div className="bg-muted h-12 rounded"></div>
                <div className="bg-muted h-12 rounded"></div>
                <div className="bg-muted h-20 col-span-2 rounded"></div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Template 2 */}
          <Card className="group cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-accent" />
                Demographics
              </CardTitle>
              <CardDescription>Age, gender, and location breakdowns.</CardDescription>
            </CardHeader>
             <CardContent className="h-40 bg-muted/10 rounded-md m-6 mt-0 flex items-center justify-center">
              <div className="rounded-full border-4 border-muted h-24 w-24 opacity-50 group-hover:opacity-80 transition-opacity"></div>
            </CardContent>
          </Card>

           {/* Dashboard Template 3 */}
           <Card className="group cursor-pointer hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-500" />
                Payment Trends
              </CardTitle>
              <CardDescription>Disbursement analysis over time.</CardDescription>
            </CardHeader>
             <CardContent className="h-40 bg-muted/10 rounded-md m-6 mt-0 flex items-center justify-end pb-4 px-4">
              <div className="flex items-end gap-2 w-full h-full justify-around opacity-50 group-hover:opacity-80 transition-opacity pt-8">
                 <div className="bg-muted w-4 h-1/3 rounded-t"></div>
                 <div className="bg-muted w-4 h-1/2 rounded-t"></div>
                 <div className="bg-muted w-4 h-2/3 rounded-t"></div>
                 <div className="bg-muted w-4 h-full rounded-t"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
