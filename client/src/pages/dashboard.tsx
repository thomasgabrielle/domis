import { Navbar } from "@/components/layout/navbar";
import { BeneficiaryCard } from "@/components/beneficiary-card";
import { AllocationChart } from "@/components/allocation-chart";
import { mockBeneficiaries, assetTotal } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import heroImage from "@assets/generated_images/abstract_3d_illustration_of_a_shield_and_document_representing_security_and_trust..png";

export function Dashboard() {
  const totalAllocation = mockBeneficiaries.reduce((acc, curr) => acc + curr.allocation, 0);
  const remainingAllocation = 100 - totalAllocation;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Hero / Status Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">Estate Overview</h1>
                <p className="text-muted-foreground mt-1">Manage your assets and beneficiary designations.</p>
              </div>
              <Link href="/add">
                <Button size="lg" className="shadow-lg shadow-primary/20 gap-2">
                  <Plus className="h-5 w-5" /> Add Beneficiary
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 opacity-10 pointer-events-none">
                   {/* Abstract decoration */}
                   <svg viewBox="0 0 100 100" fill="currentColor">
                     <circle cx="100" cy="0" r="100" />
                   </svg>
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-primary-foreground/70">Total Asset Value</CardDescription>
                  <CardTitle className="text-4xl font-heading font-bold">
                    ${assetTotal.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                     <ShieldCheckIcon className="h-4 w-4" />
                     <span>Secured & Insured</span>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium text-muted-foreground">Allocation Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-foreground">{totalAllocation}%</span>
                    <span className="text-sm text-muted-foreground mb-1">of 100% assigned</span>
                  </div>
                  <Progress value={totalAllocation} className="h-2" />
                  {remainingAllocation > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
                      <AlertCircle className="h-4 w-4" />
                      <span>{remainingAllocation}% unallocated funds remaining</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full border-border/60 shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle>Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center min-h-[250px]">
                <AllocationChart data={mockBeneficiaries} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Beneficiaries List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-semibold">Beneficiaries</h2>
            <span className="text-sm text-muted-foreground">{mockBeneficiaries.length} Active</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockBeneficiaries.map((beneficiary) => (
              <BeneficiaryCard 
                key={beneficiary.id} 
                beneficiary={beneficiary} 
                onEdit={(id) => console.log('Edit', id)}
                onDelete={(id) => console.log('Delete', id)}
              />
            ))}
            
            <Link href="/add">
              <div className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/5 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="font-medium text-muted-foreground group-hover:text-primary">Add New Beneficiary</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
