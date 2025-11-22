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

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">Cargando...</div>;

  // LAYOUT FULL SCREEN OSCURO
  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100">
      {children}
    </div>
  );
}