import Link from "next/link"
import { Gift, Snowflake } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-red-700 text-white shadow-xl transition-all">
      
      {/* Contenedor centrado (justify-center) porque ya no hay carrito a la derecha */}
      <div className="mx-auto flex h-16 items-center justify-center px-4">
        
        {/* Logo / Marca */}
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
            <Gift className="h-6 w-6 text-amber-300 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
            <Snowflake className="absolute -top-1 -right-1 h-3 w-3 text-white animate-pulse" />
          </div>
          
          <div className="flex flex-col items-start">
            <span className="font-black text-2xl tracking-tight leading-none text-white drop-shadow-sm">
              Silva<span className="text-amber-300">Navidad</span>
            </span>
            <span className="text-[10px] font-medium text-red-200 tracking-[0.2em] uppercase">
              Tienda Oficial
            </span>
          </div>
        </Link>

      </div>

      {/* Borde inferior decorativo estilo "Bastón de Caramelo" */}
      <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#fff,#fff_10px,#166534_10px,#166534_20px)] shadow-inner opacity-90" />
    </header>
  )
}