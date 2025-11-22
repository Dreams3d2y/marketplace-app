/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Para tus fotos subidas a Firebase
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Para las fotos de prueba/ejemplo
        pathname: '**',
      },
    ],
    // Formatos modernos para que cargue más rápido en celulares
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;