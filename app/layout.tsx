import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Header } from "@/components/header"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SilvaNavidad | Tienda Oficial",
  description: "La mejor tecnología y regalos para esta Navidad en Perú",
  generator: "v0.app",
  // ... tus iconos siguen igual ...
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      {/* CAMBIO: pb-20 a pb-8 para quitar el espacio excesivo de abajo */}
      <body className={`font-sans antialiased min-h-screen bg-background pb-8`}>
        <Header />
        <main className="container mx-auto max-w-md md:max-w-2xl lg:max-w-4xl px-4 py-6">
          {children}
        </main>

        {/* AQUÍ BORRÉ EL <nav> DEL MENÚ INFERIOR, YA NO APARECERÁ NADA */}
        
        <Analytics />
      </body>
    </html>
  )
}