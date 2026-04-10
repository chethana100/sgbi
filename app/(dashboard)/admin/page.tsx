"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  MoreVertical, 
  Search,
  CheckCircle2,
  XCircle,
  Clock
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approval_status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const handleAction = async (id: string, action: "approve" | "revoke", role?: string) => {
    try {
      const url = `/api/users/${id}/${action}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "approve" ? JSON.stringify({ role }) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: any, color: string }> = {
      approved: { icon: CheckCircle2, color: "bg-green-100 text-green-700" },
      pending: { icon: Clock, color: "bg-amber-100 text-amber-700" },
      revoked: { icon: XCircle, color: "bg-red-100 text-red-700" },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={`flex items-center gap-1 text-xs ${config.color} border-none`}>
        <Icon size={12} />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage user access and system permissions</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users size={16} className="mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield size={16} className="mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">User Management</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
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
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#4169e1]/10 text-[#4169e1] text-xs">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{user.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs font-normal">
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.approval_status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <MoreVertical size={14} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.approval_status !== "approved" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleAction(user.id, "approve", "field_user")}>
                                    <UserCheck size={14} className="mr-2 text-green-600" />
                                    Approve as User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction(user.id, "approve", "admin")}>
                                    <Shield size={14} className="mr-2 text-purple-600" />
                                    Approve as Admin
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.approval_status === "approved" && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "revoke")}>
                                  <UserX size={14} className="mr-2 text-red-600" />
                                  Revoke Access
                                </DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Role Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield size={18} className="text-purple-600" />
                    <h3 className="font-medium">Administrator</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Full access to all system features including user management, product creation, and audit logs.</p>
                </div>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={18} className="text-blue-600" />
                    <h3 className="font-medium">Field User</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Standard access to assets, dashboard, and profile. Can view and update assigned equipment.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
