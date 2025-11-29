import Link from "next/link"
import { getCategoryById, getPaginatedProducts } from "@/lib/firebase" 
import { ArrowLeft, Search } from "lucide-react"
import { notFound } from "next/navigation"
import ProductGridInfinite from "@/components/ui/product-grid-infinite"

// --- OPTIMIZACIÓN CRÍTICA ---
// Al quitar 'force-dynamic' y poner esto, Next.js guarda esta página en caché por 1 hora.
// Si entran 1,000 personas, solo cuenta como 1 visita a Firebase.
// Cuando tú editas algo en el Admin, la caché se borra automáticamente.
export const revalidate = 3600; 

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Ejecutamos las dos consultas en paralelo
  const [category, initialProducts] = await Promise.all([
    getCategoryById(id),
    getPaginatedProducts(id) 
  ])

  if (!category) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Header Estético y Sticky */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-4">
            <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
            <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 leading-none">
                    <span>{category.icon || "🎁"}</span> 
                    {category.name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Envíos a todo el Perú 🇵🇪</p>
            </div>
            {/* Botón de búsqueda decorativo (puedes redirigirlo al catálogo si quieres) */}
            <Link href="/catalog" className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50">
                <Search size={20} />
            </Link>
        </div>
      </div>

      {/* Título de sección */}
      <div className="px-4 py-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Explora los mejores juguetes
        </h2>
      </div>

      {/* Grid de Productos (Cliente) */}
      <ProductGridInfinite initialProducts={initialProducts} categoryId={id} />
      
    </div>
  )
}