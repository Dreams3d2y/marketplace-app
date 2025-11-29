import Link from "next/link"
import Image from "next/image"
import { getAllProducts, getCategories } from "@/lib/firebase"
import { ShoppingCart, ArrowLeft, ArrowRight, Search, Filter, X } from "lucide-react"

// Función simple para mezclar (solo visual)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Props para recibir parámetros de URL (búsqueda, página, categoría)
type Props = {
  searchParams: Promise<{ 
    page?: string; 
    q?: string;      // q = query (búsqueda)
    category?: string // categoría seleccionada
  }>
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchQuery = params.q?.toLowerCase() || "";
  const selectedCategory = params.category || "";
  const itemsPerPage = 20;

  // 1. CARGA DE DATOS (En paralelo y con caché)
  // No te preocupes, esto no consume DB extra gracias al caché de 1 hora.
  const [allProductsRaw, categories] = await Promise.all([
    getAllProducts(),
    getCategories()
  ]);

  // 2. FILTRADO (Lógica en el servidor, rápida porque está en memoria)
  let filteredProducts = allProductsRaw;

  // A. Filtrar por Búsqueda
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery) || 
      p.description.toLowerCase().includes(searchQuery)
    );
  }

  // B. Filtrar por Categoría
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === selectedCategory);
  }

  // 3. PAGINACIÓN
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Cortamos el array para la página actual
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* --- HEADER Y BUSCADOR --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4 space-y-4">
            
            {/* Título y Resultados */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                       Catálogo 2025 🎄
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        {totalItems} juguetes encontrados
                    </p>
                </div>

                {/* BARRA DE BÚSQUEDA (Formulario GET) */}
                <form className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input 
                        name="q"
                        defaultValue={params.q}
                        placeholder="Buscar juguete..." 
                        className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all outline-none placeholder:text-slate-400"
                    />
                    {/* Input oculto para mantener la categoría si busco algo */}
                    {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                </form>
            </div>

            {/* FILTROS DE CATEGORÍA (Scroll Horizontal) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <Link 
                    href="/catalog" 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        !selectedCategory 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                >
                    Todos
                </Link>
                {categories.map(cat => (
                    <Link 
                        key={cat.id}
                        // Si ya está seleccionada, el link quita el filtro (href="/catalog")
                        href={selectedCategory === cat.id ? "/catalog" : `/catalog?category=${cat.id}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat.id
                            ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-200" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        <span>{cat.icon}</span> {cat.name}
                        {selectedCategory === cat.id && <X size={12} />}
                    </Link>
                ))}
            </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        
        {/* --- ESTADO VACÍO --- */}
        {currentProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 p-6 rounded-full mb-4">
                    <Search size={48} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No encontramos juguetes</h3>
                <p className="text-slate-500 text-sm mt-1">Intenta con otra búsqueda o categoría.</p>
                <Link href="/catalog" className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors">
                    Ver todos los juguetes
                </Link>
            </div>
        )}

        {/* --- GRID DE PRODUCTOS --- */}
        {/* Usamos el mismo diseño grid-cols-2 que te gustó */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {currentProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group relative flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
            >
              {/* Imagen Cuadrada */}
              <div className="relative aspect-square bg-slate-50">
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* Badge Descuento (Si existe) */}
                {product.originalPrice && product.originalPrice > product.price && (
                   <span className="absolute left-2 top-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                     -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                   </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-xs font-medium text-slate-700 line-clamp-2 mb-1 h-8 leading-tight">
                  {product.name}
                </h3>
                
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex flex-col">
                    {product.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">S/ {product.originalPrice}</span>
                    )}
                    <span className="text-base font-black text-slate-900">S/ {product.price}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-full text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <ShoppingCart size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* --- CONTROLES DE PAGINACIÓN --- */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            {/* Botón Anterior */}
            <Link
                href={{
                    pathname: '/catalog',
                    query: { ...params, page: currentPage > 1 ? currentPage - 1 : 1 }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                currentPage <= 1 
                    ? "bg-slate-100 text-slate-300 pointer-events-none" 
                    : "bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
                }`}
            >
                <ArrowLeft size={16} /> Anterior
            </Link>
            
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                {currentPage} / {totalPages}
            </span>

            {/* Botón Siguiente */}
            <Link
                href={{
                    pathname: '/catalog',
                    query: { ...params, page: currentPage < totalPages ? currentPage + 1 : totalPages }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                currentPage >= totalPages 
                    ? "bg-slate-100 text-slate-300 pointer-events-none" 
                    : "bg-slate-900 text-white shadow-md hover:bg-slate-800"
                }`}
            >
                Siguiente <ArrowRight size={16} />
            </Link>
            </div>
        )}
      </div>
      
      {/* CSS para ocultar scrollbar en categorías */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}