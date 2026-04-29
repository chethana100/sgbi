"use client";
import { useLocation } from "@/lib/location-context";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Wrench, Clock, Zap, Plus, ArrowRight, Activity, TrendingUp, Search, Check, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

interface Product {
  product_id: string;
  product_name: string;
  erp_part_number: string;
  serial_prefix: string | null;
}

interface Location {
  location_id: string;
  name: string;
  full_path: string;
  children?: Location[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ working: 0, breakdown: 0, serviceDue: 0, updatesAvailable: 0, total: 0 });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedLocationId, selectedLocationName } = useLocation();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const router = useRouter();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [addForm, setAddForm] = useState({
    product_id: "", serial_number: "", current_location_id: "",
    customer: "", current_firmware: "", operational_status: "Working", remarks: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [newProduct, setNewProduct] = useState({ product_name: "", erp_part_number: "", product_type: "accessory", serial_prefix: "" });
  const [newLocation, setNewLocation] = useState({ name: "", parent_location_id: "" });
  const [newCustomer, setNewCustomer] = useState("");

  const [productOpen, setProductOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);

  useEffect(() => { fetchData(); }, [selectedLocationId]);
  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(d => { if (d.success) setProducts(d.data); });
    fetch("/api/locations").then(r => r.json()).then(d => { if (d.success) setLocations(d.data); });
    fetch("/api/assets?pageSize=500").then(r => r.json()).then(d => {
      if (d.success) {
        const uniqueCustomers = [...new Set(d.data.map((a: any) => a.customer).filter(Boolean))] as string[];
        setCustomers(uniqueCustomers);
      }
    });
  }, []);

  const flattenLocations = (locs: Location[], depth = 0): any[] =>
    locs.flatMap(loc => [{ ...loc, depth }, ...flattenLocations(loc.children || [], depth + 1)]);
  const flatLocations = flattenLocations(locations);

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
          breakdown: all.filter(a => a.operational_status === "Breakdown").length,
          serviceDue: all.filter(a => a.service_due).length,
          updatesAvailable: all.filter(a => a.firmware_update_available).length,
        });
        setRecentAssets([...all].sort((a, b) => new Date(b.last_modified_at).getTime() - new Date(a.last_modified_at).getTime()).slice(0, 8));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddAsset = async () => {
    setAddError("");
    if (!addForm.product_id || !addForm.serial_number || !addForm.current_location_id) {
      setAddError("Product, serial number and location are required.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, customer: addForm.customer || "Internal" }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ product_id: "", serial_number: "", current_location_id: selectedLocationId || "", customer: "", current_firmware: "", operational_status: "Working", remarks: "" });
        fetchData();
      } else {
        setAddError(data.message || "Failed to add asset.");
      }
    } catch {
      setAddError("Something went wrong.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddProduct = async () => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    const data = await res.json();
    if (data.success) {
      setProducts(p => [...p, data.data]);
      setAddForm(f => ({ ...f, product_id: data.data.product_id }));
      setShowAddProduct(false);
      setNewProduct({ product_name: "", erp_part_number: "", product_type: "accessory", serial_prefix: "" });
    }
  };

  const handleAddLocation = async () => {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLocation),
    });
    const data = await res.json();
    if (data.success) {
      fetch("/api/locations").then(r => r.json()).then(d => { if (d.success) setLocations(d.data); });
      setAddForm(f => ({ ...f, current_location_id: data.data.location_id }));
      setShowAddLocation(false);
      setNewLocation({ name: "", parent_location_id: "" });
    }
  };

  const selectedProduct = products.find(p => p.product_id === addForm.product_id);
  const selectedLocation = flatLocations.find(l => l.location_id === addForm.current_location_id);
  const healthScore = stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedLocationId ? selectedLocationName : "All Locations"}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {loading ? "Loading..." : <><strong className="text-gray-700 dark:text-gray-300">{stats.total}</strong> assets tracked</>}
          </p>
        </div>
        <button onClick={() => router.push("/assets/new")}
          className="flex items-center gap-2 px-4 py-2 bg-[#29ABE2] text-white text-sm font-semibold rounded-xl hover:bg-[#1a96cc] transition-colors shadow-sm shadow-[#29ABE2]/30">
          <Plus size={15} />Add Asset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Working", value: stats.working, icon: Package, color: "text-green-600", bg: "bg-green-50", badge: "Active", badgeColor: "text-green-600 bg-green-50", href: "/assets?status=Working" },
          { label: "Breakdown", value: stats.breakdown, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50", badge: "Repair", badgeColor: "text-amber-600 bg-amber-50", href: "/assets?status=Breakdown" },
          { label: "Service Due", value: stats.serviceDue, icon: Clock, color: "text-red-500", bg: "bg-red-50", badge: stats.serviceDue > 0 ? "Alert" : null, badgeColor: "text-red-600 bg-red-50", href: "/alerts" },
          { label: "Updates Available", value: stats.updatesAvailable, icon: Zap, color: "text-[#29ABE2]", bg: "bg-sky-50", badge: stats.updatesAvailable > 0 ? "New" : null, badgeColor: "text-[#29ABE2] bg-sky-50", href: "/alerts" },
        ].map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all cursor-pointer">
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
            <span>{stats.breakdown + stats.serviceDue} need attention</span>
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
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${asset.operational_status === "Working" ? "bg-green-50 text-green-600 border border-green-100" : asset.operational_status === "Breakdown" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                      {asset.operational_status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Asset</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">

            {/* Product - searchable */}
            <div>
              <Label>Product *</Label>
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full mt-1 justify-between font-normal">
                    {selectedProduct ? `${selectedProduct.product_name} — ${selectedProduct.erp_part_number}` : "Select product..."}
                    <ChevronsUpDown size={14} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white dark:bg-gray-900" align="start">
                  <Command>
                    <CommandInput placeholder="Search product..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {isAdmin && (
                          <CommandItem value="__add_new__" onSelect={() => { setProductOpen(false); setShowAddProduct(true); }}>
                            <span className="text-[#29ABE2] font-semibold">+ Add New Product</span>
                          </CommandItem>
                        )}
                        {products.map(p => (
                          <CommandItem key={p.product_id} value={p.product_name + p.erp_part_number}
                            onSelect={() => {
                              setAddForm(f => ({ ...f, product_id: p.product_id, serial_number: p.serial_prefix || "" }));
                              setProductOpen(false);
                            }}>
                            <Check size={14} className={cn("mr-2", addForm.product_id === p.product_id ? "opacity-100" : "opacity-0")} />
                            {p.product_name} — {p.erp_part_number}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Serial Number */}
            <div>
              <Label>Serial Number *</Label>
              <Input className="mt-1" placeholder={selectedProduct?.serial_prefix ? `e.g. ${selectedProduct.serial_prefix}001` : "Enter serial number"}
                value={addForm.serial_number} onChange={e => setAddForm(f => ({ ...f, serial_number: e.target.value }))} />
            </div>

            {/* Location - searchable */}
            <div>
              <Label>Initial Location *</Label>
              <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full mt-1 justify-between font-normal">
                    {selectedLocation ? selectedLocation.full_path || selectedLocation.name : "Select location..."}
                    <ChevronsUpDown size={14} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white dark:bg-gray-900" align="start">
                  <Command>
                    <CommandInput placeholder="Search location..." />
                    <CommandList>
                      <CommandEmpty>No location found.</CommandEmpty>
                      <CommandGroup>
                        {isAdmin && (
                          <CommandItem value="__add_location__" onSelect={() => { setLocationOpen(false); setShowAddLocation(true); }}>
                            <span className="text-[#29ABE2] font-semibold">+ Add New Location</span>
                          </CommandItem>
                        )}
                        {flatLocations.map(loc => (
                          <CommandItem key={loc.location_id} value={loc.name + (loc.full_path || "")}
                            onSelect={() => {
                              setAddForm(f => ({ ...f, current_location_id: loc.location_id }));
                              setLocationOpen(false);
                            }}>
                            <Check size={14} className={cn("mr-2", addForm.current_location_id === loc.location_id ? "opacity-100" : "opacity-0")} />
                            {"  ".repeat(loc.depth)}{loc.depth > 0 ? "↳ " : ""}{loc.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Customer - searchable with add option for admin */}
            <div>
              <Label>Customer</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full mt-1 justify-between font-normal">
                    {addForm.customer || "Select or type customer..."}
                    <ChevronsUpDown size={14} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white dark:bg-gray-900" align="start">
                  <Command>
                    <CommandInput placeholder="Search or type customer..." onValueChange={v => setNewCustomer(v)} />
                    <CommandList>
                      <CommandGroup>
                        <CommandItem value="Internal" onSelect={() => { setAddForm(f => ({ ...f, customer: "Internal" })); setCustomerOpen(false); }}>
                          <Check size={14} className={cn("mr-2", addForm.customer === "Internal" ? "opacity-100" : "opacity-0")} />
                          Internal
                        </CommandItem>
                        {customers.filter(c => c !== "Internal").map(c => (
                          <CommandItem key={c} value={c} onSelect={() => { setAddForm(f => ({ ...f, customer: c })); setCustomerOpen(false); }}>
                            <Check size={14} className={cn("mr-2", addForm.customer === c ? "opacity-100" : "opacity-0")} />
                            {c}
                          </CommandItem>
                        ))}
                        {newCustomer && !customers.includes(newCustomer) && newCustomer !== "Internal" && (
                          <CommandItem value={newCustomer} onSelect={() => {
                            setAddForm(f => ({ ...f, customer: newCustomer }));
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

            {/* Firmware */}
            <div>
              <Label>Firmware Version</Label>
              <Input className="mt-1" placeholder="e.g. v1.0.0" value={addForm.current_firmware}
                onChange={e => setAddForm(f => ({ ...f, current_firmware: e.target.value }))} />
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Select value={addForm.operational_status} onValueChange={(v) => setAddForm(f => ({ ...f, operational_status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900">
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div>
              <Label>Remarks</Label>
              <Textarea className="mt-1" placeholder="Optional notes..." value={addForm.remarks}
                onChange={e => setAddForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>

            {addError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={handleAddAsset} disabled={addLoading}>
              {addLoading ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Product Modal (Admin only) */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
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
            <Button className="bg-[#29ABE2] text-white" onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Location Modal (Admin only) */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Location Name *</Label><Input className="mt-1" value={newLocation.name} onChange={e => setNewLocation(l => ({ ...l, name: e.target.value }))} /></div>
            <div>
              <Label>Parent Location</Label>
              <Select value={newLocation.parent_location_id} onValueChange={v => setNewLocation(l => ({ ...l, parent_location_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None (root level)" /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900">
                  <SelectItem value="">None (root level)</SelectItem>
                  {flatLocations.map(loc => (
                    <SelectItem key={loc.location_id} value={loc.location_id}>{"  ".repeat(loc.depth)}{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLocation(false)}>Cancel</Button>
            <Button className="bg-[#29ABE2] text-white" onClick={handleAddLocation}>Add Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
