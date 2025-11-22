"use client"
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, Gift } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err) {
      setError("Credenciales incorrectas o usuario no registrado.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-2 rounded-full bg-red-100 p-3">
            <Gift className="h-8 w-8 text-red-600" />
          </div>
          {/* Forzamos color negro/oscuro para el texto */}
          <h1 className="text-2xl font-bold text-slate-900">Panel Admin</h1>
          <p className="text-sm text-slate-500">Ingresa credenciales autorizadas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              placeholder="admin@silvanavidad.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              required
            />
          </div>
          
          {error && <div className="rounded bg-red-50 p-3 text-center text-sm text-red-600 font-medium">{error}</div>}

          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 py-3 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 hover:bg-red-700 flex justify-center items-center gap-2 shadow-lg shadow-red-600/30"
          >
            <Lock className="h-4 w-4" /> Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}