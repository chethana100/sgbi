
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, History, Info, MapPin,
  Package, ShieldCheck, AlertTriangle, CheckCircle2,
  Cpu, LogOut, LogIn, Edit2, Upload, X, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Asset {
  asset_id: string;
  product_name: string;
  serial_number: string;
  pcb_version: string | null;
  erp_part_number: string;
  product_type: string;
  operational_status: string;
  current_location_display: string;
  customer: string;
  current_firmware: string;
  last_firmware_update_date: string;
  last_firmware_updated_by: string;
  last_service_date: string;
  service_reminder_interval_days: number;
  transferred_to_user_id: string | null;
  transferred_at: string;
  transferred_purpose: string;
  warranty_expiry_date: string;
  warranty_notes: string;
  image_urls: string[];
  remarks: string;
  enrolled_by: string;
  enrolled_at: string;
  firmware_update_available: boolean;
  service_due: boolean;
}

interface CheckedOutUser {
  name: string;
  email: string;
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkedOutUser, setCheckedOutUser] = useState<CheckedOutUser | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [warrantyModal, setWarrantyModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [serviceRemark, setServiceRemark] = useState("");
  const [manualNote, setManualNote] = useState("");

  const [editForm, setEditForm] = useState({ status: "", customer: "", remarks: "" });
  const [transferPurpose, setTransferPurpose] = useState("");
  const [transferRemark, setTransferRemark] = useState("");
  const [warrantyForm, setWarrantyForm] = useState({ expiry: "", notes: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  useEffect(() => { fetchAsset(); }, [id, refreshKey]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assets/" + id);
      const data = await res.json();
      if (data.success) {
        setAsset(data.data);
        setEditForm({
          status: data.data.operational_status || "",
          customer: data.data.customer || "",
          remarks: data.data.remarks || ""
        });
        setWarrantyForm({
          expiry: data.data.warranty_expiry_date ? data.data.warranty_expiry_date.split("T")[0] : "",
          notes: data.data.warranty_notes || ""
        });
        if (data.data.transferred_to_user_id) {
          fetchCheckedOutUser(data.data.transferred_to_user_id);
        } else {
          setCheckedOutUser(null);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCheckedOutUser = async (userId: string) => {
    try {
      const meRes = await fetch("/api/users/me");
      const meData = await meRes.json();
      if (meData.success && meData.data.id === userId) {
        setCheckedOutUser({ name: meData.data.name, email: meData.data.email });
        return;
      }
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        const user = data.data.find((u: any) => u.id === userId);
        if (user) setCheckedOutUser({ name: user.name, email: user.email });
      }
    } catch (err) { console.error(err); }
  };

  const handleAction = async (endpoint: string, method: string, body?: any) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/assets/" + id + endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setRefreshKey(prev => prev + 1);
        setEditModal(false);
        setTransferModal(false);
        setWarrantyModal(false);
        setTransferPurpose("");
      } else {
        alert(data.message || "Action failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/assets/" + id + "/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
        setHistoryModal(true);
      }
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets/" + id + "/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) setRefreshKey(prev => prev + 1);
      else alert(data.message || "Upload failed");
    } catch {
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = (url: string) => {
    showConfirm("Remove Image", "Are you sure you want to remove this image?", () => {
      handleAction("/images", "DELETE", { url });
    });
  };

  if (loading && !asset) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (!asset) return (
    <div className="p-8 text-center mt-20">
      <Package size={48} className="mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Asset not found</p>
      <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const isCheckedOut = !!asset.transferred_to_user_id;

  return (
    <div className="space-y-6 pb-12">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">{asset.product_name}</h1>
              <Badge variant="outline" className="font-mono text-xs">{asset.erp_part_number}</Badge>
              <Badge variant="outline" className="text-xs">
                {asset.product_type === "main_product" ? "Main Product" : "Accessory"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-mono">Serial: {asset.serial_number}</p>
            {asset.pcb_version && <p className="text-sm text-muted-foreground font-mono">PCB Version: {asset.pcb_version}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <History size={14} className="mr-2" />History
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setNewStatus(asset.operational_status); setStatusModal(true); }}>
            <Package size={14} className="mr-2" />Status
          </Button>
          <Button size="sm" className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={() => setEditModal(true)}>
            <Edit2 size={14} className="mr-2" />Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${asset.operational_status === "Working" ? "bg-green-50" : asset.operational_status === "Breakdown" ? "bg-amber-50" : "bg-red-50"}`}>
                    <Package size={20} className={asset.operational_status === "Working" ? "text-green-600" : asset.operational_status === "Breakdown" ? "text-amber-600" : "text-red-600"} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                    <p className="text-lg font-semibold">{asset.operational_status}</p>
                  </div>
                </div>
                <Badge className={asset.operational_status === "Working" ? "bg-green-100 text-green-700" : asset.operational_status === "Breakdown" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                  {asset.operational_status}
                </Badge>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {asset.service_due && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-700 items-start">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Service Overdue</p>
                    <p className="text-xs opacity-80">Please schedule maintenance.</p>
                  </div>
                </div>
              )}
              {asset.firmware_update_available && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-700 items-start">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Firmware Update Available</p>
                    <p className="text-xs opacity-80">A new version is ready.</p>
                  </div>
                </div>
              )}
              {!asset.service_due && !asset.firmware_update_available && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex gap-3 text-green-700 items-center">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <p className="font-semibold text-sm">All Systems Healthy</p>
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} className="text-[#29ABE2]" />Location and Ownership
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Location</p>
                  <p className="font-medium">{asset.current_location_display || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Customer</p>
                  <p className="font-medium">{asset.customer || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Enrolled By</p>
                  <p className="font-medium">{asset.enrolled_by}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Enrolled At</p>
                  <p className="font-medium">{new Date(asset.enrolled_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu size={16} className="text-[#29ABE2]" />Firmware and Service
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Firmware</p>
                  <p className="font-medium font-mono">{asset.current_firmware || "Unknown"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Last Updated</p>
                  <p className="text-sm font-medium">
                    {asset.last_firmware_update_date ? new Date(asset.last_firmware_update_date).toLocaleDateString() : "Never"}
                  </p>
                  {asset.last_firmware_updated_by && (
                    <p className="text-xs text-muted-foreground">By {asset.last_firmware_updated_by}</p>
                  )}
                </div>
                <div className="flex items-end justify-end">
                  {asset.firmware_update_available && (
                    <Button size="sm" variant="outline"
                      className="text-xs h-8 border-[#29ABE2] text-[#29ABE2] hover:bg-[#29ABE2] hover:text-white"
                      onClick={() => showConfirm("Mark Firmware Updated", "Mark firmware as updated to latest version for this unit?", () => handleAction("/firmware-done", "POST"))}
                      disabled={actionLoading}>
                      Mark Updated
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Last Service</p>
                  <p className="text-sm font-medium">
                    {asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString() : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Interval</p>
                  <p className="text-sm font-medium">{asset.service_reminder_interval_days} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Next Due</p>
                  <p className={`text-sm font-semibold ${asset.service_due ? "text-red-600" : "text-green-600"}`}>
                    {asset.last_service_date
                      ? new Date(new Date(asset.last_service_date).getTime() + asset.service_reminder_interval_days * 86400000).toLocaleDateString()
                      : "Pending"}
                  </p>
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" variant="outline"
                    className="text-xs h-8 border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white"
                    onClick={() => showConfirm("Service Done", "Reset service date to today for this unit?", () => handleAction("/service-reset", "POST"))}
                    disabled={actionLoading || (!asset.service_due && asset.operational_status !== "Breakdown" && asset.operational_status !== "Service")}>
                    Service Done
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
                {asset.remarks || "No remarks added."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon size={16} className="text-[#29ABE2]" />Images
              </CardTitle>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                <div className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-muted cursor-pointer">
                  <Upload size={12} />
                  {uploadingImage ? "Uploading..." : "Upload"}
                </div>
              </label>
            </CardHeader>
            <CardContent className="pt-4">
              {asset.image_urls && asset.image_urls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {asset.image_urls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
                      <img src={url} alt={`Asset image ${i + 1}`} className="w-full h-full object-contain bg-gray-50" />
                      <button
                        onClick={() => handleImageDelete(url)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ImageIcon size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No images yet</p>
                  <p className="text-xs">Upload images to document this asset</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">

          <Card className={isCheckedOut ? "bg-[#1a1f36] text-white border-0" : ""}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${isCheckedOut ? "text-white" : ""}`}>
                {isCheckedOut
                  ? <LogOut size={16} className="text-amber-400" />
                  : <LogIn size={16} className="text-green-600" />}
                {isCheckedOut ? "Transferred" : "Available"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCheckedOut ? (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-4 space-y-4">
                    <div>
                      <p className="text-xs opacity-60 font-medium mb-2">Currently held by</p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#29ABE2] flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {checkedOutUser?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{checkedOutUser?.name || "Loading..."}</p>
                          <p className="text-xs opacity-60">{checkedOutUser?.email || ""}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs opacity-60 font-medium mb-1">Since</p>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock size={12} />
                        {asset.transferred_at ? new Date(asset.transferred_at).toLocaleString() : "Unknown"}
                      </p>
                    </div>
                    {asset.transferred_purpose && (
                      <div>
                        <p className="text-xs opacity-60 font-medium mb-1">Purpose</p>
                        <p className="text-sm italic opacity-80">{asset.transferred_purpose}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full bg-white text-[#1a1f36] hover:bg-white/90 font-semibold"
                    onClick={() => handleAction("/checkin", "POST")}
                    disabled={actionLoading}>
                    <LogIn size={16} className="mr-2" />Check In
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                    <p className="text-sm text-green-700 font-medium">Available in inventory</p>
                  </div>
                  <Button
                    className="w-full bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
                    onClick={() => setTransferModal(true)}>
                    <LogOut size={16} className="mr-2" />Transfer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#29ABE2]" />Warranty
              </CardTitle>
              <button onClick={() => setWarrantyModal(true)} className="p-1 rounded hover:bg-muted transition-colors">
                <Edit2 size={14} className="text-muted-foreground" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Expiry Date</p>
                <p className={`text-sm font-semibold flex items-center gap-2 ${asset.warranty_expiry_date && new Date(asset.warranty_expiry_date) < new Date() ? "text-red-600" : "text-foreground"}`}>
                  <Calendar size={12} />
                  {asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toLocaleDateString() : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-xs italic text-muted-foreground">{asset.warranty_notes || "No warranty notes."}</p>
              </div>
              <button
                onClick={() => setWarrantyModal(true)}
                className="w-full text-xs text-[#29ABE2] border border-[#29ABE2] rounded-md py-2 hover:bg-[#29ABE2] hover:text-white transition-colors">
                Update Warranty
              </button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Asset</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Operational Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val || "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input
                value={editForm.customer}
                onChange={(e) => setEditForm(prev => ({ ...prev, customer: e.target.value }))}
                placeholder="Customer name" />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={editForm.remarks}
                onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional notes..."
                className="h-24 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button
              className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
              disabled={actionLoading}
              onClick={() => handleAction("", "PATCH", {
                operational_status: editForm.status,
                customer: editForm.customer,
                remarks: editForm.remarks
              })}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferModal} onOpenChange={setTransferModal}>
        <DialogContent className="bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>Transfer this asset to a new location or person.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transfer To (Location/Person) *</Label>
              <Input
                value={transferPurpose}
                onChange={(e) => setTransferPurpose(e.target.value)}
                placeholder="e.g., Cochin Lab, John Smith, US Office..." />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={transferRemark}
                onChange={(e) => setTransferRemark(e.target.value)}
                placeholder="Reason for transfer, any notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferModal(false)}>Cancel</Button>
            <Button
              className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
              onClick={() => handleAction("/checkout", "POST", { purpose: transferPurpose, notes: transferRemark })}
              disabled={actionLoading || !transferPurpose.trim()}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warrantyModal} onOpenChange={setWarrantyModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Warranty</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={warrantyForm.expiry}
                onChange={(e) => setWarrantyForm(prev => ({ ...prev, expiry: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={warrantyForm.notes}
                onChange={(e) => setWarrantyForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarrantyModal(false)}>Cancel</Button>
            <Button
              className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
              disabled={actionLoading}
              onClick={() => handleAction("/warranty", "PATCH", {
                warranty_expiry_date: warrantyForm.expiry,
                warranty_notes: warrantyForm.notes
              })}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyModal} onOpenChange={setHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={18} className="text-[#29ABE2]" />Audit History
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 py-4">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No history found.</p>
              ) : (
                history.map((log) => (
                  <div key={log.log_id} className="relative pl-6 pb-6 border-l border-gray-100">
                    <div className="absolute left-[-5px] top-1 w-[10px] h-[10px] rounded-full bg-[#29ABE2]" />
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs font-semibold">{log.action_type}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(log.performed_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium">By: {log.performed_by?.name || "System"}</p>
                      {log.notes && <p className="text-xs text-muted-foreground italic mt-1">"{log.notes}"</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Manual Note</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                placeholder="Type a note for this asset..."
                className="flex-1 h-9 px-3 text-sm border rounded-lg focus:outline-none focus:border-[#29ABE2]"
              />
              <button
                onClick={async () => {
                  if (!manualNote.trim()) return;
                  await fetch("/api/assets/" + id + "/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: manualNote }) });
                  setManualNote("");
                  fetchHistory();
                }}
                className="px-4 h-9 bg-[#29ABE2] text-white text-sm rounded-lg hover:bg-[#1a96cc] transition-colors">
                Add
              </button>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button onClick={() => setHistoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={statusModal} onOpenChange={setStatusModal}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Change Status</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {["Working", "Breakdown", "Scrap", "Service"].map(s => (
              <button key={s} onClick={() => setNewStatus(s)}
                className={`w-full p-3 rounded-xl border-2 text-left font-medium transition-all ${newStatus === s ? "border-[#29ABE2] bg-[#29ABE2]/5" : "border-gray-100 hover:border-gray-200"}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${s === "Working" ? "bg-green-500" : s === "Breakdown" ? "bg-amber-500" : s === "Service" ? "bg-blue-500" : "bg-red-500"}`} />
                {s}
                {s === "Service" && <span className="text-xs text-muted-foreground ml-2">(resets service timer)</span>}
              </button>
            ))}
            {newStatus === "Service" && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium">Service Remarks</label>
                <textarea
                  value={serviceRemark}
                  onChange={e => setServiceRemark(e.target.value)}
                  placeholder="Describe the service performed..."
                  className="w-full h-20 px-3 py-2 text-sm border rounded-xl resize-none focus:outline-none focus:border-[#29ABE2]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" disabled={actionLoading}
              onClick={() => { if (newStatus === "Service") { handleAction("", "PATCH", { operational_status: "Service", notes: serviceRemark }); } else { handleAction("", "PATCH", { operational_status: newStatus }); } setStatusModal(false); }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
