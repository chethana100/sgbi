"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Package, 
  Search, 
  Plus, 
  ExternalLink,
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Asset {
  asset_id: string;
  product_name: string;
  serial_number: string;
  operational_status: string;
  current_location_display: string;
  customer: string;
  firmware_update_available: boolean;
  service_due: boolean;
}

function AssetsContent() {
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  
  useEffect(() => {
    fetchAssets();
  }, [statusFilter, searchQuery]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let url = `/api/assets?pageSize=100`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      Working: "bg-green-100 text-green-700",
      Repair: "bg-amber-100 text-amber-700",
      Scrap: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={`text-xs font-medium border-none ${configs[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage hardware inventory</p>
        </div>
        <Link href="/assets/new">
          <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white">
            <Plus size={16} className="mr-2" />
            Add Asset
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          {["all", "Working", "Repair", "Scrap"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === s 
                ? "bg-white shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by serial or product..." 
            className="pl-9 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Product / Serial</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Security & Service</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={48} className="text-muted-foreground mb-4 opacity-10" />
                        <p className="text-muted-foreground font-medium">No assets matching your criteria</p>
                        <p className="text-sm text-muted-foreground mt-1 text-balance">Try adjusting your filters or search keywords</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow 
                      key={asset.asset_id} 
                      className="group cursor-pointer hover:bg-muted/30"
                      onClick={() => window.location.href = `/assets/${asset.asset_id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#4169e1]/5 flex items-center justify-center shrink-0 border border-[#4169e1]/10">
                            <Package size={16} className="text-[#4169e1]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-none">{asset.product_name}</p>
                            <p className="text-[11px] font-mono text-muted-foreground mt-1.5 tracking-tight uppercase">{asset.serial_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground">
                          {asset.current_location_display || "Warehouse"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground">
                          {asset.customer || "SGBI Internal"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(asset.operational_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {asset.firmware_update_available && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 text-[10px] px-1.5 py-0 h-5 font-semibold">FW UPDATE</Badge>
                          )}
                          {asset.service_due && (
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50/50 text-[10px] px-1.5 py-0 h-5 font-semibold">SERVICE DUE</Badge>
                          )}
                          {!asset.firmware_update_available && !asset.service_due && (
                            <span className="text-[11px] text-muted-foreground/60 font-medium">Up to date</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/assets/${asset.asset_id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:shadow-sm transition-all">
                            <ExternalLink size={14} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div>Loading Assets...</div>}>
      <AssetsContent />
    </Suspense>
  );
}
