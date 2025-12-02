import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";

export function AdminPrograms() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Programs & Activities</h1>
            <p className="text-muted-foreground">Define intervention programs and their associated activities.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Program
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Program 1 */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    Public Assistance Program (PAP)
                    <Badge>Active</Badge>
                  </CardTitle>
                  <CardDescription>Core unconditional cash transfer program for vulnerable households.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4 mr-2" /> Edit</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Linked Activities
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Monthly Cash Transfer</div>
                    <div className="text-xs text-muted-foreground">Recurring • $50.00 / month</div>
                  </div>
                  <Badge variant="outline">Payment</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Annual Vulnerability Re-assessment</div>
                    <div className="text-xs text-muted-foreground">Compliance • Yearly</div>
                  </div>
                  <Badge variant="outline">Survey</Badge>
                </div>
              </div>
              <Button variant="link" className="px-0 mt-2 text-primary">+ Add Activity</Button>
            </CardContent>
          </Card>

          {/* Program 2 */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    Emergency Food Support
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">Seasonal</Badge>
                  </CardTitle>
                  <CardDescription>Temporary in-kind support during lean season.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4 mr-2" /> Edit</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Linked Activities
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Grain Distribution</div>
                    <div className="text-xs text-muted-foreground">In-Kind • One-off</div>
                  </div>
                  <Badge variant="outline">Distribution</Badge>
                </div>
              </div>
              <Button variant="link" className="px-0 mt-2 text-primary">+ Add Activity</Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
