import Link from "next/link"
import Image from "next/image"
import { getCategoryById, getProductsByCategory } from "@/lib/firebase"
import { ArrowLeft, Star, Gift } from "lucide-react"
import { notFound } from "next/navigation"

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // 1. Buscar datos en Firebase
  const category = await getCategoryById(id)
  const categoryProducts = await getProductsByCategory(id)

  if (!category) {
    return notFound()
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>{category.icon || "🎁"}</span> 
            {category.name}
          </h1>
          <p className="text-sm text-slate-500">{categoryProducts.length} juguetes encontrados</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2">
        {categoryProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group flex flex-row sm:flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
          >
            {/* Imagen */}
            <div className="relative h-32 w-32 sm:h-48 sm:w-full shrink-0 bg-gray-100">
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            
            {/* Info */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <h3 className="font-semibold text-slate-800 line-clamp-2">{product.name}</h3>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-slate-500">4.9 (Calidad Premium)</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-black text-red-600">S/ {product.price.toLocaleString()}</span>
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Ver juguete</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Estado Vacío */}
      {categoryProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <Gift className="h-16 w-16 mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-slate-600">Jo Jo Jo...</h3>
          <p>Los duendes están fabricando más juguetes para esta categoría.</p>
        </div>
      )}
    </div>
  )
}