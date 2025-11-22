import Link from "next/link"
import Image from "next/image"
import { Snowflake } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-700 to-red-800 text-white shadow-xl transition-all">
      
      {/* Contenedor Principal */}
      <div className="mx-auto flex h-16 items-center justify-center px-4 relative overflow-hidden">
        
        {/* Decoración de fondo sutil (Opcional) */}
        <div className="absolute -left-4 top-0 opacity-5 text-6xl select-none pointer-events-none">🎄</div>

        {/* Logo / Marca */}
        <Link 
          href="/" 
          className="group flex items-center gap-2 transition-transform hover:scale-[1.02] z-10"
        >
          {/* HE ELIMINADO EL CONTENEDOR (bg-white, rounded-full, etc).
             Ahora la imagen está "desnuda" sobre el fondo rojo.
          */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill
              // 'object-contain' asegura que el logo no se recorte
              className="object-contain drop-shadow-md"
              priority
            />
            {/* Copo de nieve decorativo flotando al lado */}
            <Snowflake className="absolute -top-2 -right-2 h-4 w-4 text-amber-200 animate-pulse" />
          </div>
          
          <div className="flex flex-col items-start">
            <span className="font-black text-xl tracking-tight leading-none text-white drop-shadow-sm font-sans">
              Novedades<span className="text-amber-300">Silva</span>
            </span>
            <span className="text-[9px] font-bold text-red-100 tracking-[0.3em] uppercase bg-red-900/20 px-1 rounded mt-0.5">
              Tienda Oficial
            </span>
          </div>
        </Link>

      </div>

      {/* Borde inferior decorativo */}
      <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#fff,#fff_10px,#15803d_10px,#15803d_20px)] shadow-inner opacity-90" />
    </header>
  )
}