"use client";

import { UserHistoryPanel } from "@/components/auth/UserHistoryPanel";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HistoryPage() {
  const { profile } = useAuth();

  return profile ? <UserHistoryPanel profile={profile} /> : null;
}
