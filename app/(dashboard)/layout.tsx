"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut, 
  Bell, 
  Shield, 
  Menu,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Admin", href: "/admin", icon: Shield, adminOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isPending || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double check session (though middleware handles most of it)
  if (!session) {
    return null; // Let middleware handle redirect
  }

  const userRole = (session.user as any).role || "field_user";
  const userInitials = session.user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "US";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#1a1f36] text-white transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">SGBI <span className="text-primary/80">Tracker</span></span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-white/60 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <Separator className="bg-white/10 mx-6 w-auto mb-6" />

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.adminOnly && userRole !== "admin") return null;
              
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-white/40 group-hover:text-white/80")} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="p-4 mt-auto">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10 border border-white/20">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{session.user.name}</p>
                  <p className="text-xs text-white/40 truncate capitalize">{userRole.replace("_", " ")}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-400/10 h-10 rounded-xl"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/auth/login";
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-xs font-semibold">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden mr-4"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="hidden md:flex items-center text-sm text-muted-foreground font-medium">
              <span>SGBI</span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-foreground capitalize">{pathname.split("/").filter(Boolean).pop() || "Dashboard"}</span>
            </div>
          </div>
          
          <div className="flex items-center space-y-0 space-x-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 p-6">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
