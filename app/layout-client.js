"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function LayoutContent({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.replace("/login");
      }
      if (user && pathname === "/login") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-[var(--accent)] mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-[var(--muted)] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RootLayoutClient({ children }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}
