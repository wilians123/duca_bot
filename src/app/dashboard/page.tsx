"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { OperatorDashboard } from "@/components/operator/OperatorDashboard";

export default function DashboardPage() {
  const { profile } = useAuth();
  return profile?.role === "admin" ? <AdminDashboard /> : <OperatorDashboard />;
}
