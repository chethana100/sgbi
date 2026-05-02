"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Edit2, Trash2, Search, CheckCircle2, XCircle, Info, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  image: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    product_name: "", product_type: "main_product",
    erp_part_number: "", description: "", serial_prefix: "",
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        product_name: product.product_name, product_type: product.product_type,
        erp_part_number: product.erp_part_number, description: product.description || "",
        serial_prefix: product.serial_prefix || "",
      });
    } else {
      setEditingProduct(null);
      setForm({ product_name: "", product_type: "main_product", erp_part_number: "", description: "", serial_prefix: "" });
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
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { fetchProducts(); setIsModalOpen(false); }
      else setError(data.message || "Something went wrong");
    } catch { setError("Failed to save product"); }
    finally { setSubmitting(false); }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingImage(productId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/products/${productId}/image`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) fetchProducts();
      else alert(data.message || "Upload failed");
    } catch { alert("Upload failed"); }
    finally { setUploadingImage(null); }
  };

  const deactivateProduct = async (id: string) => {
    if (!confirm("Deactivate this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) { console.error(err); }
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
        <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={() => openModal()}>
          <Plus size={16} className="mr-2" />Add Product
        </Button>
      </div>

      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input placeholder="Search by name or ERP..." className="pl-9 h-10"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-16">Image</TableHead>
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
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Package size={48} className="mb-4" />
                      <p className="font-semibold">No products defined</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.product_id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center relative group/img">
                        {p.image ? (
                          <img src={p.image} alt={p.product_name} className="w-full h-full object-contain" />
                        ) : (
                          <Package size={16} className="text-muted-foreground opacity-40" />
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity rounded-lg">
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(p.product_id, f); }}
                            disabled={uploadingImage === p.product_id} />
                          {uploadingImage === p.product_id
                            ? <Loader2 size={12} className="text-white animate-spin" />
                            : <Upload size={12} className="text-white" />}
                        </label>
                      </div>
                    </TableCell>
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
                          <CheckCircle2 size={12} />Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 font-medium text-xs uppercase tracking-wider">
                          <XCircle size={12} />Inactive
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(p)}>
                          <Edit2 size={14} className="text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-700" onClick={() => deactivateProduct(p.product_id)}>
                          <Trash2 size={14} className="text-muted-foreground" />
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>Define a new hardware model for asset enrollment.</DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})}
                    placeholder="e.g. QTap" required className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Product Category</Label>
                  <Select value={form.product_type} onValueChange={(v: string | null) => setForm({...form, product_type: v ?? "main_product"})}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900">
                      <SelectItem value="main_product">Main Product</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ERP Part Number *</Label>
                  <Input value={form.erp_part_number} onChange={e => setForm({...form, erp_part_number: e.target.value})}
                    placeholder="P-00123" required disabled={!!editingProduct} className="h-10 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Serial Prefix (Optional)</Label>
                <Input value={form.serial_prefix} onChange={e => setForm({...form, serial_prefix: e.target.value})}
                  placeholder="e.g. qtap" className="h-10 font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Technical details..." className="h-20 resize-none" />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-3 text-red-700">
                  <Info size={16} /><p className="text-xs font-semibold">{error}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
