export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  relatedImages: string[]
}

export interface Category {
  id: string
  name: string
  image: string
  icon: string
}

export const categories: Category[] = [
  {
    id: "action-figures",
    name: "Figuras de Acción",
    image: "/action-figure-superhero-toy.jpg",
    icon: "⚔️",
  },
  {
    id: "dolls",
    name: "Muñecas",
    image: "/doll-princess-toy.jpg",
    icon: "🎀",
  },
  {
    id: "board-games",
    name: "Juegos de Mesa",
    image: "/board-game-family-fun.jpg",
    icon: "🎲",
  },
  {
    id: "electronic",
    name: "Electrónicos",
    image: "/electronic-toy-robot-gadget.jpg",
    icon: "🎮",
  },
  {
    id: "educational",
    name: "Educativos",
    image: "/educational-toy-learning-blocks.jpg",
    icon: "📚",
  },
  {
    id: "plush",
    name: "Peluches",
    image: "/plush-teddy-bear-soft-toy.jpg",
    icon: "🧸",
  },
]

export const products: Product[] = [
  {
    id: "robot-x",
    name: "Super Robot X-2000",
    price: 45.99,
    description:
      "El robot más avanzado para niños. Camina, habla y tiene luces LED brillantes. Perfecto para aventuras espaciales imaginarias.",
    image: "/futuristic-toy-robot-led-lights.jpg",
    category: "action-figures",
    relatedImages: ["/robot-toy-side-view.jpg", "/robot-toy-back-view.jpg", "/robot-toy-in-action-lights.jpg"],
  },
  {
    id: "hero-set",
    name: "Set de Héroes Galácticos",
    price: 29.99,
    description: "Un set completo de 5 héroes listos para salvar la galaxia. Incluye accesorios y vehículos.",
    image: "/superhero-action-figures-set.jpg",
    category: "action-figures",
    relatedImages: ["/superhero-figure-closeup.jpg", "/hero-vehicle-spaceship.jpg"],
  },
  {
    id: "princess-castle",
    name: "Castillo Mágico de Princesas",
    price: 89.99,
    description: "Un castillo enorme con 3 pisos, muebles y luces. El sueño de cualquier princesa hecho realidad.",
    image: "/princess-castle-dollhouse-pink.jpg",
    category: "dolls",
    relatedImages: ["/castle-interior-rooms-furniture.jpg", "/placeholder.svg?height=300&width=300"],
  },
  {
    id: "monopoly-kids",
    name: "Monopoly Junior",
    price: 19.99,
    description:
      "La versión rápida y divertida del clásico juego de operaciones inmobiliarias, diseñada para los más pequeños.",
    image: "/placeholder.svg?height=400&width=400",
    category: "board-games",
    relatedImages: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
  },
  {
    id: "drone-fly",
    name: "Mini Drone Volador",
    price: 55.0,
    description: "Drone fácil de controlar con cámara HD. Ideal para principiantes y niños mayores de 10 años.",
    image: "/placeholder.svg?height=400&width=400",
    category: "electronic",
    relatedImages: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
  },
  {
    id: "teddy-bear",
    name: "Oso de Peluche Gigante",
    price: 39.99,
    description: "Suave y adorable oso de peluche de 60cm. El compañero perfecto para abrazar.",
    image: "/placeholder.svg?height=400&width=400",
    category: "plush",
    relatedImages: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
  },
  {
    id: "stem-kit",
    name: "Kit STEM de Ciencias",
    price: 34.99,
    description: "Más de 50 experimentos científicos para aprender jugando. Incluye laboratorio completo.",
    image: "/placeholder.svg?height=400&width=400",
    category: "educational",
    relatedImages: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
  },
  {
    id: "racing-car",
    name: "Auto de Carreras RC",
    price: 42.99,
    description: "Carro a control remoto de alta velocidad. Alcanza hasta 30 km/h.",
    image: "/placeholder.svg?height=400&width=400",
    category: "electronic",
    relatedImages: ["/placeholder.svg?height=300&width=300", "/placeholder.svg?height=300&width=300"],
  },
]
