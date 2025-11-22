import Link from "next/link"
import Image from "next/image"
import { getProductById, getProductsByCategory } from "@/lib/firebase"
import { ArrowLeft, Share2, Truck, ShieldCheck, Phone, Sparkles } from "lucide-react"
import { notFound } from "next/navigation"
import { InteractiveGallery } from "@/components/product-gallery"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Manejo de errores si el ID es inválido
  let product = null;
  try {
    product = await getProductById(id)
  } catch (e) {
    console.error("Error cargando producto:", e);
  }

  if (!product) return notFound()

  const allRelated = await getProductsByCategory(product.categoryId)
  const relatedProducts = allRelated.filter(p => p.id !== product.id).slice(0, 4)

  // Lógica de Imágenes y Precios
  // @ts-ignore
  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  // @ts-ignore
  const originalPrice = product.originalPrice || (product.price * 1.25);
  const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

  return (
    <div className="pb-24 bg-white min-h-screen">
      
      {/* Navbar Flotante */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pointer-events-none">
        <Link
          href={`/category/${product.categoryId}`}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-800" />
        </Link>
        <div className="flex gap-2 pointer-events-auto">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white text-slate-700">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenedor Principal con Grid Controlada */}
      <div className="container mx-auto max-w-6xl px-4 pt-20 md:pt-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* COLUMNA 1: GALERÍA */}
          <div className="w-full">
            <InteractiveGallery images={galleryImages} productName={product.name} />
          </div>

          {/* COLUMNA 2: DETALLES */}
          <div className="flex flex-col gap-6">
            
            {/* Header Producto */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded border border-amber-200 uppercase tracking-wide">
                   ★ Top Ventas
                 </span>
                 {product.stock < 5 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded animate-pulse">
                      ¡Quedan pocos!
                    </span>
                 )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase">
                {product.name}
              </h1>
            </div>

            {/* Precios */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
               <div className="flex items-end gap-3 relative z-10">
                  <span className="text-5xl font-black text-red-600 leading-none tracking-tighter">
                    S/ {product.price}
                  </span>
                  <div className="flex flex-col pb-1">
                     <span className="text-sm text-slate-400 line-through font-bold">
                       S/ {originalPrice.toFixed(2)}
                     </span>
                     <span className="text-[10px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded w-fit">
                       -{discount}%
                     </span>
                  </div>
               </div>
               <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 h-12 w-12 opacity-20" />
            </div>

            {/* Descripción */}
            <div className="prose prose-sm text-slate-600 leading-relaxed">
               <p>{product.description}</p>
            </div>

            {/* Specs */}
            {product.specifications && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                      <div key={key} className={`flex justify-between p-3 text-sm ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                          <span className="font-bold text-slate-500 uppercase text-xs">{key}</span>
                          <span className="font-semibold text-slate-900">{String(value)}</span>
                      </div>
                  ))}
              </div>
            )}

            {/* Garantías */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                <Truck className="h-6 w-6 text-green-600" />
                <div className="text-xs leading-tight">
                  <p className="font-bold text-green-900">Envío Rápido</p>
                  <p className="text-green-700">A todo el Perú</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <div className="text-xs leading-tight">
                  <p className="font-bold text-blue-900">Compra Segura</p>
                  <p className="text-blue-700">Garantía total</p>
                </div>
              </div>
            </div>

            {/* Botón Desktop */}
            <div className="hidden md:block pt-2">
               <Link 
                href={`https://wa.me/51994316960?text=Hola,%20quiero%20el%20${product.name}`}
                target="_blank"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 py-4 font-bold text-white text-lg shadow-xl shadow-green-600/30 hover:bg-green-500 hover:scale-[1.02] transition-all"
              >
                <Phone className="h-6 w-6 fill-white" />
                <span>Solicitar por WhatsApp</span>
              </Link>
            </div>

          </div>
        </div>

        {/* --- SECCIÓN RECOMENDADOS --- */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-full"><Sparkles className="h-5 w-5 text-amber-600" /></div>
              <h2 className="text-2xl font-bold text-slate-900">Te podría interesar</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden">
                    <Image
                      src={rp.imageUrl || "/placeholder.svg"}
                      alt={rp.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-multiply"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-2 mb-2 h-10">{rp.name}</h3>
                    <div className="flex items-center justify-between">
                       <span className="font-black text-red-600 text-lg">S/ {rp.price}</span>
                       <div className="bg-slate-100 p-1.5 rounded-full text-slate-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                       </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botón Móvil Sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 pb-8 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <Link 
          href={`https://wa.me/51994316960?text=Hola,%20quiero%20el%20${product.name}`}
          target="_blank"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3.5 font-bold text-white shadow-lg shadow-green-600/30 active:scale-95 transition-transform"
        >
          <Phone className="h-5 w-5 fill-white" />
          <span>Pedir por WhatsApp</span>
        </Link>
      </div>
    </div>
  )
}