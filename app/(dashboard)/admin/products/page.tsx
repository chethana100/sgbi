"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Package, 
  Edit2, 
  Trash2, 
  Search, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Tag,
  Info,
  Loader2
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



interface Product {
  product_id: string;
  product_name: string;
  product_type: string;
  erp_part_number: string;
  description: string | null;
  serial_prefix: string | null;
  is_active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    product_name: "",
    product_type: "main_product",
    erp_part_number: "",
    description: "",
    serial_prefix: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        product_name: product.product_name,
        product_type: product.product_type,
        erp_part_number: product.erp_part_number,
        description: product.description || "",
        serial_prefix: product.serial_prefix || "",
      });
    } else {
      setEditingProduct(null);
      setForm({
        product_name: "",
        product_type: "main_product",
        erp_part_number: "",
        description: "",
        serial_prefix: "",
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = editingProduct ? `/api/products/${editingProduct.product_id}` : "/api/products";
    const method = editingProduct ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        setIsModalOpen(false);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to save product information");
    } finally {
      setSubmitting(false);
    }
  };

  const deactivateProduct = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error("Failed to deactivate:", err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) || 
    p.erp_part_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products Master</h1>
          <p className="text-sm text-muted-foreground">Define hardware models and part numbers</p>
        </div>
        <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => openModal()}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by name or ERP..." 
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>ERP Part Number</TableHead>
                <TableHead>Serial Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Package size={48} className="mb-4" />
                      <p className="font-semibold text-lg">No products defined</p>
                      <p className="text-sm">Click "Add Product" to create your first model</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.product_id} className="group hover:bg-muted/30">
                    <TableCell className="font-semibold">{p.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold border-blue-100 uppercase text-[10px]">
                        {p.product_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.erp_part_number}</TableCell>
                    <TableCell className="font-mono text-xs">{p.serial_prefix || "—"}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs uppercase tracking-wider">
                          <XCircle size={12} /> Inactive
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={() => openModal(p)}>
                          <Edit2 size={14} className="text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-700" onClick={() => deactivateProduct(p.product_id)}>
                          <Trash2 size={14} className="text-muted-foreground group-hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product Definition"}</DialogTitle>
              <DialogDescription>
                Define a new hardware model for asset enrollment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input 
                    id="name" 
                    value={form.product_name} 
                    onChange={e => setForm({...form, product_name: e.target.value})}
                    placeholder="e.g. SGBI Hub v3"
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Product Category</Label>
                  <Select value={form.product_type} onValueChange={(val: string | null) => setForm({...form, product_type: val || "main_product"})}>
                    <SelectTrigger id="type" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main_product">Main Product</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="erp">ERP Part Number *</Label>
                  <Input 
                    id="erp" 
                    value={form.erp_part_number} 
                    onChange={e => setForm({...form, erp_part_number: e.target.value})}
                    placeholder="P-00123"
                    required
                    disabled={!!editingProduct}
                    className="h-10 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefix">Serial Prefix (Optional)</Label>
                <Input 
                  id="prefix" 
                  value={form.serial_prefix} 
                  onChange={e => setForm({...form, serial_prefix: e.target.value})}
                  placeholder="e.g. SN-HUB-"
                  className="h-10 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea 
                  id="desc" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Technical details..."
                  className="h-20 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-3 text-red-700">
                  <Info size={16} />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-[#4169e1] hover:bg-[#3358cc] text-white"
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
