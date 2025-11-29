"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, Loader2, Gift, ShoppingBag, Plus } from "lucide-react"
import { loadMoreProducts } from "@/app/actions"
import { Product } from "@/lib/firebase"

interface ProductGridProps {
  initialProducts: Product[]
  categoryId: string
}

export default function ProductGridInfinite({ initialProducts, categoryId }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const handleLoadMore = async () => {
    if (isLoading) return
    setIsLoading(true)
    const lastProduct = products[products.length - 1]
    
    try {
      const newProducts = await loadMoreProducts(categoryId, lastProduct.id)
      if (newProducts.length === 0) {
        setHasMore(false)
      } else {
        setProducts(prev => [...prev, ...newProducts])
        if (newProducts.length < 12) setHasMore(false)
      }
    } catch (error) {
      console.error("Error cargando más:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* CAMBIO CLAVE: grid-cols-2 (2 columnas en móvil) 
         gap-3 (espacio pequeño y elegante)
      */}
      <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-6 lg:px-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all active:scale-95 hover:shadow-md"
          >
            {/* Contenedor de Imagen CUADRADO (aspect-square) */}
            {/* Esto soluciona que las fotos "no calcen bien" */}
            <div className="relative aspect-square w-full bg-slate-50">
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Etiqueta de Oferta (Opcional, si tiene descuento) */}
              {product.originalPrice && product.originalPrice > product.price && (
                 <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                   -{(100 - (product.price / product.originalPrice) * 100).toFixed(0)}%
                 </span>
              )}
            </div>
            
            {/* Información del Producto */}
            <div className="flex flex-1 flex-col p-3">
              {/* Título limpio y cortado a 2 líneas */}
              <h3 className="line-clamp-2 text-xs font-medium text-slate-700 h-8 leading-tight mb-1">
                {product.name}
              </h3>

              {/* Estrellas */}
              <div className="mb-2 flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-medium text-slate-400">4.9</span>
              </div>

              {/* Precio y Botón */}
              <div className="mt-auto flex items-end justify-between">
                <div className="flex flex-col">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[10px] text-slate-400 line-through decoration-slate-400/50">
                      S/ {product.originalPrice}
                    </span>
                  )}
                  <span className="text-base font-black text-slate-900">
                    S/ {product.price}
                  </span>
                </div>
                
                {/* Botón pequeño y estético */}
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                   <Plus size={16} strokeWidth={3} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Estado Vacío */}
      {products.length === 0 && (
         <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
           <Gift className="h-16 w-16 mb-4 opacity-20" />
           <h3 className="text-lg font-medium text-slate-600">Jo Jo Jo...</h3>
           <p className="text-sm">Aún no hay juguetes aquí.</p>
         </div>
      )}

      {/* Botón Cargar Más */}
      {hasMore && products.length > 0 && (
        <div className="flex justify-center pb-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 disabled:opacity-70 transition-all font-semibold text-sm shadow-sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Cargando..." : "Ver más juguetes"}
          </button>
        </div>
      )}
    </div>
  )
}