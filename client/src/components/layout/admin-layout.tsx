import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  LayoutTemplate, 
  Settings, 
  FileText, 
  BarChart, 
  Network, 
  Shield
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const sidebarItems = [
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/programs", label: "Programs & Activities", icon: LayoutTemplate },
    { href: "/admin/settings", label: "System Settings", icon: Settings },
    { href: "/admin/forms", label: "Form Builder", icon: FileText },
    { href: "/admin/bi-tools", label: "BI & Reports", icon: BarChart },
    { href: "/admin/interop", label: "Data Exchange", icon: Network },
  ];

  return (
    <div className="flex min-h-screen bg-muted/10">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Shield className="h-5 w-5" />
            <span>System Admin</span>
          </div>
        </div>
        <div className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Placeholder - In a real app would toggle sidebar */}
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
