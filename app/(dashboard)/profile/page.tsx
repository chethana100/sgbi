"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Clock, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    approval_status: string;
    createdAt: string;
    last_login_at: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/users/me")
            .then((r) => r.json())
            .then((d) => { if (d.success) setUser(d.data); })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/auth/login");
    };

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h1 className="text-2xl font-semibold">Profile</h1>
                <p className="text-sm text-muted-foreground">Your account details</p>
            </div>

            <Card>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ) : user ? (
                        <div className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#29ABE2] flex items-center justify-center text-white text-xl font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{user.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className={user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                                            {user.role === "admin" ? "Admin" : "Field User"}
                                        </Badge>
                                        <Badge className="bg-green-100 text-green-700">
                                            {user.approval_status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center gap-3">
                                    <Mail size={16} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield size={16} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Role</p>
                                        <p className="text-sm font-medium capitalize">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Member since</p>
                                        <p className="text-sm font-medium">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-4 space-y-2">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Sign out
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Failed to load profile</p>
                    )}
                </CardContent>
            </Card>

            {/* App info */}
            <Card>
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground text-center">
                        SGBI Asset Tracker v1.0 · Internal Use Only
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}