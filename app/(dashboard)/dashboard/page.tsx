"use client";
import { useLocation } from "@/lib/location-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Wrench, Clock, Zap, Plus, ArrowRight, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Asset {
  asset_id: string;
  product_name: string;
  serial_number: string;
  operational_status: string;
  current_location_display: string;
  firmware_update_available: boolean;
  service_due: boolean;
  last_modified_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ working: 0, repair: 0, serviceDue: 0, updatesAvailable: 0, total: 0 });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedLocationId, selectedLocationName } = useLocation();

  useEffect(() => { fetchData(); }, [selectedLocationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = selectedLocationId ? `/api/assets?pageSize=500&locationId=${selectedLocationId}` : `/api/assets?pageSize=500`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const all: Asset[] = data.data;
        setStats({
          total: all.length,
          working: all.filter(a => a.operational_status === "Working" && !a.service_due).length,
          repair: all.filter(a => a.operational_status === "Repair").length,
          serviceDue: all.filter(a => a.service_due).length,
          updatesAvailable: all.filter(a => a.firmware_update_available).length,
        });
        setRecentAssets([...all].sort((a, b) => new Date(b.last_modified_at).getTime() - new Date(a.last_modified_at).getTime()).slice(0, 8));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const healthScore = stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLocationId ? selectedLocationName : "All Locations"}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{loading ? "Loading..." : `${stats.total} assets tracked`}</p>
        </div>
        <Link href="/assets/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#29ABE2] text-white text-sm font-semibold rounded-xl hover:bg-[#1a96cc] transition-colors shadow-sm shadow-[#29ABE2]/30">
            <Plus size={15} />Add Asset
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Working", value: stats.working, icon: Package, color: "text-green-600", bg: "bg-green-50", badge: "Active", badgeColor: "text-green-600 bg-green-50", href: "/assets?status=Working" },
          { label: "In Repair", value: stats.repair, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", badge: "Repair", badgeColor: "text-amber-600 bg-amber-50", href: "/assets?status=Repair" },
          { label: "Service Due", value: stats.serviceDue, icon: Clock, color: "text-red-500", bg: "bg-red-50", badge: stats.serviceDue > 0 ? "Alert" : null, badgeColor: "text-red-600 bg-red-50", href: "/alerts" },
          { label: "Updates Available", value: stats.updatesAvailable, icon: Zap, color: "text-[#29ABE2]", bg: "bg-sky-50", badge: stats.updatesAvailable > 0 ? "New" : null, badgeColor: "text-[#29ABE2] bg-sky-50", href: "/alerts" },
        ].map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${tile.bg} flex items-center justify-center`}>
                  <tile.icon size={16} className={tile.color} />
                </div>
                {tile.badge && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tile.badgeColor}`}>{tile.badge}</span>}
              </div>
              {loading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-0.5">{tile.value}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{tile.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-[#29ABE2]" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Fleet Health</p>
          </div>
          {loading ? <Skeleton className="h-12 w-20 mb-3" /> : (
            <p className="text-5xl font-black text-gray-900 dark:text-white mb-3">{healthScore}<span className="text-2xl text-gray-300">%</span></p>
          )}
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-3">
            <div className="h-2 rounded-full bg-gradient-to-r from-[#29ABE2] to-green-400 transition-all duration-700" style={{ width: `${healthScore}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{stats.working} healthy</span>
            <span>{stats.repair + stats.serviceDue} need attention</span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[#29ABE2]" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recently Updated</p>
            </div>
            <Link href="/assets" className="text-xs font-semibold text-[#29ABE2] hover:text-[#1a96cc] flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : recentAssets.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Package size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No assets yet</p>
              </div>
            ) : recentAssets.map((asset) => (
              <Link key={asset.asset_id} href={`/assets/${asset.asset_id}`}>
                <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-[#29ABE2]/10 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-[#29ABE2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{asset.product_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{asset.serial_number} · {asset.current_location_display || "No location"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {asset.firmware_update_available && <span className="text-[10px] font-semibold text-[#29ABE2] bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md">FW</span>}
                    {asset.service_due && <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">SVC</span>}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${asset.operational_status === "Working" ? "bg-green-50 text-green-600 border border-green-100" : asset.operational_status === "Repair" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                      {asset.operational_status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
