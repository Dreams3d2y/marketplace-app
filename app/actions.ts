'use server'

import { getPaginatedProducts, Product } from "@/lib/firebase";
import { revalidatePath } from "next/cache"; 

// Acción para la paginación (Cargar más)
export async function loadMoreProducts(categoryId: string, lastProductId: string): Promise<Product[]> {
  const products = await getPaginatedProducts(categoryId, lastProductId);
  return JSON.parse(JSON.stringify(products));
}

// --- ACCIÓN PARA ACTUALIZAR LA TIENDA (CORREGIDA) ---
// Usamos revalidatePath('/', 'layout') que es el "Botón Nuclear": 
// Refresca TODA la caché de la web. Es lo más seguro y fácil.
export async function refreshHomeData() {
  try {
    console.log("♻️ Refrescando caché global...");
    revalidatePath('/', 'layout'); 
  } catch (error) {
    console.error("Error revalidando:", error);
  }
}