"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Sparkles, X, ZoomIn, ImageOff } from "lucide-react"

interface InteractiveGalleryProps {
  images: string[]
  productName: string
}

export function InteractiveGallery({ images, productName }: InteractiveGalleryProps) {
  // Aseguramos que siempre haya al menos un elemento en el array para evitar crashes
  const safeImages = images && images.length > 0 ? images : ["/placeholder.svg"];
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomStyle, setZoomStyle] = useState({ opacity: 0, backgroundPosition: "0% 0%" })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState(safeImages[0]) // Estado para manejar error de carga
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Actualizar fuente si cambia el índice
  useEffect(() => {
    setImgSrc(safeImages[currentIndex])
  }, [currentIndex, safeImages])

  // Rotación Automática
  useEffect(() => {
    if (isHovering || isModalOpen || safeImages.length <= 1) return 
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safeImages.length)
    }, 4000) 
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isHovering, isModalOpen, safeImages.length])

  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setCurrentIndex((p) => (p + 1) % safeImages.length) }
  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setCurrentIndex((p) => (p - 1 + safeImages.length) % safeImages.length) }

  // Zoom Desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; 
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.pageX - left) / width) * 100
    const y = ((e.pageY - top) / height) * 100
    setZoomStyle({ opacity: 1, backgroundPosition: `${x}% ${y}%` })
  }

  return (
    <>
      <div className="space-y-4 select-none w-full">
        {/* --- VISOR PRINCIPAL --- */}
        <div 
          className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm group cursor-zoom-in"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => { setIsHovering(false); setZoomStyle(prev => ({...prev, opacity: 0})) }}
          onMouseMove={handleMouseMove}
          onClick={() => setIsModalOpen(true)}
        >
          {/* Badge */}
          <div className="absolute top-4 left-4 z-20 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1 pointer-events-none">
             <Sparkles className="h-3 w-3" /> Navidad
          </div>

          {/* Icono Lupa */}
          <div className="absolute bottom-4 right-4 z-20 bg-white/90 p-2 rounded-full text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
            <ZoomIn className="h-5 w-5" />
          </div>

          {/* IMAGEN PRINCIPAL con Fallback */}
          <Image 
            src={imgSrc} 
            alt={productName} 
            fill 
            className="object-contain p-1" // P-1 evita que toque los bordes exactos
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImgSrc("/placeholder.svg")} // Si falla, pone placeholder
          />

          {/* CAPA DE ZOOM */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none bg-white bg-no-repeat transition-opacity duration-200 ease-out hidden md:block"
            style={{
              opacity: zoomStyle.opacity,
              backgroundImage: `url(${imgSrc})`,
              backgroundSize: "200%",
              backgroundPosition: zoomStyle.backgroundPosition
            }}
          />

          {/* FLECHAS */}
          {safeImages.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 p-2 rounded-full shadow-lg text-slate-800 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/90 p-2 rounded-full shadow-lg text-slate-800 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* --- MINIATURAS --- */}
        {safeImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center px-1">
            {safeImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 bg-white ${
                  currentIndex === idx 
                    ? "border-red-600 ring-2 ring-red-100 opacity-100" 
                    : "border-slate-100 opacity-60 hover:opacity-100"
                }`}
              >
                <Image 
                  src={img} 
                  alt="thumb" 
                  fill 
                  className="object-cover" 
                  onError={(e) => { e.currentTarget.srcset = "/placeholder.svg" }} // Fallback simple para miniaturas
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL FULL SCREEN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-center items-center animate-in fade-in duration-200 p-4">
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full z-50"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image 
              src={imgSrc} 
              alt="Full view" 
              fill 
              className="object-contain"
            />
          </div>

          {safeImages.length > 1 && (
            <div className="absolute bottom-8 flex gap-8 items-center z-50">
               <button onClick={prev} className="bg-white/20 p-3 rounded-full text-white hover:bg-white/40 backdrop-blur-sm"><ChevronLeft className="h-8 w-8"/></button>
               <span className="text-white font-medium tracking-widest text-sm">{currentIndex + 1} / {safeImages.length}</span>
               <button onClick={next} className="bg-white/20 p-3 rounded-full text-white hover:bg-white/40 backdrop-blur-sm"><ChevronRight className="h-8 w-8"/></button>
            </div>
          )}
        </div>
      )}
    </>
  )
}