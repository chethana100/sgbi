"use client";
import React from "react";
import * as XLSX from "xlsx";
import { useLocation } from "@/lib/location-context";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Package, Plus, Download, ExternalLink, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Asset {
  asset_id: string;
  product_name: string;
  serial_number: string;
  operational_status: string;
  current_location_display: string;
  customer: string;
  firmware_update_available: boolean;
  service_due: boolean;
  pcb_version: string | null;
  current_firmware: string | null;
  enrolled_by: string;
  enrolled_at: string;
  erp_part_number: string;
  product_type: string;
  remarks: string | null;
  product_image: string | null;
}

interface Product {
  product_id: string;
  product_name: string;
  erp_part_number: string;
  product_type: string;
  serial_prefix: string | null;
}

interface Location {
  location_id: string;
  name: string;
  full_path: string;
  children?: Location[];
}

function AssetsContent() {
  const searchParams = useSearchParams();
  const { selectedLocationId } = useLocation();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [fwFilter, setFwFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [addForm, setAddForm] = useState({
    product_id: "", serial_number: "", current_location_id: "",
    customer: "Internal", current_firmware: "", operational_status: "Working", remarks: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [newProduct, setNewProduct] = useState({ product_name: "", erp_part_number: "", product_type: "accessory", serial_prefix: "" });
  const [newLocation, setNewLocation] = useState({ name: "", parent_location_id: "" });

  useEffect(() => { fetchAssets(); }, [statusFilter, selectedLocationId]);
  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(d => { if (d.success) setProducts(d.data); });
    fetch("/api/locations").then(r => r.json()).then(d => { if (d.success) setLocations(d.data); });
  }, []);

  const flattenLocations = (locs: Location[], depth = 0): any[] =>
    locs.flatMap(loc => [{ ...loc, depth }, ...flattenLocations(loc.children || [], depth + 1)]);
  const flatLocations = flattenLocations(locations);
  const uniqueCustomers = [...new Set(assets.map(a => a.customer).filter(Boolean))];

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let url = selectedLocationId ? `/api/assets?pageSize=500&locationId=${selectedLocationId}` : `/api/assets?pageSize=500`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      // search handled client-side
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setAssets(data.data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = [
        a.product_name, a.serial_number, a.current_location_display,
        a.customer, a.current_firmware, a.pcb_version, a.erp_part_number, a.remarks
      ].some(v => v && v.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (fwFilter === "update" && !a.firmware_update_available) return false;
    if (fwFilter === "ok" && a.firmware_update_available) return false;
    if (locationFilter !== "all" && a.current_location_display !== locationFilter) return false;
    if (customerFilter !== "all" && a.customer !== customerFilter) return false;
    if (productFilter !== "all" && a.product_name !== productFilter) return false;
    return true;
  });

  const productGroups = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.product_name]) acc[asset.product_name] = [];
    acc[asset.product_name].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const downloadCSV = () => {
    const rows = filteredAssets.map(a => ({
      "Serial Number": a.serial_number,
      "Product Name": a.product_name,
      "Location": a.current_location_display || "",
      "Customer": a.customer || "",
      "Status": a.operational_status,
      "Service Due": a.service_due ? "Yes" : "No",
      "Firmware Update": a.firmware_update_available ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "SGBI-Assets-" + new Date().toISOString().split("T")[0] + ".xlsx");
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
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ product_id: "", serial_number: "", current_location_id: "", customer: "Internal", current_firmware: "", operational_status: "Working", remarks: "" });
        fetchAssets();
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

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      Working: "bg-green-100 text-green-700",
      Breakdown: "bg-amber-100 text-amber-700",
      Scrap: "bg-red-100 text-red-700",
    };
    return (
      <Badge className={`text-xs font-medium border-none ${configs[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredAssets.length} assets`} · Monitor and manage hardware inventory
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input placeholder="Search everything..." className="pl-8 h-9 w-64 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={() => router.push("/assets/new")}>
            <Plus size={16} className="mr-2" />Add Asset
          </Button>
          <Button variant="outline" onClick={downloadCSV} className="flex items-center gap-2">
            <Download size={16} />Export Excel
          </Button>
        </div>
      </div>

      {/* Asset count summary */}
      {!loading && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Total: <strong className="text-foreground">{filteredAssets.length}</strong></span>
          <span>Working: <strong className="text-green-600">{filteredAssets.filter(a => a.operational_status === "Working").length}</strong></span>
          <span>Breakdown: <strong className="text-amber-600">{filteredAssets.filter(a => a.operational_status === "Breakdown").length}</strong></span>
          <span>FW Updates: <strong className="text-blue-600">{filteredAssets.filter(a => a.firmware_update_available).length}</strong></span>
        </div>
      )}

      {/* Table with column filters */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent align-top">
                  <TableHead className="w-[280px]">
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-xs font-semibold">Product / Serial</span>
                      <select className="h-6 text-[10px] border rounded px-1 w-full bg-background dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        value={productFilter} onChange={e => setProductFilter(e.target.value)}>
                        <option value="all">All</option>
                        {[...new Set(assets.map(a => a.product_name).filter(Boolean))].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-xs font-semibold">Initial Location</span>
                      <select className="h-6 text-[10px] border rounded px-1 w-full bg-background dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                        <option value="all">All</option>
                        {[...new Set(assets.map(a => a.current_location_display).filter(Boolean))].map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-xs font-semibold">Customer</span>
                      <select className="h-6 text-[10px] border rounded px-1 w-full bg-background dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}>
                        <option value="all">All</option>
                        {uniqueCustomers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-xs font-semibold">Status</span>
                      <select className="h-6 text-[10px] border rounded px-1 w-full bg-background dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="Working">Working</option>
                        <option value="Breakdown">Breakdown</option>
                        <option value="Scrap">Scrap</option>
                      </select>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-xs font-semibold">Firmware & Service</span>
                      <select className="h-6 text-[10px] border rounded px-1 w-full bg-background dark:bg-gray-900 dark:text-white dark:border-gray-700"
                        value={fwFilter} onChange={e => setFwFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="update">FW Update</option>
                        <option value="ok">Up to Date</option>
                      </select>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={48} className="text-muted-foreground mb-4 opacity-10" />
                        <p className="text-muted-foreground font-medium">No assets found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(productGroups).map(([productName, productAssets]) => (
                    <React.Fragment key={`group-${productName}`}>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={6} className="py-2 px-4">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {productName} <span className="text-[#29ABE2] ml-1">({productAssets.length})</span>
                          </span>
                        </TableCell>
                      </TableRow>
                      {productAssets.map((asset) => (
                        <TableRow key={asset.asset_id} className="cursor-pointer hover:bg-muted/30"
                          onClick={() => window.location.href = `/assets/${asset.asset_id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#29ABE2]/10 bg-gray-50 flex items-center justify-center">
                                {asset.product_image
                                  ? <img src={asset.product_image} alt={asset.product_name} className="w-full h-full object-contain" />
                                  : <Package size={14} className="text-[#29ABE2]" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-none">{asset.product_name}</p>
                                <p className="text-[11px] font-mono text-muted-foreground mt-1 uppercase">{asset.serial_number}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{asset.current_location_display || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{asset.customer || "Internal"}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(asset.operational_status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              {asset.firmware_update_available && (
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 text-[10px] px-1.5 py-0 h-5">FW UPDATE</Badge>
                              )}
                              {asset.service_due && (
                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50/50 text-[10px] px-1.5 py-0 h-5">SERVICE DUE</Badge>
                              )}
                              {!asset.firmware_update_available && !asset.service_due && (
                                <span className="text-[11px] text-muted-foreground/60">OK</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/assets/${asset.asset_id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink size={14} />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Asset Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Asset</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Product *</Label>
              <Select value={addForm.product_id} onValueChange={(v) => {
                if (v === "__add_new__") { setShowAddProduct(true); return; }
                const p = products.find(x => x.product_id === v);
                setAddForm(f => ({ ...f, product_id: v ?? "", serial_number: p?.serial_prefix || "" }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="__add_new__" className="text-[#29ABE2] font-semibold">+ Add New Product</SelectItem>}
                  {products.map(p => (
                    <SelectItem key={p.product_id} value={p.product_id}>{p.product_name} — {p.erp_part_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serial Number *</Label>
              <Input className="mt-1" placeholder={selectedProduct?.serial_prefix ? `e.g. ${selectedProduct.serial_prefix}001` : "Enter serial number"}
                value={addForm.serial_number} onChange={e => setAddForm(f => ({ ...f, serial_number: e.target.value }))} />
            </div>
            <div>
              <Label>Initial Location *</Label>
              <Select value={addForm.current_location_id} onValueChange={(v) => {
                if (v === "__add_location__") { setShowAddLocation(true); return; }
                setAddForm(f => ({ ...f, current_location_id: v ?? "" }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select location..." /></SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="__add_location__" className="text-[#29ABE2] font-semibold">+ Add New Location</SelectItem>}
                  {flatLocations.map(loc => (
                    <SelectItem key={loc.location_id} value={loc.location_id}>
                      {"  ".repeat(loc.depth)}{loc.depth > 0 ? "↳ " : ""}{loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer</Label>
              <Input className="mt-1" placeholder="Internal" value={addForm.customer}
                onChange={e => setAddForm(f => ({ ...f, customer: e.target.value }))} />
            </div>
            <div>
              <Label>Firmware Version</Label>
              <Input className="mt-1" placeholder="e.g. v1.0.0" value={addForm.current_firmware}
                onChange={e => setAddForm(f => ({ ...f, current_firmware: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={addForm.operational_status} onValueChange={(v) => setAddForm(f => ({ ...f, operational_status: v ?? "" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Working">Working</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Scrap">Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Product Name *</Label><Input className="mt-1" value={newProduct.product_name} onChange={e => setNewProduct(p => ({ ...p, product_name: e.target.value }))} /></div>
            <div><Label>ERP Part Number *</Label><Input className="mt-1" value={newProduct.erp_part_number} onChange={e => setNewProduct(p => ({ ...p, erp_part_number: e.target.value }))} /></div>
            <div><Label>Serial Prefix</Label><Input className="mt-1" placeholder="e.g. qtap" value={newProduct.serial_prefix} onChange={e => setNewProduct(p => ({ ...p, serial_prefix: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={newProduct.product_type} onValueChange={v => setNewProduct(p => ({ ...p, product_type: v ?? "accessory" }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Location Name *</Label><Input className="mt-1" value={newLocation.name} onChange={e => setNewLocation(l => ({ ...l, name: e.target.value }))} /></div>
            <div>
              <Label>Parent Location</Label>
              <Select value={newLocation.parent_location_id} onValueChange={v => setNewLocation(l => ({ ...l, parent_location_id: v ?? "" }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None (root level)" /></SelectTrigger>
                <SelectContent>
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

export default function AssetsPage() {
  return (
    <Suspense fallback={<div>Loading Assets...</div>}>
      <AssetsContent />
    </Suspense>
  );
}
