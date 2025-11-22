import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovedadesSilva | Tienda Oficial",
  description: "La mejor tecnología y regalos para esta Navidad en Perú",
  icons: {
    // El "?v=2" obliga al navegador a olvidar el icono viejo y cargar el nuevo
    icon: '/logo.png?v=2', 
    apple: '/logo.png?v=2', // Para iPhone/iPad
    shortcut: '/logo.png?v=2',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}