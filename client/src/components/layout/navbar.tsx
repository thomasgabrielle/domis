import { Link, useLocation } from "wouter";
import { Building2, ClipboardCheck, AlertCircle, Briefcase, CreditCard, BarChart3, Menu, Shield, FileSpreadsheet, BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Building2 },
    { href: "/worksheet", label: "Applications", icon: FileSpreadsheet },
    { href: "/assessments", label: "Assessments", icon: ClipboardCheck },
    { href: "/registry", label: "Clients", icon: BookUser },
    { href: "/cases", label: "Case Mgmt", icon: Briefcase },
    { href: "/payments", label: "Payments", icon: CreditCard },
    { href: "/grievances", label: "Grievances", icon: AlertCircle },
    { href: "/reports", label: "M&E", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground leading-none">
            PAP-MIS
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                )}>
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="hidden lg:flex gap-1.5 text-muted-foreground hover:text-primary">
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          </Link>
          <div className="hidden lg:flex items-center gap-2.5 border-l pl-3 ml-1">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">Admin User</span>
              <span className="text-[11px] text-muted-foreground leading-tight">Min. of Social Affairs</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              AU
            </div>
          </div>
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col gap-6 mt-6">
                 {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
