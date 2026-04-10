"use client";

import { useEffect, useState } from "react";
import { Bell, Zap, Clock, UserCheck, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Alert {
    type: string;
    asset_id?: string;
    asset_name?: string;
    serial_number?: string;
    message: string;
    user_id?: string;
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/alerts")
            .then((r) => r.json())
            .then((d) => { if (d.success) setAlerts(d.data); })
            .finally(() => setLoading(false));
    }, []);

    const firmware = alerts.filter((a) => a.type === "FIRMWARE_UPDATE");
    const service = alerts.filter((a) => a.type === "SERVICE_DUE");
    const approvals = alerts.filter((a) => a.type === "PENDING_APPROVAL");

    const AlertCard = ({ alert }: { alert: Alert }) => {
        const config = {
            FIRMWARE_UPDATE: { icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", badge: "bg-blue-100 text-blue-700" },
            SERVICE_DUE: { icon: Clock, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", badge: "bg-red-100 text-red-700" },
            PENDING_APPROVAL: { icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", badge: "bg-amber-100 text-amber-700" },
        }[alert.type] || { icon: Bell, color: "text-gray-600", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-700" };

        const Icon = config.icon;
        const href = alert.asset_id ? `/assets/${alert.asset_id}` : `/admin/users`;

        return (
            <Link href={href}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon size={16} className={config.color} />
                    </div>
                    <div className="flex-1">
                        {alert.asset_name && (
                            <p className="text-sm font-medium">{alert.asset_name} — {alert.serial_number}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                    <Badge className={`text-xs ${config.badge}`}>
                        {alert.type === "FIRMWARE_UPDATE" ? "Firmware" : alert.type === "SERVICE_DUE" ? "Service" : "Approval"}
                    </Badge>
                </div>
            </Link>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Alerts</h1>
                <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${alerts.length} active alert${alerts.length !== 1 ? "s" : ""}`}
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : alerts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Bell size={48} className="text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No active alerts — everything looks good!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {firmware.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Zap size={16} className="text-blue-600" />
                                    Firmware Updates ({firmware.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {firmware.map((a, i) => <AlertCard key={i} alert={a} />)}
                            </CardContent>
                        </Card>
                    )}
                    {service.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Clock size={16} className="text-red-600" />
                                    Service Due ({service.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {service.map((a, i) => <AlertCard key={i} alert={a} />)}
                            </CardContent>
                        </Card>
                    )}
                    {approvals.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <UserCheck size={16} className="text-amber-600" />
                                    Pending Approvals ({approvals.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {approvals.map((a, i) => <AlertCard key={i} alert={a} />)}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}