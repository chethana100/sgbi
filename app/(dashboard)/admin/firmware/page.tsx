"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Cpu, 
  History, 
  ChevronRight, 
  Search, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Calendar,
  Edit2
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface FirmwareMaster {
  product_id: string;
  latest_version: string;
  release_notes: string | null;
  updated_at: string;
  updated_by: string | null;
  product: {
    product_name: string;
    erp_part_number: string;
  };
}

interface Product {
  product_id: string;
  product_name: string;
  erp_part_number: string;
}

export default function AdminFirmwarePage() {
  const [firmwareList, setFirmwareList] = useState<FirmwareMaster[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    latest_version: "",
    release_notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, pRes] = await Promise.all([
        fetch("/api/firmware-master"),
        fetch("/api/products")
      ]);
      const [fData, pData] = await Promise.all([
        fRes.json(),
        pRes.json()
      ]);

      if (fData.success) setFirmwareList(fData.data);
      if (pData.success) setProducts(pData.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (f?: FirmwareMaster) => {
    if (f) {
      setForm({
        product_id: f.product_id,
        latest_version: f.latest_version,
        release_notes: f.release_notes || "",
      });
    } else {
      setForm({
        product_id: "",
        latest_version: "",
        release_notes: "",
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/firmware-master/${form.product_id}`, {
        method: "PUT", // API uses PUT for upsert
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latest_version: form.latest_version,
          release_notes: form.release_notes
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setIsModalOpen(false);
      } else {
        setError(data.message || "Failed to update firmware");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFirmware = firmwareList.filter(f => 
    f.product.product_name.toLowerCase().includes(search.toLowerCase()) || 
    f.latest_version.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Firmware Management</h1>
          <p className="text-sm text-muted-foreground">Manage master software versions for hardware products</p>
        </div>
        <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={() => openModal()}>
          <Plus size={16} className="mr-2" />
          Add / Update Firmware
        </Button>
      </div>

      <Card className="bg-blue-50/30 border-blue-100 mb-6">
        <CardContent className="p-4 flex gap-4 items-start">
          <Info size={18} className="text-blue-600 mt-1 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-900 leading-none">Automatic Reminders</p>
            <p className="text-xs text-blue-700 opacity-80 leading-relaxed">
              When you update the latest version here, any asset with an older version will automatically show a "FW UPDATE" badge in the asset list.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by product or version..." 
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
                <TableHead>Hardware Product</TableHead>
                <TableHead>Latest Version</TableHead>
                <TableHead>Last Released</TableHead>
                <TableHead>Released By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredFirmware.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Cpu size={48} className="mb-4" />
                      <p className="font-semibold text-lg">No firmware defined</p>
                      <p className="text-sm">Release a version to start update tracking</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFirmware.map((f) => (
                  <TableRow key={f.product_id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{f.product.product_name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{f.product.erp_part_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-blue-700 bg-blue-50 border-blue-100 font-bold px-2 py-0.5">
                        {f.latest_version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {new Date(f.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-muted-foreground">{f.updated_by || "System"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={() => openModal(f)}>
                        <Edit2 size={14} className="text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* UPDATE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Update Firmware Master</DialogTitle>
              <DialogDescription>
                Set the globally recognized latest version for a hardware model.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="product">Target Product Model *</Label>
                <Select value={form.product_id} onValueChange={(val) => setForm({...form, product_id: val || ""})} disabled={loading}>
                  <SelectTrigger id="product" className="h-10">
                    <SelectValue placeholder="Identify hardware" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.product_id} value={p.product_id}>
                        {p.product_name} ({p.erp_part_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">New Version Number *</Label>
                <Input 
                  id="version" 
                  value={form.latest_version} 
                  onChange={e => setForm({...form, latest_version: e.target.value})}
                  placeholder="e.g. v2.1.5-beta"
                  required
                  className="h-10 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Release Notes / Patch Details</Label>
                <Textarea 
                  id="notes" 
                  value={form.release_notes} 
                  onChange={e => setForm({...form, release_notes: e.target.value})}
                  placeholder="Fixed radio bug, optimized battery..."
                  className="h-24 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-700 text-xs font-semibold">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white px-6"
                disabled={submitting || !form.product_id}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Publish Release"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

