"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Package, MapPin, Cpu, Tag, FileText, Loader2, CheckCircle2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Product {
  product_id: string;
  product_name: string;
  erp_part_number: string;
  serial_prefix: string | null;
}

interface FirmwareMaster {
  product_id: string;
  latest_version: string;
}

interface Location {
  location_id: string;
  name: string;
  full_path?: string;
  children: Location[];
}

export default function AddAssetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [firmware, setFirmware] = useState<FirmwareMaster[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newLocation, setNewLocation] = useState({ name: "", parent_location_id: "" });
  const [newProduct, setNewProduct] = useState({ product_name: "", erp_part_number: "", product_type: "accessory", serial_prefix: "" });
  const [addingLocation, setAddingLocation] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [productOpen, setProductOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");

  const [form, setForm] = useState({
    product_id: "", serial_number: "", pcb_version: "", erp_part_number: "",
    current_location_id: "", customer: "", current_firmware: "",
    operational_status: "Working", remarks: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, lRes, fRes, aRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/locations"),
        fetch("/api/firmware-master"), fetch("/api/assets?pageSize=500")
      ]);
      const [pData, lData, fData, aData] = await Promise.all([
        pRes.json(), lRes.json(), fRes.json(), aRes.json()
      ]);
      if (pData.success) setProducts(pData.data);
      if (lData.success) setLocations(lData.data);
      if (fData.success) setFirmware(fData.data);
      if (aData.success) {
        const unique = [...new Set(aData.data.map((a: any) => a.customer).filter(Boolean))] as string[];
        setCustomers(unique);
      }
    } catch { setError("Failed to load data. Please refresh."); }
    finally { setLoading(false); }
  };

  const flattenLocations = (locs: Location[], depth = 0): any[] =>
    locs.flatMap(loc => [{ ...loc, depth }, ...flattenLocations(loc.children || [], depth + 1)]);
  const flatLocations = flattenLocations(locations);

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.product_id === productId) || null;
    setSelectedProduct(product);
    const fw = firmware.find(f => f.product_id === productId);
    setForm(prev => ({ ...prev, product_id: productId, current_firmware: fw?.latest_version || "", serial_number: "" }));
    setProductOpen(false);
  };

  const handleAddLocation = async () => {
    setAddingLocation(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      }
    } catch { alert("Something went wrong"); }
    finally { setAddingLocation(false); }
  };

  const handleAddCustomer = () => {
    if (newCustomerName.trim()) {
      setCustomers(prev => [...prev, newCustomerName.trim()]);
      setForm(p => ({ ...p, customer: newCustomerName.trim() }));
      setShowAddCustomer(false);
      setNewCustomerName("");
    }
  };

  const handleAddProduct = async () => {
    setAddingProduct(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        setProducts(p => [...p, data.data]);
        handleProductChange(data.data.product_id);
        setShowAddProduct(false);
        setNewProduct({ product_name: "", erp_part_number: "", product_type: "accessory", serial_prefix: "" });
      }
    } catch { alert("Something went wrong"); }
    finally { setAddingProduct(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customer: form.customer || "Internal" }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/assets/${data.data.asset_id}`);
      } else {
        setError(data.message || "Failed to add asset");
      }
    } catch { setError("Something went wrong during submission."); }
    finally { setSubmitting(false); }
  };

  const selectedLocation = flatLocations.find(l => l.location_id === form.current_location_id);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 size={32} className="animate-spin text-[#29ABE2]" />
      <p className="text-muted-foreground font-medium">Preparing enrollment form...</p>
    </div>
  );

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

          {/* Product Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package size={16} className="text-[#29ABE2]" />Product Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Product *</Label>
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger>
                    <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <span className={selectedProduct ? "text-foreground" : "text-muted-foreground"}>
                        {selectedProduct ? selectedProduct.product_name : "Choose a product model"}
                      </span>
                      <ChevronsUpDown size={14} className="opacity-50 shrink-0" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-900 z-50" align="start">
                    <Command>
                      <CommandInput placeholder="Search product..." />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {isAdmin && (
                            <CommandItem onSelect={() => { setProductOpen(false); setShowAddProduct(true); }}>
                              <Plus size={14} className="mr-2 text-[#29ABE2]" />
                              <span className="text-[#29ABE2] font-semibold">Add New Product</span>
                            </CommandItem>
                          )}
                          {products.map(p => (
                            <CommandItem key={p.product_id} value={p.product_name + p.erp_part_number}
                              onSelect={() => handleProductChange(p.product_id)}>
                              <Check size={14} className={cn("mr-2", form.product_id === p.product_id ? "opacity-100" : "opacity-0")} />
                              {p.product_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>ERP Part Number *</Label>
                <Input value={form.erp_part_number || selectedProduct?.erp_part_number || ""} onChange={e => setForm(p => ({ ...p, erp_part_number: e.target.value }))} className="font-mono" placeholder="Enter ERP part number" />
              </div>

              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input value={form.serial_number} onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))}
                  required placeholder="Enter serial number" className="h-10" />
              </div>

              <div className="space-y-2">
                <Label>PCB Version</Label>
                <Input value={form.pcb_version} onChange={e => setForm(p => ({ ...p, pcb_version: e.target.value }))}
                  placeholder="Enter PCB number (optional)" className="h-10" />
              </div>
            </CardContent>
          </Card>

          {/* Deployment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={16} className="text-[#29ABE2]" />Initial Deployment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Location *</Label>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger>
                    <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <span className={selectedLocation ? "text-foreground" : "text-muted-foreground"}>
                        {selectedLocation ? selectedLocation.name : "Where is it now?"}
                      </span>
                      <ChevronsUpDown size={14} className="opacity-50 shrink-0" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-900 z-50" align="start">
                    <Command>
                      <CommandInput placeholder="Search location..." />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {isAdmin && (
                            <CommandItem onSelect={() => { setLocationOpen(false); setShowAddLocation(true); }}>
                              <Plus size={14} className="mr-2 text-[#29ABE2]" />
                              <span className="text-[#29ABE2] font-semibold">Add New Location</span>
                            </CommandItem>
                          )}
                          {flatLocations.map(loc => (
                            <CommandItem key={loc.location_id} value={loc.name + (loc.full_path || "")}
                              onSelect={() => { setForm(p => ({ ...p, current_location_id: loc.location_id })); setLocationOpen(false); }}>
                              <Check size={14} className={cn("mr-2", form.current_location_id === loc.location_id ? "opacity-100" : "opacity-0")} />
                              {"  ".repeat(loc.depth)}{loc.depth > 0 ? "↳ " : ""}{loc.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Customer / Assignment</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger>
                    <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <span className={form.customer ? "text-foreground" : "text-muted-foreground"}>
                        {form.customer || "Whose site is this for?"}
                      </span>
                      <ChevronsUpDown size={14} className="opacity-50 shrink-0" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-900 z-50" align="start">
                    <Command>
                      <CommandInput placeholder="Search or type customer..." onValueChange={v => setNewCustomer(v)} />
                      <CommandList>
                        <CommandGroup>
                          {isAdmin && (
                            <CommandItem value="__add_customer__" onSelect={() => { setCustomerOpen(false); setShowAddCustomer(true); }}>
                              <Plus size={14} className="mr-2 text-[#29ABE2]" />
                              <span className="text-[#29ABE2] font-semibold">Add New Customer</span>
                            </CommandItem>
                          )}
                          <CommandItem value="Internal" onSelect={() => { setForm(p => ({ ...p, customer: "Internal" })); setCustomerOpen(false); }}>
                            <Check size={14} className={cn("mr-2", form.customer === "Internal" ? "opacity-100" : "opacity-0")} />
                            Internal
                          </CommandItem>
                          {customers.filter(c => c !== "Internal").map(c => (
                            <CommandItem key={c} value={c} onSelect={() => { setForm(p => ({ ...p, customer: c })); setCustomerOpen(false); }}>
                              <Check size={14} className={cn("mr-2", form.customer === c ? "opacity-100" : "opacity-0")} />
                              {c}
                            </CommandItem>
                          ))}
                          {newCustomer && !customers.includes(newCustomer) && newCustomer !== "Internal" && (
                            <CommandItem value={newCustomer} onSelect={() => {
                              setForm(p => ({ ...p, customer: newCustomer }));
                              setCustomers(prev => [...prev, newCustomer]);
                              setCustomerOpen(false);
                            }}>
                              <Plus size={14} className="mr-2 text-[#29ABE2]" />
                              Add "{newCustomer}"
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Current Status</Label>
                <Select value={form.operational_status} onValueChange={v => setForm(p => ({ ...p, operational_status: v || "Working" }))}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border shadow-xl z-[9999]">
                    <SelectItem value="Working">Working</SelectItem>
                    <SelectItem value="Breakdown">Breakdown</SelectItem>
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
                <Cpu size={16} className="text-[#29ABE2]" />Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Initial Firmware</Label>
                <div className="flex gap-2">
                  <Input value={form.current_firmware} onChange={e => setForm(p => ({ ...p, current_firmware: e.target.value }))}
                    placeholder="e.g. v1.2.0" className="h-10 flex-1 font-mono" />
                  {selectedProduct && firmware.find(f => f.product_id === selectedProduct.product_id) && (
                    <Badge variant="outline" className="shrink-0 flex items-center gap-1 border-[#29ABE2] text-[#29ABE2] bg-[#29ABE2]/5">
                      <CheckCircle2 size={10} />Latest
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
                <FileText size={16} className="text-[#29ABE2]" />Notes & Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Any special notes for this specific serial number..." className="h-24 resize-none" />
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
          <Button type="submit" className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white px-8 h-10 font-semibold" disabled={submitting}>
            {submitting ? <><Loader2 size={16} className="animate-spin mr-2" />Enrolling...</> : "Enroll Asset"}
          </Button>
        </div>
      </form>

      {/* Add New Location Modal */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input placeholder="e.g. Demo Lab, Warehouse" value={newLocation.name}
                onChange={e => setNewLocation(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Parent Location (optional)</Label>
              <select className="w-full h-10 px-3 border rounded-md text-sm bg-white dark:bg-zinc-900"
                value={newLocation.parent_location_id}
                onChange={e => setNewLocation(p => ({ ...p, parent_location_id: e.target.value }))}>
                <option value="">None (Root location)</option>
                {flatLocations.map(loc => (
                  <option key={loc.location_id} value={loc.location_id}>{"  ".repeat(loc.depth)}{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLocation(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={handleAddLocation} disabled={addingLocation}>
              {addingLocation ? "Adding..." : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Product Name *</Label><Input className="mt-1" value={newProduct.product_name} onChange={e => setNewProduct(p => ({ ...p, product_name: e.target.value }))} /></div>
            <div><Label>ERP Part Number *</Label><Input className="mt-1" value={newProduct.erp_part_number} onChange={e => setNewProduct(p => ({ ...p, erp_part_number: e.target.value }))} /></div>
            <div><Label>Serial Prefix</Label><Input className="mt-1" placeholder="e.g. qtap" value={newProduct.serial_prefix} onChange={e => setNewProduct(p => ({ ...p, serial_prefix: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={newProduct.product_type} onValueChange={v => setNewProduct(p => ({ ...p, product_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900">
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="main_product">Main Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={handleAddProduct} disabled={addingProduct}>
              {addingProduct ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Modal */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Customer Name *</Label><Input className="mt-1" placeholder="e.g. HEB, Boots, Kingfisher" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={() => { if (newCustomerName.trim()) { setCustomers(prev => [...prev, newCustomerName.trim()]); setForm(p => ({ ...p, customer: newCustomerName.trim() })); setShowAddCustomer(false); setNewCustomerName(""); } }}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Modal */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Customer Name *</Label><Input className="mt-1" placeholder="e.g. HEB, Boots, Kingfisher" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={() => { if (newCustomerName.trim()) { setCustomers(prev => [...prev, newCustomerName.trim()]); setForm(p => ({ ...p, customer: newCustomerName.trim() })); setShowAddCustomer(false); setNewCustomerName(""); } }}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Modal */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Customer Name *</Label><Input className="mt-1" placeholder="e.g. HEB, Boots, Kingfisher" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={() => { if (newCustomerName.trim()) { setCustomers(prev => [...prev, newCustomerName.trim()]); setForm(p => ({ ...p, customer: newCustomerName.trim() })); setShowAddCustomer(false); setNewCustomerName(""); } }}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
