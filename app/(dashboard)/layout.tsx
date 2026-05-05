"use client";
import { LocationProvider } from "@/lib/location-context";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, LogOut, Bell, Clock, Cpu,
  Shield, Menu, X, Loader2, ChevronRight,
  MapPin, ChevronDown, Settings, Moon, Sun
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "@/lib/location-context";
import { useTheme } from "next-themes";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Activity", href: "/activity", icon: Clock },
  { name: "Admin", href: "/admin", icon: Shield, adminOnly: true },
  { name: "Products", href: "/admin/products", icon: Package, adminOnly: true },
  { name: "Firmware", href: "/admin/firmware", icon: Cpu, adminOnly: true },
  { name: "Locations", href: "/admin/locations", icon: MapPin, adminOnly: true },
];

function LocationPicker() {
  const { selectedLocationId, selectedLocationName, setLocation } = useLocation();
  const [locations, setLocations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(d => { if (d.success) setLocations(d.data); });
  }, []);
  const flattenLocations = (locs: any[], depth = 0): any[] =>
    locs.flatMap(loc => [{ ...loc, depth }, ...flattenLocations(loc.children || [], depth + 1)]);
  const flat = flattenLocations(locations);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.loc-picker')) setOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return (
    <div className="relative loc-picker">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-[#29ABE2]/50 hover:bg-sky-50 transition-all shadow-sm"
      >
        <MapPin size={13} className="text-[#29ABE2]" />
        <span className="max-w-[110px] truncate font-medium text-gray-700">{selectedLocationName}</span>
        <ChevronDown size={13} className={cn("text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] py-1.5 max-h-64 overflow-y-auto">
          <button
            onClick={() => { setLocation(null, "Global"); setOpen(false); }}
            className={cn("w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-gray-50",
              !selectedLocationId ? "text-[#29ABE2] font-semibold bg-sky-50" : "text-gray-700")}
          >
            🌍 Global (All locations)
          </button>
          <div className="h-px bg-gray-100 my-1" />
          {flat.map(loc => (
            <button
              key={loc.location_id}
              onClick={() => { setLocation(loc.location_id, loc.name); setOpen(false); }}
              className={cn("w-full text-left py-2 text-sm transition-colors hover:bg-gray-50",
                selectedLocationId === loc.location_id ? "text-[#29ABE2] font-semibold bg-sky-50" : "text-gray-700")}
              style={{ paddingLeft: (loc.depth * 12 + 12) + "px" }}
            >
              {loc.depth > 0 ? "↳ " : ""}{loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#29ABE2]" />
        </div>
      </div>
    );
  }
  if (!session) return null;
  const userRole = (session.user as any).role || "field_user";
  const userName = session.user.name || "User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = pathname.split("/").filter(Boolean).pop() || "dashboard";
  return (
    <LocationProvider>
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-gray-950 flex">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm transition-transform duration-300",
          "lg:static lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
              <img src="/sgbi-logo.png" alt="SGBI" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">SGBI</p>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">Asset Tracker</p>
            </div>
            <button className="ml-auto lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setIsSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">Menu</p>
            {navItems.map((item) => {
              if (item.adminOnly && userRole !== "admin") return null;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive ? "bg-[#29ABE2]/10 text-[#29ABE2]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  )}>
                  <item.icon size={17} className={isActive ? "text-[#29ABE2]" : "text-gray-400"} />
                  {item.name}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#29ABE2]" />}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#29ABE2]/15 border border-[#29ABE2]/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#29ABE2]">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{userName}</p>
                <p className="text-[10px] text-gray-400 capitalize">{userRole.replace("_", " ")}</p>
              </div>
              <button onClick={async () => { await signOut(); window.location.href = "/auth/login"; }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 hidden sm:block text-xs">SGBI</span>
                <ChevronRight size={12} className="text-gray-300 hidden sm:block" />
                <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize text-sm">{currentPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LocationPicker />
              <button onClick={() => router.push("/alerts")} className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={() => router.push("/profile")} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                <Settings size={17} />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>
    </LocationProvider>
  );
}
