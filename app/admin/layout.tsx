"use client"
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
      <div className="animate-pulse">Cargando panel...</div>
    </div>
  );

  // LAYOUT BASE: Fondo muy oscuro (slate-950) y texto claro
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200 selection:bg-red-500 selection:text-white">
      {children}
    </div>
  );
}