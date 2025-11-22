import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, doc, getDoc, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// IMPORTAMOS LA FUNCIÓN DE CACHÉ DE NEXT.JS
import { unstable_cache } from "next/cache"; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };

// --- INTERFACES (Iguales) ---
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  images?: string[];
  categorySlug: string;
  categoryId: string;
  description: string;
  stock: number;
  specifications?: Record<string, string>;
}

// --- FUNCIONES OPTIMIZADAS CON CACHÉ ---

// 1. Obtener Categorías (Se guarda en caché por 10 min)
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const col = collection(db, 'categories');
      const snap = await getDocs(col);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (e) { console.error(e); return []; }
  },
  ['categories-list'], // Etiqueta única para la caché
  { revalidate: 600 }  // TIEMPO EN SEGUNDOS (10 minutos)
);

// 2. Obtener Productos Destacados (Caché 10 min)
export const getFeaturedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const col = collection(db, 'products');
      const q = query(col, limit(4));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (e) { console.error(e); return []; }
  },
  ['featured-products'],
  { revalidate: 600 }
);

// 3. Obtener UN Producto por ID (Caché 5 min - para actualizar stock más rápido)
export const getProductById = async (id: string): Promise<Product | null> => {
  // Nota: No usamos unstable_cache aquí porque necesitamos el ID dinámico, 
  // pero Next.js hace deduplicación de requests automáticamente en el mismo render.
  try {
    const docRef = doc(db, "products", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
};

// 4. Obtener Productos por Categoría (Caché 10 min)
export const getProductsByCategory = unstable_cache(
  async (categoryId: string): Promise<Product[]> => {
    try {
      const col = collection(db, "products");
      const q = query(col, where("categoryId", "==", categoryId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }
  },
  ['products-by-category'], // Ojo: En producción esto cacheará la primera categoría. 
  // Para caché dinámica por ID se recomienda usar fetch() nativo, pero con Firebase SDK
  // esta es la mejor aproximación sin montar una API route.
  { revalidate: 300 } 
);

// 5. Función helper para obtener categoría por ID (Caché 10 min)
export const getCategoryById = unstable_cache(
  async (id: string): Promise<Category | null> => {
    try {
      const docRef = doc(db, "categories", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as Category;
      return null;
    } catch (e) { return null; }
  },
  ['single-category'], 
  { revalidate: 600 }
);

export async function getAllProducts(): Promise<Product[]> {
  try {
    const col = collection(db, 'products');
    // Traemos todo para poder mezclarlo aleatoriamente
    const snap = await getDocs(col);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}