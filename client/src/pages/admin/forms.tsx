import { AdminLayout } from "@/components/layout/admin-layout";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Trash2, Type, List, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminForms() {
  return (
    <div className="min-h-screen bg-background font-sans pb-12">
      <Navbar />
      <AdminLayout>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Form Builder</h1>
            <p className="text-muted-foreground">Manage variables, questions, and data collection forms.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create New Form
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="cursor-pointer border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">Household Registration</h3>
                  <Badge>v2.1</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Primary intake form for PAP.</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Last updated: Today</span>
                </div>
              </CardContent>
            </Card>
             <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">Grievance Log</h3>
                  <Badge variant="outline">v1.0</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Standard complaint filing form.</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Last updated: 2 days ago</span>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-accent/5 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">Site Verification</h3>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Social worker checklist.</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Last updated: 1 week ago</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor Canvas (Mock) */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Household Registration (v2.1)</CardTitle>
                  <CardDescription>Drag and drop fields to reorder.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Preview</Button>
                  <Button size="sm">Save Changes</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-muted/10 min-h-[500px]">
              {/* Form Field Item */}
              <div className="group flex items-start gap-3 p-4 bg-background rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors">
                <div className="mt-2 cursor-move text-muted-foreground"><GripVertical className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Type className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase">Text Input</span>
                  </div>
                  <div className="font-medium">Head of Household Name</div>
                  <div className="text-sm text-muted-foreground">Variable: `hoh_name` • Required</div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>

              <div className="group flex items-start gap-3 p-4 bg-background rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors">
                <div className="mt-2 cursor-move text-muted-foreground"><GripVertical className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <List className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase">Select Dropdown</span>
                  </div>
                  <div className="font-medium">Province</div>
                  <div className="text-sm text-muted-foreground">Variable: `province_id` • Source: `list_provinces`</div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>

               <div className="group flex items-start gap-3 p-4 bg-background rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors">
                <div className="mt-2 cursor-move text-muted-foreground"><GripVertical className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase">Date Picker</span>
                  </div>
                  <div className="font-medium">Date of Birth</div>
                  <div className="text-sm text-muted-foreground">Variable: `dob` • Validation: `age &gt; 18`</div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>

              {/* Add Field Placeholder */}
              <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:bg-accent/5 cursor-pointer transition-all">
                <Plus className="h-4 w-4" /> Add Form Element
              </div>

            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </div>
  );
}
