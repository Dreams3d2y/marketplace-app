"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingBag } from "lucide-react"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* 1. BARRA SUPERIOR */}
      <div className="w-full bg-red-600 text-white text-[10px] md:text-xs font-bold py-1.5 text-center tracking-widest uppercase">
        Envíos a todo el Perú 🇵🇪
      </div>

      {/* 2. HEADER PRINCIPAL */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all">
        
        {/* Aumenté un poco la altura del header en móvil (h-20) y PC (md:h-28) para dar espacio al logo nuevo */}
        <div className="container mx-auto px-4 h-20 md:h-28 flex items-center justify-between">
          
          {/* --- A. LOGO + NOMBRE --- */}
          <Link href="/" className="flex items-center gap-4 group">
            
            {/* === CAMBIO AQUÍ: AUMENTO DE TAMAÑO DE LA IMAGEN === */}
            {/* Antes: h-11 w-11 md:h-14 md:w-14 */}
            {/* Ahora: h-16 w-16 (Móvil grande) y md:h-24 md:w-24 (PC grande) */}
            <div className="relative h-16 w-16 md:h-24 md:w-24 flex-shrink-0 transition-transform group-hover:scale-105 duration-300">
              <Image 
                src="/brand-logo.png" 
                alt="Logo Novedades Silva" 
                fill
                // 'object-contain' es clave: asegura que la imagen NO se deforme, 
                // se ajustará al espacio más grande posible sin perder proporción.
                className="object-contain"
                priority
              />
            </div>
            
            <div className="flex flex-col leading-none select-none">
              <h1 className="font-black text-xl md:text-3xl tracking-tight text-slate-800">
                <span className="text-teal-600">Novedades</span>
                <span className="text-red-600">Silva</span>
              </h1>
              <span className="text-[9px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5 group-hover:text-teal-500 transition-colors">
                Tienda Oficial
              </span>
            </div>
          </Link>

          {/* --- B. NAVEGACIÓN PC --- */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 border-b-2 border-transparent hover:border-teal-500"
            >
              Inicio
            </Link>
            <Link 
              href="/catalog" 
              className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors py-2 border-b-2 border-transparent hover:border-teal-500"
            >
              Catálogo
            </Link>
          </nav>

          {/* --- C. MENÚ MÓVIL --- */}
          <div className="md:hidden">
            <button 
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menú"
            >
              {isMobileMenuOpen ? <X size={32} className="text-red-500" /> : <Menu size={32} className="text-teal-600" />}
            </button>
          </div>

        </div>

        {/* 3. BORDE DECORATIVO */}
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-red-500 opacity-90" />
      
        {/* 4. LISTA DESPLEGABLE MÓVIL */}
        {isMobileMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-white border-b border-slate-200 shadow-xl md:hidden flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 z-50">
             <nav className="flex flex-col p-4 gap-2">
                <Link 
                  href="/" 
                  className="p-4 font-bold text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors flex items-center justify-between group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Inicio
                  <span className="text-slate-300 group-hover:text-teal-500">→</span>
                </Link>
                <Link 
                  href="/catalog" 
                  className="p-4 font-bold text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors flex items-center justify-between group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ver Catálogo Completo
                  <span className="text-slate-300 group-hover:text-teal-500">→</span>
                </Link>
             </nav>
          </div>
        )}
      </header>
    </>
  )
}