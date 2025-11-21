import Link from "next/link"
import Image from "next/image"
import { products } from "@/lib/data"
import { ArrowLeft, ShoppingCart, Heart, Share2, Truck, ShieldCheck, Sparkles } from "lucide-react"
import { notFound } from "next/navigation"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = products.find((p) => p.id === id)

  if (!product) {
    return notFound()
  }

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <div className="pb-20">
      {/* Navigation Overlay */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent md:relative md:from-transparent md:bg-transparent md:text-black">
        <Link
          href={`/category/${product.category}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" />
        </Link>
        <div className="flex gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white">
            <Share2 className="h-5 w-5 text-gray-800" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white">
            <Heart className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative -mt-20 md:mt-0 aspect-square w-full overflow-hidden bg-white md:rounded-2xl md:shadow-sm">
        <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" priority />
        <div className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Especial Navidad
        </div>
      </div>

      {/* Product Info */}
      <div className="relative -mt-6 rounded-t-3xl bg-background px-6 pt-8 md:mt-6 md:rounded-none md:p-0">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-foreground leading-tight text-balance">{product.name}</h1>
            <span className="text-2xl font-bold text-primary whitespace-nowrap ml-4">
              ${product.price.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
              ★ 4.8
            </span>
            <span className="text-xs text-muted-foreground">Más vendido en Navidad</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 space-y-3">
          <h2 className="text-lg font-semibold">Descripción</h2>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2 rounded-lg border p-3 bg-gradient-to-br from-green-50 to-white">
              <Truck className="h-5 w-5 text-green-600" />
              <div className="text-xs">
                <p className="font-medium text-foreground">Envío Gratis</p>
                <p className="text-muted-foreground">Llega mañana</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3 bg-gradient-to-br from-blue-50 to-white">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div className="text-xs">
                <p className="font-medium text-foreground">Garantía</p>
                <p className="text-muted-foreground">30 días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery / Related Images */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Galería del Producto</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {product.relatedImages.map((img, idx) => (
              <div
                key={idx}
                className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border snap-center shadow-sm bg-white"
              >
                <Image src={img || "/placeholder.svg"} alt={`Vista ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mb-24">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold">También te podría gustar</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square rounded-t-xl bg-gray-100 overflow-hidden">
                    <Image
                      src={rp.image || "/placeholder.svg"}
                      alt={rp.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2 leading-tight">{rp.name}</p>
                    <p className="text-sm font-bold text-primary">${rp.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Buy Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background p-4 pb-8 md:pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto max-w-md md:max-w-2xl lg:max-w-4xl flex gap-3">
          <button className="flex-1 rounded-full bg-primary py-3.5 text-center font-bold text-white shadow-lg shadow-primary/25 active:scale-95 transition-transform flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  )
}
