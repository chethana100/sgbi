"use client";
import { useLocation } from "@/lib/location-context";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Wrench, Clock, Zap, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface Stats {
  working: number;
  repair: number;
  serviceDue: number;
  updatesAvailable: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ working: 0, repair: 0, serviceDue: 0, updatesAvailable: 0 });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedLocationId, selectedLocationName } = useLocation();

  useEffect(() => {
    fetchData();
  }, [selectedLocationId]);

  const fetchData = async () => {
    try {
      const url = selectedLocationId ? "/api/assets?pageSize=100&locationId=" + selectedLocationId : "/api/assets?pageSize=100";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const all: Asset[] = data.data;
        setStats({
          working: all.filter((a) => a.operational_status === "Working" && !a.service_due).length,
          repair: all.filter((a) => a.operational_status === "Repair").length,
          serviceDue: all.filter((a) => a.service_due).length,
          updatesAvailable: all.filter((a) => a.firmware_update_available).length,
        });
        setRecentAssets(all.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const tiles = [
    { label: "Working", value: stats.working, icon: Package, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", filter: "?status=Working" },
    { label: "In Repair", value: stats.repair, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", filter: "?status=Repair" },
    { label: "Service Due", value: stats.serviceDue, icon: Clock, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", filter: "?serviceDue=true" },
    { label: "Updates Available", value: stats.updatesAvailable, icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", filter: "?fwUpdateAvailable=true" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back — here's what's happening</p>
        </div>
        <Link href="/assets/new">
          <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white">
            <Plus size={16} className="mr-2" />
            Add Asset
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.label} href={`/assets${tile.filter}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">{tile.label}</p>
                    <div className={`p-2 rounded-lg ${tile.bg}`}>
                      <Icon size={16} className={tile.color} />
                    </div>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-3xl font-semibold text-foreground">{tile.value}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Assets</CardTitle>
          <Link href="/assets">
            <Button variant="ghost" size="sm" className="text-[#4169e1]">
              View all <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentAssets.length === 0 ? (
            <div className="text-center py-8">
              <Package size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No assets yet</p>
              <Link href="/assets/new">
                <Button className="mt-3 bg-[#4169e1] hover:bg-[#3358cc] text-white" size="sm">
                  Add your first asset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAssets.map((asset) => (
                <Link key={asset.asset_id} href={`/assets/${asset.asset_id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#4169e1]/10 flex items-center justify-center">
                        <Package size={16} className="text-[#4169e1]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{asset.product_name}</p>
                        <p className="text-xs text-muted-foreground">{asset.serial_number} · {asset.current_location_display || "No location"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.firmware_update_available && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">Update</Badge>
                      )}
                      {asset.service_due && (
                        <Badge variant="outline" className="text-red-600 border-red-200 text-xs">Service</Badge>
                      )}
                      <Badge className={`text-xs ${asset.operational_status === "Working" ? "bg-green-100 text-green-700" :
                          asset.operational_status === "Repair" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                        }`}>
                        {asset.operational_status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}