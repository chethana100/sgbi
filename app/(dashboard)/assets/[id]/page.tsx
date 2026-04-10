"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  Clock, 
  History, 
  Info, 
  MapPin, 
  Package, 
  ShieldCheck, 
  User, 
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  LogOut,
  LogIn,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Asset {
  asset_id: string;
  product_name: string;
  serial_number: string;
  erp_part_number: string;
  operational_status: string;
  current_location_display: string;
  customer: string;
  current_firmware: string;
  last_firmware_update_date: string;
  last_firmware_updated_by: string;
  last_service_date: string;
  service_reminder_interval_days: number;
  checked_out_to_user_id: string;
  checked_out_at: string;
  checked_out_purpose: string;
  warranty_expiry_date: string;
  warranty_notes: string;
  remarks: string;
  firmware_update_available: boolean;
  service_due: boolean;
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [editModal, setEditModal] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [warrantyModal, setWarrantyModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({ status: "", customer: "", remarks: "" });
  const [checkoutPurpose, setCheckoutPurpose] = useState("");
  const [warrantyForm, setWarrantyForm] = useState({ expiry: "", notes: "" });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchAsset();
  }, [id, refreshKey]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${id}`);
      const data = await res.json();
      if (data.success) {
        setAsset(data.data);
        setEditForm({
          status: data.data.operational_status,
          customer: data.data.customer || "",
          remarks: data.data.remarks || "",
        });
        setWarrantyForm({
          expiry: data.data.warranty_expiry_date ? data.data.warranty_expiry_date.split('T')[0] : "",
          notes: data.data.warranty_notes || "",
        });
      }
    } catch (err) {
      console.error("Error fetching asset:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (endpoint: string, method: string = "POST", body?: any) => {
    try {
      const res = await fetch(`/api/assets/${id}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setRefreshKey(prev => prev + 1);
        setEditModal(false);
        setCheckoutModal(false);
        setWarrantyModal(false);
      }
    } catch (err) {
      console.error(`Action failed: ${endpoint}`, err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/assets/${id}/history`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
        setHistoryModal(true);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  if (loading && !asset) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!asset) return <div className="p-8 text-center mt-20">Asset not found</div>;

  const isCheckedOut = !!asset.checked_out_to_user_id;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{asset.product_name}</h1>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">{asset.erp_part_number}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-mono">Serial: {asset.serial_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <History size={14} className="mr-2" />
            History
          </Button>
          <Button size="sm" className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => setEditModal(true)}>
            <Edit2 size={14} className="mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-none shadow-sm ring-1 ring-gray-100">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    asset.operational_status === "Working" ? "bg-green-50" : asset.operational_status === "Repair" ? "bg-amber-50" : "bg-red-50"
                  }`}>
                    <Package size={20} className={
                      asset.operational_status === "Working" ? "text-green-600" : asset.operational_status === "Repair" ? "text-amber-600" : "text-red-600"
                    } />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <p className="text-lg font-semibold">{asset.operational_status}</p>
                  </div>
                </div>
                <Badge className={
                  asset.operational_status === "Working" ? "bg-green-100 text-green-700 hover:bg-green-100" : 
                  asset.operational_status === "Repair" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : 
                  "bg-red-100 text-red-700 hover:bg-red-100"
                }>
                  Active
                </Badge>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {asset.service_due && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-700 items-start">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Service Overdue</p>
                    <p className="text-xs opacity-80 leading-relaxed">This device has exceeded its service interval. Please schedule maintenance.</p>
                  </div>
                </div>
              )}
              {asset.firmware_update_available && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-700 items-start">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Update Available</p>
                    <p className="text-xs opacity-80 leading-relaxed">A new firmware version is available for this product.</p>
                  </div>
                </div>
              )}
              {!asset.service_due && !asset.firmware_update_available && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex gap-3 text-green-700 items-start h-full items-center">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="font-semibold text-sm">System Healthy</p>
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} className="text-[#4169e1]" />
                Location & Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Current Location</p>
                  <p className="font-medium">{asset.current_location_display || "Warehouse / Central Store"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Assigned Customer</p>
                  <p className="font-medium">{asset.customer || "SGBI Internal Logistics"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-gray-50">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu size={16} className="text-[#4169e1]" />
                Firmware & Service
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Firmware Version</p>
                  <p className="font-medium font-mono">{asset.current_firmware || "v0.0.0"}</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Last Update</p>
                  <p className="text-sm font-medium">
                    {asset.last_firmware_update_date ? new Date(asset.last_firmware_update_date).toLocaleDateString() : "Never"}
                    {asset.last_firmware_updated_by && <span className="text-[10px] text-muted-foreground block">By {asset.last_firmware_updated_by}</span>}
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" variant="outline" className="text-xs h-8 border-[#4169e1] text-[#4169e1] hover:bg-[#4169e1] hover:text-white" onClick={() => handleAction("/firmware-done")}>
                    Mark Updated
                  </Button>
                </div>
              </div>
              
              <Separator className="bg-gray-50" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Last Service</p>
                  <p className="text-sm font-medium">{asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString() : "Never"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Service Interval</p>
                  <p className="text-sm font-medium">{asset.service_reminder_interval_days} Days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Next Service Due</p>
                  <p className={`text-sm font-semibold ${asset.service_due ? "text-red-600" : "text-green-600"}`}>
                    {asset.last_service_date ? 
                      new Date(new Date(asset.last_service_date).getTime() + (asset.service_reminder_interval_days * 24 * 60 * 60 * 1000)).toLocaleDateString() : 
                      "Pending"}
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" variant="outline" className="text-xs h-8 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white" onClick={() => handleAction("/service-reset")}>
                    Reset Timer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                {asset.remarks || "No additional remarks added for this asset."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          
          {/* Checkout Status */}
          <Card className={`border-none shadow-md ${isCheckedOut ? "bg-[#1a1f36] text-white" : "bg-white"}`}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${isCheckedOut ? "text-white" : ""}`}>
                {isCheckedOut ? <LogOut size={16} className="text-amber-400" /> : <LogIn size={16} className="text-green-600" />}
                Checkout Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCheckedOut ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs opacity-60 font-medium">Checked out to</p>
                    <p className="text-sm font-semibold flex items-center gap-2">
                       <User size={12} className="text-[#4169e1]" />
                       {asset.checked_out_to_user_id || "Field Engineer"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs opacity-60 font-medium">Checked out on</p>
                    <p className="text-sm font-semibold flex items-center gap-2 text-balance">
                      <Clock size={12} className="text-[#4169e1]" />
                      {new Date(asset.checked_out_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs opacity-60 font-medium">Purpose</p>
                    <p className="text-sm italic opacity-80">{asset.checked_out_purpose || "No purpose specified"}</p>
                  </div>
                  <Button className="w-full bg-white text-[#1a1f36] hover:bg-white/90" onClick={() => handleAction("/checkin")}>
                    Check-in Device
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">This device is currently available in the warehouse and can be checked out.</p>
                  <Button className="w-full bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => setCheckoutModal(true)}>
                    Assign / Checkout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranty */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#4169e1]" />
                Warranty
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWarrantyModal(true)}>
                <Edit2 size={12} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Expiry Date</p>
                <p className={`text-sm font-semibold flex items-center gap-2 ${
                  asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date() ? "text-red-600" : "text-foreground"
                }`}>
                  <Calendar size={12} />
                  {asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-xs leading-relaxed text-balance italic">{asset.warranty_notes || "No warranty notes provided."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODALS */}
      
      {/* Edit Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Asset Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Operational Status</Label>
              <Select value={editForm.status} onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val || "Working" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer / Assignment</Label>
              <Input 
                id="customer" 
                value={editForm.customer} 
                onChange={(e) => setEditForm(prev => ({ ...prev, customer: e.target.value }))}
                placeholder="Name or company"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea 
                id="remarks" 
                value={editForm.remarks} 
                onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any additional notes..."
                className="h-24 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => handleAction("", "PATCH", {
              operational_status: editForm.status,
              customer: editForm.customer,
              remarks: editForm.remarks
            })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={checkoutModal} onOpenChange={setCheckoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout Asset</DialogTitle>
            <DialogDescription>Assign this asset to yourself or a field task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of checkout</Label>
              <Textarea 
                id="purpose" 
                value={checkoutPurpose} 
                onChange={(e) => setCheckoutPurpose(e.target.value)}
                placeholder="e.g., On-site deployment, Calibration task..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutModal(false)}>Cancel</Button>
            <Button 
              className="bg-[#4169e1] hover:bg-[#3358cc] text-white" 
              onClick={() => handleAction("/checkout", "POST", { purpose: checkoutPurpose })}
              disabled={!checkoutPurpose.trim()}
            >
              Assign Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Modal */}
      <Dialog open={warrantyModal} onOpenChange={setWarrantyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Warranty Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input 
                id="expiry" 
                type="date"
                value={warrantyForm.expiry} 
                onChange={(e) => setWarrantyForm(prev => ({ ...prev, expiry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Warranty Notes</Label>
              <Textarea 
                id="notes" 
                value={warrantyForm.notes} 
                onChange={(e) => setWarrantyForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarrantyModal(false)}>Cancel</Button>
            <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => handleAction("/warranty", "PATCH", {
              warranty_expiry_date: warrantyForm.expiry,
              warranty_notes: warrantyForm.notes
            })}>Update Warranty</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyModal} onOpenChange={setHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={18} className="text-[#4169e1]" />
              Audit Log
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 py-4">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audit logs found for this asset.</p>
              ) : (
                history.map((log, i) => (
                  <div key={log.log_id} className="relative pl-6 pb-6 border-l last:pb-0 border-gray-100">
                    <div className="absolute left-[-5px] top-1 w-[10px] h-[10px] rounded-full bg-[#4169e1]" />
                    <div className="bg-muted/30 p-3 rounded-lg border border-gray-100/50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-[10px] font-semibold">{log.action_type}</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">{new Date(log.performed_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-1">By: {log.performed_by?.name || "System"}</p>
                      {log.notes && <p className="text-xs text-muted-foreground italic mb-2">"{log.notes}"</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button onClick={() => setHistoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
