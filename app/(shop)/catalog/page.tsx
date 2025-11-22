import Link from "next/link"
import Image from "next/image"
import { getAllProducts } from "@/lib/firebase"
import { ShoppingCart, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

// Función para mezclar array (Fisher-Yates Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const itemsPerPage = 20;

  // 1. Obtener TODOS los productos
  const allProducts = await getAllProducts();

  // 2. Mezclar productos (Aleatorio)
  // Nota: En producción real, para mantener el orden entre páginas se usa un "seed", 
  // pero para este caso lo haremos simple: mezcla total.
  const shuffledProducts = shuffleArray(allProducts);

  // 3. Calcular Paginación
  const totalPages = Math.ceil(shuffledProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = shuffledProducts.slice(startIndex, startIndex + itemsPerPage);

  // 4. Obtener 10 Recomendados (tomamos los últimos 10 del array mezclado para que varíen)
  const recommendedProducts = shuffledProducts.slice(-10);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Encabezado */}
      <div className="bg-white border-b border-slate-200 py-8 mb-8">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Catálogo 2025 🎄</h1>
          <p className="text-slate-500">Explora todos nuestros juguetes mágicos.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        
        {/* --- GRID DE PRODUCTOS (20 por página) --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {currentProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group relative flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              {/* Imagen */}
              <div className="relative aspect-square bg-white p-4">
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {/* Badge Oferta (Simulado si no existe originalPrice) */}
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  OFERTA
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">{product.categorySlug}</p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 line-through">S/ {(product.price * 1.2).toFixed(0)}</span>
                    <span className="text-lg font-black text-red-600">S/ {product.price}</span>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-full text-slate-600 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-sm">
                    <ShoppingCart size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        <div className="flex justify-center items-center gap-4 mt-12 mb-16">
          <Link
            href={`/catalog?page=${currentPage > 1 ? currentPage - 1 : 1}`}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              currentPage <= 1 
                ? "bg-slate-200 text-slate-400 pointer-events-none" 
                : "bg-white text-slate-800 shadow-md hover:bg-slate-50"
            }`}
          >
            <ArrowLeft size={18} /> Anterior
          </Link>
          
          <span className="text-slate-600 font-medium">
            Página <span className="text-slate-900 font-bold">{currentPage}</span> de {totalPages}
          </span>

          <Link
            href={`/catalog?page=${currentPage < totalPages ? currentPage + 1 : totalPages}`}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              currentPage >= totalPages 
                ? "bg-slate-200 text-slate-400 pointer-events-none" 
                : "bg-slate-900 text-white shadow-lg hover:shadow-xl hover:bg-slate-800"
            }`}
          >
            Siguiente <ArrowRight size={18} />
          </Link>
        </div>

        {/* --- SECCIÓN RECOMENDADOS (10 Aleatorios) --- */}
        <div className="border-t border-slate-200 pt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Te podría interesar también</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {recommendedProducts.map((product) => (
              <Link
                key={`rec-${product.id}`} // Key única para evitar conflictos
                href={`/product/${product.id}`}
                className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-square bg-slate-50 p-3">
                  <Image
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-xs text-slate-800 line-clamp-2 mb-1 h-8">
                    {product.name}
                  </h4>
                  <span className="text-sm font-black text-red-600">S/ {product.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}