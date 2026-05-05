"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  Plus, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Info,
  Loader2,
  FolderOpen,
  Folder
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Location {
  location_id: string;
  name: string;
  parent_location_id: string | null;
  full_path: string;
  children: Location[];
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    parent_location_id: "",
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openModal = (loc?: Location, parentId?: string) => {
    if (loc) {
      setEditingLoc(loc);
      setForm({
        name: loc.name,
        parent_location_id: loc.parent_location_id || "",
      });
    } else {
      setEditingLoc(null);
      setForm({
        name: "",
        parent_location_id: parentId || "",
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = editingLoc ? `/api/locations/${editingLoc.location_id}` : "/api/locations";
    const method = editingLoc ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          parent_location_id: form.parent_location_id || null
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLocations();
        setIsModalOpen(false);
      } else {
        setError(data.message || "Action failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm("Delete this location? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchLocations();
      } else {
        alert(data.message || "Failed to delete location.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const LocationItem = ({ loc, depth = 0 }: { loc: Location, depth: number }) => {
    const isExpanded = expanded[loc.location_id];
    const hasChildren = loc.children && loc.children.length > 0;

    return (
      <div className="flex flex-col">
        <div className="flex items-center group py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors border-b border-gray-50 last:border-0 cursor-pointer" onClick={() => openModal(loc)}>
          <div className="flex items-center flex-1">
            {/* Indent indent */}
            {[...Array(depth)].map((_, i) => (
              <div key={i} className="w-6 h-6 border-l border-gray-200 ml-3 shrink-0" />
            ))}
            
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => hasChildren && toggleExpand(loc.location_id, e)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${hasChildren ? "hover:bg-gray-200" : "opacity-20 cursor-default"}`}
              >
                {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div className="w-1 h-1 rounded-full bg-gray-400" />}
              </button>
              
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasChildren ? "bg-[#29ABE2]/10 text-[#29ABE2]" : "bg-gray-100 text-gray-500"}`}>
                {hasChildren ? (isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />) : <MapPin size={14} />}
              </div>
              
              <span className="font-semibold text-sm tracking-tight">{loc.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal(undefined, loc.location_id); }}>
              <Plus size={14} className="text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal(loc); }}>
              <Edit2 size={14} className="text-gray-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600" onClick={(e) => { e.stopPropagation(); deleteLocation(loc.location_id); }}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="flex flex-col">
            {loc.children.map(child => (
              <LocationItem key={child.location_id} loc={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const flattenLocations = (locs: Location[], list: Location[] = []) => {
    locs.forEach(l => {
      list.push(l);
      if (l.children) flattenLocations(l.children, list);
    });
    return list;
  };

  const allLocationsFlat = flattenLocations(locations);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Location Hierarchy</h1>
          <p className="text-sm text-muted-foreground">Manage storage zones and audit areas</p>
        </div>
        <Button className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white" onClick={() => openModal()}>
          <Plus size={16} className="mr-2" />
          Add Root Category
        </Button>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : locations.length === 0 ? (
            <div className="p-20 text-center opacity-40">
              <MapPin size={48} className="mx-auto mb-4" />
              <p className="font-semibold">No locations mapped</p>
              <button onClick={() => openModal()} className="text-sm text-[#29ABE2] hover:underline mt-2">Create root location</button>
            </div>
          ) : (
            <div className="flex flex-col p-2">
              <div className="bg-muted/30 px-3 py-2 rounded-lg mb-2 flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex-1">NAME / HIERARCHY</span>
                <span>ACTIONS</span>
              </div>
              {locations.map(loc => (
                <LocationItem key={loc.location_id} loc={loc} depth={0} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 z-50">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLoc ? "Rename Location" : form.parent_location_id ? "Add Sub-location" : "Add Root Location"}</DialogTitle>
              <DialogDescription>
                Organize your assets by defining physical or logical zones.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Location</Label>
                <Select value={form.parent_location_id} onValueChange={(val) => setForm({...form, parent_location_id: val || ""})}>
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="No parent (Root)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900">
                    <SelectItem value="">No parent (Root Category)</SelectItem>
                    {allLocationsFlat.filter(l => l.location_id !== editingLoc?.location_id).map(l => (
                      <SelectItem key={l.location_id} value={l.location_id}>
                        {l.full_path || l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input 
                  id="name" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Rack A, Building 4, Field Depot"
                  required
                  className="h-10"
                />
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 text-red-700 text-xs font-semibold">
                  <Info size={14} />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-[#29ABE2] hover:bg-[#1a96cc] text-white"
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : editingLoc ? "Update Name" : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
