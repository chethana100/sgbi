"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Cpu, 
  Tag, 
  FileText,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  product_id: string;
  product_name: string;
  erp_part_number: string;
}

interface FirmwareMaster {
  product_id: string;
  latest_version: string;
}

interface Location {
  location_id: string;
  name: string;
  children: Location[];
}

export default function AddAssetPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [firmware, setFirmware] = useState<FirmwareMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", parent_location_id: "" });
  const [addingLocation, setAddingLocation] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    serial_number: "",
    pcb_version: "",
    current_location_id: "",
    customer: "",
    current_firmware: "",
    operational_status: "Working",
    remarks: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, lRes, fRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/locations"),
        fetch("/api/firmware-master")
      ]);
      const [pData, lData, fData] = await Promise.all([
        pRes.json(),
        lRes.json(),
        fRes.json()
      ]);

      if (pData.success) setProducts(pData.data);
      if (lData.success) setLocations(lData.data);
      if (fData.success) setFirmware(fData.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load initial data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    setSelectedProduct(product || null);
    
    // Auto-fill firmware
    const fw = firmware.find(f => f.product_id === productId);
    
    setForm(prev => ({ 
      ...prev, 
      product_id: productId,
      current_firmware: fw ? fw.latest_version : prev.current_firmware
    }));
  };


  const handleAddLocation = async () => {
    setAddingLocation(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocation.name, parent_location_id: newLocation.parent_location_id || null }),
      });
      const data = await res.json();
      if (data.success) {
        const lRes = await fetch("/api/locations");
        const lData = await lRes.json();
        if (lData.success) setLocations(lData.data);
        setForm(prev => ({ ...prev, current_location_id: data.data.location_id }));
        setShowAddLocation(false);
        setNewLocation({ name: "", parent_location_id: "" });
      } else {
        alert(data.message || "Failed to add location");
      }
    } catch { alert("Something went wrong"); }
    finally { setAddingLocation(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/assets/${data.data.asset_id}`);
      } else {
        setError(data.message || "Failed to add asset");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Something went wrong during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderLocationOptions = (locs: Location[], depth = 0) => {
    return locs.map(loc => (
      <React.Fragment key={loc.location_id}>
        <SelectItem value={loc.location_id} className="cursor-pointer">
          {"\u00A0".repeat(depth * 4)}
          {depth > 0 ? "┕ " : ""}
          {loc.name}
        </SelectItem>
        {loc.children && loc.children.length > 0 && renderLocationOptions(loc.children, depth + 1)}
      </React.Fragment>
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 size={32} className="animate-spin text-[#29ABE2]" />
        <p className="text-muted-foreground font-medium">Preparing enrollment form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Enroll New Asset</h1>
          <p className="text-sm text-muted-foreground mt-1">Add a new hardware device to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} className="text-[#29ABE2]" />
                Product Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Select Product</Label>
                <Select value={form.product_id} onValueChange={(val: string | null) => handleProductChange(val || "")} required>
                  <SelectTrigger id="product" className="h-10">
                    <SelectValue placeholder="Choose a product model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[9999]">
                    {products.map(p => (
                      <SelectItem key={p.product_id} value={p.product_id}>
                        {p.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="erp">ERP Part Number</Label>
                <Input 
                  id="erp" 
                  value={selectedProduct?.erp_part_number || ""} 
                  className="bg-muted font-mono" 
                  readOnly 
                  placeholder="Will auto-fill from product"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number</Label>
                <Input 
                  id="serial" 
                  value={form.serial_number} 
                  onChange={(e) => setForm(prev => ({ ...prev, serial_number: e.target.value }))}
                  required
                  placeholder="Enter unique hardware serial"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcb_version">PCB Version</Label>
                <Input
                  id="pcb_version"
                  value={form.pcb_version}
                  onChange={(e) => setForm(prev => ({ ...prev, pcb_version: e.target.value }))}
                  placeholder="Enter PCB number (optional)"
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Deployment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} className="text-[#29ABE2]" />
                Initial Deployment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Initial Location</Label>
                <Select value={form.current_location_id} onValueChange={(val: string | null) => setForm(prev => ({ ...prev, current_location_id: val || "" }))} required>
                  <SelectTrigger id="location" className="h-10">
                    <SelectValue placeholder="Where is it now?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[9999]">
                    {renderLocationOptions(locations)}
                    <div className="border-t mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddLocation(true)}
                        className="w-full text-left px-2 py-1.5 text-sm text-[#29ABE2] hover:bg-blue-50 flex items-center gap-2"
                      >
                        + Add New Location
                      </button>
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer / Assignment</Label>
                <Input 
                  id="customer" 
                  value={form.customer} 
                  onChange={(e) => setForm(prev => ({ ...prev, customer: e.target.value }))}
                  placeholder="Whose site is this for?"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select value={form.operational_status} onValueChange={(val: string | null) => setForm(prev => ({ ...prev, operational_status: val || "Working" }))}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[9999]">
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Scrap">Scrap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu size={16} className="text-[#29ABE2]" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firmware">Initial Firmware</Label>
                <div className="flex gap-2">
                  <Input 
                    id="firmware" 
                    value={form.current_firmware} 
                    onChange={(e) => setForm(prev => ({ ...prev, current_firmware: e.target.value }))}
                    placeholder="e.g. v1.2.0"
                    className="h-10 flex-1 font-mono"
                  />
                  {selectedProduct && firmware.find(f => f.product_id === selectedProduct.product_id) && (
                    <Badge variant="outline" className="shrink-0 flex items-center gap-1 border-[#29ABE2] text-[#29ABE2] bg-[#29ABE2]/5">
                      <CheckCircle2 size={10} /> Latest Available
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={16} className="text-[#29ABE2]" />
                Notes & Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea 
                  id="remarks" 
                  value={form.remarks} 
                  onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any special notes for this specific serial number..."
                  className="h-24 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-center gap-3 text-destructive">
            <Tag size={18} className="rotate-90" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={submitting}>Cancel</Button>
          <Button 
            type="submit" 
            className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white px-8 h-10 font-semibold" 
            disabled={submitting}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Enrolling...</span>
              </div>
            ) : "Enroll Asset"}
          </Button>
        </div>
      </form>

      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location Name</label>
              <input
                className="w-full h-10 px-3 border rounded-md text-sm"
                placeholder="e.g. Demo Lab, Warehouse"
                value={newLocation.name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Parent Location (optional)</label>
              <select
                className="w-full h-10 px-3 border rounded-md text-sm bg-white dark:bg-zinc-900"
                value={newLocation.parent_location_id}
                onChange={(e) => setNewLocation(prev => ({ ...prev, parent_location_id: e.target.value }))}
              >
                <option value="">None (Root location)</option>
                {locations.map(loc => (
                  <React.Fragment key={loc.location_id}>
                    <option value={loc.location_id}>{loc.name}</option>
                    {loc.children?.map(child => (
                      <option key={child.location_id} value={child.location_id}>&nbsp;&nbsp;└ {child.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAddLocation(false)} className="px-4 py-2 text-sm border rounded-md hover:bg-muted">Cancel</button>
            <button
              onClick={handleAddLocation}
              className="px-4 py-2 text-sm bg-[#29ABE2] text-white rounded-md hover:bg-[#1a96cc] disabled:opacity-50"
            >
              {addingLocation ? "Adding..." : "Add Location"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
