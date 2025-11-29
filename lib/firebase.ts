import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, getDocs, query, limit, doc, getDoc, where,
  orderBy, startAfter, Timestamp 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
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

// --- INTERFACES ---
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
  createdAt?: number; 
  updatedAt?: number;
}

// --- HELPER ---
const convertDocToProduct = (docSnapshot: any): Product => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    ...data,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
    updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
  } as Product;
};

// --- FUNCIONES OPTIMIZADAS (CACHÉ TOTAL) ---

// 1. Categorías (24h)
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const col = collection(db, 'categories');
      const snap = await getDocs(col);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (e) { console.error(e); return []; }
  },
  ['categories-list'], 
  { revalidate: 86400 } 
);

// 2. Destacados (1h)
export const getFeaturedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const col = collection(db, 'products');
      const q = query(col, limit(4)); 
      const snap = await getDocs(q);
      return snap.docs.map(convertDocToProduct);
    } catch (e) { console.error(e); return []; }
  },
  ['featured-products'], 
  { revalidate: 3600 } 
);

// 3. UN Producto (OPTIMIZADO: Ahora con Caché de 1 hora)
// Si cambias el precio en el Admin, se actualiza al instante gracias a revalidatePath.
export const getProductById = unstable_cache(
  async (id: string): Promise<Product | null> => {
    try {
      const docRef = doc(db, "products", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return convertDocToProduct(snap);
      }
      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },
  ['single-product-view'], // Tag para caché interna
  { revalidate: 3600 }     // 1 Hora de memoria
);

// 4. Categoría por ID (1h)
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
  { revalidate: 3600 }
);

// 5. Paginación (Usado para 'Load More' y Carga Inicial)
// Este no lleva caché estricta porque maneja cursores dinámicos, 
// pero al ser llamado desde páginas cacheadas, se protege solo.
export async function getPaginatedProducts(categoryId: string, lastProductId: string | null = null) {
  try {
    const col = collection(db, "products");
    let q = query(
      col, 
      where("categoryId", "==", categoryId),
      orderBy("price", "desc"), 
      limit(12)
    );

    if (lastProductId) {
      const lastDocRef = doc(db, "products", lastProductId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        q = query(q, startAfter(lastDocSnap));
      }
    }
    const snap = await getDocs(q);
    return snap.docs.map(convertDocToProduct);
  } catch (error) {
    console.error("Error en paginación:", error);
    return [];
  }
}

// 6. Relacionados (1h)
export const getProductsByCategory = unstable_cache(
  async (categoryId: string): Promise<Product[]> => {
    try {
      const col = collection(db, "products");
      const q = query(col, where("categoryId", "==", categoryId), limit(4));
      const snap = await getDocs(q);
      return snap.docs.map(convertDocToProduct);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }
  },
  ['products-by-category'],
  { revalidate: 3600 } 
);

// 7. Catálogo Completo (1h)
export const getAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const col = collection(db, 'products');
      const q = query(col, orderBy('createdAt', 'desc')); 
      const snap = await getDocs(q);
      return snap.docs.map(convertDocToProduct);
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  },
  ['all-products-catalog'],
  { revalidate: 3600 }
);