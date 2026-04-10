"use client";

import { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  User, 
  Package, 
  Calendar, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  log_id: string;
  action_type: string;
  performed_at: string;
  performed_by: {
    name: string;
    email: string;
  } | null;
  asset_id: string | null;
  old_value: any;
  new_value: any;
  notes: string | null;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/auditlog?page=${page}&pageSize=50`;
      if (actionFilter !== "all") url += `&action_type=${actionFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      ASSET_ENROLLED: "bg-blue-100 text-blue-700",
      ASSET_CHECKED_OUT: "bg-purple-100 text-purple-700",
      ASSET_CHECKIN: "bg-green-100 text-green-700",
      ASSET_STATUS_CHANGED: "bg-amber-100 text-amber-700",
      ASSET_DELETED: "bg-red-100 text-red-700",
      FIRMWARE_MASTER_UPDATED: "bg-indigo-100 text-indigo-700",
    };
    return (
      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight border-none ${colorMap[action] || "bg-gray-100 text-gray-700"}`}>
        {action.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Comprehensive history of all system activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "all")}>
            <SelectTrigger className="w-[200px] h-10">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="ASSET_ENROLLED">Enrollment</SelectItem>
              <SelectItem value="ASSET_CHECKED_OUT">Checkout</SelectItem>
              <SelectItem value="ASSET_CHECKIN">Check-in</SelectItem>
              <SelectItem value="ASSET_STATUS_CHANGED">Status Change</SelectItem>
              <SelectItem value="PRODUCT_ADDED">Product Added</SelectItem>
              <SelectItem value="LOCATION_ADDED">Location Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Action</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <Database size={48} className="mb-4" />
                      <p className="font-semibold text-lg">No log entries found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.log_id} className="text-sm hover:bg-muted/50 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={12} />
                        {new Date(log.performed_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                          {log.performed_by?.name.charAt(0)}
                        </div>
                        {log.performed_by?.name || "System"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.asset_id ? (
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                          <Package size={10} />
                          {log.asset_id.slice(0, 8)}...
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground max-w-xs truncate" title={log.notes || ""}>
                        {log.notes || "Activity recorded"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
