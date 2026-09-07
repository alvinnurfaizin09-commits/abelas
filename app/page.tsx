"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function RootPage() {
  const { currentUser, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace("/login");
    } else if (role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/student");
    }
  }, [currentUser, role, isLoading, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-xs text-[#7B868F]">
      Memuat aplikasi absensi...
    </div>
  );
}
