import Link from "next/link"
import Image from "next/image"
import { products, categories } from "@/lib/data"
import { ArrowLeft, Star } from "lucide-react"
import { notFound } from "next/navigation"

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = categories.find((c) => c.id === id)
  const categoryProducts = products.filter((p) => p.category === id)

  if (!category) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {category.icon} {category.name}
          </h1>
          <p className="text-sm text-muted-foreground">{categoryProducts.length} productos encontrados</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categoryProducts.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group flex flex-row sm:flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
          >
            <div className="relative h-32 w-32 sm:h-48 sm:w-full shrink-0 bg-gray-100">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span className="text-xs text-muted-foreground">4.8 (120)</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-primary">${product.price.toLocaleString()}</span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Ver más</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categoryProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🎅</div>
          <h3 className="text-lg font-medium">Jo Jo Jo...</h3>
          <p className="text-muted-foreground">Aún no hay juguetes en esta categoría.</p>
        </div>
      )}
    </div>
  )
}
