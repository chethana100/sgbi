"use client";
import { useEffect, useState } from "react";
import { Package, Cpu, Wrench, MapPin, Plus, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface ActivityLog {
  log_id: string;
  action_type: string;
  performed_at: string;
  notes: string | null;
  asset_id: string | null;
  performed_by: { name: string; email: string } | null;
  asset: { product_name: string; serial_number: string } | null;
}

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  ASSET_FIRMWARE_UPDATED: { label: "Firmware Updated", color: "bg-blue-100 text-blue-700", icon: Cpu },
  ASSET_SERVICE_RESET: { label: "Service Done", color: "bg-green-100 text-green-700", icon: Wrench },
  ASSET_STATUS_CHANGED: { label: "Status Changed", color: "bg-amber-100 text-amber-700", icon: Package },
  ASSET_LOCATION_CHANGED: { label: "Location Changed", color: "bg-purple-100 text-purple-700", icon: MapPin },
  ASSET_ENROLLED: { label: "Asset Enrolled", color: "bg-teal-100 text-teal-700", icon: Plus },
  ASSET_REMARKS_UPDATED: { label: "Remarks Updated", color: "bg-gray-100 text-gray-700", icon: Package },
  FIRMWARE_MASTER_UPDATED: { label: "Firmware Released", color: "bg-blue-100 text-blue-700", icon: Cpu },
};

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [locations, setLocations] = useState<any[]>([]);

  const flattenLocs = (locs: any[], depth = 0): any[] =>
    locs.flatMap((loc: any) => [{ ...loc, depth }, ...flattenLocs(loc.children || [], depth + 1)]);

  useEffect(() => {
    fetchActivity();
  }, [locationFilter]);

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(d => { if (d.success) setLocations(flattenLocs(d.data)); });
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      let url = "/api/audit-log?pageSize=50";
      if (locationFilter !== "all") url += "&location=" + encodeURIComponent(locationFilter);
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredLogs = logs.filter(l => {
    if (filter !== "all" && l.action_type !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recent Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all changes across your asset inventory</p>
        </div>
        <button onClick={fetchActivity} className="text-xs text-[#29ABE2] hover:underline">Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { value: "all", label: "All" },
          { value: "ASSET_FIRMWARE_UPDATED", label: "Firmware" },
          { value: "ASSET_SERVICE_RESET", label: "Service" },
          { value: "ASSET_STATUS_CHANGED", label: "Status" },
          { value: "ASSET_ENROLLED", label: "Enrolled" },
          { value: "FIRMWARE_MASTER_UPDATED", label: "Firmware" },
          { value: "ASSET_LOCATION_CHANGED", label: "Location" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? "bg-[#29ABE2] text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {f.label}
          </button>
        ))}
        <select className="h-8 text-xs border rounded-lg px-2 bg-background dark:bg-gray-900 dark:text-white"
          value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="all">All Locations</option>
          {locations.map((l: any) => <option key={l.location_id} value={l.full_path || l.name}>{l.depth > 0 ? "↳ " : ""}{l.name}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock size={40} className="mb-3 opacity-20" />
              <p className="font-medium">No activity found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const config = actionConfig[log.action_type] || { label: log.action_type, color: "bg-gray-100 text-gray-700", icon: Package };
                const Icon = config.icon;
                return (
                  <div key={log.log_id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] font-semibold border-none ${config.color}`}>
                          {config.label}
                        </Badge>
                        {log.asset && (
                          <Link href={`/assets/${log.asset_id}`} className="text-sm font-semibold text-foreground hover:text-[#29ABE2] transition-colors">
                            {log.asset.product_name} · {log.asset.serial_number}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User size={11} />
                          {log.performed_by?.name || "System"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={11} />
                          {timeAgo(log.performed_at)}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">"{log.notes}"</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                      {new Date(log.performed_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
