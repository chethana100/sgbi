"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approval_status: string;
  approved_by: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals
  const [approveModal, setApproveModal] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [roleModal, setRoleModal] = useState<{ open: boolean; userId: string | null; currentRole: string }>({ open: false, userId: null, currentRole: "" });
  const [selectedRole, setSelectedRole] = useState("field_user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users?pageSize=100");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string, body?: any) => {
    try {
      const res = await fetch(`/api/users/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        setApproveModal({ open: false, userId: null });
        setRoleModal({ open: false, userId: null, currentRole: "" });
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                         u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any, color: string }> = {
      approved: { icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
      pending: { icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
      revoked: { icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
        <Icon size={10} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">Approve requests and manage system access</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border w-full md:w-auto overflow-x-auto">
          {["all", "pending", "approved", "revoked"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === s 
                ? "bg-white shadow-sm text-[#4169e1]" 
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by name or email..." 
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
                <TableHead>User Information</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Joined Date</TableHead>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Users size={48} className="mb-4" />
                      <p className="font-semibold text-lg">No users found</p>
                      <p className="text-sm">Matching your filter and search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-1 ring-border">
                          <AvatarFallback className="bg-[#4169e1]/10 text-[#4169e1] text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-foreground tracking-tight">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.role === "admin" ? <Shield size={12} className="text-purple-500" /> : <Users size={12} className="text-blue-500" />}
                        <span className="text-xs font-semibold capitalize">{user.role.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.approval_status)}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-muted-foreground">{user.approved_by || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-border transition-all cursor-pointer">
                            <MoreVertical size={14} />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {user.approval_status !== "approved" && (
                            <DropdownMenuItem 
                              className="gap-2 focus:bg-green-50 focus:text-green-700 cursor-pointer"
                              onClick={() => {
                                setSelectedRole("field_user");
                                setApproveModal({ open: true, userId: user.id });
                              }}
                            >
                              <UserCheck size={14} /> Approve Access
                            </DropdownMenuItem>
                          )}
                          {user.approval_status === "approved" && (
                            <>
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer"
                                onClick={() => {
                                  setSelectedRole(user.role);
                                  setRoleModal({ open: true, userId: user.id, currentRole: user.role });
                                }}
                              >
                                <Shield size={14} /> Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="gap-2 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                                onClick={() => handleAction(user.id, "revoke")}
                              >
                                <UserX size={14} /> Revoke Access
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* APPROVE MODAL */}
      <Dialog open={approveModal.open} onOpenChange={(open) => setApproveModal({ open, userId: approveModal.userId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User Access</DialogTitle>
            <DialogDescription>Assign a role to this user to grant system access.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Assign Role</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "field_user")}>
                <SelectTrigger id="role" className="h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_user">Field User (Standard Access)</SelectItem>
                  <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModal({ open: false, userId: null })}>Cancel</Button>
            <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => approveModal.userId && handleAction(approveModal.userId, "approve", { role: selectedRole })}>
              Approve User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROLE MODAL */}
      <Dialog open={roleModal.open} onOpenChange={(open) => setRoleModal({ ...roleModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>Change permissions for this user.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="change-role">New Role</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val || "field_user")}>
                <SelectTrigger id="change-role" className="h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_user">Field User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModal({ open: false, userId: null, currentRole: "" })}>Cancel</Button>
            <Button className="bg-[#4169e1] hover:bg-[#3358cc] text-white" onClick={() => roleModal.userId && handleAction(roleModal.userId, "role", { role: selectedRole })}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
