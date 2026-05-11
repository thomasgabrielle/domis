import { Link, useLocation } from "wouter";
import { Building2, ClipboardCheck, AlertCircle, Briefcase, CreditCard, BarChart3, Menu, Shield, FileSpreadsheet, BookUser, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, hasAnyPermission } = useAuth();

  // All nav items with required permissions (OR logic — user needs any one)
  const allNavItems = [
    { href: "/", label: "Dashboard", icon: Building2, permissions: ["dashboard.view"] },
    { href: "/worksheet", label: "Applications", icon: FileSpreadsheet, permissions: ["intake.view", "application.view"] },
    { href: "/home-visits", label: "Home Visits", icon: Home, permissions: ["home_visit.view"] },
    { href: "/assessments", label: "Assessments", icon: ClipboardCheck, permissions: ["assessment.view", "recommendation.view", "recommendation.create"] },
    { href: "/registry", label: "Clients", icon: BookUser, permissions: ["client.view", "client.view_partial"] },
    { href: "/cases", label: "Case Mgmt", icon: Briefcase, permissions: ["application.view"] },
    { href: "/payments", label: "Payments", icon: CreditCard, permissions: ["payment.view"] },
    { href: "/grievances", label: "Grievances", icon: AlertCircle, permissions: ["application.view"] },
    { href: "/reports", label: "M&E", icon: BarChart3, permissions: ["dashboard.view"] },
  ];

  // Filter nav items by user permissions
  const navItems = allNavItems.filter((item) =>
    hasAnyPermission(...item.permissions)
  );

  const canAccessAdmin = hasAnyPermission("admin.view", "admin.create", "admin.edit", "admin.delete");

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "??";

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
          {canAccessAdmin && (
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="hidden lg:flex gap-1.5 text-muted-foreground hover:text-primary">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          <div className="hidden lg:flex items-center gap-2.5 border-l pl-3 ml-1">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">
                {user?.fullName || user?.username || "User"}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {user?.role?.displayName || "No role"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {initials}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
                {/* User info in mobile */}
                <div className="flex items-center gap-3 px-3 pb-3 border-b">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user?.fullName || user?.username}</div>
                    <div className="text-xs text-muted-foreground">{user?.role?.displayName}</div>
                  </div>
                </div>

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

                {canAccessAdmin && (
                  <Link
                    href="/admin/users"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Shield className="h-5 w-5" />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-destructive/10 mt-auto"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
