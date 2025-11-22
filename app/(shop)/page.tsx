import Link from "next/link"
import Image from "next/image"
// Usamos las funciones optimizadas con caché
import { getCategories, getFeaturedProducts, Category, Product } from "@/lib/firebase"
import { Sparkles, Snowflake, ShoppingBag, MessageCircle, Phone, Rocket, Gift } from "lucide-react"

export default async function Home() {
  
  // 1. Carga de datos (Optimizada con caché)
  const categoriesData: Category[] = await getCategories();
  const productsData: Product[] = await getFeaturedProducts();

  // --- HE BORRADO EL "FALLBACK" QUE CARGABA DATOS FALSOS ---
  // Ahora solo se mostrará lo que realmente tengas en Firebase.

  return (
    <div className="min-h-screen space-y-8 bg-slate-50 pb-24">
      
      {/* HERO SECTION */}
      <section className="relative mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-white shadow-xl shadow-red-900/20 ring-4 ring-white/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-white/20">
            <Snowflake className="h-3 w-3 animate-pulse" />
            <span>La Fábrica de Santa 🎅</span>
          </div>
          
          <h1 className="text-4xl font-black leading-[0.9] tracking-tight">
            Haz realidad <br />
            sus <span className="text-amber-300 drop-shadow-sm">Sueños</span> esta <br /> 
            <span className="text-white">Navidad</span>
          </h1>
          
          <p className="text-sm font-medium text-red-100/90 text-balance">
            Encuentra aquí lo que pidieron en su carta. ¡Juguetes originales con entrega rápida!
          </p>
          
          {/* BOTÓN QUE LLEVA AL CATÁLOGO COMPLETO */}
          <Link 
            href="/catalog"
            className="mt-2 inline-block w-full rounded-2xl bg-white py-3.5 text-center font-bold text-red-600 shadow-lg shadow-black/10 transition-transform active:scale-95 hover:bg-slate-50"
          >
            Ver Juguetes 2025
          </Link>
        </div>

        <div className="absolute -bottom-4 -right-4 rotate-12 opacity-20 mix-blend-overlay">
          <Rocket size={160} />
        </div>
        <div className="absolute top-10 right-4 animate-bounce duration-[3000ms] text-2xl">🧸</div>
      </section>

      {/* CATEGORÍAS */}
      {categoriesData.length > 0 && (
        <section className="px-4">
          <div className="mb-4 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">Catálogo</span>
              <h2 className="text-2xl font-bold text-slate-800">Categorías</h2>
            </div>
            <Link href="/catalog" className="text-sm font-semibold text-red-600 underline decoration-red-300 underline-offset-4">
              Ver todo
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoriesData.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md active:scale-95"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <Image
                    src={category.imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-lg shadow-sm backdrop-blur-sm">
                    {category.icon || "🎁"}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-sm leading-tight">{category.name}</h3>
                    <div className="mt-1 h-0.5 w-0 bg-amber-400 transition-all group-hover:w-full" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTOS DESTACADOS */}
      <section className="px-4">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Gift className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-red-900">Los Más Pedidos</h2>
        </div>

        {productsData.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <p>Aún no hay productos destacados.</p>
            <p className="text-sm">¡Pronto llegarán los juguetes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {productsData.map((product) => {
              // Calculamos precio oferta si existe originalPrice
              const original = product.originalPrice || (product.price * 1.2);
              
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-red-200 hover:shadow-lg hover:shadow-red-900/5"
                >
                  <div className="absolute -left-1 top-3 z-10 rounded-r-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-md">
                    OFERTA
                  </div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-t-2xl bg-slate-50">
                    <Image
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="text-xs font-medium text-slate-500 line-clamp-1">{product.categorySlug || "Juguetes"}</h3>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-red-700">
                      {product.name}
                    </h4>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 line-through decoration-red-400">
                          S/ {original.toFixed(2)}
                        </span>
                        <span className="text-lg font-black text-red-600">
                          S/ {product.price.toFixed(2)}
                        </span>
                      </div>
                      <button className="rounded-full bg-green-700 p-2 text-white shadow-sm transition-colors hover:bg-green-800">
                        <ShoppingBag size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* BANNER VERDE (WHATSAPP) */}
      <section className="px-4 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 to-emerald-800 p-6 text-center text-white shadow-lg shadow-green-900/20">
          <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 rounded-t-full transform translate-y-1 filter blur-sm"></div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <MessageCircle className="h-6 w-6 text-amber-300 animate-bounce" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-white">¿Buscas un juguete especial?</h3>
               <p className="text-green-100 text-sm mt-1">
                 En <b>NovedadesSilva</b> te ayudamos a encontrar el regalo perfecto.
               </p>
            </div>
            <Link 
              href="https://wa.me/51994316960" 
              target="_blank"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white text-green-800 py-3 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Phone className="h-5 w-5 fill-green-800" />
              <span>Chatear ahora</span>
            </Link>
            <div className="flex items-center gap-2 text-[10px] text-green-200/80 mt-1">
               <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping"></span>
               En línea ahora
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}