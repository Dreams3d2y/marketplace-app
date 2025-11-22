import { Header } from "@/components/header"; // Asegúrate que la ruta al Header sea correcta

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-8 font-sans">
      {/* Aquí va el Header de la tienda */}
      <Header />
      
      {/* Este contenedor limita el ancho para que parezca APP móvil en PC */}
      <main className="container mx-auto max-w-md md:max-w-2xl lg:max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}